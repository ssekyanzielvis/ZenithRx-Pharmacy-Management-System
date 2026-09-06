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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Payment Subsystem &amp; Split Orchestrator
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  §11.18 Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-channel settlement, idempotency protection &amp; webhook reconciliation for {tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Banner */}
        <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-mono">RECEIPT: {receiptNumber}</span>
            <span className="text-sm font-semibold text-slate-200 mt-0.5 block">
              Customer: <strong className="text-white">{customerName}</strong> ({customerPhone})
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Total Payable</span>
            <span className="text-2xl font-black text-emerald-400">{formatUGX(totalAmountUgx)}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {ussdPromptActive && (
            <div className="p-4 bg-sky-500/10 border border-sky-500/30 text-sky-300 rounded-2xl text-xs space-y-2 animate-pulse">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <span>Simulating Live USSD Prompt: {ussdPromptActive}</span>
              </div>
              <p className="text-slate-300">
                {statusMessage}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" /> Awaiting customer PIN entry on mobile phone...
              </div>
            </div>
          )}

          {/* Split Payment Channels List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" /> Payment Split Channels
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isAllocationBalanced
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isAllocationBalanced ? 'Allocated 100%' : `Balance to Allocate: UGX ${remainingDue.toLocaleString()}`}
              </span>
            </div>

            {splits.map((split, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {split.method === 'CASH' && <Banknote className="w-4 h-4 text-emerald-400" />}
                    {split.method === 'MTN_MOMO' && <Smartphone className="w-4 h-4 text-amber-400" />}
                    {split.method === 'AIRTEL_MONEY' && <Smartphone className="w-4 h-4 text-red-400" />}
                    {split.method === 'CARD_VISA_MC' && <CreditCard className="w-4 h-4 text-purple-400" />}
                    {split.method === 'INSURANCE_COPAY' && <ShieldCheck className="w-4 h-4 text-sky-400" />}
                    {split.method === 'LOYALTY_VOUCHER' && <FileCheck className="w-4 h-4 text-teal-400" />}
                    <span className="text-xs font-bold text-white">{split.method.replace(/_/g, ' ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-400 font-bold">UGX</span>
                      <input
                        type="number"
                        value={split.amountUgx}
                        onChange={(e) => handleUpdateSplitAmount(idx, Number(e.target.value))}
                        className="pl-10 pr-2 py-1 w-36 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {splits.length > 1 && (
                      <button
                        onClick={() => handleRemoveSplit(idx)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px] whitespace-nowrap">Identifier / Account:</span>
                  <input
                    type="text"
                    value={split.customerIdentifier}
                    onChange={(e) => handleUpdateSplitIdentifier(idx, e.target.value)}
                    placeholder="Phone number, card token, or member ID"
                    className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Channel Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Add Split Payment Method
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleAddSplitChannel('MTN_MOMO')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>+ MTN MoMo</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('AIRTEL_MONEY')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-red-400" />
                <span>+ Airtel Money</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('CARD_VISA_MC')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
              >
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Visa / MC</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('INSURANCE_COPAY')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>+ Insurance Co-pay</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('LOYALTY_VOUCHER')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
              >
                <FileCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>+ Loyalty Voucher</span>
              </button>

              <button
                onClick={() => handleAddSplitChannel('CASH')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Cash Drawer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit Idempotent Settlement</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              onClick={handleExecutePayment}
              disabled={processing || !isAllocationBalanced}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-900/30"
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
