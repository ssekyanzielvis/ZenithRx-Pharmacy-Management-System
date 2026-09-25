-- ============================================================================
-- ZenithRx Stock Adjustment & Physical Stocktake Reconciliation (§11.6, §11.20)
-- ============================================================================

-- 1. Enums for Stock Adjustments & Physical Stocktake
DO $$ BEGIN
    CREATE TYPE stock_adjustment_reason AS ENUM (
        'damaged_medicine',
        'expired_medicine',
        'lost_medicine',
        'theft',
        'breakage',
        'incorrect_receiving',
        'data_entry_correction',
        'returned_medicine',
        'stock_count_variance'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_adjustment_status AS ENUM (
        'pending_approval',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stocktake_session_status AS ENUM (
        'draft',
        'in_progress',
        'reconciliation_pending',
        'approved_and_posted',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stocktake_scope_type AS ENUM (
        'full_pharmacy',
        'category_cycle_count',
        'storage_zone_count',
        'controlled_drugs_audit',
        'high_value_items'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Stock Adjustments Ledger
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id VARCHAR(64) PRIMARY KEY,
    adjustment_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant_prime',
    branch_id VARCHAR(64) NOT NULL DEFAULT 'branch_kampala_central',
    
    -- Drug & Batch Target
    drug_id VARCHAR(64) NOT NULL,
    drug_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    batch_id VARCHAR(64),
    batch_number VARCHAR(64) NOT NULL,
    expiry_date DATE,
    
    -- Quantities & Financial Impact
    previous_quantity INTEGER NOT NULL CHECK (previous_quantity >= 0),
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    quantity_difference INTEGER NOT NULL, -- (+/-)
    unit_cost_price_ugx BIGINT NOT NULL DEFAULT 0,
    financial_impact_ugx BIGINT NOT NULL DEFAULT 0, -- difference * unit_cost
    
    -- Reason & Operational Justification
    reason stock_adjustment_reason NOT NULL,
    justification_notes TEXT NOT NULL,
    
    -- Audit & Approvals
    initiated_by_user_id VARCHAR(64) NOT NULL,
    initiated_by_name VARCHAR(255) NOT NULL,
    initiated_by_role VARCHAR(128) NOT NULL,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    status stock_adjustment_status NOT NULL DEFAULT 'pending_approval',
    reviewed_by_user_id VARCHAR(64),
    reviewed_by_name VARCHAR(255),
    reviewed_by_role VARCHAR(128),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    stocktake_session_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Physical Stocktake Sessions
CREATE TABLE IF NOT EXISTS public.stocktake_sessions (
    id VARCHAR(64) PRIMARY KEY,
    stocktake_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant_prime',
    branch_id VARCHAR(64) NOT NULL DEFAULT 'branch_kampala_central',
    
    title VARCHAR(255) NOT NULL,
    scope_type stocktake_scope_type NOT NULL DEFAULT 'full_pharmacy',
    target_category VARCHAR(128),
    target_storage_zone VARCHAR(128),
    status stocktake_session_status NOT NULL DEFAULT 'in_progress',
    
    initiated_by_name VARCHAR(255) NOT NULL,
    initiated_by_role VARCHAR(128) NOT NULL,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    supervisor_pharmacist_name VARCHAR(255),
    
    -- Metrics
    total_items_scoped INTEGER NOT NULL DEFAULT 0,
    items_counted INTEGER NOT NULL DEFAULT 0,
    items_with_variance INTEGER NOT NULL DEFAULT 0,
    total_system_quantity INTEGER NOT NULL DEFAULT 0,
    total_counted_quantity INTEGER NOT NULL DEFAULT 0,
    total_variance_units INTEGER NOT NULL DEFAULT 0,
    net_financial_variance_ugx BIGINT NOT NULL DEFAULT 0,
    
    completed_at TIMESTAMPTZ,
    approved_by_name VARCHAR(255),
    approved_at TIMESTAMPTZ,
    audit_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Stocktake Count Items (Physical vs System Comparison)
CREATE TABLE IF NOT EXISTS public.stocktake_count_items (
    id VARCHAR(64) PRIMARY KEY,
    stocktake_session_id VARCHAR(64) NOT NULL REFERENCES public.stocktake_sessions(id) ON DELETE CASCADE,
    
    drug_id VARCHAR(64) NOT NULL,
    drug_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(64) NOT NULL,
    expiry_date DATE,
    storage_location VARCHAR(128),
    
    system_expected_qty INTEGER NOT NULL DEFAULT 0,
    physical_counted_qty INTEGER,
    variance_qty INTEGER DEFAULT 0, -- counted - system
    unit_cost_price_ugx BIGINT NOT NULL DEFAULT 0,
    variance_value_ugx BIGINT NOT NULL DEFAULT 0, -- variance_qty * unit_cost
    
    counter_user_name VARCHAR(255),
    counted_at TIMESTAMPTZ,
    reconciliation_reason stock_adjustment_reason,
    notes TEXT,
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_adj_drug ON public.stock_adjustments(drug_id);
CREATE INDEX IF NOT EXISTS idx_adj_batch ON public.stock_adjustments(batch_number);
CREATE INDEX IF NOT EXISTS idx_adj_reason ON public.stock_adjustments(reason);
CREATE INDEX IF NOT EXISTS idx_adj_status ON public.stock_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_adj_stocktake ON public.stock_adjustments(stocktake_session_id);

CREATE INDEX IF NOT EXISTS idx_stk_status ON public.stocktake_sessions(status);
CREATE INDEX IF NOT EXISTS idx_stk_scope ON public.stocktake_sessions(scope_type);
CREATE INDEX IF NOT EXISTS idx_stk_items_session ON public.stocktake_count_items(stocktake_session_id);

-- 6. Row-Level Security
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocktake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocktake_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read stock adjustments" ON public.stock_adjustments FOR SELECT USING (true);
CREATE POLICY "Allow manage stock adjustments" ON public.stock_adjustments FOR ALL USING (true);

CREATE POLICY "Allow read stocktake sessions" ON public.stocktake_sessions FOR SELECT USING (true);
CREATE POLICY "Allow manage stocktake sessions" ON public.stocktake_sessions FOR ALL USING (true);

CREATE POLICY "Allow read stocktake count items" ON public.stocktake_count_items FOR SELECT USING (true);
CREATE POLICY "Allow manage stocktake count items" ON public.stocktake_count_items FOR ALL USING (true);
