-- ============================================================================
-- Migration: 024_patient_consent_and_phi_privacy_governance.sql
-- Description: Patient Consent Management, PHI Access Transparency ("Who Accessed
--              My Health Records"), Granular Data Retention Rules, and Data Subject Rights.
-- ============================================================================

-- Enum Types for Consent & Privacy
DO $$ BEGIN
    CREATE TYPE consent_category_enum AS ENUM (
        'data_processing',
        'teleconsultation_recording',
        'sms_email_notifications',
        'health_adherence_reminders',
        'cross_pharmacy_sharing',
        'anonymous_analytics_research'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE consent_status_enum AS ENUM (
        'granted',
        'withdrawn',
        'expired',
        'pending_initial_consent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE phi_access_purpose_enum AS ENUM (
        'prescription_dispensing',
        'clinical_drug_interaction_check',
        'pharmacist_consultation_review',
        'refill_adherence_coaching',
        'billing_and_insurance_claim',
        'emergency_break_glass',
        'regulatory_compliance_audit'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE retention_category_enum AS ENUM (
        'prescriptions',
        'dispensing_records',
        'patient_accounts',
        'consultation_records',
        'audit_logs',
        'financial_transactions'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Patient Consent Directives Table
CREATE TABLE IF NOT EXISTS public.patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(100) NOT NULL,
    consent_category consent_category_enum NOT NULL,
    status consent_status_enum NOT NULL DEFAULT 'granted',
    version VARCHAR(20) NOT NULL DEFAULT 'v2.4_2026',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Optional expiration
    collected_by_channel VARCHAR(50) NOT NULL DEFAULT 'patient_portal_app', -- 'portal', 'in_person_pos', 'written_form'
    captured_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    digital_signature_hash VARCHAR(64),
    guardian_name VARCHAR(150), -- For pediatric / dependent patients
    guardian_relationship VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_patient_consent_category UNIQUE (patient_id, consent_category)
);

-- 2. Patient PHI Access Transparency Log ("Who Accessed My Health Information?")
CREATE TABLE IF NOT EXISTS public.patient_phi_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id VARCHAR(100) NOT NULL,
    accessor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    accessor_name VARCHAR(150) NOT NULL,
    accessor_role VARCHAR(100) NOT NULL, -- 'Supervising Pharmacist', 'Clinical Doctor', 'Dispensing Technician'
    accessor_license_number VARCHAR(50),
    branch_name VARCHAR(150) NOT NULL DEFAULT 'ZenithRx Central Pharmacy',
    purpose phi_access_purpose_enum NOT NULL,
    record_type VARCHAR(100) NOT NULL, -- 'Prescription', 'Allergy Profile', 'Clinical Note', 'Dispense History'
    record_reference_id VARCHAR(100),
    is_emergency_break_glass BOOLEAN NOT NULL DEFAULT false,
    break_glass_justification TEXT,
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
    user_agent TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    patient_viewable BOOLEAN NOT NULL DEFAULT true -- Accessible to patient on portal
);

-- 3. Data Retention Policies Table
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category retention_category_enum NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    retention_period_years INTEGER NOT NULL,
    retention_basis_law VARCHAR(200) NOT NULL, -- e.g., 'National Drug Authority Act / Medical Records Standard'
    purge_action VARCHAR(50) NOT NULL DEFAULT 'cryptographic_anonymization', -- 'hard_delete', 'cryptographic_anonymization', 'cold_vault_offline'
    auto_purge_enabled BOOLEAN NOT NULL DEFAULT true,
    last_sweep_at TIMESTAMPTZ,
    next_scheduled_sweep_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    records_retained_count BIGINT NOT NULL DEFAULT 0,
    records_purged_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Patient Privacy & Data Subject Requests (GDPR / Health Data Rights)
CREATE TABLE IF NOT EXISTS public.patient_privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id VARCHAR(100) NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- 'export_full_phi', 'rectification', 'restrict_processing', 'anonymize_account'
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending_review', 'in_progress', 'completed', 'rejected'
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fulfilled_at TIMESTAMPTZ,
    fulfilled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    export_manifest_url TEXT,
    notes TEXT
);

-- Indexes for Fast Audit Lookups
CREATE INDEX IF NOT EXISTS idx_patient_phi_access_patient ON public.patient_phi_access_logs(patient_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient ON public.patient_consents(patient_id, consent_category);
CREATE INDEX IF NOT EXISTS idx_data_retention_cat ON public.data_retention_policies(category);

-- 5. Seed Official Healthcare Data Retention Rules
INSERT INTO public.data_retention_policies (
    category,
    category_name,
    retention_period_years,
    retention_basis_law,
    purge_action,
    records_retained_count,
    records_purged_count
) VALUES 
(
    'prescriptions',
    'Official Prescriptions & E-Scripts',
    7,
    'National Drug Authority (NDA) Pharmacy Regulations 2020 §44',
    'cold_vault_offline',
    142850,
    0
),
(
    'dispensing_records',
    'Dispensing Log & Batch Dispatches',
    7,
    'Uganda Pharmacy Board & Controlled Substances Register Mandate',
    'cold_vault_offline',
    215900,
    0
),
(
    'patient_accounts',
    'Patient Demographic Accounts & Care Profiles',
    10,
    'Uganda Data Protection and Privacy Act 2019 / Healthcare Standard',
    'cryptographic_anonymization',
    12400,
    140
),
(
    'consultation_records',
    'Pharmacist Clinical Notes & Consultations',
    10,
    'Uganda Medical and Dental Practitioners Council Guidelines',
    'cold_vault_offline',
    34120,
    0
),
(
    'audit_logs',
    'Security, Auth & NDA Immutable Audit Trails',
    7,
    'National Information Technology Authority (NITA-U) Healthcare Security',
    'cold_vault_offline',
    894200,
    0
),
(
    'financial_transactions',
    'POS Sales, Invoices & Payment Ledgers',
    7,
    'Uganda Revenue Authority (URA) Statutory Tax Records Requirement',
    'cold_vault_offline',
    412300,
    0
)
ON CONFLICT (category) DO UPDATE
SET retention_period_years = EXCLUDED.retention_period_years,
    retention_basis_law = EXCLUDED.retention_basis_law;

-- 6. Stored Procedure: Log PHI Record Access
CREATE OR REPLACE FUNCTION log_phi_access_event(
    p_patient_id VARCHAR(100),
    p_accessor_user_id UUID,
    p_accessor_name VARCHAR(150),
    p_accessor_role VARCHAR(100),
    p_accessor_license VARCHAR(50),
    p_branch_name VARCHAR(150),
    p_purpose phi_access_purpose_enum,
    p_record_type VARCHAR(100),
    p_record_ref VARCHAR(100),
    p_is_break_glass BOOLEAN DEFAULT false,
    p_break_glass_reason TEXT DEFAULT NULL,
    p_ip VARCHAR(45) DEFAULT '127.0.0.1'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_code VARCHAR(50);
BEGIN
    v_code := 'PHI-ACC-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS-') || LPAD(FLOOR(RANDOM()*1000)::TEXT, 3, '0');

    INSERT INTO public.patient_phi_access_logs (
        access_code,
        patient_id,
        accessor_user_id,
        accessor_name,
        accessor_role,
        accessor_license_number,
        branch_name,
        purpose,
        record_type,
        record_reference_id,
        is_emergency_break_glass,
        break_glass_justification,
        ip_address
    ) VALUES (
        v_code,
        p_patient_id,
        p_accessor_user_id,
        p_accessor_name,
        p_accessor_role,
        p_accessor_license,
        p_branch_name,
        p_purpose,
        p_record_type,
        p_record_ref,
        p_is_break_glass,
        p_break_glass_reason,
        p_ip
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Stored Procedure: Update Patient Consent Directive
CREATE OR REPLACE FUNCTION set_patient_consent(
    p_patient_id VARCHAR(100),
    p_category consent_category_enum,
    p_status consent_status_enum,
    p_channel VARCHAR(50),
    p_captured_by UUID,
    p_ip VARCHAR(45),
    p_sig_hash VARCHAR(64)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.patient_consents (
        patient_id,
        consent_category,
        status,
        collected_by_channel,
        captured_by_user_id,
        ip_address,
        digital_signature_hash,
        granted_at,
        withdrawn_at,
        updated_at
    ) VALUES (
        p_patient_id,
        p_category,
        p_status,
        p_channel,
        p_captured_by,
        p_ip,
        p_sig_hash,
        CASE WHEN p_status = 'granted' THEN NOW() ELSE NULL END,
        CASE WHEN p_status = 'withdrawn' THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (patient_id, consent_category) DO UPDATE
    SET status = EXCLUDED.status,
        collected_by_channel = EXCLUDED.collected_by_channel,
        captured_by_user_id = EXCLUDED.captured_by_user_id,
        ip_address = EXCLUDED.ip_address,
        digital_signature_hash = EXCLUDED.digital_signature_hash,
        granted_at = CASE WHEN EXCLUDED.status = 'granted' THEN NOW() ELSE public.patient_consents.granted_at END,
        withdrawn_at = CASE WHEN EXCLUDED.status = 'withdrawn' THEN NOW() ELSE NULL END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
