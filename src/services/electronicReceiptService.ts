/**
 * electronicReceiptService.ts — ZenithRx Electronic Digital Receipts & Fiscal Invoice Engine
 * 
 * Generates world-class digital receipts with full pharmacy branch branding,
 * line-item batch tracking, discount breakdown, multi-channel payment reconciliation,
 * URA EFRIS fiscal QR verification, and multi-channel sharing (Thermal Print, PDF, WhatsApp, SMS, Email).
 */

import { POSSalesTransaction } from '../types/v2Types';

export interface DigitalReceiptLineItem {
  drugId: string;
  drugName: string;
  genericName?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPriceUgx: number;
  discountUgx: number;
  taxUgx?: number;
  totalUgx: number;
}

export interface DigitalReceiptPaymentSplit {
  method: string;
  amountUgx: number;
  reference?: string;
}

export interface PharmacyBranchProfile {
  pharmacyName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  branchEmail: string;
  pharmacyTin: string;
  ndaLicenseNumber: string;
  websiteUrl?: string;
}

export interface DigitalReceiptData {
  id: string;
  tenantId: string;
  receiptNumber: string; // e.g. RCP-2026-08101
  fiscalEfrisNumber: string; // e.g. URA-EFRIS-REC-991204
  transactionId: string;
  saleType: 'otc_sale' | 'prescription_sale' | 'credit_sale' | 'insurance_sale';
  
  // Pharmacy & Branch
  pharmacyName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  branchEmail: string;
  pharmacyTin: string;
  ndaLicenseNumber: string;
  
  // Customer / Patient
  customerType: string;
  customerName: string;
  customerPhone?: string;
  patientId?: string;
  prescriptionRefNo?: string;
  prescriberName?: string;
  prescriberLicense?: string;
  
  // Items
  items: DigitalReceiptLineItem[];
  
  // Financials & Tax
  currency: string;
  grossSubtotalUgx: number;
  totalDiscountUgx: number;
  discountPercentage: number;
  discountReason?: string;
  netSubtotalUgx: number;
  taxAmountUgx: number; // 18% URA VAT
  grandTotalUgx: number;
  
  // Payment
  paymentMethod: string;
  paymentSplits?: DigitalReceiptPaymentSplit[];
  cashTenderedUgx?: number;
  changeGivenUgx?: number;
  paymentReferenceCode?: string;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED' | 'VOIDED';
  
  // Pharmacist / Cashier
  cashierId: string;
  cashierName: string;
  cashierRole: string;
  cashierPsuLicense?: string;
  
  // QR & Tracking
  qrVerificationUrl: string;
  verificationHash: string;
  sentViaSms?: boolean;
  sentViaWhatsapp?: boolean;
  sentViaEmail?: boolean;
  receiptTimestamp: string;
  createdAt: string;
}

const STORAGE_KEY_DIGITAL_RECEIPTS = 'zenithrx_digital_sales_receipts_v1';

export const DEFAULT_PHARMACY_BRANCH: PharmacyBranchProfile = {
  pharmacyName: 'ZenithRx Healthcare & Pharmacy Group',
  branchName: 'Kampala City Main Branch',
  branchAddress: 'Plot 14 Kampala Road, Suite 2B, Kampala, Uganda',
  branchPhone: '+256 312 889900',
  branchEmail: 'billing@zenithrx.ug',
  pharmacyTin: 'TIN-1002938481',
  ndaLicenseNumber: 'NDA/LIC/2026/0411',
  websiteUrl: 'https://zenithrx.ug'
};

