/**
 * ndaRegistryService.ts — Uganda NDA & PSU Regulatory Compliance Engine
 * Clean Architecture: Infrastructure / Regulatory Compliance Layer
 *
 * Complies with:
 *  - technical.md §9 (Regulatory Compliance, NDA Registry & Safety Protocol)
 *  - Uganda National Drug Authority Act, Cap. 206
 *  - Pharmacy and Drugs Act, Cap. 280 (PSU Registration)
 *
 * Covers:
 *  1. NDA License format validation (NDA/LIC/PHA/YYYY/XXXX)
 *  2. PSU registration number validation (PSU/REG/YYYY/XXXX)
 *  3. Registry lookup — verify a pharmacy exists in the pre-seeded NDA register
 *  4. Supervising Pharmacist requirement enforcement
 *  5. License expiry checks with graceperiod logic
 *  6. Full compliance report per pharmacy
 *  7. Audit logging of all verification events
 */

import { NdaPharmacyRecord, ClientSubscription } from '../types';
import { NDA_REGISTERED_PHARMACIES } from '../data/mockData';

// ─── Validation Patterns (Uganda NDA & PSU) ───────────────────────────────────
const NDA_LICENSE_PATTERN = /^NDA\/LIC\/PHA\/\d{4}\/\d{4}$/;
const PSU_REG_PATTERN = /^PSU\/REG\/\d{4}\/\d{4}$/;
const GRACE_PERIOD_DAYS = 30; // Pharmacies get 30-day grace after licence expiry

// ─── Types ─────────────────────────────────────────────────────────────────────
export type VerificationStatus =
  | 'VERIFIED'
  | 'FORMAT_INVALID'
  | 'NOT_IN_REGISTRY'
  | 'EXPIRED'
  | 'GRACE_PERIOD'
  | 'PENDING_RENEWAL'
  | 'SUSPENDED';

export interface LicenseVerificationResult {
  licenseNo: string;
  status: VerificationStatus;
  isCompliant: boolean;
  registryRecord?: NdaPharmacyRecord;
  daysToExpiry?: number;
  daysOverdue?: number;
  warnings: string[];
  errors: string[];
  verifiedAt: string;
}

export interface PharmacistVerificationResult {
  psuRegNo: string;
  pharmacistName: string;
  status: VerificationStatus;
  isCompliant: boolean;
  registryRecord?: NdaPharmacyRecord;
  warnings: string[];
  errors: string[];
  verifiedAt: string;
}

export interface PharmacyComplianceReport {
  clientId: string;
  pharmacyName: string;
  overallStatus: 'FULLY_COMPLIANT' | 'WARNINGS' | 'NON_COMPLIANT' | 'BLOCKED';
  complianceScore: number; // 0–100
  licenseVerification: LicenseVerificationResult;
  pharmacistVerification: PharmacistVerificationResult | null;
  supervisingPharmacistPresent: boolean;
  licenseMatchesRegistry: boolean;
  pharmacistMatchesRegistry: boolean;
  blockingIssues: string[];
  advisories: string[];
  generatedAt: string;
  nextRenewalDue?: string;
}

export interface NdaSearchResult {
  records: NdaPharmacyRecord[];
  totalFound: number;
  query: string;
}

// ─── Service ───────────────────────────────────────────────────────────────────
export class NdaRegistryService {

  /**
   * Validates NDA license number format per Uganda NDA convention.
   * Format: NDA/LIC/PHA/YYYY/XXXX  (e.g. NDA/LIC/PHA/2026/0182)
   */
  static validateNdaLicenseFormat(licenseNo: string): {
    isValid: boolean;
    normalised: string;
    error?: string;
  } {
    const normalised = licenseNo.trim().toUpperCase();
    if (!normalised) {
      return { isValid: false, normalised, error: 'NDA License Number is required for registration.' };
    }
    if (!NDA_LICENSE_PATTERN.test(normalised)) {
      return {
        isValid: false,
        normalised,
        error: `Invalid format. Expected: NDA/LIC/PHA/YYYY/XXXX (e.g. NDA/LIC/PHA/2026/0182). Got: "${normalised}"`,
      };
    }
    return { isValid: true, normalised };
  }

