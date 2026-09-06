import { ClientSubscription, PharmacyUserAccount, UserAccessRights, UserRoleRank } from '../types';
import { getDefaultRightsForRole } from './rolePermissions';

export interface StaffAccountFormValues {
  fullName: string;
  email: string;
  phone: string;
  staffRegNo: string;
  rankRole: UserRoleRank;
  status: PharmacyUserAccount['status'];
  accessRights: UserAccessRights;
}

export const createUserAccount = (
  client: ClientSubscription,
  values: StaffAccountFormValues
): PharmacyUserAccount => ({
  id: `USR-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-3)}`,
  clientId: client.id,
  fullName: values.fullName,
  email: values.email,
  phone: values.phone || '+256 700 000000',
  staffRegNo: values.staffRegNo || `STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
  rankRole: values.rankRole,
  status: values.status,
  accessRights: values.accessRights,
  dateCreated: new Date().toISOString().split('T')[0],
  lastLogin: 'Never (Pending Activation)',
});

export const updateUserAccount = (
  existing: PharmacyUserAccount,
  values: StaffAccountFormValues
): PharmacyUserAccount => ({
  ...existing,
  fullName: values.fullName,
  email: values.email,
  phone: values.phone,
  staffRegNo: values.staffRegNo,
  rankRole: values.rankRole,
  status: values.status,
  accessRights: values.accessRights,
});

export const toggleUserStatus = (
  users: PharmacyUserAccount[],
  userId: string
): PharmacyUserAccount[] =>
  users.map((user) => {
    if (user.id === userId) {
      const nextStatus: PharmacyUserAccount['status'] = user.status === 'Active' ? 'Suspended' : 'Active';
      return { ...user, status: nextStatus };
    }
    return user;
  });

export const removeUserAccount = (
  users: PharmacyUserAccount[],
  userId: string
): PharmacyUserAccount[] => users.filter((user) => user.id !== userId);

export const getDefaultStaffFormValues = (): StaffAccountFormValues => ({
  fullName: '',
  email: '',
  phone: '',
  staffRegNo: '',
  rankRole: 'Supervising Pharmacist',
  status: 'Active',
  accessRights: getDefaultRightsForRole('Supervising Pharmacist'),
});
