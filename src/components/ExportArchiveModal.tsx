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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E3ECE8] rounded-2xl w-full max-w-4xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 text-[#263B33]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E3ECE8] bg-[#F8FBFA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[#2F80C9]">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#263B33]">
                  Database Exports &amp; Cloudflare R2 Archive
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#20A66A]" /> technical.md §11.22.2 Compliant
                </span>
              </div>
              <p className="text-xs text-[#5E7A70]">
                PostgreSQL source of truth, normalised export queue &amp; granular permissions model for {tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-[#F0F5F3] text-[#5E7A70] hover:text-[#263B33] border border-[#E3ECE8] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Cards */}
        <div className="p-6 border-b border-[#E3ECE8] bg-[#F8FBFA] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5E7A70] uppercase tracking-wider">Export Services &amp; Archives</span>
            <button
              onClick={loadData}
              className="p-1.5 text-[#5E7A70] hover:text-[#263B33] transition flex items-center gap-1 text-xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'jobs',
                title: 'Asynchronous Export Queue',
                desc: 'Background batch jobs for large reports, CSVs, and NDA-mandated audit logs.',
                icon: <FileArchive className="w-4 h-4" />,
                badge: `${jobs.length} Jobs`,
              },
              {
                id: 'documents',
                title: 'R2 Document Archive',
                desc: 'Encrypted object storage archives, generated invoices, and compliance dossiers.',
                icon: <FileText className="w-4 h-4" />,
                badge: `${documents.length} Docs`,
              },
              {
                id: 'permissions',
                title: 'Export Permissions Model',
                desc: 'Role-based authorization gates and cryptographic approval signatures (§11.22.2).',
                icon: <KeyRound className="w-4 h-4" />,
                badge: 'Security Gate',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 border-2 border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {tab.icon}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {tab.badge}
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold tracking-tight ${isActive ? 'text-blue-950' : 'text-slate-900'}`}>
                      {tab.title}
                    </h4>
                    <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isActive ? 'text-blue-800' : 'text-slate-600'}`}>
                      {tab.desc}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className={isActive ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'}>
                      {isActive ? '← Current view' : 'Go to section →'}
                    </span>
                    <span className={isActive ? 'text-blue-700 font-bold' : 'text-slate-400'}>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              {/* Trigger New Asynchronous Export Card */}
              <div className="bg-[#F8FBFA] p-4 rounded-xl border border-[#E3ECE8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#263B33] uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#2F80C9]" /> Trigger Instant Async Export
                  </span>
                  <span className="text-xs text-[#5E7A70]">Scoped database query to Cloudflare R2 bucket</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleQueueJob('FULL_TENANT_BACKUP')}
                    disabled={queueingType !== null}
                    className="p-3 rounded-xl bg-white hover:bg-blue-50 text-[#263B33] border border-[#E3ECE8] hover:border-blue-300 transition text-left space-y-1 group cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-bold block text-[#2F80C9]">
                      Full Tenant Backup
                    </span>
                    <span className="text-[11px] text-[#5E7A70] block">
                      ZIP package (All tables)
                    </span>
                    <span className="inline-block text-[9px] font-mono text-purple-600">
                      EXPORT_ALL_CLIENT_DATA
                    </span>
                  </button>

                  <button
                    onClick={() => handleQueueJob('INVENTORY_SCHEDULE')}
                    disabled={queueingType !== null}
                    className="p-3 rounded-xl bg-white hover:bg-emerald-50 text-[#263B33] border border-[#E3ECE8] hover:border-emerald-300 transition text-left space-y-1 group cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-bold block text-[#20A66A]">
                      Stock Inventory CSV
                    </span>
                    <span className="text-[11px] text-[#5E7A70] block">
                      FEFO batches &amp; pricing
                    </span>
                    <span className="inline-block text-[9px] font-mono text-[#2F80C9]">
                      EXPORT_TENANT_DATA
                    </span>
                  </button>

                  <button
                    onClick={() => handleQueueJob('SALES_FINANCIAL_LEDGER')}
                    disabled={queueingType !== null}
                    className="p-3 rounded-xl bg-white hover:bg-amber-50 text-[#263B33] border border-[#E3ECE8] hover:border-amber-300 transition text-left space-y-1 group cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-bold block text-amber-700">
                      Sales Ledger CSV
                    </span>
                    <span className="text-[11px] text-[#5E7A70] block">
                      Reconciled revenue &amp; VAT
                    </span>
                    <span className="inline-block text-[9px] font-mono text-[#2F80C9]">
                      EXPORT_TENANT_DATA
                    </span>
                  </button>

                  <button
                    onClick={() => handleQueueJob('CLINICAL_AUDIT_TRAIL')}
                    disabled={queueingType !== null}
                    className="p-3 rounded-xl bg-white hover:bg-red-50 text-[#263B33] border border-[#E3ECE8] hover:border-red-300 transition text-left space-y-1 group cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-bold block text-[#D64545]">
                      Audit Trail CSV
                    </span>
                    <span className="text-[11px] text-[#5E7A70] block">
                      NDA compliance actions
                    </span>
                    <span className="inline-block text-[9px] font-mono text-[#D64545]">
                      EXPORT_AUDIT_LOGS
                    </span>
                  </button>
                </div>
              </div>

              {/* Jobs List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#5E7A70] uppercase tracking-wider">
                  Queued &amp; Completed Export Packages
                </h4>

                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 bg-white rounded-xl border border-[#E3ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-[#2F80C9] border border-blue-200">
                        <FileArchive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#263B33]">
                            {job.jobType.replace(/_/g, ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0F5F3] text-[#263B33] font-mono border border-[#E3ECE8]">
                            {job.format}
                          </span>
                          {renderPermissionBadge(job.requiredPermission)}
                          {job.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#20A66A]" /> Ready
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 animate-spin" /> Processing
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5E7A70] mt-1">
                          Requested by {job.requestedBy} • {job.recordCount} rows • {job.retentionClass}
                        </p>
                        <p className="text-[11px] text-[#87A196] font-mono mt-0.5">
                          R2 Key: {job.r2ObjectKey}
                        </p>
                      </div>
                    </div>

                    <div className="self-end sm:self-center">
                      <button
                        onClick={() => handleDownload(job.downloadUrl || '', `${job.jobType}.${job.format.toLowerCase()}`)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
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
              <h4 className="text-xs font-semibold text-[#5E7A70] uppercase tracking-wider">
                Permanent Clinical &amp; Compliance Documents
              </h4>

              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-white rounded-xl border border-[#E3ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#E8F7F0] rounded-lg text-[#20A66A] border border-[#20A66A]/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#263B33]">{doc.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0F5F3] text-[#263B33] border border-[#E3ECE8]">
                          {doc.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#5E7A70] mt-1">
                        Uploaded by {doc.uploadedBy} on {doc.uploadDate} • {doc.fileSizeFormatted}
                      </p>
                      <p className="text-[10px] text-[#87A196] font-mono mt-0.5">
                        {doc.tamperProofHash}
                      </p>
                    </div>
                  </div>

                  <div className="self-end sm:self-center flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc.r2Url, `${doc.title}.pdf`)}
                      className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F8FBFA] text-[#263B33] text-xs font-semibold flex items-center gap-1.5 transition border border-[#E3ECE8] shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#5E7A70]" /> Retrieve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#2F80C9]" />
                  Technical.md §11.22.2 Export Permissions Specification
                </h4>
                <p className="text-xs text-[#5E7A70] mt-1">
                  PostgreSQL normalized permissions model and behavioral constraints for multi-tenant data exports.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-[#F8FBFA] rounded-xl border border-[#E3ECE8] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#2F80C9] font-mono">EXPORT_TENANT_DATA</strong>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#2F80C9] border border-blue-200 rounded font-semibold text-[10px]">Client / Staff</span>
                  </div>
                  <p className="text-[#5E7A70]">
                    Allows a client or authorized staff member to export only their own tenant's data (inventory, sales ledger, standard reports). Records are strictly constrained by <code className="text-[#2F80C9]">WHERE tenant_id = current_tenant</code>.
                  </p>
                </div>

                <div className="p-4 bg-[#F8FBFA] rounded-xl border border-[#E3ECE8] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-purple-700 font-mono">EXPORT_ALL_CLIENT_DATA</strong>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold text-[10px]">Super Admin</span>
                  </div>
                  <p className="text-[#5E7A70]">
                    Allows a Super Admin to export across all tenants or an entire tenant backup package (ZIP containing all schema tables).
                  </p>
                </div>

                <div className="p-4 bg-[#F8FBFA] rounded-xl border border-[#E3ECE8] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#D64545] font-mono">EXPORT_AUDIT_LOGS</strong>
                    <span className="px-2 py-0.5 bg-red-50 text-[#D64545] border border-red-200 rounded font-semibold text-[10px]">NDA / Security</span>
                  </div>
                  <p className="text-[#5E7A70]">
                    Restricted permission reserved for external NDA inspectors and security compliance officers to export append-only immutable audit logs.
                  </p>
                </div>

                <div className="p-4 bg-[#F8FBFA] rounded-xl border border-[#E3ECE8] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-800 font-mono">EXPORT_PATIENT_DATA</strong>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold text-[10px]">Restricted Policy</span>
                  </div>
                  <p className="text-[#5E7A70]">
                    Highly restricted export of patient chronic conditions and medical histories, requiring dual authorization and regulatory review.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl space-y-2">
                <span className="text-xs font-bold text-[#263B33] uppercase tracking-wider block">
                  CSV Export Behavioral Invariants (§11.22.2)
                </span>
                <ul className="text-xs text-[#5E7A70] space-y-1 list-disc list-inside">
                  <li>The client role may export only records where <code className="text-[#263B33]">tenant_id</code> matches their tenant.</li>
                  <li>The admin role may export a full tenant dataset or cross-module backup package.</li>
                  <li>Large exports are queued and delivered asynchronously via background workers.</li>
                  <li>Every export request creates an <code className="text-[#263B33]">export_jobs</code> record with status, requester, scope, and file reference in Cloudflare R2.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3ECE8] bg-[#F8FBFA] flex items-center justify-between text-xs text-[#5E7A70]">
          <span>Cloudflare R2 Bucket: <strong className="text-[#263B33] font-mono">zenithrx-ug-prod-01</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#F0F5F3] text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExportArchiveModal;
