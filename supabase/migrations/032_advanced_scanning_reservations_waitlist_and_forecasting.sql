-- ============================================================================
-- Migration 032: Advanced Barcode/QR Scanning, Cross-Pharmacy Discovery,
-- Reservations, Back-in-Stock Waitlists, and Low-Stock Forecasting Engine
-- ============================================================================

-- 1. Medication Reservations Table (Holds medication for 24h-48h)
CREATE TABLE IF NOT EXISTS public.stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_name VARCHAR(255) NOT NULL DEFAULT 'Zenith Central Kampala',
    patient_id VARCHAR(64) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(64) NOT NULL,
    drug_id VARCHAR(64) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    quantity_reserved INTEGER NOT NULL DEFAULT 1 CHECK (quantity_reserved > 0),
    unit_price_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reservation_pin VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'collected', 'cancelled', 'expired')),
    hold_hours INTEGER NOT NULL DEFAULT 24,
    hold_expires_at TIMESTAMPTZ NOT NULL,
    collected_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Back-in-Stock Waitlist Table
CREATE TABLE IF NOT EXISTS public.stock_waitlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_name VARCHAR(255) NOT NULL DEFAULT 'Zenith Central Kampala',
    patient_id VARCHAR(64) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(64) NOT NULL,
    drug_id VARCHAR(64) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    requested_quantity INTEGER NOT NULL DEFAULT 1,
    preferred_channel VARCHAR(32) NOT NULL DEFAULT 'sms' CHECK (preferred_channel IN ('sms', 'whatsapp', 'in_app')),
    status VARCHAR(32) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'fulfilled', 'cancelled')),
    notified_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Low-Stock & Velocity Forecasting Table (ADU, Days Remaining & Reorder)
CREATE TABLE IF NOT EXISTS public.stock_velocity_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    drug_id VARCHAR(64) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    sku_barcode VARCHAR(64),
    current_stock INTEGER NOT NULL DEFAULT 0,
    average_daily_usage NUMERIC(8, 2) NOT NULL DEFAULT 0.00, -- e.g. 4.0 units/day
    estimated_days_remaining NUMERIC(8, 2) NOT NULL DEFAULT 0.00, -- e.g. 10 / 4 = 2.5 days
    lead_time_days INTEGER NOT NULL DEFAULT 3,
    reorder_point_threshold INTEGER NOT NULL DEFAULT 15,
    recommended_reorder_qty INTEGER NOT NULL DEFAULT 50,
    forecast_risk_level VARCHAR(32) NOT NULL DEFAULT 'healthy_coverage' CHECK (
        forecast_risk_level IN ('critical_imminent_stockout', 'urgent_reorder', 'healthy_coverage', 'overstocked')
    ),
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Barcode / QR Scan Audit Logs
CREATE TABLE IF NOT EXISTS public.scanned_barcode_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    scan_mode VARCHAR(64) NOT NULL CHECK (scan_mode IN ('medicine_barcode', 'batch_qr', 'product_verification', 'prescription_reference')),
    raw_payload TEXT NOT NULL,
    parsed_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    scanned_by VARCHAR(255) NOT NULL DEFAULT 'Pharmacist',
    verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_stock_res_patient ON public.stock_reservations(patient_phone, status);
CREATE INDEX IF NOT EXISTS idx_stock_res_status ON public.stock_reservations(status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_wait_drug ON public.stock_waitlists(pharmacy_id, drug_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_forecast_risk ON public.stock_velocity_forecasts(tenant_id, forecast_risk_level);

-- Row Level Security
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_velocity_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanned_barcode_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for reservations" ON public.stock_reservations FOR ALL USING (true);
CREATE POLICY "Allow public read/write for waitlists" ON public.stock_waitlists FOR ALL USING (true);
CREATE POLICY "Allow public read/write for forecasts" ON public.stock_velocity_forecasts FOR ALL USING (true);
CREATE POLICY "Allow public read/write for scan events" ON public.scanned_barcode_events FOR ALL USING (true);

-- Seed realistic demo data
INSERT INTO public.stock_reservations (
    id, tenant_id, pharmacy_id, pharmacy_name, patient_id, patient_name, patient_phone,
    drug_id, brand_name, generic_name, quantity_reserved, unit_price_ugx, total_amount_ugx,
    reservation_pin, status, hold_hours, hold_expires_at, notes
) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'client-001',
    'client-001',
    'Zenith Central Kampala',
    'pat-001',
    'Harriet Nakato',
    '+256 701 234 567',
    'med-001',
    'Augmentin 625mg',
    'Amoxicillin / Clavulanate Potassium',
    2,
    35000,
    70000,
    'RES-8821',
    'active',
    24,
    NOW() + INTERVAL '18 hours',
    'Patient requested hold after clinical consultation. Will pick up after work.'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'client-001',
    'client-001',
    'Zenith Central Kampala',
    'pat-002',
    'Moses Kigozi',
    '+256 772 987 654',
    'med-002',
    'Ventolin Evohaler 100mcg',
    'Salbutamol Sulfate',
    1,
    22000,
    22000,
    'RES-8822',
    'collected',
    24,
    NOW() - INTERVAL '4 hours',
    'Collected and verified with PIN RES-8822.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stock_waitlists (
    id, tenant_id, pharmacy_id, pharmacy_name, patient_id, patient_name, patient_phone,
    drug_id, brand_name, generic_name, requested_quantity, preferred_channel, status
) VALUES
(
    'f0000000-0000-0000-0000-000000000001',
    'client-001',
    'pharm-003',
    'Zenith Entebbe Airport Rd',
    'pat-001',
    'Harriet Nakato',
    '+256 701 234 567',
    'med-003',
    'Lantus Solostar 100 IU/ml',
    'Insulin Glargine',
    2,
    'sms',
    'waiting'
),
(
    'f0000000-0000-0000-0000-000000000002',
    'client-001',
    'pharm-002',
    'Zenith Acacia Mall Branch',
    'pat-003',
    'Grace Akello',
    '+256 752 443 211',
    'med-004',
    'Crestor 20mg',
    'Rosuvastatin Calcium',
    1,
    'whatsapp',
    'waiting'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stock_velocity_forecasts (
    id, tenant_id, pharmacy_id, drug_id, brand_name, generic_name, sku_barcode,
    current_stock, average_daily_usage, estimated_days_remaining, lead_time_days,
    reorder_point_threshold, recommended_reorder_qty, forecast_risk_level
) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'client-001',
    'client-001',
    'med-001',
    'Amoxicillin 500mg Capsules',
    'Amoxicillin Trihydrate',
    '6164000123456',
    10,
    4.00,
    2.50,
    3,
    20,
    60,
    'urgent_reorder'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'client-001',
    'client-001',
    'med-002',
    'Metformin 500mg Tablets',
    'Metformin Hydrochloride',
    '6164000789012',
    18,
    6.00,
    3.00,
    2,
    25,
    100,
    'urgent_reorder'
),
(
    'd0000000-0000-0000-0000-000000000003',
    'client-001',
    'client-001',
    'med-003',
    'Ventolin Inhaler 100mcg',
    'Salbutamol Sulfate',
    '6164000456789',
    4,
    2.50,
    1.60,
    3,
    10,
    30,
    'critical_imminent_stockout'
),
(
    'd0000000-0000-0000-0000-000000000004',
    'client-001',
    'client-001',
    'med-004',
    'Paracetamol 500mg (100s)',
    'Acetaminophen',
    '6164000345678',
    140,
    5.00,
    28.00,
    2,
    30,
    150,
    'healthy_coverage'
)
ON CONFLICT (id) DO NOTHING;
