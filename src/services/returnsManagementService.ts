/**
 * returnsManagementService.ts — ZenithRx Enterprise Medicine Returns & Disposition Service
 * Technical Specs: Complies with NDA Good Pharmacy Practice §11.6, §11.20 & WHO Good Distribution Practice
 * Handles: Customer Returns, Supplier Returns (RTV), and Automated 4-Path Disposition Routing
 */

import {
  MedicineReturnRecord,
  ReturnType,
  ReturnReason,
  ReturnDisposition,
  RefundPaymentMethod,
  ReturnDispositionEvaluation,
} from '../types';

const INITIAL_RETURNS: MedicineReturnRecord[] = [
  {
    id: 'RET-001',
    returnReferenceNumber: 'RET-2026-0048',
    returnType: 'customer_return',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-001',
    medicineName: 'Paracetamol 500mg Tablets (Box of 100)',
    brandName: 'Panadol Extra',
    genericName: 'Paracetamol / Acetaminophen',
    batchNumber: 'BAT-2026-AUG01',
    expiryDate: '2028-01-10',
    quantityReturned: 1,
    unitPriceUgx: 7500,
    totalRefundAmountUgx: 7500,
    customerId: 'CUST-002',
    customerName: 'Grace Nakato',
    customerPhone: '+256 701 445 921',
    originalReceiptNumber: 'RCP-2026-9041',
    originalSaleDate: '2026-03-22T10:00:00Z',
    reason: 'wrong_medicine',
    isPackageOpened: false,
    isColdChainBreached: false,
    physicalInspectionNotes: 'Box seal intact. Blister packs in pristine condition. Returned within 2 hours of purchase.',
    disposition: 'restock_saleable',
    dispositionRationale: 'Unopened manufacturer packaging verified intact within 48-hour return window. Re-admitted to active POS shelf stock.',
    targetStorageLocation: 'Aisle 1, Shelf A-03, Bin 12',
    refundMethod: 'cash_refund',
    refundStatus: 'refunded',
    status: 'restocked',
    initiatedByName: 'Cashier Florence Nabwire',
    initiatedByRole: 'POS Cashier / Dispenser',
    initiatedAt: '2026-03-22T12:15:00Z',
    inspectedByPharmacistName: 'Pharm. Brenda Namubiru',
    inspectedByPharmacistRole: 'Assistant Pharmacist',
    inspectedAt: '2026-03-22T12:20:00Z',
    approvedBySupervisorName: 'Dr. Elvis Ssekyanzi',
    approvedAt: '2026-03-22T12:25:00Z',
    createdAt: '2026-03-22T12:15:00Z',
    updatedAt: '2026-03-22T12:25:00Z',
  },
  {
    id: 'RET-002',
    returnReferenceNumber: 'RET-2026-0049',
    returnType: 'customer_return',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-006',
    medicineName: 'Insulin Glargine 100 IU/mL SoloStar Pen',
    brandName: 'Lantus SoloStar',
    genericName: 'Insulin Glargine',
    batchNumber: 'BAT-2026-INS77',
    expiryDate: '2027-04-30',
    quantityReturned: 2,
    unitPriceUgx: 75000,
    totalRefundAmountUgx: 150000,
    customerId: 'CUST-009',
    customerName: 'David Mukasa',
    customerPhone: '+256 772 119 044',
    originalReceiptNumber: 'RCP-2026-8910',
    originalSaleDate: '2026-03-20T15:00:00Z',
    reason: 'delivery_error',
    isPackageOpened: true,
    isColdChainBreached: true,
    physicalInspectionNotes: 'Customer reported home power failure caused temperature rise to 24°C over 48 hours. Product cloudiness noted.',
    disposition: 'destruction',
    dispositionRationale: 'Cold-chain excursion verified. Biological protein degradation safety risk. Prohibited from resale or supplier return. Slated for hazardous incineration.',
    targetStorageLocation: 'Hazardous Destruction Quarantine Safe (Bin C)',
    refundMethod: 'store_credit_wallet',
    refundStatus: 'credit_issued',
    status: 'disposed',
    initiatedByName: 'Pharm. Denis Kigozi',
    initiatedByRole: 'Store & Inventory Manager',
    initiatedAt: '2026-03-23T09:00:00Z',
    inspectedByPharmacistName: 'Dr. Elvis Ssekyanzi',
    inspectedByPharmacistRole: 'Supervising Pharmacist',
    inspectedAt: '2026-03-23T09:30:00Z',
    approvedBySupervisorName: 'Dr. Elvis Ssekyanzi',
    approvedAt: '2026-03-23T09:30:00Z',
    createdAt: '2026-03-23T09:00:00Z',
    updatedAt: '2026-03-23T09:30:00Z',
  },
  {
    id: 'RET-003',
    returnReferenceNumber: 'RTV-2026-0019',
    returnType: 'supplier_return',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-003',
    medicineName: 'Co-Amoxiclav 625mg Tablets (Box of 14)',
    brandName: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    batchNumber: 'BAT-2026-AMX09',
    expiryDate: '2027-11-20',
    quantityReturned: 50,
    unitPriceUgx: 28000,
    totalRefundAmountUgx: 1400000,
    supplierId: 'SUP-002',
    supplierName: 'Abacus Pharma Africa Ltd',
    purchaseOrderNumber: 'PO-2026-0792',
    goodsReceivedNoteNumber: 'GRN-2026-0174',
    supplierCreditNoteNumber: 'SCN-AB-2026-081',
    reason: 'defective_packaging',
    isPackageOpened: false,
    isColdChainBreached: false,
    physicalInspectionNotes: 'Desiccant foil blister micro-perforations identified during intake quarantine assay. Manufacturer acknowledged packaging defect.',
    disposition: 'supplier_return_rtv',
    dispositionRationale: 'Manufacturer batch packaging defect on intake. Dispatched back to wholesale distributor with RTV delivery dossier for full financial credit.',
    targetStorageLocation: 'Outbound Supplier Returns Staging Bay',
    refundMethod: 'supplier_credit_note',
    refundStatus: 'credit_issued',
    status: 'credit_note_issued',
    initiatedByName: 'Pharm. Denis Kigozi',
    initiatedByRole: 'Store & Inventory Manager',
    initiatedAt: '2026-03-15T11:00:00Z',
    inspectedByPharmacistName: 'Dr. Elvis Ssekyanzi',
    inspectedByPharmacistRole: 'Supervising Pharmacist',
    inspectedAt: '2026-03-15T14:00:00Z',
    approvedBySupervisorName: 'Dr. Elvis Ssekyanzi',
    approvedAt: '2026-03-15T14:30:00Z',
    createdAt: '2026-03-15T11:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'RET-004',
    returnReferenceNumber: 'RET-2026-0050',
    returnType: 'customer_return',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-009',
    medicineName: 'Coartem 20/120mg Dispersible Tablets',
    brandName: 'Coartem Dispersible',
    genericName: 'Artemether + Lumefantrine',
    batchNumber: 'BAT-2025-COA44',
    expiryDate: '2027-02-14',
    quantityReturned: 1,
    unitPriceUgx: 11000,
    totalRefundAmountUgx: 11000,
    customerId: 'CUST-104',
    customerName: 'Kato Emmanuel',
    customerPhone: '+256 788 552 100',
    originalReceiptNumber: 'RCP-2026-8812',
    originalSaleDate: '2026-03-08T16:20:00Z',
    reason: 'recall',
    isPackageOpened: false,
    isColdChainBreached: false,
    physicalInspectionNotes: 'Returned in response to automated NDA Uganda Alert #NDA-REC-2026-004.',
    disposition: 'quarantine_hold',
    dispositionRationale: 'Mandatory NDA Recall sub-lot. Must be isolated in secure quarantine safe pending consolidated manufacturer collection.',
    targetStorageLocation: 'Quarantine Lockup Cage #2 (Recall Isolated)',
    refundMethod: 'replacement_exchange',
    refundStatus: 'refunded',
    replacementBatchNumber: 'BAT-2026-COA99',
    status: 'approved_and_processed',
    initiatedByName: 'Pharm. Brenda Namubiru',
    initiatedByRole: 'Assistant Pharmacist',
    initiatedAt: '2026-03-19T14:00:00Z',
    inspectedByPharmacistName: 'Dr. Elvis Ssekyanzi',
    inspectedByPharmacistRole: 'Supervising Pharmacist',
    inspectedAt: '2026-03-19T14:15:00Z',
    approvedBySupervisorName: 'Dr. Elvis Ssekyanzi',
    approvedAt: '2026-03-19T14:20:00Z',
    createdAt: '2026-03-19T14:00:00Z',
    updatedAt: '2026-03-19T14:20:00Z',
  }
];

