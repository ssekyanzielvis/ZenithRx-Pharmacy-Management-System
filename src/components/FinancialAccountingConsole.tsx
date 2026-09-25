import React, { useState, useMemo } from 'react';
import {
  CashDrawerSession,
  OperatingExpense,
  DailyChannelReconciliation,
  PharmacyProfitabilityStatement,
  FinancialAccountingKPIs,
  OpExCategoryType,
} from '../types/v2Types';
import {
  getActiveCashSession,
  getAllCashSessions,
  openCashDrawerSession,
  recordPettyCashMovement,
  closeCashDrawerSession,
  getAllOperatingExpenses,
  recordOperatingExpense,
  approveOperatingExpense,
  settleOperatingExpense,
  getAllDailyReconciliations,
  performDailyChannelReconciliation,
  getPharmacyProfitabilityStatement,
  getFinancialAccountingKPIs,
  generateFinancialAuditDossierText,
  exportPnLToCsv,
  OPEX_CATEGORY_LABELS,
} from '../services/financialAccountingService';
import { formatUGX } from '../services/formatters';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Scale,
  CreditCard,
  Building2,
  Calendar,
  ShieldCheck,
  Printer,
  Download,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Banknote,
  FileSpreadsheet,
  Layers,
  Sparkles,
  PieChart,
  BarChart3,
  Check,
  X,
  Lock,
  ChevronRight,
  FileCheck,
} from 'lucide-react';

interface FinancialAccountingConsoleProps {
  tenantId?: string;
  pharmacyName?: string;
  currentUserName?: string;
  currentUserRole?: string;
}

