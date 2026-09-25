import React, { useState } from 'react';
import {
  PharmacistClinicalInterventionRecord,
  InterventionReasonCategory,
  InterventionActionTaken,
  InterventionFinalDecision,
  ClinicalSignificanceGrade,
} from '../types';
import { pharmacistInterventionService } from '../services/pharmacistInterventionService';
import { formatUGX } from '../services/formatters';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Phone,
  MessageSquare,
  ArrowRight,
  User,
  Pill,
  Building2,
  Calendar,
  Eye,
  X,
  Sparkles,
  Layers,
  Award,
  Clock,
  Check,
  Zap,
} from 'lucide-react';

interface PharmacistInterventionConsoleProps {
  tenantId?: string;
  pharmacyName?: string;
  currentPharmacistName?: string;
  currentPharmacistRole?: string;
  psuLicenseNo?: string;
}

export const PharmacistInterventionConsole: React.FC<PharmacistInterventionConsoleProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'ZenithRx Flagship (Kololo)',
  currentPharmacistName = 'Dr. Arthur Ssenabulya',
  currentPharmacistRole = 'Supervising Pharmacist',
  psuLicenseNo = 'PSU-2021-0892',
}) => {
  const [interventions, setInterventions] = useState<PharmacistClinicalInterventionRecord[]>(
    pharmacistInterventionService.getAllInterventions(tenantId)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [selectedInterventionDetail, setSelectedInterventionDetail] = useState<PharmacistClinicalInterventionRecord | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form State for Recording New Intervention
  const [rxRefNo, setRxRefNo] = useState('RX-2026-0914');
  const [patientNameInput, setPatientNameInput] = useState('');
  const [patientAgeInput, setPatientAgeInput] = useState<number>(45);
  const [patientGenderInput, setPatientGenderInput] = useState('Female');
  const [patientPhoneInput, setPatientPhoneInput] = useState('+256 701 234567');
  const [prescriberNameInput, setPrescriberNameInput] = useState('Dr. Ronald Mukasa');
  const [prescriberRegNoInput, setPrescriberRegNoInput] = useState('UMDPC-2019-4412');
  const [prescriberFacilityInput, setPrescriberFacilityInput] = useState('Mulago National Referral Hospital');

  // 1. Original Prescription
  const [origDrug, setOrigDrug] = useState('Augmentin 625mg Tablets');
  const [origGeneric, setOrigGeneric] = useState('Co-Amoxiclav');
  const [origStrength, setOrigStrength] = useState('625mg');
  const [origRegimen, setOrigRegimen] = useState('1 tablet 12-hourly for 7 days');
  const [origQty, setOrigQty] = useState<number>(14);

  // 2. Reason & Problem
  const [reasonCat, setReasonCat] = useState<InterventionReasonCategory>('allergy_or_contraindication_concern');
  const [clinicalProblemDesc, setClinicalProblemDesc] = useState(
    'Patient has documented beta-lactam anaphylaxis history. Co-Amoxiclav prescription risks severe acute airway angioedema.'
  );
  const [guidelineRef, setGuidelineRef] = useState('BNF 86 §5.1.1 / UCG 2023 Guidelines');

  // 3. Action Taken & Modified Regimen
  const [actionTakenInput, setActionTakenInput] = useState<InterventionActionTaken>('prescriber_contacted_and_amended');
  const [actionDetailsInput, setActionDetailsInput] = useState(
    'Contacted prescriber via direct telephone; recommended switching to Azithromycin 500mg oral once daily for 3 days.'
  );
  const [modDrug, setModDrug] = useState('Azithromycin 500mg Tablets');
  const [modGeneric, setModGeneric] = useState('Azithromycin');
  const [modRegimen, setModRegimen] = useState('1 tablet (500mg) once daily for 3 days');
  const [modQty, setModQty] = useState<number>(3);

  // 4. Prescriber Engagement & Final Decision
  const [contactChannelInput, setContactChannelInput] = useState('Direct Phone Call');
  const [prescriberResponseInput, setPrescriberResponseInput] = useState(
    'Prescriber agreed with allergy warning and approved switch to Azithromycin.'
  );
  const [finalDecisionInput, setFinalDecisionInput] = useState<InterventionFinalDecision>('accepted_by_prescriber');
  const [significanceGradeInput, setSignificanceGradeInput] = useState<ClinicalSignificanceGrade>(
    'grade_1_life_saving_prevented_fatal_event'
  );
  const [costSavingsInput, setCostSavingsInput] = useState<number>(350000);
  const [adverseEventPrevented, setAdverseEventPrevented] = useState(
    'Prevented fatal anaphylactic shock and emergency ICU admission.'
  );

  const kpis = pharmacistInterventionService.getInterventionKPIs(tenantId);

  const handleSaveIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientNameInput || !origDrug || !clinicalProblemDesc || !actionDetailsInput) {
      alert('Please fill in all mandatory clinical intervention fields.');
      return;
    }

    const newRecord = pharmacistInterventionService.recordIntervention({
      tenantId,
      branchId: 'branch-kololo-01',
      branchName: pharmacyName,
      prescriptionId: `rx-${Date.now()}`,
      prescriptionReferenceNo: rxRefNo,
      patientId: `cust-${Date.now()}`,
      patientName: patientNameInput,
      patientAge: patientAgeInput,
      patientGender: patientGenderInput,
      patientPhone: patientPhoneInput,
      prescriberName: prescriberNameInput,
      prescriberCouncilRegNo: prescriberRegNoInput,
      prescriberFacility: prescriberFacilityInput,
      originalPrescription: {
        drugName: origDrug,
        genericName: origGeneric,
        strength: origStrength,
        doseAndFrequency: origRegimen,
        quantity: origQty,
      },
      reasonCategory: reasonCat,
      clinicalProblemDescription: clinicalProblemDesc,
      evidenceOrGuidelineReference: guidelineRef,
      actionTaken: actionTakenInput,
      actionDetails: actionDetailsInput,
      modifiedRegimen: {
        drugName: modDrug,
        genericName: modGeneric,
        doseAndFrequency: modRegimen,
        quantity: modQty,
      },
      prescriberContacted: true,
      contactChannel: contactChannelInput,
      prescriberResponseNotes: prescriberResponseInput,
      finalDecision: finalDecisionInput,
      significanceGrade: significanceGradeInput,
      estimatedCostSavingsUgx: costSavingsInput,
      adverseEventPreventedSummary: adverseEventPrevented,
      pharmacistName: currentPharmacistName,
      pharmacistRole: currentPharmacistRole,
      pharmacistPsuNo: psuLicenseNo,
    });

    setInterventions(pharmacistInterventionService.getAllInterventions(tenantId));
    setIsRecordModalOpen(false);
    setSelectedInterventionDetail(newRecord);
  };

  const handleDownloadReport = () => {
    const text = pharmacistInterventionService.generateClinicalInterventionReportText(filteredInterventions);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZenithRx_Clinical_Interventions_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter logic
  const filteredInterventions = interventions.filter(i => {
    const matchesSearch =
      i.interventionReferenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.prescriptionReferenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.originalPrescription.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.prescriberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.clinicalProblemDescription.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || i.reasonCategory === filterCategory;
    const matchesGrade = filterGrade === 'all' || i.significanceGrade === filterGrade;

    return matchesSearch && matchesCategory && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header Cockpit ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-slate-700/80 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-teal-500/20 border border-teal-500/30 rounded-xl text-teal-400">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Good Pharmacy Practice (GPP) Clinical Governance
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> PSU Quality Audit Grade A
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Pharmacist Clinical Intervention Recording
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Structured documentation of clinical interventions: <strong>Original Prescription ➔ Reason ➔ Action Taken ➔ Final Decision</strong>.
              Demonstrates cognitive pharmaceutical care valuation, prescriber collaboration, and patient safety outcomes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-teal-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Record New Intervention
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> Clinical Report (Dossier)
            </button>
            <button
              onClick={() => pharmacistInterventionService.exportInterventionsToCsv(filteredInterventions)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Clinical KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Interventions</span>
              <Layers className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{kpis.totalInterventionsCount}</div>
            <div className="text-[11px] text-teal-300 font-semibold mt-0.5">Cognitive Care Events</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Doctor Acceptance Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{kpis.prescriberAcceptanceRatePercent}%</div>
            <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">Approved Recommendations</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Life-Saving / Severe Averted</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {kpis.grade1LifeSavingCount + kpis.grade2MajorToxicityPreventedCount}
            </div>
            <div className="text-[11px] text-rose-300 font-semibold mt-0.5">
              {kpis.grade1LifeSavingCount} Fatal • {kpis.grade2MajorToxicityPreventedCount} Major Toxicity
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Prevented Healthcare Costs</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {formatUGX(kpis.estimatedNetSavingsUgx)}
            </div>
            <div className="text-[11px] text-amber-300 font-semibold mt-0.5">Averted Hospitalizations</div>
          </div>
        </div>
      </div>

      {/* ── Search & Reason Category Filter Bar ───────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search intervention #, patient, doctor, drug, problem..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Intervention Reasons</option>
            <option value="dose_clarification_or_adjustment">Dose Clarification / Adjustment</option>
            <option value="drug_drug_interaction">Drug Interaction</option>
            <option value="allergy_or_contraindication_concern">Allergy Concern / Contraindication</option>
            <option value="duplicate_therapy">Duplicate Therapy</option>
            <option value="wrong_or_inappropriate_strength">Wrong Strength</option>
            <option value="wrong_or_excessive_quantity">Wrong Quantity</option>
            <option value="wrong_or_suboptimal_dosage_form">Wrong Dosage Form</option>
            <option value="prescriber_clarification_needed">Prescriber Clarification</option>
            <option value="therapeutic_or_generic_substitution">Substitution</option>
            <option value="renal_or_hepatic_dose_adjustment">Renal / Hepatic Dose Adjustment</option>
          </select>

          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Significance Grades</option>
            <option value="grade_1_life_saving_prevented_fatal_event">Grade 1: Life-Saving / Fatal Averted</option>
            <option value="grade_2_major_prevented_serious_toxicity_or_hospitalization">Grade 2: Major Toxicity Prevented</option>
            <option value="grade_3_moderate_optimized_efficacy_prevented_adr">Grade 3: Moderate Optimization</option>
            <option value="grade_4_minor_administrative_or_clarification">Grade 4: Minor Administrative</option>
          </select>
        </div>
      </div>

      {/* ── Detailed Clinical Transformation Cards ───────────────────────────── */}
      <div className="space-y-4">
        {filteredInterventions.map(item => (
          <div
            key={item.id}
            onClick={() => setSelectedInterventionDetail(item)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-black text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                  {item.interventionReferenceNo}
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">
                  Rx Ref: {item.prescriptionReferenceNo}
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${
                  item.significanceGrade === 'grade_1_life_saving_prevented_fatal_event'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                    : item.significanceGrade === 'grade_2_major_prevented_serious_toxicity_or_hospitalization'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {item.significanceGrade.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Patient: <strong className="text-slate-900 dark:text-slate-100">{item.patientName}</strong> ({item.patientAge}y)</span>
                <span>•</span>
                <span>Doctor: <strong className="text-slate-900 dark:text-slate-100">{item.prescriberName}</strong></span>
              </div>
            </div>

            {/* 4-Step Clinical Transformation Flow Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* Step 1: Original Prescription */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> 1. Original Prescription
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {item.originalPrescription.drugName}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  {item.originalPrescription.doseAndFrequency}
                </div>
                <div className="text-[10px] text-slate-400">
                  Qty: {item.originalPrescription.quantity || 'N/A'} • Route: {item.originalPrescription.route || 'Oral'}
                </div>
              </div>

              {/* Step 2: Pharmacist Intervention Reason */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 2. Clinical Problem / Reason
                </div>
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  {item.reasonCategory.replace(/_/g, ' ').toUpperCase()}
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2" title={item.clinicalProblemDescription}>
                  {item.clinicalProblemDescription}
                </p>
              </div>

              {/* Step 3: Action Taken & Proposed Mod */}
              <div className="bg-teal-50/50 dark:bg-teal-950/20 p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> 3. Action Taken &amp; Modification
                </div>
                <div className="font-bold text-teal-900 dark:text-teal-200">
                  {item.actionTaken.replace(/_/g, ' ').toUpperCase()}
                </div>
                {item.modifiedRegimen ? (
                  <div className="text-[11px] text-slate-800 dark:text-slate-200 font-semibold font-mono">
                    ➔ {item.modifiedRegimen.drugName} ({item.modifiedRegimen.doseAndFrequency})
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.actionDetails}
                  </p>
                )}
              </div>

              {/* Step 4: Final Outcome & Decision */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 4. Final Decision &amp; Outcome
                </div>
                <div className="font-black text-emerald-700 dark:text-emerald-400 uppercase">
                  {item.finalDecision.replace(/_/g, ' ')}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                  {item.prescriberResponseNotes || 'Prescriber confirmed recommendation.'}
                </p>
                {item.estimatedCostSavingsUgx ? (
                  <div className="text-[10px] text-amber-600 font-bold">
                    Est. Saved: {formatUGX(item.estimatedCostSavingsUgx)}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer Sign-off Bar */}
            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span>Intervening Pharmacist: <strong className="text-slate-800 dark:text-slate-200">{item.pharmacistName}</strong> (PSU: {item.pharmacistPsuNo})</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{new Date(item.timestamp).toLocaleString()}</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5">
                  View Full Audit <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL 1: RECORD NEW CLINICAL INTERVENTION ─────────────────────────── */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/20 text-teal-500 rounded-xl">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Record Pharmacist Clinical Intervention
                  </h3>
                  <p className="text-xs text-slate-500">
                    Original Prescription ➔ Reason ➔ Action Taken ➔ Final Decision
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIntervention} className="mt-5 space-y-4 text-xs">
              {/* Patient & Prescriber Grid */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Prescription Ref # *</label>
                  <input
                    type="text"
                    required
                    value={rxRefNo}
                    onChange={e => setRxRefNo(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Grace Nakato"
                    value={patientNameInput}
                    onChange={e => setPatientNameInput(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Prescriber Doctor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Ronald Mukasa"
                    value={prescriberNameInput}
                    onChange={e => setPrescriberNameInput(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Step 1: Original Prescription Details */}
              <div className="border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 p-4 rounded-xl space-y-2.5">
                <h4 className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> 1. Original Prescription Snapshot (What Was Written)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Original Drug & Strength *</label>
                    <input
                      type="text"
                      required
                      placeholder="Augmentin 625mg Tablets"
                      value={origDrug}
                      onChange={e => setOrigDrug(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Prescribed Regimen / Posology *</label>
                    <input
                      type="text"
                      required
                      placeholder="1 tablet 12-hourly for 7 days"
                      value={origRegimen}
                      onChange={e => setOrigRegimen(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Original Quantity</label>
                    <input
                      type="number"
                      value={origQty}
                      onChange={e => setOrigQty(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Reason & Clinical Problem */}
              <div className="border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 p-4 rounded-xl space-y-2.5">
                <h4 className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> 2. Pharmacist Intervention Reason &amp; Clinical Problem
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Intervention Reason Category *</label>
                    <select
                      value={reasonCat}
                      onChange={e => setReasonCat(e.target.value as InterventionReasonCategory)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-amber-800 dark:text-amber-200"
                    >
                      <option value="dose_clarification_or_adjustment">Dose Clarification / Adjustment</option>
                      <option value="drug_drug_interaction">Drug-to-Drug Interaction</option>
                      <option value="allergy_or_contraindication_concern">Allergy Concern / Contraindication</option>
                      <option value="duplicate_therapy">Duplicate Therapy</option>
                      <option value="wrong_or_inappropriate_strength">Wrong Strength</option>
                      <option value="wrong_or_excessive_quantity">Wrong Quantity</option>
                      <option value="wrong_or_suboptimal_dosage_form">Wrong Dosage Form</option>
                      <option value="prescriber_clarification_needed">Prescriber Clarification</option>
                      <option value="therapeutic_or_generic_substitution">Substitution</option>
                      <option value="renal_or_hepatic_dose_adjustment">Renal / Hepatic Dose Adjustment</option>
                      <option value="adherence_or_cost_optimization">Adherence / Cost Optimization</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Evidence / Guideline Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. BNF 86 §5.1.1 / Uganda Clinical Guidelines"
                      value={guidelineRef}
                      onChange={e => setGuidelineRef(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Clinical Problem Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={clinicalProblemDesc}
                    onChange={e => setClinicalProblemDesc(e.target.value)}
                    placeholder="Describe the clinical discrepancy, safety hazard, or interaction detected..."
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Step 3: Action Taken & Proposed Regimen */}
              <div className="border border-teal-200 dark:border-teal-900/60 bg-teal-50/20 p-4 rounded-xl space-y-2.5">
                <h4 className="font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> 3. Action Taken &amp; Modified Regimen
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Action Taken *</label>
                    <select
                      value={actionTakenInput}
                      onChange={e => setActionTakenInput(e.target.value as InterventionActionTaken)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-teal-800 dark:text-teal-200"
                    >
                      <option value="prescriber_contacted_and_amended">Prescriber Contacted &amp; Amended</option>
                      <option value="dose_modified_per_protocol">Dose Modified per Protocol</option>
                      <option value="generic_brand_substituted">Generic / Brand Substituted</option>
                      <option value="dosage_form_changed">Dosage Form Changed</option>
                      <option value="drug_discontinued_and_replaced">Drug Discontinued &amp; Replaced</option>
                      <option value="patient_counseled_and_staggered">Patient Counseled &amp; Staggered</option>
                      <option value="prescription_refused_safety_grounds">Prescription Refused on Safety Grounds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Modified Drug &amp; Strength</label>
                    <input
                      type="text"
                      placeholder="Azithromycin 500mg Tablets"
                      value={modDrug}
                      onChange={e => setModDrug(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-teal-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Modified Regimen / Posology</label>
                    <input
                      type="text"
                      placeholder="1 tablet (500mg) OD for 3 days"
                      value={modRegimen}
                      onChange={e => setModRegimen(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Action Details</label>
                    <input
                      type="text"
                      required
                      value={actionDetailsInput}
                      onChange={e => setActionDetailsInput(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Final Outcome & Prescriber Engagement */}
              <div className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 p-4 rounded-xl space-y-2.5">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 4. Prescriber Engagement &amp; Final Decision
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Final Decision *</label>
                    <select
                      value={finalDecisionInput}
                      onChange={e => setFinalDecisionInput(e.target.value as InterventionFinalDecision)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-emerald-800 dark:text-emerald-200"
                    >
                      <option value="accepted_by_prescriber">Accepted by Prescriber</option>
                      <option value="partially_accepted_with_modification">Partially Accepted with Modification</option>
                      <option value="overridden_by_prescriber_with_rationale">Overridden by Prescriber</option>
                      <option value="pharmacist_authorized_protocol_change">Pharmacist Protocol Change</option>
                      <option value="prescription_cancelled_and_reissued">Prescription Cancelled &amp; Reissued</option>
                      <option value="referred_back_to_clinic">Referred Back to Clinic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Clinical Significance Grade *</label>
                    <select
                      value={significanceGradeInput}
                      onChange={e => setSignificanceGradeInput(e.target.value as ClinicalSignificanceGrade)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    >
                      <option value="grade_1_life_saving_prevented_fatal_event">Grade 1: Life-Saving / Fatal Prevented</option>
                      <option value="grade_2_major_prevented_serious_toxicity_or_hospitalization">Grade 2: Major Toxicity Prevented</option>
                      <option value="grade_3_moderate_optimized_efficacy_prevented_adr">Grade 3: Moderate Efficacy Optimization</option>
                      <option value="grade_4_minor_administrative_or_clarification">Grade 4: Minor Administrative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Est. Cost Savings (UGX)</label>
                    <input
                      type="number"
                      value={costSavingsInput}
                      onChange={e => setCostSavingsInput(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Prescriber Response &amp; Adverse Event Prevented Summary</label>
                  <input
                    type="text"
                    required
                    value={adverseEventPrevented}
                    onChange={e => setAdverseEventPrevented(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Save &amp; Log Clinical Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INTERVENTION AUDIT DETAIL VIEW ───────────────────────────── */}
      {selectedInterventionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Clinical Intervention Dossier — {selectedInterventionDetail.interventionReferenceNo}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Logged on {new Date(selectedInterventionDetail.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInterventionDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400">Patient:</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedInterventionDetail.patientName} ({selectedInterventionDetail.patientAge}y)</div>
                <div className="text-[11px] text-slate-500">Phone: {selectedInterventionDetail.patientPhone || 'N/A'}</div>
              </div>
              <div>
                <span className="text-slate-400">Prescriber:</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedInterventionDetail.prescriberName}</div>
                <div className="text-[11px] text-slate-500">{selectedInterventionDetail.prescriberFacility} ({selectedInterventionDetail.prescriberCouncilRegNo})</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg">
                <span className="font-bold text-rose-700 dark:text-rose-300">Original Rx:</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedInterventionDetail.originalPrescription.drugName} — {selectedInterventionDetail.originalPrescription.doseAndFrequency}
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                <span className="font-bold text-amber-700 dark:text-amber-300">Clinical Problem / Reason:</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedInterventionDetail.clinicalProblemDescription}</p>
                {selectedInterventionDetail.evidenceOrGuidelineReference && (
                  <div className="text-[10px] text-slate-400 mt-1">Ref: {selectedInterventionDetail.evidenceOrGuidelineReference}</div>
                )}
              </div>

              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-lg">
                <span className="font-bold text-teal-700 dark:text-teal-300">Action &amp; Modified Regimen:</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedInterventionDetail.actionDetails}</p>
                {selectedInterventionDetail.modifiedRegimen && (
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    Modified to: {selectedInterventionDetail.modifiedRegimen.drugName} ({selectedInterventionDetail.modifiedRegimen.doseAndFrequency})
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Outcome &amp; Prevented Adverse Event:</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedInterventionDetail.adverseEventPreventedSummary}</p>
                <div className="text-[11px] text-slate-500 mt-1">
                  Final Decision: <strong className="uppercase text-emerald-700">{selectedInterventionDetail.finalDecision.replace(/_/g, ' ')}</strong>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 text-slate-400 font-mono text-[10px] rounded-lg">
              <span className="text-emerald-400 font-bold">Digital Sign-off:</span> {selectedInterventionDetail.pharmacistName} (PSU: {selectedInterventionDetail.pharmacistPsuNo}) | Hash: {selectedInterventionDetail.digitalSignatureHash}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedInterventionDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
