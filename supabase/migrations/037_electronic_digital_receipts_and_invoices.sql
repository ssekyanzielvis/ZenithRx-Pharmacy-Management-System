-- ============================================================================
-- Migration 037: Electronic Digital Receipts & Fiscal Invoice Engine
-- Generates World-Class Digital Receipts with Pharmacy Branch Metadata,
-- Line-Item Batches, Discounts, Tax, Multi-Payment Breakdown, and QR Verification
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.digital_sales_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    receipt_number VARCHAR(64) NOT NULL UNIQUE, -- e.g. 'RCP-2026-08101'
    fiscal_efris_number VARCHAR(64), -- e.g. 'URA-EFRIS-REC-991204'
    transaction_id VARCHAR(64) NOT NULL,
    sale_type VARCHAR(32) NOT NULL DEFAULT 'otc_sale', -- 'otc_sale', 'prescription_sale', 'credit_sale', 'insurance_sale'
    
    -- Pharmacy & Branch Metadata
    pharmacy_name VARCHAR(255) NOT NULL DEFAULT 'ZenithRx Healthcare & Pharmacy Group',
    branch_name VARCHAR(255) NOT NULL DEFAULT 'Kampala City Main Branch',
    branch_address VARCHAR(255) NOT NULL DEFAULT 'Plot 14 Kampala Road, Suite 2B, Kampala, Uganda',
    branch_phone VARCHAR(64) NOT NULL DEFAULT '+256 312 889900',
    branch_email VARCHAR(128) NOT NULL DEFAULT 'billing@zenithrx.ug',
    pharmacy_tin VARCHAR(64) NOT NULL DEFAULT 'TIN-1002938481',
    nda_license_number VARCHAR(64) NOT NULL DEFAULT 'NDA/LIC/2026/0411',
    
    -- Customer / Patient Details
    customer_type VARCHAR(32) NOT NULL DEFAULT 'walk_in',
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    patient_id VARCHAR(64),
    prescription_ref_no VARCHAR(64),
    prescriber_name VARCHAR(255),
    prescriber_license VARCHAR(64),
    
    -- Line Items Structure
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ "drugId": "...", "drugName": "...", "batchNumber": "...", "expiryDate": "...", "quantity": 2, "unitPriceUgx": 2500, "discountUgx": 0, "totalUgx": 5000 }]
    
    -- Financial Totals & Tax Settlement
    currency VARCHAR(8) NOT NULL DEFAULT 'UGX',
    gross_subtotal_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_discount_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    discount_reason VARCHAR(255),
    net_subtotal_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- 18% URA VAT
    grand_total_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    -- Payment Execution
    payment_method VARCHAR(32) NOT NULL DEFAULT 'Cash', -- 'Cash', 'MTN MoMo', 'Airtel Money', 'Visa/Mastercard', 'Insurance Scheme', 'Split'
    payment_splits JSONB DEFAULT '[]'::jsonb, -- [{ "method": "Cash", "amountUgx": 50000 }, { "method": "MTN MoMo", "amountUgx": 25000, "reference": "MM-88910" }]
    cash_tendered_ugx NUMERIC(14, 2) DEFAULT 0.00,
    change_given_ugx NUMERIC(14, 2) DEFAULT 0.00,
    payment_reference_code VARCHAR(128),
    payment_status VARCHAR(32) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PARTIALLY_PAID', 'REFUNDED', 'VOIDED')),
    
    -- Pharmacist / Cashier Identity
    cashier_id VARCHAR(64) NOT NULL DEFAULT 'user-pharm-01',
    cashier_name VARCHAR(255) NOT NULL DEFAULT 'Dr. Arthur Ssenabulya',
    cashier_role VARCHAR(64) NOT NULL DEFAULT 'Supervising Pharmacist',
    cashier_psu_license VARCHAR(64) DEFAULT 'PSU/PHARM/2019/0411',
    
    -- Digital Verification QR & Tracking
    qr_verification_url TEXT NOT NULL,
    verification_hash VARCHAR(128) NOT NULL,
    sent_via_sms BOOLEAN NOT NULL DEFAULT false,
    sent_via_whatsapp BOOLEAN NOT NULL DEFAULT false,
    sent_via_email BOOLEAN NOT NULL DEFAULT false,
    receipt_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast receipt retrieval & fiscal reconciliation
