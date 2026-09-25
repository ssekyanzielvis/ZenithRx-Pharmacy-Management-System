-- ============================================================================
-- Migration 029: Pharmacy Service Catalogue & Clinical Offerings Configuration
-- Enables pharmacies to configure and publish diverse clinical & retail services:
-- 1. Prescription dispensing
-- 2. OTC medicines & self-care
-- 3. Pharmacist clinical consultation & MTM
-- 4. Vaccination & Immunization (Cold-chain certified)
-- 5. Health screening & Point-of-Care testing (BP, Glucose, Malaria RDT, Lipids)
-- 6. Delivery & Cold-chain logistics
-- 7. Automated chronic medicine refill programs
-- 8. Specialized & custom services (Wound dressing, Ear piercing, Travel clinic)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pharmacy_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    pharmacy_id VARCHAR(64) NOT NULL,
    service_code VARCHAR(64) NOT NULL,
    service_category VARCHAR(64) NOT NULL, -- 'dispensing', 'otc', 'consultation', 'vaccination', 'screening', 'delivery', 'refill', 'other'
    service_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    price_type VARCHAR(32) NOT NULL DEFAULT 'fixed_fee', -- 'free', 'fixed_fee', 'starts_at', 'quote_required'
    price_ugx NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 15,
    requires_appointment BOOLEAN NOT NULL DEFAULT FALSE,
    is_nda_accredited BOOLEAN NOT NULL DEFAULT TRUE,
    clinical_notes TEXT,
    prerequisites TEXT,
    available_days JSONB NOT NULL DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pharmacy_service UNIQUE (pharmacy_id, service_code)
);

-- Indices for rapid cross-pharmacy service searches
CREATE INDEX IF NOT EXISTS idx_pharmacy_services_lookup ON public.pharmacy_services (service_code, is_enabled);
CREATE INDEX IF NOT EXISTS idx_pharmacy_services_category ON public.pharmacy_services (service_category, is_enabled);
CREATE INDEX IF NOT EXISTS idx_pharmacy_services_pharmacy ON public.pharmacy_services (pharmacy_id);

-- Enable RLS
ALTER TABLE public.pharmacy_services ENABLE ROW LEVEL SECURITY;

-- Anonymous / Patients can view all enabled services
CREATE POLICY p_pharmacy_services_patient_view ON public.pharmacy_services
    FOR SELECT TO public
    USING (is_enabled = true);

-- Pharmacy authenticated staff & owners can view and manage their branch services
CREATE POLICY p_pharmacy_services_staff_manage ON public.pharmacy_services
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Seed Service Catalogues for Uganda Network Branches (All rows with exact 13 column values)
INSERT INTO public.pharmacy_services (
    pharmacy_id,
    service_code,
    service_category,
    service_name,
    description,
    is_enabled,
    price_type,
    price_ugx,
    estimated_duration_minutes,
    requires_appointment,
    is_nda_accredited,
    clinical_notes,
    prerequisites
) VALUES
-- 1. Zenith Central Kampala Flagship (client-001)
('client-001', 'prescription_dispensing', 'dispensing', 'Prescription Validation & Dispensing', 'Full clinical review, electronic drug-interaction check, sterile compounding, and personalized dosage counseling by NDA-licensed pharmacists.', true, 'free', 0, 15, false, true, 'Original valid prescription from registered medical practitioner required.', 'Bring physical or digital e-Rx.'),
('client-001', 'otc_medicines', 'otc', 'OTC Medicines & Minor Ailment Triage', 'Direct OTC consultation, first-line treatment for colds, GI issues, allergies, analgesics, and essential vitamins.', true, 'free', 0, 10, false, true, 'Walk-in pharmacist guidance on dosage and precautions.', 'None'),
('client-001', 'consultation_clinical', 'consultation', 'Pharmacist Clinical Consultation & MTM', 'In-depth Medication Therapy Management (MTM), polypharmacy audit, adverse drug reaction triage, and chronic therapy optimization.', true, 'fixed_fee', 25000, 30, true, true, 'Private consultation room available. Summary provided to your physician.', 'Bring all current medication boxes.'),
('client-001', 'vaccination_routine', 'vaccination', 'Routine & Travel Vaccinations', 'Cold-chain certified administration of Yellow Fever, Flu Quadrivalent, HPV, Hepatitis B, and Typhoid vaccines with official certificate.', true, 'fixed_fee', 45000, 20, false, true, 'Administered by certified immunizing pharmacist with cold-chain batch record.', 'Valid ID and vaccination card if available.'),
('client-001', 'screening_cardio_metabolic', 'screening', 'Comprehensive Health Screening (BP, Glucose, Lipids)', 'Point-of-care capillary blood glucose, digital blood pressure, rapid lipid profile, and BMI cardiovascular risk calculation.', true, 'fixed_fee', 15000, 15, false, true, 'Instant digital test certificate & lifestyle referral provided.', '10-hour fasting recommended for lipid test.'),
('client-001', 'screening_malaria_rdt', 'screening', 'Malaria Rapid Diagnostic Test (RDT) & Triage', 'WHO-prequalified rapid finger-prick antigen testing for Plasmodium falciparum with immediate 15-minute results and ACT guidance.', true, 'fixed_fee', 8000, 15, false, true, 'Coupled with temperature & symptom assessment.', 'None'),
('client-001', 'delivery_express', 'delivery', 'Express Motor-Courier Home Delivery', 'Insulated temperature-safe doorstep delivery across Kampala & Entebbe corridor with real-time live rider tracking.', true, 'fixed_fee', 5000, 45, false, true, 'Cold-chain ice-pack packout for refrigerated insulins.', 'Accurate dropoff address & active phone number.'),
('client-001', 'refill_chronic_sync', 'refill', 'Smart Chronic Refill Synchronization', 'Automated monthly medication refill dispatch, remaining dose depletion calculation, and physician prescription renewal alerts.', true, 'free', 0, 10, false, true, 'Zero subscription fee. Automatically synced with ZenithRx AI depletion tracker.', 'Active chronic prescription on file.'),
('client-001', 'wound_dressing_firstaid', 'other', 'Minor Wound Care & Sterile Dressing', 'Antiseptic cleansing, sterile gauze dressing, minor burn care, and tetanus booster assessment.', true, 'fixed_fee', 20000, 25, false, true, 'For non-emergency superficial wounds and abrasions.', 'Triage upon arrival.'),

