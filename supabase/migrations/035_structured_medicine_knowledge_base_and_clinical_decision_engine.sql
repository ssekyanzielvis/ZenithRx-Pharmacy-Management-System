-- ============================================================================
-- Migration 035: Structured Medicine Knowledge Base & Clinical Decision Engine
-- Distinguishes Reference Information (General Monographs) from Clinical Decision-Making (Patient-Contextual Evaluation)
-- ============================================================================

-- 1. Reference Information Compendium (Pharmacological Monographs)
CREATE TABLE IF NOT EXISTS public.medicine_knowledge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    drug_id VARCHAR(64) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    brand_names TEXT[] NOT NULL DEFAULT '{}',
    therapeutic_class VARCHAR(255) NOT NULL,
    atc_code VARCHAR(32),
    
    -- Structured Reference Fields
    approved_uses TEXT[] NOT NULL DEFAULT '{}',
    off_label_uses TEXT[] DEFAULT '{}',
    dosage_references JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "adult": "...", "pediatric": "...", "geriatric": "...", "renal_adjustment": "...", "max_daily_ceiling": "..." }
    contraindications JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "absolute": [...], "relative": [...] }
    side_effects JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "common": [...], "rare": [...], "black_box": [...] }
    drug_interactions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ "interacting_drug": "...", "mechanism": "...", "severity": "HIGH", "management": "..." }]
    storage_guidelines JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "temp_celsius": "...", "light_sensitive": true, "post_reconstitution": "..." }
    warnings_precautions TEXT[] NOT NULL DEFAULT '{}',
    administration_instructions JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "timing": "...", "with_food": true, "special_instructions": "..." }
    patient_education_handout JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "summary": "...", "key_counseling_points": [...], "missed_dose_guidance": "...", "red_flag_symptoms": [...] }
    
    last_clinical_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_sources TEXT[] DEFAULT '{"Uganda Clinical Guidelines (UCG) 2023", "British National Formulary (BNF 86)", "WHO Model Formulary"}'::text[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast full-text monograph search
CREATE INDEX IF NOT EXISTS idx_medicine_knowledge_generic ON public.medicine_knowledge_entries(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicine_knowledge_class ON public.medicine_knowledge_entries(therapeutic_class);

-- 2. Clinical Decision-Making Contextual Evaluations Log
CREATE TABLE IF NOT EXISTS public.clinical_decision_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'client-001',
    patient_id VARCHAR(64),
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(16),
    patient_egfr NUMERIC(6, 2), -- Estimated Glomerular Filtration Rate (mL/min/1.73m2)
    known_allergies TEXT[] DEFAULT '{}',
    concurrent_medications TEXT[] DEFAULT '{}',
    target_drug_id VARCHAR(64) NOT NULL,
    target_drug_name VARCHAR(255) NOT NULL,
    prescribed_dosage VARCHAR(128) NOT NULL,
    
    -- Clinical Decision Output
    reference_comparison JSONB NOT NULL DEFAULT '{}'::jsonb, -- Comparison against static monograph
    contextual_risks_identified JSONB NOT NULL DEFAULT '[]'::jsonb, -- Patient-specific risks (e.g. CrCl reduction, interaction with Losartan)
    decision_recommendation VARCHAR(64) NOT NULL, -- 'DISPENSE_AS_IS', 'DOSE_ADJUSTMENT_REQUIRED', 'CONTRAINDICATED_SUBSTITUTE', 'COUNSEL_WITH_MONITORING'
    recommended_adjusted_dosage VARCHAR(128),
    pharmacist_rationale TEXT,
    pharmacist_name VARCHAR(255) NOT NULL,
    pharmacist_license VARCHAR(64) NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Security Policies
ALTER TABLE public.medicine_knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_decision_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read medicine knowledge"
ON public.medicine_knowledge_entries
FOR SELECT
USING (true);

CREATE POLICY "Tenant isolation for clinical decision evaluations"
ON public.clinical_decision_evaluations
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = 'client-001');

-- Realistic Seed Monograph 1: Amoxicillin + Clavulanic Acid
INSERT INTO public.medicine_knowledge_entries (
    tenant_id,
    drug_id,
    generic_name,
    brand_names,
    therapeutic_class,
    atc_code,
    approved_uses,
    off_label_uses,
    dosage_references,
    contraindications,
    side_effects,
    drug_interactions,
    storage_guidelines,
    warnings_precautions,
    administration_instructions,
    patient_education_handout
) VALUES (
    'client-001',
    'drug-amox-clav-625',
    'Amoxicillin + Clavulanic Acid (Co-amoxiclav)',
    ARRAY['Augmentin', 'Curam', 'Clavam', 'Amoksiklav'],
    'Beta-Lactam Antibacterial / Penicillin with Beta-Lactamase Inhibitor',
    'J01CR02',
    ARRAY['Acute bacterial sinusitis', 'Community-acquired pneumonia', 'Acute otitis media', 'Complicated urinary tract infections', 'Skin and soft tissue infections', 'Animal bite wound prophylaxis'],
    ARRAY['Dental abscess deep tissue spread', 'Chronic obstructive pulmonary disease (COPD) acute exacerbation'],
    '{
        "adult_standard": "625mg tablet orally every 12 hours (or 1g every 12 hours for severe infections)",
        "pediatric": "25-45 mg/kg/day (based on amoxicillin component) in 2 divided doses 12-hourly",
        "geriatric": "No initial adjustment required unless severe renal impairment is present",
        "renal_adjustment": "CrCl 10-30 mL/min: 625mg 12-hourly; CrCl <10 mL/min: 625mg 24-hourly; Hemodialysis: 625mg during/after dialysis",
        "hepatic_adjustment": "Dose with caution; monitor hepatic function regularly in extended courses",
        "max_daily_ceiling": "Amoxicillin 3000mg / Clavulanate 750mg in 24 hours"
    }'::jsonb,
    '{
        "absolute": ["History of severe penicillin allergy / anaphylaxis", "History of co-amoxiclav associated jaundice or hepatic dysfunction"],
        "relative": ["Infectious mononucleosis (high risk of erythematous morbilliform rash)", "Concurrent allopurinol therapy (increased rash incidence)"]
    }'::jsonb,
    '{
        "common": ["Diarrhea / loose stools (10-15%)", "Nausea & vomiting", "Mucocutaneous candidiasis (thrush)"],
        "rare": ["Cholestatic jaundice / hepatitis (0.05%)", "Clostridioides difficile-associated pseudomembranous colitis", "Erythema multiforme / Stevens-Johnson syndrome"],
        "black_box": ["Severe hypersensitivity / anaphylaxis risk in sensitized individuals"]
    }'::jsonb,
    '[
        {
            "interacting_drug": "Methotrexate",
            "mechanism": "Penicillins inhibit renal tubular secretion of methotrexate",
            "severity": "HIGH",
            "management": "Avoid co-administration; monitor methotrexate serum levels and hematological toxicity"
        },
        {
            "interacting_drug": "Oral Anticoagulants (Warfarin)",
            "mechanism": "Alteration of intestinal flora leading to decreased Vitamin K synthesis",
            "severity": "MEDIUM",
            "management": "Monitor INR closely upon initiating and discontinuing co-amoxiclav"
        },
        {
            "interacting_drug": "Allopurinol",
            "mechanism": "Increased incidence of hypersensitivity cutaneous rashes",
            "severity": "LOW",
            "management": "Advise patient to report any skin rash immediately"
        }
    ]'::jsonb,
    '{
        "temperature_celsius": "Store below 25°C in a dry place protected from moisture",
        "light_sensitive": false,
        "hygroscopic": true,
        "post_reconstitution_suspension": "Oral suspension must be refrigerated at 2°C - 8°C and discarded after 7 days"
    }'::jsonb,
    ARRAY[
        'Prolonged use may result in overgrowth of non-susceptible organisms or fungi',
        'Maintain adequate fluid intake to avoid amoxicillin crystalluria',
        'Use with caution in patients with hepatic impairment'
    ],
    '{
        "timing": "Take at the start of a meal or with food",
        "with_food": true,
        "special_instructions": "Taking with food significantly reduces gastrointestinal intolerance (nausea/diarrhea) and optimizes clavulanate absorption. Complete full 7-day course even if symptoms improve."
    }'::jsonb,
    '{
        "summary": "Co-amoxiclav is an antibiotic used to treat bacterial infections of the lungs, sinuses, ears, skin, and urinary tract.",
        "key_counseling_points": [
            "Take each tablet with the first bite of a meal to prevent stomach upset.",
            "Space your doses evenly (every 12 hours) throughout the day.",
            "Finish the entire course prescribed by your doctor even if you feel completely better.",
            "Inform your pharmacist immediately if you develop a rash or watery diarrhea."
        ],
        "missed_dose_guidance": "Take the missed dose as soon as you remember with a snack. If it is almost time for your next dose, skip the missed dose and resume normal schedule. Never take 2 doses at once.",
        "red_flag_symptoms": [
            "Swelling of face, lips, tongue or difficulty breathing (Seek Emergency ER immediately)",
            "Severe watery diarrhea with stomach cramps and fever",
            "Yellowing of skin or eyes (jaundice)"
        ]
    }'::jsonb
);

