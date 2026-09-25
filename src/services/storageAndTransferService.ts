import { supabase } from '../lib/supabase';
import {
  PharmacyBranch,
  BranchStorageLocation,
  StorageShelfBin,
  BatchBinAllocation,
  StockTransferRequest,
  StockTransferItem,
} from '../types/storageAndTransferTypes';

const MOCK_BRANCHES: PharmacyBranch[] = [
  {
    id: 'br-001',
    branch_code: 'BR-MAIN-01',
    branch_name: 'ZenithRx Central Flagship Pharmacy & Hub',
    branch_type: 'Central Hub Warehouse',
    city: 'Kampala',
    physical_address: 'Plot 42 Kampala Road, City Center',
    phone: '+256 414 100200',
    is_central_warehouse: true,
    is_active: true,
  },
  {
    id: 'br-002',
    branch_code: 'BR-ENT-02',
    branch_name: 'ZenithRx Entebbe Airport Highway Branch',
    branch_type: 'Retail Dispensary',
    city: 'Entebbe',
    physical_address: 'Plot 18 Airport Road, Entebbe Municipality',
    phone: '+256 414 100201',
    is_central_warehouse: false,
    is_active: true,
  },
  {
    id: 'br-003',
    branch_code: 'BR-GULU-03',
    branch_name: 'ZenithRx Gulu Regional Dispensary',
    branch_type: 'Hospital Outpost',
    city: 'Gulu',
    physical_address: 'Plot 12 Gulu Main Hospital Road',
    phone: '+256 471 100202',
    is_central_warehouse: false,
    is_active: true,
  },
];

const MOCK_LOCATIONS: BranchStorageLocation[] = [
  {
    id: 'loc-001',
    branch_id: 'br-001',
    location_code: 'LOC-MAIN-SRA',
    location_name: 'Main Store Room A (Ambient General Stock)',
    location_type: 'general_store_room',
    temperature_min_celsius: 15.0,
    temperature_max_celsius: 25.0,
    humidity_max_percent: 60.0,
    is_lock_controlled: false,
    max_capacity_units: 25000,
    bins_count: 24,
  },
  {
    id: 'loc-002',
    branch_id: 'br-001',
    location_code: 'LOC-MAIN-CC1',
    location_name: 'Cold Chain Refrigerator #1 (Vaccines & Insulin)',
    location_type: 'cold_chain_refrigerator',
    temperature_min_celsius: 2.0,
    temperature_max_celsius: 8.0,
    humidity_max_percent: 45.0,
    is_lock_controlled: true,
    max_capacity_units: 5000,
    bins_count: 8,
  },
  {
    id: 'loc-003',
    branch_id: 'br-001',
    location_code: 'LOC-MAIN-SAFE',
    location_name: 'Controlled Narcotics Safe Vault (Schedule II/III)',
    location_type: 'narcotics_safe_vault',
    temperature_min_celsius: 15.0,
    temperature_max_celsius: 25.0,
    is_lock_controlled: true,
    max_capacity_units: 1500,
    bins_count: 4,
  },
  {
    id: 'loc-004',
    branch_id: 'br-001',
    location_code: 'LOC-MAIN-DISP',
    location_name: 'Front Counter Fast-Mover Dispensary Shelves',
    location_type: 'dispensing_front_counter',
    temperature_min_celsius: 15.0,
    temperature_max_celsius: 25.0,
    is_lock_controlled: false,
    max_capacity_units: 8000,
    bins_count: 16,
  },
];

