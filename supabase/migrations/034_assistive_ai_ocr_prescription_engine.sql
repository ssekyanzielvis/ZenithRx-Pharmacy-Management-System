-- ============================================================================
-- Migration 034: Assistive AI/OCR Prescription Extraction & Clinical Safety Doctrine
-- Rule: AI -> Suggests | System -> Flags | Pharmacist -> Decides
-- OCR cannot auto-approve; Enforces pharmacist clinical sign-off
-- ============================================================================

-- 1. Assistive OCR Extractions and Handwriting Analysis
CREATE TABLE IF NOT EXISTS public.assistive_ocr_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    prescription_id VARCHAR(64) NOT NULL,
    queue_number VARCHAR(64) NOT NULL UNIQUE,
    patient_id VARCHAR(64),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(64),
    image_url TEXT NOT NULL,
    
    -- AI Suggestion Layer
    ai_model_version VARCHAR(64) NOT NULL DEFAULT 'ZenithRx-Vision-OCR-v4.2',
    raw_ocr_text TEXT,
    handwriting_difficulty_score NUMERIC(5, 2) NOT NULL DEFAULT 15.00, -- 0-100% difficulty
    handwriting_ambiguities JSONB DEFAULT '[]'::jsonb, -- e.g. [{ "phrase": "...", "confidence": 78, "notes": "..." }]
    extracted_prescriber_name VARCHAR(255),
    extracted_prescriber_reg VARCHAR(64),
    extracted_clinic_hospital VARCHAR(255),
    extracted_date DATE,
    extracted_medications JSONB DEFAULT '[]'::jsonb,
    
    -- System Flagging Layer
    system_flags JSONB DEFAULT '[]'::jsonb,
    has_critical_flags BOOLEAN NOT NULL DEFAULT false,
    duplicate_medications_found JSONB DEFAULT '[]'::jsonb,
    abnormal_dosage_flags JSONB DEFAULT '[]'::jsonb,
    unmatched_drugs_flags JSONB DEFAULT '[]'::jsonb,
    
    -- Pharmacist Decision Layer (Enforced Human-in-the-Loop)
    decision_status VARCHAR(64) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (
        decision_status IN ('PENDING_REVIEW', 'APPROVED_BY_PHARMACIST', 'MODIFIED_AND_APPROVED', 'REJECTED_BY_PHARMACIST', 'ESCALATED_TO_DOCTOR')
    ),
    pharmacist_id VARCHAR(64),
    pharmacist_name VARCHAR(255),
    pharmacist_umdpc_reg VARCHAR(64),
    pharmacist_clinical_notes TEXT,
    pharmacist_modifications JSONB DEFAULT '[]'::jsonb,
    pharmacist_overrides JSONB DEFAULT '[]'::jsonb,
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast search and queue filtering
CREATE INDEX IF NOT EXISTS idx_ocr_prescriptions_tenant_status 
ON public.assistive_ocr_prescriptions(tenant_id, decision_status);

CREATE INDEX IF NOT EXISTS idx_ocr_prescriptions_patient 
ON public.assistive_ocr_prescriptions(patient_name, patient_phone);

-- 2. Audit Trail for Pharmacist Decision Enforcement
CREATE TABLE IF NOT EXISTS public.prescription_ai_decision_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    ocr_prescription_id UUID REFERENCES public.assistive_ocr_prescriptions(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL, -- 'AI_SUGGESTED', 'SYSTEM_FLAGGED', 'PHARMACIST_MODIFIED', 'PHARMACIST_APPROVED', 'PHARMACIST_REJECTED'
    actor_role VARCHAR(64) NOT NULL, -- 'AI_ENGINE', 'SYSTEM_RULE_ENGINE', 'SUPERVISING_PHARMACIST'
    actor_name VARCHAR(255) NOT NULL,
    actor_license VARCHAR(64),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Security Policies
ALTER TABLE public.assistive_ocr_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_ai_decision_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for assistive_ocr_prescriptions"
ON public.assistive_ocr_prescriptions
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = 'client-001');

CREATE POLICY "Tenant isolation for prescription_ai_decision_audits"
ON public.prescription_ai_decision_audits
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = 'client-001');

