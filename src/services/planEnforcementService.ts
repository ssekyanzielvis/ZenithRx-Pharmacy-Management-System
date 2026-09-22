import { TierName, SubscriptionStatus, PlanEnforcementEvent } from '../types';
import { logSecurityAudit } from './auditLogger';
import { sendSystemNotification } from './notificationService';
import { TIER_LIMITS } from './capacityService';

const STORAGE_KEY_ENFORCEMENT_EVENTS = 'zenithrx_plan_enforcement_events';

export type PlanFeatureKey =
  | 'basicInventory'
  | 'posBilling'
  | 'expiryAlerts'
  | 'autoReordering'
  | 'insuranceClaims'
  | 'salesAnalytics'
  | 'batchTracking'
  | 'aiCounseling'
  | 'multiLocation'
  | 'apiAccess'
  | 'exportPatientData'
  | 'staffLimit'
  | 'drugLimit'
  | 'prescriptionLimit';

export interface FeatureAccessRule {
  key: PlanFeatureKey;
  label: string;
  minTier: TierName;
  description: string;
}

export const FEATURE_ACCESS_RULES: Record<PlanFeatureKey, FeatureAccessRule> = {
  basicInventory: {
    key: 'basicInventory',
    label: 'Inventory Management',
    minTier: 'Starter',
    description: 'Basic inventory tracking, stock movements and categorization',
  },
  posBilling: {
    key: 'posBilling',
    label: 'Point of Sale & Dispensing',
    minTier: 'Starter',
    description: 'Direct cashier checkout, receipts, and cash/mobile money payments',
  },
  expiryAlerts: {
    key: 'expiryAlerts',
    label: 'Drug Expiry Early Warnings',
    minTier: 'Starter',
    description: 'Real-time drug expiry countdowns and quarantine flags',
  },
  autoReordering: {
    key: 'autoReordering',
    label: 'Low Stock Auto-Reordering',
    minTier: 'Starter',
    description: 'Automatic purchase order generation when reorder thresholds are reached',
  },
  insuranceClaims: {
    key: 'insuranceClaims',
    label: 'Insurance Schemes & Claims E-Filing',
    minTier: 'Professional',
    description: 'Electronic submission and reconciliation of insurance copay claims',
  },
  salesAnalytics: {
    key: 'salesAnalytics',
    label: 'Advanced Financial & Sales Analytics',
    minTier: 'Professional',
    description: 'Interactive profit margin, top revenue drugs, and cashier velocity dashboards',
  },
  batchTracking: {
    key: 'batchTracking',
    label: 'Batch & Serialized Recall Management',
    minTier: 'Professional',
    description: 'Traceability of individual batch numbers from supplier to patient',
  },
  aiCounseling: {
    key: 'aiCounseling',
    label: 'ZenithRx Clinical AI Drug Interaction Assistant',
    minTier: 'Professional',
    description: 'AI-driven contraindication, dosage warnings, and patient counseling generation',
  },
  multiLocation: {
    key: 'multiLocation',
    label: 'Multi-Branch Pharmacy Sync',
    minTier: 'Enterprise',
    description: 'Inter-branch stock transfers and consolidated multi-store reporting',
  },
  apiAccess: {
    key: 'apiAccess',
    label: 'Developer REST & Webhook APIs',
    minTier: 'Enterprise',
    description: 'Direct API integrations with ERPs, hospital databases, and logistics partners',
  },
  exportPatientData: {
    key: 'exportPatientData',
    label: 'Bulk Patient Data Export (NDA Governed)',
    minTier: 'Professional',
    description: 'Export of clinical records strictly for healthcare and regulatory audit purposes',
  },
  staffLimit: {
    key: 'staffLimit',
    label: 'Staff User Account Quota',
    minTier: 'Starter',
    description: 'Enforces maximum staff accounts defined by subscription package',
  },
  drugLimit: {
    key: 'drugLimit',
    label: 'Drug Master Catalog Quota',
    minTier: 'Starter',
    description: 'Enforces maximum drug catalog entries permitted on plan tier',
  },
  prescriptionLimit: {
    key: 'prescriptionLimit',
    label: 'Monthly Prescription Volume Quota',
    minTier: 'Starter',
    description: 'Enforces monthly prescription processing volume',
  },
};

