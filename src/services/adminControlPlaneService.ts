/**
 * adminControlPlaneService.ts — ZenithRx Enterprise Superuser & Governance Control Plane
 * Clean Architecture: Application & Governance Service Layer
 * Complies directly with technical.md §11.17 (Admin System, Delegated Collaborators & Superuser Control)
 */

import { logAuditEvent } from '../repositories/auditRepository';

export interface GlobalSystemPolicies {
  // Inventory & FEFO Pricing Policy
  defaultMarkupPercent: number;
  fefoMarkdown30DaysDiscount: number; // e.g. 25% discount for < 30 days
  fefoMarkdown60DaysDiscount: number; // e.g. 15% discount for < 60 days
  autoQuarantineExpiredStock: boolean;
  quarantineHoldingArea: string;

  // Clinical & Dispensing Overrides
  emergencyDispensingOverrideEnabled: boolean;
  ndaControlledDrugsSchedule1Lock: boolean;
  requireDualPharmacistSignoffForOpiates: boolean;
  maxDailyDispenseQuotaUnits: number;

  // POS & Taxes Policy
  vatRatePercent: number; // 18% in Uganda
  cashierMaxDiscountPercent: number; // e.g. 5%
  enforceCashDrawerVarianceLock: boolean;
  receiptHeaderBranding: string;
  receiptFooterComplianceText: string;

  // AI Safety & Clinical Decision Support
  aiClinicalAssistantEnabled: boolean;
  aiDrugInteractionStrictness: 'CRITICAL_ONLY' | 'MODERATE_AND_CRITICAL' | 'ALL_INTERACTIONS';
  aiHallucinationFilterEnabled: boolean;
  aiPatientPromptRedaction: boolean;

  // Insurance & Payer Tariffs
  defaultCopayRatioPercent: number;
  autoBatchClaimsSubmission: boolean;
  maxClaimDiscrepancyToleranceUgx: number;
}

export interface DualControlApprovalRequest {
  id: string;
  actionType: 
    | 'TENANT_SUSPENSION'
    | 'GLOBAL_PRICE_OVERRIDE'
    | 'DISPENSING_QUOTA_OVERRIDE'
    | 'COLLABORATOR_ELEVATION'
    | 'DATA_PURGE_REQUEST';
  targetTenantId?: string;
  targetTenantName?: string;
  targetEntityId: string;
  requestedBy: string;
  requestedByRole: string;
  requestDetails: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  riskLevel: 'HIGH' | 'CRITICAL';
}

export interface DelegatedCollaborator {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'Super Admin' | 'Admin Collaborator' | 'Domain Admin';
  domainScope?: 'FINANCE' | 'INVENTORY' | 'CLINICAL_OVERSIGHT' | 'SECURITY_COMPLIANCE' | 'FULL_PLATFORM';
  assignedTenants: string[]; // 'ALL' or specific client IDs
  grantedBy: string;
  grantedAt: string;
  expiresAt: string; // ISO string for time-bound access
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  sessionTokenStatus: 'VALID' | 'FORCE_REVOKED';
  permissions: {
    tenantOnboarding: boolean;
    tierManagement: boolean;
    policyConfiguration: boolean;
    dispensingOverrides: boolean;
    posSettings: boolean;
    aiSafetyControls: boolean;
    collaboratorManagement: boolean;
    complianceExport: boolean;
  };
}

export interface SecurityIncident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedTenantId?: string;
  affectedTenantName?: string;
  detectedAt: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  summary: string;
  mitigationSteps: string;
}

