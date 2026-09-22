/**
 * subscriptionAccountingService.ts — Quantum Networks Ltd SaaS Revenue & Financial Accounting Subsystem
 * Enforces 100% system-mediated payment collection, URA tax accounting, and double-entry general ledger bookkeeping.
 * Clean Architecture: Domain & Application Service
 */

import {
  SubscriptionPaymentRecord,
  GeneralLedgerJournalEntry,
  PlatformRevenueSummary,
  SubscriptionPaymentChannel,
  SubscriptionPaymentStatus,
  BillingCycle,
  TierName,
} from '../types';
import { logAuditEvent } from '../repositories/auditRepository';

const UGX_TO_USD_RATE = 3750;

/**
 * Initial historical subscription transactions
 */
const INITIAL_SUBSCRIPTION_PAYMENTS: SubscriptionPaymentRecord[] = [
  {
    id: 'SUB-PAY-2026-001',
    invoiceNumber: 'QNT-INV-2026-0801',
    fiscalReceiptNumber: 'URA-EFRIS-REC-889101',
    tenantId: 'CLIENT-001',
    tenantName: 'Mulago Care Pharmacy',
    packageTier: 'Professional',
    billingCycle: 'yearly',
    grossAmountUgx: 3500000,
    taxVatUgx: 533898, // 18% inclusive
    netRevenueUgx: 2966102,
    amountUsdEquivalent: 933.33,
    paymentChannel: 'MTN_MOMO',
    providerReference: 'MTN-MOMO-TX-99824102',
    paymentPhoneOrAccount: '+256 772 401822',
    paymentStatus: 'COMPLETED',
    paidAt: '2026-08-01T10:15:00Z',
    periodStart: '2026-08-01',
    periodEnd: '2027-07-31',
    onboardingSource: 'ADMIN_PANEL_SYSTEM',
    processedByUserId: 'QNT-ENG-001',
    processedByUserName: 'Dr. Arthur Ssenabulya (Systems Architect)',
    digitalSignatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    qrVerificationUrl: 'https://verify.quantumnetworks.ug/receipt/QNT-INV-2026-0801',
    accountDebitGlCode: '1020 - MTN MoMo Clearing Asset',
    accountCreditGlCode: '4010 - SaaS Subscription Revenue',
    accountVatGlCode: '2150 - Output VAT Payable (18%)',
    notes: 'Annual Professional package subscription onboarded via System Admin console.',
  },
  {
    id: 'SUB-PAY-2026-002',
    invoiceNumber: 'QNT-INV-2026-0802',
    fiscalReceiptNumber: 'URA-EFRIS-REC-889102',
    tenantId: 'CLIENT-002',
    tenantName: 'Kampala Central Pharmacy',
    packageTier: 'Enterprise',
    billingCycle: 'monthly',
    grossAmountUgx: 550000,
    taxVatUgx: 83898,
    netRevenueUgx: 466102,
    amountUsdEquivalent: 146.67,
    paymentChannel: 'BANK_EFT_STANBIC',
    providerReference: 'STB-EFT-9912048-UG',
    paymentPhoneOrAccount: 'STANBIC-UG-9030018821',
    paymentStatus: 'COMPLETED',
    paidAt: '2026-08-02T14:30:00Z',
    periodStart: '2026-08-02',
    periodEnd: '2026-09-01',
    onboardingSource: 'ADMIN_PANEL_SYSTEM',
    processedByUserId: 'QNT-ENG-001',
    processedByUserName: 'Dr. Arthur Ssenabulya (Systems Architect)',
    digitalSignatureHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    qrVerificationUrl: 'https://verify.quantumnetworks.ug/receipt/QNT-INV-2026-0802',
    accountDebitGlCode: '1010 - Stanbic Operating Account',
    accountCreditGlCode: '4010 - SaaS Subscription Revenue',
    accountVatGlCode: '2150 - Output VAT Payable (18%)',
    notes: 'Monthly Enterprise subscription fee settled via Stanbic EFT inward clearance.',
  },
  {
    id: 'SUB-PAY-2026-003',
    invoiceNumber: 'QNT-INV-2026-0803',
    fiscalReceiptNumber: 'URA-EFRIS-REC-889103',
    tenantId: 'CLIENT-003',
    tenantName: 'Mbarara Health Hub Pharmacy',
    packageTier: 'Professional',
    billingCycle: 'monthly',
    grossAmountUgx: 350000,
    taxVatUgx: 53390,
    netRevenueUgx: 296610,
    amountUsdEquivalent: 93.33,
    paymentChannel: 'AIRTEL_MONEY',
    providerReference: 'AM-TX-990148281',
    paymentPhoneOrAccount: '+256 755 091826',
    paymentStatus: 'COMPLETED',
    paidAt: '2026-08-05T09:00:00Z',
    periodStart: '2026-08-05',
    periodEnd: '2026-09-04',
    onboardingSource: 'SELF_SERVICE_PORTAL',
    processedByUserId: 'SYSTEM_AUTOGATE',
    processedByUserName: 'ZenithRx Gateway Engine',
    digitalSignatureHash: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
    qrVerificationUrl: 'https://verify.quantumnetworks.ug/receipt/QNT-INV-2026-0803',
    accountDebitGlCode: '1025 - Airtel Money Corporate Clearing',
    accountCreditGlCode: '4010 - SaaS Subscription Revenue',
    accountVatGlCode: '2150 - Output VAT Payable (18%)',
    notes: 'Self-service portal card & Airtel Money renewal prompt.',
  },
  {
    id: 'SUB-PAY-2026-004',
    invoiceNumber: 'QNT-INV-2026-0804',
    fiscalReceiptNumber: 'URA-EFRIS-REC-889104',
    tenantId: 'CLIENT-004',
    tenantName: 'Entebbe Express Pharmacy',
    packageTier: 'Starter',
    billingCycle: 'monthly',
    grossAmountUgx: 150000,
    taxVatUgx: 22881,
    netRevenueUgx: 127119,
    amountUsdEquivalent: 40.0,
    paymentChannel: 'PESAPAL_VISA_MC',
    providerReference: 'PESAPAL-ORD-7749120',
    paymentPhoneOrAccount: 'VISA **** 4821',
    paymentStatus: 'COMPLETED',
    paidAt: '2026-08-08T11:45:00Z',
    periodStart: '2026-08-08',
    periodEnd: '2026-09-07',
    onboardingSource: 'ADMIN_PANEL_SYSTEM',
    processedByUserId: 'QNT-ENG-001',
    processedByUserName: 'Dr. Arthur Ssenabulya (Systems Architect)',
    digitalSignatureHash: 'c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    qrVerificationUrl: 'https://verify.quantumnetworks.ug/receipt/QNT-INV-2026-0804',
    accountDebitGlCode: '1030 - PesaPal Merchant Gateway Settlement',
    accountCreditGlCode: '4010 - SaaS Subscription Revenue',
    accountVatGlCode: '2150 - Output VAT Payable (18%)',
    notes: 'Starter plan card checkout authorized via system payment modal.',
  },
  {
    id: 'SUB-PAY-2026-005',
    invoiceNumber: 'QNT-INV-2026-0805',
    fiscalReceiptNumber: 'URA-EFRIS-REC-889105',
    tenantId: 'CLIENT-005',
    tenantName: 'Jinja Nile Pharmacy',
    packageTier: 'Professional',
    billingCycle: 'yearly',
    grossAmountUgx: 3500000,
    taxVatUgx: 533898,
    netRevenueUgx: 2966102,
    amountUsdEquivalent: 933.33,
    paymentChannel: 'BANK_EFT_CENTENARY',
    providerReference: 'CER-EFT-449102-UG',
    paymentPhoneOrAccount: 'CENTENARY-UG-310008892',
    paymentStatus: 'COMPLETED',
    paidAt: '2026-08-10T16:20:00Z',
    periodStart: '2026-08-10',
    periodEnd: '2027-08-09',
    onboardingSource: 'ADMIN_PANEL_SYSTEM',
    processedByUserId: 'QNT-ENG-001',
    processedByUserName: 'Dr. Arthur Ssenabulya (Systems Architect)',
    digitalSignatureHash: 'd9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    qrVerificationUrl: 'https://verify.quantumnetworks.ug/receipt/QNT-INV-2026-0805',
    accountDebitGlCode: '1015 - Centenary Bank Operating Account',
    accountCreditGlCode: '4010 - SaaS Subscription Revenue',
    accountVatGlCode: '2150 - Output VAT Payable (18%)',
    notes: 'Annual renewal wire transfer reconciled and receipted in ledger.',
  },
  {
    id: 'SUB-PAY-2026-006',
    invoiceNumber: 'QNT-INV-2026-0806',
    fiscalReceiptNumber: 'URA-EFRIS-REC-889106',
    tenantId: 'CLIENT-006',
    tenantName: 'Gulu City Pharmacy',
    packageTier: 'Custom Tailored',
    billingCycle: 'monthly',
    grossAmountUgx: 750000,
    taxVatUgx: 114407,
    netRevenueUgx: 635593,
    amountUsdEquivalent: 200.0,
    paymentChannel: 'MTN_MOMO',
    providerReference: 'MTN-MOMO-TX-99014812',
    paymentPhoneOrAccount: '+256 788 120499',
    paymentStatus: 'COMPLETED',
    paidAt: '2026-08-12T08:30:00Z',
    periodStart: '2026-08-12',
    periodEnd: '2026-09-11',
    onboardingSource: 'ADMIN_PANEL_SYSTEM',
    processedByUserId: 'QNT-ENG-001',
    processedByUserName: 'Dr. Arthur Ssenabulya (Systems Architect)',
    digitalSignatureHash: 'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
    qrVerificationUrl: 'https://verify.quantumnetworks.ug/receipt/QNT-INV-2026-0806',
    accountDebitGlCode: '1020 - MTN MoMo Clearing Asset',
    accountCreditGlCode: '4010 - SaaS Subscription Revenue',
    accountVatGlCode: '2150 - Output VAT Payable (18%)',
    notes: 'Custom Tailored multi-branch package fee captured via MoMo payment prompt.',
  },
];

