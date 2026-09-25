-- ============================================================================
-- Migration 033: Advanced Pharmacy Operational, Inventory Velocity,
-- and Clinical Pharmacovigilance Analytics Engine
-- ============================================================================

-- 1. Daily Operational & Executive Performance Table
CREATE TABLE IF NOT EXISTS public.pharmacy_operational_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Real-time Operational Indicators
    today_sales_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    today_dispensing_count INTEGER NOT NULL DEFAULT 0,
    gross_revenue_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cogs_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    gross_profit_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    gross_profit_margin_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    
    -- Queue & Backlog Counters
    low_stock_medicines_count INTEGER NOT NULL DEFAULT 0,
    near_expiry_medicines_count INTEGER NOT NULL DEFAULT 0,
    pending_prescriptions_count INTEGER NOT NULL DEFAULT 0,
    pending_orders_count INTEGER NOT NULL DEFAULT 0,
    pending_deliveries_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Inventory Movement & Velocity Classification Table
CREATE TABLE IF NOT EXISTS public.inventory_velocity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    drug_id VARCHAR(64) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category VARCHAR(128),
    
    -- Velocity & Movement Indicators
    velocity_category VARCHAR(32) NOT NULL CHECK (
        velocity_category IN ('fast_moving', 'slow_moving', 'dead_stock', 'overstock', 'normal')
    ),
    monthly_units_sold INTEGER NOT NULL DEFAULT 0,
    days_since_last_sale INTEGER NOT NULL DEFAULT 0,
    current_stock_units INTEGER NOT NULL DEFAULT 0,
    stock_value_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    -- Expiry & Turnover Risk
    is_expired BOOLEAN NOT NULL DEFAULT false,
    is_near_expiry BOOLEAN NOT NULL DEFAULT false,
    expired_stock_value_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    near_expiry_stock_value_ugx NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    stock_turnover_ratio NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    stockout_frequency_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- % of days out of stock
    
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Clinical Pharmacovigilance & Safety Analytics Table
CREATE TABLE IF NOT EXISTS public.clinical_safety_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Clinical Indicators
    total_prescriptions_processed INTEGER NOT NULL DEFAULT 0,
    rejections_count INTEGER NOT NULL DEFAULT 0,
    rejection_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- e.g. 4.2%
    pharmacist_interventions_count INTEGER NOT NULL DEFAULT 0,
    
    -- Safety Alert Triggers
    interaction_alerts_triggered INTEGER NOT NULL DEFAULT 0,
    allergy_alerts_prevented INTEGER NOT NULL DEFAULT 0,
    adr_reports_filed INTEGER NOT NULL DEFAULT 0,
    
    -- Controlled Substances
    controlled_dispensing_events INTEGER NOT NULL DEFAULT 0,
    controlled_units_dispensed INTEGER NOT NULL DEFAULT 0,
    controlled_audit_discrepancies INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.pharmacy_operational_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_velocity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_safety_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read/write for operational metrics" ON public.pharmacy_operational_metrics FOR ALL USING (true);
CREATE POLICY "Public read/write for velocity metrics" ON public.inventory_velocity_metrics FOR ALL USING (true);
CREATE POLICY "Public read/write for clinical metrics" ON public.clinical_safety_analytics FOR ALL USING (true);

-- Seed realistic demo data
INSERT INTO public.pharmacy_operational_metrics (
    tenant_id, metric_date, today_sales_ugx, today_dispensing_count,
    gross_revenue_ugx, cogs_ugx, gross_profit_ugx, gross_profit_margin_pct,
    low_stock_medicines_count, near_expiry_medicines_count,
    pending_prescriptions_count, pending_orders_count, pending_deliveries_count
) VALUES (
    'client-001', CURRENT_DATE, 4850000.00, 78,
    4850000.00, 3152500.00, 1697500.00, 35.00,
    6, 4, 3, 5, 2
);

INSERT INTO public.inventory_velocity_metrics (
    tenant_id, drug_id, brand_name, generic_name, category,
    velocity_category, monthly_units_sold, days_since_last_sale,
    current_stock_units, stock_value_ugx, is_expired, is_near_expiry,
    expired_stock_value_ugx, near_expiry_stock_value_ugx,
    stock_turnover_ratio, stockout_frequency_pct
) VALUES
('client-001', 'med-001', 'Augmentin 625mg', 'Amoxicillin / Clavulanate', 'Antibiotics', 'fast_moving', 240, 0, 45, 1575000, false, false, 0, 0, 8.4, 1.2),
('client-001', 'med-002', 'Paracetamol 500mg (100s)', 'Acetaminophen', 'Analgesics', 'fast_moving', 380, 0, 140, 700000, false, false, 0, 0, 12.1, 0.5),
('client-001', 'med-003', 'Ventolin Inhaler 100mcg', 'Salbutamol Sulfate', 'Respiratory', 'fast_moving', 160, 0, 14, 392000, false, false, 0, 0, 9.2, 3.8),
('client-001', 'med-004', 'Crestor 20mg', 'Rosuvastatin Calcium', 'Cardiovascular', 'slow_moving', 12, 18, 50, 2250000, false, true, 0, 1125000, 1.8, 0.0),
('client-001', 'med-005', 'Ketoconazole 200mg', 'Ketoconazole', 'Antifungals', 'slow_moving', 8, 25, 35, 700000, false, false, 0, 0, 1.2, 0.0),
('client-001', 'med-006', 'Dexamethasone 0.5mg (Old Pack)', 'Dexamethasone', 'Steroids', 'dead_stock', 0, 140, 85, 425000, false, true, 0, 425000, 0.1, 0.0),
('client-001', 'med-007', 'Ampicillin 500mg Vials (Batch 2023)', 'Ampicillin Sodium', 'Antibiotics', 'dead_stock', 0, 210, 30, 240000, true, false, 240000, 0, 0.0, 0.0),
('client-001', 'med-008', 'Ciprofloxacin 500mg', 'Ciprofloxacin HCl', 'Antibiotics', 'overstock', 25, 4, 320, 3840000, false, false, 0, 0, 2.1, 0.0);

INSERT INTO public.clinical_safety_analytics (
    tenant_id, period_start, period_end, total_prescriptions_processed,
    rejections_count, rejection_rate_pct, pharmacist_interventions_count,
    interaction_alerts_triggered, allergy_alerts_prevented, adr_reports_filed,
    controlled_dispensing_events, controlled_units_dispensed, controlled_audit_discrepancies
) VALUES (
    'client-001', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE,
    640, 24, 3.75, 42, 38, 14, 9, 28, 94, 0
);
