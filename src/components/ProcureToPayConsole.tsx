import React, { useState, useMemo } from 'react';
import {
  ProcureToPayDossier,
  P2PStage,
  PurchaseRequisition,
  P2PPurchaseOrder,
  P2PGoodsReceivedNote,
  P2PQualityInspection,
  P2PSupplierInvoice,
  P2PInvoiceMatchingRecord,
  P2PPaymentVoucher,
} from '../types/v2Types';
import {
  getAllP2PDossiers,
  getP2PKPIs,
  createPurchaseRequisition,
  approvePurchaseRequisition,
  convertRequisitionToPurchaseOrder,
  recordSupplierConfirmation,
  receiveGoodsAndRegisterBatches,
  performQualityVerification,
  recordSupplierInvoice,
  executeThreeWayInvoiceMatch,
  authorizeAndSettlePayment,
  exportP2PToCsv,
  generateP2PAuditReport,
} from '../services/procureToPayService';
import { formatUGX } from '../services/formatters';
import {
  Layers,
  FileText,
  ShoppingCart,
  CheckCircle2,
  PackagePlus,
  ShieldAlert,
  ShieldCheck,
  Receipt,
  Scale,
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  ArrowRight,
  Clock,
  Building2,
  Thermometer,
  Calendar,
  DollarSign,
  Printer,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Truck,
  FileCheck,
} from 'lucide-react';

interface ProcureToPayConsoleProps {
  tenantId?: string;
  pharmacyName?: string;
  currentUser?: {
    name?: string;
    role?: string;
  };
}

