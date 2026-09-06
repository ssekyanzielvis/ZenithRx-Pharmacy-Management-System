/**
 * collaboratorService.ts — Delegated Collaborator Management & Role-Based Access Control
 * Clean Architecture: Service Layer
 * Complies directly with technical.md §11.22.3 (Admin and Collaborator Role Matrix)
 */

import { logAuditEvent } from '../repositories/auditRepository';

export type SystemRole =
  | 'Super Admin'
  | 'Admin Collaborator'
  | 'Tenant Admin'
  | 'Supervisor / Pharmacist'
  | 'Inventory Manager'
  | 'Cashier / Dispenser'
  | 'Finance Officer'
  | 'External Auditor (NDA)';

export interface RoleMatrixEntry {
  role: SystemRole;
  tenantScope: string;
  userMgmt: 'Full' | 'Configurable' | 'Limited' | 'No';
  inventory: 'Full' | 'Configurable' | 'Read-only' | 'Limited' | 'No';
  prescriptions: 'Full' | 'Configurable' | 'Limited' | 'No';
  pos: 'Full' | 'Configurable' | 'Limited' | 'No';
  payments: 'Full' | 'Configurable' | 'Limited' | 'No';
  claims: 'Full' | 'Configurable' | 'Limited' | 'No';
  reports: 'Full' | 'Configurable' | 'Limited' | 'No';
  csvExport: 'Full' | 'Configurable' | 'Tenant only' | 'Limited' | 'No';
  collaboratorGrants: 'Full' | 'Limited' | 'No';
  systemSettings: 'Full' | 'Limited' | 'No';
}

/**
 * Exact specification from technical.md §11.22.3
 */
export const TECHNICAL_MD_11_22_3_ROLE_MATRIX: RoleMatrixEntry[] = [
  {
    role: 'Super Admin',
    tenantScope: 'All tenants',
    userMgmt: 'Full',
    inventory: 'Full',
    prescriptions: 'Full',
    pos: 'Full',
    payments: 'Full',
    claims: 'Full',
    reports: 'Full',
    csvExport: 'Full',
    collaboratorGrants: 'Full',
    systemSettings: 'Full',
  },
  {
    role: 'Admin Collaborator',
    tenantScope: 'Assigned scope',
    userMgmt: 'Configurable',
    inventory: 'Configurable',
    prescriptions: 'Configurable',
    pos: 'Configurable',
    payments: 'Configurable',
    claims: 'Configurable',
    reports: 'Configurable',
    csvExport: 'Configurable',
    collaboratorGrants: 'Limited',
    systemSettings: 'Limited',
  },
  {
    role: 'Tenant Admin',
    tenantScope: 'Own tenant',
    userMgmt: 'Full',
    inventory: 'Full',
    prescriptions: 'Full',
    pos: 'Full',
    payments: 'Full',
    claims: 'Full',
    reports: 'Full',
    csvExport: 'Tenant only',
    collaboratorGrants: 'No',
    systemSettings: 'No',
  },
  {
    role: 'Supervisor / Pharmacist',
    tenantScope: 'Own tenant',
    userMgmt: 'No',
    inventory: 'Full',
    prescriptions: 'Full',
    pos: 'Full',
    payments: 'Limited',
    claims: 'Limited',
    reports: 'Limited',
    csvExport: 'Tenant only',
    collaboratorGrants: 'No',
    systemSettings: 'No',
  },
  {
    role: 'Inventory Manager',
    tenantScope: 'Own tenant',
    userMgmt: 'No',
    inventory: 'Full',
    prescriptions: 'No',
    pos: 'No',
    payments: 'No',
    claims: 'No',
    reports: 'Limited',
    csvExport: 'Tenant only',
    collaboratorGrants: 'No',
    systemSettings: 'No',
  },
  {
    role: 'Cashier / Dispenser',
    tenantScope: 'Own tenant',
    userMgmt: 'No',
    inventory: 'Read-only',
    prescriptions: 'Limited',
    pos: 'Full',
    payments: 'Limited',
    claims: 'No',
    reports: 'No',
    csvExport: 'No',
    collaboratorGrants: 'No',
    systemSettings: 'No',
  },
  {
    role: 'Finance Officer',
    tenantScope: 'Own tenant',
    userMgmt: 'No',
    inventory: 'No',
    prescriptions: 'No',
    pos: 'Limited',
    payments: 'Full',
    claims: 'Full',
    reports: 'Full',
    csvExport: 'Tenant only',
    collaboratorGrants: 'No',
    systemSettings: 'No',
  },
];

export interface Collaborator {
  id: string;
  tenantId: string;
  tenantScope?: string;
  fullName: string;
  email: string;
  phone: string;
  role: SystemRole;
  psuRegistrationNo?: string;
  ndaLicenseNo?: string;
  status: 'Active' | 'Invited' | 'Suspended';
  expiresAt?: string; // Time-bound access rule (§11.22.3)
  lastActive: string;
  permissions: {
    canDispense: boolean;
    canOverrideStock: boolean;
    canQuarantine: boolean;
    canManagePricing: boolean;
    canViewFinancials: boolean;
    canInviteUsers: boolean;
    canExportData: boolean;
  };
}

