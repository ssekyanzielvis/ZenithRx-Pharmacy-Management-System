import React, { useState } from 'react';
import {
  PharmacyBatchItem,
  BatchLifecycleState,
  BatchAuditTrailEntry,
  RecallPatientEntry,
  StorageZoneType,
} from '../types';
import { batchManagementService } from '../services/batchManagementService';
import { formatUGX } from '../services/formatters';
import {
  Boxes,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Package,
  Building2,
  Calendar,
  FileText,
  MapPin,
  DollarSign,
  Truck,
  RotateCcw,
  Flame,
  AlertOctagon,
  Eye,
  Plus,
  Send,
  Lock,
  ArrowRight,
  Download,
  ThermometerSnowflake,
  ShieldCheck,
  X,
  PhoneCall,
  UserCheck,
  History,
} from 'lucide-react';

export const BatchManagementConsole: React.FC = () => {
  const [batches, setBatches] = useState<PharmacyBatchItem[]>(batchManagementService.getAllBatches());
  const [activeTab, setActiveTab] = useState<
    'all' | 'available' | 'quarantined' | 'expired' | 'recalled' | 'damaged' | 'returned' | 'destroyed' | 'recallLedger' | 'auditTrail'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorageZone, setSelectedStorageZone] = useState<string>('all');
  
  // Modals
  const [selectedBatch, setSelectedBatch] = useState<PharmacyBatchItem | null>(null);
  const [showStateTransitionModal, setShowStateTransitionModal] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  
  // Transition Form State
  const [targetState, setTargetState] = useState<BatchLifecycleState>('quarantined');
  const [transitionReason, setTransitionReason] = useState('');
  const [witnessPharmacist, setWitnessPharmacist] = useState('');
  const [regulatoryRef, setRegulatoryRef] = useState('');
  const [transitionQty, setTransitionQty] = useState<number>(0);
  const [newStorageLoc, setNewStorageLoc] = useState('');

  // Recall Form State
  const [recallReason, setRecallReason] = useState('');
  const [recallAuthority, setRecallAuthority] = useState('National Drug Authority (NDA)');
  const [recallRefNo, setRecallRefNo] = useState('NDA-REC-2026-');

  // New Batch Form State
  const [newBatchForm, setNewBatchForm] = useState<Partial<PharmacyBatchItem>>({
    batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
    medicineName: '',
    brandName: '',
    genericName: '',
    dosageForm: 'Tablet',
    strength: '',
    manufacturerName: '',
    countryOfManufacture: 'Uganda',
    expiryDate: '',
    quantityReceived: 100,
    quantityAvailable: 100,
    packSize: 'Box of 100',
    unitOfMeasure: 'tablets',
    purchasePriceUgx: 5000,
    sellingPriceUgx: 8000,
    supplierName: '',
    purchaseOrderNumber: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    goodsReceivedNoteNumber: `GRN-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    storageLocation: 'Aisle 1, Shelf A-01',
    storageZone: 'ambient_shelf',
    temperatureRequirement: '15-25°C Room Temp',
    batchStatus: 'available',
    recallStatus: 'none',
  });

  const refreshData = () => {
    setBatches(batchManagementService.getAllBatches());
  };

  const kpis = batchManagementService.getBatchKPIs();

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.manufacturerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.purchaseOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.goodsReceivedNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.storageLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone = selectedStorageZone === 'all' || b.storageZone === selectedStorageZone;

    if (activeTab === 'all') return matchesSearch && matchesZone;
    if (activeTab === 'recallLedger' || activeTab === 'auditTrail') return true;
    return matchesSearch && matchesZone && b.batchStatus === activeTab;
  });

  const handleStateTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    try {
      batchManagementService.transitionBatchState(selectedBatch.id, targetState, {
        reason: transitionReason || `Status changed to ${targetState}`,
        performedBy: 'Pharm. Elvis Ssekyanzi (PSU #3120)',
        witnessName: witnessPharmacist || undefined,
        regulatoryRef: regulatoryRef || undefined,
        quantity: transitionQty > 0 ? transitionQty : undefined,
        newStorageLocation: newStorageLoc || undefined,
      });

      refreshData();
      setShowStateTransitionModal(false);
      setSelectedBatch(null);
      setTransitionReason('');
      setWitnessPharmacist('');
      setRegulatoryRef('');
    } catch (err: any) {
      alert(err.message || 'Error updating batch state');
    }
  };

  const handleInitiateRecall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    try {
      batchManagementService.initiateRecall(selectedBatch.id, {
        reason: recallReason,
        authority: recallAuthority,
        referenceNumber: recallRefNo,
        initiatedBy: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
        witnessName: witnessPharmacist,
      });

      refreshData();
      setShowRecallModal(false);
      setSelectedBatch(null);
      setRecallReason('');
      setRecallRefNo('NDA-REC-2026-');
    } catch (err: any) {
      alert(err.message || 'Error initiating recall');
    }
  };

  const handleDispatchPatientAlerts = (batchId: string) => {
    const count = batchManagementService.dispatchRecallAlerts(batchId);
    refreshData();
    alert(`Urgent Recall alerts successfully dispatched to ${count} patients via SMS and push notification.`);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchForm.medicineName || !newBatchForm.expiryDate) {
      alert('Please fill in required fields (Medicine Name & Expiry Date)');
      return;
    }

    batchManagementService.createBatch({
      tenantId: 'tenant_prime',
      branchId: 'branch_kampala_central',
      batchNumber: newBatchForm.batchNumber || `BAT-${Date.now().toString().slice(-4)}`,
      drugId: `DRUG-${Date.now().toString().slice(-4)}`,
      medicineName: newBatchForm.medicineName,
      brandName: newBatchForm.brandName || newBatchForm.medicineName,
      genericName: newBatchForm.genericName || newBatchForm.medicineName,
      dosageForm: newBatchForm.dosageForm || 'Tablet',
      strength: newBatchForm.strength || 'Standard',
      manufacturerName: newBatchForm.manufacturerName || 'Generic Lab',
      countryOfManufacture: newBatchForm.countryOfManufacture || 'Uganda',
      manufacturingDate: newBatchForm.manufacturingDate,
      expiryDate: newBatchForm.expiryDate,
      quantityReceived: Number(newBatchForm.quantityReceived) || 100,
      quantityAvailable: Number(newBatchForm.quantityAvailable) || 100,
      quantityQuarantined: 0,
      quantityDamaged: 0,
      quantityReturned: 0,
      quantityDestroyed: 0,
      packSize: newBatchForm.packSize || 'Box of 100',
      unitOfMeasure: newBatchForm.unitOfMeasure || 'tablets',
      purchasePriceUgx: Number(newBatchForm.purchasePriceUgx) || 5000,
      sellingPriceUgx: Number(newBatchForm.sellingPriceUgx) || 8000,
      supplierName: newBatchForm.supplierName || 'General Distributor',
      purchaseOrderNumber: newBatchForm.purchaseOrderNumber || 'PO-2026-001',
      goodsReceivedNoteNumber: newBatchForm.goodsReceivedNoteNumber || 'GRN-2026-001',
      receivedDate: new Date().toISOString(),
      receivedBy: 'Pharm. Elvis Ssekyanzi',
      storageLocation: newBatchForm.storageLocation || 'Aisle 1, Shelf A-01',
      storageZone: (newBatchForm.storageZone as StorageZoneType) || 'ambient_shelf',
      temperatureRequirement: newBatchForm.temperatureRequirement || '15-25°C Room Temp',
      isColdChain: newBatchForm.storageZone === 'cold_chain_fridge_2_8',
      isLightSensitive: false,
      batchStatus: 'available',
      recallStatus: 'none',
    });

    refreshData();
    setShowNewBatchModal(false);
  };

  const getStatusBadge = (status: BatchLifecycleState) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Available (FEFO Active)
          </span>
        );
      case 'quarantined':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Quarantined (Hold)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            Expired (Locked)
          </span>
        );
      case 'recalled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-xs">
            <AlertOctagon className="w-3.5 h-3.5" />
            Recalled (Mandatory)
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            Damaged
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            Returned to Supplier
          </span>
        );
      case 'destroyed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">
            <Flame className="w-3.5 h-3.5 text-slate-600" />
            Destroyed (Disposed)
          </span>
        );
    }
  };

  const getStorageZoneLabel = (zone: StorageZoneType) => {
    switch (zone) {
      case 'ambient_shelf':
        return 'Ambient Shelf';
      case 'cold_chain_fridge_2_8':
        return 'Cold-Chain Refrigerator (2-8°C)';
      case 'frozen_freezer_minus_20':
        return 'Deep Freezer (-20°C)';
      case 'schedule_1_poison_safe':
        return 'Schedule 1 Narcotic Safe';
      case 'quarantine_cage_isolated':
        return 'Quarantine Isolation Cage';
      case 'damaged_returns_bay':
        return 'Damaged & Returns Bay';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5" />
              Batch Lifecycle &amp; Recall Governance (§11.6, §11.20)
            </span>
            <span className="text-xs font-semibold text-slate-500">NDA Uganda Good Pharmacy Practice</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Enterprise Pharmaceutical Batch Control &amp; Recall Center
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Full lifecycle traceability from Purchase Order &amp; Goods Received Note (GRN) to 7-State isolation, FEFO dispensing, storage zone monitoring, and emergency patient recall broadcast.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewBatchModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Receive / Add New Batch
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Batches</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{kpis.totalBatches}</p>
          <span className="text-[10px] text-slate-500">All registered lots</span>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Available (FEFO)</span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{kpis.availableCount}</p>
          <span className="text-[10px] text-emerald-600">{formatUGX(kpis.totalValuationUgx)} value</span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Quarantined</span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{kpis.quarantinedCount}</p>
          <span className="text-[10px] text-amber-600">Pending assay/hold</span>
        </div>

        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Recalled</span>
          <p className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">{kpis.recalledCount}</p>
          <span className="text-[10px] text-red-600 font-bold">Mandatory freeze</span>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Expired</span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{kpis.expiredCount}</p>
          <span className="text-[10px] text-rose-600">Locked from sale</span>
        </div>

        <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Damaged</span>
          <p className="text-2xl font-black text-orange-700 dark:text-orange-300 mt-1">{kpis.damagedCount}</p>
          <span className="text-[10px] text-orange-600">Physical loss</span>
        </div>

        <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Returned/Destroyed</span>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">{kpis.returnedCount + kpis.destroyedCount}</p>
          <span className="text-[10px] text-purple-600">{kpis.returnedCount} RTV | {kpis.destroyedCount} Disposed</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex space-x-1">
          {[
            { id: 'all', label: 'All Batches', count: batches.length },
            { id: 'available', label: 'Available', count: kpis.availableCount },
            { id: 'quarantined', label: 'Quarantined', count: kpis.quarantinedCount },
            { id: 'recalled', label: 'Recalled', count: kpis.recalledCount },
            { id: 'expired', label: 'Expired', count: kpis.expiredCount },
            { id: 'damaged', label: 'Damaged', count: kpis.damagedCount },
            { id: 'returned', label: 'Returned (RTV)', count: kpis.returnedCount },
            { id: 'destroyed', label: 'Destroyed', count: kpis.destroyedCount },
            { id: 'recallLedger', label: 'Recall Patient Outreach', count: batchManagementService.getRecallPatientLedger().length },
            { id: 'auditTrail', label: 'Batch Audit Trail', count: batchManagementService.getBatchAuditTrail().length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab !== 'recallLedger' && activeTab !== 'auditTrail' ? (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Batch #, Medicine Name, Manufacturer, Supplier, PO #, GRN #, or Storage Location..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedStorageZone}
                onChange={(e) => setSelectedStorageZone(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Storage Zones</option>
                <option value="ambient_shelf">Ambient Shelves</option>
                <option value="cold_chain_fridge_2_8">Cold-Chain (2-8°C)</option>
                <option value="schedule_1_poison_safe">Schedule 1 Narcotic Safe</option>
                <option value="quarantine_cage_isolated">Quarantine Isolation Cages</option>
                <option value="damaged_returns_bay">Damaged &amp; Returns Bay</option>
              </select>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Batch &amp; Product</th>
                    <th className="px-4 py-3">Manufacturer &amp; Origin</th>
                    <th className="px-4 py-3">Procurement (PO / GRN)</th>
                    <th className="px-4 py-3">Expiry &amp; Age</th>
                    <th className="px-4 py-3">Quantities (Avail/Rec)</th>
                    <th className="px-4 py-3">Storage Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredBatches.map((batch) => {
                    const daysToExpiry = Math.ceil(
                      (new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 90;
                    const isExpired = daysToExpiry <= 0;

                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Batch & Product */}
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {batch.batchNumber}
                          </div>
                          <div className="font-semibold text-blue-700 dark:text-blue-400 text-xs mt-0.5">
                            {batch.medicineName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {batch.dosageForm} • {batch.strength} • {batch.packSize}
                          </div>
                        </td>

                        {/* Manufacturer */}
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900 dark:text-slate-200">
                            {batch.manufacturerName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span>{batch.countryOfManufacture}</span>
                            {batch.manufacturingDate && (
                              <span>• Mfg: {batch.manufacturingDate}</span>
                            )}
                          </div>
                        </td>

                        {/* Procurement */}
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-slate-900 dark:text-slate-200 text-[11px]">
                            {batch.purchaseOrderNumber}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            GRN: {batch.goodsReceivedNoteNumber}
                          </div>
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            {batch.supplierName}
                          </div>
                        </td>

                        {/* Expiry */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {batch.expiryDate}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {isExpired ? (
                              <span className="text-rose-600 font-bold">Expired {Math.abs(daysToExpiry)} days ago</span>
                            ) : isExpiringSoon ? (
                              <span className="text-amber-600 font-bold">Expires in {daysToExpiry} days</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">{daysToExpiry} days valid</span>
                            )}
                          </div>
                        </td>

                        {/* Quantities & Pricing */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                            <span className="text-sm">{batch.quantityAvailable}</span>
                            <span className="text-[10px] text-slate-400 font-normal">/ {batch.quantityReceived} {batch.unitOfMeasure}</span>
                          </div>
                          {batch.quantityQuarantined > 0 && (
                            <div className="text-[10px] text-amber-600 font-bold">
                              {batch.quantityQuarantined} in Quarantine
                            </div>
                          )}
                          {batch.quantityDamaged > 0 && (
                            <div className="text-[10px] text-orange-600 font-bold">
                              {batch.quantityDamaged} Damaged
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Buy: {formatUGX(batch.purchasePriceUgx)} | Sell: {formatUGX(batch.sellingPriceUgx)}
                          </div>
                        </td>

                        {/* Storage Location */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-slate-900 dark:text-slate-200 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{batch.storageLocation}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {getStorageZoneLabel(batch.storageZone)}
                          </div>
                          {batch.isColdChain && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-200 mt-0.5">
                              <ThermometerSnowflake className="w-3 h-3" />
                              2-8°C Cold Chain
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <div>{getStatusBadge(batch.batchStatus)}</div>
                          {batch.recallStatus !== 'none' && (
                            <div className="mt-1">
                              <span className="text-[10px] font-bold text-red-600 uppercase bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                                Recall: {batch.recallStatus.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBatch(batch)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors title='View Batch Details'"
                              title="View Full Batch Traceability"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedBatch(batch);
                                setTargetState(batch.batchStatus === 'available' ? 'quarantined' : 'available');
                                setTransitionQty(batch.quantityAvailable || batch.quantityQuarantined || 0);
                                setShowStateTransitionModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Change State
                            </button>

                            {batch.batchStatus !== 'recalled' ? (
                              <button
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setShowRecallModal(true);
                                }}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60 font-bold rounded-lg text-xs transition-colors border border-red-200 dark:border-red-800"
                              >
                                Recall
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDispatchPatientAlerts(batch.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <Send className="w-3 h-3" />
                                Alert Patients
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'recallLedger' ? (
        /* Recall Patient Outreach Ledger */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Recalled Batch Patient Safety Outreach Register
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients who received medicine from quarantined or recalled batches with real-time SMS delivery status and pharmacist contact notes.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Recalled Batch &amp; Drug</th>
                  <th className="px-4 py-3">Prescription / Dispensed</th>
                  <th className="px-4 py-3">Outreach Status</th>
                  <th className="px-4 py-3">Pharmacist Clinical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchManagementService.getRecallPatientLedger().map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                      {item.patientName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {item.patientPhone}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-red-600">{item.batchNumber}</div>
                      <div className="text-slate-700 dark:text-slate-300">{item.drugName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px]">{item.prescriptionId}</div>
                      <div className="text-[10px] text-slate-500">{item.quantityDispensed} units on {new Date(item.dispensedDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      {item.alertStatus === 'sms_dispatched' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                          SMS Dispatched
                        </span>
                      )}
                      {item.alertStatus === 'patient_contacted' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          Patient Contacted
                        </span>
                      )}
                      {item.alertStatus === 'returned_to_pharmacy' && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                          Pack Returned &amp; Exchanged
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs italic">
                      {item.contactNotes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Batch Audit Trail */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Cryptographic Batch Audit Trail &amp; Chain of Custody
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable logging of all state transitions, quarantine orders, recalls, and witnessed destructions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Batch #</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">State Change</th>
                  <th className="px-4 py-3">Units Affected</th>
                  <th className="px-4 py-3">Reason / Details</th>
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3">Witness / Reg Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchManagementService.getBatchAuditTrail().map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(audit.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {audit.batchNumber}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {audit.actionType}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {audit.previousState ? `${audit.previousState} → ` : ''}{audit.newState}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {audit.quantityAffected}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {audit.reason}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                      {audit.performedByName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                      {audit.witnessName && <div>Witness: {audit.witnessName}</div>}
                      {audit.regulatoryReference && <div>Ref: {audit.regulatoryReference}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Traceability Details Modal */}
      {selectedBatch && !showStateTransitionModal && !showRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {selectedBatch.batchNumber}
                  </span>
                  {getStatusBadge(selectedBatch.batchStatus)}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {selectedBatch.medicineName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">DOSAGE FORM &amp; STRENGTH</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBatch.dosageForm} • {selectedBatch.strength}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">MANUFACTURER</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBatch.manufacturerName} ({selectedBatch.countryOfManufacture})</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">EXPIRY DATE</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBatch.expiryDate}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">PURCHASE ORDER (PO)</span>
                <span className="font-mono font-bold text-indigo-600">{selectedBatch.purchaseOrderNumber}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">GOODS RECEIVED NOTE (GRN)</span>
                <span className="font-mono font-bold text-indigo-600">{selectedBatch.goodsReceivedNoteNumber}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">SUPPLIER VENDOR</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBatch.supplierName}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">STORAGE LOCATION</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBatch.storageLocation}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">STORAGE ZONE</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{getStorageZoneLabel(selectedBatch.storageZone)}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">TEMPERATURE SPEC</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBatch.temperatureRequirement}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">AVAILABLE STOCK</span>
                <span className="font-bold text-emerald-600 text-sm">{selectedBatch.quantityAvailable} / {selectedBatch.quantityReceived} {selectedBatch.unitOfMeasure}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">UNIT PURCHASE PRICE</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatUGX(selectedBatch.purchasePriceUgx)}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">UNIT SELLING PRICE</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatUGX(selectedBatch.sellingPriceUgx)}</span>
              </div>
            </div>

            {/* Recall & Quality Alert Notes */}
            {selectedBatch.recallReason && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" />
                  Recall / Quarantine Documentation ({selectedBatch.recallReferenceNumber})
                </span>
                <p className="text-xs text-red-800 dark:text-red-300">{selectedBatch.recallReason}</p>
                <div className="text-[10px] text-red-600 font-medium">
                  Enforced by: {selectedBatch.recallAuthority} • Initiated by: {selectedBatch.recallInitiatedBy}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowStateTransitionModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Transition Batch State
                </button>
                {selectedBatch.batchStatus !== 'recalled' && (
                  <button
                    onClick={() => {
                      setShowRecallModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Initiate Mandatory Recall
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State Transition Modal */}
      {showStateTransitionModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleStateTransition} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                Change Batch State: {selectedBatch.batchNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowStateTransitionModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Lifecycle State</label>
              <select
                value={targetState}
                onChange={(e) => setTargetState(e.target.value as BatchLifecycleState)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="available">Available (Release to Active POS &amp; FEFO)</option>
                <option value="quarantined">Quarantined (Isolate &amp; Hold from Sale)</option>
                <option value="expired">Expired (Lock Batch)</option>
                <option value="damaged">Damaged (Physical Loss / Transit Defect)</option>
                <option value="returned">Returned to Supplier (RTV)</option>
                <option value="destroyed">Destroyed (Certified Disposal)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity Affected</label>
              <input
                type="number"
                value={transitionQty}
                onChange={(e) => setTransitionQty(Number(e.target.value))}
                max={selectedBatch.quantityAvailable + selectedBatch.quantityQuarantined}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">New Physical Storage Location</label>
              <input
                type="text"
                value={newStorageLoc}
                onChange={(e) => setNewStorageLoc(e.target.value)}
                placeholder="e.g. Quarantine Isolation Cage #2 / Damaged Bay"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinical / Operational Justification *</label>
              <textarea
                required
                rows={2}
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="Document reason for state transition, inspection findings, or assay reports..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Witness Pharmacist (Optional)</label>
                <input
                  type="text"
                  value={witnessPharmacist}
                  onChange={(e) => setWitnessPharmacist(e.target.value)}
                  placeholder="e.g. Pharm. Sarah Akello"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">NDA / Lab Ref # (Optional)</label>
                <input
                  type="text"
                  value={regulatoryRef}
                  onChange={(e) => setRegulatoryRef(e.target.value)}
                  placeholder="e.g. NDA-QC-2026-90"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowStateTransitionModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm State Transition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Emergency Recall Modal */}
      {showRecallModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleInitiateRecall} className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-black text-red-600">
                  Initiate Mandatory Product Recall
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecallModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-xs text-red-800 dark:text-red-300">
              <strong>WARNING:</strong> Initiating a recall will immediately freeze batch <span className="font-mono font-bold">{selectedBatch.batchNumber}</span> across all sales registers, transfer units to the isolation quarantine cage, and prepare patient safety notifications.
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Recall Issuing Authority</label>
              <select
                value={recallAuthority}
                onChange={(e) => setRecallAuthority(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="National Drug Authority (NDA)">National Drug Authority (NDA) Uganda</option>
                <option value="Manufacturer Voluntary Recall">Manufacturer Voluntary Recall</option>
                <option value="Pharmacy Quality Assurance Board">Pharmacy Internal Quality Assurance</option>
                <option value="WHO Medical Product Alert">WHO Medical Product Alert</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">NDA / Recall Reference Number *</label>
              <input
                type="text"
                required
                value={recallRefNo}
                onChange={(e) => setRecallRefNo(e.target.value)}
                placeholder="e.g. NDA-REC-2026-004"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinical Defect &amp; Hazard Description *</label>
              <textarea
                required
                rows={3}
                value={recallReason}
                onChange={(e) => setRecallReason(e.target.value)}
                placeholder="Detail reason: dissolution failure, particulate contamination, potency deviation, labeling error..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRecallModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                Enforce Recall Quarantine
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Batch Intake Modal */}
      {showNewBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateBatch} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Receive &amp; Register New Medicine Batch
              </h3>
              <button
                type="button"
                onClick={() => setShowNewBatchModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={newBatchForm.batchNumber}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, batchNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Medicine / Product Name *</label>
                <input
                  type="text"
                  required
                  value={newBatchForm.medicineName}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, medicineName: e.target.value, brandName: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg Tablets"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Generic / INN Name</label>
                <input
                  type="text"
                  value={newBatchForm.genericName}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, genericName: e.target.value })}
                  placeholder="e.g. Paracetamol"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Manufacturer Name</label>
                <input
                  type="text"
                  value={newBatchForm.manufacturerName}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, manufacturerName: e.target.value })}
                  placeholder="e.g. Cipla Quality Chemicals Uganda"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Manufacturing Date</label>
                <input
                  type="date"
                  value={newBatchForm.manufacturingDate || ''}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, manufacturingDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={newBatchForm.expiryDate}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, expiryDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Purchase Order (PO #)</label>
                <input
                  type="text"
                  value={newBatchForm.purchaseOrderNumber}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, purchaseOrderNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Goods Received Note (GRN #)</label>
                <input
                  type="text"
                  value={newBatchForm.goodsReceivedNoteNumber}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, goodsReceivedNoteNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Supplier Vendor</label>
                <input
                  type="text"
                  value={newBatchForm.supplierName}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, supplierName: e.target.value })}
                  placeholder="e.g. Abacus Pharma Africa"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Storage Location</label>
                <input
                  type="text"
                  value={newBatchForm.storageLocation}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, storageLocation: e.target.value })}
                  placeholder="e.g. Aisle 3, Shelf B2"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Storage Zone</label>
                <select
                  value={newBatchForm.storageZone}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, storageZone: e.target.value as StorageZoneType })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="ambient_shelf">Ambient Shelves</option>
                  <option value="cold_chain_fridge_2_8">Cold-Chain Refrigerator (2-8°C)</option>
                  <option value="schedule_1_poison_safe">Schedule 1 Narcotic Safe</option>
                  <option value="quarantine_cage_isolated">Quarantine Isolation Cage</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity Received</label>
                <input
                  type="number"
                  min={1}
                  value={newBatchForm.quantityReceived}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNewBatchForm({ ...newBatchForm, quantityReceived: val, quantityAvailable: val });
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Purchase Price (UGX)</label>
                <input
                  type="number"
                  value={newBatchForm.purchasePriceUgx}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, purchasePriceUgx: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Selling Price (UGX)</label>
                <input
                  type="number"
                  value={newBatchForm.sellingPriceUgx}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, sellingPriceUgx: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewBatchModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Save &amp; Intake Batch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
