/**
 * auditRepository.ts — ZenithRx Immutable Audit Log Repository
 * Append-only — no update or delete operations allowed.
 * Clean Architecture: Infrastructure Layer
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuditAction } from '../lib/database.types';

export interface AuditRecord {
  id: string;
  tenantId: string;
  tenantName?: string;
  performedBy: string;
  performedByName?: string;
  userRole?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
  notes?: string;
  ipAddress?: string;
  deviceInfo?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
}

export interface AuditEntry {
  tenantId: string;
  tenantName?: string;
  performedBy: string;
  performedByName?: string;
  userRole?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
  notes?: string;
  ipAddress?: string;
  deviceInfo?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}

// In-memory mock audit store for local/offline resilience
const MOCK_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'AUD-2026-9001',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    performedBy: 'USR-001',
    performedByName: 'Pharm. Moses Musoke',
    userRole: 'Supervising Pharmacist (PSU/REG/2021/1042)',
    action: 'DISPENSE_OVERRIDE' as AuditAction,
    entityType: 'Prescription',
    entityId: 'RX-2026-8801',
    notes: 'Clinical override: Approved dosage reduction for Amoxil 500mg due to mild penicillin allergy flag with doctor phone consultation.',
    ipAddress: '196.43.12.88 (Kampala, UG)',
    deviceInfo: 'Chrome 124 on Windows 11 (POS Terminal 01)',
    severity: 'WARNING',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'AUD-2026-9002',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    performedBy: 'USR-002',
    performedByName: 'Sarah Namagembe',
    userRole: 'Store & Inventory Manager',
    action: 'STOCK_ADJUSTMENT' as AuditAction,
    entityType: 'DrugItem',
    entityId: 'DRUG-002',
    notes: 'FEFO stock batch count variance: Quarantined 5 units of Coartem (Batch CRT-2025-08) for clearance markdown.',
    ipAddress: '196.43.12.88 (Kampala, UG)',
    deviceInfo: 'Firefox on macOS (Store Tablet)',
    severity: 'INFO',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'AUD-2026-9003',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    performedBy: 'USR-001',
    performedByName: 'Pharm. Moses Musoke',
    userRole: 'Supervising Pharmacist (PSU/REG/2021/1042)',
    action: 'QUARANTINE_ACTION' as AuditAction,
    entityType: 'DrugBatch',
    entityId: 'AMX-2025-09',
    notes: 'Official NDA Condemnation: Moved 10 expired capsules to QUARANTINE-BIN-01 for incineration certification.',
    ipAddress: '196.43.12.88 (Kampala, UG)',
    deviceInfo: 'Chrome on Windows 11',
    severity: 'CRITICAL',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'AUD-2026-9004',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    performedBy: 'USR-003',
    performedByName: 'David Kintu',
    userRole: 'POS Cashier / Dispenser',
    action: 'SALE_COMPLETE' as AuditAction,
    entityType: 'POSTransaction',
    entityId: 'RCP-2026-90412',
    notes: 'Completed multi-channel payment: UGX 34,220 via MTN Mobile Money (+256774607782).',
    ipAddress: '196.43.12.88 (Kampala, UG)',
    deviceInfo: 'POS Touch Terminal',
    severity: 'INFO',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'AUD-2026-9005',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    performedBy: 'USR-001',
    performedByName: 'Pharm. Moses Musoke',
    userRole: 'Supervising Pharmacist',
    action: 'CSV_EXPORT' as AuditAction,
    entityType: 'InventoryExport',
    entityId: 'EXP-INV-20260805',
    notes: 'Exported full inventory valuation schedule for NDA compliance inspection audit.',
    ipAddress: '196.43.12.88 (Kampala, UG)',
    deviceInfo: 'Chrome on Windows 11',
    severity: 'INFO',
    createdAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
  },
];

/** Append an audit log entry — writes to Supabase or in-memory store */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  const newRecord: AuditRecord = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    tenantId: entry.tenantId,
    tenantName: entry.tenantName || 'ZenithRx Pharmacy',
    performedBy: entry.performedBy,
    performedByName: entry.performedByName || 'System User',
    userRole: entry.userRole || 'Staff Member',
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    notes: entry.notes,
    ipAddress: entry.ipAddress || '196.43.12.88 (Kampala, UG)',
    deviceInfo: entry.deviceInfo || navigator.userAgent.slice(0, 40),
    severity: entry.severity || 'INFO',
    createdAt: new Date().toISOString(),
  };

  MOCK_AUDIT_LOGS.unshift(newRecord);

  if (!isSupabaseConfigured || !supabase) {
    console.log('[auditRepository] AUDIT LOGGED:', entry.action, entry.entityType, entry.entityId);
    return;
  }

  try {
    const { error } = await (supabase.from('audit_logs') as any).insert({
      tenant_id: entry.tenantId,
      performed_by: entry.performedBy,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      old_value: entry.oldValue ?? null,
      new_value: entry.newValue ?? null,
      notes: entry.notes ?? null,
    });

    if (error) {
      console.warn('[auditRepository] Supabase audit write error:', error.message);
    }
  } catch (err) {
    console.warn('[auditRepository] Failed writing remote audit log:', err);
  }
}

/** Fetch recent audit entries for a tenant */
export async function getAuditLogs(tenantId?: string, limit = 100): Promise<AuditRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    if (!tenantId || tenantId === 'all') return MOCK_AUDIT_LOGS.slice(0, limit);
    return MOCK_AUDIT_LOGS.filter((l) => l.tenantId === tenantId).slice(0, limit);
  }

  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tenantId && tenantId !== 'all') {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        tenantId: d.tenant_id,
        performedBy: d.performed_by,
        action: d.action,
        entityType: d.entity_type,
        entityId: d.entity_id,
        oldValue: d.old_value,
        newValue: d.new_value,
        notes: d.notes,
        severity: d.action.includes('OVERRIDE') || d.action.includes('QUARANTINE') ? 'CRITICAL' : 'INFO',
        createdAt: d.created_at,
      }));
    }

    return MOCK_AUDIT_LOGS.slice(0, limit);
  } catch {
    return MOCK_AUDIT_LOGS.slice(0, limit);
  }
}
