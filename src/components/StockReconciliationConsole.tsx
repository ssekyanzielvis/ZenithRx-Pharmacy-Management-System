import React, { useState } from 'react';
import {
  StockAdjustmentRecord,
  StockAdjustmentReason,
  StockAdjustmentStatus,
  StocktakeSession,
  StocktakeScopeType,
  DrugItem,
} from '../types';
import { stockReconciliationService } from '../services/stockReconciliationService';
import { getMasterMedicines } from '../services/medicineSafetyService';
import { formatUGX } from '../services/formatters';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Boxes,
  ShieldAlert,
  UserCheck,
  Lock,
  Layers,
  Sparkles,
  DollarSign,
  Calendar,
  X,
  Eye,
  Check,
  RotateCcw,
  Building2,
  MapPin,
  FileText,
} from 'lucide-react';

interface StockReconciliationConsoleProps {
  drugs?: DrugItem[];
}

export const StockReconciliationConsole: React.FC<StockReconciliationConsoleProps> = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustmentRecord[]>(
    stockReconciliationService.getAllAdjustments()
  );
  const [stocktakes, setStocktakes] = useState<StocktakeSession[]>(
    stockReconciliationService.getAllStocktakes()
  );

  const [activeMainTab, setActiveMainTab] = useState<'stocktakes' | 'adjustments' | 'analytics'>('stocktakes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals & Selected items
  const [selectedStocktake, setSelectedStocktake] = useState<StocktakeSession | null>(null);
  const [showNewAdjustmentModal, setShowNewAdjustmentModal] = useState(false);
  const [showNewStocktakeModal, setShowNewStocktakeModal] = useState(false);
  const [rejectingAdjustmentId, setRejectingAdjustmentId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // New Adjustment Form State
  const [newAdjForm, setNewAdjForm] = useState({
    drugName: 'Paracetamol 500mg Tablets (Box of 100)',
    brandName: 'Panadol Extra',
    genericName: 'Paracetamol',
    batchNumber: 'BAT-2026-AUG01',
    expiryDate: '2028-01-10',
    previousQuantity: 450,
    newQuantity: 440,
    unitCostPriceUgx: 4500,
    reason: 'breakage' as StockAdjustmentReason,
    justificationNotes: '',
    initiatedByName: 'Pharm. Denis Kigozi',
    initiatedByRole: 'Store & Inventory Manager',
  });

  // New Stocktake Form State
  const [newStocktakeForm, setNewStocktakeForm] = useState({
    title: '',
    scopeType: 'full_pharmacy' as StocktakeScopeType,
    targetCategory: 'All Categories',
    targetStorageZone: 'All Storage Zones',
    initiatedByName: 'Pharm. Denis Kigozi',
    initiatedByRole: 'Store & Inventory Manager',
    supervisorPharmacistName: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
  });

  const refreshData = () => {
    setAdjustments(stockReconciliationService.getAllAdjustments());
    setStocktakes(stockReconciliationService.getAllStocktakes());
    if (selectedStocktake) {
      setSelectedStocktake(stockReconciliationService.getStocktakeById(selectedStocktake.id) || null);
    }
  };

  const kpis = stockReconciliationService.getStocktakeKPIs();

  // Filtered Adjustments
  const filteredAdjustments = adjustments.filter((a) => {
    const matchesSearch =
      a.adjustmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.initiatedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.justificationNotes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesReason = selectedReasonFilter === 'all' || a.reason === selectedReasonFilter;
    const matchesStatus = selectedStatusFilter === 'all' || a.status === selectedStatusFilter;

    return matchesSearch && matchesReason && matchesStatus;
  });

  const getReasonBadge = (reason: StockAdjustmentReason) => {
    switch (reason) {
      case 'damaged_medicine':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">Damaged Medicine</span>;
      case 'expired_medicine':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Expired Medicine</span>;
      case 'lost_medicine':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Lost Medicine</span>;
      case 'theft':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white animate-pulse">Theft / Unaccounted</span>;
      case 'breakage':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Breakage</span>;
      case 'incorrect_receiving':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Incorrect Receiving</span>;
      case 'data_entry_correction':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Data Entry Correction</span>;
      case 'returned_medicine':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Returned Medicine</span>;
      case 'stock_count_variance':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">Stocktake Variance</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">{reason}</span>;
    }
  };

  const getStatusBadge = (status: StockAdjustmentStatus | string) => {
    switch (status) {
      case 'approved':
      case 'approved_and_posted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Approved &amp; Posted
          </span>
        );
      case 'pending_approval':
      case 'reconciliation_pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
            <Clock className="w-3 h-3" />
            Pending Approval
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Boxes className="w-3 h-3" />
            Counting In Progress
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-500">{status}</span>;
    }
  };

  const handleApproveAdjustment = (id: string) => {
    stockReconciliationService.approveAdjustment(id, {
      id: 'USR-001',
      name: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
      role: 'Supervising Pharmacist',
    });
    refreshData();
  };

  const handleRejectAdjustment = (id: string) => {
    if (!rejectionReasonText) {
      alert('Please provide a reason for rejecting this stock adjustment.');
      return;
    }
    stockReconciliationService.rejectAdjustment(
      id,
      {
        id: 'USR-001',
        name: 'Dr. Elvis Ssekyanzi',
        role: 'Supervising Pharmacist',
      },
      rejectionReasonText
    );
    setRejectingAdjustmentId(null);
    setRejectionReasonText('');
    refreshData();
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdjForm.justificationNotes) {
      alert('Clinical / operational justification notes are mandatory.');
      return;
    }

    stockReconciliationService.createAdjustment({
      tenantId: 'tenant_prime',
      branchId: 'branch_kampala_central',
      drugId: 'DRUG-001',
      drugName: newAdjForm.drugName,
      brandName: newAdjForm.brandName,
      genericName: newAdjForm.genericName,
      batchNumber: newAdjForm.batchNumber,
      expiryDate: newAdjForm.expiryDate,
      previousQuantity: Number(newAdjForm.previousQuantity),
      newQuantity: Number(newAdjForm.newQuantity),
      unitCostPriceUgx: Number(newAdjForm.unitCostPriceUgx),
      reason: newAdjForm.reason,
      justificationNotes: newAdjForm.justificationNotes,
      initiatedByUserId: 'USR-002',
      initiatedByName: newAdjForm.initiatedByName,
      initiatedByRole: newAdjForm.initiatedByRole,
      initiatedAt: new Date().toISOString(),
      status: 'pending_approval',
    });

    refreshData();
    setShowNewAdjustmentModal(false);
    setNewAdjForm({
      ...newAdjForm,
      justificationNotes: '',
    });
  };

  const handleCreateStocktake = (e: React.FormEvent) => {
    e.preventDefault();
    const masterMeds = getMasterMedicines();

    const sampleItems = masterMeds.slice(0, 6).map((m) => ({
      drugId: m.id,
      drugName: `${m.genericName} (${m.brandName}) ${m.strength}`,
      batchNumber: `BAT-2026-${m.id.slice(-3).toUpperCase()}`,
      expiryDate: '2027-12-31',
      storageLocation: m.isColdChainRequired ? 'Cold-Chain Refrigerator #2' : 'Aisle 1, Shelf A-01',
      systemExpectedQty: m.minStockLevel ? m.minStockLevel * 2 : 100,
      unitCostPriceUgx: m.averageWholesalePriceUgx || 5000,
    }));

    stockReconciliationService.createStocktakeSession({
      title: newStocktakeForm.title || `Physical Stocktake - ${new Date().toLocaleDateString()}`,
      scopeType: newStocktakeForm.scopeType,
      targetCategory: newStocktakeForm.targetCategory,
      targetStorageZone: newStocktakeForm.targetStorageZone,
      initiatedByName: newStocktakeForm.initiatedByName,
      initiatedByRole: newStocktakeForm.initiatedByRole,
      supervisorPharmacistName: newStocktakeForm.supervisorPharmacistName,
      initialCountItems: sampleItems,
    });

    refreshData();
    setShowNewStocktakeModal(false);
  };

  const handleCountChange = (
    stocktakeId: string,
    countItemId: string,
    countedVal: number,
    reason?: StockAdjustmentReason,
    notes?: string
  ) => {
    stockReconciliationService.recordPhysicalCount(stocktakeId, countItemId, {
      physicalCountedQty: countedVal,
      counterUserName: 'Pharm. Denis Kigozi',
      reconciliationReason: reason || 'stock_count_variance',
      notes,
    });
    refreshData();
  };

  const handleApproveStocktakeSession = (stocktakeId: string) => {
    stockReconciliationService.approveAndPostStocktake(
      stocktakeId,
      'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)'
    );
    refreshData();
    alert('Stocktake approved and all variance adjustments successfully posted to inventory!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Inventory Reconciliation &amp; Audit (§11.6, §11.20)
            </span>
            <span className="text-xs font-semibold text-slate-500">Dual-Control Pharmacist Authorization</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Physical Stocktake &amp; Stock Adjustment Console
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Rigorous inventory reconciliation: Physical Count vs Expected System Stock &rarr; Variance Calculation &rarr; Justified Reason &rarr; Supervisor Sign-Off.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewAdjustmentModal(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Record Single Adjustment
          </button>

          <button
            onClick={() => setShowNewStocktakeModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            Initiate Physical Stocktake
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Stocktakes</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{kpis.activeStocktakes}</p>
          <span className="text-[10px] text-slate-500">In progress / pending review</span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Approvals</span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{kpis.pendingAdjustments}</p>
          <span className="text-[10px] text-amber-600 font-bold">Requires pharmacist sign-off</span>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Approved Adjustments</span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{kpis.approvedAdjustments}</p>
          <span className="text-[10px] text-emerald-600">Posted to master stock</span>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Stock Shrinkage / Loss</span>
          <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1">
            -{formatUGX(kpis.netAdjustmentLossUgx)}
          </p>
          <span className="text-[10px] text-rose-600">Breakage, damage &amp; write-offs</span>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Stock Gains / Surpluses</span>
          <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
            +{formatUGX(kpis.netAdjustmentGainUgx)}
          </p>
          <span className="text-[10px] text-blue-600">Receiving &amp; count corrections</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveMainTab('stocktakes')}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeMainTab === 'stocktakes'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Physical Stocktake Sessions &amp; Runner
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-purple-600 text-white">
              {stocktakes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('adjustments')}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeMainTab === 'adjustments'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Stock Adjustments Ledger
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {adjustments.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Stocktake Sessions */}
      {activeMainTab === 'stocktakes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocktakes.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                    {session.stocktakeNumber}
                  </span>
                  {getStatusBadge(session.status)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {session.title}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Scope: <span className="capitalize font-semibold">{session.scopeType.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Progress & Stats Bar */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">Counting Progress</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {session.itemsCounted} / {session.totalItemsScoped} items ({session.totalItemsScoped > 0 ? Math.round((session.itemsCounted / session.totalItemsScoped) * 100) : 0}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{
                        width: `${session.totalItemsScoped > 0 ? (session.itemsCounted / session.totalItemsScoped) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">VARIANCE ITEMS</span>
                      <span className={`font-bold ${session.itemsWithVariance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {session.itemsWithVariance} items
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">NET VARIANCE (UGX)</span>
                      <span className={`font-bold ${session.netFinancialVarianceUgx < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                        {formatUGX(session.netFinancialVarianceUgx)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span>Initiated by: {session.initiatedByName}</span>
                  <span>{new Date(session.initiatedAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => setSelectedStocktake(session)}
                  className="w-full py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  Open Live Stocktake Runner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Stock Adjustments Ledger */}
      {activeMainTab === 'adjustments' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Adjustment #, Medicine, Batch #, User, or Reason..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedReasonFilter}
                onChange={(e) => setSelectedReasonFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2"
              >
                <option value="all">All Discrepancy Reasons</option>
                <option value="damaged_medicine">Damaged Medicine</option>
                <option value="expired_medicine">Expired Medicine</option>
                <option value="lost_medicine">Lost Medicine</option>
                <option value="theft">Theft / Unaccounted</option>
                <option value="breakage">Breakage</option>
                <option value="incorrect_receiving">Incorrect Receiving</option>
                <option value="data_entry_correction">Data Entry Correction</option>
                <option value="returned_medicine">Returned Medicine</option>
                <option value="stock_count_variance">Stocktake Variance</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Adjustments Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Adjustment &amp; Timestamp</th>
                    <th className="px-4 py-3">Medicine &amp; Batch</th>
                    <th className="px-4 py-3">Quantities (Prev &rarr; New)</th>
                    <th className="px-4 py-3">Variance &amp; Impact</th>
                    <th className="px-4 py-3">Discrepancy Reason</th>
                    <th className="px-4 py-3">Initiated By</th>
                    <th className="px-4 py-3">Status / Approval</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAdjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {adj.adjustmentNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(adj.initiatedAt).toLocaleString()}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {adj.drugName}
                        </div>
                        <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                          Batch: {adj.batchNumber} {adj.expiryDate && `(Exp: ${adj.expiryDate})`}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <span>{adj.previousQuantity}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-purple-600 dark:text-purple-400">{adj.newQuantity} units</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className={`font-extrabold ${adj.quantityDifference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {adj.quantityDifference > 0 ? `+${adj.quantityDifference}` : adj.quantityDifference} units
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {formatUGX(adj.financialImpactUgx)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>{getReasonBadge(adj.reason)}</div>
                        <div className="text-[10px] text-slate-500 italic mt-1 line-clamp-1 max-w-xs" title={adj.justificationNotes}>
                          "{adj.justificationNotes}"
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {adj.initiatedByName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {adj.initiatedByRole}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>{getStatusBadge(adj.status)}</div>
                        {adj.reviewedByName && (
                          <div className="text-[9px] text-slate-500 mt-1">
                            By {adj.reviewedByName}
                          </div>
                        )}
                        {adj.rejectionReason && (
                          <div className="text-[9px] text-rose-600 font-bold mt-0.5">
                            Rejection: {adj.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {adj.status === 'pending_approval' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveAdjustment(adj.id)}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-colors title='Approve Adjustment'"
                              title="Approve Adjustment"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectingAdjustmentId(adj.id)}
                              className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors title='Reject Adjustment'"
                              title="Reject Adjustment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-mono">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Live Stocktake Runner Modal */}
      {selectedStocktake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-purple-600">
                    {selectedStocktake.stocktakeNumber}
                  </span>
                  {getStatusBadge(selectedStocktake.status)}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {selectedStocktake.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStocktake(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">ITEMS SCOPED</span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100">{selectedStocktake.totalItemsScoped}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">COUNTED</span>
                <span className="text-base font-black text-purple-600">{selectedStocktake.itemsCounted}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">DISCREPANCY / VARIANCE</span>
                <span className={`text-base font-black ${selectedStocktake.itemsWithVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedStocktake.itemsWithVariance} items ({selectedStocktake.totalVarianceUnits} units)
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">NET FINANCIAL VARIANCE</span>
                <span className={`text-base font-black ${selectedStocktake.netFinancialVarianceUgx < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatUGX(selectedStocktake.netFinancialVarianceUgx)}
                </span>
              </div>
            </div>

            {/* Count Items Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Shelf Inventory Count &amp; Reconciliation Matrix
              </h4>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Medicine &amp; Batch</th>
                      <th className="px-4 py-2.5">Location</th>
                      <th className="px-4 py-2.5">Expected System Qty</th>
                      <th className="px-4 py-2.5">Physical Count Input</th>
                      <th className="px-4 py-2.5">Variance</th>
                      <th className="px-4 py-2.5">Discrepancy Reason &amp; Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedStocktake.countItems?.map((item) => {
                      const hasCount = item.physicalCountedQty !== undefined;
                      const isMatch = hasCount && item.varianceQty === 0;
                      const hasDiscrepancy = hasCount && item.varianceQty !== 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{item.drugName}</div>
                            <div className="font-mono text-[10px] text-slate-500">Batch: {item.batchNumber}</div>
                          </td>

                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {item.storageLocation || 'Main Shelf'}
                          </td>

                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                            {item.systemExpectedQty} units
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              disabled={selectedStocktake.status === 'approved_and_posted'}
                              value={item.physicalCountedQty !== undefined ? item.physicalCountedQty : ''}
                              onChange={(e) =>
                                handleCountChange(
                                  selectedStocktake.id,
                                  item.id,
                                  Number(e.target.value),
                                  item.reconciliationReason,
                                  item.notes
                                )
                              }
                              placeholder="Input count..."
                              className="w-28 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                            />
                          </td>

                          <td className="px-4 py-3">
                            {hasCount ? (
                              isMatch ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Exact Match (0)
                                </span>
                              ) : (
                                <div>
                                  <span className={`font-black text-xs ${item.varianceQty < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {item.varianceQty > 0 ? `+${item.varianceQty}` : item.varianceQty} units
                                  </span>
                                  <div className="text-[10px] text-slate-500">
                                    {formatUGX(item.varianceValueUgx)}
                                  </div>
                                </div>
                              )
                            ) : (
                              <span className="text-slate-400 italic">Not counted</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {hasDiscrepancy ? (
                              <div className="space-y-1">
                                <select
                                  value={item.reconciliationReason || 'stock_count_variance'}
                                  disabled={selectedStocktake.status === 'approved_and_posted'}
                                  onChange={(e) =>
                                    handleCountChange(
                                      selectedStocktake.id,
                                      item.id,
                                      item.physicalCountedQty || 0,
                                      e.target.value as StockAdjustmentReason,
                                      item.notes
                                    )
                                  }
                                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
                                >
                                  <option value="stock_count_variance">Stocktake Count Variance</option>
                                  <option value="damaged_medicine">Damaged Medicine</option>
                                  <option value="theft">Theft / Unaccounted</option>
                                  <option value="breakage">Breakage</option>
                                  <option value="incorrect_receiving">Incorrect Receiving</option>
                                  <option value="expired_medicine">Expired Medicine</option>
                                  <option value="data_entry_correction">Data Entry Correction</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Notes..."
                                  value={item.notes || ''}
                                  disabled={selectedStocktake.status === 'approved_and_posted'}
                                  onChange={(e) =>
                                    handleCountChange(
                                      selectedStocktake.id,
                                      item.id,
                                      item.physicalCountedQty || 0,
                                      item.reconciliationReason,
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {selectedStocktake.status !== 'approved_and_posted' && (
                  <button
                    onClick={() => handleApproveStocktakeSession(selectedStocktake.id)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Authorize &amp; Post Adjustments to Master Stock
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedStocktake(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Close Runner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Single Stock Adjustment Modal */}
      {showNewAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateAdjustment} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Record Stock Adjustment
              </h3>
              <button
                type="button"
                onClick={() => setShowNewAdjustmentModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Medicine Name *</label>
              <input
                type="text"
                required
                value={newAdjForm.drugName}
                onChange={(e) => setNewAdjForm({ ...newAdjForm, drugName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={newAdjForm.batchNumber}
                  onChange={(e) => setNewAdjForm({ ...newAdjForm, batchNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Unit Cost Price (UGX)</label>
                <input
                  type="number"
                  value={newAdjForm.unitCostPriceUgx}
                  onChange={(e) => setNewAdjForm({ ...newAdjForm, unitCostPriceUgx: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/50">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Current Stock (Prev)</label>
                <input
                  type="number"
                  value={newAdjForm.previousQuantity}
                  onChange={(e) => setNewAdjForm({ ...newAdjForm, previousQuantity: Number(e.target.value) })}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block mb-1">New Physical Count *</label>
                <input
                  type="number"
                  value={newAdjForm.newQuantity}
                  onChange={(e) => setNewAdjForm({ ...newAdjForm, newQuantity: Number(e.target.value) })}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-black text-purple-600"
                />
              </div>
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex justify-between font-bold">
              <span>Quantity Variance:</span>
              <span className={newAdjForm.newQuantity - newAdjForm.previousQuantity < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {newAdjForm.newQuantity - newAdjForm.previousQuantity > 0 ? `+${newAdjForm.newQuantity - newAdjForm.previousQuantity}` : newAdjForm.newQuantity - newAdjForm.previousQuantity} units
                {' '}({formatUGX((newAdjForm.newQuantity - newAdjForm.previousQuantity) * newAdjForm.unitCostPriceUgx)})
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Discrepancy Reason *</label>
              <select
                value={newAdjForm.reason}
                onChange={(e) => setNewAdjForm({ ...newAdjForm, reason: e.target.value as StockAdjustmentReason })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="damaged_medicine">Damaged Medicine</option>
                <option value="expired_medicine">Expired Medicine</option>
                <option value="lost_medicine">Lost Medicine</option>
                <option value="theft">Theft / Unaccounted Loss</option>
                <option value="breakage">Breakage</option>
                <option value="incorrect_receiving">Incorrect Receiving</option>
                <option value="data_entry_correction">Data-Entry Correction</option>
                <option value="returned_medicine">Returned Medicine</option>
                <option value="stock_count_variance">Stock Count Variance</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinical / Operational Justification *</label>
              <textarea
                required
                rows={2}
                value={newAdjForm.justificationNotes}
                onChange={(e) => setNewAdjForm({ ...newAdjForm, justificationNotes: e.target.value })}
                placeholder="Detail incident, breakage cause, receiving discrepancy, or count audit notes..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewAdjustmentModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                Submit for Pharmacist Approval
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Start New Stocktake Modal */}
      {showNewStocktakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateStocktake} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-600" />
                Initiate Physical Stocktake Session
              </h3>
              <button
                type="button"
                onClick={() => setShowNewStocktakeModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Stocktake Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Q1 2026 Comprehensive Pharmacy Physical Stocktake"
                value={newStocktakeForm.title}
                onChange={(e) => setNewStocktakeForm({ ...newStocktakeForm, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Audit Scope Type *</label>
              <select
                value={newStocktakeForm.scopeType}
                onChange={(e) => setNewStocktakeForm({ ...newStocktakeForm, scopeType: e.target.value as StocktakeScopeType })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="full_pharmacy">Full Pharmacy Inventory</option>
                <option value="category_cycle_count">Category Cycle Count (e.g. Antibiotics, Analgesics)</option>
                <option value="storage_zone_count">Storage Zone Count (e.g. Cold-Chain Refrigerator)</option>
                <option value="controlled_drugs_audit">Controlled Schedule 1 Dangerous Drugs Safe</option>
                <option value="high_value_items">High-Value Oncology &amp; Biologicals</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Initiated By</label>
                <input
                  type="text"
                  value={newStocktakeForm.initiatedByName}
                  onChange={(e) => setNewStocktakeForm({ ...newStocktakeForm, initiatedByName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Supervising Pharmacist</label>
                <input
                  type="text"
                  value={newStocktakeForm.supervisorPharmacistName}
                  onChange={(e) => setNewStocktakeForm({ ...newStocktakeForm, supervisorPharmacistName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewStocktakeModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                Launch Stocktake
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingAdjustmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Reject Stock Adjustment
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Rejection Reason *</label>
              <textarea
                required
                rows={3}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="State reason for rejecting adjustment (e.g. requires police theft report, count verification failed)..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingAdjustmentId(null);
                  setRejectionReasonText('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectAdjustment(rejectingAdjustmentId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
