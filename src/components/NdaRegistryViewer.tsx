import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Users,
  BadgeCheck,
  Clock,
  Globe,
  Phone,
  Mail,
  RefreshCw,
  Info,
  Stethoscope,
} from 'lucide-react';
import {
  NdaRegistryService,
  LicenseVerificationResult,
  PharmacyComplianceReport,
  VerificationStatus,
} from '../services/ndaRegistryService';
import { NDA_REGISTERED_PHARMACIES, INITIAL_CLIENT_SUBSCRIPTIONS } from '../data/mockData';
import { NdaPharmacyRecord } from '../types';
import { StatCard } from './ui/StatCard';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: VerificationStatus | PharmacyComplianceReport['overallStatus'] }) {
  const map: Record<string, string> = {
    VERIFIED:         'bg-emerald-100 text-emerald-800 border border-emerald-200',
    FULLY_COMPLIANT:  'bg-emerald-100 text-emerald-800 border border-emerald-200',
    WARNINGS:         'bg-amber-100 text-amber-800 border border-amber-200',
    GRACE_PERIOD:     'bg-amber-100 text-amber-800 border border-amber-200',
    PENDING_RENEWAL:  'bg-amber-100 text-amber-800 border border-amber-200',
    NON_COMPLIANT:    'bg-rose-100 text-rose-800 border border-rose-200',
    BLOCKED:          'bg-red-100 text-red-900 border border-red-300',
    NOT_IN_REGISTRY:  'bg-rose-100 text-rose-800 border border-rose-200',
    FORMAT_INVALID:   'bg-red-100 text-red-900 border border-red-300',
    EXPIRED:          'bg-red-100 text-red-900 border border-red-300',
    SUSPENDED:        'bg-gray-100 text-gray-800 border border-gray-200',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'border-emerald-400 text-emerald-600' : score >= 60 ? 'border-amber-400 text-amber-600' : 'border-red-400 text-red-600';
  return (
    <div className={`w-14 h-14 rounded-full border-4 ${color} flex items-center justify-center shrink-0`}>
      <span className="text-sm font-black font-mono">{score}</span>
    </div>
  );
}

type NdaTab = 'registry' | 'verify' | 'clients' | 'checker';

export const NdaRegistryViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NdaTab>('registry');
  const [registrySearch, setRegistrySearch] = useState('');

  // Manual verification state
  const [licenseInput, setLicenseInput] = useState('');
  const [psuInput, setPsuInput] = useState('');
  const [pharmacistNameInput, setPharmacistNameInput] = useState('');
  const [licenseResult, setLicenseResult] = useState<LicenseVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const stats = useMemo(() => NdaRegistryService.getRegistryStats(), []);

  const filteredRegistry = useMemo(
    () => NdaRegistryService.searchRegistry(registrySearch),
    [registrySearch]
  );

  // Client compliance reports
  const clientReports = useMemo(
    () => INITIAL_CLIENT_SUBSCRIPTIONS.map((c) => NdaRegistryService.generateComplianceReport(c)),
    []
  );

  const handleVerifyLicense = async () => {
    if (!licenseInput.trim()) return;
    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate async registry call
    const result = NdaRegistryService.verifyLicense(licenseInput);
    setLicenseResult(result);
    setIsVerifying(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1E36] border border-[#1E3A5F] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <BadgeCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white">
                NDA Registry &amp; Regulatory Compliance (§9)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Uganda NDA Cap. 206
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                PSU Cap. 280
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Pre-seeded NDA pharmacy register · PSU pharmacist verification · Live compliance scoring per client subscription.
            </p>
          </div>
        </div>

        {/* Registry Stats Strip */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="text-center bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700">
            <div className="text-lg font-black text-white font-mono">{stats.total}</div>
            <div className="text-[9px] text-slate-400 font-bold uppercase">Registered</div>
          </div>
          <div className="text-center bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700">
            <div className="text-lg font-black text-emerald-400 font-mono">{stats.activeLicensed}</div>
            <div className="text-[9px] text-slate-400 font-bold uppercase">Active</div>
          </div>
          <div className="text-center bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700">
            <div className="text-lg font-black text-amber-400 font-mono">{stats.pendingRenewal}</div>
            <div className="text-[9px] text-slate-400 font-bold uppercase">Renewal Due</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {(
          [
            { id: 'registry', label: `NDA Register (${stats.total})`,     icon: <FileText className="w-4 h-4 text-sky-500" /> },
            { id: 'verify',   label: 'Live License Verifier',              icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
            { id: 'clients',  label: `Client Compliance Reports`,          icon: <Building2 className="w-4 h-4 text-purple-500" /> },
            { id: 'checker',  label: 'Safety Protocol Reference',          icon: <Stethoscope className="w-4 h-4 text-rose-500" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as NdaTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#0B1E36] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: NDA REGISTER ─────────────────────────────────────────── */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
            <input
              type="text"
              placeholder="Search by pharmacy name, NDA number, district, region, pharmacist, or PSU reg..."
              value={registrySearch}
              onChange={(e) => setRegistrySearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          <div className="text-xs text-slate-400 font-bold">
            Showing {filteredRegistry.totalFound} of {stats.total} registered pharmacies
          </div>

          <div className="space-y-3">
            {filteredRegistry.records.map((record) => (
              <div key={record.licenseNo} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-sky-200 transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{record.pharmacyName}</span>
                      <StatusBadge status={record.status === 'Active & Licensed' ? 'VERIFIED' : 'PENDING_RENEWAL'} />
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {record.licenseCategory}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{record.branchName}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono">
                        <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="font-bold">NDA:</span> {record.licenseNo}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        {record.district}, {record.region}
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <BadgeCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="font-bold">PSU:</span> {record.psuRegNo}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        {record.supervisingPharmacist}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        {record.contactPhone}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        Expires: {record.expiryDate}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredRegistry.records.length === 0 && (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No records found for "{registrySearch}". Check spelling or search by NDA license number.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: LIVE LICENSE VERIFIER ────────────────────────────────── */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              NDA License &amp; PSU Pharmacist Real-Time Verifier
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                  NDA License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. NDA/LIC/PHA/2026/0182"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                  PSU Registration No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PSU/REG/2021/1042"
                  value={psuInput}
                  onChange={(e) => setPsuInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                Supervising Pharmacist Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Pharm. Moses Musoke"
                value={pharmacistNameInput}
                onChange={(e) => setPharmacistNameInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>

            <button
              onClick={handleVerifyLicense}
              disabled={isVerifying || !licenseInput.trim()}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {isVerifying ? 'Verifying against NDA Register...' : 'Run Compliance Verification'}
            </button>
          </div>

          {/* Verification Result */}
          {licenseResult && (
            <div className={`bg-white rounded-3xl border-2 shadow-sm p-6 space-y-4 ${
              licenseResult.isCompliant ? 'border-emerald-300' : 'border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {licenseResult.isCompliant
                    ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    : <XCircle className="w-6 h-6 text-rose-500" />}
                  <div>
                    <span className="text-sm font-black text-slate-900">NDA License Verification Result</span>
                    <p className="text-[11px] text-slate-400 font-mono">{licenseResult.licenseNo}</p>
                  </div>
                </div>
                <StatusBadge status={licenseResult.status} />
              </div>

              {licenseResult.registryRecord && (
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2 text-xs">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
                    Registry Match — {licenseResult.registryRecord.pharmacyName}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <div><span className="font-bold">Branch:</span> {licenseResult.registryRecord.branchName}</div>
                    <div><span className="font-bold">District:</span> {licenseResult.registryRecord.district}, {licenseResult.registryRecord.region}</div>
                    <div><span className="font-bold">Category:</span> {licenseResult.registryRecord.licenseCategory}</div>
                    <div><span className="font-bold">Expiry:</span> {licenseResult.registryRecord.expiryDate}
                      {licenseResult.daysToExpiry !== undefined &&
                        <span className={`ml-1.5 font-bold ${licenseResult.daysToExpiry <= 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ({licenseResult.daysToExpiry} days remaining)
                        </span>}
                    </div>
                    <div><span className="font-bold">Supervising Pharmacist:</span> {licenseResult.registryRecord.supervisingPharmacist}</div>
                    <div className="font-mono"><span className="font-bold">PSU Reg:</span> {licenseResult.registryRecord.psuRegNo}</div>
                  </div>
                </div>
              )}

              {licenseResult.errors.length > 0 && (
                <div className="space-y-1.5">
                  {licenseResult.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                      <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                      {err}
                    </div>
                  ))}
                </div>
              )}

              {licenseResult.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {licenseResult.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: CLIENT COMPLIANCE REPORTS ────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {clientReports.map((report) => (
            <div
              key={report.clientId}
              className={`bg-white rounded-2xl border-l-4 shadow-sm p-5 ${
                report.overallStatus === 'FULLY_COMPLIANT'
                  ? 'border-emerald-400'
                  : report.overallStatus === 'WARNINGS'
                  ? 'border-amber-400'
                  : 'border-rose-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <ScoreRing score={report.complianceScore} />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{report.pharmacyName}</span>
                      <StatusBadge status={report.overallStatus} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className={`flex items-center gap-1.5 font-bold ${report.licenseMatchesRegistry ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {report.licenseMatchesRegistry
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : <XCircle className="w-3.5 h-3.5" />}
                        NDA License {report.licenseMatchesRegistry ? 'Verified' : 'Not Verified'}
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold ${report.supervisingPharmacistPresent ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {report.supervisingPharmacistPresent
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : <XCircle className="w-3.5 h-3.5" />}
                        Supervising Pharmacist {report.supervisingPharmacistPresent ? 'Listed' : 'Missing'}
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold ${report.pharmacistMatchesRegistry ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {report.pharmacistMatchesRegistry
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : <AlertTriangle className="w-3.5 h-3.5" />}
                        PSU Reg {report.pharmacistMatchesRegistry ? 'Matched' : 'Unconfirmed'}
                      </div>
                    </div>

                    {report.nextRenewalDue && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        License renewal due: <strong className="text-slate-700 ml-0.5">{report.nextRenewalDue}</strong>
                      </div>
                    )}

                    {report.blockingIssues.length > 0 && (
                      <div className="space-y-1 mt-1">
                        {report.blockingIssues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                            <XCircle className="w-3 h-3 shrink-0 mt-0.5 text-rose-600" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}

                    {report.advisories.length > 0 && (
                      <div className="space-y-1 mt-1">
                        {report.advisories.map((adv, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                            {adv}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 4: SAFETY PROTOCOL REFERENCE ────────────────────────────── */}
      {activeTab === 'checker' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-rose-600" />
                Uganda NDA &amp; PSU Safety Protocol Reference
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mandatory compliance checklist per the National Drug Authority Act (Cap. 206), Pharmacy Act (Cap. 280), and ZenithRx §9 safety protocols.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                {
                  requirement: 'Valid NDA License',
                  format: 'NDA/LIC/PHA/YYYY/XXXX',
                  legal: 'NDA Act Cap. 206 §18',
                  mandatory: true,
                  consequence: 'Operations suspended; criminal liability for proprietor.',
                },
                {
                  requirement: 'PSU-Registered Supervising Pharmacist',
                  format: 'PSU/REG/YYYY/XXXX',
                  legal: 'Pharmacy Act Cap. 280 §11',
                  mandatory: true,
                  consequence: 'License cancellation; all prescription dispensing halted.',
                },
                {
                  requirement: 'Annual License Renewal',
                  format: 'Before 31 December each year',
                  legal: 'NDA Act Cap. 206 §22',
                  mandatory: true,
                  consequence: '30-day grace period, then operations suspended.',
                },
                {
                  requirement: 'Controlled Drug Register (CDR)',
                  format: 'Form NDA/CDR/001',
                  legal: 'NDA Narcotic Drugs Regulations §7',
                  mandatory: true,
                  consequence: 'Immediate suspension; criminal penalties under Schedule II.',
                },
                {
                  requirement: 'Dispensing Record per Prescription',
                  format: 'Patient name, Rx #, pharmacist sig., date',
                  legal: 'NDA Act Cap. 206 §31',
                  mandatory: true,
                  consequence: 'Fine + suspension for each unrecorded dispensing event.',
                },
                {
                  requirement: 'Pharmacy Premises Inspection Certificate',
                  format: 'NDA/GMP/INSP/YYYY/XX',
                  legal: 'NDA GMP Guidelines §5',
                  mandatory: true,
                  consequence: 'Immediate closure pending re-inspection.',
                },
                {
                  requirement: 'Drug Expiry Disposal Certificate',
                  format: 'Form NDA/GMP/DISP (witnessed)',
                  legal: 'NDA Drug Disposal Guidelines §9',
                  mandatory: true,
                  consequence: 'Fine; environmental liability; risk of stock confiscation.',
                },
                {
                  requirement: 'Pharmacist Continuing Education (CPD)',
                  format: 'Minimum 20 CPD hours/year via PSU',
                  legal: 'PSU CPD Policy 2022',
                  mandatory: false,
                  consequence: 'PSU registration may not be renewed without CPD credits.',
                },
              ].map((item) => (
                <div key={item.requirement} className="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {item.mandatory
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      : <Info className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">{item.requirement}</span>
                        {item.mandatory
                          ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">MANDATORY</span>
                          : <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">ADVISORY</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div><span className="font-bold">Format / Ref:</span> <span className="font-mono">{item.format}</span></div>
                        <div><span className="font-bold">Legal Basis:</span> {item.legal}</div>
                        <div className="text-rose-700"><span className="font-bold">Non-Compliance:</span> {item.consequence}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NdaRegistryViewer;