const MOCK_COLLABORATORS: Collaborator[] = [
  {
    id: 'USR-001',
    tenantId: 'CLIENT-001',
    tenantScope: 'CLIENT-001 (Mulago Care Pharmacy)',
    fullName: 'Pharm. Moses Musoke',
    email: 'm.musoke@mulagocare.ug',
    phone: '+256 772 123456',
    role: 'Supervisor / Pharmacist',
    psuRegistrationNo: 'PSU/REG/2021/1042',
    status: 'Active',
    lastActive: 'Just now',
    permissions: {
      canDispense: true,
      canOverrideStock: true,
      canQuarantine: true,
      canManagePricing: true,
      canViewFinancials: true,
      canInviteUsers: true,
      canExportData: true,
    },
  },
  {
    id: 'USR-002',
    tenantId: 'CLIENT-001',
    tenantScope: 'CLIENT-001 (Mulago Care Pharmacy)',
    fullName: 'Jane Nalubega',
    email: 'jane.n@mulagocare.ug',
    phone: '+256 752 987654',
    role: 'Cashier / Dispenser',
    psuRegistrationNo: 'PSU/DISP/2023/501',
    status: 'Active',
    lastActive: '12 mins ago',
    permissions: {
      canDispense: true,
      canOverrideStock: false,
      canQuarantine: true,
      canManagePricing: false,
      canViewFinancials: false,
      canInviteUsers: false,
      canExportData: false,
    },
  },
  {
    id: 'USR-003',
    tenantId: 'CLIENT-001',
    tenantScope: 'CLIENT-001 (Mulago Care Pharmacy)',
    fullName: 'David Kintu',
    email: 'd.kintu@mulagocare.ug',
    phone: '+256 701 445566',
    role: 'Inventory Manager',
    status: 'Active',
    lastActive: '45 mins ago',
    permissions: {
      canDispense: false,
      canOverrideStock: true,
      canQuarantine: true,
      canManagePricing: false,
      canViewFinancials: false,
      canInviteUsers: false,
      canExportData: true,
    },
  },
  {
    id: 'USR-004',
    tenantId: 'CLIENT-001',
    tenantScope: 'CLIENT-001 (Mulago Care Pharmacy)',
    fullName: 'Grace Babirye',
    email: 'g.babirye@mulagocare.ug',
    phone: '+256 774 223344',
    role: 'Finance Officer',
    status: 'Active',
    lastActive: '1 hour ago',
    permissions: {
      canDispense: false,
      canOverrideStock: false,
      canQuarantine: false,
      canManagePricing: true,
      canViewFinancials: true,
      canInviteUsers: false,
      canExportData: true,
    },
  },
  {
    id: 'USR-005',
    tenantId: 'CLIENT-001',
    tenantScope: 'Regulatory Scope: Central Uganda',
    fullName: 'Inspector Brian Tugume',
    email: 'brian.tugume@nda.or.ug',
    phone: '+256 417 788100',
    role: 'External Auditor (NDA)',
    ndaLicenseNo: 'NDA-INSP-UG-092',
    status: 'Active',
    expiresAt: '2026-12-31',
    lastActive: '2 days ago',
    permissions: {
      canDispense: false,
      canOverrideStock: false,
      canQuarantine: false,
      canManagePricing: false,
      canViewFinancials: false,
      canInviteUsers: false,
      canExportData: true,
    },
  },
];

export async function getCollaborators(tenantId = 'CLIENT-001'): Promise<Collaborator[]> {
  if (tenantId === 'all') return [...MOCK_COLLABORATORS];
  return MOCK_COLLABORATORS.filter((c) => c.tenantId === tenantId);
}

export async function inviteCollaborator(
  data: Omit<Collaborator, 'id' | 'status' | 'lastActive'>,
  invitedBy = 'Super Admin / Pharmacist'
): Promise<Collaborator> {
  const newCollab: Collaborator = {
    id: `USR-${Math.floor(Math.random() * 900 + 100)}`,
    ...data,
    status: 'Invited',
    lastActive: 'Never',
  };

  MOCK_COLLABORATORS.push(newCollab);

  await logAuditEvent({
    tenantId: data.tenantId,
    performedBy: invitedBy,
    performedByName: invitedBy,
    userRole: 'Tenant Admin',
    action: 'USER_ROLE_ASSIGNED',
    entityType: 'Collaborator',
    entityId: newCollab.id,
    severity: 'INFO',
    notes: `Granted delegated role ${newCollab.role} to ${newCollab.fullName} (${newCollab.email}) with scope: ${newCollab.tenantScope || newCollab.tenantId}. Time-bound expiry: ${newCollab.expiresAt || 'Indefinite'}.`,
  });

  return newCollab;
}

export async function updateCollaboratorStatus(
  id: string,
  newStatus: Collaborator['status'],
  updatedBy = 'Tenant Admin'
): Promise<void> {
  const target = MOCK_COLLABORATORS.find((c) => c.id === id);
  if (target) {
    target.status = newStatus;
    await logAuditEvent({
      tenantId: target.tenantId,
      performedBy: updatedBy,
      performedByName: updatedBy,
      userRole: 'Tenant Admin',
      action: 'USER_ROLE_ASSIGNED',
      entityType: 'Collaborator',
      entityId: target.id,
      severity: newStatus === 'Suspended' ? 'WARNING' : 'INFO',
      notes: `Collaborator access for ${target.fullName} status updated to ${newStatus}.`,
    });
  }
}