-- Realistic Seed Monograph 2: Metformin Hydrochloride
INSERT INTO public.medicine_knowledge_entries (
    tenant_id,
    drug_id,
    generic_name,
    brand_names,
    therapeutic_class,
    atc_code,
    approved_uses,
    off_label_uses,
    dosage_references,
    contraindications,
    side_effects,
    drug_interactions,
    storage_guidelines,
    warnings_precautions,
    administration_instructions,
    patient_education_handout
) VALUES (
    'client-001',
    'drug-metformin-500',
    'Metformin Hydrochloride',
    ARRAY['Glucophage', 'Formet', 'Diabex', 'Siofor'],
    'Oral Biguanide Antihyperglycemic Agent',
    'A10BA02',
    ARRAY['Type 2 Diabetes Mellitus monotherapy or combination', 'Prediabetes / impaired glucose tolerance prevention'],
    ARRAY['Polycystic Ovary Syndrome (PCOS) insulin resistance & ovulatory induction', 'Gestational diabetes second-line'],
    '{
        "adult_standard": "Initiate 500mg once or twice daily with meals; titrate weekly up to 1000mg twice daily (or 850mg 3 times daily)",
        "pediatric": "Children >=10 years: 500mg daily, titrate to max 2000mg/day in divided doses",
        "geriatric": "Assess baseline eGFR before initiating; avoid if eGFR <30 mL/min; conservative titration",
        "renal_adjustment": "eGFR 45-59 mL/min: Max 1000mg/day; eGFR 30-44 mL/min: Max 500mg/day; eGFR <30 mL/min: STRICTLY CONTRAINDICATED (lactic acidosis risk)",
        "hepatic_adjustment": "Avoid in acute or severe hepatic impairment due to impaired lactate clearance",
        "max_daily_ceiling": "2550mg per day (immediate-release) or 2000mg per day (extended-release)"
    }'::jsonb,
    '{
        "absolute": ["Severe renal impairment (eGFR <30 mL/min)", "Acute or chronic metabolic acidosis / diabetic ketoacidosis", "Severe tissue hypoxia (decompensated heart failure, cardiogenic shock, sepsis)"],
        "relative": ["Iodinated radiocontrast procedures (withhold 48h before and after)", "Excessive acute alcohol ingestion"]
    }'::jsonb,
    '{
        "common": ["Gastrointestinal disturbances (diarrhea, abdominal cramps, nausea, flatulence) (20-30%)", "Metallic taste in mouth", "Long-term Vitamin B12 deficiency (7-10%)"],
        "rare": ["Lactic acidosis (0.03 cases per 1000 patient-years, high mortality if untreated)", "Hemolytic anemia"],
        "black_box": ["Lactic Acidosis warning: Risk increases with renal impairment, sepsis, dehydration, and hypoxemia."]
    }'::jsonb,
    '[
        {
            "interacting_drug": "Iodinated Radiocontrast Media",
            "mechanism": "Contrast-induced acute renal failure leading to toxic metformin accumulation and lactic acidosis",
            "severity": "CRITICAL",
            "management": "Discontinue metformin prior to or at time of imaging; re-evaluate eGFR 48 hours post-procedure before resuming"
        },
        {
            "interacting_drug": "Cimetidine / Ranolazine / Ciprofloxacin",
            "mechanism": "Inhibition of renal OCT2 / MATE transporters increases metformin AUC by 40-60%",
            "severity": "MEDIUM",
            "management": "Monitor blood glucose and signs of lactic acidosis; consider lower metformin dosage"
        },
        {
            "interacting_drug": "Alcohol (Ethanol)",
            "mechanism": "Ethanol potentiates metformin effect on lactate metabolism and impairs gluconeogenesis",
            "severity": "HIGH",
            "management": "Warn patient against binge drinking or chronic excessive alcohol consumption"
        }
    ]'::jsonb,
    '{
        "temperature_celsius": "Store at 15°C - 30°C in a tightly closed container",
        "light_sensitive": false,
        "hygroscopic": false,
        "post_reconstitution_suspension": "N/A (Solid oral dosage form)"
    }'::jsonb,
    ARRAY[
        'Assess renal function (eGFR) annually in all patients and bi-annually in elderly/high-risk patients',
        'Temporary discontinuation recommended during severe acute illness involving dehydration or hypoxemia',
        'Annual screening for Vitamin B12 deficiency recommended in patients on long-term therapy (>3 years)'
    ],
    '{
        "timing": "Take with or immediately after main meals (breakfast and dinner)",
        "with_food": true,
        "special_instructions": "Swallow extended-release tablets whole; do not crush or chew. Take with meals to minimize stomach upset and diarrhea."
    }'::jsonb,
    '{
        "summary": "Metformin is a first-line daily medicine that helps control blood sugar levels by improving how your body responds to insulin.",
        "key_counseling_points": [
            "Always take with meals to reduce stomach discomfort and loose stools.",
            "Stomach upset is common during the first 2 weeks but usually fades as your body adapts.",
            "Stay well hydrated throughout the day, especially in hot weather or during workouts.",
            "Do not consume heavy alcohol while taking metformin."
        ],
        "missed_dose_guidance": "Take your missed dose with your next meal. If it is already time for your next scheduled dose, take only that dose. Never take two doses to make up for a missed one.",
        "red_flag_symptoms": [
            "Unusual muscle pain, extreme weakness, trouble breathing, or severe cold feeling (Lactic Acidosis warning - seek ER immediately)",
            "Persistent severe nausea, vomiting, or dehydration"
        ]
    }'::jsonb
);
