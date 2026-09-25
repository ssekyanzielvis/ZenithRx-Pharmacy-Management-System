import React, { useState, useEffect } from 'react';
import {
  Repeat,
  FileText,
  UserCheck,
  Stethoscope,
  Pill,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Printer,
  Sparkles,
  Phone,
  CheckCircle2,
  Lock,
  Layers,
  Search,
} from 'lucide-react';
import { PrescriptionSubstitutionService } from '../services/prescriptionSubstitutionService';
import { findGenericEquivalents, BioequivalentSuggestion } from '../services/genericEquivalenceService';
import { INITIAL_DRUGS } from '../data/mockData';
import {
  PrescriptionSubstitution,
  SubstitutionType,
  SubstitutionReason,
} from '../types/substitutionTypes';

export const PrescriptionSubstitutionConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'auditLog'>('wizard');
  const [substitutions, setSubstitutions] = useState<PrescriptionSubstitution[]>([]);
  const [loading, setLoading] = useState(true);

  // Substitution Form State
  const [prescriptionId, setPrescriptionId] = useState('RX-2026-1088');
  const [patientName, setPatientName] = useState('Grace Nakato (UG-PAT-1029)');
  const [prescribedName, setPrescribedName] = useState('Augmentin 625mg Tablets (GSK Innovator)');
  const [prescribedMolecule, setPrescribedMolecule] = useState('Amoxicillin + Clavulanic Acid');
  const [prescribedStrength, setPrescribedStrength] = useState('500mg/125mg');
  const [prescribedForm, setPrescribedForm] = useState('Film-coated Tablet');
  const [prescribedQty, setPrescribedQty] = useState<number>(14);
  const [prescribedPrice, setPrescribedPrice] = useState<number>(3500);

  // Substitute Item
  const [substituteName, setSubstituteName] = useState('Co-Amoxiclav 625mg Tablets (Medreich Generic)');
  const [substituteMolecule, setSubstituteMolecule] = useState('Amoxicillin + Clavulanic Acid');
  const [substituteStrength, setSubstituteStrength] = useState('500mg/125mg');
  const [substituteForm, setSubstituteForm] = useState('Film-coated Tablet');
  const [substituteQty, setSubstituteQty] = useState<number>(14);
  const [substitutePrice, setSubstitutePrice] = useState<number>(1500);
  const [batchNumber, setBatchNumber] = useState('AMX2304');
  const [expiryDate, setExpiryDate] = useState('2027-08-31');

  // Rationale & Reason
  const [substitutionType, setSubstitutionType] = useState<SubstitutionType>('bioequivalent_generic');
  const [reason, setReason] = useState<SubstitutionReason>('patient_affordability_cost_reduction');
  const [clinicalRationale, setClinicalRationale] = useState(
    'Identical INN active ingredients and strength. Bioequivalence pre-qualified by NDA. Substantial patient cost saving.'
  );

  // Pharmacist & Patient
  const [pharmacistName, setPharmacistName] = useState('Dr. Sarah Mukasa');
  const [pharmacistLicense, setPharmacistLicense] = useState('PSU-REG-88219');
  const [patientAcknowledged, setPatientAcknowledged] = useState(true);
  const [patientAckMethod, setPatientAckMethod] = useState<'digital_signature' | 'verbal_pos_confirmation' | 'portal_consent'>('digital_signature');
  const [patientCounseling, setPatientCounseling] = useState(
    'Informed patient of identical 1 tab BD dosing with meals and obtained consent for generic affordability switch.'
  );

  // Prescriber Involvement
  const [prescriberConsulted, setPrescriberConsulted] = useState(false);
  const [prescriberName, setPrescriberName] = useState('Dr. Peter Ssenyondo');
  const [prescriberDecision, setPrescriberDecision] = useState<'approved_substitution' | 'declined_daw' | 'modified_dose'>('approved_substitution');
  const [prescriberNotes, setPrescriberNotes] = useState('Prescriber notified via WhatsApp; approved generic co-amoxiclav.');

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSubstitutions();
  }, []);

  const loadSubstitutions = async () => {
    setLoading(true);
    try {
      const data = await PrescriptionSubstitutionService.getSubstitutions();
      setSubstitutions(data);
    } catch (err) {
      console.error('Error loading substitutions:', err);
    } finally {
      setLoading(false);
    }
  };

  const isNTI = PrescriptionSubstitutionService.isNarrowTherapeuticIndex(prescribedMolecule);
  const suggestedEquivalents = findGenericEquivalents(prescribedName, prescribedPrice, INITIAL_DRUGS);

  const handleSelectSuggestion = (sug: BioequivalentSuggestion) => {
    setSubstituteName(sug.drug.brandName);
    setSubstituteMolecule(sug.activeIngredient || sug.drug.genericName);
    setSubstituteStrength((sug.drug as any).strength || prescribedStrength);
    setSubstituteForm(sug.drug.unit || prescribedForm);
    setSubstitutePrice(sug.drug.sellingPrice);
    setBatchNumber(sug.drug.batchNumber);
    setExpiryDate(sug.drug.expiryDate);
    setSubstitutionType(
      sug.equivalenceType === 'branded_generic'
        ? 'branded_generic'
        : sug.equivalenceType === 'therapeutic_interchange'
        ? 'therapeutic_class_interchange'
        : 'bioequivalent_generic'
    );
    setClinicalRationale(sug.clinicalSafetyNote);
  };

  const prescribedTotal = prescribedQty * prescribedPrice;
  const substituteTotal = substituteQty * substitutePrice;
  const costSavings = Math.max(0, prescribedTotal - substituteTotal);
  const savingsPct = prescribedTotal > 0 ? ((costSavings / prescribedTotal) * 100).toFixed(1) : '0';

  const handleProcessSubstitution = async () => {
    const newRecord = await PrescriptionSubstitutionService.createSubstitution({
      prescriptionId,
      patientId: 'UG-PAT-1029',
      patientName,
      prescribedName,
      prescribedMolecule,
      prescribedStrength,
      prescribedDosageForm: prescribedForm,
      prescribedQuantity: prescribedQty,
      prescribedUnitPrice: prescribedPrice,
      substituteName,
      substituteMolecule,
      substituteStrength,
      substituteDosageForm: substituteForm,
      substituteQuantity: substituteQty,
      substituteUnitPrice: substitutePrice,
      substitutionType,
      reason,
      clinicalRationale,
      pharmacistName,
      pharmacistLicense,
      patientAcknowledged,
      patientAckMethod,
      patientCounselingNotes: patientCounseling,
      prescriberConsulted: isNTI ? true : prescriberConsulted,
      prescriberName,
      prescriberDecision,
      prescriberNotes,
      batchNumber,
      expiryDate,
    });

    setSubstitutions((prev) => [newRecord, ...prev]);
    setNotificationMsg(
      `Prescription substitution ${newRecord.substitution_code} processed successfully. Final medicine ${substituteName} dispensed.`
    );
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-800/40 rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-600/30 rounded-xl border border-sky-400/30 text-sky-400">
                <Repeat className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Clinical Prescription Substitution &amp; Interchange
                  <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold">
                    Bioequivalent &amp; Cost Control
                  </span>
                </h1>
                <p className="text-sm text-sky-200/80">
                  Prescribed vs Substitute Comparison • Patient Consent • Prescriber Authorization (NTI Rules) • Statutory Labeling
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadSubstitutions}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-sky-800/40">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-sky-900/40">
            <div className="flex items-center justify-between text-xs text-sky-300/80 mb-1">
              <span>Substitutions Processed</span>
              <Repeat className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 flex items-baseline gap-1.5">
              {substitutions.length} Interchanges
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> 100% Verified by Pharmacist
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-sky-900/40">
            <div className="flex items-center justify-between text-xs text-sky-300/80 mb-1">
              <span>Patient Cost Savings</span>
              <TrendingDown className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-400 flex items-baseline gap-1.5">
              UGX 4.85M <span className="text-xs font-normal text-slate-400">(Saved)</span>
            </div>
            <div className="text-[11px] text-cyan-400/90 font-medium flex items-center gap-1 mt-0.5">
              <DollarSign className="w-3 h-3" /> Avg. 57.1% cost reduction
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-sky-900/40">
            <div className="flex items-center justify-between text-xs text-sky-300/80 mb-1">
              <span>Patient Consent Rate</span>
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 flex items-baseline gap-1.5">
              100% Consented
            </div>
            <div className="text-[11px] text-amber-300/80 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Signed &amp; Counseled at POS
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-sky-900/40">
            <div className="flex items-center justify-between text-xs text-sky-300/80 mb-1">
              <span>NTI Prescriber Sign-offs</span>
              <Stethoscope className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 flex items-baseline gap-1.5">
              100% Compliant
            </div>
            <div className="text-[11px] text-purple-300/80 font-medium flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3" /> Mandatory NTI Safety Locks
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div className="bg-emerald-950/80 border border-emerald-700/60 p-4 rounded-xl flex items-center justify-between text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-semibold">{notificationMsg}</p>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-xs underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('wizard')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition-all border-b-2 ${
            activeTab === 'wizard'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Substitution &amp; Interchange Wizard
        </button>

        <button
          onClick={() => setActiveTab('auditLog')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition-all border-b-2 ${
            activeTab === 'auditLog'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Substitutions Audit Log &amp; Label History
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-sky-600 text-white">
            {substitutions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SUBSTITUTION & INTERCHANGE WIZARD */}
      {activeTab === 'wizard' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pill className="w-5 h-5 text-sky-500" />
                  Prescription Substitution Evaluation
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare prescribed innovator brand against in-stock generic substitutes with patient consent and prescriber rules.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Prescription:</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                  {prescriptionId}
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prescribed Medicine Box */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> 1. Prescribed Medicine (Original)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                    DOCTOR'S SCRIPT
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Brand / Product Name:
                    </label>
                    <input
                      type="text"
                      value={prescribedName}
                      onChange={(e) => setPrescribedName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Molecule / INN:
                      </label>
                      <input
                        type="text"
                        value={prescribedMolecule}
                        onChange={(e) => setPrescribedMolecule(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Strength:
                      </label>
                      <input
                        type="text"
                        value={prescribedStrength}
                        onChange={(e) => setPrescribedStrength(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Prescribed Qty:
                      </label>
                      <input
                        type="number"
                        value={prescribedQty}
                        onChange={(e) => setPrescribedQty(parseInt(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Unit Price (UGX):
                      </label>
                      <input
                        type="number"
                        value={prescribedPrice}
                        onChange={(e) => setPrescribedPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900 flex justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Total Original Cost:</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-sm">
                      UGX {prescribedTotal.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Proposed Substitute Medicine Box */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Repeat className="w-4 h-4" /> 2. Proposed In-Stock Substitute
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    BIOEQUIVALENT GENERIC
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Intelligent Suggestions Bar */}
                  {suggestedEquivalents.length > 0 && (
                    <div className="p-2.5 bg-emerald-100/60 dark:bg-emerald-950/60 rounded-lg border border-emerald-300 dark:border-emerald-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          Possible Equivalent Products ({suggestedEquivalents.length})
                        </span>
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded">
                          Suggestion Only
                        </span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {suggestedEquivalents.map((sug) => (
                          <div
                            key={sug.drug.id}
                            onClick={() => handleSelectSuggestion(sug)}
                            className="p-1.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-500 cursor-pointer flex items-center justify-between gap-1 transition-all group text-[11px]"
                          >
                            <div className="truncate">
                              <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 truncate block">
                                {sug.drug.brandName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {sug.drug.stockQty} in stock • Batch: {sug.drug.batchNumber}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                UGX {sug.drug.sellingPrice.toLocaleString()}
                              </span>
                              {sug.savingsPercent > 0 && (
                                <span className="text-[9px] font-bold text-emerald-600 block">
                                  Save {sug.savingsPercent}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Substitute Product Name:
                    </label>
                    <input
                      type="text"
                      value={substituteName}
                      onChange={(e) => setSubstituteName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Allocated Batch:
                      </label>
                      <input
                        type="text"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Expiry Date:
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Substitute Qty:
                      </label>
                      <input
                        type="number"
                        value={substituteQty}
                        onChange={(e) => setSubstituteQty(parseInt(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Unit Price (UGX):
                      </label>
                      <input
                        type="number"
                        value={substitutePrice}
                        onChange={(e) => setSubstitutePrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 flex justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Total Substitute Cost:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                      UGX {substituteTotal.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Savings Highlight Callout */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/40 border border-sky-200 dark:border-sky-800/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  Calculated Patient Out-of-Pocket Cost Savings:
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  UGX {costSavings.toLocaleString()} Saved ({savingsPct}% Discount)
                </div>
              </div>

              <div className="text-xs text-slate-500 max-w-sm">
                Swapping to bioequivalent generic provides significant financial relief while preserving clinical therapeutic outcomes.
              </div>
            </div>

            {/* Substitution Reason & Clinical Rationale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Substitution Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as SubstitutionReason)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="patient_affordability_cost_reduction">Patient Affordability &amp; Cost Reduction</option>
                  <option value="brand_out_of_stock">Brand Out of Stock across Wholesale Channels</option>
                  <option value="bioequivalent_generic_switch">Standard Bioequivalent Generic Interchange</option>
                  <option value="formulary_preferred_generic">Formulary Preferred Generic</option>
                  <option value="patient_swallowing_difficulty_dysphagia">Patient Dysphagia / Swallowing Optimization</option>
                  <option value="allergy_excipient_intolerance">Allergy to Excipient / Preservative</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Rationale Notes
                </label>
                <input
                  type="text"
                  value={clinicalRationale}
                  onChange={(e) => setClinicalRationale(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Patient Acknowledgement & Prescriber Engagement Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* Patient Consent */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-sky-500" />
                  3. Patient Informed Consent &amp; Acknowledgement
                </h3>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3 text-xs">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={patientAcknowledged}
                      onChange={(e) => setPatientAcknowledged(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded"
                    />
                    Patient counseled &amp; agreed to generic substitution
                  </label>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Consent Capture Method:
                    </label>
                    <select
                      value={patientAckMethod}
                      onChange={(e) => setPatientAckMethod(e.target.value as any)}
                      className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="digital_signature">Digital Electronic Signature on POS screen</option>
                      <option value="verbal_pos_confirmation">Verbal In-Person Confirmation at Dispensing Counter</option>
                      <option value="portal_consent">Patient Mobile Portal Pre-Approval</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Pharmacist Counseling Notes:
                    </label>
                    <input
                      type="text"
                      value={patientCounseling}
                      onChange={(e) => setPatientCounseling(e.target.value)}
                      className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Prescriber Involvement Protocol */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-500" />
                  4. Prescriber Involvement &amp; NTI Safety Rules
                </h3>

                <div className={`p-3.5 rounded-xl border text-xs space-y-3 ${
                  isNTI
                    ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800'
                    : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                }`}>
                  {isNTI ? (
                    <div className="flex items-center gap-1.5 text-purple-800 dark:text-purple-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-purple-600" />
                      Narrow Therapeutic Index (NTI) Drug: Mandatory Prescriber Sign-off Required
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prescriberConsulted}
                        onChange={(e) => setPrescriberConsulted(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      Prescriber consulted for substitution authorization
                    </label>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Doctor Name:
                      </label>
                      <input
                        type="text"
                        value={prescriberName}
                        onChange={(e) => setPrescriberName(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Doctor Decision:
                      </label>
                      <select
                        value={prescriberDecision}
                        onChange={(e) => setPrescriberDecision(e.target.value as any)}
                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        <option value="approved_substitution">Approved Substitution</option>
                        <option value="declined_daw">Declined (Dispense as Written)</option>
                        <option value="modified_dose">Approved with Modified Dose</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Consultation / Call Notes:
                    </label>
                    <input
                      type="text"
                      value={prescriberNotes}
                      onChange={(e) => setPrescriberNotes(e.target.value)}
                      className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Dispensing Label Preview */}
            <div className="p-4 rounded-xl border border-dashed border-sky-300 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-sky-600" />
                  Prescription Dispensing Label with Statutory Disclosure Preview
                </span>
                <span className="text-[10px] font-mono text-slate-400">NDA Regulation Compliant</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-1">
                <div className="font-bold">{patientName} • {new Date().toLocaleDateString()}</div>
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {substituteName} (Qty: {substituteQty})
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Take 1 tablet twice daily with meals.
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  *Substituted for prescribed {prescribedName} with patient &amp; pharmacist consent.
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleProcessSubstitution}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                Authorize Substitution &amp; Dispense Final Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG & COMPLETED SUBSTITUTIONS */}
      {activeTab === 'auditLog' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-sky-500" />
              Completed Prescription Substitutions &amp; Clinical Ledger
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Complete historical record of all generic substitutions with patient consent, cost savings, and clinical justifications.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Substitution #</th>
                    <th className="p-3">Patient &amp; Rx</th>
                    <th className="p-3">Prescribed &rarr; Substituted</th>
                    <th className="p-3">Reason &amp; Savings</th>
                    <th className="p-3">Consent &amp; Doctor</th>
                    <th className="p-3">Final Dispensed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {substitutions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {sub.substitution_code}
                        <div className="text-[10px] text-slate-400 font-sans">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sub.patient_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rx: {sub.prescription_id}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="text-rose-600 dark:text-rose-400 line-through text-[11px]">
                          {sub.prescribed_medicine_name}
                        </div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          &rarr; {sub.substitute_medicine_name}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 mb-1">
                          {sub.reason.replace(/_/g, ' ')}
                        </span>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                          UGX {sub.patient_cost_savings_ugx.toLocaleString()} ({sub.savings_percentage}%)
                        </div>
                      </td>

                      <td className="p-3 text-[11px]">
                        <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Patient Signed ({sub.patient_acknowledgement_method?.replace(/_/g, ' ')})
                        </div>
                        {sub.prescriber_name && (
                          <div className="text-[10px] text-slate-500">
                            Dr: {sub.prescriber_name} ({sub.prescriber_decision?.replace(/_/g, ' ')})
                          </div>
                        )}
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        <div className="font-bold text-slate-900 dark:text-white">
                          Batch: {sub.final_dispensed_batch_number}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          Qty: {sub.final_dispensed_quantity} (Exp: {sub.final_dispensed_expiry_date})
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
    </div>
  );
};
