import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Zap,
  Shield,
  ArrowUpRight,
  ChevronRight,
  BarChart3,
  Clock,
  BadgeCheck,
  Lock,
  Unlock,
  Star,
  Activity,
} from 'lucide-react';
import {
  MultiTenantService,
  TIER_FEATURE_GATES,
  USER_RIGHTS_MATRIX,
  TierFeatureGate,
  TenantHealthSnapshot,
} from '../services/multiTenantService';
import { INITIAL_CLIENT_SUBSCRIPTIONS } from '../data/mockData';
import { TierName } from '../types';
import { formatUGX } from '../services/formatters';

// ─── Tier colour config ────────────────────────────────────────────────────────
const TIER_PALETTE: Record<TierName, { ring: string; badge: string; icon: string; bg: string }> = {
  Starter:          { ring: 'border-sky-400',    badge: 'bg-sky-100 text-sky-800 border border-sky-200',      icon: 'text-sky-500',    bg: 'bg-sky-50' },
  Professional:     { ring: 'border-indigo-400', badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200', icon: 'text-indigo-500', bg: 'bg-indigo-50' },
  Enterprise:       { ring: 'border-purple-400', badge: 'bg-purple-100 text-purple-800 border border-purple-200', icon: 'text-purple-500', bg: 'bg-purple-50' },
  'Custom Tailored':{ ring: 'border-amber-400',  badge: 'bg-amber-100 text-amber-800 border border-amber-200',   icon: 'text-amber-500',  bg: 'bg-amber-50' },
};

const TIER_ICONS: Record<TierName, React.ReactNode> = {
  Starter:          <Zap className="w-5 h-5" />,
  Professional:     <Star className="w-5 h-5" />,
  Enterprise:       <Crown className="w-5 h-5" />,
  'Custom Tailored':<Shield className="w-5 h-5" />,
};

type MultiTenantTab = 'overview' | 'tiers' | 'rights' | 'tenants';

function TierBadge({ tier }: { tier: TierName }) {
  const p = TIER_PALETTE[tier];
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.badge}`}>
      {tier}
    </span>
  );
}

function BillingBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active:         'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'Pending Renewal': 'bg-amber-100 text-amber-800 border border-amber-200',
    'Grace Period': 'bg-orange-100 text-orange-800 border border-orange-200',
    Suspended:      'bg-red-100 text-red-900 border border-red-200',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function UserSlotBar({ usedPct, isFull }: { usedPct: number; isFull: boolean }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${isFull ? 'bg-rose-500' : usedPct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
        style={{ width: `${Math.min(100, usedPct)}%` }}
      />
    </div>
  );
}

export const MultiTenantDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MultiTenantTab>('overview');

  const platform = useMemo(() => MultiTenantService.getPlatformSummary(), []);
  const snapshots = useMemo(() => MultiTenantService.getAllTenantSnapshots(), []);
  const tiers = Object.values(TIER_FEATURE_GATES);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1E36] border border-[#1E3A5F] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white">
                Multi-Tenant SaaS Architecture &amp; User Rights Matrix
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                §8
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Isolated tenancy per pharmacy · 4 subscription tiers · 7-role rights matrix · Per-tenant feature gate enforcement.
            </p>
          </div>
        </div>

        {/* Platform KPI strip */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          {[
            { label: 'Tenants',  value: platform.totalTenants,    color: 'text-white' },
            { label: 'Active',   value: platform.activeTenants,   color: 'text-emerald-400' },
            { label: 'MRR',      value: `${(platform.totalMrrUgx / 1000).toFixed(0)}K`, color: 'text-sky-400' },
            { label: 'NDA OK',   value: platform.ndaCompliantTenants, color: 'text-emerald-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="text-center bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700">
              <div className={`text-lg font-black font-mono ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {(
          [
            { id: 'overview', label: 'Platform Overview',      icon: <BarChart3 className="w-4 h-4 text-sky-500" /> },
            { id: 'tiers',    label: 'Subscription Tiers',     icon: <Crown className="w-4 h-4 text-purple-500" /> },
            { id: 'rights',   label: 'User Rights Matrix',     icon: <Shield className="w-4 h-4 text-indigo-500" /> },
            { id: 'tenants',  label: 'Tenant Health Monitor',  icon: <Activity className="w-4 h-4 text-emerald-500" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as MultiTenantTab)}
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

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tier Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['Starter', 'Professional', 'Enterprise', 'Custom Tailored'] as TierName[]).map((tier) => {
              const p = TIER_PALETTE[tier];
              const count = platform.tierBreakdown[tier] ?? 0;
              return (
                <div key={tier} className={`bg-white rounded-2xl border-2 ${p.ring} p-4 shadow-sm`}>
                  <div className={`${p.icon} mb-2`}>{TIER_ICONS[tier]}</div>
                  <div className="text-2xl font-black text-slate-900 font-mono">{count}</div>
                  <div className="text-xs font-black text-slate-600 mt-0.5">{tier}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {formatUGX(TIER_FEATURE_GATES[tier].monthlyUgx)}/mo
                    {TIER_FEATURE_GATES[tier].monthlyUgx === 0 && <span> (negotiated)</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Platform Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-600" />
                Tenant Billing Status
              </h3>
              {['Active', 'Pending Renewal', 'Grace Period', 'Suspended'].map((status) => {
                const count = snapshots.filter((s) => s.billingStatus === status).length;
                const pct = snapshots.length > 0 ? Math.round((count / snapshots.length) * 100) : 0;
                return (
                  <div key={status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <BillingBadge status={status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Suspended' ? 'bg-red-500' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono font-black text-slate-900 w-4 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                NDA &amp; Regulatory Compliance
              </h3>
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs font-bold text-emerald-900">NDA Verified + Pharmacist Present</span>
                <span className="text-xl font-black text-emerald-700 font-mono">{platform.ndaCompliantTenants}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-xs font-bold text-rose-900">Non-Compliant / Pending</span>
                <span className="text-xl font-black text-rose-700 font-mono">{platform.nonCompliantTenants}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-xs font-bold text-slate-700">Total Monthly Revenue</span>
                <span className="text-sm font-black text-slate-900 font-mono">{formatUGX(platform.totalMrrUgx)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TIERS ────────────────────────────────────────────────────────── */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tiers.map((gate) => {
              const p = TIER_PALETTE[gate.tier];
              const includedFeatures = gate.features.filter((f) => f.included);
              const excludedFeatures = gate.features.filter((f) => !f.included);
              return (
                <div key={gate.tier} className={`bg-white rounded-3xl border-2 ${p.ring} shadow-sm overflow-hidden`}>
                  {/* Tier Header */}
                  <div className={`${p.bg} px-5 py-4 border-b border-slate-100`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={p.icon}>{TIER_ICONS[gate.tier]}</span>
                        <div>
                          <span className="text-sm font-black text-slate-900">{gate.tier}</span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {gate.monthlyUgx > 0 ? `${formatUGX(gate.monthlyUgx)} / month` : 'Negotiated pricing'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900">
                          {gate.maxUsers === -1 ? 'Unlimited' : `Up to ${gate.maxUsers}`} users
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {gate.maxBranches === -1 ? 'Unlimited' : gate.maxBranches} branch(es) · SLA {gate.slaHours}h
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {gate.exportFormats.map((f) => (
                        <span key={f} className="text-[9px] font-black px-1.5 py-0.5 bg-white rounded-full border border-slate-200 text-slate-600">{f}</span>
                      ))}
                      {gate.aiModels.map((m) => (
                        <span key={m} className="text-[9px] font-black px-1.5 py-0.5 bg-white rounded-full border border-purple-200 text-purple-700">AI: {m.split(' ')[0]}</span>
                      ))}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${gate.apiAccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        API {gate.apiAccess ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Feature List */}
                  <div className="p-4 space-y-1.5">
                    {includedFeatures.map((f) => (
                      <div key={f.feature} className="flex items-center gap-2 text-[11px] text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {f.feature}
                      </div>
                    ))}
                    {excludedFeatures.map((f) => (
                      <div key={f.feature} className="flex items-center gap-2 text-[11px] text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        {f.feature}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4 flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
                    <span><Clock className="w-3 h-3 inline mr-0.5" />{gate.dataRetentionYears}-year retention</span>
                    {gate.dedicatedAccountManager && (
                      <span className="text-emerald-600 font-bold">✓ Dedicated Account Manager</span>
                    )}
                    {gate.customBranding && (
                      <span className="text-purple-600 font-bold">✓ Custom Branding</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── USER RIGHTS MATRIX ───────────────────────────────────────────── */}
      {activeTab === 'rights' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                7-Role × 8-Permission User Rights Matrix
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Each role's permissions are intersected with the tenant's tier features. Effective access = Role Rights ∩ Tier Features.
              </p>
            </div>

            {/* Permission Column Headers */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-2.5 font-black text-slate-700 min-w-[160px]">Role</th>
                    <th className="text-left px-2 py-2.5 font-black text-slate-500 min-w-[60px]">Tier Min</th>
                    {[
                      'POS', 'Inventory', 'Prescriptions', 'Reorders',
                      'Reports', 'Insurance', 'AI', 'Staff Mgmt',
                    ].map((col) => (
                      <th key={col} className="px-2 py-2.5 font-black text-slate-500 text-center min-w-[70px]">{col}</th>
                    ))}
                    <th className="px-2 py-2.5 font-black text-slate-500 text-center">PSU Req.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {USER_RIGHTS_MATRIX.map((row) => {
                    const rights = row.rights;
                    const minTier = row.allowedTiers[0];
                    const p = TIER_PALETTE[minTier];
                    return (
                      <tr key={row.role} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black border ${row.badgeColor}`}>
                            {row.role}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <TierBadge tier={minTier} />
                        </td>
                        {[
                          rights.canAccessPOS,
                          rights.canManageInventory,
                          rights.canProcessPrescriptions,
                          rights.canApproveReorders,
                          rights.canViewReports,
                          rights.canSubmitInsurance,
                          rights.canUseAiAssistant,
                          rights.canManageStaffAccounts,
                        ].map((val, i) => (
                          <td key={i} className="px-2 py-3 text-center">
                            {val
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              : <XCircle className="w-4 h-4 text-slate-200 mx-auto" />}
                          </td>
                        ))}
                        <td className="px-2 py-3 text-center">
                          {row.requiresPsuReg
                            ? <BadgeCheck className="w-4 h-4 text-purple-500 mx-auto" />
                            : <span className="text-slate-300 font-black">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {USER_RIGHTS_MATRIX.map((row) => (
              <div key={row.role} className={`p-4 rounded-2xl border bg-white shadow-sm`}>
                <div className="flex items-start gap-3">
                  <div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black border ${row.badgeColor} mb-1.5`}>
                      {row.role}
                    </div>
                    <p className="text-[11px] text-slate-500">{row.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {row.allowedTiers.map((t) => <TierBadge key={t} tier={t} />)}
                      {row.maxPerPharmacy !== -1 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                          Max {row.maxPerPharmacy}/pharmacy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TENANT HEALTH MONITOR ────────────────────────────────────────── */}
      {activeTab === 'tenants' && (
        <div className="space-y-3">
          {snapshots.map((snap) => {
            const p = TIER_PALETTE[snap.tier];
            return (
              <div key={snap.tenantId} className={`bg-white rounded-2xl border-l-4 ${p.ring} shadow-sm p-5`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{snap.tenantName}</span>
                      <TierBadge tier={snap.tier} />
                      <BillingBadge status={snap.billingStatus} />
                    </div>

                    {/* User slot */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />
                          Staff: <strong className="text-slate-900 ml-0.5">{snap.userCount}</strong> / {snap.maxUsers === -1 ? '∞' : snap.maxUsers}
                        </span>
                        {snap.isUserSlotFull && (
                          <span className="text-rose-600 font-black text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> SLOT FULL
                          </span>
                        )}
                      </div>
                      <UserSlotBar usedPct={snap.userSlotUsedPct} isFull={snap.isUserSlotFull} />
                    </div>

                    {/* Feature & compliance indicators */}
                    <div className="flex items-center gap-4 text-[11px] flex-wrap">
                      <span className="text-emerald-600 flex items-center gap-1 font-bold">
                        <Unlock className="w-3 h-3" /> {snap.activeFeatureCount} features active
                      </span>
                      {snap.blockedFeatureCount > 0 && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> {snap.blockedFeatureCount} locked
                        </span>
                      )}
                      <span className={`flex items-center gap-1 font-bold ${snap.ndaVerified ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <BadgeCheck className="w-3 h-3" /> NDA {snap.ndaVerified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className={`flex items-center gap-1 font-bold ${snap.supervisingPharmacistPresent ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <Shield className="w-3 h-3" /> Pharmacist {snap.supervisingPharmacistPresent ? 'Listed' : 'Missing'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-xs font-black text-slate-900">{formatUGX(snap.monthlyUgxRate)}<span className="text-slate-400 font-normal">/mo</span></div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> Next bill: {snap.nextBillingDate}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiTenantDashboard;
