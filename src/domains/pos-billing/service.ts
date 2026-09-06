/**
 * Bounded Context: Point of Sale & Billing Service Layer
 * Complies with technical.md §11.6 & §11.18
 */

import { SaleCheckoutRequestDto } from './types';
import { logAuditEvent } from '../../repositories/auditRepository';

export class PosBillingService {
  /**
   * Calculates financial totals with retail rounding
   */
  static calculateSaleTotals(items: SaleCheckoutRequestDto['items']): {
    subtotal: number;
    totalDiscount: number;
    netPayable: number;
  } {
    const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPriceUgx, 0);
    const totalDiscount = items.reduce(
      (acc, item) => acc + (item.quantity * item.unitPriceUgx * (item.discountPercentage || 0)) / 100,
      0
    );
    const netPayable = Math.max(0, Math.round(subtotal - totalDiscount));

    return {
      subtotal,
      totalDiscount,
      netPayable,
    };
  }
}
