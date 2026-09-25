-- ============================================================================
-- Migration: 025_multi_location_storage_and_stock_transfers.sql
-- Description: Hierarchical Multi-Location Storage Topology (Branch -> Storage Room ->
--              Aisle/Shelf -> Bin Slot) and 6-Stage Inter-Branch Stock Transfer Engine.
-- ============================================================================

-- Enum Types for Storage & Stock Transfers
DO $$ BEGIN
    CREATE TYPE storage_location_type_enum AS ENUM (
        'general_store_room',
        'cold_chain_refrigerator',
        'narcotics_safe_vault',
        'dispensing_front_counter',
        'quarantine_zone',
        'bulk_pallet_warehouse'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_transfer_status_enum AS ENUM (
        'requested',
        'approved',
        'picking_in_progress',
        'picked_and_staged',
        'dispatched_in_transit',
        'received_and_allocated',
        'partially_received_with_discrepancy',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Pharmacy Branches Table
CREATE TABLE IF NOT EXISTS public.pharmacy_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code VARCHAR(50) NOT NULL UNIQUE,
    branch_name VARCHAR(150) NOT NULL,
    branch_type VARCHAR(50) NOT NULL DEFAULT 'retail_dispensary', -- 'central_hub_warehouse', 'retail_dispensary', 'hospital_outpost'
    city VARCHAR(100) NOT NULL DEFAULT 'Kampala',
    physical_address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    is_central_warehouse BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Storage Rooms / Locations (Within a Branch)
CREATE TABLE IF NOT EXISTS public.branch_storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.pharmacy_branches(id) ON DELETE CASCADE,
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(150) NOT NULL, -- e.g. 'Store Room A', 'Cold Chain Fridge 2', 'Narcotics Safe'
    location_type storage_location_type_enum NOT NULL DEFAULT 'general_store_room',
    temperature_min_celsius NUMERIC(4,1) DEFAULT 15.0,
    temperature_max_celsius NUMERIC(4,1) DEFAULT 25.0,
    humidity_max_percent NUMERIC(4,1) DEFAULT 60.0,
    is_lock_controlled BOOLEAN NOT NULL DEFAULT false,
    max_capacity_units INTEGER NOT NULL DEFAULT 10000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_location_code UNIQUE (branch_id, location_code)
);

-- 3. Storage Shelves, Racks & Bins (Physical Slot Topology)
CREATE TABLE IF NOT EXISTS public.storage_shelves_and_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_location_id UUID NOT NULL REFERENCES public.branch_storage_locations(id) ON DELETE CASCADE,
    aisle_zone VARCHAR(50) NOT NULL DEFAULT 'Aisle A',
    shelf_rack VARCHAR(50) NOT NULL DEFAULT 'Shelf 01',
    bin_slot VARCHAR(50) NOT NULL DEFAULT 'Bin 01',
    full_bin_code VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'MB-SRA-A1-B03'
    max_capacity_packs INTEGER NOT NULL DEFAULT 200,
    current_occupancy_packs INTEGER NOT NULL DEFAULT 0,
    barcode VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Batch to Bin Physical Allocations
CREATE TABLE IF NOT EXISTS public.batch_bin_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bin_id UUID NOT NULL REFERENCES public.storage_shelves_and_bins(id) ON DELETE CASCADE,
    medicine_id VARCHAR(100) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    last_stocktake_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bin_batch UNIQUE (bin_id, medicine_id, batch_number)
);

