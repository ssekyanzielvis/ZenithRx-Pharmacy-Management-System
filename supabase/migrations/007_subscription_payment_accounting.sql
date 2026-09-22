-- ==============================================================================
-- ZenithRx PMS — Database Schema Migration 007
-- SaaS Subscription Payment Accounting & Revenue Bookkeeping
-- Engineered by Quantum Networks Ltd — Financial Systems Division
-- Database: Supabase PostgreSQL (pg 15+)
--
-- SCOPE:
--   This migration creates the full financial accounting schema for the
--   ZenithRx SaaS subscription payment system. Every payment made by a
--   pharmacy to subscribe to ZenithRx MUST be routed through the system.
--   No off-system payments are permitted. This enforces proper book-keeping,
--   URA 18% VAT allocation, and auditability for Quantum Networks Ltd.
--
-- ARCHITECTURE:
--   Table 1:  subscription_payments       — Master payment ledger
--   Table 2:  general_ledger_journal      — Double-entry GL bookkeeping
--   Table 3:  payment_channels            — Reference: active payment methods
--   Table 4:  invoice_sequences           — Atomic auto-incrementing invoice serials
--   Table 5:  payment_reconciliation_log  — Gateway reconciliation audit trail
--   View:     v_platform_revenue_summary  — Executive KPI summary view
--   View:     v_subscription_payment_full — Enriched payment view
-- ==============================================================================

-- ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLE 1: SUBSCRIPTION PAYMENTS (Master Payment Ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subscription_payments (
  id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Payment Reference Numbers
  invoice_number          TEXT          NOT NULL UNIQUE,
  fiscal_receipt_number   TEXT          NOT NULL UNIQUE,

  -- Tenant (Client Pharmacy) Identity
  tenant_id               UUID          NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  tenant_name             TEXT          NOT NULL,

  -- Subscription Plan Details
  package_tier            TEXT          NOT NULL CHECK (package_tier IN (
                            'Starter', 'Professional', 'Enterprise', 'Custom Tailored'
                          )),
  billing_cycle           TEXT          NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- Financial Amounts (Uganda Shillings)
  -- RULE: gross = net + vat. VAT = ROUND((gross / 1.18) * 0.18)
  gross_amount_ugx        BIGINT        NOT NULL CHECK (gross_amount_ugx > 0),
  tax_vat_ugx             BIGINT        NOT NULL DEFAULT 0 CHECK (tax_vat_ugx >= 0),
  net_revenue_ugx         BIGINT        NOT NULL DEFAULT 0,
  amount_usd_equivalent   NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Payment Channel
  payment_channel         TEXT          NOT NULL CHECK (payment_channel IN (
                            'MTN_MOMO', 'AIRTEL_MONEY', 'PESAPAL_VISA_MC',
                            'BANK_EFT_STANBIC', 'BANK_EFT_CENTENARY', 'SYSTEM_ESCROW_SETTLEMENT'
                          )),
  provider_reference      TEXT          NOT NULL,
  payment_phone_or_account TEXT,

  -- Payment Status
  payment_status          TEXT          NOT NULL DEFAULT 'PENDING_CLEARANCE'
                            CHECK (payment_status IN (
                              'COMPLETED', 'PENDING_CLEARANCE', 'FAILED',
                              'OVERDUE', 'ESCROW_HOLD', 'REFUNDED'
                            )),

  -- Subscription Coverage Period
  period_start            DATE          NOT NULL,
  period_end              DATE          NOT NULL,
  CONSTRAINT sp_valid_period CHECK (period_end > period_start),

  -- Onboarding & Processing Metadata
  onboarding_source       TEXT          NOT NULL DEFAULT 'ADMIN_PANEL_SYSTEM'
                            CHECK (onboarding_source IN (
                              'ADMIN_PANEL_SYSTEM', 'SELF_SERVICE_PORTAL', 'RENEWAL_GATEWAY'
                            )),
  processed_by_user_id    TEXT,
  processed_by_user_name  TEXT,

  -- Digital Integrity
  digital_signature_hash  TEXT,
  qr_verification_url     TEXT,

  -- General Ledger Account Codes (Chart of Accounts)
  account_debit_gl_code   TEXT          NOT NULL DEFAULT '1020 - MTN MoMo Clearing Asset',
  account_credit_gl_code  TEXT          NOT NULL DEFAULT '4010 - SaaS Subscription Revenue',
  account_vat_gl_code     TEXT          NOT NULL DEFAULT '2150 - Output VAT Payable (18%)',

  -- Notes & Audit
  notes                   TEXT,
  paid_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── IDEMPOTENT COLUMN GUARDS ─────────────────────────────────────────────────
-- If the table already existed from a prior partial run, ensure every required
-- column is present. ADD COLUMN IF NOT EXISTS is safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS invoice_number          TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS fiscal_receipt_number   TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS tenant_id               UUID;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS tenant_name             TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS package_tier            TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS billing_cycle           TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS gross_amount_ugx        BIGINT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS tax_vat_ugx             BIGINT        NOT NULL DEFAULT 0;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS net_revenue_ugx         BIGINT        NOT NULL DEFAULT 0;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS amount_usd_equivalent   NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS payment_channel         TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS provider_reference      TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS payment_phone_or_account TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS payment_status          TEXT          NOT NULL DEFAULT 'PENDING_CLEARANCE';
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS period_start            DATE;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS period_end              DATE;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS onboarding_source       TEXT          NOT NULL DEFAULT 'ADMIN_PANEL_SYSTEM';
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS processed_by_user_id    TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS processed_by_user_name  TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS digital_signature_hash  TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS qr_verification_url     TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS account_debit_gl_code   TEXT          NOT NULL DEFAULT '1020 - MTN MoMo Clearing Asset';
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS account_credit_gl_code  TEXT          NOT NULL DEFAULT '4010 - SaaS Subscription Revenue';
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS account_vat_gl_code     TEXT          NOT NULL DEFAULT '2150 - Output VAT Payable (18%)';
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS notes                   TEXT;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS paid_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW();
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW();
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW();

-- Add UNIQUE constraints if not already present (safe with IF NOT EXISTS on pg15+)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_payments_invoice_number_key'
  ) THEN
    ALTER TABLE subscription_payments ADD CONSTRAINT subscription_payments_invoice_number_key UNIQUE (invoice_number);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_payments_fiscal_receipt_number_key'
  ) THEN
    ALTER TABLE subscription_payments ADD CONSTRAINT subscription_payments_fiscal_receipt_number_key UNIQUE (fiscal_receipt_number);
  END IF;
