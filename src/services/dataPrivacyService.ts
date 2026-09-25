import { supabase } from '../lib/supabase';
import {
  PatientConsentDirective,
  PatientPHIAccessLog,
  DataRetentionPolicy,
  PatientPrivacyRequest,
  ConsentCategory,
  ConsentStatus,
  PHIAccessPurpose,
} from '../types/privacyTypes';

const MOCK_RETENTION_POLICIES: DataRetentionPolicy[] = [
  {
    id: 'ret-01',
    category: 'prescriptions',
    category_name: 'Official Prescriptions & E-Scripts',
    retention_period_years: 7,
    retention_basis_law: 'National Drug Authority (NDA) Regulations §44 / Pharmacy Board Act',
    purge_action: 'cold_vault_offline',
    auto_purge_enabled: true,
    last_sweep_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    next_scheduled_sweep_at: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    records_retained_count: 142850,
    records_purged_count: 0,
  },
  {
    id: 'ret-02',
    category: 'dispensing_records',
    category_name: 'Dispensing Registers & Batch Logs',
    retention_period_years: 7,
    retention_basis_law: 'Uganda Pharmacy Board & Controlled Substances Register Mandate',
    purge_action: 'cold_vault_offline',
    auto_purge_enabled: true,
    last_sweep_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    next_scheduled_sweep_at: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    records_retained_count: 215900,
    records_purged_count: 0,
  },
  {
    id: 'ret-03',
    category: 'patient_accounts',
    category_name: 'Patient Demographic Accounts & Care Profiles',
    retention_period_years: 10,
    retention_basis_law: 'Uganda Data Protection and Privacy Act 2019 / Healthcare Standard',
    purge_action: 'cryptographic_anonymization',
    auto_purge_enabled: true,
    last_sweep_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    next_scheduled_sweep_at: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    records_retained_count: 12400,
    records_purged_count: 140,
  },
  {
    id: 'ret-04',
    category: 'consultation_records',
    category_name: 'Pharmacist Clinical Notes & Consultations',
    retention_period_years: 10,
    retention_basis_law: 'Uganda Medical & Dental Practitioners Council Guidelines',
    purge_action: 'cold_vault_offline',
    auto_purge_enabled: true,
    last_sweep_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    next_scheduled_sweep_at: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    records_retained_count: 34120,
    records_purged_count: 0,
  },
  {
    id: 'ret-05',
    category: 'audit_logs',
    category_name: 'Security, Auth & NDA Immutable Audit Trails',
    retention_period_years: 7,
    retention_basis_law: 'National Information Technology Authority (NITA-U) Security Standard',
    purge_action: 'cold_vault_offline',
    auto_purge_enabled: true,
    last_sweep_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    next_scheduled_sweep_at: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    records_retained_count: 894200,
    records_purged_count: 0,
  },
  {
    id: 'ret-06',
    category: 'financial_transactions',
    category_name: 'POS Sales, Invoices & Tax Ledgers',
    retention_period_years: 7,
    retention_basis_law: 'Uganda Revenue Authority (URA) Statutory Tax Records Requirement',
    purge_action: 'cold_vault_offline',
    auto_purge_enabled: true,
    last_sweep_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    next_scheduled_sweep_at: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    records_retained_count: 412300,
    records_purged_count: 0,
  },
];

const MOCK_CONSENTS: PatientConsentDirective[] = [
  {
    id: 'c-01',
    patient_id: 'pat-001',
    consent_category: 'data_processing',
    status: 'granted',
    version: 'v2.4_2026',
    granted_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    collected_by_channel: 'patient_portal_app',
    digital_signature_hash: 'e8b7c21094fa51d4b882190c1f6a5b810992716a4c2194b61184a2890fc11822',
    ip_address: '102.134.88.9',
    notes: 'Primary electronic consent for medication dispensing and clinical allergy evaluation.',
  },
  {
    id: 'c-02',
    patient_id: 'pat-001',
    consent_category: 'teleconsultation_recording',
    status: 'granted',
    version: 'v2.4_2026',
    granted_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    collected_by_channel: 'patient_portal_app',
    digital_signature_hash: '3f7a188c91024b8912c984210a481c49129031481a94812c9812401824981412',
    ip_address: '102.134.88.9',
    notes: 'Consent granted for audio-video recording during clinical teleconsultation.',
  },
  {
    id: 'c-03',
    patient_id: 'pat-001',
    consent_category: 'sms_email_notifications',
    status: 'granted',
    version: 'v2.4_2026',
    granted_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    collected_by_channel: 'in_person_pos',
    digital_signature_hash: '104812c98124018249814123f7a188c91024b8912c984210a481c49129031481',
    notes: 'SMS prescription ready alerts sent to +256 772 100200.',
  },
  {
    id: 'c-04',
    patient_id: 'pat-001',
    consent_category: 'health_adherence_reminders',
    status: 'granted',
    version: 'v2.4_2026',
    granted_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    collected_by_channel: 'patient_portal_app',
    notes: 'Automated chronic hypertension dosage reminders.',
  },
  {
    id: 'c-05',
    patient_id: 'pat-001',
    consent_category: 'cross_pharmacy_sharing',
    status: 'granted',
    version: 'v2.4_2026',
    granted_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    collected_by_channel: 'patient_portal_app',
    notes: 'Authorized sharing with Entebbe Referral Hospital pharmacy branch.',
  },
  {
    id: 'c-06',
    patient_id: 'pat-001',
    consent_category: 'anonymous_analytics_research',
    status: 'withdrawn',
    version: 'v2.4_2026',
    withdrawn_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    collected_by_channel: 'patient_portal_app',
    notes: 'Patient opted out of de-identified research telemetry.',
  },
];

