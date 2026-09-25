-- ============================================================================
-- Migration 027: Patient Refill Eligibility & Medication Depletion Engine
-- Calculates exact medication runout dates from original quantity, dispensing date,
-- and prescribed frequency, providing pharmacist review before automated outreach.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patient_refill_eligibility_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    patient_id VARCHAR(64) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(64) NOT NULL,
    prescription_id VARCHAR(64),
    prescription_ref_no VARCHAR(64),
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    chronic_condition VARCHAR(128) NOT NULL, -- e.g. 'Hypertension', 'Diabetes Type 2', 'Asthma', 'Dyslipidemia'
    
    -- Posology & Depletion Formula Inputs
    original_quantity NUMERIC(10, 2) NOT NULL, -- e.g. 60 (tablets)
    unit_of_measure VARCHAR(32) NOT NULL DEFAULT 'tablets', -- 'tablets', 'capsules', 'mL', 'puffs'
    dose_per_intake NUMERIC(10, 2) NOT NULL DEFAULT 1.0, -- e.g. 1 tablet per dose
    frequency_per_day NUMERIC(10, 2) NOT NULL DEFAULT 1.0, -- e.g. 2 for BD (twice daily), 1 for OD, 3 for TDS
    frequency_text VARCHAR(255) NOT NULL, -- e.g. '1 tablet twice daily with meals (BD)'
    daily_intake_rate NUMERIC(10, 2) NOT NULL, -- dose_per_intake * frequency_per_day = e.g. 2 tablets/day
    
    -- Calculated Depletion & Supply Timing
    days_supply INT NOT NULL, -- floor(original_quantity / daily_intake_rate) = e.g. 30 days
    dispensing_date DATE NOT NULL, -- e.g. 2026-08-28
    estimated_depletion_date DATE NOT NULL, -- dispensing_date + days_supply = e.g. 2026-09-27
    earliest_allowed_refill_date DATE NOT NULL, -- dispensing_date + floor(days_supply * 0.85) (85% adherence rule)
    
    -- Refill Status & Countdown
    refill_status VARCHAR(64) NOT NULL DEFAULT 'Active Supply', 
    -- 'Refill Due (0-3 Days)', 'Approaching (4-7 Days)', 'Overdue (Missed Dose Risk)', 'Active Supply (>7 Days)', 'Discontinued'
    
    -- Pharmacist Review & Signoff Governance
    pharmacist_review_status VARCHAR(64) NOT NULL DEFAULT 'Pending Review',
    -- 'Pending Review', 'Approved for Outreach', 'Posology Adjusted', 'Refill Authorized', 'Suspended'
    pharmacist_reviewer_name VARCHAR(255),
    pharmacist_reviewer_psu_no VARCHAR(64),
    pharmacist_review_timestamp TIMESTAMPTZ,
    pharmacist_review_notes TEXT,
    
    -- Tailored Outreach Dispatch
    reminder_channel VARCHAR(32) NOT NULL DEFAULT 'WhatsApp', -- 'WhatsApp', 'SMS', 'Phone Call'
    tailored_message_preview TEXT,
    last_reminder_sent_at TIMESTAMPTZ,
    reminder_dispatch_count INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for rapid dashboard queries
CREATE INDEX IF NOT EXISTS idx_refill_eligibility_tenant_patient 
ON public.patient_refill_eligibility_records (tenant_id, patient_id);

CREATE INDEX IF NOT EXISTS idx_refill_eligibility_depletion_date 
ON public.patient_refill_eligibility_records (estimated_depletion_date);

CREATE INDEX IF NOT EXISTS idx_refill_eligibility_review_status 
ON public.patient_refill_eligibility_records (pharmacist_review_status);

-- Automatic Calculation Trigger Function
CREATE OR REPLACE FUNCTION public.fn_compute_refill_depletion_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure daily intake rate is calculated
    IF NEW.daily_intake_rate IS NULL OR NEW.daily_intake_rate <= 0 THEN
        NEW.daily_intake_rate := GREATEST(0.1, NEW.dose_per_intake * NEW.frequency_per_day);
    END IF;

    -- Ensure days supply is calculated
    NEW.days_supply := FLOOR(NEW.original_quantity / NEW.daily_intake_rate);
    
    -- Compute estimated depletion date
    NEW.estimated_depletion_date := NEW.dispensing_date + (NEW.days_supply || ' days')::INTERVAL;
    
    -- Compute earliest allowed refill date (85% runout threshold)
    NEW.earliest_allowed_refill_date := NEW.dispensing_date + (FLOOR(NEW.days_supply * 0.85) || ' days')::INTERVAL;
    
    -- Generate tailored message text
    NEW.tailored_message_preview := format(
        'Hello %s, from ZenithRx Pharmacy: On %s, you received %s %s of %s (%s). Based on your prescribed dose, your supply will run out on %s. Your refill is approved and ready. Reply REFILL to confirm pickup or delivery.',
        NEW.patient_name,
        to_char(NEW.dispensing_date, 'DD Mon'),
        NEW.original_quantity,
        NEW.unit_of_measure,
        NEW.medication_name,
        NEW.frequency_text,
        to_char(NEW.estimated_depletion_date, 'DD Mon')
    );

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_refill_depletion ON public.patient_refill_eligibility_records;
CREATE TRIGGER trg_compute_refill_depletion
BEFORE INSERT OR UPDATE ON public.patient_refill_eligibility_records
FOR EACH ROW
EXECUTE FUNCTION public.fn_compute_refill_depletion_dates();