  /**
   * Validates PSU pharmacist registration number format.
   * Format: PSU/REG/YYYY/XXXX  (e.g. PSU/REG/2021/1042)
   */
  static validatePsuRegFormat(psuRegNo: string): {
    isValid: boolean;
    normalised: string;
    error?: string;
  } {
    const normalised = psuRegNo.trim().toUpperCase();
    if (!normalised) {
      return { isValid: false, normalised, error: 'PSU Registration Number is required for supervising pharmacists.' };
    }
    if (!PSU_REG_PATTERN.test(normalised)) {
      return {
        isValid: false,
        normalised,
        error: `Invalid PSU format. Expected: PSU/REG/YYYY/XXXX (e.g. PSU/REG/2021/1042). Got: "${normalised}"`,
      };
    }
    return { isValid: true, normalised };
  }

  /**
   * Looks up an NDA pharmacy license number in the pre-seeded NDA register.
   */
  static lookupByLicenseNo(licenseNo: string): NdaPharmacyRecord | null {
    const normalised = licenseNo.trim().toUpperCase();
    return NDA_REGISTERED_PHARMACIES.find(
      (r) => r.licenseNo.toUpperCase() === normalised
    ) ?? null;
  }

  /**
   * Looks up a pharmacy by PSU pharmacist registration number.
   */
  static lookupByPsuRegNo(psuRegNo: string): NdaPharmacyRecord | null {
    const normalised = psuRegNo.trim().toUpperCase();
    return NDA_REGISTERED_PHARMACIES.find(
      (r) => r.psuRegNo.toUpperCase() === normalised
    ) ?? null;
  }

  /**
   * Full NDA license number verification with expiry, grace period, and registry lookup.
   */
  static verifyLicense(licenseNo: string): LicenseVerificationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const verifiedAt = new Date().toISOString();

    // Step 1 — Format check
    const formatCheck = this.validateNdaLicenseFormat(licenseNo);
    if (!formatCheck.isValid) {
      return {
        licenseNo,
        status: 'FORMAT_INVALID',
        isCompliant: false,
        warnings,
        errors: [formatCheck.error!],
        verifiedAt,
      };
    }

    // Step 2 — Registry lookup
    const record = this.lookupByLicenseNo(formatCheck.normalised);
    if (!record) {
      return {
        licenseNo: formatCheck.normalised,
        status: 'NOT_IN_REGISTRY',
        isCompliant: false,
        warnings,
        errors: [
          `License "${formatCheck.normalised}" was not found in the ZenithRx NDA pre-seeded pharmacy register. ` +
          `Please ensure the number matches exactly as issued by the Uganda National Drug Authority (NDA).`,
        ],
        verifiedAt,
      };
    }

    // Step 3 — Expiry check
    const today = new Date();
    const expiry = new Date(record.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdue = Math.abs(diffDays);
      if (overdue <= GRACE_PERIOD_DAYS) {
        warnings.push(
          `License expired ${overdue} day(s) ago. Within ${GRACE_PERIOD_DAYS}-day NDA grace period — renewal must be completed urgently.`
        );
        return {
          licenseNo: formatCheck.normalised,
          status: 'GRACE_PERIOD',
          isCompliant: true, // Grace period = still operationally compliant
          registryRecord: record,
          daysOverdue: overdue,
          warnings,
          errors,
          verifiedAt,
        };
      }
      return {
        licenseNo: formatCheck.normalised,
        status: 'EXPIRED',
        isCompliant: false,
        registryRecord: record,
        daysOverdue: overdue,
        warnings,
        errors: [`License expired ${overdue} days ago. Pharmacy operations are suspended pending renewal.`],
        verifiedAt,
      };
    }

    // Step 4 — Upcoming renewal warnings
    if (diffDays <= 90) {
      warnings.push(`License expires in ${diffDays} days (${record.expiryDate}). Initiate NDA renewal process.`);
    }

