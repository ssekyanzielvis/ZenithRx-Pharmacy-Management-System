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