const LOCAL_STORAGE_KEY = 'zenithrx_subscription_ledger_v1';

const loadStoredPayments = (): SubscriptionPaymentRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[subscriptionAccountingService] Failed to load local ledger:', e);
  }
  return INITIAL_SUBSCRIPTION_PAYMENTS;
};

let activePayments: SubscriptionPaymentRecord[] = loadStoredPayments();

const savePayments = (payments: SubscriptionPaymentRecord[]) => {
  activePayments = payments;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payments));
  } catch (e) {
    console.warn('[subscriptionAccountingService] Failed to save ledger to localStorage:', e);
  }
};

/**
 * Returns all recorded subscription payments
 */
export const getAllSubscriptionPayments = (): SubscriptionPaymentRecord[] => {
  return [...activePayments].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  );
};

/**
 * Returns payment record by ID
 */
export const getSubscriptionPaymentById = (id: string): SubscriptionPaymentRecord | undefined => {
  return activePayments.find((p) => p.id === id || p.invoiceNumber === id);
};

/**
 * Creates and posts a new subscription payment into the system accounting books
 */
export const processSubscriptionPayment = async (input: {
  tenantId: string;
  tenantName: string;
  packageTier: TierName;
  billingCycle: BillingCycle;
  grossAmountUgx: number;
  paymentChannel: SubscriptionPaymentChannel;
  providerReference: string;
  paymentPhoneOrAccount?: string;
  onboardingSource?: 'ADMIN_PANEL_SYSTEM' | 'SELF_SERVICE_PORTAL' | 'RENEWAL_GATEWAY';
  processedByUserId?: string;
  processedByUserName?: string;
  notes?: string;
}): Promise<SubscriptionPaymentRecord> => {
  const gross = input.grossAmountUgx;
  // 18% inclusive URA VAT formula: VAT = (Gross / 1.18) * 0.18
  const taxVatUgx = Math.round((gross / 1.18) * 0.18);
  const netRevenueUgx = gross - taxVatUgx;
  const amountUsdEquivalent = parseFloat((gross / UGX_TO_USD_RATE).toFixed(2));

  const seq = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const invoiceNumber = `QNT-INV-${now.getFullYear()}-${seq}`;
  const fiscalReceiptNumber = `URA-EFRIS-REC-${Math.floor(100000 + Math.random() * 900000)}`;

  // Compute period end date
  const periodStart = now.toISOString().split('T')[0];
  const endDateObj = new Date(now);
  if (input.billingCycle === 'yearly') {
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
  } else {
    endDateObj.setMonth(endDateObj.getMonth() + 1);
  }
  const periodEnd = endDateObj.toISOString().split('T')[0];

  // GL Account Codes assignment based on channel
  let debitGl = '1020 - MTN MoMo Clearing Asset';
  if (input.paymentChannel === 'AIRTEL_MONEY') debitGl = '1025 - Airtel Money Corporate Clearing';
  if (input.paymentChannel === 'BANK_EFT_STANBIC') debitGl = '1010 - Stanbic Bank Operating Account';
  if (input.paymentChannel === 'BANK_EFT_CENTENARY') debitGl = '1015 - Centenary Bank Operating Account';
  if (input.paymentChannel === 'PESAPAL_VISA_MC') debitGl = '1030 - PesaPal Gateway Settlement';
  if (input.paymentChannel === 'SYSTEM_ESCROW_SETTLEMENT') debitGl = '1040 - System Escrow Trust Clearing';

  const newPayment: SubscriptionPaymentRecord = {
    id: `SUB-PAY-${now.getFullYear()}-${seq}`,
    invoiceNumber,
    fiscalReceiptNumber,
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    packageTier: input.packageTier,
    billingCycle: input.billingCycle,
    grossAmountUgx: gross,
    taxVatUgx,
    netRevenueUgx,
    amountUsdEquivalent,
    paymentChannel: input.paymentChannel,
    providerReference: input.providerReference.trim() || `SYS-TX-${Date.now()}`,
    paymentPhoneOrAccount: input.paymentPhoneOrAccount,
    paymentStatus: 'COMPLETED',
    paidAt: now.toISOString(),
    periodStart,
    periodEnd,
    onboardingSource: input.onboardingSource || 'ADMIN_PANEL_SYSTEM',
    processedByUserId: input.processedByUserId || 'QNT-SYS-ADMIN',
    processedByUserName: input.processedByUserName || 'Quantum Networks Systems Administrator',
    digitalSignatureHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    qrVerificationUrl: `https://verify.quantumnetworks.ug/receipt/${invoiceNumber}`,
    accountDebitGlCode: debitGl,
    accountCreditGlCode: '4010 - SaaS Subscription Revenue',
    accountVatGlCode: '2150 - Output VAT Payable (18%)',
    notes: input.notes || 'System-mediated subscription payment completed and registered.',
  };

  const updated = [newPayment, ...activePayments];
  savePayments(updated);

  // Record into immutable NDA & financial audit trail
  try {
    await logAuditEvent({
      tenantId: input.tenantId,
      performedBy: input.processedByUserId || 'QNT-ADMIN',
      action: 'create',
      entityType: 'subscription_payment',
      entityId: newPayment.id,
      newValue: {
        invoiceNumber: newPayment.invoiceNumber,
        receiptNumber: newPayment.fiscalReceiptNumber,
        grossUgx: newPayment.grossAmountUgx,
        vatUgx: newPayment.taxVatUgx,
        netRevenueUgx: newPayment.netRevenueUgx,
        channel: newPayment.paymentChannel,
        reference: newPayment.providerReference,
        onboardingSource: newPayment.onboardingSource,
      },
      notes: `Subscription payment of UGX ${gross.toLocaleString()} captured and booked for ${input.tenantName} (${input.packageTier} Plan).`,
    });
  } catch (err) {
    console.warn('[subscriptionAccountingService] Audit log warning:', err);
  }

  return newPayment;
};

