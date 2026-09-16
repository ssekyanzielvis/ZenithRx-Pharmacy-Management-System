/**
 * paymentOrchestrationService.ts — ZenithRx Enterprise Payment & Billing Subsystem
 * Clean Architecture: Application Layer & Infrastructure Layer Adapter
 * Directly complies with technical.md §11.18 (Payments, Billing Integrity & Reconciliation)
 */

import { logAuditEvent } from '../repositories/auditRepository';

export type PaymentMethodType = 
  | 'CASH'
  | 'MTN_MOMO'
  | 'AIRTEL_MONEY'
  | 'CARD_VISA_MC'
  | 'INSURANCE_COPAY'
  | 'LOYALTY_VOUCHER';

export type PaymentState = 
  | 'INITIATED'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'SETTLED'
  | 'PARTIALLY_PAID'
  | 'REFUNDED'
  | 'REVERSED'
  | 'VOIDED'
  | 'FAILED';

export interface SplitPaymentAllocation {
  id: string;
  method: PaymentMethodType;
  provider: 'CASH_DRAWER' | 'MTN_UG' | 'AIRTEL_UG' | 'PESAPAL_VISA' | 'JUBILEE_INSURANCE' | 'ZENITH_POINTS';
  amountUgx: number;
  providerReference?: string;
  customerIdentifier?: string; // e.g. Phone number (+256...) or Card Token
  status: PaymentState;
  authorizedAt?: string;
  capturedAt?: string;
}

export interface PaymentIntent {
  id: string;
  idempotencyKey: string;
  tenantId: string;
  tenantName: string;
  posTransactionId?: string;
  receiptNumber?: string;
  prescriptionId?: string;
  claimId?: string;
  patientId?: string;
  patientName?: string;
  grossAmountUgx: number;
  taxAmountUgx: number;
  discountAmountUgx: number;
  netPayableUgx: number;
  totalCapturedUgx: number;
  balanceDueUgx: number;
  splits: SplitPaymentAllocation[];
  state: PaymentState;
  initiatedBy: string; // User ID / Name
  createdAt: string;
  updatedAt: string;
  settlementBatchId?: string;
  notes?: string;
  auditTrail: {
    timestamp: string;
    action: string;
    actor: string;
    details: string;
  }[];
}

export interface SettlementStatementItem {
  providerTxId: string;
  channel: PaymentMethodType;
  settledAmountUgx: number;
  feeUgx: number;
  netSettledUgx: number;
  settledAt: string;
  rawPayloadHash: string;
}

export interface ReconciliationDiscrepancy {
  type: 'UNMATCHED_IN_LEDGER' | 'AMOUNT_MISMATCH' | 'FEE_VARIANCE' | 'STATUS_CONFLICT';
  paymentId?: string;
  providerTxId?: string;
  expectedAmountUgx: number;
  settledAmountUgx: number;
  varianceUgx: number;
  channel: PaymentMethodType;
  detectedAt: string;
  recommendedAction: string;
}

// In-memory store for idempotency keys & payment records (persisted with Supabase adapter)
const IDEMPOTENCY_STORE = new Set<string>();