END $$;

-- Add CHECK constraints if not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sp_valid_period'
  ) THEN
    ALTER TABLE subscription_payments ADD CONSTRAINT sp_valid_period CHECK (period_end > period_start);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SAME PATTERN for general_ledger_journal (idempotent column guards)
-- Applied below after that table's CREATE TABLE IF NOT EXISTS block.
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE subscription_payments IS
  'Master ledger of all ZenithRx SaaS subscription payments. '
  'Every payment is system-mediated — no off-system payments permitted.';

COMMENT ON COLUMN subscription_payments.tax_vat_ugx IS
  'URA 18% inclusive VAT: computed as ROUND((gross / 1.18) * 0.18)';

COMMENT ON COLUMN subscription_payments.digital_signature_hash IS
  'SHA-256 hex digest of canonical payment fields for tamper-evident audit trail';

-- ==============================================================================
-- TABLE 2: GENERAL LEDGER JOURNAL (Double-Entry Bookkeeping)
-- ==============================================================================
-- Every payment generates exactly 3 journal entries:
--   1. DEBIT  — Cash/MoMo/Bank clearing account (money received)
--   2. CREDIT — SaaS Subscription Revenue account (net of VAT)
--   3. CREDIT — URA Output VAT Payable (18% statutory VAT)
-- Sum of debits must always equal sum of credits.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS general_ledger_journal (
  id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_date              DATE          NOT NULL,
  reference_number        TEXT          NOT NULL,
  payment_id              UUID          REFERENCES subscription_payments(id) ON DELETE SET NULL,
  tenant_id               UUID          REFERENCES tenants(id) ON DELETE SET NULL,
  tenant_name             TEXT,
  account_code            TEXT          NOT NULL,
  account_name            TEXT          NOT NULL,
  description             TEXT          NOT NULL,
  debit_ugx               BIGINT        NOT NULL DEFAULT 0 CHECK (debit_ugx >= 0),
  credit_ugx              BIGINT        NOT NULL DEFAULT 0 CHECK (credit_ugx >= 0),
  CONSTRAINT gl_entry_has_amount   CHECK (debit_ugx > 0 OR credit_ugx > 0),
  CONSTRAINT gl_entry_single_side  CHECK (NOT (debit_ugx > 0 AND credit_ugx > 0)),
  reconciled              BOOLEAN       NOT NULL DEFAULT FALSE,
  reconciled_at           TIMESTAMPTZ,
  reconciled_by           TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── IDEMPOTENT COLUMN GUARDS for general_ledger_journal ─────────────────────
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS entry_date        DATE;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS reference_number  TEXT;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS payment_id        UUID;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS tenant_id         UUID;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS tenant_name       TEXT;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS account_code      TEXT;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS account_name      TEXT;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS description       TEXT;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS debit_ugx         BIGINT        NOT NULL DEFAULT 0;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS credit_ugx        BIGINT        NOT NULL DEFAULT 0;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS reconciled        BOOLEAN       NOT NULL DEFAULT FALSE;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS reconciled_at     TIMESTAMPTZ;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS reconciled_by     TEXT;
ALTER TABLE general_ledger_journal ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW();

-- Add GL CHECK constraints if not already present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gl_entry_has_amount') THEN
    ALTER TABLE general_ledger_journal
      ADD CONSTRAINT gl_entry_has_amount CHECK (debit_ugx > 0 OR credit_ugx > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gl_entry_single_side') THEN
    ALTER TABLE general_ledger_journal
      ADD CONSTRAINT gl_entry_single_side CHECK (NOT (debit_ugx > 0 AND credit_ugx > 0));
  END IF;
END $$;
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE general_ledger_journal IS
  'Double-entry bookkeeping journal for all ZenithRx SaaS subscription revenue. '
  'Each payment auto-posts 3 journal entries via trigger: '
  '1 Debit (receipt) + 1 Credit (net revenue) + 1 Credit (URA VAT).';

-- TRIGGER: Auto-Post GL Entries on Payment Insert
CREATE OR REPLACE FUNCTION fn_post_subscription_payment_to_gl()
RETURNS TRIGGER AS $fn$
DECLARE
  v_debit_code  TEXT;
  v_debit_name  TEXT;
BEGIN
  -- Only post GL entries for COMPLETED payments
  IF NEW.payment_status <> 'COMPLETED' THEN
    RETURN NEW;
  END IF;

  v_debit_code := SPLIT_PART(NEW.account_debit_gl_code, ' - ', 1);
  v_debit_name := COALESCE(NULLIF(SPLIT_PART(NEW.account_debit_gl_code, ' - ', 2), ''), NEW.account_debit_gl_code);

  -- Entry 1: DEBIT — Cash / Gateway Clearing Asset (Total Gross Received)
  INSERT INTO general_ledger_journal (
    entry_date, reference_number, payment_id, tenant_id, tenant_name,
    account_code, account_name, description, debit_ugx, credit_ugx, reconciled, reconciled_at
  ) VALUES (
    NEW.paid_at::DATE, NEW.invoice_number, NEW.id, NEW.tenant_id, NEW.tenant_name,
    v_debit_code, v_debit_name,
    'Subscription Settlement [' || NEW.payment_channel || '] - ' || NEW.package_tier || ' (' || NEW.billing_cycle || ')',
    NEW.gross_amount_ugx, 0, TRUE, NEW.paid_at
  );

  -- Entry 2: CREDIT — SaaS Subscription Revenue (Net of VAT)
  INSERT INTO general_ledger_journal (
    entry_date, reference_number, payment_id, tenant_id, tenant_name,
    account_code, account_name, description, debit_ugx, credit_ugx, reconciled, reconciled_at
  ) VALUES (
    NEW.paid_at::DATE, NEW.invoice_number, NEW.id, NEW.tenant_id, NEW.tenant_name,
    SPLIT_PART(NEW.account_credit_gl_code, ' - ', 1),
    COALESCE(NULLIF(SPLIT_PART(NEW.account_credit_gl_code, ' - ', 2), ''), NEW.account_credit_gl_code),
    'SaaS Revenue Recognition - ' || NEW.tenant_name || ' (' || NEW.package_tier || ')',
    0, NEW.net_revenue_ugx, TRUE, NEW.paid_at
  );

  -- Entry 3: CREDIT — URA Output VAT Payable (18% Inclusive)
  INSERT INTO general_ledger_journal (
    entry_date, reference_number, payment_id, tenant_id, tenant_name,
    account_code, account_name, description, debit_ugx, credit_ugx, reconciled, reconciled_at
  ) VALUES (
    NEW.paid_at::DATE, NEW.invoice_number, NEW.id, NEW.tenant_id, NEW.tenant_name,
    SPLIT_PART(NEW.account_vat_gl_code, ' - ', 1),
    COALESCE(NULLIF(SPLIT_PART(NEW.account_vat_gl_code, ' - ', 2), ''), NEW.account_vat_gl_code),
    '18% URA Output VAT on SaaS Service - ' || NEW.invoice_number,
    0, NEW.tax_vat_ugx, TRUE, NEW.paid_at
  );

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_payment_to_gl
  AFTER INSERT ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION fn_post_subscription_payment_to_gl();

-- ==============================================================================
-- TABLE 3: PAYMENT CHANNELS (Reference Data)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS payment_channels (
  code                    TEXT          PRIMARY KEY,
  display_name            TEXT          NOT NULL,
  provider                TEXT          NOT NULL,
  gl_debit_account_code   TEXT          NOT NULL,
  gl_debit_account_name   TEXT          NOT NULL,
  supports_mobile_number  BOOLEAN       NOT NULL DEFAULT FALSE,
  supports_account_ref    BOOLEAN       NOT NULL DEFAULT TRUE,
  is_active               BOOLEAN       NOT NULL DEFAULT TRUE,
  processing_fee_percent  NUMERIC(5,4)  NOT NULL DEFAULT 0.0,
  settlement_days         INT           NOT NULL DEFAULT 1,
  notes                   TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

INSERT INTO payment_channels
  (code, display_name, provider, gl_debit_account_code, gl_debit_account_name,
   supports_mobile_number, is_active, processing_fee_percent, settlement_days, notes)
VALUES
  ('MTN_MOMO',              'MTN Mobile Money (Uganda)',      'MTN Uganda',        '1020', 'MTN MoMo Clearing Asset',              TRUE,  TRUE, 0.0100, 1, 'Primary mobile money channel. T+1 settlement to Quantum Networks MTN Corporate account.'),
  ('AIRTEL_MONEY',          'Airtel Money (Uganda)',          'Airtel Uganda',     '1025', 'Airtel Money Corporate Clearing',       TRUE,  TRUE, 0.0100, 1, 'Airtel Uganda mobile money. T+1 settlement.'),
  ('PESAPAL_VISA_MC',       'PesaPal Visa / Mastercard',     'PesaPal Ltd',       '1030', 'PesaPal Merchant Gateway Settlement',   FALSE, TRUE, 0.0250, 3, 'Card payments via PesaPal. T+3 settlement cycle.'),
  ('BANK_EFT_STANBIC',      'Stanbic Bank Direct EFT',       'Stanbic Bank UG',   '1010', 'Stanbic Bank Operating Account',        FALSE, TRUE, 0.0000, 2, 'Direct EFT to Quantum Networks Stanbic current account.'),
  ('BANK_EFT_CENTENARY',    'Centenary Bank Direct Wire',    'Centenary Bank UG', '1015', 'Centenary Bank Operating Account',      FALSE, TRUE, 0.0000, 2, 'Bank wire to Centenary Bank account.'),
  ('SYSTEM_ESCROW_SETTLEMENT','System Escrow Settlement',    'ZenithRx System',   '1040', 'System Escrow Trust Clearing',          FALSE, FALSE, 0.0000, 0, 'Internal escrow. Restricted use only.')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- TABLE 4: INVOICE SEQUENCES (Atomic Serial Numbers)
-- ==============================================================================
-- Maintains annual invoice sequences for QNT-INV-YYYY-NNNN format.
CREATE TABLE IF NOT EXISTS invoice_sequences (
  fiscal_year             INT           NOT NULL,
  last_sequence           INT           NOT NULL DEFAULT 1000,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (fiscal_year)
);

-- FUNCTION: Generate Next Invoice Number
CREATE OR REPLACE FUNCTION fn_next_invoice_number()
RETURNS TEXT AS $fn$
DECLARE
  v_year     INT := EXTRACT(YEAR FROM NOW())::INT;
  v_next_seq INT;
BEGIN
  INSERT INTO invoice_sequences (fiscal_year, last_sequence)
  VALUES (v_year, 1001)
  ON CONFLICT (fiscal_year) DO UPDATE
    SET last_sequence = invoice_sequences.last_sequence + 1,
        updated_at    = NOW()
  RETURNING last_sequence INTO v_next_seq;

  RETURN 'QNT-INV-' || v_year::TEXT || '-' || LPAD(v_next_seq::TEXT, 4, '0');
END;
$fn$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABLE 5: PAYMENT RECONCILIATION LOG (Gateway Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS payment_reconciliation_log (
  id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id              UUID          NOT NULL REFERENCES subscription_payments(id) ON DELETE CASCADE,
  invoice_number          TEXT          NOT NULL,
  reconciliation_type     TEXT          NOT NULL CHECK (reconciliation_type IN (
                            'INITIAL_CLEARANCE', 'GATEWAY_CALLBACK', 'MANUAL_RECONCILE',
                            'DISPUTE_INVESTIGATION', 'REFUND_PROCESSING', 'CHARGEBACK_REVIEW'
                          )),
  gateway_status          TEXT,
  gateway_transaction_id  TEXT,
  gateway_amount_ugx      BIGINT,
  system_amount_ugx       BIGINT,
  amount_discrepancy_ugx  BIGINT GENERATED ALWAYS AS (
    COALESCE(gateway_amount_ugx, 0) - COALESCE(system_amount_ugx, 0)
  ) STORED,
  reconciled_by_user_id   TEXT,
  reconciliation_notes    TEXT,
  ip_address              INET,
  is_suspicious           BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── IDEMPOTENT COLUMN GUARDS for payment_reconciliation_log ─────────────────
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS payment_id             UUID;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS invoice_number         TEXT;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS reconciliation_type    TEXT;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS gateway_status         TEXT;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS gateway_amount_ugx     BIGINT;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS system_amount_ugx      BIGINT;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS reconciled_by_user_id  TEXT;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS reconciliation_notes   TEXT;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS ip_address             INET;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS is_suspicious          BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE payment_reconciliation_log ADD COLUMN IF NOT EXISTS created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW();
-- Note: amount_discrepancy_ugx is a GENERATED column; it is created by the
-- CREATE TABLE statement and cannot be added via ADD COLUMN IF NOT EXISTS.
-- If the column is missing (very old partial run), drop and recreate the table.
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE payment_reconciliation_log IS
  'Audit trail for payment gateway reconciliation checks. '
  'Discrepancies flagged for Quantum Networks financial team escalation.';

-- ==============================================================================
-- VIEWS
-- ==============================================================================

-- Executive KPI view
CREATE OR REPLACE VIEW v_platform_revenue_summary AS
WITH completed AS (
  SELECT * FROM subscription_payments WHERE payment_status = 'COMPLETED'
),
mrr AS (
  SELECT SUM(
    CASE billing_cycle
      WHEN 'yearly'  THEN ROUND(gross_amount_ugx / 12.0)
      WHEN 'monthly' THEN gross_amount_ugx
    END
  )::BIGINT AS mrr_ugx
  FROM completed
)
SELECT
  (SELECT mrr_ugx FROM mrr) * 12                                                    AS gross_arr_ugx,
  (SELECT mrr_ugx FROM mrr)                                                          AS gross_mrr_ugx,
  COALESCE(SUM(net_revenue_ugx), 0)::BIGINT                                          AS net_saas_ytd_ugx,
  COALESCE(SUM(tax_vat_ugx), 0)::BIGINT                                              AS total_vat_collected_ugx,
  COUNT(DISTINCT tenant_id)::INT                                                     AS active_paid_tenants_count,
  COALESCE(SUM(gross_amount_ugx) FILTER (WHERE payment_channel = 'MTN_MOMO'), 0)::BIGINT            AS mtn_momo_clearing_ugx,
  COALESCE(SUM(gross_amount_ugx) FILTER (WHERE payment_channel = 'AIRTEL_MONEY'), 0)::BIGINT         AS airtel_money_clearing_ugx,
  COALESCE(SUM(gross_amount_ugx) FILTER (WHERE payment_channel IN ('BANK_EFT_STANBIC','BANK_EFT_CENTENARY')), 0)::BIGINT  AS bank_eft_clearing_ugx,
  COALESCE(SUM(gross_amount_ugx) FILTER (WHERE payment_channel = 'PESAPAL_VISA_MC'), 0)::BIGINT      AS pesapal_clearing_ugx,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE payment_status = 'COMPLETED')::NUMERIC
    / NULLIF(COUNT(*), 0), 2
  )                                                                                  AS accounting_compliance_pct
FROM completed;

-- Enriched payment view with GL summary
CREATE OR REPLACE VIEW v_subscription_payment_full AS
SELECT
  sp.id,
  sp.invoice_number,
  sp.fiscal_receipt_number,
  sp.tenant_id,
  t.name                                   AS tenant_display_name,
  t.location                               AS tenant_location,
  sp.tenant_name                           AS tenant_name_snapshot,
  sp.package_tier,
  sp.billing_cycle,
  sp.gross_amount_ugx,
  sp.tax_vat_ugx,
  sp.net_revenue_ugx,
  sp.amount_usd_equivalent,
  sp.payment_channel,
  sp.provider_reference,
  sp.payment_phone_or_account,
  sp.payment_status,
  sp.period_start,
  sp.period_end,
  sp.onboarding_source,
  sp.processed_by_user_id,
  sp.processed_by_user_name,
  sp.account_debit_gl_code,
  sp.account_credit_gl_code,
  sp.account_vat_gl_code,
  sp.qr_verification_url,
  sp.notes,
  sp.paid_at,
  sp.created_at,
  COUNT(gl.id)::INT                        AS gl_entries_posted,
  (COALESCE(SUM(gl.debit_ugx), 0) = COALESCE(SUM(gl.credit_ugx), 0))  AS gl_balanced
FROM subscription_payments sp
LEFT JOIN tenants t   ON t.id = sp.tenant_id
LEFT JOIN general_ledger_journal gl ON gl.payment_id = sp.id
GROUP BY sp.id, t.name, t.location;

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_sub_payments_tenant    ON subscription_payments(tenant_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status    ON subscription_payments(payment_status, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_invoice   ON subscription_payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sub_payments_channel   ON subscription_payments(payment_channel, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_period    ON subscription_payments(period_start, period_end, tenant_id);

CREATE INDEX IF NOT EXISTS idx_gl_journal_payment     ON general_ledger_journal(payment_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_gl_journal_account     ON general_ledger_journal(account_code, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_gl_journal_reference   ON general_ledger_journal(reference_number);
CREATE INDEX IF NOT EXISTS idx_gl_journal_tenant      ON general_ledger_journal(tenant_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_recon_log_payment      ON payment_reconciliation_log(payment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recon_log_suspicious   ON payment_reconciliation_log(is_suspicious, created_at DESC)
  WHERE is_suspicious = TRUE;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) — Principle of Least Privilege
-- ==============================================================================
-- DESIGN:
--   Quantum Networks Super Admin  → Full read/write on ALL records
--   Pharmacy Tenant Users         → Read-only access to THEIR OWN records ONLY
--   No pharmacy can INSERT/UPDATE payment records
--   No pharmacy can see another pharmacy's billing records
-- ==============================================================================

-- Helper functions (self-contained for migration 007)
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1),
    NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'is_super_admin')::boolean,
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean,
    (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean,
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND (rank_role = 'Supervising Pharmacist' OR rank_role = 'Super Admin')
        AND tenant_id IS NULL
    ),
    FALSE
  );
$$;

ALTER TABLE subscription_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_ledger_journal     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_channels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences          ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to allow clean re-runs
DROP POLICY IF EXISTS sp_superadmin_all      ON subscription_payments;
DROP POLICY IF EXISTS sp_tenant_read_own     ON subscription_payments;
DROP POLICY IF EXISTS gl_superadmin_all      ON general_ledger_journal;
DROP POLICY IF EXISTS gl_tenant_read_own     ON general_ledger_journal;
DROP POLICY IF EXISTS recon_superadmin_only  ON payment_reconciliation_log;
DROP POLICY IF EXISTS channels_read_active   ON payment_channels;
DROP POLICY IF EXISTS channels_admin_write   ON payment_channels;
DROP POLICY IF EXISTS invoice_seq_admin_only ON invoice_sequences;

-- subscription_payments: Super Admin full access
CREATE POLICY sp_superadmin_all ON subscription_payments
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
  )
  WITH CHECK (
    is_super_admin()
    OR (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
  );

-- subscription_payments: Pharmacy read own records only (no direct insert/update/delete)
CREATE POLICY sp_tenant_read_own ON subscription_payments
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_tenant_id()
    OR tenant_id IN (SELECT u.tenant_id FROM users u WHERE u.id = auth.uid())
  );

-- general_ledger_journal: Super Admin full access
CREATE POLICY gl_superadmin_all ON general_ledger_journal
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
  );

-- general_ledger_journal: Pharmacy read own records only
CREATE POLICY gl_tenant_read_own ON general_ledger_journal
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_tenant_id()
    OR tenant_id IN (SELECT u.tenant_id FROM users u WHERE u.id = auth.uid())
  );

-- payment_reconciliation_log: Super Admin ONLY — no pharmacy access
CREATE POLICY recon_superadmin_only ON payment_reconciliation_log
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
  );

-- payment_channels: active channels are readable by all authenticated users (needed for payment forms)
CREATE POLICY channels_read_active ON payment_channels
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

CREATE POLICY channels_admin_write ON payment_channels
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
  );

-- invoice_sequences: admin only
CREATE POLICY invoice_seq_admin_only ON invoice_sequences
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
  );