class ReturnsManagementService {
  private returns: MedicineReturnRecord[] = [...INITIAL_RETURNS];

  /**
   * Evaluates return conditions using pharmaceutical safety rules and suggests the optimal disposition.
   */
  public evaluateReturnDisposition(input: {
    returnType: ReturnType;
    reason: ReturnReason;
    isPackageOpened: boolean;
    isColdChainBreached: boolean;
    hoursSinceSale?: number;
  }): ReturnDispositionEvaluation {
    const warningFlags: string[] = [];

    // Rule 1: Opened package strictly prohibits resale
    if (input.isPackageOpened) {
      warningFlags.push('Package is opened: Resale to another patient is strictly prohibited under Good Pharmacy Practice.');
    }

    // Rule 2: Cold chain excursion
    if (input.isColdChainBreached) {
      warningFlags.push('Cold chain temperature compromised: Potential protein / active ingredient degradation.');
    }

    // Rule 3: Recall
    if (input.reason === 'recall') {
      warningFlags.push('National / Manufacturer Recall: Product must be quarantined and isolated from commercial inventory.');
      return {
        recommendedDisposition: 'quarantine_hold',
        rationale: 'Mandatory Drug Recall: Isolate stock immediately in hazardous quarantine cage pending consolidated manufacturer return (RTV).',
        allowedDispositions: ['quarantine_hold', 'supplier_return_rtv', 'destruction'],
        warningFlags,
        targetLocationSuggestion: 'Quarantine Lockup Cage #2 (Recall Isolated)',
      };
    }

    // Rule 4: Expired Product
    if (input.reason === 'expired_product') {
      if (input.returnType === 'supplier_return') {
        return {
          recommendedDisposition: 'supplier_return_rtv',
          rationale: 'Expired wholesale inventory returned to distributor under contractual credit agreement.',
          allowedDispositions: ['supplier_return_rtv', 'destruction'],
          warningFlags,
          targetLocationSuggestion: 'Outbound Supplier Returns Staging Bay',
        };
      }
      return {
        recommendedDisposition: 'destruction',
        rationale: 'Expired returned medicine cannot be dispensed. Slated for certified hazardous incineration.',
        allowedDispositions: ['destruction', 'quarantine_hold'],
        warningFlags,
        targetLocationSuggestion: 'Hazardous Waste Neutralization Bin',
      };
    }

    // Rule 5: Damaged / Defective Packaging
    if (input.reason === 'damaged_product' || input.reason === 'defective_packaging') {
      if (input.returnType === 'supplier_return') {
        return {
          recommendedDisposition: 'supplier_return_rtv',
          rationale: 'Transit damage / factory defective packaging dispatched to supplier for credit note.',
          allowedDispositions: ['supplier_return_rtv', 'quarantine_hold', 'destruction'],
          warningFlags,
          targetLocationSuggestion: 'Outbound Supplier Returns Staging Bay',
        };
      }
      return {
        recommendedDisposition: 'quarantine_hold',
        rationale: 'Damaged customer return isolated in quarantine cage for damage write-off or supplier RTV.',
        allowedDispositions: ['quarantine_hold', 'destruction', 'supplier_return_rtv'],
        warningFlags,
        targetLocationSuggestion: 'Damaged & Quarantine Isolation Cage',
      };
    }

    // Rule 6: Saleable Restock Condition
    if (
      !input.isPackageOpened &&
      !input.isColdChainBreached &&
      (input.reason === 'wrong_medicine' ||
        input.reason === 'incorrect_quantity' ||
        input.reason === 'delivery_error' ||
        input.reason === 'treatment_changed_by_doctor')
    ) {
      return {
        recommendedDisposition: 'restock_saleable',
        rationale: 'Unopened, tamper-evident seals intact, no temperature deviations. Verified eligible to return to active saleable shelf stock.',
        allowedDispositions: ['restock_saleable', 'quarantine_hold'],
        warningFlags,
        targetLocationSuggestion: 'Active Retail Shelf Bin',
      };
    }

    // Default Fallback: Quarantine
    return {
      recommendedDisposition: 'quarantine_hold',
      rationale: 'Discrepancy / condition requires pharmacist physical inspection. Placed on holding quarantine.',
      allowedDispositions: ['quarantine_hold', 'destruction', 'supplier_return_rtv', 'restock_saleable'],
      warningFlags,
      targetLocationSuggestion: 'Quarantine Holding Shelf',
    };
  }

