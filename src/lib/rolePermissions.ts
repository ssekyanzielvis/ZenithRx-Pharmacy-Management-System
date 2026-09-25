import { UserAccessRights, UserRoleRank } from '../types';

/**
 * ─── Tri-Partite Domain Boundary Classification ─────────────────────────────
 * Strict segregation between:
 * 1. System Administration & Platform Infrastructure Domain
 * 2. Pharmacy Retail & Clinical Operations Domain
 * 3. Patient Protected Health Information (PHI) & Self-Service Portal Domain
 */

export const SYSTEM_ADMIN_TABS: string[] = [
  'adminQuantumWorkbench',
  'adminPharmacyRegistry',
  'adminCapacity',
  'adminMessagingHub',
  'adminExecutive',
  'adminFeedback',
  'adminPolicies',
  'adminDelegated',
  'adminDualControl',
  'adminIncidents',
  'adminMatrix',
  'adminUsers',
  'adminPharmacistVerification',
  'adminMedicineCatalogue',
  'adminHealthEducation',
  'adminOCR',
  'adminRevenueLedger',
  'adminBilling',
  'adminRegister',
  'adminPackages',
  'adminControlPlane',
  'tenancy',
  'health',
  'audit',
  'backupDisasterRecovery',
  'securityHardening',
  'dataPrivacy',
];

export const PHARMACY_OPERATIONS_TABS: string[] = [
  'pos',
  'prescriptions',
  'dispensingRegister',
  'prescriptionSubstitutions',
  'pharmacistInterventions',
  'adrReporting',
  'inventory',
  'batchManagement',
  'medicineRecall',
  'stockReconciliation',
  'returnsManagement',
  'expiry',
  'reordering',
  'stockForecasting',
  'storageAndTransfers',
  'supplierManagement',
  'procureToPay',
  'invoiceReconciliation',
  'financialAccounting',
  'payments',
  'reports',
  'insurance',
  'collaborators',
  'nda',
  'ownerDashboard',
  'ownerSales',
  'ownerStock',
  'ownerReports',
  'pharmacyServices',
  'customerSupport',
  'onlineOrders',
];

export const PATIENT_SYSTEM_TABS: string[] = [
  'customers',
  'patientPortal',
  'patientMedicineSearch',
  'patientPrescriptions',
  'patientOrders',
  'patientAdherence',
  'patientConsultation',
  'patientHealthEducation',
  'patientADR',
  'patientProfile',
];