export const ProcureToPayConsole: React.FC<ProcureToPayConsoleProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'ZenithRx Central Dispensary & Store',
  currentUser = {
    name: 'Pharm. Elvis Ssekyanzi',
    role: 'Supervising Pharmacist',
  },
}) => {
  const [dossiers, setDossiers] = useState<ProcureToPayDossier[]>(() => getAllP2PDossiers(tenantId));
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(dossiers[0]?.id || null);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<
    | null
    | 'new_pr'
    | 'convert_po'
    | 'confirm_supplier'
    | 'receive_grn'
    | 'qc_inspection'
    | 'record_invoice'
    | 'settle_payment'
    | 'view_audit'
  >(null);

  // Form states for modals
  // New Requisition Form
  const [newPrReason, setNewPrReason] = useState('');
  const [newPrPriority, setNewPrPriority] = useState<'standard' | 'urgent' | 'stockout_emergency'>('standard');
  const [newPrGeneric, setNewPrGeneric] = useState('');
  const [newPrBrand, setNewPrBrand] = useState('');
  const [newPrForm, setNewPrForm] = useState('Tablet');
  const [newPrStrength, setNewPrStrength] = useState('');
  const [newPrQty, setNewPrQty] = useState(100);
  const [newPrUnitCost, setNewPrUnitCost] = useState(25000);
  const [newPrUom, setNewPrUom] = useState('Pack of 28s');
  const [newPrJustification, setNewPrJustification] = useState('');

  // PO conversion form
  const [selectedSupplier, setSelectedSupplier] = useState('sup-001');
  const [poTerms, setPoTerms] = useState('Net 30 Days');
  const [poDeliveryDate, setPoDeliveryDate] = useState('2026-04-05');

  // Supplier Confirmation form
  const [supplierAckRef, setSupplierAckRef] = useState('');
  const [supplierDispatchDate, setSupplierDispatchDate] = useState('2026-04-02');
  const [supplierNotes, setSupplierNotes] = useState('');

  // GRN & Batch Reg form
  const [grnDeliveryNote, setGrnDeliveryNote] = useState('');
  const [grnCarrier, setGrnCarrier] = useState('');
  const [grnVehicle, setGrnVehicle] = useState('');
  const [grnBatchNo, setGrnBatchNo] = useState('');
  const [grnMfgName, setGrnMfgName] = useState('');
  const [grnCountry, setGrnCountry] = useState('Uganda');
  const [grnMfgDate, setGrnMfgDate] = useState('2026-01-15');
  const [grnExpDate, setGrnExpDate] = useState('2028-06-30');
  const [grnStorageLoc, setGrnStorageLoc] = useState('Aisle B - Shelf 2');
  const [grnIsColdChain, setGrnIsColdChain] = useState(false);
  const [grnDeliveredQty, setGrnDeliveredQty] = useState(100);

  // QC inspection form
  const [qcCountOk, setQcCountOk] = useState(true);
  const [qcSealsOk, setQcSealsOk] = useState(true);
  const [qcColdChainOk, setQcColdChainOk] = useState(true);
  const [qcTempC, setQcTempC] = useState<number>(20.5);
  const [qcCoaOk, setQcCoaOk] = useState(true);
  const [qcOutcome, setQcOutcome] = useState<P2PQualityInspection['outcome']>('passed_released_to_stock');
  const [qcRemarks, setQcRemarks] = useState('');

  // Invoice form
  const [invNumber, setInvNumber] = useState('');
  const [invDate, setInvDate] = useState('2026-04-01');
  const [invDueDate, setInvDueDate] = useState('2026-05-01');
  const [invSubtotal, setInvSubtotal] = useState<number>(5000000);
  const [invVat, setInvVat] = useState<number>(0);
  const [invWht, setInvWht] = useState<number>(300000);
  const [invFreight, setInvFreight] = useState<number>(0);
  const [invNotes, setInvNotes] = useState('');

  // Payment form
  const [payMethod, setPayMethod] = useState('Bank Wire / EFT');
  const [payAccount, setPayAccount] = useState('Stanbic Bank A/C 9030001882');
  const [payTxRef, setPayTxRef] = useState('EFT-STANBIC-UG-2026-');
  const [payNotes, setPayNotes] = useState('');

  const kpis = useMemo(() => getP2PKPIs(tenantId), [dossiers, tenantId]);

  const selectedDossier = useMemo(
    () => dossiers.find((d) => d.id === selectedDossierId) || dossiers[0],
    [dossiers, selectedDossierId]
  );

  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const matchesStage = selectedStageFilter === 'all' || d.currentStage === selectedStageFilter;
      const matchesSearch =
        d.dossierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.requisition.prNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.purchaseOrder?.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.purchaseOrder?.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [dossiers, selectedStageFilter, searchQuery]);

  // Handlers
  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrGeneric || !newPrReason) return;

    const lineTotal = newPrQty * newPrUnitCost;
    createPurchaseRequisition({
      tenantId,
      branchName: pharmacyName,
      requestedByName: currentUser.name || 'Dispensing Pharmacist',
      requestedByRole: currentUser.role || 'Supervising Pharmacist',
      priority: newPrPriority,
      requisitionReason: newPrReason,
      estimatedTotalUgx: lineTotal,
      items: [
        {
          id: `pri-${Date.now()}`,
          genericName: newPrGeneric,
          brandName: newPrBrand || undefined,
          dosageForm: newPrForm,
          strength: newPrStrength,
          currentStockLevel: 10,
          reorderLevel: 50,
          requestedQuantity: newPrQty,
          unitOfMeasure: newPrUom,
          estimatedUnitCostUgx: newPrUnitCost,
          lineTotalEstimatedUgx: lineTotal,
          clinicalJustification: newPrJustification,
        },
      ],
    });

    setDossiers(getAllP2PDossiers(tenantId));
    setActiveModal(null);
    setNewPrReason('');
    setNewPrGeneric('');
    setNewPrBrand('');
  };

  const handleApprovePR = (dossierId: string) => {
    approvePurchaseRequisition(
      dossierId,
      currentUser.name || 'Dr. Sarah Nabatanzi',
      currentUser.role || 'Supervising Pharmacist'
    );
    setDossiers(getAllP2PDossiers(tenantId));
  };

  const handleConvertToPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    const supplierDetails =
      selectedSupplier === 'sup-001'
        ? {
            id: 'sup-001',
            name: 'Abacus Pharma (A) Limited',
            licenseNo: 'NDA/WDL/2026/0014',
            email: 'orders@abacuspharma.com',
            phone: '+256 414 340 000',
            paymentTerms: poTerms,
            expectedDeliveryDate: poDeliveryDate,
          }
        : selectedSupplier === 'sup-002'
        ? {
            id: 'sup-002',
            name: 'Laborex Uganda Ltd',
            licenseNo: 'NDA/WDL/2026/0009',
            email: 'orders@laborex-ug.com',
            phone: '+256 414 259 881',
            paymentTerms: poTerms,
            expectedDeliveryDate: poDeliveryDate,
          }
        : {
            id: 'sup-003',
            name: 'Rene Industries Limited',
            licenseNo: 'NDA/WDL/2026/0022',
            email: 'sales@rene.co.ug',
            phone: '+256 414 256 256',
            paymentTerms: poTerms,
            expectedDeliveryDate: poDeliveryDate,
          };

    convertRequisitionToPurchaseOrder(
      selectedDossier.id,
      supplierDetails,
      currentUser.name || 'Pharm. Elvis Ssekyanzi',
      currentUser.role || 'Supervising Pharmacist'
    );

    setDossiers(getAllP2PDossiers(tenantId));
    setActiveModal(null);
  };

  const handleConfirmSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    recordSupplierConfirmation(
      selectedDossier.id,
      supplierAckRef || `ACK-${Date.now()}`,
      supplierDispatchDate,
      supplierNotes
    );

    setDossiers(getAllP2PDossiers(tenantId));
    setActiveModal(null);
  };

  const handleReceiveGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier || !selectedDossier.purchaseOrder) return;

    const firstPoItem = selectedDossier.purchaseOrder.items[0];
    const items = [
      {
        genericName: firstPoItem?.genericName || 'Prescribed Medicine',
        brandName: firstPoItem?.brandName,
        orderedQuantity: firstPoItem?.orderedQuantity || grnDeliveredQty,
        deliveredQuantity: grnDeliveredQty,
        unitOfMeasure: 'Packs',
        batchNumber: grnBatchNo || `BAT-${Date.now().toString().slice(-6)}`,
        manufacturerName: grnMfgName || 'Quality Chemical Industries Ltd',
        countryOfOrigin: grnCountry,
        manufacturingDate: grnMfgDate,
        expiryDate: grnExpDate,
        assignedStorageLocation: grnStorageLoc,
        isColdChain: grnIsColdChain,
        targetTemperatureRange: grnIsColdChain ? '2C - 8C' : '15C - 25C',
      },
    ];

    receiveGoodsAndRegisterBatches(selectedDossier.id, {
      deliveryNoteNumber: grnDeliveryNote || `DN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      waybillCarrierName: grnCarrier || 'Supplier Dedicated Logistics',
      vehicleRegistration: grnVehicle || 'UBK 102M',
      totalPackagesReceived: 4,
      externalCondition: 'Intact outer packaging with tamper seals',
      receivedByName: currentUser.name || 'Store Keeper Derrick',
      receivedByRole: 'Store Keeper & Inventory Tech',
      items,
    });

    setDossiers(getAllP2PDossiers(tenantId));
    setActiveModal(null);
  };

  const handleQcInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier || !selectedDossier.goodsReceivedNote) return;

    const totalQty = selectedDossier.goodsReceivedNote.items.reduce(
      (sum, item) => sum + item.deliveredQuantity,
      0
    );

    performQualityVerification(selectedDossier.id, {
      inspectorPharmacistName: currentUser.name || 'Pharm. Elvis Ssekyanzi',
      inspectorPsuLicenseNo: 'PSU/REG/2026/4092',
      physicalCountVerified: qcCountOk,
      sealsAndLabelingVerified: qcSealsOk,
      coldChainLogVerified: qcColdChainOk,
      temperatureReadoutCelsius: qcTempC,
      certificateOfAnalysisVerified: qcCoaOk,
      outcome: qcOutcome,
      passedQuantity: qcOutcome.includes('passed') ? totalQty : 0,
      quarantinedQuantity: qcOutcome.includes('quarantined') ? totalQty : 0,
      rejectedQuantity: qcOutcome.includes('rejected') ? totalQty : 0,
      qcRemarks: qcRemarks || 'Physical count and manufacturer specifications verified under NDA Good Distribution Practice.',
    });

    setDossiers(getAllP2PDossiers(tenantId));
    setActiveModal(null);
  };

  const handleRecordInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier || !selectedDossier.purchaseOrder) return;

    recordSupplierInvoice(selectedDossier.id, {
      invoiceNumber: invNumber || `INV-SUP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: invDate,
      dueDate: invDueDate,
      subtotalUgx: invSubtotal,
      taxVatUgx: invVat,
      withholdingTaxUgx: invWht,
      freightHandlingUgx: invFreight,
      notes: invNotes,
    });

    // Automatically trigger 3-way matching
    executeThreeWayInvoiceMatch(
      selectedDossier.id,
      currentUser.name || 'Finance Officer Jonathan',
      'Finance & Compliance Officer'
    );

    setDossiers(getAllP2PDossiers(tenantId));
    setActiveModal(null);
  };

  const handleSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier || !selectedDossier.paymentVoucher) return;

    authorizeAndSettlePayment(selectedDossier.id, {
      paymentMethod: payMethod,
      bankAccountOrMomoRef: payAccount,
      transactionReference: payTxRef + Math.floor(100000 + Math.random() * 900000),
      authorizerName: currentUser.name || 'Dr. Sarah Nabatanzi',
      authorizerRole: 'Pharmacy Owner & Director',
      settlementNotes: payNotes || 'Settled and audited in full.',
    });

    setDossiers(getAllP2PDossiers(tenantId));
    setActiveModal(null);
  };

  const handleDownloadCsv = () => {
    const csvData = exportP2PToCsv(tenantId);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ZenithRx_Procure_To_Pay_Pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pipeline stage steps
  const STAGES: { id: P2PStage; label: string; icon: any; short: string }[] = [
    { id: 'requisition', label: '1. Requisition', icon: FileText, short: 'PR' },
    { id: 'purchase_order', label: '2. Purchase Order', icon: ShoppingCart, short: 'PO' },
    { id: 'supplier_confirmation', label: '3. Confirmation', icon: CheckCircle2, short: 'ACK' },
    { id: 'goods_received', label: '4. Goods Received', icon: Truck, short: 'GRN' },
    { id: 'batch_registration', label: '5. Batch Reg', icon: PackagePlus, short: 'BATCH' },
    { id: 'quality_verification', label: '6. QC & Cold Chain', icon: ShieldCheck, short: 'QC' },
    { id: 'invoice', label: '7. Invoice', icon: Receipt, short: 'INV' },
    { id: 'invoice_matching', label: '8. 3-Way Match', icon: Scale, short: 'MATCH' },
    { id: 'payment', label: '9. Payment', icon: CreditCard, short: 'PAY' },
  ];

  const getStageIndex = (stage: P2PStage): number => {
    return STAGES.findIndex((s) => s.id === stage);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Procure-to-Pay (P2P) Engine
            </span>
            <span className="text-xs font-semibold text-slate-500">
              NDA Good Distribution Practice (GDP) &amp; Financial Governance
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Procure-to-Pay (P2P) Workflow Console
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Full 9-stage procurement pipeline: Requisition &rarr; PO &rarr; Confirmation &rarr; GRN &rarr; Batch Reg &rarr; QC &rarr; Invoice &rarr; 3-Way Match &rarr; Payment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setActiveModal('new_pr')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Requisition</span>
          </button>
        </div>
      </div>

      {/* KPI Cockpit */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Active PRs</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {kpis.activeRequisitionsCount}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold">Awaiting Approval</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Open POs</span>
            <ShoppingCart className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {kpis.openPurchaseOrdersCount}
          </p>
          <span className="text-[11px] text-cyan-600 font-semibold">With Wholesalers</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">QC / Cold Chain</span>
            <ShieldAlert className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {kpis.pendingQcInspectionsCount}
          </p>
          <span className="text-[11px] text-indigo-600 font-semibold">Pending Inspection</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Invoices Matching</span>
            <Scale className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {kpis.invoicesAwaitingMatchCount}
          </p>
          <span className="text-[11px] text-rose-600 font-semibold">Exceptions / Variances</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Pending Wire</span>
            <CreditCard className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
            {formatUGX(kpis.authorizedPendingPaymentUgx)}
          </p>
          <span className="text-[11px] text-purple-600 font-semibold">Authorized Vouchers</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">3-Way Match Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {kpis.threeWayMatchPassRatePercent}%
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Exact Compliance</span>
        </div>
      </div>

      {/* 9-Stage Visual Pipeline Stepper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            9-Stage Procure-to-Pay Transformation Pipeline
          </h3>
          <span className="text-xs text-slate-500 font-medium">Click any stage to filter orders</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isFilterActive = selectedStageFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStageFilter(isFilterActive ? 'all' : s.id)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                  isFilterActive
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-2xs">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">{s.short}</span>
                <span className="text-[11px] font-medium leading-tight truncate w-full">{s.label.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Dossier List & Active Dossier Detailed Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dossiers List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Procurement Dossiers ({filteredDossiers.length})
              </span>
              {selectedStageFilter !== 'all' && (
                <button
                  onClick={() => setSelectedStageFilter('all')}
                  className="text-[11px] text-cyan-600 font-bold hover:underline"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PR, PO, Drug, Supplier..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredDossiers.map((d) => {
              const isSelected = d.id === selectedDossier?.id;
              const currentStageIdx = getStageIndex(d.currentStage);

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDossierId(d.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          {d.dossierCode}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            d.overallStatus === 'Completed & Settled'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : d.overallStatus === 'Blocked / Exception'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {d.overallStatus}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {d.title}
                      </h4>
                    </div>

                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatUGX(d.totalValueUgx)}
                    </span>
                  </div>

                  {/* Micro Stepper Progress */}
                  <div className="mt-3 flex items-center gap-1">
                    {STAGES.map((s, idx) => (
                      <div
                        key={s.id}
                        title={s.label}
                        className={`h-1.5 flex-1 rounded-full ${
                          idx <= currentStageIdx
                            ? idx === currentStageIdx && d.overallStatus === 'Blocked / Exception'
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <Building2 className="w-3.5 h-3.5" />
                      {d.purchaseOrder?.supplierName || d.requisition.requestedByName}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Stage {currentStageIdx + 1}/9: {STAGES[currentStageIdx]?.short}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Stage-by-Stage Transformation Details (7 cols) */}
        <div className="lg:col-span-7">
          {selectedDossier ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Dossier Header & Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {selectedDossier.dossierCode}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Updated {new Date(selectedDossier.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedDossier.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveModal('view_audit')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Audit Dossier</span>
                  </button>
                </div>
              </div>

              {/* 9-Stage Detailed Accordion-style Lifecycle */}
              <div className="space-y-4">
                {/* 1. Purchase Requisition */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        Purchase Requisition ({selectedDossier.requisition.prNumber})
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedDossier.requisition.status === 'approved' ||
                        selectedDossier.requisition.status === 'converted_to_po'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedDossier.requisition.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Reason:</span>{' '}
                    {selectedDossier.requisition.requisitionReason}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Requested by: <strong>{selectedDossier.requisition.requestedByName}</strong> (
                      {selectedDossier.requisition.requestedByRole})
                    </span>
                    <span>
                      Estimated Value:{' '}
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">
                        {formatUGX(selectedDossier.requisition.estimatedTotalUgx)}
                      </strong>
                    </span>
                  </div>

                  {/* Stage Action if PR is pending approval */}
                  {selectedDossier.requisition.status === 'pending_approval' && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleApprovePR(selectedDossier.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Requisition
                      </button>
                    </div>
                  )}

                  {/* Stage Action if PR is approved but PO not generated */}
                  {selectedDossier.requisition.status === 'approved' && !selectedDossier.purchaseOrder && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => setActiveModal('convert_po')}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Convert to Purchase Order (PO)
                      </button>
                    </div>
                  )}
                </div>

                {/* 2 & 3. Purchase Order & Supplier Confirmation */}
                {selectedDossier.purchaseOrder && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-xs">
                          2-3
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Purchase Order ({selectedDossier.purchaseOrder.poNumber}) &amp; Supplier Confirmation
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-cyan-100 text-cyan-800">
                        {selectedDossier.purchaseOrder.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Supplier:</span>{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {selectedDossier.purchaseOrder.supplierName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Terms:</span>{' '}
                        <span className="font-medium">{selectedDossier.purchaseOrder.paymentTerms}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Order Amount:</span>{' '}
                        <span className="font-black text-slate-900 dark:text-slate-100">
                          {formatUGX(selectedDossier.purchaseOrder.totalOrderAmountUgx)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Confirmation Ref:</span>{' '}
                        <span className="font-mono text-emerald-600 font-bold">
                          {selectedDossier.purchaseOrder.supplierAckReference || 'Awaiting Confirmation'}
                        </span>
                      </div>
                    </div>

                    {/* Action to confirm supplier ack */}
                    {selectedDossier.purchaseOrder.status === 'issued_to_supplier' && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => setActiveModal('confirm_supplier')}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Record Supplier Confirmation (ACK)
                        </button>
                      </div>
                    )}

                    {/* Action to receive goods */}
                    {selectedDossier.purchaseOrder.status === 'confirmed_by_supplier' &&
                      !selectedDossier.goodsReceivedNote && (
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => setActiveModal('receive_grn')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Receive Goods &amp; Register Batches (GRN)
                          </button>
                        </div>
                      )}
                  </div>
                )}

                {/* 4 & 5. Goods Received Note & Batch Registration */}
                {selectedDossier.goodsReceivedNote && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          4-5
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Goods Received ({selectedDossier.goodsReceivedNote.grnNumber}) &amp; Inward Batches
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                        {selectedDossier.goodsReceivedNote.items.length} Batches Logged
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {selectedDossier.goodsReceivedNote.items.map((b, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {b.genericName}
                              </span>
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                                Batch #{b.batchNumber}
                              </span>
                              {b.isColdChain && (
                                <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                  <Thermometer className="w-3 h-3" />
                                  Cold Chain ({b.targetTemperatureRange})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Exp: {b.expiryDate} | Loc: {b.assignedStorageLocation} | Del: {b.deliveredQuantity}{' '}
                              {b.unitOfMeasure}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action to perform QC */}
                    {!selectedDossier.qualityInspection && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => setActiveModal('qc_inspection')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Perform Pharmacist QC &amp; Cold Chain Inspection
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Quality Inspection & Quarantine Release */}
                {selectedDossier.qualityInspection && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                          6
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Quality Verification ({selectedDossier.qualityInspection.qcNumber})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-800">
                        {selectedDossier.qualityInspection.outcome.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Count Verified</span>
                        <span className="font-bold text-emerald-600">PASS (100%)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Seals &amp; NDA Labels</span>
                        <span className="font-bold text-emerald-600">PASS (Intact)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Cold Chain Logger</span>
                        <span className="font-bold text-emerald-600">
                          {selectedDossier.qualityInspection.temperatureReadoutCelsius !== undefined
                            ? `${selectedDossier.qualityInspection.temperatureReadoutCelsius}°C (PASS)`
                            : 'N/A (Ambient)'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Certificate of Analysis</span>
                        <span className="font-bold text-emerald-600">PASS (Verified)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong>Remarks:</strong> {selectedDossier.qualityInspection.qcRemarks}
                    </p>

                    {/* Action to log invoice */}
                    {!selectedDossier.supplierInvoice && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setInvSubtotal(selectedDossier.purchaseOrder?.totalOrderAmountUgx || 5000000);
                            setInvWht(
                              Math.round((selectedDossier.purchaseOrder?.totalOrderAmountUgx || 5000000) * 0.06)
                            );
                            setActiveModal('record_invoice');
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Record Supplier Invoice &amp; Run 3-Way Match
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 7 & 8. Supplier Invoice & 3-Way Matching Engine */}
                {selectedDossier.supplierInvoice && selectedDossier.matchingRecord && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                          7-8
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Invoice ({selectedDossier.supplierInvoice.invoiceNumber}) &amp; 3-Way Matching
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          selectedDossier.matchingRecord.matchStatus === 'exact_match' ||
                          selectedDossier.matchingRecord.matchStatus === 'matched_within_tolerance'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {selectedDossier.matchingRecord.matchStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">1. PO Authorized</span>
                          <span className="font-bold">
                            {formatUGX(selectedDossier.matchingRecord.poAuthorizedAmountUgx)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">2. GRN Accepted</span>
                          <span className="font-bold">
                            {formatUGX(selectedDossier.matchingRecord.grnAcceptedValueUgx)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">3. Invoiced Billed</span>
                          <span className="font-bold">
                            {formatUGX(selectedDossier.matchingRecord.invoiceBilledAmountUgx)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500">Price Variance:</span>
                        <span
                          className={`font-black ${
                            selectedDossier.matchingRecord.priceVarianceUgx > 0
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {selectedDossier.matchingRecord.priceVarianceUgx > 0 ? '+' : ''}
                          {formatUGX(selectedDossier.matchingRecord.priceVarianceUgx)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        {selectedDossier.matchingRecord.varianceExplanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* 9. Payment Authorization & Settlement */}
                {selectedDossier.paymentVoucher && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          9
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Payment Voucher ({selectedDossier.paymentVoucher.voucherNumber}) &amp; Settlement
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          selectedDossier.paymentVoucher.paymentStatus === 'settled_and_reconciled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedDossier.paymentVoucher.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Gross Billed</span>
                        <span className="font-bold">
                          {formatUGX(selectedDossier.paymentVoucher.grossAmountUgx)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">WHT (6% Tax)</span>
                        <span className="font-bold text-slate-600">
                          -{formatUGX(selectedDossier.paymentVoucher.whtDeductedUgx)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Net Payable</span>
                        <span className="font-black text-emerald-600">
                          {formatUGX(selectedDossier.paymentVoucher.netPayableUgx)}
                        </span>
                      </div>
                    </div>

                    {selectedDossier.paymentVoucher.paymentStatus === 'settled_and_reconciled' ? (
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                        <span className="font-bold">Settlement Tx Hash:</span>{' '}
                        <span className="font-mono">{selectedDossier.paymentVoucher.transactionReference}</span>
                        <p className="mt-0.5">{selectedDossier.paymentVoucher.settlementNotes}</p>
                      </div>
                    ) : (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => setActiveModal('settle_payment')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Authorize Payment Voucher &amp; Execute Wire
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Select a procurement dossier to inspect its complete 9-stage lifecycle.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create Purchase Requisition */}
      {activeModal === 'new_pr' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                New Purchase Requisition (Stage 1)
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Requisition Justification / Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newPrReason}
                  onChange={(e) => setNewPrReason(e.target.value)}
                  placeholder="e.g. Stock dropped below 15-day minimum safety threshold for essential antimalarials..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPrPriority}
                    onChange={(e) => setNewPrPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="standard">Standard (Routine Restock)</option>
                    <option value="urgent">Urgent Restock</option>
                    <option value="stockout_emergency">Stockout Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={newPrForm}
                    onChange={(e) => setNewPrForm(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Oral Suspension">Oral Suspension</option>
                    <option value="Injectable Solution">Injectable Solution</option>
                    <option value="IV Infusion">IV Infusion</option>
                    <option value="Topical Cream">Topical Cream</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Generic / INN Drug Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={newPrGeneric}
                    onChange={(e) => setNewPrGeneric(e.target.value)}
                    placeholder="e.g. Artemether + Lumefantrine"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Brand Name
                  </label>
                  <input
                    type="text"
                    value={newPrBrand}
                    onChange={(e) => setNewPrBrand(e.target.value)}
                    placeholder="e.g. Coartem 20/120mg"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Requested Qty *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={newPrQty}
                    onChange={(e) => setNewPrQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    value={newPrUom}
                    onChange={(e) => setNewPrUom(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Est. Unit Cost (UGX)
                  </label>
                  <input
                    required
                    type="number"
                    min={100}
                    step={500}
                    value={newPrUnitCost}
                    onChange={(e) => setNewPrUnitCost(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">
                  Total Estimated Value:
                </span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  {formatUGX(newPrQty * newPrUnitCost)}
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
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Convert to Purchase Order */}
      {activeModal === 'convert_po' && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cyan-600" />
                Issue Purchase Order (Stage 2)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertToPO} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select NDA Licensed Wholesaler
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="sup-001">Abacus Pharma (A) Limited (NDA/WDL/2026/0014)</option>
                  <option value="sup-002">Laborex Uganda Ltd (NDA/WDL/2026/0009)</option>
                  <option value="sup-003">Rene Industries Limited (NDA/WDL/2026/0022)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={poTerms}
                    onChange={(e) => setPoTerms(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Advance 30%">Advance 30%</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={poDeliveryDate}
                    onChange={(e) => setPoDeliveryDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
                <span className="font-bold text-cyan-900 dark:text-cyan-300">Total PO Value:</span>
                <span className="text-base font-black text-cyan-700 dark:text-cyan-400">
                  {formatUGX(selectedDossier.requisition.estimatedTotalUgx)}
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
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer"
                >
                  Issue &amp; Send PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Supplier Acknowledgment */}
      {activeModal === 'confirm_supplier' && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Supplier Order Confirmation (Stage 3)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Proforma / Ack Reference Number *
                </label>
                <input
                  required
                  type="text"
                  value={supplierAckRef}
                  onChange={(e) => setSupplierAckRef(e.target.value)}
                  placeholder="e.g. ACK-ABACUS-99381"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmed Dispatch Date
                </label>
                <input
                  type="date"
                  value={supplierDispatchDate}
                  onChange={(e) => setSupplierDispatchDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Remarks / Shelf-life Commitment
                </label>
                <textarea
                  rows={2}
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  placeholder="e.g. All batches guaranteed > 24 months remaining shelf-life."
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
                  Confirm Supplier Ack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Receive Goods & Register Batches */}
      {activeModal === 'receive_grn' && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                Goods Received Note &amp; Batch Registration (Stage 4-5)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveGRN} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Note / Waybill # *
                  </label>
                  <input
                    required
                    type="text"
                    value={grnDeliveryNote}
                    onChange={(e) => setGrnDeliveryNote(e.target.value)}
                    placeholder="e.g. DN-AB-2026-9921"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Carrier / Logistics Provider
                  </label>
                  <input
                    type="text"
                    value={grnCarrier}
                    onChange={(e) => setGrnCarrier(e.target.value)}
                    placeholder="e.g. Abacus Pharma Logistics"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
                  Incoming Batch Registration Details
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Batch Number *
                    </label>
                    <input
                      required
                      type="text"
                      value={grnBatchNo}
                      onChange={(e) => setGrnBatchNo(e.target.value)}
                      placeholder="e.g. BAT-2026-X88"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Delivered Quantity *
                    </label>
                    <input
                      required
                      type="number"
                      value={grnDeliveredQty}
                      onChange={(e) => setGrnDeliveredQty(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Manufacturing Date
                    </label>
                    <input
                      type="date"
                      value={grnMfgDate}
                      onChange={(e) => setGrnMfgDate(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      required
                      type="date"
                      value={grnExpDate}
                      onChange={(e) => setGrnExpDate(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Storage Location
                    </label>
                    <input
                      type="text"
                      value={grnStorageLoc}
                      onChange={(e) => setGrnStorageLoc(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={grnIsColdChain}
                        onChange={(e) => setGrnIsColdChain(e.target.checked)}
                        className="rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      Is Cold Chain (2°C - 8°C)?
                    </label>
                  </div>
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
                  Register Batches &amp; Log GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Quality Inspection */}
      {activeModal === 'qc_inspection' && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Pharmacist Quality &amp; Cold Chain Inspection (Stage 6)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQcInspection} className="space-y-4 text-xs">
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={qcCountOk}
                    onChange={(e) => setQcCountOk(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  Physical Quantity Count matches Delivery Note (100%)
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={qcSealsOk}
                    onChange={(e) => setQcSealsOk(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  Outer Packaging, Tamper Seals &amp; NDA Holograms Intact
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={qcCoaOk}
                    onChange={(e) => setQcCoaOk(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  Certificate of Analysis (CoA) Matches Specifications
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Temperature Log Readout (°C)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={qcTempC}
                    onChange={(e) => setQcTempC(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    QC Inspection Outcome
                  </label>
                  <select
                    value={qcOutcome}
                    onChange={(e) => setQcOutcome(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="passed_released_to_stock">Passed &amp; Released to Stock</option>
                    <option value="passed_with_minor_defects">Passed with Minor Packaging Defect</option>
                    <option value="quarantined_pending_investigation">Quarantined for Investigation</option>
                    <option value="rejected_damaged_or_spurious">Rejected (Damaged / Spurious)</option>
                    <option value="rejected_cold_chain_breached">Rejected (Cold Chain Breached)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pharmacist Inspection Remarks
                </label>
                <textarea
                  rows={2}
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  placeholder="e.g. All physical checks and serial numbers validated under GPP protocol."
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Authorize Release to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Record Invoice & 3-Way Match */}
      {activeModal === 'record_invoice' && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" />
                Record Supplier Tax Invoice (Stage 7-8)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    required
                    type="text"
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    placeholder="e.g. INV-AB-2026-904"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subtotal Billed (UGX) *
                  </label>
                  <input
                    required
                    type="number"
                    value={invSubtotal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setInvSubtotal(val);
                      setInvWht(Math.round(val * 0.06));
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Withholding Tax WHT (6%)
                  </label>
                  <input
                    type="number"
                    value={invWht}
                    onChange={(e) => setInvWht(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <span className="font-bold text-purple-900 dark:text-purple-300">
                  Net Payable after WHT:
                </span>
                <span className="text-base font-black text-purple-700 dark:text-purple-400">
                  {formatUGX(invSubtotal - invWht)}
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  Save &amp; Run 3-Way Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: Payment Settlement */}
      {activeModal === 'settle_payment' && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Authorize Payment &amp; Wire Settlement (Stage 9)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Bank Wire / EFT">Electronic Funds Transfer (EFT / RTGS)</option>
                  <option value="MTN MoMo Pay">MTN Mobile Money Merchant Pay</option>
                  <option value="Airtel Money">Airtel Money Business Pay</option>
                  <option value="Cheque">Commercial Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Bank Account / Merchant ID *
                </label>
                <input
                  required
                  type="text"
                  value={payAccount}
                  onChange={(e) => setPayAccount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Reference / EFT Receipt Hash
                </label>
                <input
                  type="text"
                  value={payTxRef}
                  onChange={(e) => setPayTxRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">
                  Total Settlement Amount:
                </span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  {formatUGX(selectedDossier.paymentVoucher?.netPayableUgx || 0)}
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
                  Authorize &amp; Execute Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: View Full Audit Dossier */}
      {activeModal === 'view_audit' && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                Procure-to-Pay Audit Dossier — {selectedDossier.dossierCode}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] p-4 bg-slate-900 text-slate-100 rounded-xl whitespace-pre-wrap leading-relaxed">
              {generateP2PAuditReport(selectedDossier.id)}
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
