import { UserAccessRights, UserRoleRank } from '../types';

export const getDefaultRightsForRole = (role: UserRoleRank): UserAccessRights => {
  switch (role) {
    case 'Supervising Pharmacist':
      return {
        canAccessPOS: true,
        canManageInventory: true,
        canProcessPrescriptions: true,
        canApproveReorders: true,
        canViewReports: true,
        canSubmitInsurance: true,
        canUseAiAssistant: true,
        canManageStaffAccounts: true,
      };
    case 'Assistant Pharmacist':
      return {
        canAccessPOS: true,
        canManageInventory: true,
        canProcessPrescriptions: true,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: true,
        canUseAiAssistant: true,
        canManageStaffAccounts: false,
      };
    case 'Pharmacy Technician':
      return {
        canAccessPOS: true,
        canManageInventory: true,
        canProcessPrescriptions: true,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: false,
        canUseAiAssistant: false,
        canManageStaffAccounts: false,
      };
    case 'POS Cashier / Dispenser':
      return {
        canAccessPOS: true,
        canManageInventory: false,
        canProcessPrescriptions: false,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: false,
        canUseAiAssistant: false,
        canManageStaffAccounts: false,
      };
    case 'Store & Inventory Manager':
      return {
        canAccessPOS: false,
        canManageInventory: true,
        canProcessPrescriptions: false,
        canApproveReorders: true,
        canViewReports: false,
        canSubmitInsurance: false,
        canUseAiAssistant: false,
        canManageStaffAccounts: false,
      };
    case 'Finance & Claims Officer':
      return {
        canAccessPOS: false,
        canManageInventory: false,
        canProcessPrescriptions: false,
        canApproveReorders: false,
        canViewReports: true,
        canSubmitInsurance: true,
        canUseAiAssistant: false,
        canManageStaffAccounts: false,
      };
    case 'Intern Pharmacist':
    default:
      return {
        canAccessPOS: true,
        canManageInventory: false,
        canProcessPrescriptions: true,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: false,
        canUseAiAssistant: true,
        canManageStaffAccounts: false,
      };
  }
};

export const getRoleBadgeStyle = (role: UserRoleRank | string) => {
  switch (role) {
    case 'Super Admin':
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700';
    case 'Supervising Pharmacist':
      return 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700';
    case 'Assistant Pharmacist':
      return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700';
    case 'Pharmacy Technician':
      return 'bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-700';
    case 'POS Cashier / Dispenser':
      return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
    case 'Store & Inventory Manager':
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700';
    case 'Finance & Claims Officer':
      return 'bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700';
    case 'Intern Pharmacist':
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  }
};

export interface TabAccessCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermission?: string;
  allowedRoles?: string[];
}

/**
 * Validates whether an authenticated user is permitted to access a given module/tab
 * strictly under the Principle of Least Privilege (PoLP).
 */
