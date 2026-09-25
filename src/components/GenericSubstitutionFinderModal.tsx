/**
 * GenericSubstitutionFinderModal.tsx — ZenithRx Generic & Bioequivalent Suggestion Finder
 * Clinical Decision Support Modal: Suggests available bioequivalent products for pharmacist review.
 * Strictly non-automatic: requires pharmacist review, patient acknowledgement & prescriber involvement where required.
 */

import React, { useState, useMemo } from 'react';
import { DrugItem, PrescriptionItem } from '../types';
import {
  findGenericEquivalents,
  BioequivalentSuggestion,
  isNarrowTherapeuticIndexDrug,
  identifyMoleculeKnowledge,
} from '../services/genericEquivalenceService';
import { formatUGX } from '../services/formatters';
import {
  Pill,
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Package,
  Calendar,
  Layers,
  FileCheck,
  UserCheck,
  PhoneCall,
  Info,
  TrendingDown,
} from 'lucide-react';

interface GenericSubstitutionFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescribedItem: PrescriptionItem | null;
  patientName?: string;
  prescriberName?: string;
  inventory: DrugItem[];
  currentPharmacistName?: string;
  currentPharmacistRole?: string;
  onApplySubstitution?: (
    originalItem: PrescriptionItem,
    substituteDrug: DrugItem,
    substitutionDetails: {
      reason: string;
      consentMethod: string;
      prescriberContacted: boolean;
      prescriberNotes: string;
      clinicalJustification: string;
    }
  ) => void;
}

