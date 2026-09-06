/**
 * formatters.ts — ZenithRx Domain Formatting Service
 * All currency, date, ID generation, and data formatting utilities.
 * Clean Architecture: Infrastructure / Service Layer
 */

/** Format a number as Ugandan Shillings */
export function formatUGX(amount: number): string {
  return `UGX ${Math.round(amount).toLocaleString('en-UG')}`;
}

/** Format a number as compact UGX (e.g. UGX 1.2M, UGX 450K) */
export function formatUGXCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `UGX ${(amount / 1_000).toFixed(0)}K`;
  }
  return formatUGX(amount);
}

/** Format ISO date string to locale display */
export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/** Format ISO date string to short form: 22 Aug 2026 */
export function formatDateShort(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a full timestamp */
export function formatTimestamp(ts: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString('en-UG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Compute days remaining from today to an expiry date */
export function computeDaysRemaining(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Classify expiry risk level */
export type ExpiryRisk = 'Expired' | 'Critical' | 'Warning' | 'Healthy';

export function classifyExpiryRisk(daysRemaining: number): ExpiryRisk {
  if (daysRemaining <= 0) return 'Expired';
  if (daysRemaining <= 30) return 'Critical';
  if (daysRemaining <= 90) return 'Warning';
  return 'Healthy';
}

/** Generate a receipt number: RCP-2026-XXXXX */
export function generateReceiptNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `RCP-${year}-${rand}`;
}

/** Generate a prescription Rx number */
export function generateRxNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RX-${year}-${rand}`;
}

/** Generate a Purchase Order number */
export function generatePONumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  return `PO-${year}-${rand}`;
}

/** Generate a simple UUID-like ID */
export function generateId(prefix = 'ID'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/** Today as ISO date string YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Percentage string with 1 decimal */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
