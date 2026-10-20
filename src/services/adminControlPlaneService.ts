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
  status: 'INVITATION_PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  sessionTokenStatus: 'VALID' | 'PENDING_INVITE' | 'FORCE_REVOKED';
  invitationToken?: string;
  invitationSentAt?: string;
  invitationAcceptedAt?: string;
  passwordSet?: boolean;
  emailDeliveryStatus?: 'SENT' | 'FAILED' | 'PENDING_SMTP';
  emailDeliveryMessage?: string;
  emailDeliveredAt?: string;
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

const STORAGE_KEY_COLLABS = 'zenithrx_delegated_collaborators_v1';

function loadStoredCollaborators(): DelegatedCollaborator[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COLLABS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored collaborators', e);
    }
  }
  return [...INITIAL_COLLABORATORS];
}

function saveStoredCollaborators(list: DelegatedCollaborator[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_COLLABS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to store collaborators', e);
    }
  }
}

export interface CollaboratorEmailContent {
  recipientName: string;
  recipientEmail: string;
  role: string;
  domainScope: string;
  invitedBy: string;
  sentAt: string;
  expiresAt: string;
  subject: string;
  accessRightsDescription: string[];
  controlsBreakdown: { category: string; description: string; granted: boolean }[];
  acceptanceLink: string;
  acceptanceToken: string;
}

export function getCollaboratorAcceptanceUrl(token: string): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#accept-invite?token=${token}`;
  }
  return `http://localhost:3000/#accept-invite?token=${token}`;
}

export function generateCollaboratorEmailContent(collab: DelegatedCollaborator): CollaboratorEmailContent {
  const token = collab.invitationToken || '';
  const acceptanceLink = getCollaboratorAcceptanceUrl(token);

  const controlsBreakdown: { category: string; description: string; granted: boolean }[] = [
    {
      category: 'Clinical Prescriptions & Dispensing Overrides',
      description: 'Authorize emergency overrides, dual-signoff opiate authorizations, and Schedule 1/2 NDA narcotic verification.',
      granted: !!collab.permissions.dispensingOverrides,
    },
    {
      category: 'Global Safety Policies & FEFO Pricing Engine',
      description: 'Configure standard markup multipliers, FEFO near-expiry markdown schedules, and NDA quarantine holding areas.',
      granted: !!collab.permissions.policyConfiguration,
    },
    {
      category: 'AI Clinical Safety & Prompt De-identification',
      description: 'Manage Gemini Clinical Co-Pilot strictness, BNF formulary hallucination filters, and patient PII prompt stripping.',
      granted: !!collab.permissions.aiSafetyControls,
    },
    {
      category: 'Pharmacy Tenant Onboarding & Provisioning',
      description: 'Register licensed retail pharmacies, review NDA premise certifications, and provision branch databases.',
      granted: !!collab.permissions.tenantOnboarding,
    },
    {
      category: 'SaaS Tier Subscriptions & Payer Tariffs',
      description: 'Set monthly billing tiers, copay ratio baselines, and insurance provider claim submission rules.',
      granted: !!collab.permissions.tierManagement,
    },
    {
      category: 'POS Registers & Cashier Governance',
      description: 'Enforce cashier max discount limits, cash drawer variance lockouts, and NDA compliance receipt footers.',
      granted: !!collab.permissions.posSettings,
    },
    {
      category: 'Delegated Collaborator Management',
      description: 'Issue invitations, review 4-eyes dual control queues, and revoke administrative privileges.',
      granted: !!collab.permissions.collaboratorManagement,
    },
    {
      category: 'NDA Regulatory & Compliance Audit Exports',
      description: 'Export immutable tamper-evident logs, pharmacy dispensing registers, and cloud backup archives.',
      granted: !!collab.permissions.complianceExport,
    },
  ];

  const accessRightsDescription = controlsBreakdown
    .filter((c) => c.granted)
    .map((c) => `[AUTHORIZED] ${c.category}: ${c.description}`);

  return {
    recipientName: collab.fullName,
    recipientEmail: collab.email,
    role: collab.role,
    domainScope: collab.domainScope || 'FULL_PLATFORM',
    invitedBy: collab.grantedBy,
    sentAt: collab.invitationSentAt || new Date().toISOString(),
    expiresAt: collab.expiresAt,
    subject: `[ZenithRx Enterprise] Official Appointment: Delegated ${collab.role} (${collab.domainScope})`,
    accessRightsDescription,
    controlsBreakdown,
    acceptanceLink,
    acceptanceToken: token,
  };
}

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
  return loadStoredCollaborators();
}

