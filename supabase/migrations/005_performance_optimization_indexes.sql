-- ============================================================
-- Migration: 005_performance_optimization_indexes.sql
-- Description: High-Performance Compound Indexes & Materialized Aggregations
-- Complies with technical.md §11.8 (Optimisation Techniques)
-- ============================================================

-- 1. Enable pg_trgm for ultra-fast fuzzy and substring drug searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. DRUGS & INVENTORY INDEXES
-- Fast barcode scan lookup (point queries at POS counter)
CREATE INDEX IF NOT EXISTS idx_drugs_tenant_barcode 
  ON drugs (tenant_id, barcode);

-- FEFO (First-Expired, First-Out) sorting index
CREATE INDEX IF NOT EXISTS idx_drugs_tenant_expiry_fefo 
  ON drugs (tenant_id, expiry_date ASC, stock_quantity DESC);

-- Drug category and stock level filtering
CREATE INDEX IF NOT EXISTS idx_drugs_tenant_category_stock 
  ON drugs (tenant_id, category, stock_quantity);

-- Trigram index for instantaneous multi-word generic and brand name search
CREATE INDEX IF NOT EXISTS idx_drugs_name_trgm 
  ON drugs USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_drugs_generic_trgm 
  ON drugs USING gin (generic_name gin_trgm_ops);

-- 3. PRESCRIPTION PROCESSING INDEXES
-- Active clinical dispensing queue index (status filter + recency)
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_status_created 
  ON prescriptions (tenant_id, status, created_at DESC);

-- Fast lookup by official prescription code / registration ID
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_rx_number 
  ON prescriptions (tenant_id, prescription_number);

-- Patient prescription history lookup
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_patient_id 
  ON prescriptions (tenant_id, customer_id, created_at DESC);

-- 4. POINT OF SALE & TRANSACTIONS INDEXES
-- Daily/Monthly ledger reporting and sales analytics filter
CREATE INDEX IF NOT EXISTS idx_pos_transactions_tenant_date 
  ON pos_transactions (tenant_id, transaction_date DESC, status);

-- Fast receipt ID / invoice number point lookup
CREATE INDEX IF NOT EXISTS idx_pos_transactions_tenant_receipt 
  ON pos_transactions (tenant_id, receipt_number);

-- Payment method breakdown filtering
CREATE INDEX IF NOT EXISTS idx_pos_transactions_tenant_payment_method 
  ON pos_transactions (tenant_id, payment_method, transaction_date DESC);

-- 5. FINANCIAL LEDGER & INTENTS INDEXES (§11.18)
CREATE INDEX IF NOT EXISTS idx_payment_intents_tenant_status 
  ON payment_intents (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_intents_idempotency 
  ON payment_intents (idempotency_key, tenant_id);

-- 6. AUDIT TRAIL & COMPLIANCE INDEXES (§11.20)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp 
  ON audit_logs (tenant_id, timestamp DESC, risk_level);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
  ON audit_logs (tenant_id, user_id, action, timestamp DESC);

-- 7. MATERIALIZED VIEWS FOR ZERO-LATENCY EXECUTIVE DASHBOARDS
-- Daily aggregated revenue, transactions, and discount totals per tenant
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_pharmacy_sales_summary AS
SELECT
  tenant_id,
  DATE_TRUNC('day', transaction_date) AS sales_day,
  COUNT(id) AS total_transactions,
  SUM(total_amount) AS gross_sales_ugx,
  SUM(discount_amount) AS total_discounts_ugx,
  SUM(net_amount) AS net_revenue_ugx,
  COUNT(CASE WHEN payment_method = 'Mobile Money' THEN 1 END) AS momo_transactions,
  COUNT(CASE WHEN payment_method = 'Cash' THEN 1 END) AS cash_transactions,
  COUNT(CASE WHEN payment_method = 'Insurance' THEN 1 END) AS insurance_transactions
FROM pos_transactions
WHERE status = 'Completed'
GROUP BY tenant_id, DATE_TRUNC('day', transaction_date)
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales_pk 
  ON mv_daily_pharmacy_sales_summary (tenant_id, sales_day);

-- Real-time stock health summary view (Low stock, expired count, total stock value)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_drug_stock_health_summary AS
SELECT
  tenant_id,
  COUNT(id) AS total_skus,
  SUM(stock_quantity) AS total_units_in_stock,
  SUM(stock_quantity * unit_price) AS total_inventory_valuation_ugx,
  COUNT(CASE WHEN stock_quantity <= min_stock_threshold THEN 1 END) AS low_stock_skus,
  COUNT(CASE WHEN expiry_date <= CURRENT_DATE THEN 1 END) AS expired_skus,
  COUNT(CASE WHEN expiry_date > CURRENT_DATE AND expiry_date <= (CURRENT_DATE + INTERVAL '60 days') THEN 1 END) AS near_expiry_skus
FROM drugs
GROUP BY tenant_id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stock_health_pk 
  ON mv_drug_stock_health_summary (tenant_id);

-- 8. CONCURRENT REFRESH FUNCTION FOR BACKGROUND WORKERS
CREATE OR REPLACE FUNCTION refresh_performance_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_pharmacy_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_drug_stock_health_summary;
END;
$$;
