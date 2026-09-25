/**
 * stockReconciliationService.ts — ZenithRx Stock Adjustment & Physical Stocktake Service
 * Technical Specs: Complies with NDA Good Pharmacy Practice §11.6, §11.20 & Statutory Audit Rules
 * Provides rigorous tracking for: User → Date/time → Medicine → Batch → Previous Qty → New Qty → Diff → Reason → Approval
 */

import {
  StockAdjustmentRecord,
  StockAdjustmentReason,
  StockAdjustmentStatus,
  StocktakeSession,
  StocktakeCountItem,
  StocktakeScopeType,
} from '../types';

const INITIAL_ADJUSTMENTS: StockAdjustmentRecord[] = [
  {
    id: 'ADJ-001',
    adjustmentNumber: 'ADJ-2026-0038',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-001',
    drugName: 'Paracetamol 500mg Tablets (Box of 100)',
    brandName: 'Panadol Extra',
    genericName: 'Paracetamol / Acetaminophen',
    batchId: 'BATCH-001',
    batchNumber: 'BAT-2026-AUG01',
    expiryDate: '2028-01-10',
    previousQuantity: 460,
    newQuantity: 450,
    quantityDifference: -10,
    unitCostPriceUgx: 4500,
    financialImpactUgx: -45000,
    reason: 'breakage',
    justificationNotes: 'Pallet carton crushed during shelf re-organization in Aisle 1. 10 outer boxes deformed beyond commercial sale.',
    initiatedByUserId: 'USR-004',
    initiatedByName: 'Pharm. Tech Moses Ochieng',
    initiatedByRole: 'Pharmacy Technician',
    initiatedAt: '2026-03-12T10:15:00Z',
    status: 'approved',
    reviewedByUserId: 'USR-001',
    reviewedByName: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
    reviewedByRole: 'Supervising Pharmacist',
    reviewedAt: '2026-03-12T11:00:00Z',
    createdAt: '2026-03-12T10:15:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
  },
  {
    id: 'ADJ-002',
    adjustmentNumber: 'ADJ-2026-0039',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-008',
    drugName: 'Salbutamol 100mcg Inhaler (200 Doses)',
    brandName: 'Ventolin Evohaler',
    genericName: 'Salbutamol / Albuterol',
    batchId: 'BATCH-006',
    batchNumber: 'BAT-2026-SAL12',
    expiryDate: '2027-08-10',
    previousQuantity: 150,
    newQuantity: 130,
    quantityDifference: -20,
    unitCostPriceUgx: 14000,
    financialImpactUgx: -280000,
    reason: 'damaged_medicine',
    justificationNotes: '20 inhalers suffered cracked nozzle valves during offloading. Moved to damaged quarantine zone.',
    initiatedByUserId: 'USR-003',
    initiatedByName: 'Pharm. Brenda Namubiru',
    initiatedByRole: 'Assistant Pharmacist',
    initiatedAt: '2026-03-14T14:30:00Z',
    status: 'approved',
    reviewedByUserId: 'USR-001',
    reviewedByName: 'Dr. Elvis Ssekyanzi',
    reviewedByRole: 'Supervising Pharmacist',
    reviewedAt: '2026-03-14T15:10:00Z',
    createdAt: '2026-03-14T14:30:00Z',
    updatedAt: '2026-03-14T15:10:00Z',
  },
  {
    id: 'ADJ-003',
    adjustmentNumber: 'ADJ-2026-0040',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-007',
    drugName: 'Metformin HCl 500mg Tablets (Box of 100)',
    brandName: 'Glucophage 500mg',
    genericName: 'Metformin Hydrochloride',
    batchId: 'BATCH-005',
    batchNumber: 'BAT-2024-MET02',
    expiryDate: '2026-01-15',
    previousQuantity: 35,
    newQuantity: 0,
    quantityDifference: -35,
    unitCostPriceUgx: 8000,
    financialImpactUgx: -280000,
    reason: 'expired_medicine',
    justificationNotes: 'Periodic expiry sweep: Batch crossed expiration date on 2026-01-15. Written off and transferred to disposal lockup.',
    initiatedByUserId: 'USR-002',
    initiatedByName: 'Pharm. Denis Kigozi',
    initiatedByRole: 'Store & Inventory Manager',
    initiatedAt: '2026-03-16T09:00:00Z',
    status: 'approved',
    reviewedByUserId: 'USR-001',
    reviewedByName: 'Dr. Elvis Ssekyanzi',
    reviewedByRole: 'Supervising Pharmacist',
    reviewedAt: '2026-03-16T09:45:00Z',
    createdAt: '2026-03-16T09:00:00Z',
    updatedAt: '2026-03-16T09:45:00Z',
  },
  {
    id: 'ADJ-004',
    adjustmentNumber: 'ADJ-2026-0041',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-003',
    drugName: 'Co-Amoxiclav 625mg Tablets (Box of 14)',
    brandName: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    batchNumber: 'BAT-2026-AMX14',
    expiryDate: '2027-10-15',
    previousQuantity: 85,
    newQuantity: 88,
    quantityDifference: 3,
    unitCostPriceUgx: 28000,
    financialImpactUgx: 84000,
    reason: 'incorrect_receiving',
    justificationNotes: 'Receiving clerk previously entered 85 units instead of 88 units invoiced on GRN-2026-0204. Physical verification confirmed 88 packs.',
    initiatedByUserId: 'USR-002',
    initiatedByName: 'Pharm. Denis Kigozi',
    initiatedByRole: 'Store & Inventory Manager',
    initiatedAt: '2026-03-18T16:20:00Z',
    status: 'pending_approval',
    createdAt: '2026-03-18T16:20:00Z',
    updatedAt: '2026-03-18T16:20:00Z',
  },
  {
    id: 'ADJ-005',
    adjustmentNumber: 'ADJ-2026-0042',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    drugId: 'DRUG-012',
    drugName: 'Morphine Sulphate 10mg/5mL Oral Liquid (100mL)',
    brandName: 'Oramorph Oral Solution',
    genericName: 'Morphine Sulphate',
    batchId: 'BATCH-009',
    batchNumber: 'BAT-2026-MRP08',
    expiryDate: '2027-10-15',
    previousQuantity: 40,
    newQuantity: 38,
    quantityDifference: -2,
    unitCostPriceUgx: 45000,
    financialImpactUgx: -90000,
    reason: 'theft',
    justificationNotes: 'Schedule 1 Controlled Register variance check: 2 bottles unaccounted for following weekend vault inspection. Incident report filed and NDA notification drafted.',
    initiatedByUserId: 'USR-001',
    initiatedByName: 'Dr. Elvis Ssekyanzi',
    initiatedByRole: 'Supervising Pharmacist',
    initiatedAt: '2026-03-19T08:30:00Z',
    status: 'pending_approval',
    createdAt: '2026-03-19T08:30:00Z',
    updatedAt: '2026-03-19T08:30:00Z',
  },
];

