export type SubstitutionType =
  | 'bioequivalent_generic'
  | 'branded_generic'
  | 'therapeutic_class_interchange'
  | 'dosage_form_optimization'
  | 'cost_saving_alternative';

export type SubstitutionReason =
  | 'brand_out_of_stock'
  | 'patient_affordability_cost_reduction'
  | 'formulary_preferred_generic'
  | 'patient_swallowing_difficulty_dysphagia'
  | 'bioequivalent_generic_switch'
  | 'allergy_excipient_intolerance';

export type SubstitutionStatus =
  | 'pending_clinical_review'
  | 'patient_acknowledged'
  | 'prescriber_approved'
  | 'dispensed_completed'
  | 'declined_dispense_as_written';

export interface PrescriptionSubstitution {
  id: string;
  substitution_code: string;
  prescription_id: string;
  patient_id: string;
  patient_name: string;

  // Prescribed Item
  prescribed_medicine_name: string;
  prescribed_molecule_inn: string;
  prescribed_strength: string;
  prescribed_dosage_form: string;
  prescribed_quantity: number;
  prescribed_unit_price: number;
  prescribed_total_price: number;

  // Proposed Substitute
  substitute_medicine_name: string;
  substitute_molecule_inn: string;
  substitute_strength: string;
  substitute_dosage_form: string;
  substitute_quantity: number;
  substitute_unit_price: number;
  substitute_total_price: number;

  substitution_type: SubstitutionType;
  reason: SubstitutionReason;
  clinical_rationale?: string;

  // Financial Impact
  patient_cost_savings_ugx: number;
  savings_percentage: number;

  // Pharmacist Governance
  pharmacist_user_id?: string;
  pharmacist_name: string;
  pharmacist_license_number: string;

  // Patient Consent
  patient_consent_required: boolean;
  patient_acknowledged: boolean;
  patient_acknowledgement_method?: 'digital_signature' | 'verbal_pos_confirmation' | 'portal_consent';
  patient_acknowledgement_at?: string;
  patient_counseling_notes?: string;

  // Prescriber Involvement
  is_narrow_therapeutic_index: boolean;
  prescriber_involvement_required: boolean;
  prescriber_consulted: boolean;
  prescriber_name?: string;
  prescriber_phone?: string;
  prescriber_contact_method?: string;
  prescriber_decision?: 'approved_substitution' | 'declined_daw' | 'modified_dose';
  prescriber_consultation_notes?: string;
  prescriber_approval_at?: string;

  // Final Dispensed
  final_dispensed_medicine_name?: string;
  final_dispensed_batch_number?: string;
  final_dispensed_expiry_date?: string;
  final_dispensed_quantity?: number;
  label_substitution_disclosure_text?: string;

  status: SubstitutionStatus;
  created_at: string;
  updated_at: string;
}