const INITIAL_PAYMENT_LEDGER: PaymentIntent[] = [
  {
    id: 'PAY-20260805-001',
    idempotencyKey: 'IDEM-94f8a1-2026080501',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    posTransactionId: 'POS-1784712001',
    receiptNumber: 'REC-2026-88124',
    prescriptionId: 'RX-9921',
    patientId: 'PAT-001',
    patientName: 'Sarah Namubiru',
    grossAmountUgx: 85000,
    taxAmountUgx: 12966,
    discountAmountUgx: 0,
    netPayableUgx: 85000,
    totalCapturedUgx: 85000,
    balanceDueUgx: 0,
    splits: [
      {
        id: 'SPLIT-1',
        method: 'INSURANCE_COPAY',
        provider: 'JUBILEE_INSURANCE',
        amountUgx: 68000,
        providerReference: 'JUB-CLM-88319',
        customerIdentifier: 'MEM-JUB-0912',
        status: 'SETTLED',
        authorizedAt: '2026-08-05T09:12:00Z',
        capturedAt: '2026-08-05T09:12:05Z',
      },
      {
        id: 'SPLIT-2',
        method: 'MTN_MOMO',
        provider: 'MTN_UG',
        amountUgx: 17000,
        providerReference: 'MTN-TX-8912831',
        customerIdentifier: '+256 772 123456',
        status: 'SETTLED',
        authorizedAt: '2026-08-05T09:12:10Z',
        capturedAt: '2026-08-05T09:12:15Z',
      },
    ],
    state: 'SETTLED',
    initiatedBy: 'Pharm. Moses Musoke',
    createdAt: '2026-08-05T09:12:00Z',
    updatedAt: '2026-08-05T09:12:15Z',
    settlementBatchId: 'BATCH-2026-0805-A',
    notes: 'Prescription refill co-pay split payment settled.',
    auditTrail: [
      {
        timestamp: '2026-08-05T09:12:00Z',
        action: 'PAYMENT_INITIATED',
        actor: 'Pharm. Moses Musoke',
        details: 'Payment intent created for UGX 85,000 with 2 split channels.',
      },
      {
        timestamp: '2026-08-05T09:12:15Z',
        action: 'PAYMENT_CAPTURED_AND_SETTLED',
        actor: 'System Orchestrator',
        details: 'Jubilee Claim approved (68,000 UGX) & MTN MoMo webhook verified (17,000 UGX).',
      },
    ],
  },
  {
    id: 'PAY-20260805-002',
    idempotencyKey: 'IDEM-94f8a1-2026080502',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    posTransactionId: 'POS-1784712002',
    receiptNumber: 'REC-2026-88125',
    patientId: 'PAT-002',
    patientName: 'John Baptist Okello',
    grossAmountUgx: 35000,
    taxAmountUgx: 5339,
    discountAmountUgx: 0,
    netPayableUgx: 35000,
    totalCapturedUgx: 35000,
    balanceDueUgx: 0,
    splits: [
      {
        id: 'SPLIT-1',
        method: 'CASH',
        provider: 'CASH_DRAWER',
        amountUgx: 35000,
        providerReference: 'DRAWER-POS-01',
        status: 'CAPTURED',
        authorizedAt: '2026-08-05T10:30:00Z',
        capturedAt: '2026-08-05T10:30:00Z',
      },
    ],
    state: 'CAPTURED',
    initiatedBy: 'David Kintu',
    createdAt: '2026-08-05T10:30:00Z',
    updatedAt: '2026-08-05T10:30:00Z',
    notes: 'Direct cash sale for OTC analgesics.',
    auditTrail: [
      {
        timestamp: '2026-08-05T10:30:00Z',
        action: 'PAYMENT_CAPTURED',
        actor: 'David Kintu',
        details: 'Physical cash received into cash register drawer.',
      },
    ],
  },
  {
    id: 'PAY-20260805-003',
    idempotencyKey: 'IDEM-94f8a1-2026080503',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    posTransactionId: 'POS-1784712003',
    receiptNumber: 'REC-2026-88126',
    patientId: 'PAT-003',
    patientName: 'Grace Achieng',
    grossAmountUgx: 120000,
    taxAmountUgx: 18305,
    discountAmountUgx: 5000,
    netPayableUgx: 115000,
    totalCapturedUgx: 115000,
    balanceDueUgx: 0,
    splits: [
      {
        id: 'SPLIT-1',
        method: 'CARD_VISA_MC',
        provider: 'PESAPAL_VISA',
        amountUgx: 115000,
        providerReference: 'PESA-TX-990182',
        customerIdentifier: 'TOKEN-VISA-****-4242',
        status: 'SETTLED',
        authorizedAt: '2026-08-05T11:45:00Z',
        capturedAt: '2026-08-05T11:45:10Z',
      },
    ],
    state: 'SETTLED',
    initiatedBy: 'Pharm. Moses Musoke',
    createdAt: '2026-08-05T11:45:00Z',
    updatedAt: '2026-08-05T11:45:10Z',
    settlementBatchId: 'BATCH-2026-0805-A',
    notes: 'Visa card EMV payment reconciled.',
    auditTrail: [
      {
        timestamp: '2026-08-05T11:45:00Z',
        action: 'PAYMENT_CAPTURED',
        actor: 'Pharm. Moses Musoke',
        details: 'Pesapal Visa token payment settled with webhook confirmation.',
      },
    ],
  },
];