export const INITIAL_DIGITAL_RECEIPTS: DigitalReceiptData[] = [
  {
    id: 'rcp-001',
    tenantId: 'client-001',
    receiptNumber: 'RCP-2026-08101',
    fiscalEfrisNumber: 'URA-EFRIS-REC-991204',
    transactionId: 'tx-pos-8801',
    saleType: 'prescription_sale',
    pharmacyName: 'ZenithRx Healthcare & Pharmacy Group',
    branchName: 'Kampala City Main Branch',
    branchAddress: 'Plot 14 Kampala Road, Suite 2B, Kampala, Uganda',
    branchPhone: '+256 312 889900',
    branchEmail: 'billing@zenithrx.ug',
    pharmacyTin: 'TIN-1002938481',
    ndaLicenseNumber: 'NDA/LIC/2026/0411',
    customerType: 'registered_patient',
    customerName: 'Kato Emmanuel',
    customerPhone: '+256 704 556677',
    prescriptionRefNo: 'RX-2026-8801',
    prescriberName: 'Dr. Mukasa David',
    prescriberLicense: 'UMDPC-2018-0912',
    items: [
      {
        drugId: 'drug-amox-clav-625',
        drugName: 'Amoxicillin + Clavulanic Acid 625mg Tab',
        genericName: 'Co-amoxiclav',
        batchNumber: 'BN-2026-09A',
        expiryDate: '2027-11-30',
        quantity: 14,
        unitPriceUgx: 2500,
        discountUgx: 0,
        totalUgx: 35000
      },
      {
        drugId: 'drug-para-500',
        drugName: 'Paracetamol 500mg Tablet (Panadol Extra)',
        genericName: 'Acetaminophen + Caffeine',
        batchNumber: 'BN-2026-11B',
        expiryDate: '2028-04-30',
        quantity: 30,
        unitPriceUgx: 300,
        discountUgx: 1000,
        totalUgx: 8000
      }
    ],
    currency: 'UGX',
    grossSubtotalUgx: 44000,
    totalDiscountUgx: 1000,
    discountPercentage: 2.27,
    netSubtotalUgx: 43000,
    taxAmountUgx: 0,
    grandTotalUgx: 43000,
    paymentMethod: 'MTN MoMo',
    paymentSplits: [
      { method: 'MTN MoMo', amountUgx: 43000, reference: 'MM-TX-991240' }
    ],
    cashTenderedUgx: 43000,
    changeGivenUgx: 0,
    paymentReferenceCode: 'MM-TX-991240',
    paymentStatus: 'PAID',
    cashierId: 'user-pharm-01',
    cashierName: 'Dr. Arthur Ssenabulya',
    cashierRole: 'Supervising Pharmacist',
    cashierPsuLicense: 'PSU/PHARM/2019/0411',
    qrVerificationUrl: 'https://verify.zenithrx.ug/receipt/RCP-2026-08101',
    verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    receiptTimestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 60000).toISOString()
  }
];

export const getDigitalReceipts = (tenantId?: string): DigitalReceiptData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIGITAL_RECEIPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DIGITAL_RECEIPTS, JSON.stringify(INITIAL_DIGITAL_RECEIPTS));
      return tenantId ? INITIAL_DIGITAL_RECEIPTS.filter(r => r.tenantId === tenantId) : INITIAL_DIGITAL_RECEIPTS;
    }
    const all: DigitalReceiptData[] = JSON.parse(raw);
    return tenantId ? all.filter(r => r.tenantId === tenantId) : all;
  } catch {
    return INITIAL_DIGITAL_RECEIPTS;
  }
};

export const getDigitalReceiptByNumber = (receiptNumber: string): DigitalReceiptData | null => {
  const all = getDigitalReceipts();
  return all.find(r => r.receiptNumber.toLowerCase() === receiptNumber.toLowerCase() || r.id === receiptNumber) || null;
};

/**
 * Transforms any completed POSSalesTransaction into an official Digital Receipt
 */
