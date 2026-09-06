/**
 * Bounded Context: Insurance & Claims Service Layer
 * Complies with technical.md §11.6 & Phase 5 Insurance Reconciliation
 */

import { InsurancePolicyDto, ClaimReconciliationItemDto } from './types';

export class InsuranceClaimService {
  /**
   * Computes insurance copay split between patient and provider
   */
  static calculateCopaySplit(
    totalBillUgx: number,
    copayPercentage: number
  ): {
    patientCopayUgx: number;
    insurerPayableUgx: number;
  } {
    const rate = Math.min(100, Math.max(0, copayPercentage)) / 100;
    const patientCopayUgx = Math.round(totalBillUgx * rate);
    const insurerPayableUgx = Math.max(0, totalBillUgx - patientCopayUgx);

    return {
      patientCopayUgx,
      insurerPayableUgx,
    };
  }
}
