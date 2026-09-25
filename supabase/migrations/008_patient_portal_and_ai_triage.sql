-- ==============================================================================
-- ZenithRx PMS — Database Schema Migration 008
-- Patient Portal Ecosystem & AI Safety Triage Subsystem
-- Database: Supabase PostgreSQL (pg 15+)
--
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO DEPLOY THE PATIENT SUBSYSTEM SAFELY
-- Designed to run independently without conflicts with previous tables.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PATIENT PROFILES (Self-service registered patients)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patient_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id          UUID UNIQUE, -- Optional link to auth.users
  full_name             TEXT NOT NULL,
  phone                 TEXT NOT NULL UNIQUE,
  email                 TEXT,
  pin_hash              TEXT, -- For lightweight 4-digit PIN authentication on PWA
  age                   INTEGER CHECK (age > 0 AND age < 150),
  gender                TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group           TEXT,
  known_allergies       TEXT[] NOT NULL DEFAULT '{}',
  chronic_conditions    TEXT[] NOT NULL DEFAULT '{}',
  emergency_contact     JSONB NOT NULL DEFAULT '{"name": "", "phone": "", "relationship": ""}'::jsonb,
  delivery_address      JSONB NOT NULL DEFAULT '{"address": "Kampala, Uganda", "district": "Kampala", "lat": 0.3476, "lng": 32.5825}'::jsonb,
  preferred_pharmacy_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_phone ON patient_profiles (phone);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_auth  ON patient_profiles (auth_user_id);

