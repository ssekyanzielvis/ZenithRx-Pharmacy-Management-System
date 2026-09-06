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
