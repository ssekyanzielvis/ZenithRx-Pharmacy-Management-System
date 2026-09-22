import { logAuditEvent } from '../repositories/auditRepository';
import { AuditAction } from '../lib/database.types';

export const logSecurityAudit = (
  actionName: string,
  details: string,
  actor: string = 'system',
  tenantId: string = 'client-1'
) => {
  logAuditEvent({
    tenantId,
    performedBy: actor,
    performedByName: actor,
    userRole: actor.includes('Admin') ? 'System Administrator' : 'Staff',
    action: (actionName as AuditAction) || ('SYSTEM_ALERT' as AuditAction),
    entityType: 'Security & Plan Governance',
    notes: details,
    severity: actionName.includes('CRITICAL') || actionName.includes('RESTRICTION') || actionName.includes('BREACH') ? 'CRITICAL' : 'INFO',
  }).catch((err) => {
    console.warn('[auditLogger] Failed to write audit:', err);
  });
};
