import React, { useState } from 'react';
import {
  getBranchPerformanceMetrics,
  getStockTransfers,
  createStockTransfer,
  markStockTransferReceived,
} from '../../services/pharmacyOwnerService';
import { BranchPerformanceMetric, StockTransferRequest } from '../../types';
import {
  Building2,
  TrendingUp,
  ArrowLeftRight,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  Plus,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { formatUGX } from '../../services/formatters';

import { PharmacyServiceCatalogueConsole } from './PharmacyServiceCatalogueConsole';

interface PharmacyOwnerDashboardProps {
  onNavigateTab?: (tab: any) => void;
}

export const PharmacyOwnerDashboard: React.FC<PharmacyOwnerDashboardProps> = () => {
  const [branches] = useState<BranchPerformanceMetric[]>(getBranchPerformanceMetrics());
  const [transfers, setTransfers] = useState<StockTransferRequest[]>(getStockTransfers());
  const [activeTab, setActiveTab] = useState<'overview' | 'transfers' | 'services' | 'financials'>('overview');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // New Transfer State
  const [srcBranch, setSrcBranch] = useState('client-001');
  const [dstBranch, setDstBranch] = useState('client-003');
  const [drugName, setDrugName] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [qty, setQty] = useState(10);
  const [notes, setNotes] = useState('');

  const totalMonthlyRevenue = branches.reduce((acc, b) => acc + b.monthlyRevenueUgx, 0);
  const totalStockValuation = branches.reduce((acc, b) => acc + b.stockValuationUgx, 0);
  const totalDailyRevenue = branches.reduce((acc, b) => acc + b.dailyRevenueUgx, 0);
  const totalExpiring = branches.reduce((acc, b) => acc + b.expiringItemsCount, 0);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName || !batchNo || !expiry) return;

    const srcObj = branches.find((b) => b.branchId === srcBranch);
    const dstObj = branches.find((b) => b.branchId === dstBranch);

    const newTransfer = createStockTransfer({
      sourceBranchId: srcBranch,
      sourceBranchName: srcObj?.branchName || 'Source Branch',
      destinationBranchId: dstBranch,
      destinationBranchName: dstObj?.branchName || 'Destination Branch',
      drugId: `drug-${Date.now()}`,
      drugBrandName: drugName,
      batchNumber: batchNo,
      expiryDate: expiry,
      quantityTransferred: qty,
      dispatchedBy: 'Dr. Arthur Ssenabulya (Supervising Pharmacist)',
      transferNotes: notes,
    });

    setTransfers([newTransfer, ...transfers]);
    setIsTransferModalOpen(false);

    setDrugName('');
    setBatchNo('');
    setExpiry('');
    setNotes('');
  };

  const handleReceiveTransfer = (trfId: string) => {
    const updated = markStockTransferReceived(
      trfId,
      'Dr. Ronald Mukasa (Receiving Pharmacist)',
      'Verified physical count & batch expiry intact'
    );
    if (updated) {
      setTransfers(getStockTransfers());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              Multi-Branch Executive Portal (§17)
            </span>
            <span className="text-xs font-semibold text-slate-500">Centralized Enterprise Command Hub</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Pharmacy Owner Dashboard &amp; Multi-Branch Operations
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Consolidated enterprise P&amp;L, cross-branch inventory balancing, stock transfer dispatch, and supervisory compliance across all retail locations.
          </p>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Dispatch Branch Stock Transfer</span>
        </button>
      </div>

      {/* Enterprise KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enterprise Monthly Revenue</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {formatUGX(totalMonthlyRevenue)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            Across {branches.length} Registered Branches
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales (All Locations)</span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-700 dark:text-indigo-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {formatUGX(totalDailyRevenue)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Active POS terminals online
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stock Valuation</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-700 dark:text-purple-300">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {formatUGX(totalStockValuation)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Audited Wholesale Value
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiring Items Risk</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {totalExpiring} Batches
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Within 90-day FEFO window
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'overview'
              ? 'border-violet-600 text-violet-700 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Branch Performance Comparison ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'transfers'
              ? 'border-violet-600 text-violet-700 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Inter-Branch Stock Transfers ({transfers.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'services'
              ? 'border-violet-600 text-violet-700 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Service Catalogue &amp; Clinical Offerings
        </button>
      </div>

      {/* Tab 1: Branch Comparison Table */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map((b) => (
            <div
              key={b.branchId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{b.branchName}</h3>
                  <div className="text-xs text-slate-500">{b.district}</div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.status === 'Optimal'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Supervising Pharmacist:</span> {b.supervisingPharmacist}</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Staff On Duty:</span> {b.staffOnDutyCount} Active</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Active Prescriptions:</span> {b.activePrescriptionsCount} Dispensed</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2 border border-slate-100 dark:border-slate-700/60">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Monthly Turnover:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">{formatUGX(b.monthlyRevenueUgx)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Gross Margin:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{b.grossProfitMarginPercent}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Stock Valuation:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatUGX(b.stockValuationUgx)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Low Stock: <strong className="text-rose-600">{b.lowStockItemsCount}</strong></span>
                <span>Expiring: <strong className="text-amber-600">{b.expiringItemsCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Stock Transfers */}
      {activeTab === 'transfers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {transfers.map((trf) => (
            <div
              key={trf.id}
              className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">{trf.transferNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trf.transferStatus === 'Received & Verified'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                    }`}
                  >
                    {trf.transferStatus}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {trf.drugBrandName} — <span className="text-violet-600 dark:text-violet-400 font-extrabold">{trf.quantityTransferred} units</span> (Batch: {trf.batchNumber})
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span>From: <strong>{trf.sourceBranchName}</strong></span>
                  <span>➔</span>
                  <span>To: <strong>{trf.destinationBranchName}</strong></span>
                </div>

                {trf.transferNotes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                    {trf.transferNotes}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {trf.transferStatus !== 'Received & Verified' ? (
                  <button
                    onClick={() => handleReceiveTransfer(trf.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Receipt &amp; Restock</span>
                  </button>
                ) : (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Received &amp; Stock Balanced
                    </span>
                    {trf.receivedBy && (
                      <div className="text-[10px] text-slate-400 mt-0.5">By {trf.receivedBy}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Service Catalogue Configuration */}
      {activeTab === 'services' && (
        <PharmacyServiceCatalogueConsole currentBranchId={srcBranch} />
      )}

      {/* Stock Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Inter-Branch Stock Transfer</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Source Branch</label>
                  <select
                    value={srcBranch}
                    onChange={(e) => setSrcBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Destination Branch</label>
                  <select
                    value={dstBranch}
                    onChange={(e) => setDstBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Drug Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Augmentin 625mg"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="AUG-2024-09B"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Transfer Rationale / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Mukono branch experiencing stockout"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md">
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
