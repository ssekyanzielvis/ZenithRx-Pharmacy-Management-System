import { NdaComplianceCheckRecord, NdaPharmacyRecord } from '../types';
import { logSecurityAudit } from './auditLogger';
import { sendSystemNotification } from './notificationService';

const STORAGE_KEY_NDA_CHECKS = 'zenithrx_nda_compliance_checks';
const STORAGE_KEY_PATIENT_DATA_PURPOSE = 'zenithrx_patient_data_purpose_attestation';

// Initial realistic NDA compliance audit checks
const INITIAL_NDA_CHECKS: NdaComplianceCheckRecord[] = [
  {
    id: 'NDA-CHK-001',
    tenantId: 'client-1',
    tenantName: 'Nakasero Pharmacy Branch',
    checkedBy: 'admin-super',
    checkerName: 'Dr. Arthur Ssenabulya (Chief Registrar)',
    status: 'compliant',
    ndaLicenseNumber: 'NDA/UG/RET/2026/04881',
    verificationNotes: 'All Class A/B narcotic registers verified. Supervising Pharmacist (PSU 1044/22) active on site. Digital audit logs active.',
    patientDataSafetyVerified: true,
    auditTrailVerified: true,
    nextReviewDate: '2027-01-15',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'NDA-CHK-002',
    tenantId: 'client-2',
    tenantName: 'Ecopharm Kampala Ltd',
    checkedBy: 'admin-super',
    checkerName: 'Sarah Namubiru (Senior Inspector)',
    status: 'warning',
    ndaLicenseNumber: 'NDA/UG/RET/2025/11902',
    verificationNotes: 'Premises license pending annual renewal with NDA Secretariat. Dispensary storage temperature log compliance satisfactory.',
    patientDataSafetyVerified: true,
    auditTrailVerified: true,
    nextReviewDate: '2026-10-30',
    createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
  },
  {
    id: 'NDA-CHK-003',
    tenantId: 'client-3',
    tenantName: 'Mbarara City Pharmacy',
    checkedBy: 'admin-super',
    checkerName: 'Dr. Arthur Ssenabulya (Chief Registrar)',
    status: 'compliant',
    ndaLicenseNumber: 'NDA/UG/RET/2026/09214',
    verificationNotes: 'Cold chain integrity verified for insulin batches. Prescription dispensing trail verified compliant with NDA schedule IV.',
    patientDataSafetyVerified: true,
    auditTrailVerified: true,
    nextReviewDate: '2027-02-28',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
];

const getStoredNdaChecks = (): NdaComplianceCheckRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NDA_CHECKS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading NDA checks:', err);
  }
  saveNdaChecksToStorage(INITIAL_NDA_CHECKS);
  return INITIAL_NDA_CHECKS;
};

const saveNdaChecksToStorage = (checks: NdaComplianceCheckRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_NDA_CHECKS, JSON.stringify(checks));
  } catch (err) {
    console.error('Error saving NDA checks:', err);
  }
};

export const getNdaComplianceChecks = (tenantId?: string): NdaComplianceCheckRecord[] => {
  const checks = getStoredNdaChecks();
  if (tenantId) {
    return checks.filter((c) => c.tenantId === tenantId);
  }
  return checks;
};

export const recordNdaComplianceAudit = (
  tenantId: string,
  tenantName: string,
  status: NdaComplianceCheckRecord['status'],
  ndaLicenseNumber: string,
  verificationNotes: string,
  checkerName: string = 'System Regulatory Auditor',
  nextReviewDate?: string
): NdaComplianceCheckRecord => {
  const checks = getStoredNdaChecks();
  const record: NdaComplianceCheckRecord = {
    id: `NDA-CHK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tenantId,
    tenantName,
    checkedBy: 'admin-user',
    checkerName,
    status,
    ndaLicenseNumber,
    verificationNotes,
    patientDataSafetyVerified: true,
    auditTrailVerified: true,
    nextReviewDate: nextReviewDate || new Date(Date.now() + 3600000 * 24 * 180).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  const updated = [record, ...checks];
  saveNdaChecksToStorage(updated);

  logSecurityAudit(
    'NDA_COMPLIANCE_AUDIT_CONDUCTED',
    `NDA compliance check recorded for ${tenantName} (${tenantId}). Status: ${status.toUpperCase()}. License: ${ndaLicenseNumber || 'N/A'}.`,
    checkerName
  );

  // Send notification to pharmacy
  sendSystemNotification({
    tenantId,
    title: `NDA Compliance Audit: ${status.toUpperCase()}`,
    message: `A regulatory compliance audit was recorded by ${checkerName}. Status: ${status}. Notes: ${verificationNotes}`,
    type: status === 'compliant' ? 'info' : 'compliance_notice',
    actionUrl: 'nda',
  });

  return record;
};

export const flagNdaNonCompliance = (
  tenantId: string,
  tenantName: string,
  reason: string,
  flaggedBy: string = 'System Compliance Engine'
): NdaComplianceCheckRecord => {
  return recordNdaComplianceAudit(
    tenantId,
    tenantName,
    'breach_flagged',
    'UNDER_INVESTIGATION',
    `FLAGGED NON-COMPLIANCE: ${reason}`,
    flaggedBy
  );
};

// Verify patient health data strict healthcare-only purpose
export const verifyPatientDataHealthPurposeAttestation = (tenantId: string, verifiedBy: string): boolean => {
  try {
    const attestations = JSON.parse(localStorage.getItem(STORAGE_KEY_PATIENT_DATA_PURPOSE) || '{}');
    attestations[tenantId] = {
      verifiedBy,
      verifiedAt: new Date().toISOString(),
      statutoryAct: 'Uganda Data Protection and Privacy Act 2019 & National Drug Authority Act Cap 206',
      purpose: 'Patient health records, medical dispensing history, and allergy tracking solely for clinical care.',
    };
    localStorage.setItem(STORAGE_KEY_PATIENT_DATA_PURPOSE, JSON.stringify(attestations));

    logSecurityAudit(
      'PATIENT_DATA_HEALTH_PURPOSE_ATTESTED',
      `Verified patient data processing in ${tenantId} is restricted strictly to healthcare purposes as mandated by NDA regulations.`,
      verifiedBy
    );
    return true;
  } catch (err) {
    console.error('Error attesting patient data purpose:', err);
    return false;
  }
};