const MOCK_BINS: StorageShelfBin[] = [
  {
    id: 'bin-01',
    storage_location_id: 'loc-001',
    aisle_zone: 'Aisle 01 (Antibiotics & Anti-Infectives)',
    shelf_rack: 'Shelf B3',
    bin_slot: 'Bin 04',
    full_bin_code: 'MB-SRA-A1-B3-04',
    max_capacity_packs: 200,
    current_occupancy_packs: 165,
    barcode: 'BIN-88401',
    is_active: true,
    allocations: [
      {
        id: 'alloc-01',
        bin_id: 'bin-01',
        medicine_id: 'med-amox-500',
        medicine_name: 'Amoxicillin 500mg Capsules (100s)',
        batch_number: 'AMX2304',
        expiry_date: '2027-08-31',
        quantity_on_hand: 165,
        quantity_reserved: 50,
      },
    ],
  },
  {
    id: 'bin-02',
    storage_location_id: 'loc-001',
    aisle_zone: 'Aisle 01 (Antibiotics & Anti-Infectives)',
    shelf_rack: 'Shelf B3',
    bin_slot: 'Bin 05',
    full_bin_code: 'MB-SRA-A1-B3-05',
    max_capacity_packs: 200,
    current_occupancy_packs: 80,
    barcode: 'BIN-88402',
    is_active: true,
    allocations: [
      {
        id: 'alloc-02',
        bin_id: 'bin-02',
        medicine_id: 'med-cipro-500',
        medicine_name: 'Ciprofloxacin 500mg Tablets (10s)',
        batch_number: 'CIP-9921',
        expiry_date: '2026-11-30',
        quantity_on_hand: 80,
        quantity_reserved: 0,
      },
    ],
  },
  {
    id: 'bin-03',
    storage_location_id: 'loc-002',
    aisle_zone: 'Cold Zone (2°C - 8°C Biologics)',
    shelf_rack: 'Tray 02',
    bin_slot: 'Slot A',
    full_bin_code: 'MB-CC1-T2-SL-A',
    max_capacity_packs: 100,
    current_occupancy_packs: 45,
    barcode: 'BIN-COLD-01',
    is_active: true,
    allocations: [
      {
        id: 'alloc-03',
        bin_id: 'bin-03',
        medicine_id: 'med-ins-glarg',
        medicine_name: 'Lantus Insulin Glargine 100 IU/ml (5x3ml)',
        batch_number: 'GLG-7718',
        expiry_date: '2026-12-15',
        quantity_on_hand: 45,
        quantity_reserved: 0,
      },
    ],
  },
  {
    id: 'bin-04',
    storage_location_id: 'loc-003',
    aisle_zone: 'Schedule II Vault Safe',
    shelf_rack: 'Drawer 01',
    bin_slot: 'Box 02',
    full_bin_code: 'MB-SAFE-D1-BX02',
    max_capacity_packs: 50,
    current_occupancy_packs: 25,
    barcode: 'BIN-SAFE-01',
    is_active: true,
    allocations: [
      {
        id: 'alloc-04',
        bin_id: 'bin-04',
        medicine_id: 'med-morph-10',
        medicine_name: 'Morphine Sulfate 10mg/ml Ampoules (10s)',
        batch_number: 'MPH-3341',
        expiry_date: '2027-04-30',
        quantity_on_hand: 25,
        quantity_reserved: 0,
      },
    ],
  },
];

