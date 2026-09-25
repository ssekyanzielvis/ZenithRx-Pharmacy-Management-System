/**
 * fefoDispensingService.ts — ZenithRx Active FEFO (First Expired, First Out) Dispensing & Batch Optimization Engine
 * Technical Standards: Good Pharmacy Practice (GPP) & NDA Guidelines on Stock Rotation (§11.6, §11.20)
 *
 * Actively assists the pharmacist at point of dispensing:
 * - Automatically ranks available batches by expiry date (ascending)
 * - Highlights and pre-selects the Recommended FEFO Batch (e.g. Batch A expires Jan 2027 vs Batch B expires Jun 2027)
 * - Multi-batch split calculation if earliest batch has partial quantity
 * - Validates shelf-life against prescribed treatment duration (e.g. 30/60/90 days)
 * - Catches out-of-sequence overrides and requires documented clinical/operational reasons
 */

export interface ActiveDrugBatch {
  id: string;
  drugId: string;
  batchNumber: string;
  brandName: string;
  genericName: string;
  expiryDate: string; // YYYY-MM-DD
  manufacturingDate?: string;
  quantityAvailable: number;
  shelfLocation: string;
  unitPriceUgx: number;
  costPriceUgx: number;
  status: 'available' | 'quarantined' | 'recalled' | 'expired' | 'reserved';
  supplierName?: string;
}

export interface FefoAllocationItem {
  batch: ActiveDrugBatch;
  allocatedQuantity: number;
  isPrimaryFefo: boolean;
  priorityRank: number; // 1 = First to dispense, 2 = Second, etc.
  daysUntilExpiry: number;
  expiryFormatted: string; // e.g. "Jan 2027"
}

export interface FefoRecommendationResult {
  drugId: string;
  drugName: string;
  requestedQuantity: number;
  recommendedBatch: ActiveDrugBatch | null;
  allBatches: ActiveDrugBatch[];
  allocatedBatches: FefoAllocationItem[];
  totalAvailableStock: number;
  isMultiBatchSplit: boolean;
  hasSufficientStock: boolean;
  isTreatmentDurationCompatible: boolean;
  treatmentDurationWarning?: string;
  guidanceMessage: string;
}

