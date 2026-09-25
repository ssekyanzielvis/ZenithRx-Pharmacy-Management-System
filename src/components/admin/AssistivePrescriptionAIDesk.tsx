import React, { useState, useEffect } from 'react';
import {
  getAssistivePrescriptions,
  submitPharmacistDecision,
  getDecisionAuditTrail,
  AssistiveOcrPrescription,
  ExtractedMedicationItem,
  PharmacistModification,
  PharmacistDecisionStatus,
  STANDARD_DRUG_CATALOG,
  DecisionAuditEntry
} from '../../services/assistivePrescriptionAIService';
import {
  Scan,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit3,
  FileText,
  UserCheck,
  Search,
  Check,
  Lock,
  ArrowRight,
  RefreshCw,
  PhoneCall,
  History,
  Info,
  Layers,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';

export const AssistivePrescriptionAIDesk: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<AssistiveOcrPrescription[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CRITICAL' | 'APPROVED' | 'REJECTED'>('ALL');
  
  // Pharmacist Decision Form State
  const [pharmacistName, setPharmacistName] = useState('Dr. Arthur Ssenabulya (Supervising Pharmacist)');
  const [pharmacistReg, setPharmacistReg] = useState('NDA/PHARM/2019/0411');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [acknowledgedFlags, setAcknowledgedFlags] = useState<Record<string, boolean>>({});
  
  // Inline Medication Editing State
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editedDrugName, setEditedDrugName] = useState('');
  const [editedDosage, setEditedDosage] = useState('');
  const [editedFrequency, setEditedFrequency] = useState('');
  const [editedDuration, setEditedDuration] = useState('');
  const [editedQuantity, setEditedQuantity] = useState<number>(0);
  const [editReason, setEditReason] = useState('');
  const [activeModifications, setActiveModifications] = useState<PharmacistModification[]>([]);
  
  // Audit Trail Drawer State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<DecisionAuditEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = getAssistivePrescriptions();
    setPrescriptions(list);
    if (list.length > 0 && !selectedId) {
      // Default select the first pending one with flags or first item
      const pendingWithFlags = list.find(p => p.decisionStatus === 'PENDING_REVIEW' && p.hasCriticalFlags);
      setSelectedId(pendingWithFlags ? pendingWithFlags.id : list[0].id);
    }
  };

  const currentPrescription = prescriptions.find(p => p.id === selectedId) || prescriptions[0] || null;

  // Filter queue
  const filteredList = prescriptions.filter(p => {
    const matchQuery = 
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.queueNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.extractedPrescriberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.extractedMedications.some(m => m.suggestedDrugName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchQuery) return false;

    if (statusFilter === 'PENDING') return p.decisionStatus === 'PENDING_REVIEW';
    if (statusFilter === 'CRITICAL') return p.hasCriticalFlags && p.decisionStatus === 'PENDING_REVIEW';
    if (statusFilter === 'APPROVED') return p.decisionStatus.includes('APPROVED');
    if (statusFilter === 'REJECTED') return p.decisionStatus === 'REJECTED_BY_PHARMACIST';
    return true;
  });

  const handleSelectPrescription = (p: AssistiveOcrPrescription) => {
    setSelectedId(p.id);
    setAcknowledgedFlags({});
    setActiveModifications(p.pharmacistModifications || []);
    setClinicalNotes(p.pharmacistClinicalNotes || '');
    setEditingMedId(null);
  };

  const handleStartEditMed = (med: ExtractedMedicationItem) => {
    setEditingMedId(med.id);
    setEditedDrugName(med.suggestedDrugName);
    setEditedDosage(med.suggestedDosage);
    setEditedFrequency(med.suggestedFrequency);
    setEditedDuration(med.suggestedDuration);
    setEditedQuantity(med.suggestedQuantity);
    setEditReason('Clinical dosage adjustment by pharmacist based on renal/indication guidelines');
  };

  const handleSaveMedEdit = (med: ExtractedMedicationItem) => {
    const newMods: PharmacistModification[] = [
      ...activeModifications.filter(m => m.medicationId !== med.id),
      {
        medicationId: med.id,
        field: 'dosage',
        originalValue: med.suggestedDosage,
        modifiedValue: editedDosage,
        clinicalReason: editReason || 'Adjusted to safe clinical range'
      },
      {
        medicationId: med.id,
        field: 'drugName',
        originalValue: med.suggestedDrugName,
        modifiedValue: editedDrugName,
        clinicalReason: editReason || 'Matched to correct formulary'
      },
      {
        medicationId: med.id,
        field: 'frequency',
        originalValue: med.suggestedFrequency,
        modifiedValue: editedFrequency,
        clinicalReason: editReason || 'Adjusted frequency'
      },
      {
        medicationId: med.id,
        field: 'duration',
        originalValue: med.suggestedDuration,
        modifiedValue: editedDuration,
        clinicalReason: editReason || 'Adjusted duration'
      },
      {
        medicationId: med.id,
        field: 'quantity',
        originalValue: med.suggestedQuantity,
        modifiedValue: editedQuantity,
        clinicalReason: editReason || 'Adjusted quantity'
      }
    ];

    setActiveModifications(newMods);
    setEditingMedId(null);
  };

  const handleToggleAckFlag = (flagId: string) => {
    setAcknowledgedFlags(prev => ({
      ...prev,
      [flagId]: !prev[flagId]
    }));
  };

  const canApprove = () => {
    if (!currentPrescription) return false;
    if (currentPrescription.decisionStatus !== 'PENDING_REVIEW') return false;
    
    // If there are mandatory flags, all must be acknowledged
    const mandatoryFlags = currentPrescription.systemFlags.filter(f => f.requiresMandatoryPharmacistAck);
    const allMandatoryAcked = mandatoryFlags.every(f => acknowledgedFlags[f.id]);
    return allMandatoryAcked && clinicalNotes.trim().length > 5;
  };

  const handleExecuteDecision = (decision: PharmacistDecisionStatus) => {
    if (!currentPrescription) return;

    const flagOverrides = Object.keys(acknowledgedFlags).filter(k => acknowledgedFlags[k]);
    
    submitPharmacistDecision(
      currentPrescription.id,
      decision,
      pharmacistName,
      pharmacistReg,
      clinicalNotes || (decision === 'APPROVED_BY_PHARMACIST' ? 'Prescription verified against clinical standards.' : 'Decision recorded.'),
      activeModifications,
      flagOverrides
    );

    loadData();
  };

  const handleOpenAuditTrail = () => {
    if (!currentPrescription) return;
    setAuditLogs(getDecisionAuditTrail(currentPrescription.id));
    setShowAuditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Safety Doctrine Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Assistive AI / OCR Clinical Safety Doctrine
              </span>
              <span className="bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Auto-Approval Strictly Prohibited
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              AI Vision &amp; Prescription Verification Desk
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Optical Character Recognition (OCR) deciphers handwriting, matches active stock formulations, and parses dosing regimens. System safety algorithms flag interactions, duplications, and dosage deviations. <strong>A licensed human pharmacist retains exclusive authority to approve or reject.</strong>
            </p>
          </div>

          {/* 3-Tier Rule Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-500/30 text-center">
              <div className="text-[10px] font-black text-indigo-300 uppercase tracking-wide">1. AI Model</div>
              <div className="text-sm font-black text-indigo-100 flex items-center justify-center gap-1 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Suggests
              </div>
              <p className="text-[9px] text-indigo-200/70 mt-1">OCR &amp; Handwriting decipher</p>
            </div>

            <div className="bg-amber-900/40 p-3 rounded-xl border border-amber-500/30 text-center">
              <div className="text-[10px] font-black text-amber-300 uppercase tracking-wide">2. Safety Rules</div>
              <div className="text-sm font-black text-amber-100 flex items-center justify-center gap-1 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Flags
              </div>
              <p className="text-[9px] text-amber-200/70 mt-1">Duplicates, DDI &amp; Dosing</p>
            </div>

            <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-500/30 text-center">
              <div className="text-[10px] font-black text-emerald-300 uppercase tracking-wide">3. Pharmacist</div>
              <div className="text-sm font-black text-emerald-100 flex items-center justify-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Decides
              </div>
              <p className="text-[9px] text-emerald-200/70 mt-1">Mandatory clinical sign-off</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Split-Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Queue List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Prescription Triage Queue ({filteredList.length})
              </h3>
              <button 
                onClick={loadData}
                className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, prescriber, or Rx #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'PENDING', label: 'Pending' },
                { key: 'CRITICAL', label: 'Critical Flags' },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'REJECTED', label: 'Rejected' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key as any)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === f.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Queue Items */}
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                No prescriptions match current filter.
              </div>
            ) : (
              filteredList.map(item => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectPrescription(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-black text-indigo-700 dark:text-indigo-400">
                        {item.queueNumber}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        item.decisionStatus === 'APPROVED_BY_PHARMACIST' || item.decisionStatus === 'MODIFIED_AND_APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.decisionStatus === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {item.decisionStatus === 'APPROVED_BY_PHARMACIST' ? 'APPROVED' : item.decisionStatus === 'MODIFIED_AND_APPROVED' ? 'MODIFIED & APPROVED' : item.decisionStatus}
                      </span>
                    </div>

                    <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-1">
                      {item.patientName}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Prescriber: <strong>{item.extractedPrescriberName}</strong>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      <span className="text-slate-500 font-semibold">
                        {item.extractedMedications.length} Meds
                      </span>
                      {item.hasCriticalFlags && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> Critical Flag
                        </span>
                      )}
                      <span className="ml-auto text-slate-400">
                        {item.handwritingDifficultyScore}% Difficulty
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Workspace: Selected Prescription Deep Review (8 cols) */}
        {currentPrescription ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Bar: Rx Overview & Audit Button */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {currentPrescription.queueNumber}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Patient: {currentPrescription.patientName} ({currentPrescription.patientPhone})
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted via <strong>{currentPrescription.aiModelVersion}</strong> • Prescribed by <strong>{currentPrescription.extractedPrescriberName}</strong> ({currentPrescription.extractedPrescriberReg})
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleOpenAuditTrail}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Decision Audit Trail
                </button>
              </div>
            </div>

            {/* Split Review: Original Image vs AI Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Original Scanned Image & Handwriting Analysis */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      Original Prescription Scan
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      High-Res Verified
                    </span>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 max-h-72 flex items-center justify-center relative group">
                    <img
                      src={currentPrescription.imageUrl}
                      alt="Prescription Document"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-[10px] text-white px-2 py-1 rounded-lg">
                      Hover to inspect
                    </div>
                  </div>

                  {/* Raw OCR Extracted Text Drawer */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Raw OCR Optical Capture
                    </span>
                    <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {currentPrescription.rawOcrText}
                    </pre>
                  </div>
                </div>

                {/* Handwriting Ambiguity & Deciphering Assistant */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Handwriting Deciphering Assistant
                    </span>
                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      {currentPrescription.handwritingDifficultyScore}% Ambiguity Index
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentPrescription.handwritingAmbiguities.map((amb, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                          <span className="font-mono text-indigo-700 dark:text-indigo-400">"{amb.phrase}"</span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{amb.confidence}% OCR confidence</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">{amb.notes}</p>
                        {amb.alternativeInterpretations && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                            <span className="font-semibold">Alternatives:</span>
                            {amb.alternativeInterpretations.join(' • ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Suggested Formulations & Inventory Matching */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      AI Suggested Formulations &amp; Matching
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      Formulary Linked
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentPrescription.extractedMedications.map(med => {
                      const isEditing = editingMedId === med.id;
                      const hasMod = activeModifications.some(m => m.medicationId === med.id);

                      return (
                        <div
                          key={med.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            med.isAbnormalDose || med.isDuplicate
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                              : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isEditing ? (
                            /* Inline Edit Form */
                            <div className="space-y-2.5 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-indigo-700">Modify Prescription Item</span>
                                <button
                                  onClick={() => setEditingMedId(null)}
                                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Drug Name / SKU</label>
                                <input
                                  type="text"
                                  value={editedDrugName}
                                  onChange={e => setEditedDrugName(e.target.value)}
                                  className="w-full text-xs font-semibold p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Dosage</label>
                                  <input
                                    type="text"
                                    value={editedDosage}
                                    onChange={e => setEditedDosage(e.target.value)}
                                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Frequency</label>
                                  <input
                                    type="text"
                                    value={editedFrequency}
                                    onChange={e => setEditedFrequency(e.target.value)}
                                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                                  <input
                                    type="text"
                                    value={editedDuration}
                                    onChange={e => setEditedDuration(e.target.value)}
                                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity Units</label>
                                  <input
                                    type="number"
                                    value={editedQuantity}
                                    onChange={e => setEditedQuantity(Number(e.target.value))}
                                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Pharmacist Clinical Justification</label>
                                <input
                                  type="text"
                                  placeholder="Reason for dose adjustment..."
                                  value={editReason}
                                  onChange={e => setEditReason(e.target.value)}
                                  className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                />
                              </div>

                              <button
                                onClick={() => handleSaveMedEdit(med)}
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Apply Modification
                              </button>
                            </div>
                          ) : (
                            /* Normal Display */
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    {med.suggestedDrugName}
                                    {hasMod && (
                                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                                        Modified
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {med.suggestedDosage} • {med.suggestedFrequency} • {med.suggestedDuration} ({med.suggestedQuantity} units)
                                  </div>
                                </div>

                                {currentPrescription.decisionStatus === 'PENDING_REVIEW' && (
                                  <button
                                    onClick={() => handleStartEditMed(med)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                                    title="Edit medication formulation"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Inventory Stock Match pill */}
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">
                                  Stock: <strong>{med.matchedStockOnHand ?? 0} units</strong> in stock
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  UGX {(med.matchedUnitPrice ?? 0).toLocaleString()} / unit
                                </span>
                              </div>

                              {/* Anomaly warnings */}
                              {med.isAbnormalDose && (
                                <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/60 p-1.5 rounded-lg">
                                  ⚠️ {med.abnormalDoseDetails}
                                </div>
                              )}
                              {med.isDuplicate && (
                                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 p-1.5 rounded-lg">
                                  🔁 {med.duplicateDetails}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Tier 2: System Safety Flags Engine */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      System Clinical &amp; Regulatory Safety Flags ({currentPrescription.systemFlags.length})
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Automated screening for duplicate therapies, supratherapeutic doses, D-D interactions, and Class A safe requirements.
                    </p>
                  </div>
                </div>

                {currentPrescription.hasCriticalFlags && (
                  <span className="text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" /> Critical Acknowledgement Required
                  </span>
                )}
              </div>

              {currentPrescription.systemFlags.length === 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  No contraindications, duplicate therapies, or dosage anomalies detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPrescription.systemFlags.map(flag => {
                    const isAcked = !!acknowledgedFlags[flag.id];

                    return (
                      <div
                        key={flag.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          flag.severity === 'CRITICAL'
                            ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                            : flag.severity === 'HIGH'
                            ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                flag.severity === 'CRITICAL'
                                  ? 'bg-rose-600 text-white'
                                  : flag.severity === 'HIGH'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}>
                                {flag.severity}
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                {flag.title}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {flag.message}
                            </p>

                            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 mt-1">
                              <strong>Clinical Action:</strong> {flag.recommendation}
                            </div>
                          </div>

                          {/* Mandatory Ack Checkbox for Pharmacist */}
                          {flag.requiresMandatoryPharmacistAck && currentPrescription.decisionStatus === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => handleToggleAckFlag(flag.id)}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                isAcked
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {isAcked ? <Check className="w-3.5 h-3.5" /> : null}
                              {isAcked ? 'Acknowledged' : 'Acknowledge Flag'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tier 3: Pharmacist Decision & Digital Sign-off Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Pharmacist Clinical Decision &amp; Final Sign-Off
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Sole human authority over dispensing verification. Recorded in immutable compliance audit ledger.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">Signatory License</span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {pharmacistReg}
                  </span>
                </div>
              </div>

              {currentPrescription.decisionStatus === 'PENDING_REVIEW' ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Supervising Pharmacist Clinical Assessment &amp; Dispensing Notes (Required)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Record clinical assessment notes, indication verification, patient counseling instructions, or reason for override..."
                      value={clinicalNotes}
                      onChange={e => setClinicalNotes(e.target.value)}
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExecuteDecision('REJECTED_BY_PHARMACIST')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-black border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Reject Prescription
                      </button>

                      <button
                        onClick={() => handleExecuteDecision('ESCALATED_TO_DOCTOR')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-black border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                      >
                        <PhoneCall className="w-4 h-4" /> Query Prescribing Doctor
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeModifications.length > 0 ? (
                        <button
                          disabled={!canApprove()}
                          onClick={() => handleExecuteDecision('MODIFIED_AND_APPROVED')}
                          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-black shadow-md transition cursor-pointer ${
                            canApprove()
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" /> Modify &amp; Approve for POS
                        </button>
                      ) : (
                        <button
                          disabled={!canApprove()}
                          onClick={() => handleExecuteDecision('APPROVED_BY_PHARMACIST')}
                          className={`flex items-center gap-1.5 px-6 py-2.5 rounded-2xl text-xs font-black shadow-md transition cursor-pointer ${
                            canApprove()
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/30'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Prescription for POS
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Already Finalized Review State */
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                      Final Decision Recorded by {currentPrescription.pharmacistName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {currentPrescription.reviewedAt ? new Date(currentPrescription.reviewedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>Pharmacist Assessment:</strong> {currentPrescription.pharmacistClinicalNotes}
                  </p>
                  {currentPrescription.pharmacistModifications && currentPrescription.pharmacistModifications.length > 0 && (
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-xl">
                      <strong>Modifications Applied:</strong> {currentPrescription.pharmacistModifications.length} fields modified prior to POS approval.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : null}

      </div>

      {/* Decision Audit Trail Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Prescription AI Decision Audit Trail
                </h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No decision audits logged yet for this prescription.
                </div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="py-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {log.actorName} <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                      Action: {log.actionType}
                    </div>
                    <pre className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-600 dark:text-slate-300 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistivePrescriptionAIDesk;
