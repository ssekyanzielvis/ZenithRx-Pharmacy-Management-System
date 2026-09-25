-- ============================================================================
-- ZenithRx Enterprise Medicine Returns Management (§11.6, §11.20)
-- Covers: Customer Returns (Patient → Pharmacy) & Supplier Returns (Pharmacy → Vendor RTV)
-- Multi-path Disposition: Saleable Restock | Quarantine | Supplier RTV | Destruction
-- ============================================================================

-- 1. Enums for Returns Management
DO $$ BEGIN
    CREATE TYPE return_type AS ENUM (
        'customer_return',
        'supplier_return'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE return_reason AS ENUM (
        'wrong_medicine',
        'damaged_product',
        'expired_product',
        'recall',
        'incorrect_quantity',
        'delivery_error',
        'defective_packaging',
        'adverse_drug_reaction',
        'treatment_changed_by_doctor'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE return_disposition AS ENUM (
        'restock_saleable',     -- Sealed, intact, verified → returned to available POS stock
        'quarantine_hold',      -- Held in isolation cage pending investigation / lab assay
        'supplier_return_rtv',  -- Return to vendor / wholesale distributor for credit note
        'destruction'           -- Witnessed chemical neutralization / hazardous waste incineration
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE return_workflow_status AS ENUM (
        'initiated',
        'pharmacist_inspected',
        'approved_and_processed',
        'rejected_no_refund',
        'credit_note_issued',
        'restocked',
        'disposed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE refund_payment_method AS ENUM (
        'cash_refund',
        'store_credit_wallet',
        'mobile_money_reversal',
        'supplier_credit_note',
        'replacement_exchange',
        'none'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Core Medicine Returns Table
CREATE TABLE IF NOT EXISTS public.medicine_returns (
    id VARCHAR(64) PRIMARY KEY,
    return_reference_number VARCHAR(64) NOT NULL UNIQUE,
    return_type return_type NOT NULL DEFAULT 'customer_return',
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant_prime',
    branch_id VARCHAR(64) NOT NULL DEFAULT 'branch_kampala_central',
    
    -- Target Medicine & Batch Identification
    drug_id VARCHAR(64) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(64) NOT NULL,
    expiry_date DATE,
    quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
    unit_price_ugx BIGINT NOT NULL CHECK (unit_price_ugx >= 0),
    total_refund_amount_ugx BIGINT NOT NULL CHECK (total_refund_amount_ugx >= 0),
    
    -- Customer Origin (for Customer Returns)
    customer_id VARCHAR(64),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(32),
    original_receipt_number VARCHAR(64),
    original_prescription_id VARCHAR(64),
    original_sale_date TIMESTAMPTZ,
    
    -- Supplier Destination (for Supplier Returns RTV)
    supplier_id VARCHAR(64),
    supplier_name VARCHAR(255),
    purchase_order_number VARCHAR(64),
    goods_received_note_number VARCHAR(64),
    supplier_credit_note_number VARCHAR(64),
    
    -- Reasons & Physical Assessment
    reason return_reason NOT NULL,
    is_package_opened BOOLEAN NOT NULL DEFAULT FALSE,
    is_cold_chain_breached BOOLEAN NOT NULL DEFAULT FALSE,
    physical_inspection_notes TEXT,
    
    -- Disposition Routing & Storage Destination
    disposition return_disposition NOT NULL DEFAULT 'quarantine_hold',
    disposition_rationale TEXT NOT NULL,
    target_storage_location VARCHAR(128) NOT NULL DEFAULT 'Quarantine Isolation Cage #2',
    
    -- Financial Resolution
    refund_method refund_payment_method NOT NULL DEFAULT 'none',
    refund_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'refunded', 'credit_issued', 'denied'
    replacement_batch_number VARCHAR(64),
    
    -- Workflow & Sign-offs
    status return_workflow_status NOT NULL DEFAULT 'initiated',
    initiated_by_name VARCHAR(255) NOT NULL,
    initiated_by_role VARCHAR(128) NOT NULL,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    inspected_by_pharmacist_name VARCHAR(255),
    inspected_by_pharmacist_role VARCHAR(128),
    inspected_at TIMESTAMPTZ,
    
    approved_by_supervisor_name VARCHAR(255),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_ret_ref ON public.medicine_returns(return_reference_number);
CREATE INDEX IF NOT EXISTS idx_ret_type ON public.medicine_returns(return_type);
CREATE INDEX IF NOT EXISTS idx_ret_drug ON public.medicine_returns(drug_id);
CREATE INDEX IF NOT EXISTS idx_ret_batch ON public.medicine_returns(batch_number);
CREATE INDEX IF NOT EXISTS idx_ret_reason ON public.medicine_returns(reason);
CREATE INDEX IF NOT EXISTS idx_ret_disposition ON public.medicine_returns(disposition);
CREATE INDEX IF NOT EXISTS idx_ret_status ON public.medicine_returns(status);
CREATE INDEX IF NOT EXISTS idx_ret_supplier ON public.medicine_returns(supplier_name);

-- 4. Row-Level Security
ALTER TABLE public.medicine_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read medicine returns" ON public.medicine_returns FOR SELECT USING (true);
CREATE POLICY "Allow manage medicine returns" ON public.medicine_returns FOR ALL USING (true);