export const createDigitalReceiptFromPOS = (
  tx: POSSalesTransaction,
  branchProfile: PharmacyBranchProfile = DEFAULT_PHARMACY_BRANCH,
  cashierProfile = {
    cashierId: 'pharm-01',
    cashierName: 'Dr. Arthur Ssenabulya',
    cashierRole: 'Supervising Pharmacist',
    cashierPsuLicense: 'PSU/PHARM/2019/0411'
  }
): DigitalReceiptData => {
  const receiptNumber = tx.receiptNo || `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const fiscalEfrisNumber = `URA-EFRIS-REC-${Math.floor(100000 + Math.random() * 900000)}`;
  const qrVerificationUrl = `https://verify.zenithrx.ug/receipt/${receiptNumber}`;
  const verificationHash = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  const lineItems: DigitalReceiptLineItem[] = tx.items.map(item => ({
    drugId: item.drugId,
    drugName: item.drugName,
    genericName: item.drugName.split(' ')[0],
    batchNumber: item.batchNumber || 'BN-2026-AUT',
    expiryDate: item.expiryDate || '2028-06-30',
    quantity: item.quantity,
    unitPriceUgx: item.unitSellingPriceUgx,
    discountUgx: item.discountAmountUgx || 0,
    taxUgx: item.taxAmountUgx || 0,
    totalUgx: item.lineTotalUgx
  }));

  const grossSubtotal = lineItems.reduce((acc, curr) => acc + (curr.unitPriceUgx * curr.quantity), 0);
  const totalDiscount = tx.totalDiscountUgx || (grossSubtotal - tx.netTotalUgx);
  const discountPct = grossSubtotal > 0 ? Number(((totalDiscount / grossSubtotal) * 100).toFixed(2)) : 0;

  const newReceipt: DigitalReceiptData = {
    id: `rcp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tenantId: tx.tenantId || 'client-001',
    receiptNumber,
    fiscalEfrisNumber,
    transactionId: tx.id,
    saleType: tx.saleType,
    pharmacyName: branchProfile.pharmacyName,
    branchName: branchProfile.branchName,
    branchAddress: branchProfile.branchAddress,
    branchPhone: branchProfile.branchPhone,
    branchEmail: branchProfile.branchEmail,
    pharmacyTin: branchProfile.pharmacyTin,
    ndaLicenseNumber: branchProfile.ndaLicenseNumber,
    customerType: tx.customerType,
    customerName: tx.customerName,
    customerPhone: tx.customerPhone,
    prescriptionRefNo: tx.prescriptionRefNo,
    prescriberName: tx.prescriberName,
    prescriberLicense: tx.prescriberLicenceNo,
    items: lineItems,
    currency: 'UGX',
    grossSubtotalUgx: grossSubtotal,
    totalDiscountUgx: totalDiscount,
    discountPercentage: discountPct,
    discountReason: tx.discountReason,
    netSubtotalUgx: tx.netTotalUgx,
    taxAmountUgx: tx.taxAmountUgx || 0,
    grandTotalUgx: tx.netTotalUgx,
    paymentMethod: tx.paymentMethod,
    paymentSplits: tx.paymentSplits?.map(s => ({
      method: s.method,
      amountUgx: s.amountUgx,
      reference: s.reference
    })),
    cashTenderedUgx: tx.cashTenderedUgx,
    changeGivenUgx: tx.changeGivenUgx,
    paymentReferenceCode: tx.paymentReferenceCode || tx.paymentMethodRef,
    paymentStatus: tx.status === 'refunded' ? 'REFUNDED' : tx.status === 'voided' ? 'VOIDED' : 'PAID',
    cashierId: cashierProfile.cashierId,
    cashierName: tx.pharmacistName || cashierProfile.cashierName,
    cashierRole: cashierProfile.cashierRole,
    cashierPsuLicense: cashierProfile.cashierPsuLicense,
    qrVerificationUrl,
    verificationHash,
    receiptTimestamp: tx.createdAt || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  const all = getDigitalReceipts();
  const updated = [newReceipt, ...all.filter(r => r.receiptNumber !== receiptNumber)];
  try {
    localStorage.setItem(STORAGE_KEY_DIGITAL_RECEIPTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to store digital receipt', e);
  }

  return newReceipt;
};

/**
 * Format SMS Text Message for Instant Dispatch
 */
export const formatReceiptSmsText = (receipt: DigitalReceiptData): string => {
  return `ZenithRx Receipt #${receipt.receiptNumber}\n` +
    `Date: ${new Date(receipt.receiptTimestamp).toLocaleDateString()}\n` +
    `Branch: ${receipt.branchName}\n` +
    `Total: UGX ${receipt.grandTotalUgx.toLocaleString()} (${receipt.paymentMethod})\n` +
    `Cashier: ${receipt.cashierName}\n` +
    `View Digital Invoice & Verification: ${receipt.qrVerificationUrl}`;
};

/**
 * Format WhatsApp Message Text with Full Items Table
 */
export const formatReceiptWhatsAppText = (receipt: DigitalReceiptData): string => {
  const itemsText = receipt.items
    .map(i => `• ${i.drugName} x${i.quantity} @ UGX ${i.unitPriceUgx.toLocaleString()} = UGX ${i.totalUgx.toLocaleString()}`)
    .join('\n');

  return `*${receipt.pharmacyName}*\n` +
    `_${receipt.branchName} • Tel: ${receipt.branchPhone}_\n\n` +
    `*DIGITAL TAX RECEIPT / INVOICE*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Receipt No:* ${receipt.receiptNumber}\n` +
    `*EFRIS Fiscal No:* ${receipt.fiscalEfrisNumber}\n` +
    `*Date/Time:* ${new Date(receipt.receiptTimestamp).toLocaleString()}\n` +
    `*Customer:* ${receipt.customerName} (${receipt.customerPhone || 'Walk-in'})\n` +
    `*Pharmacist:* ${receipt.cashierName}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*ITEMS DISPENSED:*\n` +
    `${itemsText}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Gross Subtotal:* UGX ${receipt.grossSubtotalUgx.toLocaleString()}\n` +
    (receipt.totalDiscountUgx > 0 ? `*Discount Applied:* -UGX ${receipt.totalDiscountUgx.toLocaleString()}\n` : '') +
    `*TOTAL PAID:* *UGX ${receipt.grandTotalUgx.toLocaleString()}*\n` +
    `*Payment Method:* ${receipt.paymentMethod}\n\n` +
    `*Verify Authenticity & Download PDF:* ${receipt.qrVerificationUrl}\n` +
    `_Thank you for choosing ${receipt.pharmacyName}!_`;
};