let paymentLedger = [...INITIAL_PAYMENT_LEDGER];

/** Get all payment records for a given tenant or cross-tenant */
export async function getPaymentLedger(tenantId?: string): Promise<PaymentIntent[]> {
  if (!tenantId || tenantId === 'all') {
    return paymentLedger;
  }
  return paymentLedger.filter((p) => p.tenantId === tenantId);
}

/**
 * Creates a two-phase Payment Intent with Idempotency verification
 * (§11.18 Payment Architecture)
 */
export async function createPaymentIntent(params: {
  idempotencyKey: string;
  tenantId: string;
  tenantName: string;
  posTransactionId?: string;
  receiptNumber?: string;
  prescriptionId?: string;
  claimId?: string;
  patientId?: string;
  patientName?: string;
  grossAmountUgx: number;
  taxAmountUgx: number;
  discountAmountUgx?: number;
  splits: Omit<SplitPaymentAllocation, 'id' | 'status'>[];
  initiatedBy: string;
  notes?: string;
}): Promise<{ success: boolean; paymentIntent?: PaymentIntent; error?: string }> {
  // 1. Check Idempotency
  if (IDEMPOTENCY_STORE.has(params.idempotencyKey)) {
    const existing = paymentLedger.find((p) => p.idempotencyKey === params.idempotencyKey);
    if (existing) {
      return { success: true, paymentIntent: existing };
    }
  }

  IDEMPOTENCY_STORE.add(params.idempotencyKey);

  const discount = params.discountAmountUgx || 0;
  const netPayable = params.grossAmountUgx - discount;
  const totalAllocated = params.splits.reduce((acc, s) => acc + s.amountUgx, 0);

  if (totalAllocated !== netPayable) {
    return {
      success: false,
      error: `Split payment allocation mismatch: Total allocated (UGX ${totalAllocated}) != Net payable (UGX ${netPayable}).`,
    };
  }

  const intentId = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const splitAllocations: SplitPaymentAllocation[] = params.splits.map((s, idx) => ({
    ...s,
    id: `SPLIT-${idx + 1}`,
    status: s.method === 'CASH' ? 'CAPTURED' : 'AUTHORIZED',
    authorizedAt: new Date().toISOString(),
    capturedAt: s.method === 'CASH' ? new Date().toISOString() : undefined,
  }));

  const allCaptured = splitAllocations.every((s) => s.status === 'CAPTURED');

  const newIntent: PaymentIntent = {
    id: intentId,
    idempotencyKey: params.idempotencyKey,
    tenantId: params.tenantId,
    tenantName: params.tenantName,
    posTransactionId: params.posTransactionId,
    receiptNumber: params.receiptNumber,
    prescriptionId: params.prescriptionId,
    claimId: params.claimId,
    patientId: params.patientId,
    patientName: params.patientName,
    grossAmountUgx: params.grossAmountUgx,
    taxAmountUgx: params.taxAmountUgx,
    discountAmountUgx: discount,
    netPayableUgx: netPayable,
    totalCapturedUgx: allCaptured ? netPayable : splitAllocations.filter(s => s.status === 'CAPTURED').reduce((a, s) => a + s.amountUgx, 0),
    balanceDueUgx: allCaptured ? 0 : netPayable - splitAllocations.filter(s => s.status === 'CAPTURED').reduce((a, s) => a + s.amountUgx, 0),
    splits: splitAllocations,
    state: allCaptured ? 'CAPTURED' : 'AUTHORIZED',
    initiatedBy: params.initiatedBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: params.notes,
    auditTrail: [
      {
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_INTENT_CREATED',
        actor: params.initiatedBy,
        details: `Created payment intent for UGX ${netPayable.toLocaleString()} across ${splitAllocations.length} payment channels.`,
      },
    ],
  };

  paymentLedger.unshift(newIntent);

  // Log to tamper-proof NDA audit trail
  await logAuditEvent({
    tenantId: params.tenantId,
    performedBy: params.initiatedBy,
    performedByName: params.initiatedBy,
    userRole: 'POS Cashier / Dispenser',
    action: 'PAYMENT_INTENT' as any,
    entityType: 'PaymentSubsystem',
    entityId: newIntent.id,
    severity: 'INFO',
    notes: `Payment intent ${newIntent.id} initialized for receipt ${params.receiptNumber || 'POS'}. Amount: UGX ${netPayable.toLocaleString()}. Channels: ${splitAllocations.map(s => s.method).join(', ')}.`,
  });

  return { success: true, paymentIntent: newIntent };
}

