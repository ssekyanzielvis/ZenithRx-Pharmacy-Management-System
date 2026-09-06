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

export const getRoleBadgeStyle = (role: UserRoleRank) => {
  switch (role) {
    case 'Supervising Pharmacist':
      return 'bg-purple-100 text-purple-900 border-purple-300';
    case 'Assistant Pharmacist':
      return 'bg-indigo-100 text-indigo-900 border-indigo-300';
    case 'Pharmacy Technician':
      return 'bg-sky-100 text-sky-900 border-sky-300';
    case 'POS Cashier / Dispenser':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    case 'Store & Inventory Manager':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'Finance & Claims Officer':
      return 'bg-teal-100 text-teal-900 border-teal-300';
    case 'Intern Pharmacist':
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};
