import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Building2,
  ShieldCheck,
  QrCode,
  Calendar,
  CreditCard,
  Hash,
  Sparkles,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { SubscriptionPaymentRecord } from '../../types';

interface FiscalReceiptModalProps {
  payment: SubscriptionPaymentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FiscalReceiptModal: React.FC<FiscalReceiptModalProps> = ({
  payment,
  isOpen,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0C1929] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Action Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#09131F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Official Fiscal Tax Receipt &amp; Invoice
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {payment.invoiceNumber} • {payment.fiscalReceiptNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Print official receipt"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 font-sans">
          
          {/* Header Issuer Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  SYSTEM DEVELOPER &amp; OPERATOR
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] px-2 py-0.2 rounded-full font-bold">
                  VERIFIED PAYMENT
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                QUANTUM NETWORKS LTD
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                Software Engineering &amp; Clinical Systems Architecture<br />
                Plot 14B, Innovation Tower, Kampala, Uganda<br />
                URA TIN: <strong className="font-mono">1019948201</strong> | VAT Reg: <strong className="font-mono">VAT-99214-UG</strong><br />
                Support Tel: 0200 913 555 | +256 755 091826
              </p>
            </div>

            <div className="text-right sm:self-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 justify-end font-black text-xs">
                <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>SYSTEM-MEDIATED</span>
              </div>
              <p className="text-[10px] font-mono font-bold mt-0.5">
                {payment.fiscalReceiptNumber}
              </p>
            </div>
          </div>

          {/* Bill-To and Payment Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Billed Client Pharmacy:
              </span>
              <p className="font-black text-sm text-slate-900 dark:text-slate-100">
                {payment.tenantName}
              </p>
              <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                Tenant ID: {payment.tenantId}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Package Tier: <strong className="text-emerald-600 dark:text-emerald-400">{payment.packageTier} ({payment.billingCycle})</strong>
              </p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Invoice &amp; Clearance Details:
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                Invoice No: <span className="font-mono text-cyan-600 dark:text-cyan-400">{payment.invoiceNumber}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Date Paid: {new Date(payment.paidAt).toLocaleString()}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Coverage: <span className="font-semibold">{payment.periodStart} to {payment.periodEnd}</span>
              </p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Subscription Item Description</th>
                  <th className="p-3 text-right">Cycle</th>
                  <th className="p-3 text-right">Net Subtotal (UGX)</th>
                  <th className="p-3 text-right">18% URA VAT (UGX)</th>
                  <th className="p-3 text-right">Gross Total (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      ZenithRx PMS — {payment.packageTier} Subscription
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Clinical Dispensing, Inventory AI, NDA Compliance &amp; Multi-user seats
                    </p>
                  </td>
                  <td className="p-3 text-right font-mono capitalize">{payment.billingCycle}</td>
                  <td className="p-3 text-right font-mono">{payment.netRevenueUgx.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400">
                    {payment.taxVatUgx.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    UGX {payment.grossAmountUgx.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/90 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={4} className="p-3 text-right text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Total Gross Amount Paid:
                  </td>
                  <td className="p-3 text-right text-sm font-black text-slate-900 dark:text-white font-mono">
                    UGX {payment.grossAmountUgx.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-3 py-1 text-right text-[11px] text-slate-500 font-normal">
                    USD Equivalent (@ 3,750 UGX):
                  </td>
                  <td className="px-3 py-1 text-right text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                    ${payment.amountUsdEquivalent.toFixed(2)} USD
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Method & Bank Settlement Verification */}
          <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-200 font-extrabold">
              <CreditCard className="w-4 h-4 text-cyan-600" />
              <span>Verifiable Payment Channel &amp; Ledger Allocation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Payment Channel:</span>
                <strong className="font-mono text-xs text-slate-900 dark:text-slate-100">{payment.paymentChannel}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Provider Tx Reference:</span>
                <strong className="font-mono text-xs text-cyan-700 dark:text-cyan-300">{payment.providerReference}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Ledger General Account:</span>
                <strong className="font-mono text-[10px] text-slate-800 dark:text-slate-200">{payment.accountDebitGlCode}</strong>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash & Digital Verification Seal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px]">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Quantum Networks Cryptographic Fiscal Seal</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-mono break-all text-[9px]">
                SHA-256 Hash: {payment.digitalSignatureHash}
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[10px]">
                Processed by: <strong>{payment.processedByUserName}</strong> ({payment.onboardingSource})
              </p>
            </div>

            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-1 flex items-center justify-center shrink-0 shadow-inner">
              <QrCode className="w-12 h-12 text-slate-800 dark:text-slate-200" />
            </div>
          </div>

          {/* Footer Terms */}
          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 space-y-0.5 pt-2">
            <p>This is a computer-generated tax invoice issued by Quantum Networks Ltd in accordance with the Laws of Uganda.</p>
            <p>All subscription payments must be made strictly via the system for official accounting &amp; NDA compliance auditability.</p>
          </div>

        </div>
      </div>
    </div>
  );
};