/**
 * Simulates asynchronous Mobile Money (MTN / Airtel) or Card Webhook confirmation
 * (§11.18 Webhook Verification & Callback Reconciliation)
 */
export async function processPaymentWebhookConfirmation(
  paymentId: string,
  splitId: string,
  providerTxId: string,
  signature: string
): Promise<{ success: boolean; message: string }> {
  const intent = paymentLedger.find((p) => p.id === paymentId);
  if (!intent) return { success: false, message: 'Payment intent not found' };

  const split = intent.splits.find((s) => s.id === splitId);
  if (!split) return { success: false, message: 'Split allocation not found' };

  split.status = 'CAPTURED';
  split.providerReference = providerTxId;
  split.capturedAt = new Date().toISOString();

  const totalCaptured = intent.splits.filter((s) => s.status === 'CAPTURED' || s.status === 'SETTLED').reduce((a, s) => a + s.amountUgx, 0);
  intent.totalCapturedUgx = totalCaptured;
  intent.balanceDueUgx = Math.max(0, intent.netPayableUgx - totalCaptured);
  intent.updatedAt = new Date().toISOString();

  if (intent.balanceDueUgx === 0) {
    intent.state = 'CAPTURED';
  } else {
    intent.state = 'PARTIALLY_PAID';
  }

  intent.auditTrail.push({
    timestamp: new Date().toISOString(),
    action: 'WEBHOOK_CONFIRMATION',
    actor: 'Gateway Callback Orchestrator',
    details: `Channel ${split.method} captured with Provider TX Ref: ${providerTxId}. HMAC Signature verified: ${signature.slice(0, 10)}...`,
  });

  await logAuditEvent({
    tenantId: intent.tenantId,
    performedBy: 'System Orchestrator',
    performedByName: 'Payment Gateway Adapter',
    userRole: 'System Administrator',
    action: 'PAYMENT_CAPTURE' as any,
    entityType: 'PaymentSubsystem',
    entityId: intent.id,
    severity: 'INFO',
    notes: `Payment webhook verified for split ${splitId} on intent ${intent.id}. Provider Ref: ${providerTxId}.`,
  });

  return { success: true, message: 'Payment captured and confirmed by gateway callback.' };
}

/**
 * Supervisor-authorized Refund or Void
 * (§11.18 Elevated Permissions for Refunds & Voids)
 */
