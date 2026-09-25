-- ============================================================================
-- ZenithRx POS & Dispensing Transaction Engine Migration (§6.2, §11.18)
-- Customer Types (Walk-in, Registered Patient), Sale Types (OTC, Prescription),
-- Batch Tracking, Discounts, Tax Rules, Multi-Payment, Voids, Refunds & Inventory Integration
-- ============================================================================

-- 1. Custom Types
DO $$ BEGIN
    CREATE TYPE pos_sale_type AS ENUM (
        'otc_sale',
        'prescription_sale',
        'refill_sale',
        'emergency_sale'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pos_customer_type AS ENUM (
        'walk_in',
        'registered_patient',
        'corporate_account',
        'staff'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pos_payment_method AS ENUM (
        'cash',
        'mobile_money',
        'card',
        'credit',
        'insurance_scheme',
        'split'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pos_transaction_status AS ENUM (
        'completed',
        'voided',
        'refunded',
        'partially_refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Master Sales & Dispensing Transactions Table
CREATE TABLE IF NOT EXISTS public.pos_sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    receipt_no VARCHAR(60) NOT NULL UNIQUE,
    sale_type pos_sale_type NOT NULL DEFAULT 'otc_sale',
    customer_type pos_customer_type NOT NULL DEFAULT 'walk_in',
    patient_id VARCHAR(100),
    customer_name VARCHAR(150) NOT NULL DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(50),
    
    -- Prescription Linkage
    prescription_id VARCHAR(100),
    prescription_ref_no VARCHAR(60),
    prescriber_name VARCHAR(150),
    prescriber_licence_no VARCHAR(100),
    pharmacist_user_id VARCHAR(100),
    pharmacist_name VARCHAR(150) NOT NULL DEFAULT 'Dispensing Pharmacist',
    dispensing_notes TEXT,
    
    -- Financial Totals
    gross_subtotal_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    line_discounts_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    order_discount_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_reason VARCHAR(150),
    taxable_amount_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_vat_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_total_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    patient_paid_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    insurance_covered_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Payment Details
    payment_method pos_payment_method NOT NULL DEFAULT 'cash',
    payment_splits JSONB, -- For split payments e.g. [{"method": "cash", "amount": 20000}, {"method": "mobile_money", "amount": 30000}]
    cash_tendered_ugx NUMERIC(15, 2),
    cash_change_ugx NUMERIC(15, 2),
    momo_provider VARCHAR(50), -- 'MTN MoMo', 'Airtel Money'
    momo_phone VARCHAR(50),
    momo_reference VARCHAR(100),
    card_auth_code VARCHAR(100),
    credit_due_date DATE,
    credit_authorized_by VARCHAR(150),
    
    -- Status & Void/Refund Audit
    status pos_transaction_status NOT NULL DEFAULT 'completed',
    voided_at TIMESTAMPTZ,
    voided_by_name VARCHAR(150),
    void_reason TEXT,
    supervisor_override_code VARCHAR(100),
    refunded_amount_ugx NUMERIC(15, 2) DEFAULT 0.00,
    refund_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Itemized Sales & Dispensed Items Table (with Batch Tracking)
CREATE TABLE IF NOT EXISTS public.pos_sales_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.pos_sales_transactions(id) ON DELETE CASCADE,
    drug_id VARCHAR(100) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    brand_name VARCHAR(200) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL,
    is_prescription_only BOOLEAN NOT NULL DEFAULT FALSE,
    quantity INT NOT NULL DEFAULT 1,
    
    -- Batch Details
    batch_id VARCHAR(100),
    batch_number VARCHAR(100) NOT NULL,
    batch_expiry_date DATE NOT NULL,
    shelf_location VARCHAR(100),
    
    -- Pricing & Financials
    unit_cost_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_selling_price_ugx NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- 0% on Essential Rx, 18% on general
    tax_amount_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total_ugx NUMERIC(15, 2) NOT NULL,
    
    -- Clinical Dispensing Details
    dosage_instructions TEXT,
    days_supply INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Customer / Patient Credit Ledger Table
CREATE TABLE IF NOT EXISTS public.pos_patient_credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    patient_id VARCHAR(100) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    patient_phone VARCHAR(50),
    credit_limit_ugx NUMERIC(15, 2) NOT NULL DEFAULT 500000.00,
    current_outstanding_balance_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'overdue'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes and Row Level Security
CREATE INDEX IF NOT EXISTS idx_pos_tx_tenant ON public.pos_sales_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_tx_receipt ON public.pos_sales_transactions(receipt_no);
CREATE INDEX IF NOT EXISTS idx_pos_tx_patient ON public.pos_sales_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_pos_tx_status ON public.pos_sales_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pos_items_tx ON public.pos_sales_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_items_drug ON public.pos_sales_transaction_items(drug_id, batch_number);

ALTER TABLE public.pos_sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_patient_credit_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read pos_sales_transactions"
    ON public.pos_sales_transactions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read pos_sales_transaction_items"
    ON public.pos_sales_transaction_items FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read pos_patient_credit_accounts"
    ON public.pos_patient_credit_accounts FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
