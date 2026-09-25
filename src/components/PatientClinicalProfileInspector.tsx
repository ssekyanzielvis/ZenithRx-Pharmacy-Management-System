import React, { useState } from 'react';
import {
  PatientMedicationProfile,
  ClinicalSafetyAlert,
  ClinicalEvaluationResult,
  PharmacistDecisionAction,
} from '../types';
import { clinicalEvaluationService } from '../services/clinicalEvaluationService';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Info,
  Pill,
  User,
  Heart,
  Activity,
  History,
  FileCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Stethoscope,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Phone,
  Lock,
} from 'lucide-react';
import { PatientMedicationTimeline } from './PatientMedicationTimeline';

interface PatientClinicalProfileInspectorProps {
  prescriptionId?: string;
  prescriptionRefNo?: string;
  patientName?: string;
  patientId?: string;
  prescribedDrugNames: string[];
  pharmacistName?: string;
  pharmacistPsuNo?: string;
  onDecisionSubmitted?: (action: PharmacistDecisionAction, justification?: string) => void;
  readOnly?: boolean;
}

export const PatientClinicalProfileInspector: React.FC<PatientClinicalProfileInspectorProps> = ({
  prescriptionId = 'rx-preview-001',
  prescriptionRefNo = 'RX-2026-8819',
  patientName = 'Grace Nakato',
  patientId = 'cust-1',
  prescribedDrugNames = ['Augmentin 625mg', 'Ciprofloxacin 500mg'],
  pharmacistName = 'Dr. Arthur Ssenabulya',
  pharmacistPsuNo = 'PSU-2021-0892',
  onDecisionSubmitted,
  readOnly = false,
}) => {
  // Find or fetch patient profile
  const [profile, setProfile] = useState<PatientMedicationProfile | undefined>(() => {
    return clinicalEvaluationService.getProfileByPatientId(patientId) ||
           clinicalEvaluationService.getProfileByNameOrPhone(patientName);
  });

  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'profile' | 'timeline' | 'override'>('alerts');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [prescriberNote, setPrescriberNote] = useState('');
  const [decisionAction, setDecisionAction] = useState<PharmacistDecisionAction>('approved_safe');
  const [decisionRecorded, setDecisionRecorded] = useState<boolean>(false);

  // Evaluate candidate drugs against this patient profile
  const evaluation: ClinicalEvaluationResult = clinicalEvaluationService.evaluatePrescriptionSafety(
    prescribedDrugNames,
    profile
  );

  const handleRecordDecision = (action: PharmacistDecisionAction) => {
    if (action === 'overridden_with_justification' && !overrideJustification.trim()) {
      alert('Please provide a clinical justification for overriding flagged interactions.');
      return;
    }

    clinicalEvaluationService.recordPharmacistDecision({
      prescriptionId,
      prescriptionReferenceNo: prescriptionRefNo,
      patientId: profile?.patientId || patientId,
      action,
      pharmacistName,
      pharmacistRole: 'Supervising Pharmacist',
      pharmacistPsuNo,
      clinicalOverrideJustification: action === 'overridden_with_justification' ? overrideJustification : undefined,
      prescriberContactedNotes: action === 'prescriber_clarification_requested' ? prescriberNote : undefined,
      timestamp: new Date().toISOString(),
    });

    setDecisionAction(action);
    setDecisionRecorded(true);
    setShowOverrideModal(false);

    if (onDecisionSubmitted) {
      onDecisionSubmitted(action, overrideJustification);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 text-slate-100 shadow-xl space-y-5">
      {/* ── Top Header with Clinical Status Badge ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            evaluation.highestSeverity === 'contraindicated_fatal_risk'
              ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
              : evaluation.highestSeverity === 'major_clinical_hazard'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : evaluation.highestSeverity === 'moderate_advisory'
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                Clinical Context Safety Screen
              </h3>
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${
                evaluation.highestSeverity === 'contraindicated_fatal_risk'
                  ? 'bg-red-900/60 text-red-200 border-red-700'
                  : evaluation.highestSeverity === 'major_clinical_hazard'
                  ? 'bg-amber-900/60 text-amber-200 border-amber-700'
                  : evaluation.highestSeverity === 'moderate_advisory'
                  ? 'bg-blue-900/60 text-blue-200 border-blue-700'
                  : 'bg-emerald-900/60 text-emerald-200 border-emerald-700'
              }`}>
                {evaluation.hasAlerts ? `${evaluation.totalAlertsCount} Safety Flag(s) Detected` : 'All Clear / No Interactions'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Patient: <span className="font-bold text-white">{profile?.patientName || patientName}</span> (ID: {profile?.patientNinOrId || patientId}) | Prescribed: <span className="font-mono text-indigo-300">{prescribedDrugNames.join(', ')}</span>
            </p>
          </div>
        </div>

        {/* Pharmacist Final Authority Banner */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
          <Stethoscope className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] text-slate-300">
            Pharmacist Authority: <strong className="text-white">{pharmacistName}</strong>
          </span>
        </div>
      </div>

      {/* ── Core Principle Alert Banner ────────────────────────────────────────── */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-indigo-200 leading-relaxed">
          <strong>Decision-Support Rule:</strong> ZenithRx automatically flags candidate drugs against the patient’s active medications, allergies, chronic conditions, and reported OTCs. <strong>The system flags; the registered pharmacist makes the final clinical decision.</strong>
        </p>
      </div>

      {/* ── Sub Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 text-xs">
        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 transition-all ${
            activeSubTab === 'alerts'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Flagged Alerts ({evaluation.alerts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 transition-all ${
            activeSubTab === 'profile'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5 text-indigo-400" />
          Patient Medication Profile
        </button>

        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 transition-all ${
            activeSubTab === 'timeline'
              ? 'bg-teal-900/60 text-teal-200 border border-teal-600/80 shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5 text-teal-400" />
          Medication History Timeline
        </button>
      </div>

      {/* ── TAB 1: FLAGGED CLINICAL ALERTS ─────────────────────────────────────── */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-3">
          {evaluation.alerts.length === 0 ? (
            <div className="p-6 bg-slate-800/40 border border-slate-700 rounded-xl text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="font-bold text-white text-sm">No Potential Adverse Interactions Detected</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Candidate drugs cross-referenced against patient current therapies, documented allergies, chronic conditions, and reported OTCs with zero safety conflicts.
              </p>
            </div>
          ) : (
            evaluation.alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.severity === 'contraindicated_fatal_risk'
                    ? 'bg-red-950/40 border-red-500/50'
                    : alert.severity === 'major_clinical_hazard'
                    ? 'bg-amber-950/40 border-amber-500/50'
                    : 'bg-blue-950/40 border-blue-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {alert.severity === 'contraindicated_fatal_risk' ? (
                      <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    ) : alert.severity === 'major_clinical_hazard' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                        alert.severity === 'contraindicated_fatal_risk'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : alert.severity === 'major_clinical_hazard'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {alert.category.replace(/_/g, ' ')} • {alert.severity.replace(/_/g, ' ')}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-1">{alert.headline}</h4>
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 font-medium">Triggering Context:</span>
                    <p className="font-semibold text-amber-300 mt-0.5">{alert.interactingContext}</p>
                    <span className="text-slate-400 font-medium block mt-2">Pharmacological Mechanism:</span>
                    <p className="text-slate-300 text-[11px] mt-0.5">{alert.clinicalMechanism}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Hazard Explanation:</span>
                    <p className="text-red-300 text-[11px] mt-0.5">{alert.clinicalHazardExplanation}</p>
                    <span className="text-slate-400 font-medium block mt-2">Recommended Pharmacist Action:</span>
                    <p className="text-emerald-300 font-semibold text-[11px] mt-0.5">{alert.recommendedAction}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pharmacist Action Bar */}
          {!readOnly && (
            <div className="pt-3 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {decisionRecorded ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Pharmacist Decision Recorded: {decisionAction.replace(/_/g, ' ').toUpperCase()}
                  </span>
                ) : (
                  <span>Select clinical disposition:</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleRecordDecision('approved_safe')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve as Safe
                </button>

                {evaluation.hasAlerts && (
                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Override with Justification
                  </button>
                )}

                <button
                  onClick={() => handleRecordDecision('prescriber_clarification_requested')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" /> Request Prescriber Clarification
                </button>

                <button
                  onClick={() => handleRecordDecision('rejected_safety_grounds')}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject on Safety Grounds
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: FULL PATIENT MEDICATION PROFILE CONTEXT ─────────────────────── */}
      {activeSubTab === 'profile' && profile && (
        <div className="space-y-4 text-xs">
          {/* Active Medicines & Reported OTCs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Current Prescriptions */}
            <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Pill className="w-4 h-4 text-emerald-400" /> Active Prescribed Medicines ({profile.currentMedications.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {profile.currentMedications.map(med => (
                  <div key={med.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="font-bold text-white">{med.drugBrandName} ({med.strength})</div>
                    <div className="text-[11px] text-slate-400">{med.genericName} — {med.doseAndFrequency}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Prescribed by: {med.prescriberDoctor || 'N/A'} (Since {med.startDate})</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Reported OTCs & Supplements */}
            <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" /> Patient-Reported OTCs & Herbs ({profile.otcMedicationsReported.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {profile.otcMedicationsReported.map(otc => (
                  <div key={otc.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="font-bold text-amber-300">{otc.productName}</div>
                    <div className="text-[11px] text-slate-400">{otc.activeIngredient} — {otc.doseAndFrequency}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Reported Purpose: {otc.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documented Allergies & Chronic Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Allergies & ADR History */}
            <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4 text-red-400" /> Allergies & Prior ADRs ({profile.knownAllergies.length + profile.previousAdrs.length})
              </h4>
              <div className="space-y-2">
                {profile.knownAllergies.map(all => (
                  <div key={all.id} className="p-2.5 bg-red-950/30 border border-red-900/60 rounded-lg">
                    <div className="font-bold text-red-300">{all.allergenName}</div>
                    <div className="text-[11px] text-slate-400">Reaction: {all.reactionType} ({all.severity})</div>
                  </div>
                ))}
                {profile.previousAdrs.map(adr => (
                  <div key={adr.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="font-bold text-slate-300">ADR: {adr.suspectedDrug}</div>
                    <div className="text-[11px] text-slate-400">{adr.reactionDescription} (Causality: {adr.causality})</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Heart className="w-4 h-4 text-rose-400" /> Chronic Conditions & Comorbidities ({profile.chronicConditions.length})
              </h4>
              <div className="space-y-2">
                {profile.chronicConditions.map(cond => (
                  <div key={cond.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="font-bold text-white">{cond.conditionName}</div>
                    <div className="text-[11px] text-slate-400">Status: <span className="font-semibold text-emerald-400">{cond.status}</span> ({cond.severityLevel})</div>
                    {cond.notes && <div className="text-[10px] text-slate-500 mt-1">{cond.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LONGITUDINAL MEDICATION HISTORY TIMELINE ────────────────────── */}
      {activeSubTab === 'timeline' && (
        <div className="pt-1">
          <PatientMedicationTimeline
            patientId={profile?.patientId || patientId}
            patientName={profile?.patientName || patientName}
            patientAge={profile?.age || 44}
            patientGender={profile?.gender || 'Female'}
            compact={false}
          />
        </div>
      )}

      {/* ── OVERRIDE MODAL WITH MANDATORY CLINICAL JUSTIFICATION ─────────────── */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Pharmacist Clinical Override Justification</h3>
                <p className="text-xs text-slate-400">
                  Mandatory regulatory record under National Drug Authority Good Dispensing Practice.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Clinical Rationale & Mitigation Plan *
              </label>
              <textarea
                rows={4}
                required
                value={overrideJustification}
                onChange={e => setOverrideJustification(e.target.value)}
                placeholder="e.g. Discussed with Dr. Mukasa; Ciprofloxacin dose reduced to 250mg BD, patient educated on hypoglycemia symptoms with home glucometer log. Benefit outweighs risk."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRecordDecision('overridden_with_justification')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Sign & Authorize Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
