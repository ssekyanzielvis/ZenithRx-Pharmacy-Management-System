/**
 * Bounded Context: Tenant & Branch Administration
 * Complies with technical.md §11.6 & §11.17
 */

export interface TenantProfileDto {
  id: string;
  clientName: string;
  ndaLicenseNo: string;
  supervisingPharmacist: string;
  branchesCount: number;
  contactEmail: string;
  contactPhone: string;
  tier: 'BASIC' | 'PRO' | 'ENTERPRISE_HOSPITAL';
  subscriptionStatus: 'ACTIVE' | 'PENDING_RENEWAL' | 'SUSPENDED';
  validUntil: string;
}

export interface BranchDto {
  id: string;
  tenantId: string;
  branchName: string;
  location: string;
  ndaSubLicense: string;
  leadPharmacistName: string;
  isMainBranch: boolean;
  activeStatus: 'ACTIVE' | 'INACTIVE';
}
