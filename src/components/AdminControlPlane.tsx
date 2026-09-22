import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Users,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Lock,
  KeyRound,
  FileText,
  Activity,
  Zap,
  RefreshCw,
  Clock,
  Sparkles,
  Ban,
  UserPlus,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Layers,
  Search,
  Check,
  X
} from 'lucide-react';
import {
  GlobalSystemPolicies,
  DelegatedCollaborator,
  DualControlApprovalRequest,
  SecurityIncident,
  getGlobalSystemPolicies,
  updateGlobalSystemPolicies,
  getDelegatedCollaborators,
  createDelegatedCollaborator,
  revokeCollaboratorAccess,
  getDualControlApprovals,
  processDualControlDecision,
  getSecurityIncidents
} from '../services/adminControlPlaneService';
import { getFeedbackTickets, replyToPharmacyFeedback } from '../services/feedbackService';
import { PharmacyFeedbackTicket } from '../types';
import { formatUGX } from '../services/formatters';

interface AdminControlPlaneProps {
  currentSuperAdminName?: string;
  governanceTab?: string;
}

export const AdminControlPlane: React.FC<AdminControlPlaneProps> = ({
  currentSuperAdminName = 'Dr. Arthur Ssenabulya',
  governanceTab,
}) => {
  const getTabFromProp = (tab?: string): 'executive' | 'policies' | 'collaborators' | 'dualControl' | 'incidents' | 'feedback' => {
    if (tab === 'adminPolicies') return 'policies';
    if (tab === 'adminDelegated') return 'collaborators';
    if (tab === 'adminDualControl') return 'dualControl';
    if (tab === 'adminIncidents') return 'incidents';
    if (tab === 'adminFeedback') return 'feedback';
    return 'executive';
  };

  const [activeGovernanceTab, setActiveGovernanceTab] = useState<
    'executive' | 'policies' | 'collaborators' | 'dualControl' | 'incidents' | 'feedback'
  >(() => getTabFromProp(governanceTab));

  useEffect(() => {
    if (governanceTab) {
      setActiveGovernanceTab(getTabFromProp(governanceTab));
    }
  }, [governanceTab]);

  const [policies, setPolicies] = useState<GlobalSystemPolicies | null>(null);
  const [collaborators, setCollaborators] = useState<DelegatedCollaborator[]>([]);
  const [dualApprovals, setDualApprovals] = useState<DualControlApprovalRequest[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [feedbackTickets, setFeedbackTickets] = useState<PharmacyFeedbackTicket[]>([]);
  const [replyModalTicket, setReplyModalTicket] = useState<PharmacyFeedbackTicket | null>(null);
  const [replyMessageInput, setReplyMessageInput] = useState<string>('');
  const [replyStatusChoice, setReplyStatusChoice] = useState<'Resolved' | 'In Progress'>('Resolved');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingPolicy, setSavingPolicy] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Collaborator Invite Modal
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabEmail, setNewCollabEmail] = useState('');
  const [newCollabPhone, setNewCollabPhone] = useState('');
  const [newCollabRole, setNewCollabRole] = useState<'Admin Collaborator' | 'Domain Admin'>('Domain Admin');
  const [newCollabScope, setNewCollabScope] = useState<DelegatedCollaborator['domainScope']>('CLINICAL_OVERSIGHT');
  const [newCollabExpiryDays, setNewCollabExpiryDays] = useState<number>(90);

  const loadAllGovernanceData = async () => {
    setLoading(true);
    const [p, c, d, i] = await Promise.all([
      getGlobalSystemPolicies(),
      getDelegatedCollaborators(),
      getDualControlApprovals(),
      getSecurityIncidents(),
    ]);
    setPolicies(p);
    setCollaborators(c);
    setDualApprovals(d);
    setIncidents(i);
    setFeedbackTickets(getFeedbackTickets());
    setLoading(false);
  };

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalTicket || !replyMessageInput.trim()) return;

    replyToPharmacyFeedback(
      replyModalTicket.id,
      replyMessageInput,
      currentSuperAdminName,
      replyStatusChoice
    );

    setNotification(`Admin response dispatched to ${replyModalTicket.clientName} (${replyModalTicket.id})!`);
    setReplyModalTicket(null);
    setReplyMessageInput('');
    setFeedbackTickets(getFeedbackTickets());
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    loadAllGovernanceData();
  }, []);

  const handleSavePolicies = async () => {
    if (!policies) return;
    setSavingPolicy(true);
    const result = await updateGlobalSystemPolicies(policies, currentSuperAdminName);
    setSavingPolicy(false);
    if (result.success) {
      setPolicies(result.policies);
      setNotification('Global platform governance policies updated and audited.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleDualControlDecision = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    const result = await processDualControlDecision({
      requestId,
      decision,
      approverName: currentSuperAdminName,
    });
    if (result.success) {
      setNotification(result.message);
      await loadAllGovernanceData();
      setTimeout(() => setNotification(null), 3500);
    } else {
      setNotification(`Error: ${result.message}`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleRevokeCollaborator = async (collabId: string) => {
    const result = await revokeCollaboratorAccess(collabId, currentSuperAdminName, 'Super Admin manual revocation');
    if (result.success) {
      setNotification(result.message);
      await loadAllGovernanceData();
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleCreateCollaborator = async () => {
    if (!newCollabName || !newCollabEmail) return;

    const expiresAt = new Date(Date.now() + newCollabExpiryDays * 24 * 60 * 60 * 1000).toISOString();

    const result = await createDelegatedCollaborator(
      {
        fullName: newCollabName,
        email: newCollabEmail,
        phone: newCollabPhone || '+256 700 000000',
        role: newCollabRole,
        domainScope: newCollabScope,
        assignedTenants: ['ALL'],
        grantedBy: currentSuperAdminName,
        expiresAt,
        permissions: {
          tenantOnboarding: newCollabRole === 'Admin Collaborator',
          tierManagement: newCollabScope === 'FINANCE',
          policyConfiguration: true,
          dispensingOverrides: newCollabScope === 'CLINICAL_OVERSIGHT',
          posSettings: newCollabScope === 'FINANCE',
          aiSafetyControls: newCollabScope === 'CLINICAL_OVERSIGHT',
          collaboratorManagement: false,
          complianceExport: true,
        },
      },
      currentSuperAdminName
    );

    if (result.success) {
      setNotification(`Delegated Collaborator ${newCollabName} invited successfully.`);
      setShowInviteModal(false);
      setNewCollabName('');
      setNewCollabEmail('');
      await loadAllGovernanceData();
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const pendingApprovalsCount = dualApprovals.filter((a) => a.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Control Plane Header Banner */}
      <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              SUPERUSER CONTROL PLANE §11.17
            </span>
            <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Actor: {currentSuperAdminName} (Full Authority)
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Enterprise Admin &amp; Delegated Governance System
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Full platform control plane for tenant provisioning, global inventory/FEFO policies, clinical dispensing overrides, AI safety guardrails, and dual-control approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllGovernanceData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-2 transition border border-slate-200 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Governance State</span>
          </button>
        </div>
      </div>

      {/* Executive Control Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            id: 'executive',
            title: 'Executive Overview & Health',
            desc: 'Real-time telemetry, platform uptime, and operational health vitals.',
            icon: <Activity className="w-5 h-5" />,
            badge: 'Live',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          },
          {
            id: 'policies',
            title: 'Global Policy Engine',
            desc: 'Centralized safety rules, FEFO inventory, and clinical guardrails.',
            icon: <Sliders className="w-5 h-5" />,
            badge: 'Active',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          },
          {
            id: 'collaborators',
            title: 'Delegated Collaborators',
            desc: 'Scoped administrative delegation and clinical domain overseers.',
            icon: <Users className="w-5 h-5" />,
            badge: `${collaborators.length} Users`,
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          },
          {
            id: 'dualControl',
            title: 'Dual-Control 4-Eyes Queue',
            desc: 'High-risk authorization requests requiring secondary sign-off.',
            icon: <ShieldAlert className="w-5 h-5" />,
            badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pending` : 'Clear',
            badgeColor: pendingApprovalsCount > 0 ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-slate-100 text-slate-700 border-slate-200',
          },
          {
            id: 'incidents',
            title: 'Security Incidents',
            desc: 'Real-time threat logs, audit anomalies, and breach mitigation.',
            icon: <AlertTriangle className="w-5 h-5" />,
            badge: `${incidents.length} Logs`,
            badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
          },
          {
            id: 'feedback',
            title: 'Pharmacy Feedback Inbox',
            desc: 'Tenant support requests, issue escalations, and system reviews.',
            icon: <FileText className="w-5 h-5" />,
            badge: `${feedbackTickets.length} Tickets`,
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          },
        ].map((tab) => {
          const isActive = activeGovernanceTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveGovernanceTab(tab.id as any)}
              className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative border ${
                isActive
                  ? 'bg-blue-50 text-blue-900 border-2 border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isActive ? 'bg-blue-100 text-blue-800 border-blue-200' : tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                </div>
                <h3 className={`text-xs font-black tracking-tight leading-snug line-clamp-1 ${isActive ? 'text-blue-950' : 'text-slate-900'}`}>
                  {tab.title}
                </h3>
                <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isActive ? 'text-blue-800' : 'text-slate-600'}`}>
                  {tab.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className={isActive ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'}>
                  {isActive ? '← Current view' : 'Go to section →'}
                </span>
                <span className={isActive ? 'text-blue-700 font-bold' : 'text-slate-400'}>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Executive Overview */}
      {activeGovernanceTab === 'executive' && (
        <div className="space-y-5">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-[#E3ECE8] rounded-3xl space-y-1 shadow-xs">
              <span className="text-xs font-bold text-[#5E7A70] uppercase tracking-wider block">Network Tenants</span>
              <span className="text-2xl font-black text-[#263B33]">4 Active Pharmacies</span>
              <span className="text-[11px] text-[#20A66A] block font-medium">100% NDA License Validated</span>
            </div>

            <div className="p-5 bg-white border border-[#E3ECE8] rounded-3xl space-y-1 shadow-xs">
              <span className="text-xs font-bold text-[#20A66A] uppercase tracking-wider block">Monthly Recurring (MRR)</span>
              <span className="text-2xl font-black text-[#20A66A]">{formatUGX(3450000)}</span>
              <span className="text-[11px] text-[#5E7A70] block">Across 4 Tier Subscriptions</span>
            </div>

            <div className="p-5 bg-white border border-[#E3ECE8] rounded-3xl space-y-1 shadow-xs">
              <span className="text-xs font-bold text-[#2F80C9] uppercase tracking-wider block">Active Collaborators</span>
              <span className="text-2xl font-black text-[#2F80C9]">{collaborators.filter(c => c.status === 'ACTIVE').length} Delegated</span>
              <span className="text-[11px] text-[#5E7A70] block">2 Domain Specialists Active</span>
            </div>

            <div className="p-5 bg-white border border-[#E3ECE8] rounded-3xl space-y-1 shadow-xs">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Dual-Control Pending</span>
              <span className="text-2xl font-black text-amber-800">{pendingApprovalsCount} Actions</span>
              <span className="text-[11px] text-amber-700 block">Requires 4-Eyes Super Admin Review</span>
            </div>
          </div>

          {/* Quick Dual-Control Action Center */}
          <div className="p-5 bg-white border border-[#E3ECE8] rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                High-Risk Actions Awaiting Superuser Dual-Control Approval
              </h4>
              <span className="text-xs text-[#5E7A70]">§11.17 4-Eyes Principle</span>
            </div>

            <div className="divide-y divide-[#E3ECE8]">
              {dualApprovals.filter(a => a.status === 'PENDING_APPROVAL').map((req) => (
                <div key={req.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                        {req.actionType}
                      </span>
                      <span className="text-xs font-bold text-[#263B33]">{req.targetTenantName}</span>
                      <span className="text-[10px] text-[#5E7A70]">Req By: {req.requestedBy}</span>
                    </div>
                    <p className="text-xs text-[#5E7A70]">{req.requestDetails}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => handleDualControlDecision(req.id, 'APPROVED')}
                      className="px-3.5 py-1.5 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Action
                    </button>
                    <button
                      onClick={() => handleDualControlDecision(req.id, 'REJECTED')}
                      className="px-3.5 py-1.5 bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] border border-[#E3ECE8] text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Global Policy Engine */}
      {activeGovernanceTab === 'policies' && policies && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E3ECE8] rounded-3xl p-6 space-y-6 shadow-xs">
            
            {/* Section A: Inventory, Markup & FEFO Expiry Rules */}
            <div className="space-y-4">
              <div className="border-b border-[#E3ECE8] pb-2">
                <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#20A66A]" />
                  1. Global Inventory, Pricing, Batch Rules &amp; FEFO Expiry Policy
                </h4>
                <p className="text-xs text-[#5E7A70] mt-0.5">
                  Platform-wide stock pricing multipliers, clearance markdown triggers, and quarantine enforcement.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#263B33] uppercase tracking-wider mb-1">
                    Default Retail Markup (%)
                  </label>
                  <input
                    type="number"
                    value={policies.defaultMarkupPercent}
                    onChange={(e) => setPolicies({ ...policies, defaultMarkupPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-xs text-[#20A66A] font-bold focus:outline-none focus:border-[#20A66A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#263B33] uppercase tracking-wider mb-1">
                    FEFO &lt; 30 Days Markdown (%)
                  </label>
                  <input
                    type="number"
                    value={policies.fefoMarkdown30DaysDiscount}
                    onChange={(e) => setPolicies({ ...policies, fefoMarkdown30DaysDiscount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-xs text-amber-800 font-bold focus:outline-none focus:border-[#20A66A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#263B33] uppercase tracking-wider mb-1">
                    FEFO &lt; 60 Days Markdown (%)
                  </label>
                  <input
                    type="number"
                    value={policies.fefoMarkdown60DaysDiscount}
                    onChange={(e) => setPolicies({ ...policies, fefoMarkdown60DaysDiscount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-xs text-[#2F80C9] font-bold focus:outline-none focus:border-[#20A66A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-[#F8FBFA] rounded-2xl border border-[#E3ECE8]">
                <input
                  type="checkbox"
                  id="autoQuarantine"
                  checked={policies.autoQuarantineExpiredStock}
                  onChange={(e) => setPolicies({ ...policies, autoQuarantineExpiredStock: e.target.checked })}
                  className="rounded text-[#20A66A] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoQuarantine" className="text-xs text-[#263B33] cursor-pointer">
                  <strong>Strict NDA Quarantine Protocol:</strong> Automatically move expired drugs into isolated holding vault and block POS barcode scanning.
                </label>
              </div>
            </div>

            {/* Section B: Clinical & Dispensing Overrides */}
            <div className="space-y-4">
              <div className="border-b border-[#E3ECE8] pb-2">
                <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2F80C9]" />
                  2. Prescriptions, Workflow Permissions &amp; Dispensing Overrides
                </h4>
                <p className="text-xs text-[#5E7A70] mt-0.5">
                  Supervising pharmacist authority, controlled substance safety locks, and emergency override permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3.5 bg-[#F8FBFA] rounded-2xl border border-[#E3ECE8]">
                  <input
                    type="checkbox"
                    id="sched1Lock"
                    checked={policies.ndaControlledDrugsSchedule1Lock}
                    onChange={(e) => setPolicies({ ...policies, ndaControlledDrugsSchedule1Lock: e.target.checked })}
                    className="rounded text-[#2F80C9] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="sched1Lock" className="text-xs text-[#263B33] cursor-pointer">
                    <strong>NDA Schedule 1 &amp; 2 Locks:</strong> Strict prescription verification mandatory before narcotic dispensing.
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-[#F8FBFA] rounded-2xl border border-[#E3ECE8]">
                  <input
                    type="checkbox"
                    id="dualSignoff"
                    checked={policies.requireDualPharmacistSignoffForOpiates}
                    onChange={(e) => setPolicies({ ...policies, requireDualPharmacistSignoffForOpiates: e.target.checked })}
                    className="rounded text-[#2F80C9] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="dualSignoff" className="text-xs text-[#263B33] cursor-pointer">
                    <strong>Dual Pharmacist Signoff:</strong> Require two PIN confirmations for high-risk opiate dispensing.
                  </label>
                </div>
              </div>
            </div>

            {/* Section C: AI Safety & Clinical Decision Support Controls */}
            <div className="space-y-4">
              <div className="border-b border-[#E3ECE8] pb-2">
                <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  3. AI Features &amp; Prompt Safety Controls
                </h4>
                <p className="text-xs text-[#5E7A70] mt-0.5">
                  Gemini clinical counseling guardrails, hallucination filters, and patient data de-identification.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3.5 bg-[#F8FBFA] rounded-2xl border border-[#E3ECE8]">
                  <input
                    type="checkbox"
                    id="aiAssistant"
                    checked={policies.aiClinicalAssistantEnabled}
                    onChange={(e) => setPolicies({ ...policies, aiClinicalAssistantEnabled: e.target.checked })}
                    className="rounded text-purple-600 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="aiAssistant" className="text-xs text-[#263B33] cursor-pointer">
                    <strong>AI Assistant:</strong> Enable Gemini Clinical Co-Pilot.
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-[#F8FBFA] rounded-2xl border border-[#E3ECE8]">
                  <input
                    type="checkbox"
                    id="hallucinationFilter"
                    checked={policies.aiHallucinationFilterEnabled}
                    onChange={(e) => setPolicies({ ...policies, aiHallucinationFilterEnabled: e.target.checked })}
                    className="rounded text-purple-600 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="hallucinationFilter" className="text-xs text-[#263B33] cursor-pointer">
                    <strong>Hallucination Guardrails:</strong> Cross-reference with BNF formulary.
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-[#F8FBFA] rounded-2xl border border-[#E3ECE8]">
                  <input
                    type="checkbox"
                    id="redactPrompt"
                    checked={policies.aiPatientPromptRedaction}
                    onChange={(e) => setPolicies({ ...policies, aiPatientPromptRedaction: e.target.checked })}
                    className="rounded text-purple-600 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="redactPrompt" className="text-xs text-[#263B33] cursor-pointer">
                    <strong>Prompt Redaction:</strong> Strip patient PII from prompts.
                  </label>
                </div>
              </div>
            </div>

            {/* Save Policies Action */}
            <div className="pt-4 border-t border-[#E3ECE8] flex items-center justify-end">
              <button
                onClick={handleSavePolicies}
                disabled={savingPolicy}
                className="px-6 py-2.5 bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                {savingPolicy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save &amp; Propagate Global Policies</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Delegated Collaborators Matrix */}
      {activeGovernanceTab === 'collaborators' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#263B33]">Delegated Collaborator Authority Matrix (§11.17)</h4>
              <p className="text-xs text-[#5E7A70]">
                Grant time-bounded, scoped administrative privileges to specialist domain experts.
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Delegated Collaborator</span>
            </button>
          </div>

          <div className="bg-white border border-[#E3ECE8] rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#263B33]">
                <thead className="bg-[#F8FBFA] text-[#5E7A70] uppercase text-[10px] tracking-wider border-b border-[#E3ECE8]">
                  <tr>
                    <th className="p-4">Collaborator</th>
                    <th className="p-4">Role &amp; Domain Scope</th>
                    <th className="p-4">Tenant Scope</th>
                    <th className="p-4">Granted By / Validity</th>
                    <th className="p-4">Session Token</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3ECE8]">
                  {collaborators.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FBFA] transition">
                      <td className="p-4">
                        <span className="font-bold text-[#263B33] block">{c.fullName}</span>
                        <span className="text-[11px] text-[#5E7A70] font-mono block">{c.email}</span>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 block w-max">
                          {c.role}
                        </span>
                        <span className="text-[10px] text-[#5E7A70] block mt-0.5">
                          Scope: {c.domainScope}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-[#263B33]">
                        {c.assignedTenants.join(', ')}
                      </td>

                      <td className="p-4 text-[11px]">
                        <span className="text-[#263B33] block">By: {c.grantedBy}</span>
                        <span className="text-[#87A196] block">Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>
                      </td>

                      <td className="p-4">
                        {c.sessionTokenStatus === 'VALID' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#20A66A]" /> VALID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-[#D64545] border border-red-200 flex items-center gap-1 w-max">
                            <Ban className="w-2.5 h-2.5" /> FORCE REVOKED
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {c.role !== 'Super Admin' && c.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeCollaborator(c.id)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#D64545] text-[10px] font-bold rounded-lg border border-red-200 transition cursor-pointer"
                          >
                            Revoke Access
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Dual Control Approval Center */}
      {activeGovernanceTab === 'dualControl' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#E3ECE8] rounded-3xl flex items-center justify-between shadow-xs">
            <div>
              <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Dual-Control 4-Eyes Governance Queue (§11.17)
              </h4>
              <p className="text-xs text-[#5E7A70] mt-0.5">
                Critical platform actions require explicit two-party approval to prevent unilateral errors or rogue changes.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
              {pendingApprovalsCount} Actions Pending
            </span>
          </div>

          <div className="space-y-3">
            {dualApprovals.map((req) => (
              <div
                key={req.id}
                className="p-5 bg-white border border-[#E3ECE8] rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                      {req.actionType}
                    </span>
                    <span className="text-xs font-bold text-[#263B33]">{req.targetTenantName}</span>
                    <span className="text-[10px] text-[#87A196] font-mono">Ref: {req.id}</span>
                  </div>
                  <p className="text-xs text-[#5E7A70]">{req.requestDetails}</p>
                  <div className="flex items-center gap-3 text-[11px] text-[#87A196] pt-1">
                    <span>Requested by: <strong className="text-[#263B33]">{req.requestedBy}</strong> ({req.requestedByRole})</span>
                    <span>•</span>
                    <span>Date: {new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  {req.status === 'PENDING_APPROVAL' ? (
                    <>
                      <button
                        onClick={() => handleDualControlDecision(req.id, 'APPROVED')}
                        className="px-4 py-2 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Action</span>
                      </button>
                      <button
                        onClick={() => handleDualControlDecision(req.id, 'REJECTED')}
                        className="px-4 py-2 bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      req.status === 'APPROVED' ? 'bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20' : 'bg-red-50 text-[#D64545] border border-red-200'
                    }`}>
                      {req.status} by {req.approvedBy}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Security Incidents */}
      {activeGovernanceTab === 'incidents' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#E3ECE8] rounded-3xl shadow-xs">
            <h4 className="text-sm font-bold text-[#263B33]">Platform Security Incident Log &amp; Mitigation</h4>
            <p className="text-xs text-[#5E7A70] mt-0.5">
              Automated anomaly detection, unauthorized override attempts, and access rate-limit events.
            </p>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-5 bg-white border border-[#E3ECE8] rounded-3xl space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.severity === 'HIGH' || inc.severity === 'CRITICAL'
                        ? 'bg-red-50 text-[#D64545] border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {inc.severity}
                    </span>
                    <h5 className="text-xs font-bold text-[#263B33]">{inc.title}</h5>
                  </div>
                  <span className="text-[10px] text-[#87A196] font-mono">
                    {new Date(inc.detectedAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-[#5E7A70]">{inc.summary}</p>
                <div className="p-2.5 bg-[#F8FBFA] rounded-xl text-[11px] text-[#1E744F] border border-[#E3ECE8]">
                  <strong>Mitigation:</strong> {inc.mitigationSteps}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Pharmacy Feedback Inbox & Admin Reply Center */}
      {activeGovernanceTab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-[#E3ECE8] rounded-3xl shadow-xs">
            <div>
              <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#20A66A]" />
                Pharmacy Feedback Inbox &amp; Support Tickets
              </h4>
              <p className="text-xs text-[#5E7A70] mt-0.5">
                Review inquiries, bug reports, and feedback submitted by client pharmacies, and dispatch official admin replies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 px-3 py-1 rounded-full font-bold">
                {feedbackTickets.length} Total Tickets
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {feedbackTickets.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-[#E3ECE8] rounded-3xl p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-[#2F80C9] uppercase tracking-widest">{t.id}</span>
                      <span className="text-xs font-bold text-[#263B33] bg-[#F0F5F3] px-2.5 py-0.5 rounded-full border border-[#E3ECE8]">
                        {t.clientName}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        t.status === 'Resolved'
                          ? 'bg-[#E8F7F0] text-[#1E744F] border-[#20A66A]/20'
                          : t.status === 'In Progress'
                          ? 'bg-blue-50 text-[#2F80C9] border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {t.status}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        t.urgency === 'Critical'
                          ? 'bg-red-50 text-[#D64545] border-red-200'
                          : t.urgency === 'High Priority'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-[#F0F5F3] text-[#5E7A70] border-[#E3ECE8]'
                      }`}>
                        {t.urgency}
                      </span>
                      <span className="text-[10px] bg-blue-50 text-[#2F80C9] px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                        {t.category}
                      </span>
                    </div>
                    <h5 className="text-sm font-black text-[#263B33] mt-1.5">{t.subject}</h5>
                    <p className="text-[11px] text-[#5E7A70] mt-0.5">
                      Contact: <span className="text-[#263B33]">{t.contactEmail}</span> • <span className="text-[#263B33]">{t.contactPhone}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-[#87A196] font-mono shrink-0">{t.dateSubmitted}</span>
                </div>

                <div className="bg-[#F8FBFA] p-3.5 rounded-2xl border border-[#E3ECE8] text-xs text-[#263B33] leading-relaxed">
                  <p className="text-[10px] font-bold text-[#5E7A70] uppercase tracking-wider mb-1">Submitted Message:</p>
                  {t.message}
                </div>

                {t.adminReply ? (
                  <div className="bg-[#E8F7F0] p-3.5 rounded-2xl border border-[#20A66A]/30 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#1E744F] uppercase tracking-wider">
                      <span>Official Admin Reply — {t.adminReply.repliedBy}</span>
                      <span className="text-[#5E7A70] font-semibold">{t.adminReply.dateReplied}</span>
                    </div>
                    <p className="text-[#263B33] text-xs leading-relaxed font-medium">
                      "{t.adminReply.replyMessage}"
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-amber-800 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Pending Admin Reply
                    </span>

                    <button
                      onClick={() => {
                        setReplyModalTicket(t);
                        setReplyMessageInput('');
                        setReplyStatusChoice('Resolved');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Reply to Pharmacy</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Reply Modal */}
      {replyModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3ECE8] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-xl text-[#263B33]">
            <div className="flex items-center justify-between border-b border-[#E3ECE8] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#20A66A] tracking-wider">Pharmacy Support Desk</span>
                <h4 className="text-base font-bold text-[#263B33]">Reply to {replyModalTicket.clientName}</h4>
              </div>
              <button onClick={() => setReplyModalTicket(null)} className="text-[#5E7A70] hover:text-[#263B33] text-xl cursor-pointer">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#F8FBFA] p-3 rounded-2xl border border-[#E3ECE8]">
                <p className="text-[10px] font-bold text-[#5E7A70] uppercase">Original Inquiry:</p>
                <p className="font-semibold text-[#263B33] mt-0.5">{replyModalTicket.subject}</p>
                <p className="text-[#5E7A70] mt-1 leading-relaxed">{replyModalTicket.message}</p>
              </div>

              {/* Quick Response Templates */}
              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Quick Response Templates:</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReplyMessageInput('Thank you for reporting this. Our engineering team has deployed a patch to resolve the issue immediately.')}
                    className="px-2.5 py-1 bg-white hover:bg-[#F8FBFA] text-[#2F80C9] text-[10px] font-semibold rounded-lg border border-[#E3ECE8] cursor-pointer shadow-xs"
                  >
                    Bug Fix Patch Deployed
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyMessageInput('Thank you for your feature suggestion. This has been reviewed by product design and queued for our v3.3 release.')}
                    className="px-2.5 py-1 bg-white hover:bg-[#F8FBFA] text-purple-700 text-[10px] font-semibold rounded-lg border border-[#E3ECE8] cursor-pointer shadow-xs"
                  >
                    Queued for v3.3 Release
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyMessageInput('Your NDA compliance record and supervising pharmacist license have been verified with National Drug Authority registry.')}
                    className="px-2.5 py-1 bg-white hover:bg-[#F8FBFA] text-[#1E744F] text-[10px] font-semibold rounded-lg border border-[#E3ECE8] cursor-pointer shadow-xs"
                  >
                    NDA Record Verified
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyMessageInput('Our technical support desk has logged your request and scheduled a direct phone callback within 30 minutes.')}
                    className="px-2.5 py-1 bg-white hover:bg-[#F8FBFA] text-amber-800 text-[10px] font-semibold rounded-lg border border-[#E3ECE8] cursor-pointer shadow-xs"
                  >
                    Support Callback Scheduled
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Official Response Message</label>
                <textarea
                  rows={4}
                  placeholder="Type your response or click a quick template above..."
                  value={replyMessageInput}
                  onChange={(e) => setReplyMessageInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs placeholder-[#87A196] focus:outline-none focus:border-[#20A66A] resize-none"
                  required
                />
              </div>

              {/* Direct Multi-Channel Links */}
              <div className="flex items-center justify-between bg-[#F8FBFA] p-2.5 rounded-xl border border-[#E3ECE8] text-[11px]">
                <span className="text-[#5E7A70] font-semibold">Multi-Channel Direct Dispatch:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${replyModalTicket.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${replyModalTicket.clientName}, regarding your ticket "${replyModalTicket.subject}": ${replyMessageInput}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-[#E8F7F0] text-[#1E744F] hover:bg-[#20A66A] hover:text-white rounded-lg border border-[#20A66A]/20 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    WhatsApp Pharmacy
                  </a>

                  <a
                    href={`mailto:${replyModalTicket.contactEmail}?subject=${encodeURIComponent(`Re: [ZenithRx Ticket ${replyModalTicket.id}] ${replyModalTicket.subject}`)}&body=${encodeURIComponent(`Hello ${replyModalTicket.clientName},\n\n${replyMessageInput}\n\nBest regards,\nZenithRx System Administration`)}`}
                    className="px-2.5 py-1 bg-blue-50 text-[#2F80C9] hover:bg-[#2F80C9] hover:text-white rounded-lg border border-blue-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    Email Pharmacy
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Update Ticket Status</label>
                <select
                  value={replyStatusChoice}
                  onChange={(e) => setReplyStatusChoice(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs font-semibold focus:outline-none focus:border-[#20A66A] cursor-pointer"
                >
                  <option value="Resolved">Resolved &amp; Closed</option>
                  <option value="In Progress">In Progress / Under Investigation</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E3ECE8]">
              <button
                onClick={() => setReplyModalTicket(null)}
                className="px-4 py-2 bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendAdminReply}
                className="px-5 py-2 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Dispatch Reply to Pharmacy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaborator Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3ECE8] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl text-[#263B33]">
            <div className="flex items-center justify-between border-b border-[#E3ECE8] pb-3">
              <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-700" />
                Invite Delegated Collaborator (§11.17)
              </h4>
              <button onClick={() => setShowInviteModal(false)} className="text-[#5E7A70] hover:text-[#263B33] text-xl cursor-pointer">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Full Name &amp; Title</label>
                <input
                  type="text"
                  placeholder="e.g. Pharm. Brenda Namatovu"
                  value={newCollabName}
                  onChange={(e) => setNewCollabName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:border-[#20A66A]"
                />
              </div>

              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="e.g. brenda.namatovu@zenithrx.ug"
                  value={newCollabEmail}
                  onChange={(e) => setNewCollabEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:border-[#20A66A]"
                />
              </div>

              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+256 700 123456"
                  value={newCollabPhone}
                  onChange={(e) => setNewCollabPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:border-[#20A66A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#263B33] font-semibold mb-1">Collaborator Role</label>
                  <select
                    value={newCollabRole}
                    onChange={(e) => setNewCollabRole(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:border-[#20A66A] cursor-pointer"
                  >
                    <option value="Domain Admin">Domain Admin</option>
                    <option value="Admin Collaborator">Admin Collaborator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#263B33] font-semibold mb-1">Domain Scope</label>
                  <select
                    value={newCollabScope}
                    onChange={(e) => setNewCollabScope(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:border-[#20A66A] cursor-pointer"
                  >
                    <option value="CLINICAL_OVERSIGHT">Clinical Oversight</option>
                    <option value="FINANCE">Finance &amp; Billing</option>
                    <option value="INVENTORY">Inventory Master</option>
                    <option value="SECURITY_COMPLIANCE">Security &amp; NDA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Time-Bound Validity (Days)</label>
                <input
                  type="number"
                  value={newCollabExpiryDays}
                  onChange={(e) => setNewCollabExpiryDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] font-bold focus:outline-none focus:border-[#20A66A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E3ECE8]">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollaborator}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Issue Credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminControlPlane;
