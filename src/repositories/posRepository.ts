/**
 * posRepository.ts — ZenithRx POS Transaction Repository
 * Insert completed sales, fetch transaction history, and analytics queries.
 * Clean Architecture: Infrastructure Layer
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { POSTransaction } from '../types';
import { DbPOSTransaction, DbPOSTransactionItem } from '../lib/database.types';
import { INITIAL_POS_TRANSACTIONS } from '../data/mockData';

// ─── Mapper ───────────────────────────────────────────────────────────────────

function dbToDomain(row: DbPOSTransaction & { pos_transaction_items?: DbPOSTransactionItem[] }): POSTransaction {
  return {
    id:                     row.id,
    receiptNo:              row.receipt_no,
    customerName:           row.customer_name,
    customerPhone:          row.customer_phone ?? undefined,
    subtotal:               Number(row.subtotal),
    taxAmount:              Number(row.tax_amount),
    discountAmount:         Number(row.discount_amount),
    insuranceCopayAmount:   Number(row.insurance_copay_amount),
    insuranceCoveredAmount: Number(row.insurance_covered_amount),
    totalPaid:              Number(row.total_paid),
    paymentMethod:          row.payment_method as POSTransaction['paymentMethod'],
    mpesaRef:               row.mpesa_ref ?? undefined,
    cashierName:            row.cashier_name,
    timestamp:              row.timestamp,
    items: (row.pos_transaction_items ?? []).map(item => ({
      drugId:        item.drug_id ?? '',
      brandName:     item.brand_name,
      unitPrice:     Number(item.unit_price),
      quantity:      item.quantity,
      total:         Number(item.total),
      isPrescription: item.is_prescription,
    })),
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

/** Fetch all transactions for a tenant (optionally limited) */
export async function getTransactions(tenantId: string, limit = 200): Promise<POSTransaction[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_POS_TRANSACTIONS;
  }
  const { data, error } = await supabase
    .from('pos_transactions')
    .select('*, pos_transaction_items(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`[posRepository.getTransactions] ${error.message}`);
  return (data ?? []).map(row => dbToDomain(row as any));
}

/** Insert a completed POS transaction with all its items (as a DB transaction) */
export async function insertTransaction(
  tx: POSTransaction,
  tenantId: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  // Insert the transaction header
  const { data: inserted, error: txErr } = await (supabase
    .from('pos_transactions') as any)
    .insert({
      tenant_id:                tenantId,
      receipt_no:               tx.receiptNo,
      customer_name:            tx.customerName,
      customer_phone:           tx.customerPhone || null,
      subtotal:                 tx.subtotal,
      tax_amount:               tx.taxAmount,
      discount_amount:          tx.discountAmount,
      insurance_copay_amount:   tx.insuranceCopayAmount,
      insurance_covered_amount: tx.insuranceCoveredAmount,
      total_paid:               tx.totalPaid,
      payment_method:           tx.paymentMethod,
      mpesa_ref:                tx.mpesaRef || null,
      cashier_name:             tx.cashierName,
      timestamp:                tx.timestamp,
    })
    .select('id')
    .single();

  if (txErr) throw new Error(`[posRepository.insertTransaction] ${txErr.message}`);
  if (!inserted?.id) return;

  // Insert the line items
  const items = tx.items.map(item => ({
    transaction_id:  inserted.id,
    tenant_id:       tenantId,
    drug_id:         item.drugId || null,
    brand_name:      item.brandName,
    unit_price:      item.unitPrice,
    quantity:        item.quantity,
    total:           item.total,
    is_prescription: Boolean(item.isPrescription),
  }));

  const { error: itemsErr } = await (supabase
    .from('pos_transaction_items') as any)
    .insert(items);

  if (itemsErr) throw new Error(`[posRepository.insertTransaction items] ${itemsErr.message}`);
}

/** Fetch transactions within a date range */
export async function getTransactionsByDateRange(
  tenantId: string,
  from: string,
  to: string
): Promise<POSTransaction[]> {
  if (!isSupabaseConfigured || !supabase) return INITIAL_POS_TRANSACTIONS;
  const { data, error } = await supabase
    .from('pos_transactions')
    .select('*, pos_transaction_items(*)')
    .eq('tenant_id', tenantId)
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`[posRepository.getTransactionsByDateRange] ${error.message}`);
  return (data ?? []).map(row => dbToDomain(row as any));
}