const INITIAL_STOCKTAKE_SESSIONS: StocktakeSession[] = [
  {
    id: 'STK-001',
    stocktakeNumber: 'STK-2026-Q1-ANNUAL',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    title: 'Q1 2026 Comprehensive Pharmacy Physical Stocktake',
    scopeType: 'full_pharmacy',
    status: 'reconciliation_pending',
    initiatedByName: 'Pharm. Denis Kigozi',
    initiatedByRole: 'Store & Inventory Manager',
    initiatedAt: '2026-03-20T07:00:00Z',
    supervisorPharmacistName: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
    totalItemsScoped: 6,
    itemsCounted: 6,
    itemsWithVariance: 3,
    totalSystemQuantity: 1250,
    totalCountedQuantity: 1238,
    totalVarianceUnits: -12,
    netFinancialVarianceUgx: -165000,
    auditNotes: 'Comprehensive quarterly stocktake across Ambient, Cold-Chain and High-Security vault sections.',
    countItems: [
      {
        id: 'COUNT-001',
        stocktakeSessionId: 'STK-001',
        drugId: 'DRUG-001',
        drugName: 'Paracetamol 500mg Tablets (Box of 100)',
        batchNumber: 'BAT-2026-AUG01',
        expiryDate: '2028-01-10',
        storageLocation: 'Aisle 1, Shelf A-03, Bin 12',
        systemExpectedQty: 450,
        physicalCountedQty: 445,
        varianceQty: -5,
        unitCostPriceUgx: 4500,
        varianceValueUgx: -22500,
        counterUserName: 'Pharm. Tech Moses Ochieng',
        countedAt: '2026-03-20T08:30:00Z',
        reconciliationReason: 'stock_count_variance',
        notes: '5 boxes short in shelf count. Probable untracked floor dispensing or demo use.',
        isReconciled: false,
        createdAt: '2026-03-20T07:00:00Z',
      },
      {
        id: 'COUNT-002',
        stocktakeSessionId: 'STK-001',
        drugId: 'DRUG-006',
        drugName: 'Insulin Glargine 100 IU/mL SoloStar Pen',
        batchNumber: 'BAT-2026-INS77',
        expiryDate: '2027-04-30',
        storageLocation: 'Cold-Chain Refrigerator #2',
        systemExpectedQty: 65,
        physicalCountedQty: 65,
        varianceQty: 0,
        unitCostPriceUgx: 58000,
        varianceValueUgx: 0,
        counterUserName: 'Pharm. Brenda Namubiru',
        countedAt: '2026-03-20T09:15:00Z',
        notes: 'Cold chain verified. Temperature logs stable at 3.8°C. Count 100% matched.',
        isReconciled: true,
        createdAt: '2026-03-20T07:00:00Z',
      },
      {
        id: 'COUNT-003',
        stocktakeSessionId: 'STK-001',
        drugId: 'DRUG-008',
        drugName: 'Salbutamol 100mcg Inhaler (200 Doses)',
        batchNumber: 'BAT-2026-SAL12',
        expiryDate: '2027-08-10',
        storageLocation: 'Aisle 2, Shelf B-01',
        systemExpectedQty: 130,
        physicalCountedQty: 125,
        varianceQty: -5,
        unitCostPriceUgx: 14000,
        varianceValueUgx: -70000,
        counterUserName: 'Pharm. Tech Moses Ochieng',
        countedAt: '2026-03-20T10:00:00Z',
        reconciliationReason: 'breakage',
        notes: '5 units damaged due to water pipe condensation dripping near upper shelf rack.',
        isReconciled: false,
        createdAt: '2026-03-20T07:00:00Z',
      },
      {
        id: 'COUNT-004',
        stocktakeSessionId: 'STK-001',
        drugId: 'DRUG-003',
        drugName: 'Co-Amoxiclav 625mg Tablets (Box of 14)',
        batchNumber: 'BAT-2026-AMX09',
        expiryDate: '2027-11-20',
        storageLocation: 'Quarantine Lockup Cage #1',
        systemExpectedQty: 200,
        physicalCountedQty: 200,
        varianceQty: 0,
        unitCostPriceUgx: 28000,
        varianceValueUgx: 0,
        counterUserName: 'Pharm. Denis Kigozi',
        countedAt: '2026-03-20T10:30:00Z',
        notes: 'Quarantine lockup cage audit: 200 units accounted for.',
        isReconciled: true,
        createdAt: '2026-03-20T07:00:00Z',
      },
      {
        id: 'COUNT-005',
        stocktakeSessionId: 'STK-001',
        drugId: 'DRUG-012',
        drugName: 'Morphine Sulphate 10mg/5mL Oral Liquid',
        batchNumber: 'BAT-2026-MRP08',
        expiryDate: '2027-10-15',
        storageLocation: 'Schedule 1 Poison Safe - Vault A',
        systemExpectedQty: 38,
        physicalCountedQty: 36,
        varianceQty: -2,
        unitCostPriceUgx: 45000,
        varianceValueUgx: -90000,
        counterUserName: 'Dr. Elvis Ssekyanzi',
        countedAt: '2026-03-20T11:00:00Z',
        reconciliationReason: 'theft',
        notes: 'Vault audit: Variance logged under security escalation.',
        isReconciled: false,
        createdAt: '2026-03-20T07:00:00Z',
      },
      {
        id: 'COUNT-006',
        stocktakeSessionId: 'STK-001',
        drugId: 'DRUG-007',
        drugName: 'Amlodipine 5mg Tablets (Box of 30)',
        batchNumber: 'BAT-2026-AML55',
        expiryDate: '2027-09-01',
        storageLocation: 'Aisle 2, Shelf C-01, Bin 04',
        systemExpectedQty: 367,
        physicalCountedQty: 367,
        varianceQty: 0,
        unitCostPriceUgx: 3500,
        varianceValueUgx: 0,
        counterUserName: 'Pharm. Tech Moses Ochieng',
        countedAt: '2026-03-20T11:45:00Z',
        notes: 'Exact match with digital stock register.',
        isReconciled: true,
        createdAt: '2026-03-20T07:00:00Z',
      },
    ],
    createdAt: '2026-03-20T07:00:00Z',
    updatedAt: '2026-03-20T12:00:00Z',
  },
  {
    id: 'STK-002',
    stocktakeNumber: 'STK-2026-W11-COLD',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    title: 'Bi-Weekly Cold-Chain Vaccine & Biologicals Audit',
    scopeType: 'storage_zone_count',
    targetStorageZone: 'Cold-Chain Refrigerator #2 (2-8°C)',
    status: 'approved_and_posted',
    initiatedByName: 'Pharm. Brenda Namubiru',
    initiatedByRole: 'Assistant Pharmacist',
    initiatedAt: '2026-03-08T08:00:00Z',
    supervisorPharmacistName: 'Dr. Elvis Ssekyanzi',
    totalItemsScoped: 4,
    itemsCounted: 4,
    itemsWithVariance: 0,
    totalSystemQuantity: 320,
    totalCountedQuantity: 320,
    totalVarianceUnits: 0,
    netFinancialVarianceUgx: 0,
    completedAt: '2026-03-08T10:30:00Z',
    approvedByName: 'Dr. Elvis Ssekyanzi',
    approvedAt: '2026-03-08T11:00:00Z',
    auditNotes: 'All vaccine and insulin biologicals 100% verified with zero variance.',
    createdAt: '2026-03-08T08:00:00Z',
    updatedAt: '2026-03-08T11:00:00Z',
  },
];

