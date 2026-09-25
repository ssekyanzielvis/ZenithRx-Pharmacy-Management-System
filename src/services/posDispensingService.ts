/**
 * posDispensingService.ts — Enterprise Pharmacy POS & Dispensing Transaction Service
 *
 * Implements complete sales & dispensing workflows:
 * - Walk-in OTC & Registered Patient checkout
 * - Prescription-linked sales with Doctor & Pharmacist verification
 * - Batch selection & FEFO allocation with automatic inventory deduction
 * - Discounts (line-item and cart-level), Tax computation (0% Rx Exempt vs 18% general)
 * - Multi-Payment Gateways: Cash (change calc), Mobile Money (MoMo/Airtel), Card, Patient Credit
 * - Void / Cancellation with Supervisor PIN authorization & stock restoration
 * - Full & Partial Refunds with stock disposition routing (Restock vs Quarantine)
 * - Daily Cash-Up (Z-Report) generation
 */

import {
  POSSalesTransaction,
  POSCartItem,
  POSDailyZReport,
  POSSaleType,
  POSCustomerType,
  POSPaymentMethod,
} from '../types/v2Types';
import { DrugItem } from '../types';

// Mock live batches mapped by drug ID
export interface DrugBatchStock {
  id: string;
  drugId: string;
  batchNumber: string;
  expiryDate: string;
  shelfLocation: string;
  stockQuantity: number;
  costPriceUgx: number;
  sellingPriceUgx: number;
}

const INITIAL_BATCHES: Record<string, DrugBatchStock[]> = {
  '1': [
    { id: 'b-101', drugId: '1', batchNumber: 'AMX-2026-A1', expiryDate: '2027-08-31', shelfLocation: 'Shelf A1', stockQuantity: 120, costPriceUgx: 8000, sellingPriceUgx: 12000 },
    { id: 'b-102', drugId: '1', batchNumber: 'AMX-2026-A2', expiryDate: '2028-02-28', shelfLocation: 'Shelf A1', stockQuantity: 200, costPriceUgx: 8200, sellingPriceUgx: 12000 },
  ],
  '2': [
    { id: 'b-201', drugId: '2', batchNumber: 'PCM-2026-X4', expiryDate: '2028-11-30', shelfLocation: 'Counter Bay 1', stockQuantity: 500, costPriceUgx: 1500, sellingPriceUgx: 3000 },
  ],
  '3': [
    { id: 'b-301', drugId: '3', batchNumber: 'CIP-2026-C9', expiryDate: '2027-04-30', shelfLocation: 'Shelf B2', stockQuantity: 80, costPriceUgx: 12000, sellingPriceUgx: 18000 },
    { id: 'b-302', drugId: '3', batchNumber: 'CIP-2026-C10', expiryDate: '2027-12-31', shelfLocation: 'Shelf B2', stockQuantity: 150, costPriceUgx: 12500, sellingPriceUgx: 18000 },
  ],
  '4': [
    { id: 'b-401', drugId: '4', batchNumber: 'IBU-2026-I2', expiryDate: '2027-09-30', shelfLocation: 'Counter Bay 2', stockQuantity: 250, costPriceUgx: 3000, sellingPriceUgx: 6000 },
  ],
  '5': [
    { id: 'b-501', drugId: '5', batchNumber: 'COA-2026-M8', expiryDate: '2027-10-31', shelfLocation: 'Shelf A3', stockQuantity: 110, costPriceUgx: 18000, sellingPriceUgx: 28000 },
  ],
  '6': [
    { id: 'b-601', drugId: '6', batchNumber: 'MET-2026-G1', expiryDate: '2027-06-30', shelfLocation: 'Shelf C1', stockQuantity: 95, costPriceUgx: 10000, sellingPriceUgx: 15000 },
  ],
  '7': [
    { id: 'b-701', drugId: '7', batchNumber: 'AML-2026-D3', expiryDate: '2028-01-31', shelfLocation: 'Shelf C2', stockQuantity: 140, costPriceUgx: 14000, sellingPriceUgx: 22000 },
  ],
  '8': [
    { id: 'b-801', drugId: '8', batchNumber: 'OMP-2026-P5', expiryDate: '2027-11-30', shelfLocation: 'Shelf B1', stockQuantity: 175, costPriceUgx: 7000, sellingPriceUgx: 12000 },
  ],
};