export const FinancialAccountingConsole: React.FC<FinancialAccountingConsoleProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'ZenithRx Central Pharmacy',
  currentUserName = 'Pharm. Elvis Ssekyanzi',
  currentUserRole = 'Supervising Pharmacist',
}) => {
  const [activeTab, setActiveTab] = useState<'pnl_statement' | 'cash_management' | 'opex_ledger' | 'channel_reconciliation'>('pnl_statement');

  // Live state
  const [cashSessions, setCashSessions] = useState<CashDrawerSession[]>(() => getAllCashSessions(tenantId));
  const [activeSession, setActiveSession] = useState<CashDrawerSession>(() => getActiveCashSession(tenantId));
  const [expenses, setExpenses] = useState<OperatingExpense[]>(() => getAllOperatingExpenses(tenantId));
  const [reconciliations, setReconciliations] = useState<DailyChannelReconciliation[]>(() => getAllDailyReconciliations(tenantId));

  const [pnlStatement, setPnlStatement] = useState<PharmacyProfitabilityStatement>(() => getPharmacyProfitabilityStatement());
  const [kpis, setKpis] = useState<FinancialAccountingKPIs>(() => getFinancialAccountingKPIs());

  // Search & Filter States
  const [opexFilterCategory, setOpexFilterCategory] = useState<string>('all');
  const [opexSearchQuery, setOpexSearchQuery] = useState<string>('');

  // Modals
  const [activeModal, setActiveModal] = useState<
    null | 'new_expense' | 'petty_cash_payout' | 'close_till' | 'open_till' | 'daily_recon' | 'view_financial_report'
  >(null);

  // Form states
  // New Expense Form
  const [expCategory, setExpCategory] = useState<OpExCategoryType>('utilities_electricity_water_internet');
  const [expTitle, setExpTitle] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expBillRef, setExpBillRef] = useState('');
  const [expGrossAmount, setExpGrossAmount] = useState<number>(500000);
  const [expTaxWht, setExpTaxWht] = useState<number>(0);
  const [expPaymentMethod, setExpPaymentMethod] = useState('Bank Wire / EFT');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expNotes, setExpNotes] = useState('');

  // Petty Cash Form
  const [pettyType, setPettyType] = useState<'cash_expense_payout' | 'bank_deposit_drop' | 'float_replenishment'>('cash_expense_payout');
  const [pettyCategory, setPettyCategory] = useState('Packaging & Dispensary Supplies');
  const [pettyAmount, setPettyAmount] = useState<number>(35000);
  const [pettyPayee, setPettyPayee] = useState('');
  const [pettyJustification, setPettyJustification] = useState('');

  // Close Till Form
  const [actualCountedCash, setActualCountedCash] = useState<number>(activeSession.expectedClosingCashUgx || 260000);
  const [tillVarianceExplanation, setTillVarianceExplanation] = useState('');
  const [tillSupervisorNotes, setTillSupervisorNotes] = useState('');

  // Daily Recon Form
  const [reconDate, setReconDate] = useState(new Date().toISOString().slice(0, 10));
  const [reconSystemGross, setReconSystemGross] = useState<number>(5000000);
  const [reconMomo, setReconMomo] = useState<number>(2000000);
  const [reconCard, setReconCard] = useState<number>(1200000);
  const [reconCash, setReconCash] = useState<number>(1500000);
  const [reconCredit, setReconCredit] = useState<number>(100000);
  const [reconInsurance, setReconInsurance] = useState<number>(200000);

  // Filtered OpEx
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCategory = opexFilterCategory === 'all' || e.category === opexFilterCategory;
      const matchesSearch =
        e.expenseTitle.toLowerCase().includes(opexSearchQuery.toLowerCase()) ||
        e.vendorOrPayee.toLowerCase().includes(opexSearchQuery.toLowerCase()) ||
        e.expenseVoucherNo.toLowerCase().includes(opexSearchQuery.toLowerCase()) ||
        (e.invoiceOrBillRef && e.invoiceOrBillRef.toLowerCase().includes(opexSearchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [expenses, opexFilterCategory, opexSearchQuery]);

  // Handlers
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expVendor || expGrossAmount <= 0) return;

    const netPayable = expGrossAmount - expTaxWht;
    recordOperatingExpense({
      tenantId,
      category: expCategory,
      expenseTitle: expTitle,
      vendorOrPayee: expVendor,
      invoiceOrBillRef: expBillRef || undefined,
      grossAmountUgx: expGrossAmount,
      taxWithheldWhtUgx: expTaxWht,
      netPayableUgx: netPayable,
      paymentMethod: expPaymentMethod,
      expenseDate: expDate,
      accountingNotes: expNotes || undefined,
    });

    setExpenses(getAllOperatingExpenses(tenantId));
    setPnlStatement(getPharmacyProfitabilityStatement());
    setKpis(getFinancialAccountingKPIs());
    setActiveModal(null);
    setExpTitle('');
    setExpVendor('');
  };

  const handleApproveExpense = (id: string) => {
    approveOperatingExpense(id, currentUserName);
    setExpenses(getAllOperatingExpenses(tenantId));
    setKpis(getFinancialAccountingKPIs());
  };

  const handleSettleExpense = (id: string) => {
    settleOperatingExpense(id, `PAY-TX-${Math.floor(100000 + Math.random() * 900000)}`, 'Settled via banking channel');
    setExpenses(getAllOperatingExpenses(tenantId));
    setKpis(getFinancialAccountingKPIs());
  };

  const handleRecordPettyCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (pettyAmount <= 0 || !pettyJustification) return;

    const updatedSession = recordPettyCashMovement(activeSession.id, {
      movementType: pettyType,
      category: pettyCategory,
      amountUgx: pettyAmount,
      payeeOrRecipient: pettyPayee || 'Local Supplier',
      justification: pettyJustification,
      authorizedByName: currentUserName,
    });

    setCashSessions(getAllCashSessions(tenantId));
    setActiveSession(updatedSession);
    setActiveModal(null);
    setPettyJustification('');
    setPettyPayee('');
  };

  const handleCloseTillSession = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = closeCashDrawerSession(
      activeSession.id,
      actualCountedCash,
      currentUserName,
      currentUserRole,
      tillVarianceExplanation,
      tillSupervisorNotes
    );

    setCashSessions(getAllCashSessions(tenantId));
    setActiveSession(updated);
    setKpis(getFinancialAccountingKPIs());
    setActiveModal(null);
  };

  const handleRunDailyRecon = (e: React.FormEvent) => {
    e.preventDefault();
    performDailyChannelReconciliation({
      reconciliationDate: reconDate,
      systemRecordedGrossSalesUgx: reconSystemGross,
      gatewayMomoSettledUgx: reconMomo,
      gatewayCardSettledUgx: reconCard,
      cashDrawerCountedUgx: reconCash,
      patientCreditReceivablesUgx: reconCredit,
      insuranceClaimsReceivablesUgx: reconInsurance,
      reconciledByName: currentUserName,
    });

    setReconciliations(getAllDailyReconciliations(tenantId));
    setActiveModal(null);
  };

  const handleDownloadCsv = () => {
    const csv = exportPnLToCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ZenithRx_Financial_PnL_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Financial Controls &amp; Accounting
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Statutory P&amp;L, COGS, Cash Drawer &amp; OpEx Ledger
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Financial &amp; Accounting Controls
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time cash drawer balancing, operating expense governance, channel cross-reconciliation, and COGS gross/net profitability statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export P&amp;L CSV</span>
          </button>
          <button
            onClick={() => setActiveModal('view_financial_report')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
          >
            <Printer className="w-4 h-4" />
            <span>Statutory Audit Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Cockpit */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Net Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
            {formatUGX(kpis.totalNetRevenueMonthToDateUgx)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Month-to-Date Net</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">COGS (Batch Cost)</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
            {formatUGX(kpis.totalCogsMonthToDateUgx)}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold">Acquisition Value</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Gross Margin</span>
            <PieChart className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-xl font-black text-cyan-600 mt-1">
            {kpis.grossMarginPercent}%
          </p>
          <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
            {formatUGX(kpis.grossProfitMonthToDateUgx)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Total OpEx</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
            {formatUGX(kpis.totalOpexMonthToDateUgx)}
          </p>
          <span className="text-[11px] text-rose-600 font-semibold">Operating Overheads</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Net Profit (EBITDA)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-black text-emerald-600 mt-1 truncate">
            {formatUGX(kpis.netOperatingProfitUgx)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {kpis.netMarginPercent}% Net Margin
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Till Cash Variance</span>
            <Banknote className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
            {kpis.activeCashDrawerVarianceUgx === 0
              ? 'UGX 0 (Exact)'
              : formatUGX(kpis.activeCashDrawerVarianceUgx)}
          </p>
          <span
            className={`text-[11px] font-bold ${
              kpis.activeCashDrawerVarianceUgx === 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {kpis.activeCashDrawerVarianceUgx === 0 ? 'Balanced Session' : 'Variance Detected'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'pnl_statement', label: '1. Profit & Loss (P&L) Statement', icon: BarChart3 },
          { id: 'cash_management', label: '2. Cash Drawer & Till Balancing', icon: Banknote },
          { id: 'opex_ledger', label: '3. Operating Expenses (OpEx) Ledger', icon: Receipt },
          { id: 'channel_reconciliation', label: '4. Multi-Channel Daily Cross-Recon', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFIT & LOSS (P&L) STATEMENT */}
      {activeTab === 'pnl_statement' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Statement Breakdown (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Trading &amp; Operating Statement
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {pnlStatement.periodLabel}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {pnlStatement.startDate} to {pnlStatement.endDate}
              </span>
            </div>

            {/* Trading Account Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  1. Revenue from Dispensing &amp; Sales
                </span>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Gross Pharmacy Sales:</span>
                  <span className="font-mono font-bold">{formatUGX(pnlStatement.grossRevenueUgx)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Less: Patient &amp; Loyalty Discounts:</span>
                  <span className="font-mono font-bold">-{formatUGX(pnlStatement.discountsGrantedUgx)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                  <span>NET REVENUE:</span>
                  <span className="font-mono text-emerald-600">{formatUGX(pnlStatement.netRevenueUgx)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  2. Cost of Goods Sold (COGS) &amp; Gross Margin
                </span>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Pharmaceutical COGS (FEFO Batch Acquisition):</span>
                  <span className="font-mono font-bold text-amber-600">
                    -{formatUGX(pnlStatement.costOfGoodsSoldCogsUgx)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                  <span>GROSS PROFIT:</span>
                  <span className="font-mono text-cyan-600">
                    {formatUGX(pnlStatement.grossProfitUgx)} ({pnlStatement.grossProfitMarginPercent}%)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  3. Total Operating Expenses (OpEx)
                </span>
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {pnlStatement.operatingExpensesByCategory.map((cat, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[280px]">{cat.categoryLabel}:</span>
                      <span className="font-mono">{formatUGX(cat.totalUgx)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-rose-600">
                  <span>TOTAL OPERATING EXPENSES (OpEx):</span>
                  <span className="font-mono">-{formatUGX(pnlStatement.totalOperatingExpensesUgx)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white font-mono space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-emerald-400">NET OPERATING PROFIT (EBITDA):</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatUGX(pnlStatement.netOperatingProfitEbitdaUgx)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Net Profit Margin: <strong>{pnlStatement.netProfitMarginPercent}%</strong> of Net Dispensing Revenue.
                </p>
              </div>
            </div>
          </div>

          {/* OpEx Expense Structure Chart & Budgeting (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              OpEx Cost Structure
            </h3>

            <div className="space-y-3 text-xs">
              {pnlStatement.operatingExpensesByCategory.map((cat, idx) => {
                const percentOfOpex =
                  pnlStatement.totalOperatingExpensesUgx > 0
                    ? Math.round((cat.totalUgx / pnlStatement.totalOperatingExpensesUgx) * 100)
                    : 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {cat.categoryLabel}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatUGX(cat.totalUgx)} ({percentOfOpex}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percentOfOpex}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASH MANAGEMENT & TILL BALANCING */}
      {activeTab === 'cash_management' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Till Balancing Cockpit (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Active Drawer Session
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {activeSession.tillIdentifier} ({activeSession.sessionNumber})
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                  activeSession.status === 'open'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {activeSession.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Formulaic Breakdown: Opening + Inflows - Refunds - Expenses - Drops = Expected */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>(+) Opening Cash Float:</span>
                <span className="font-bold">{formatUGX(activeSession.openingCashFloatUgx)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>(+) Cash Sales Inflow:</span>
                <span className="font-bold">+{formatUGX(activeSession.cashSalesInUgx)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>(-) Cash Refunds Outflow:</span>
                <span className="font-bold">-{formatUGX(activeSession.cashRefundsOutUgx)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>(-) Cash Expenses / Petty Payouts:</span>
                <span className="font-bold">-{formatUGX(activeSession.cashExpensesOutUgx)}</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>(-) Safe Withdrawals / Bank Drops:</span>
                <span className="font-bold">-{formatUGX(activeSession.cashWithdrawalsBankDropsUgx)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-slate-100">
                <span>(=) CALCULATED EXPECTED CLOSING CASH:</span>
                <span className="text-emerald-600">{formatUGX(activeSession.expectedClosingCashUgx)}</span>
              </div>
            </div>

            {/* Till Action Triggers */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveModal('petty_cash_payout')}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Record Petty Cash Movement</span>
              </button>

              <button
                onClick={() => {
                  setActualCountedCash(activeSession.expectedClosingCashUgx);
                  setActiveModal('close_till');
                }}
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Close &amp; Balance Drawer Session</span>
              </button>
            </div>
          </div>

          {/* Past Shift Session Audit History (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Till Session Audit History
            </h3>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {cashSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {session.sessionNumber}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        session.status === 'balanced_and_reconciled'
                          ? 'bg-emerald-100 text-emerald-800'
                          : session.status === 'open'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {session.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Cashier: <strong>{session.cashierName}</strong> • Opened:{' '}
                    {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex justify-between text-[11px] font-mono pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>Expected: {formatUGX(session.expectedClosingCashUgx)}</span>
                    <span className="font-bold text-emerald-600">
                      Count: {session.actualCountedCashUgx !== undefined ? formatUGX(session.actualCountedCashUgx) : 'Open'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATING EXPENSES (OpEx) LEDGER */}
      {activeTab === 'opex_ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Operating Expense (OpEx) Master Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Log, approve, and track pharmacy overheads with statutory WHT (6%) withholding tax compliance.
              </p>
            </div>

            <button
              onClick={() => setActiveModal('new_expense')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Operating Expense</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search expense title, payee, voucher..."
                value={opexSearchQuery}
                onChange={(e) => setOpexSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <select
              value={opexFilterCategory}
              onChange={(e) => setOpexFilterCategory(e.target.value)}
              className="p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
            >
              <option value="all">All OpEx Categories</option>
              {Object.entries(OPEX_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Expense Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category &amp; Title</th>
                  <th className="py-2.5 px-3">Payee / Vendor</th>
                  <th className="py-2.5 px-3">Gross Amount</th>
                  <th className="py-2.5 px-3">WHT (6%)</th>
                  <th className="py-2.5 px-3">Net Payable</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {exp.expenseVoucherNo}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{exp.expenseDate}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{exp.expenseTitle}</span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        {OPEX_CATEGORY_LABELS[exp.category]}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">{exp.vendorOrPayee}</td>
                    <td className="py-3 px-3 font-mono">{formatUGX(exp.grossAmountUgx)}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {exp.taxWithheldWhtUgx > 0 ? `-${formatUGX(exp.taxWithheldWhtUgx)}` : 'UGX 0'}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-slate-900 dark:text-slate-100">
                      {formatUGX(exp.netPayableUgx)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          exp.status === 'paid_and_settled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : exp.status === 'approved_for_payment'
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exp.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {exp.status === 'pending_approval' && (
                        <button
                          onClick={() => handleApproveExpense(exp.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {exp.status === 'approved_for_payment' && (
                        <button
                          onClick={() => handleSettleExpense(exp.id)}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          Settle &amp; Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-CHANNEL DAILY RECONCILIATION */}
      {activeTab === 'channel_reconciliation' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                Multi-Channel Cross-Reconciliation
              </h3>
              <p className="text-xs text-slate-500">
                Daily 3-way balance: System POS Sales = Gateway Settlements (MoMo/Card) + Cash Count + Receivables.
              </p>
            </div>

            <button
              onClick={() => setActiveModal('daily_recon')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Perform Daily Reconciliation</span>
            </button>
          </div>

          <div className="space-y-3">
            {reconciliations.map((recon) => (
              <div
                key={recon.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-slate-100 font-mono">
                      Reconciliation Date: {recon.reconciliationDate}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        recon.reconciliationStatus === 'balanced'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {recon.reconciliationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Audited by: <strong>{recon.reconciledByName}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">1. System Gross</span>
                    <span className="font-bold">{formatUGX(recon.systemRecordedGrossSalesUgx)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">2. MoMo Gateway</span>
                    <span className="font-bold">{formatUGX(recon.gatewayMomoSettledUgx)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">3. Card Terminal</span>
                    <span className="font-bold">{formatUGX(recon.gatewayCardSettledUgx)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">4. Counted Cash</span>
                    <span className="font-bold">{formatUGX(recon.cashDrawerCountedUgx)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">5. Receivables</span>
                    <span className="font-bold">
                      {formatUGX(recon.patientCreditReceivablesUgx + recon.insuranceClaimsReceivablesUgx)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  <strong>Reconciliation Result:</strong> {recon.varianceNarrative}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Log Operating Expense */}
      {activeModal === 'new_expense' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Log Operating Expense (OpEx)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  OpEx Category *
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  {Object.entries(OPEX_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Title / Purpose *
                </label>
                <input
                  required
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Umeme Commercial Electricity Bill"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Payee *
                  </label>
                  <input
                    required
                    type="text"
                    value={expVendor}
                    onChange={(e) => setExpVendor(e.target.value)}
                    placeholder="e.g. Umeme Uganda Ltd"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice / Receipt Ref
                  </label>
                  <input
                    type="text"
                    value={expBillRef}
                    onChange={(e) => setExpBillRef(e.target.value)}
                    placeholder="e.g. BILL-9921"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gross Amount (UGX) *
                  </label>
                  <input
                    required
                    type="number"
                    min={1000}
                    step={1000}
                    value={expGrossAmount}
                    onChange={(e) => setExpGrossAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Withholding Tax (WHT 6%)
                  </label>
                  <input
                    type="number"
                    value={expTaxWht}
                    onChange={(e) => setExpTaxWht(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">Net Payable:</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  {formatUGX(expGrossAmount - expTaxWht)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Submit Expense for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Petty Cash Movement */}
      {activeModal === 'petty_cash_payout' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Petty Cash / Till Movement
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPettyCash} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Movement Type
                </label>
                <select
                  value={pettyType}
                  onChange={(e) => setPettyType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="cash_expense_payout">Cash Expense Payout (Packaging, Supplies, Food)</option>
                  <option value="bank_deposit_drop">Mid-day Safe / Bank Deposit Drop</option>
                  <option value="float_replenishment">Cash Float Replenishment</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (UGX) *
                </label>
                <input
                  required
                  type="number"
                  step={1000}
                  value={pettyAmount}
                  onChange={(e) => setPettyAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payee / Recipient
                </label>
                <input
                  type="text"
                  value={pettyPayee}
                  onChange={(e) => setPettyPayee(e.target.value)}
                  placeholder="e.g. Courier Rider, Packaging Vendor"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Justification / Receipt Ref *
                </label>
                <textarea
                  required
                  rows={2}
                  value={pettyJustification}
                  onChange={(e) => setPettyJustification(e.target.value)}
                  placeholder="e.g. Purchased 200 plastic dispensing carrier bags..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Close & Balance Till Session */}
      {activeModal === 'close_till' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Close &amp; Balance Drawer Session
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseTillSession} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Calculated Expected Cash:</span>
                  <span className="font-bold">{formatUGX(activeSession.expectedClosingCashUgx)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Physical Cash Counted (UGX) *
                </label>
                <input
                  required
                  type="number"
                  value={actualCountedCash}
                  onChange={(e) => setActualCountedCash(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                />
              </div>

              <div className="p-3 rounded-xl border flex items-center justify-between font-bold bg-slate-50 dark:bg-slate-800">
                <span>Calculated Variance:</span>
                <span
                  className={`font-mono ${
                    actualCountedCash - activeSession.expectedClosingCashUgx === 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {formatUGX(actualCountedCash - activeSession.expectedClosingCashUgx)}
                </span>
              </div>

              {actualCountedCash !== activeSession.expectedClosingCashUgx && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Variance Explanation *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={tillVarianceExplanation}
                    onChange={(e) => setTillVarianceExplanation(e.target.value)}
                    placeholder="Provide reason for overage / shortage..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={tillSupervisorNotes}
                  onChange={(e) => setTillSupervisorNotes(e.target.value)}
                  placeholder="Supervisor sign-off notes..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Audit &amp; Balance Drawer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Perform Daily Channel Reconciliation */}
      {activeModal === 'daily_recon' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                Daily Multi-Channel Cross-Reconciliation
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunDailyRecon} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reconciliation Date
                </label>
                <input
                  type="date"
                  value={reconDate}
                  onChange={(e) => setReconDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. System Recorded Gross POS Sales (UGX) *
                </label>
                <input
                  required
                  type="number"
                  value={reconSystemGross}
                  onChange={(e) => setReconSystemGross(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. MoMo Gateway Total
                  </label>
                  <input
                    type="number"
                    value={reconMomo}
                    onChange={(e) => setReconMomo(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Card Terminal Total
                  </label>
                  <input
                    type="number"
                    value={reconCard}
                    onChange={(e) => setReconCard(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4. Counted Cash Drawer
                  </label>
                  <input
                    type="number"
                    value={reconCash}
                    onChange={(e) => setReconCash(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    5. Credit &amp; Insurance
                  </label>
                  <input
                    type="number"
                    value={reconCredit + reconInsurance}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setReconCredit(Math.round(val * 0.4));
                      setReconInsurance(Math.round(val * 0.6));
                    }}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Save Reconciliation Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: View Financial Audit Dossier */}
      {activeModal === 'view_financial_report' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                Statutory Financial Statement — {pnlStatement.periodLabel}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] p-4 bg-slate-900 text-slate-100 rounded-xl whitespace-pre-wrap leading-relaxed">
              {generateFinancialAuditDossierText(pnlStatement)}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
