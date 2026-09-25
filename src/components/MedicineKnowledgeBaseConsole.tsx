import React, { useState } from 'react';
import {
  getMedicineKnowledgeMonographs,
  evaluateClinicalDecision,
  MedicineKnowledgeMonograph,
  PatientClinicalContext,
  ClinicalDecisionOutcome
} from '../services/medicineKnowledgeBaseService';
import {
  BookOpen,
  Stethoscope,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Info,
  Clock,
  Pill,
  Thermometer,
  FileText,
  UserCheck,
  Sparkles,
  Zap,
  Activity,
  HeartPulse,
  Printer,
  ChevronRight,
  Layers,
  Sliders,
  Check,
  X,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

const SAMPLE_PATIENTS: PatientClinicalContext[] = [
  {
    patientId: 'pat-101',
    patientName: 'Kato Emmanuel',
    age: 64,
    gender: 'MALE',
    weightKg: 78,
    egfrMlMin: 38, // Moderate-to-severe renal impairment
    knownAllergies: ['Penicillin (Severe hives & facial angioedema)'],
    concurrentMedications: ['Losartan 50mg daily', 'Amlodipine 5mg daily'],
    diagnosedConditions: ['Hypertension Stage 2', 'Chronic Kidney Disease Stage 3b']
  },
  {
    patientId: 'pat-102',
    patientName: 'Aisha Namaganda',
    age: 48,
    gender: 'FEMALE',
    weightKg: 65,
    egfrMlMin: 22, // Severe renal impairment (<30 mL/min)
    knownAllergies: ['Sulfa drugs'],
    concurrentMedications: ['Metformin 1000mg BID', 'Atorvastatin 20mg daily'],
    diagnosedConditions: ['Type 2 Diabetes Mellitus', 'Diabetic Nephropathy']
  },
  {
    patientId: 'pat-103',
    patientName: 'Sarah Nalubega',
    age: 56,
    gender: 'FEMALE',
    weightKg: 52,
    egfrMlMin: 28, // Renal impairment
    knownAllergies: ['None documented'],
    concurrentMedications: ['Diazepam 5mg PRN', 'Paracetamol 1g PRN'],
    diagnosedConditions: ['Stage IV Cervical Carcinoma', 'Chronic Breakthrough Pain']
  }
];

export const MedicineKnowledgeBaseConsole: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'REFERENCE_MONOGRAPHS' | 'CLINICAL_DECISION_MAKING'>('REFERENCE_MONOGRAPHS');
  const monographs = getMedicineKnowledgeMonographs();
  
  // Reference Mode State
  const [selectedMonographId, setSelectedMonographId] = useState<string>(monographs[0]?.id || 'mono-amox-clav');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMonographTab, setActiveMonographTab] = useState<'OVERVIEW' | 'DOSAGE' | 'SAFETY' | 'INTERACTIONS' | 'STORAGE_ADMIN' | 'PATIENT_EDUCATION'>('OVERVIEW');

  // Clinical Decision Mode State
  const [selectedPatient, setSelectedPatient] = useState<PatientClinicalContext>(SAMPLE_PATIENTS[0]);
  const [selectedTargetDrugId, setSelectedTargetDrugId] = useState<string>(monographs[0]?.id || 'mono-amox-clav');
  const [prescribedDoseInput, setPrescribedDoseInput] = useState('625mg tablet orally 12-hourly');
  const [evaluationOutcome, setEvaluationOutcome] = useState<ClinicalDecisionOutcome | null>(null);

  const currentMonograph = monographs.find(m => m.id === selectedMonographId) || monographs[0];
  const targetDrugForDecision = monographs.find(m => m.id === selectedTargetDrugId) || monographs[0];

  const filteredMonographs = monographs.filter(m => 
    m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.brandNames.some(b => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
    m.therapeuticClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.approvedUses.some(u => u.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRunClinicalEvaluation = () => {
    const outcome = evaluateClinicalDecision(
      selectedPatient,
      targetDrugForDecision,
      prescribedDoseInput,
      'Dr. Arthur Ssenabulya (Supervising Pharmacist)',
      'NDA/PHARM/2019/0411'
    );
    setEvaluationOutcome(outcome);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Establishing the Dual Architecture */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Pharmacological Knowledge System
              </span>
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                <Stethoscope className="w-3 h-3" /> Evidence-Based Clinical Practice
              </span>
            </div>
            
            <h2 className="text-2xl font-black tracking-tight text-white">
              Medicine Knowledge Base &amp; Clinical Decision Engine
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintains a strict architectural distinction between <strong>Static Pharmacological Reference Information</strong> (standard uses, dosing tables, contraindications, side effects, storage, warnings) and <strong>Dynamic Patient Clinical Decision-Making</strong> (contextual organ function titration, allergy screening, and personalized risk vs benefit stratification).
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => { setActiveMode('REFERENCE_MONOGRAPHS'); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition cursor-pointer text-left border ${
                activeMode === 'REFERENCE_MONOGRAPHS'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg ring-2 ring-indigo-400/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              <div>
                <div>1. Reference Information</div>
                <div className="text-[10px] font-normal text-indigo-200">Static monographs &amp; guides</div>
              </div>
            </button>

            <button
              onClick={() => { setActiveMode('CLINICAL_DECISION_MAKING'); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition cursor-pointer text-left border ${
                activeMode === 'CLINICAL_DECISION_MAKING'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg ring-2 ring-emerald-400/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-emerald-300" />
              <div>
                <div>2. Clinical Decision-Making</div>
                <div className="text-[10px] font-normal text-emerald-200">Patient-contextual evaluation</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          PILLAR 1: REFERENCE INFORMATION COMPENDIUM
      ────────────────────────────────────────────────────────────────────────── */}
      {activeMode === 'REFERENCE_MONOGRAPHS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Monograph Directory (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Formulary Monographs ({filteredMonographs.length})
                </h3>
                <span className="text-[10px] font-bold text-slate-400">BNF / UCG 2023</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search drug name, brand, or class..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Drug Monograph List */}
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredMonographs.map(mono => {
                const isSelected = mono.id === selectedMonographId;
                return (
                  <div
                    key={mono.id}
                    onClick={() => setSelectedMonographId(mono.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                        {mono.genericName}
                      </span>
                      <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                        {mono.atcCode}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1">
                      {mono.therapeuticClass}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {mono.brandNames.map((brand, bIdx) => (
                        <span key={bIdx} className="text-[9px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Monograph Deep View (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Monograph Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      ATC: {currentMonograph.atcCode}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-500">
                      Reviewed: {currentMonograph.lastClinicalReviewDate}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    {currentMonograph.genericName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {currentMonograph.therapeuticClass}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Static Reference Standard
                  </span>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
                {[
                  { key: 'OVERVIEW', label: 'Uses & Indications' },
                  { key: 'DOSAGE', label: 'Dosage References' },
                  { key: 'SAFETY', label: 'Contraindications & Safety' },
                  { key: 'INTERACTIONS', label: 'Drug Interactions' },
                  { key: 'STORAGE_ADMIN', label: 'Storage & Admin' },
                  { key: 'PATIENT_EDUCATION', label: 'Patient Handout' }
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveMonographTab(t.key as any)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
                      activeMonographTab === t.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT: USES & INDICATIONS */}
            {activeMonographTab === 'OVERVIEW' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approved Clinical Uses &amp; Indications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentMonograph.approvedUses.map((use, uIdx) => (
                      <div key={uIdx} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{use}</span>
                      </div>
                    ))}
                  </div>

                  {currentMonograph.offLabelUses.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-500" />
                        Off-Label &amp; Guideline-Endorsed Uses
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentMonograph.offLabelUses.map((off, oIdx) => (
                          <div key={oIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            <span>{off}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: DOSAGE REFERENCES */}
            {activeMonographTab === 'DOSAGE' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-indigo-600" />
                    Standard Dosage Reference Matrix
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Max Daily Ceiling: {currentMonograph.dosageReferences.maxDailyCeiling}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Adult Standard Regimen</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentMonograph.dosageReferences.adultStandard}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pediatric Dosing Reference</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentMonograph.dosageReferences.pediatric}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Renal Impairment Tranches (eGFR / CrCl)</span>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">{currentMonograph.dosageReferences.renalAdjustment}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hepatic Impairment Guidance</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentMonograph.dosageReferences.hepaticAdjustment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CONTRAINDICATIONS & SAFETY */}
            {activeMonographTab === 'SAFETY' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-rose-700 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    Contraindications (Absolute vs Relative)
                  </h4>

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
                      <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">Absolute Contraindications (Do Not Administer)</span>
                      <ul className="space-y-1.5">
                        {currentMonograph.contraindications.absolute.map((abs, aIdx) => (
                          <li key={aIdx} className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-start gap-2">
                            <X className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                            <span>{abs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Relative Contraindications &amp; Precautions</span>
                      <ul className="space-y-1.5">
                        {currentMonograph.contraindications.relative.map((rel, rIdx) => (
                          <li key={rIdx} className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <span>{rel}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Black Box Warnings */}
                  {currentMonograph.sideEffects.blackBox.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Black Box / Critical Safety Warning
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                        {currentMonograph.sideEffects.blackBox.join(' ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: DRUG INTERACTIONS */}
            {activeMonographTab === 'INTERACTIONS' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Pharmacokinetic &amp; Pharmacodynamic Interactions
                </h4>

                <div className="space-y-3">
                  {currentMonograph.drugInteractions.map((ddi, dIdx) => (
                    <div
                      key={dIdx}
                      className={`p-4 rounded-2xl border ${
                        ddi.severity === 'CRITICAL'
                          ? 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/40 dark:border-rose-900'
                          : ddi.severity === 'HIGH'
                          ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/40 dark:border-amber-900'
                          : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                          {currentMonograph.genericName} + {ddi.interactingDrug}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                          ddi.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : ddi.severity === 'HIGH'
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {ddi.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <strong>Mechanism:</strong> {ddi.mechanism}
                      </p>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl mt-1.5">
                        <strong>Clinical Management:</strong> {ddi.management}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: STORAGE & ADMINISTRATION */}
            {activeMonographTab === 'STORAGE_ADMIN' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-sky-600" />
                    Storage &amp; Physical Stability
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Temperature Range</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{currentMonograph.storageGuidelines.temperatureCelsius}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Post-Reconstitution Stability</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{currentMonograph.storageGuidelines.postReconstitutionSuspension}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Administration Protocol
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Timing &amp; Meal Coordination</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{currentMonograph.administrationInstructions.timing}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Special Directives</span>
                      <span className="text-slate-700 dark:text-slate-300">{currentMonograph.administrationInstructions.specialInstructions}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PATIENT EDUCATION */}
            {activeMonographTab === 'PATIENT_EDUCATION' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Plain-Language Patient Counseling Handout
                  </h4>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Handout
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-semibold">
                  {currentMonograph.patientEducationHandout.summary}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                    Essential Counseling Points for Pharmacist
                  </span>
                  <ul className="space-y-2">
                    {currentMonograph.patientEducationHandout.keyCounselingPoints.map((pt, pIdx) => (
                      <li key={pIdx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1.5">
                  <span className="text-xs font-black text-rose-700 uppercase tracking-wider block">
                    🚨 Red-Flag Emergency Symptoms (Seek Hospital ER Immediately)
                  </span>
                  <ul className="space-y-1">
                    {currentMonograph.patientEducationHandout.redFlagSymptoms.map((rf, rIdx) => (
                      <li key={rIdx} className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          PILLAR 2: CLINICAL DECISION-MAKING WORKBENCH
      ────────────────────────────────────────────────────────────────────────── */}
      {activeMode === 'CLINICAL_DECISION_MAKING' && (
        <div className="space-y-6">
          
          {/* Patient Context & Target Drug Evaluator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Patient Profile Selector (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Select Patient Clinical Context
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  Live EHR Profile
                </span>
              </div>

              {/* Sample Patient Cards */}
              <div className="space-y-2">
                {SAMPLE_PATIENTS.map(pat => {
                  const isSelected = pat.patientId === selectedPatient.patientId;
                  return (
                    <div
                      key={pat.patientId}
                      onClick={() => {
                        setSelectedPatient(pat);
                        setEvaluationOutcome(null);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-400'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 dark:text-slate-100">{pat.patientName}</span>
                        <span className="text-[10px] font-bold text-slate-500">{pat.age}y • {pat.gender}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        <span className={`font-bold font-mono px-1.5 py-0.2 rounded ${
                          pat.egfrMlMin < 30 ? 'bg-rose-100 text-rose-800' : pat.egfrMlMin < 60 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          eGFR: {pat.egfrMlMin} mL/min
                        </span>
                        <span>{pat.knownAllergies.length > 0 ? pat.knownAllergies[0] : 'No known allergies'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Patient Detailed EHR Inspector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Active Concurrent Regimen &amp; Conditions
                </span>
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Concurrent Meds: </span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono">{selectedPatient.concurrentMedications.join(', ')}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Diagnosed: </span>
                  <span className="text-slate-900 dark:text-slate-100">{selectedPatient.diagnosedConditions.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Right: Target Prescription Formulation to Evaluate (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  Prescribed Therapy &amp; Dosage Formulation
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Clinical Simulator
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Select Target Drug Monograph
                  </label>
                  <select
                    value={selectedTargetDrugId}
                    onChange={e => {
                      setSelectedTargetDrugId(e.target.value);
                      setEvaluationOutcome(null);
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {monographs.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.genericName} ({m.therapeuticClass})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Prescribed Dosage Regimen to Test
                  </label>
                  <input
                    type="text"
                    value={prescribedDoseInput}
                    onChange={e => setPrescribedDoseInput(e.target.value)}
                    placeholder="e.g. 1000mg twice daily with meals"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Execute Button */}
                <button
                  onClick={handleRunClinicalEvaluation}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  Run Contextual Clinical Decision Evaluation
                </button>
              </div>
            </div>

          </div>

          {/* Clinical Decision Evaluation Outcome Report */}
          {evaluationOutcome && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
              
              {/* Decision Recommendation Banner */}
              <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                evaluationOutcome.decisionRecommendation === 'CONTRAINDICATED_SUBSTITUTE'
                  ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800'
                  : evaluationOutcome.decisionRecommendation === 'DOSE_ADJUSTMENT_REQUIRED'
                  ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800'
                  : evaluationOutcome.decisionRecommendation === 'COUNSEL_WITH_MONITORING'
                  ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/50 dark:border-blue-800'
                  : 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800'
              }`}>
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    evaluationOutcome.decisionRecommendation === 'CONTRAINDICATED_SUBSTITUTE'
                      ? 'bg-rose-600 text-white'
                      : evaluationOutcome.decisionRecommendation === 'DOSE_ADJUSTMENT_REQUIRED'
                      ? 'bg-amber-600 text-white'
                      : evaluationOutcome.decisionRecommendation === 'COUNSEL_WITH_MONITORING'
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    Clinical Outcome: {evaluationOutcome.decisionRecommendation}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {evaluationOutcome.pharmacistActionSummary}
                  </h3>
                </div>

                {evaluationOutcome.recommendedAdjustedDosage && (
                  <div className="text-right sm:self-center shrink-0 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-amber-300 dark:border-amber-700">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Titrated Safe Dose</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                      {evaluationOutcome.recommendedAdjustedDosage}
                    </span>
                  </div>
                )}
              </div>

              {/* Detailed Risks List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Patient-Specific Risks &amp; Evidence-Based Interventions ({evaluationOutcome.risksIdentified.length})
                </h4>

                {evaluationOutcome.risksIdentified.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    No patient-specific contraindications or renal mismatches detected for this prescription.
                  </div>
                ) : (
                  evaluationOutcome.risksIdentified.map((risk, rIdx) => (
                    <div
                      key={rIdx}
                      className={`p-4 rounded-2xl border ${
                        risk.severity === 'CRITICAL'
                          ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
                          : 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                          risk.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {risk.severity}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">{risk.title}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{risk.clinicalExplanation}</p>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/60 mt-2">
                        <strong>Evidence-Based Pharmacist Action:</strong> {risk.evidenceBasedAction}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Monitoring Parameters */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Prescription Monitoring &amp; Patient Follow-up Plan
                </span>
                <div className="flex flex-wrap gap-2">
                  {evaluationOutcome.monitoringParameters.map((param, pIdx) => (
                    <span key={pIdx} className="text-xs font-semibold bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      📋 {param}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default MedicineKnowledgeBaseConsole;
