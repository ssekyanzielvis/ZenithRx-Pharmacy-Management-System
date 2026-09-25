import React, { useState, useEffect } from 'react';
import {
  DispensingRegisterEntry,
  ControlledRegisterEntry,
  ControlledStockReconciliationRecord,
  ControlledSubstanceProduct,
  ControlledScheduleClass,
  ControlledVarianceType,
  ControlledReconciliationStatus,
} from '../types';
import {
  getDispensingRegisterEntries,
  recordDispensingEntry,
  exportDispensingRegisterToCsv,
} from '../services/dispensingRegisterService';
import { controlledSubstanceService } from '../services/controlledSubstanceService';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Filter,
  Calendar,
  AlertTriangle,
  FileCheck,
  User,
  Pill,
  Download,
  Lock,
  Boxes,
  Key,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  TrendingDown,
  TrendingUp,
  FileText,
  Building2,
  MapPin,
  X,
  PhoneCall,
  Sparkles,
  Layers,
  History,
  AlertOctagon,
  Eye,
  Hash,
} from 'lucide-react';
import { formatUGX } from '../services/formatters';

interface DispensingRegisterProps {
  tenantId?: string;
  pharmacyName?: string;
  currentPharmacistName?: string;
  currentPharmacistRole?: string;
  psuLicenseNo?: string;
}