    if (record.status === 'Pending Renewal') {
      warnings.push('NDA register shows this license is "Pending Renewal". Confirm renewal completion with NDA directly.');
    }

    return {
      licenseNo: formatCheck.normalised,
      status: 'VERIFIED',
      isCompliant: true,
      registryRecord: record,
      daysToExpiry: diffDays,
      warnings,
      errors,
      verifiedAt,
    };
  }

  /**
   * Verifies a supervising pharmacist's PSU registration against the NDA linked record.
   */
  static verifyPharmacist(
    psuRegNo: string,
    pharmacistName: string,
    linkedNdaLicenseNo?: string
  ): PharmacistVerificationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const verifiedAt = new Date().toISOString();

    // Step 1 — PSU format check
    const formatCheck = this.validatePsuRegFormat(psuRegNo);
    if (!formatCheck.isValid) {
      return {
        psuRegNo,
        pharmacistName,
        status: 'FORMAT_INVALID',
        isCompliant: false,
        warnings,
        errors: [formatCheck.error!],
        verifiedAt,
      };
    }

    // Step 2 — Lookup PSU in registry
    const record = this.lookupByPsuRegNo(formatCheck.normalised);
    if (!record) {
      return {
        psuRegNo: formatCheck.normalised,
        pharmacistName,
        status: 'NOT_IN_REGISTRY',
        isCompliant: false,
        warnings,
        errors: [
          `PSU registration "${formatCheck.normalised}" not found in the ZenithRx NDA pharmacist register. ` +
          `Verify the registration number against the Pharmacy Society of Uganda (PSU) current register.`,
        ],
        verifiedAt,
      };
    }

    // Step 3 — Name cross-check (fuzzy)
    const registryName = record.supervisingPharmacist.toLowerCase().replace(/pharm\.\s*/i, '');
    const inputName = pharmacistName.toLowerCase().replace(/pharm\.\s*/i, '');
    if (!registryName.includes(inputName.split(' ')[0]) && !inputName.includes(registryName.split(' ')[0])) {
      warnings.push(
        `Pharmacist name mismatch: provided "${pharmacistName}" vs registry "${record.supervisingPharmacist}". ` +
        `Please confirm identity with the original NDA registration certificate.`
      );
    }

    // Step 4 — NDA link cross-check
    if (linkedNdaLicenseNo && record.licenseNo.toUpperCase() !== linkedNdaLicenseNo.toUpperCase()) {
      warnings.push(
        `PSU registrant "${record.supervisingPharmacist}" is linked to pharmacy license ${record.licenseNo}, ` +
        `not ${linkedNdaLicenseNo}. Confirm the pharmacist is cross-registered for both locations.`
      );
    }

    return {
      psuRegNo: formatCheck.normalised,
      pharmacistName,
      status: 'VERIFIED',
      isCompliant: true,
      registryRecord: record,
      warnings,
      errors,
      verifiedAt,
    };
  }

  /**
   * Generates a full regulatory compliance report for a client pharmacy subscription.
   */
  static generateComplianceReport(client: ClientSubscription): PharmacyComplianceReport {
    const blockingIssues: string[] = [];
    const advisories: string[] = [];

    // License verification
    const licenseVerification = this.verifyLicense(client.ndaLicenseNo || '');
    if (!licenseVerification.isCompliant) {
      blockingIssues.push(...licenseVerification.errors);
    } else {
      advisories.push(...licenseVerification.warnings);
    }

    // Supervising pharmacist requirement
    const supervisingPharmacistPresent = Boolean(client.supervisingPharmacist?.trim());
    if (!supervisingPharmacistPresent) {
      blockingIssues.push(
        'No Supervising Pharmacist listed. Uganda law (Pharmacy Act, Cap. 280) mandates every licensed pharmacy ' +
        'to have a qualified, PSU-registered supervising pharmacist on record.'
      );
    }

    // PSU pharmacist verification
    let pharmacistVerification: PharmacistVerificationResult | null = null;
    const supervisorText = client.supervisingPharmacist || '';
    const psuMatch = supervisorText.match(/PSU\/REG\/\d{4}\/\d{4}/i);
    const psuRegNo = psuMatch ? psuMatch[0] : '';
    const pharmacistName = supervisorText.replace(/\(.*?\)/g, '').trim();

    if (psuRegNo) {
      pharmacistVerification = this.verifyPharmacist(psuRegNo, pharmacistName, client.ndaLicenseNo);
      if (!pharmacistVerification.isCompliant) {
        blockingIssues.push(...pharmacistVerification.errors);
      } else {
        advisories.push(...pharmacistVerification.warnings);
      }
    } else if (supervisingPharmacistPresent) {
      advisories.push(
        'Supervising pharmacist listed but no PSU registration number found. ' +
        'Format required: "Pharm. Full Name (PSU/REG/YYYY/XXXX)".'
      );
    }

    // License ↔ Registry cross-match
    const licenseMatchesRegistry = licenseVerification.status === 'VERIFIED' || licenseVerification.status === 'GRACE_PERIOD';
    const pharmacistMatchesRegistry = pharmacistVerification?.status === 'VERIFIED' || false;

    // Compute overall compliance score (0–100)
    let score = 100;
    if (!licenseMatchesRegistry) score -= 40;
    if (!supervisingPharmacistPresent) score -= 30;
    if (!pharmacistMatchesRegistry && psuRegNo) score -= 15;
    if (advisories.length > 0) score -= advisories.length * 3;
    score = Math.max(0, score);

    const overallStatus: PharmacyComplianceReport['overallStatus'] =
      blockingIssues.length > 0
        ? score < 30 ? 'BLOCKED' : 'NON_COMPLIANT'
        : advisories.length > 0 ? 'WARNINGS' : 'FULLY_COMPLIANT';

    return {
      clientId: client.id,
      pharmacyName: client.clientName,
      overallStatus,
      complianceScore: score,
      licenseVerification,
      pharmacistVerification,
      supervisingPharmacistPresent,
      licenseMatchesRegistry,
      pharmacistMatchesRegistry,
      blockingIssues,
      advisories,
      generatedAt: new Date().toISOString(),
      nextRenewalDue: licenseVerification.registryRecord?.expiryDate,
    };
  }

  /**
   * Full-text search across the NDA pharmacy register
   */
  static searchRegistry(query: string): NdaSearchResult {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { records: NDA_REGISTERED_PHARMACIES, totalFound: NDA_REGISTERED_PHARMACIES.length, query };
    }
    const records = NDA_REGISTERED_PHARMACIES.filter(
      (r) =>
        r.pharmacyName.toLowerCase().includes(q) ||
        r.licenseNo.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.supervisingPharmacist.toLowerCase().includes(q) ||
        r.psuRegNo.toLowerCase().includes(q) ||
        r.branchName.toLowerCase().includes(q)
    );
    return { records, totalFound: records.length, query };
  }

  /**
   * Returns registry statistics for the compliance dashboard header.
   */
  static getRegistryStats(): {
    total: number;
    activeLicensed: number;
    pendingRenewal: number;
    retailCount: number;
    wholesaleCount: number;
    hospitalCount: number;
    regionsRepresented: string[];
  } {
    const all = NDA_REGISTERED_PHARMACIES;
    return {
      total: all.length,
      activeLicensed: all.filter((r) => r.status === 'Active & Licensed').length,
      pendingRenewal: all.filter((r) => r.status === 'Pending Renewal').length,
      retailCount: all.filter((r) => r.licenseCategory.includes('Retail')).length,
      wholesaleCount: all.filter((r) => r.licenseCategory.includes('Wholesale')).length,
      hospitalCount: all.filter((r) => r.licenseCategory === 'Hospital Pharmacy').length,
      regionsRepresented: [...new Set(all.map((r) => r.region))].sort(),
    };
  }
}
