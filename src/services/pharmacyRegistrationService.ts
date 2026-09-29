/**
 * pharmacyRegistrationService.ts — Certified Pharmacy Entity Registration & Admin Verification
 * Handles registration of certified pharmacy entities (not individuals),
 * NDA license verification, lead pharmacist credentials, and administrator approval workflows.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TierName, ClientSubscription } from '../types';
import { logAuditEvent } from '../repositories/auditRepository';

export type PharmacyApprovalStatus =
  | 'Approved'
  | 'Pending Admin Verification'
  | 'Under Regulatory Review'
  | 'Rejected'
  | 'Suspended';

export type PharmacyPremiseCategory =
  | 'Community Retail Pharmacy'
  | 'Hospital Pharmacy'
  | 'Wholesale & Distribution'
  | 'Specialist Clinical Pharmacy';

export interface CertifiedPharmacyEntity {
  id: string;
  pharmacyName: string;
  ndaLicenseNo: string;
  premiseCategory: PharmacyPremiseCategory;
  district: string;
  physicalAddress: string;
  businessTin: string;
  supervisingPharmacistName: string;
  psuRegNo: string;
  contactEmail: string;
  contactPhone: string;
  packageTier: TierName;
  billingCycle: 'monthly' | 'yearly';
  approvalStatus: PharmacyApprovalStatus;
  ndaVerified: boolean;
  ndaVerificationDate?: string;
  verifiedByAdmin?: string;
  adminReviewNotes?: string;
  registeredAt: string;
  documentsAttached: {
    ndaOperatingLicense: boolean;
    psuPracticingCertificate: boolean;
    premisesSuitabilityCert: boolean;
    taxComplianceCertificate: boolean;
  };
}

const STORAGE_KEY_REGISTRATIONS = 'zenithrx_certified_pharmacies_v1';

export const INITIAL_CERTIFIED_PHARMACIES: CertifiedPharmacyEntity[] = [
  {
    id: 'client-001',
    pharmacyName: 'Kampala City Pharmacy',
    ndaLicenseNo: 'NDA/PREM/2026/0411',
    premiseCategory: 'Community Retail Pharmacy',
    district: 'Kampala',
    physicalAddress: 'Plot 14, Kampala Road, City Centre, Kampala',
    businessTin: '1002349182',
    supervisingPharmacistName: 'Dr. Arthur Ssenabulya',
    psuRegNo: 'PSU/REG/2020/0182',
    contactEmail: 'info@kampalacitypharmacy.ug',
    contactPhone: '+256 772 345678',
    packageTier: 'Enterprise',
    billingCycle: 'yearly',
    approvalStatus: 'Approved',
    ndaVerified: true,
    ndaVerificationDate: '2026-01-15T09:00:00Z',
    verifiedByAdmin: 'Arthur Ssenabulya (SysAdmin)',
    adminReviewNotes: 'NDA premises license verified with National Drug Authority registry.',
    registeredAt: '2026-01-10T08:00:00Z',
    documentsAttached: {
      ndaOperatingLicense: true,
      psuPracticingCertificate: true,
      premisesSuitabilityCert: true,
      taxComplianceCertificate: true,
    },
  },
  {
    id: 'client-002',
    pharmacyName: 'Ecopharm Nakasero Branch',
    ndaLicenseNo: 'NDA/PREM/2026/0892',
    premiseCategory: 'Community Retail Pharmacy',
    district: 'Kampala',
    physicalAddress: 'Plot 28, Nakasero Road, Kampala',
    businessTin: '1004819203',
    supervisingPharmacistName: 'Dr. Brenda Namaganda',
    psuRegNo: 'PSU/REG/2022/0491',
    contactEmail: 'nakasero@ecopharm.ug',
    contactPhone: '+256 701 234567',
    packageTier: 'Professional',
    billingCycle: 'monthly',
    approvalStatus: 'Approved',
    ndaVerified: true,
    ndaVerificationDate: '2026-02-01T10:30:00Z',
    verifiedByAdmin: 'Platform Super Admin',
    adminReviewNotes: 'PSU practicing certificate and premises suitability inspected.',
    registeredAt: '2026-01-28T11:20:00Z',
    documentsAttached: {
      ndaOperatingLicense: true,
      psuPracticingCertificate: true,
      premisesSuitabilityCert: true,
      taxComplianceCertificate: true,
    },
  },
  {
    id: 'client-003',
    pharmacyName: 'Victoria Care Pharmacy Jinja',
    ndaLicenseNo: 'NDA/PREM/2026/1209',
    premiseCategory: 'Community Retail Pharmacy',
    district: 'Jinja',
    physicalAddress: 'Plot 7, Main Street, Jinja City',
    businessTin: '1009182374',
    supervisingPharmacistName: 'Dr. Patrick Otim',
    psuRegNo: 'PSU/REG/2024/0782',
    contactEmail: 'jinja@victoriacare.ug',
    contactPhone: '+256 788 123456',
    packageTier: 'Starter',
    billingCycle: 'monthly',
    approvalStatus: 'Pending Admin Verification',
    ndaVerified: false,
    adminReviewNotes: 'New pharmacy entity registration submitted. Awaiting NDA license verification by Platform Admin.',
    registeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    documentsAttached: {
      ndaOperatingLicense: true,
      psuPracticingCertificate: true,
      premisesSuitabilityCert: false,
      taxComplianceCertificate: true,
    },
  },
];

export function getStoredCertifiedPharmacies(): CertifiedPharmacyEntity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTRATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading certified pharmacies from storage:', e);
  }
  saveStoredCertifiedPharmacies(INITIAL_CERTIFIED_PHARMACIES);
  return INITIAL_CERTIFIED_PHARMACIES;
}

export function saveStoredCertifiedPharmacies(items: CertifiedPharmacyEntity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('zenithrx_pharmacy_registry_updated', { detail: items }));
  } catch (e) {
    console.warn('Error saving certified pharmacies to storage:', e);
  }
}

export interface PharmacyRegistrationInput {
  pharmacyName: string;
  ndaLicenseNo: string;
  premiseCategory: PharmacyPremiseCategory;
  district: string;
  physicalAddress: string;
  businessTin: string;
  supervisingPharmacistName: string;
  psuRegNo: string;
  contactEmail: string;
  contactPhone: string;
  packageTier: TierName;
  billingCycle: 'monthly' | 'yearly';
  documentsAttached?: {
    ndaOperatingLicense: boolean;
    psuPracticingCertificate: boolean;
    premisesSuitabilityCert: boolean;
    taxComplianceCertificate: boolean;
  };
}

export const pharmacyRegistrationService = {
  /**
   * Get all registered pharmacy entities.
   */
  getAllPharmacies(): CertifiedPharmacyEntity[] {
    return getStoredCertifiedPharmacies();
  },

  /**
   * Get pending pharmacy applications requiring Super Admin approval.
   */
  getPendingApprovalPharmacies(): CertifiedPharmacyEntity[] {
    const all = getStoredCertifiedPharmacies();
    return all.filter(
      (p) =>
        p.approvalStatus === 'Pending Admin Verification' ||
        p.approvalStatus === 'Under Regulatory Review'
    );
  },

  /**
   * Register a new Certified Pharmacy entity into the system.
   */
  async registerPharmacy(input: PharmacyRegistrationInput): Promise<CertifiedPharmacyEntity> {
    const all = getStoredCertifiedPharmacies();
    const newId = `pharm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newEntity: CertifiedPharmacyEntity = {
      id: newId,
      pharmacyName: input.pharmacyName.trim(),
      ndaLicenseNo: input.ndaLicenseNo.trim().toUpperCase(),
      premiseCategory: input.premiseCategory,
      district: input.district.trim(),
      physicalAddress: input.physicalAddress.trim(),
      businessTin: input.businessTin.trim(),
      supervisingPharmacistName: input.supervisingPharmacistName.trim(),
      psuRegNo: input.psuRegNo.trim().toUpperCase(),
      contactEmail: input.contactEmail.trim().toLowerCase(),
      contactPhone: input.contactPhone.trim(),
      packageTier: input.packageTier,
      billingCycle: input.billingCycle,
      approvalStatus: 'Pending Admin Verification',
      ndaVerified: false,
      registeredAt: new Date().toISOString(),
      adminReviewNotes: 'Registration submitted. Awaiting regulatory review & approval by Platform SysAdmin.',
      documentsAttached: input.documentsAttached || {
        ndaOperatingLicense: true,
        psuPracticingCertificate: true,
        premisesSuitabilityCert: true,
        taxComplianceCertificate: true,
      },
    };

    const updated = [newEntity, ...all];
    saveStoredCertifiedPharmacies(updated);

    // If Supabase is connected, insert into Supabase tenants table
    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase.from('tenants') as any).insert([
          {
            id: newId,
            name: newEntity.pharmacyName,
            slug: newEntity.pharmacyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            location: `${newEntity.physicalAddress}, ${newEntity.district}`,
            contact_phone: newEntity.contactPhone,
            contact_email: newEntity.contactEmail,
            package_tier: newEntity.packageTier,
            nda_license_no: newEntity.ndaLicenseNo,
            nda_verified: false,
            supervising_pharmacist: newEntity.supervisingPharmacistName,
            billing_status: 'pending_renewal',
          },
        ]);
      } catch (err) {
        console.warn('[pharmacyRegistrationService] Supabase insert note:', err);
      }
    }

    void logAuditEvent({
      tenantId: newId,
      performedBy: newEntity.contactEmail,
      action: 'create',
      entityType: 'pharmacy_entity_registration',
      entityId: newId,
      newValue: {
        pharmacyName: newEntity.pharmacyName,
        ndaLicenseNo: newEntity.ndaLicenseNo,
        psuRegNo: newEntity.psuRegNo,
        tier: newEntity.packageTier,
      },
    });

    return newEntity;
  },

  /**
   * Super Administrator approves a registered pharmacy entity.
   */
  async approvePharmacy(
    pharmacyId: string,
    adminName: string,
    notes?: string
  ): Promise<{ success: boolean; entity?: CertifiedPharmacyEntity }> {
    const all = getStoredCertifiedPharmacies();
    const target = all.find((p) => p.id === pharmacyId);
    if (!target) return { success: false };

    target.approvalStatus = 'Approved';
    target.ndaVerified = true;
    target.ndaVerificationDate = new Date().toISOString();
    target.verifiedByAdmin = adminName;
    target.adminReviewNotes = notes || 'Approved and certified by Platform System Administrator.';

    saveStoredCertifiedPharmacies(all);

    // Sync with Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase.from('tenants') as any)
          .update({
            nda_verified: true,
            billing_status: 'active',
          })
          .eq('id', pharmacyId);
      } catch (err) {
        console.warn('[pharmacyRegistrationService] Supabase approve update note:', err);
      }
    }

    void logAuditEvent({
      tenantId: pharmacyId,
      performedBy: adminName,
      action: 'override',
      entityType: 'pharmacy_admin_approval',
      entityId: pharmacyId,
      newValue: {
        status: 'Approved',
        adminName,
        verifiedDate: target.ndaVerificationDate,
      },
    });

    return { success: true, entity: target };
  },

  /**
   * Super Administrator rejects a pharmacy application.
   */
  async rejectPharmacy(
    pharmacyId: string,
    adminName: string,
    reason: string
  ): Promise<{ success: boolean; entity?: CertifiedPharmacyEntity }> {
    const all = getStoredCertifiedPharmacies();
    const target = all.find((p) => p.id === pharmacyId);
    if (!target) return { success: false };

    target.approvalStatus = 'Rejected';
    target.ndaVerified = false;
    target.verifiedByAdmin = adminName;
    target.adminReviewNotes = reason || 'Rejected due to incomplete NDA regulatory documentation.';

    saveStoredCertifiedPharmacies(all);
    return { success: true, entity: target };
  },

  /**
   * Convert CertifiedPharmacyEntity to ClientSubscription format for PMS state.
   */
  toClientSubscription(entity: CertifiedPharmacyEntity): ClientSubscription {
    const maxUsersMap: Record<TierName, number> = {
      Starter: 2,
      Professional: 5,
      Enterprise: 20,
      'Custom Tailored': 50,
    };

    const monthlyRateMap: Record<TierName, number> = {
      Starter: 40000,
      Professional: 72000,
      Enterprise: 150000,
      'Custom Tailored': 300000,
    };

    return {
      id: entity.id,
      clientName: entity.pharmacyName,
      location: `${entity.physicalAddress}, ${entity.district}`,
      contactPhone: entity.contactPhone,
      contactEmail: entity.contactEmail,
      packageTier: entity.packageTier,
      customMaxUsers: maxUsersMap[entity.packageTier] || 5,
      monthlyUgxRate: monthlyRateMap[entity.packageTier] || 72000,
      billingStatus: entity.approvalStatus === 'Approved' ? 'Active' : 'Pending Renewal',
      nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      ndaLicenseNo: entity.ndaLicenseNo,
      ndaVerified: entity.ndaVerified,
      supervisingPharmacist: entity.supervisingPharmacistName,
      allowedFeatures: {
        basicInventory: true,
        batchTracking: entity.packageTier !== 'Starter',
        autoReordering: entity.packageTier !== 'Starter',
        expiryAlerts: entity.packageTier !== 'Starter',
        posBilling: true,
        salesAnalytics: true,
        insuranceClaims: entity.packageTier === 'Enterprise' || entity.packageTier === 'Custom Tailored',
        aiCounseling: entity.packageTier === 'Enterprise' || entity.packageTier === 'Custom Tailored',
        multiLocation: entity.packageTier === 'Enterprise' || entity.packageTier === 'Custom Tailored',
        apiAccess: entity.packageTier === 'Enterprise' || entity.packageTier === 'Custom Tailored',
      },
    };
  },
};
