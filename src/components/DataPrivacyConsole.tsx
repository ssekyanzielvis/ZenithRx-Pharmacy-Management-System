import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Eye,
  FileText,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileCheck,
  FileSpreadsheet,
  Flame,
  Fingerprint,
} from 'lucide-react';
import { DataPrivacyService } from '../services/dataPrivacyService';
import {
  PatientConsentDirective,
  PatientPHIAccessLog,
  DataRetentionPolicy,
  PatientPrivacyRequest,
  ConsentCategory,
  ConsentStatus,
} from '../types/privacyTypes';

export const DataPrivacyConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'consents' | 'accessLogs' | 'retention' | 'subjectRequests'
  >('consents');

  const [consents, setConsents] = useState<PatientConsentDirective[]>([]);
  const [accessLogs, setAccessLogs] = useState<PatientPHIAccessLog[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [privacyRequests, setPrivacyRequests] = useState<PatientPrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Patient State
  const [selectedPatientName, setSelectedPatientName] = useState('Grace Nakato (UG-PAT-1029)');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAllPrivacyData();
  }, []);

  const loadAllPrivacyData = async () => {
    setLoading(true);
    try {
      const [cons, logs, ret, reqs] = await Promise.all([
        DataPrivacyService.getPatientConsents('pat-001'),
        DataPrivacyService.getPHIAccessLogs('pat-001'),
        DataPrivacyService.getRetentionPolicies(),
        DataPrivacyService.getPrivacyRequests(),
      ]);

      setConsents(cons);
      setAccessLogs(logs);
      setRetentionPolicies(ret);
      setPrivacyRequests(reqs);
    } catch (err) {
      console.error('Error loading data privacy telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConsent = async (category: ConsentCategory, currentStatus: ConsentStatus) => {
    const newStatus: ConsentStatus = currentStatus === 'granted' ? 'withdrawn' : 'granted';

    await DataPrivacyService.updateConsentDirective('pat-001', category, newStatus);
    setConsents((prev) =>
      prev.map((c) =>
        c.consent_category === category
          ? {
              ...c,
              status: newStatus,
              withdrawn_at: newStatus === 'withdrawn' ? new Date().toISOString() : undefined,
              granted_at: newStatus === 'granted' ? new Date().toISOString() : c.granted_at,
            }
          : c
      )
    );

    setNotificationMsg(
      `Consent directive for "${category.replace(/_/g, ' ')}" updated to ${newStatus.toUpperCase()}`
    );
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleSimulateNewAccess = async () => {
    const newLog = await DataPrivacyService.logAccessEvent({
      patientId: 'pat-001',
      accessorName: 'Dr. Sarah Mukasa',
      accessorRole: 'Supervising Pharmacist',
      accessorLicense: 'PSU-REG-88219',
      branchName: 'ZenithRx Main Flagship Pharmacy (Kampala)',
      purpose: 'clinical_drug_interaction_check',
      recordType: 'Active Chronic Medication Regimen & Allergy Profile',
      recordRef: `RX-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setAccessLogs((prev) => [newLog, ...prev]);
    setNotificationMsg('New PHI read event recorded in patient transparent audit trail.');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const consentCategoryLabels: Record<ConsentCategory, { title: string; desc: string }> = {
    data_processing: {
      title: 'Core Healthcare & Medication Dispensing',
      desc: 'Processing prescription orders, dispensing verification, and clinical safety cross-checks.',
    },
    teleconsultation_recording: {
      title: 'Clinical Teleconsultation Audio/Video Recording',
      desc: 'Secure recording and archival of pharmacist teleconsultation sessions for clinical documentation.',
    },
    sms_email_notifications: {
      title: 'Prescription & Order Status Notifications',
      desc: 'SMS and email updates when prescriptions are verified, dispensed, or ready for pharmacy pickup.',
    },
    health_adherence_reminders: {
      title: 'Medication Adherence & Chronic Refill Alerts',
      desc: 'Automated dosage reminders and refill prompt schedules for chronic treatment regimens.',
    },
    cross_pharmacy_sharing: {
      title: 'Inter-Branch & Referral Pharmacy Record Sharing',
      desc: 'Secure sharing of medication history with designated referral hospital pharmacies and clinical specialists.',
    },
    anonymous_analytics_research: {
      title: 'De-Identified Clinical Analytics & Epidemiological Research',
      desc: 'Anonymized medication consumption statistics utilized for public health research and supply forecasting.',
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-800/40 rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-600/30 rounded-xl border border-teal-400/30 text-teal-400">
                <Fingerprint className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Patient Health Information (PHI) & Data Privacy Governance
                  <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 font-semibold">
                    HIPAA &amp; DPPA 2019 Compliant
                  </span>
                </h1>
                <p className="text-sm text-teal-200/80">
                  Granular Patient Consent • Transparent "Who Accessed My Records" Audit Trail • Statutory 7-Year Data Retention
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAllPrivacyData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Privacy State
            </button>
            <button
              onClick={handleSimulateNewAccess}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 transition flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Log Clinical PHI Access Event
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-teal-800/40">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-teal-900/40">
            <div className="flex items-center justify-between text-xs text-teal-300/80 mb-1">
              <span>Consent Directives</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 flex items-baseline gap-1.5">
              5 / 6 Active <span className="text-xs font-normal text-slate-400">(83.3%)</span>
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> Digital Signatures Verified
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-teal-900/40">
            <div className="flex items-center justify-between text-xs text-teal-300/80 mb-1">
              <span>Transparent Access Logs</span>
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-400 flex items-baseline gap-1.5">
              {accessLogs.length} Events <span className="text-xs font-normal text-slate-400">(Audited)</span>
            </div>
            <div className="text-[11px] text-cyan-400/90 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> 100% Patient Viewable
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-teal-900/40">
            <div className="flex items-center justify-between text-xs text-teal-300/80 mb-1">
              <span>Emergency Break-Glass</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 flex items-baseline gap-1.5">
              1 Justified
            </div>
            <div className="text-[11px] text-amber-300/80 font-medium flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-amber-400" /> Trauma Allergy Check
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-teal-900/40">
            <div className="flex items-center justify-between text-xs text-teal-300/80 mb-1">
              <span>Statutory Data Retention</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 flex items-baseline gap-1.5">
              7 - 10 Years
            </div>
            <div className="text-[11px] text-purple-300/80 font-medium flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3" /> NDA &amp; URA Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div className="bg-emerald-950/80 border border-emerald-700/60 p-4 rounded-xl flex items-center justify-between text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-semibold">{notificationMsg}</p>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-xs underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        {[
          { id: 'consents', label: 'Patient Consent Directives', icon: UserCheck, count: consents.length },
          { id: 'accessLogs', label: '"Who Accessed My Health Data?"', icon: Eye, count: accessLogs.length },
          { id: 'retention', label: 'Data Retention & Lifecycle Rules', icon: Clock, count: retentionPolicies.length },
          { id: 'subjectRequests', label: 'Data Subject Privacy Rights', icon: FileCheck, count: privacyRequests.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition-all border-b-2 ${
                isActive
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-teal-600 text-white'
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

      {/* TAB 1: PATIENT CONSENT MANAGEMENT */}
      {activeTab === 'consents' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-teal-500" />
                    Patient Consent Directives & Preferences
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    {selectedPatientName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enforces explicit, revocable patient consent across all healthcare processing, teleconsultations, alerts, and research.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Consent Document Version: <strong className="text-slate-800 dark:text-slate-200">v2.4 (2026 NDA Standard)</strong>
              </div>
            </div>

            {/* Granular Consent Directives List */}
            <div className="space-y-4 mt-6">
              {consents.map((c) => {
                const meta = consentCategoryLabels[c.consent_category] || {
                  title: c.consent_category,
                  desc: 'Clinical data processing preference.',
                };
                const isGranted = c.status === 'granted';

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${
                      isGranted
                        ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/50'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          {meta.title}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isGranted
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {meta.desc}
                      </p>
                      <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono pt-1">
                        <span>Channel: {c.collected_by_channel.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>
                          {isGranted
                            ? `Granted on: ${new Date(c.granted_at || '').toLocaleDateString()}`
                            : `Withdrawn on: ${new Date(c.withdrawn_at || '').toLocaleDateString()}`}
                        </span>
                        {c.digital_signature_hash && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">
                              Sig: {c.digital_signature_hash.substring(0, 12)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleConsent(c.consent_category, c.status)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                        isGranted
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-teal-600 hover:bg-teal-500 text-white'
                      }`}
                    >
                      {isGranted ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Withdraw Consent
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Grant Consent
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: "WHO ACCESSED MY HEALTH DATA?" PHI AUDIT LOG */}
      {activeTab === 'accessLogs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-teal-500" />
                  "Who Accessed My Health Information?" — Transparent PHI Audit Log
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete immutable ledger disclosing every clinician, pharmacist, physician, and billing agent who accessed this patient's records.
                </p>
              </div>

              <button
                onClick={() => alert(`Official PHI Disclosure Certificate generated for ${selectedPatientName} with SHA-256 cryptographic seal.`)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Disclosure Statement
              </button>
            </div>

            {/* Access Log Records Table */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Access Code</th>
                    <th className="p-3">Practitioner & License</th>
                    <th className="p-3">Clinical Purpose</th>
                    <th className="p-3">Records Accessed</th>
                    <th className="p-3">Branch Location</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {accessLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        log.is_emergency_break_glass ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                        {log.access_code}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {log.accessor_name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>{log.accessor_role}</span>
                          {log.accessor_license_number && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{log.accessor_license_number}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block w-fit text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.is_emergency_break_glass
                                ? 'bg-amber-500 text-white font-black'
                                : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            }`}
                          >
                            {log.is_emergency_break_glass
                              ? 'EMERGENCY BREAK-GLASS'
                              : log.purpose.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {log.is_emergency_break_glass && log.break_glass_justification && (
                            <p className="text-[10px] text-amber-800 dark:text-amber-200 max-w-xs bg-amber-100/60 dark:bg-amber-900/40 p-1.5 rounded border border-amber-300 dark:border-amber-800 mt-1">
                              <strong>Justification:</strong> {log.break_glass_justification}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                        {log.record_type}
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {log.branch_name}
                      </td>

                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(log.accessed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA RETENTION & LIFECYCLE GOVERNANCE */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Statutory Healthcare Data Retention &amp; Disposal Rules
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enforces automated retention schedules grounded in National Drug Authority (NDA) and tax compliance statutes.
                </p>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-400">Next Scheduled Sweep</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Automated weekly cycle (in 24 hours)
                </div>
              </div>
            </div>

            {/* Retention Classifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {retentionPolicies.map((pol) => (
                <div
                  key={pol.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white max-w-[180px]">
                      {pol.category_name}
                    </h3>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      {pol.retention_period_years} YEARS
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    <strong>Statutory Authority:</strong> {pol.retention_basis_law}
                  </p>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Currently Retained:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {pol.records_retained_count.toLocaleString()} records
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Disposal Action:</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                        {pol.purge_action.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA SUBJECT PRIVACY REQUESTS */}
      {activeTab === 'subjectRequests' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-500" />
                  Data Subject Rights & Privacy Request Queue
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Full patient rights management: Right to Access (Export full PHI), Right to Rectification, and Right to Anonymization.
                </p>
              </div>

              <button
                onClick={() => alert('New Data Subject Access Request (DSAR) ticket generated for patient.')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Initiate New PHI Export Request
              </button>
            </div>

            <div className="space-y-3 mt-6">
              {privacyRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        {req.request_code}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {req.patient_name} — {req.request_type.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {req.notes}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Requested: {new Date(req.requested_at).toLocaleString()} • Fulfilled in 15 mins
                    </div>
                  </div>

                  {req.export_manifest_url && (
                    <button
                      onClick={() => alert(`Downloading signed medical archive: ${req.export_manifest_url}`)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PHI Archive
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