const DEFAULT_GLOBAL_POLICIES: GlobalSystemPolicies = {
  defaultMarkupPercent: 33.3,
  fefoMarkdown30DaysDiscount: 30,
  fefoMarkdown60DaysDiscount: 15,
  autoQuarantineExpiredStock: true,
  quarantineHoldingArea: 'Quarantine Vault Alpha-1',

  emergencyDispensingOverrideEnabled: true,
  ndaControlledDrugsSchedule1Lock: true,
  requireDualPharmacistSignoffForOpiates: true,
  maxDailyDispenseQuotaUnits: 1500,

  vatRatePercent: 18,
  cashierMaxDiscountPercent: 7.5,
  enforceCashDrawerVarianceLock: true,
  receiptHeaderBranding: 'ZENITHRX ENTERPRISE PHARMACY MANAGEMENT SYSTEM',
  receiptFooterComplianceText: 'Licensed by National Drug Authority (NDA) Uganda • All sales recorded in immutable ledger.',

  aiClinicalAssistantEnabled: true,
  aiDrugInteractionStrictness: 'MODERATE_AND_CRITICAL',
  aiHallucinationFilterEnabled: true,
  aiPatientPromptRedaction: true,

  defaultCopayRatioPercent: 20,
  autoBatchClaimsSubmission: true,
  maxClaimDiscrepancyToleranceUgx: 500,
};

let currentGlobalPolicies: GlobalSystemPolicies = { ...DEFAULT_GLOBAL_POLICIES };

const INITIAL_COLLABORATORS: DelegatedCollaborator[] = [
  {
    id: 'COLLAB-001',
    fullName: 'Dr. Arthur Ssenabulya',
    email: 'arthur.ssenabulya@zenithrx.ug',
    phone: '+256 701 992811',
    role: 'Super Admin',
    domainScope: 'FULL_PLATFORM',
    assignedTenants: ['ALL'],
    grantedBy: 'System Bootstrap',
    grantedAt: '2026-01-01T00:00:00Z',
    expiresAt: '2030-12-31T23:59:59Z',
    status: 'ACTIVE',
    sessionTokenStatus: 'VALID',
    permissions: {
      tenantOnboarding: true,
      tierManagement: true,
      policyConfiguration: true,
      dispensingOverrides: true,
      posSettings: true,
      aiSafetyControls: true,
      collaboratorManagement: true,
      complianceExport: true,
    },
  },
  {
    id: 'COLLAB-002',
    fullName: 'Pharm. Evelyn Nabatanzi',
    email: 'evelyn.nabatanzi@zenithrx.ug',
    phone: '+256 772 445566',
    role: 'Domain Admin',
    domainScope: 'CLINICAL_OVERSIGHT',
    assignedTenants: ['ALL'],
    grantedBy: 'Dr. Arthur Ssenabulya',
    grantedAt: '2026-06-01T08:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    status: 'ACTIVE',
    sessionTokenStatus: 'VALID',
    permissions: {
      tenantOnboarding: false,
      tierManagement: false,
      policyConfiguration: true,
      dispensingOverrides: true,
      posSettings: false,
      aiSafetyControls: true,
      collaboratorManagement: false,
      complianceExport: true,
    },
  },
  {
    id: 'COLLAB-003',
    fullName: 'Ronald Mukasa, CPA',
    email: 'ronald.mukasa@zenithrx.ug',
    phone: '+256 752 883311',
    role: 'Domain Admin',
    domainScope: 'FINANCE',
    assignedTenants: ['ALL'],
    grantedBy: 'Dr. Arthur Ssenabulya',
    grantedAt: '2026-07-15T09:00:00Z',
    expiresAt: '2026-10-15T23:59:59Z',
    status: 'ACTIVE',
    sessionTokenStatus: 'VALID',
    permissions: {
      tenantOnboarding: false,
      tierManagement: true,
      policyConfiguration: true,
      dispensingOverrides: false,
      posSettings: true,
      aiSafetyControls: false,
      collaboratorManagement: false,
      complianceExport: true,
    },
  },
];

let collaboratorsList = [...INITIAL_COLLABORATORS];

