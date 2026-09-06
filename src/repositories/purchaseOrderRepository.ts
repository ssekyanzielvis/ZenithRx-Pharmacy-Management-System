/**
 * purchaseOrderRepository.ts — ZenithRx Purchase Order Repository
 * Clean Architecture: Infrastructure Layer
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PurchaseOrder } from '../types';
import { DbPurchaseOrder, DbPurchaseOrderItem } from '../lib/database.types';
import { INITIAL_PURCHASE_ORDERS } from '../data/mockData';

function dbToDomain(
  row: DbPurchaseOrder & { purchase_order_items?: DbPurchaseOrderItem[] }
): PurchaseOrder {
  return {
    id:            row.id,
    poNumber:      row.po_number,
    supplierName:  row.supplier_name,
    supplierEmail: row.supplier_email,
    dateCreated:   row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    status:        mapStatus(row.status),
    totalAmount:   Number(row.total_amount),
    items: (row.purchase_order_items ?? []).map(item => ({
      drugId:       item.drug_id ?? '',
      brandName:    item.brand_name,
      currentStock: item.current_stock,
      orderQty:     item.order_qty,
      unitCost:     Number(item.unit_cost),
    })),
  };
}

function mapStatus(s: string): PurchaseOrder['status'] {
  switch (s) {
    case 'sent_to_supplier': return 'Sent to Supplier';
    case 'fulfilled':        return 'Fulfilled';
    case 'cancelled':        return 'Cancelled';
    default:                 return 'Draft';
  }
}

function domainStatusToDb(s: PurchaseOrder['status']): string {
  switch (s) {
    case 'Sent to Supplier': return 'sent_to_supplier';
    case 'Fulfilled':        return 'fulfilled';
    case 'Cancelled':        return 'cancelled';
    default:                 return 'draft';
  }
}

export async function getAllPurchaseOrders(tenantId: string): Promise<PurchaseOrder[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_PURCHASE_ORDERS;
  }
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`[purchaseOrderRepository.getAll] ${error.message}`);
  return (data ?? []).map(row => dbToDomain(row as any));
}

export async function createPurchaseOrder(
  po: PurchaseOrder,
  tenantId: string,
  createdBy: string
): Promise<PurchaseOrder> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');

  const { data: inserted, error } = await (supabase
    .from('purchase_orders') as any)
    .insert({
      tenant_id:     tenantId,
      po_number:     po.poNumber,
      supplier_name: po.supplierName,
      supplier_email: po.supplierEmail,
      status:        domainStatusToDb(po.status),
      total_amount:  po.totalAmount,
      created_by:    createdBy,
    })
    .select()
    .single();

  if (error) throw new Error(`[purchaseOrderRepository.create] ${error.message}`);
  if (!inserted?.id) throw new Error('Failed to insert purchase order header');

  if (po.items.length > 0) {
    const items = po.items.map(item => ({
      purchase_order_id: inserted.id,
      drug_id:           item.drugId || null,
      brand_name:        item.brandName,
      current_stock:     item.currentStock,
      order_qty:         item.orderQty,
      unit_cost:         item.unitCost,
    }));
    const { error: itemErr } = await (supabase.from('purchase_order_items') as any).insert(items);
    if (itemErr) throw new Error(`[purchaseOrderRepository.createItems] ${itemErr.message}`);
  }

  return { ...po, id: inserted.id };
}

export async function updatePOStatus(id: string, status: PurchaseOrder['status']): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await (supabase
    .from('purchase_orders') as any)
    .update({ status: domainStatusToDb(status) })
    .eq('id', id);
  if (error) throw new Error(`[purchaseOrderRepository.updateStatus] ${error.message}`);
}
