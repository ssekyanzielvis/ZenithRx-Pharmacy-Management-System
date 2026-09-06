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