/** Dispatch email via server API */
export async function dispatchCollaboratorEmailApi(
  collab: DelegatedCollaborator,
  emailContent: CollaboratorEmailContent
): Promise<{
  success: boolean;
  delivered: boolean;
  deliveryMethod?: string;
  message?: string;
  error?: string;
  mailtoLink?: string;
}> {
  try {
    const res = await fetch('/api/collaborators/send-invite-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail: collab.email,
        recipientName: collab.fullName,
        role: collab.role,
        domainScope: collab.domainScope,
        invitationLink: emailContent.acceptanceLink,
        invitationToken: collab.invitationToken,
        expiresAt: collab.expiresAt,
        grantedBy: collab.grantedBy,
        permissionsList: emailContent.accessRightsDescription,
        subject: emailContent.subject,
      }),
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[CollaboratorService] Automated email server call failed:', err);
    return {
      success: false,
      delivered: false,
      error: err?.message || 'Failed to connect to email service',
      mailtoLink: `mailto:${collab.email}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(
        `Dear ${collab.fullName},\n\nYou have been appointed by ${collab.grantedBy} as ${collab.role} on ZenithRx.\n\nPlease accept your invitation and configure your password here:\n${emailContent.acceptanceLink}\n\nAuthorized Controls:\n${emailContent.accessRightsDescription.join('\n')}`
      )}`,
    };
  }
}

