-- ============================================================================
-- ZenithRx Medicine Recall Management & Incident Command System (§11.6, §11.20)
-- Multi-Branch Batch Isolation, Cross-Pharmacy Holdings, Patient Traceability & NDA Dossiers
-- ============================================================================

-- 1. Enums for Recall Governance
DO $$ BEGIN
    CREATE TYPE recall_incident_severity AS ENUM (
        'class_1_critical_life_threatening', -- Fatal / Serious adverse health consequences
        'class_2_serious_harm',             -- Reversible health hazard or medically remediable
        'class_3_minor_defect_or_labeling'  -- Not likely to cause adverse health consequences
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recall_incident_status AS ENUM (
        'active_investigation',
        'quarantine_enforced',
        'notifications_dispatched',
        'quarantine_completed',
        'closed_and_archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Recall Incidents Master Table
CREATE TABLE IF NOT EXISTS public.recall_incidents (
    id VARCHAR(64) PRIMARY KEY,
    recall_case_number VARCHAR(64) NOT NULL UNIQUE, -- e.g. NDA-REC-2026-004
    title VARCHAR(255) NOT NULL,
    severity recall_incident_severity NOT NULL DEFAULT 'class_2_serious_harm',
    
    -- Drug & Batch Target
    drug_id VARCHAR(64) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(64),
    strength VARCHAR(64),
    target_batch_number VARCHAR(64) NOT NULL,
    expiry_date DATE,
    
    -- Manufacturer & Supply Chain
    manufacturer_name VARCHAR(255) NOT NULL,
    country_of_manufacture VARCHAR(128) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_id VARCHAR(64),
    
    -- Regulatory Context & Hazard
    issuing_authority VARCHAR(128) NOT NULL DEFAULT 'National Drug Authority (NDA)',
    recall_reason TEXT NOT NULL,
    clinical_hazard_summary TEXT NOT NULL,
    
    -- Command & Audit
    initiated_by_name VARCHAR(255) NOT NULL,
    initiated_by_role VARCHAR(128) NOT NULL,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status recall_incident_status NOT NULL DEFAULT 'active_investigation',
    
    -- Aggregated Exposure Metrics
    total_affected_pharmacies_count INTEGER NOT NULL DEFAULT 0,
    total_affected_branches_count INTEGER NOT NULL DEFAULT 0,
    total_initial_received_qty INTEGER NOT NULL DEFAULT 0,
    total_quarantined_remaining_qty INTEGER NOT NULL DEFAULT 0,
    total_dispensed_qty INTEGER NOT NULL DEFAULT 0,
    total_affected_patients_count INTEGER NOT NULL DEFAULT 0,
    total_alerts_delivered_count INTEGER NOT NULL DEFAULT 0,
    
    closed_at TIMESTAMPTZ,
    closed_by_name VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Multi-Branch Holdings (Inventory Exposure Across All Locations)
CREATE TABLE IF NOT EXISTS public.recall_branch_holdings (
    id VARCHAR(64) PRIMARY KEY,
    recall_incident_id VARCHAR(64) NOT NULL REFERENCES public.recall_incidents(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    pharmacy_name VARCHAR(255) NOT NULL,
    branch_id VARCHAR(64) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    branch_location VARCHAR(255) NOT NULL,
    
    quantity_received INTEGER NOT NULL DEFAULT 0,
    quantity_remaining INTEGER NOT NULL DEFAULT 0,
    quantity_quarantined INTEGER NOT NULL DEFAULT 0,
    quantity_dispensed INTEGER NOT NULL DEFAULT 0,
    
    quarantine_location VARCHAR(128) NOT NULL DEFAULT 'Quarantine Safe - Recalled Lockup',
    is_pos_locked BOOLEAN NOT NULL DEFAULT TRUE,
    
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Recall Dispensing & Patient Exposure Audit Ledger
CREATE TABLE IF NOT EXISTS public.recall_dispensing_audit (
    id VARCHAR(64) PRIMARY KEY,
    recall_incident_id VARCHAR(64) NOT NULL REFERENCES public.recall_incidents(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    pharmacy_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    
    -- Transaction Identifiers
    prescription_number VARCHAR(64),
    order_number VARCHAR(64),
    receipt_number VARCHAR(64),
    dispensed_at TIMESTAMPTZ NOT NULL,
    
    -- Patient Info (Controlled Clinical Access)
    patient_id VARCHAR(64) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(32) NOT NULL,
    patient_district VARCHAR(128),
    
    quantity_dispensed INTEGER NOT NULL,
    dispensing_pharmacist_name VARCHAR(255) NOT NULL,
    
    -- Safety Outreach Tracking
    patient_alert_status VARCHAR(64) NOT NULL DEFAULT 'pending', -- 'pending', 'sms_delivered', 'phone_call_confirmed', 'medicine_returned_exchanged', 'unreachable'
    patient_clinical_status VARCHAR(64) NOT NULL DEFAULT 'healthy_no_symptoms', -- 'healthy_no_symptoms', 'mild_reaction_reported', 'referred_to_hospital'
    contact_notes TEXT,
    last_contact_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_rec_case ON public.recall_incidents(recall_case_number);
CREATE INDEX IF NOT EXISTS idx_rec_batch ON public.recall_incidents(target_batch_number);
CREATE INDEX IF NOT EXISTS idx_rec_status ON public.recall_incidents(status);
CREATE INDEX IF NOT EXISTS idx_rec_holdings_inc ON public.recall_branch_holdings(recall_incident_id);
CREATE INDEX IF NOT EXISTS idx_rec_disp_inc ON public.recall_dispensing_audit(recall_incident_id);
CREATE INDEX IF NOT EXISTS idx_rec_disp_patient ON public.recall_dispensing_audit(patient_id);

-- 6. Row-Level Security
ALTER TABLE public.recall_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_branch_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_dispensing_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read recall incidents" ON public.recall_incidents FOR SELECT USING (true);
CREATE POLICY "Allow manage recall incidents" ON public.recall_incidents FOR ALL USING (true);

CREATE POLICY "Allow read branch holdings" ON public.recall_branch_holdings FOR SELECT USING (true);
CREATE POLICY "Allow manage branch holdings" ON public.recall_branch_holdings FOR ALL USING (true);

CREATE POLICY "Allow read dispensing audit" ON public.recall_dispensing_audit FOR SELECT USING (true);
CREATE POLICY "Allow manage dispensing audit" ON public.recall_dispensing_audit FOR ALL USING (true);
