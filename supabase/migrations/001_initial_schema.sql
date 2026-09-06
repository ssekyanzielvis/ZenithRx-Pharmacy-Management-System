-- ============================================================
-- ZenithRx PMS — Database Schema Migration 001
-- Initial Schema: All tables with constraints, indexes, and triggers
-- Database: Supabase PostgreSQL (pg 15+)
-- Run: Supabase Dashboard → SQL Editor OR supabase db push
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TENANTS (Pharmacy Branches / Client Subscriptions) ──────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  location              TEXT NOT NULL,
  contact_phone         TEXT NOT NULL,
  contact_email         TEXT NOT NULL,
  package_tier          TEXT NOT NULL CHECK (package_tier IN ('Starter', 'Professional', 'Enterprise', 'Custom Tailored')),
  max_users             INTEGER NOT NULL DEFAULT 2 CHECK (max_users > 0),
  monthly_ugx_rate      NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_status        TEXT NOT NULL DEFAULT 'active' CHECK (billing_status IN ('active', 'pending_renewal', 'grace_period', 'suspended')),
  next_billing_date     DATE,
  nda_license_no        TEXT,
  nda_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  supervising_pharmacist TEXT,
  allowed_features      JSONB NOT NULL DEFAULT '{
    "basic_inventory": true,
    "batch_tracking": false,
    "auto_reordering": false,
    "expiry_alerts": false,
    "pos_billing": true,
    "sales_analytics": false,
    "insurance_claims": false,
    "ai_counseling": false,
    "multi_location": false,
    "api_access": false
  }'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants (slug);
CREATE INDEX idx_tenants_billing_status ON tenants (billing_status);

-- ─── USERS (Staff Accounts — linked to auth.users) ───────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,  -- Must match auth.users.id
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  staff_reg_no  TEXT,
  rank_role     TEXT NOT NULL CHECK (rank_role IN (
    'Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician',
    'POS Cashier / Dispenser', 'Store & Inventory Manager',
    'Finance & Claims Officer', 'Intern Pharmacist'
  )),
  status        TEXT NOT NULL DEFAULT 'pending_invite' CHECK (status IN ('active', 'suspended', 'pending_invite')),
  access_rights JSONB NOT NULL DEFAULT '{
    "can_access_pos": false,
    "can_manage_inventory": false,
    "can_process_prescriptions": false,
    "can_approve_reorders": false,
    "can_view_reports": false,
    "can_submit_insurance": false,
    "can_use_ai_assistant": false,
    "can_manage_staff_accounts": false
  }'::jsonb,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users (tenant_id);
CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_rank_role ON users (rank_role);

