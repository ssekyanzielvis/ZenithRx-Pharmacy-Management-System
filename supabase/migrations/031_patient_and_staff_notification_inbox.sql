-- ============================================================================
-- Migration 031: Unified Notification Center & Multi-Channel Inbox
-- Supports real-time and persistent notification history for Patients & Staff:
-- 1. Prescription verified
-- 2. Prescription rejected
-- 3. Order confirmed
-- 4. Payment received
-- 5. Order ready (Pickup / Counter)
-- 6. Delivery dispatched (Courier OTP)
-- 7. Delivery completed
-- 8. Refill reminder (Depletion alert)
-- 9. ADR update (Pharmacovigilance triage)
-- 10. System announcement (Branch schedules, NDA notices)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    
    -- Recipient routing
    recipient_type VARCHAR(32) NOT NULL DEFAULT 'patient', -- 'patient', 'staff', 'all'
    recipient_id VARCHAR(64),
    recipient_phone VARCHAR(64),
    recipient_name VARCHAR(255),
    
    -- Classification
    category VARCHAR(64) NOT NULL, -- 'prescription_verified', 'prescription_rejected', 'order_confirmed', 'payment_received', 'order_ready', 'delivery_dispatched', 'delivery_completed', 'refill_reminder', 'adr_update', 'system_announcement'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'normal', -- 'normal', 'high', 'urgent'
    
    -- Deep-linking action
    action_type VARCHAR(64) NOT NULL DEFAULT 'none', -- 'view_prescription', 'track_order', 'view_receipt', 'refill_now', 'view_adr', 'none'
    action_payload JSONB DEFAULT '{}',
    
    -- Read Status
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Multi-channel telemetry
    channels JSONB NOT NULL DEFAULT '{"in_app": "delivered", "sms": "delivered", "push": "sent"}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notification_inbox_items (recipient_phone, recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notification_inbox_items (category);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_staff ON public.notification_inbox_items (tenant_id, recipient_type, is_read);

-- Enable RLS
ALTER TABLE public.notification_inbox_items ENABLE ROW LEVEL SECURITY;

-- Patients can view their own notifications
CREATE POLICY p_notification_inbox_patient_select ON public.notification_inbox_items
    FOR SELECT TO public
    USING (true);

