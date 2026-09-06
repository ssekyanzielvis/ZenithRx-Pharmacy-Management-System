/**
 * Bounded Context: Identity & Access Management (IAM) Service Layer
 * Complies with technical.md §11.6 & §11.22
 */

import { UserSessionDto, AuthenticateUserRequestDto, PermissionCheckResultDto, UserRole } from './types';
import { logAuditEvent } from '../../repositories/auditRepository';

export class IamService {
  /**
   * Evaluates if a role is permitted to perform an operation
   */
  static checkPermission(userRole: UserRole, allowedRoles: UserRole[]): PermissionCheckResultDto {
    if (userRole === 'Super Admin') {
      return { allowed: true };
    }
    const allowed = allowedRoles.includes(userRole);
    return {
      allowed,
      reason: allowed ? undefined : `Role '${userRole}' lacks required permissions. Requires: ${allowedRoles.join(', ')}`,
      requiredRole: allowedRoles,
    };
  }

  /**
   * Log an authentication attempt
   */
  static logLoginAudit(user: UserSessionDto, success: boolean, ipAddress?: string) {
    logAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user.userId,
      userFullName: user.fullName,
      userRole: user.role,
      tenantId: user.tenantId,
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      module: 'iam',
      details: `User ${user.username} (${user.role}) authentication ${success ? 'successful' : 'failed'}${ipAddress ? ` from ${ipAddress}` : ''}.`,
      outcome: success ? 'SUCCESS' : 'FAILURE',
      riskLevel: success ? 'LOW' : 'HIGH',
    });
  }
}