-- ─── DRUGS (Product Master — per tenant) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS drugs (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_name           TEXT NOT NULL,
  generic_name         TEXT NOT NULL,
  barcode              TEXT NOT NULL,
  batch_number         TEXT NOT NULL,
  category             TEXT NOT NULL CHECK (category IN (
    'Antibiotics', 'Analgesics', 'Cardiovascular', 'Diabetes',
    'Respiratory', 'OTC & Supplements', 'Gastrointestinal', 'Dermatology'
  )),
  shelf_location       TEXT NOT NULL,
  cost_price           NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
  selling_price        NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
  stock_qty            INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reorder_level        INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  expiry_date          DATE NOT NULL,
  manufacturer         TEXT NOT NULL,
  prescription_required BOOLEAN NOT NULL DEFAULT FALSE,
  unit                 TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drugs_tenant_id    ON drugs (tenant_id);
CREATE INDEX idx_drugs_barcode      ON drugs (tenant_id, barcode);
CREATE INDEX idx_drugs_expiry_date  ON drugs (tenant_id, expiry_date);
CREATE INDEX idx_drugs_stock_qty    ON drugs (tenant_id, stock_qty);
CREATE INDEX idx_drugs_category     ON drugs (tenant_id, category);
CREATE UNIQUE INDEX idx_drugs_batch_per_tenant ON drugs (tenant_id, batch_number);

-- ─── STOCK MOVEMENTS (Immutable Audit Log) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_id         UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  movement_type   TEXT NOT NULL CHECK (movement_type IN ('sale', 'restock', 'adjustment', 'write_off', 'return')),
  quantity_change INTEGER NOT NULL,
  stock_before    INTEGER NOT NULL CHECK (stock_before >= 0),
  stock_after     INTEGER NOT NULL CHECK (stock_after >= 0),
  reference_id    TEXT,
  notes           TEXT,
  performed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_drug_id   ON stock_movements (drug_id);
CREATE INDEX idx_stock_movements_tenant_id ON stock_movements (tenant_id);
CREATE INDEX idx_stock_movements_created   ON stock_movements (tenant_id, created_at DESC);

-- ─── CUSTOMERS (Patient Profiles) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  email                 TEXT,
  age                   INTEGER CHECK (age > 0 AND age < 150),
  gender                TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_group           TEXT,
  allergies             TEXT[] NOT NULL DEFAULT '{}',
  chronic_conditions    TEXT[] NOT NULL DEFAULT '{}',
  loyalty_points        INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  total_purchases_ugx   NUMERIC(14,2) NOT NULL DEFAULT 0,
  last_visit            DATE,
  insurance_provider    TEXT,
  policy_number         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant_id ON customers (tenant_id);
CREATE INDEX idx_customers_phone     ON customers (tenant_id, phone);
CREATE INDEX idx_customers_name      ON customers (tenant_id, name);

-- ─── PRESCRIPTIONS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prescriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rx_number           TEXT NOT NULL,
  patient_name        TEXT NOT NULL,
  patient_age         INTEGER CHECK (patient_age > 0),
  patient_gender      TEXT CHECK (patient_gender IN ('male', 'female', 'other')),
  patient_phone       TEXT NOT NULL,
  doctor_name         TEXT NOT NULL,
  doctor_licence      TEXT NOT NULL,
  hospital_name       TEXT NOT NULL,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispensed', 'partially_dispensed', 'cancelled')),
  insurance_claim_id  TEXT,
  notes               TEXT,
  total_cost          NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_prescriptions_rx_number ON prescriptions (tenant_id, rx_number);
CREATE INDEX idx_prescriptions_tenant_status ON prescriptions (tenant_id, status);
CREATE INDEX idx_prescriptions_patient_name  ON prescriptions (tenant_id, patient_name);
CREATE INDEX idx_prescriptions_date          ON prescriptions (tenant_id, date DESC);

-- ─── PRESCRIPTION ITEMS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prescription_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_id         UUID REFERENCES drugs(id) ON DELETE SET NULL,
  drug_name       TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,
  duration        TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  dispensed_qty   INTEGER NOT NULL DEFAULT 0 CHECK (dispensed_qty >= 0),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispensed'))
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items (prescription_id);
CREATE INDEX idx_prescription_items_drug         ON prescription_items (drug_id);

-- ─── POS TRANSACTIONS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos_transactions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  receipt_no               TEXT NOT NULL,
  customer_name            TEXT NOT NULL DEFAULT 'Walk-In Customer',
  customer_phone           TEXT,
  subtotal                 NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount               NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  insurance_copay_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  insurance_covered_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_paid               NUMERIC(14,2) NOT NULL,
  payment_method           TEXT NOT NULL,
  mpesa_ref                TEXT,
  cashier_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  cashier_name             TEXT NOT NULL,
  timestamp                TEXT NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_pos_receipt_per_tenant ON pos_transactions (tenant_id, receipt_no);
CREATE INDEX idx_pos_tenant_created ON pos_transactions (tenant_id, created_at DESC);
CREATE INDEX idx_pos_payment_method ON pos_transactions (tenant_id, payment_method);

-- ─── POS TRANSACTION ITEMS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_id        UUID REFERENCES drugs(id) ON DELETE SET NULL,
  brand_name     TEXT NOT NULL,
  unit_price     NUMERIC(12,2) NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  total          NUMERIC(14,2) NOT NULL,
  is_prescription BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_pos_items_transaction ON pos_transaction_items (transaction_id);

-- ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS purchase_orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  po_number      TEXT NOT NULL,
  supplier_name  TEXT NOT NULL,
  supplier_email TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent_to_supplier', 'fulfilled', 'cancelled')),
  total_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_po_number_per_tenant ON purchase_orders (tenant_id, po_number);
CREATE INDEX idx_po_tenant_status ON purchase_orders (tenant_id, status);

-- ─── PURCHASE ORDER ITEMS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  drug_id           UUID REFERENCES drugs(id) ON DELETE SET NULL,
  brand_name        TEXT NOT NULL,
  current_stock     INTEGER NOT NULL DEFAULT 0,
  order_qty         INTEGER NOT NULL CHECK (order_qty > 0),
  unit_cost         NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_po_items_order ON purchase_order_items (purchase_order_id);

-- ─── INSURANCE PROVIDERS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurance_providers (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider_name          TEXT NOT NULL,
  code                   TEXT NOT NULL,
  contact_phone          TEXT NOT NULL,
  coverage_ratio         NUMERIC(4,3) NOT NULL DEFAULT 0.8 CHECK (coverage_ratio BETWEEN 0 AND 1),
  pending_claims_count   INTEGER NOT NULL DEFAULT 0,
  total_claimed_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insurance_tenant ON insurance_providers (tenant_id);

-- ─── FILES (Cloudflare R2 Metadata) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS files (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uploaded_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  original_name    TEXT NOT NULL,
  r2_key           TEXT NOT NULL UNIQUE,
  mime_type        TEXT NOT NULL,
  size_bytes       BIGINT NOT NULL CHECK (size_bytes > 0),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'archived', 'deleted')),
  checksum         TEXT,
  retention_class  TEXT NOT NULL DEFAULT 'general' CHECK (retention_class IN ('clinical', 'financial', 'export', 'general')),
  reference_type   TEXT,
  reference_id     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ
);

CREATE INDEX idx_files_tenant_id      ON files (tenant_id);
CREATE INDEX idx_files_r2_key         ON files (r2_key);
CREATE INDEX idx_files_reference      ON files (reference_type, reference_id);
CREATE INDEX idx_files_status         ON files (tenant_id, status);

-- ─── EXPORT JOBS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS export_jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  scope         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  record_count  INTEGER,
  file_id       UUID REFERENCES files(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_export_jobs_tenant   ON export_jobs (tenant_id, created_at DESC);
CREATE INDEX idx_export_jobs_status   ON export_jobs (status);

-- ─── AUDIT LOGS (Append-Only) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  performed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  action         TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'dispense', 'stock_adjust', 'export', 'override')),
  entity_type    TEXT NOT NULL,
  entity_id      TEXT,
  old_value      JSONB,
  new_value      JSONB,
  ip_address     INET,
  user_agent     TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_created ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity         ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_performed_by   ON audit_logs (performed_by);

-- ─── AUTO-UPDATE updated_at TRIGGERS ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_drugs_updated_at
  BEFORE UPDATE ON drugs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
