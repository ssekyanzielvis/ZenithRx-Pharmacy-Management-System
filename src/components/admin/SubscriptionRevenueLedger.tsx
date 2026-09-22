import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Landmark,
  PlusCircle,
  Eye,
  RefreshCw,
  QrCode,
  BadgeCheck,
  Layers,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import {
  ClientSubscription,
  SubscriptionPaymentRecord,
  GeneralLedgerJournalEntry,
  PlatformRevenueSummary,
} from '../../types';
import {
  getAllSubscriptionPayments,
  getPlatformRevenueSummary,
  getGeneralLedgerJournal,
} from '../../services/subscriptionAccountingService';
import { FiscalReceiptModal } from './FiscalReceiptModal';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';

interface SubscriptionRevenueLedgerProps {
  clients: ClientSubscription[];
  onUpdateClients?: (updated: ClientSubscription[]) => void;
}

export const SubscriptionRevenueLedger: React.FC<SubscriptionRevenueLedgerProps> = ({
  clients,
  onUpdateClients,
}) => {
  const [activeSubView, setActiveSubView] = useState<'transactions' | 'ledgerJournal' | 'clearingAccounts'>('transactions');
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>(() => getAllSubscriptionPayments());
  const [summary, setSummary] = useState<PlatformRevenueSummary>(() => getPlatformRevenueSummary());
  const [glEntries, setGlEntries] = useState<GeneralLedgerJournalEntry[]>(() => getGeneralLedgerJournal());

  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');

  // Modals state
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<SubscriptionPaymentRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [clientForPayment, setClientForPayment] = useState<ClientSubscription | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const refreshData = () => {
    setPayments(getAllSubscriptionPayments());
    setSummary(getPlatformRevenueSummary());
    setGlEntries(getGeneralLedgerJournal());
  };

  const handlePaymentSuccess = (newPayment: SubscriptionPaymentRecord) => {
    refreshData();
    setSelectedPaymentForReceipt(newPayment);
    setIsReceiptModalOpen(true);

    // If client context was provided, update their billing status in clients list
    if (onUpdateClients) {
      const updated = clients.map((c) =>
        c.id === newPayment.tenantId
          ? {
              ...c,
              billingStatus: 'Active' as const,
              nextBillingDate: newPayment.periodEnd,
            }
          : c
      );
      onUpdateClients(updated);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.providerReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.packageTier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = channelFilter === 'ALL' || p.paymentChannel === channelFilter;

    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#081526] via-[#0E243F] to-[#0A1A2E] p-6 rounded-3xl border border-cyan-500/30 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              QUANTUM NETWORKS FINANCIAL LEDGER
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/40">
              <ShieldCheck className="w-3 h-3" />
              100% System-Mediated Books
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            SaaS Subscription Revenue &amp; Bookkeeping
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Every subscription payment made by client pharmacies is tracked, accounted for, and reconciled through the system. Enforces URA 18% VAT allocation, double-entry General Ledger bookkeeping, and instant fiscal receipt generation.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:self-center shrink-0">
          <button
            onClick={() => {
              if (clients.length > 0) {
                setClientForPayment(clients[0]);
                setIsPaymentModalOpen(true);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Process New Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross ARR */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1A2A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Gross ARR (Annual Run Rate)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              UGX {summary.grossArrUgx.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              MRR: <strong className="font-mono text-emerald-600 dark:text-emerald-400">UGX {summary.grossMrrUgx.toLocaleString()}</strong> / month
            </p>
          </div>
        </div>

        {/* Net SaaS YTD Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1A2A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Net Recognized Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              UGX {summary.netSaaSYtdUgx.toLocaleString()}
            </p>
            <p className="text-[11px] text-cyan-700 dark:text-cyan-400 mt-0.5 font-medium">
              Net of 18% URA statutory VAT
            </p>
          </div>
        </div>

        {/* URA 18% Output VAT Collected */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1A2A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">URA Output VAT (18%)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              UGX {summary.totalVatCollectedUgx.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              EFRIS Tax Register Allocation
            </p>
          </div>
        </div>

        {/* System Compliance Score */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1A2A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Accounting Integrity</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {summary.systemComplianceRatePercent}% System
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {summary.activePaidTenantsCount} Paid Pharmacy Clients
            </p>
          </div>
        </div>
      </div>

      {/* Gateway Settlement Balances Strip */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 block">MTN MoMo Settlement:</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              UGX {summary.mtnMomoClearingBalanceUgx.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-red-500 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 block">Airtel Money Corporate:</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              UGX {summary.airtelMoneyClearingBalanceUgx.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Landmark className="w-4 h-4 text-sky-500 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 block">Bank EFT Direct (Stanbic/Centenary):</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              UGX {summary.bankSettlementBalanceUgx.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 block">PesaPal Card Gateway:</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              UGX {summary.pesapalGatewayBalanceUgx.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubView('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'transactions'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription Invoices &amp; Receipts ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubView('ledgerJournal')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'ledgerJournal'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Double-Entry General Ledger ({glEntries.length} entries)</span>
          </button>
        </div>

        <button
          onClick={refreshData}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
          title="Refresh Financial Ledger"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* VIEW 1: TRANSACTIONS & FISCAL RECEIPTS */}
      {activeSubView === 'transactions' && (
        <div className="bg-white dark:bg-[#0D1A2A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by pharmacy, invoice no, or MoMo reference..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="ALL">All Payment Channels</option>
                <option value="MTN_MOMO">MTN Mobile Money</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                <option value="BANK_EFT_STANBIC">Stanbic Bank EFT</option>
                <option value="BANK_EFT_CENTENARY">Centenary Bank</option>
                <option value="PESAPAL_VISA_MC">PesaPal Visa/MC</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Invoice &amp; Date</th>
                  <th className="p-3">Client Pharmacy</th>
                  <th className="p-3">Plan Tier</th>
                  <th className="p-3">Payment Channel &amp; Reference</th>
                  <th className="p-3 text-right">Net Value</th>
                  <th className="p-3 text-right">18% VAT</th>
                  <th className="p-3 text-right">Gross Total</th>
                  <th className="p-3 text-center">Fiscal Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{p.invoiceNumber}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.paidAt).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="p-3">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.tenantName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{p.tenantId}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{p.packageTier}</span>
                      <span className="text-[10px] text-slate-500 block capitalize">{p.billingCycle}</span>
                    </td>

                    <td className="p-3">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {p.paymentChannel}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                        Ref: {p.providerReference}
                      </p>
                    </td>

                    <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      UGX {p.netRevenueUgx.toLocaleString()}
                    </td>

                    <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400">
                      UGX {p.taxVatUgx.toLocaleString()}
                    </td>

                    <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                      UGX {p.grossAmountUgx.toLocaleString()}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedPaymentForReceipt(p);
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-bold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="View & print official URA fiscal tax receipt"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DOUBLE-ENTRY GENERAL LEDGER (GL) */}
      {activeSubView === 'ledgerJournal' && (
        <div className="bg-white dark:bg-[#0D1A2A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-600" />
                Double-Entry General Ledger Journal
              </h3>
              <p className="text-[11px] text-slate-500">
                Audited debit &amp; credit allocations for SaaS Revenue (4010), URA VAT (2150), and Gateway Clearing Assets (1010-1030).
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
              Balanced: Total Debits == Total Credits
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Ref Invoice</th>
                  <th className="p-3">Account Code &amp; Title</th>
                  <th className="p-3">Journal Entry Description</th>
                  <th className="p-3 text-right">Debit (UGX)</th>
                  <th className="p-3 text-right">Credit (UGX)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {glEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-500">{e.entryDate}</td>
                    <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">{e.referenceNumber}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{e.accountCode}</span>
                      <span className="text-slate-500 text-[11px] block font-sans">{e.accountName}</span>
                    </td>
                    <td className="p-3 font-sans text-slate-700 dark:text-slate-300">
                      {e.description}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {e.debitUgx > 0 ? e.debitUgx.toLocaleString() : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-400">
                      {e.creditUgx > 0 ? e.creditUgx.toLocaleString() : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ✓ Reconciled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <FiscalReceiptModal
        payment={selectedPaymentForReceipt}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedPaymentForReceipt(null);
        }}
      />

      {clientForPayment && (
        <SubscriptionPaymentModal
          client={clientForPayment}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setClientForPayment(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
