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
  Sparkles
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
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> SETTLED
          </span>
        );
      case 'CAPTURED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> CAPTURED
          </span>
        );
      case 'AUTHORIZED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 animate-spin" /> AUTHORIZED
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
            PARTIAL
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5" /> REFUNDED
          </span>
        );
      case 'VOIDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <Ban className="w-2.5 h-2.5" /> VOIDED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            {state}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Notification Toast */}
      {actionNotification && (
        <div className="p-3 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B1E36] via-[#102C50] to-[#0D223E] rounded-3xl p-6 text-white shadow-xl border border-[#1E3B63] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              FINANCIAL SUBSYSTEM §11.18
            </span>
            <span className="bg-sky-500/20 text-sky-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Idempotent Ledger Active
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Payments, Billing Integrity &amp; Settlement Reconciliation
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Multi-channel payment orchestration, webhook confirmation, split allocations, bank statement reconciliation, and supervisor refund controls for {tenantName}.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 self-start md:self-auto transition border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gross Billed</span>
          <span className="text-xl font-black text-white">{formatUGX(totalGrossRevenue)}</span>
          <span className="text-[10px] text-slate-500 block">{ledger.length} Payment Intents</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Total Captured</span>
          <span className="text-xl font-black text-emerald-400">{formatUGX(totalCapturedRevenue)}</span>
          <span className="text-[10px] text-emerald-500/80 block">All payment channels</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">Bank / MoMo Settled</span>
          <span className="text-xl font-black text-sky-400">{formatUGX(totalSettledRevenue)}</span>
          <span className="text-[10px] text-sky-500/80 block">{reconciliationReport.reconciledCount} Verified Settlements</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Telecom / Card Fees</span>
          <span className="text-xl font-black text-amber-400">{formatUGX(totalFeesIncurred)}</span>
          <span className="text-[10px] text-amber-500/80 block">Gateway processing cost</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Discrepancies</span>
          <span className="text-xl font-black text-purple-400">{reconciliationReport.discrepancies.length} Flagged</span>
          <span className="text-[10px] text-purple-500/80 block">Auto-detected variances</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'ledger'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Immutable Payment Ledger ({ledger.length})
        </button>

        <button
          onClick={() => setActiveTab('settlement')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'settlement'
              ? 'border-sky-500 text-sky-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Bank &amp; MoMo Settlement Statements ({settlementStatements.length})
        </button>

        <button
          onClick={() => setActiveTab('discrepancies')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'discrepancies'
              ? 'border-purple-500 text-purple-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Automated Mismatch &amp; Variance Engine ({reconciliationReport.discrepancies.length})
        </button>
      </div>

      {/* Tab 1: Payment Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search payment ID, receipt#, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
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
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Payment Intent</th>
                    <th className="p-4">Receipt &amp; Patient</th>
                    <th className="p-4">Gross Payable</th>
                    <th className="p-4">Captured / Bal</th>
                    <th className="p-4">Split Channels</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLedger.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <span className="font-mono font-bold text-white block">{payment.id}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Idem: {payment.idempotencyKey.slice(0, 14)}...
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-slate-200 block">{payment.receiptNumber || 'N/A'}</span>
                        <span className="text-[11px] text-slate-400 block">{payment.patientName || 'Walk-in'}</span>
                        <span className="text-[10px] text-slate-500 block">By: {payment.initiatedBy}</span>
                      </td>

                      <td className="p-4 font-bold text-slate-200">
                        {formatUGX(payment.grossAmountUgx)}
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-emerald-400 block">
                          {formatUGX(payment.totalCapturedUgx)}
                        </span>
                        {payment.balanceDueUgx > 0 && (
                          <span className="text-[10px] text-amber-400 block">
                            Bal: {formatUGX(payment.balanceDueUgx)}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {payment.splits.map((split) => (
                            <span
                              key={split.id}
                              className="px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
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
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/20 transition"
                                title="Issue Supervisor-Authorized Refund"
                              >
                                Refund
                              </button>
                              <button
                                onClick={() => handleOpenSupervisorAction(payment, 'VOID')}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold border border-slate-700 transition"
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
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">External Telecom &amp; Bank Settlement Feeds</h4>
              <p className="text-xs text-slate-400">
                Direct API reconciliation with MTN Open API, Airtel Money, and Pesapal Merchant Settled Batches.
              </p>
            </div>
            <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl text-xs font-bold font-mono">
              BATCH-2026-0805-A
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settlementStatements.map((stmt, idx) => (
              <div
                key={idx}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 font-mono flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" /> {stmt.providerTxId}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {stmt.channel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Gross Settled</span>
                    <strong className="text-white font-bold">{formatUGX(stmt.settledAmountUgx)}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Telecom Fee</span>
                    <strong className="text-amber-400 font-bold">{formatUGX(stmt.feeUgx)}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Net Payout</span>
                    <strong className="text-emerald-400 font-bold">{formatUGX(stmt.netSettledUgx)}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>Settled At: {new Date(stmt.settledAt).toLocaleTimeString()}</span>
                  <span className="text-[10px] text-slate-500">{stmt.rawPayloadHash.slice(0, 18)}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Discrepancies & Variance Engine */}
      {activeTab === 'discrepancies' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              Automated Mismatch &amp; Exception Reporting (§11.18 Financial Controls)
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Real-time audit comparing point-of-sale receipts against telecom aggregator balances and uncaptured webhooks.
            </p>
          </div>

          {reconciliationReport.discrepancies.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h5 className="text-sm font-bold text-white">Zero Reconciliation Discrepancies Detected</h5>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All POS transactions perfectly match provider settlements, cash drawer counts, and insurance co-pay clearinghouse logs.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reconciliationReport.discrepancies.map((disc, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-900 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 font-mono">
                        {disc.type}
                      </span>
                      <span className="text-xs font-bold text-white">
                        Ref: {disc.providerTxId || disc.paymentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Expected: <strong>{formatUGX(disc.expectedAmountUgx)}</strong> | Settled: <strong>{formatUGX(disc.settledAmountUgx)}</strong> (Variance: {formatUGX(disc.varianceUgx)})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Action: {disc.recommendedAction}
                    </p>
                  </div>

                  <button className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition self-start md:self-center">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Elevated Supervisor Authorization: {actionType}</span>
              </div>
              <button
                onClick={() => setSelectedPaymentForAction(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <p className="text-slate-400">
                Target Payment: <strong className="text-slate-200">{selectedPaymentForAction.id}</strong>
              </p>
              <p className="text-slate-400">
                Receipt: <strong className="text-slate-200">{selectedPaymentForAction.receiptNumber || 'POS'}</strong>
              </p>
              <p className="text-slate-400">
                Captured Amount: <strong className="text-emerald-400">{formatUGX(selectedPaymentForAction.totalCapturedUgx)}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Reason for {actionType} (Mandatory for Audit Trail)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer returned damaged seal / billing error"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Supervisor Security PIN (e.g. 1234)
                </label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  maxLength={6}
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-rose-500 text-center text-base"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPaymentForAction(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSupervisorAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
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