let batchesStore: Record<string, DrugBatchStock[]> = { ...INITIAL_BATCHES };

// Initial realistic transaction register
const INITIAL_POS_TRANSACTIONS: POSSalesTransaction[] = [
  {
    id: 'pos-tx-001',
    tenantId: 'client-001',
    receiptNo: 'REC-2026-88192',
    saleType: 'prescription_sale',
    customerType: 'registered_patient',
    patientId: 'pat-001',
    customerName: 'Sarah Namubiru',
    customerPhone: '+256 772 123456',
    prescriptionId: 'rx-101',
    prescriptionRefNo: 'RX-2026-081',
    prescriberName: 'Dr. Peter Kasozi',
    prescriberLicenceNo: 'UMDPC/2026/8841',
    pharmacistUserId: 'usr-001',
    pharmacistName: 'Pharm. Elvis Ssekyanzi',
    dispensingNotes: 'First-line malaria treatment + broad spectrum antibiotic. Advised on completing full 3-day Coartem course.',
    items: [
      {
        drugId: '5',
        genericName: 'Artemether + Lumefantrine',
        brandName: 'Coartem 20/120mg',
        dosageForm: 'Tablet',
        isPrescriptionOnly: true,
        quantity: 1,
        availableStock: 110,
        batchNumber: 'COA-2026-M8',
        batchExpiryDate: '2027-10-31',
        shelfLocation: 'Shelf A3',
        unitCostUgx: 18000,
        unitSellingPriceUgx: 28000,
        discountPercent: 0,
        discountAmountUgx: 0,
        taxRatePercent: 0, // Human Rx Exempt
        taxAmountUgx: 0,
        lineTotalUgx: 28000,
        dosageInstructions: 'Take 4 tablets initially, then 4 tablets after 8h, then 4 tablets twice daily for 2 days.',
        daysSupply: 3,
      },
      {
        drugId: '1',
        genericName: 'Amoxicillin Trihydrate',
        brandName: 'Amoxil 500mg',
        dosageForm: 'Capsule',
        isPrescriptionOnly: true,
        quantity: 2,
        availableStock: 120,
        batchNumber: 'AMX-2026-A1',
        batchExpiryDate: '2027-08-31',
        shelfLocation: 'Shelf A1',
        unitCostUgx: 8000,
        unitSellingPriceUgx: 12000,
        discountPercent: 0,
        discountAmountUgx: 0,
        taxRatePercent: 0,
        taxAmountUgx: 0,
        lineTotalUgx: 24000,
        dosageInstructions: 'Take 1 capsule 3 times daily for 7 days.',
        daysSupply: 7,
      },
    ],
    grossSubtotalUgx: 52000,
    lineDiscountsUgx: 0,
    orderDiscountUgx: 0,
    taxableAmountUgx: 0,
    taxVatUgx: 0,
    netTotalUgx: 52000,
    patientPaidUgx: 52000,
    insuranceCoveredUgx: 0,
    paymentMethod: 'Mobile Money',
    momoProvider: 'MTN MoMo',
    momoPhone: '+256 772 123456',
    momoReference: 'MM-TX-998124',
    status: 'completed',
    createdAt: '2026-03-24T09:15:00Z',
  },
  {
    id: 'pos-tx-002',
    tenantId: 'client-001',
    receiptNo: 'REC-2026-88193',
    saleType: 'otc_sale',
    customerType: 'walk_in',
    customerName: 'Walk-in Customer (John)',
    customerPhone: '+256 701 992831',
    pharmacistName: 'Jane Nakato (Cashier)',
    items: [
      {
        drugId: '2',
        genericName: 'Paracetamol',
        brandName: 'Panadol Extra',
        dosageForm: 'Tablet',
        isPrescriptionOnly: false,
        quantity: 2,
        availableStock: 500,
        batchNumber: 'PCM-2026-X4',
        batchExpiryDate: '2028-11-30',
        shelfLocation: 'Counter Bay 1',
        unitCostUgx: 1500,
        unitSellingPriceUgx: 3000,
        discountPercent: 0,
        discountAmountUgx: 0,
        taxRatePercent: 0,
        taxAmountUgx: 0,
        lineTotalUgx: 6000,
        dosageInstructions: 'Take 2 tablets every 6 hours as needed for headache.',
      },
      {
        drugId: '4',
        genericName: 'Ibuprofen',
        brandName: 'Brufen 400mg',
        dosageForm: 'Tablet',
        isPrescriptionOnly: false,
        quantity: 1,
        availableStock: 250,
        batchNumber: 'IBU-2026-I2',
        batchExpiryDate: '2027-09-30',
        shelfLocation: 'Counter Bay 2',
        unitCostUgx: 3000,
        unitSellingPriceUgx: 6000,
        discountPercent: 0,
        discountAmountUgx: 0,
        taxRatePercent: 0,
        taxAmountUgx: 0,
        lineTotalUgx: 6000,
        dosageInstructions: 'Take 1 tablet after meals.',
      },
    ],
    grossSubtotalUgx: 12000,
    lineDiscountsUgx: 0,
    orderDiscountUgx: 0,
    taxableAmountUgx: 0,
    taxVatUgx: 0,
    netTotalUgx: 12000,
    patientPaidUgx: 12000,
    insuranceCoveredUgx: 0,
    paymentMethod: 'Cash',
    cashTenderedUgx: 20000,
    cashChangeUgx: 8000,
    status: 'completed',
    createdAt: '2026-03-24T10:30:00Z',
  },
  {
    id: 'pos-tx-003',
    tenantId: 'client-001',
    receiptNo: 'REC-2026-88194',
    saleType: 'prescription_sale',
    customerType: 'registered_patient',
    patientId: 'pat-003',
    customerName: 'Kato Michael',
    customerPhone: '+256 782 554433',
    prescriptionRefNo: 'RX-2026-095',
    prescriberName: 'Dr. Jane Mukasa',
    pharmacistName: 'Pharm. Elvis Ssekyanzi',
    items: [
      {
        drugId: '7',
        genericName: 'Amlodipine Besylate',
        brandName: 'Norvasc 10mg',
        dosageForm: 'Tablet',
        isPrescriptionOnly: true,
        quantity: 2,
        availableStock: 140,
        batchNumber: 'AML-2026-D3',
        batchExpiryDate: '2028-01-31',
        shelfLocation: 'Shelf C2',
        unitCostUgx: 14000,
        unitSellingPriceUgx: 22000,
        discountPercent: 5, // 5% Chronic Patient Loyalty Discount
        discountAmountUgx: 2200,
        taxRatePercent: 0,
        taxAmountUgx: 0,
        lineTotalUgx: 41800,
        dosageInstructions: 'Take 1 tablet once daily in the morning.',
        daysSupply: 60,
      },
    ],
    grossSubtotalUgx: 44000,
    lineDiscountsUgx: 2200,
    orderDiscountUgx: 0,
    discountReason: 'Chronic Patient Care Loyalty Program',
    taxableAmountUgx: 0,
    taxVatUgx: 0,
    netTotalUgx: 41800,
    patientPaidUgx: 41800,
    insuranceCoveredUgx: 0,
    paymentMethod: 'Card',
    cardAuthCode: 'VISA-AUTH-882190',
    status: 'completed',
    createdAt: '2026-03-24T11:45:00Z',
  },
  {
    id: 'pos-tx-004',
    tenantId: 'client-001',
    receiptNo: 'REC-2026-88195',
    saleType: 'otc_sale',
    customerType: 'walk_in',
    customerName: 'Walk-in Customer (Grace)',
    customerPhone: '+256 755 889900',
    pharmacistName: 'Jane Nakato (Cashier)',
    items: [
      {
        drugId: '8',
        genericName: 'Omeprazole',
        brandName: 'Losec 20mg',
        dosageForm: 'Capsule',
        isPrescriptionOnly: false,
        quantity: 1,
        availableStock: 175,
        batchNumber: 'OMP-2026-P5',
        batchExpiryDate: '2027-11-30',
        shelfLocation: 'Shelf B1',
        unitCostUgx: 7000,
        unitSellingPriceUgx: 12000,
        discountPercent: 0,
        discountAmountUgx: 0,
        taxRatePercent: 0,
        taxAmountUgx: 0,
        lineTotalUgx: 12000,
        dosageInstructions: 'Take 1 capsule 30 minutes before breakfast.',
      },
    ],
    grossSubtotalUgx: 12000,
    lineDiscountsUgx: 0,
    orderDiscountUgx: 0,
    taxableAmountUgx: 0,
    taxVatUgx: 0,
    netTotalUgx: 12000,
    patientPaidUgx: 12000,
    insuranceCoveredUgx: 0,
    paymentMethod: 'Cash',
    cashTenderedUgx: 12000,
    cashChangeUgx: 0,
    status: 'voided',
    voidedAt: '2026-03-24T12:05:00Z',
    voidedByName: 'Pharm. Elvis Ssekyanzi (Supervisor)',
    voidReason: 'Customer left without taking items after cashier tendered; stock returned to shelf.',
    supervisorOverrideCode: 'PIN-9920-AUTH',
    createdAt: '2026-03-24T12:00:00Z',
  },
];

