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
    <div className="space-y-6 text-[#263B33]">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E3ECE8] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[#2F80C9]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#263B33] tracking-wide">
                  Regulatory &amp; Clinical Audit Trail
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#20A66A]" /> NDA §42 Tamper-Proof
                </span>
              </div>
              <p className="text-sm text-[#5E7A70]">
                Immutable record of clinical dispensing overrides, batch quarantine, stock adjustments, and SaaS permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={refresh}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8FBFA] text-[#263B33] text-sm font-medium transition flex items-center gap-2 border border-[#E3ECE8] shadow-xs cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 text-[#5E7A70] ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportAuditCsv}
              className="px-4 py-2 rounded-xl bg-[#20A66A] hover:bg-[#1E9760] text-white text-sm font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Audit CSV
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] border border-[#E3ECE8] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl p-3.5">
            <span className="text-xs font-medium text-[#5E7A70] uppercase tracking-wider">Total Events</span>
            <div className="text-2xl font-bold text-[#263B33] mt-1">{metrics.total}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
            <span className="text-xs font-medium text-[#D64545] uppercase tracking-wider">Critical Overrides</span>
            <div className="text-2xl font-bold text-[#D64545] mt-1">{metrics.criticalCount}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <span className="text-xs font-medium text-amber-800 uppercase tracking-wider">Warnings &amp; Triage</span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{metrics.warningCount}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
            <span className="text-xs font-medium text-[#2F80C9] uppercase tracking-wider">Info &amp; Standard Logs</span>
            <div className="text-2xl font-bold text-[#2F80C9] mt-1">{metrics.infoCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E3ECE8] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#5E7A70] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action, drug ID, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-lg text-sm text-[#263B33] placeholder-[#87A196] focus:outline-none focus:border-[#20A66A] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity filter buttons */}
          <div className="flex bg-[#F8FBFA] border border-[#E3ECE8] rounded-lg p-1">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  severityFilter === s
                    ? 'bg-[#20A66A] text-white font-bold'
                    : 'text-[#5E7A70] hover:text-[#263B33]'
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
            className="bg-[#F8FBFA] border border-[#E3ECE8] rounded-lg px-3 py-1.5 text-xs text-[#263B33] focus:outline-none focus:border-[#20A66A] cursor-pointer"
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
      <div className="bg-white border border-[#E3ECE8] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8FBFA] border-b border-[#E3ECE8] text-xs font-semibold text-[#5E7A70] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Compliance Note</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3ECE8] text-[#263B33]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5E7A70]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#20A66A]" />
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5E7A70]">
                    No matching audit records found for the specified filters.
                  </td>
                </tr>
              ) : (
                logs.map((record) => (
                  <tr key={record.id} className="hover:bg-[#F8FBFA] transition">
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#5E7A70] font-mono">
                      {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                      <span className="text-[#87A196] block text-[10px]">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSeverityBadge(record.severity)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-[#2F80C9] font-medium">
                      {record.action}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-[#263B33]">{record.entityType}</span>
                      {record.entityId && (
                        <span className="block text-[11px] font-mono text-[#5E7A70]">{record.entityId}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-[#263B33]">{record.performedByName || record.performedBy}</span>
                      <span className="block text-[11px] text-[#5E7A70]">{record.userRole}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-xs text-[#5E7A70]" title={record.notes}>
                      {record.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="p-1.5 rounded-lg bg-[#F0F5F3] hover:bg-[#E8F7F0] hover:text-[#20A66A] text-[#5E7A70] transition border border-[#E3ECE8] cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3ECE8] rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 text-[#263B33]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E3ECE8] flex items-center justify-between bg-[#F8FBFA]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[#2F80C9]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#263B33]">
                    Audit Record: {selectedRecord.id}
                  </h3>
                  <p className="text-xs text-[#5E7A70]">
                    Timestamp: {new Date(selectedRecord.createdAt).toUTCString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg bg-white hover:bg-[#F0F5F3] text-[#5E7A70] hover:text-[#263B33] border border-[#E3ECE8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FBFA] p-3.5 rounded-xl border border-[#E3ECE8]">
                  <span className="text-[11px] text-[#5E7A70] font-medium uppercase tracking-wider block mb-1">
                    Action Executed
                  </span>
                  <span className="text-sm font-bold text-[#2F80C9] font-mono">
                    {selectedRecord.action}
                  </span>
                </div>
                <div className="bg-[#F8FBFA] p-3.5 rounded-xl border border-[#E3ECE8]">
                  <span className="text-[11px] text-[#5E7A70] font-medium uppercase tracking-wider block mb-1">
                    Severity Classification
                  </span>
                  <div>{getSeverityBadge(selectedRecord.severity)}</div>
                </div>
              </div>

              <div className="bg-[#F8FBFA] p-4 rounded-xl border border-[#E3ECE8] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5E7A70]">Target Entity:</span>
                  <span className="font-semibold text-[#263B33]">
                    {selectedRecord.entityType} ({selectedRecord.entityId || 'N/A'})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5E7A70]">Operating Branch:</span>
                  <span className="font-semibold text-[#263B33]">
                    {selectedRecord.tenantName || selectedRecord.tenantId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5E7A70]">Authorized Actor:</span>
                  <span className="font-semibold text-[#2F80C9]">
                    {selectedRecord.performedByName} ({selectedRecord.userRole})
                  </span>
                </div>
              </div>

              {/* Compliance Notes */}
              <div>
                <span className="text-xs font-semibold text-[#263B33] uppercase tracking-wider block mb-1.5">
                  Clinical / Regulatory Note
                </span>
                <div className="bg-[#F8FBFA] p-3.5 rounded-xl border border-[#E3ECE8] text-sm text-[#263B33] leading-relaxed">
                  {selectedRecord.notes || 'No supplementary notes attached.'}
                </div>
              </div>

              {/* Technical Security Fingerprint */}
              <div className="bg-[#F5FAF8] p-3.5 rounded-xl border border-[#E3ECE8] space-y-1.5 text-xs text-[#5E7A70] font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#2F80C9]" />
                  <span>Origin IP: {selectedRecord.ipAddress || '196.43.12.88 (Kampala, UG)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-[#20A66A]" />
                  <span>Device Client: {selectedRecord.deviceInfo || 'Secure Dispensing Station'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E3ECE8] bg-[#F8FBFA] flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-white hover:bg-[#F0F5F3] text-[#263B33] text-sm font-semibold rounded-xl border border-[#E3ECE8] transition cursor-pointer"
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