  public getAllReturns(): MedicineReturnRecord[] {
    return [...this.returns];
  }

  public getReturnById(id: string): MedicineReturnRecord | undefined {
    return this.returns.find((r) => r.id === id || r.returnReferenceNumber === id);
  }

  public createReturn(
    recordData: Omit<
      MedicineReturnRecord,
      'id' | 'returnReferenceNumber' | 'totalRefundAmountUgx' | 'createdAt' | 'updatedAt'
    >
  ): MedicineReturnRecord {
    const isSupplier = recordData.returnType === 'supplier_return';
    const prefix = isSupplier ? 'RTV' : 'RET';
    const year = new Date().getFullYear();
    const ref = `${prefix}-${year}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const totalAmount = recordData.quantityReturned * recordData.unitPriceUgx;

    const newRecord: MedicineReturnRecord = {
      ...recordData,
      id: `RET-${Date.now().toString().slice(-6)}`,
      returnReferenceNumber: ref,
      totalRefundAmountUgx: totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.returns.unshift(newRecord);
    return newRecord;
  }

  public approveAndProcessReturn(
    id: string,
    params: {
      supervisorName: string;
      finalDisposition: ReturnDisposition;
      refundMethod: RefundPaymentMethod;
      replacementBatchNumber?: string;
      targetLocation?: string;
    }
  ): MedicineReturnRecord {
    const index = this.returns.findIndex((r) => r.id === id || r.returnReferenceNumber === id);
    if (index === -1) {
      throw new Error(`Return ${id} not found`);
    }

    const current = this.returns[index];
    let nextStatus = current.status;

    if (params.finalDisposition === 'restock_saleable') {
      nextStatus = 'restocked';
    } else if (params.finalDisposition === 'destruction') {
      nextStatus = 'disposed';
    } else if (params.finalDisposition === 'supplier_return_rtv') {
      nextStatus = 'credit_note_issued';
    } else {
      nextStatus = 'approved_and_processed';
    }

    const updated: MedicineReturnRecord = {
      ...current,
      disposition: params.finalDisposition,
      targetStorageLocation: params.targetLocation || current.targetStorageLocation,
      refundMethod: params.refundMethod,
      refundStatus: params.refundMethod === 'none' ? 'denied' : 'refunded',
      replacementBatchNumber: params.replacementBatchNumber,
      status: nextStatus,
      approvedBySupervisorName: params.supervisorName,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.returns[index] = updated;
    return updated;
  }

  public rejectReturn(id: string, supervisorName: string, reason: string): MedicineReturnRecord {
    const index = this.returns.findIndex((r) => r.id === id || r.returnReferenceNumber === id);
    if (index === -1) {
      throw new Error(`Return ${id} not found`);
    }

    const updated: MedicineReturnRecord = {
      ...this.returns[index],
      status: 'rejected_no_refund',
      refundStatus: 'denied',
      rejectionReason: reason,
      approvedBySupervisorName: supervisorName,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.returns[index] = updated;
    return updated;
  }

  public getReturnsKPIs() {
    const totalReturns = this.returns.length;
    const customerReturns = this.returns.filter((r) => r.returnType === 'customer_return').length;
    const supplierReturns = this.returns.filter((r) => r.returnType === 'supplier_return').length;

    const restockedCount = this.returns.filter((r) => r.disposition === 'restock_saleable').length;
    const quarantinedCount = this.returns.filter((r) => r.disposition === 'quarantine_hold').length;
    const rtvCount = this.returns.filter((r) => r.disposition === 'supplier_return_rtv').length;
    const destroyedCount = this.returns.filter((r) => r.disposition === 'destruction').length;

    const totalRefundsIssuedUgx = this.returns
      .filter((r) => r.refundStatus === 'refunded' || r.refundStatus === 'credit_issued')
      .reduce((sum, r) => sum + r.totalRefundAmountUgx, 0);

    return {
      totalReturns,
      customerReturns,
      supplierReturns,
      restockedCount,
      quarantinedCount,
      rtvCount,
      destroyedCount,
      totalRefundsIssuedUgx,
    };
  }
}

export const returnsManagementService = new ReturnsManagementService();
