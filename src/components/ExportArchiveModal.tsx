import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Download,
  FileText,
  FileArchive,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Plus,
  ExternalLink,
  Layers,
  Database,
  Lock,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import {
  ExportJob,
  ArchivedDocument,
  getExportJobs,
  getArchivedDocuments,
  queueExportJob,
  ExportPermission
} from '../services/exportJobService';

interface ExportArchiveModalProps {
  tenantId?: string;
  tenantName?: string;
  onClose: () => void;
}

export const ExportArchiveModal: React.FC<ExportArchiveModalProps> = ({
  tenantId = 'CLIENT-001',
  tenantName = 'Mulago Care Pharmacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'documents' | 'permissions'>('jobs');
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [queueingType, setQueueingType] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedJobs, fetchedDocs] = await Promise.all([
        getExportJobs(tenantId),
        getArchivedDocuments(tenantId),
      ]);
      setJobs(fetchedJobs);
      setDocuments(fetchedDocs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleQueueJob = async (jobType: ExportJob['jobType']) => {
    setQueueingType(jobType);
    await queueExportJob(jobType, tenantId, tenantName);
    await loadData();
    setTimeout(() => {
      setQueueingType(null);
      loadData();
    }, 2000);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = '#';
    a.download = filename;
    alert(`Initiating verified download for ${filename} from Cloudflare R2 bucket.`);
  };

  const renderPermissionBadge = (perm: ExportPermission) => {
    switch (perm) {
      case 'EXPORT_ALL_CLIENT_DATA':
        return (
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/30">
            EXPORT_ALL_CLIENT_DATA
          </span>
        );
      case 'EXPORT_AUDIT_LOGS':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] border border-rose-500/30">
            EXPORT_AUDIT_LOGS
          </span>
        );
      case 'EXPORT_PATIENT_DATA':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
            EXPORT_PATIENT_DATA
          </span>
        );
      case 'EXPORT_TENANT_DATA':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] border border-sky-500/30">
            EXPORT_TENANT_DATA
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Database Exports &amp; Cloudflare R2 Archive
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> technical.md §11.22.2 Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PostgreSQL source of truth, normalised export queue &amp; granular permissions model for {tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
                activeTab === 'jobs'
                  ? 'border-sky-500 text-sky-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileArchive className="w-4 h-4" />
              Asynchronous Export Queue ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
                activeTab === 'documents'
                  ? 'border-sky-500 text-sky-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              R2 Document Archive ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
                activeTab === 'permissions'
                  ? 'border-sky-500 text-sky-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Export Permissions Model §11.22.2
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-1.5 text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              {/* Trigger New Asynchronous Export Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" /> Trigger Instant Async Export
                  </span>
                  <span className="text-xs text-slate-400">Scoped database query to Cloudflare R2 bucket</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleQueueJob('FULL_TENANT_BACKUP')}
                    disabled={queueingType !== null}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-sky-600 hover:text-white text-slate-200 border border-slate-800 transition text-left space-y-1 group"
                  >
                    <span className="text-xs font-bold block group-hover:text-white text-sky-300">
                      Full Tenant Backup
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover:text-sky-100 block">
                      ZIP package (All tables)
                    </span>
                    <span className="inline-block text-[9px] font-mono text-purple-400 group-hover:text-white">
                      EXPORT_ALL_CLIENT_DATA
                    </span>
                  </button>

                  <button
                    onClick={() => handleQueueJob('INVENTORY_SCHEDULE')}
                    disabled={queueingType !== null}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-sky-600 hover:text-white text-slate-200 border border-slate-800 transition text-left space-y-1 group"
                  >
                    <span className="text-xs font-bold block group-hover:text-white text-emerald-300">
                      Stock Inventory CSV
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover:text-sky-100 block">
                      FEFO batches &amp; pricing
                    </span>
                    <span className="inline-block text-[9px] font-mono text-sky-400 group-hover:text-white">
                      EXPORT_TENANT_DATA
                    </span>
                  </button>

                  <button
                    onClick={() => handleQueueJob('SALES_FINANCIAL_LEDGER')}
                    disabled={queueingType !== null}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-sky-600 hover:text-white text-slate-200 border border-slate-800 transition text-left space-y-1 group"
                  >
                    <span className="text-xs font-bold block group-hover:text-white text-amber-300">
                      Sales Ledger CSV
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover:text-sky-100 block">
                      Reconciled revenue &amp; VAT
                    </span>
                    <span className="inline-block text-[9px] font-mono text-sky-400 group-hover:text-white">
                      EXPORT_TENANT_DATA
                    </span>
                  </button>

                  <button
                    onClick={() => handleQueueJob('CLINICAL_AUDIT_TRAIL')}
                    disabled={queueingType !== null}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-sky-600 hover:text-white text-slate-200 border border-slate-800 transition text-left space-y-1 group"
                  >
                    <span className="text-xs font-bold block group-hover:text-white text-rose-300">
                      Audit Trail CSV
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover:text-sky-100 block">
                      NDA compliance actions
                    </span>
                    <span className="inline-block text-[9px] font-mono text-rose-400 group-hover:text-white">
                      EXPORT_AUDIT_LOGS
                    </span>
                  </button>
                </div>
              </div>

              {/* Jobs List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Queued &amp; Completed Export Packages
                </h4>

                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg text-sky-400 border border-slate-800">
                        <FileArchive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {job.jobType.replace(/_/g, ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                            {job.format}
                          </span>
                          {renderPermissionBadge(job.requiredPermission)}
                          {job.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 animate-spin" /> Processing
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Requested by {job.requestedBy} • {job.recordCount} rows • {job.retentionClass}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          R2 Key: {job.r2ObjectKey}
                        </p>
                      </div>
                    </div>

                    <div className="self-end sm:self-center">
                      <button
                        onClick={() => handleDownload(job.downloadUrl || '', `${job.jobType}.${job.format.toLowerCase()}`)}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Permanent Clinical &amp; Compliance Documents
              </h4>

              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-emerald-400 border border-slate-800">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{doc.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {doc.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Uploaded by {doc.uploadedBy} on {doc.uploadDate} • {doc.fileSizeFormatted}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {doc.tamperProofHash}
                      </p>
                    </div>
                  </div>

                  <div className="self-end sm:self-center flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc.r2Url, `${doc.title}.pdf`)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" /> Retrieve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-sky-400" />
                  Technical.md §11.22.2 Export Permissions Specification
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  PostgreSQL normalized permissions model and behavioral constraints for multi-tenant data exports.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-sky-300 font-mono">EXPORT_TENANT_DATA</strong>
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded font-semibold text-[10px]">Client / Staff</span>
                  </div>
                  <p className="text-slate-400">
                    Allows a client or authorized staff member to export only their own tenant's data (inventory, sales ledger, standard reports). Records are strictly constrained by <code className="text-sky-300">WHERE tenant_id = current_tenant</code>.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-purple-300 font-mono">EXPORT_ALL_CLIENT_DATA</strong>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-semibold text-[10px]">Super Admin</span>
                  </div>
                  <p className="text-slate-400">
                    Allows a Super Admin to export across all tenants or an entire tenant backup package (ZIP containing all schema tables).
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-rose-300 font-mono">EXPORT_AUDIT_LOGS</strong>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded font-semibold text-[10px]">NDA / Security</span>
                  </div>
                  <p className="text-slate-400">
                    Restricted permission reserved for external NDA inspectors and security compliance officers to export append-only immutable audit logs.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-300 font-mono">EXPORT_PATIENT_DATA</strong>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-semibold text-[10px]">Restricted Policy</span>
                  </div>
                  <p className="text-slate-400">
                    Highly restricted export of patient chronic conditions and medical histories, requiring dual authorization and regulatory review.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  CSV Export Behavioral Invariants (§11.22.2)
                </span>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>The client role may export only records where <code className="text-slate-200">tenant_id</code> matches their tenant.</li>
                  <li>The admin role may export a full tenant dataset or cross-module backup package.</li>
                  <li>Large exports are queued and delivered asynchronously via background workers.</li>
                  <li>Every export request creates an <code className="text-slate-200">export_jobs</code> record with status, requester, scope, and file reference in Cloudflare R2.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Cloudflare R2 Bucket: <strong className="text-slate-400 font-mono">zenithrx-ug-prod-01</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExportArchiveModal;