class StockReconciliationService {
  private adjustments: StockAdjustmentRecord[] = [...INITIAL_ADJUSTMENTS];
  private stocktakes: StocktakeSession[] = [...INITIAL_STOCKTAKE_SESSIONS];

  // ─── Stock Adjustments ──────────────────────────────────────────────────────

  public getAllAdjustments(): StockAdjustmentRecord[] {
    return [...this.adjustments];
  }

  public getAdjustmentById(id: string): StockAdjustmentRecord | undefined {
    return this.adjustments.find((a) => a.id === id || a.adjustmentNumber === id);
  }

  public createAdjustment(
    params: Omit<
      StockAdjustmentRecord,
      'id' | 'adjustmentNumber' | 'financialImpactUgx' | 'quantityDifference' | 'createdAt' | 'updatedAt'
    >
  ): StockAdjustmentRecord {
    const qtyDiff = params.newQuantity - params.previousQuantity;
    const finImpact = qtyDiff * params.unitCostPriceUgx;

    const newRecord: StockAdjustmentRecord = {
      ...params,
      id: `ADJ-${Date.now().toString().slice(-6)}`,
      adjustmentNumber: `ADJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      quantityDifference: qtyDiff,
      financialImpactUgx: finImpact,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.adjustments.unshift(newRecord);
    return newRecord;
  }

  public approveAdjustment(
    id: string,
    reviewer: { id: string; name: string; role: string }
  ): StockAdjustmentRecord {
    const index = this.adjustments.findIndex((a) => a.id === id || a.adjustmentNumber === id);
    if (index === -1) {
      throw new Error(`Adjustment ${id} not found`);
    }

    const updated: StockAdjustmentRecord = {
      ...this.adjustments[index],
      status: 'approved',
      reviewedByUserId: reviewer.id,
      reviewedByName: reviewer.name,
      reviewedByRole: reviewer.role,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.adjustments[index] = updated;
    return updated;
  }

  public rejectAdjustment(
    id: string,
    reviewer: { id: string; name: string; role: string },
    rejectionReason: string
  ): StockAdjustmentRecord {
    const index = this.adjustments.findIndex((a) => a.id === id || a.adjustmentNumber === id);
    if (index === -1) {
      throw new Error(`Adjustment ${id} not found`);
    }

    const updated: StockAdjustmentRecord = {
      ...this.adjustments[index],
      status: 'rejected',
      reviewedByUserId: reviewer.id,
      reviewedByName: reviewer.name,
      reviewedByRole: reviewer.role,
      reviewedAt: new Date().toISOString(),
      rejectionReason,
      updatedAt: new Date().toISOString(),
    };

    this.adjustments[index] = updated;
    return updated;
  }

  // ─── Physical Stocktake Sessions ──────────────────────────────────────────

  public getAllStocktakes(): StocktakeSession[] {
    return [...this.stocktakes];
  }

  public getStocktakeById(id: string): StocktakeSession | undefined {
    return this.stocktakes.find((s) => s.id === id || s.stocktakeNumber === id);
  }

  public createStocktakeSession(data: {
    title: string;
    scopeType: StocktakeScopeType;
    targetCategory?: string;
    targetStorageZone?: string;
    initiatedByName: string;
    initiatedByRole: string;
    supervisorPharmacistName?: string;
    initialCountItems?: Array<{
      drugId: string;
      drugName: string;
      batchNumber: string;
      expiryDate?: string;
      storageLocation?: string;
      systemExpectedQty: number;
      unitCostPriceUgx: number;
    }>;
  }): StocktakeSession {
    const sessionId = `STK-${Date.now().toString().slice(-6)}`;
    const sessionNumber = `STK-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const countItems: StocktakeCountItem[] = (data.initialCountItems || []).map((item, idx) => ({
      id: `COUNT-${Date.now()}-${idx}`,
      stocktakeSessionId: sessionId,
      drugId: item.drugId,
      drugName: item.drugName,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      storageLocation: item.storageLocation,
      systemExpectedQty: item.systemExpectedQty,
      physicalCountedQty: undefined,
      varianceQty: 0,
      unitCostPriceUgx: item.unitCostPriceUgx,
      varianceValueUgx: 0,
      isReconciled: false,
      createdAt: new Date().toISOString(),
    }));

    const totalSysQty = countItems.reduce((sum, c) => sum + c.systemExpectedQty, 0);

    const newSession: StocktakeSession = {
      id: sessionId,
      stocktakeNumber: sessionNumber,
      tenantId: 'tenant_prime',
      branchId: 'branch_kampala_central',
      title: data.title,
      scopeType: data.scopeType,
      targetCategory: data.targetCategory,
      targetStorageZone: data.targetStorageZone,
      status: 'in_progress',
      initiatedByName: data.initiatedByName,
      initiatedByRole: data.initiatedByRole,
      initiatedAt: new Date().toISOString(),
      supervisorPharmacistName: data.supervisorPharmacistName,
      totalItemsScoped: countItems.length,
      itemsCounted: 0,
      itemsWithVariance: 0,
      totalSystemQuantity: totalSysQty,
      totalCountedQuantity: 0,
      totalVarianceUnits: 0,
      netFinancialVarianceUgx: 0,
      countItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.stocktakes.unshift(newSession);
    return newSession;
  }

  public recordPhysicalCount(
    stocktakeId: string,
    countItemId: string,
    params: {
      physicalCountedQty: number;
      counterUserName: string;
      reconciliationReason?: StockAdjustmentReason;
      notes?: string;
    }
  ): StocktakeSession {
    const sIndex = this.stocktakes.findIndex((s) => s.id === stocktakeId || s.stocktakeNumber === stocktakeId);
    if (sIndex === -1) {
      throw new Error(`Stocktake ${stocktakeId} not found`);
    }

    const session = this.stocktakes[sIndex];
    if (!session.countItems) session.countItems = [];

    const cIndex = session.countItems.findIndex((c) => c.id === countItemId);
    if (cIndex === -1) {
      throw new Error(`Count item ${countItemId} not found`);
    }

    const item = session.countItems[cIndex];
    const varianceQty = params.physicalCountedQty - item.systemExpectedQty;
    const varianceValue = varianceQty * item.unitCostPriceUgx;

    session.countItems[cIndex] = {
      ...item,
      physicalCountedQty: params.physicalCountedQty,
      varianceQty,
      varianceValueUgx: varianceValue,
      counterUserName: params.counterUserName,
      countedAt: new Date().toISOString(),
      reconciliationReason: params.reconciliationReason,
      notes: params.notes,
      isReconciled: varianceQty === 0,
    };

    // Recompute session metrics
    const counted = session.countItems.filter((c) => c.physicalCountedQty !== undefined);
    const withVariance = session.countItems.filter(
      (c) => c.physicalCountedQty !== undefined && c.varianceQty !== 0
    );
    const totalCountedQty = counted.reduce((sum, c) => sum + (c.physicalCountedQty || 0), 0);
    const totalVarUnits = counted.reduce((sum, c) => sum + c.varianceQty, 0);
    const netFinVar = counted.reduce((sum, c) => sum + c.varianceValueUgx, 0);

    session.itemsCounted = counted.length;
    session.itemsWithVariance = withVariance.length;
    session.totalCountedQuantity = totalCountedQty;
    session.totalVarianceUnits = totalVarUnits;
    session.netFinancialVarianceUgx = netFinVar;
    session.updatedAt = new Date().toISOString();

    this.stocktakes[sIndex] = session;
    return session;
  }

  public submitStocktakeForReconciliation(stocktakeId: string): StocktakeSession {
    const sIndex = this.stocktakes.findIndex((s) => s.id === stocktakeId || s.stocktakeNumber === stocktakeId);
    if (sIndex === -1) {
      throw new Error(`Stocktake ${stocktakeId} not found`);
    }

    const session = this.stocktakes[sIndex];
    session.status = 'reconciliation_pending';
    session.completedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    this.stocktakes[sIndex] = session;
    return session;
  }

  public approveAndPostStocktake(stocktakeId: string, supervisorName: string): StocktakeSession {
    const sIndex = this.stocktakes.findIndex((s) => s.id === stocktakeId || s.stocktakeNumber === stocktakeId);
    if (sIndex === -1) {
      throw new Error(`Stocktake ${stocktakeId} not found`);
    }

    const session = this.stocktakes[sIndex];

    // Automatically generate approved stock adjustment records for items with variance
    if (session.countItems) {
      session.countItems.forEach((item) => {
        if (item.varianceQty !== 0 && !item.isReconciled) {
          this.createAdjustment({
            tenantId: session.tenantId,
            branchId: session.branchId,
            drugId: item.drugId,
            drugName: item.drugName,
            brandName: item.drugName,
            genericName: item.drugName,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            previousQuantity: item.systemExpectedQty,
            newQuantity: item.physicalCountedQty || item.systemExpectedQty,
            unitCostPriceUgx: item.unitCostPriceUgx,
            reason: item.reconciliationReason || 'stock_count_variance',
            justificationNotes: `Auto-generated from Stocktake #${session.stocktakeNumber}: ${item.notes || 'Physical count variance.'}`,
            initiatedByUserId: 'SYSTEM',
            initiatedByName: session.initiatedByName,
            initiatedByRole: session.initiatedByRole,
            initiatedAt: new Date().toISOString(),
            status: 'approved',
            reviewedByUserId: 'SUPERVISOR',
            reviewedByName: supervisorName,
            reviewedByRole: 'Supervising Pharmacist',
            reviewedAt: new Date().toISOString(),
            stocktakeSessionId: session.id,
          });

          item.isReconciled = true;
        }
      });
    }

    session.status = 'approved_and_posted';
    session.approvedByName = supervisorName;
    session.approvedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    this.stocktakes[sIndex] = session;
    return session;
  }

  public getStocktakeKPIs() {
    const pendingAdjustments = this.adjustments.filter((a) => a.status === 'pending_approval').length;
    const approvedAdjustments = this.adjustments.filter((a) => a.status === 'approved').length;
    const activeStocktakes = this.stocktakes.filter(
      (s) => s.status === 'in_progress' || s.status === 'reconciliation_pending'
    ).length;
    const completedStocktakes = this.stocktakes.filter((s) => s.status === 'approved_and_posted').length;

    const netAdjustmentLossUgx = this.adjustments
      .filter((a) => a.status === 'approved' && a.financialImpactUgx < 0)
      .reduce((sum, a) => sum + Math.abs(a.financialImpactUgx), 0);

    const netAdjustmentGainUgx = this.adjustments
      .filter((a) => a.status === 'approved' && a.financialImpactUgx > 0)
      .reduce((sum, a) => sum + a.financialImpactUgx, 0);

    return {
      pendingAdjustments,
      approvedAdjustments,
      activeStocktakes,
      completedStocktakes,
      netAdjustmentLossUgx,
      netAdjustmentGainUgx,
    };
  }
}

export const stockReconciliationService = new StockReconciliationService();
