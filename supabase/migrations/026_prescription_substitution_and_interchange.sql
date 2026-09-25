-- ============================================================================
-- Migration: 026_prescription_substitution_and_interchange.sql
-- Description: Clinical Prescription Substitution, Bioequivalent Generic Matching,
--              Patient Consent Acknowledgement, Prescriber Engagement, and Labeling.
-- ============================================================================

-- Enum Types for Substitution
DO $$ BEGIN
    CREATE TYPE substitution_type_enum AS ENUM (
        'bioequivalent_generic',
        'branded_generic',
        'therapeutic_class_interchange',
        'dosage_form_optimization',
        'cost_saving_alternative'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE substitution_reason_enum AS ENUM (
        'brand_out_of_stock',
        'patient_affordability_cost_reduction',
        'formulary_preferred_generic',
        'patient_swallowing_difficulty_dysphagia',
        'bioequivalent_generic_switch',
        'allergy_excipient_intolerance'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE substitution_status_enum AS ENUM (
        'pending_clinical_review',
        'patient_acknowledged',
        'prescriber_approved',
        'dispensed_completed',
        'declined_dispense_as_written'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Prescription Substitutions Table
CREATE TABLE IF NOT EXISTS public.prescription_substitutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    substitution_code VARCHAR(50) NOT NULL UNIQUE,
    prescription_id VARCHAR(100) NOT NULL,
    patient_id VARCHAR(100) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    
    -- Prescribed Original Medicine Details
    prescribed_medicine_name VARCHAR(255) NOT NULL, -- e.g. 'Augmentin 625mg Tablets (GSK Innovator)'
    prescribed_molecule_inn VARCHAR(255) NOT NULL, -- 'Amoxicillin + Clavulanic Acid'
    prescribed_strength VARCHAR(100) NOT NULL,     -- '500mg/125mg'
    prescribed_dosage_form VARCHAR(100) NOT NULL, -- 'Film-coated Tablet'
    prescribed_quantity INTEGER NOT NULL,          -- 14
    prescribed_unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    prescribed_total_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    
    -- Proposed Substitute Medicine Details
    substitute_medicine_name VARCHAR(255) NOT NULL, -- e.g. 'Co-Amoxiclav 625mg (Medreich Generic)'
    substitute_molecule_inn VARCHAR(255) NOT NULL,
    substitute_strength VARCHAR(100) NOT NULL,
    substitute_dosage_form VARCHAR(100) NOT NULL,
    substitute_quantity INTEGER NOT NULL,
    substitute_unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    substitute_total_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    
    substitution_type substitution_type_enum NOT NULL DEFAULT 'bioequivalent_generic',
    reason substitution_reason_enum NOT NULL DEFAULT 'bioequivalent_generic_switch',
    clinical_rationale TEXT,
    
    -- Financial Impact for Patient
    patient_cost_savings_ugx NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- e.g. UGX 25,000 saved
    savings_percentage NUMERIC(5,2) DEFAULT 0.00,
    
    -- Pharmacist Governance
    pharmacist_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pharmacist_name VARCHAR(150) NOT NULL,
    pharmacist_license_number VARCHAR(50) NOT NULL,
    
    -- Patient Acknowledgement & Consent
    patient_consent_required BOOLEAN NOT NULL DEFAULT true,
    patient_acknowledged BOOLEAN NOT NULL DEFAULT false,
    patient_acknowledgement_method VARCHAR(50), -- 'digital_signature', 'verbal_pos_confirmation', 'portal_consent'
    patient_acknowledgement_at TIMESTAMPTZ,
    patient_counseling_notes TEXT,
    
    -- Prescriber Involvement & Narrow Therapeutic Index (NTI) Rules
    is_narrow_therapeutic_index BOOLEAN NOT NULL DEFAULT false, -- True for Warfarin, Lithium, Digoxin, Carbamazepine, Levothyroxine
    prescriber_involvement_required BOOLEAN NOT NULL DEFAULT false,
    prescriber_consulted BOOLEAN NOT NULL DEFAULT false,
    prescriber_name VARCHAR(150),
    prescriber_phone VARCHAR(50),
    prescriber_contact_method VARCHAR(50), -- 'Phone Call', 'WhatsApp Direct', 'E-Prescribing Portal'
    prescriber_decision VARCHAR(50), -- 'approved_substitution', 'declined_daw', 'modified_dose'
    prescriber_consultation_notes TEXT,
    prescriber_approval_at TIMESTAMPTZ,
    
    -- Final Dispensing Ledger
    final_dispensed_medicine_name VARCHAR(255),
    final_dispensed_batch_number VARCHAR(100),
    final_dispensed_expiry_date DATE,
    final_dispensed_quantity INTEGER,
    label_substitution_disclosure_text TEXT, -- e.g. 'Substituted: Co-Amoxiclav 625mg for prescribed Augmentin with patient & prescriber consent'
    
    status substitution_status_enum NOT NULL DEFAULT 'pending_clinical_review',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Fast Audit Lookups
CREATE INDEX IF NOT EXISTS idx_prescription_substitutions_status ON public.prescription_substitutions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescription_substitutions_patient ON public.prescription_substitutions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescription_substitutions_rx ON public.prescription_substitutions(prescription_id);

-- 2. Seed Initial Demonstration Substitutions
INSERT INTO public.prescription_substitutions (
    substitution_code,
    prescription_id,
    patient_id,
    patient_name,
    prescribed_medicine_name,
    prescribed_molecule_inn,
    prescribed_strength,
    prescribed_dosage_form,
    prescribed_quantity,
    prescribed_unit_price,
    prescribed_total_price,
    substitute_medicine_name,
    substitute_molecule_inn,
    substitute_strength,
    substitute_dosage_form,
    substitute_quantity,
    substitute_unit_price,
    substitute_total_price,
    substitution_type,
    reason,
    clinical_rationale,
    patient_cost_savings_ugx,
    savings_percentage,
    pharmacist_name,
    pharmacist_license_number,
    patient_consent_required,
    patient_acknowledged,
    patient_acknowledgement_method,
    patient_acknowledgement_at,
    patient_counseling_notes,
    is_narrow_therapeutic_index,
    prescriber_involvement_required,
    prescriber_consulted,
    prescriber_name,
    prescriber_decision,
    prescriber_approval_at,
    final_dispensed_medicine_name,
    final_dispensed_batch_number,
    final_dispensed_expiry_date,
    final_dispensed_quantity,
    label_substitution_disclosure_text,
    status
) VALUES 
(
    'SUB-2026-0081',
    'RX-2026-1049',
    'UG-PAT-1029',
    'Grace Nakato',
    'Augmentin 625mg Tablets (GSK Innovator)',
    'Amoxicillin + Clavulanic Acid',
    '500mg/125mg',
    'Film-coated Tablet',
    14,
    3500.00,
    49000.00,
    'Co-Amoxiclav 625mg Tablets (Medreich Bioequivalent)',
    'Amoxicillin + Clavulanic Acid',
    '500mg/125mg',
    'Film-coated Tablet',
    14,
    1500.00,
    21000.00,
    'bioequivalent_generic',
    'patient_affordability_cost_reduction',
    'Identical INN active ingredient and strength. Bioequivalence confirmed in NDA register (AUC 0.99). Substantial patient cost saving.',
    28000.00,
    57.14,
    'Dr. Sarah Mukasa',
    'PSU-REG-88219',
    true,
    true,
    'digital_signature',
    NOW() - INTERVAL '2 hours',
    'Patient fully counseled on identical dosing (1 tab BD with meals) and agreed to generic switch for affordability.',
    false,
    false,
    false,
    'Dr. Peter Ssenyondo',
    'approved_substitution',
    NOW() - INTERVAL '2 hours',
    'Co-Amoxiclav 625mg Tablets (Medreich Bioequivalent)',
    'AMX2304',
    '2027-08-31',
    14,
    'Substituted: Co-Amoxiclav 625mg for prescribed Augmentin 625mg (Patient Consent Recorded). Take 1 tablet twice daily with food.',
    'dispensed_completed'
),
(
    'SUB-2026-0082',
    'RX-2026-1052',
    'UG-PAT-3381',
    'Emmanuel Okello',
    'Lipitor 20mg Tablets (Pfizer Innovator)',
    'Atorvastatin Calcium',
    '20mg',
    'Tablet',
    30,
    4200.00,
    126000.00,
    'Atorva 20mg Tablets (Zydus Generic)',
    'Atorvastatin Calcium',
    '20mg',
    'Tablet',
    30,
    1800.00,
    54000.00,
    'bioequivalent_generic',
    'brand_out_of_stock',
    'Innovator brand out of stock across wholesale suppliers. Atorva 20mg is NDA pre-qualified generic available in primary shelf B2.',
    72000.00,
    57.14,
    'Dr. Sarah Mukasa',
    'PSU-REG-88219',
    true,
    true,
    'verbal_pos_confirmation',
    NOW() - INTERVAL '1 hour',
    'Informed patient of identical lipid-lowering efficacy and take 1 tablet at bedtime.',
    false,
    false,
    false,
    'Dr. Grace Nalubega',
    'approved_substitution',
    NOW() - INTERVAL '1 hour',
    'Atorva 20mg Tablets (Zydus Generic)',
    'ATV-9012',
    '2027-05-31',
    30,
    'Substituted: Atorva 20mg for prescribed Lipitor 20mg due to brand stockout. Take 1 tablet at night.',
    'dispensed_completed'
)
ON CONFLICT (substitution_code) DO NOTHING;
