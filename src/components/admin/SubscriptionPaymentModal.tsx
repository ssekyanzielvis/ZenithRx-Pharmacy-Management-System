import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Phone,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  Landmark,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import {
  ClientSubscription,
  SubscriptionPaymentChannel,
  BillingCycle,
  TierName,
  SubscriptionPaymentRecord,
} from '../../types';
import { processSubscriptionPayment } from '../../services/subscriptionAccountingService';

interface SubscriptionPaymentModalProps {
  client: ClientSubscription;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentRecord: SubscriptionPaymentRecord) => void;
}

export const SubscriptionPaymentModal: React.FC<SubscriptionPaymentModalProps> = ({
  client,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [paymentChannel, setPaymentChannel] = useState<SubscriptionPaymentChannel>('MTN_MOMO');
  const [phoneNumberOrAccount, setPhoneNumberOrAccount] = useState(client.contactPhone || '+256 7');
  const [referenceCode, setReferenceCode] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate prices based on client monthly rate
  const monthlyRate = client.monthlyUgxRate || 350000;
  const grossAmount =
    billingCycle === 'yearly'
      ? Math.round(monthlyRate * 12 * 0.85) // 15% annual discount
      : monthlyRate;

  // 18% inclusive URA VAT
  const vatAmount = Math.round((grossAmount / 1.18) * 0.18);
  const netRevenue = grossAmount - vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // Simulate real-time payment gateway handshake
      await new Promise((resolve) => setTimeout(resolve, 900));

      const generatedRef =
        referenceCode.trim() ||
        (paymentChannel === 'MTN_MOMO'
          ? `MTN-TX-${Math.floor(10000000 + Math.random() * 90000000)}`
          : paymentChannel === 'AIRTEL_MONEY'
          ? `AM-TX-${Math.floor(10000000 + Math.random() * 90000000)}`
          : paymentChannel === 'PESAPAL_VISA_MC'
          ? `PESA-ORD-${Math.floor(100000 + Math.random() * 900000)}`
          : `EFT-BNK-${Math.floor(1000000 + Math.random() * 9000000)}`);

      const record = await processSubscriptionPayment({
        tenantId: client.id,
        tenantName: client.clientName,
        packageTier: client.packageTier,
        billingCycle,
        grossAmountUgx: grossAmount,
        paymentChannel,
        providerReference: generatedRef,
        paymentPhoneOrAccount: phoneNumberOrAccount,
        onboardingSource: 'ADMIN_PANEL_SYSTEM',
        processedByUserId: 'QNT-ADMIN-01',
        processedByUserName: 'Quantum Networks Systems Administrator',
        notes: adminNotes || `System-processed ${billingCycle} subscription payment for ${client.clientName}.`,
      });

      onPaymentSuccess(record);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing failed. Please verify provider connectivity.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0D1A2A] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0A1522] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Process System Subscription Payment
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                100% System-Mediated Accounting &amp; Fiscal Invoicing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-900 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Pharmacy Target Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-600" />
                <span className="font-extrabold text-sm">{client.clientName}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tier: <strong className="text-slate-800 dark:text-slate-200">{client.packageTier}</strong> • {client.location}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Current Status</span>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{client.billingStatus}</p>
            </div>
          </div>

          {/* Billing Cycle Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Billing Frequency Cycle
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-900 dark:text-cyan-200'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="font-bold text-xs">Monthly Subscription</p>
                <p className="text-[11px] font-mono mt-0.5">UGX {monthlyRate.toLocaleString()} / mo</p>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  billingCycle === 'yearly'
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-900 dark:text-cyan-200'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="absolute -top-2 right-2 bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.2 rounded-full">
                  SAVE 15%
                </span>
                <p className="font-bold text-xs">Annual (12 Months)</p>
                <p className="text-[11px] font-mono mt-0.5">UGX {(monthlyRate * 12 * 0.85).toLocaleString()} / yr</p>
              </button>
            </div>
          </div>

          {/* Payment Method / Channel Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Official Payment Gateway Channel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'MTN_MOMO' as SubscriptionPaymentChannel, label: 'MTN MoMo', icon: Smartphone, color: 'text-amber-500' },
                { id: 'AIRTEL_MONEY' as SubscriptionPaymentChannel, label: 'Airtel Money', icon: Smartphone, color: 'text-red-500' },
                { id: 'PESAPAL_VISA_MC' as SubscriptionPaymentChannel, label: 'Visa / MC', icon: CreditCard, color: 'text-blue-500' },
                { id: 'BANK_EFT_STANBIC' as SubscriptionPaymentChannel, label: 'Stanbic Bank', icon: Landmark, color: 'text-sky-500' },
              ].map((ch) => {
                const isSel = paymentChannel === ch.id;
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setPaymentChannel(ch.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSel
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-900 dark:text-cyan-100 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${ch.color}`} />
                    <span className="text-[11px]">{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Channel Specific Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Payer Phone / Account Number *
              </label>
              <input
                type="text"
                required
                value={phoneNumberOrAccount}
                onChange={(e) => setPhoneNumberOrAccount(e.target.value)}
                placeholder="+256 77X XXX XXX"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Provider Transaction Ref (Optional)
              </label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Fee & Tax Breakdown Summary */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>SaaS Net Service Value:</span>
              <span className="font-mono">UGX {netRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>18% URA VAT (Inclusive):</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">UGX {vatAmount.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-black text-sm text-slate-900 dark:text-white">
              <span>Gross Payable:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400">
                UGX {grossAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Initiating Gateway Handshake...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Process &amp; Issue Fiscal Receipt</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