-- 5. Inter-Branch Stock Transfer Requests (STR) Header
CREATE TABLE IF NOT EXISTS public.stock_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    source_branch_id UUID NOT NULL REFERENCES public.pharmacy_branches(id),
    destination_branch_id UUID NOT NULL REFERENCES public.pharmacy_branches(id),
    status stock_transfer_status_enum NOT NULL DEFAULT 'requested',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- 'URGENT_STOCKOUT', 'NORMAL', 'ROUTINE_REPLENISHMENT'
    reason_notes TEXT,
    requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    requested_by_name VARCHAR(150) NOT NULL,
    approved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by_name VARCHAR(150),
    dispatched_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    dispatched_by_name VARCHAR(150),
    received_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    received_by_name VARCHAR(150),
    dispatch_seal_number VARCHAR(100),
    transit_courier_name VARCHAR(100),
    transit_tracking_code VARCHAR(100),
    is_cold_chain_monitored BOOLEAN NOT NULL DEFAULT false,
    temp_at_dispatch_celsius NUMERIC(4,1),
    temp_at_receipt_celsius NUMERIC(4,1),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    total_items_count INTEGER NOT NULL DEFAULT 0,
    total_quantity_requested INTEGER NOT NULL DEFAULT 0,
    total_quantity_dispatched INTEGER NOT NULL DEFAULT 0,
    total_quantity_received INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Stock Transfer Line Items Table
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfer_requests(id) ON DELETE CASCADE,
    medicine_id VARCHAR(100) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(100) DEFAULT 'Tablets / Capsules',
    requested_quantity INTEGER NOT NULL,
    approved_quantity INTEGER DEFAULT 0,
    picked_quantity INTEGER DEFAULT 0,
    received_quantity INTEGER DEFAULT 0,
    discrepancy_quantity INTEGER DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date DATE,
    source_bin_code VARCHAR(100),
    dest_bin_code VARCHAR(100),
    item_condition VARCHAR(50) DEFAULT 'intact_good_condition', -- 'intact_good_condition', 'damaged_packaging', 'temperature_breached'
    notes TEXT
);