export const getDefaultRightsForRole = (role: UserRoleRank | 'Super Admin'): UserAccessRights => {
  switch (role) {
    case 'Super Admin':
      // System Administrators are strictly segregated from Pharmacy Operations and Patient PHI
      return {
        canAccessPOS: false,
        canManageInventory: false,
        canProcessPrescriptions: false,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: false,
        canUseAiAssistant: true,
        canManageStaffAccounts: false,
      };
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
    case 'Pharmacy Owner':
      return {
        canAccessPOS: true,
        canManageInventory: true,
        canProcessPrescriptions: false,
        canApproveReorders: true,
        canViewReports: true,
        canSubmitInsurance: true,
        canUseAiAssistant: true,
        canManageStaffAccounts: true,
      };
    case 'Patient':
      return {
        canAccessPOS: false,
        canManageInventory: false,
        canProcessPrescriptions: false,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: false,
        canUseAiAssistant: true,
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
    case 'Pharmacy Owner':
      return 'bg-violet-100 dark:bg-violet-900/40 text-violet-950 dark:text-violet-200 border-violet-300 dark:border-violet-700';
    case 'Patient':
      return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
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
  domainType?: 'SYSTEM_ADMIN' | 'PHARMACY_OPERATIONS' | 'PATIENT_SYSTEM';
}

/**
 * Validates whether an authenticated user is permitted to access a given module/tab
 * strictly enforcing:
 * 1. System Administrators CANNOT access Pharmacy Operations or Patient PHI
 * 2. Pharmacy Staff CANNOT access System Admin Infrastructure
 * 3. Patients CANNOT access Pharmacy Operations or System Admin
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

  const isSuperAdminUser = user.isSuperAdmin === true || user.rankRole === 'Super Admin';

  // ─── RULE 1: SYSTEM ADMINISTRATOR DOMAIN BOUNDARY ──────────────────────────
  if (isSuperAdminUser) {
    // 1A. Block System Admin from Patient System & PHI
    if (PATIENT_SYSTEM_TABS.includes(tab)) {
      return {
        allowed: false,
        domainType: 'PATIENT_SYSTEM',
        reason:
          'PHI Privacy & Domain Segregation: System Administrators and infrastructure engineers are strictly prohibited from viewing patient medical records, personal prescriptions, and private teleconsultation logs under the Uganda Data Protection & Privacy Act (2019) and HIPAA regulations.',
        requiredPermission: 'Patient Explicit Consent & Clinical Healthcare Role',
        allowedRoles: ['Patient', 'Supervising Pharmacist', 'Assistant Pharmacist'],
      };
    }

    // 1B. Block System Admin from Pharmacy Retail & Dispensing Operations
    if (PHARMACY_OPERATIONS_TABS.includes(tab)) {
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Zero-Trust Domain Segregation: System Administrators are strictly segregated from accessing Pharmacy retail operations, dispensing registers, cash drawers, stock inventory, and commercial financial ledgers under NDA regulations, pharmacy practicing standards, and PoLP policy.',
        requiredPermission: 'Pharmacy Dispensing License (NDA/PSU) & Licensed Staff Role',
        allowedRoles: [
          'Supervising Pharmacist',
          'Assistant Pharmacist',
          'Pharmacy Technician',
          'POS Cashier / Dispenser',
          'Store & Inventory Manager',
          'Finance & Claims Officer',
          'Pharmacy Owner',
        ],
      };
    }

    // 1C. Allow System Admin on Platform Administration Tabs & Overview
    if (SYSTEM_ADMIN_TABS.includes(tab) || tab === 'overview') {
      return { allowed: true, domainType: 'SYSTEM_ADMIN' };
    }

    return {
      allowed: false,
      domainType: 'SYSTEM_ADMIN',
      reason: 'System Administrator domain is restricted to platform administration and infrastructure controls.',
    };
  }

  // ─── RULE 2: PATIENT ROLE BOUNDARY ─────────────────────────────────────────
  if (user.rankRole === 'Patient') {
    if (PATIENT_SYSTEM_TABS.includes(tab) || tab === 'overview' || tab === 'feedback') {
      return { allowed: true, domainType: 'PATIENT_SYSTEM' };
    }
    return {
      allowed: false,
      domainType: 'PATIENT_SYSTEM',
      reason: 'Patient accounts are restricted to the Patient Self-Service Portal and cannot access pharmacy internal counters or system administration.',
      allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'POS Cashier / Dispenser', 'Pharmacy Owner'],
    };
  }

  // ─── RULE 3: PHARMACY STAFF DOMAIN BOUNDARY ─────────────────────────────────
  // Pharmacy staff cannot access System Admin Infrastructure
  const isAdminInfrastructureTab = tab.startsWith('admin') || tab === 'tenancy';
  if (isAdminInfrastructureTab) {
    return {
      allowed: false,
      domainType: 'SYSTEM_ADMIN',
      reason:
        'Principle of Least Privilege: System Administration & Engineering tools are strictly reserved for verified Quantum Networks Ltd systems engineers. Client pharmacy accounts cannot access ring-0 infrastructure.',
      allowedRoles: ['Super Admin (Quantum Networks Systems Engineer)'],
      requiredPermission: 'System Root Clearance',
    };
  }

  const rights = user.accessRights || {};

  // Granular Pharmacy Operational Role Checks
  switch (tab) {
    case 'overview':
    case 'feedback':
    case 'nda':
    case 'customerSupport':
    case 'adminOrdersDelivery':
    case 'onlineOrders':
      return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };

    case 'pos':
      if (rights.canAccessPOS) return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Retail POS counter is restricted to Dispensing Cashiers, Technicians, and Pharmacists.',
        requiredPermission: 'canAccessPOS',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'POS Cashier / Dispenser', 'Intern Pharmacist'],
      };

    case 'prescriptions':
    case 'dispensingRegister':
    case 'prescriptionSubstitutions':
    case 'pharmacistInterventions':
    case 'adrReporting':
      if (rights.canProcessPrescriptions) return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Patient prescription queues and clinical drug dispensation require clinical authorization under NDA regulations.',
        requiredPermission: 'canProcessPrescriptions',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'Intern Pharmacist'],
      };

    case 'customers':
      if (rights.canProcessPrescriptions || rights.canAccessPOS) return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Access to patient medical profiles and refill records is restricted to dispensing clinical staff to protect patient confidentiality.',
        requiredPermission: 'canProcessPrescriptions OR canAccessPOS',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'POS Cashier / Dispenser'],
      };

    case 'inventory':
    case 'batchManagement':
    case 'medicineRecall':
    case 'stockReconciliation':
    case 'returnsManagement':
    case 'procureToPay':
    case 'storageAndTransfers':
    case 'invoiceReconciliation':
      if (rights.canManageInventory || rights.canProcessPrescriptions || rights.canAccessPOS || rights.canApproveReorders || user.rankRole === 'Pharmacy Owner') {
        return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      }
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Processing the 9-stage Procure-to-Pay workflow, medicine recalls, and vendor RTVs requires procurement, inventory, or clinical dispensing authority.',
        requiredPermission: 'canManageInventory OR canProcessPrescriptions OR canApproveReorders',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'Store & Inventory Manager'],
      };

    case 'expiry':
      if (rights.canManageInventory || rights.canProcessPrescriptions) return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: FEFO batch expiry alerts and stock quarantine actions are restricted to pharmacy inventory and dispensing staff.',
        requiredPermission: 'canManageInventory OR canProcessPrescriptions',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Pharmacy Technician', 'Store & Inventory Manager'],
      };

    case 'reordering':
    case 'stockForecasting':
      if (rights.canApproveReorders || rights.canManageInventory) return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Generating and issuing supplier Purchase Orders and reservations requires procurement and stock replenishment authority.',
        requiredPermission: 'canApproveReorders',
        allowedRoles: ['Supervising Pharmacist', 'Store & Inventory Manager', 'Pharmacy Owner'],
      };

    case 'payments':
    case 'financialAccounting':
      if (rights.canViewReports || rights.canSubmitInsurance || rights.canAccessPOS || user.rankRole === 'Pharmacy Owner' || user.rankRole === 'Supervising Pharmacist') {
        return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      }
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Financial accounting, P&L reporting, OpEx approvals, and cash drawer reconciliation require finance or supervisor privileges.',
        requiredPermission: 'canViewReports OR canSubmitInsurance',
        allowedRoles: ['Supervising Pharmacist', 'Finance & Claims Officer', 'POS Cashier / Dispenser', 'Pharmacy Owner'],
      };

    case 'reports':
      if (rights.canViewReports || user.rankRole === 'Pharmacy Owner' || user.rankRole === 'Supervising Pharmacist') {
        return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      }
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Financial analytics, gross profit margins, and revenue growth reports are restricted to pharmacy owners and finance officers.',
        requiredPermission: 'canViewReports',
        allowedRoles: ['Supervising Pharmacist', 'Finance & Claims Officer', 'Pharmacy Owner'],
      };

    case 'insurance':
      if (rights.canSubmitInsurance) return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Filing insurance claims, batch submission, and scheme co-pay reconciliation requires billing clearance.',
        requiredPermission: 'canSubmitInsurance',
        allowedRoles: ['Supervising Pharmacist', 'Assistant Pharmacist', 'Finance & Claims Officer'],
      };

    case 'collaborators':
      if (rights.canManageStaffAccounts || user.rankRole === 'Supervising Pharmacist' || user.rankRole === 'Pharmacy Owner') {
        return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      }
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Managing staff accounts, granting permissions, and modifying role credentials is strictly restricted to the Supervising Pharmacist and Owner to prevent unauthorized privilege escalation.',
        requiredPermission: 'canManageStaffAccounts',
        allowedRoles: ['Supervising Pharmacist', 'Pharmacy Owner'],
      };

    case 'audit':
      if (rights.canViewReports || rights.canManageStaffAccounts || user.rankRole === 'Supervising Pharmacist') {
        return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      }
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Security audit log inspection is restricted to the Supervising Pharmacist and Compliance Officers.',
        requiredPermission: 'canManageStaffAccounts OR canViewReports',
        allowedRoles: ['Supervising Pharmacist', 'Finance & Claims Officer'],
      };

    case 'health':
    case 'backupDisasterRecovery':
    case 'securityHardening':
    case 'dataPrivacy':
      if (user.rankRole === 'Supervising Pharmacist' || user.rankRole === 'Pharmacy Owner') {
        return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      }
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Database telemetry, DR consoles, and security controls are restricted to the Supervising Pharmacist.',
        requiredPermission: 'canManageStaffAccounts',
        allowedRoles: ['Supervising Pharmacist', 'Pharmacy Owner'],
      };

    case 'supplierManagement':
      if (rights.canApproveReorders || rights.canManageInventory || user.rankRole === 'Pharmacy Owner') {
        return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      }
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Centralized wholesale supplier procurement is restricted to Inventory Managers, Pharmacists, and Pharmacy Owners.',
        requiredPermission: 'canApproveReorders OR canManageInventory',
        allowedRoles: ['Supervising Pharmacist', 'Store & Inventory Manager', 'Pharmacy Owner'],
      };

    case 'ownerDashboard':
    case 'ownerSales':
    case 'ownerStock':
    case 'ownerReports':
    case 'pharmacyServices':
      if (user.rankRole === 'Pharmacy Owner' || user.rankRole === 'Supervising Pharmacist') {
        return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
      }
      return {
        allowed: false,
        domainType: 'PHARMACY_OPERATIONS',
        reason:
          'Principle of Least Privilege: Multi-branch executive analytics and P&L oversight is restricted to Pharmacy Owners and Supervising Pharmacists.',
        requiredPermission: 'canViewReports AND canManageStaffAccounts',
        allowedRoles: ['Pharmacy Owner', 'Supervising Pharmacist'],
      };

    case 'patientPortal':
    case 'patientMedicineSearch':
    case 'patientPrescriptions':
    case 'patientOrders':
    case 'patientAdherence':
    case 'patientConsultation':
    case 'patientHealthEducation':
    case 'patientADR':
    case 'patientProfile':
      return { allowed: true, domainType: 'PATIENT_SYSTEM' };

    default:
      return { allowed: true, domainType: 'PHARMACY_OPERATIONS' };
  }
};