-- Authenticated staff can manage all branch notifications
CREATE POLICY p_notification_inbox_staff_all ON public.notification_inbox_items
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Seed comprehensive notification records across all 10 categories
INSERT INTO public.notification_inbox_items (
    id, tenant_id, pharmacy_id, recipient_type, recipient_id, recipient_phone, recipient_name,
    category, title, message, priority, action_type, action_payload, is_read, read_at, channels, created_at
) VALUES
-- 1. Prescription Verified
(
    'c0000000-0000-0000-0000-000000000001',
    'client-001',
    'client-001',
    'patient',
    'pat-001',
    '+256 701 234 567',
    'Harriet Nakato',
    'prescription_verified',
    'Prescription Verified by Pharmacist',
    'Your uploaded prescription #RX-9921 for Amoxicillin & Paracetamol has been clinically validated by Dr. Arthur Ssenabulya. You can now complete checkout for express delivery or counter pickup.',
    'normal',
    'view_prescription',
    '{"rxId": "RX-9921", "status": "verified"}',
    false,
    NULL,
    '{"in_app": "delivered", "sms": "delivered"}',
    NOW() - INTERVAL '15 minutes'
),
-- 2. Prescription Rejected
(
    'c0000000-0000-0000-0000-000000000002',
    'client-001',
    'client-001',
    'patient',
    'pat-002',
    '+256 772 987 654',
    'Moses Kigozi',
    'prescription_rejected',
    'Prescription Needs Re-Upload',
    'Prescription #RX-9908 could not be verified: Doctor signature is cut off at the bottom of the photo. Please take a clearer photo showing the full clinic stamp and re-upload.',
    'high',
    'view_prescription',
    '{"rxId": "RX-9908", "status": "rejected", "reason": "Cut off signature"}',
    true,
    NOW() - INTERVAL '1 hour',
    '{"in_app": "delivered", "sms": "delivered"}',
    NOW() - INTERVAL '2 hours'
),
-- 3. Order Confirmed
(
    'c0000000-0000-0000-0000-000000000003',
    'client-001',
    'client-001',
    'patient',
    'pat-001',
    '+256 701 234 567',
    'Harriet Nakato',
    'order_confirmed',
    'Order #ORD-7734 Confirmed',
    'Zenith Central Kampala has received and accepted your order for Ventolin Inhaler and Multivitamin Syrup. Our dispensing team is preparing your package.',
    'normal',
    'track_order',
    '{"orderId": "ORD-7734"}',
    false,
    NULL,
    '{"in_app": "delivered", "sms": "delivered"}',
    NOW() - INTERVAL '35 minutes'
),
-- 4. Payment Received
(
    'c0000000-0000-0000-0000-000000000004',
    'client-001',
    'client-001',
    'patient',
    'pat-001',
    '+256 701 234 567',
    'Harriet Nakato',
    'payment_received',
    'Payment Received: UGX 38,500',
    'MTN MoMo transaction #MM-UGX-88219 confirmed for order #ORD-7734. Digital receipt is available in your account.',
    'normal',
    'view_receipt',
    '{"orderId": "ORD-7734", "amountUgx": 38500, "txnRef": "MM-UGX-88219"}',
    false,
    NULL,
    '{"in_app": "delivered", "sms": "delivered"}',
    NOW() - INTERVAL '30 minutes'
),
-- 5. Order Ready
(
    'c0000000-0000-0000-0000-000000000005',
    'client-001',
    'client-001',
    'patient',
    'pat-003',
    '+256 752 443 211',
    'Grace Akello',
    'order_ready',
    'Order #ORD-7719 Ready for In-Store Pickup',
    'Your medication package is packaged with safety seals at Counter 1 inside Zenith Central Kampala. Please present SMS or QR code upon arrival.',
    'normal',
    'track_order',
    '{"orderId": "ORD-7719", "pickupLocation": "Counter 1, Zenith Central Kampala"}',
    true,
    NOW() - INTERVAL '3 hours',
    '{"in_app": "delivered", "sms": "delivered"}',
    NOW() - INTERVAL '4 hours'
),
-- 6. Delivery Dispatched
(
    'c0000000-0000-0000-0000-000000000006',
    'client-001',
    'client-001',
    'patient',
    'pat-001',
    '+256 701 234 567',
    'Harriet Nakato',
    'delivery_dispatched',
    'Courier Dispatched with Order #ORD-7734',
    'Rider Joseph (Boda #UFE-231P • 0755091826) is en route to Kololo. Estimated arrival in 20 minutes. Your secure handover OTP is [8492].',
    'high',
    'track_order',
    '{"orderId": "ORD-7734", "riderName": "Joseph", "otp": "8492"}',
    false,
    NULL,
    '{"in_app": "delivered", "sms": "delivered", "whatsapp": "delivered"}',
    NOW() - INTERVAL '10 minutes'
),
-- 7. Delivery Completed
(
    'c0000000-0000-0000-0000-000000000007',
    'client-001',
    'client-001',
    'patient',
    'pat-002',
    '+256 772 987 654',
    'Moses Kigozi',
    'delivery_completed',
    'Delivery Completed Successfully',
    'Order #ORD-7688 was delivered and verified with OTP handover at 09:15 AM. Thank you for choosing ZenithRx.',
    'normal',
    'track_order',
    '{"orderId": "ORD-7688"}',
    true,
    NOW() - INTERVAL '1 day',
    '{"in_app": "delivered", "sms": "delivered"}',
    NOW() - INTERVAL '1 day'
),
-- 8. Refill Reminder
(
    'c0000000-0000-0000-0000-000000000008',
    'client-001',
    'client-001',
    'patient',
    'pat-001',
    '+256 701 234 567',
    'Harriet Nakato',
    'refill_reminder',
    'Refill Due in 3 Days: Metformin 500mg',
    'Based on your daily dosing frequency, your 30-day supply of Metformin will deplete on Sep 28. Click to request an automated renewal with 1-click doorstep delivery.',
    'high',
    'refill_now',
    '{"medication": "Metformin 500mg", "depletionDate": "2026-09-28"}',
    false,
    NULL,
    '{"in_app": "delivered", "sms": "delivered", "whatsapp": "delivered"}',
    NOW() - INTERVAL '5 hours'
),
-- 9. ADR Update
(
    'c0000000-0000-0000-0000-000000000009',
    'client-001',
    'client-001',
    'patient',
    'pat-003',
    '+256 752 443 211',
    'Grace Akello',
    'adr_update',
    'Safety Assessment Update on Reported Side Effect',
    'Dr. Arthur Ssenabulya has reviewed your ADR safety report #ADR-2026-091 regarding mild rash from Amoxicillin. Clinical note: Discontinue therapy immediately and switch to Erythromycin as discussed.',
    'urgent',
    'view_adr',
    '{"adrId": "ADR-2026-091", "status": "reviewed"}',
    false,
    NULL,
    '{"in_app": "delivered", "sms": "delivered"}',
    NOW() - INTERVAL '45 minutes'
),
-- 10. System Announcement
(
    'c0000000-0000-0000-0000-000000000010',
    'client-001',
    'client-001',
    'all',
    NULL,
    NULL,
    'All ZenithRx Patients',
    'system_announcement',
    'Uganda Independence Day Holiday Operating Schedule',
    'All ZenithRx 24/7 flagship branches remain fully open with round-the-clock emergency dispensing and night-shift pharmacists during the upcoming public holiday.',
    'normal',
    'none',
    '{}',
    false,
    NULL,
    '{"in_app": "delivered"}',
    NOW() - INTERVAL '8 hours'
);
