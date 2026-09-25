-- ============================================================================
-- ZenithRx Enterprise Financial & Accounting Controls Migration (§6.3, §11.20)
-- Cash Drawer Sessions, Multi-Channel Reconciliations, Operating Expenses (OpEx),
-- Cost of Goods Sold (COGS), Gross/Net Profitability & Financial Auditing
-- ============================================================================

-- 1. Custom Types
DO $$ BEGIN
    CREATE TYPE cash_session_status AS ENUM (
        'open',
        'closed_pending_audit',
        'balanced_and_reconciled',
        'flagged_cash_variance'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opex_category_type AS ENUM (
        'utilities_electricity_water_internet',
        'rent_and_facility_lease',
        'salaries_wages_and_locum',
        'logistics_courier_and_transport',
        'generator_fuel_and_maintenance',
        'dispensary_packaging_and_supplies',
        'licensing_nda_and_regulatory_fees',
        'audit_legal_and_professional',
        'marketing_and_patient_education',
        'miscellaneous_petty_expenses'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opex_payment_status AS ENUM (
        'draft',
        'pending_approval',
        'approved_for_payment',
        'paid_and_settled',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Daily Cash Drawer Management & Till Sessions Table
CREATE TABLE IF NOT EXISTS public.financial_cash_drawer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    session_number VARCHAR(60) NOT NULL UNIQUE,
    till_identifier VARCHAR(50) NOT NULL DEFAULT 'Main POS Till #1',
    cashier_user_id VARCHAR(100),
    cashier_name VARCHAR(150) NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    -- Cash Float & Running Totals
    opening_cash_float_ugx NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
    cash_sales_in_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cash_refunds_out_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cash_expenses_out_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cash_withdrawals_bank_drops_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Calculated Expected vs Actual Count
    expected_closing_cash_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    actual_counted_cash_ugx NUMERIC(15, 2),
    cash_variance_ugx NUMERIC(15, 2) DEFAULT 0.00, -- (actual - expected)
    variance_explanation TEXT,
    
    -- Status & Audit Sign-off
    status cash_session_status NOT NULL DEFAULT 'open',
    audited_by_name VARCHAR(150),
    audited_by_role VARCHAR(100),
    audited_at TIMESTAMPTZ,
    supervisor_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Petty Cash Vouchers & Cash Movements Table
CREATE TABLE IF NOT EXISTS public.financial_petty_cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.financial_cash_drawer_sessions(id) ON DELETE CASCADE,
    tenant_id VARCHAR(100) NOT NULL,
    voucher_number VARCHAR(60) NOT NULL UNIQUE,
    movement_type VARCHAR(50) NOT NULL, -- 'cash_expense_payout', 'bank_deposit_drop', 'float_replenishment'
    category VARCHAR(100) NOT NULL,
    amount_ugx NUMERIC(15, 2) NOT NULL,
    payee_or_recipient VARCHAR(150) NOT NULL,
    justification TEXT NOT NULL,
    receipt_doc_reference VARCHAR(100),
    authorized_by_name VARCHAR(150) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Operating Expenses (OpEx) Master Table
CREATE TABLE IF NOT EXISTS public.financial_operating_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    expense_voucher_no VARCHAR(60) NOT NULL UNIQUE,
    category opex_category_type NOT NULL,
    expense_title VARCHAR(200) NOT NULL,
    vendor_or_payee VARCHAR(200) NOT NULL,
    invoice_or_bill_ref VARCHAR(100),
    gross_amount_ugx NUMERIC(15, 2) NOT NULL,
    tax_withheld_wht_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_payable_ugx NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank Wire / EFT',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status opex_payment_status NOT NULL DEFAULT 'pending_approval',
    
    -- Approvals & Accounting Audit
    approved_by_name VARCHAR(150),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_transaction_ref VARCHAR(150),
    accounting_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Daily Multi-Channel Reconciliation Table (System vs Gateway vs Cash vs Receivables)
CREATE TABLE IF NOT EXISTS public.financial_daily_channel_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    reconciliation_date DATE NOT NULL,
    
    -- Breakdown by Channel
    system_recorded_gross_sales_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    gateway_momo_settled_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    gateway_card_settled_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cash_drawer_counted_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    patient_credit_receivables_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    insurance_claims_receivables_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Variance & Status
    total_reconciled_inflow_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_reconciliation_variance_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    reconciliation_status VARCHAR(50) NOT NULL DEFAULT 'balanced', -- 'balanced', 'minor_rounding_variance', 'investigation_required'
    variance_narrative TEXT,
    
    reconciled_by_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Comprehensive Profitability & P&L Snapshots Table
CREATE TABLE IF NOT EXISTS public.financial_profitability_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    period_label VARCHAR(100) NOT NULL, -- e.g. 'March 2026', 'Q1 2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Revenue & Sales
    gross_revenue_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discounts_granted_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_revenue_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Direct Costs & Gross Profit
    cost_of_goods_sold_cogs_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    gross_profit_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    gross_profit_margin_percent NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    
    -- Operating Expenses & Net Result
    total_operating_expenses_opex_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_operating_profit_ebitda_ugx NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_profit_margin_percent NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes & Row Level Security
CREATE INDEX IF NOT EXISTS idx_fin_cash_session ON public.financial_cash_drawer_sessions(tenant_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_fin_opex ON public.financial_operating_expenses(tenant_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_recon ON public.financial_daily_channel_reconciliations(tenant_id, reconciliation_date DESC);

ALTER TABLE public.financial_cash_drawer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_petty_cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_operating_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_daily_channel_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profitability_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read financial_cash_drawer_sessions"
    ON public.financial_cash_drawer_sessions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read financial_petty_cash_movements"
    ON public.financial_petty_cash_movements FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read financial_operating_expenses"
    ON public.financial_operating_expenses FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read financial_daily_channel_reconciliations"
    ON public.financial_daily_channel_reconciliations FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated read financial_profitability_snapshots"
    ON public.financial_profitability_snapshots FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