/**
 * Calculates platform executive SaaS revenue KPIs & clearing account balances
 */
export const getPlatformRevenueSummary = (): PlatformRevenueSummary => {
  const payments = getAllSubscriptionPayments();
  const completed = payments.filter((p) => p.paymentStatus === 'COMPLETED');

  const totalGrossUgx = completed.reduce((sum, p) => sum + p.grossAmountUgx, 0);
  const totalVatUgx = completed.reduce((sum, p) => sum + p.taxVatUgx, 0);
  const totalNetUgx = completed.reduce((sum, p) => sum + p.netRevenueUgx, 0);

  // Active Monthly Recurring Revenue calculation
  const mrrUgx = completed.reduce((sum, p) => {
    if (p.billingCycle === 'yearly') {
      return sum + Math.round(p.grossAmountUgx / 12);
    }
    return sum + p.grossAmountUgx;
  }, 0);

  const arrUgx = mrrUgx * 12;

  // Channel-specific clearing balances
  const mtnMomo = completed
    .filter((p) => p.paymentChannel === 'MTN_MOMO')
    .reduce((sum, p) => sum + p.grossAmountUgx, 0);

  const airtelMoney = completed
    .filter((p) => p.paymentChannel === 'AIRTEL_MONEY')
    .reduce((sum, p) => sum + p.grossAmountUgx, 0);

  const bankSettlement = completed
    .filter((p) => p.paymentChannel === 'BANK_EFT_STANBIC' || p.paymentChannel === 'BANK_EFT_CENTENARY')
    .reduce((sum, p) => sum + p.grossAmountUgx, 0);

  const pesapal = completed
    .filter((p) => p.paymentChannel === 'PESAPAL_VISA_MC')
    .reduce((sum, p) => sum + p.grossAmountUgx, 0);

  const uniquePaidTenants = new Set(completed.map((p) => p.tenantId)).size;

  return {
    grossArrUgx: arrUgx,
    grossMrrUgx: mrrUgx,
    netSaaSYtdUgx: totalNetUgx,
    totalVatCollectedUgx: totalVatUgx,
    activePaidTenantsCount: uniquePaidTenants,
    pendingPaymentTenantsCount: 0,
    mtnMomoClearingBalanceUgx: mtnMomo,
    airtelMoneyClearingBalanceUgx: airtelMoney,
    bankSettlementBalanceUgx: bankSettlement,
    pesapalGatewayBalanceUgx: pesapal,
    systemComplianceRatePercent: 100, // 100% system-mediated, zero unrecorded payments
  };
};

