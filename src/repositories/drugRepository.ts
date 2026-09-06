/**
 * drugRepository.ts — ZenithRx Drug/Inventory Data Repository
 * All drug CRUD operations, stock adjustments, and expiry queries.
 * Clean Architecture: Infrastructure Layer
 * Falls back to mock data when Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DrugItem } from '../types';
import { DbDrug } from '../lib/database.types';
import { INITIAL_DRUGS } from '../data/mockData';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function dbToDomain(row: DbDrug): DrugItem {
  return {
    id:                   row.id,
    brandName:            row.brand_name,
    genericName:          row.generic_name,
    barcode:              row.barcode,
    batchNumber:          row.batch_number,
    category:             row.category as DrugItem['category'],
    shelfLocation:        row.shelf_location,
    costPrice:            Number(row.cost_price),
    sellingPrice:         Number(row.selling_price),
    stockQty:             row.stock_qty,
    reorderLevel:         row.reorder_level,
    expiryDate:           row.expiry_date,
    manufacturer:         row.manufacturer,
    prescriptionRequired: row.prescription_required,
    unit:                 row.unit,
  };
}

function domainToInsert(drug: Omit<DrugItem, 'id'>, tenantId: string) {
  return {
    tenant_id:             tenantId,
    brand_name:            drug.brandName,
    generic_name:          drug.genericName,
    barcode:               drug.barcode,
    batch_number:          drug.batchNumber,
    category:              drug.category,
    shelf_location:        drug.shelfLocation,
    cost_price:            drug.costPrice,
    selling_price:         drug.sellingPrice,
    stock_qty:             drug.stockQty,
    reorder_level:         drug.reorderLevel,
    expiry_date:           drug.expiryDate,
    manufacturer:          drug.manufacturer,
    prescription_required: drug.prescriptionRequired,
    unit:                  drug.unit,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

/** Fetch all drugs for a given tenant */
export async function getAllDrugs(tenantId: string): Promise<DrugItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_DRUGS;
  }
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('brand_name', { ascending: true });

  if (error) throw new Error(`[drugRepository.getAllDrugs] ${error.message}`);
  return ((data as DbDrug[]) ?? []).map(dbToDomain);
}

/** Fetch drugs expiring within a given number of days */
export async function getExpiringDrugs(tenantId: string, withinDays = 90): Promise<DrugItem[]> {
  if (!isSupabaseConfigured || !supabase) return INITIAL_DRUGS;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('expiry_date', cutoff.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  if (error) throw new Error(`[drugRepository.getExpiringDrugs] ${error.message}`);
  return ((data as DbDrug[]) ?? []).map(dbToDomain);
}

/** Fetch drugs at or below reorder level */
export async function getLowStockDrugs(tenantId: string): Promise<DrugItem[]> {
  if (!isSupabaseConfigured || !supabase) return INITIAL_DRUGS.filter(d => d.stockQty <= d.reorderLevel);
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('tenant_id', tenantId)
    .filter('stock_qty', 'lte', 'reorder_level');

  if (error) throw new Error(`[drugRepository.getLowStockDrugs] ${error.message}`);
  return ((data as DbDrug[]) ?? []).map(dbToDomain);
}

/** Search drugs by name or barcode */
export async function searchDrugs(tenantId: string, query: string): Promise<DrugItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    const q = query.toLowerCase();
    return INITIAL_DRUGS.filter(d =>
      d.brandName.toLowerCase().includes(q) ||
      d.genericName.toLowerCase().includes(q) ||
      d.barcode.includes(q)
    );
  }
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('tenant_id', tenantId)
    .or(`brand_name.ilike.%${query}%,generic_name.ilike.%${query}%,barcode.eq.${query}`);

  if (error) throw new Error(`[drugRepository.searchDrugs] ${error.message}`);
  return ((data as DbDrug[]) ?? []).map(dbToDomain);
}

/** Add a new drug */
export async function addDrug(drug: Omit<DrugItem, 'id'>, tenantId: string): Promise<DrugItem> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');
  const { data, error } = await (supabase
    .from('drugs') as any)
    .insert(domainToInsert(drug, tenantId))
    .select()
    .single();

  if (error) throw new Error(`[drugRepository.addDrug] ${error.message}`);
  return dbToDomain(data as DbDrug);
}

/** Update a drug record */
export async function updateDrug(id: string, updates: Partial<DrugItem>): Promise<DrugItem> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');
  const dbUpdates: Record<string, any> = {};
  if (updates.brandName        !== undefined) dbUpdates.brand_name        = updates.brandName;
  if (updates.genericName      !== undefined) dbUpdates.generic_name      = updates.genericName;
  if (updates.sellingPrice     !== undefined) dbUpdates.selling_price     = updates.sellingPrice;
  if (updates.costPrice        !== undefined) dbUpdates.cost_price        = updates.costPrice;
  if (updates.stockQty         !== undefined) dbUpdates.stock_qty         = updates.stockQty;
  if (updates.reorderLevel     !== undefined) dbUpdates.reorder_level     = updates.reorderLevel;
  if (updates.expiryDate       !== undefined) dbUpdates.expiry_date       = updates.expiryDate;
  if (updates.shelfLocation    !== undefined) dbUpdates.shelf_location    = updates.shelfLocation;

  const { data, error } = await (supabase
    .from('drugs') as any)
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`[drugRepository.updateDrug] ${error.message}`);
  return dbToDomain(data as DbDrug);
}

/** Decrement stock after a sale — atomic via RPC */
export async function decrementStock(
  drugId: string,
  quantity: number,
  tenantId: string,
  referenceId: string,
  performedBy: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  const { error } = await (supabase.rpc as any)('decrement_drug_stock', {
    p_drug_id:      drugId,
    p_quantity:     quantity,
    p_tenant_id:    tenantId,
    p_reference_id: referenceId,
    p_performed_by: performedBy,
  });

  if (error) throw new Error(`[drugRepository.decrementStock] ${error.message}`);
}

/** Delete a drug */
export async function deleteDrug(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('drugs').delete().eq('id', id);
  if (error) throw new Error(`[drugRepository.deleteDrug] ${error.message}`);
}
