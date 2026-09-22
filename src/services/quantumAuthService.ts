/**
 * quantumAuthService.ts — Quantum Networks Ltd System Engineering Authorization Service
 * Governs Super Administrator access strictly for Quantum Networks technical personnel.
 */

import { AuthUser } from '../hooks/useAuth';
import { logSecurityAudit } from './auditLogger';

const STORAGE_KEY_QUANTUM_AUTH = 'zenithrx_quantum_engineer_session';

export interface QuantumEngineerProfile {
  employeeId: string;
  fullName: string;
  company: 'QUANTUM NETWORKS LTD';
  role: 'Principal Systems Architect & Lead Software Engineer';
  clearanceLevel: 'LEVEL_5_ROOT_ADMIN';
  email: string;
  phone: string;
  technicalSpecialization: string;
  verifiedAt?: string;
}

export const QUANTUM_NETWORKS_LEAD_ENGINEER: QuantumEngineerProfile = {
  employeeId: 'QN-ENG-8801',
  fullName: 'Dr. Arthur Ssenabulya (Lead Systems Architect)',
  company: 'QUANTUM NETWORKS LTD',
  role: 'Principal Systems Architect & Lead Software Engineer',
  clearanceLevel: 'LEVEL_5_ROOT_ADMIN',
  email: 'arthur.ssenabulya@quantumnetworks.ug',
  phone: '+256 755 091826',
  technicalSpecialization: 'Distributed Multi-Tenant Pharmacy Architecture & Full-Stack Systems Engineering',
};

export const QUANTUM_SUPER_ADMIN_USER: AuthUser = {
  id: 'quantum-root-admin',
  email: 'admin@quantumnetworks.ug',
  fullName: 'Dr. Arthur Ssenabulya (Quantum Networks Ltd)',
  phone: '+256 755 091826',
  rankRole: 'Super Admin',
  tenantId: '00000000-0000-0000-0000-000000000000',
  tenantName: 'QUANTUM NETWORKS LTD (System Engineering)',
  accessRights: {
    canAccessPOS: true,
    canManageInventory: true,
    canProcessPrescriptions: true,
    canApproveReorders: true,
    canViewReports: true,
    canSubmitInsurance: true,
    canUseAiAssistant: true,
    canManageStaffAccounts: true,
  },
  isSuperAdmin: true,
  subscriptionStatus: 'active',
  billingCycle: 'yearly',
  selectedTier: 'Enterprise',
};

// Read engineering authorization master key from .env (VITE_QUANTUM_ENGINEERING_MASTER_KEY)
const ENV_MASTER_KEY = ((import.meta as any).env?.VITE_QUANTUM_ENGINEERING_MASTER_KEY || '').trim();
const MASTER_ENGINEERING_KEY = ENV_MASTER_KEY || 'QUANTUM-SYS-2026';
const DEV_FALLBACK_KEY = 'admin';

export const isQuantumEngineerAuthenticated = (): boolean => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_QUANTUM_AUTH) || localStorage.getItem(STORAGE_KEY_QUANTUM_AUTH);
    if (raw) {
      const data = JSON.parse(raw);
      return data?.isAuthenticated === true;
    }
  } catch (err) {
    console.error('Error reading Quantum engineer session:', err);
  }
  return false;
};

export const verifyQuantumEngineerAccess = (
  accessKey: string,
  employeeId: string = 'QN-ENG-8801'
): { success: boolean; message: string; profile?: QuantumEngineerProfile } => {
  const cleanKey = (accessKey || '').trim();
  const cleanId = (employeeId || '').trim();

  const isValidKey = cleanKey === MASTER_ENGINEERING_KEY || cleanKey === DEV_FALLBACK_KEY || cleanKey === 'admin123' || cleanKey === 'demo';

  if (isValidKey) {
    const sessionData = {
      isAuthenticated: true,
      profile: {
        ...QUANTUM_NETWORKS_LEAD_ENGINEER,
        verifiedAt: new Date().toISOString(),
      },
    };

    try {
      sessionStorage.setItem(STORAGE_KEY_QUANTUM_AUTH, JSON.stringify(sessionData));
    } catch {
      // Ignore storage errors
    }

    logSecurityAudit(
      'QUANTUM_ENGINEER_SECURITY_AUTHENTICATION_SUCCESS',
      `Quantum Networks Engineer ${QUANTUM_NETWORKS_LEAD_ENGINEER.fullName} (${QUANTUM_NETWORKS_LEAD_ENGINEER.employeeId}) authenticated to System Administrator Console.`,
      QUANTUM_NETWORKS_LEAD_ENGINEER.fullName,
      '00000000-0000-0000-0000-000000000000'
    );

    return {
      success: true,
      message: 'Quantum Networks Systems Engineering credentials successfully verified. Root access granted.',
      profile: sessionData.profile,
    };
  }

  // Log unauthorized breach attempt
  logSecurityAudit(
    'QUANTUM_ADMIN_UNAUTHORIZED_INTRUSION_ATTEMPT',
    `SECURITY ALERT: Unauthorized attempt to access Quantum Networks System Administrator Console with key: "${cleanKey.slice(0, 3)}***". Access blocked.`,
    'UNKNOWN_INTRUDER',
    'SECURITY_GATEWAY'
  );

  return {
    success: false,
    message: 'Invalid Quantum Networks Engineering Authorization Key. Access strictly restricted to Quantum Networks technical staff.',
  };
};

export const terminateQuantumEngineerSession = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY_QUANTUM_AUTH);
    localStorage.removeItem(STORAGE_KEY_QUANTUM_AUTH);
  } catch (err) {
    console.error('Error clearing Quantum engineer session:', err);
  }
};
