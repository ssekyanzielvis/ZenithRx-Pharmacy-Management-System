import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Receipt,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Lock,
  KeyRound,
  RotateCcw,
  Ban,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import {
  PaymentIntent,
  PaymentMethodType,
  PaymentState,
  ReconciliationDiscrepancy,
  SettlementStatementItem,
  getPaymentLedger,
  executeSupervisorRefundOrVoid,
  performSettlementReconciliation
} from '../services/paymentOrchestrationService';
import { formatUGX } from '../services/formatters';

interface FinancialReconciliationViewProps {
  tenantId?: string;
  tenantName?: string;
}

export const FinancialReconciliationView: React.FC<FinancialReconciliationViewProps> = ({
  tenantId = 'CLIENT-001',
  tenantName = 'Mulago Care Pharmacy',
}) => {
  const [ledger, setLedger] = useState<PaymentIntent[]>([]);
  const [activeTab, setActiveTab] = useState<'ledger' | 'settlement' | 'discrepancies'>('ledger');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [filterState, setFilterState] = useState<string>('ALL');

  // Supervisor Action Modal State
  const [selectedPaymentForAction, setSelectedPaymentForAction] = useState<PaymentIntent | null>(null);
  const [actionType, setActionType] = useState<'REFUND' | 'VOID'>('REFUND');
  const [supervisorPin, setSupervisorPin] = useState<string>('');
  const [actionReason, setActionReason] = useState<string>('');
  const [actionNotification, setActionNotification] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Settlement Statements Data
  const [settlementStatements, setSettlementStatements] = useState<SettlementStatementItem[]>([
    {
      providerTxId: 'MTN-TX-8912831',
      channel: 'MTN_MOMO',
      settledAmountUgx: 17000,
      feeUgx: 350,
      netSettledUgx: 16650,
      settledAt: '2026-08-05T09:15:00Z',
      rawPayloadHash: 'sha256_mtn_payload_88192312',
    },
    {
      providerTxId: 'PESA-TX-990182',
      channel: 'CARD_VISA_MC',
      settledAmountUgx: 115000,
      feeUgx: 2875,
      netSettledUgx: 112125,
      settledAt: '2026-08-05T12:00:00Z',
      rawPayloadHash: 'sha256_pesa_payload_7718910',
    },
  ]);

  const loadData = async () => {
    setLoading(true);
    const data = await getPaymentLedger(tenantId);
    setLedger(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const reconciliationReport = performSettlementReconciliation(ledger, settlementStatements);

  // Filtered Ledger
  const filteredLedger = ledger.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.id.toLowerCase().includes(q) ||
      (item.receiptNumber && item.receiptNumber.toLowerCase().includes(q)) ||
      (item.patientName && item.patientName.toLowerCase().includes(q)) ||
      item.initiatedBy.toLowerCase().includes(q);

    const matchesState = filterState === 'ALL' || item.state === filterState;

    const matchesChannel =
      filterChannel === 'ALL' || item.splits.some((s) => s.method === filterChannel);

    return matchesSearch && matchesState && matchesChannel;
  });

  // Financial KPI Calculations
  const totalGrossRevenue = ledger.reduce((acc, p) => acc + p.grossAmountUgx, 0);
  const totalCapturedRevenue = ledger.reduce((acc, p) => acc + p.totalCapturedUgx, 0);
  const totalSettledRevenue = reconciliationReport.totalSettledUgx;
  const totalFeesIncurred = reconciliationReport.totalFeesUgx;
  const totalOutstandingBalance = ledger.reduce((acc, p) => acc + p.balanceDueUgx, 0);

  const handleOpenSupervisorAction = (payment: PaymentIntent, type: 'REFUND' | 'VOID') => {
    setSelectedPaymentForAction(payment);
    setActionType(type);
    setSupervisorPin('');
    setActionReason('');
    setActionError(null);
  };

  const handleExecuteSupervisorAction = async () => {
    if (!selectedPaymentForAction) return;
    if (!supervisorPin) {
      setActionError('Supervisor PIN required.');
      return;
    }
    if (!actionReason) {
      setActionError('Reason for action is mandatory for audit logging.');
      return;
    }

    const result = await executeSupervisorRefundOrVoid({
      paymentId: selectedPaymentForAction.id,
      actionType,
      supervisorPin,
      supervisorName: 'Pharm. Moses Musoke',
      reason: actionReason,
    });

    if (result.success) {
      setActionNotification(result.message);
      setSelectedPaymentForAction(null);
      await loadData();
      setTimeout(() => setActionNotification(null), 3500);
    } else {
      setActionError(result.message);
    }
  };

  const renderStateBadge = (state: PaymentState) => {
    switch (state) {
      case 'SETTLED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> SETTLED
          </span>
        );
      case 'CAPTURED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> CAPTURED
          </span>
        );
      case 'AUTHORIZED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 animate-spin" /> AUTHORIZED
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            PARTIAL
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5" /> REFUNDED
          </span>
        );
      case 'VOIDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
            <Ban className="w-2.5 h-2.5" /> VOIDED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {state}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Notification Toast */}
      {actionNotification && (
        <div className="p-3 bg-[#20A66A] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 text-[#263B33] shadow-xs border border-[#E3ECE8] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              FINANCIAL SUBSYSTEM §11.18
            </span>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Idempotent Ledger Active
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#263B33] tracking-tight flex items-center gap-2">
            Payments, Billing Integrity &amp; Settlement Reconciliation
          </h2>
          <p className="text-xs text-[#5E7A70] max-w-2xl mt-1 leading-relaxed">
            Multi-channel payment orchestration, webhook confirmation, split allocations, bank statement reconciliation, and supervisor refund controls for {tenantName}.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-[#F8FBFA] hover:bg-[#EEF5F2] text-[#263B33] text-xs font-semibold flex items-center gap-2 self-start md:self-auto transition border border-[#E3ECE8] shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 text-[#5E7A70] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white border border-[#E3ECE8] rounded-2xl space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[#5E7A70] uppercase tracking-wider block">Gross Billed</span>
          <span className="text-xl font-bold text-[#263B33]">{formatUGX(totalGrossRevenue)}</span>
          <span className="text-[10px] text-[#5E7A70] block">{ledger.length} Payment Intents</span>
        </div>

        <div className="p-4 bg-white border border-[#E3ECE8] rounded-2xl space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Captured</span>
          <span className="text-xl font-bold text-emerald-700">{formatUGX(totalCapturedRevenue)}</span>
          <span className="text-[10px] text-emerald-600 block">All payment channels</span>
        </div>

        <div className="p-4 bg-white border border-[#E3ECE8] rounded-2xl space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Bank / MoMo Settled</span>
          <span className="text-xl font-bold text-blue-700">{formatUGX(totalSettledRevenue)}</span>
          <span className="text-[10px] text-blue-600 block">{reconciliationReport.reconciledCount} Verified Settlements</span>
        </div>

        <div className="p-4 bg-white border border-[#E3ECE8] rounded-2xl space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Telecom / Card Fees</span>
          <span className="text-xl font-bold text-amber-700">{formatUGX(totalFeesIncurred)}</span>
          <span className="text-[10px] text-amber-600 block">Gateway processing cost</span>
        </div>

        <div className="p-4 bg-white border border-[#E3ECE8] rounded-2xl space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Discrepancies</span>
          <span className="text-xl font-bold text-purple-700">{reconciliationReport.discrepancies.length} Flagged</span>
          <span className="text-[10px] text-purple-600 block">Auto-detected variances</span>
        </div>
      </div>

      {/* Financial Reconciliation Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            id: 'ledger',
            title: 'Immutable Payment Ledger',
            desc: 'Real-time cryptographic audit trail of all cash, MoMo, card, and credit payments.',
            icon: <Receipt className="w-5 h-5" />,
            badge: `${ledger.length} Entries`,
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          },
          {
            id: 'settlement',
            title: 'Bank & MoMo Settlement Statements',
            desc: 'Aggregated external payout files from Stanbic, MTN MoMo, Airtel, and Centenary.',
            icon: <FileCheck className="w-5 h-5" />,
            badge: `${settlementStatements.length} Statements`,
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          },
          {
            id: 'discrepancies',
            title: 'Automated Mismatch & Variance Engine',
            desc: 'AI-assisted discrepancy detector flagging uncollected amounts, timing lags, and fee cuts.',
            icon: <AlertTriangle className="w-5 h-5" />,
            badge: reconciliationReport.discrepancies.length > 0 ? `${reconciliationReport.discrepancies.length} Flagged` : '0 Variance',
            badgeColor: reconciliationReport.discrepancies.length > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' : 'bg-slate-100 text-slate-600 border-slate-200',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                isActive
                  ? 'bg-emerald-50/70 text-[#263B33] border-2 border-[#20A66A] shadow-xs'
                  : 'bg-white text-[#263B33] hover:bg-[#F8FBFA] border-[#E3ECE8] shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-[#F8FBFA] text-[#5E7A70] border border-[#E3ECE8]'}`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                </div>
                <h3 className={`text-xs font-bold tracking-tight ${isActive ? 'text-emerald-950' : 'text-[#263B33]'}`}>
                  {tab.title}
                </h3>
                <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isActive ? 'text-emerald-900' : 'text-[#5E7A70]'}`}>
                  {tab.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E3ECE8] flex items-center justify-between text-[10px]">
                <span className={isActive ? 'text-emerald-700 font-bold' : 'text-[#5E7A70] font-medium'}>
                  {isActive ? 'Active Ledger View' : 'Inspect Ledger'}
                </span>
                <span className={isActive ? 'text-emerald-700 font-bold' : 'text-[#5E7A70]'}>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Payment Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3ECE8] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
              <input
                type="text"
                placeholder="Search payment ID, receipt#, customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:ring-2 focus:ring-[#20A66A] placeholder-[#5E7A70]/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E7A70] hover:text-[#263B33] p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="px-3 py-2 text-xs bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:ring-2 focus:ring-[#20A66A] font-medium cursor-pointer"
              >
                <option value="ALL">All States</option>
                <option value="SETTLED">Settled</option>
                <option value="CAPTURED">Captured</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="REFUNDED">Refunded</option>
                <option value="VOIDED">Voided</option>
              </select>

              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="px-3 py-2 text-xs bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:ring-2 focus:ring-[#20A66A] font-medium cursor-pointer"
              >
                <option value="ALL">All Channels</option>
                <option value="CASH">Cash Drawer</option>
                <option value="MTN_MOMO">MTN MoMo</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                <option value="CARD_VISA_MC">Visa / MasterCard</option>
                <option value="INSURANCE_COPAY">Insurance Co-pay</option>
                <option value="LOYALTY_VOUCHER">Loyalty Points</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-[#E3ECE8] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#263B33]">
                <thead className="bg-[#F8FBFA] text-[#5E7A70] uppercase text-[10px] tracking-wider border-b border-[#E3ECE8]">
                  <tr>
                    <th className="p-4 font-bold">Payment Intent</th>
                    <th className="p-4 font-bold">Receipt &amp; Patient</th>
                    <th className="p-4 font-bold">Gross Payable</th>
                    <th className="p-4 font-bold">Captured / Bal</th>
                    <th className="p-4 font-bold">Split Channels</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3ECE8]">
                  {filteredLedger.map((payment) => (
                    <tr key={payment.id} className="hover:bg-[#F8FBFA] transition">
                      <td className="p-4">
                        <span className="font-mono font-bold text-[#263B33] block">{payment.id}</span>
                        <span className="text-[10px] text-[#5E7A70] font-mono block">
                          Idem: {payment.idempotencyKey.slice(0, 14)}...
                        </span>
                        <span className="text-[10px] text-[#5E7A70] block mt-0.5">
                          {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-[#263B33] block">{payment.receiptNumber || 'N/A'}</span>
                        <span className="text-[11px] text-[#5E7A70] block">{payment.patientName || 'Walk-in'}</span>
                        <span className="text-[10px] text-[#5E7A70]/80 block">By: {payment.initiatedBy}</span>
                      </td>

                      <td className="p-4 font-bold text-[#263B33]">
                        {formatUGX(payment.grossAmountUgx)}
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-emerald-700 block">
                          {formatUGX(payment.totalCapturedUgx)}
                        </span>
                        {payment.balanceDueUgx > 0 && (
                          <span className="text-[10px] text-amber-700 font-semibold block">
                            Bal: {formatUGX(payment.balanceDueUgx)}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {payment.splits.map((split) => (
                            <span
                              key={split.id}
                              className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#F8FBFA] text-[#263B33] border border-[#E3ECE8]"
                              title={`${split.provider}: ${formatUGX(split.amountUgx)} (${split.status})`}
                            >
                              {split.method.replace(/_/g, ' ')}: {formatUGX(split.amountUgx)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        {renderStateBadge(payment.state)}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {payment.state !== 'VOIDED' && payment.state !== 'REFUNDED' && (
                            <>
                              <button
                                onClick={() => handleOpenSupervisorAction(payment, 'REFUND')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 transition"
                                title="Issue Supervisor-Authorized Refund"
                              >
                                Refund
                              </button>
                              <button
                                onClick={() => handleOpenSupervisorAction(payment, 'VOID')}
                                className="px-2.5 py-1 rounded-lg bg-[#F8FBFA] hover:bg-slate-100 text-[#5E7A70] text-[10px] font-bold border border-[#E3ECE8] transition"
                                title="Void incorrect billing entry"
                              >
                                Void
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Settlement Statements */}
      {activeTab === 'settlement' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#E3ECE8] rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#263B33]">External Telecom &amp; Bank Settlement Feeds</h4>
              <p className="text-xs text-[#5E7A70]">
                Direct API reconciliation with MTN Open API, Airtel Money, and Pesapal Merchant Settled Batches.
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold font-mono">
              BATCH-2026-0805-A
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settlementStatements.map((stmt, idx) => (
              <div
                key={idx}
                className="p-5 bg-white border border-[#E3ECE8] rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 font-mono flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue-600" /> {stmt.providerTxId}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F8FBFA] text-[#263B33] border border-[#E3ECE8]">
                    {stmt.channel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-[#F8FBFA] rounded-xl border border-[#E3ECE8]">
                    <span className="text-[10px] text-[#5E7A70] block">Gross Settled</span>
                    <strong className="text-[#263B33] font-bold">{formatUGX(stmt.settledAmountUgx)}</strong>
                  </div>
                  <div className="p-2.5 bg-[#F8FBFA] rounded-xl border border-[#E3ECE8]">
                    <span className="text-[10px] text-[#5E7A70] block">Telecom Fee</span>
                    <strong className="text-amber-700 font-bold">{formatUGX(stmt.feeUgx)}</strong>
                  </div>
                  <div className="p-2.5 bg-[#F8FBFA] rounded-xl border border-[#E3ECE8]">
                    <span className="text-[10px] text-[#5E7A70] block">Net Payout</span>
                    <strong className="text-emerald-700 font-bold">{formatUGX(stmt.netSettledUgx)}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#5E7A70] font-mono pt-1">
                  <span>Settled At: {new Date(stmt.settledAt).toLocaleTimeString()}</span>
                  <span className="text-[10px] text-[#5E7A70]/70">{stmt.rawPayloadHash.slice(0, 18)}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Discrepancies & Variance Engine */}
      {activeTab === 'discrepancies' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#E3ECE8] rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              Automated Mismatch &amp; Exception Reporting (§11.18 Financial Controls)
            </h4>
            <p className="text-xs text-[#5E7A70] mt-1">
              Real-time audit comparing point-of-sale receipts against telecom aggregator balances and uncaptured webhooks.
            </p>
          </div>

          {reconciliationReport.discrepancies.length === 0 ? (
            <div className="p-8 bg-white border border-[#E3ECE8] rounded-2xl shadow-xs text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#20A66A] mx-auto" />
              <h5 className="text-sm font-bold text-[#263B33]">Zero Reconciliation Discrepancies Detected</h5>
              <p className="text-xs text-[#5E7A70] max-w-md mx-auto">
                All POS transactions perfectly match provider settlements, cash drawer counts, and insurance co-pay clearinghouse logs.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reconciliationReport.discrepancies.map((disc, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white border border-purple-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                        {disc.type}
                      </span>
                      <span className="text-xs font-bold text-[#263B33]">
                        Ref: {disc.providerTxId || disc.paymentId}
                      </span>
                    </div>
                    <p className="text-xs text-[#263B33]">
                      Expected: <strong>{formatUGX(disc.expectedAmountUgx)}</strong> | Settled: <strong>{formatUGX(disc.settledAmountUgx)}</strong> (Variance: {formatUGX(disc.varianceUgx)})
                    </p>
                    <p className="text-[11px] text-[#5E7A70]">
                      Action: {disc.recommendedAction}
                    </p>
                  </div>

                  <button className="px-3.5 py-1.5 bg-[#20A66A] hover:bg-[#1B8E5A] text-white text-xs font-bold rounded-xl transition shadow-xs self-start md:self-center">
                    Resolve Mismatch
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Supervisor PIN Authorization Modal for Refund/Void */}
      {selectedPaymentForAction && (
        <div className="fixed inset-0 z-50 bg-[#0B1E36]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3ECE8] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E3ECE8] pb-3">
              <div className="flex items-center gap-2 text-[#263B33] font-bold text-sm">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Elevated Supervisor Authorization: {actionType}</span>
              </div>
              <button
                onClick={() => setSelectedPaymentForAction(null)}
                className="text-[#5E7A70] hover:text-[#263B33]"
              >
                &times;
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <p className="text-[#5E7A70]">
                Target Payment: <strong className="text-[#263B33]">{selectedPaymentForAction.id}</strong>
              </p>
              <p className="text-[#5E7A70]">
                Receipt: <strong className="text-[#263B33]">{selectedPaymentForAction.receiptNumber || 'POS'}</strong>
              </p>
              <p className="text-[#5E7A70]">
                Captured Amount: <strong className="text-emerald-700">{formatUGX(selectedPaymentForAction.totalCapturedUgx)}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#263B33] uppercase tracking-wider mb-1">
                  Reason for {actionType} (Mandatory for Audit Trail)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer returned damaged seal / billing error"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-xs text-[#263B33] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#263B33] uppercase tracking-wider mb-1">
                  Supervisor Security PIN (e.g. 1234)
                </label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  maxLength={6}
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-xs text-[#263B33] font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-rose-500 text-center text-base"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPaymentForAction(null)}
                className="px-4 py-2 bg-[#F8FBFA] hover:bg-slate-100 text-[#5E7A70] text-xs font-bold rounded-xl transition border border-[#E3ECE8]"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSupervisorAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm {actionType}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FinancialReconciliationView;
