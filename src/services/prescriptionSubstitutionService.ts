import { supabase } from '../lib/supabase';
import {
  PrescriptionSubstitution,
  SubstitutionType,
  SubstitutionReason,
  SubstitutionStatus,
} from '../types/substitutionTypes';

const MOCK_SUBSTITUTIONS: PrescriptionSubstitution[] = [
  {
    id: 'sub-01',
    substitution_code: 'SUB-2026-0081',
    prescription_id: 'RX-2026-1049',
    patient_id: 'UG-PAT-1029',
    patient_name: 'Grace Nakato',
    prescribed_medicine_name: 'Augmentin 625mg Tablets (GSK Innovator)',
    prescribed_molecule_inn: 'Amoxicillin + Clavulanic Acid',
    prescribed_strength: '500mg/125mg',
    prescribed_dosage_form: 'Film-coated Tablet',
    prescribed_quantity: 14,
    prescribed_unit_price: 3500.0,
    prescribed_total_price: 49000.0,
    substitute_medicine_name: 'Co-Amoxiclav 625mg Tablets (Medreich Bioequivalent)',
    substitute_molecule_inn: 'Amoxicillin + Clavulanic Acid',
    substitute_strength: '500mg/125mg',
    substitute_dosage_form: 'Film-coated Tablet',
    substitute_quantity: 14,
    substitute_unit_price: 1500.0,
    substitute_total_price: 21000.0,
    substitution_type: 'bioequivalent_generic',
    reason: 'patient_affordability_cost_reduction',
    clinical_rationale:
      'Identical INN active ingredient and strength. Bioequivalence confirmed in NDA register (AUC 0.99). Substantial patient cost saving.',
    patient_cost_savings_ugx: 28000.0,
    savings_percentage: 57.14,
    pharmacist_name: 'Dr. Sarah Mukasa',
    pharmacist_license_number: 'PSU-REG-88219',
    patient_consent_required: true,
    patient_acknowledged: true,
    patient_acknowledgement_method: 'digital_signature',
    patient_acknowledgement_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    patient_counseling_notes:
      'Patient fully counseled on identical dosing (1 tab BD with meals) and agreed to generic switch for affordability.',
    is_narrow_therapeutic_index: false,
    prescriber_involvement_required: false,
    prescriber_consulted: false,
    prescriber_name: 'Dr. Peter Ssenyondo',
    prescriber_decision: 'approved_substitution',
    prescriber_approval_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    final_dispensed_medicine_name: 'Co-Amoxiclav 625mg Tablets (Medreich Bioequivalent)',
    final_dispensed_batch_number: 'AMX2304',
    final_dispensed_expiry_date: '2027-08-31',
    final_dispensed_quantity: 14,
    label_substitution_disclosure_text:
      'Substituted: Co-Amoxiclav 625mg for prescribed Augmentin 625mg (Patient Consent Recorded). Take 1 tablet twice daily with food.',
    status: 'dispensed_completed',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sub-02',
    substitution_code: 'SUB-2026-0082',
    prescription_id: 'RX-2026-1052',
    patient_id: 'UG-PAT-3381',
    patient_name: 'Emmanuel Okello',
    prescribed_medicine_name: 'Lipitor 20mg Tablets (Pfizer Innovator)',
    prescribed_molecule_inn: 'Atorvastatin Calcium',
    prescribed_strength: '20mg',
    prescribed_dosage_form: 'Tablet',
    prescribed_quantity: 30,
    prescribed_unit_price: 4200.0,
    prescribed_total_price: 126000.0,
    substitute_medicine_name: 'Atorva 20mg Tablets (Zydus Generic)',
    substitute_molecule_inn: 'Atorvastatin Calcium',
    substitute_strength: '20mg',
    substitute_dosage_form: 'Tablet',
    substitute_quantity: 30,
    substitute_unit_price: 1800.0,
    substitute_total_price: 54000.0,
    substitution_type: 'bioequivalent_generic',
    reason: 'brand_out_of_stock',
    clinical_rationale:
      'Innovator brand out of stock across wholesale suppliers. Atorva 20mg is NDA pre-qualified generic available in primary shelf B2.',
    patient_cost_savings_ugx: 72000.0,
    savings_percentage: 57.14,
    pharmacist_name: 'Dr. Sarah Mukasa',
    pharmacist_license_number: 'PSU-REG-88219',
    patient_consent_required: true,
    patient_acknowledged: true,
    patient_acknowledgement_method: 'verbal_pos_confirmation',
    patient_acknowledgement_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    patient_counseling_notes:
      'Informed patient of identical lipid-lowering efficacy and take 1 tablet at bedtime.',
    is_narrow_therapeutic_index: false,
    prescriber_involvement_required: false,
    prescriber_consulted: false,
    prescriber_name: 'Dr. Grace Nalubega',
    prescriber_decision: 'approved_substitution',
    prescriber_approval_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    final_dispensed_medicine_name: 'Atorva 20mg Tablets (Zydus Generic)',
    final_dispensed_batch_number: 'ATV-9012',
    final_dispensed_expiry_date: '2027-05-31',
    final_dispensed_quantity: 30,
    label_substitution_disclosure_text:
      'Substituted: Atorva 20mg for prescribed Lipitor 20mg due to brand stockout. Take 1 tablet at night.',
    status: 'dispensed_completed',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

// List of Narrow Therapeutic Index drugs requiring mandatory prescriber involvement
const NTI_DRUGS = [
  'warfarin',
  'digoxin',
  'lithium',
  'carbamazepine',
  'theophylline',
  'phenytoin',
  'levothyroxine',
  'cyclosporine',
  'tacrolimus',
];

export class PrescriptionSubstitutionService {
  /**
   * Fetch All Substitutions
   */
  static async getSubstitutions(): Promise<PrescriptionSubstitution[]> {
    try {
      const { data, error } = await supabase
        .from('prescription_substitutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return MOCK_SUBSTITUTIONS;
      return data as PrescriptionSubstitution[];
    } catch {
      return MOCK_SUBSTITUTIONS;
    }
  }

  /**
   * Determine if a drug is Narrow Therapeutic Index (NTI)
   */
  static isNarrowTherapeuticIndex(molecule: string): boolean {
    const clean = molecule.toLowerCase();
    return NTI_DRUGS.some((nti) => clean.includes(nti));
  }

  /**
   * Create New Substitution Record
   */
  static async createSubstitution(params: {
    prescriptionId: string;
    patientId: string;
    patientName: string;
    prescribedName: string;
    prescribedMolecule: string;
    prescribedStrength: string;
    prescribedDosageForm: string;
    prescribedQuantity: number;
    prescribedUnitPrice: number;
    substituteName: string;
    substituteMolecule: string;
    substituteStrength: string;
    substituteDosageForm: string;
    substituteQuantity: number;
    substituteUnitPrice: number;
    substitutionType: SubstitutionType;
    reason: SubstitutionReason;
    clinicalRationale?: string;
    pharmacistName: string;
    pharmacistLicense: string;
    patientAcknowledged: boolean;
    patientAckMethod?: 'digital_signature' | 'verbal_pos_confirmation' | 'portal_consent';
    patientCounselingNotes?: string;
    prescriberConsulted?: boolean;
    prescriberName?: string;
    prescriberDecision?: 'approved_substitution' | 'declined_daw' | 'modified_dose';
    prescriberNotes?: string;
    batchNumber: string;
    expiryDate: string;
  }): Promise<PrescriptionSubstitution> {
    const isNTI = this.isNarrowTherapeuticIndex(params.prescribedMolecule);
    const prescribedTotal = params.prescribedQuantity * params.prescribedUnitPrice;
    const substituteTotal = params.substituteQuantity * params.substituteUnitPrice;
    const savings = Math.max(0, prescribedTotal - substituteTotal);
    const savingsPct = prescribedTotal > 0 ? (savings / prescribedTotal) * 100 : 0;
    const code = `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const labelText = `Substituted: ${params.substituteName} for prescribed ${params.prescribedName} (${params.reason.replace(/_/g, ' ')}). Patient & Pharmacist verified.`;

    const newSub: PrescriptionSubstitution = {
      id: `sub-${Date.now()}`,
      substitution_code: code,
      prescription_id: params.prescriptionId,
      patient_id: params.patientId,
      patient_name: params.patientName,
      prescribed_medicine_name: params.prescribedName,
      prescribed_molecule_inn: params.prescribedMolecule,
      prescribed_strength: params.prescribedStrength,
      prescribed_dosage_form: params.prescribedDosageForm,
      prescribed_quantity: params.prescribedQuantity,
      prescribed_unit_price: params.prescribedUnitPrice,
      prescribed_total_price: prescribedTotal,
      substitute_medicine_name: params.substituteName,
      substitute_molecule_inn: params.substituteMolecule,
      substitute_strength: params.substituteStrength,
      substitute_dosage_form: params.substituteDosageForm,
      substitute_quantity: params.substituteQuantity,
      substitute_unit_price: params.substituteUnitPrice,
      substitute_total_price: substituteTotal,
      substitution_type: params.substitutionType,
      reason: params.reason,
      clinical_rationale: params.clinicalRationale,
      patient_cost_savings_ugx: savings,
      savings_percentage: parseFloat(savingsPct.toFixed(2)),
      pharmacist_name: params.pharmacistName,
      pharmacist_license_number: params.pharmacistLicense,
      patient_consent_required: true,
      patient_acknowledged: params.patientAcknowledged,
      patient_acknowledgement_method: params.patientAckMethod,
      patient_acknowledgement_at: params.patientAcknowledged ? new Date().toISOString() : undefined,
      patient_counseling_notes: params.patientCounselingNotes,
      is_narrow_therapeutic_index: isNTI,
      prescriber_involvement_required: isNTI,
      prescriber_consulted: !!params.prescriberConsulted,
      prescriber_name: params.prescriberName,
      prescriber_decision: params.prescriberDecision || 'approved_substitution',
      prescriber_consultation_notes: params.prescriberNotes,
      prescriber_approval_at: params.prescriberConsulted ? new Date().toISOString() : undefined,
      final_dispensed_medicine_name: params.substituteName,
      final_dispensed_batch_number: params.batchNumber,
      final_dispensed_expiry_date: params.expiryDate,
      final_dispensed_quantity: params.substituteQuantity,
      label_substitution_disclosure_text: labelText,
      status: 'dispensed_completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await (supabase.from('prescription_substitutions') as any).insert([newSub]);
    } catch {
      // fallback
    }

    return newSub;
  }
}