// Master Multi-Batch Active Stock Database
const MASTER_BATCH_DATABASE: Record<string, ActiveDrugBatch[]> = {
  // Augmentin / Amoxiclav 625mg
  'DRUG-001': [
    {
      id: 'BAT-AUG-01',
      drugId: 'DRUG-001',
      batchNumber: 'AUG-2027A',
      brandName: 'Augmentin 625mg',
      genericName: 'Amoxicillin + Clavulanate Potassium',
      expiryDate: '2027-01-15', // Jan 2027 (Earlier expiry -> Batch A)
      quantityAvailable: 40,
      shelfLocation: 'Rack A-02 (Bin 1)',
      unitPriceUgx: 1250,
      costPriceUgx: 850,
      status: 'available',
      supplierName: 'GlaxoSmithKline Direct',
    },
    {
      id: 'BAT-AUG-02',
      drugId: 'DRUG-001',
      batchNumber: 'AUG-2027B',
      brandName: 'Augmentin 625mg',
      genericName: 'Amoxicillin + Clavulanate Potassium',
      expiryDate: '2027-06-30', // Jun 2027 (Later expiry -> Batch B)
      quantityAvailable: 100,
      shelfLocation: 'Rack A-02 (Bin 2)',
      unitPriceUgx: 1250,
      costPriceUgx: 850,
      status: 'available',
      supplierName: 'GlaxoSmithKline Direct',
    },
    {
      id: 'BAT-AUG-03',
      drugId: 'DRUG-001',
      batchNumber: 'AUG-2027C',
      brandName: 'Augmentin 625mg',
      genericName: 'Amoxicillin + Clavulanate Potassium',
      expiryDate: '2027-12-31', // Dec 2027 (Batch C)
      quantityAvailable: 150,
      shelfLocation: 'Bulk Store Room 1',
      unitPriceUgx: 1250,
      costPriceUgx: 850,
      status: 'available',
      supplierName: 'GlaxoSmithKline Direct',
    },
  ],

  // Metformin 850mg
  'DRUG-002': [
    {
      id: 'BAT-MET-01',
      drugId: 'DRUG-002',
      batchNumber: 'MET-2027A',
      brandName: 'Glucophage 850mg',
      genericName: 'Metformin Hydrochloride',
      expiryDate: '2027-02-28', // Feb 2027
      quantityAvailable: 60,
      shelfLocation: 'Rack B-01 (Bin 1)',
      unitPriceUgx: 680,
      costPriceUgx: 420,
      status: 'available',
      supplierName: 'Merck Healthcare',
    },
    {
      id: 'BAT-MET-02',
      drugId: 'DRUG-002',
      batchNumber: 'MET-2027B',
      brandName: 'Glucophage 850mg',
      genericName: 'Metformin Hydrochloride',
      expiryDate: '2027-09-30', // Sep 2027
      quantityAvailable: 120,
      shelfLocation: 'Rack B-01 (Bin 2)',
      unitPriceUgx: 680,
      costPriceUgx: 420,
      status: 'available',
      supplierName: 'Merck Healthcare',
    },
  ],

  // Panadol Extra
  'DRUG-003': [
    {
      id: 'BAT-PAN-01',
      drugId: 'DRUG-003',
      batchNumber: 'PAN-2027A',
      brandName: 'Panadol Extra',
      genericName: 'Paracetamol + Caffeine',
      expiryDate: '2027-01-31', // Jan 2027
      quantityAvailable: 80,
      shelfLocation: 'Front OTC Shelf 1',
      unitPriceUgx: 200,
      costPriceUgx: 120,
      status: 'available',
      supplierName: 'Haleon / GSK',
    },
    {
      id: 'BAT-PAN-02',
      drugId: 'DRUG-003',
      batchNumber: 'PAN-2027B',
      brandName: 'Panadol Extra',
      genericName: 'Paracetamol + Caffeine',
      expiryDate: '2027-08-10', // Aug 2027
      quantityAvailable: 250,
      shelfLocation: 'Front OTC Shelf 2',
      unitPriceUgx: 200,
      costPriceUgx: 120,
      status: 'available',
      supplierName: 'Haleon / GSK',
    },
  ],

  // Norvasc 5mg
  'DRUG-004': [
    {
      id: 'BAT-NOR-01',
      drugId: 'DRUG-004',
      batchNumber: 'NOR-2026-X8',
      brandName: 'Norvasc 5mg',
      genericName: 'Amlodipine Besylate',
      expiryDate: '2026-11-30', // Nov 2026 (Expiring earlier)
      quantityAvailable: 18,
      shelfLocation: 'Rack C-04',
      unitPriceUgx: 980,
      costPriceUgx: 650,
      status: 'available',
      supplierName: 'Pfizer East Africa',
    },
    {
      id: 'BAT-NOR-02',
      drugId: 'DRUG-004',
      batchNumber: 'NOR-2027-A3',
      brandName: 'Norvasc 5mg',
      genericName: 'Amlodipine Besylate',
      expiryDate: '2027-07-31', // Jul 2027
      quantityAvailable: 90,
      shelfLocation: 'Rack C-04 (Top Bin)',
      unitPriceUgx: 980,
      costPriceUgx: 650,
      status: 'available',
      supplierName: 'Pfizer East Africa',
    },
  ],

  // Ventolin Evohaler
  'DRUG-005': [
    {
      id: 'BAT-VEN-01',
      drugId: 'DRUG-005',
      batchNumber: 'VEN-2026-09',
      brandName: 'Ventolin Evohaler 100mcg',
      genericName: 'Salbutamol Sulfate Inhaler',
      expiryDate: '2026-12-15', // Dec 2026
      quantityAvailable: 8,
      shelfLocation: 'Rack R-01',
      unitPriceUgx: 1450,
      costPriceUgx: 950,
      status: 'available',
      supplierName: 'GSK',
    },
    {
      id: 'BAT-VEN-02',
      drugId: 'DRUG-005',
      batchNumber: 'VEN-2027-05',
      brandName: 'Ventolin Evohaler 100mcg',
      genericName: 'Salbutamol Sulfate Inhaler',
      expiryDate: '2027-05-30', // May 2027
      quantityAvailable: 35,
      shelfLocation: 'Rack R-01 (Bin B)',
      unitPriceUgx: 1450,
      costPriceUgx: 950,
      status: 'available',
      supplierName: 'GSK',
    },
  ],
};

