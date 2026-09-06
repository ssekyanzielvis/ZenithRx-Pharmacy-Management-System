/**
 * Bounded Context: Insurance & Claims
 * Complies with technical.md §11.6 & Phase 5 Insurance Reconciliation
 */

export interface InsurancePolicyDto {
  providerId: string;
  providerName: string;
  policyNumber: string;
  copayPercentage: number;
  maxAnnualCoverageUgx: number;
  requiresPreAuth: boolean;
}

export interface ClaimReconciliationItemDto {
  claimId: string;
  prescriptionId: string;
  memberNumber: string;
  memberName: string;
  providerName: string;
  claimAmountUgx: number;
  copayPaidByPatientUgx: number;
  status: 'PENDING_SUBMISSION' | 'SUBMITTED' | 'APPROVED' | 'DISPUTED' | 'SETTLED';
  submissionDate: string;
  settlementReference?: string;
}
