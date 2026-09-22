import React, { useState, useMemo } from 'react';
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
  PieChart,
  Activity,
  Receipt,
  Search,
  Database,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  FileText,
  Filter,
  X
} from 'lucide-react';
import { POSTransaction, DrugItem, Prescription, CustomerProfile } from '../types';
import { formatUGX, formatUGXCompact, formatTimestamp } from '../services/formatters';
import { exportSalesCSV } from '../services/exportService';
import { SearchEngineService, SearchHit } from '../services/searchEngineService';
import {
  AnalyticsWarehouseService,
  StockAgeingBucket,
  MaterializedViewSummary,
  DataWarehouseSyncStatus
} from '../services/analyticsWarehouseService';
import { StatCard } from './ui/StatCard';
import { Badge } from './ui/Badge';
import { CashUpModal } from './CashUpModal';

interface SalesReportsProps {
  transactions: POSTransaction[];
  drugs?: DrugItem[];
  prescriptions?: Prescription[];
  customers?: CustomerProfile[];
}

type ReportTab = 'salesKpi' | 'stockAgeing' | 'openSearch' | 'warehouseCdc';
type DateRange = 'today' | 'week' | 'month' | 'all';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  'Cash':                              'bg-emerald-500',
  'Mobile Money':                      'bg-sky-500',
  'MTN Mobile Money / Airtel Money':   'bg-amber-500',
  'M-Pesa / Mobile':                   'bg-green-600',
  'Card':                              'bg-violet-500',
  'Insurance Scheme':                  'bg-rose-500',
  'WhatsApp Invoice':                  'bg-teal-500',
};

function barWidth(value: number, max: number): string {
  if (max === 0) return '0%';
  return `${Math.min(100, (value / max) * 100).toFixed(1)}%`;
}

function filterByDateRange(txs: POSTransaction[], range: DateRange): POSTransaction[] {
  if (range === 'all') return txs;
  const now = new Date();
  const start = new Date();
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    start.setDate(now.getDate() - 7);
  } else if (range === 'month') {
    start.setDate(now.getDate() - 30);
  }
  return txs.filter((tx) => new Date(tx.timestamp) >= start);
}

