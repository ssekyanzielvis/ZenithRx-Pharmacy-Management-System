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


-- ============================================================
-- ZenithRx PMS — Database Migration 002
-- Row-Level Security (RLS) Policies — Tenant Isolation
-- ============================================================
-- Every business table enforces: tenant_id = (current user's tenant)
-- The tenant_id is stored in the user's JWT custom claim.
-- ============================================================

-- ─── Enable RLS on all tables ────────────────────────────────────────────────

ALTER TABLE tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE files               ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- ─── Helper: Get current user's tenant_id from JWT ───────────────────────────

CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    NULL
  );
$$;

-- ─── Helper: Check if current user is a super admin ──────────────────────────

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'is_super_admin')::boolean,
    FALSE
  );
$$;

-- ─── TENANTS policies ────────────────────────────────────────────────────────

-- Users can only see their own tenant
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (
    id = get_tenant_id() OR is_super_admin()
  );

-- Only super admin can create/modify tenants
CREATE POLICY "tenants_insert_superadmin" ON tenants
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "tenants_update_superadmin" ON tenants
  FOR UPDATE USING (is_super_admin());

-- ─── USERS policies ──────────────────────────────────────────────────────────

CREATE POLICY "users_select_own_tenant" ON users
  FOR SELECT USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

CREATE POLICY "users_insert_own_tenant" ON users
  FOR INSERT WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

CREATE POLICY "users_update_own_tenant" ON users
  FOR UPDATE USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

CREATE POLICY "users_delete_own_tenant" ON users
  FOR DELETE USING (
    tenant_id = get_tenant_id() AND is_super_admin()
  );

-- ─── DRUGS policies ──────────────────────────────────────────────────────────

CREATE POLICY "drugs_tenant_isolation" ON drugs
  FOR ALL USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  ) WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

-- ─── STOCK MOVEMENTS — append-only per tenant ────────────────────────────────

CREATE POLICY "stock_movements_select" ON stock_movements
  FOR SELECT USING (tenant_id = get_tenant_id() OR is_super_admin());

CREATE POLICY "stock_movements_insert" ON stock_movements
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id() OR is_super_admin());

-- No UPDATE or DELETE on stock_movements (immutable audit log)

-- ─── CUSTOMERS policies ───────────────────────────────────────────────────────

CREATE POLICY "customers_tenant_isolation" ON customers
  FOR ALL USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  ) WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

-- ─── PRESCRIPTIONS policies ───────────────────────────────────────────────────

CREATE POLICY "prescriptions_tenant_isolation" ON prescriptions
  FOR ALL USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  ) WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

-- ─── PRESCRIPTION ITEMS policies ─────────────────────────────────────────────

CREATE POLICY "prescription_items_tenant_isolation" ON prescription_items
  FOR ALL USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  ) WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

-- ─── POS TRANSACTIONS — insert+select only ────────────────────────────────────

CREATE POLICY "pos_transactions_select" ON pos_transactions
  FOR SELECT USING (tenant_id = get_tenant_id() OR is_super_admin());

CREATE POLICY "pos_transactions_insert" ON pos_transactions
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id() OR is_super_admin());

-- POS transactions are financial records — no update/delete

-- ─── POS TRANSACTION ITEMS ───────────────────────────────────────────────────

CREATE POLICY "pos_transaction_items_select" ON pos_transaction_items
  FOR SELECT USING (tenant_id = get_tenant_id() OR is_super_admin());

CREATE POLICY "pos_transaction_items_insert" ON pos_transaction_items
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id() OR is_super_admin());

-- ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────

CREATE POLICY "purchase_orders_tenant_isolation" ON purchase_orders
  FOR ALL USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  ) WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

-- ─── PURCHASE ORDER ITEMS ────────────────────────────────────────────────────

CREATE POLICY "purchase_order_items_select" ON purchase_order_items
  FOR SELECT USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE tenant_id = get_tenant_id()
    ) OR is_super_admin()
  );

CREATE POLICY "purchase_order_items_insert" ON purchase_order_items
  FOR INSERT WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE tenant_id = get_tenant_id()
    ) OR is_super_admin()
  );

-- ─── INSURANCE PROVIDERS ─────────────────────────────────────────────────────

CREATE POLICY "insurance_tenant_isolation" ON insurance_providers
  FOR ALL USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  ) WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

-- ─── FILES ───────────────────────────────────────────────────────────────────

CREATE POLICY "files_tenant_isolation" ON files
  FOR ALL USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  ) WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

-- ─── EXPORT JOBS ─────────────────────────────────────────────────────────────

