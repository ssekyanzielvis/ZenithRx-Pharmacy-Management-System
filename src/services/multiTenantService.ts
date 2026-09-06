/**
 * multiTenantService.ts — Multi-Tenant SaaS Architecture & User Rights Engine (§8)
 * Clean Architecture: Application / Tenancy Layer
 *
 * Complies with technical.md §8  (Multi-Tenant SaaS Architecture & User Rights Matrix)
 *                    technical.md §11.22.3 (Admin & Collaborator Role Matrix)
 *
 * Responsibilities:
 *  1. Tenant isolation — every query must be scoped to a tenant_id
 *  2. Package tier enforcement — feature gates per Starter / Professional / Enterprise / Custom
 *  3. User rights matrix — 7 roles × 8 permissions, intersected with tier capabilities
 *  4. User slot enforcement — max users per tier, with overflow guard
 *  5. Branch / multi-location scoping
 *  6. Tenant health snapshot for admin control plane
 */

import {
  ClientSubscription,
  PharmacyUserAccount,
  TierName,
  UserRoleRank,
  UserAccessRights,
} from '../types';
import { INITIAL_CLIENT_SUBSCRIPTIONS } from '../data/mockData';
import { getDefaultRightsForRole } from '../lib/rolePermissions';
import { getPackageTierConfig } from '../lib/packageTierRules';

// ─── Tier Feature Catalogue ────────────────────────────────────────────────────
export interface TierFeatureGate {
  tier: TierName;
  maxUsers: number;                // -1 = unlimited
  maxBranches: number;             // -1 = unlimited
  monthlyUgx: number;
  annualUgxDiscount: number;       // UGX off the annual rate
  features: TierFeatureDetail[];
  apiAccess: boolean;
  slaHours: number;                // Support SLA response time in hours
  dataRetentionYears: number;
  exportFormats: ('CSV' | 'PDF' | 'ZIP')[];
  aiModels: ('Gemini Clinical OCR' | 'Drug Interaction Engine' | 'Refill Cadence AI')[];
  insuranceIntegration: boolean;
  multiLocation: boolean;
  customBranding: boolean;
  dedicatedAccountManager: boolean;
}

export interface TierFeatureDetail {
  feature: string;
  included: boolean;
  limit?: string;
}