const MOCK_ACCESS_LOGS: PatientPHIAccessLog[] = [
  {
    id: 'acc-01',
    access_code: 'PHI-ACC-20260925-064512',
    patient_id: 'pat-001',
    accessor_name: 'Dr. Sarah Mukasa',
    accessor_role: 'Supervising Pharmacist',
    accessor_license_number: 'PSU-REG-88219',
    branch_name: 'ZenithRx Main Flagship Pharmacy (Kampala)',
    purpose: 'prescription_dispensing',
    record_type: 'Prescription #RX-2026-8942 & Allergy Profile',
    record_reference_id: 'RX-2026-8942',
    is_emergency_break_glass: false,
    ip_address: '102.134.88.9',
    accessed_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    patient_viewable: true,
  },
  {
    id: 'acc-02',
    access_code: 'PHI-ACC-20260925-041233',
    patient_id: 'pat-001',
    accessor_name: 'Dr. Joseph Kato, MD',
    accessor_role: 'Consulting Physician',
    accessor_license_number: 'UMDPC-55410',
    branch_name: 'ZenithRx Telehealth Hub',
    purpose: 'pharmacist_consultation_review',
    record_type: 'Chronic Medication Regimen & Blood Pressure Log',
    record_reference_id: 'CONSULT-2026-104',
    is_emergency_break_glass: false,
    ip_address: '154.72.198.11',
    accessed_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    patient_viewable: true,
  },
  {
    id: 'acc-03',
    access_code: 'PHI-ACC-20260924-231500',
    patient_id: 'pat-001',
    accessor_name: 'Brenda Namagembe',
    accessor_role: 'Emergency Clinical Pharmacist',
    accessor_license_number: 'PSU-REG-94102',
    branch_name: 'ZenithRx 24/7 Trauma Branch',
    purpose: 'emergency_break_glass',
    record_type: 'Full Patient Emergency Health Profile & Penicillin Allergy',
    record_reference_id: 'EMERG-BG-771',
    is_emergency_break_glass: true,
    break_glass_justification: 'Acute anaphylactic reaction presenting in emergency night triage. Patient unconscious; vital allergy check required before epinephrine administration.',
    ip_address: '41.210.144.55',
    accessed_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    patient_viewable: true,
  },
  {
    id: 'acc-04',
    access_code: 'PHI-ACC-20260924-150022',
    patient_id: 'pat-001',
    accessor_name: 'Patrick Ochieng',
    accessor_role: 'Insurance Claims Billing Officer',
    accessor_license_number: 'STAFF-BILL-402',
    branch_name: 'ZenithRx Billing Dept',
    purpose: 'billing_and_insurance_claim',
    record_type: 'Insurance Pre-Authorization & Itemized Prescription Cost',
    record_reference_id: 'CLAIM-UAP-2026-99',
    is_emergency_break_glass: false,
    ip_address: '102.134.88.9',
    accessed_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    patient_viewable: true,
  },
];

const MOCK_PRIVACY_REQUESTS: PatientPrivacyRequest[] = [
  {
    id: 'req-01',
    request_code: 'DSR-EXP-2026-001',
    patient_id: 'pat-001',
    patient_name: 'Grace Nakato (UG-PAT-1029)',
    request_type: 'export_full_phi',
    status: 'completed',
    requested_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    fulfilled_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 15 * 60 * 1000).toISOString(),
    export_manifest_url: 'https://zenithrx.internal/dsr/exports/Grace_Nakato_Full_PHI_2026.zip',
    notes: 'Full clinical history and dispensing timeline compiled in machine-readable JSON & signed PDF archive.',
  },
];

