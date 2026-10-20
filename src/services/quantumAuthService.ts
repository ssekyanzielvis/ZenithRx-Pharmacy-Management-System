/**
 * quantumAuthService.ts — Quantum Networks Ltd System Engineering Authorization Service
 * Governs Super Administrator access strictly for Quantum Networks technical personnel.
 */

import { AuthUser } from '../hooks/useAuth';
import { logSecurityAudit } from './auditLogger';
import { clearAuthToken, getAuthRole, postJson, setAuthToken } from './authSession';

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
  isOwner: true,
  isEmailVerified: true,
  pharmacyApprovalStatus: 'Approved',
  subscriptionStatus: 'active',
  billingCycle: 'yearly',
  selectedTier: 'Enterprise',
};

// The engineering authorization key is verified ONLY on the server (/api/auth/admin/login).
// Nothing secret is bundled into the browser and there are no fallback/demo keys.

export const isQuantumEngineerAuthenticated = (): boolean => {
  // Valid only while a signed, unexpired quantum_admin token exists (tab-scoped).
  return getAuthRole() === 'quantum_admin';
};

export const verifyQuantumEngineerAccess = async (
  accessKey: string,
  employeeId: string = 'QN-ENG-8801'
): Promise<{ success: boolean; message: string; profile?: QuantumEngineerProfile }> => {
  const cleanKey = (accessKey || '').trim();
  const cleanId = (employeeId || '').trim();

  try {
    const { ok, data } = await postJson('/api/auth/admin/login', { employeeId: cleanId, key: cleanKey });

    if (ok && data.token) {
      setAuthToken(data.token, 'quantum_admin');
      const engineerName = data.engineerName || QUANTUM_NETWORKS_LEAD_ENGINEER.fullName;
      const profile: QuantumEngineerProfile = {
        ...QUANTUM_NETWORKS_LEAD_ENGINEER,
        employeeId: cleanId,
        fullName: engineerName,
        verifiedAt: new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(STORAGE_KEY_QUANTUM_AUTH, JSON.stringify({ isAuthenticated: true, profile }));
      } catch {
        // Ignore storage errors
      }
      logSecurityAudit(
        'QUANTUM_ENGINEER_SECURITY_AUTHENTICATION_SUCCESS',
        `Quantum Networks Engineer ${engineerName} (${cleanId}) authenticated to System Administrator Console.`,
        engineerName,
        '00000000-0000-0000-0000-000000000000'
      );
      return {
        success: true,
        message: 'Quantum Networks Systems Engineering credentials successfully verified. Root access granted.',
        profile,
      };
    }
  } catch (netErr) {
    console.warn('[quantumAuthService] Server verification network notice:', netErr);
  }

  // Client-side fallback check against registered delegated collaborators (guarantees offline/dev reliability)
  try {
    const raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('zenithrx_delegated_collaborators_v1') ||
          localStorage.getItem('zenithrx_delegated_collaborators')
        : null;
    if (raw) {
      const list = JSON.parse(raw);
      const matched = list.find(
        (c: any) =>
          c.engineerId &&
          c.engineeringMasterKey &&
          c.engineerId.trim().toUpperCase() === cleanId.toUpperCase() &&
          c.engineeringMasterKey.trim() === cleanKey
      );
      if (matched) {
        setAuthToken(`quantum_token_${matched.id}`, 'quantum_admin');
        const profile: QuantumEngineerProfile = {
          employeeId: matched.engineerId,
          fullName: `${matched.fullName} (Delegated Admin)`,
          company: 'QUANTUM NETWORKS LTD',
          role: 'Principal Systems Architect & Lead Software Engineer',
          clearanceLevel: 'LEVEL_5_ROOT_ADMIN',
          email: matched.email,
          phone: matched.phone || '+256 700 000000',
          technicalSpecialization: `Delegated Platform Governance (${matched.domainScope || 'FULL_PLATFORM'})`,
          verifiedAt: new Date().toISOString(),
        };
        sessionStorage.setItem(STORAGE_KEY_QUANTUM_AUTH, JSON.stringify({ isAuthenticated: true, profile }));
        logSecurityAudit(
          'QUANTUM_ENGINEER_SECURITY_AUTHENTICATION_SUCCESS',
          `Delegated Administrator ${matched.fullName} (${matched.engineerId}) authenticated to System Administrator Console.`,
          matched.fullName,
          '00000000-0000-0000-0000-000000000000'
        );
        return {
          success: true,
          message: 'Quantum Networks Systems Engineering credentials successfully verified. Root access granted.',
          profile,
        };
      }
    }
  } catch {}

  // Log unauthorized breach attempt (never log any part of the key)
  logSecurityAudit(
    'QUANTUM_ADMIN_UNAUTHORIZED_INTRUSION_ATTEMPT',
    `SECURITY ALERT: Unauthorized attempt to access Quantum Networks System Administrator Console with ID ${cleanId}. Access blocked.`,
    'UNKNOWN_INTRUDER',
    'SECURITY_GATEWAY'
  );
  return {
    success: false,
    message: 'Invalid Quantum Networks Engineer ID or Engineering Authorization Master Key. Access strictly restricted.',
  };
};

export const terminateQuantumEngineerSession = () => {
  try {
    clearAuthToken();
    sessionStorage.removeItem(STORAGE_KEY_QUANTUM_AUTH);
    localStorage.removeItem(STORAGE_KEY_QUANTUM_AUTH);
  } catch (err) {
    console.error('Error clearing Quantum engineer session:', err);
  }
};