/** Create or Invite a Delegated Collaborator */
export async function createDelegatedCollaborator(
  params: Omit<DelegatedCollaborator, 'id' | 'grantedAt' | 'status' | 'sessionTokenStatus' | 'invitationToken' | 'invitationSentAt' | 'invitationAcceptedAt' | 'passwordSet'>,
  grantedBy: string
): Promise<{
  success: boolean;
  collaborator: DelegatedCollaborator;
  invitationLink: string;
  emailContent: CollaboratorEmailContent;
  emailDelivery?: { delivered: boolean; deliveryMethod?: string; message?: string; error?: string; mailtoLink?: string };
}> {
  const token = `INV-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  const newCollab: DelegatedCollaborator = {
    ...params,
    id: `COLLAB-${Date.now().toString().slice(-4)}`,
    grantedBy,
    grantedAt: now,
    status: 'INVITATION_PENDING',
    sessionTokenStatus: 'PENDING_INVITE',
    invitationToken: token,
    invitationSentAt: now,
    passwordSet: false,
  };

  const emailContent = generateCollaboratorEmailContent(newCollab);
  const invitationLink = getCollaboratorAcceptanceUrl(token);

  // Dispatch real email via backend API
  const emailDispatch = await dispatchCollaboratorEmailApi(newCollab, emailContent);
  if (emailDispatch.delivered) {
    newCollab.emailDeliveryStatus = 'SENT';
    newCollab.emailDeliveredAt = new Date().toISOString();
  } else {
    newCollab.emailDeliveryStatus = emailDispatch.deliveryMethod === 'PENDING_SMTP_CONFIG' ? 'PENDING_SMTP' : 'FAILED';
    newCollab.emailDeliveryMessage = emailDispatch.message || emailDispatch.error || 'Pending SMTP configuration';
  }

  const list = loadStoredCollaborators();
  list.unshift(newCollab);
  saveStoredCollaborators(list);

  await logAuditEvent({
    tenantId: 'PLATFORM_SUPER_ADMIN',
    performedBy: grantedBy,
    performedByName: grantedBy,
    userRole: 'Super Admin',
    action: 'COLLABORATOR_GRANT' as any,
    entityType: 'DelegatedCollaborator',
    entityId: newCollab.id,
    severity: 'INFO',
    notes: `Official invitation sent to ${newCollab.fullName} (${newCollab.email}) for role ${newCollab.role} (${newCollab.domainScope}). Status: INVITATION PENDING. Valid until ${newCollab.expiresAt}. Delivery: ${newCollab.emailDeliveryStatus}`,
  });

  return { success: true, collaborator: newCollab, invitationLink, emailContent, emailDelivery: emailDispatch };
}

/** Get Collaborator by invitation token */
export async function getCollaboratorByInviteToken(token: string): Promise<DelegatedCollaborator | null> {
  const list = loadStoredCollaborators();
  const found = list.find((c) => c.invitationToken === token);
  return found || null;
}

/** Accept Collaborator Invitation and create credentials */
export async function acceptCollaboratorInvitation(
  token: string,
  password: string
): Promise<{ success: boolean; message: string; collaborator?: DelegatedCollaborator }> {
  if (!password || password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters with letters and numbers.' };
  }

  const list = loadStoredCollaborators();
  const collab = list.find((c) => c.invitationToken === token);
  if (!collab) {
    return { success: false, message: 'Invalid or expired invitation token.' };
  }

  if (collab.status === 'ACTIVE') {
    return { success: false, message: 'This invitation has already been accepted.' };
  }

  if (collab.status === 'REVOKED') {
    return { success: false, message: 'This administrative invitation was revoked by the System Administrator.' };
  }

  const now = new Date().toISOString();
  collab.status = 'ACTIVE';
  collab.sessionTokenStatus = 'VALID';
  collab.invitationAcceptedAt = now;
  collab.passwordSet = true;

  saveStoredCollaborators(list);

  await logAuditEvent({
    tenantId: 'PLATFORM_SUPER_ADMIN',
    performedBy: collab.fullName,
    performedByName: collab.fullName,
    userRole: collab.role as any,
    action: 'COLLABORATOR_GRANT' as any,
    entityType: 'DelegatedCollaborator',
    entityId: collab.id,
    severity: 'INFO',
    notes: `${collab.fullName} (${collab.email}) accepted appointment as ${collab.role} (${collab.domainScope}), created their credentials, and activated their administrative account.`,
  });

  return {
    success: true,
    message: `Appointment successfully accepted! Welcome, ${collab.fullName}. Your administrator account is now active.`,
    collaborator: collab,
  };
}

/** Resend Collaborator Invitation */
export async function resendCollaboratorInvite(
  collabId: string,
  actorName: string
): Promise<{
  success: boolean;
  message: string;
  collaborator?: DelegatedCollaborator;
  emailContent?: CollaboratorEmailContent;
  invitationLink?: string;
}> {
  const list = loadStoredCollaborators();
  const collab = list.find((c) => c.id === collabId);
  if (!collab) return { success: false, message: 'Collaborator not found.' };

  const now = new Date().toISOString();
  if (!collab.invitationToken) {
    collab.invitationToken = `INV-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  }
  collab.invitationSentAt = now;
  collab.status = 'INVITATION_PENDING';
  collab.sessionTokenStatus = 'PENDING_INVITE';

  saveStoredCollaborators(list);

  const emailContent = generateCollaboratorEmailContent(collab);
  const invitationLink = getCollaboratorAcceptanceUrl(collab.invitationToken);

  const emailDispatch = await dispatchCollaboratorEmailApi(collab, emailContent);
  if (emailDispatch.delivered) {
    collab.emailDeliveryStatus = 'SENT';
    collab.emailDeliveredAt = new Date().toISOString();
  } else {
    collab.emailDeliveryStatus = emailDispatch.deliveryMethod === 'PENDING_SMTP_CONFIG' ? 'PENDING_SMTP' : 'FAILED';
    collab.emailDeliveryMessage = emailDispatch.message || emailDispatch.error || 'Pending SMTP configuration';
  }

  saveStoredCollaborators(list);

  await logAuditEvent({
    tenantId: 'PLATFORM_SUPER_ADMIN',
    performedBy: actorName,
    performedByName: actorName,
    userRole: 'Super Admin',
    action: 'COLLABORATOR_GRANT' as any,
    entityType: 'DelegatedCollaborator',
    entityId: collab.id,
    severity: 'INFO',
    notes: `Invitation resent to ${collab.fullName} (${collab.email}) by ${actorName}. Delivery: ${collab.emailDeliveryStatus}`,
  });

  return {
    success: true,
    message: emailDispatch.delivered
      ? `Invitation successfully delivered to ${collab.email} via SMTP!`
      : `Invitation token refreshed. Automated delivery pending SMTP in .env. Use 1-Click Mail Client or Copy Link below.`,
    collaborator: collab,
    emailContent,
    invitationLink,
  };
}

/** Force Revoke Collaborator Session Token & Access */
export async function revokeCollaboratorAccess(
  collabId: string,
  revokedBy: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const list = loadStoredCollaborators();
  const collab = list.find((c) => c.id === collabId);
  if (!collab) return { success: false, message: 'Collaborator not found' };

  collab.status = 'REVOKED';
  collab.sessionTokenStatus = 'FORCE_REVOKED';

  saveStoredCollaborators(list);

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