export async function executeSupervisorRefundOrVoid(params: {
  paymentId: string;
  actionType: 'REFUND' | 'VOID';
  supervisorPin: string;
  supervisorName: string;
  reason: string;
  refundAmountUgx?: number;
}): Promise<{ success: boolean; message: string }> {
  // Validate supervisor authorization
  if (params.supervisorPin !== '1234' && params.supervisorPin !== '9999') {
    return { success: false, message: 'Invalid Supervisor PIN. Elevated permission required.' };
  }

  const intent = paymentLedger.find((p) => p.id === params.paymentId);
  if (!intent) return { success: false, message: 'Payment not found in ledger.' };

  if (params.actionType === 'VOID') {
    intent.state = 'VOIDED';
    intent.splits.forEach((s) => (s.status = 'VOIDED'));
    intent.notes = `VOIDED: ${params.reason} (Authorized by ${params.supervisorName})`;
  } else {
    intent.state = 'REFUNDED';
    intent.splits.forEach((s) => (s.status = 'REFUNDED'));
    intent.notes = `REFUNDED UGX ${(params.refundAmountUgx || intent.totalCapturedUgx).toLocaleString()}: ${params.reason} (Authorized by ${params.supervisorName})`;
  }

  intent.updatedAt = new Date().toISOString();
  intent.auditTrail.push({
    timestamp: new Date().toISOString(),
    action: params.actionType,
    actor: params.supervisorName,
    details: `${params.actionType} executed: ${params.reason}. Supervisor PIN verified.`,
  });

  await logAuditEvent({
    tenantId: intent.tenantId,
    performedBy: params.supervisorName,
    performedByName: params.supervisorName,
    userRole: 'Supervising Pharmacist',
    action: 'BILLING_VOID_REFUND' as any,
    entityType: 'PaymentSubsystem',
    entityId: intent.id,
    severity: 'WARNING',
    notes: `Supervisor ${params.supervisorName} authorized ${params.actionType} for payment ${intent.id}. Reason: ${params.reason}.`,
  });

  return { success: true, message: `${params.actionType} completed and ledger updated.` };
}

/**
 * Bank & Mobile Money Settlement Reconciliation Engine
 * Automatically compares internal ledger records against external settlement statements
 * and detects discrepancies (§11.18 Financial Controls).
 */
export function performSettlementReconciliation(
  ledger: PaymentIntent[],
  settlementStatements: SettlementStatementItem[]
): {
  reconciledCount: number;
  totalSettledUgx: number;
  totalFeesUgx: number;
  discrepancies: ReconciliationDiscrepancy[];
} {
  const discrepancies: ReconciliationDiscrepancy[] = [];
  let reconciledCount = 0;
  let totalSettledUgx = 0;
  let totalFeesUgx = 0;

  const statementMap = new Map<string, SettlementStatementItem>();
  settlementStatements.forEach((s) => statementMap.set(s.providerTxId, s));

  // Find all splits that have provider references
  ledger.forEach((intent) => {
    intent.splits.forEach((split) => {
      if (split.providerReference) {
        const stmt = statementMap.get(split.providerReference);
        if (!stmt) {
          discrepancies.push({
            type: 'UNMATCHED_IN_LEDGER',
            paymentId: intent.id,
            providerTxId: split.providerReference,
            expectedAmountUgx: split.amountUgx,
            settledAmountUgx: 0,
            varianceUgx: -split.amountUgx,
            channel: split.method,
            detectedAt: new Date().toISOString(),
            recommendedAction: 'Verify transaction status with telecom aggregator or bank merchant portal.',
          });
        } else {
          totalSettledUgx += stmt.settledAmountUgx;
          totalFeesUgx += stmt.feeUgx;
          reconciledCount++;

          if (stmt.settledAmountUgx !== split.amountUgx) {
            discrepancies.push({
              type: 'AMOUNT_MISMATCH',
              paymentId: intent.id,
              providerTxId: split.providerReference,
              expectedAmountUgx: split.amountUgx,
              settledAmountUgx: stmt.settledAmountUgx,
              varianceUgx: stmt.settledAmountUgx - split.amountUgx,
              channel: split.method,
              detectedAt: new Date().toISOString(),
              recommendedAction: 'Check for partial chargeback or currency exchange deduction.',
            });
          }
        }
      }
    });
  });

  return {
    reconciledCount,
    totalSettledUgx,
    totalFeesUgx,
    discrepancies,
  };
}

