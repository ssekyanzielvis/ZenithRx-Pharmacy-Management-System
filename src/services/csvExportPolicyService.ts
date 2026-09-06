/**
 * csvExportPolicyService.ts — Controlled CSV Export Policy Engine
 * Clean Architecture: Application / Service Layer
 * Directly complies with technical.md §11.20 ("CSV export policy for admin and client users")
 */

import { logAuditEvent } from '../repositories/auditRepository';
import { ExportJob, ExportPermission, queueExportJob } from './exportJobService';

export type UserExportScope = 'ADMIN_CROSS_TENANT' | 'TENANT_OWN_DATA' | 'AUDITOR_COMPLIANCE';

export interface CsvExportPolicyContext {
  userId: string;
  userFullName: string;
  userRole: string;
  tenantId: string;
  tenantName: string;
  isSuperAdmin: boolean;
  permissions: string[];
}

export interface ExportDatasetOptions {
  dataset: 
    | 'INVENTORY'
    | 'PRESCRIPTIONS'
    | 'POS_TRANSACTIONS'
    | 'CUSTOMERS_PATIENTS'
    | 'STAFF_COLLABORATORS'
    | 'INSURANCE_CLAIMS'
    | 'SUPPLIERS'
    | 'AUDIT_LOGS'
    | 'FULL_CROSS_MODULE_BACKUP';
  format: 'CSV' | 'ZIP';
  applyDataMasking?: boolean;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  reason: string;
  effectiveScope: 'ALL_TENANTS' | 'OWN_TENANT_ONLY' | 'REDACTED_AUDIT';
  requiredPermission: ExportPermission;
  shouldQueueAsync: boolean;
  maskedColumns: string[];
}

/**
 * Evaluates whether a user can execute an export and calculates required redactions & scoping.
 * Enforces technical.md §11.20 CSV export policy rules.
 */
export function evaluateExportPolicy(
  ctx: CsvExportPolicyContext,
  opts: ExportDatasetOptions
): PolicyEvaluationResult {
  // 1. Audit Log Exports require EXPORT_AUDIT_LOGS or Super Admin
  if (opts.dataset === 'AUDIT_LOGS') {
    if (ctx.isSuperAdmin || ctx.userRole.includes('Auditor') || ctx.permissions.includes('EXPORT_AUDIT_LOGS')) {
      return {
        allowed: true,
        reason: 'Compliance audit export authorized under NDA §42 regulatory rules.',
        effectiveScope: ctx.isSuperAdmin ? 'ALL_TENANTS' : 'OWN_TENANT_ONLY',
        requiredPermission: 'EXPORT_AUDIT_LOGS',
        shouldQueueAsync: false,
        maskedColumns: [],
      };
    }
    return {
      allowed: false,
      reason: 'Audit log exports require EXPORT_AUDIT_LOGS permission or NDA Auditor role.',
      effectiveScope: 'OWN_TENANT_ONLY',
      requiredPermission: 'EXPORT_AUDIT_LOGS',
      shouldQueueAsync: false,
      maskedColumns: [],
    };
  }

  // 2. Full Cross-Module or Cross-Tenant Backup requires Super Admin / EXPORT_ALL_CLIENT_DATA
  if (opts.dataset === 'FULL_CROSS_MODULE_BACKUP') {
    if (ctx.isSuperAdmin) {
      return {
        allowed: true,
        reason: 'Admin cross-tenant system backup authorized for migration, audit, or recovery.',
        effectiveScope: 'ALL_TENANTS',
        requiredPermission: 'EXPORT_ALL_CLIENT_DATA',
        shouldQueueAsync: true,
        maskedColumns: [],
      };
    }
    // Tenant Admin can export full package for OWN tenant
    if (ctx.userRole === 'Tenant Admin' || ctx.userRole === 'Supervising Pharmacist') {
      return {
        allowed: true,
        reason: `Full tenant dataset backup authorized for own tenant: ${ctx.tenantName}.`,
        effectiveScope: 'OWN_TENANT_ONLY',
        requiredPermission: 'EXPORT_TENANT_DATA',
        shouldQueueAsync: true,
        maskedColumns: ['ip_address', 'mfa_secret_hashes'],
      };
    }
    return {
      allowed: false,
      reason: 'Full database backups require Tenant Admin or Super Admin privileges.',
      effectiveScope: 'OWN_TENANT_ONLY',
      requiredPermission: 'EXPORT_ALL_CLIENT_DATA',
      shouldQueueAsync: false,
      maskedColumns: [],
    };
  }

  // 3. Patient Medical Data requires EXPORT_PATIENT_DATA or clinical roles
  if (opts.dataset === 'CUSTOMERS_PATIENTS') {
    const hasPatientRight = ctx.isSuperAdmin || ctx.permissions.includes('EXPORT_PATIENT_DATA') || ctx.userRole.includes('Pharmacist');
    return {
      allowed: true,
      reason: hasPatientRight ? 'Clinical patient record export authorized.' : 'Standard export with masked patient identifiers.',
      effectiveScope: ctx.isSuperAdmin ? 'ALL_TENANTS' : 'OWN_TENANT_ONLY',
      requiredPermission: hasPatientRight ? 'EXPORT_PATIENT_DATA' : 'EXPORT_TENANT_DATA',
      shouldQueueAsync: false,
      maskedColumns: hasPatientRight ? [] : ['phone_number', 'national_id', 'exact_address'],
    };
  }

  // 4. Standard Operational Datasets (Inventory, POS, Claims, Suppliers)
  const isCashier = ctx.userRole.includes('Cashier');
  const maskedCols = isCashier && opts.dataset === 'INVENTORY' ? ['cost_price', 'wholesale_margin'] : [];

  return {
    allowed: true,
    reason: `Tenant-scoped ${opts.dataset} export permitted for ${ctx.tenantName}.`,
    effectiveScope: ctx.isSuperAdmin ? 'ALL_TENANTS' : 'OWN_TENANT_ONLY',
    requiredPermission: 'EXPORT_TENANT_DATA',
    shouldQueueAsync: false,
    maskedColumns: maskedCols,
  };
}