export const canUserAccessTab = (
  user: {
    isSuperAdmin?: boolean;
    rankRole?: string;
    accessRights?: Partial<UserAccessRights>;
  } | null | undefined,
  tab: string
): TabAccessCheckResult => {
  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required. Please sign in to access ZenithRx modules.',
    };
  }

  // 1. Quantum Networks Super Admin Routes
  const isAdminTab =
    tab.startsWith('admin') ||
    tab === 'tenancy';

  if (isAdminTab) {
    if (user.isSuperAdmin) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason:
        'Principle of Least Privilege: System Administration & Engineering tools are strictly reserved for verified Quantum Networks Ltd systems engineers. Client pharmacy accounts cannot access ring-0 infrastructure.',
      allowedRoles: ['Super Admin (Quantum Networks Systems Engineer)'],
      requiredPermission: 'System Root Clearance',
    };
  }

  // Super Admin can inspect all operational modules
  if (user.isSuperAdmin) {
    return { allowed: true };
  }

  const rights = user.accessRights || {};

  // 2. Tab-specific privilege gates
  switch (tab) {
    case 'overview':
    case 'feedback':
    case 'nda':
      return { allowed: true };

    case 'pos':
      if (rights.canAccessPOS) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Retail POS counter is restricted to Dispensing Cashiers, Technicians, and Pharmacists.',
        requiredPermission: 'canAccessPOS',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'POS Cashier / Dispenser', 'Intern Pharmacist'],
      };

    case 'prescriptions':
      if (rights.canProcessPrescriptions) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Patient prescription queues and clinical drug dispensation require clinical authorization under NDA regulations.',
        requiredPermission: 'canProcessPrescriptions',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'Intern Pharmacist'],
      };

    case 'customers':
      if (rights.canProcessPrescriptions || rights.canAccessPOS) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Access to patient medical profiles and refill records is restricted to dispensing clinical staff to protect patient confidentiality.',
        requiredPermission: 'canProcessPrescriptions OR canAccessPOS',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'POS Cashier / Dispenser'],
      };

    case 'inventory':
      if (rights.canManageInventory) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Modifying pharmaceutical inventory counts, shelf assignments, and batches requires inventory management authority.',
        requiredPermission: 'canManageInventory',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'Store & Inventory Manager'],
      };

    case 'expiry':
      if (rights.canManageInventory || rights.canProcessPrescriptions) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: FEFO batch expiry alerts and stock quarantine actions are restricted to pharmacy inventory and dispensing staff.',
        requiredPermission: 'canManageInventory OR canProcessPrescriptions',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'Store & Inventory Manager'],
      };

    case 'reordering':
      if (rights.canApproveReorders || rights.canManageInventory) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Generating and issuing supplier Purchase Orders requires procurement and stock replenishment authority.',
        requiredPermission: 'canApproveReorders',
        allowedRoles: ['Supervising Pharmacist', 'Store & Inventory Manager'],
      };

    case 'payments':
      if (rights.canViewReports || rights.canSubmitInsurance || rights.canAccessPOS) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Financial reconciliation, drawer balancing, and payment records require finance or supervisor privileges.',
        requiredPermission: 'canViewReports OR canSubmitInsurance',
        allowedRoles: ['Supervising Pharmacist', 'Finance & Claims Officer', 'POS Cashier / Dispenser'],
      };

    case 'reports':
      if (rights.canViewReports) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Financial analytics, gross profit margins, and revenue growth reports are restricted to pharmacy owners and finance officers.',
        requiredPermission: 'canViewReports',
        allowedRoles: ['Supervising Pharmacist', 'Finance & Claims Officer'],
      };

    case 'insurance':
      if (rights.canSubmitInsurance) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Filing insurance claims, batch submission, and scheme co-pay reconciliation requires billing clearance.',
        requiredPermission: 'canSubmitInsurance',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Finance & Claims Officer'],
      };

    case 'collaborators':
      if (rights.canManageStaffAccounts || user.rankRole === 'Supervising Pharmacist') return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Managing staff accounts, granting permissions, and modifying role credentials is strictly restricted to the Supervising Pharmacist to prevent unauthorized privilege escalation.',
        requiredPermission: 'canManageStaffAccounts',
        allowedRoles: ['Supervising Pharmacist'],
      };

    case 'audit':
      if (rights.canViewReports || rights.canManageStaffAccounts || user.rankRole === 'Supervising Pharmacist') return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Security audit log inspection is restricted to the Supervising Pharmacist and Compliance Officers.',
        requiredPermission: 'canManageStaffAccounts OR canViewReports',
        allowedRoles: ['Supervising Pharmacist', 'Finance & Claims Officer'],
      };

    case 'health':
      if (user.rankRole === 'Supervising Pharmacist' || user.isSuperAdmin) return { allowed: true };
      return {
        allowed: false,
        reason:
          'Principle of Least Privilege: Database telemetry and system diagnostics are restricted to the Supervising Pharmacist and Quantum Networks administrators.',
        requiredPermission: 'canManageStaffAccounts',
        allowedRoles: ['Supervising Pharmacist', 'Super Admin'],
      };

    default:
      return { allowed: true };
  }
};