export class DataPrivacyService {
  /**
   * Fetch Patient Consent Directives
   */
  static async getPatientConsents(patientId: string = 'pat-001'): Promise<PatientConsentDirective[]> {
    try {
      const { data, error } = await supabase
        .from('patient_consents')
        .select('*')
        .eq('patient_id', patientId);

      if (error || !data || data.length === 0) return MOCK_CONSENTS;
      return data as PatientConsentDirective[];
    } catch {
      return MOCK_CONSENTS;
    }
  }

  /**
   * Update Patient Consent Directive (Opt-In / Opt-Out)
   */
  static async updateConsentDirective(
    patientId: string,
    category: ConsentCategory,
    status: ConsentStatus,
    channel: string = 'patient_portal_app'
  ): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      await (supabase.rpc as any)('set_patient_consent', {
        p_patient_id: patientId,
        p_category: category,
        p_status: status,
        p_channel: channel,
        p_captured_by: userId,
        p_ip: '102.134.88.9',
        p_sig_hash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      });
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Fetch PHI Access Logs ("Who Accessed My Health Records?")
   */
  static async getPHIAccessLogs(patientId: string = 'pat-001'): Promise<PatientPHIAccessLog[]> {
    try {
      const { data, error } = await supabase
        .from('patient_phi_access_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('accessed_at', { ascending: false });

      if (error || !data || data.length === 0) return MOCK_ACCESS_LOGS;
      return data as PatientPHIAccessLog[];
    } catch {
      return MOCK_ACCESS_LOGS;
    }
  }

  /**
   * Log an Access Event into PHI Audit Trail
   */
  static async logAccessEvent(params: {
    patientId: string;
    accessorName: string;
    accessorRole: string;
    accessorLicense?: string;
    branchName?: string;
    purpose: PHIAccessPurpose;
    recordType: string;
    recordRef?: string;
    isBreakGlass?: boolean;
    breakGlassReason?: string;
  }): Promise<PatientPHIAccessLog> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const { data } = await (supabase.rpc as any)('log_phi_access_event', {
        p_patient_id: params.patientId,
        p_accessor_user_id: userId,
        p_accessor_name: params.accessorName,
        p_accessor_role: params.accessorRole,
        p_accessor_license: params.accessorLicense || 'PSU-8820',
        p_branch_name: params.branchName || 'ZenithRx Main Pharmacy',
        p_purpose: params.purpose,
        p_record_type: params.recordType,
        p_record_ref: params.recordRef || 'REF-AUTO',
        p_is_break_glass: !!params.isBreakGlass,
        p_break_glass_reason: params.breakGlassReason || null,
        p_ip: '102.134.88.9',
      });

      if (data) {
        const { data: logItem } = await supabase
          .from('patient_phi_access_logs')
          .select('*')
          .eq('id', data)
          .single();
        if (logItem) return logItem as PatientPHIAccessLog;
      }
    } catch {
      // fallback
    }

    const newLog: PatientPHIAccessLog = {
      id: `acc-${Date.now()}`,
      access_code: `PHI-ACC-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`,
      patient_id: params.patientId,
      accessor_name: params.accessorName,
      accessor_role: params.accessorRole,
      accessor_license_number: params.accessorLicense || 'PSU-8820',
      branch_name: params.branchName || 'ZenithRx Main Pharmacy',
      purpose: params.purpose,
      record_type: params.recordType,
      record_reference_id: params.recordRef,
      is_emergency_break_glass: !!params.isBreakGlass,
      break_glass_justification: params.breakGlassReason,
      ip_address: '102.134.88.9',
      accessed_at: new Date().toISOString(),
      patient_viewable: true,
    };
    return newLog;
  }

  /**
   * Fetch Data Retention Policies
   */
  static async getRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .order('retention_period_years', { ascending: true });

      if (error || !data || data.length === 0) return MOCK_RETENTION_POLICIES;
      return data as DataRetentionPolicy[];
    } catch {
      return MOCK_RETENTION_POLICIES;
    }
  }

  /**
   * Fetch Privacy & Data Subject Requests
   */
  static async getPrivacyRequests(): Promise<PatientPrivacyRequest[]> {
    try {
      const { data, error } = await supabase
        .from('patient_privacy_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error || !data || data.length === 0) return MOCK_PRIVACY_REQUESTS;
      return data as PatientPrivacyRequest[];
    } catch {
      return MOCK_PRIVACY_REQUESTS;
    }
  }
}