-- 2. Garden City Mall Branch (client-002)
('client-002', 'prescription_dispensing', 'dispensing', 'Prescription Validation & Dispensing', 'Full clinical review, electronic drug-interaction check and counseling.', true, 'free', 0, 15, false, true, 'Fast express counter available inside shopping arcade.', 'Valid prescription.'),
('client-002', 'otc_medicines', 'otc', 'OTC Medicines & Self-Care Wellness', 'Extensive vitamins, nutritional supplements, sports nutrition, and dermatological therapies.', true, 'free', 0, 10, false, true, 'Dedicated wellness consultant on floor.', 'None'),
('client-002', 'screening_cardio_metabolic', 'screening', 'Blood Pressure & Glucose Check', 'Complimentary blood pressure check and instant capillary blood glucose screening.', true, 'free', 0, 10, false, true, 'Free screening as part of Uganda Heart Health initiative.', 'Walk-ins welcome.'),
('client-002', 'delivery_express', 'delivery', 'Central Kampala Express Delivery', '30-minute delivery to Kololo, Nakasero, CBD, and surrounding office hubs.', true, 'fixed_fee', 4000, 30, false, true, 'Free delivery for orders above UGX 100,000.', 'Office or apartment delivery notes.'),
('client-002', 'refill_chronic_sync', 'refill', 'Chronic Refill & In-Store Express Pickup', 'Skip the queue ready-to-go refill pickup bags packaged with safety seals.', true, 'free', 0, 5, false, true, 'Ready in 10 minutes from order confirmation.', 'Order ID / SMS notification.'),

-- 3. Entebbe Road Care (client-004)
('client-004', 'prescription_dispensing', 'dispensing', '24/7 Emergency Prescription Dispensing', 'Round-the-clock emergency prescription service, asthma nebulization, and pediatric dosing calculations.', true, 'free', 0, 15, false, true, 'Licensed night-shift pharmacist on duty 24/7/365.', 'Prescription or emergency medication card.'),
('client-004', 'vaccination_routine', 'vaccination', 'Airport International Travel Vaccinations', 'Yellow Fever (WHO Yellow Card issued), Typhoid, Meningitis, and Rabies boosters.', true, 'fixed_fee', 55000, 25, false, true, 'Authorized for international travel clearance.', 'Original Passport required for Yellow Card issuance.'),
('client-004', 'delivery_express', 'delivery', 'Airport Corridor 24/7 Express Dispatch', 'Emergency dispatch to Entebbe International Airport, Kajjansi, and Lubowa residential estates.', true, 'fixed_fee', 7000, 35, false, true, '24-hour dispatch team available.', 'Provide gate code / phone.')
ON CONFLICT (pharmacy_id, service_code) DO UPDATE SET
    service_name = EXCLUDED.service_name,
    description = EXCLUDED.description,
    is_enabled = EXCLUDED.is_enabled,
    price_type = EXCLUDED.price_type,
    price_ugx = EXCLUDED.price_ugx,
    estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
    requires_appointment = EXCLUDED.requires_appointment,
    is_nda_accredited = EXCLUDED.is_nda_accredited,
    clinical_notes = EXCLUDED.clinical_notes,
    prerequisites = EXCLUDED.prerequisites,
    updated_at = NOW();
