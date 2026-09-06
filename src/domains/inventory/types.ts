/**
 * Bounded Context: Inventory & Batch Control
 * Complies with technical.md §11.6 & §11.20
 */

export interface DrugBatchDto {
  id: string;
  drugId: string;
  batchNumber: string;
  stockQuantity: number;
  expiryDate: string; // YYYY-MM-DD
  manufacturingDate?: string;
  costPriceUgx: number;
  unitSellingPriceUgx: number;
  isQuarantined: boolean;
  quarantineReason?: string;
}

export interface ClearanceMarkdownDto {
  drugId: string;
  originalPriceUgx: number;
  discountPercentage: number;
  markdownPriceUgx: number;
  daysToExpiry: number;
  approvedBy: string;
}