-- ==============================================================================
-- 2. PATIENT PRESCRIPTIONS (Uploaded Rx + OCR + Pharmacist Approval)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patient_prescriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id            UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  pharmacy_id           UUID REFERENCES tenants(id) ON DELETE SET NULL,
  image_url             TEXT,
  image_file_id         UUID REFERENCES files(id) ON DELETE SET NULL,
  ocr_extracted_data    JSONB DEFAULT '{}'::jsonb,
  ocr_confidence_score  NUMERIC(4,3) DEFAULT 0.0 CHECK (ocr_confidence_score BETWEEN 0 AND 1),
  status                TEXT NOT NULL DEFAULT 'Awaiting Verification' CHECK (status IN (
                          'Awaiting Verification', 'Verified by Pharmacist', 'Rejected', 'Dispensed', 'Ready for Dispatch'
                        )),
  pharmacist_notes      TEXT,
  verified_by_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_rx_patient    ON patient_prescriptions (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_rx_pharmacy   ON patient_prescriptions (pharmacy_id, status);

-- ==============================================================================
-- 3. PATIENT ORDERS & DELIVERY TRACKING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patient_orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number          TEXT NOT NULL UNIQUE,
  patient_id            UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  pharmacy_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  prescription_id       UUID REFERENCES patient_prescriptions(id) ON DELETE SET NULL,
  total_amount_ugx      NUMERIC(14,2) NOT NULL CHECK (total_amount_ugx >= 0),
  payment_status        TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
  payment_method        TEXT NOT NULL CHECK (payment_method IN ('MTN_MOMO', 'AIRTEL_MONEY', 'CARD', 'CASH_ON_DELIVERY')),
  payment_ref           TEXT,
  fulfillment_status    TEXT NOT NULL DEFAULT 'Processing' CHECK (fulfillment_status IN (
                          'Processing', 'Verified', 'Dispatched', 'Delivered', 'Cancelled'
                        )),
  delivery_type         TEXT NOT NULL DEFAULT 'Delivery' CHECK (delivery_type IN ('Delivery', 'Pharmacy Pickup')),
  delivery_address      TEXT NOT NULL,
  rider_name            TEXT,
  rider_phone           TEXT,
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_orders_patient   ON patient_orders (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_orders_pharmacy  ON patient_orders (pharmacy_id, fulfillment_status);

CREATE TABLE IF NOT EXISTS patient_order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES patient_orders(id) ON DELETE CASCADE,
  drug_id         UUID REFERENCES drugs(id) ON DELETE SET NULL,
  drug_name       TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_ugx  NUMERIC(12,2) NOT NULL CHECK (unit_price_ugx >= 0),
  total_ugx       NUMERIC(14,2) NOT NULL CHECK (total_ugx >= 0)
);

CREATE INDEX IF NOT EXISTS idx_patient_order_items_order ON patient_order_items (order_id);

-- ==============================================================================
-- 4. ADHERENCE SCHEDULES & DOSE LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS adherence_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  drug_name       TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,
  dose_times      TEXT[] NOT NULL DEFAULT '{"08:00"}',
  total_days      INTEGER NOT NULL DEFAULT 30 CHECK (total_days > 0),
  remaining_doses INTEGER NOT NULL DEFAULT 30 CHECK (remaining_doses >= 0),
  streak_days     INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adherence_patient ON adherence_schedules (patient_id, is_active);

CREATE TABLE IF NOT EXISTS adherence_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id     UUID NOT NULL REFERENCES adherence_schedules(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  scheduled_time  TIMESTAMPTZ NOT NULL,
  logged_time     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL CHECK (status IN ('TAKEN', 'SKIPPED', 'MISSED', 'SNOOZED')),
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_adherence_logs_patient ON adherence_logs (patient_id, scheduled_time DESC);

-- ==============================================================================
-- 5. TELECONSULTATIONS (Virtual Pharmacist Clinic)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS teleconsultations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  pharmacist_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  chief_complaint   TEXT NOT NULL,
  urgency           TEXT NOT NULL DEFAULT 'Routine' CHECK (urgency IN ('Routine', 'Urgent', 'Follow-up')),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  meeting_link      TEXT,
  status            TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
  clinical_summary  TEXT,
  recommended_rx_id UUID REFERENCES patient_prescriptions(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teleconsult_patient ON teleconsultations (patient_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_teleconsult_status  ON teleconsultations (pharmacy_id, status);

-- ==============================================================================
-- 6. ADVERSE DRUG REACTION (ADR) PHARMACOVIGILANCE REPORTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS adr_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id            UUID REFERENCES patient_profiles(id) ON DELETE SET NULL,
  pharmacy_id           UUID REFERENCES tenants(id) ON DELETE SET NULL,
  drug_name             TEXT NOT NULL,
  batch_number          TEXT,
  symptoms_described    TEXT NOT NULL,
  severity              TEXT NOT NULL CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Life Threatening')),
  action_taken          TEXT,
  outcome               TEXT CHECK (outcome IN ('Recovered', 'Recovering', 'Not Recovered', 'Fatal', 'Unknown')),
  reported_to_nda       BOOLEAN NOT NULL DEFAULT FALSE,
  nda_reference_code    TEXT,
  pharmacist_assessment TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adr_reports_drug     ON adr_reports (drug_name);
CREATE INDEX IF NOT EXISTS idx_adr_reports_severity ON adr_reports (severity);

-- ==============================================================================
-- 7. HEALTH EDUCATION ARTICLES (Curated & Reviewed)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS health_education_articles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL CHECK (category IN (
                          'Hypertension', 'Diabetes', 'Antibiotic Stewardship', 'Malaria', 'Maternal Health', 'General Wellness'
                        )),
  summary               TEXT NOT NULL,
  content_markdown      TEXT NOT NULL,
  reading_time_mins     INTEGER NOT NULL DEFAULT 3,
  reviewed_by_pharmacist TEXT NOT NULL,
  is_published          BOOLEAN NOT NULL DEFAULT TRUE,
  view_count            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_articles_cat ON health_education_articles (category, is_published);

-- ==============================================================================
-- 8. PATIENT AI CONVERSATIONS & CLINICAL TRIAGE SESSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patient_ai_conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
  session_title   TEXT NOT NULL DEFAULT 'Medication & Health Inquiry',
  context_tags    TEXT[] NOT NULL DEFAULT '{}',
  triage_status   TEXT NOT NULL DEFAULT 'ROUTINE' CHECK (triage_status IN (
                    'ROUTINE', 'PHARMACIST_CONSULT_RECOMMENDED', 'URGENT_EMERGENCY'
                  )),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_ai_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES patient_ai_conversations(id) ON DELETE CASCADE,
  sender          TEXT NOT NULL CHECK (sender IN ('patient', 'assistant', 'system')),
  content         TEXT NOT NULL,
  triage_payload  JSONB, -- Contains safety warnings, suggested actions, emergency triggers
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_patient ON patient_ai_conversations (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON patient_ai_messages (conversation_id, created_at ASC);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) FOR PATIENT SUBSYSTEM (SAFE RE-RUNNABLE)
-- ==============================================================================

ALTER TABLE patient_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_prescriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE adherence_schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE adherence_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE teleconsultations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE adr_reports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_education_articles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_ai_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_ai_messages         ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to prevent conflicts upon re-running
DROP POLICY IF EXISTS "articles_read_public" ON health_education_articles;
DROP POLICY IF EXISTS "patient_profiles_access" ON patient_profiles;
DROP POLICY IF EXISTS "patient_prescriptions_access" ON patient_prescriptions;
DROP POLICY IF EXISTS "patient_orders_access" ON patient_orders;
DROP POLICY IF EXISTS "patient_adherence_access" ON adherence_schedules;
DROP POLICY IF EXISTS "patient_ai_conv_access" ON patient_ai_conversations;

-- Re-create clean RLS policies
CREATE POLICY "articles_read_public" ON health_education_articles
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "patient_profiles_access" ON patient_profiles
  FOR ALL USING (
    auth_user_id = auth.uid() 
    OR is_super_admin() 
    OR auth.uid() IS NULL
  );

CREATE POLICY "patient_prescriptions_access" ON patient_prescriptions
  FOR ALL USING (
    patient_id IN (SELECT id FROM patient_profiles WHERE auth_user_id = auth.uid())
    OR pharmacy_id = get_tenant_id()
    OR is_super_admin()
  );

CREATE POLICY "patient_orders_access" ON patient_orders
  FOR ALL USING (
    patient_id IN (SELECT id FROM patient_profiles WHERE auth_user_id = auth.uid())
    OR pharmacy_id = get_tenant_id()
    OR is_super_admin()
  );

CREATE POLICY "patient_adherence_access" ON adherence_schedules
  FOR ALL USING (
    patient_id IN (SELECT id FROM patient_profiles WHERE auth_user_id = auth.uid())
    OR is_super_admin()
  );

CREATE POLICY "patient_ai_conv_access" ON patient_ai_conversations
  FOR ALL USING (
    patient_id IN (SELECT id FROM patient_profiles WHERE auth_user_id = auth.uid())
    OR is_super_admin()
  );

-- ==============================================================================
-- 10. SAMPLE SEED DATA FOR PATIENT EDUCATION ARTICLES
-- ==============================================================================
INSERT INTO health_education_articles (title, category, summary, content_markdown, reading_time_mins, reviewed_by_pharmacist)
VALUES
  (
    'Understanding Blood Pressure Numbers & Medication Routine',
    'Hypertension',
    'Why consistent daily timing matters when taking antihypertensives (e.g. Amlodipine, Lisinopril).',
    '# Managing Hypertension\n\nHigh blood pressure is often called a silent condition because it rarely produces obvious symptoms in its early stages.\n\n### Key Tips:\n1. **Take at the same time every day**: Keeps steady blood concentration.\n2. **Avoid skipping even when feeling well**: Meds prevent long-term vessel damage.\n3. **Limit high-sodium foods**: Reduces fluid retention.',
    4,
    'Pharm. Moses Musoke (PSU/REG/2021/1042)'
  ),
  (
    'Completing Antibiotic Courses: Stopping Superbugs',
    'Antibiotic Stewardship',
    'Why you must finish all prescribed antibiotic doses even after symptoms disappear.',
    '# Antibiotic Stewardship\n\nWhen you stop taking antibiotics early, the strongest bacteria survive and become resistant (superbugs).\n\n### Rules for Antibiotics:\n- Never share antibiotics with family members.\n- Finish the entire 5 to 7-day course.\n- Report severe watery diarrhea to your pharmacist immediately.',
    3,
    'Dr. Jane Nakato Pharm.D (NDA/RPH/2024)'
  )
ON CONFLICT DO NOTHING;