const INITIAL_DUAL_APPROVALS: DualControlApprovalRequest[] = [
  {
    id: 'DUAL-REQ-2026-001',
    actionType: 'GLOBAL_PRICE_OVERRIDE',
    targetTenantId: 'ALL',
    targetTenantName: 'All Network Pharmacies',
    targetEntityId: 'PRICE-CAT-ANTIBIOTICS',
    requestedBy: 'Pharm. Evelyn Nabatanzi',
    requestedByRole: 'Domain Admin (Clinical)',
    requestDetails: 'Apply 12% national cost index adjustment on Amoxicillin 500mg batches due to supplier freight tariff.',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-08-05T08:45:00Z',
    riskLevel: 'HIGH',
  },
  {
    id: 'DUAL-REQ-2026-002',
    actionType: 'DISPENSING_QUOTA_OVERRIDE',
    targetTenantId: 'CLIENT-002',
    targetTenantName: 'Kampala Central Pharmacy',
    targetEntityId: 'RX-OPIATE-EMERGENCY',
    requestedBy: 'Pharm. Moses Musoke',
    requestedByRole: 'Supervising Pharmacist',
    requestDetails: 'Emergency post-surgical Morphine 10mg dispensing authorization exceeding standard 50-unit threshold.',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-08-05T11:20:00Z',
    riskLevel: 'CRITICAL',
  },
];

let dualApprovalsList = [...INITIAL_DUAL_APPROVALS];

const INITIAL_SECURITY_INCIDENTS: SecurityIncident[] = [
  {
    id: 'INC-2026-0801',
    title: 'Multiple Failed PIN Attempts on Cash Drawer',
    severity: 'MEDIUM',
    affectedTenantId: 'CLIENT-002',
    affectedTenantName: 'Kampala Central Pharmacy',
    detectedAt: '2026-08-04T18:22:00Z',
    status: 'RESOLVED',
    summary: 'POS register #2 locked after 4 consecutive failed supervisor overrides.',
    mitigationSteps: 'Register unlocked by Supervising Pharmacist Moses Musoke after identity verification.',
  },
  {
    id: 'INC-2026-0802',
    title: 'Anomalous Export Volume Flagged by Cloudflare R2',
    severity: 'LOW',
    affectedTenantId: 'CLIENT-001',
    affectedTenantName: 'Mulago Care Pharmacy',
    detectedAt: '2026-08-05T07:14:00Z',
    status: 'RESOLVED',
    summary: 'Routine monthly full database backup triggered archive export.',
    mitigationSteps: 'Verified legitimate Super Admin scheduled compliance backup job.',
  },
];

let securityIncidentsList = [...INITIAL_SECURITY_INCIDENTS];

// ─── Service Methods ──────────────────────────────────────────────────────────

/** Fetch Global System Policies */
export async function getGlobalSystemPolicies(): Promise<GlobalSystemPolicies> {
  return { ...currentGlobalPolicies };
}

/** Update Global System Policies with Audit Log */
export async function updateGlobalSystemPolicies(
  newPolicies: Partial<GlobalSystemPolicies>,
  actorName: string
): Promise<{ success: boolean; policies: GlobalSystemPolicies }> {
  currentGlobalPolicies = { ...currentGlobalPolicies, ...newPolicies };

  await logAuditEvent({
    tenantId: 'PLATFORM_SUPER_ADMIN',
    performedBy: actorName,
    performedByName: actorName,
    userRole: 'Super Admin',
    action: 'POLICY_UPDATE' as any,
    entityType: 'GlobalGovernanceControlPlane',
    entityId: 'GLOBAL-POLICIES',
    severity: 'WARNING',
    notes: `Global system policies modified by Super Admin ${actorName}. Updated: ${Object.keys(newPolicies).join(', ')}.`,
  });

  return { success: true, policies: currentGlobalPolicies };
}

/** Get Delegated Collaborators */
export async function getDelegatedCollaborators(): Promise<DelegatedCollaborator[]> {
  return [...collaboratorsList];
}