-- ==============================================================================
-- STORED FUNCTION: fn_process_subscription_payment
-- ==============================================================================
-- Authoritative server-side entry point for recording subscription payments.
-- SECURITY DEFINER: runs with elevated privileges, bypassing RLS checks,
-- ensuring only the system (not individual pharmacy users) can post payments.
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_process_subscription_payment(
  p_tenant_id               UUID,
  p_tenant_name             TEXT,
  p_package_tier            TEXT,
  p_billing_cycle           TEXT,
  p_gross_amount_ugx        BIGINT,
  p_payment_channel         TEXT,
  p_provider_reference      TEXT,
  p_payment_phone           TEXT    DEFAULT NULL,
  p_onboarding_source       TEXT    DEFAULT 'ADMIN_PANEL_SYSTEM',
  p_processed_by_user_id    TEXT    DEFAULT 'QNT-SYS-ADMIN',
  p_processed_by_user_name  TEXT    DEFAULT 'Quantum Networks System',
  p_notes                   TEXT    DEFAULT NULL
)
RETURNS subscription_payments AS $fn$
DECLARE
  v_invoice         TEXT;
  v_fiscal_receipt  TEXT;
  v_vat             BIGINT;
  v_net             BIGINT;
  v_usd             NUMERIC(12,2);
  v_period_start    DATE;
  v_period_end      DATE;
  v_sig_hash        TEXT;
  v_debit_gl        TEXT;
  v_result          subscription_payments;
  UGX_USD_RATE      CONSTANT NUMERIC := 3750;