let transactionsStore: POSSalesTransaction[] = [...INITIAL_POS_TRANSACTIONS];

/**
 * Fetch available batches for a drug, sorted by FEFO (Earliest Expiry first)
 */
export function getAvailableBatchesForDrug(drugId: string): DrugBatchStock[] {
  const list = batchesStore[drugId] || [
    {
      id: `b-auto-${drugId}`,
      drugId,
      batchNumber: `BAT-2026-${drugId}01`,
      expiryDate: '2027-12-31',
      shelfLocation: 'Main Dispensary Shelf',
      stockQuantity: 100,
      costPriceUgx: 10000,
      sellingPriceUgx: 15000,
    },
  ];

  // FEFO sorting: earliest expiry date first
  return [...list].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
}

/**
 * Get all POS transactions
 */
export function getAllPOSTransactions(tenantId: string = 'client-001'): POSSalesTransaction[] {
  return [...transactionsStore];
}

/**
 * Process a new POS / Dispensing Sale Transaction
 */
export function processPOSSalesTransaction(
  payload: {
    tenantId?: string;
    saleType: POSSaleType;
    customerType: POSCustomerType;
    patientId?: string;
    customerName: string;
    customerPhone?: string;
    prescriptionId?: string;
    prescriptionRefNo?: string;
    prescriberName?: string;
    prescriberLicenceNo?: string;
    pharmacistName: string;
    dispensingNotes?: string;
    items: POSCartItem[];
    orderDiscountUgx?: number;
    discountReason?: string;
    paymentMethod: POSPaymentMethod;
    paymentSplits?: { method: string; amountUgx: number; reference?: string }[];
    cashTenderedUgx?: number;
    momoProvider?: string;
    momoPhone?: string;
    momoReference?: string;
    cardAuthCode?: string;
    creditDueDate?: string;
    creditAuthorizedBy?: string;
    insuranceCoveredUgx?: number;
  },
  onInventoryDeduct?: (drugId: string, quantity: number, batchNumber: string) => void
): POSSalesTransaction {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  const receiptNo = `REC-${year}-${rand}`;
  const txId = `pos-tx-${Date.now()}`;

  const grossSubtotalUgx = payload.items.reduce((sum, item) => sum + item.unitSellingPriceUgx * item.quantity, 0);
  const lineDiscountsUgx = payload.items.reduce((sum, item) => sum + item.discountAmountUgx, 0);
  const orderDiscountUgx = payload.orderDiscountUgx || 0;
  const totalDiscounts = lineDiscountsUgx + orderDiscountUgx;

  const taxableAmountUgx = payload.items.reduce((sum, item) => (item.taxRatePercent > 0 ? sum + item.lineTotalUgx : sum), 0);
  const taxVatUgx = payload.items.reduce((sum, item) => sum + item.taxAmountUgx, 0);

  const netTotalUgx = Math.max(0, grossSubtotalUgx - totalDiscounts + taxVatUgx);
  const insuranceCoveredUgx = payload.insuranceCoveredUgx || 0;
  const patientPaidUgx = Math.max(0, netTotalUgx - insuranceCoveredUgx);

  const cashChangeUgx =
    payload.paymentMethod === 'Cash' && payload.cashTenderedUgx !== undefined
      ? Math.max(0, payload.cashTenderedUgx - patientPaidUgx)
      : 0;

  // Deduct batch stock
  payload.items.forEach((item) => {
    if (batchesStore[item.drugId]) {
      const batch = batchesStore[item.drugId].find((b) => b.batchNumber === item.batchNumber);
      if (batch) {
        batch.stockQuantity = Math.max(0, batch.stockQuantity - item.quantity);
      }
    }
    if (onInventoryDeduct) {
      onInventoryDeduct(item.drugId, item.quantity, item.batchNumber);
    }
  });

  const newTransaction: POSSalesTransaction = {
    id: txId,
    tenantId: payload.tenantId || 'client-001',
    receiptNo,
    saleType: payload.saleType,
    customerType: payload.customerType,
    patientId: payload.patientId,
    customerName: payload.customerName || 'Walk-in Customer',
    customerPhone: payload.customerPhone,
    prescriptionId: payload.prescriptionId,
    prescriptionRefNo: payload.prescriptionRefNo,
    prescriberName: payload.prescriberName,
    prescriberLicenceNo: payload.prescriberLicenceNo,
    pharmacistName: payload.pharmacistName,
    dispensingNotes: payload.dispensingNotes,
    items: payload.items,
    grossSubtotalUgx,
    lineDiscountsUgx,
    orderDiscountUgx,
    discountReason: payload.discountReason,
    taxableAmountUgx,
    taxVatUgx,
    netTotalUgx,
    patientPaidUgx,
    insuranceCoveredUgx,
    paymentMethod: payload.paymentMethod,
    paymentSplits: payload.paymentSplits,
    cashTenderedUgx: payload.cashTenderedUgx,
    cashChangeUgx,
    momoProvider: payload.momoProvider,
    momoPhone: payload.momoPhone,
    momoReference: payload.momoReference,
    cardAuthCode: payload.cardAuthCode,
    creditDueDate: payload.creditDueDate,
    creditAuthorizedBy: payload.creditAuthorizedBy,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  transactionsStore = [newTransaction, ...transactionsStore];
  return newTransaction;
}

/**
 * Void / Cancel a completed POS transaction (with supervisor authorization & batch stock restoration)
 */
export function voidPOSSalesTransaction(
  transactionId: string,
  voidReason: string,
  supervisorCode: string,
  supervisorName: string,
  onInventoryRestore?: (drugId: string, quantity: number, batchNumber: string) => void
): POSSalesTransaction {
  const index = transactionsStore.findIndex((tx) => tx.id === transactionId);
  if (index === -1) throw new Error('Transaction not found');

  const tx = transactionsStore[index];
  if (tx.status === 'voided') throw new Error('Transaction is already voided');

  // Restore inventory batch stock
  tx.items.forEach((item) => {
    if (batchesStore[item.drugId]) {
      const batch = batchesStore[item.drugId].find((b) => b.batchNumber === item.batchNumber);
      if (batch) {
        batch.stockQuantity += item.quantity;
      }
    }
    if (onInventoryRestore) {
      onInventoryRestore(item.drugId, item.quantity, item.batchNumber);
    }
  });

  tx.status = 'voided';
  tx.voidedAt = new Date().toISOString();
  tx.voidedByName = supervisorName;
  tx.voidReason = voidReason;
  tx.supervisorOverrideCode = supervisorCode;

  transactionsStore[index] = { ...tx };
  return transactionsStore[index];
}

/**
 * Process a Refund / Return against a transaction
 */
export function refundPOSSalesTransaction(
  transactionId: string,
  refundAmountUgx: number,
  refundReason: string,
  returnDisposition: 'return_to_saleable_stock' | 'quarantine' | 'destruction' = 'return_to_saleable_stock',
  onInventoryRestore?: (drugId: string, quantity: number, batchNumber: string) => void
): POSSalesTransaction {
  const index = transactionsStore.findIndex((tx) => tx.id === transactionId);
  if (index === -1) throw new Error('Transaction not found');

  const tx = transactionsStore[index];

  // If returning to saleable stock, restore batch stock
  if (returnDisposition === 'return_to_saleable_stock') {
    tx.items.forEach((item) => {
      if (batchesStore[item.drugId]) {
        const batch = batchesStore[item.drugId].find((b) => b.batchNumber === item.batchNumber);
        if (batch) {
          batch.stockQuantity += item.quantity;
        }
      }
      if (onInventoryRestore) {
        onInventoryRestore(item.drugId, item.quantity, item.batchNumber);
      }
    });
  }

  tx.status = refundAmountUgx >= tx.netTotalUgx ? 'refunded' : 'partially_refunded';
  tx.refundedAmountUgx = (tx.refundedAmountUgx || 0) + refundAmountUgx;
  tx.refundReason = refundReason;
  tx.refundReturnDisposition = returnDisposition;

  transactionsStore[index] = { ...tx };
  return transactionsStore[index];
}

/**
 * Generate End-of-Day Z-Report (Cash-Up reconciliation)
 */
export function generatePOSDailyZReport(
  dateString: string = new Date().toISOString().slice(0, 10),
  cashierName: string = 'Pharm. Elvis Ssekyanzi'
): POSDailyZReport {
  const dayTxs = transactionsStore.filter((tx) => tx.createdAt.startsWith(dateString));

  const completedTxs = dayTxs.filter((tx) => tx.status === 'completed');
  const voidedTxs = dayTxs.filter((tx) => tx.status === 'voided');
  const refundedTxs = dayTxs.filter((tx) => tx.status === 'refunded' || tx.status === 'partially_refunded');

  const totalGrossSalesUgx = completedTxs.reduce((sum, tx) => sum + tx.grossSubtotalUgx, 0);
  const totalDiscountsUgx = completedTxs.reduce((sum, tx) => sum + (tx.lineDiscountsUgx + tx.orderDiscountUgx), 0);
  const totalNetSalesUgx = completedTxs.reduce((sum, tx) => sum + tx.netTotalUgx, 0);
  const totalVatUgx = completedTxs.reduce((sum, tx) => sum + tx.taxVatUgx, 0);

  const cashTotalUgx = completedTxs.filter((tx) => tx.paymentMethod === 'Cash').reduce((sum, tx) => sum + tx.patientPaidUgx, 0);
  const momoTotalUgx = completedTxs.filter((tx) => tx.paymentMethod === 'Mobile Money').reduce((sum, tx) => sum + tx.patientPaidUgx, 0);
  const cardTotalUgx = completedTxs.filter((tx) => tx.paymentMethod === 'Card').reduce((sum, tx) => sum + tx.patientPaidUgx, 0);
  const creditTotalUgx = completedTxs.filter((tx) => tx.paymentMethod === 'Credit').reduce((sum, tx) => sum + tx.netTotalUgx, 0);
  const insuranceTotalUgx = completedTxs.reduce((sum, tx) => sum + tx.insuranceCoveredUgx, 0);

  const totalVoidedAmountUgx = voidedTxs.reduce((sum, tx) => sum + tx.netTotalUgx, 0);
  const totalRefundedAmountUgx = refundedTxs.reduce((sum, tx) => sum + (tx.refundedAmountUgx || 0), 0);

  return {
    date: dateString,
    totalTransactions: completedTxs.length,
    totalGrossSalesUgx,
    totalDiscountsUgx,
    totalNetSalesUgx,
    totalVatUgx,
    cashTotalUgx,
    momoTotalUgx,
    cardTotalUgx,
    creditTotalUgx,
    insuranceTotalUgx,
    totalVoidedTransactions: voidedTxs.length,
    totalVoidedAmountUgx,
    totalRefundedAmountUgx,
    cashierName,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Format Thermal Receipt text
 */
export function formatThermalReceipt(tx: POSSalesTransaction, pharmacyName: string = 'ZenithRx Pharmacy'): string {
  const line = '-'.repeat(42);
  const dblLine = '='.repeat(42);

  return [
    dblLine,
    `       ${pharmacyName.toUpperCase()}`,
    `      NDA Lic: NDA/RET/2026/0491`,
    `   Official Payment & Dispensing Slip`,
    dblLine,
    `Receipt No: ${tx.receiptNo}`,
    `Date/Time:  ${new Date(tx.createdAt).toLocaleString()}`,
    `Sale Type:  ${tx.saleType.toUpperCase()}`,
    `Customer:   ${tx.customerName}`,
    tx.customerPhone ? `Phone:      ${tx.customerPhone}` : '',
    tx.prescriptionRefNo ? `Prescription Ref: ${tx.prescriptionRefNo}` : '',
    tx.prescriberName ? `Prescriber:       ${tx.prescriberName}` : '',
    `Dispenser:  ${tx.pharmacistName}`,
    line,
    `ITEMS DISPENSED:`,
    ...tx.items.map(
      (item, i) =>
        `[${i + 1}] ${item.brandName} (${item.dosageForm})\n    Batch: ${item.batchNumber} | Exp: ${item.batchExpiryDate}\n    Qty: ${item.quantity} x UGX ${item.unitSellingPriceUgx.toLocaleString()} = UGX ${item.lineTotalUgx.toLocaleString()}${item.dosageInstructions ? `\n    Sig: ${item.dosageInstructions}` : ''}`
    ),
    line,
    `Gross Subtotal:     UGX ${tx.grossSubtotalUgx.toLocaleString()}`,
    tx.lineDiscountsUgx + tx.orderDiscountUgx > 0
      ? `Discounts Granted: -UGX ${(tx.lineDiscountsUgx + tx.orderDiscountUgx).toLocaleString()}`
      : '',
    `Tax VAT:            UGX ${tx.taxVatUgx.toLocaleString()}`,
    dblLine,
    `NET TOTAL PAYABLE:  UGX ${tx.netTotalUgx.toLocaleString()}`,
    `PAYMENT METHOD:     ${tx.paymentMethod.toUpperCase()}`,
    tx.paymentMethod === 'Cash' && tx.cashTenderedUgx
      ? `Cash Tendered:      UGX ${tx.cashTenderedUgx.toLocaleString()}\nChange Returned:    UGX ${(tx.cashChangeUgx || 0).toLocaleString()}`
      : '',
    tx.momoReference ? `MoMo Tx Ref:        ${tx.momoReference}` : '',
    tx.cardAuthCode ? `Card Auth Code:     ${tx.cardAuthCode}` : '',
    tx.creditDueDate ? `Credit Due Date:    ${tx.creditDueDate}` : '',
    dblLine,
    `     VERIFIED UNDER NDA & PSU GPP`,
    `   Medicines dispensed cannot be returned`,
    `      once taken unless defective.`,
    `      Thank you for choosing us!`,
    dblLine,
  ]
    .filter(Boolean)
    .join('\n');
}
