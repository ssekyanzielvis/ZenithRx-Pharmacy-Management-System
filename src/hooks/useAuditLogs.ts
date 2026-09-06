/**
 * useAuditLogs.ts — ZenithRx Compliance Audit Logging Hook
 * Clean Architecture: Application Layer
 * Manages immutable audit trail queries, filters, search, and CSV export.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAuditLogs, logAuditEvent, AuditRecord, AuditEntry } from '../repositories/auditRepository';

export interface UseAuditLogsProps {
  tenantId?: string;
  userRole?: string;
}

export function useAuditLogs({ tenantId = 'all', userRole }: UseAuditLogsProps = {}) {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const records = await getAuditLogs(tenantId);
      setLogs(records);
    } catch (err) {
      console.error('[useAuditLogs] Failed loading audit records:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Unique entity types present in the logs
  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.entityType));
    return Array.from(set);
  }, [logs]);

  // Filtered audit records
  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return logs.filter((log) => {
      const matchesSearch =
        log.performedByName?.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        (log.entityId && log.entityId.toLowerCase().includes(q)) ||
        (log.notes && log.notes.toLowerCase().includes(q)) ||
        (log.userRole && log.userRole.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (severityFilter !== 'ALL' && log.severity !== severityFilter) {
        return false;
      }

      if (entityFilter !== 'ALL' && log.entityType !== entityFilter) {
        return false;
      }

      return true;
    });
  }, [logs, searchTerm, severityFilter, entityFilter]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = logs.length;
    const criticalCount = logs.filter((l) => l.severity === 'CRITICAL').length;
    const warningCount = logs.filter((l) => l.severity === 'WARNING').length;
    const infoCount = logs.filter((l) => l.severity === 'INFO').length;

    return {
      total,
      criticalCount,
      warningCount,
      infoCount,
    };
  }, [logs]);

  // Record a new audit event from the UI
  const recordEvent = useCallback(
    async (entry: AuditEntry) => {
      await logAuditEvent(entry);
      await fetchLogs();
    },
    [fetchLogs]
  );

  // Export audit logs as CSV
  const exportAuditCsv = useCallback(() => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'Audit ID',
      'Timestamp',
      'Tenant',
      'Performed By',
      'User Role',
      'Action',
      'Entity Type',
      'Entity ID',
      'Severity',
      'Notes',
      'IP / Device',
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.createdAt}"`,
      `"${l.tenantName || l.tenantId}"`,
      `"${l.performedByName || l.performedBy}"`,
      `"${l.userRole || ''}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityId || ''}"`,
      `"${l.severity}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenithrx_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  return {
    logs: filteredLogs,
    allLogs: logs,
    loading,
    refresh: fetchLogs,
    searchTerm,
    setSearchTerm,
    severityFilter,
    setSeverityFilter,
    entityFilter,
    setEntityFilter,
    entityTypes,
    metrics,
    recordEvent,
    exportAuditCsv,
  };
}