-- RLS Security
ALTER TABLE public.patient_refill_eligibility_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own refill eligibility records"
ON public.patient_refill_eligibility_records
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = 'client-001');

-- Seed Comprehensive Depletion & Refill Records
INSERT INTO public.patient_refill_eligibility_records (
    id, tenant_id, patient_id, patient_name, patient_phone, prescription_ref_no,
    medication_name, generic_name, chronic_condition,
    original_quantity, unit_of_measure, dose_per_intake, frequency_per_day, frequency_text, daily_intake_rate,
    days_supply, dispensing_date, estimated_depletion_date, earliest_allowed_refill_date,
    refill_status, pharmacist_review_status, pharmacist_reviewer_name, pharmacist_reviewer_psu_no,
    pharmacist_review_notes, reminder_channel
) VALUES 
(
    '80000000-0000-0000-0000-000000000001', 'client-001', 'cust-1', 'Grace Nakato', '+256 701 234567', 'RX-2026-8819',
    'Amlodipine Besylate 5mg', 'Amlodipine Besylate', 'Hypertension',
    30, 'tablets', 1.0, 1.0, '1 tablet once daily in the morning (OD)', 1.0,
    30, '2026-08-28', '2026-09-27', '2026-09-23',
    'Refill Due (0-3 Days)', 'Approved for Outreach', 'Dr. Arthur Ssenabulya', 'PSU-2021-0892',
    'Calculated 2 days of supply remaining. Blood pressure controlled at last log (126/82 mmHg). Approved for refill dispatch.', 'WhatsApp'
),
(
    '80000000-0000-0000-0000-000000000002', 'client-001', 'cust-2', 'John Baptist Okello', '+256 772 345678', 'RX-2026-9041',
    'Metformin Hydrochloride 500mg', 'Metformin HCl', 'Diabetes Type 2',
    60, 'tablets', 1.0, 2.0, '1 tablet twice daily with meals (BD)', 2.0,
    30, '2026-08-29', '2026-09-28', '2026-09-24',
    'Refill Due (0-3 Days)', 'Pending Review', NULL, NULL,
    'Supply estimated to deplete in 3 days (28 Sep). Pending pharmacist signoff before sending WhatsApp reminder.', 'WhatsApp'
),
(
    '80000000-0000-0000-0000-000000000003', 'client-001', 'cust-3', 'Sarah Namugga', '+256 782 990011', 'RX-2026-7734',
    'Ventolin Inhaler 100mcg (200 doses)', 'Salbutamol Sulfate', 'Asthma',
    200, 'puffs', 2.0, 2.0, '2 puffs twice daily as maintenance (BD)', 4.0,
    50, '2026-08-04', '2026-09-23', '2026-09-16',
    'Overdue (Missed Dose Risk)', 'Approved for Outreach', 'Dr. Arthur Ssenabulya', 'PSU-2021-0892',
    'Patient supply ran out 2 days ago. High risk of asthma exacerbation; urgent phone call/WhatsApp recommended.', 'SMS'
),
(
    '80000000-0000-0000-0000-000000000004', 'client-001', 'cust-4', 'David Kato', '+256 703 456789', 'RX-2026-9412',
    'Atorvastatin 20mg', 'Atorvastatin Calcium', 'Dyslipidemia',
    30, 'tablets', 1.0, 1.0, '1 tablet at bedtime (Nocte)', 1.0,
    30, '2026-09-10', '2026-10-10', '2026-10-05',
    'Active Supply (>7 Days)', 'Approved for Outreach', 'Dr. Arthur Ssenabulya', 'PSU-2021-0892',
    '15 days of supply remaining. Early refill blocked until 05 Oct (85% consumption threshold).', 'WhatsApp'
)
ON CONFLICT (id) DO NOTHING;
