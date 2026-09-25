export type StorageLocationType =
  | 'general_store_room'
  | 'cold_chain_refrigerator'
  | 'narcotics_safe_vault'
  | 'dispensing_front_counter'
  | 'quarantine_zone'
  | 'bulk_pallet_warehouse';

export type StockTransferStatus =
  | 'requested'
  | 'approved'
  | 'picking_in_progress'
  | 'picked_and_staged'
  | 'dispatched_in_transit'
  | 'received_and_allocated'
  | 'partially_received_with_discrepancy'
  | 'cancelled';

export interface PharmacyBranch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_type: string;
  city: string;
  physical_address: string;
  phone: string;
  email?: string;
  is_central_warehouse: boolean;
  is_active: boolean;
}

export interface BranchStorageLocation {
  id: string;
  branch_id: string;
  location_code: string;
  location_name: string;
  location_type: StorageLocationType;
  temperature_min_celsius: number;
  temperature_max_celsius: number;
  humidity_max_percent?: number;
  is_lock_controlled: boolean;
  max_capacity_units: number;
  bins_count?: number;
}

export interface StorageShelfBin {
  id: string;
  storage_location_id: string;
  aisle_zone: string;
  shelf_rack: string;
  bin_slot: string;
  full_bin_code: string;
  max_capacity_packs: number;
  current_occupancy_packs: number;
  barcode?: string;
  is_active: boolean;
  allocations?: BatchBinAllocation[];
}

export interface BatchBinAllocation {
  id: string;
  bin_id: string;
  medicine_id: string;
  medicine_name: string;
  batch_number: string;
  expiry_date: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  last_stocktake_at?: string;
}

export interface StockTransferRequest {
  id: string;
  transfer_number: string;
  source_branch_id: string;
  source_branch_name?: string;
  destination_branch_id: string;
  destination_branch_name?: string;
  status: StockTransferStatus;
  priority: 'URGENT_STOCKOUT' | 'NORMAL' | 'ROUTINE_REPLENISHMENT';
  reason_notes?: string;
  requested_by_name: string;
  approved_by_name?: string;
  dispatched_by_name?: string;
  received_by_name?: string;
  dispatch_seal_number?: string;
  transit_courier_name?: string;
  transit_tracking_code?: string;
  is_cold_chain_monitored: boolean;
  temp_at_dispatch_celsius?: number;
  temp_at_receipt_celsius?: number;
  requested_at: string;
  approved_at?: string;
  dispatched_at?: string;
  received_at?: string;
  total_items_count: number;
  total_quantity_requested: number;
  total_quantity_dispatched: number;
  total_quantity_received: number;
  items?: StockTransferItem[];
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  medicine_id: string;
  medicine_name: string;
  dosage_form?: string;
  requested_quantity: number;
  approved_quantity: number;
  picked_quantity: number;
  received_quantity: number;
  discrepancy_quantity: number;
  batch_number?: string;
  expiry_date?: string;
  source_bin_code?: string;
  dest_bin_code?: string;
  item_condition: 'intact_good_condition' | 'damaged_packaging' | 'temperature_breached';
  notes?: string;
}
