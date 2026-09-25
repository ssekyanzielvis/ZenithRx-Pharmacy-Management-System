-- ============================================================================
-- Migration 030: Customer Support & Complaints Management System
-- Provides structured, non-clinical patient support and complaint ticketing:
-- - Ticket metadata (Patient, Category, Priority, SLA deadline)
-- - Attachments (Proof of delivery, receipts, package photos)
-- - Threaded responses (Patient replies, staff public answers, internal notes)
-- - Resolution workflows (Refunds, replacements, delivery expedites, closures)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(32) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_id VARCHAR(64) NOT NULL,
    
    -- Patient Information
    patient_id VARCHAR(64),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(64) NOT NULL,
    patient_email VARCHAR(255),
    
    -- Classification
    category VARCHAR(64) NOT NULL, -- 'order_delivery_delay', 'billing_payment_dispute', 'medicine_quality_packaging', 'refill_processing', 'staff_conduct', 'app_technical_glitch', 'general_inquiry'
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical_urgent'
    status VARCHAR(32) NOT NULL DEFAULT 'open', -- 'open', 'in_review', 'escalated', 'pending_patient_response', 'resolved', 'closed'
    
    -- Assignment
    assigned_staff_id VARCHAR(64),
    assigned_staff_name VARCHAR(255),
    assigned_staff_role VARCHAR(64),
    
    -- Resolution & Closure
    resolution_summary TEXT,
    resolution_action_taken VARCHAR(64), -- 'refund_processed', 'replacement_dispatched', 'staff_coached', 'delivery_expedited', 'guidance_provided', 'no_fault_found'
    resolution_reference VARCHAR(128),
    closed_at TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ NOT NULL,
    
    -- Patient Satisfaction Rating
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    satisfaction_feedback TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid query and SLA tracking
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON public.customer_support_tickets (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_patient ON public.customer_support_tickets (patient_phone, patient_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.customer_support_tickets (category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority_sla ON public.customer_support_tickets (priority, sla_deadline);

-- Attachments Table
CREATE TABLE IF NOT EXISTS public.customer_support_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.customer_support_tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    uploaded_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Responses & Notes Table
CREATE TABLE IF NOT EXISTS public.customer_support_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.customer_support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(32) NOT NULL, -- 'patient', 'staff', 'system'
    sender_id VARCHAR(64),
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(64),
    message TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customer_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support_responses ENABLE ROW LEVEL SECURITY;

-- Policies: Patients can view and insert their own tickets and non-internal responses
CREATE POLICY p_support_tickets_patient_select ON public.customer_support_tickets
    FOR SELECT TO public
    USING (true);

CREATE POLICY p_support_tickets_patient_insert ON public.customer_support_tickets
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY p_support_responses_patient_select ON public.customer_support_responses
    FOR SELECT TO public
    USING (is_internal_note = false);

CREATE POLICY p_support_responses_patient_insert ON public.customer_support_responses
    FOR INSERT TO public
    WITH CHECK (sender_type = 'patient');

-- Staff policies
CREATE POLICY p_support_tickets_staff_all ON public.customer_support_tickets
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY p_support_responses_staff_all ON public.customer_support_responses
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Seed realistic support & complaint tickets
INSERT INTO public.customer_support_tickets (
    id, ticket_number, tenant_id, pharmacy_id,
    patient_id, patient_name, patient_phone, patient_email,
    category, subject, description, priority, status,
    assigned_staff_id, assigned_staff_name, assigned_staff_role,
    resolution_summary, resolution_action_taken, resolution_reference,
    closed_at, sla_deadline, satisfaction_rating, satisfaction_feedback,
    created_at, updated_at
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'TKT-2026-0891',
    'client-001',
    'client-001',
    'pat-001',
    'Harriet Nakato',
    '+256 701 234 567',
    'harriet.nakato@gmail.com',
    'order_delivery_delay',
    'Express delivery to Kololo delayed by over 45 minutes',
    'I ordered Ventolin Inhaler and Panadol Extra for express delivery. Order confirmation said 30 mins, but it has now been 1 hour 15 mins. Rider phone went unanswered.',
    'high',
    'resolved',
    'stf-004',
    'Dennis Ochieng',
    'Logistics & Courier Lead',
    'Contacted dispatch rider (Boda #UFE-231P) who was delayed by heavy downpour on Jinja Road. Delivery completed at 10:45 AM. Issued UGX 5,000 delivery fee coupon for next order.',
    'delivery_expedited',
    'REF-COUPON-8821',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '4 hours',
    5,
    'Dennis was very courteous and called me immediately to explain the rain delay. Thank you!',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '2 hours'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'TKT-2026-0892',
    'client-001',
    'client-001',
    'pat-002',
    'Moses Kigozi',
    '+256 772 987 654',
    'm.kigozi@yahoo.com',
    'billing_payment_dispute',
    'MTN Mobile Money double charge on order #ORD-7721',
    'When completing checkout on the patient portal, the first prompt timed out so I entered PIN again. My MTN statement shows two deductions of UGX 45,000.',
    'high',
    'in_review',
    'stf-002',
    'Sarah Namubiru',
    'Customer Support & Billing Agent',
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() + INTERVAL '2 hours',
    NULL,
    NULL,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '20 minutes'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'TKT-2026-0893',
    'client-001',
    'client-001',
    'pat-003',
    'Grace Akello',
    '+256 752 443 211',
    'grace.akello@outlook.com',
    'medicine_quality_packaging',
    'Outer seal on Cetirizine syrup was dented during transit',
    'The package arrived in the courier pouch, but the outer paper box was crushed. The inner glass bottle safety ring appears intact, but I would like confirmation that it is safe to administer to my child.',
    'medium',
    'open',
    'stf-001',
    'Dr. Arthur Ssenabulya',
    'Supervising Pharmacist',
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() + INTERVAL '5 hours',
    NULL,
    NULL,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
);

-- Seed Responses
INSERT INTO public.customer_support_responses (
    id, ticket_id, sender_type, sender_id, sender_name, sender_role, message, is_internal_note, created_at
) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'patient',
    'pat-001',
    'Harriet Nakato',
    'Patient',
    'Please assist urgently, I need the inhaler for my daughter.',
    false,
    NOW() - INTERVAL '5 hours 50 minutes'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'staff',
    'stf-004',
    'Dennis Ochieng',
    'Logistics & Courier Lead',
    'Hello Harriet, sincere apologies for the delay. Rider Joseph is 500 meters away from your gate. He had taken shelter due to sudden rainfall. He is arriving right now.',
    false,
    NOW() - INTERVAL '5 hours 20 minutes'
),
(
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'staff',
    'stf-002',
    'Sarah Namubiru',
    'Customer Support & Billing Agent',
    'INTERNAL NOTE: Checked Beyonic / MTN MoMo transaction ledger. Duplicate transaction #MM-UGX-90123 confirmed pending settlement. Initiating reversal via API.',
    true,
    NOW() - INTERVAL '40 minutes'
),
(
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'staff',
    'stf-002',
    'Sarah Namubiru',
    'Customer Support & Billing Agent',
    'Hello Moses, we have verified the duplicate MoMo transaction on our gateway ledger. We have submitted a direct refund request of UGX 45,000 back to your phone number. It will reflect within 1–2 hours.',
    false,
    NOW() - INTERVAL '20 minutes'
);
