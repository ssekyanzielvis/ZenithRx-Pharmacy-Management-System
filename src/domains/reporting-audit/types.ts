/**
 * Bounded Context: Reporting & Audit
 * Complies with technical.md §11.6 & §11.20
 */

export interface ComplianceAuditReportDto {
  reportId: string;
  tenantId: string;
  generatedAt: string;
  generatedBy: string;
  ndaLicenseNo: string;
  totalDispensedPrescriptions: number;
  controlledSubstancesDispensedCount: number;
  overriddenSafetyChecksCount: number;
  tamperEvidentSha256Checksum: string;
}