/** Create or Invite a Delegated Collaborator */
export async function createDelegatedCollaborator(
  params: Omit<DelegatedCollaborator, 'id' | 'grantedAt' | 'status' | 'sessionTokenStatus'>,
  grantedBy: string
): Promise<{ success: boolean; collaborator: DelegatedCollaborator }> {
  const newCollab: DelegatedCollaborator = {
    ...params,
    id: `COLLAB-${Date.now().toString().slice(-4)}`,
    grantedBy,
    grantedAt: new Date().toISOString(),
    status: 'ACTIVE',
    sessionTokenStatus: 'VALID',
  };

  collaboratorsList.unshift(newCollab);

  await logAuditEvent({
    tenantId: 'PLATFORM_SUPER_ADMIN',
    performedBy: grantedBy,
    performedByName: grantedBy,
    userRole: 'Super Admin',
    action: 'COLLABORATOR_GRANT' as any,
    entityType: 'DelegatedCollaborator',
    entityId: newCollab.id,
    severity: 'INFO',
    notes: `Delegated collaborator access granted to ${newCollab.fullName} (${newCollab.role}, ${newCollab.domainScope}). Valid until ${newCollab.expiresAt}.`,
  });

  return { success: true, collaborator: newCollab };
}

/** Force Revoke Collaborator Session Token & Access */
export async function revokeCollaboratorAccess(
  collabId: string,
  revokedBy: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const collab = collaboratorsList.find((c) => c.id === collabId);
  if (!collab) return { success: false, message: 'Collaborator not found' };

  collab.status = 'REVOKED';
  collab.sessionTokenStatus = 'FORCE_REVOKED';

  await logAuditEvent({
    tenantId: 'PLATFORM_SUPER_ADMIN',
    performedBy: revokedBy,
    performedByName: revokedBy,
    userRole: 'Super Admin',
    action: 'COLLABORATOR_REVOKE' as any,
    entityType: 'DelegatedCollaborator',
    entityId: collabId,
    severity: 'WARNING',
    notes: `Collaborator access revoked for ${collab.fullName} by ${revokedBy}. Reason: ${reason}. Session tokens invalidated.`,
  });

  return { success: true, message: `Access revoked and session token force-invalidated for ${collab.fullName}.` };
}

/** Get Pending Dual-Control Approvals */
export async function getDualControlApprovals(): Promise<DualControlApprovalRequest[]> {
  return [...dualApprovalsList];
}

/** Process Dual-Control Approval Decision (4-Eyes Principle) */
export async function processDualControlDecision(params: {
  requestId: string;
  decision: 'APPROVED' | 'REJECTED';
  approverName: string;
  rejectionReason?: string;
}): Promise<{ success: boolean; message: string }> {
  const req = dualApprovalsList.find((r) => r.id === params.requestId);
  if (!req) return { success: false, message: 'Approval request not found' };

  if (req.requestedBy === params.approverName) {
    return {
      success: false,
      message: 'Dual-control violation: Requester cannot approve their own high-risk request (4-Eyes Principle §11.17).',
    };
  }

  req.status = params.decision;
  req.approvedBy = params.approverName;
  req.approvedAt = new Date().toISOString();
  if (params.decision === 'REJECTED') {
    req.rejectionReason = params.rejectionReason || 'Declined by Super Admin';
  }

  await logAuditEvent({
    tenantId: req.targetTenantId || 'PLATFORM_SUPER_ADMIN',
    performedBy: params.approverName,
    performedByName: params.approverName,
    userRole: 'Super Admin',
    action: 'DUAL_CONTROL_DECISION' as any,
    entityType: 'DualControlGovernance',
    entityId: req.id,
    severity: params.decision === 'APPROVED' ? 'WARNING' : 'INFO',
    notes: `Dual-control action ${req.actionType} (${req.id}) was ${params.decision} by ${params.approverName}. Details: ${req.requestDetails}`,
  });

  return { success: true, message: `Dual-control request ${req.id} has been ${params.decision}.` };
}

/** Get Security Incidents */
export async function getSecurityIncidents(): Promise<SecurityIncident[]> {
  return [...securityIncidentsList];
}
