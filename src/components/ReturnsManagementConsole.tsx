import React, { useState } from 'react';
import {
  MedicineReturnRecord,
  ReturnType,
  ReturnReason,
  ReturnDisposition,
  RefundPaymentMethod,
  ReturnDispositionEvaluation,
} from '../types';
import { returnsManagementService } from '../services/returnsManagementService';
import { getMasterMedicines } from '../services/medicineSafetyService';
import { formatUGX } from '../services/formatters';
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  Package,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Truck,
  DollarSign,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Eye,
  Check,
  X,
  Sparkles,
  MapPin,
  FileText,
  AlertOctagon,
} from 'lucide-react';

export const ReturnsManagementConsole: React.FC = () => {
  const [returns, setReturns] = useState<MedicineReturnRecord[]>(
    returnsManagementService.getAllReturns()
  );
  const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'supplier' | 'dispositionBoard'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('all');
  const [selectedDispositionFilter, setSelectedDispositionFilter] = useState<string>('all');

  // Modals
  const [selectedReturn, setSelectedReturn] = useState<MedicineReturnRecord | null>(null);
  const [showNewCustomerReturnModal, setShowNewCustomerReturnModal] = useState(false);
  const [showNewSupplierReturnModal, setShowNewSupplierReturnModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Customer Return Form State
  const [custForm, setCustForm] = useState({
    drugName: 'Paracetamol 500mg Tablets (Box of 100)',
    brandName: 'Panadol Extra',
    genericName: 'Paracetamol',
    batchNumber: 'BAT-2026-AUG01',
    expiryDate: '2028-01-10',
    quantityReturned: 1,
    unitPriceUgx: 7500,
    customerName: '',
    customerPhone: '',
    originalReceiptNumber: `RCP-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    reason: 'wrong_medicine' as ReturnReason,
    isPackageOpened: false,
    isColdChainBreached: false,
    physicalInspectionNotes: '',
    refundMethod: 'cash_refund' as RefundPaymentMethod,
    replacementBatchNumber: '',
  });

  // Supplier Return Form State
  const [suppForm, setSuppForm] = useState({
    drugName: 'Co-Amoxiclav 625mg Tablets (Box of 14)',
    brandName: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    batchNumber: 'BAT-2026-AMX09',
    expiryDate: '2027-11-20',
    quantityReturned: 20,
    unitPriceUgx: 28000,
    supplierName: 'Abacus Pharma Africa Ltd',
    purchaseOrderNumber: 'PO-2026-0792',
    goodsReceivedNoteNumber: 'GRN-2026-0174',
    supplierCreditNoteNumber: `SCN-AB-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
    reason: 'defective_packaging' as ReturnReason,
    physicalInspectionNotes: 'Blister foil micro-perforations detected upon storage review.',
    disposition: 'supplier_return_rtv' as ReturnDisposition,
  });

  // Inspection Decision Form State
  const [inspectionDecision, setInspectionDecision] = useState({
    finalDisposition: 'restock_saleable' as ReturnDisposition,
    refundMethod: 'cash_refund' as RefundPaymentMethod,
    targetLocation: '',
    notes: '',
  });

  const refreshData = () => {
    setReturns(returnsManagementService.getAllReturns());
  };

  const kpis = returnsManagementService.getReturnsKPIs();

  // Dynamic Rule Evaluation for Customer Return Form
  const dynamicEvaluation: ReturnDispositionEvaluation = returnsManagementService.evaluateReturnDisposition({
    returnType: 'customer_return',
    reason: custForm.reason,
    isPackageOpened: custForm.isPackageOpened,
    isColdChainBreached: custForm.isColdChainBreached,
  });

  const filteredReturns = returns.filter((r) => {
    const matchesSearch =
      r.returnReferenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customerName && r.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.supplierName && r.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.originalReceiptNumber && r.originalReceiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      activeTab === 'all' ||
      activeTab === 'dispositionBoard' ||
      (activeTab === 'customer' && r.returnType === 'customer_return') ||
      (activeTab === 'supplier' && r.returnType === 'supplier_return');

    const matchesReason = selectedReasonFilter === 'all' || r.reason === selectedReasonFilter;
    const matchesDisposition = selectedDispositionFilter === 'all' || r.disposition === selectedDispositionFilter;

    return matchesSearch && matchesType && matchesReason && matchesDisposition;
  });

  const getReasonLabel = (reason: ReturnReason) => {
    switch (reason) {
      case 'wrong_medicine':
        return 'Wrong Medicine';
      case 'damaged_product':
        return 'Damaged Product';
      case 'expired_product':
        return 'Expired Product';
      case 'recall':
        return 'Mandatory Recall';
      case 'incorrect_quantity':
        return 'Incorrect Quantity';
      case 'delivery_error':
        return 'Delivery Error';
      case 'defective_packaging':
        return 'Defective Packaging';
      case 'adverse_drug_reaction':
        return 'Adverse Drug Reaction';
      case 'treatment_changed_by_doctor':
        return 'Doctor Treatment Change';
      default:
        return reason;
    }
  };

  const getDispositionBadge = (disposition: ReturnDisposition) => {
    switch (disposition) {
      case 'restock_saleable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Restock (Saleable)
          </span>
        );
      case 'quarantine_hold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Quarantine Hold
          </span>
        );
      case 'supplier_return_rtv':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Truck className="w-3.5 h-3.5 text-purple-600" />
            Supplier RTV (Credit)
          </span>
        );
      case 'destruction':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">
            <Flame className="w-3.5 h-3.5 text-slate-600" />
            Destruction (Waste)
          </span>
        );
    }
  };

  const handleCreateCustomerReturn = (e: React.FormEvent) => {
    e.preventDefault();
    returnsManagementService.createReturn({
      tenantId: 'tenant_prime',
      branchId: 'branch_kampala_central',
      returnType: 'customer_return',
      drugId: 'DRUG-001',
      medicineName: custForm.drugName,
      brandName: custForm.brandName,
      genericName: custForm.genericName,
      batchNumber: custForm.batchNumber,
      expiryDate: custForm.expiryDate,
      quantityReturned: Number(custForm.quantityReturned),
      unitPriceUgx: Number(custForm.unitPriceUgx),
      customerName: custForm.customerName || 'Walk-in Customer',
      customerPhone: custForm.customerPhone || '+256 700 000 000',
      originalReceiptNumber: custForm.originalReceiptNumber,
      originalSaleDate: new Date().toISOString(),
      reason: custForm.reason,
      isPackageOpened: custForm.isPackageOpened,
      isColdChainBreached: custForm.isColdChainBreached,
      physicalInspectionNotes: custForm.physicalInspectionNotes || 'Visual inspection verified.',
      disposition: dynamicEvaluation.recommendedDisposition,
      dispositionRationale: dynamicEvaluation.rationale,
      targetStorageLocation: dynamicEvaluation.targetLocationSuggestion,
      refundMethod: custForm.refundMethod,
      refundStatus: custForm.refundMethod === 'none' ? 'denied' : 'refunded',
      replacementBatchNumber: custForm.replacementBatchNumber || undefined,
      status: dynamicEvaluation.recommendedDisposition === 'restock_saleable' ? 'restocked' : 'approved_and_processed',
      initiatedByName: 'Pharm. Brenda Namubiru',
      initiatedByRole: 'Assistant Pharmacist',
      initiatedAt: new Date().toISOString(),
      inspectedByPharmacistName: 'Dr. Elvis Ssekyanzi',
      inspectedByPharmacistRole: 'Supervising Pharmacist',
      inspectedAt: new Date().toISOString(),
      approvedBySupervisorName: 'Dr. Elvis Ssekyanzi',
      approvedAt: new Date().toISOString(),
    });

    refreshData();
    setShowNewCustomerReturnModal(false);
  };

  const handleCreateSupplierReturn = (e: React.FormEvent) => {
    e.preventDefault();
    returnsManagementService.createReturn({
      tenantId: 'tenant_prime',
      branchId: 'branch_kampala_central',
      returnType: 'supplier_return',
      drugId: 'DRUG-003',
      medicineName: suppForm.drugName,
      brandName: suppForm.brandName,
      genericName: suppForm.genericName,
      batchNumber: suppForm.batchNumber,
      expiryDate: suppForm.expiryDate,
      quantityReturned: Number(suppForm.quantityReturned),
      unitPriceUgx: Number(suppForm.unitPriceUgx),
      supplierName: suppForm.supplierName,
      purchaseOrderNumber: suppForm.purchaseOrderNumber,
      goodsReceivedNoteNumber: suppForm.goodsReceivedNoteNumber,
      supplierCreditNoteNumber: suppForm.supplierCreditNoteNumber,
      reason: suppForm.reason,
      isPackageOpened: false,
      isColdChainBreached: false,
      physicalInspectionNotes: suppForm.physicalInspectionNotes,
      disposition: 'supplier_return_rtv',
      dispositionRationale: 'Wholesale return to distributor for credit note with supplier return delivery docket.',
      targetStorageLocation: 'Outbound Supplier Returns Staging Bay',
      refundMethod: 'supplier_credit_note',
      refundStatus: 'credit_issued',
      status: 'credit_note_issued',
      initiatedByName: 'Pharm. Denis Kigozi',
      initiatedByRole: 'Store & Inventory Manager',
      initiatedAt: new Date().toISOString(),
      inspectedByPharmacistName: 'Dr. Elvis Ssekyanzi',
      inspectedByPharmacistRole: 'Supervising Pharmacist',
      inspectedAt: new Date().toISOString(),
      approvedBySupervisorName: 'Dr. Elvis Ssekyanzi',
      approvedAt: new Date().toISOString(),
    });

    refreshData();
    setShowNewSupplierReturnModal(false);
  };

  const handleApproveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    returnsManagementService.approveAndProcessReturn(selectedReturn.id, {
      supervisorName: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
      finalDisposition: inspectionDecision.finalDisposition,
      refundMethod: inspectionDecision.refundMethod,
      targetLocation: inspectionDecision.targetLocation || undefined,
    });

    refreshData();
    setShowInspectionModal(false);
    setSelectedReturn(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              Returns &amp; Disposition Governance (§11.6, §11.20)
            </span>
            <span className="text-xs font-semibold text-slate-500">WHO Good Distribution Practice Aligned</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Enterprise Medicine Returns &amp; Disposition Console
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Full lifecycle control for Patient Customer Returns and Supplier Returns (RTV) with intelligent 4-path routing: <strong>Saleable Restock &bull; Quarantine Hold &bull; Supplier RTV &bull; Destruction</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewCustomerReturnModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Users className="w-4 h-4" />
            Patient / Customer Return
          </button>

          <button
            onClick={() => setShowNewSupplierReturnModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Truck className="w-4 h-4" />
            Supplier Return (RTV)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Returns</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{kpis.totalReturns}</p>
          <span className="text-[10px] text-slate-500">{kpis.customerReturns} Patient | {kpis.supplierReturns} Vendor</span>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Saleable Restocked</span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{kpis.restockedCount}</p>
          <span className="text-[10px] text-emerald-600">Re-entered POS shelves</span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Quarantine Hold</span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{kpis.quarantinedCount}</p>
          <span className="text-[10px] text-amber-600">Pending assay / isolation</span>
        </div>

        <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Supplier RTVs</span>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">{kpis.rtvCount}</p>
          <span className="text-[10px] text-purple-600">Vendor credit notes</span>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Destruction</span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{kpis.destroyedCount}</p>
          <span className="text-[10px] text-rose-600 font-bold">Biohazard / incineration</span>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Refunds / Credits</span>
          <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
            {formatUGX(kpis.totalRefundsIssuedUgx)}
          </p>
          <span className="text-[10px] text-blue-600">Customer &amp; vendor value</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto">
        <div className="flex space-x-2">
          {[
            { id: 'all', label: 'All Returns', count: returns.length },
            { id: 'customer', label: 'Patient Customer Returns', count: kpis.customerReturns },
            { id: 'supplier', label: 'Supplier Returns (RTV)', count: kpis.supplierReturns },
            { id: 'dispositionBoard', label: 'Disposition Board', count: 4 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === tab.id ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab !== 'dispositionBoard' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Return #, Medicine, Batch #, Customer, Supplier, or Receipt #..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedReasonFilter}
                onChange={(e) => setSelectedReasonFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2"
              >
                <option value="all">All Return Reasons</option>
                <option value="wrong_medicine">Wrong Medicine</option>
                <option value="damaged_product">Damaged Product</option>
                <option value="expired_product">Expired Product</option>
                <option value="recall">Mandatory Recall</option>
                <option value="incorrect_quantity">Incorrect Quantity</option>
                <option value="delivery_error">Delivery Error</option>
                <option value="defective_packaging">Defective Packaging</option>
                <option value="adverse_drug_reaction">Adverse Reaction (ADR)</option>
              </select>

              <select
                value={selectedDispositionFilter}
                onChange={(e) => setSelectedDispositionFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2"
              >
                <option value="all">All Dispositions</option>
                <option value="restock_saleable">Restock (Saleable)</option>
                <option value="quarantine_hold">Quarantine Hold</option>
                <option value="supplier_return_rtv">Supplier RTV</option>
                <option value="destruction">Destruction</option>
              </select>
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Return Ref &amp; Type</th>
                    <th className="px-4 py-3">Medicine &amp; Batch</th>
                    <th className="px-4 py-3">Return Reason</th>
                    <th className="px-4 py-3">Qty &amp; Refund Amount</th>
                    <th className="px-4 py-3">Customer / Supplier</th>
                    <th className="px-4 py-3">Disposition &amp; Target Storage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReturns.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Ref & Type */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.returnReferenceNumber}
                        </div>
                        <div className="mt-0.5">
                          {item.returnType === 'customer_return' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                              Customer Return
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                              Supplier RTV
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Medicine */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.medicineName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          Batch: {item.batchNumber} {item.expiryDate && `(Exp: ${item.expiryDate})`}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {getReasonLabel(item.reason)}
                        </span>
                        {item.isPackageOpened && (
                          <div className="text-[10px] text-rose-600 font-bold">Package Opened</div>
                        )}
                        {item.isColdChainBreached && (
                          <div className="text-[10px] text-cyan-600 font-bold">Cold Chain Breached</div>
                        )}
                      </td>

                      {/* Qty & Amount */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.quantityReturned} units
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          {formatUGX(item.totalRefundAmountUgx)}
                        </div>
                        <div className="text-[9px] text-slate-500 capitalize">
                          {item.refundMethod.replace(/_/g, ' ')}
                        </div>
                      </td>

                      {/* Customer / Supplier */}
                      <td className="px-4 py-3.5">
                        {item.returnType === 'customer_return' ? (
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{item.customerName}</div>
                            <div className="text-[10px] text-slate-500">{item.customerPhone}</div>
                            {item.originalReceiptNumber && (
                              <div className="font-mono text-[9px] text-indigo-600">RCP: {item.originalReceiptNumber}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{item.supplierName}</div>
                            <div className="font-mono text-[10px] text-purple-600">PO: {item.purchaseOrderNumber}</div>
                            {item.supplierCreditNoteNumber && (
                              <div className="font-mono text-[9px] text-emerald-600 font-bold">Credit Note: {item.supplierCreditNoteNumber}</div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Disposition */}
                      <td className="px-4 py-3.5">
                        <div>{getDispositionBadge(item.disposition)}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.targetStorageLocation}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                        {item.approvedBySupervisorName && (
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            By {item.approvedBySupervisorName}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReturn(item)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors title='View Traceability'"
                            title="View Return Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedReturn(item);
                              setInspectionDecision({
                                finalDisposition: item.disposition,
                                refundMethod: item.refundMethod,
                                targetLocation: item.targetStorageLocation,
                                notes: item.physicalInspectionNotes || '',
                              });
                              setShowInspectionModal(true);
                            }}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold rounded-lg text-xs transition-colors border border-teal-200 dark:border-teal-800"
                          >
                            Inspect &amp; Route
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Disposition Matrix / Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saleable Restock */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900 pb-2">
              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Saleable Restock ({returns.filter((r) => r.disposition === 'restock_saleable').length})
              </span>
            </div>
            <div className="space-y-2">
              {returns
                .filter((r) => r.disposition === 'restock_saleable')
                .map((r) => (
                  <div key={r.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 shadow-xs text-xs space-y-1">
                    <div className="font-mono font-bold text-emerald-700">{r.returnReferenceNumber}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{r.medicineName}</div>
                    <div className="text-[10px] text-slate-500">Qty: {r.quantityReturned} • Batch: {r.batchNumber}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">Re-admitted to POS shelf stock</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quarantine Hold */}
          <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900 pb-2">
              <span className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Quarantine Hold ({returns.filter((r) => r.disposition === 'quarantine_hold').length})
              </span>
            </div>
            <div className="space-y-2">
              {returns
                .filter((r) => r.disposition === 'quarantine_hold')
                .map((r) => (
                  <div key={r.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900 shadow-xs text-xs space-y-1">
                    <div className="font-mono font-bold text-amber-700">{r.returnReferenceNumber}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{r.medicineName}</div>
                    <div className="text-[10px] text-slate-500">Qty: {r.quantityReturned} • Reason: {getReasonLabel(r.reason)}</div>
                    <div className="text-[10px] text-amber-600 font-medium">{r.targetStorageLocation}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Supplier Return (RTV) */}
          <div className="bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-900 pb-2">
              <span className="font-bold text-xs text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                Supplier RTV ({returns.filter((r) => r.disposition === 'supplier_return_rtv').length})
              </span>
            </div>
            <div className="space-y-2">
              {returns
                .filter((r) => r.disposition === 'supplier_return_rtv')
                .map((r) => (
                  <div key={r.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-purple-100 dark:border-purple-900 shadow-xs text-xs space-y-1">
                    <div className="font-mono font-bold text-purple-700">{r.returnReferenceNumber}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{r.medicineName}</div>
                    <div className="text-[10px] text-slate-500">Vendor: {r.supplierName} • {formatUGX(r.totalRefundAmountUgx)}</div>
                    <div className="text-[10px] text-purple-600 font-medium">{r.supplierCreditNoteNumber ? `Credit Note: ${r.supplierCreditNoteNumber}` : 'Credit Note Pending'}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Destruction */}
          <div className="bg-slate-100/70 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                Destruction ({returns.filter((r) => r.disposition === 'destruction').length})
              </span>
            </div>
            <div className="space-y-2">
              {returns
                .filter((r) => r.disposition === 'destruction')
                .map((r) => (
                  <div key={r.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs text-xs space-y-1">
                    <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{r.returnReferenceNumber}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{r.medicineName}</div>
                    <div className="text-[10px] text-slate-500">Qty: {r.quantityReturned} • Biohazard Protocol</div>
                    <div className="text-[10px] text-rose-600 font-medium">{r.targetStorageLocation}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* New Customer Return Modal */}
      {showNewCustomerReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateCustomerReturn} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Process Patient / Customer Return
              </h3>
              <button
                type="button"
                onClick={() => setShowNewCustomerReturnModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={custForm.drugName}
                  onChange={(e) => setCustForm({ ...custForm, drugName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={custForm.batchNumber}
                  onChange={(e) => setCustForm({ ...custForm, batchNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity Returned *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={custForm.quantityReturned}
                  onChange={(e) => setCustForm({ ...custForm, quantityReturned: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grace Nakato"
                  value={custForm.customerName}
                  onChange={(e) => setCustForm({ ...custForm, customerName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Receipt / Invoice #</label>
                <input
                  type="text"
                  value={custForm.originalReceiptNumber}
                  onChange={(e) => setCustForm({ ...custForm, originalReceiptNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Return Reason *</label>
              <select
                value={custForm.reason}
                onChange={(e) => setCustForm({ ...custForm, reason: e.target.value as ReturnReason })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="wrong_medicine">Wrong Medicine Purchased / Dispensed</option>
                <option value="damaged_product">Damaged Product / Broken Container</option>
                <option value="expired_product">Expired Product</option>
                <option value="recall">Mandatory Medicine Recall</option>
                <option value="incorrect_quantity">Incorrect Quantity Received</option>
                <option value="delivery_error">Delivery Error / Late Delivery</option>
                <option value="defective_packaging">Defective Packaging / Blister Defect</option>
                <option value="adverse_drug_reaction">Adverse Drug Reaction (Allergy)</option>
                <option value="treatment_changed_by_doctor">Doctor Changed Treatment</option>
              </select>
            </div>

            {/* Condition Checkboxes */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={custForm.isPackageOpened}
                  onChange={(e) => setCustForm({ ...custForm, isPackageOpened: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Package is Opened / Seal Broken</span>
              </label>

              <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={custForm.isColdChainBreached}
                  onChange={(e) => setCustForm({ ...custForm, isColdChainBreached: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Cold-Chain Breached / Warmed</span>
              </label>
            </div>

            {/* Intelligent Decision Recommendation Banner */}
            <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Intelligent Disposition Recommendation
                </span>
                <div>{getDispositionBadge(dynamicEvaluation.recommendedDisposition)}</div>
              </div>
              <p className="text-xs text-teal-900 dark:text-teal-200">{dynamicEvaluation.rationale}</p>
              {dynamicEvaluation.warningFlags.map((flag, idx) => (
                <div key={idx} className="text-[10px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {flag}
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer Refund Resolution *</label>
              <select
                value={custForm.refundMethod}
                onChange={(e) => setCustForm({ ...custForm, refundMethod: e.target.value as RefundPaymentMethod })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="cash_refund">Cash Refund at POS Counter</option>
                <option value="store_credit_wallet">ZenithRx Store Credit / Patient Wallet</option>
                <option value="mobile_money_reversal">MTN / Airtel Mobile Money Reversal</option>
                <option value="replacement_exchange">Direct Therapeutic Replacement Exchange</option>
                <option value="none">No Refund Authorized</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewCustomerReturnModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Process Customer Return
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Supplier Return Modal */}
      {showNewSupplierReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateSupplierReturn} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                Dispatch Supplier Return (RTV)
              </h3>
              <button
                type="button"
                onClick={() => setShowNewSupplierReturnModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Wholesale Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={suppForm.supplierName}
                  onChange={(e) => setSuppForm({ ...suppForm, supplierName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={suppForm.drugName}
                  onChange={(e) => setSuppForm({ ...suppForm, drugName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={suppForm.batchNumber}
                  onChange={(e) => setSuppForm({ ...suppForm, batchNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Purchase Order (PO #)</label>
                <input
                  type="text"
                  value={suppForm.purchaseOrderNumber}
                  onChange={(e) => setSuppForm({ ...suppForm, purchaseOrderNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Goods Received Note (GRN #)</label>
                <input
                  type="text"
                  value={suppForm.goodsReceivedNoteNumber}
                  onChange={(e) => setSuppForm({ ...suppForm, goodsReceivedNoteNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity Returned</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={suppForm.quantityReturned}
                  onChange={(e) => setSuppForm({ ...suppForm, quantityReturned: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Vendor Credit Note #</label>
                <input
                  type="text"
                  value={suppForm.supplierCreditNoteNumber}
                  onChange={(e) => setSuppForm({ ...suppForm, supplierCreditNoteNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Supplier Return Reason *</label>
              <select
                value={suppForm.reason}
                onChange={(e) => setSuppForm({ ...suppForm, reason: e.target.value as ReturnReason })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="defective_packaging">Defective Factory Packaging</option>
                <option value="damaged_product">Damaged in Transit / Crushed Vials</option>
                <option value="expired_product">Near Expiry / Expired Lot under Credit Agreement</option>
                <option value="recall">Manufacturer Mandatory Recall</option>
                <option value="wrong_medicine">Supplier Shipped Incorrect SKU / Strength</option>
                <option value="incorrect_quantity">Over-shipment / Excess Stock</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewSupplierReturnModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                Dispatch Supplier RTV
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pharmacist Inspection & Routing Modal */}
      {showInspectionModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleApproveInspection} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                Pharmacist Inspection: {selectedReturn.returnReferenceNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowInspectionModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100">{selectedReturn.medicineName}</div>
              <div className="text-slate-500">
                Batch: <span className="font-mono">{selectedReturn.batchNumber}</span> • Qty: {selectedReturn.quantityReturned} • Value: {formatUGX(selectedReturn.totalRefundAmountUgx)}
              </div>
              <div className="text-slate-500">
                Reason: <span className="font-semibold text-slate-700 dark:text-slate-300">{getReasonLabel(selectedReturn.reason)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Final Disposition Decision *</label>
              <select
                value={inspectionDecision.finalDisposition}
                onChange={(e) => setInspectionDecision({ ...inspectionDecision, finalDisposition: e.target.value as ReturnDisposition })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="restock_saleable">Restock to Saleable POS Stock (Seals &amp; Quality Verified)</option>
                <option value="quarantine_hold">Quarantine Hold (Isolate in Quarantine Cage)</option>
                <option value="supplier_return_rtv">Supplier Return (RTV &amp; Credit Note)</option>
                <option value="destruction">Destruction (Slated for Hazardous Incineration)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Storage Bin / Zone</label>
              <input
                type="text"
                value={inspectionDecision.targetLocation}
                onChange={(e) => setInspectionDecision({ ...inspectionDecision, targetLocation: e.target.value })}
                placeholder="e.g. Aisle 1, Shelf A-03 or Quarantine Safe Cage #2"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Inspection Notes &amp; Clinical Findings</label>
              <textarea
                rows={2}
                value={inspectionDecision.notes}
                onChange={(e) => setInspectionDecision({ ...inspectionDecision, notes: e.target.value })}
                placeholder="Document packaging integrity, seal verification, and final routing sign-off..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowInspectionModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Inspection &amp; Route
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