const TIER_RANK: Record<TierName, number> = {
  'Starter': 1,
  'Professional': 2,
  'Enterprise': 3,
  'Custom Tailored': 4,
};

const getStoredEnforcementEvents = (): PlanEnforcementEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENFORCEMENT_EVENTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading plan enforcement events:', err);
  }
  return [];
};

const saveEnforcementEventsToStorage = (events: PlanEnforcementEvent[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_ENFORCEMENT_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Error saving plan enforcement events:', err);
  }
};

export interface CheckAccessResult {
  allowed: boolean;
  reason?: string;
  requiredTier?: TierName;
  currentTier: TierName;
  featureRule?: FeatureAccessRule;
}

export const checkFeatureAccess = (
  featureKey: PlanFeatureKey,
  currentTier: TierName = 'Starter',
  billingStatus: 'Active' | 'Pending Renewal' | 'Grace Period' | 'Suspended' = 'Active'
): CheckAccessResult => {
  // If suspended, hard block
  if (billingStatus === 'Suspended') {
    return {
      allowed: false,
      reason: 'Pharmacy subscription is currently SUSPENDED due to overdue billing or compliance hold.',
      currentTier,
    };
  }

  const rule = FEATURE_ACCESS_RULES[featureKey];
  if (!rule) {
    return { allowed: true, currentTier };
  }

  const currentRank = TIER_RANK[currentTier] || 1;
  const requiredRank = TIER_RANK[rule.minTier] || 1;

  if (currentRank < requiredRank) {
    return {
      allowed: false,
      reason: `Feature "${rule.label}" requires ${rule.minTier} plan or higher (Current plan: ${currentTier}).`,
      requiredTier: rule.minTier,
      currentTier,
      featureRule: rule,
    };
  }

  return {
    allowed: true,
    currentTier,
    featureRule: rule,
  };
};

export const checkQuotaAccess = (
  metric: 'staff' | 'drugs' | 'prescriptions' | 'transactions',
  currentCount: number,
  currentTier: TierName = 'Starter'
): { allowed: boolean; limit: number; current: number; reason?: string } => {
  const limits = TIER_LIMITS[currentTier] || TIER_LIMITS['Starter'];
  const limit = limits[metric];

  if (currentCount >= limit) {
    return {
      allowed: false,
      limit,
      current: currentCount,
      reason: `Quota limit reached for ${metric} (${currentCount}/${limit} on ${currentTier} plan). Please upgrade your plan to increase limits.`,
    };
  }

  return { allowed: true, limit, current: currentCount };
};

export const logEnforcementViolation = (
  tenantId: string,
  tenantName: string,
  actionAttempted: string,
  featureKey: string,
  requiredTier: TierName,
  currentTier: TierName,
  blockedReason: string,
  userId?: string,
  userName?: string
): PlanEnforcementEvent => {
  const events = getStoredEnforcementEvents();
  const event: PlanEnforcementEvent = {
    id: `ENF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tenantId,
    tenantName,
    userId,
    userName: userName || 'Staff User',
    actionAttempted,
    featureKey,
    requiredTier,
    currentTier,
    blockedReason,
    createdAt: new Date().toISOString(),
  };

  const updated = [event, ...events];
  saveEnforcementEventsToStorage(updated);

  // Security Audit
  logSecurityAudit(
    'PLAN_FEATURE_RESTRICTION_ENFORCED',
    `Blocked unauthorized action "${actionAttempted}" for tenant "${tenantName}" (${tenantId}). Reason: ${blockedReason}`,
    userName || 'Staff User'
  );

  // In-system notification for pharmacy admin
  sendSystemNotification({
    tenantId,
    title: `Feature Access Locked: ${actionAttempted}`,
    message: `Attempted to access ${featureKey} which is beyond ${currentTier} plan limits. Upgrade to ${requiredTier} to unlock.`,
    type: 'upgrade_recommendation',
    actionUrl: 'adminPackages',
  });

  return event;
};

export const getEnforcementLogs = (tenantId?: string): PlanEnforcementEvent[] => {
  const events = getStoredEnforcementEvents();
  if (tenantId) {
    return events.filter((e) => e.tenantId === tenantId);
  }
  return events;
};
