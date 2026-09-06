/**
 * Bounded Context: Inventory & Batch Control Service Layer
 * Complies with technical.md §11.6 & §11.20
 */

import { DrugBatchDto, ClearanceMarkdownDto } from './types';
import { logAuditEvent } from '../../repositories/auditRepository';

export class InventoryService {
  /**
   * Sorts drug batches by First-Expired, First-Out (FEFO) order
   */
  static sortBatchesByFefo(batches: DrugBatchDto[]): DrugBatchDto[] {
    return [...batches]
      .filter((b) => !b.isQuarantined && b.stockQuantity > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }

  /**
   * Calculates FEFO clearance discount dynamically based on days until expiry
   */
  static calculateClearanceMarkdown(
    drugId: string,
    unitPriceUgx: number,
    expiryDate: string,
    approvedBy: string
  ): ClearanceMarkdownDto {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let discountPercentage = 0;
    if (daysToExpiry <= 15) {
      discountPercentage = 50; // Deep clearance for immediate sale
    } else if (daysToExpiry <= 30) {
      discountPercentage = 30;
    } else if (daysToExpiry <= 60) {
      discountPercentage = 15;
    }

    const markdownPriceUgx = Math.round(unitPriceUgx * (1 - discountPercentage / 100));

    return {
      drugId,
      originalPriceUgx: unitPriceUgx,
      discountPercentage,
      markdownPriceUgx,
      daysToExpiry,
      approvedBy,
    };
  }
}
