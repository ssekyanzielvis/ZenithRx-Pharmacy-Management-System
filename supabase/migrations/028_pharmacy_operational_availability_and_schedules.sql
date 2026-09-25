-- ============================================================================
-- Migration 028: Pharmacy Operational Availability, Schedules & Fulfillment Services
-- Tracks real-time open/closed status, 24/7 emergency readiness, temporary closures,
-- weekly opening hours, public holiday schedules, delivery, and pickup options.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pharmacy_operational_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_id VARCHAR(64) NOT NULL UNIQUE,
    pharmacy_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    district VARCHAR(128) NOT NULL,
    
    -- Real-time Operational Status
    is_24_hours_emergency BOOLEAN NOT NULL DEFAULT FALSE,
    is_temporarily_closed BOOLEAN NOT NULL DEFAULT FALSE,
    temporary_closure_reason TEXT,
    temporary_closure_reopen_at TIMESTAMPTZ,
    
    -- Weekly Standard Schedules (JSON structure)
    weekly_hours JSONB NOT NULL DEFAULT '{
        "monday": {"open": "07:30", "close": "22:00", "is_closed": false},
        "tuesday": {"open": "07:30", "close": "22:00", "is_closed": false},
        "wednesday": {"open": "07:30", "close": "22:00", "is_closed": false},
        "thursday": {"open": "07:30", "close": "22:00", "is_closed": false},
        "friday": {"open": "07:30", "close": "22:00", "is_closed": false},
        "saturday": {"open": "08:00", "close": "21:00", "is_closed": false},
        "sunday": {"open": "09:00", "close": "18:00", "is_closed": false}
    }'::jsonb,
    
    -- Holiday Calendar Exceptions
    holiday_schedules JSONB NOT NULL DEFAULT '[
        {"holiday_name": "Independence Day", "date": "2026-10-09", "status": "Open Reduced Hours", "hours": "09:00 - 16:00"},
        {"holiday_name": "Christmas Day", "date": "2026-12-25", "status": "Emergency On-Call Only", "hours": "24h Emergency Desk"},
        {"holiday_name": "Boxing Day", "date": "2026-12-26", "status": "Open Reduced Hours", "hours": "10:00 - 18:00"},
        {"holiday_name": "New Year Day", "date": "2027-01-01", "status": "Open Reduced Hours", "hours": "10:00 - 18:00"}
    ]'::jsonb,
    
    -- Fulfillment Capabilities
    delivery_available BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_estimated_time VARCHAR(64) NOT NULL DEFAULT '25 - 40 mins',
    delivery_fee_ugx NUMERIC(10, 2) NOT NULL DEFAULT 3500,
    delivery_coverage_areas TEXT[] DEFAULT ARRAY['Central Kampala', 'Kololo', 'Nakasero', 'Ntinda', 'Naguru', 'Bugolobi'],
    
    pickup_available BOOLEAN NOT NULL DEFAULT TRUE,
    pickup_estimated_time VARCHAR(64) NOT NULL DEFAULT 'Ready in 10 mins',
    pickup_counter_type VARCHAR(64) NOT NULL DEFAULT 'Express Prescription Counter',
    
    -- Night Shift / Duty Pharmacist On-Call
    duty_pharmacist_name VARCHAR(255),
    duty_pharmacist_phone VARCHAR(64),
    duty_pharmacist_psu_no VARCHAR(64),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy patient portal discovery
CREATE INDEX IF NOT EXISTS idx_pharmacy_schedules_district_24h
ON public.pharmacy_operational_schedules (district, is_24_hours_emergency, is_temporarily_closed);

-- RLS
ALTER TABLE public.pharmacy_operational_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to pharmacy operational schedules"
ON public.pharmacy_operational_schedules
FOR SELECT
USING (TRUE);

-- Seed Representative Branches across Uganda
INSERT INTO public.pharmacy_operational_schedules (
    id, tenant_id, pharmacy_id, pharmacy_name, branch_name, district,
    is_24_hours_emergency, is_temporarily_closed, temporary_closure_reason, temporary_closure_reopen_at,
    delivery_available, delivery_estimated_time, delivery_fee_ugx,
    pickup_available, pickup_estimated_time, pickup_counter_type,
    duty_pharmacist_name, duty_pharmacist_phone, duty_pharmacist_psu_no
) VALUES 
(
    '90000000-0000-0000-0000-000000000001', 'client-001', 'PHARM-UG-001', 'ZenithRx Flagship Dispensary', 'Kampala Road Main', 'Kampala',
    TRUE, FALSE, NULL, NULL,
    TRUE, '20 - 30 mins', 3000,
    TRUE, 'Ready in 10 mins', '24/7 Drive-thru & Express Counter',
    'Dr. Arthur Ssenabulya', '+256 701 234567', 'PSU-2021-0892'
),
(
    '90000000-0000-0000-0000-000000000002', 'client-001', 'PHARM-UG-002', 'Victoria Hospital Pharmacy', 'Ntinda Complex', 'Kampala',
    TRUE, FALSE, NULL, NULL,
    TRUE, '25 - 40 mins', 3500,
    TRUE, 'Ready in 15 mins', 'Hospital Outpatient Lobby Desk',
    'Dr. Jane Nabatanzi', '+256 772 889900', 'PSU-2019-0412'
),
(
    '90000000-0000-0000-0000-000000000003', 'client-001', 'PHARM-UG-003', 'Abacus Health Pharmacy', 'Entebbe Airport Highway', 'Wakiso',
    FALSE, FALSE, NULL, NULL,
    TRUE, '35 - 50 mins', 5000,
    TRUE, 'Ready in 10 mins', 'Counter 1 Curbside Pickup',
    'Dr. Richard Mugisha', '+256 782 112233', 'PSU-2020-0715'
),
(
    '90000000-0000-0000-0000-000000000004', 'client-001', 'PHARM-UG-004', 'Medica Pharmacy & Wellness', 'Bugolobi Village Mall', 'Kampala',
    FALSE, TRUE, 'Routine cold-chain refrigeration sanitization & stocktake', NOW() + INTERVAL '3 hours',
    FALSE, 'Temporarily Suspended', 0,
    FALSE, 'Reopens at 2:00 PM', 'Express Pickup',
    'Dr. Grace Kiconco', '+256 703 445566', 'PSU-2022-0981'
),
(
    '90000000-0000-0000-0000-000000000005', 'client-001', 'PHARM-UG-005', 'Nakasero Specialist Dispensary', 'Akii-Bua Road', 'Kampala',
    TRUE, FALSE, NULL, NULL,
    TRUE, '15 - 25 mins (Super Fast)', 3500,
    TRUE, 'Ready in 5 mins', 'Clinical Consultation & Pick-up Room',
    'Dr. Paul Mukasa', '+256 752 998877', 'PSU-2018-0234'
)
ON CONFLICT (pharmacy_id) DO NOTHING;
