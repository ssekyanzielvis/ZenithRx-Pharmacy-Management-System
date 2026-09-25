-- ============================================================================
-- ZenithRx Enterprise 3-Way Invoice Matching & Reconciliation Engine
-- Purchase Order vs Goods Received Note vs Supplier Invoice
-- Line-by-Line Matching with Tolerance, Dispute Resolution & Audit Trail
-- ============================================================================

-- 1. Custom Types for 3-Way Matching
DO $$ BEGIN
    CREATE TYPE match_line_verdict AS ENUM (
        'exact_match',
        'within_tolerance',
        'quantity_mismatch',
        'price_mismatch',
        'quantity_and_price_mismatch',
        'item_missing_from_invoice',
        'item_missing_from_grn',
        'unmatched'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_session_verdict AS ENUM (
        'full_match',
        'partial_match_within_tolerance',
        'blocked_quantity_discrepancy',
        'blocked_price_discrepancy',
        'blocked_multiple_discrepancies',
        'pending_review',
        'dispute_raised',
        'override_approved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_dispute_status AS ENUM (
        'open',
        'credit_note_requested',
        'credit_note_received',
        'price_adjustment_accepted',
        'debit_note_issued',
        'escalated_to_management',
        'resolved_and_closed',
        'written_off'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Supplier Invoice Line Items (extends p2p_supplier_invoices)
CREATE TABLE IF NOT EXISTS public.p2p_supplier_invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.p2p_supplier_invoices(id) ON DELETE CASCADE,
    po_item_id UUID REFERENCES public.p2p_purchase_order_items(id),
    drug_id VARCHAR(100),
    generic_name VARCHAR(200) NOT NULL,
    brand_name VARCHAR(200),
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    invoiced_quantity INT NOT NULL,
    unit_cost_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    batch_number_referenced VARCHAR(100),
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Pack',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Matching Tolerance Configuration (per-pharmacy configurable)
CREATE TABLE IF NOT EXISTS public.p2p_matching_tolerance_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    quantity_tolerance_percent NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
    quantity_tolerance_absolute_units INT NOT NULL DEFAULT 2,
    price_tolerance_percent NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    price_tolerance_absolute_ugx NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    total_value_tolerance_ugx NUMERIC(15, 2) NOT NULL DEFAULT 50000.00,
    auto_approve_exact_match BOOLEAN NOT NULL DEFAULT TRUE,
    auto_approve_within_tolerance BOOLEAN NOT NULL DEFAULT FALSE,
    require_dual_authorization_above_ugx NUMERIC(15, 2) NOT NULL DEFAULT 5000000.00,
    configured_by_name VARCHAR(150) NOT NULL,
    configured_by_role VARCHAR(100) NOT NULL,
    configured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- 4. 3-Way Match Session (replaces simple match record)
CREATE TABLE IF NOT EXISTS public.p2p_three_way_match_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    match_session_reference VARCHAR(60) NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES public.p2p_supplier_invoices(id),
    purchase_order_id UUID NOT NULL REFERENCES public.p2p_purchase_orders(id),
    grn_id UUID NOT NULL REFERENCES public.p2p_goods_received_notes(id),

    -- Header-Level Totals
    po_total_authorized_ugx NUMERIC(15, 2) NOT NULL,
    grn_total_accepted_ugx NUMERIC(15, 2) NOT NULL,
    invoice_total_billed_ugx NUMERIC(15, 2) NOT NULL,

    -- Header-Level Variances
    po_vs_grn_qty_variance_total INT NOT NULL DEFAULT 0,
    po_vs_invoice_price_variance_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    grn_vs_invoice_qty_variance_total INT NOT NULL DEFAULT 0,
    net_financial_variance_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,

    -- Line Match Summary
    total_line_items INT NOT NULL DEFAULT 0,
    lines_exact_matched INT NOT NULL DEFAULT 0,
    lines_within_tolerance INT NOT NULL DEFAULT 0,
    lines_qty_mismatch INT NOT NULL DEFAULT 0,
    lines_price_mismatch INT NOT NULL DEFAULT 0,
    lines_missing INT NOT NULL DEFAULT 0,

    -- Session Verdict
    session_verdict match_session_verdict NOT NULL DEFAULT 'pending_review',
    verdict_summary TEXT NOT NULL DEFAULT '',
    financial_risk_assessment TEXT,
    recommended_action TEXT,

    -- Workflow
    executed_by_name VARCHAR(150) NOT NULL,
    executed_by_role VARCHAR(100) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by_name VARCHAR(150),
    reviewed_by_role VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    approved_by_name VARCHAR(150),
    approved_by_role VARCHAR(100),
    approved_at TIMESTAMPTZ,
    override_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 3-Way Match Line Details (the line-by-line comparison)
CREATE TABLE IF NOT EXISTS public.p2p_three_way_match_line_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_session_id UUID NOT NULL REFERENCES public.p2p_three_way_match_sessions(id) ON DELETE CASCADE,

    -- Item Identification
    drug_id VARCHAR(100),
    generic_name VARCHAR(200) NOT NULL,
    brand_name VARCHAR(200),
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Pack',

    -- PO Data
    po_item_id UUID REFERENCES public.p2p_purchase_order_items(id),
    po_ordered_quantity INT NOT NULL DEFAULT 0,
    po_unit_cost_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    po_line_total_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,

    -- GRN Data
    grn_item_id UUID,
    grn_delivered_quantity INT NOT NULL DEFAULT 0,
    grn_accepted_quantity INT NOT NULL DEFAULT 0,
    grn_batch_number VARCHAR(100),

    -- Invoice Data
    invoice_item_id UUID,
    invoice_billed_quantity INT NOT NULL DEFAULT 0,
    invoice_unit_cost_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    invoice_line_total_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,

    -- Computed Variances
    qty_variance_po_vs_grn INT NOT NULL DEFAULT 0,
    qty_variance_grn_vs_invoice INT NOT NULL DEFAULT 0,
    qty_variance_po_vs_invoice INT NOT NULL DEFAULT 0,
    price_variance_po_vs_invoice_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    value_variance_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,

    -- Verdict
    line_verdict match_line_verdict NOT NULL DEFAULT 'unmatched',
    variance_explanation TEXT,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Dispute / Credit Note Management
CREATE TABLE IF NOT EXISTS public.p2p_match_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    dispute_reference VARCHAR(60) NOT NULL UNIQUE,
    match_session_id UUID NOT NULL REFERENCES public.p2p_three_way_match_sessions(id),
    invoice_id UUID NOT NULL REFERENCES public.p2p_supplier_invoices(id),
    supplier_name VARCHAR(200) NOT NULL,

    -- Dispute Content
    dispute_type VARCHAR(50) NOT NULL, -- 'quantity_shortage', 'price_overcharge', 'both', 'item_not_ordered'
    total_disputed_amount_ugx NUMERIC(15, 2) NOT NULL,
    disputed_line_count INT NOT NULL DEFAULT 0,
    dispute_narrative TEXT NOT NULL,
    supporting_document_urls TEXT[],

    -- Supplier Response
    supplier_response TEXT,
    credit_note_number VARCHAR(100),
    credit_note_amount_ugx NUMERIC(15, 2),
    credit_note_date DATE,
    debit_note_number VARCHAR(100),
    debit_note_amount_ugx NUMERIC(15, 2),

    -- Status
    status match_dispute_status NOT NULL DEFAULT 'open',
    raised_by_name VARCHAR(150) NOT NULL,
    raised_by_role VARCHAR(100) NOT NULL,
    raised_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_by_name VARCHAR(150),
    resolved_by_role VARCHAR(100),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_p2p_inv_line_items ON public.p2p_supplier_invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_p2p_match_session_inv ON public.p2p_three_way_match_sessions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_p2p_match_session_po ON public.p2p_three_way_match_sessions(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_p2p_match_line_session ON public.p2p_three_way_match_line_details(match_session_id);
CREATE INDEX IF NOT EXISTS idx_p2p_dispute_session ON public.p2p_match_disputes(match_session_id);
CREATE INDEX IF NOT EXISTS idx_p2p_dispute_tenant ON public.p2p_match_disputes(tenant_id, status);

-- 8. Row Level Security
ALTER TABLE public.p2p_supplier_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_matching_tolerance_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_three_way_match_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_three_way_match_line_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_match_disputes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_supplier_invoice_line_items"
    ON public.p2p_supplier_invoice_line_items FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_matching_tolerance_config"
    ON public.p2p_matching_tolerance_config FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_three_way_match_sessions"
    ON public.p2p_three_way_match_sessions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_three_way_match_line_details"
    ON public.p2p_three_way_match_line_details FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_match_disputes"
    ON public.p2p_match_disputes FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 9. Insert default tolerance config
INSERT INTO public.p2p_matching_tolerance_config (
    tenant_id, quantity_tolerance_percent, quantity_tolerance_absolute_units,
    price_tolerance_percent, price_tolerance_absolute_ugx,
    total_value_tolerance_ugx, auto_approve_exact_match,
    auto_approve_within_tolerance, require_dual_authorization_above_ugx,
    configured_by_name, configured_by_role
) VALUES (
    'client-001', 2.00, 2, 1.50, 5000.00, 50000.00,
    TRUE, FALSE, 5000000.00,
    'System Administrator', 'Platform Admin'
) ON CONFLICT (tenant_id) DO NOTHING;