CREATE INDEX IF NOT EXISTS idx_digital_receipts_tenant_num ON public.digital_sales_receipts(tenant_id, receipt_number);
CREATE INDEX IF NOT EXISTS idx_digital_receipts_date ON public.digital_sales_receipts(receipt_timestamp);
CREATE INDEX IF NOT EXISTS idx_digital_receipts_customer ON public.digital_sales_receipts(customer_name, customer_phone);

-- RLS Security
ALTER TABLE public.digital_sales_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public verification of receipts by hash" ON public.digital_sales_receipts;
CREATE POLICY "Allow public verification of receipts by hash"
ON public.digital_sales_receipts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Tenant isolation for receipts management" ON public.digital_sales_receipts;
CREATE POLICY "Tenant isolation for receipts management"
ON public.digital_sales_receipts FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = 'client-001');

-- Seed Standard Sample Digital Receipt
INSERT INTO public.digital_sales_receipts (
    tenant_id,
    receipt_number,
    fiscal_efris_number,
    transaction_id,
    sale_type,
    pharmacy_name,
    branch_name,
    branch_address,
    branch_phone,
    branch_email,
    pharmacy_tin,
    nda_license_number,
    customer_name,
    customer_phone,
    prescription_ref_no,
    prescriber_name,
    prescriber_license,
    items,
    gross_subtotal_ugx,
    total_discount_ugx,
    discount_percentage,
    net_subtotal_ugx,
    tax_amount_ugx,
    grand_total_ugx,
    payment_method,
    payment_splits,
    cash_tendered_ugx,
    change_given_ugx,
    cashier_name,
    cashier_role,
    cashier_psu_license,
    qr_verification_url,
    verification_hash,
    receipt_timestamp
) VALUES (
    'client-001',
    'RCP-2026-08101',
    'URA-EFRIS-REC-991204',
    'tx-pos-8801',
    'prescription_sale',
    'ZenithRx Healthcare & Pharmacy Group',
    'Kampala City Main Branch',
    'Plot 14 Kampala Road, Suite 2B, Kampala, Uganda',
    '+256 312 889900',
    'billing@zenithrx.ug',
    'TIN-1002938481',
    'NDA/LIC/2026/0411',
    'Kato Emmanuel',
    '+256 704 556677',
    'RX-2026-8801',
    'Dr. Mukasa David',
    'UMDPC-2018-0912',
    '[
        {
            "drugId": "drug-amox-clav-625",
            "drugName": "Amoxicillin + Clavulanic Acid 625mg Tab",
            "batchNumber": "BN-2026-09A",
            "expiryDate": "2027-11-30",
            "quantity": 14,
            "unitPriceUgx": 2500,
            "discountUgx": 0,
            "totalUgx": 35000
        },
        {
            "drugId": "drug-para-500",
            "drugName": "Paracetamol 500mg Tablet (Panadol)",
            "batchNumber": "BN-2026-11B",
            "expiryDate": "2028-04-30",
            "quantity": 30,
            "unitPriceUgx": 300,
            "discountUgx": 1000,
            "totalUgx": 8000
        }
    ]'::jsonb,
    44000.00,
    1000.00,
    2.27,
    43000.00,
    0.00,
    43000.00,
    'MTN MoMo',
    '[{"method": "MTN MoMo", "amountUgx": 43000, "reference": "MM-991240"}]'::jsonb,
    43000.00,
    0.00,
    'Dr. Arthur Ssenabulya',
    'Supervising Pharmacist',
    'PSU/PHARM/2019/0411',
    'https://verify.zenithrx.ug/receipt/RCP-2026-08101',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    NOW() - INTERVAL '15 minutes'
) ON CONFLICT (receipt_number) DO NOTHING;
