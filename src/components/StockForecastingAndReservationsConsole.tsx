import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Clock,
  BookmarkCheck,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Scan,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  Package,
  Check,
  X,
  Plus,
  Send,
  Calendar,
  Calculator,
} from 'lucide-react';
import {
  advancedStockService,
  StockVelocityForecast,
  StockReservation,
  StockWaitlistEntry,
} from '../services/advancedStockAndScanningService';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface StockForecastingAndReservationsConsoleProps {
  tenantId?: string;
  onNavigateTab?: (tab: string, payload?: any) => void;
}

export const StockForecastingAndReservationsConsole: React.FC<StockForecastingAndReservationsConsoleProps> = ({
  tenantId = 'client-001',
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'forecasting' | 'reservations' | 'waitlist'>('forecasting');
  const [forecasts, setForecasts] = useState<StockVelocityForecast[]>([]);
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [waitlists, setWaitlists] = useState<StockWaitlistEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Interactive Forecasting Calculator Modal
  const [calcDrugName, setCalcDrugName] = useState('Augmentin 625mg');
  const [calcStock, setCalcStock] = useState<number>(10);
  const [calcAdu, setCalcAdu] = useState<number>(4);
  const [calcLeadTime, setCalcLeadTime] = useState<number>(3);
  const [calculatedForecast, setCalculatedForecast] = useState<StockVelocityForecast | null>(null);

  // Quick Action notification feedback
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadAllData = () => {
    setForecasts(advancedStockService.getVelocityForecasts(tenantId));
    setReservations(advancedStockService.getReservations({ status: 'all' }));
    setWaitlists(advancedStockService.getWaitlists({ status: 'all' }));
  };

  useEffect(() => {
    loadAllData();
  }, [tenantId]);

  const handleCalculate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = advancedStockService.calculateForecast({
      brandName: calcDrugName,
      genericName: 'Antibiotic formulation',
      currentStock: calcStock,
      averageDailyUsage: calcAdu,
      leadTimeDays: calcLeadTime,
    });
    setCalculatedForecast(result);
  };

  useEffect(() => {
    handleCalculate();
  }, [calcStock, calcAdu, calcLeadTime]);

  const handleFulfillReservation = (id: string, pin: string) => {
    advancedStockService.fulfillReservation(id);
    setActionSuccessMsg(`Reservation [${pin}] verified & marked as collected.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
    loadAllData();
  };

  const handleCancelReservation = (id: string) => {
    advancedStockService.cancelReservation(id);
    setActionSuccessMsg('Reservation hold released back to active stock.');
    setTimeout(() => setActionSuccessMsg(null), 3000);
    loadAllData();
  };

  const handleBroadcastRestock = (pharmacyId: string, drugId: string, brandName: string) => {
    const count = advancedStockService.triggerRestockAlert(pharmacyId, drugId);
    setActionSuccessMsg(`Broadcasted back-in-stock alerts to ${count} waiting patient(s) via SMS & In-App.`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
    loadAllData();
  };

  const criticalForecastsCount = forecasts.filter(
    (f) => f.forecastRiskLevel === 'critical_imminent_stockout' || f.forecastRiskLevel === 'urgent_reorder'
  ).length;

  const activeReservationsCount = reservations.filter((r) => r.status === 'active').length;
  const waitingPatientsCount = waitlists.filter((w) => w.status === 'waiting').length;

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Low-Stock Forecasting, Reservations &amp; Scanning Desk
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200">
                  Smart Velocity v2
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic burn-rate runout forecasts (Average Daily Usage ÷ Stock), customer hold reservations, and back-in-stock waitlist alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              Open Barcode/QR Scanner
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div
            onClick={() => setActiveSubTab('forecasting')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeSubTab === 'forecasting'
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Low-Stock Forecasting Alerts
              </p>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">
              {criticalForecastsCount} SKU(s)
            </p>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
              Runout before supplier lead time
            </span>
          </div>

          <div
            onClick={() => setActiveSubTab('reservations')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeSubTab === 'reservations'
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-1 ring-blue-400'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Active Customer Holds
              </p>
              <BookmarkCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">
              {activeReservationsCount} Reserved
            </p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              Holding with 24h pickup PINs
            </span>
          </div>

          <div
            onClick={() => setActiveSubTab('waitlist')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeSubTab === 'waitlist'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Back-in-Stock Waitlist
              </p>
              <BellRing className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">
              {waitingPatientsCount} Waiting
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              Awaiting automatic restock alert
            </span>
          </div>
        </div>

        {/* Action toast */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('forecasting')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'forecasting'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Low-Stock Burn Rate &amp; Runout Forecasting</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reservations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'reservations'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Medication Reservations Ledger ({activeReservationsCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('waitlist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'waitlist'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Patient Waitlist Queue ({waitingPatientsCount})</span>
        </button>
      </div>

      {/* ── TAB 1: LOW-STOCK BURN RATE & VELOCITY FORECASTING ── */}
      {activeSubTab === 'forecasting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Live Consumption Velocity &amp; Stockout Runout Tracker
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Calculates: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-bold">Stock ÷ Average Daily Usage = Estimated Days Remaining</code>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="pb-3">Medicine &amp; SKU Barcode</th>
                      <th className="pb-3 text-center">Current Stock</th>
                      <th className="pb-3 text-center">Avg Daily Usage</th>
                      <th className="pb-3 text-center">Runout Days</th>
                      <th className="pb-3 text-center">Lead Time</th>
                      <th className="pb-3 text-right">Recommended Reorder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {forecasts.map((item) => {
                      const isCritical = item.forecastRiskLevel === 'critical_imminent_stockout';
                      const isUrgent = item.forecastRiskLevel === 'urgent_reorder';

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isCritical ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="py-3.5 pr-2">
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {item.brandName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Barcode: {item.skuBarcode}
                            </p>
                          </td>

                          <td className="py-3.5 text-center">
                            <span
                              className={`font-black font-mono text-sm px-2 py-0.5 rounded-lg ${
                                item.currentStock <= 10
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {item.currentStock} units
                            </span>
                          </td>

                          <td className="py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                            {item.averageDailyUsage} / day
                          </td>

                          <td className="py-3.5 text-center">
                            <span
                              className={`font-black px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1 ${
                                isCritical
                                  ? 'bg-rose-600 text-white animate-pulse shadow-sm'
                                  : isUrgent
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {item.estimatedDaysRemaining} days
                            </span>
                          </td>

                          <td className="py-3.5 text-center text-slate-500 font-medium">
                            {item.leadTimeDays} days
                          </td>

                          <td className="py-3.5 text-right">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              +{item.recommendedReorderQty} units
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Interactive Calculator Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Dynamic Runout Simulator
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Medicine / Formulation
                  </label>
                  <input
                    type="text"
                    value={calcDrugName}
                    onChange={(e) => setCalcDrugName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Current Stock (Units)
                    </label>
                    <input
                      type="number"
                      value={calcStock}
                      onChange={(e) => setCalcStock(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Avg Daily Usage (ADU)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcAdu}
                      onChange={(e) => setCalcAdu(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Supplier Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={calcLeadTime}
                    onChange={(e) => setCalcLeadTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold font-mono"
                  />
                </div>
              </div>

              {/* Simulation Result Box */}
              {calculatedForecast && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    calculatedForecast.forecastRiskLevel === 'critical_imminent_stockout'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      : calculatedForecast.forecastRiskLevel === 'urgent_reorder'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span>Estimated Days Remaining:</span>
                    <span className="text-base font-black font-mono">
                      {calculatedForecast.estimatedDaysRemaining} days
                    </span>
                  </div>

                  <p className="font-bold text-[11px] leading-tight">
                    {calculatedForecast.statusLabel}
                  </p>

                  <div className="pt-2 border-t border-current/20 flex justify-between text-[11px]">
                    <span>Suggested Purchase Order:</span>
                    <span className="font-black font-mono">
                      {calculatedForecast.recommendedReorderQty} units
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MEDICATION RESERVATIONS LEDGER ── */}
      {activeSubTab === 'reservations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Customer Medication Hold Reservations
              </h3>
              <p className="text-xs text-slate-500">
                When patients request "Reserve 2 boxes", stock is held for 24-48 hours. Verification PIN is validated upon counter collection.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Patient &amp; Phone</th>
                  <th className="pb-3">Medication Reserved</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-center">Total Price</th>
                  <th className="pb-3 text-center">Pickup PIN</th>
                  <th className="pb-3 text-center">Hold Status / Expiry</th>
                  <th className="pb-3 text-right">Counter Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pr-2">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{res.patientName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{res.patientPhone}</p>
                    </td>

                    <td className="py-3.5 pr-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{res.brandName}</p>
                      <p className="text-[10px] text-slate-400">{res.pharmacyName}</p>
                    </td>

                    <td className="py-3.5 text-center font-bold">
                      {res.quantityReserved} box(es)
                    </td>

                    <td className="py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      UGX {res.totalAmountUgx.toLocaleString()}
                    </td>

                    <td className="py-3.5 text-center">
                      <span className="font-mono font-black text-xs px-2 py-1 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200">
                        {res.reservationPin}
                      </span>
                    </td>

                    <td className="py-3.5 text-center">
                      {res.status === 'active' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ACTIVE (24h HOLD)
                        </span>
                      ) : res.status === 'collected' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          COLLECTED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                          CANCELLED
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 text-right">
                      {res.status === 'active' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleFulfillReservation(res.id, res.reservationPin)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Fulfill
                          </button>
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                            title="Release hold"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: BACK-IN-STOCK WAITLIST QUEUE ── */}
      {activeSubTab === 'waitlist' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Back-in-Stock Patient Waitlist Subscribers
              </h3>
              <p className="text-xs text-slate-500">
                Patients who signed up for "Notify me when available". When new supplier stock arrives, 1-click broadcast triggers SMS &amp; In-App alert.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Patient &amp; Contact</th>
                  <th className="pb-3">Requested Medication</th>
                  <th className="pb-3 text-center">Quantity</th>
                  <th className="pb-3 text-center">Channel</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Replenishment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {waitlists.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pr-2">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{w.patientName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{w.patientPhone}</p>
                    </td>

                    <td className="py-3.5 pr-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{w.brandName}</p>
                      <p className="text-[10px] text-slate-400">{w.pharmacyName}</p>
                    </td>

                    <td className="py-3.5 text-center font-bold">
                      {w.requestedQuantity} box(es)
                    </td>

                    <td className="py-3.5 text-center">
                      <span className="font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {w.preferredChannel}
                      </span>
                    </td>

                    <td className="py-3.5 text-center">
                      {w.status === 'waiting' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          WAITING RESTOCK
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          NOTIFIED
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 text-right">
                      {w.status === 'waiting' && (
                        <button
                          onClick={() => handleBroadcastRestock(w.pharmacyId, w.drugId, w.brandName)}
                          className="px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Broadcast Stock Arrival</span>
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

      {/* Barcode Scanner Modal Component */}
      <BarcodeScannerModal
        drugs={[]}
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};
