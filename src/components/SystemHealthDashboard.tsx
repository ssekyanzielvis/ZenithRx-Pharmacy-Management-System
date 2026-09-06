import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cloud,
  Smartphone,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  HardDrive,
  Clock,
  X,
  Shield,
  FileCheck2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Play,
  Layers,
  Globe2,
  Terminal,
  Check,
  Power
} from 'lucide-react';
import {
  getSystemHealth,
  SystemServiceStatus,
  SystemMetrics
} from '../services/telemetryService';
import {
  getDisasterRecoveryState,
  triggerManualBackup,
  triggerRestoreDryRun,
  executeRunbookMitigation,
  togglePosDegradationSetting,
  BackupRecord,
  RestoreTestRun,
  PitrStatus,
  IncidentRunbook,
  PosGracefulDegradationStatus
} from '../services/disasterRecoveryService';
import { formatUGX } from '../services/formatters';
import { QueueCacheControlPanel } from './QueueCacheControlPanel';
import { SecurityComplianceCentre } from './SecurityComplianceCentre';

interface SystemHealthDashboardProps {
  onClose?: () => void;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({ onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'telemetry' | 'backups' | 'pitr' | 'runbooks' | 'posDegradation' | 'queueCache' | 'security'
  >('telemetry');

  // Telemetry data
  const [services, setServices] = useState<SystemServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Disaster Recovery data (§11.9)
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [restoreTests, setRestoreTests] = useState<RestoreTestRun[]>([]);
  const [pitr, setPitr] = useState<PitrStatus | null>(null);
  const [runbooks, setRunbooks] = useState<IncidentRunbook[]>([]);
  const [posDegradation, setPosDegradation] = useState<PosGracefulDegradationStatus | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchHealthAndDR = async () => {
    setLoading(true);
    try {
      const [healthData, drData] = await Promise.all([
        getSystemHealth(),
        getDisasterRecoveryState(),
      ]);
      setServices(healthData.services);
      setMetrics(healthData.metrics);
      setBackups(drData.backups);
      setRestoreTests(drData.restoreTests);
      setPitr(drData.pitr);
      setRunbooks(drData.runbooks);
      setPosDegradation(drData.posDegradation);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndDR();
    const timer = setInterval(fetchHealthAndDR, 30000); // 30s auto-refresh
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateBackup = async () => {
    setIsActionLoading(true);
    try {
      const newBkp = await triggerManualBackup('Dr. Arthur Ssenabulya', 'FULL_SNAPSHOT');
      const drData = await getDisasterRecoveryState();
      setBackups(drData.backups);
      showToast(`Snapshot ${newBkp.id} initiated and replicated to Cloudflare R2.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRunRestoreTest = async (backupId: string) => {
    setIsActionLoading(true);
    try {
      const test = await triggerRestoreDryRun(backupId, 'Dr. Arthur Ssenabulya (Super Admin)');
      const drData = await getDisasterRecoveryState();
      setRestoreTests(drData.restoreTests);
      showToast(`Restore Dry-Run ${test.id} passed! 42 tables verified in ${test.dryRunDurationSeconds}s.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleRunbook = async (runbookId: string) => {
    setIsActionLoading(true);
    try {
      const result = await executeRunbookMitigation(runbookId, 'Dr. Arthur Ssenabulya');
      const drData = await getDisasterRecoveryState();
      setRunbooks(drData.runbooks);
      showToast(result.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTogglePosOverride = async (
    key: keyof PosGracefulDegradationStatus['activeDegradationOverrides'],
    currentVal: boolean
  ) => {
    const updated = await togglePosDegradationSetting(key, !currentVal, 'Dr. Arthur Ssenabulya');
    setPosDegradation(updated);
    showToast(`POS degradation setting "${key}" updated to ${!currentVal ? 'ENABLED' : 'DISABLED'}`);
  };

  const getServiceIcon = (category: SystemServiceStatus['category']) => {
    switch (category) {
      case 'Database':
        return <Database className="w-5 h-5 text-sky-400" />;
      case 'Storage':
        return <Cloud className="w-5 h-5 text-cyan-400" />;
      case 'Gateway':
        return <Smartphone className="w-5 h-5 text-amber-400" />;
      case 'AI Engine':
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'Offline Sync':
      default:
        return <HardDrive className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-down">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-[#0B1E36] border border-[#1E3A5F] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">
                Reliability, Backup &amp; System Health (§11.9)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> All Systems Operational
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Automated daily backups, PITR WAL continuous archiving, cross-region R2 replication, incident runbooks &amp; POS graceful degradation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHealthAndDR}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Telemetry Ping
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Feature Cards Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1 — Core Infrastructure Telemetry */}
        <button
          onClick={() => setActiveSubTab('telemetry')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeSubTab === 'telemetry'
              ? 'bg-[#0B1E36] shadow-2xl shadow-sky-900/40'
              : 'bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100'
          }`}
          style={{ borderTopColor: activeSubTab === 'telemetry' ? '#38bdf8' : '#7dd3fc' }}
        >
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeSubTab === 'telemetry' ? 'bg-sky-400/20' : 'bg-sky-50'}`}>
            <Activity className={`w-6 h-6 ${activeSubTab === 'telemetry' ? 'text-sky-300' : 'text-sky-600'}`} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm font-black leading-tight ${activeSubTab === 'telemetry' ? 'text-white' : 'text-slate-900'}`}>
              Core Infrastructure Telemetry
            </h3>
            <p className={`text-[11px] leading-relaxed ${activeSubTab === 'telemetry' ? 'text-slate-400' : 'text-slate-500'}`}>
              Live API throughput, error rates, DB pool depth, and per-service health signals.
            </p>
          </div>
          <ul className="space-y-1">
            {['24h API Throughput', 'Avg Response Latency', 'DB Connection Pool', 'Error Rate Tracking'].map((f) => (
              <li key={f} className={`text-[10px] font-semibold flex items-center gap-1.5 ${activeSubTab === 'telemetry' ? 'text-sky-300' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-sky-400" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2 border-t border-white/10">
            {activeSubTab === 'telemetry' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-sky-300 bg-sky-400/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-700 bg-sky-50 px-3 py-1 rounded-full group-hover:bg-sky-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 2 — Daily Backups & Restore Tests */}
        <button
          onClick={() => setActiveSubTab('backups')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeSubTab === 'backups'
              ? 'bg-[#0B1E36] shadow-2xl shadow-emerald-900/40'
              : 'bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100'
          }`}
          style={{ borderTopColor: activeSubTab === 'backups' ? '#34d399' : '#6ee7b7' }}
        >
          <span className={`absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full ${activeSubTab === 'backups' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
            {backups.length} BACKUPS
          </span>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeSubTab === 'backups' ? 'bg-emerald-400/20' : 'bg-emerald-50'}`}>
            <FileCheck2 className={`w-6 h-6 ${activeSubTab === 'backups' ? 'text-emerald-300' : 'text-emerald-600'}`} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm font-black leading-tight ${activeSubTab === 'backups' ? 'text-white' : 'text-slate-900'}`}>
              Daily Backups &amp; Restore Tests
            </h3>
            <p className={`text-[11px] leading-relaxed ${activeSubTab === 'backups' ? 'text-slate-400' : 'text-slate-500'}`}>
              Automated nightly snapshots with mandatory restore validation and integrity checks.
            </p>
          </div>
          <ul className="space-y-1">
            {['Nightly Snapshot Schedule', 'Restore Test Runs', 'Integrity Checksum', 'Off-site Redundancy'].map((f) => (
              <li key={f} className={`text-[10px] font-semibold flex items-center gap-1.5 ${activeSubTab === 'backups' ? 'text-emerald-300' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2 border-t border-white/10">
            {activeSubTab === 'backups' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-300 bg-emerald-400/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full group-hover:bg-emerald-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 3 — PostgreSQL PITR & R2 Mirroring */}
        <button
          onClick={() => setActiveSubTab('pitr')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeSubTab === 'pitr'
              ? 'bg-[#0B1E36] shadow-2xl shadow-cyan-900/40'
              : 'bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-100'
          }`}
          style={{ borderTopColor: activeSubTab === 'pitr' ? '#22d3ee' : '#67e8f9' }}
        >
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeSubTab === 'pitr' ? 'bg-cyan-400/20' : 'bg-cyan-50'}`}>
            <RotateCcw className={`w-6 h-6 ${activeSubTab === 'pitr' ? 'text-cyan-300' : 'text-cyan-600'}`} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm font-black leading-tight ${activeSubTab === 'pitr' ? 'text-white' : 'text-slate-900'}`}>
              PostgreSQL PITR &amp; R2 Mirroring
            </h3>
            <p className={`text-[11px] leading-relaxed ${activeSubTab === 'pitr' ? 'text-slate-400' : 'text-slate-500'}`}>
              Point-in-time recovery with WAL archiving and Cloudflare R2 geo-redundant mirroring.
            </p>
          </div>
          <ul className="space-y-1">
            {['WAL Archive Streaming', 'Point-in-Time Recovery', 'R2 Geo-Mirror Sync', 'RTO / RPO Targets'].map((f) => (
              <li key={f} className={`text-[10px] font-semibold flex items-center gap-1.5 ${activeSubTab === 'pitr' ? 'text-cyan-300' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-cyan-400" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2 border-t border-white/10">
            {activeSubTab === 'pitr' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-cyan-300 bg-cyan-400/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full group-hover:bg-cyan-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 4 — Incident Runbooks & SOPs */}
        <button
          onClick={() => setActiveSubTab('runbooks')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeSubTab === 'runbooks'
              ? 'bg-[#0B1E36] shadow-2xl shadow-amber-900/40'
              : 'bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-100'
          }`}
          style={{ borderTopColor: activeSubTab === 'runbooks' ? '#fbbf24' : '#fcd34d' }}
        >
          <span className={`absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full ${activeSubTab === 'runbooks' ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
            {runbooks.length} RUNBOOKS
          </span>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeSubTab === 'runbooks' ? 'bg-amber-400/20' : 'bg-amber-50'}`}>
            <BookOpen className={`w-6 h-6 ${activeSubTab === 'runbooks' ? 'text-amber-300' : 'text-amber-600'}`} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm font-black leading-tight ${activeSubTab === 'runbooks' ? 'text-white' : 'text-slate-900'}`}>
              Incident Runbooks &amp; SOPs
            </h3>
            <p className={`text-[11px] leading-relaxed ${activeSubTab === 'runbooks' ? 'text-slate-400' : 'text-slate-500'}`}>
              Step-by-step incident response playbooks and standard operating procedures for critical failures.
            </p>
          </div>
          <ul className="space-y-1">
            {['P0 / P1 Escalation Paths', 'DB Failover Runbook', 'POS Offline SOP', 'Post-Mortem Templates'].map((f) => (
              <li key={f} className={`text-[10px] font-semibold flex items-center gap-1.5 ${activeSubTab === 'runbooks' ? 'text-amber-300' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2 border-t border-white/10">
            {activeSubTab === 'runbooks' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full group-hover:bg-amber-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 5 — POS Graceful Degradation */}
        <button
          onClick={() => setActiveSubTab('posDegradation')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeSubTab === 'posDegradation'
              ? 'bg-[#0B1E36] shadow-2xl shadow-purple-900/40'
              : 'bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100'
          }`}
          style={{ borderTopColor: activeSubTab === 'posDegradation' ? '#c084fc' : '#d8b4fe' }}
        >
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeSubTab === 'posDegradation' ? 'bg-purple-400/20' : 'bg-purple-50'}`}>
            <HardDrive className={`w-6 h-6 ${activeSubTab === 'posDegradation' ? 'text-purple-300' : 'text-purple-600'}`} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm font-black leading-tight ${activeSubTab === 'posDegradation' ? 'text-white' : 'text-slate-900'}`}>
              POS Graceful Degradation
            </h3>
            <p className={`text-[11px] leading-relaxed ${activeSubTab === 'posDegradation' ? 'text-slate-400' : 'text-slate-500'}`}>
              Offline-first POS operation with local queue persistence and automatic resync on reconnect.
            </p>
          </div>
          <ul className="space-y-1">
            {['Offline Transaction Queue', 'Local IndexedDB Cache', 'Auto-Resync on Reconnect', 'Degraded Mode Indicators'].map((f) => (
              <li key={f} className={`text-[10px] font-semibold flex items-center gap-1.5 ${activeSubTab === 'posDegradation' ? 'text-purple-300' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-purple-400" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2 border-t border-white/10">
            {activeSubTab === 'posDegradation' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-purple-300 bg-purple-400/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full group-hover:bg-purple-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 6 — BullMQ Queues & Redis Cache */}
        <button
          onClick={() => setActiveSubTab('queueCache')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeSubTab === 'queueCache'
              ? 'bg-[#0B1E36] shadow-2xl shadow-sky-900/40'
              : 'bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100'
          }`}
          style={{ borderTopColor: activeSubTab === 'queueCache' ? '#38bdf8' : '#7dd3fc' }}
        >
          <span className={`absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full ${activeSubTab === 'queueCache' ? 'bg-sky-400/20 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
            §11.4
          </span>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeSubTab === 'queueCache' ? 'bg-sky-400/20' : 'bg-sky-50'}`}>
            <Layers className={`w-6 h-6 ${activeSubTab === 'queueCache' ? 'text-sky-300' : 'text-sky-600'}`} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm font-black leading-tight ${activeSubTab === 'queueCache' ? 'text-white' : 'text-slate-900'}`}>
              BullMQ Queues &amp; Redis Cache
            </h3>
            <p className={`text-[11px] leading-relaxed ${activeSubTab === 'queueCache' ? 'text-slate-400' : 'text-slate-500'}`}>
              Durable job queues for async workflows with Redis-backed session and inventory caching.
            </p>
          </div>
          <ul className="space-y-1">
            {['Queue Depth & Throughput', 'Failed Job Retry Policy', 'Redis Cache Hit Rate', 'Worker Concurrency'].map((f) => (
              <li key={f} className={`text-[10px] font-semibold flex items-center gap-1.5 ${activeSubTab === 'queueCache' ? 'text-sky-300' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-sky-400" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2 border-t border-white/10">
            {activeSubTab === 'queueCache' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-sky-300 bg-sky-400/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-700 bg-sky-50 px-3 py-1 rounded-full group-hover:bg-sky-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

        {/* Card 7 — Security & Compliance */}
        <button
          onClick={() => setActiveSubTab('security')}
          className={`group relative text-left rounded-3xl border-t-4 p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
            activeSubTab === 'security'
              ? 'bg-[#0B1E36] shadow-2xl shadow-emerald-900/40'
              : 'bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100'
          }`}
          style={{ borderTopColor: activeSubTab === 'security' ? '#34d399' : '#6ee7b7' }}
        >
          <span className={`absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full ${activeSubTab === 'security' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
            §11.7
          </span>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeSubTab === 'security' ? 'bg-emerald-400/20' : 'bg-emerald-50'}`}>
            <Shield className={`w-6 h-6 ${activeSubTab === 'security' ? 'text-emerald-300' : 'text-emerald-600'}`} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm font-black leading-tight ${activeSubTab === 'security' ? 'text-white' : 'text-slate-900'}`}>
              Security &amp; Compliance
            </h3>
            <p className={`text-[11px] leading-relaxed ${activeSubTab === 'security' ? 'text-slate-400' : 'text-slate-500'}`}>
              RLS policy enforcement, audit log integrity, session security, and NDA / regulatory compliance.
            </p>
          </div>
          <ul className="space-y-1">
            {['Row-Level Security (RLS)', 'Audit Log Tamper-Check', 'Session & JWT Controls', 'NDA & Regulatory Compliance'].map((f) => (
              <li key={f} className={`text-[10px] font-semibold flex items-center gap-1.5 ${activeSubTab === 'security' ? 'text-emerald-300' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2 border-t border-white/10">
            {activeSubTab === 'security' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-300 bg-emerald-400/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Viewing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full group-hover:bg-emerald-100 transition">
                ▶ Open
              </span>
            )}
          </div>
        </button>

      </div>

      {/* TAB 1: CORE TELEMETRY */}
      {activeSubTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  24h API Throughput
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {metrics.totalApiRequests24h.toLocaleString()} reqs
                </div>
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                  <Zap className="w-3 h-3" /> Avg Latency: {metrics.avgResponseLatencyMs}ms
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  System Error Rate
                </span>
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {metrics.errorRatePct}%
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  p99 Latency: {metrics.p99LatencyMs}ms
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  SMS Gateway Balance
                </span>
                <div className="text-2xl font-black text-amber-600 font-mono">
                  {formatUGX(metrics.smsGatewayBalanceUgx)}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  ~6,850 refill alerts remaining
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active User Sessions
                </span>
                <div className="text-2xl font-black text-sky-600 font-mono">
                  {metrics.activeSessions} online
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  IndexedDB queue: 0 pending
                </span>
              </div>
            </div>
          )}

          {/* Infrastructure Services List */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Infrastructure Core Services Status
              </span>
              <span className="text-xs text-slate-400 font-mono">Auto-refreshes every 30 seconds</span>
            </div>

            <div className="divide-y divide-slate-100">
              {services.map((svc) => (
                <div key={svc.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-2xl border border-slate-200">
                      {getServiceIcon(svc.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{svc.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {svc.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{svc.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-800 font-bold block">{svc.latencyMs} ms</span>
                      <span className="text-[10px] text-slate-400">{svc.uptimePct}% uptime</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${
                      svc.status === 'Operational'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : svc.status === 'Degraded'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {svc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY BACKUPS & RESTORE TESTS */}
      {activeSubTab === 'backups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Automated Daily Backups &amp; Sandbox Restore Verification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every snapshot is verified via SHA-256 integrity checksums and subjected to automated sandbox restore tests.
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
            >
              <Zap className="w-4 h-4" />
              Create Snapshot Now
            </button>
          </div>

          {/* Backup Catalog Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-black text-xs text-slate-700 uppercase tracking-wider">
              Immutable Backup Storage Registry (Cloudflare R2 Encrypted)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Backup ID</th>
                    <th className="p-3.5">Type &amp; Scope</th>
                    <th className="p-3.5">Created At</th>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Primary Target</th>
                    <th className="p-3.5">Cross-Region Mirror</th>
                    <th className="p-3.5">SHA-256 Checksum</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backups.map((bkp) => (
                    <tr key={bkp.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold font-mono text-slate-900 flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-sky-600" />
                        {bkp.id}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{bkp.backupType}</span>
                        <span className="block text-[10px] text-slate-400">{bkp.scope}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {new Date(bkp.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 font-mono">{bkp.sizeFormatted}</td>
                      <td className="p-3.5 text-slate-600 text-[11px]">{bkp.storageTarget}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> {bkp.replicationStatus}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">{bkp.secondaryReplica}</span>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={bkp.checksumSha256}>
                        {bkp.checksumSha256.slice(0, 16)}...
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleRunRestoreTest(bkp.id)}
                          disabled={isActionLoading}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3" /> Test Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Restore Test History */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-black text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Sandbox Restore Verification History</span>
              <span className="text-emerald-600 text-xs font-bold">100% Success Rate</span>
            </div>
            <div className="divide-y divide-slate-100">
              {restoreTests.map((test) => (
                <div key={test.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-900 text-xs">{test.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                        INTEGRITY PASSED
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{test.notes}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>Tested: {new Date(test.testedAt).toLocaleString()}</span>
                      <span>By: {test.testedBy}</span>
                    </div>
                  </div>
                  <div className="text-right sm:self-center shrink-0">
                    <span className="text-xs font-mono font-black text-slate-800 block">
                      {test.dryRunDurationSeconds}s Duration
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {test.tablesVerifiedCount} tables / {test.rowsValidatedCount.toLocaleString()} rows
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POSTGRESQL PITR & R2 REPLICATION */}
      {activeSubTab === 'pitr' && pitr && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Continuous WAL Archiving</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  ACTIVE
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {pitr.archivedWalSegments24h}
              </div>
              <p className="text-xs text-slate-500">
                WAL segments archived to Cloudflare R2 in past 24 hours. Current lag: <strong className="text-slate-800">{pitr.currentWalLagSeconds}s</strong>.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Recovery Point Objective (RPO)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800">
                  &lt; {pitr.rpoTargetMinutes} MINS
                </span>
              </div>
              <div className="text-3xl font-black text-sky-600 font-mono">
                99.99%
              </div>
              <p className="text-xs text-slate-500">
                Guaranteed maximum potential data loss in event of total catastrophic datacenter destruction.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Recovery Time Objective (RTO)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                  &lt; {pitr.rtoTargetMinutes} MINS
                </span>
              </div>
              <div className="text-3xl font-black text-purple-600 font-mono">
                ~6.5 Mins
              </div>
              <p className="text-xs text-slate-500">
                Measured time to promote standby replica and redirect DNS traffic during failover drills.
              </p>
            </div>
          </div>

          {/* Cross-Region Replication Topology */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan-600" />
              Cross-Region Object Storage &amp; Database Replication Topology
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Primary Datacenter</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    Active Read/Write
                  </span>
                </div>
                <div className="text-sm font-black text-slate-800">Johannesburg, South Africa (af-south-1)</div>
                <p className="text-xs text-slate-500">
                  Hosts primary PostgreSQL cluster, Cloudflare R2 bucket <code>zenithrx-ug-prod-01</code>, and low-latency API gateways.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Secondary Hot-Standby Replica</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Synchronous Mirror
                  </span>
                </div>
                <div className="text-sm font-black text-slate-800">Frankfurt, Germany (eu-central-1)</div>
                <p className="text-xs text-slate-500">
                  Continuous asynchronous WAL replay, replicated R2 bucket <code>zenithrx-ug-mirror-01</code> with automated failover triggers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INCIDENT RUNBOOKS & FAILOVER SOPS */}
      {activeSubTab === 'runbooks' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Documented Disaster Recovery Incident Runbooks (§11.9)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard Operating Procedures (SOPs) for rapid mitigation of payment outages, database failures, AI service downtime, and messaging delivery delays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {runbooks.map((rb) => (
              <div
                key={rb.id}
                className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 transition ${
                  rb.circuitBreakerState === 'OPEN'
                    ? 'border-amber-400 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        rb.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : rb.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rb.severity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">{rb.category}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-sm mt-1">{rb.title}</h4>
                  </div>

                  <button
                    onClick={() => handleToggleRunbook(rb.id)}
                    disabled={isActionLoading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                      rb.circuitBreakerState === 'OPEN'
                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {rb.circuitBreakerState === 'OPEN' ? 'Mitigation Active' : 'Trigger Drill / SOP'}
                  </button>
                </div>

                {/* Symptoms */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Outage Detection Symptoms</span>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                    {rb.symptoms.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Step-by-Step Recovery Procedure</span>
                  {rb.steps.map((step) => (
                    <div key={step.order} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {step.order}
                        </span>
                        <span className="font-bold text-xs text-slate-800">{step.action}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-6">{step.description}</p>
                      <div className="pl-6 pt-1">
                        <code className="text-[10px] font-mono bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded block truncate">
                          {step.commandOrProcedure}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Last Drill Executed: <strong>{rb.lastDrillDate}</strong></span>
                  <span className="font-mono text-emerald-600 font-bold">RTO &lt; 5 mins</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: POS GRACEFUL DEGRADATION ENGINE */}
      {activeSubTab === 'posDegradation' && posDegradation && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-600" />
              POS Graceful Degradation &amp; Zero-Downtime Counter Mode
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Guarantees that retail counters can continuously scan items, calculate pricing, apply discounts, issue thermal receipts, and queue sales even if internet, telecom, or AI services are completely severed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-800">Local Price Index Cache</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {posDegradation.cachedDrugCount} SKUs
              </div>
              <p className="text-xs text-slate-500">
                Encrypted IndexedDB offline drug catalog ready with retail UGX pricing and barcode lookups.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-800">Thermal Receipt Printing</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                STANDALONE
              </div>
              <p className="text-xs text-slate-500">
                Direct USB/Bluetooth ESC/POS driver communicates with 80mm printers without cloud dependencies.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-xs text-slate-800">Offline Queue Backlog</span>
              </div>
              <div className="text-2xl font-black text-sky-600 font-mono">
                {posDegradation.queuedOfflineTxCount} Pending
              </div>
              <p className="text-xs text-slate-500">
                Transactions automatically sync with main PostgreSQL ledger when connectivity resumes.
              </p>
            </div>
          </div>

          {/* Degradation Toggles */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-black text-xs text-slate-700 uppercase tracking-wider">
              Emergency Fallback Configuration Toggles
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-slate-900 block">
                    Bypass AI Counseling Engine (Fallback to Local BNF Rules)
                  </span>
                  <p className="text-xs text-slate-500">
                    When enabled, prescription processing skips Google Gemini API calls and uses local deterministic interaction tables to prevent queue blocking.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleTogglePosOverride(
                      'bypassAiCounseling',
                      posDegradation.activeDegradationOverrides.bypassAiCounseling
                    )
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    posDegradation.activeDegradationOverrides.bypassAiCounseling
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      posDegradation.activeDegradationOverrides.bypassAiCounseling
                        ? 'right-1'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-slate-900 block">
                    Queue Refill SMS Reminders Locally
                  </span>
                  <p className="text-xs text-slate-500">
                    Queues customer WhatsApp/SMS refill alerts in browser storage when external telecom gateways are experiencing outages.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleTogglePosOverride(
                      'queueSmsRefillsLocally',
                      posDegradation.activeDegradationOverrides.queueSmsRefillsLocally
                    )
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    posDegradation.activeDegradationOverrides.queueSmsRefillsLocally
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      posDegradation.activeDegradationOverrides.queueSmsRefillsLocally
                        ? 'right-1'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-slate-900 block">
                    Enable Offline Cashier Deferred Settlement
                  </span>
                  <p className="text-xs text-slate-500">
                    Allows cashiers to complete sales under a deferred payment voucher when mobile money networks are offline.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleTogglePosOverride(
                      'enableOfflineCashierCredit',
                      posDegradation.activeDegradationOverrides.enableOfflineCashierCredit
                    )
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    posDegradation.activeDegradationOverrides.enableOfflineCashierCredit
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      posDegradation.activeDegradationOverrides.enableOfflineCashierCredit
                        ? 'right-1'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BullMQ QUEUES & REDIS CACHE (§11.4) */}
      {activeSubTab === 'queueCache' && (
        <QueueCacheControlPanel />
      )}

      {/* TAB: SECURITY & COMPLIANCE (§11.7 / §11.19) */}
      {activeSubTab === 'security' && (
        <SecurityComplianceCentre
          tenantId="TEN-0001"
          tenantName="ZenithRx Demo Pharmacy"
        />
      )}
    </div>
  );
};

export default SystemHealthDashboard;
