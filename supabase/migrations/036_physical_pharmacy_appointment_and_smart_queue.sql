-- ============================================================================
-- Migration 036: Physical Pharmacy Appointment & Smart Queue Management Engine
-- Live Queue Ticket Generation (e.g. Queue #A023), Estimated Wait Time (EWT),
-- Digital Waiting Lounge Display, Audio Chime Calling, and Consultation Integration
-- ============================================================================

-- 1. Consultation Service Categories & Queue Configuration Table
CREATE TABLE IF NOT EXISTS public.pharmacy_queue_categories (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    category_name VARCHAR(255) NOT NULL,
    prefix VARCHAR(8) NOT NULL, -- e.g. 'A' (General Consultation), 'C' (Chronic MTM), 'V' (Vaccination), 'S' (Screening)
    average_duration_minutes INTEGER NOT NULL DEFAULT 15,
    target_counter_room VARCHAR(128) NOT NULL DEFAULT 'Consultation Room 1',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Physical Pharmacy Consultation Queue Tickets Table
CREATE TABLE IF NOT EXISTS public.pharmacy_queue_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    ticket_number VARCHAR(32) NOT NULL, -- e.g. 'A023'
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sequence_number INTEGER NOT NULL,
    
    -- Service & Patient Details
    category_id VARCHAR(64) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    consultation_type VARCHAR(128) NOT NULL,
    patient_id VARCHAR(64),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(64) NOT NULL,
    check_in_channel VARCHAR(64) NOT NULL DEFAULT 'WALK_IN_KIOSK' CHECK (
        check_in_channel IN ('WALK_IN_KIOSK', 'PATIENT_APP', 'RECEPTION_DESK', 'QR_SCAN')
    ),
    patient_notes TEXT,
    priority_level VARCHAR(32) NOT NULL DEFAULT 'STANDARD' CHECK (
        priority_level IN ('STANDARD', 'PRIORITY_ELDERLY', 'PRIORITY_PEDIATRIC', 'EMERGENCY_TRIAGE')
    ),
    
    -- Waiting Time Calculations
    estimated_wait_minutes INTEGER NOT NULL DEFAULT 15,
    patients_ahead_count INTEGER NOT NULL DEFAULT 0,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_time TIMESTAMPTZ,
    consultation_start_time TIMESTAMPTZ,
    consultation_end_time TIMESTAMPTZ,
    actual_wait_minutes NUMERIC(6, 2),
    actual_consultation_minutes NUMERIC(6, 2),
    
    -- Status & Assigned Pharmacist
    ticket_status VARCHAR(64) NOT NULL DEFAULT 'WAITING' CHECK (
        ticket_status IN ('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED')
    ),
    assigned_counter VARCHAR(128),
    assigned_pharmacist_id VARCHAR(64),
    assigned_pharmacist_name VARCHAR(255),
    assigned_pharmacist_license VARCHAR(64),
    
    -- Clinical Outcome Linkage
    clinical_notes TEXT,
    prescriptions_generated TEXT[] DEFAULT '{}',
    referral_made VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for high-performance live queue displays
CREATE INDEX IF NOT EXISTS idx_queue_tickets_tenant_status 
ON public.pharmacy_queue_tickets(tenant_id, queue_date, ticket_status);

CREATE INDEX IF NOT EXISTS idx_queue_tickets_number 
ON public.pharmacy_queue_tickets(ticket_number);

-- RLS Security Policies
ALTER TABLE public.pharmacy_queue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_queue_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read queue categories"
ON public.pharmacy_queue_categories FOR SELECT USING (true);

CREATE POLICY "Tenant isolation for queue tickets"
ON public.pharmacy_queue_tickets FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = 'client-001');

-- Seed Standard Queue Categories
INSERT INTO public.pharmacy_queue_categories (id, tenant_id, category_name, prefix, average_duration_minutes, target_counter_room)
VALUES 
('cat-gen-consult', 'client-001', 'General Pharmacist Consultation', 'A', 15, 'Consultation Room 1'),
('cat-chronic-mtm', 'client-001', 'Chronic Care & Polypharmacy MTM', 'C', 25, 'Clinical MTM Suite'),
('cat-vaccination', 'client-001', 'Vaccination & Injection Clinic', 'V', 10, 'Immunization Bay'),
('cat-screening', 'client-001', 'Health Screening (BP / Glucose / Lipids)', 'S', 12, 'Screening Counter'),
('cat-express-otc', 'client-001', 'Express OTC & Minor Ailments Advice', 'E', 8, 'Express Counter 2')
ON CONFLICT (id) DO NOTHING;

-- Seed Active Queue Tickets
INSERT INTO public.pharmacy_queue_tickets (
    tenant_id,
    ticket_number,
    sequence_number,
    category_id,
    category_name,
    consultation_type,
    patient_name,
    patient_phone,
    check_in_channel,
    patient_notes,
    priority_level,
    estimated_wait_minutes,
    patients_ahead_count,
    check_in_time,
    ticket_status,
    assigned_counter,
    assigned_pharmacist_name
) VALUES 
(
    'client-001',
    'A021',
    21,
    'cat-gen-consult',
    'General Pharmacist Consultation',
    'Medication Review & Dosage Clarification',
    'Kato Emmanuel',
    '+256 704 556677',
    'WALK_IN_KIOSK',
    'Questions on taking new blood pressure tablets with morning breakfast.',
    'STANDARD',
    0,
    0,
    NOW() - INTERVAL '12 minutes',
    'IN_CONSULTATION',
    'Consultation Room 1',
    'Dr. Arthur Ssenabulya (Supervising Pharmacist)'
),
(
    'client-001',
    'A022',
    22,
    'cat-gen-consult',
    'General Pharmacist Consultation',
    'Antibiotic Rash Triage',
    'Aisha Namaganda',
    '+256 752 112233',
    'PATIENT_APP',
    'Developed mild itching rash after starting amoxicillin yesterday.',
    'STANDARD',
    3,
    0,
    NOW() - INTERVAL '8 minutes',
    'CALLED',
    'Consultation Room 1',
    'Dr. Arthur Ssenabulya (Supervising Pharmacist)'
),
(
    'client-001',
    'A023',
    23,
    'cat-gen-consult',
    'General Pharmacist Consultation',
    'Clinical Consultation & Medication Guidance',
    'Robert Mukasa',
    '+256 782 443322',
    'WALK_IN_KIOSK',
    'Patient requested: "I want to consult a pharmacist regarding my diabetes medication schedule."',
    'STANDARD',
    15,
    1,
    NOW() - INTERVAL '2 minutes',
    'WAITING',
    'Consultation Room 1',
    NULL
),
(
    'client-001',
    'C014',
    14,
    'cat-chronic-mtm',
    'Chronic Care & Polypharmacy MTM',
    'Comprehensive Polypharmacy Audit',
    'Sarah Nalubega',
    '+256 772 998877',
    'QR_SCAN',
    'Taking 7 concurrent medications. Needs drug-interaction review.',
    'PRIORITY_ELDERLY',
    25,
    2,
    NOW() - INTERVAL '1 minute',
    'WAITING',
    'Clinical MTM Suite',
    NULL
);
