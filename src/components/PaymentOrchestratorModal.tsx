import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  AlertTriangle,
  Lock,
  Layers,
  FileCheck
} from 'lucide-react';
import {
  PaymentIntent,
  PaymentMethodType,
  SplitPaymentAllocation,
  createPaymentIntent,
  processPaymentWebhookConfirmation
} from '../services/paymentOrchestrationService';
import { formatUGX } from '../services/formatters';

interface PaymentOrchestratorModalProps {
  totalAmountUgx: number;
  taxAmountUgx: number;
  customerName?: string;
  customerPhone?: string;
  tenantId?: string;
  tenantName?: string;
  cashierName?: string;
  receiptNumber?: string;
  onSuccess: (paymentIntent: PaymentIntent) => void;
  onClose: () => void;
}

export const PaymentOrchestratorModal: React.FC<PaymentOrchestratorModalProps> = ({
  totalAmountUgx,
  taxAmountUgx,
  customerName = 'Walk-in Customer',
  customerPhone = '+256 772 000000',
  tenantId = 'CLIENT-001',
  tenantName = 'Mulago Care Pharmacy',
  cashierName = 'David Kintu',
  receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
  onSuccess,
  onClose,
}) => {
  const [splits, setSplits] = useState<
    Array<{
      method: PaymentMethodType;
      provider: SplitPaymentAllocation['provider'];
      amountUgx: number;
      customerIdentifier: string;
      providerReference?: string;
    }>
  >([
    {
      method: 'CASH',
      provider: 'CASH_DRAWER',
      amountUgx: totalAmountUgx,
      customerIdentifier: 'Cash Register Drawer 01',
    },
  ]);

  const [processing, setProcessing] = useState(false);
  const [ussdPromptActive, setUssdPromptActive] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalAllocated = splits.reduce((acc, s) => acc + s.amountUgx, 0);
  const remainingDue = totalAmountUgx - totalAllocated;
  const isAllocationBalanced = remainingDue === 0;

  const handleAddSplitChannel = (method: PaymentMethodType) => {
    let provider: SplitPaymentAllocation['provider'] = 'CASH_DRAWER';
    let customerIdentifier = customerPhone;

    if (method === 'MTN_MOMO') {
      provider = 'MTN_UG';
    } else if (method === 'AIRTEL_MONEY') {
      provider = 'AIRTEL_UG';
    } else if (method === 'CARD_VISA_MC') {
      provider = 'PESAPAL_VISA';
      customerIdentifier = 'TOKEN-VISA-****-8819';
    } else if (method === 'INSURANCE_COPAY') {
      provider = 'JUBILEE_INSURANCE';
      customerIdentifier = 'MEM-INS-2026';
    } else if (method === 'LOYALTY_VOUCHER') {
      provider = 'ZENITH_POINTS';
      customerIdentifier = 'LOYALTY-PTS-500';
    }

    const defaultAmount = Math.max(0, remainingDue);

    setSplits((prev) => [
      ...prev,
      {
        method,
        provider,
        amountUgx: defaultAmount,
        customerIdentifier,
      },
    ]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSplitAmount = (index: number, amount: number) => {
    setSplits((prev) =>
      prev.map((s, i) => (i === index ? { ...s, amountUgx: Math.max(0, amount) } : s))
    );
  };

  const handleUpdateSplitIdentifier = (index: number, val: string) => {
    setSplits((prev) =>
      prev.map((s, i) => (i === index ? { ...s, customerIdentifier: val } : s))
    );
  };

  const handleExecutePayment = async () => {
    if (!isAllocationBalanced) {
      setError(`Split allocation incomplete. Remaining balance to allocate: UGX ${remainingDue.toLocaleString()}`);
      return;
    }

    setError(null);
    setProcessing(true);

    const idempotencyKey = `IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const result = await createPaymentIntent({
      idempotencyKey,
      tenantId,
      tenantName,
      receiptNumber,
      patientName: customerName,
      grossAmountUgx: totalAmountUgx,
      taxAmountUgx,
      splits: splits.map((s) => ({
        method: s.method,
        provider: s.provider,
        amountUgx: s.amountUgx,
        customerIdentifier: s.customerIdentifier,
        providerReference: s.providerReference || `REF-${Math.floor(1000000 + Math.random() * 9000000)}`,
      })),
      initiatedBy: cashierName,
      notes: `Orchestrated ${splits.length}-channel payment for ${receiptNumber}.`,
    });

    if (!result.success || !result.paymentIntent) {
      setProcessing(false);
      setError(result.error || 'Payment execution failed.');
      return;
    }

    const createdIntent = result.paymentIntent;

    // Check if there are telecom mobile money splits requiring USSD prompt
    const momoSplit = createdIntent.splits.find((s) => s.method === 'MTN_MOMO' || s.method === 'AIRTEL_MONEY');

    if (momoSplit) {
      setUssdPromptActive(momoSplit.method === 'MTN_MOMO' ? 'MTN MoMo (*165# Push)' : 'Airtel Money (*185# Push)');
      setStatusMessage(`USSD payment authorization prompt pushed to ${momoSplit.customerIdentifier || customerPhone}...`);

      setTimeout(async () => {
        const mockTxId = `TX-${momoSplit.method === 'MTN_MOMO' ? 'MTN' : 'AIR'}-${Math.floor(10000000 + Math.random() * 90000000)}`;
        await processPaymentWebhookConfirmation(
          createdIntent.id,
          momoSplit.id,
          mockTxId,
          'hmac_sha256_mock_sig_991823'
        );
        setUssdPromptActive(null);
        setStatusMessage('Mobile Money PIN approved! Webhook verified with provider.');

        setTimeout(() => {
          setProcessing(false);
          onSuccess(createdIntent);
        }, 800);
      }, 2000);
    } else {
      setTimeout(() => {
        setProcessing(false);
        onSuccess(createdIntent);
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E3ECE8] rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 text-[#263B33]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E3ECE8] bg-[#F8FBFA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E8F7F0] border border-[#20A66A]/20 rounded-2xl text-[#20A66A]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#263B33]">
                  Payment Subsystem &amp; Split Orchestrator
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2F80C9] border border-blue-200">
                  §11.18 Compliant
                </span>
              </div>
              <p className="text-xs text-[#5E7A70]">
                Multi-channel settlement, idempotency protection &amp; webhook reconciliation for {tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-[#F0F5F3] text-[#5E7A70] hover:text-[#263B33] border border-[#E3ECE8] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Banner */}
        <div className="bg-[#F5FAF8] p-5 border-b border-[#E3ECE8] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#5E7A70] block font-mono">RECEIPT: {receiptNumber}</span>
            <span className="text-sm font-semibold text-[#263B33] mt-0.5 block">
              Customer: <strong className="text-[#263B33]">{customerName}</strong> ({customerPhone})
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#5E7A70] block uppercase tracking-wider font-semibold">Total Payable</span>
            <span className="text-2xl font-black text-[#20A66A]">{formatUGX(totalAmountUgx)}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#D64545] rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {ussdPromptActive && (
            <div className="p-4 bg-blue-50 border border-blue-200 text-[#2F80C9] rounded-2xl text-xs space-y-2 animate-pulse">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Smartphone className="w-5 h-5 text-[#2F80C9]" />
                <span>Simulating Live USSD Prompt: {ussdPromptActive}</span>
              </div>
              <p className="text-[#263B33]">
                {statusMessage}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#5E7A70] font-mono">
                <Clock className="w-3.5 h-3.5" /> Awaiting customer PIN entry on mobile phone...
              </div>
            </div>
          )}

          {/* Split Payment Channels List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#263B33] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#20A66A]" /> Payment Split Channels
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isAllocationBalanced
                  ? 'bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/30'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {isAllocationBalanced ? 'Allocated 100%' : `Balance to Allocate: UGX ${remainingDue.toLocaleString()}`}
              </span>
            </div>

            {splits.map((split, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#F8FBFA] rounded-2xl border border-[#E3ECE8] space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {split.method === 'CASH' && <Banknote className="w-4 h-4 text-[#20A66A]" />}
                    {split.method === 'MTN_MOMO' && <Smartphone className="w-4 h-4 text-amber-600" />}
                    {split.method === 'AIRTEL_MONEY' && <Smartphone className="w-4 h-4 text-red-600" />}
                    {split.method === 'CARD_VISA_MC' && <CreditCard className="w-4 h-4 text-blue-600" />}
                    {split.method === 'INSURANCE_COPAY' && <ShieldCheck className="w-4 h-4 text-[#2F80C9]" />}
                    {split.method === 'LOYALTY_VOUCHER' && <FileCheck className="w-4 h-4 text-teal-600" />}
                    <span className="text-xs font-bold text-[#263B33]">{split.method.replace(/_/g, ' ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-[10px] text-[#5E7A70] font-bold">UGX</span>
                      <input
                        type="number"
                        value={split.amountUgx}
                        onChange={(e) => handleUpdateSplitAmount(idx, Number(e.target.value))}
                        className="pl-10 pr-2 py-1 w-36 bg-white border border-[#E3ECE8] rounded-xl text-xs font-bold text-[#20A66A] text-right focus:outline-none focus:ring-1 focus:ring-[#20A66A]"
                      />
                    </div>
                    {splits.length > 1 && (
                      <button
                        onClick={() => handleRemoveSplit(idx)}
                        className="p-1 text-[#87A196] hover:text-[#D64545] transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#5E7A70] text-[11px] whitespace-nowrap">Identifier / Account:</span>
                  <input
                    type="text"
                    value={split.customerIdentifier}
                    onChange={(e) => handleUpdateSplitIdentifier(idx, e.target.value)}
                    placeholder="Phone number, card token, or member ID"
                    className="w-full px-2.5 py-1 bg-white border border-[#E3ECE8] rounded-lg text-xs text-[#263B33] font-mono focus:outline-none focus:border-[#20A66A]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Channel Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#5E7A70] uppercase tracking-wider block">
              Add Split Payment Method
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleAddSplitChannel('MTN_MOMO')}
                className="p-2 rounded-xl bg-white hover:bg-[#F8FBFA] border border-[#E3ECE8] text-[#263B33] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span>+ MTN MoMo</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('AIRTEL_MONEY')}
                className="p-2 rounded-xl bg-white hover:bg-[#F8FBFA] border border-[#E3ECE8] text-[#263B33] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-red-600" />
                <span>+ Airtel Money</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('CARD_VISA_MC')}
                className="p-2 rounded-xl bg-white hover:bg-[#F8FBFA] border border-[#E3ECE8] text-[#263B33] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Visa / MC</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('INSURANCE_COPAY')}
                className="p-2 rounded-xl bg-white hover:bg-[#F8FBFA] border border-[#E3ECE8] text-[#263B33] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2F80C9]" />
                <span>+ Insurance Co-pay</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('LOYALTY_VOUCHER')}
                className="p-2 rounded-xl bg-white hover:bg-[#F8FBFA] border border-[#E3ECE8] text-[#263B33] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>+ Loyalty Voucher</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('CASH')}
                className="p-2 rounded-xl bg-white hover:bg-[#F8FBFA] border border-[#E3ECE8] text-[#263B33] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Banknote className="w-3.5 h-3.5 text-[#20A66A]" />
                <span>+ Cash Drawer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E3ECE8] bg-[#F8FBFA] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#5E7A70]">
            <Lock className="w-3.5 h-3.5 text-[#20A66A]" />
            <span>256-Bit Idempotent Settlement</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 bg-white hover:bg-[#F0F5F3] text-[#263B33] border border-[#E3ECE8] text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleExecutePayment}
              disabled={processing || !isAllocationBalanced}
              className="px-5 py-2 bg-[#20A66A] hover:bg-[#1E9760] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Authorizing Settlement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize &amp; Settle (UGX {totalAllocated.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PaymentOrchestratorModal;