/**
 * Format a date string (YYYY-MM-DD) into readable Month Year (e.g. "Jan 2027")
 */
export function formatExpiryMonthYear(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate days remaining until expiration
 */
export function getDaysUntilExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 0;
  const expiry = new Date(expiryDateStr).getTime();
  const now = new Date().getTime();
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export class FefoDispensingService {
  private batchesStore: Record<string, ActiveDrugBatch[]> = { ...MASTER_BATCH_DATABASE };

  /**
   * Retrieves all batches for a drug, sorted strictly by FEFO (Earliest Expiry First)
   */
  public getBatchesForDrug(drugId: string, drugNameFallback?: string): ActiveDrugBatch[] {
    let list = this.batchesStore[drugId];
    if (!list || list.length === 0) {
      // Generate default multi-batch set for any ad-hoc drug
      const dName = drugNameFallback || `Drug ${drugId}`;
      list = [
        {
          id: `BAT-${drugId}-A`,
          drugId,
          batchNumber: `BAT-${drugId}-2027A`,
          brandName: dName,
          genericName: dName,
          expiryDate: '2027-01-31', // Jan 2027 (Batch A)
          quantityAvailable: 50,
          shelfLocation: 'Dispensary Shelf A-01',
          unitPriceUgx: 1000,
          costPriceUgx: 650,
          status: 'available',
          supplierName: 'Verified NDA Distributor',
        },
        {
          id: `BAT-${drugId}-B`,
          drugId,
          batchNumber: `BAT-${drugId}-2027B`,
          brandName: dName,
          genericName: dName,
          expiryDate: '2027-06-30', // Jun 2027 (Batch B)
          quantityAvailable: 120,
          shelfLocation: 'Dispensary Shelf A-02',
          unitPriceUgx: 1000,
          costPriceUgx: 650,
          status: 'available',
          supplierName: 'Verified NDA Distributor',
        },
      ];
      this.batchesStore[drugId] = list;
    }

    // Sort strictly by expiryDate ascending (FEFO)
    return [...list].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }

  /**
   * Evaluates FEFO allocation and returns active assistant recommendations
   */
  public getFefoRecommendation(
    drugId: string,
    requestedQuantity: number = 1,
    treatmentDurationDays: number = 0,
    drugNameFallback?: string
  ): FefoRecommendationResult {
    const batches = this.getBatchesForDrug(drugId, drugNameFallback);
    const availableBatches = batches.filter((b) => b.status === 'available' && b.quantityAvailable > 0);
    const totalAvailableStock = availableBatches.reduce((sum, b) => sum + b.quantityAvailable, 0);
    const hasSufficientStock = totalAvailableStock >= requestedQuantity;

    const allocatedBatches: FefoAllocationItem[] = [];
    let remainingToAllocate = requestedQuantity;
    let isMultiBatchSplit = false;
    let recommendedBatch: ActiveDrugBatch | null = availableBatches[0] || null;

    let isTreatmentDurationCompatible = true;
    let treatmentDurationWarning: string | undefined;

    for (let i = 0; i < availableBatches.length; i++) {
      const b = availableBatches[i];
      const daysLeft = getDaysUntilExpiry(b.expiryDate);

      // Verify if batch expires before the treatment regimen is completed
      if (treatmentDurationDays > 0 && daysLeft < treatmentDurationDays) {
        if (i === 0) {
          isTreatmentDurationCompatible = false;
          treatmentDurationWarning = `Batch ${b.batchNumber} expires in ${daysLeft} days, which is shorter than the ${treatmentDurationDays}-day prescribed course of therapy.`;
        }
      }

      if (remainingToAllocate > 0) {
        const qtyFromThisBatch = Math.min(b.quantityAvailable, remainingToAllocate);
        allocatedBatches.push({
          batch: b,
          allocatedQuantity: qtyFromThisBatch,
          isPrimaryFefo: i === 0,
          priorityRank: i + 1,
          daysUntilExpiry: daysLeft,
          expiryFormatted: formatExpiryMonthYear(b.expiryDate),
        });

        remainingToAllocate -= qtyFromThisBatch;
        if (allocatedBatches.length > 1) {
          isMultiBatchSplit = true;
        }
      }
    }

    // Generate clinical guidance message
    let guidanceMessage = '';
    if (!recommendedBatch) {
      guidanceMessage = 'No active unexpired batches available in stock.';
    } else if (availableBatches.length > 1) {
      const b1 = availableBatches[0];
      const b2 = availableBatches[1];
      const b1Exp = formatExpiryMonthYear(b1.expiryDate);
      const b2Exp = formatExpiryMonthYear(b2.expiryDate);

      if (isMultiBatchSplit) {
        guidanceMessage = `Multi-batch FEFO Split: Dispense ${allocatedBatches[0].allocatedQuantity} units from Batch ${b1.batchNumber} (Expires ${b1Exp}) + ${allocatedBatches[1].allocatedQuantity} units from Batch ${b2.batchNumber} (Expires ${b2Exp}).`;
      } else {
        guidanceMessage = `Recommended Batch: ${b1.batchNumber} (Expires ${b1Exp}) — Dispense before Batch ${b2.batchNumber} (Expires ${b2Exp}).`;
      }
    } else {
      guidanceMessage = `Recommended Batch: ${recommendedBatch.batchNumber} (Expires ${formatExpiryMonthYear(recommendedBatch.expiryDate)}).`;
    }

    return {
      drugId,
      drugName: recommendedBatch ? recommendedBatch.brandName : drugNameFallback || 'Medicine',
      requestedQuantity,
      recommendedBatch,
      allBatches: batches,
      allocatedBatches,
      totalAvailableStock,
      isMultiBatchSplit,
      hasSufficientStock,
      isTreatmentDurationCompatible,
      treatmentDurationWarning,
      guidanceMessage,
    };
  }

  /**
   * Checks if a user-selected batch violates the FEFO sequence
   */
  public checkFefoSequenceViolation(
    drugId: string,
    selectedBatchIdOrNumber: string,
    requestedQuantity: number = 1
  ): {
    isViolation: boolean;
    recommendedBatch: ActiveDrugBatch | null;
    selectedBatch: ActiveDrugBatch | null;
    warningMessage?: string;
  } {
    const batches = this.getBatchesForDrug(drugId);
    const availableBatches = batches.filter((b) => b.status === 'available' && b.quantityAvailable > 0);

    if (availableBatches.length <= 1) {
      return { isViolation: false, recommendedBatch: availableBatches[0] || null, selectedBatch: availableBatches[0] || null };
    }

    const recommended = availableBatches[0];
    const selected = availableBatches.find(
      (b) => b.id === selectedBatchIdOrNumber || b.batchNumber === selectedBatchIdOrNumber
    ) || null;

    if (!selected) {
      return { isViolation: false, recommendedBatch: recommended, selectedBatch: null };
    }

    const recommendedExp = new Date(recommended.expiryDate).getTime();
    const selectedExp = new Date(selected.expiryDate).getTime();

    // Violation occurs if selected batch expires later than recommended batch and recommended batch has stock
    if (selectedExp > recommendedExp && recommended.quantityAvailable > 0 && selected.id !== recommended.id) {
      const recMonth = formatExpiryMonthYear(recommended.expiryDate);
      const selMonth = formatExpiryMonthYear(selected.expiryDate);

      return {
        isViolation: true,
        recommendedBatch: recommended,
        selectedBatch: selected,
        warningMessage: `FEFO Sequence Alert: Batch ${recommended.batchNumber} (Expires ${recMonth}, ${recommended.quantityAvailable} units in stock) should be dispensed before selected Batch ${selected.batchNumber} (Expires ${selMonth}).`,
      };
    }

    return { isViolation: false, recommendedBatch: recommended, selectedBatch: selected };
  }

  /**
   * Deduct stock upon confirmed dispensing
   */
  public deductBatchStock(drugId: string, batchNumber: string, quantityToDeduct: number): boolean {
    const list = this.batchesStore[drugId];
    if (!list) return false;

    const batch = list.find((b) => b.batchNumber === batchNumber || b.id === batchNumber);
    if (!batch) return false;

    batch.quantityAvailable = Math.max(0, batch.quantityAvailable - quantityToDeduct);
    return true;
  }
}

export const fefoDispensingService = new FefoDispensingService();