export const SalesReports: React.FC<SalesReportsProps> = ({
  transactions,
  drugs = [],
  prescriptions = [],
  customers = [],
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('salesKpi');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [isCashUpOpen, setIsCashUpOpen] = useState(false);

  // OpenSearch State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<'ALL' | 'DRUG' | 'PRESCRIPTION' | 'PATIENT' | 'INVOICE'>('ALL');

  const filtered = useMemo(() => filterByDateRange(transactions, dateRange), [transactions, dateRange]);

  // KPIs
  const totalRevenue    = filtered.reduce((s, tx) => s + tx.totalPaid, 0);
  const totalSubtotal   = filtered.reduce((s, tx) => s + tx.subtotal, 0);
  const totalTax        = filtered.reduce((s, tx) => s + tx.taxAmount, 0);
  const totalDiscount   = filtered.reduce((s, tx) => s + tx.discountAmount, 0);
  const txCount         = filtered.length;
  const avgOrderValue   = txCount > 0 ? totalRevenue / txCount : 0;
  const estimatedCOGS   = totalSubtotal * 0.55;
  const grossProfit     = totalRevenue - estimatedCOGS;
  const grossMarginPct  = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    filtered.forEach((tx) => {
      const m = tx.paymentMethod;
      if (!map[m]) map[m] = { revenue: 0, count: 0 };
      map[m].revenue += tx.totalPaid;
      map[m].count   += 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([method, data]) => ({ method, ...data }));
  }, [filtered]);

  const maxPaymentRevenue = paymentBreakdown[0]?.revenue ?? 1;

  // Stock Ageing Matrix Calculation
  const stockAgeing = useMemo(() => {
    return AnalyticsWarehouseService.computeStockAgeing(drugs);
  }, [drugs]);

  // Materialized Views & Warehouse Status
  const materializedViews = useMemo(() => AnalyticsWarehouseService.getMaterializedViews(), []);
  const warehouseStatus = useMemo(() => AnalyticsWarehouseService.getDataWarehouseSyncStatus(), []);

  // OpenSearch Query Execution
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { hits: [], totalHits: 0, queryExecutionTimeMs: 0 };
    const entityTypes = selectedEntityFilter === 'ALL'
      ? undefined
      : [selectedEntityFilter];
    return SearchEngineService.search(
      { query: searchQuery, entityTypes, limit: 15 },
      { drugs, prescriptions, customers, transactions }
    );
  }, [searchQuery, selectedEntityFilter, drugs, prescriptions, customers, transactions]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900">
                Search, Analytics &amp; Reporting
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                <Database className="w-3 h-3 text-blue-600" /> Isolated OLAP Reporting Path
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Materialized views, stock ageing matrices, OpenSearch full-text cluster &amp; BigQuery data warehouse pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCashUpOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 border border-slate-200 shadow-xs transition cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-700" />
            Shift Cash-Up
          </button>
          <button
            onClick={() => exportSalesCSV(filtered)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 border border-slate-200 shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-700" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Feature Cards Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1 — Financial KPIs & Revenue */}
        <button
          onClick={() => setActiveTab('salesKpi')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeTab === 'salesKpi'
              ? 'bg-blue-50/70 border-blue-600 shadow-sm'
              : 'bg-white border-slate-200 hover:-translate-y-1 hover:shadow-md'
          }`}
          style={{ borderTopColor: activeTab === 'salesKpi' ? '#2563EB' : '#93C5FD' }}
        >
          {/* Icon */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            activeTab === 'salesKpi' ? 'bg-blue-100' : 'bg-blue-50'
          }`}>
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>

          {/* Title & description */}
          <div className="space-y-1">
            <h3 className="text-sm font-black leading-tight text-slate-900">
              Financial KPIs &amp; Revenue
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Real-time revenue analytics, gross profit, and payment channel distribution.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-1">
            {['Net Sales & Gross Profit', 'Avg Order Value (AOV)', 'Payment Channel Breakdown', 'VAT & COGS Settlement'].map((f) => (
              <li key={f} className="text-[10px] font-semibold flex items-center gap-1.5 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500" />
                {f}
              </li>
            ))}
          </ul>

          {/* Footer CTA */}
          <div className="mt-auto pt-2 border-t border-slate-200">
            {activeTab === 'salesKpi' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-blue-700" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full group-hover:bg-blue-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 2 — Stock Ageing & Valuation Matrix */}
        <button
          onClick={() => setActiveTab('stockAgeing')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeTab === 'stockAgeing'
              ? 'bg-amber-50/70 border-amber-600 shadow-sm'
              : 'bg-white border-slate-200 hover:-translate-y-1 hover:shadow-md'
          }`}
          style={{ borderTopColor: activeTab === 'stockAgeing' ? '#D97706' : '#FCD34D' }}
        >
          {/* Badge */}
          <span className="absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            4 BUCKETS
          </span>

          {/* Icon */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            activeTab === 'stockAgeing' ? 'bg-amber-100' : 'bg-amber-50'
          }`}>
            <Package className="w-6 h-6 text-amber-700" />
          </div>

          {/* Title & description */}
          <div className="space-y-1">
            <h3 className="text-sm font-black leading-tight text-slate-900">
              Stock Ageing &amp; Valuation Matrix
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Capital exposure by 30-day chronological ageing tranches with FEFO clearance recommendations.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-1">
            {['0-30 Day Critical Tranche', '31-60 Day Moderate Risk', '61-90 & 90+ Day Healthy', 'FEFO Clearance Guidance'].map((f) => (
              <li key={f} className="text-[10px] font-semibold flex items-center gap-1.5 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-500" />
                {f}
              </li>
            ))}
          </ul>

          {/* Footer CTA */}
          <div className="mt-auto pt-2 border-t border-slate-200">
            {activeTab === 'stockAgeing' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-amber-700" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full group-hover:bg-amber-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 3 — OpenSearch Global Search */}
        <button
          onClick={() => setActiveTab('openSearch')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeTab === 'openSearch'
              ? 'bg-cyan-50/70 border-cyan-600 shadow-sm'
              : 'bg-white border-slate-200 hover:-translate-y-1 hover:shadow-md'
          }`}
          style={{ borderTopColor: activeTab === 'openSearch' ? '#0891b2' : '#67e8f9' }}
        >
          {/* Badge */}
          <span className="absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            FULL-TEXT
          </span>

          {/* Icon */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            activeTab === 'openSearch' ? 'bg-cyan-100' : 'bg-cyan-50'
          }`}>
            <Search className="w-6 h-6 text-cyan-700" />
          </div>

          {/* Title & description */}
          <div className="space-y-1">
            <h3 className="text-sm font-black leading-tight text-slate-900">
              OpenSearch Global Search
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Sub-millisecond fuzzy BM25 search across all drugs, prescriptions, patients, and invoices.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-1">
            {['BM25 Relevance Scoring', 'Entity-Type Filtering', 'Fuzzy & Partial Matching', 'af-south-1 Cluster Node'].map((f) => (
              <li key={f} className="text-[10px] font-semibold flex items-center gap-1.5 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-cyan-500" />
                {f}
              </li>
            ))}
          </ul>

          {/* Footer CTA */}
          <div className="mt-auto pt-2 border-t border-slate-200">
            {activeTab === 'openSearch' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-cyan-700" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full group-hover:bg-cyan-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 4 — Data Warehouse & Materialized Views */}
        <button
          onClick={() => setActiveTab('warehouseCdc')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeTab === 'warehouseCdc'
              ? 'bg-purple-50/70 border-purple-600 shadow-sm'
              : 'bg-white border-slate-200 hover:-translate-y-1 hover:shadow-md'
          }`}
          style={{ borderTopColor: activeTab === 'warehouseCdc' ? '#9333ea' : '#d8b4fe' }}
        >
          {/* Icon */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            activeTab === 'warehouseCdc' ? 'bg-purple-100' : 'bg-purple-50'
          }`}>
            <Layers className="w-6 h-6 text-purple-700" />
          </div>

          {/* Title & description */}
          <div className="space-y-1">
            <h3 className="text-sm font-black leading-tight text-slate-900">
              Data Warehouse &amp; Materialized Views
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-600">
              CDC streaming to BigQuery with pre-aggregated OLAP materialized views and sub-minute replication lag.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-1">
            {['CDC Stream to BigQuery', 'Sub-Minute Replication Lag', 'Pre-Aggregated OLAP Views', 'Columnar Partition Export'].map((f) => (
              <li key={f} className="text-[10px] font-semibold flex items-center gap-1.5 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-purple-500" />
                {f}
              </li>
            ))}
          </ul>

          {/* Footer CTA */}
          <div className="mt-auto pt-2 border-t border-slate-200">
            {activeTab === 'warehouseCdc' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-purple-700" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full group-hover:bg-purple-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

      </div>

      {/* TAB 1: FINANCIAL KPIS & REVENUE */}
      {activeTab === 'salesKpi' && (
        <div className="space-y-6">
          {/* Date Filter */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Reporting Interval:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    dateRange === r
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {DATE_RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Net Sales Revenue"
              value={formatUGX(totalRevenue)}
              subtitle={`${txCount} completed transactions`}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Gross Profit Est."
              value={formatUGX(grossProfit)}
              subtitle={`${grossMarginPct.toFixed(1)}% Gross Margin`}
              icon={<TrendingUp className="w-5 h-5 text-sky-600" />}
            />
            <StatCard
              title="Avg Order Value (AOV)"
              value={formatUGX(avgOrderValue)}
              subtitle="Per counter checkout"
              icon={<ShoppingCart className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Discounts Granted"
              value={formatUGX(totalDiscount)}
              subtitle="Promotional & Clearance"
              icon={<Activity className="w-5 h-5 text-purple-600" />}
            />
          </div>

          {/* Payment Method Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-600" />
                Revenue Distribution by Payment Channel
              </h3>
              <div className="space-y-3 pt-2">
                {paymentBreakdown.map((item) => (
                  <div key={item.method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{item.method}</span>
                      <span className="text-slate-900 font-mono">
                        {formatUGX(item.revenue)} ({item.count} sales)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${PAYMENT_METHOD_COLORS[item.method] || 'bg-slate-400'}`}
                        style={{ width: barWidth(item.revenue, maxPaymentRevenue) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift Summary */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Ledger Settlement &amp; Tax Compliance
              </h3>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-500 font-bold">Gross Subtotal (Pre-Tax):</span>
                  <span className="text-slate-900 font-mono font-bold">{formatUGX(totalSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-500 font-bold">Total VAT / Tax Remittance:</span>
                  <span className="text-slate-900 font-mono font-bold">{formatUGX(totalTax)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-500 font-bold">Estimated Cost of Goods Sold (COGS):</span>
                  <span className="text-slate-900 font-mono font-bold">{formatUGX(estimatedCOGS)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="text-emerald-900 font-bold">Net Pharmacy Contribution:</span>
                  <span className="text-emerald-900 font-mono font-black">{formatUGX(grossProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK AGEING & VALUATION MATRIX */}
      {activeTab === 'stockAgeing' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                Inventory Stock Ageing &amp; Expiry Valuation Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates capital exposure and inventory velocity categorized into 30-day chronological ageing tranches.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block">Total Inventory Valuation</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {formatUGX(stockAgeing.totalInventoryValuationUgx)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {stockAgeing.buckets.map((b) => (
              <div key={b.bucketName} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">{b.bucketName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {b.percentageOfInventory}% of Value
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {formatUGX(b.totalValuationUgx)}
                </div>
                <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>{b.skuCount} SKUs</span>
                  <span>{b.totalUnits.toLocaleString()} Units</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              FEFO Clearance Recommendations by Tranche
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-700">0-30 Days Critical Tranche</span>
                  <p className="text-slate-500 mt-0.5">
                    Requires immediate 30-50% markdown or emergency supplier credit return protocol.
                  </p>
                </div>
                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  High Risk Tranche
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-700">31-60 Days Active Tranche</span>
                  <p className="text-slate-500 mt-0.5">
                    Recommend POS counter bundle promotions and priority FEFO dispensing queue.
                  </p>
                </div>
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  Moderate Risk
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-700">61+ Days Healthy Stock</span>
                  <p className="text-slate-500 mt-0.5">
                    Standard inventory buffer with regular wholesale replenishment cycles.
                  </p>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Stable Valuation
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPENSEARCH / ELASTICSEARCH GLOBAL SEARCH */}
      {activeTab === 'openSearch' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-600" />
                  OpenSearch / Elasticsearch Full-Text Query Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sub-millisecond fuzzy search with BM25 relevance scoring across Products, Prescriptions, Patients &amp; Invoices.
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full self-start sm:self-auto">
                Cluster: af-south-1 (Johannesburg)
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search across all drugs, active prescriptions, patients, or invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Entity Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-blue-500" /> Filter:
              </span>
              {(['ALL', 'DRUG', 'PRESCRIPTION', 'PATIENT', 'INVOICE'] as const).map((ent) => {
                const isActive = selectedEntityFilter === ent;
                return (
                  <button
                    key={ent}
                    onClick={() => setSelectedEntityFilter(ent)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                  >
                    {ent}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Results Display */}
          {searchQuery.trim() && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <span className="font-black text-slate-800">
                  {searchResults.totalHits} Matches Found
                </span>
                <span className="text-slate-400 font-mono">
                  Execution: <strong>{searchResults.queryExecutionTimeMs}ms</strong> • Algorithm: BM25
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {searchResults.hits.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No matching records found for "{searchQuery}".
                  </div>
                ) : (
                  searchResults.hits.map((hit) => (
                    <div key={hit.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            hit.entityType === 'DRUG'
                              ? 'bg-emerald-100 text-emerald-800'
                              : hit.entityType === 'PRESCRIPTION'
                              ? 'bg-sky-100 text-sky-800'
                              : hit.entityType === 'PATIENT'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {hit.entityType}
                          </span>
                          <span className="font-black text-sm text-slate-900">{hit.title}</span>
                        </div>
                        <p className="text-xs text-slate-500">{hit.subtitle}</p>
                        <div
                          className="text-[11px] text-slate-600 bg-slate-100/70 px-2 py-0.5 rounded inline-block"
                          dangerouslySetInnerHTML={{ __html: hit.highlight }}
                        />
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 block font-mono">
                          Relevance Score
                        </span>
                        <span className="text-xs font-black text-cyan-600 font-mono">
                          {hit.score.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DATA WAREHOUSE & MATERIALIZED VIEWS */}
      {activeTab === 'warehouseCdc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Target Data Warehouse</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {warehouseStatus.cdcStreamState}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {warehouseStatus.targetWarehouse}
              </div>
              <p className="text-xs text-slate-500">
                Continuous Change Data Capture (CDC) streaming past transactional mutations.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Replication Stream Lag</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800">
                  SUB-MINUTE
                </span>
              </div>
              <div className="text-2xl font-black text-sky-600 font-mono">
                {warehouseStatus.replicationLagSeconds}s Lag
              </div>
              <p className="text-xs text-slate-500">
                Near real-time analytics sync without placing load on retail POS checkout nodes.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">24h Export Volume</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                  {warehouseStatus.syncedTablesCount} Tables
                </span>
              </div>
              <div className="text-2xl font-black text-purple-600 font-mono">
                {warehouseStatus.recordsExported24h.toLocaleString()} Rows
              </div>
              <p className="text-xs text-slate-500">
                Aggregated and partitioned into BigQuery columnar partitions.
              </p>
            </div>
          </div>

          {/* Materialized Views Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-black text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>PostgreSQL OLAP Materialized Views (Pre-Aggregated)</span>
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Views Fresh
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {materializedViews.map((mv) => (
                <div key={mv.viewName} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-sky-600" />
                      <span className="font-black text-xs font-mono text-slate-900">{mv.viewName}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {mv.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>Rows: {mv.rowCount}</span>
                      <span>Storage: {(mv.storageSizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <div className="text-right sm:self-center shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-800 block">
                      {mv.refreshLatencyMs}ms Refresh
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Last Refreshed: {mv.lastRefreshedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cash Up Modal */}
      {isCashUpOpen && (
        <CashUpModal
          isOpen={isCashUpOpen}
          onClose={() => setIsCashUpOpen(false)}
          transactions={transactions}
        />
      )}
    </div>
  );
};

export default SalesReports;