/** Utility to convert object rows into CSV format with escaping and column masking */
export function formatToMaskedCsv(
  rows: Record<string, any>[],
  maskedColumns: string[] = []
): string {
  if (!rows || rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const maskSet = new Set(maskedColumns);

  const escapeCell = (val: any, header: string): string => {
    if (val === null || val === undefined) return '';
    if (maskSet.has(header)) {
      const str = String(val);
      if (str.length > 4) {
        return `"${str.slice(0, 3)}***${str.slice(-2)}"`;
      }
      return '"***"';
    }
    const text = String(val).replace(/"/g, '""');
    return /[",\n\r]/.test(text) ? `"${text}"` : text;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h], h)).join(',')),
  ];

  return csvLines.join('\n');
}

/** Trigger browser download for generated CSV */
export function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * High-level policy-compliant export runner that validates permissions, logs audit trails,
 * applies column masking, and triggers direct download or R2 async queue.
 */
export async function executePolicyCompliantExport(
  ctx: CsvExportPolicyContext,
  opts: ExportDatasetOptions,
  sampleDataFetcher: () => Promise<Record<string, any>[]>
): Promise<{ success: boolean; message: string; exportJob?: ExportJob }> {
  const policy = evaluateExportPolicy(ctx, opts);

  if (!policy.allowed) {
    await logAuditEvent({
      tenantId: ctx.tenantId,
      performedBy: ctx.userId,
      performedByName: ctx.userFullName,
      userRole: ctx.userRole as any,
      action: 'CSV_EXPORT' as any,
      entityType: 'ExportPolicy',
      entityId: opts.dataset,
      severity: 'WARNING',
      notes: `Export rejected by policy: ${policy.reason} (Dataset: ${opts.dataset})`,
    });
    return { success: false, message: policy.reason };
  }

  // If large or full backup, queue asynchronously in Cloudflare R2
  if (policy.shouldQueueAsync || opts.format === 'ZIP') {
    const job = await queueExportJob(
      opts.dataset === 'FULL_CROSS_MODULE_BACKUP' ? 'FULL_TENANT_BACKUP' : 'INVENTORY_SCHEDULE',
      policy.effectiveScope === 'ALL_TENANTS' ? 'all' : ctx.tenantId,
      policy.effectiveScope === 'ALL_TENANTS' ? 'All Platform Tenants' : ctx.tenantName,
      ctx.userFullName
    );

    return {
      success: true,
      message: `Export job queued asynchronously in Cloudflare R2 (${job.id}).`,
      exportJob: job,
    };
  }

  // Otherwise, fetch records, apply masking, and trigger instant download
  const rawRows = await sampleDataFetcher();
  const csvText = formatToMaskedCsv(rawRows, policy.maskedColumns);
  const fileName = `${ctx.tenantName.toLowerCase().replace(/\s+/g, '-')}-${opts.dataset.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

  triggerCsvDownload(fileName, csvText);

  // Log successful export to tamper-proof NDA audit trail
  await logAuditEvent({
    tenantId: ctx.tenantId,
    performedBy: ctx.userId,
    performedByName: ctx.userFullName,
    userRole: ctx.userRole as any,
    action: 'CSV_EXPORT' as any,
    entityType: 'ExportPolicy',
    entityId: opts.dataset,
    severity: 'INFO',
    notes: `CSV Export completed: ${opts.dataset} (${rawRows.length} rows, scope: ${policy.effectiveScope}, permission: ${policy.requiredPermission}).`,
  });

  return {
    success: true,
    message: `Export completed successfully: ${rawRows.length} rows exported to ${fileName}.`,
  };
}
