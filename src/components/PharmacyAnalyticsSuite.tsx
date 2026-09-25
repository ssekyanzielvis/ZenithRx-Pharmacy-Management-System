import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Calendar,
  CreditCard,
  Package,
  Activity,
  Receipt,
  Search,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Stethoscope,
  Lock,
  Boxes,
  Truck,
  FileCheck,
  AlertOctagon,
  RefreshCw,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  advancedAnalyticsService,
  AnalyticsTimeRange,
  PharmacyOperationalKPIs,
  InventoryAnalyticsReport,
  ClinicalAnalyticsReport,
} from '../services/advancedAnalyticsService';
import { formatUGX } from '../services/formatters';

interface PharmacyAnalyticsSuiteProps {
  tenantId?: string;
  onNavigateTab?: (tab: string, payload?: any) => void;
}

export const PharmacyAnalyticsSuite: React.FC<PharmacyAnalyticsSuiteProps> = ({
  tenantId = 'client-001',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'inventory' | 'clinical'>('cockpit');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('today');
  const [inventoryVelocityFilter, setInventoryVelocityFilter] = useState<'all' | 'fast' | 'slow' | 'dead' | 'overstock'>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const operationalKPIs = advancedAnalyticsService.getOperationalKPIs(timeRange);
  const inventoryReport = advancedAnalyticsService.getInventoryAnalytics();
  const clinicalReport = advancedAnalyticsService.getClinicalAnalytics();

  const handleExport = () => {
    setExportNotice('Exporting ZenithRx Executive Analytics Intelligence Dossier (CSV/PDF)...');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Analytics &amp; Executive Intelligence Suite
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                  Real-Time Pulse
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-dimensional operational telemetry, inventory velocity &amp; dead stock economics, and clinical pharmacovigilance audits.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {[
                { id: 'today', label: 'Today (Live)' },
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: 'Quarter' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id as AnalyticsTimeRange)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeRange === range.id
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('cockpit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'cockpit'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Pharmacy Executive Cockpit</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventory Velocity &amp; Stock Ageing</span>
        </button>

        <button
          onClick={() => setActiveTab('clinical')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'clinical'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Clinical &amp; Pharmacovigilance Safety</span>
        </button>
      </div>

      {/* ── 1. PHARMACY EXECUTIVE COCKPIT ── */}
      {activeTab === 'cockpit' && (
        <div className="space-y-6">
          {/* Executive Primary Indicator Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Today's Sales
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                UGX {operationalKPIs.todaySalesUgx.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>+{operationalKPIs.revenueGrowthPct}% vs last period</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Today's Dispensing
              </p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {operationalKPIs.todayDispensingCount} Prescriptions
              </p>
              <span className="text-[10px] text-slate-400">
                Avg Basket: UGX {operationalKPIs.averageBasketValueUgx.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Gross Revenue ({timeRange.toUpperCase()})
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                UGX {operationalKPIs.grossRevenueUgx.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">
                COGS: UGX {operationalKPIs.cogsUgx.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Gross Profit &amp; Margin
              </p>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                UGX {operationalKPIs.grossProfitUgx.toLocaleString()}
              </p>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                {operationalKPIs.grossProfitMarginPct}% Gross Margin
              </span>
            </div>
          </div>

          {/* Operational Backlog & Risk Triage Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div
              onClick={() => onNavigateTab && onNavigateTab('inventory')}
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 cursor-pointer hover:border-rose-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400">Low-Stock</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <p className="text-xl font-black text-rose-900 dark:text-rose-100 mt-1">
                {operationalKPIs.lowStockCount} Items
              </p>
              <span className="text-[9px] text-rose-600">Below safety buffer</span>
            </div>

            <div
              onClick={() => onNavigateTab && onNavigateTab('expiry')}
              className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 cursor-pointer hover:border-amber-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">Near-Expiry</span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="text-xl font-black text-amber-900 dark:text-amber-100 mt-1">
                {operationalKPIs.nearExpiryCount} Batches
              </p>
              <span className="text-[9px] text-amber-600">&lt; 90-day FEFO window</span>
            </div>

            <div
              onClick={() => onNavigateTab && onNavigateTab('prescriptions')}
              className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 cursor-pointer hover:border-blue-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">Pending Rx</span>
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-xl font-black text-blue-900 dark:text-blue-100 mt-1">
                {operationalKPIs.pendingPrescriptionsCount} In Queue
              </p>
              <span className="text-[9px] text-blue-600">Awaiting clinical check</span>
            </div>

            <div
              onClick={() => onNavigateTab && onNavigateTab('onlineOrders')}
              className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:border-indigo-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400">Pending Orders</span>
                <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-xl font-black text-indigo-900 dark:text-indigo-100 mt-1">
                {operationalKPIs.pendingOrdersCount} In Queue
              </p>
              <span className="text-[9px] text-indigo-600">Packing at counter</span>
            </div>

            <div
              onClick={() => onNavigateTab && onNavigateTab('adminOrdersDelivery')}
              className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:border-emerald-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Deliveries</span>
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                {operationalKPIs.pendingDeliveriesCount} Active
              </p>
              <span className="text-[9px] text-emerald-600">Couriers on route</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. INVENTORY ANALYTICS & VELOCITY ── */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Valuation & Risk Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Total Inventory Valuation
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                UGX {inventoryReport.totalInventoryValuationUgx.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">Active dispensary stock</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Expired Stock Value
              </p>
              <p className="text-xl font-black text-rose-900 dark:text-rose-100 mt-1">
                UGX {inventoryReport.expiredStockValueUgx.toLocaleString()}
              </p>
              <span className="text-[10px] text-rose-600">Requires NDA write-off</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Near-Expiry Value at Risk
              </p>
              <p className="text-xl font-black text-amber-900 dark:text-amber-100 mt-1">
                UGX {inventoryReport.nearExpiryStockValueUgx.toLocaleString()}
              </p>
              <span className="text-[10px] text-amber-600">&lt; 90-day exposure</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Stock Turnover Ratio
              </p>
              <p className="text-xl font-black text-blue-900 dark:text-blue-100 mt-1">
                {inventoryReport.averageStockTurnoverRatio}x / year
              </p>
              <span className="text-[10px] text-blue-600">
                Stockout rate: {inventoryReport.overallStockoutFrequencyPct}%
              </span>
            </div>
          </div>

          {/* Velocity Categorization Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Inventory Velocity Tiers &amp; Dead Stock Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Categorized by monthly movement velocity, turnover coefficient, and idle holding duration.
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'fast', label: 'Fast-Moving' },
                  { id: 'slow', label: 'Slow-Moving' },
                  { id: 'dead', label: 'Dead Stock' },
                  { id: 'overstock', label: 'Overstocked' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setInventoryVelocityFilter(f.id as any)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      inventoryVelocityFilter === f.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Medicine &amp; Category</th>
                    <th className="pb-3 text-center">Movement Tier</th>
                    <th className="pb-3 text-center">Monthly Sales</th>
                    <th className="pb-3 text-center">Days Idle</th>
                    <th className="pb-3 text-center">Current Stock</th>
                    <th className="pb-3 text-center">Turnover Ratio</th>
                    <th className="pb-3 text-right">Holding Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    ...(inventoryVelocityFilter === 'all' || inventoryVelocityFilter === 'fast' ? inventoryReport.fastMoving : []),
                    ...(inventoryVelocityFilter === 'all' || inventoryVelocityFilter === 'slow' ? inventoryReport.slowMoving : []),
                    ...(inventoryVelocityFilter === 'all' || inventoryVelocityFilter === 'dead' ? inventoryReport.deadStock : []),
                    ...(inventoryVelocityFilter === 'all' || inventoryVelocityFilter === 'overstock' ? inventoryReport.overstocked : []),
                  ].map((item) => (
                    <tr key={item.drugId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 pr-2">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{item.brandName}</p>
                        <p className="text-[10px] text-slate-400 italic">{item.genericName} • {item.category}</p>
                      </td>

                      <td className="py-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            item.statusBadge.includes('Fast')
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.statusBadge.includes('Dead')
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : item.statusBadge.includes('Overstock')
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.statusBadge}
                        </span>
                      </td>

                      <td className="py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.monthlyUnitsSold} units / mo
                      </td>

                      <td className="py-3.5 text-center font-mono">
                        {item.daysSinceLastSale === 0 ? 'Today' : `${item.daysSinceLastSale} days ago`}
                      </td>

                      <td className="py-3.5 text-center font-bold">
                        {item.currentStockUnits} units
                      </td>

                      <td className="py-3.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.stockTurnoverRatio}x
                      </td>

                      <td className="py-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        UGX {item.stockValueUgx.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. CLINICAL & PHARMACOVIGILANCE SAFETY ── */}
      {activeTab === 'clinical' && (
        <div className="space-y-6">
          {/* Clinical Safety Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase text-slate-500">Rx Rejection Rate</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {clinicalReport.rejectionRatePct}%
              </p>
              <span className="text-[9px] text-slate-400">{clinicalReport.rejectionsCount} of {clinicalReport.totalPrescriptionsReviewed} Rx</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase text-slate-500">Interventions</p>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {clinicalReport.pharmacistInterventionsCount}
              </p>
              <span className="text-[9px] text-slate-400">Clinical consults</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase text-slate-500">Interaction Alerts</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {clinicalReport.interactionAlertsTriggered}
              </p>
              <span className="text-[9px] text-slate-400">Intercepted D-D</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase text-slate-500">Allergy Alerts</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {clinicalReport.allergyAlertsPrevented}
              </p>
              <span className="text-[9px] text-slate-400">Catches prevented</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-black uppercase text-slate-500">ADR Reports</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {clinicalReport.adrReportsFiled}
              </p>
              <span className="text-[9px] text-slate-400">NDA Yellow Sheets</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 shadow-xs">
              <p className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">Controlled Safe</p>
              <p className="text-xl font-black text-purple-900 dark:text-purple-100 mt-1">
                {clinicalReport.controlledDispensingEvents}
              </p>
              <span className="text-[9px] text-purple-600">0 Safe Discrepancies</span>
            </div>
          </div>

          {/* Clinical Interventions Breakdown & Controlled Safe Register */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Pharmacist Clinical Interventions Distribution
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {clinicalReport.interventionsBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                        {item.count} events ({item.percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      e.g. {item.examples.join(' • ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Controlled Medicine Safe Register Audit */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Class A Narcotics Safe Dispensing Ledger
                  </h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200">
                  NDA Regulation 1970
                </span>
              </div>

              <div className="space-y-3">
                {clinicalReport.controlledSafeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{log.drugName}</p>
                        <p className="text-[10px] text-purple-600 font-bold">{log.classCategory}</p>
                      </div>
                      <span className="font-black text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200">
                        {log.quantityDispensed} {log.unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>Patient: <strong className="text-slate-700 dark:text-slate-300">{log.patientName}</strong></div>
                      <div>NIN: <strong className="font-mono text-slate-700 dark:text-slate-300">{log.patientNin}</strong></div>
                      <div>Prescriber: <strong className="text-slate-700 dark:text-slate-300">{log.prescriberName}</strong></div>
                      <div>Safe Balance: <strong className="font-mono text-purple-600 font-bold">{log.balanceRemaining} left</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
