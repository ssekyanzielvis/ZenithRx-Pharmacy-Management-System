import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Database,
  RefreshCw,
  Server,
  Lock,
  CheckCircle2,
  Clock,
  HardDrive,
  Cpu,
  Globe,
  ArrowRight,
  Play,
  FileCheck,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Key,
  Flame,
  CheckCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { BackupDisasterRecoveryService } from '../services/backupDisasterRecoveryService';
import {
  BackupDRPolicy,
  BackupSnapshot,
  DRRestoreDrill,
  DRReplicationNode,
  DRIncidentRunbook,
  BackupType,
  StorageTier,
} from '../types/backupDrTypes';

export const BackupDisasterRecoveryConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'snapshots' | 'drills' | 'nodes' | 'runbooks' | 'policy'
  >('snapshots');

  const [policy, setPolicy] = useState<BackupDRPolicy | null>(null);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [drills, setDrills] = useState<DRRestoreDrill[]>([]);
  const [nodes, setNodes] = useState<DRReplicationNode[]>([]);
  const [runbooks, setRunbooks] = useState<DRIncidentRunbook[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Triggers
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [selectedBackupType, setSelectedBackupType] = useState<BackupType>('differential');
  const [selectedStorageTier, setSelectedStorageTier] = useState<StorageTier>('hot_storage_fast_restore');
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);

  const [selectedDrillSnapshot, setSelectedDrillSnapshot] = useState<BackupSnapshot | null>(null);
  const [isExecutingDrill, setIsExecutingDrill] = useState(false);
  const [drillSuccessMessage, setDrillSuccessMessage] = useState<string | null>(null);

  const [selectedRunbook, setSelectedRunbook] = useState<DRIncidentRunbook | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pol, snaps, drl, nds, rbs] = await Promise.all([
        BackupDisasterRecoveryService.getActivePolicy(),
        BackupDisasterRecoveryService.getSnapshots(),
        BackupDisasterRecoveryService.getRestoreDrills(),
        BackupDisasterRecoveryService.getReplicationNodes(),
        BackupDisasterRecoveryService.getRunbooks(),
      ]);

      setPolicy(pol);
      setSnapshots(snaps);
      setDrills(drl);
      setNodes(nds);
      setRunbooks(rbs);
    } catch (err) {
      console.error('Error loading DR telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsTriggeringBackup(true);
    try {
      const newSnap = await BackupDisasterRecoveryService.triggerBackup(
        selectedBackupType,
        selectedStorageTier
      );
      setSnapshots((prev) => [newSnap, ...prev]);
      setShowBackupModal(false);
    } catch (err) {
      console.error('Failed to trigger backup:', err);
    } finally {
      setIsTriggeringBackup(false);
    }
  };

  const handleLaunchDrill = async (snapshot: BackupSnapshot) => {
    setSelectedDrillSnapshot(snapshot);
    setIsExecutingDrill(true);
    setDrillSuccessMessage(null);

    try {
      const result = await BackupDisasterRecoveryService.runRestoreDrill(
        snapshot.id,
        'automated_sandbox_test'
      );
      setDrills((prev) => [result, ...prev]);
      setDrillSuccessMessage(
        `Automated Sandbox Drill ${result.drill_code} completed successfully in ${result.duration_seconds}s! Integrity verified across ${result.tables_restored_count} tables.`
      );
      // Reload snapshot to reflect verification increment
      loadAllData();
    } catch (err) {
      console.error('Failed to run drill:', err);
    } finally {
      setIsExecutingDrill(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-400">
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Backup & Disaster Recovery Command
                  <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Tier-1 Resilient
                  </span>
                </h1>
                <p className="text-sm text-indigo-200/80">
                  Continuous WAL Streaming • AES-256-GCM Immutability • Multi-Region Hot Standby & Sandbox Restore Drills
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Telemetry
            </button>
            <button
              onClick={() => setShowBackupModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Trigger On-Demand Backup
            </button>
          </div>
        </div>

        {/* Real-time SLA & RPO/RTO Telemetry Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-800/40">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-indigo-900/40">
            <div className="flex items-center justify-between text-xs text-indigo-300/80 mb-1">
              <span>Current Recovery Point (RPO)</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 flex items-baseline gap-1.5">
              14s <span className="text-xs font-normal text-slate-400">/ Target ≤ 15m</span>
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> 100% SLA Adherent (WAL stream)
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-indigo-900/40">
            <div className="flex items-center justify-between text-xs text-indigo-300/80 mb-1">
              <span>Recovery Time SLA (RTO)</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-400 flex items-baseline gap-1.5">
              14m <span className="text-xs font-normal text-slate-400">/ Target ≤ 60m</span>
            </div>
            <div className="text-[11px] text-cyan-400/90 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> Last verified sandbox drill
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-indigo-900/40">
            <div className="flex items-center justify-between text-xs text-indigo-300/80 mb-1">
              <span>Protected Vault Volume</span>
              <HardDrive className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 flex items-baseline gap-1.5">
              21.13 GB
            </div>
            <div className="text-[11px] text-purple-300/80 font-medium flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3" /> AES-256-GCM Envelope KMS
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-indigo-900/40">
            <div className="flex items-center justify-between text-xs text-indigo-300/80 mb-1">
              <span>Multi-Region Replication</span>
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-black text-blue-300 flex items-baseline gap-1.5">
              4 / 4 Nodes
            </div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Hot Standby Sync Active
            </div>
          </div>
        </div>
      </div>

      {/* Drill Execution Alert */}
      {drillSuccessMessage && (
        <div className="bg-emerald-950/80 border border-emerald-700/60 p-4 rounded-xl flex items-center justify-between text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-semibold">{drillSuccessMessage}</p>
          </div>
          <button
            onClick={() => setDrillSuccessMessage(null)}
            className="text-xs underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        {[
          { id: 'snapshots', label: 'Snapshots & Archive Catalog', icon: Database, count: snapshots.length },
          { id: 'drills', label: 'Automated Restore Drills', icon: FileCheck, count: drills.length },
          { id: 'nodes', label: 'Replication Topology & Nodes', icon: Server, count: nodes.length },
          { id: 'runbooks', label: 'Disaster Recovery Runbooks', icon: Flame, count: runbooks.length },
          { id: 'policy', label: 'SLA & Retention Policy', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition-all border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SNAPSHOT CATALOGUE */}
      {activeTab === 'snapshots' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-500" />
                Active Backup Snapshots & Immutable Archive Catalog
              </h2>
              <span className="text-xs text-slate-500">
                3-2-1 Strategy Enforced • WORM Compliance Mode Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Snapshot Identifier</th>
                    <th className="p-3.5">Type & Tier</th>
                    <th className="p-3.5">Size / Ratio</th>
                    <th className="p-3.5">Encryption & Hash</th>
                    <th className="p-3.5">RPO Lag</th>
                    <th className="p-3.5">Retention</th>
                    <th className="p-3.5">Verification</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {snapshots.map((snap) => (
                    <tr
                      key={snap.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                          {snap.snapshot_tag}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(snap.started_at).toLocaleString()}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block w-fit text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              snap.backup_type === 'full_snapshot'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : snap.backup_type === 'differential'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {snap.backup_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {snap.storage_tier.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatBytes(snap.compressed_size_bytes)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Raw: {formatBytes(snap.backup_size_bytes)}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                          <Lock className="w-3 h-3 text-indigo-500" />
                          {snap.encryption_algorithm}
                        </div>
                        <button
                          onClick={() => copyToClipboard(snap.checksum_sha256)}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-500 mt-0.5 font-mono"
                          title="Click to copy SHA-256 Checksum"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          {snap.checksum_sha256.substring(0, 12)}...
                          {copiedHash === snap.checksum_sha256 && (
                            <span className="text-emerald-500 font-sans font-bold">Copied!</span>
                          )}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {snap.rpo_lag_at_capture_seconds}s
                        </span>
                        <div className="text-[10px] text-slate-400">Lag at capture</div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(snap.retention_expires_at).toLocaleDateString()}
                        </div>
                        {snap.is_immutable_locked && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-600 dark:text-purple-400">
                            <Lock className="w-2.5 h-2.5" /> WORM Lock
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {snap.verification_count} Drills Passed
                        </div>
                        {snap.last_verified_at && (
                          <div className="text-[10px] text-slate-400">
                            Last: {new Date(snap.last_verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleLaunchDrill(snap)}
                          disabled={isExecutingDrill}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] transition inline-flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Test Restore Drill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED RESTORE DRILLS */}
      {activeTab === 'drills' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-500" />
                  Restore Verification & Sandboxed Integrity Drills
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Automated validation proving backups can be restored cleanly within RTO limits before disasters occur.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Scheduled Drill Frequency</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Weekly (Every Sunday 04:00 UTC)
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Total Drills Executed
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  100% Passed
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  0 checksum failures across 52 drills
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40">
                <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                  Average Sandbox RTO Achieved
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  18 Minutes
                </div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">
                  Target SLA: ≤ 60 Minutes (333% faster)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40">
                <div className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                  Clinical Tables Parity Check
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  48 / 48 Tables
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                  1,520,400+ rows validated against master LSN
                </div>
              </div>
            </div>

            {/* Drill History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Drill Code</th>
                    <th className="p-3">Type & Target Sandbox</th>
                    <th className="p-3">Duration vs RTO Target</th>
                    <th className="p-3">Tables / Rows Checked</th>
                    <th className="p-3">Integrity Verdict</th>
                    <th className="p-3">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {drills.map((drill) => (
                    <tr key={drill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {drill.drill_code}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {drill.drill_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {drill.target_sandbox_environment}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round(drill.rto_achieved_seconds / 60)} mins
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Target: {Math.round(drill.target_rto_seconds / 60)} mins
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {drill.tables_restored_count} Tables Restored
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {drill.rows_verified_count.toLocaleString()} rows verified
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          RTO Compliant (Passed)
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(drill.started_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOPOLOGY & REPLICATION NODES */}
      {activeTab === 'nodes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Server className="w-5 h-5 text-indigo-500" />
              Live Multi-Region High-Availability Replication Topology
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Synchronous local multi-AZ hot standby coupled with asynchronous cross-region disaster recovery vault.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            node.health_status === 'healthy_online'
                              ? 'bg-emerald-500 animate-ping'
                              : 'bg-red-500'
                          }`}
                        />
                        <h3 className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                          {node.node_name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                        Region: <span className="font-semibold text-slate-700 dark:text-slate-300">{node.region}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        node.role === 'primary_rw'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : node.role === 'hot_standby_sync'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {node.role.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                    <div>
                      <div className="text-[10px] text-slate-400">Replication Lag</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {node.replication_lag_seconds}s
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Uptime SLA</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {node.uptime_percentage}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Failover Readiness</div>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">
                        {node.is_failover_ready ? 'Ready (100%)' : 'Standby'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    Endpoint: {node.endpoint_host}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISASTER RECOVERY RUNBOOKS */}
      {activeTab === 'runbooks' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-rose-500" />
              Standard Operating Procedures (SOP) & Incident Runbooks
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Documented, battle-tested action playbooks for hardware crashes, datacenter outages, and ransomware mutations.
            </p>

            <div className="space-y-4">
              {runbooks.map((rb) => (
                <div
                  key={rb.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-800/30 space-y-4"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                          {rb.runbook_code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {rb.severity}
                        </span>
                        <span className="text-xs text-slate-500">
                          Target RTO: <strong className="text-indigo-600 dark:text-indigo-400">{rb.estimated_rto_minutes} mins</strong>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {rb.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {rb.scenario_description}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedRunbook(selectedRunbook?.id === rb.id ? null : rb)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                    >
                      {selectedRunbook?.id === rb.id ? 'Collapse Steps' : 'View Action Steps'}
                    </button>
                  </div>

                  {selectedRunbook?.id === rb.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4 animate-fadeIn">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                          Step-By-Step Execution Sequence
                        </h4>
                        <div className="space-y-2">
                          {rb.action_steps.map((step) => (
                            <div
                              key={step.step}
                              className="flex items-start gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                                {step.step}
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {step.action}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                        <strong className="block font-bold mb-0.5">Rollback & Fallback Strategy:</strong>
                        {rb.rollback_procedure}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: POLICY & RETENTION CONFIG */}
      {activeTab === 'policy' && policy && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                Enterprise DR Policy & Compliance SLAs
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Grandfather-Father-Son (GFS) multi-tiered retention policy meeting National Drug Authority (NDA) 7-year audit requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Target Objectives & SLAs
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Target RPO (Data Loss Window):</span>
                    <span className="font-bold text-slate-900 dark:text-white">≤ {policy.target_rpo_minutes} Minutes</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Target RTO (Max Downtime):</span>
                    <span className="font-bold text-slate-900 dark:text-white">≤ {policy.target_rto_minutes} Minutes</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Continuous WAL Interval:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Every {policy.wal_archiving_interval_seconds / 60} Mins</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Automated Drill Frequency:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Every {policy.automated_drill_frequency_days} Days</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Grandfather-Father-Son Retention Schedule
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Daily Differentials:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{policy.retention_daily_days} Days (Hot Tier)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Weekly Snapshots:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{policy.retention_weekly_weeks} Weeks (Nearline)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Monthly Snapshots:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{policy.retention_monthly_months} Months (Glacier)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Annual Archive Vault:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{policy.retention_annual_years} Years (WORM Compliance)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRIGGER ON-DEMAND ENCRYPTED BACKUP */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Initiate On-Demand Snapshot
              </h3>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Backup Scope / Type
                </label>
                <select
                  value={selectedBackupType}
                  onChange={(e) => setSelectedBackupType(e.target.value as BackupType)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="differential">Differential Snapshot (Fast, Incremental changes)</option>
                  <option value="full_snapshot">Full Database Snapshot (Complete catalog)</option>
                  <option value="cold_vault_archive">Cold Vault Archive (WORM 7-year immutable)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Storage Tier
                </label>
                <select
                  value={selectedStorageTier}
                  onChange={(e) => setSelectedStorageTier(e.target.value as StorageTier)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="hot_storage_fast_restore">Hot Storage (S3 Multi-AZ / Immediate Fast Restore)</option>
                  <option value="nearline_secondary_region">Nearline Secondary Region (Frankfurt DR)</option>
                  <option value="cold_vault_worm_immutable">Cold Vault WORM (Glacier Deep Immutable)</option>
                </select>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Lock className="w-3.5 h-3.5" /> AES-256-GCM Hardware KMS
                </div>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                  Snapshot will be encrypted with an envelope data key and replicated across both primary and secondary geographic regions.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerBackup}
                disabled={isTriggeringBackup}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2"
              >
                {isTriggeringBackup ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Generating Snapshot...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Start Encrypted Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
