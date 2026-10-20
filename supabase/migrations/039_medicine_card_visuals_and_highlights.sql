-- ====================================================================================================
-- MIGRATION 039: ZenithRx High-Fidelity Medicine Card Visuals, Clinical Highlights & Pack Hierarchy
-- Description:
--   1. Adds `image_url`, `highlights` JSONB, `actuations_or_pack_info`, and `adult_dosage_instruction`
--      to `public.master_medicines_v2` and `public.drugs`.
--   2. Seeds/updates core medications (Ventolin Evohaler 100mcg, Panadol Extra, Augmentin 625mg,
--      Calpol Infant Suspension, Coartem Dispersible) with clinical highlights, packaging, and imagery.
--   3. Configures GIN index on `highlights` for fast filtering by clinical badges.
-- ====================================================================================================

-- 1. Ensure master_medicines_v2 columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'master_medicines_v2') THEN
        ALTER TABLE public.master_medicines_v2
            ADD COLUMN IF NOT EXISTS image_url TEXT,
            ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS actuations_or_pack_info VARCHAR(128),
            ADD COLUMN IF NOT EXISTS adult_dosage_instruction TEXT;
            
        CREATE INDEX IF NOT EXISTS idx_med_highlights ON public.master_medicines_v2 USING GIN (highlights);
    END IF;
END $$;

-- 2. Ensure drugs table (tenant-level POS inventory) supports matching visual attributes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drugs') THEN
        ALTER TABLE public.drugs
            ADD COLUMN IF NOT EXISTS image_url TEXT,
            ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS actuations_or_pack_info VARCHAR(128),
            ADD COLUMN IF NOT EXISTS adult_dosage_instruction TEXT;
    END IF;
END $$;

-- 3. Seed / Update Master Medicines with High-Fidelity Visuals & Clinical Badges
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'master_medicines_v2') THEN
        -- Ventolin Evohaler 100mcg (Respiratory SABA Inhaler)
        UPDATE public.master_medicines_v2
        SET
            image_url = '/medicines/ventolin_evohaler.jpg',
            actuations_or_pack_info = '100mcg / puff (200 actuations)',
            adult_dosage_instruction = '1 to 2 inhalations (100-200mcg) every 4–6 hours for acute relief of bronchospasm.',
            suggested_retail_price_ugx = 25000,
            highlights = '[
                {"icon": "lungs", "title": "Rapid Relief", "subtitle": "for bronchospasm"},
                {"icon": "clock", "title": "Long-Lasting", "subtitle": "up to 4–6 hours"},
                {"icon": "shield", "title": "Trusted Brand", "subtitle": "GSK"},
                {"icon": "device", "title": "Easy to Use", "subtitle": "Metered dose inhaler"}
            ]'::jsonb,
            updated_at = NOW()
        WHERE id = 'med-salb-inh-100' OR brand_name ILIKE '%Ventolin Evohaler%';

        -- Panadol Extra 500mg
        UPDATE public.master_medicines_v2
        SET
            image_url = '/medicines/panadol_extra.jpg',
            actuations_or_pack_info = '500mg / 65mg (Box of 100 Tablets)',
            adult_dosage_instruction = '1 to 2 tablets (500mg - 1000mg) every 4-6 hours as needed for pain & fever. Max 4000mg/24h.',
            suggested_retail_price_ugx = 35000,
            highlights = '[
                {"icon": "zap", "title": "Rapid Relief", "subtitle": "Targeted extra strength"},
                {"icon": "clock", "title": "Fast Acting", "subtitle": "Starts in 15–30 min"},
                {"icon": "shield", "title": "Trusted Brand", "subtitle": "GSK"},
                {"icon": "pill", "title": "Easy to Swallow", "subtitle": "Film-coated tablets"}
            ]'::jsonb,
            updated_at = NOW()
        WHERE id = 'med-para-tab-500' OR brand_name ILIKE '%Panadol Extra%';

        -- Augmentin 625mg
        UPDATE public.master_medicines_v2
        SET
            image_url = '/medicines/augmentin_625.jpg',
            actuations_or_pack_info = '625mg (14 Film-Coated Tablets)',
            adult_dosage_instruction = '1 tablet (625mg) every 12 hours (BD) at start of meal for bacterial infections.',
            suggested_retail_price_ugx = 35000,
            highlights = '[
                {"icon": "shield", "title": "Broad Spectrum", "subtitle": "Pathogen eradication"},
                {"icon": "zap", "title": "Potent Action", "subtitle": "Beta-lactamase resistant"},
                {"icon": "shield", "title": "Trusted Brand", "subtitle": "GSK"},
                {"icon": "pill", "title": "Protected Foil", "subtitle": "Desiccant moisture seal"}
            ]'::jsonb,
            updated_at = NOW()
        WHERE id = 'med-amox-tab-625' OR brand_name ILIKE '%Augmentin 625mg%';

        -- Calpol Infant Suspension 120mg/5ml
        UPDATE public.master_medicines_v2
        SET
            image_url = '/medicines/calpol_suspension.jpg',
            actuations_or_pack_info = '120mg / 5mL (100 mL Bottle)',
            adult_dosage_instruction = 'Pediatric formulation: 2.5mL to 10mL based on age/weight with included syringe.',
            suggested_retail_price_ugx = 12000,
            highlights = '[
                {"icon": "heart", "title": "Gentle on Tummy", "subtitle": "Pediatric formula"},
                {"icon": "clock", "title": "Up to 6 Hours", "subtitle": "Fever & pain control"},
                {"icon": "shield", "title": "Trusted Brand", "subtitle": "GSK / Calpol"},
                {"icon": "device", "title": "Easy to Use", "subtitle": "Measuring syringe"}
            ]'::jsonb,
            updated_at = NOW()
        WHERE id = 'med-para-susp-120' OR brand_name ILIKE '%Calpol Infant%';

        -- Coartem 20/120mg Dispersible
        UPDATE public.master_medicines_v2
        SET
            image_url = '/medicines/coartem.jpg',
            actuations_or_pack_info = '20/120mg (24 Dispersible Tablets)',
            adult_dosage_instruction = 'Standard 6-dose regimen over 3 days (1-4 tablets per dose based on body weight).',
            suggested_retail_price_ugx = 22000,
            highlights = '[
                {"icon": "zap", "title": "Rapid Action", "subtitle": "Clears malaria parasites"},
                {"icon": "clock", "title": "3-Day Course", "subtitle": "Full 6-dose cure"},
                {"icon": "shield", "title": "Gold Standard", "subtitle": "Novartis / CQCL"},
                {"icon": "pill", "title": "Dispersible", "subtitle": "Cherry flavored"}
            ]'::jsonb,
            updated_at = NOW()
        WHERE id = 'med-artem-tab-20-120' OR brand_name ILIKE '%Coartem%';
    END IF;
END $$;
