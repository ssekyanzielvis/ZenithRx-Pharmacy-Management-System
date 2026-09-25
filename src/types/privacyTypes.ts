export type ConsentCategory =
  | 'data_processing'
  | 'teleconsultation_recording'
  | 'sms_email_notifications'
  | 'health_adherence_reminders'
  | 'cross_pharmacy_sharing'
  | 'anonymous_analytics_research';

export type ConsentStatus =
  | 'granted'
  | 'withdrawn'
  | 'expired'
  | 'pending_initial_consent';

export type PHIAccessPurpose =
  | 'prescription_dispensing'
  | 'clinical_drug_interaction_check'
  | 'pharmacist_consultation_review'
  | 'refill_adherence_coaching'
  | 'billing_and_insurance_claim'
  | 'emergency_break_glass'
  | 'regulatory_compliance_audit';

export type RetentionCategory =
  | 'prescriptions'
  | 'dispensing_records'
  | 'patient_accounts'
  | 'consultation_records'
  | 'audit_logs'
  | 'financial_transactions';

export interface PatientConsentDirective {
  id: string;
  patient_id: string;
  consent_category: ConsentCategory;
  status: ConsentStatus;
  version: string;
  granted_at?: string;
  withdrawn_at?: string;
  expires_at?: string;
  collected_by_channel: string;
  captured_by_user_id?: string;
  ip_address?: string;
  digital_signature_hash?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  notes?: string;
}

export interface PatientPHIAccessLog {
  id: string;
  access_code: string;
  patient_id: string;
  accessor_user_id?: string;
  accessor_name: string;
  accessor_role: string;
  accessor_license_number?: string;
  branch_name: string;
  purpose: PHIAccessPurpose;
  record_type: string;
  record_reference_id?: string;
  is_emergency_break_glass: boolean;
  break_glass_justification?: string;
  ip_address: string;
  accessed_at: string;
  patient_viewable: boolean;
}

export interface DataRetentionPolicy {
  id: string;
  category: RetentionCategory;
  category_name: string;
  retention_period_years: number;
  retention_basis_law: string;
  purge_action: 'hard_delete' | 'cryptographic_anonymization' | 'cold_vault_offline';
  auto_purge_enabled: boolean;
  last_sweep_at?: string;
  next_scheduled_sweep_at: string;
  records_retained_count: number;
  records_purged_count: number;
}

export interface PatientPrivacyRequest {
  id: string;
  request_code: string;
  patient_id: string;
  patient_name: string;
  request_type: 'export_full_phi' | 'rectification' | 'restrict_processing' | 'anonymize_account';
  status: 'pending_review' | 'in_progress' | 'completed' | 'rejected';
  requested_at: string;
  fulfilled_at?: string;
  export_manifest_url?: string;
  notes?: string;
}
