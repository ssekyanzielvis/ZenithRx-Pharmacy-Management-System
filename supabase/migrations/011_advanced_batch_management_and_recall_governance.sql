-- ============================================================================
-- ZenithRx Deep Batch Management & Recall Governance (§11.6, §11.20)
-- ============================================================================

-- 1. Create Enums for Batch Lifecycle States & Recall Protocols
DO $$ BEGIN
    CREATE TYPE batch_lifecycle_state AS ENUM (
        'available',     -- Active & ready for POS / FEFO dispensing
        'quarantined',   -- On hold pending lab test / cold chain check
        'expired',       -- Past expiry date; automatically locked from sale
        'recalled',      -- Subject to NDA / Manufacturer voluntary recall
        'damaged',       -- Broken seals, physical or transit damage
        'returned',      -- Returned to supplier / vendor (RTV)
        'destroyed'      -- Witnessed chemical / hazardous waste disposal
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE batch_recall_status AS ENUM (
        'none',
        'recall_initiated',
        'quarantine_enforced',
        'patient_alerts_dispatched',
        'isolated_in_lockup',
        'returned_to_vendor',
        'destroyed_witnessed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE storage_zone_type AS ENUM (
        'ambient_shelf',
        'cold_chain_fridge_2_8',
        'frozen_freezer_minus_20',
        'schedule_1_poison_safe',
        'quarantine_cage_isolated',
        'damaged_returns_bay'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Pharmacy Batches Master Table
CREATE TABLE IF NOT EXISTS public.pharmacy_batches (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant_prime',
    branch_id VARCHAR(64) NOT NULL DEFAULT 'branch_kampala_central',
    
    -- Core Batch Identification
    batch_number VARCHAR(64) NOT NULL,
    drug_id VARCHAR(64) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL, -- Generic + Brand
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(64) NOT NULL,    -- Tablet, Suspension, Injection
    strength VARCHAR(64) NOT NULL,       -- 500mg, 120mg/5mL, etc.
    
    -- Manufacturer & Origin
    manufacturer_name VARCHAR(255) NOT NULL,
    country_of_manufacture VARCHAR(128) NOT NULL DEFAULT 'Uganda',
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    
    -- Stock & Quantities Breakdown
    quantity_received INTEGER NOT NULL CHECK (quantity_received >= 0),
    quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
    quantity_quarantined INTEGER NOT NULL DEFAULT 0 CHECK (quantity_quarantined >= 0),
    quantity_damaged INTEGER NOT NULL DEFAULT 0 CHECK (quantity_damaged >= 0),
    quantity_returned INTEGER NOT NULL DEFAULT 0 CHECK (quantity_returned >= 0),
    quantity_destroyed INTEGER NOT NULL DEFAULT 0 CHECK (quantity_destroyed >= 0),
    pack_size VARCHAR(64) NOT NULL DEFAULT 'Box of 100',
    unit_of_measure VARCHAR(32) NOT NULL DEFAULT 'tablets',
    
    -- Financials & Valuation
    purchase_price_ugx BIGINT NOT NULL CHECK (purchase_price_ugx >= 0),
    selling_price_ugx BIGINT NOT NULL CHECK (selling_price_ugx >= 0),
    
    -- Procurement & Chain of Custody
    supplier_name VARCHAR(255) NOT NULL,
    supplier_id VARCHAR(64),
    purchase_order_number VARCHAR(64) NOT NULL,      -- e.g. PO-2026-0841
    goods_received_note_number VARCHAR(64) NOT NULL, -- e.g. GRN-2026-0199
    invoice_number VARCHAR(64),
    received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_by VARCHAR(255) NOT NULL DEFAULT 'Pharmacist on Duty',
    
    -- Physical Storage Logistics
    storage_location VARCHAR(128) NOT NULL,          -- e.g. "Aisle 3, Shelf B2, Bin 14"
    storage_zone storage_zone_type NOT NULL DEFAULT 'ambient_shelf',
    temperature_requirement VARCHAR(64) NOT NULL DEFAULT '15-25°C Room Temp',
    is_cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    is_light_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- State & Recall Governance
    batch_status batch_lifecycle_state NOT NULL DEFAULT 'available',
    recall_status batch_recall_status NOT NULL DEFAULT 'none',
    recall_reason TEXT,
    recall_authority VARCHAR(128),                   -- e.g. 'National Drug Authority (NDA)', 'Voluntary Manufacturer'
    recall_reference_number VARCHAR(64),             -- e.g. 'NDA-REC-2026-004'
    recall_initiated_at TIMESTAMPTZ,
    recall_initiated_by VARCHAR(255),
    
    -- Quality & Clinical Safety Notes
    status_change_reason TEXT,
    quarantine_witness_pharmacist VARCHAR(255),
    destruction_certificate_number VARCHAR(64),
    barcode_data VARCHAR(128),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Batch Audit & State Transition Trail
CREATE TABLE IF NOT EXISTS public.batch_audit_trail (
    id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL REFERENCES public.pharmacy_batches(id) ON DELETE CASCADE,
    batch_number VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    previous_state VARCHAR(64),
    new_state VARCHAR(64) NOT NULL,
    quantity_affected INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    performed_by_name VARCHAR(255) NOT NULL,
    witness_name VARCHAR(255),
    regulatory_reference VARCHAR(128),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Recalled Batch Patient Tracking (Rapid Notification Ledger)
CREATE TABLE IF NOT EXISTS public.batch_recall_patient_ledger (
    id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL REFERENCES public.pharmacy_batches(id) ON DELETE CASCADE,
    batch_number VARCHAR(64) NOT NULL,
    drug_name VARCHAR(255) NOT NULL,
    prescription_id VARCHAR(64),
    patient_id VARCHAR(64) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(32) NOT NULL,
    quantity_dispensed INTEGER NOT NULL,
    dispensed_date TIMESTAMPTZ NOT NULL,
    alert_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    contact_notes TEXT,
    alert_dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for High-Speed FEFO & Recall Lookups
CREATE INDEX IF NOT EXISTS idx_batch_num ON public.pharmacy_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_batch_drug_id ON public.pharmacy_batches(drug_id);
CREATE INDEX IF NOT EXISTS idx_batch_expiry ON public.pharmacy_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batch_status ON public.pharmacy_batches(batch_status);
CREATE INDEX IF NOT EXISTS idx_batch_recall ON public.pharmacy_batches(recall_status);
CREATE INDEX IF NOT EXISTS idx_batch_po ON public.pharmacy_batches(purchase_order_number);
CREATE INDEX IF NOT EXISTS idx_batch_grn ON public.pharmacy_batches(goods_received_note_number);
CREATE INDEX IF NOT EXISTS idx_batch_storage ON public.pharmacy_batches(storage_location);

-- 6. Row-Level Security
ALTER TABLE public.pharmacy_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_recall_patient_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to pharmacy batches" ON public.pharmacy_batches FOR SELECT USING (true);
CREATE POLICY "Allow manage access to pharmacy batches" ON public.pharmacy_batches FOR ALL USING (true);

CREATE POLICY "Allow read access to batch audit trail" ON public.batch_audit_trail FOR SELECT USING (true);
CREATE POLICY "Allow manage access to batch audit trail" ON public.batch_audit_trail FOR ALL USING (true);

CREATE POLICY "Allow read access to recall patient ledger" ON public.batch_recall_patient_ledger FOR SELECT USING (true);
CREATE POLICY "Allow manage access to recall patient ledger" ON public.batch_recall_patient_ledger FOR ALL USING (true);