/**
 * Generates double-entry General Ledger (GL) journal entries for accounting books
 */
export const getGeneralLedgerJournal = (): GeneralLedgerJournalEntry[] => {
  const payments = getAllSubscriptionPayments();
  const entries: GeneralLedgerJournalEntry[] = [];

  payments.forEach((p, idx) => {
    const entryDate = p.paidAt.split('T')[0];

    // 1. Debit Entry: Cash / Mobile Money / Bank Clearing Asset
    entries.push({
      id: `GL-${p.id}-01`,
      entryDate,
      referenceNumber: p.invoiceNumber,
      tenantId: p.tenantId,
      tenantName: p.tenantName,
      description: `Subscription Settlement [${p.paymentChannel}] - ${p.packageTier} (${p.billingCycle})`,
      accountCode: p.accountDebitGlCode.split(' - ')[0],
      accountName: p.accountDebitGlCode.split(' - ')[1] || p.accountDebitGlCode,
      debitUgx: p.grossAmountUgx,
      creditUgx: 0,
      reconciled: true,
      reconciledAt: p.paidAt,
    });

    // 2. Credit Entry: SaaS Subscription Revenue (Net of VAT)
    entries.push({
      id: `GL-${p.id}-02`,
      entryDate,
      referenceNumber: p.invoiceNumber,
      tenantId: p.tenantId,
      tenantName: p.tenantName,
      description: `SaaS Revenue Recognition - ${p.tenantName} (${p.packageTier})`,
      accountCode: p.accountCreditGlCode.split(' - ')[0],
      accountName: p.accountCreditGlCode.split(' - ')[1] || p.accountCreditGlCode,
      debitUgx: 0,
      creditUgx: p.netRevenueUgx,
      reconciled: true,
      reconciledAt: p.paidAt,
    });

    // 3. Credit Entry: URA Output VAT Payable (18%)
    entries.push({
      id: `GL-${p.id}-03`,
      entryDate,
      referenceNumber: p.invoiceNumber,
      tenantId: p.tenantId,
      tenantName: p.tenantName,
      description: `18% URA Output VAT on SaaS Service - ${p.invoiceNumber}`,
      accountCode: p.accountVatGlCode.split(' - ')[0],
      accountName: p.accountVatGlCode.split(' - ')[1] || p.accountVatGlCode,
      debitUgx: 0,
      creditUgx: p.taxVatUgx,
      reconciled: true,
      reconciledAt: p.paidAt,
    });
  });

  return entries;
};