export const GenericSubstitutionFinderModal: React.FC<GenericSubstitutionFinderModalProps> = ({
  isOpen,
  onClose,
  prescribedItem,
  patientName = 'Walk-in Patient',
  prescriberName = 'Prescribing Clinician',
  inventory,
  currentPharmacistName = 'Pharmacist on Duty',
  currentPharmacistRole = 'Supervising Pharmacist',
  onApplySubstitution,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<BioequivalentSuggestion | null>(null);
  const [substitutionReason, setSubstitutionReason] = useState<string>('patient_affordability_cost_reduction');
  const [consentMethod, setConsentMethod] = useState<string>('verbal_at_pos');
  const [prescriberContacted, setPrescriberContacted] = useState<boolean>(false);
  const [prescriberNotes, setPrescriberNotes] = useState<string>('');
  const [clinicalJustification, setClinicalJustification] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Compute suggestions
  const suggestions = useMemo(() => {
    if (!prescribedItem) return [];
    const prescribedName = prescribedItem.brandName || prescribedItem.drugName;
    return findGenericEquivalents(prescribedName, prescribedItem.unitPrice || 0, inventory);
  }, [prescribedItem, inventory]);

  if (!isOpen || !prescribedItem) return null;

  const prescribedName = prescribedItem.brandName || prescribedItem.drugName;
  const isNTI = isNarrowTherapeuticIndexDrug(prescribedName);
  const moleculeInfo = identifyMoleculeKnowledge(prescribedName);

  const handleConfirmAdoption = () => {
    if (!selectedSuggestion) return;
    setIsSubmitting(true);

    if (onApplySubstitution) {
      onApplySubstitution(prescribedItem, selectedSuggestion.drug, {
        reason: substitutionReason,
        consentMethod,
        prescriberContacted,
        prescriberNotes,
        clinicalJustification: clinicalJustification || selectedSuggestion.clinicalSafetyNote,
      });
    }

    setShowSuccessToast(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessToast(false);
      setSelectedSuggestion(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs">
              <ArrowLeftRight className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Generic Equivalence Suggestion Engine</h2>
                <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Decision Support Only
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Intelligent Bioequivalent Generic Matching • Non-Binding Clinical Suggestions for Pharmacist Review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-5 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 shrink-0">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold">
            <b>Safety Notice:</b> These suggestions are generated based on active INN molecule and bioequivalence ratings. <b>Substitutions are never automatic</b> and require licensed pharmacist clinical evaluation and patient consent per NDA regulations.
          </span>
        </div>

        {/* NTI Warning Banner if applicable */}
        {isNTI && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border-b border-rose-300 dark:border-rose-800 px-5 py-3 text-xs text-rose-950 dark:text-rose-200 flex items-start gap-2.5 shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Narrow Therapeutic Index (NTI) Drug Alert
              </p>
              <p className="text-[11px] mt-0.5">
                {prescribedName} has a narrow margin of safety. Generic interchange can alter therapeutic blood levels. Prescriber consultation is <b>mandatory</b> prior to any substitution.
              </p>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Prescribed Drug Overview Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-blue-600" /> Prescribed Medicine (Brand X)
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {prescribedName}
                  </h3>
                  {prescribedItem.strength && (
                    <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                      {prescribedItem.strength}
                    </span>
                  )}
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                    Qty: {prescribedItem.quantity}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <b>Active INN Molecule:</b> {moleculeInfo?.innName || prescribedItem.drugName} • <b>Route:</b> {prescribedItem.route || 'Oral'}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-4">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Prescribed Cost</span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                  {formatUGX(prescribedItem.unitPrice * prescribedItem.quantity)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({formatUGX(prescribedItem.unitPrice)}/unit)
                </span>
              </div>
            </div>
          </div>

          {/* Equivalent Matches Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Available In-Stock Equivalents ({suggestions.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Sorted by Bioequivalence &amp; Cost Savings
              </span>
            </div>

            {suggestions.length === 0 ? (
              <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  No equivalent generic products found in active branch stock.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Dispense the prescribed brand as written, or request an inter-branch stock transfer.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((sug, idx) => {
                  const isSelected = selectedSuggestion?.drug.id === sug.drug.id;
                  const totalSubPrice = sug.drug.sellingPrice * prescribedItem.quantity;
                  const totalOrigPrice = prescribedItem.unitPrice * prescribedItem.quantity;
                  const totalSavings = Math.max(0, totalOrigPrice - totalSubPrice);

                  return (
                    <div
                      key={sug.drug.id || idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {sug.drug.brandName}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              {sug.bioequivalenceRating}
                            </span>
                            {sug.savingsPercent > 0 && (
                              <span className="text-[10px] font-black bg-teal-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                <TrendingDown className="w-3 h-3" /> Save {sug.savingsPercent}%
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            <b>Generic:</b> {sug.drug.genericName} • <b>Mfg:</b> {sug.drug.manufacturer}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3 text-slate-400" />
                              <b>Stock:</b> {sug.drug.stockQty} units ({sug.drug.shelfLocation})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <b>Batch:</b> {sug.drug.batchNumber} (Exp: {sug.drug.expiryDate})
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-1 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {sug.clinicalSafetyNote}
                          </p>
                        </div>

                        {/* Pricing & Selection Control */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {formatUGX(totalSubPrice)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({formatUGX(sug.drug.sellingPrice)}/unit)
                            </span>
                            {totalSavings > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                                Patient saves {formatUGX(totalSavings)}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedSuggestion(isSelected ? null : sug)}
                            className={`mt-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <>
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span>Review &amp; Adopt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clinical Confirmation Drawer (when an item is selected) */}
          {selectedSuggestion && (
            <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="font-black text-sm text-emerald-950 dark:text-emerald-100">
                    Pharmacist Clinical Authorization &amp; Consent Record
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {currentPharmacistName} ({currentPharmacistRole})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Reason Selection */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Clinical Reason for Substitution
                  </label>
                  <select
                    value={substitutionReason}
                    onChange={(e) => setSubstitutionReason(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="patient_affordability_cost_reduction">Patient Affordability &amp; Cost Reduction</option>
                    <option value="brand_out_of_stock">Prescribed Brand Out of Stock</option>
                    <option value="formulary_preferred_generic">Formulary Preferred Bioequivalent</option>
                    <option value="bioequivalent_generic_switch">Generic Bioequivalence Switch</option>
                    <option value="patient_swallowing_difficulty_dysphagia">Dosage Form / Swallowing Ease</option>
                    <option value="allergy_excipient_intolerance">Excipient / Allergen Avoidance</option>
                  </select>
                </div>

                {/* Patient Consent */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Patient Informed Consent Method
                  </label>
                  <select
                    value={consentMethod}
                    onChange={(e) => setConsentMethod(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="verbal_at_pos">Verbal Informed Consent at POS Counter</option>
                    <option value="written_signature">Signed Physical Consent Form</option>
                    <option value="patient_portal_app">Digital Approval via Patient Portal</option>
                    <option value="guardian_consent">Caregiver / Guardian Consent</option>
                  </select>
                </div>
              </div>

              {/* Prescriber Consultation Section */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prescriberContacted || isNTI}
                      onChange={(e) => setPrescriberContacted(e.target.checked)}
                      disabled={isNTI}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <span>
                      Prescriber Contacted &amp; Substitution Approved ({prescriberName})
                      {isNTI && <b className="text-rose-600 ml-1">(Mandatory for NTI)</b>}
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">Phone / WhatsApp / Clinic</span>
                </div>

                {(prescriberContacted || isNTI) && (
                  <input
                    type="text"
                    placeholder="Enter prescriber contact notes or authorization reference..."
                    value={prescriberNotes}
                    onChange={(e) => setPrescriberNotes(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                )}
              </div>

              {/* Clinical Justification Notes */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs block mb-1">
                  Pharmacist Clinical Justification &amp; Counseling Notes
                </label>
                <textarea
                  rows={2}
                  value={clinicalJustification}
                  onChange={(e) => setClinicalJustification(e.target.value)}
                  placeholder="Explain bioequivalence evaluation and counseling provided to patient..."
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {/* Confirm Substitution Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSuggestion(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel Selection
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAdoption}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <span>Applying...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize &amp; Apply Substitution</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Supervising Pharmacist: <b>{currentPharmacistName}</b>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Keep Original Brand (Close)
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="absolute top-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-top-4 z-50">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>Generic Substitution Authorized &amp; Recorded!</span>
          </div>
        )}

      </div>
    </div>
  );
};
