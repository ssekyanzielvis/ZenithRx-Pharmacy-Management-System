-- ============================================================================
-- ZenithRx Deep Medicine Master Data: Products + Formulations + Packaging (§7, §8)
-- ============================================================================

-- 1. Create Enums for Drug Master Classification
DO $$ BEGIN
    CREATE TYPE prescription_legal_status AS ENUM (
        'pom',        -- Prescription Only Medicine
        'otc',        -- Over The Counter
        'pharmacy_p', -- Pharmacy Only Medicine
        'hospital_only'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE controlled_schedule_type AS ENUM (
        'non_controlled',
        'class_a_narcotic',
        'class_b_psychotropic',
        'precursor_chemical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE storage_temperature_class AS ENUM (
        'room_temperature_15_25',
        'controlled_room_15_30',
        'cold_chain_2_8',
        'frozen_below_minus_15',
        'cool_below_20'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pregnancy_safety_category AS ENUM (
        'category_a',
        'category_b',
        'category_c',
        'category_d',
        'category_x',
        'not_classified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE medicine_lifecycle_status AS ENUM (
        'active',
        'inactive',
        'discontinued',
        'under_review'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Core Master Medicines Table (Product + Formulation + Packaging Hierarchy)
CREATE TABLE IF NOT EXISTS public.master_medicines_v2 (
    id VARCHAR(64) PRIMARY KEY,
    product_group_id VARCHAR(64) NOT NULL, -- Logical group (e.g. PROD-PARACETAMOL)
    
    -- Names & Identifiers
    generic_inn_name VARCHAR(255) NOT NULL, -- e.g. Paracetamol / Acetaminophen
    brand_name VARCHAR(255) NOT NULL,       -- e.g. Panadol Extra / Calpol
    active_ingredients TEXT[] NOT NULL DEFAULT '{}', -- e.g. ["Paracetamol 500mg", "Caffeine 65mg"]
    atc_classification_code VARCHAR(32) NOT NULL, -- e.g. N02BE01
    nda_registration_number VARCHAR(64) NOT NULL UNIQUE, -- e.g. NDA/MAL/0891/2021
    therapeutic_category VARCHAR(128) NOT NULL, -- e.g. Analgesics & Antipyretics
    
    -- Formulation Posology
    strength VARCHAR(64) NOT NULL,         -- e.g. 500 mg, 120 mg/5 mL, 625 mg
    dosage_form VARCHAR(64) NOT NULL,      -- e.g. Tablet, Oral Suspension, IV Infusion, Metered Dose Inhaler
    route_of_administration VARCHAR(64) NOT NULL, -- e.g. Oral, Intravenous, Topical, Inhalation
    
    -- Packaging Structure
    package_size VARCHAR(128) NOT NULL,    -- e.g. Box of 100 (10x10 Blister), Bottle of 100 mL
    package_type VARCHAR(64) NOT NULL,     -- e.g. Blister Pack, Amber Glass Bottle, HDPE Bottle, Vial
    unit_of_measure VARCHAR(32) NOT NULL,  -- e.g. tablets, capsules, mL, ampoules, doses
    pack_quantity INTEGER NOT NULL DEFAULT 1, -- e.g. 100 tablets per pack
    
    -- Manufacturer Demographics
    manufacturer_name VARCHAR(255) NOT NULL, -- e.g. Cipla Quality Chemicals Uganda, GlaxoSmithKline
    country_of_manufacture VARCHAR(128) NOT NULL, -- e.g. Uganda, Kenya, UK, India, Germany
    
    -- Regulatory & Classification
    prescription_status prescription_legal_status NOT NULL DEFAULT 'pom',
    controlled_status controlled_schedule_type NOT NULL DEFAULT 'non_controlled',
    
    -- Inventory & Reorder Thresholds
    minimum_stock_level INTEGER NOT NULL DEFAULT 50,
    maximum_stock_level INTEGER NOT NULL DEFAULT 1000,
    reorder_trigger_level INTEGER NOT NULL DEFAULT 100,
    reorder_quantity INTEGER NOT NULL DEFAULT 200,
    
    -- Pricing
    average_wholesale_price_ugx BIGINT NOT NULL DEFAULT 0,
    suggested_retail_price_ugx BIGINT NOT NULL DEFAULT 0,
    
    -- Storage & Environmental Controls
    storage_temperature storage_temperature_class NOT NULL DEFAULT 'room_temperature_15_25',
    storage_instructions TEXT NOT NULL DEFAULT 'Store below 25°C in a dry place. Protect from moisture.',
    is_light_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    is_cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    special_handling_requirements TEXT, -- e.g. Cytotoxic hazard, Poison Safe, Shake well before use
    
    -- Clinical Safety Profile
    pregnancy_category pregnancy_safety_category NOT NULL DEFAULT 'category_b',
    pregnancy_warning TEXT,
    age_restrictions TEXT, -- e.g. Not recommended for children under 12 years
    pediatric_dose_guide TEXT,
    adult_standard_dose TEXT,
    max_daily_dose_mg NUMERIC(10,2),
    blackbox_warning TEXT,
    documented_allergies TEXT[] DEFAULT '{}',
    contraindications TEXT[] DEFAULT '{}',
    counseling_points TEXT,
    
    -- Lifecycle Status
    status medicine_lifecycle_status NOT NULL DEFAULT 'active',
    is_nda_verified BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for Instant Searching & Multi-Axis Filtering
CREATE INDEX IF NOT EXISTS idx_med_inn_name ON public.master_medicines_v2(generic_inn_name);
CREATE INDEX IF NOT EXISTS idx_med_brand_name ON public.master_medicines_v2(brand_name);
CREATE INDEX IF NOT EXISTS idx_med_atc_code ON public.master_medicines_v2(atc_classification_code);
CREATE INDEX IF NOT EXISTS idx_med_dosage_form ON public.master_medicines_v2(dosage_form);
CREATE INDEX IF NOT EXISTS idx_med_storage ON public.master_medicines_v2(storage_temperature);
CREATE INDEX IF NOT EXISTS idx_med_rx_status ON public.master_medicines_v2(prescription_status);
CREATE INDEX IF NOT EXISTS idx_med_lifecycle ON public.master_medicines_v2(status);

-- 4. Enable Row-Level Security
ALTER TABLE public.master_medicines_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for active master medicines" ON public.master_medicines_v2
    FOR SELECT USING (true);

CREATE POLICY "Admin full management for master medicines" ON public.master_medicines_v2
    FOR ALL USING (true);
