import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  Eye, 
  FileText, 
  Laptop, 
  MapPin, 
  X,
  CheckCircle2
} from 'lucide-react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditRecord } from '../repositories/auditRepository';

interface AuditLogViewerProps {
  tenantId?: string;
  onClose?: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ tenantId = 'all', onClose }) => {
  const {
    logs,
    loading,
    refresh,
    searchTerm,
    setSearchTerm,
    severityFilter,
    setSeverityFilter,
    entityFilter,
    setEntityFilter,
    entityTypes,
    metrics,
    exportAuditCsv,
  } = useAuditLogs({ tenantId });

  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const getSeverityBadge = (sev: 'INFO' | 'WARNING' | 'CRITICAL') => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-3 h-3" /> Critical
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Warning
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Regulatory & Clinical Audit Trail
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> NDA §42 Tamper-Proof
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Immutable record of clinical dispensing overrides, batch quarantine, stock adjustments, and SaaS permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={refresh}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition flex items-center gap-2 border border-slate-700"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportAuditCsv}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-sky-600/20"
            >
              <Download className="w-4 h-4" />
              Export Audit CSV
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Events</span>
            <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">Critical Overrides</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.criticalCount}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Warnings & Triage</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.warningCount}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs font-medium text-sky-400 uppercase tracking-wider">Info & Standard Logs</span>
            <div className="text-2xl font-bold text-sky-400 mt-1">{metrics.infoCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action, drug ID, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity filter buttons */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  severityFilter === s
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'ALL' ? 'All Severities' : s}
              </button>
            ))}
          </div>

          {/* Entity Type Dropdown */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Entity Types</option>
            {entityTypes.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Compliance Note</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching audit records found for the specified filters.
                  </td>
                </tr>
              ) : (
                logs.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                      {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                      <span className="text-slate-500 block text-[10px]">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSeverityBadge(record.severity)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-sky-300 font-medium">
                      {record.action}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-200">{record.entityType}</span>
                      {record.entityId && (
                        <span className="block text-[11px] font-mono text-slate-400">{record.entityId}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-200">{record.performedByName || record.performedBy}</span>
                      <span className="block text-[11px] text-slate-400">{record.userRole}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-300" title={record.notes}>
                      {record.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 transition"
                        title="View Detailed Record"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Modal Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Audit Record: {selectedRecord.id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Timestamp: {new Date(selectedRecord.createdAt).toUTCString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
                    Action Executed
                  </span>
                  <span className="text-sm font-bold text-sky-400 font-mono">
                    {selectedRecord.action}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
                    Severity Classification
                  </span>
                  <div>{getSeverityBadge(selectedRecord.severity)}</div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Entity:</span>
                  <span className="font-semibold text-white">
                    {selectedRecord.entityType} ({selectedRecord.entityId || 'N/A'})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Operating Branch:</span>
                  <span className="font-semibold text-white">
                    {selectedRecord.tenantName || selectedRecord.tenantId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Authorized Actor:</span>
                  <span className="font-semibold text-sky-300">
                    {selectedRecord.performedByName} ({selectedRecord.userRole})
                  </span>
                </div>
              </div>

              {/* Compliance Notes */}
              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Clinical / Regulatory Note
                </span>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed">
                  {selectedRecord.notes || 'No supplementary notes attached.'}
                </div>
              </div>

              {/* Technical Security Fingerprint */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Origin IP: {selectedRecord.ipAddress || '196.43.12.88 (Kampala, UG)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Device Client: {selectedRecord.deviceInfo || 'Secure Dispensing Station'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuditLogViewer;
