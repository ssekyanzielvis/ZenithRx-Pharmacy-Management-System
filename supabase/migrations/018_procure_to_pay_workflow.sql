-- ============================================================================
-- ZenithRx Enterprise Procure-to-Pay (P2P) Pharmacy Workflow Migration
-- Comprehensive 9-Stage Pharmacy Procurement & Governance Engine
-- Requisition -> PO -> Supplier Confirmation -> GRN -> Batch Reg -> QC -> Invoice -> 3-Way Match -> Payment
-- ============================================================================

-- 1. Custom Types for P2P Pipeline
DO $$ BEGIN
    CREATE TYPE p2p_stage_type AS ENUM (
        'requisition',
        'purchase_order',
        'supplier_confirmation',
        'goods_received',
        'batch_registration',
        'quality_verification',
        'invoice',
        'invoice_matching',
        'payment'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE p2p_requisition_status AS ENUM (
        'draft',
        'pending_approval',
        'approved',
        'rejected',
        'converted_to_po'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE p2p_po_lifecycle_status AS ENUM (
        'draft',
        'issued_to_supplier',
        'confirmed_by_supplier',
        'partially_received',
        'fully_received',
        'closed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE p2p_qc_outcome_type AS ENUM (
        'passed_released_to_stock',
        'passed_with_minor_defects',
        'quarantined_pending_investigation',
        'rejected_damaged_or_spurious',
        'rejected_cold_chain_breached',
        'rejected_shortage'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE p2p_match_status_type AS ENUM (
        'exact_match',
        'matched_within_tolerance',
        'price_mismatch_flagged',
        'quantity_mismatch_flagged',
        'unmatched_blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE p2p_payment_voucher_status AS ENUM (
        'pending_authorization',
        'authorized_for_payment',
        'payment_initiated',
        'settled_and_reconciled',
        'voided'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Stage 1: Purchase Requisitions (PR)
CREATE TABLE IF NOT EXISTS public.p2p_purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    pr_number VARCHAR(60) NOT NULL UNIQUE,
    branch_name VARCHAR(150) NOT NULL DEFAULT 'Main Dispensary & Store',
    requested_by_user_id UUID,
    requested_by_name VARCHAR(150) NOT NULL,
    requested_by_role VARCHAR(100) NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'standard', -- 'standard', 'urgent', 'stockout_emergency'
    requisition_reason TEXT NOT NULL,
    status p2p_requisition_status NOT NULL DEFAULT 'draft',
    estimated_total_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    approved_by_name VARCHAR(150),
    approved_by_role VARCHAR(100),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.p2p_purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID NOT NULL REFERENCES public.p2p_purchase_requisitions(id) ON DELETE CASCADE,
    drug_id VARCHAR(100),
    generic_name VARCHAR(200) NOT NULL,
    brand_name VARCHAR(200),
    dosage_form VARCHAR(100) NOT NULL,
    strength VARCHAR(100),
    current_stock_level INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 0,
    requested_quantity INT NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Pack',
    estimated_unit_cost_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total_estimated_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    clinical_justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Stage 2 & 3: Master P2P Purchase Orders & Supplier Confirmations
CREATE TABLE IF NOT EXISTS public.p2p_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    po_number VARCHAR(60) NOT NULL UNIQUE,
    requisition_id UUID REFERENCES public.p2p_purchase_requisitions(id),
    supplier_id VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_license_no VARCHAR(100),
    supplier_email VARCHAR(150),
    supplier_phone VARCHAR(50),
    payment_terms VARCHAR(100) NOT NULL DEFAULT 'Net 30 Days',
    delivery_location VARCHAR(200) NOT NULL DEFAULT 'Central Pharmacy Warehouse, Kampala',
    expected_delivery_date DATE,
    currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
    total_order_amount_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status p2p_po_lifecycle_status NOT NULL DEFAULT 'draft',
    
    -- Supplier Confirmation Details (Stage 3)
    supplier_ack_reference VARCHAR(100),
    supplier_confirmed_at TIMESTAMPTZ,
    supplier_confirmed_dispatch_date DATE,
    supplier_backorder_notes TEXT,
    
    created_by_name VARCHAR(150) NOT NULL,
    created_by_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.p2p_purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.p2p_purchase_orders(id) ON DELETE CASCADE,
    drug_id VARCHAR(100),
    generic_name VARCHAR(200) NOT NULL,
    brand_name VARCHAR(200),
    dosage_form VARCHAR(100) NOT NULL,
    strength VARCHAR(100),
    ordered_quantity INT NOT NULL,
    unit_cost_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_line_amount_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    confirmed_quantity INT,
    confirmed_unit_cost_ugx NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Stage 4 & 5: Goods Received Notes (GRN) & Inward Batch Registration
CREATE TABLE IF NOT EXISTS public.p2p_goods_received_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    grn_number VARCHAR(60) NOT NULL UNIQUE,
    purchase_order_id UUID NOT NULL REFERENCES public.p2p_purchase_orders(id),
    po_number VARCHAR(60) NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    delivery_note_number VARCHAR(100) NOT NULL,
    waybill_carrier_name VARCHAR(150),
    vehicle_registration VARCHAR(50),
    received_by_name VARCHAR(150) NOT NULL,
    received_by_role VARCHAR(100) NOT NULL,
    receipt_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_packages_received INT NOT NULL DEFAULT 1,
    external_packaging_condition VARCHAR(100) NOT NULL DEFAULT 'Intact and Sealed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.p2p_goods_received_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES public.p2p_goods_received_notes(id) ON DELETE CASCADE,
    po_item_id UUID REFERENCES public.p2p_purchase_order_items(id),
    drug_id VARCHAR(100),
    generic_name VARCHAR(200) NOT NULL,
    brand_name VARCHAR(200),
    ordered_quantity INT NOT NULL,
    delivered_quantity INT NOT NULL,
    variance_quantity INT NOT NULL DEFAULT 0, -- delivered - ordered
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Pack',
    
    -- Stage 5: Inward Batch Registration
    batch_number VARCHAR(100) NOT NULL,
    manufacturer_name VARCHAR(200) NOT NULL,
    country_of_origin VARCHAR(100) NOT NULL DEFAULT 'Uganda',
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    assigned_storage_location VARCHAR(150) NOT NULL DEFAULT 'Central Pharmacy Room Temp Bay 1',
    is_cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    target_temperature_range VARCHAR(50) DEFAULT '15C - 25C',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Stage 6: Quality Verification & Quarantine Inspection
CREATE TABLE IF NOT EXISTS public.p2p_quality_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    qc_number VARCHAR(60) NOT NULL UNIQUE,
    grn_id UUID NOT NULL REFERENCES public.p2p_goods_received_notes(id),
    grn_number VARCHAR(60) NOT NULL,
    inspector_pharmacist_name VARCHAR(150) NOT NULL,
    inspector_psu_license_no VARCHAR(100),
    inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    physical_count_verified BOOLEAN NOT NULL DEFAULT TRUE,
    seals_and_labeling_verified BOOLEAN NOT NULL DEFAULT TRUE,
    cold_chain_log_verified BOOLEAN NOT NULL DEFAULT TRUE,
    temperature_readout_celsius NUMERIC(5, 2),
    certificate_of_analysis_verified BOOLEAN NOT NULL DEFAULT TRUE,
    outcome p2p_qc_outcome_type NOT NULL DEFAULT 'passed_released_to_stock',
    passed_quantity INT NOT NULL DEFAULT 0,
    quarantined_quantity INT NOT NULL DEFAULT 0,
    rejected_quantity INT NOT NULL DEFAULT 0,
    qc_remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Stage 7: Supplier Invoices
CREATE TABLE IF NOT EXISTS public.p2p_supplier_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES public.p2p_purchase_orders(id),
    po_number VARCHAR(60) NOT NULL,
    grn_id UUID REFERENCES public.p2p_goods_received_notes(id),
    grn_number VARCHAR(60),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_vat_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    withholding_tax_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    freight_handling_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_invoiced_amount_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    invoice_document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Stage 8: 3-Way Matching Engine (PO vs GRN vs Invoice)
CREATE TABLE IF NOT EXISTS public.p2p_invoice_matching_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    match_reference VARCHAR(60) NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES public.p2p_supplier_invoices(id),
    purchase_order_id UUID NOT NULL REFERENCES public.p2p_purchase_orders(id),
    grn_id UUID NOT NULL REFERENCES public.p2p_goods_received_notes(id),
    po_authorized_amount_ugx NUMERIC(15, 2) NOT NULL,
    grn_accepted_value_ugx NUMERIC(15, 2) NOT NULL,
    invoice_billed_amount_ugx NUMERIC(15, 2) NOT NULL,
    price_variance_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    quantity_variance_units INT NOT NULL DEFAULT 0,
    net_variance_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    match_status p2p_match_status_type NOT NULL DEFAULT 'exact_match',
    variance_explanation TEXT,
    verified_by_name VARCHAR(150) NOT NULL,
    verified_by_role VARCHAR(100) NOT NULL,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Stage 9: Payments & Settlements
CREATE TABLE IF NOT EXISTS public.p2p_payment_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    voucher_number VARCHAR(60) NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES public.p2p_supplier_invoices(id),
    match_record_id UUID REFERENCES public.p2p_invoice_matching_records(id),
    supplier_name VARCHAR(200) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank Wire / EFT', -- 'Bank Wire / EFT', 'MTN MoMo Pay', 'Airtel Money', 'Cheque'
    bank_account_or_momo_ref VARCHAR(100) NOT NULL,
    gross_amount_ugx NUMERIC(15, 2) NOT NULL,
    wht_deducted_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_payable_ugx NUMERIC(15, 2) NOT NULL,
    payment_status p2p_payment_voucher_status NOT NULL DEFAULT 'pending_authorization',
    authorized_by_name VARCHAR(150),
    authorized_by_role VARCHAR(100),
    authorized_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    transaction_reference VARCHAR(150),
    settlement_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Comprehensive Indexes & Row Level Security (RLS)
CREATE INDEX IF NOT EXISTS idx_p2p_pr_tenant ON public.p2p_purchase_requisitions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_p2p_po_tenant ON public.p2p_purchase_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_p2p_grn_po ON public.p2p_goods_received_notes(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_p2p_qc_grn ON public.p2p_quality_inspections(grn_id);
CREATE INDEX IF NOT EXISTS idx_p2p_inv_po ON public.p2p_supplier_invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_p2p_match_inv ON public.p2p_invoice_matching_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_p2p_pay_inv ON public.p2p_payment_vouchers(invoice_id);

ALTER TABLE public.p2p_purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_goods_received_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_goods_received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_invoice_matching_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_payment_vouchers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_purchase_requisitions"
    ON public.p2p_purchase_requisitions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_purchase_orders"
    ON public.p2p_purchase_orders FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_goods_received_notes"
    ON public.p2p_goods_received_notes FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_quality_inspections"
    ON public.p2p_quality_inspections FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_supplier_invoices"
    ON public.p2p_supplier_invoices FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_invoice_matching_records"
    ON public.p2p_invoice_matching_records FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read p2p_payment_vouchers"
    ON public.p2p_payment_vouchers FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
