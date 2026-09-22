/**
 * StockInventory.tsx — ZenithRx FEFO Stock & Batch Control Center
 * Clean Architecture: Presentation Layer
 * Integrates FEFO batch tracking, financial valuation KPIs, CSV bulk import/export,
 * stock adjustments, and barcode scanning.
 */

import React, { useState, useRef } from 'react';
import { DrugItem } from '../types';
import { useStockInventory, DrugWithFefo } from '../hooks/useStockInventory';
import { formatUGX } from '../services/formatters';
import { parseCSVToDrugs } from '../services/exportService';
import {
  Package,
  Plus,
  Search,
  QrCode,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Layers,
  X,
  Download,
  Upload,
  Calendar,
  FileSpreadsheet,
  Building2,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';

interface StockInventoryProps {
  drugs: DrugItem[];
  onAddDrug: (drug: DrugItem) => void;
  onUpdateDrug: (drug: DrugItem) => void;
  openBarcodeScanner: () => void;
}

export const StockInventory: React.FC<StockInventoryProps> = ({
  drugs,
  onAddDrug,
  onUpdateDrug,
  openBarcodeScanner,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    statusTab,
    setStatusTab,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredDrugs,
    metrics,
    showAddModal,
    setShowAddModal,
    showImportModal,
    setShowImportModal,
    showAdjustModal,
    setShowAdjustModal,
    editingDrug,
    setEditingDrug,
    adjustingDrug,
    setAdjustingDrug,
    handleExportCSV,
    handleQuickStockAdjust,
  } = useStockInventory({
    drugs,
    onAddDrug,
    onUpdateDrug,
  });

  const categories = [
    'All',
    'Antibiotics',
    'Analgesics',
    'Cardiovascular',
    'Diabetes',
    'Respiratory',
    'OTC & Supplements',
    'Gastrointestinal',
  ];

  // Add / Edit Form State
  const [formData, setFormData] = useState<Partial<DrugItem>>({
    brandName: '',
    genericName: '',
    barcode: `${Math.floor(Math.random() * 9000000000000 + 1000000000000)}`,
    batchNumber: 'BATCH-2026-01',
    category: 'Antibiotics',
    shelfLocation: 'Rack A-01',
    costPrice: 5000,
    sellingPrice: 8000,
    stockQty: 50,
    reorderLevel: 15,
    expiryDate: '2027-12-31',
    manufacturer: 'Uganda Pharma Dist',
    prescriptionRequired: false,
    unit: 'pack (30 tablets)',
  });

  // Stock Adjustment Form State
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Periodic Physical Count');

  // CSV Import State
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [importParsedDrugs, setImportParsedDrugs] = useState<Omit<DrugItem, 'id'>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleOpenAddModal = () => {
    setEditingDrug(null);
    setFormData({
      brandName: '',
      genericName: '',
      barcode: `${Math.floor(Math.random() * 9000000000000 + 1000000000000)}`,
      batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
      category: 'Antibiotics',
      shelfLocation: 'Rack A-01',
      costPrice: 5000,
      sellingPrice: 8000,
      stockQty: 50,
      reorderLevel: 15,
      expiryDate: '2027-12-31',
      manufacturer: 'Uganda Pharma Dist',
      prescriptionRequired: false,
      unit: 'pack (30 tablets)',
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (drug: DrugItem) => {
    setEditingDrug(drug);
    setFormData(drug);
    setShowAddModal(true);
  };

  const handleOpenAdjustModal = (drug: DrugItem) => {
    setAdjustingDrug(drug);
    setAdjustQty(drug.stockQty);
    setShowAdjustModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.genericName) return;

    if (editingDrug) {
      onUpdateDrug({
        ...editingDrug,
        ...(formData as DrugItem),
      });
    } else {
      const newDrug: DrugItem = {
        id: `DRUG-${Math.floor(Math.random() * 9000 + 1000)}`,
        ...(formData as DrugItem),
      };
      onAddDrug(newDrug);
    }
    setShowAddModal(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustingDrug) {
      handleQuickStockAdjust(adjustingDrug, adjustQty);
      setShowAdjustModal(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { drugs: parsed, errors } = parseCSVToDrugs(text);
      setImportParsedDrugs(parsed);
      setImportErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importParsedDrugs.length === 0) return;
    importParsedDrugs.forEach((d, idx) => {
      onAddDrug({
        id: `DRUG-IMP-${Date.now()}-${idx}`,
        ...d,
      });
    });
    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
      setShowImportModal(false);
      setImportParsedDrugs([]);
      setImportErrors([]);
    }, 1500);
  };

  const toggleSort = (field: 'name' | 'stock' | 'expiry' | 'value') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Financial Valuation & Safety Metrics Banner ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost Valuation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Cost Valuation
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatUGX(metrics.totalCostVal)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{metrics.totalStockItems} SKU items registered</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Projected Retail Turnover */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Potential Retail Turnover
            </span>
            <div className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
              {formatUGX(metrics.totalSellingVal)}
            </div>
            <p className="text-xs text-green-600 font-semibold mt-0.5">
              ~{metrics.overallMargin}% Est. Gross Margin
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Reorder Items
            </span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {metrics.lowStockCount} Items
            </div>
            <p className="text-xs text-slate-400 mt-0.5">At or below reorder threshold</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* FEFO Expiry Risk */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              FEFO Expiry Risk
            </span>
            <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
              {metrics.fefoCriticalCount + metrics.fefoWarningCount} Batches
            </div>
            <p className="text-xs text-red-500 font-medium mt-0.5">
              {metrics.fefoCriticalCount} critical (&lt;30d) • {metrics.fefoWarningCount} warning
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Decongested Control Bar & Action Toolbar ──────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        {/* Row 1: Search & Action Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand name, generic name, batch#, NDC or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 justify-end">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Export Stock Valuation CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Bulk Import Drugs via CSV"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={openBarcodeScanner}
              className="px-3 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Scan Optical Barcode"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Scan Barcode</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 text-xs font-bold bg-[#16A34A] hover:bg-green-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter Tabs & Category Filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          {/* Status Tabs */}
          <div className="flex items-center flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'All Inventory', count: drugs.length },
                { id: 'lowStock', label: 'Low Stock Alert', count: metrics.lowStockCount },
                { id: 'fefoRisk', label: 'FEFO Risk (<90d)', count: metrics.fefoCriticalCount + metrics.fefoWarningCount },
                { id: 'rxOnly', label: 'Rx Required', count: drugs.filter((d) => d.prescriptionRequired).length },
              ] as const
            ).map((tab) => {
              const isActive = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Dropdown & Quick Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Therapeutic Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Inventory Table ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 select-none">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Medication & Formulation</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5">Batch # & Location</th>
                <th
                  onClick={() => toggleSort('expiry')}
                  className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>FEFO Expiry Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 text-right">Cost / Selling</th>
                <th
                  onClick={() => toggleSort('stock')}
                  className="p-3.5 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Stock Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('value')}
                  className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Stock Valuation</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDrugs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No medications found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredDrugs.map((drug) => {
                  const stockPercent = Math.min(100, Math.round((drug.stockQty / (drug.reorderLevel * 3)) * 100));

                  return (
                    <tr
                      key={drug.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Medication & Formulation */}
                      <td className="p-3.5">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {drug.brandName}
                              {drug.prescriptionRequired && (
                                <span className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-red-200 dark:border-red-800">
                                  Rx
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {drug.genericName} • {drug.unit}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              UPC: {drug.barcode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Batch & Location */}
                      <td className="p-3.5">
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {drug.batchNumber}
                        </span>
                        <div className="text-slate-500 text-[11px] mt-0.5">{drug.shelfLocation}</div>
                        <div className="text-slate-400 text-[10px]">{drug.manufacturer}</div>
                      </td>

                      {/* FEFO Expiry Status */}
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {drug.expiryDate}
                        </div>
                        <div className="mt-1">
                          {drug.fefoRisk === 'expired' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                              EXPIRED ({Math.abs(drug.daysUntilExpiry)}d ago)
                            </span>
                          ) : drug.fefoRisk === 'critical' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                              CRITICAL ({drug.daysUntilExpiry}d left)
                            </span>
                          ) : drug.fefoRisk === 'warning' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              WARNING ({drug.daysUntilExpiry}d left)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Healthy ({drug.daysUntilExpiry}d)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pricing & Margin */}
                      <td className="p-3.5 text-right">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {formatUGX(drug.sellingPrice)}
                        </div>
                        <div className="text-slate-400 text-[11px]">Cost: {formatUGX(drug.costPrice)}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          +{drug.profitMarginPercent}% Margin
                        </span>
                      </td>

                      {/* Stock Level Bar */}
                      <td className="p-3.5 text-center">
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {drug.stockQty}
                        </div>
                        <div className="w-20 mx-auto bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              drug.isLowStock ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Min: {drug.reorderLevel}</div>
                      </td>

                      {/* Valuation */}
                      <td className="p-3.5 text-right">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {formatUGX(drug.totalCostValue)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Ret: {formatUGX(drug.totalSellingValue)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(drug)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                            title="Quick Stock Count Adjustment"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(drug)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 rounded-lg text-sky-600 dark:text-sky-400 transition-colors"
                            title="Edit Drug Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal 1: Add / Edit Drug Item ─────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 text-slate-900">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                {editingDrug ? 'Edit Drug Master Record' : 'Register New Drug in Inventory'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.brandName || ''}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. Augmentin 625mg"
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Generic / INN Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.genericName || ''}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Amoxicillin + Clavulanic Acid"
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formData.category || 'Antibiotics'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {categories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber || ''}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full mt-1 p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Cost Price (UGX) *</label>
                  <input
                    type="number"
                    required
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Selling Price (UGX) *</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQty ?? 0}
                    onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Reorder Threshold *</label>
                  <input
                    type="number"
                    required
                    value={formData.reorderLevel ?? 10}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Expiry Date (FEFO) *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Shelf / Rack Location</label>
                  <input
                    type="text"
                    value={formData.shelfLocation || ''}
                    onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                    placeholder="e.g. Rack B-04"
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Barcode / UPC</label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full mt-1 p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.prescriptionRequired || false}
                    onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <span>Requires Doctor Prescription (Class A/B Controlled)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0284C7] hover:bg-sky-600 text-white font-bold rounded-xl shadow-md"
                >
                  {editingDrug ? 'Update Record' : 'Save Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Quick Stock Adjustment ───────────────────────────────── */}
      {showAdjustModal && adjustingDrug && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <RefreshCw className="w-5 h-5 text-sky-500" />
                Physical Stock Adjustment
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl text-xs space-y-1">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {adjustingDrug.brandName}
              </div>
              <div className="text-slate-500">Batch: {adjustingDrug.batchNumber} • Current: {adjustingDrug.stockQty}</div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Verified Physical Count *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Adjustment Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="Periodic Physical Count">Periodic Physical Count Verification</option>
                  <option value="Damaged / Expired Wastage">Damaged / Broken / Expired Wastage</option>
                  <option value="Supplier Return">Supplier Return</option>
                  <option value="Dispensing Reconciliation">Dispensing Reconciliation</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Bulk CSV Import ──────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 text-slate-900">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Bulk Import Drugs via CSV
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportParsedDrugs([]);
                  setImportErrors([]);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div
                onClick={() => csvFileRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 rounded-2xl p-6 text-center bg-emerald-50/40 dark:bg-emerald-950/20 cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={csvFileRef}
                  accept=".csv,text/csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Select or drag a CSV inventory spreadsheet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Expected headers: Brand Name, Generic Name, Category, Batch Number, Cost Price, Selling Price, Stock Qty, Expiry Date
                </p>
              </div>

              {importErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 rounded-xl text-red-700 dark:text-red-300">
                  <div className="font-bold">Import Warnings:</div>
                  <ul className="list-disc pl-4 mt-1">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importParsedDrugs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Parsed {importParsedDrugs.length} Drug Items Ready for Import:</span>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-semibold">
                        <tr>
                          <th className="p-2">Brand</th>
                          <th className="p-2">Generic</th>
                          <th className="p-2">Batch</th>
                          <th className="p-2 text-right">Cost</th>
                          <th className="p-2 text-right">Selling</th>
                          <th className="p-2 text-center">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {importParsedDrugs.map((d, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold">{d.brandName}</td>
                            <td className="p-2 text-slate-500">{d.genericName}</td>
                            <td className="p-2 font-mono">{d.batchNumber}</td>
                            <td className="p-2 text-right">{formatUGX(d.costPrice)}</td>
                            <td className="p-2 text-right">{formatUGX(d.sellingPrice)}</td>
                            <td className="p-2 text-center font-bold">{d.stockQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Successfully imported all drug items into inventory!</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={importParsedDrugs.length === 0}
                  onClick={handleConfirmImport}
                  className={`px-6 py-2 rounded-xl font-bold text-white shadow-md ${
                    importParsedDrugs.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Import {importParsedDrugs.length} Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