CREATE POLICY "export_jobs_tenant_isolation" ON export_jobs
  FOR ALL USING (
    tenant_id = get_tenant_id() OR is_super_admin()
  ) WITH CHECK (
    tenant_id = get_tenant_id() OR is_super_admin()
  );

-- ─── AUDIT LOGS — append-only ────────────────────────────────────────────────

CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (tenant_id = get_tenant_id() OR is_super_admin());

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id() OR is_super_admin());

-- No UPDATE or DELETE on audit_logs (immutable compliance record)

-- ─── FUNCTION: Set tenant_id claim on login (called via Supabase Edge Function) ──

-- Add this claim to the JWT when the user authenticates.
-- See: supabase/functions/set-tenant-claim/index.ts
-- The function reads the user's tenant from the users table and sets it.

COMMENT ON FUNCTION get_tenant_id() IS
  'Returns the tenant_id from the authenticated user''s JWT. '
  'This is set by the set-tenant-claim Edge Function on login.';


-- ============================================================
-- ZenithRx PMS — Database Migration 003
-- Seed Data: Uganda NDA Registered Pharmacies + Demo Tenant
-- Run AFTER 001 and 002 migrations
-- ============================================================

-- ─── DEMO TENANT (for development/testing) ───────────────────────────────────

INSERT INTO tenants (
  id, name, slug, location, contact_phone, contact_email,
  package_tier, max_users, monthly_ugx_rate, billing_status,
  next_billing_date, nda_license_no, nda_verified, supervising_pharmacist,
  allowed_features
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ZenithRx Demo Pharmacy',
  'zenithrx-demo',
  'Kampala, Plot 14 Nakasero Road, Uganda',
  '+256700000001',
  'demo@zenithrx.ug',
  'Professional',
  10,
  2500000,
  'active',
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'NDA/RPH/2024/10891',
  TRUE,
  'Dr. Jane Nakato, B.Pharm, MPC/P/2024/1234',
  '{
    "basic_inventory": true,
    "batch_tracking": true,
    "auto_reordering": true,
    "expiry_alerts": true,
    "pos_billing": true,
    "sales_analytics": true,
    "insurance_claims": true,
    "ai_counseling": true,
    "multi_location": false,
    "api_access": false
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ─── SAMPLE INSURANCE PROVIDERS (per demo tenant) ────────────────────────────

INSERT INTO insurance_providers (
  tenant_id, provider_name, code, contact_phone, coverage_ratio,
  pending_claims_count, total_claimed_amount, status
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'IAA Healthcare Uganda',
    'IAA-UG',
    '+256312300400',
    0.80,
    12,
    14500000,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'UAP Old Mutual Health',
    'UAP-OM',
    '+256312300800',
    0.80,
    8,
    9200000,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'National Health Insurance Scheme (NHIS)',
    'NHIS-UG',
    '+256414231796',
    0.80,
    23,
    38000000,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'APA Insurance Uganda',
    'APA-UG',
    '+256312222600',
    0.75,
    5,
    4800000,
    'active'
  )
ON CONFLICT DO NOTHING;

-- ─── NDA-REGISTERED PHARMACIES REFERENCE TABLE ───────────────────────────────
-- This is a reference lookup for the AdminPackages NDA verification feature.
-- Not tenant-scoped — global reference data.

CREATE TABLE IF NOT EXISTS nda_registered_pharmacies (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_no        TEXT NOT NULL UNIQUE,
  pharmacy_name     TEXT NOT NULL,
  location          TEXT NOT NULL,
  district          TEXT NOT NULL,
  owner_name        TEXT NOT NULL,
  contact_phone     TEXT NOT NULL,
  license_expiry    DATE NOT NULL,
  license_category  TEXT NOT NULL DEFAULT 'Community Pharmacy',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS on reference table (read-only for all authenticated users)
ALTER TABLE nda_registered_pharmacies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nda_pharmacies_read_all_authenticated" ON nda_registered_pharmacies
  FOR SELECT TO authenticated USING (TRUE);

-- Uganda NDA Pharmacy Registry — representative records
INSERT INTO nda_registered_pharmacies (license_no, pharmacy_name, location, district, owner_name, contact_phone, license_expiry) VALUES
  ('NDA/RPH/2024/10891', 'ZenithRx Pharmacy', 'Plot 14 Nakasero Road, Kampala', 'Kampala', 'John Ssekamatte Pharm.D', '+256700123456', '2026-12-31'),
  ('NDA/RPH/2024/10892', 'Mulago National Hospital Pharmacy', 'Mulago Hill, Kampala', 'Kampala', 'Grace Nakato B.Pharm', '+256414532100', '2026-12-31'),
  ('NDA/RPH/2024/10893', 'Nakasero Hospital Pharmacy', 'Plot 1 Makindye Road', 'Kampala', 'Dr. Peter Ouma Pharm.D', '+256312101000', '2026-12-31'),
  ('NDA/RPH/2024/10894', 'HealthPoint Pharmacy Garden City', 'Garden City Mall, Yusuf Lule Road', 'Kampala', 'Sarah Mugisha B.Pharm', '+256700234567', '2026-12-31'),
  ('NDA/RPH/2024/10895', 'CarePoint Pharmacy Ntinda', 'Ntinda Complex, Ntinda', 'Kampala', 'James Mukasa B.Pharm', '+256782345678', '2026-12-31'),
  ('NDA/RPH/2024/10896', 'Kampala International Hospital Pharmacy', 'Namuwongo Road, Kampala', 'Kampala', 'Dr. Amelia Namirembe', '+256312200400', '2026-12-31'),
  ('NDA/RPH/2024/10897', 'Mbarara University Teaching Hospital Pharmacy', 'Mbarara University Road', 'Mbarara', 'Dr. Robert Asiimwe', '+256485420145', '2026-12-31'),
  ('NDA/RPH/2024/10898', 'Gulu Regional Referral Hospital Pharmacy', 'Gulu-Atiak Road, Gulu', 'Gulu', 'Agnes Oyella B.Pharm', '+256471432100', '2026-12-31'),
  ('NDA/RPH/2024/10899', 'Jinja Regional Referral Hospital Pharmacy', 'Mainstreet, Jinja', 'Jinja', 'Michael Waiswa B.Pharm', '+256434120400', '2026-12-31'),
  ('NDA/RPH/2024/10900', 'Entebbe Grade B Hospital Pharmacy', 'Lugard Avenue, Entebbe', 'Wakiso', 'Patricia Nabukenya', '+256414320100', '2026-12-31'),
  ('NDA/RPH/2024/10901', 'Medipal International Hospital Pharmacy', 'Plot 14 Clement Hill Road', 'Kampala', 'Emmanuel Ssempa Pharm.D', '+256312240000', '2026-12-31'),
  ('NDA/RPH/2024/10902', 'Norvik Hospital Pharmacy', 'Plot 3 Acacia Avenue, Kampala', 'Kampala', 'Vivian Nalubowa B.Pharm', '+256414501000', '2026-12-31'),
  ('NDA/RPH/2024/10903', 'AAR Health Services Pharmacy', 'Nakivubo Place, Kampala', 'Kampala', 'Denis Mukwaya Pharm.D', '+256312233700', '2026-12-31'),
  ('NDA/RPH/2024/10904', 'Quality Chemical Industries Pharmacy', 'Luzira Industrial Area', 'Kampala', 'Dr. Charles Ayume', '+256414220900', '2026-12-31'),
  ('NDA/RPH/2024/10905', 'Rubaga Hospital Pharmacy', 'Rubaga Road, Kampala', 'Kampala', 'Rita Kizito B.Pharm', '+256312200600', '2026-12-31')
ON CONFLICT (license_no) DO NOTHING;


-- ==============================================================================
-- ZenithRx PMS — Database Schema Migration 004
-- Normalised Enterprise Schema & Export Permissions Model (technical.md §11.22.2)
-- Database: Supabase PostgreSQL (pg 15+)
-- ==============================================================================

-- ─── TENANT AND IDENTITY TABLES (§11.22.2) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_branches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_name    TEXT NOT NULL,
  branch_code    TEXT NOT NULL,
  district       TEXT NOT NULL,
  location_addr  TEXT NOT NULL,
  phone          TEXT NOT NULL,
  is_main_branch BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id          TEXT PRIMARY KEY, -- 'super_admin', 'admin_collaborator', 'tenant_admin', 'supervisor_pharmacist', 'inventory_manager', 'cashier_dispenser', 'finance_officer', 'nda_auditor'
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  is_system   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id          TEXT PRIMARY KEY, -- e.g. 'EXPORT_TENANT_DATA', 'EXPORT_ALL_CLIENT_DATA', 'EXPORT_AUDIT_LOGS', 'EXPORT_PATIENT_DATA'
  category    TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS collaborator_grants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id     TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  scope       TEXT NOT NULL, -- 'Own tenant', 'All tenants', 'Assigned branch'
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
  expires_at  TIMESTAMPTZ, -- Time-bound access rule (§11.22.3)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  ip_address   INET,
  user_agent   TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mfa_factors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('totp', 'sms', 'email')),
  secret_hash TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CLINICAL AND OPERATIONAL TABLES (§11.22.2) ──────────────────────────────

-- Patient allergies normalised
CREATE TABLE IF NOT EXISTS patient_allergies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  allergen     TEXT NOT NULL,
  severity     TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'anaphylactic')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Separate batch-aware stock from drug master table (§11.22.2 rule)