export const DispensingRegister: React.FC<DispensingRegisterProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'ZenithRx Flagship (Kololo Safe Vault)',
  currentPharmacistName = 'Dr. Arthur Ssenabulya',
  currentPharmacistRole = 'Supervising Pharmacist',
  psuLicenseNo = 'PSU-2021-0892',
}) => {
  const [activeModuleTab, setActiveModuleTab] = useState<'controlledRegister' | 'controlledReconciliation' | 'generalRegister'>('controlledRegister');

  // Controlled Register State
  const [controlledEntries, setControlledEntries] = useState<ControlledRegisterEntry[]>(
    controlledSubstanceService.getAllRegisterEntries(tenantId)
  );
  const [controlledProducts, setControlledProducts] = useState<ControlledSubstanceProduct[]>(
    controlledSubstanceService.getAllProducts()
  );
  const [reconciliations, setReconciliations] = useState<ControlledStockReconciliationRecord[]>(
    controlledSubstanceService.getAllReconciliations(tenantId)
  );

  // General Register State
  const [generalEntries, setGeneralEntries] = useState<DispensingRegisterEntry[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSchedule, setFilterSchedule] = useState<string>('all');
  const [filterReconStatus, setFilterReconStatus] = useState<string>('all');

  // Modals
  const [isControlledDispenseModalOpen, setIsControlledDispenseModalOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);
  const [selectedReconForInvestigation, setSelectedReconForInvestigation] = useState<ControlledStockReconciliationRecord | null>(null);
  const [isGeneralRecordModalOpen, setIsGeneralRecordModalOpen] = useState(false);
  const [selectedControlledEntryDetail, setSelectedControlledEntryDetail] = useState<ControlledRegisterEntry | null>(null);

  // ── Controlled Dispensing Form State ────────────────────────────────────────
  const [selectedSubstanceId, setSelectedSubstanceId] = useState<string>(controlledProducts[0]?.id || '');
  const [dispenseQty, setDispenseQty] = useState<number>(10);
  const [ctrlPatientName, setCtrlPatientName] = useState('');
  const [ctrlPatientIdType, setCtrlPatientIdType] = useState('National ID (NIN)');
  const [ctrlPatientIdNumber, setCtrlPatientIdNumber] = useState('');
  const [ctrlPatientPhone, setCtrlPatientPhone] = useState('');
  const [ctrlPatientAddress, setCtrlPatientAddress] = useState('');
  const [ctrlPatientAge, setCtrlPatientAge] = useState<number>(45);
  const [ctrlPatientGender, setCtrlPatientGender] = useState('Male');
  const [ctrlPrescriberName, setCtrlPrescriberName] = useState('');
  const [ctrlPrescriberCouncilRegNo, setCtrlPrescriberCouncilRegNo] = useState('');
  const [ctrlPrescriberCadre, setCtrlPrescriberCadre] = useState('Consultant Oncologist / Specialist');
  const [ctrlPrescriberFacility, setCtrlPrescriberFacility] = useState('');
  const [ctrlPrescriberContact, setCtrlPrescriberContact] = useState('');
  const [ctrlRxRefNo, setCtrlRxRefNo] = useState('');
  const [ctrlRxDate, setCtrlRxDate] = useState(new Date().toISOString().split('T')[0]);
  const [ctrlIndication, setCtrlIndication] = useState('');
  const [ctrlWitnessName, setCtrlWitnessName] = useState('Dr. Brenda Namaganda');
  const [ctrlWitnessPsuNo, setCtrlWitnessPsuNo] = useState('PSU-2022-1104');
  const [ctrlBatchNo, setCtrlBatchNo] = useState('');
  const [ctrlExpiryDate, setCtrlExpiryDate] = useState('');

  // ── Controlled Reconciliation Form State ─────────────────────────────────────
  const [reconSubstanceId, setReconSubstanceId] = useState<string>(controlledProducts[0]?.id || '');
  const [reconOpeningBal, setReconOpeningBal] = useState<number>(100);
  const [reconReceivedQty, setReconReceivedQty] = useState<number>(50);
  const [reconDispensedQty, setReconDispensedQty] = useState<number>(20);
  const [reconDamagedQty, setReconDamagedQty] = useState<number>(2);
  const [reconQuarantinedQty, setReconQuarantinedQty] = useState<number>(0);
  const [reconPhysicalCount, setReconPhysicalCount] = useState<number>(126);
  const [reconSafeBin, setReconSafeBin] = useState('Heavy-Gauge Steel Safe Vault — Compartment A1');
  const [reconStartDate, setReconStartDate] = useState('2026-09-01');
  const [reconEndDate, setReconEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconNotes, setReconNotes] = useState('');
  const [reconWitnessName, setReconWitnessName] = useState('Dr. Brenda Namaganda');
  const [reconWitnessPsuNo, setReconWitnessPsuNo] = useState('PSU-2022-1104');

  // ── Investigation Edit Form State ───────────────────────────────────────────
  const [invNotes, setInvNotes] = useState('');
  const [invRca, setInvRca] = useState('');
  const [invCap, setInvCap] = useState('');
  const [invPoliceRef, setInvPoliceRef] = useState('');
  const [invStatus, setInvStatus] = useState<ControlledReconciliationStatus>('under_internal_investigation');

  // Sync selected substance defaults
  useEffect(() => {
    const selected = controlledProducts.find(p => p.id === selectedSubstanceId);
    if (selected) {
      setCtrlBatchNo(selected.defaultBatchNumber);
      setCtrlExpiryDate(selected.defaultExpiryDate);
    }
  }, [selectedSubstanceId, controlledProducts]);

  useEffect(() => {
    setGeneralEntries(getDispensingRegisterEntries(tenantId));
    setControlledEntries(controlledSubstanceService.getAllRegisterEntries(tenantId));
    setReconciliations(controlledSubstanceService.getAllReconciliations(tenantId));
    setControlledProducts(controlledSubstanceService.getAllProducts());
  }, [tenantId]);

  // Selected drug live running balance preview
  const currentSelectedProduct = controlledProducts.find(p => p.id === selectedSubstanceId);
  const currentSafeStock = currentSelectedProduct?.currentSafeStock || 100;
  const simulatedRemainingBalance = Math.max(0, currentSafeStock - dispenseQty);

  // Dynamic reconciliation expected calculation
  const calculatedExpectedBalance =
    reconOpeningBal + reconReceivedQty - reconDispensedQty - reconDamagedQty - reconQuarantinedQty;
  const calculatedVariance = reconPhysicalCount - calculatedExpectedBalance;

  // Handlers
  const handleSaveControlledDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedProduct || !ctrlPatientName || !ctrlPatientIdNumber || !ctrlPrescriberName || !ctrlPrescriberCouncilRegNo || !ctrlRxRefNo) {
      alert('Please fill in all mandatory controlled drug dispensing fields (Patient NIN, Prescriber UMDPC License, Rx Reference).');
      return;
    }

    if (dispenseQty <= 0 || dispenseQty > currentSafeStock) {
      alert(`Invalid dispensing quantity. Current safe stock available: ${currentSafeStock} ${currentSelectedProduct.unit}.`);
      return;
    }

    const newEntry = controlledSubstanceService.recordControlledDispensing({
      tenantId,
      branchId: 'branch-kololo-01',
      branchName: pharmacyName,
      substanceId: currentSelectedProduct.id,
      drugBrandName: currentSelectedProduct.brandName,
      drugGenericName: currentSelectedProduct.genericName,
      dosageForm: currentSelectedProduct.dosageForm,
      strength: currentSelectedProduct.strength,
      controlledSchedule: currentSelectedProduct.scheduleClass,
      batchNumber: ctrlBatchNo || currentSelectedProduct.defaultBatchNumber,
      expiryDate: ctrlExpiryDate || currentSelectedProduct.defaultExpiryDate,
      quantityDispensed: dispenseQty,
      unit: currentSelectedProduct.unit,
      patientName: ctrlPatientName,
      patientIdType: ctrlPatientIdType,
      patientIdNumber: ctrlPatientIdNumber,
      patientPhone: ctrlPatientPhone,
      patientAddress: ctrlPatientAddress,
      patientAge: ctrlPatientAge,
      patientGender: ctrlPatientGender,
      prescriberName: ctrlPrescriberName,
      prescriberCouncilRegNo: ctrlPrescriberCouncilRegNo,
      prescriberCadre: ctrlPrescriberCadre,
      prescriberFacility: ctrlPrescriberFacility || 'Mulago National Referral Hospital',
      prescriberContact: ctrlPrescriberContact,
      prescriptionReferenceNo: ctrlRxRefNo,
      prescriptionIssueDate: ctrlRxDate,
      clinicalIndication: ctrlIndication || 'Severe acute palliative clinical condition requiring controlled pain management.',
      dispensingPharmacistName: currentPharmacistName,
      dispensingPharmacistRole: currentPharmacistRole,
      dispensingPharmacistPsuNo: psuLicenseNo,
      witnessPharmacistName: ctrlWitnessName || undefined,
      witnessPharmacistPsuNo: ctrlWitnessPsuNo || undefined,
    });

    setControlledEntries(controlledSubstanceService.getAllRegisterEntries(tenantId));
    setControlledProducts(controlledSubstanceService.getAllProducts());
    setIsControlledDispenseModalOpen(false);
    setSelectedControlledEntryDetail(newEntry);
  };

  const handleSaveReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    const product = controlledProducts.find(p => p.id === reconSubstanceId);
    if (!product) return;

    controlledSubstanceService.createReconciliation({
      tenantId,
      branchId: 'branch-kololo-01',
      branchName: pharmacyName,
      substanceId: product.id,
      medicineName: product.brandName,
      batchNumber: product.defaultBatchNumber,
      controlledSchedule: product.scheduleClass,
      storageBinSafe: reconSafeBin,
      openingBalance: reconOpeningBal,
      quantityReceived: reconReceivedQty,
      quantityDispensed: reconDispensedQty,
      quantityDamagedOrLost: reconDamagedQty,
      quantityQuarantined: reconQuarantinedQty,
      physicalBalance: reconPhysicalCount,
      investigationNotes: reconNotes,
      countedByPharmacistName: currentPharmacistName,
      countedByPsuNo: psuLicenseNo,
      witnessPharmacistName: reconWitnessName,
      witnessPsuNo: reconWitnessPsuNo,
      periodStartDate: reconStartDate,
      periodEndDate: reconEndDate,
    });

    setReconciliations(controlledSubstanceService.getAllReconciliations(tenantId));
    setIsReconciliationModalOpen(false);
  };

  const handleUpdateInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReconForInvestigation) return;

    controlledSubstanceService.updateReconciliationInvestigation(selectedReconForInvestigation.id, {
      investigationNotes: invNotes,
      rootCauseAnalysis: invRca,
      correctiveActionPlan: invCap,
      policeCaseFileRef: invPoliceRef,
      reconciliationStatus: invStatus,
      superintendentApproverName: invStatus === 'superintendent_approved_adjustment' ? `${currentPharmacistName} (Superintendent Pharmacist)` : undefined,
    });

    setReconciliations(controlledSubstanceService.getAllReconciliations(tenantId));
    setIsInvestigationModalOpen(false);
  };

  const openInvestigationModal = (recon: ControlledStockReconciliationRecord) => {
    setSelectedReconForInvestigation(recon);
    setInvNotes(recon.investigationNotes || '');
    setInvRca(recon.rootCauseAnalysis || '');
    setInvCap(recon.correctiveActionPlan || '');
    setInvPoliceRef(recon.policeCaseFileRef || '');
    setInvStatus(recon.reconciliationStatus);
    setIsInvestigationModalOpen(true);
  };

  const handleDownloadNdaForm5 = () => {
    const content = controlledSubstanceService.generateNdaForm5Dossier(reconciliations);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDA_Form_5_Controlled_Substances_Return_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered Controlled Entries
  const filteredControlledEntries = controlledEntries.filter(e => {
    const matchesSearch =
      e.sequentialRegNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.patientIdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.drugBrandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.prescriberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.prescriberCouncilRegNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.prescriptionReferenceNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSchedule =
      filterSchedule === 'all' || e.controlledSchedule === filterSchedule;

    return matchesSearch && matchesSchedule;
  });

  // Filtered Reconciliations
  const filteredReconciliations = reconciliations.filter(r => {
    const matchesSearch =
      r.reconciliationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.ndaIncidentReportRef && r.ndaIncidentReportRef.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterReconStatus === 'all' || r.reconciliationStatus === filterReconStatus;

    return matchesSearch && matchesStatus;
  });

  // KPIs
  const totalControlledStockHeld = controlledProducts.reduce((acc, p) => acc + p.currentSafeStock, 0);
  const totalSequentialEntries = controlledEntries.length;
  const activeDeficitInvestigations = reconciliations.filter(r => r.reconciliationStatus === 'under_internal_investigation').length;
  const totalDispensedControlled = controlledEntries.reduce((acc, e) => acc + e.quantityDispensed, 0);

  return (
    <div className="space-y-6">
      {/* ── Header Cockpit ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/80 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> NDA Class A & Schedule I-IV Narcotics Safe
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Immutable SHA-256 Chained Ledger
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Controlled & Classified Medicine Governance
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Strict compliance register under the National Drug Authority (NDA) Uganda Pharmacy & Poisons Act.
              Sequential poison book auditing, running balance verification, and double-blind safe reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsControlledDispenseModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-red-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Dispense Controlled Drug
            </button>
            <button
              onClick={() => setIsReconciliationModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
            >
              <Boxes className="w-4 h-4" /> Initiate Safe Reconciliation
            </button>
            <button
              onClick={handleDownloadNdaForm5}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> NDA Form 5 Return
            </button>
          </div>
        </div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Safe Stock Units</span>
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{totalControlledStockHeld.toLocaleString()}</div>
            <div className="text-[11px] text-amber-300 font-semibold mt-0.5">Double-Lock Vaults</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Sequential Records</span>
              <Hash className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{totalSequentialEntries}</div>
            <div className="text-[11px] text-blue-300 font-semibold mt-0.5">Monotonic Append-Only</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Under Investigation</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-400 mt-1">{activeDeficitInvestigations}</div>
            <div className="text-[11px] text-red-300 font-semibold mt-0.5">Active Variance Audits</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Dispensed Qty (YTD)</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{totalDispensedControlled.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">100% Rx Verified</div>
          </div>
        </div>
      </div>

      {/* ── Sub-Module Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveModuleTab('controlledRegister')}
          className={`px-4 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
            activeModuleTab === 'controlledRegister'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" /> Controlled Dispensing Register (Class A / Schedule I-IV)
          <span className="px-2 py-0.5 bg-red-900/40 text-red-200 text-xs rounded-full">
            {controlledEntries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModuleTab('controlledReconciliation')}
          className={`px-4 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
            activeModuleTab === 'controlledReconciliation'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" /> Controlled-Stock Safe Reconciliation
          {activeDeficitInvestigations > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-900 font-black text-xs rounded-full animate-pulse">
              {activeDeficitInvestigations} Variance
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveModuleTab('generalRegister')}
          className={`px-4 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
            activeModuleTab === 'generalRegister'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> General Dispensing & OTC Register
        </button>
      </div>

      {/* ── TAB 1: CONTROLLED DISPENSING REGISTER ──────────────────────────────── */}
      {activeModuleTab === 'controlledRegister' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search register #, patient NIN, doctor UMDPC, batch..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterSchedule}
                  onChange={e => setFilterSchedule(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Controlled Schedules</option>
                  <option value="schedule_1_narcotic">Schedule I Narcotics (Morphine, Pethidine, Fentanyl)</option>
                  <option value="schedule_2_controlled_rx">Schedule II Controlled Rx (Ketamine, Tramadol, Ritalin)</option>
                  <option value="schedule_3_psychotropic">Schedule III Psychotropics (Diazepam, Midazolam)</option>
                  <option value="schedule_4_targeted_substance">Schedule IV Targeted Substances</option>
                </select>
              </div>

              <button
                onClick={() => controlledSubstanceService.exportRegisterToCsv(filteredControlledEntries)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export Poison Book (CSV)
              </button>
            </div>
          </div>

          {/* Sequential Immutable Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Sequential Reg #</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Controlled Medicine & Batch</th>
                    <th className="py-3 px-4 text-center">Safe Balance Flow</th>
                    <th className="py-3 px-4">Patient Identification</th>
                    <th className="py-3 px-4">Prescriber & Facility</th>
                    <th className="py-3 px-4">Rx Ref & Reason</th>
                    <th className="py-3 px-4">Pharmacist & Witness</th>
                    <th className="py-3 px-4 text-right">Integrity Seal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredControlledEntries.map(entry => (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedControlledEntryDetail(entry)}
                      className="hover:bg-red-50/40 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                    >
                      {/* Sequential Reg # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-red-500" />
                          {entry.sequentialRegNumber}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {new Date(entry.timestamp).toLocaleDateString('en-GB')}
                        </div>
                        <div className="text-[10px]">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Controlled Medicine */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {entry.drugBrandName}
                          <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                            entry.controlledSchedule === 'schedule_1_narcotic'
                              ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                              : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                          }`}>
                            {entry.controlledSchedule.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Batch: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{entry.batchNumber}</span> | Exp: {entry.expiryDate}
                        </div>
                      </td>

                      {/* Safe Balance Flow */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500" title="Opening Balance">{entry.openingBalance}</span>
                          <span className="font-bold text-red-600 dark:text-red-400" title="Dispensed Qty">-{entry.quantityDispensed}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400" title="Balance Remaining">{entry.balanceRemaining}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{entry.unit}</div>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{entry.patientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {entry.patientIdType}: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{entry.patientIdNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{entry.patientPhone}</div>
                      </td>

                      {/* Prescriber */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{entry.prescriberName}</div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {entry.prescriberCouncilRegNo}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{entry.prescriberFacility}</div>
                      </td>

                      {/* Rx & Reason */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{entry.prescriptionReferenceNo}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]" title={entry.clinicalIndication}>
                          {entry.clinicalIndication}
                        </div>
                      </td>

                      {/* Pharmacist & Witness */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{entry.dispensingPharmacistName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">PSU: {entry.dispensingPharmacistPsuNo}</div>
                        {entry.witnessPharmacistName && (
                          <div className="text-[10px] text-indigo-500 mt-0.5">
                            Witness: {entry.witnessPharmacistName}
                          </div>
                        )}
                      </td>

                      {/* Cryptographic Seal */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded font-mono text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Tamper-Sealed
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[100px]" title={entry.currentEntryHash}>
                          {entry.currentEntryHash.substring(0, 14)}...
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CONTROLLED-STOCK SAFE RECONCILIATION ───────────────────────── */}
      {activeModuleTab === 'controlledReconciliation' && (
        <div className="space-y-6">
          {/* Formula Instruction Banner */}
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Controlled-Stock Quantitative Safe Reconciliation Formula
                </h3>
                <p className="text-xs text-indigo-950 dark:text-indigo-200 font-mono mt-0.5">
                  Expected Balance = [Opening Balance] + [Received] - [Dispensed] - [Damaged/Lost] - [Quarantined]
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Any physical variance (Deficit or Surplus) triggers a mandatory NDA regulatory incident investigation and dual-signoff.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsReconciliationModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 whitespace-nowrap transition-all"
            >
              <Plus className="w-4 h-4" /> Start Safe Stocktake Session
            </button>
          </div>

          {/* Reconciliation Audit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reconciliations.map(recon => (
              <div
                key={recon.id}
                className={`border rounded-2xl p-5 shadow-sm transition-all ${
                  recon.variance < 0
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    : recon.variance > 0
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                    {recon.reconciliationNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${
                    recon.reconciliationStatus === 'reconciled_and_verified'
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                      : recon.reconciliationStatus === 'under_internal_investigation'
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 animate-pulse'
                      : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200'
                  }`}>
                    {recon.reconciliationStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-2">
                  {recon.medicineName}
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Batch: <span className="font-bold text-slate-700 dark:text-slate-200">{recon.batchNumber}</span> | {recon.storageBinSafe}
                </div>

                {/* Quantitative Calculation Table */}
                <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-3 mt-4 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Opening Safe Balance:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{recon.openingBalance}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>+ Received into Safe:</span>
                    <span className="font-bold">+{recon.quantityReceived}</span>
                  </div>
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>- Dispensed on Valid Rx:</span>
                    <span className="font-bold">-{recon.quantityDispensed}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>- Damaged / Breakage:</span>
                    <span className="font-bold">-{recon.quantityDamagedOrLost}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>Expected Safe Balance:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{recon.expectedBalance}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>Physical Safe Count:</span>
                    <span className="text-slate-900 dark:text-white font-black">{recon.physicalBalance}</span>
                  </div>
                  <div className={`border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between font-extrabold ${
                    recon.variance < 0 ? 'text-red-600 dark:text-red-400' : recon.variance > 0 ? 'text-blue-600' : 'text-emerald-600'
                  }`}>
                    <span>AUDIT VARIANCE:</span>
                    <span>{recon.variance > 0 ? `+${recon.variance}` : recon.variance} units</span>
                  </div>
                </div>

                {recon.ndaIncidentReportRef && (
                  <div className="mt-3 p-2 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300">
                    <div className="font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" /> NDA Incident Ref: {recon.ndaIncidentReportRef}
                    </div>
                    {recon.policeCaseFileRef && (
                      <div className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                        Police Case: {recon.policeCaseFileRef}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <div>Counted by: <span className="font-semibold text-slate-700 dark:text-slate-300">{recon.countedByPharmacistName}</span></div>
                  <div>Witness: <span className="font-semibold text-slate-700 dark:text-slate-300">{recon.witnessPharmacistName}</span></div>
                  {recon.superintendentApproverName && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Approver: {recon.superintendentApproverName}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => openInvestigationModal(recon)}
                    className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> Manage Investigation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: GENERAL / OTC & PRESCRIPTION REGISTER ───────────────────────── */}
      {activeModuleTab === 'generalRegister' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Standard Prescription & General Pharmacy Dispensing Ledger
            </h3>
            <button
              onClick={() => exportDispensingRegisterToCsv(generalEntries)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Standard Register (CSV)
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Medicine Brand</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Prescriber / Rx</th>
                  <th className="py-3 px-4">Pharmacist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {generalEntries.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{e.registerNumber}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(e.timestamp).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-semibold">{e.patientName}</td>
                    <td className="py-3 px-4">{e.drugBrandName}</td>
                    <td className="py-3 px-4 font-mono">{e.batchNumber}</td>
                    <td className="py-3 px-4 font-bold">{e.dispensedQuantity} {e.unit}</td>
                    <td className="py-3 px-4 font-mono">{e.rxNumber || 'OTC'}</td>
                    <td className="py-3 px-4">{e.dispensedByPharmacistName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: DISPENSE CONTROLLED MEDICINE ──────────────────────────────── */}
      {isControlledDispenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/20 text-red-500 rounded-xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Dispense Controlled Substance (NDA Class A / Schedule I-IV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Immutable poison book entry. Requires valid prescription, doctor license, and patient NIN.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsControlledDispenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveControlledDispense} className="mt-5 space-y-5">
              {/* Medicine Selector & Live Safe Balance Indicator */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Controlled Medicine from Heavy-Gauge Safe Vault
                </label>
                <select
                  value={selectedSubstanceId}
                  onChange={e => setSelectedSubstanceId(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  {controlledProducts.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.brandName} — [{prod.scheduleClass.toUpperCase()}] — Available Safe Stock: {prod.currentSafeStock} {prod.unit}
                    </option>
                  ))}
                </select>

                {/* Live Running Balance Indicator Bar */}
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 text-[10px]">Current Safe Balance:</span>
                    <div className="text-base font-black text-slate-800 dark:text-slate-200">
                      {currentSafeStock} {currentSelectedProduct?.unit}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
                    <span className="text-red-600 dark:text-red-400 text-[10px] font-bold">Dispensing Qty:</span>
                    <div className="text-base font-black text-red-600 dark:text-red-400">
                      -{dispenseQty} {currentSelectedProduct?.unit}
                    </div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">New Safe Balance:</span>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {simulatedRemainingBalance} {currentSelectedProduct?.unit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Identification Grid */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" /> Patient Identification (Statutory Requirement)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kato Emmanuel Sentamu"
                      value={ctrlPatientName}
                      onChange={e => setCtrlPatientName(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">ID Type & NIN / Passport *</label>
                    <div className="flex gap-1.5">
                      <select
                        value={ctrlPatientIdType}
                        onChange={e => setCtrlPatientIdType(e.target.value)}
                        className="w-28 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="National ID (NIN)">NIN</option>
                        <option value="Passport">Passport</option>
                        <option value="Military ID">Military</option>
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="CM880194819201A"
                        value={ctrlPatientIdNumber}
                        onChange={e => setCtrlPatientIdNumber(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Patient Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+256 772 109843"
                      value={ctrlPatientPhone}
                      onChange={e => setCtrlPatientPhone(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-semibold mb-1">Patient Physical Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Plot 88, Upper Kololo Terrace, Kampala"
                    value={ctrlPatientAddress}
                    onChange={e => setCtrlPatientAddress(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Prescriber & Prescription Verification Grid */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-500" /> Prescriber & Prescription Verification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Doctor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Charles Lwanga"
                      value={ctrlPrescriberName}
                      onChange={e => setCtrlPrescriberName(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">UMDPC Council License # *</label>
                    <input
                      type="text"
                      required
                      placeholder="UMDPC-2015-8821"
                      value={ctrlPrescriberCouncilRegNo}
                      onChange={e => setCtrlPrescriberCouncilRegNo(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Hospital / Clinic Facility *</label>
                    <input
                      type="text"
                      required
                      placeholder="Uganda Cancer Institute / Mulago"
                      value={ctrlPrescriberFacility}
                      onChange={e => setCtrlPrescriberFacility(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Prescription Ref # *</label>
                    <input
                      type="text"
                      required
                      placeholder="RX-NAR-2026-0081"
                      value={ctrlRxRefNo}
                      onChange={e => setCtrlRxRefNo(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Prescription Date *</label>
                    <input
                      type="date"
                      required
                      value={ctrlRxDate}
                      onChange={e => setCtrlRxDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Dispensing Quantity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={currentSafeStock}
                      value={dispenseQty}
                      onChange={e => setDispenseQty(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-black text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 font-semibold mb-1">Clinical Indication / Diagnosis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Severe refractory cancer breakthrough pain"
                    value={ctrlIndication}
                    onChange={e => setCtrlIndication(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Dual Pharmacist Sign-Off Grid */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" /> Dual-Pharmacist Safe Custody Attestation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Dispensing Pharmacist (You)</span>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{currentPharmacistName}</div>
                    <div className="text-emerald-600 font-mono font-semibold">PSU: {psuLicenseNo}</div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Witness Pharmacist Name & PSU # (Required for Schedule I/II)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Dr. Brenda Namaganda"
                        value={ctrlWitnessName}
                        onChange={e => setCtrlWitnessName(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                      />
                      <input
                        type="text"
                        placeholder="PSU-2022-1104"
                        value={ctrlWitnessPsuNo}
                        onChange={e => setCtrlWitnessPsuNo(e.target.value)}
                        className="w-32 p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsControlledDispenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Seal & Record to Immutable Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INITIATE CONTROLLED SAFE RECONCILIATION ───────────────────── */}
      {isReconciliationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-500 rounded-xl">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Initiate Controlled Safe Stock Reconciliation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Double-blind count vs Ledger flow formula. Auto-evaluates variance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReconciliationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReconciliation} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Controlled Substance & Safe Bin
                </label>
                <select
                  value={reconSubstanceId}
                  onChange={e => setReconSubstanceId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold"
                >
                  {controlledProducts.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.brandName} — (Batch: {prod.defaultBatchNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantitative Formula Ledger Inputs */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Quantitative Ledger Formula Parameters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Opening Balance</label>
                    <input
                      type="number"
                      required
                      value={reconOpeningBal}
                      onChange={e => setReconOpeningBal(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-600 font-bold mb-1">+ Received into Safe</label>
                    <input
                      type="number"
                      required
                      value={reconReceivedQty}
                      onChange={e => setReconReceivedQty(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-red-600 font-bold mb-1">- Dispensed on Rx</label>
                    <input
                      type="number"
                      required
                      value={reconDispensedQty}
                      onChange={e => setReconDispensedQty(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-600 font-bold mb-1">- Damaged / Lost</label>
                    <input
                      type="number"
                      required
                      value={reconDamagedQty}
                      onChange={e => setReconDamagedQty(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-amber-600"
                    />
                  </div>
                </div>

                {/* Live Formula Comparison Preview */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">EXPECTED BALANCE</span>
                    <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                      {calculatedExpectedBalance}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold">PHYSICAL SAFE COUNT *</span>
                    <input
                      type="number"
                      required
                      value={reconPhysicalCount}
                      onChange={e => setReconPhysicalCount(Number(e.target.value))}
                      className="w-full p-2 text-center text-xl font-black bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-lg"
                    />
                  </div>

                  <div className={`p-2.5 rounded-lg border font-black ${
                    calculatedVariance < 0
                      ? 'bg-red-50 dark:bg-red-950/50 border-red-200 text-red-600'
                      : calculatedVariance > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}>
                    <span className="text-[10px] uppercase">AUDIT VARIANCE</span>
                    <div className="text-xl">
                      {calculatedVariance > 0 ? `+${calculatedVariance}` : calculatedVariance}
                    </div>
                  </div>
                </div>
              </div>

              {/* Witness & Date Range */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Witness Pharmacist Name</label>
                  <input
                    type="text"
                    required
                    value={reconWitnessName}
                    onChange={e => setReconWitnessName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Witness PSU License #</label>
                  <input
                    type="text"
                    required
                    value={reconWitnessPsuNo}
                    onChange={e => setReconWitnessPsuNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReconciliationModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2"
                >
                  <Boxes className="w-4 h-4" /> Save Reconciliation & Post Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: INVESTIGATION & REGULATORY FILING ─────────────────────────── */}
      {isInvestigationModalOpen && selectedReconForInvestigation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/20 text-red-500 rounded-xl">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Controlled Stock Investigation File — {selectedReconForInvestigation.reconciliationNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedReconForInvestigation.medicineName} — Variance: {selectedReconForInvestigation.variance} units
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInvestigationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvestigation} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Investigation Status & Action
                </label>
                <select
                  value={invStatus}
                  onChange={e => setInvStatus(e.target.value as ControlledReconciliationStatus)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="under_internal_investigation">Under Internal Forensic Investigation</option>
                  <option value="nda_regulatory_incident_filed">NDA Regulatory Incident Filed (Form 5 Notice)</option>
                  <option value="superintendent_approved_adjustment">Superintendent Pharmacist Approved Adjustment</option>
                  <option value="reconciled_and_verified">Mark Reconciled & Verified</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Investigative Notes & Findings
                </label>
                <textarea
                  rows={3}
                  value={invNotes}
                  onChange={e => setInvNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                  placeholder="Details of physical recount, CCTV review, witness interviews..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Root Cause Analysis (RCA)
                </label>
                <input
                  type="text"
                  value={invRca}
                  onChange={e => setInvRca(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="e.g. Dispensing measurement spillage or unlogged quality assurance sampling"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Corrective & Preventive Action Plan (CAPA)
                </label>
                <input
                  type="text"
                  value={invCap}
                  onChange={e => setInvCap(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="e.g. Mandatory biometric double-key access; daily shift safe count handover"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Police Case File Ref # (If suspected diversion/theft)
                </label>
                <input
                  type="text"
                  value={invPoliceRef}
                  onChange={e => setInvPoliceRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  placeholder="e.g. CPS-KLA-SD-44/24/09/2026"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInvestigationModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Update Investigation File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: CONTROLLED ENTRY DETAILED AUDIT DOSSIER ──────────────────── */}
      {selectedControlledEntryDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/20 text-red-500 rounded-xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Poison Book Record — {selectedControlledEntryDetail.sequentialRegNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cryptographically Chained Entry Sealed on {new Date(selectedControlledEntryDetail.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedControlledEntryDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Medicine:</span>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedControlledEntryDetail.drugBrandName}</div>
                  <div className="text-[11px] text-slate-400">{selectedControlledEntryDetail.dosageForm}</div>
                </div>
                <div>
                  <span className="text-slate-500">Batch & Expiry:</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedControlledEntryDetail.batchNumber}</div>
                  <div className="text-[11px] text-slate-400">Exp: {selectedControlledEntryDetail.expiryDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                  <span className="text-slate-400 text-[10px]">Opening Balance</span>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200">{selectedControlledEntryDetail.openingBalance}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg text-red-600 dark:text-red-400">
                  <span className="text-[10px]">Dispensed</span>
                  <div className="text-base font-black">-{selectedControlledEntryDetail.quantityDispensed}</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <span className="text-[10px]">Balance Remaining</span>
                  <div className="text-base font-black">{selectedControlledEntryDetail.balanceRemaining}</div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Full Name:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedControlledEntryDetail.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient NIN / Passport:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedControlledEntryDetail.patientIdNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prescriber Doctor:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedControlledEntryDetail.prescriberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor UMDPC License:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedControlledEntryDetail.prescriberCouncilRegNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prescription Reference:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedControlledEntryDetail.prescriptionReferenceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Clinical Indication:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedControlledEntryDetail.clinicalIndication}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[10px] space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Chained SHA-256 Ledger Seal:
                </div>
                <div className="text-slate-400 break-all">Current: {selectedControlledEntryDetail.currentEntryHash}</div>
                <div className="text-slate-500 break-all">Previous: {selectedControlledEntryDetail.previousEntryHash}</div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedControlledEntryDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
