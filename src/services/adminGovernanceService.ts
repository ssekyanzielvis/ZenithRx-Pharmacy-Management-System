/**
 * adminGovernanceService.ts — System Admin Controls & Security Governance (§4.1 - §4.5)
 * Manages Dual-Control workflows, Circuit Breaker emergencies, Platform Policies, and PoLP Matrix.
 */

import { DualControlActionRequest, CircuitBreakerState, PlatformPolicySettings } from '../types';

const STORAGE_KEY_DUAL_CONTROL = 'zenithrx_dual_control_requests_v1';
const STORAGE_KEY_CIRCUIT_BREAKER = 'zenithrx_circuit_breaker_state_v1';
const STORAGE_KEY_PLATFORM_POLICIES = 'zenithrx_platform_policies_v1';

export const INITIAL_DUAL_CONTROL_REQUESTS: DualControlActionRequest[] = [
  {
    id: 'dc-001',
    actionType: 'TIER_DELETION',
    description: 'Decommission legacy Starter-Tier (UGX 85,000/mo) and migrate existing clients to Professional.',
    targetEntityId: 'tier-starter',
    initiatedByUserId: 'eng-001',
    initiatedByUserName: 'Arthur Ssenabulya (Lead Systems Architect)',
    initiatedByIp: '102.218.45.12',
    initiatedAt: '2026-08-04T15:20:00Z',
    status: 'APPROVED_AND_EXECUTED',
    approvedByUserId: 'eng-002',
    approvedByUserName: 'Elvis Sekyanzi (Principal Security Officer)',
    approvedAt: '2026-08-04T16:00:00Z',
  },
  {
    id: 'dc-002',
    actionType: 'GLOBAL_FEATURE_REVOCATION',
    description: 'Emergency temporary disablement of legacy SMS Gateway provider due to upstream telecom maintenance.',
    targetEntityId: 'service-sms-gw2',
    initiatedByUserId: 'eng-002',
    initiatedByUserName: 'Elvis Sekyanzi (Principal Security Officer)',
    initiatedByIp: '197.239.8.91',
    initiatedAt: '2026-08-05T11:15:00Z',
    status: 'PENDING_SECOND_APPROVAL',
  }
];

export const INITIAL_CIRCUIT_BREAKER: CircuitBreakerState = {
  globalEmergencyFreeze: false,
  isolatePosTransactions: false,
  isolatePaymentGateways: false,
  isolateAiServices: false,
  isolatedTenantIds: [],
  activeIncidentsCount: 0,
};

export const INITIAL_POLICIES: PlatformPolicySettings = {
  autoLockoutIdleMinutes: 15,
  enforce2FAForPharmacists: true,
  requireDoctorLicenceStrictValidation: true,
  enableEmergencyMaintenanceBanner: false,
  maintenanceMessage: 'Scheduled ring-0 database optimization in progress. POS counters remain operational offline.',
  ipWhitelistEnabled: false,
  whitelistedIps: ['102.218.45.12', '197.239.8.91', '41.210.142.6'],
  maxDailyPrescriptionDispensePerUser: 250,
  ndaYellowSheetAutoSubmit: true,
};

export const getDualControlRequests = (): DualControlActionRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DUAL_CONTROL);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DUAL_CONTROL, JSON.stringify(INITIAL_DUAL_CONTROL_REQUESTS));
      return INITIAL_DUAL_CONTROL_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DUAL_CONTROL_REQUESTS;
  }
};

export const requestDualControlAction = (
  action: Omit<DualControlActionRequest, 'id' | 'initiatedAt' | 'status'>
): DualControlActionRequest => {
  const all = getDualControlRequests();
  const newReq: DualControlActionRequest = {
    ...action,
    id: `dc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    initiatedAt: new Date().toISOString(),
    status: 'PENDING_SECOND_APPROVAL',
  };

  const updated = [newReq, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_DUAL_CONTROL, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to create dual control request', e);
  }
  return newReq;
};

export const approveDualControlAction = (
  requestId: string,
  approverId: string,
  approverName: string
): { success: boolean; message: string } => {
  const all = getDualControlRequests();
  const target = all.find(r => r.id === requestId);
  if (!target) return { success: false, message: 'Request not found.' };

  if (target.initiatedByUserId === approverId) {
    return {
      success: false,
      message: 'Dual-Control Hard Rule: You cannot approve your own action request. A second distinct super-admin must sign off.',
    };
  }

  const updatedTarget: DualControlActionRequest = {
    ...target,
    status: 'APPROVED_AND_EXECUTED',
    approvedByUserId: approverId,
    approvedByUserName: approverName,
    approvedAt: new Date().toISOString(),
  };

  const updated = all.map(r => r.id === requestId ? updatedTarget : r);
  try {
    localStorage.setItem(STORAGE_KEY_DUAL_CONTROL, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save dual control approval', e);
  }

  return { success: true, message: `Dual-control action "${target.actionType}" approved and executed successfully.` };
};

export const getCircuitBreakerState = (): CircuitBreakerState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CIRCUIT_BREAKER);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CIRCUIT_BREAKER, JSON.stringify(INITIAL_CIRCUIT_BREAKER));
      return INITIAL_CIRCUIT_BREAKER;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CIRCUIT_BREAKER;
  }
};

export const setCircuitBreakerState = (newState: Partial<CircuitBreakerState>, adminName: string): CircuitBreakerState => {
  const current = getCircuitBreakerState();
  const updated: CircuitBreakerState = {
    ...current,
    ...newState,
    lastTrippedAt: new Date().toISOString(),
    lastTrippedBy: adminName,
  };
  try {
    localStorage.setItem(STORAGE_KEY_CIRCUIT_BREAKER, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update circuit breaker', e);
  }
  return updated;
};

export const getPlatformPolicies = (): PlatformPolicySettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLATFORM_POLICIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PLATFORM_POLICIES, JSON.stringify(INITIAL_POLICIES));
      return INITIAL_POLICIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_POLICIES;
  }
};

export const updatePlatformPolicies = (policies: Partial<PlatformPolicySettings>): PlatformPolicySettings => {
  const current = getPlatformPolicies();
  const updated = { ...current, ...policies };
  try {
    localStorage.setItem(STORAGE_KEY_PLATFORM_POLICIES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save platform policies', e);
  }
  return updated;
};
