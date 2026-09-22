-- ==============================================================================
-- ZenithRx PMS — Database Schema Migration 006
-- Governance, NDA Compliance, Plan Capacity & Dual-Auditing (§11.22.4)
-- Database: Supabase PostgreSQL (pg 15+)
-- ==============================================================================

-- ─── 1. TENANT CAPACITY SNAPSHOTS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_capacity_snapshots (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_count           INT NOT NULL DEFAULT 0,
  staff_limit           INT NOT NULL DEFAULT 5,
  drugs_count           INT NOT NULL DEFAULT 0,
  drugs_limit           INT NOT NULL DEFAULT 500,
  prescriptions_count   INT NOT NULL DEFAULT 0,
  prescriptions_limit   INT NOT NULL DEFAULT 1000,
  transactions_count    INT NOT NULL DEFAULT 0,
  transactions_limit    INT NOT NULL DEFAULT 2000,
  storage_mb            NUMERIC(10,2) NOT NULL DEFAULT 0.0,
  storage_limit_mb      NUMERIC(10,2) NOT NULL DEFAULT 1024.0,
  overall_usage_percent NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  recommended_tier      TEXT CHECK (recommended_tier IN ('Starter', 'Growth', 'Enterprise', 'Ultimate', NULL)),
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. CAPACITY ALERTS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capacity_alerts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  alert_type            TEXT NOT NULL CHECK (alert_type IN ('warning_70', 'critical_85', 'breach_95', 'limit_exceeded', 'upgrade_recommended')),
  metric                TEXT NOT NULL, -- 'staff', 'drugs', 'prescriptions', 'transactions', 'storage', 'overall'
  usage_percent         NUMERIC(5,2) NOT NULL,
  current_value         INT NOT NULL,
  max_limit             INT NOT NULL,
  current_tier          TEXT NOT NULL,
  recommended_tier      TEXT,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  notification_channels JSONB NOT NULL DEFAULT '["in_system"]'::jsonb,
  admin_notes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ
);

-- ─── 3. PLAN ENFORCEMENT EVENTS TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_enforcement_events (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  action_attempted      TEXT NOT NULL,
  feature_key           TEXT NOT NULL,
  required_tier         TEXT NOT NULL,
  current_tier          TEXT NOT NULL,
  blocked_reason        TEXT NOT NULL,
  ip_address            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. SYSTEM NOTIFICATIONS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_notifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for global broadcast
  recipient_user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role           TEXT, -- 'super_admin', 'tenant_admin', 'supervisor_pharmacist', etc.
  title                 TEXT NOT NULL,
  message               TEXT NOT NULL,
  type                  TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical', 'upgrade_recommendation', 'compliance_notice', 'system_alert')),
  action_url            TEXT,
  metadata              JSONB DEFAULT '{}'::jsonb,
  is_read               BOOLEAN NOT NULL DEFAULT FALSE,
  read_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. ADMIN <-> PHARMACY MESSAGES TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_pharmacy_messages (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id             UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type           TEXT NOT NULL CHECK (sender_type IN ('admin', 'pharmacy')),
  recipient_type        TEXT NOT NULL CHECK (recipient_type IN ('admin', 'pharmacy')),
  subject               TEXT NOT NULL,
  message               TEXT NOT NULL,
  priority              TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category              TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'plan_upgrade', 'compliance_nda', 'support', 'billing', 'escalation')),
  is_read               BOOLEAN NOT NULL DEFAULT FALSE,
  read_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. NDA COMPLIANCE CHECKS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nda_compliance_checks (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  checked_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
  status                      TEXT NOT NULL CHECK (status IN ('compliant', 'warning', 'breach_flagged', 'suspended', 'under_review')),
  nda_license_number          TEXT,
  verification_notes          TEXT,
  patient_data_safety_verified BOOLEAN NOT NULL DEFAULT TRUE,
  audit_trail_verified        BOOLEAN NOT NULL DEFAULT TRUE,
  next_review_date            DATE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tenant_capacity_tenant ON tenant_capacity_snapshots(tenant_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_tenant ON capacity_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_plan_enforcement_tenant ON plan_enforcement_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_notifications_tenant ON system_notifications(tenant_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_notifications_recipient ON system_notifications(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_admin_pharmacy_msgs_tenant ON admin_pharmacy_messages(tenant_id, thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_pharmacy_msgs_thread ON admin_pharmacy_messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_nda_compliance_tenant ON nda_compliance_checks(tenant_id, created_at DESC);

-- ─── RLS POLICIES ────────────────────────────────────────────────────────────
ALTER TABLE tenant_capacity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_enforcement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pharmacy_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nda_compliance_checks ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY capacity_snapshots_select ON tenant_capacity_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY capacity_alerts_select ON capacity_alerts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY plan_enforcement_select ON plan_enforcement_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY system_notifications_select ON system_notifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY admin_pharmacy_messages_select ON admin_pharmacy_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY nda_compliance_select ON nda_compliance_checks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert/Update policies
CREATE POLICY capacity_snapshots_insert ON tenant_capacity_snapshots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY capacity_alerts_all ON capacity_alerts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY plan_enforcement_insert ON plan_enforcement_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY system_notifications_all ON system_notifications
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY admin_pharmacy_messages_all ON admin_pharmacy_messages
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY nda_compliance_all ON nda_compliance_checks
  FOR ALL USING (auth.uid() IS NOT NULL);