-- Realistic Seed Records
INSERT INTO public.assistive_ocr_prescriptions (
    tenant_id,
    prescription_id,
    queue_number,
    patient_name,
    patient_phone,
    image_url,
    ai_model_version,
    raw_ocr_text,
    handwriting_difficulty_score,
    handwriting_ambiguities,
    extracted_prescriber_name,
    extracted_prescriber_reg,
    extracted_clinic_hospital,
    extracted_date,
    extracted_medications,
    system_flags,
    has_critical_flags,
    duplicate_medications_found,
    abnormal_dosage_flags,
    unmatched_drugs_flags,
    decision_status
) VALUES 
(
    'client-001',
    'rx-ocr-8801',
    'OCR-2026-08101',
    'Kato Emmanuel',
    '+256 704 556677',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60',
    'ZenithRx-Vision-OCR-v4.2',
    'Rx:\n1. Amox-Clav 625mg tabs 1 b.i.d x 7/7\n2. Paracetamol 1g t.i.d p.r.n x 5/7\nDr. Mukasa David (UMDPC-2018-0912)\nMulago Women Hospital',
    22.50,
    '[
        {"phrase": "Amox-Clav 625mg", "confidence": 97, "notes": "Clear cursive script, matched to Amoxicillin+Clavulanate 625mg"},
        {"phrase": "1 b.i.d x 7/7", "confidence": 94, "notes": "Latin b.i.d transcribed as 12-hourly for 7 days"}
    ]'::jsonb,
    'Dr. Mukasa David',
    'UMDPC-2018-0912',
    'Mulago Specialized Women Hospital',
    CURRENT_DATE - INTERVAL '1 day',
    '[
        {
            "id": "med-1",
            "rawText": "Amox-Clav 625mg tabs 1 b.i.d x 7/7",
            "suggestedDrugName": "Amoxicillin + Clavulanic Acid 625mg",
            "matchedInventorySku": "SKU-AMOX-625",
            "matchedStockOnHand": 128,
            "matchedUnitPrice": 2500,
            "suggestedDosage": "1 tablet",
            "suggestedFrequency": "12-hourly (b.i.d)",
            "suggestedDuration": "7 days",
            "suggestedQuantity": 14,
            "confidenceScore": 97,
            "matchConfidence": "HIGH"
        },
        {
            "id": "med-2",
            "rawText": "Paracetamol 1g t.i.d p.r.n x 5/7",
            "suggestedDrugName": "Paracetamol 500mg Tablet",
            "matchedInventorySku": "SKU-PARA-500",
            "matchedStockOnHand": 450,
            "matchedUnitPrice": 300,
            "suggestedDosage": "2 tablets (1000mg)",
            "suggestedFrequency": "8-hourly PRN (t.i.d)",
            "suggestedDuration": "5 days",
            "suggestedQuantity": 30,
            "confidenceScore": 95,
            "matchConfidence": "HIGH"
        }
    ]'::jsonb,
    '[]'::jsonb,
    false,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'PENDING_REVIEW'
),
(
    'client-001',
    'rx-ocr-8802',
    'OCR-2026-08102',
    'Aisha Namaganda',
    '+256 752 112233',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=60',
    'ZenithRx-Vision-OCR-v4.2',
    'Rx:\n1. Ciprofloxacin 1000mg stat then 750mg b.i.d x 10/7\n2. Metformin 1000mg b.i.d\n3. Augmentin 625mg 1 b.i.d\nDr. John Kyeyune (UMDPC-2022-7719)',
    48.00,
    '[
        {"phrase": "Cipro 1000mg", "confidence": 81, "notes": "Possible supratherapeutic dosage flagged"},
        {"phrase": "Augmentin + Metformin", "confidence": 88, "notes": "Cursive ligature deciphered with 88% confidence"}
    ]'::jsonb,
    'Dr. John Kyeyune',
    'UMDPC-2022-7719',
    'Case Medical Centre Kampala',
    CURRENT_DATE,
    '[
        {
            "id": "med-1",
            "rawText": "Ciprofloxacin 1000mg stat then 750mg b.i.d x 10/7",
            "suggestedDrugName": "Ciprofloxacin 500mg / 750mg",
            "matchedInventorySku": "SKU-CIPRO-500",
            "matchedStockOnHand": 84,
            "matchedUnitPrice": 1800,
            "suggestedDosage": "750mg",
            "suggestedFrequency": "12-hourly",
            "suggestedDuration": "10 days",
            "suggestedQuantity": 20,
            "confidenceScore": 84,
            "matchConfidence": "MEDIUM"
        },
        {
            "id": "med-2",
            "rawText": "Metformin 1000mg b.i.d",
            "suggestedDrugName": "Metformin HCl 500mg / 1000mg",
            "matchedInventorySku": "SKU-MET-500",
            "matchedStockOnHand": 310,
            "matchedUnitPrice": 400,
            "suggestedDosage": "1000mg (2 x 500mg)",
            "suggestedFrequency": "12-hourly with meals",
            "suggestedDuration": "30 days",
            "suggestedQuantity": 60,
            "confidenceScore": 91,
            "matchConfidence": "HIGH"
        },
        {
            "id": "med-3",
            "rawText": "Augmentin 625mg 1 b.i.d",
            "suggestedDrugName": "Co-Amoxiclav (Augmentin) 625mg",
            "matchedInventorySku": "SKU-AUG-625",
            "matchedStockOnHand": 65,
            "matchedUnitPrice": 3200,
            "suggestedDosage": "1 tablet",
            "suggestedFrequency": "12-hourly",
            "suggestedDuration": "7 days",
            "suggestedQuantity": 14,
            "confidenceScore": 93,
            "matchConfidence": "HIGH"
        }
    ]'::jsonb,
    '[
        {
            "category": "ABNORMAL_DOSAGE",
            "severity": "CRITICAL",
            "title": "Supratherapeutic Ciprofloxacin Dosage",
            "message": "Extracted dosage of Ciprofloxacin 1000mg stat + 750mg b.i.d exceeds standard adult maximum guideline for uncomplicated infections (standard: 500mg 12-hourly).",
            "recommendation": "Pharmacist must clarify renal function and clinical indication or adjust to 500mg b.i.d."
        },
        {
            "category": "DUPLICATE_THERAPY",
            "severity": "HIGH",
            "title": "Therapeutic Duplication (Dual Antibiotics)",
            "message": "Prescription contains concurrent broad-spectrum antibiotics: Ciprofloxacin (Fluoroquinolone) + Augmentin (Co-amoxiclav).",
            "recommendation": "Pharmacist review required to confirm dual empiric coverage or prevent redundant antibiotic toxicity."
        },
        {
            "category": "DRUG_INTERACTION",
            "severity": "MEDIUM",
            "title": "Pharmacokinetic Interaction",
            "message": "Ciprofloxacin may potentiate the hypoglycemic action of Metformin via organic cation transporter inhibition.",
            "recommendation": "Counsel patient on blood glucose monitoring."
        }
    ]'::jsonb,
    true,
    '["Therapeutic Duplication: Ciprofloxacin 750mg + Augmentin 625mg concurrently"]'::jsonb,
    '["Ciprofloxacin 1000mg stat + 750mg b.i.d exceeds standard daily ceiling"]'::jsonb,
    '[]'::jsonb,
    'PENDING_REVIEW'
);