// ─── Canonical Tier Definitions (source of truth) ─────────────────────────────
export const TIER_FEATURE_GATES: Record<TierName, TierFeatureGate> = {
  Starter: {
    tier: 'Starter',
    maxUsers: 2,
    maxBranches: 1,
    monthlyUgx: 40_000,
    annualUgxDiscount: 40_000,
    apiAccess: false,
    slaHours: 72,
    dataRetentionYears: 1,
    exportFormats: ['CSV'],
    aiModels: [],
    insuranceIntegration: false,
    multiLocation: false,
    customBranding: false,
    dedicatedAccountManager: false,
    features: [
      { feature: 'POS & Cash Register',             included: true },
      { feature: 'Basic Stock Inventory',            included: true },
      { feature: 'Barcode Scanner Support',          included: true },
      { feature: 'Standard Sales Reports',           included: true },
      { feature: 'NDA Audit Log',                    included: true },
      { feature: 'FEFO Batch Tracking',              included: false },
      { feature: 'Auto-Reorder Engine',              included: false },
      { feature: 'Expiry Alerts',                    included: false },
      { feature: 'Insurance & Claims',               included: false },
      { feature: 'Gemini AI Clinical Counseling',    included: false },
      { feature: 'WhatsApp Refill Reminders',        included: false },
      { feature: 'Multi-Branch Analytics',           included: false },
      { feature: 'API Access',                       included: false },
    ],
  },

  Professional: {
    tier: 'Professional',
    maxUsers: 5,
    maxBranches: 1,
    monthlyUgx: 72_000,
    annualUgxDiscount: 72_000,
    apiAccess: false,
    slaHours: 24,
    dataRetentionYears: 3,
    exportFormats: ['CSV', 'PDF'],
    aiModels: [],
    insuranceIntegration: false,
    multiLocation: false,
    customBranding: false,
    dedicatedAccountManager: false,
    features: [
      { feature: 'POS & Cash Register',             included: true },
      { feature: 'Basic Stock Inventory',            included: true },
      { feature: 'Barcode Scanner Support',          included: true },
      { feature: 'Advanced Sales Analytics',         included: true },
      { feature: 'NDA Audit Log',                    included: true },
      { feature: 'FEFO Batch Tracking',              included: true },
      { feature: 'Auto-Reorder Engine',              included: true },
      { feature: 'Expiry Alerts',                    included: true },
      { feature: 'Insurance & Claims',               included: false },
      { feature: 'Gemini AI Clinical Counseling',    included: false },
      { feature: 'WhatsApp Refill Reminders',        included: false },
      { feature: 'Multi-Branch Analytics',           included: false },
      { feature: 'API Access',                       included: false },
    ],
  },

  Enterprise: {
    tier: 'Enterprise',
    maxUsers: -1,  // Unlimited
    maxBranches: -1,
    monthlyUgx: 104_000,
    annualUgxDiscount: 104_000,
    apiAccess: true,
    slaHours: 4,
    dataRetentionYears: 7,
    exportFormats: ['CSV', 'PDF', 'ZIP'],
    aiModels: ['Gemini Clinical OCR', 'Drug Interaction Engine', 'Refill Cadence AI'],
    insuranceIntegration: true,
    multiLocation: true,
    customBranding: true,
    dedicatedAccountManager: true,
    features: [
      { feature: 'POS & Cash Register',             included: true },
      { feature: 'Basic Stock Inventory',            included: true },
      { feature: 'Barcode Scanner Support',          included: true },
      { feature: 'Advanced Sales Analytics',         included: true },
      { feature: 'NDA Audit Log',                    included: true },
      { feature: 'FEFO Batch Tracking',              included: true },
      { feature: 'Auto-Reorder Engine',              included: true },
      { feature: 'Expiry Alerts',                    included: true },
      { feature: 'Insurance & Claims',               included: true },
      { feature: 'Gemini AI Clinical Counseling',    included: true },
      { feature: 'WhatsApp Refill Reminders',        included: true },
      { feature: 'Multi-Branch Analytics',           included: true },
      { feature: 'API Access',                       included: true },
    ],
  },

  'Custom Tailored': {
    tier: 'Custom Tailored',
    maxUsers: -1,
    maxBranches: -1,
    monthlyUgx: 0,  // Negotiated
    annualUgxDiscount: 0,
    apiAccess: true,
    slaHours: 1,
    dataRetentionYears: 10,
    exportFormats: ['CSV', 'PDF', 'ZIP'],
    aiModels: ['Gemini Clinical OCR', 'Drug Interaction Engine', 'Refill Cadence AI'],
    insuranceIntegration: true,
    multiLocation: true,
    customBranding: true,
    dedicatedAccountManager: true,
    features: [
      { feature: 'Everything in Enterprise',         included: true },
      { feature: 'Custom Integrations & API',        included: true },
      { feature: 'White-Label Branding',             included: true },
      { feature: 'Dedicated Infrastructure',         included: true },
      { feature: 'On-Site Training & Onboarding',    included: true },
      { feature: 'Regulatory Compliance Package',    included: true },
      { feature: '1-Hour SLA + 24/7 Hotline',        included: true },
      { feature: '10-Year Data Retention',           included: true },
    ],
  },
};

// ─── User Rights Matrix ────────────────────────────────────────────────────────
export interface UserRightsMatrixRow {
  role: UserRoleRank;
  rights: UserAccessRights;
  allowedTiers: TierName[];       // Minimum tier required for this role to be provisioned
  maxPerPharmacy: number;          // -1 = unlimited
  requiresPsuReg: boolean;
  requiresNdaLink: boolean;
  badgeColor: string;
  description: string;
}