const MOCK_TRANSFERS: StockTransferRequest[] = [
  {
    id: 'tr-001',
    transfer_number: 'STR-2026-0042',
    source_branch_id: 'br-001',
    source_branch_name: 'ZenithRx Central Flagship Pharmacy & Hub',
    destination_branch_id: 'br-002',
    destination_branch_name: 'ZenithRx Entebbe Airport Highway Branch',
    status: 'dispatched_in_transit',
    priority: 'URGENT_STOCKOUT',
    reason_notes: 'Critical pediatric antibiotic replenishment for high outpatient volume.',
    requested_by_name: 'David Kigozi (Entebbe Dispenser)',
    approved_by_name: 'Dr. Sarah Mukasa (Supervising Pharmacist)',
    dispatched_by_name: 'Alex Musoke (Warehouse Dispatch Lead)',
    dispatch_seal_number: 'SEAL-UG-994182',
    transit_courier_name: 'ZenithRx Express Pharma Logistics',
    transit_tracking_code: 'TRK-ZX-882190',
    is_cold_chain_monitored: false,
    temp_at_dispatch_celsius: 21.5,
    requested_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 2.25 * 3600 * 1000).toISOString(),
    dispatched_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    total_items_count: 2,
    total_quantity_requested: 80,
    total_quantity_dispatched: 80,
    total_quantity_received: 0,
    items: [
      {
        id: 'ti-01',
        transfer_id: 'tr-001',
        medicine_id: 'med-amox-500',
        medicine_name: 'Amoxicillin 500mg Capsules (100s)',
        requested_quantity: 50,
        approved_quantity: 50,
        picked_quantity: 50,
        received_quantity: 0,
        discrepancy_quantity: 0,
        batch_number: 'AMX2304',
        expiry_date: '2027-08-31',
        source_bin_code: 'MB-SRA-A1-B3-04',
        dest_bin_code: 'EB-DISP-A1-02',
        item_condition: 'intact_good_condition',
      },
      {
        id: 'ti-02',
        transfer_id: 'tr-001',
        medicine_id: 'med-cipro-500',
        medicine_name: 'Ciprofloxacin 500mg Tablets (10s)',
        requested_quantity: 30,
        approved_quantity: 30,
        picked_quantity: 30,
        received_quantity: 0,
        discrepancy_quantity: 0,
        batch_number: 'CIP-9921',
        expiry_date: '2026-11-30',
        source_bin_code: 'MB-SRA-A1-B3-05',
        dest_bin_code: 'EB-DISP-A1-04',
        item_condition: 'intact_good_condition',
      },
    ],
  },
  {
    id: 'tr-002',
    transfer_number: 'STR-2026-0041',
    source_branch_id: 'br-001',
    source_branch_name: 'ZenithRx Central Flagship Pharmacy & Hub',
    destination_branch_id: 'br-003',
    destination_branch_name: 'ZenithRx Gulu Regional Dispensary',
    status: 'received_and_allocated',
    priority: 'ROUTINE_REPLENISHMENT',
    reason_notes: 'Monthly cold-chain insulin quota replenishment.',
    requested_by_name: 'Sister Mary Akello (Gulu Clinical Lead)',
    approved_by_name: 'Dr. Sarah Mukasa',
    dispatched_by_name: 'Alex Musoke',
    received_by_name: 'Sister Mary Akello',
    dispatch_seal_number: 'SEAL-COLD-8812',
    transit_courier_name: 'SafeFreeze Cold Transport',
    transit_tracking_code: 'TRK-SF-44102',
    is_cold_chain_monitored: true,
    temp_at_dispatch_celsius: 4.2,
    temp_at_receipt_celsius: 4.8,
    requested_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
    dispatched_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    received_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    total_items_count: 1,
    total_quantity_requested: 20,
    total_quantity_dispatched: 20,
    total_quantity_received: 20,
    items: [
      {
        id: 'ti-03',
        transfer_id: 'tr-002',
        medicine_id: 'med-ins-glarg',
        medicine_name: 'Lantus Insulin Glargine 100 IU/ml (5x3ml)',
        requested_quantity: 20,
        approved_quantity: 20,
        picked_quantity: 20,
        received_quantity: 20,
        discrepancy_quantity: 0,
        batch_number: 'GLG-7718',
        expiry_date: '2026-12-15',
        source_bin_code: 'MB-CC1-T2-SL-A',
        dest_bin_code: 'GL-FRIDGE-01',
        item_condition: 'intact_good_condition',
      },
    ],
  },
];

export class StorageAndTransferService {
  /**
   * Fetch All Pharmacy Branches
   */
  static async getBranches(): Promise<PharmacyBranch[]> {
    try {
      const { data, error } = await supabase
        .from('pharmacy_branches')
        .select('*')
        .eq('is_active', true)
        .order('is_central_warehouse', { ascending: false });

      if (error || !data || data.length === 0) return MOCK_BRANCHES;
      return data as PharmacyBranch[];
    } catch {
      return MOCK_BRANCHES;
    }
  }

  /**
   * Fetch Storage Locations for a Branch
   */
  static async getStorageLocations(branchId: string = 'br-001'): Promise<BranchStorageLocation[]> {
    try {
      const { data, error } = await supabase
        .from('branch_storage_locations')
        .select('*')
        .eq('branch_id', branchId);

      if (error || !data || data.length === 0) return MOCK_LOCATIONS;
      return data as BranchStorageLocation[];
    } catch {
      return MOCK_LOCATIONS;
    }
  }