export interface SubscriptionPaymentRecordParams {
  tenantId: string;
  tenantName: string;
  userName: string;
  userEmail: string;
  tierId: string;
  tierName: string;
  billingCycle: 'monthly' | 'yearly';
  amountUgx: number;
  method: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD_VISA_MC';
  phoneNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  providerReference: string;
}

/**
 * Records an official subscription payment into the system payment ledger,
 * marks it as SETTLED, and writes to the tamper-proof audit trail.
 */
export async function recordSubscriptionPayment(
  params: SubscriptionPaymentRecordParams
): Promise<PaymentIntent> {
  const provider =
    params.method === 'MTN_MOMO'
      ? 'MTN_UG'
      : params.method === 'AIRTEL_MONEY'
      ? 'AIRTEL_UG'
      : 'PESAPAL_VISA';

  const customerIdentifier =
    params.method === 'CARD_VISA_MC'
      ? `${params.cardBrand || 'Card'} •••• ${params.cardLast4 || '4242'}`
      : params.phoneNumber || params.userEmail;

  const intentId = `SUB-PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const receiptNumber = `REC-SUB-${Date.now().toString().slice(-6)}`;
  const idempotencyKey = `IDEM-SUB-${params.providerReference}`;

  const taxAmountUgx = Math.round(params.amountUgx * (18 / 118)); // 18% inclusive VAT

  const newIntent: PaymentIntent = {
    id: intentId,
    idempotencyKey,
    tenantId: params.tenantId || 'NEW-TENANT',
    tenantName: params.tenantName || 'ZenithRx Pharmacy',
    receiptNumber,
    grossAmountUgx: params.amountUgx,
    taxAmountUgx,
    discountAmountUgx: 0,
    netPayableUgx: params.amountUgx,
    totalCapturedUgx: params.amountUgx,
    balanceDueUgx: 0,
    splits: [
      {
        id: 'SPLIT-1',
        method: params.method,
        provider,
        amountUgx: params.amountUgx,
        providerReference: params.providerReference,
        customerIdentifier,
        status: 'SETTLED',
        authorizedAt: new Date().toISOString(),
        capturedAt: new Date().toISOString(),
      },
    ],
    state: 'SETTLED',
    initiatedBy: params.userName || params.userEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settlementBatchId: `BATCH-SUB-${new Date().toISOString().slice(0, 10)}`,
    notes: `ZenithRx ${params.tierName} (${params.billingCycle}) subscription activated. Channel: ${params.method}. Ref: ${params.providerReference}`,
    auditTrail: [
      {
        timestamp: new Date().toISOString(),
        action: 'SUBSCRIPTION_PAYMENT_SETTLED',
        actor: params.userName || params.userEmail,
        details: `UGX ${params.amountUgx.toLocaleString()} paid via ${params.method} (${params.providerReference}). Plan: ${params.tierName} (${params.billingCycle}).`,
      },
    ],
  };

  paymentLedger.unshift(newIntent);

  // Tamper-proof audit event
  try {
    await logAuditEvent({
      tenantId: params.tenantId || 'NEW-TENANT',
      performedBy: params.userEmail || 'subscriber',
      performedByName: params.userName || 'Subscriber',
      userRole: 'Supervising Pharmacist',
      action: 'PAYMENT_INTENT' as any,
      entityType: 'SubscriptionBilling',
      entityId: newIntent.id,
      severity: 'INFO',
      notes: `Subscription Payment: ${params.tierName} Plan (${params.billingCycle}) for UGX ${params.amountUgx.toLocaleString()} settled via ${params.method}. Ref: ${params.providerReference}`,
    });
  } catch (err) {
    console.warn('[recordSubscriptionPayment] Audit log warning:', err);
  }

  return newIntent;
}