export const USER_RIGHTS_MATRIX: UserRightsMatrixRow[] = [
  {
    role: 'Supervising Pharmacist',
    rights: getDefaultRightsForRole('Supervising Pharmacist'),
    allowedTiers: ['Starter', 'Professional', 'Enterprise', 'Custom Tailored'],
    maxPerPharmacy: 1,
    requiresPsuReg: true,
    requiresNdaLink: true,
    badgeColor: 'bg-purple-100 text-purple-900 border border-purple-300',
    description: 'Full access. Legally required. PSU-registered. Linked to NDA pharmacy license.',
  },
  {
    role: 'Assistant Pharmacist',
    rights: getDefaultRightsForRole('Assistant Pharmacist'),
    allowedTiers: ['Professional', 'Enterprise', 'Custom Tailored'],
    maxPerPharmacy: -1,
    requiresPsuReg: true,
    requiresNdaLink: false,
    badgeColor: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
    description: 'POS, inventory, prescriptions and insurance. Cannot manage staff or approve reorders.',
  },
  {
    role: 'Pharmacy Technician',
    rights: getDefaultRightsForRole('Pharmacy Technician'),
    allowedTiers: ['Professional', 'Enterprise', 'Custom Tailored'],
    maxPerPharmacy: -1,
    requiresPsuReg: false,
    requiresNdaLink: false,
    badgeColor: 'bg-sky-100 text-sky-900 border border-sky-300',
    description: 'POS, inventory management and prescription review. No admin or reporting access.',
  },
  {
    role: 'POS Cashier / Dispenser',
    rights: getDefaultRightsForRole('POS Cashier / Dispenser'),
    allowedTiers: ['Starter', 'Professional', 'Enterprise', 'Custom Tailored'],
    maxPerPharmacy: -1,
    requiresPsuReg: false,
    requiresNdaLink: false,
    badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    description: 'Retail checkout and insurance co-pay only. Restricted inventory access.',
  },
  {
    role: 'Store & Inventory Manager',
    rights: getDefaultRightsForRole('Store & Inventory Manager'),
    allowedTiers: ['Professional', 'Enterprise', 'Custom Tailored'],
    maxPerPharmacy: 1,
    requiresPsuReg: false,
    requiresNdaLink: false,
    badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
    description: 'Full inventory control and reorder approvals. No POS or prescription access.',
  },
  {
    role: 'Finance & Claims Officer',
    rights: getDefaultRightsForRole('Finance & Claims Officer'),
    allowedTiers: ['Enterprise', 'Custom Tailored'],
    maxPerPharmacy: 1,
    requiresPsuReg: false,
    requiresNdaLink: false,
    badgeColor: 'bg-teal-100 text-teal-900 border border-teal-300',
    description: 'Insurance claims, reconciliation and reports. Enterprise tier minimum.',
  },
  {
    role: 'Intern Pharmacist',
    rights: getDefaultRightsForRole('Intern Pharmacist'),
    allowedTiers: ['Professional', 'Enterprise', 'Custom Tailored'],
    maxPerPharmacy: 3,
    requiresPsuReg: false,
    requiresNdaLink: false,
    badgeColor: 'bg-slate-100 text-slate-800 border border-slate-300',
    description: 'Prescription review and AI assistant only. No financial, reporting or admin access.',
  },
];

// ─── Tenant Service ────────────────────────────────────────────────────────────
export interface TenantHealthSnapshot {
  tenantId: string;
  tenantName: string;
  tier: TierName;
  billingStatus: ClientSubscription['billingStatus'];
  userCount: number;
  userSlotUsedPct: number;      // 0–100
  maxUsers: number;
  isUserSlotFull: boolean;
  activeFeatureCount: number;
  blockedFeatureCount: number;
  monthlyUgxRate: number;
  nextBillingDate: string;
  ndaVerified: boolean;
  supervisingPharmacistPresent: boolean;
}

export interface FeatureAccessResult {
  allowed: boolean;
  reason: string;
  upgradeRequired?: TierName;
}

export class MultiTenantService {
  /**
   * Check if a tenant's subscription allows access to a specific feature.
   */
  static checkFeatureAccess(
    client: ClientSubscription,
    feature: keyof ClientSubscription['allowedFeatures']
  ): FeatureAccessResult {
    if (client.allowedFeatures[feature]) {
      return { allowed: true, reason: 'Feature included in current subscription tier.' };
    }

    // Determine which tier first unlocks this feature
    const tierOrder: TierName[] = ['Starter', 'Professional', 'Enterprise', 'Custom Tailored'];
    const upgradeRequired = tierOrder.find((tier) => {
      const config = getPackageTierConfig(tier);
      return config.allowedFeatures[feature];
    });

    return {
      allowed: false,
      reason: `Feature "${feature}" is not included in the ${client.packageTier} tier.`,
      upgradeRequired: upgradeRequired,
    };
  }

  /**
   * Check if a new user role is provisionable for a given tenant.
   * Enforces: user slot limits, tier role restrictions, max-per-pharmacy.
   */
  static checkUserProvisionability(
    client: ClientSubscription,
    role: UserRoleRank,
    existingUsers: PharmacyUserAccount[]
  ): { allowed: boolean; reason: string } {
    const gate = TIER_FEATURE_GATES[client.packageTier];
    const matrixRow = USER_RIGHTS_MATRIX.find((r) => r.role === role);

    if (!matrixRow) {
      return { allowed: false, reason: `Unknown role: ${role}` };
    }

    // 1. Tier eligibility
    if (!matrixRow.allowedTiers.includes(client.packageTier)) {
      return {
        allowed: false,
        reason: `Role "${role}" requires ${matrixRow.allowedTiers[0]} tier or higher. Current tier: ${client.packageTier}.`,
      };
    }

    // 2. User slot capacity
    const activeUsers = existingUsers.filter((u) => u.status !== 'Suspended').length;
    if (gate.maxUsers !== -1 && activeUsers >= gate.maxUsers) {
      return {
        allowed: false,
        reason: `User slot limit reached (${activeUsers}/${gate.maxUsers} for ${client.packageTier} tier). Upgrade to add more staff.`,
      };
    }

    // 3. Max per pharmacy
    if (matrixRow.maxPerPharmacy !== -1) {
      const existing = existingUsers.filter((u) => u.rankRole === role).length;
      if (existing >= matrixRow.maxPerPharmacy) {
        return {
          allowed: false,
          reason: `Only ${matrixRow.maxPerPharmacy} "${role}" account(s) allowed per pharmacy. Current: ${existing}.`,
        };
      }
    }

    return { allowed: true, reason: `Role "${role}" can be provisioned on ${client.packageTier} tier.` };
  }

