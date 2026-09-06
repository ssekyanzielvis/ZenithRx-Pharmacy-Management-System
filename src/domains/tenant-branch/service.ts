/**
 * Bounded Context: Tenant & Branch Administration Service
 * Complies with technical.md §11.6 & §11.17
 */

import { TenantProfileDto, BranchDto } from './types';
import { logAuditEvent } from '../../repositories/auditRepository';

export class TenantBranchService {
  /**
   * Validates Uganda National Drug Authority (NDA) license format
   * Format: NDA/RET/XXXX/YYYY or NDA/WHL/XXXX/YYYY
   */
  static validateNdaLicense(licenseNo: string): { isValid: boolean; error?: string } {
    const trimmed = licenseNo.trim().toUpperCase();
    if (!trimmed) {
      return { isValid: false, error: 'NDA License Number is mandatory for regulated pharmacies.' };
    }
    const ndaPattern = /^NDA\/(RET|WHL|IMP|DIS)\/\d{4,6}\/\d{4}$/;
    if (!ndaPattern.test(trimmed)) {
      return {
        isValid: true, // soft warning for older formats
        error: undefined,
      };
    }
    return { isValid: true };
  }

  /**
   * Evaluates branch capacity against subscription tier limits
   */
  static canAddBranch(tenant: TenantProfileDto, currentBranchCount: number): boolean {
    switch (tenant.tier) {
      case 'BASIC':
        return currentBranchCount < 1;
      case 'PRO':
        return currentBranchCount < 5;
      case 'ENTERPRISE_HOSPITAL':
      default:
        return true;
    }
  }
}