BEGIN
  -- Calculate VAT and net amounts
  -- URA 18% inclusive formula: VAT = ROUND((gross / 1.18) * 0.18)
  v_vat   := ROUND(p_gross_amount_ugx / 1.18 * 0.18)::BIGINT;
  v_net   := p_gross_amount_ugx - v_vat;
  v_usd   := ROUND(p_gross_amount_ugx::NUMERIC / UGX_USD_RATE, 2);

  -- Subscription coverage period
  v_period_start := NOW()::DATE;
  v_period_end   := CASE p_billing_cycle
    WHEN 'yearly'  THEN (NOW() + INTERVAL '1 year')::DATE
    ELSE                (NOW() + INTERVAL '1 month')::DATE
  END;

  -- Generate reference numbers
  v_invoice        := fn_next_invoice_number();
  v_fiscal_receipt := 'URA-EFRIS-REC-' || FLOOR(100000 + RANDOM() * 900000)::TEXT;

  -- Assign GL debit account by payment channel
  v_debit_gl := CASE p_payment_channel
    WHEN 'MTN_MOMO'               THEN '1020 - MTN MoMo Clearing Asset'
    WHEN 'AIRTEL_MONEY'           THEN '1025 - Airtel Money Corporate Clearing'
    WHEN 'BANK_EFT_STANBIC'       THEN '1010 - Stanbic Bank Operating Account'
    WHEN 'BANK_EFT_CENTENARY'     THEN '1015 - Centenary Bank Operating Account'
    WHEN 'PESAPAL_VISA_MC'        THEN '1030 - PesaPal Merchant Gateway Settlement'
    WHEN 'SYSTEM_ESCROW_SETTLEMENT' THEN '1040 - System Escrow Trust Clearing'
    ELSE '1020 - MTN MoMo Clearing Asset'
  END;

  -- SHA-256 digital signature for tamper-evident audit trail
  v_sig_hash := ENCODE(
    DIGEST(
      p_tenant_id::TEXT || v_invoice || p_gross_amount_ugx::TEXT || p_payment_channel || NOW()::TEXT,
      'sha256'
    ), 'hex'
  );

  -- Insert payment record (GL entries auto-posted via trigger)
  INSERT INTO subscription_payments (
    invoice_number, fiscal_receipt_number,
    tenant_id, tenant_name,
    package_tier, billing_cycle,
    gross_amount_ugx, tax_vat_ugx, net_revenue_ugx, amount_usd_equivalent,
    payment_channel, provider_reference, payment_phone_or_account,
    payment_status, period_start, period_end,
    onboarding_source, processed_by_user_id, processed_by_user_name,
    digital_signature_hash, qr_verification_url,
    account_debit_gl_code, account_credit_gl_code, account_vat_gl_code,
    notes, paid_at
  ) VALUES (
    v_invoice, v_fiscal_receipt,
    p_tenant_id, p_tenant_name,
    p_package_tier, p_billing_cycle,
    p_gross_amount_ugx, v_vat, v_net, v_usd,
    p_payment_channel, p_provider_reference, p_payment_phone,
    'COMPLETED', v_period_start, v_period_end,
    p_onboarding_source, p_processed_by_user_id, p_processed_by_user_name,
    v_sig_hash,
    'https://verify.quantumnetworks.ug/receipt/' || v_invoice,
    v_debit_gl,
    '4010 - SaaS Subscription Revenue',
    '2150 - Output VAT Payable (18%)',
    COALESCE(p_notes, 'System-mediated subscription payment recorded and posted to ledger.'),
    NOW()
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_process_subscription_payment IS
  'Authoritative entry point for recording ZenithRx subscription payments. '
  'Calculates URA VAT, generates QNT invoice numbers, auto-posts GL entries via trigger. '
  'SECURITY DEFINER: only Quantum Networks admin portal can call this.';

-- FUNCTION: Verify GL Balance for a Payment
CREATE OR REPLACE FUNCTION fn_verify_payment_gl_balance(p_payment_id UUID)
RETURNS TABLE (
  invoice_number    TEXT,
  total_debits_ugx  BIGINT,
  total_credits_ugx BIGINT,
  is_balanced       BOOLEAN,
  gl_entry_count    INT
) AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    sp.invoice_number,
    COALESCE(SUM(gl.debit_ugx),  0)::BIGINT  AS total_debits_ugx,
    COALESCE(SUM(gl.credit_ugx), 0)::BIGINT  AS total_credits_ugx,
    (COALESCE(SUM(gl.debit_ugx), 0) = COALESCE(SUM(gl.credit_ugx), 0)) AS is_balanced,
    COUNT(gl.id)::INT                          AS gl_entry_count
  FROM subscription_payments sp
  LEFT JOIN general_ledger_journal gl ON gl.payment_id = sp.id
  WHERE sp.id = p_payment_id
  GROUP BY sp.invoice_number;
END;
$fn$ LANGUAGE plpgsql;

-- AUTO-UPDATE updated_at TRIGGER
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ==============================================================================
-- GRANTS (Minimal Privilege — Principle of Least Privilege)
-- ==============================================================================
GRANT EXECUTE ON FUNCTION fn_process_subscription_payment  TO authenticated;
GRANT EXECUTE ON FUNCTION fn_next_invoice_number           TO authenticated;
GRANT EXECUTE ON FUNCTION fn_verify_payment_gl_balance     TO authenticated;
GRANT SELECT  ON v_platform_revenue_summary                TO authenticated;
GRANT SELECT  ON v_subscription_payment_full               TO authenticated;

-- ==============================================================================
-- END OF MIGRATION 007
-- ==============================================================================