-- 7. Stock Transfer Audit Trail
CREATE TABLE IF NOT EXISTS public.stock_transfer_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfer_requests(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    action_description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Fast Querying
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON public.stock_transfer_requests(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_source ON public.stock_transfer_requests(source_branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_dest ON public.stock_transfer_requests(destination_branch_id);
CREATE INDEX IF NOT EXISTS idx_storage_bins_fullcode ON public.storage_shelves_and_bins(full_bin_code);
CREATE INDEX IF NOT EXISTS idx_batch_bin_med ON public.batch_bin_allocations(medicine_id, batch_number);

-- 8. Seed Initial Branches, Storage Locations & Bins
INSERT INTO public.pharmacy_branches (
    id,
    branch_code,
    branch_name,
    branch_type,
    city,
    physical_address,
    phone,
    is_central_warehouse
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'BR-MAIN-01',
    'ZenithRx Central Flagship Pharmacy & Hub',
    'central_hub_warehouse',
    'Kampala',
    'Plot 42 Kampala Road, City Center',
    '+256 414 100200',
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'BR-ENT-02',
    'ZenithRx Entebbe Airport Highway Branch',
    'retail_dispensary',
    'Entebbe',
    'Plot 18 Airport Road, Entebbe Municipality',
    '+256 414 100201',
    false
),
(
    '00000000-0000-0000-0000-000000000003',
    'BR-GULU-03',
    'ZenithRx Gulu Regional Dispensary',
    'hospital_outpost',
    'Gulu',
    'Plot 12 Gulu Main Hospital Road',
    '+256 471 100202',
    false
)
ON CONFLICT (branch_code) DO NOTHING;

-- Seed Storage Locations for Main Branch
INSERT INTO public.branch_storage_locations (
    id,
    branch_id,
    location_code,
    location_name,
    location_type,
    temperature_min_celsius,
    temperature_max_celsius,
    is_lock_controlled,
    max_capacity_units
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'LOC-MAIN-SRA',
    'Main Store Room A (Ambient General Stock)',
    'general_store_room',
    15.0,
    25.0,
    false,
    25000
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'LOC-MAIN-CC1',
    'Cold Chain Refrigerator #1 (Vaccines & Biologics)',
    'cold_chain_refrigerator',
    2.0,
    8.0,
    true,
    5000
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'LOC-MAIN-SAFE',
    'Controlled Narcotics Safe Vault (Schedule II/III)',
    'narcotics_safe_vault',
    15.0,
    25.0,
    true,
    1500
),
(
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'LOC-MAIN-DISP',
    'Front Counter Fast-Mover Dispensary Shelves',
    'dispensing_front_counter',
    15.0,
    25.0,
    false,
    8000
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Bins in Main Store Room A
INSERT INTO public.storage_shelves_and_bins (
    storage_location_id,
    aisle_zone,
    shelf_rack,
    bin_slot,
    full_bin_code,
    max_capacity_packs,
    current_occupancy_packs,
    barcode
) VALUES 
('10000000-0000-0000-0000-000000000001', 'Aisle 01 (Antibiotics)', 'Shelf B3', 'Bin 04', 'MB-SRA-A1-B3-04', 200, 165, 'BIN-88401'),
('10000000-0000-0000-0000-000000000001', 'Aisle 01 (Antibiotics)', 'Shelf B3', 'Bin 05', 'MB-SRA-A1-B3-05', 200, 80, 'BIN-88402'),
('10000000-0000-0000-0000-000000000001', 'Aisle 02 (Cardiovascular)', 'Shelf C1', 'Bin 02', 'MB-SRA-A2-C1-02', 150, 140, 'BIN-88403'),
('10000000-0000-0000-0000-000000000002', 'Cold Zone (2-8°C)', 'Tray 02', 'Slot A', 'MB-CC1-T2-SL-A', 100, 45, 'BIN-COLD-01')
ON CONFLICT (full_bin_code) DO NOTHING;

-- Seed Sample Batch Allocation in Bin B3-04 (Amoxicillin 500mg - Batch AMX2304)
INSERT INTO public.batch_bin_allocations (
    bin_id,
    medicine_id,
    medicine_name,
    batch_number,
    expiry_date,
    quantity_on_hand,
    quantity_reserved
) VALUES (
    (SELECT id FROM public.storage_shelves_and_bins WHERE full_bin_code = 'MB-SRA-A1-B3-04' LIMIT 1),
    'med-amox-500',
    'Amoxicillin 500mg Capsules (100s)',
    'AMX2304',
    '2027-08-31',
    165,
    0
)
ON CONFLICT (bin_id, medicine_id, batch_number) DO NOTHING;

-- Seed Sample Stock Transfer Request (Main Branch -> Entebbe Branch)
INSERT INTO public.stock_transfer_requests (
    id,
    transfer_number,
    source_branch_id,
    destination_branch_id,
    status,
    priority,
    reason_notes,
    requested_by_name,
    approved_by_name,
    dispatched_by_name,
    dispatch_seal_number,
    transit_courier_name,
    transit_tracking_code,
    total_items_count,
    total_quantity_requested,
    total_quantity_dispatched,
    requested_at,
    approved_at,
    dispatched_at
) VALUES (
    '20000000-0000-0000-0000-000000000001',
    'STR-2026-0042',
    '00000000-0000-0000-0000-000000000001', -- Main Branch (Source)
    '00000000-0000-0000-0000-000000000002', -- Entebbe Branch (Dest)
    'dispatched_in_transit',
    'URGENT_STOCKOUT',
    'Critical pediatric antibiotic reorder for Entebbe Clinic outpatient demand.',
    'David Kigozi (Entebbe Dispenser)',
    'Dr. Sarah Mukasa (Supervising Pharmacist)',
    'Alex Musoke (Warehouse Dispatch Lead)',
    'SEAL-UG-994182',
    'ZenithRx Express Pharma Logistics',
    'TRK-ZX-882190',
    2,
    80,
    80,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours 15 minutes',
    NOW() - INTERVAL '45 minutes'
) ON CONFLICT (transfer_number) DO NOTHING;

-- Line item for STR
INSERT INTO public.stock_transfer_items (
    transfer_id,
    medicine_id,
    medicine_name,
    requested_quantity,
    approved_quantity,
    picked_quantity,
    batch_number,
    expiry_date,
    source_bin_code,
    dest_bin_code
) VALUES (
    '20000000-0000-0000-0000-000000000001',
    'med-amox-500',
    'Amoxicillin 500mg Capsules (100s)',
    50,
    50,
    50,
    'AMX2304',
    '2027-08-31',
    'MB-SRA-A1-B3-04',
    'EB-DISP-A1-02'
) ON CONFLICT DO NOTHING;
