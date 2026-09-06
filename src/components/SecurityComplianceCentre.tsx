import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Users,
  Key,
  Database,
  Zap,
  FileText,
  Globe,
  Fingerprint,
  RefreshCw,
} from 'lucide-react';
import {
  SecurityHardeningService,
  SecurityEvent,
  SecurityRiskLevel,
  RateLimitStatus,
} from '../services/securityHardeningService';
import { StatCard } from './ui/StatCard';

interface SecurityComplianceCentreProps {
  tenantId: string;
  tenantName?: string;
}

type SecurityTab = 'overview' | 'events' | 'mfa' | 'rateLimit';

function RiskBadge({ level }: { level: SecurityRiskLevel }) {
  const colors = SecurityHardeningService.getRiskColor(level);
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors.badge}`}>
      {level}
    </span>
  );
}

function ComplianceCheckRow({
  label,
  passed,
  detail,
}: {
  label: string;
  passed: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2.5">
        {passed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        )}
        <div>
          <span className="text-xs font-bold text-slate-900">{label}</span>
          {detail && <p className="text-[11px] text-slate-400">{detail}</p>}
        </div>
      </div>
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
          passed
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {passed ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
}

export const SecurityComplianceCentre: React.FC<SecurityComplianceCentreProps> = ({
  tenantId,
  tenantName = 'ZenithRx Pharmacy',
}) => {
  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');

  const report = useMemo(() => SecurityHardeningService.generateComplianceReport(tenantId), [tenantId]);
  const mfaStatus = useMemo(() => SecurityHardeningService.getMfaControlStatus(), []);
  const sessionPolicy = useMemo(() => SecurityHardeningService.getSessionPolicy(), []);
  const events = useMemo(() => SecurityHardeningService.getRecentSecurityEvents(10), []);
  const rateLimits = useMemo(() => SecurityHardeningService.getRateLimitStatus(), []);

  const criticalEvents = events.filter((e) => e.riskLevel === 'CRITICAL' || e.riskLevel === 'HIGH');
  const pendingReview = events.filter((e) => e.requiresReview);

  const scoreColor =
    report.overallScore >= 85
      ? 'text-emerald-600'
      : report.overallScore >= 70
      ? 'text-amber-500'
      : 'text-red-600';

  const scoreRing =
    report.overallScore >= 85
      ? 'border-emerald-400'
      : report.overallScore >= 70
      ? 'border-amber-400'
      : 'border-red-400';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1E36] border border-[#1E3A5F] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">
                Security &amp; Compliance Control Centre
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                §11.7 / §11.19
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              MFA enforcement, session policy, SIEM event monitoring, rate limiting and NDA compliance verification.
            </p>
          </div>
        </div>

        <div className={`flex items-center justify-center w-20 h-20 rounded-full border-4 ${scoreRing} bg-[#0B1E36] shrink-0 self-start md:self-auto`}>
          <div className="text-center">
            <span className={`text-2xl font-black font-mono ${scoreColor}`}>{report.overallScore}</span>
            <span className="text-[9px] text-slate-400 block font-bold">SCORE</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {(
          [
            { id: 'overview', label: 'Compliance Overview', icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
            { id: 'events', label: 'SIEM Security Events', icon: <AlertTriangle className="w-4 h-4 text-rose-500" />, count: pendingReview.length },
            { id: 'mfa', label: 'MFA & Session Policy', icon: <Fingerprint className="w-4 h-4 text-sky-500" /> },
            { id: 'rateLimit', label: 'Rate Limiting & Abuse Detection', icon: <Zap className="w-4 h-4 text-amber-500" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SecurityTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#0B1E36] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
            {(tab as any).count > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                {(tab as any).count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: COMPLIANCE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Security Score"
              value={`${report.overallScore}/100`}
              subtitle="§11.7 Enterprise Grade"
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Checks Passed"
              value={String(report.passedChecks)}
              subtitle={`${report.failedChecks} require remediation`}
              icon={<CheckCircle2 className="w-5 h-5 text-sky-600" />}
            />
            <StatCard
              title="Events Requiring Review"
              value={String(pendingReview.length)}
              subtitle="Flagged by SIEM engine"
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            />
            <StatCard
              title="NDA Compliance"
              value={report.ndaComplianceStatus}
              subtitle="National Drug Authority"
              icon={<FileText className="w-5 h-5 text-purple-600" />}
            />
          </div>

          {/* Compliance Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-600" />
                Security Controls Verification
              </h3>
              <ComplianceCheckRow label="TLS Encryption In Transit" passed={report.tlsInTransit} detail="All HTTP endpoints enforced via HTTPS" />
              <ComplianceCheckRow label="Data Encryption At Rest" passed={report.encryptionAtRest} detail="PostgreSQL & R2 AES-256 encryption verified" />
              <ComplianceCheckRow label="MFA Enforced for Admins" passed={report.mfaEnforced} detail="TOTP / SMS second factor active" />
              <ComplianceCheckRow label="Immutable Audit Logs" passed={report.auditLogsImmutable} detail="Append-only NDA §42 compliant audit table" />
              <ComplianceCheckRow label="Least Privilege Model" passed={report.leastPrivilegeModel} detail="Role-based access with minimal permissions" />
              <ComplianceCheckRow label="Data Retention Policy Defined" passed={report.dataRetentionPolicyDefined} detail="Patient, clinical & financial records scoped" />
              <ComplianceCheckRow label="Backup & Restore Verified" passed={report.backupRestoreVerified} detail="PITR + nightly snapshot restore tested" />
            </div>

            {/* Security Risk Breakdown */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Risk Finding Breakdown
              </h3>
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Critical Findings', count: report.criticalFindings, color: 'bg-red-500', textColor: 'text-red-700' },
                  { label: 'High Risk Findings', count: report.highFindings, color: 'bg-orange-500', textColor: 'text-orange-700' },
                  { label: 'Medium Risk Findings', count: report.mediumFindings, color: 'bg-amber-400', textColor: 'text-amber-700' },
                  { label: 'Checks Passed', count: report.passedChecks, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="font-bold text-slate-700">{item.label}</span>
                    </div>
                    <span className={`font-mono font-black text-sm ${item.textColor}`}>{item.count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Remediation Actions Required</h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <strong>1 High:</strong> MFA not enrolled for 1 admin user (kawooya.b@example.com). Enforce enrollment within 48 hours.
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <strong>3 Medium:</strong> Bulk export audit trail, unused API keys present, session concurrent limit not enforced on legacy terminal.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SIEM SECURITY EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  SIEM Security Event Log
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time detection of anomalous logins, unusual refunds, bulk exports and clinical overrides.
                </p>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Activity className="w-3 h-3" /> Live Detection Active
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {events.map((event) => {
                const riskColors = SecurityHardeningService.getRiskColor(event.riskLevel);
                return (
                  <div
                    key={event.id}
                    className={`p-4 hover:bg-slate-50 transition ${event.requiresReview ? 'border-l-4 border-rose-400' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <RiskBadge level={event.riskLevel} />
                          {event.requiresReview && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <Eye className="w-2.5 h-2.5" /> REVIEW REQUIRED
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">{event.id}</span>
                        </div>

                        <p className="text-xs font-bold text-slate-900">{event.description}</p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                          {event.username && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {event.username}
                            </span>
                          )}
                          {event.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {event.ipAddress}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        {event.mitigationApplied && (
                          <div className="flex items-start gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mt-1.5">
                            <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{event.mitigationApplied}</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 self-start">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg block text-center">
                          {event.eventType.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: MFA & SESSION POLICY */}
      {activeTab === 'mfa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MFA Control Status */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-sky-600" />
                MFA Enforcement Status
              </h3>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-center shrink-0">
                  <span className="text-3xl font-black text-slate-900">
                    {mfaStatus.adminMfaEnrolledCount}/{mfaStatus.adminMfaTotalCount}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Admin MFA Enrolled</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Policy: <span className="text-sky-700">{mfaStatus.policy.replace(/_/g, ' ')}</span></p>
                  <p className="text-[11px] text-slate-500 mt-1">Last enforced: {new Date(mfaStatus.lastPolicyEnforcedAt).toLocaleString()}</p>
                </div>
              </div>

              {mfaStatus.nonCompliantAdmins.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-black text-amber-900">Non-Compliant Admin Accounts:</p>
                  {mfaStatus.nonCompliantAdmins.map((u) => (
                    <div key={u} className="flex items-center gap-2 text-[11px] text-amber-800">
                      <XCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-mono">{u}</span>
                      <span className="ml-auto font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Enroll MFA</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Policy */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-600" />
                Active Session Security Policy
              </h3>

              <div className="space-y-2.5">
                {[
                  { label: 'Idle Timeout', value: `${sessionPolicy.idleTimeoutMinutes} minutes`, icon: <Clock className="w-4 h-4 text-slate-400" /> },
                  { label: 'Max Session Duration', value: `${sessionPolicy.absoluteSessionMaxHours} hours`, icon: <RefreshCw className="w-4 h-4 text-slate-400" /> },
                  { label: 'Concurrent Sessions', value: `Max ${sessionPolicy.simultaneousSessionsAllowed} sessions`, icon: <Users className="w-4 h-4 text-slate-400" /> },
                  {
                    label: 'Admin Re-Auth for Sensitive Actions',
                    value: sessionPolicy.adminReAuthRequiredForSensitiveActions ? 'Enforced' : 'Disabled',
                    icon: <Lock className="w-4 h-4 text-slate-400" />,
                  },
                  {
                    label: 'Device Fingerprinting',
                    value: sessionPolicy.deviceFingerprintingEnabled ? 'Active' : 'Disabled',
                    icon: <Fingerprint className="w-4 h-4 text-slate-400" />,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                      {item.icon}
                      {item.label}
                    </div>
                    <span className="font-mono font-black text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RATE LIMITING */}
      {activeTab === 'rateLimit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Anti-Abuse Rate Limiting &amp; Throttle Monitor
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active rate limits on auth, AI, file upload, and CSV export endpoints.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {rateLimits.map((rl) => {
                const usagePct = Math.min(100, (rl.currentRatePerMinute / rl.limitPerMinute) * 100);
                return (
                  <div key={rl.endpoint} className="p-5 hover:bg-slate-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-black font-mono text-slate-900">{rl.endpoint}</span>
                        <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                          <span>{rl.requests24h.toLocaleString()} requests / 24h</span>
                          <span className="text-rose-600 font-bold">{rl.blockedRequests24h} blocked</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        rl.isThrottling
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {rl.isThrottling ? 'THROTTLING' : 'NORMAL'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Current rate: <strong className="text-slate-900">{rl.currentRatePerMinute} req/min</strong></span>
                        <span>Limit: {rl.limitPerMinute} req/min</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            usagePct > 80 ? 'bg-rose-500' : usagePct > 50 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityComplianceCentre;
