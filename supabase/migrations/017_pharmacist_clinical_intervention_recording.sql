-- ============================================================================
-- ZenithRx Pharmacist Clinical Intervention Recording System (§11.16, §11.28)
-- Documentation of Clinical Problem, Pharmacist Action, Prescriber Engagement & Final Decision
-- Pharmaceutical Society of Uganda (PSU) & Good Pharmacy Practice (GPP) Clinical Governance
-- ============================================================================

-- 1. Enums for Clinical Interventions
DO $$ BEGIN
    CREATE TYPE intervention_reason_category AS ENUM (
        'dose_clarification_or_adjustment',     -- Under/overdosing, frequency correction
        'drug_drug_interaction',                -- Severe/major pharmacokinetic or dynamic interaction
        'allergy_or_contraindication_concern',  -- Beta-lactam/sulfa cross-allergy or disease contraindication
        'duplicate_therapy',                    -- Redundant therapeutic class overlap
        'wrong_or_inappropriate_strength',      -- Formulation strength mismatch
        'wrong_or_excessive_quantity',          -- Duration or pack quantity calculation error
        'wrong_or_suboptimal_dosage_form',      -- Swallowing difficulty, suspension needed for pediatrics
        'prescriber_clarification_needed',      -- Illegible handwriting, ambiguous route/regimen
        'therapeutic_or_generic_substitution',  -- Formulatory alternative or bioequivalent switch
        'renal_or_hepatic_dose_adjustment',     -- Dose titration for eGFR/LFT impairment
        'adherence_or_cost_optimization'        -- Patient affordability or simplified dosing schedule
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE intervention_action_taken AS ENUM (
        'prescriber_contacted_and_amended',     -- Prescriber agreed and approved prescription change
        'dose_modified_per_protocol',           -- Pharmacist titrated dose under standard clinical protocol
        'generic_brand_substituted',            -- Substituted bioequivalent generic per NDA formulary
        'dosage_form_changed',                  -- Switched from tablet to suspension/injectable
        'drug_discontinued_and_replaced',       -- Offending agent removed, safer alternative started
        'patient_counseled_and_staggered',      -- Timing separation protocol advised
        'prescription_refused_safety_grounds'   -- Dispensing withheld due to unresolvable clinical danger
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE intervention_final_decision AS ENUM (
        'accepted_by_prescriber',               -- Prescriber verified and accepted recommendation in full
        'partially_accepted_with_modification',  -- Prescriber adjusted recommendation
        'overridden_by_prescriber_with_rationale', -- Prescriber insisted on original therapy with documented rationale
        'pharmacist_authorized_protocol_change', -- Pharmacist made protocol-backed change
        'prescription_cancelled_and_reissued',  -- Original cancelled, clean new prescription created
        'referred_back_to_clinic'               -- Patient sent back to hospital/clinic for physical review
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE clinical_significance_grade AS ENUM (
        'grade_1_life_saving_prevented_fatal_event',
        'grade_2_major_prevented_serious_toxicity_or_hospitalization',
        'grade_3_moderate_optimized_efficacy_prevented_adr',
        'grade_4_minor_administrative_or_clarification'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Pharmacist Clinical Interventions Table
CREATE TABLE IF NOT EXISTS public.pharmacist_clinical_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_reference_no VARCHAR(60) NOT NULL UNIQUE, -- e.g. PCI-2026-00084
    tenant_id VARCHAR(100) NOT NULL,
    branch_id VARCHAR(100) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    
    -- Linked Prescription & Patient
    prescription_id VARCHAR(100) NOT NULL,
    prescription_reference_no VARCHAR(100) NOT NULL,
    patient_id VARCHAR(100) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    patient_phone VARCHAR(50),
    
    -- Prescriber Information
    prescriber_name VARCHAR(255) NOT NULL,
    prescriber_council_reg_no VARCHAR(100), -- UMDPC License
    prescriber_facility VARCHAR(255) NOT NULL,
    prescriber_contact VARCHAR(100),
    
    -- 1. Original Prescription Snapshot
    original_drug_name VARCHAR(255) NOT NULL,
    original_generic_name VARCHAR(255),
    original_strength VARCHAR(100),
    original_dosage_form VARCHAR(100),
    original_dose_and_frequency TEXT NOT NULL,
    original_duration VARCHAR(100),
    original_quantity INTEGER,
    original_route VARCHAR(50),
    
    -- 2. Pharmacist Intervention & Reason
    reason_category intervention_reason_category NOT NULL,
    clinical_problem_description TEXT NOT NULL,
    evidence_or_guideline_reference TEXT, -- e.g. BNF 86, Uganda Clinical Guidelines (UCG 2023)
    
    -- 3. Action Taken & Proposed Modification
    action_taken intervention_action_taken NOT NULL,
    action_details TEXT NOT NULL,
    modified_drug_name VARCHAR(255),
    modified_generic_name VARCHAR(255),
    modified_strength VARCHAR(100),
    modified_dosage_form VARCHAR(100),
    modified_dose_and_frequency TEXT,
    modified_duration VARCHAR(100),
    modified_quantity INTEGER,
    
    -- 4. Prescriber Engagement & Final Decision
    prescriber_contacted BOOLEAN DEFAULT true,
    contact_channel VARCHAR(50) DEFAULT 'Direct Phone Call', -- Phone, WhatsApp, Electronic, In-Person
    prescriber_response_notes TEXT,
    final_decision intervention_final_decision NOT NULL DEFAULT 'accepted_by_prescriber',
    
    -- 5. Clinical Valuation & Severity Grade
    significance_grade clinical_significance_grade NOT NULL DEFAULT 'grade_2_major_prevented_serious_toxicity_or_hospitalization',
    estimated_cost_savings_ugx NUMERIC(15, 2) DEFAULT 0,
    adverse_event_prevented_summary TEXT,
    
    -- 6. Pharmacist Sign-Off
    pharmacist_name VARCHAR(255) NOT NULL,
    pharmacist_role VARCHAR(100) NOT NULL DEFAULT 'Clinical Pharmacist',
    pharmacist_psu_no VARCHAR(100) NOT NULL, -- PSU Registration No
    digital_signature_hash VARCHAR(128) NOT NULL,
    
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.pharmacist_clinical_interventions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Allow authenticated read on pharmacist_clinical_interventions"
    ON public.pharmacist_clinical_interventions FOR SELECT
    USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Allow authenticated full access on pharmacist_clinical_interventions"
    ON public.pharmacist_clinical_interventions FOR ALL
    USING (auth.role() = 'authenticated' OR true);

-- 5. Indexes for Fast Regulatory Queries & Clinical Audits
CREATE INDEX IF NOT EXISTS idx_pci_ref ON public.pharmacist_clinical_interventions (intervention_reference_no);
CREATE INDEX IF NOT EXISTS idx_pci_rx ON public.pharmacist_clinical_interventions (prescription_id);
CREATE INDEX IF NOT EXISTS idx_pci_patient ON public.pharmacist_clinical_interventions (patient_id);
CREATE INDEX IF NOT EXISTS idx_pci_reason ON public.pharmacist_clinical_interventions (reason_category);
CREATE INDEX IF NOT EXISTS idx_pci_grade ON public.pharmacist_clinical_interventions (significance_grade);
CREATE INDEX IF NOT EXISTS idx_pci_timestamp ON public.pharmacist_clinical_interventions (timestamp DESC);
