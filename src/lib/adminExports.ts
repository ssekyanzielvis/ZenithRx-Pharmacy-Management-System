import { ClientSubscription, PharmacyUserAccount } from '../types';

export type AdminExportRow = Record<string, string | number | boolean>;

const csvCell = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/"/g, '""');
  return /[",\n\r]/.test(text) ? `"${text}"` : text;
};

export const downloadCsv = (fileName: string, rows: AdminExportRow[]) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const mapUserToCsvRows = (client: ClientSubscription, user: PharmacyUserAccount) => [
  {
    section: 'user',
    clientId: client.id,
    clientName: client.clientName,
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    staffRegNo: user.staffRegNo || '',
    rankRole: user.rankRole,
    status: user.status,
    canAccessPOS: user.accessRights.canAccessPOS ? 'Yes' : 'No',
    canManageInventory: user.accessRights.canManageInventory ? 'Yes' : 'No',
    canProcessPrescriptions: user.accessRights.canProcessPrescriptions ? 'Yes' : 'No',
    canApproveReorders: user.accessRights.canApproveReorders ? 'Yes' : 'No',
    canViewReports: user.accessRights.canViewReports ? 'Yes' : 'No',
    canSubmitInsurance: user.accessRights.canSubmitInsurance ? 'Yes' : 'No',
    canUseAiAssistant: user.accessRights.canUseAiAssistant ? 'Yes' : 'No',
    canManageStaffAccounts: user.accessRights.canManageStaffAccounts ? 'Yes' : 'No',
  },
];

export const buildSelectedClientExportRows = (client: ClientSubscription): AdminExportRow[] => [
  {
    section: 'client',
    clientId: client.id,
    clientName: client.clientName,
    location: client.location,
    contactPhone: client.contactPhone,
    contactEmail: client.contactEmail,
    packageTier: client.packageTier,
    customMaxUsers: client.customMaxUsers,
    monthlyUgxRate: client.monthlyUgxRate,
    billingStatus: client.billingStatus,
    nextBillingDate: client.nextBillingDate,
    ndaLicenseNo: client.ndaLicenseNo || '',
    ndaVerified: client.ndaVerified ? 'Yes' : 'No',
    supervisingPharmacist: client.supervisingPharmacist || '',
  },
  ...(client.users || []).flatMap((user) => mapUserToCsvRows(client, user)),
];

export const buildAllClientsExportRows = (clients: ClientSubscription[]): AdminExportRow[] =>
  clients.flatMap((client) => [
    {
      section: 'client',
      clientId: client.id,
      clientName: client.clientName,
      location: client.location,
      contactPhone: client.contactPhone,
      contactEmail: client.contactEmail,
      packageTier: client.packageTier,
      customMaxUsers: client.customMaxUsers,
      monthlyUgxRate: client.monthlyUgxRate,
      billingStatus: client.billingStatus,
      nextBillingDate: client.nextBillingDate,
      ndaLicenseNo: client.ndaLicenseNo || '',
      ndaVerified: client.ndaVerified ? 'Yes' : 'No',
      supervisingPharmacist: client.supervisingPharmacist || '',
    },
    ...(client.users || []).flatMap((user) => mapUserToCsvRows(client, user)),
  ]);

export const buildAllStaffExportRows = (clients: ClientSubscription[]): AdminExportRow[] =>
  clients.flatMap((client) =>
    (client.users || []).map((user) => ({
      clientId: client.id,
      clientName: client.clientName,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      staffRegNo: user.staffRegNo || '',
      rankRole: user.rankRole,
      status: user.status,
      canAccessPOS: user.accessRights.canAccessPOS ? 'Yes' : 'No',
      canManageInventory: user.accessRights.canManageInventory ? 'Yes' : 'No',
      canProcessPrescriptions: user.accessRights.canProcessPrescriptions ? 'Yes' : 'No',
      canApproveReorders: user.accessRights.canApproveReorders ? 'Yes' : 'No',
      canViewReports: user.accessRights.canViewReports ? 'Yes' : 'No',
      canSubmitInsurance: user.accessRights.canSubmitInsurance ? 'Yes' : 'No',
      canUseAiAssistant: user.accessRights.canUseAiAssistant ? 'Yes' : 'No',
      canManageStaffAccounts: user.accessRights.canManageStaffAccounts ? 'Yes' : 'No',
    }))
  );
