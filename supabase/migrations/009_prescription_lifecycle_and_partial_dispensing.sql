-- ============================================================================
-- ZenithRx Prescription Lifecycle Management & Partial Dispensing Migration (§31, §32, §34)
-- ============================================================================

-- 1. Create Prescription Status Enum
DO $$ BEGIN
    CREATE TYPE prescription_lifecycle_status AS ENUM (
        'draft',
        'pending_verification',
        'verified_approved',
        'partially_dispensed',
        'fully_dispensed',
        'cancelled',
        'expired',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Prescription Route Enum
DO $$ BEGIN
    CREATE TYPE medication_route_type AS ENUM (
        'oral',
        'intravenous',
        'intramuscular',
        'subcutaneous',
        'topical',
        'inhalation',
        'sublingual',
        'ophthalmic',
        'otic',
        'rectal',
        'transdermal'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Enhance or Create Prescriptions Lifecycle Table
CREATE TABLE IF NOT EXISTS public.prescriptions_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'CLIENT-001',
    rx_number VARCHAR(64) NOT NULL UNIQUE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    
    -- Patient Information
    patient_id UUID REFERENCES public.patient_profiles(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(16),
    patient_phone VARCHAR(64),
    patient_allergies TEXT[] DEFAULT '{}',
    patient_chronic_conditions TEXT[] DEFAULT '{}',

    -- Prescriber Information
    prescriber_name VARCHAR(255) NOT NULL,
    prescriber_cadre VARCHAR(128) DEFAULT 'Medical Officer',
    prescriber_reg_no VARCHAR(128),
    health_facility VARCHAR(255) DEFAULT 'Mulago National Referral Hospital',
    prescriber_phone VARCHAR(64),
    prescriber_email VARCHAR(128),

    -- Clinical Notes & Diagnostics
    diagnosis TEXT,
    clinical_notes TEXT,
    
    -- Status & Lifecycle
    status prescription_lifecycle_status NOT NULL DEFAULT 'pending_verification',
    verified_by_user_id VARCHAR(64),
    verified_by_pharmacist_name VARCHAR(255),
    verified_by_psu_no VARCHAR(64),
    verified_at TIMESTAMPTZ,
    
    rejection_reason TEXT,
    rejected_by_pharmacist_name VARCHAR(255),
    rejected_at TIMESTAMPTZ,

    cancellation_reason TEXT,
    cancelled_by VARCHAR(255),
    cancelled_at TIMESTAMPTZ,

    -- Refills / Repeats
    refills_allowed INTEGER NOT NULL DEFAULT 0,
    refills_remaining INTEGER NOT NULL DEFAULT 0,
    last_refill_date TIMESTAMPTZ,

    -- Financial & Insurance
    total_cost_ugx BIGINT NOT NULL DEFAULT 0,
    amount_paid_ugx BIGINT NOT NULL DEFAULT 0,
    outstanding_balance_ugx BIGINT NOT NULL DEFAULT 0,
    insurance_claim_id VARCHAR(64),
    insurance_scheme_name VARCHAR(128),

    -- Original Artifact
    original_rx_image_url TEXT,
    ocr_raw_text TEXT,
    ocr_confidence NUMERIC(5,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Prescription Medication Line Items
CREATE TABLE IF NOT EXISTS public.prescription_items_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions_v2(id) ON DELETE CASCADE,
    drug_id VARCHAR(128),
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    strength VARCHAR(64) NOT NULL, -- e.g. 500mg, 10mg/5ml
    dosage_form VARCHAR(64) NOT NULL, -- e.g. Tablet, Capsule, Syrup, Inhaler
    route medication_route_type NOT NULL DEFAULT 'oral',
    
    -- Posology
    dose VARCHAR(64) NOT NULL, -- e.g. 1 Tablet, 5ml
    frequency VARCHAR(64) NOT NULL, -- e.g. TDS (3 times daily), BD (2 times daily)
    duration VARCHAR(64) NOT NULL, -- e.g. 5 Days, 1 Month
    
    -- Quantity Management & Partial Dispensing
    quantity_prescribed INTEGER NOT NULL,
    quantity_dispensed INTEGER NOT NULL DEFAULT 0,
    quantity_remaining INTEGER GENERATED ALWAYS AS (quantity_prescribed - quantity_dispensed) STORED,
    unit_price_ugx BIGINT NOT NULL DEFAULT 0,
    
    is_fully_dispensed BOOLEAN GENERATED ALWAYS AS (quantity_dispensed >= quantity_prescribed) STORED,
    is_pom BOOLEAN NOT NULL DEFAULT TRUE,
    is_controlled_substance BOOLEAN NOT NULL DEFAULT FALSE,
    special_instructions TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Partial Dispensing Audit Logs Table
CREATE TABLE IF NOT EXISTS public.partial_dispensing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions_v2(id) ON DELETE CASCADE,
    prescription_item_id UUID NOT NULL REFERENCES public.prescription_items_v2(id) ON DELETE CASCADE,
    dispense_session_number INTEGER NOT NULL DEFAULT 1,
    
    -- Quantities
    quantity_prescribed INTEGER NOT NULL,
    quantity_dispensed_this_session INTEGER NOT NULL,
    quantity_remaining_after_session INTEGER NOT NULL,
    
    -- Batch & Drug Allocation
    drug_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(128) NOT NULL,
    batch_expiry_date DATE NOT NULL,
    unit_price_ugx BIGINT NOT NULL DEFAULT 0,
    total_charged_ugx BIGINT NOT NULL DEFAULT 0,

    -- Dispenser Signature
    dispensing_pharmacist_id VARCHAR(64) NOT NULL,
    dispensing_pharmacist_name VARCHAR(255) NOT NULL,
    dispensing_pharmacist_psu_no VARCHAR(64),
    dispensing_branch_name VARCHAR(255) NOT NULL DEFAULT 'Main Dispensary',
    
    -- Notes & Next Visit
    reason_for_partial_dispense VARCHAR(255) DEFAULT 'Temporary local stock deficit. Remaining quantity reserved upon restock.',
    next_expected_collection_date DATE,
    notes TEXT,
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Prescription Amendment History
CREATE TABLE IF NOT EXISTS public.prescription_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions_v2(id) ON DELETE CASCADE,
    prescription_item_id UUID REFERENCES public.prescription_items_v2(id) ON DELETE SET NULL,
    
    field_amended VARCHAR(128) NOT NULL, -- e.g. 'dosage', 'frequency', 'brand_name', 'quantity'
    old_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    
    clinical_justification TEXT NOT NULL,
    amended_by_user_id VARCHAR(64) NOT NULL,
    amended_by_pharmacist_name VARCHAR(255) NOT NULL,
    amended_by_psu_no VARCHAR(64),
    prescriber_contacted BOOLEAN NOT NULL DEFAULT FALSE,
    prescriber_agreement_notes TEXT,
    
    amended_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes for High-Velocity Searching & Filter
CREATE INDEX IF NOT EXISTS idx_rx_lifecycle_status ON public.prescriptions_v2(status);
CREATE INDEX IF NOT EXISTS idx_rx_lifecycle_patient ON public.prescriptions_v2(patient_name);
CREATE INDEX IF NOT EXISTS idx_rx_lifecycle_number ON public.prescriptions_v2(rx_number);
CREATE INDEX IF NOT EXISTS idx_rx_partial_dispense ON public.partial_dispensing_events(prescription_id);
CREATE INDEX IF NOT EXISTS idx_rx_amendments ON public.prescription_amendments(prescription_id);

-- 8. Enable Row-Level Security
ALTER TABLE public.prescriptions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partial_dispensing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prescriptions tenant isolation" ON public.prescriptions_v2
    FOR ALL USING (tenant_id = current_setting('app.current_tenant', true) OR current_setting('app.current_tenant', true) IS NULL);

CREATE POLICY "Prescription items tenant isolation" ON public.prescription_items_v2
    FOR ALL USING (true);

CREATE POLICY "Partial dispensing tenant isolation" ON public.partial_dispensing_events
    FOR ALL USING (true);

CREATE POLICY "Prescription amendments tenant isolation" ON public.prescription_amendments
    FOR ALL USING (true);
