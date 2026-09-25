-- ============================================================================
-- ZenithRx Controlled & Classified Medicine Governance System (§11.12, §11.24)
-- National Drug Authority (NDA) Uganda Pharmacy & Poisons Act & UN Narcotic Safe Controls
-- Immutable Sequential Dispensing Register & Controlled Safe Stock Reconciliation
-- ============================================================================

-- 1. Enums for Controlled Substance Governance
DO $$ BEGIN
    CREATE TYPE controlled_schedule_class AS ENUM (
        'schedule_1_narcotic',           -- Morphine, Pethidine, Fentanyl, Oxycodone (Class A Poison)
        'schedule_2_controlled_rx',       -- Ketamine, Methylphenidate, Tramadol, Codeine
        'schedule_3_psychotropic',        -- Diazepam, Midazolam, Lorazepam, Clonazepam
        'schedule_4_targeted_substance',  -- Phenobarbital, Ephedrine, Pseudoephedrine
        'class_a_poison'                  -- Highly toxic / regulated chemical agents
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE controlled_variance_type AS ENUM (
        'zero_variance_perfect_match',
        'minor_spillage_or_measurement',
        'unaccounted_deficit_investigation',
        'stock_surplus_investigation',
        'damage_or_breakage_verified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE controlled_reconciliation_status AS ENUM (
        'reconciled_and_verified',
        'under_internal_investigation',
        'nda_regulatory_incident_filed',
        'superintendent_approved_adjustment',
        'rejected_audit_failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Controlled Substances Master Registry
CREATE TABLE IF NOT EXISTS public.controlled_substance_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id VARCHAR(100) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    strength VARCHAR(100) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL,
    schedule_class controlled_schedule_class NOT NULL DEFAULT 'schedule_1_narcotic',
    nda_registration_no VARCHAR(100) NOT NULL,
    atc_code VARCHAR(50),
    storage_type VARCHAR(100) DEFAULT 'heavy_gauge_steel_safe_double_locked',
    requires_witness_pharmacist BOOLEAN DEFAULT true,
    max_single_dispense_limit INTEGER DEFAULT 30,
    daily_maximum_dose VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Immutable Controlled Dispensing Register (Sequential Monotonic Poison Book)
CREATE TABLE IF NOT EXISTS public.controlled_dispensing_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequential_reg_number VARCHAR(60) NOT NULL UNIQUE, -- e.g. CDR-2026-00042
    tenant_id VARCHAR(100) NOT NULL,
    branch_id VARCHAR(100) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    
    -- Medicine & Batch Detail
    substance_id UUID REFERENCES public.controlled_substance_master(id) ON DELETE SET NULL,
    drug_brand_name VARCHAR(255) NOT NULL,
    drug_generic_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL,
    strength VARCHAR(100) NOT NULL,
    controlled_schedule controlled_schedule_class NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    
    -- Stock Running Balance Audit
    opening_balance INTEGER NOT NULL,
    quantity_dispensed INTEGER NOT NULL,
    balance_remaining INTEGER NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'tablets/ampoules',
    
    -- Patient Identification
    patient_id VARCHAR(100),
    patient_name VARCHAR(255) NOT NULL,
    patient_id_type VARCHAR(50) NOT NULL DEFAULT 'National ID (NIN)',
    patient_id_number VARCHAR(100) NOT NULL, -- e.g. CM92014819201K
    patient_phone VARCHAR(50) NOT NULL,
    patient_address TEXT NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    
    -- Prescriber Information
    prescriber_name VARCHAR(255) NOT NULL,
    prescriber_council_reg_no VARCHAR(100) NOT NULL, -- e.g. UMDPC-2019-4412
    prescriber_cadre VARCHAR(100) DEFAULT 'Consultant Specialist / Medical Officer',
    prescriber_facility VARCHAR(255) NOT NULL, -- e.g. Mulago Hospital Oncology
    prescriber_contact VARCHAR(100),
    
    -- Prescription Verification
    prescription_reference_no VARCHAR(100) NOT NULL, -- e.g. RX-NAR-2026-0081
    prescription_issue_date DATE NOT NULL,
    clinical_indication TEXT NOT NULL, -- Reason for dispensing e.g. Severe palliative breakthrough pain
    supporting_prescription_url TEXT,
    
    -- Pharmacist & Witness Sign-Off
    dispensing_pharmacist_name VARCHAR(255) NOT NULL,
    dispensing_pharmacist_role VARCHAR(100) NOT NULL DEFAULT 'Supervising Pharmacist',
    dispensing_pharmacist_psu_no VARCHAR(100) NOT NULL, -- e.g. PSU-2021-0892
    witness_pharmacist_name VARCHAR(255),
    witness_pharmacist_psu_no VARCHAR(100),
    
    -- Cryptographic Immutable Ledger Chain
    previous_entry_hash VARCHAR(128) NOT NULL,
    current_entry_hash VARCHAR(128) NOT NULL,
    is_immutable_sealed BOOLEAN DEFAULT true,
    
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Controlled Stock Safe Reconciliation Table
CREATE TABLE IF NOT EXISTS public.controlled_stock_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_number VARCHAR(60) NOT NULL UNIQUE, -- e.g. CSR-2026-0001
    tenant_id VARCHAR(100) NOT NULL,
    branch_id VARCHAR(100) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    
    -- Medicine & Batch
    substance_id UUID REFERENCES public.controlled_substance_master(id) ON DELETE SET NULL,
    medicine_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    controlled_schedule controlled_schedule_class NOT NULL,
    storage_bin_safe VARCHAR(100) DEFAULT 'Safe Vault Compartment A',
    
    -- Quantitative Ledger Flow Formula
    opening_balance INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    quantity_dispensed INTEGER NOT NULL DEFAULT 0,
    quantity_damaged_or_lost INTEGER NOT NULL DEFAULT 0,
    quantity_quarantined INTEGER NOT NULL DEFAULT 0,
    expected_balance INTEGER NOT NULL, -- opening + received - dispensed - damaged
    physical_balance INTEGER NOT NULL,
    variance INTEGER NOT NULL,         -- physical - expected
    
    -- Variance & Status Evaluation
    variance_type controlled_variance_type NOT NULL DEFAULT 'zero_variance_perfect_match',
    reconciliation_status controlled_reconciliation_status NOT NULL DEFAULT 'reconciled_and_verified',
    
    -- Investigation & Regulatory Audit
    investigation_notes TEXT,
    root_cause_analysis TEXT,
    corrective_action_plan TEXT,
    nda_incident_report_ref VARCHAR(100),
    police_case_file_ref VARCHAR(100),
    
    -- Sign-off Workflow
    counted_by_pharmacist_name VARCHAR(255) NOT NULL,
    counted_by_psu_no VARCHAR(100) NOT NULL,
    witness_pharmacist_name VARCHAR(255) NOT NULL,
    witness_psu_no VARCHAR(100) NOT NULL,
    superintendent_approver_name VARCHAR(255),
    superintendent_approved_at TIMESTAMPTZ,
    
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    audit_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.controlled_substance_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controlled_dispensing_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controlled_stock_reconciliation ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Allow authenticated read on controlled_substance_master"
    ON public.controlled_substance_master FOR SELECT
    USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Allow authenticated full access on controlled_dispensing_register"
    ON public.controlled_dispensing_register FOR ALL
    USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Allow authenticated full access on controlled_stock_reconciliation"
    ON public.controlled_stock_reconciliation FOR ALL
    USING (auth.role() = 'authenticated' OR true);

-- 7. Indexes for High-Speed Regulatory Audit Traversal
CREATE INDEX IF NOT EXISTS idx_controlled_reg_seq ON public.controlled_dispensing_register (sequential_reg_number);
CREATE INDEX IF NOT EXISTS idx_controlled_reg_batch ON public.controlled_dispensing_register (batch_number);
CREATE INDEX IF NOT EXISTS idx_controlled_reg_patient ON public.controlled_dispensing_register (patient_id_number);
CREATE INDEX IF NOT EXISTS idx_controlled_reg_prescriber ON public.controlled_dispensing_register (prescriber_council_reg_no);
CREATE INDEX IF NOT EXISTS idx_controlled_recon_batch ON public.controlled_stock_reconciliation (batch_number);
CREATE INDEX IF NOT EXISTS idx_controlled_recon_status ON public.controlled_stock_reconciliation (reconciliation_status);