  /**
   * Computes effective access rights for a user, intersecting their role
   * permissions with the tenant's tier feature allowances.
   */
  static computeEffectiveRights(
    client: ClientSubscription,
    role: UserRoleRank
  ): UserAccessRights {
    const roleRights = getDefaultRightsForRole(role);
    const features = client.allowedFeatures;

    return {
      canAccessPOS:           roleRights.canAccessPOS && features.posBilling,
      canManageInventory:     roleRights.canManageInventory && features.basicInventory,
      canProcessPrescriptions: roleRights.canProcessPrescriptions,
      canApproveReorders:     roleRights.canApproveReorders && features.autoReordering,
      canViewReports:         roleRights.canViewReports && features.salesAnalytics,
      canSubmitInsurance:     roleRights.canSubmitInsurance && features.insuranceClaims,
      canUseAiAssistant:      roleRights.canUseAiAssistant && features.aiCounseling,
      canManageStaffAccounts: roleRights.canManageStaffAccounts,
    };
  }

  /**
   * Generates a health snapshot for a tenant — used by admin dashboard.
   */
  static getTenantHealthSnapshot(client: ClientSubscription): TenantHealthSnapshot {
    const gate = TIER_FEATURE_GATES[client.packageTier];
    const users = client.users ?? [];
    const activeCount = users.filter((u) => u.status !== 'Suspended').length;
    const maxUsers = gate.maxUsers === -1 ? Infinity : gate.maxUsers;
    const usedPct = maxUsers === Infinity ? 0 : Math.round((activeCount / maxUsers) * 100);

    const featureKeys = Object.keys(client.allowedFeatures) as (keyof ClientSubscription['allowedFeatures'])[];
    const activeFeatureCount = featureKeys.filter((k) => client.allowedFeatures[k]).length;

    return {
      tenantId: client.id,
      tenantName: client.clientName,
      tier: client.packageTier,
      billingStatus: client.billingStatus,
      userCount: activeCount,
      userSlotUsedPct: usedPct,
      maxUsers: gate.maxUsers,
      isUserSlotFull: gate.maxUsers !== -1 && activeCount >= gate.maxUsers,
      activeFeatureCount,
      blockedFeatureCount: featureKeys.length - activeFeatureCount,
      monthlyUgxRate: client.monthlyUgxRate,
      nextBillingDate: client.nextBillingDate,
      ndaVerified: client.ndaVerified ?? false,
      supervisingPharmacistPresent: Boolean(client.supervisingPharmacist?.trim()),
    };
  }

  /**
   * Returns health snapshots for all tenants in the system.
   */
  static getAllTenantSnapshots(): TenantHealthSnapshot[] {
    return INITIAL_CLIENT_SUBSCRIPTIONS.map((c) => this.getTenantHealthSnapshot(c));
  }

  /**
   * Platform-level aggregate for super-admin dashboard.
   */
  static getPlatformSummary() {
    const snapshots = this.getAllTenantSnapshots();
    const byTier = {} as Record<TierName, number>;
    for (const s of snapshots) {
      byTier[s.tier] = (byTier[s.tier] ?? 0) + 1;
    }
    const totalMrr = snapshots.reduce((sum, s) => sum + s.monthlyUgxRate, 0);
    const suspended = snapshots.filter((s) => s.billingStatus === 'Suspended').length;
    const ndaCompliant = snapshots.filter((s) => s.ndaVerified && s.supervisingPharmacistPresent).length;

    return {
      totalTenants: snapshots.length,
      activeTenants: snapshots.filter((s) => s.billingStatus === 'Active').length,
      suspendedTenants: suspended,
      tierBreakdown: byTier,
      totalMrrUgx: totalMrr,
      ndaCompliantTenants: ndaCompliant,
      nonCompliantTenants: snapshots.length - ndaCompliant,
    };
  }
}