CREATE TABLE IF NOT EXISTS drug_batches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_id        UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  batch_number   TEXT NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity >= 0),
  cost_price     NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
  selling_price  NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
  manufacturing_date DATE,
  expiry_date    DATE NOT NULL,
  quarantine_status TEXT NOT NULL DEFAULT 'none' CHECK (quarantine_status IN ('none', 'quarantined', 'destroyed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expiry_alerts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_id        UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  batch_id       UUID REFERENCES drug_batches(id) ON DELETE SET NULL,
  days_to_expiry INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discounted', 'quarantined', 'cleared')),
  discount_pct   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  nda_licence_no TEXT,
  phone          TEXT NOT NULL,
  email          TEXT NOT NULL,
  address        TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES pos_transactions(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mtn_momo', 'airtel_money', 'card', 'insurance', 'whatsapp_invoice')),
  amount_ugx     NUMERIC(14,2) NOT NULL CHECK (amount_ugx > 0),
  reference_no   TEXT,
  cashier_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('settled', 'refunded', 'void')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  claim_number        TEXT NOT NULL,
  provider_id         UUID NOT NULL REFERENCES insurance_providers(id) ON DELETE RESTRICT,
  patient_id          UUID REFERENCES customers(id) ON DELETE SET NULL,
  prescription_id     UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
  policy_number       TEXT NOT NULL,
  member_name         TEXT NOT NULL,
  total_claim_ugx     NUMERIC(14,2) NOT NULL,
  copay_ugx           NUMERIC(14,2) NOT NULL,
  insurer_portion_ugx NUMERIC(14,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'pre_authorized', 'paid', 'rejected')),
  rejection_reason    TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS claim_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id    UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_name   TEXT NOT NULL,
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(14,2) NOT NULL
);

-- ─── DOCUMENT AND EXPORT TABLES (§11.22.2) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS file_versions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id     UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version_no  INTEGER NOT NULL CHECK (version_no > 0),
  r2_key      TEXT NOT NULL,
  size_bytes  BIGINT NOT NULL,
  checksum    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS export_job_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  export_job_id UUID NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
  table_name    TEXT NOT NULL,
  row_count     INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('expiry_warning', 'low_stock', 'claim_rejected', 'audit_alert', 'system_event')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SEED EXPORT PERMISSIONS MODEL (§11.22.2) ─────────────────────────────────

INSERT INTO permissions (id, category, description) VALUES
  ('EXPORT_TENANT_DATA',     'Export', 'Allows a client to export only their own tenant data (stock, sales, prescriptions)'),
  ('EXPORT_ALL_CLIENT_DATA', 'Export', 'Allows a super admin to export across all tenants or a selected tenant'),
  ('EXPORT_AUDIT_LOGS',      'Export', 'Restricted permission for compliance, NDA inspector, and security review'),
  ('EXPORT_PATIENT_DATA',    'Export', 'Highly restricted patient record export subject to policy and regulatory review')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
  ('super_admin',           'Super Admin',           'Full platform control across all tenants'),
  ('admin_collaborator',    'Admin Collaborator',    'Delegated cross-module collaborator with assigned scope'),
  ('tenant_admin',          'Tenant Admin',          'Full control of own tenant'),
  ('supervisor_pharmacist', 'Supervisor Pharmacist', 'Clinical supervision, dispensing, and inventory'),
  ('inventory_manager',     'Inventory Manager',     'Stock control, FEFO batching, and reorders'),
  ('cashier_dispenser',     'Cashier / Dispenser',   'POS billing and frontline medication dispensing'),
  ('finance_officer',       'Finance Officer',       'Revenue collection, Z-reports, and insurance claims'),
  ('nda_auditor',           'NDA Auditor',           'External regulatory inspector with audit export access')
ON CONFLICT (id) DO NOTHING;

-- Grant export permissions according to §11.22.3 matrix
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('super_admin', 'EXPORT_TENANT_DATA'),
  ('super_admin', 'EXPORT_ALL_CLIENT_DATA'),
  ('super_admin', 'EXPORT_AUDIT_LOGS'),
  ('super_admin', 'EXPORT_PATIENT_DATA'),
  ('tenant_admin', 'EXPORT_TENANT_DATA'),
  ('supervisor_pharmacist', 'EXPORT_TENANT_DATA'),
  ('inventory_manager', 'EXPORT_TENANT_DATA'),
  ('finance_officer', 'EXPORT_TENANT_DATA'),
  ('nda_auditor', 'EXPORT_AUDIT_LOGS'),
  ('nda_auditor', 'EXPORT_TENANT_DATA')
ON CONFLICT DO NOTHING;


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
  ON drugs (tenant_id, expiry_date ASC, stock_qty DESC);

-- Drug category and stock level filtering
CREATE INDEX IF NOT EXISTS idx_drugs_tenant_category_stock 
  ON drugs (tenant_id, category, stock_qty);

-- Trigram index for instantaneous multi-word generic and brand name search
CREATE INDEX IF NOT EXISTS idx_drugs_name_trgm 
  ON drugs USING gin (brand_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_drugs_generic_trgm 
  ON drugs USING gin (generic_name gin_trgm_ops);

-- 3. PRESCRIPTION PROCESSING INDEXES
-- Active clinical dispensing queue index (status filter + recency)
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_status_created 
  ON prescriptions (tenant_id, status, created_at DESC);

-- Fast lookup by official prescription code / registration ID
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_rx_number 
  ON prescriptions (tenant_id, rx_number);

-- Patient prescription history lookup
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_patient_name 
  ON prescriptions (tenant_id, patient_name, created_at DESC);

-- 4. POINT OF SALE & TRANSACTIONS INDEXES
-- Daily/Monthly ledger reporting and sales analytics filter
CREATE INDEX IF NOT EXISTS idx_pos_transactions_tenant_date 
  ON pos_transactions (tenant_id, created_at DESC);

-- Fast receipt ID / invoice number point lookup
CREATE INDEX IF NOT EXISTS idx_pos_transactions_tenant_receipt 
  ON pos_transactions (tenant_id, receipt_no);

-- Payment method breakdown filtering
CREATE INDEX IF NOT EXISTS idx_pos_transactions_tenant_payment_method 
  ON pos_transactions (tenant_id, payment_method, created_at DESC);

-- 5. FINANCIAL LEDGER & INTENTS INDEXES (§11.18)
-- Payment intents not in initial schema, skipping

-- 6. AUDIT TRAIL & COMPLIANCE INDEXES (§11.20)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp 
  ON audit_logs (tenant_id, created_at DESC, action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
  ON audit_logs (tenant_id, performed_by, action, created_at DESC);

-- 7. MATERIALIZED VIEWS FOR ZERO-LATENCY EXECUTIVE DASHBOARDS
-- Daily aggregated revenue, transactions, and discount totals per tenant
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_pharmacy_sales_summary AS
SELECT
  tenant_id,
  DATE_TRUNC('day', created_at) AS sales_day,
  COUNT(id) AS total_transactions,
  SUM(total_paid + discount_amount) AS gross_sales_ugx,
  SUM(discount_amount) AS total_discounts_ugx,
  SUM(total_paid) AS net_revenue_ugx,
  COUNT(CASE WHEN payment_method = 'Mobile Money' THEN 1 END) AS momo_transactions,
  COUNT(CASE WHEN payment_method = 'Cash' THEN 1 END) AS cash_transactions,
  COUNT(CASE WHEN payment_method = 'Insurance' THEN 1 END) AS insurance_transactions
FROM pos_transactions
GROUP BY tenant_id, DATE_TRUNC('day', created_at)
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales_pk 
  ON mv_daily_pharmacy_sales_summary (tenant_id, sales_day);

-- Real-time stock health summary view (Low stock, expired count, total stock value)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_drug_stock_health_summary AS
SELECT
  tenant_id,
  COUNT(id) AS total_skus,
  SUM(stock_qty) AS total_units_in_stock,
  SUM(stock_qty * cost_price) AS total_inventory_valuation_ugx,
  COUNT(CASE WHEN stock_qty <= reorder_level THEN 1 END) AS low_stock_skus,
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
-- =====================================================================
-- FLUTTERWAVE SUBSCRIPTION PAYMENTS (added as per Flutterwave Integration)
-- =====================================================================
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    order_id TEXT,
    provider TEXT NOT NULL,
    provider_transaction_id TEXT,
    transaction_reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UGX',
    payment_method TEXT,
    mobile_network TEXT,
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    provider_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID,
    provider TEXT NOT NULL,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