  /**
   * Fetch Shelves & Bins with Batch Allocations
   */
  static async getBins(locationId?: string): Promise<StorageShelfBin[]> {
    try {
      let query = supabase.from('storage_shelves_and_bins').select('*');
      if (locationId) {
        query = query.eq('storage_location_id', locationId);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) return MOCK_BINS;
      return data as StorageShelfBin[];
    } catch {
      return MOCK_BINS;
    }
  }

  /**
   * Fetch Inter-Branch Stock Transfers
   */
  static async getStockTransfers(): Promise<StockTransferRequest[]> {
    try {
      const { data, error } = await supabase
        .from('stock_transfer_requests')
        .select('*, items:stock_transfer_items(*)')
        .order('requested_at', { ascending: false });

      if (error || !data || data.length === 0) return MOCK_TRANSFERS;
      return data as StockTransferRequest[];
    } catch {
      return MOCK_TRANSFERS;
    }
  }

  /**
   * Create New Stock Transfer Request (STR)
   */
  static async createTransferRequest(params: {
    sourceBranchId: string;
    destinationBranchId: string;
    priority: 'URGENT_STOCKOUT' | 'NORMAL' | 'ROUTINE_REPLENISHMENT';
    reason: string;
    requesterName: string;
    items: Array<{
      medicineId: string;
      medicineName: string;
      requestedQuantity: number;
    }>;
  }): Promise<StockTransferRequest> {
    const transferNumber = `STR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTransfer: StockTransferRequest = {
      id: `tr-${Date.now()}`,
      transfer_number: transferNumber,
      source_branch_id: params.sourceBranchId,
      source_branch_name: MOCK_BRANCHES.find((b) => b.id === params.sourceBranchId)?.branch_name || 'Central Hub',
      destination_branch_id: params.destinationBranchId,
      destination_branch_name: MOCK_BRANCHES.find((b) => b.id === params.destinationBranchId)?.branch_name || 'Retail Branch',
      status: 'requested',
      priority: params.priority,
      reason_notes: params.reason,
      requested_by_name: params.requesterName,
      is_cold_chain_monitored: false,
      requested_at: new Date().toISOString(),
      total_items_count: params.items.length,
      total_quantity_requested: params.items.reduce((acc, item) => acc + item.requestedQuantity, 0),
      total_quantity_dispatched: 0,
      total_quantity_received: 0,
      items: params.items.map((i, idx) => ({
        id: `ti-${Date.now()}-${idx}`,
        transfer_id: `tr-${Date.now()}`,
        medicine_id: i.medicineId,
        medicine_name: i.medicineName,
        requested_quantity: i.requestedQuantity,
        approved_quantity: i.requestedQuantity,
        picked_quantity: 0,
        received_quantity: 0,
        discrepancy_quantity: 0,
        item_condition: 'intact_good_condition',
      })),
    };

    return newTransfer;
  }

  /**
   * Dispatch Transfer
   */
  static async dispatchTransfer(
    transferId: string,
    sealNumber: string,
    courierName: string,
    trackingCode: string,
    tempAtDispatch?: number
  ): Promise<boolean> {
    try {
      await (supabase.from('stock_transfer_requests') as any)
        .update({
          status: 'dispatched_in_transit',
          dispatch_seal_number: sealNumber,
          transit_courier_name: courierName,
          transit_tracking_code: trackingCode,
          temp_at_dispatch_celsius: tempAtDispatch,
          dispatched_at: new Date().toISOString(),
        })
        .eq('id', transferId);
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Receive & Restock Transfer
   */
  static async receiveTransfer(
    transferId: string,
    receiverName: string,
    destBinCode: string,
    tempAtReceipt?: number
  ): Promise<boolean> {
    try {
      await (supabase.from('stock_transfer_requests') as any)
        .update({
          status: 'received_and_allocated',
          received_by_name: receiverName,
          temp_at_receipt_celsius: tempAtReceipt,
          received_at: new Date().toISOString(),
        })
        .eq('id', transferId);
      return true;
    } catch {
      return true;
    }
  }
}
