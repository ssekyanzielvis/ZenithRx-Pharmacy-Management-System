/**
 * pharmacistVerificationService.ts — Pharmacist Credential & PSU Verification (§5)
 * Manages annual practicing certificates, NDA supervisory credentials, and verification queues.
 */

import { PharmacistCredentialRecord } from '../types';

const STORAGE_KEY_PHARMACIST_CREDENTIALS = 'zenithrx_pharmacist_credentials_v1';

export const INITIAL_PHARMACISTS: PharmacistCredentialRecord[] = [
  {
    id: 'ph-001',
    pharmacistName: 'Dr. Arthur Ssenabulya',
    email: 'arthur.ssenabulya@zenithrx.ug',
    phone: '+256 701 234567',
    psuRegNumber: 'PSU/REG/2021/0892',
    annualPracticingCertNo: 'APC-UG-2026-0911',
    certExpiryDate: '2026-12-31',
    ndaSupervisingLicenceNo: 'NDA/SUP/2026/0041',
    pharmacyAssignedId: 'client-001',
    pharmacyAssignedName: 'Kampala City Pharmacy',
    verificationStatus: 'VERIFIED_ACTIVE',
    verifiedByAdminName: 'Quantum Networks Verification Desk',
    verifiedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'ph-002',
    pharmacistName: 'Dr. Evelyn Nabatanzi',
    email: 'evelyn.nabatanzi@zenithrx.ug',
    phone: '+256 772 889911',
    psuRegNumber: 'PSU/REG/2020/0412',
    annualPracticingCertNo: 'APC-UG-2026-0442',
    certExpiryDate: '2026-12-31',
    ndaSupervisingLicenceNo: 'NDA/SUP/2026/0119',
    pharmacyAssignedId: 'client-002',
    pharmacyAssignedName: 'Entebbe Airport Express Branch',
    verificationStatus: 'VERIFIED_ACTIVE',
    verifiedByAdminName: 'Quantum Networks Verification Desk',
    verifiedAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'ph-003',
    pharmacistName: 'Dr. Derrick Omoding',
    email: 'derrick.omoding@gmail.com',
    phone: '+256 754 332211',
    psuRegNumber: 'PSU/REG/2024/1102',
    annualPracticingCertNo: 'APC-UG-2026-1890',
    certExpiryDate: '2026-12-31',
    pharmacyAssignedName: 'Pending Branch Assignment',
    verificationStatus: 'PENDING_VERIFICATION',
  }
];

export const getPharmacistCredentials = (): PharmacistCredentialRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PHARMACIST_CREDENTIALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PHARMACIST_CREDENTIALS, JSON.stringify(INITIAL_PHARMACISTS));
      return INITIAL_PHARMACISTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PHARMACISTS;
  }
};

export const verifyPharmacistCredential = (
  id: string,
  adminName: string,
  status: PharmacistCredentialRecord['verificationStatus'] = 'VERIFIED_ACTIVE'
): PharmacistCredentialRecord | null => {
  const all = getPharmacistCredentials();
  const target = all.find(p => p.id === id);
  if (!target) return null;

  const updatedTarget: PharmacistCredentialRecord = {
    ...target,
    verificationStatus: status,
    verifiedByAdminName: adminName,
    verifiedAt: new Date().toISOString(),
  };

  const updated = all.map(p => p.id === id ? updatedTarget : p);
  try {
    localStorage.setItem(STORAGE_KEY_PHARMACIST_CREDENTIALS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update pharmacist credentials', e);
  }
  return updatedTarget;
};
