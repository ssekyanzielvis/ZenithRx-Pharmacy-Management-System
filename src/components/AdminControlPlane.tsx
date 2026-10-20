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
  X,
  Mail,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Send,
  Key,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  GlobalSystemPolicies,
  DelegatedCollaborator,
  DualControlApprovalRequest,
  SecurityIncident,
  CollaboratorEmailContent,
  getGlobalSystemPolicies,
  updateGlobalSystemPolicies,
  getDelegatedCollaborators,
  createDelegatedCollaborator,
  revokeCollaboratorAccess,
  resendCollaboratorInvite,
  getCollaboratorByInviteToken,
  acceptCollaboratorInvitation,
  generateCollaboratorEmailContent,
  getCollaboratorAcceptanceUrl,
  getDualControlApprovals,
  processDualControlDecision,
  getSecurityIncidents,
  dispatchCollaboratorEmailApi,
} from '../services/adminControlPlaneService';
import { getFeedbackTickets, replyToPharmacyFeedback } from '../services/feedbackService';
import { PharmacyFeedbackTicket } from '../types';
import { formatUGX } from '../services/formatters';
import { InviteCollaboratorPage } from './admin/InviteCollaboratorPage';

interface AdminControlPlaneProps {
  currentSuperAdminName?: string;
  governanceTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const AdminControlPlane: React.FC<AdminControlPlaneProps> = ({
  currentSuperAdminName = 'Dr. Arthur Ssenabulya',
  governanceTab,
  onNavigateTab,
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

  const [isInvitingCollaborator, setIsInvitingCollaborator] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.toLowerCase();
      return h.includes('invite-collaborator') || h.includes('admininvitecollaborator');
    }
    return false;
  });

  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined') {
        const h = window.location.hash.toLowerCase();
        if (h.includes('invite-collaborator') || h.includes('admininvitecollaborator')) {
          setIsInvitingCollaborator(true);
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

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

  // Collaborator Invite Modal & Acceptance State
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabEmail, setNewCollabEmail] = useState('');
  const [newCollabPhone, setNewCollabPhone] = useState('');
  const [newCollabRole, setNewCollabRole] = useState<'Admin Collaborator' | 'Domain Admin'>('Domain Admin');
  const [newCollabScope, setNewCollabScope] = useState<DelegatedCollaborator['domainScope']>('CLINICAL_OVERSIGHT');
  const [newCollabExpiryDays, setNewCollabExpiryDays] = useState<number>(90);
  const [newCollabPerms, setNewCollabPerms] = useState({
    tenantOnboarding: false,
    tierManagement: false,
    policyConfiguration: true,
    dispensingOverrides: true,
    posSettings: false,
    aiSafetyControls: true,
    collaboratorManagement: false,
    complianceExport: true,
  });

  // Official Email & Access Rights Preview Modal
  const [emailPreviewModalCollab, setEmailPreviewModalCollab] = useState<DelegatedCollaborator | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmailText, setCopiedEmailText] = useState(false);
  const [isSendingSmtp, setIsSendingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [showSmtpGuide, setShowSmtpGuide] = useState(false);

  // Invitee Acceptance & Password Creation Portal Modal
  const [showAcceptPortalToken, setShowAcceptPortalToken] = useState<string | null>(null);
  const [acceptingCollab, setAcceptingCollab] = useState<DelegatedCollaborator | null>(null);
  const [acceptPassword, setAcceptPassword] = useState('');
  const [acceptConfirmPassword, setAcceptConfirmPassword] = useState('');
  const [acceptAgreedCompliance, setAcceptAgreedCompliance] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState<string | null>(null);

  const updatePermissionsForScope = (scope: DelegatedCollaborator['domainScope'], role: 'Admin Collaborator' | 'Domain Admin') => {
    setNewCollabPerms({
      tenantOnboarding: role === 'Admin Collaborator' || scope === 'FULL_PLATFORM',
      tierManagement: scope === 'FINANCE' || scope === 'FULL_PLATFORM',
      policyConfiguration: true,
      dispensingOverrides: scope === 'CLINICAL_OVERSIGHT' || scope === 'FULL_PLATFORM',
      posSettings: scope === 'FINANCE' || scope === 'FULL_PLATFORM',
      aiSafetyControls: scope === 'CLINICAL_OVERSIGHT' || scope === 'FULL_PLATFORM',
      collaboratorManagement: scope === 'FULL_PLATFORM',
      complianceExport: true,
    });
  };

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

    // Check if URL or hash contains an invitation acceptance token
    const checkHashForInviteToken = async () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      const search = window.location.search;
      let token: string | null = null;
      if (hash.includes('token=')) {
        const parts = hash.split('token=');
        if (parts[1]) token = parts[1].split('&')[0];
      } else if (search.includes('token=')) {
        const params = new URLSearchParams(search);
        token = params.get('token');
      }

      if (token) {
        const collab = await getCollaboratorByInviteToken(token);
        if (collab) {
          setAcceptingCollab(collab);
          setShowAcceptPortalToken(token);
        }
      }
    };
    checkHashForInviteToken();
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
    if (!newCollabName.trim() || !newCollabEmail.trim()) {
      setNotification('Please specify the full name and official email of the collaborator.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const expiresAt = new Date(Date.now() + newCollabExpiryDays * 24 * 60 * 60 * 1000).toISOString();

    const result = await createDelegatedCollaborator(
      {
        fullName: newCollabName.trim(),
        email: newCollabEmail.trim(),
        phone: newCollabPhone.trim() || '+256 700 000000',
        role: newCollabRole,
        domainScope: newCollabScope,
        assignedTenants: ['ALL'],
        grantedBy: currentSuperAdminName,
        expiresAt,
        permissions: newCollabPerms,
      },
      currentSuperAdminName
    );

    if (result.success) {
      setNotification(`Official invitation dispatched to ${newCollabName}! Status set to INVITATION PENDING.`);
      setShowInviteModal(false);
      setNewCollabName('');
      setNewCollabEmail('');
      setNewCollabPhone('');
      await loadAllGovernanceData();
      setEmailPreviewModalCollab(result.collaborator);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleResendInvite = async (collabId: string) => {
    const result = await resendCollaboratorInvite(collabId, currentSuperAdminName);
    if (result.success && result.collaborator) {
      setNotification(result.message);
      await loadAllGovernanceData();
      setEmailPreviewModalCollab(result.collaborator);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleOpenAcceptanceForCollab = (collab: DelegatedCollaborator) => {
    if (collab.invitationToken) {
      setAcceptingCollab(collab);
      setShowAcceptPortalToken(collab.invitationToken);
      setAcceptPassword('');
      setAcceptConfirmPassword('');
      setAcceptAgreedCompliance(false);
      setAcceptError(null);
      setAcceptSuccess(null);
    }
  };

  const handleAcceptInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptError(null);

    if (!showAcceptPortalToken) return;
    if (!acceptAgreedCompliance) {
      setAcceptError('Please check the compliance declaration to accept administrative responsibilities.');
      return;
    }
    if (acceptPassword.length < 8) {
      setAcceptError('Password must contain at least 8 characters with numbers and letters.');
      return;
    }
    if (acceptPassword !== acceptConfirmPassword) {
      setAcceptError('The passwords do not match. Please re-enter.');
      return;
    }

    const result = await acceptCollaboratorInvitation(showAcceptPortalToken, acceptPassword);
    if (result.success && result.collaborator) {
      setAcceptSuccess(`Account activated! Welcome, ${result.collaborator.fullName}. Your administrative authority is active.`);
      await loadAllGovernanceData();
      setTimeout(() => {
        setShowAcceptPortalToken(null);
        setAcceptingCollab(null);
        setAcceptPassword('');
        setAcceptConfirmPassword('');
        setAcceptSuccess(null);
      }, 2500);
    } else {
      setAcceptError(result.message);
    }
  };

  const handleCopyLink = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const pendingApprovalsCount = dualApprovals.filter((a) => a.status === 'PENDING_APPROVAL').length;

  if (isInvitingCollaborator) {
    return (
      <InviteCollaboratorPage
        currentSuperAdminName={currentSuperAdminName}
        onBack={() => {
          setIsInvitingCollaborator(false);
          if (onNavigateTab) onNavigateTab('adminDelegated');
          if (typeof window !== 'undefined' && window.location.hash.includes('invite')) {
            window.location.hash = '#adminDelegated';
          }
        }}
        onSuccess={() => {
          setIsInvitingCollaborator(false);
          void loadAllGovernanceData();
          if (onNavigateTab) onNavigateTab('adminDelegated');
        }}
      />
    );
  }

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
                  <Sparkles className="w-4 h-4 text-[#20A66A]" />
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
                    className="rounded text-[#20A66A] w-4 h-4 cursor-pointer"
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
                    className="rounded text-[#20A66A] w-4 h-4 cursor-pointer"
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
                    className="rounded text-[#20A66A] w-4 h-4 cursor-pointer"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-[#263B33] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#20A66A]" />
                Delegated Collaborator Authority Matrix (§11.17)
              </h4>
              <p className="text-xs text-[#5E7A70]">
                Grant time-bounded, scoped administrative privileges to specialist domain experts. Full tracking of invitation dispatch, access rights level, and password creation.
              </p>
            </div>
            <button
              onClick={() => {
                setIsInvitingCollaborator(true);
                if (onNavigateTab) {
                  onNavigateTab('adminInviteCollaborator');
                }
                if (typeof window !== 'undefined') {
                  window.location.hash = '#invite-collaborator';
                }
              }}
              className="px-4 py-2 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Invite Delegated Collaborator</span>
            </button>
          </div>

          <div className="bg-white border border-[#E3ECE8] rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#263B33]">
                <thead className="bg-[#F8FBFA] text-[#5E7A70] uppercase text-[10px] tracking-wider border-b border-[#E3ECE8]">
                  <tr>
                    <th className="p-4">Collaborator</th>
                    <th className="p-4">Role &amp; Domain Scope</th>
                    <th className="p-4">Invitation &amp; Access Status</th>
                    <th className="p-4">Session Credentials</th>
                    <th className="p-4">Granted By / Expiry</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3ECE8]">
                  {collaborators.map((c) => {
                    const isPending = c.status === 'INVITATION_PENDING';
                    const isActive = c.status === 'ACTIVE';
                    const isRevoked = c.status === 'REVOKED';

                    return (
                      <tr key={c.id} className="hover:bg-[#F8FBFA] transition">
                        <td className="p-4">
                          <span className="font-bold text-[#263B33] block text-sm">{c.fullName}</span>
                          <span className="text-[11px] text-[#5E7A70] font-mono block">{c.email}</span>
                          <span className="text-[10px] text-[#87A196] block">{c.phone}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2F80C9] border border-blue-200 block w-max">
                            {c.role}
                          </span>
                          <span className="text-[10px] text-[#5E7A70] block mt-1 font-semibold">
                            Scope: {c.domainScope?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-[#87A196] block">
                            Tenants: {c.assignedTenants.join(', ')}
                          </span>
                        </td>

                        <td className="p-4">
                          {isPending && (
                            <div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 w-max">
                                <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                INVITATION PENDING
                              </span>
                              <span className="text-[10px] text-amber-700 block mt-1">
                                Invited: {c.invitationSentAt ? new Date(c.invitationSentAt).toLocaleDateString() : new Date(c.grantedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {isActive && (
                            <div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/30 flex items-center gap-1.5 w-max">
                                <CheckCircle2 className="w-3 h-3 text-[#20A66A]" />
                                ACTIVE &amp; VALIDATED
                              </span>
                              <span className="text-[10px] text-[#5E7A70] block mt-1">
                                Accepted: {c.invitationAcceptedAt ? new Date(c.invitationAcceptedAt).toLocaleDateString() : new Date(c.grantedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {isRevoked && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-[#D64545] border border-red-200 flex items-center gap-1.5 w-max">
                              <Ban className="w-3 h-3" />
                              ACCESS REVOKED
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {isPending ? (
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 w-max">
                                <Key className="w-2.5 h-2.5 text-amber-600" /> Awaiting Password Setup
                              </span>
                              {c.emailDeliveryStatus === 'SENT' ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/30 flex items-center gap-1 w-max">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-[#20A66A]" /> Sent via SMTP
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-max" title="Automated SMTP not configured in .env. Click Send Email to dispatch via mail client.">
                                  <Mail className="w-2.5 h-2.5 text-amber-600" /> Pending SMTP Config
                                </span>
                              )}
                              {c.invitationToken && (
                                <button
                                  onClick={() => handleCopyLink(getCollaboratorAcceptanceUrl(c.invitationToken!))}
                                  className="text-[10px] text-[#2F80C9] hover:text-blue-800 flex items-center gap-1 cursor-pointer font-medium"
                                  title="Copy Direct Invite Link"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                                </button>
                              )}
                            </div>
                          ) : c.sessionTokenStatus === 'VALID' ? (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-2.5 h-2.5 text-[#20A66A]" /> SESSION ACTIVE
                              </span>
                              <span className="text-[10px] text-[#5E7A70] block">Credentials Set</span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-[#D64545] border border-red-200 flex items-center gap-1 w-max">
                              <Ban className="w-2.5 h-2.5" /> FORCE REVOKED
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-[11px]">
                          <span className="text-[#263B33] block font-medium">By: {c.grantedBy}</span>
                          <span className="text-[#87A196] block">Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* For Pending Collaborators */}
                            {isPending && (
                              <>
                                <button
                                  onClick={() => setEmailPreviewModalCollab(c)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#2F80C9] text-[10px] font-bold rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1"
                                  title="View Official Invitation Email & Access Rights Preview"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>Email &amp; Rights</span>
                                </button>

                                {c.invitationToken && (
                                  <a
                                    href={getCollaboratorAcceptanceUrl(c.invitationToken)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-[#E8F7F0] hover:bg-[#20A66A] text-[#1E744F] hover:text-white text-[10px] font-bold rounded-lg border border-[#20A66A]/30 transition flex items-center gap-1"
                                    title="Open Invitee Acceptance Dedicated Page"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Acceptance Page</span>
                                  </a>
                                )}

                                <a
                                  href={`mailto:${c.email}?subject=${encodeURIComponent(`[ZenithRx Enterprise] Official Appointment: Delegated ${c.role} (${c.domainScope})`)}&body=${encodeURIComponent(
                                    `Dear ${c.fullName},\n\nYou have been officially appointed as ${c.role} (${c.domainScope}) on the ZenithRx Enterprise Pharmacy Management System by ${c.grantedBy}.\n\nPlease accept your invitation and configure your password here:\n${getCollaboratorAcceptanceUrl(c.invitationToken || '')}\n\nSecurity Token: ${c.invitationToken}\nAppointment Expiry: ${new Date(c.expiresAt).toLocaleDateString()}\n\nNational Drug Authority (NDA) Uganda Statutory Compliance Notice.`
                                  )}`}
                                  className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold rounded-lg border border-sky-200 transition flex items-center gap-1"
                                  title="Open default email app to send invitation email to this collaborator"
                                >
                                  <Send className="w-3 h-3 text-sky-600" />
                                  <span>Send Email</span>
                                </a>

                                <button
                                  onClick={() => handleResendInvite(c.id)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200 transition cursor-pointer flex items-center gap-1"
                                  title="Re-dispatch invitation email"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Resend</span>
                                </button>
                              </>
                            )}

                            {/* For Active Collaborators */}
                            {isActive && (
                              <button
                                onClick={() => setEmailPreviewModalCollab(c)}
                                className="px-2.5 py-1 bg-[#F8FBFA] hover:bg-[#F0F5F3] text-[#263B33] text-[10px] font-bold rounded-lg border border-[#E3ECE8] transition cursor-pointer flex items-center gap-1"
                                title="View Granted Access Rights"
                              >
                                <Eye className="w-3 h-3 text-[#20A66A]" />
                                <span>View Rights</span>
                              </button>
                            )}

                            {/* Revoke Option */}
                            {c.role !== 'Super Admin' && !isRevoked && (
                              <button
                                onClick={() => handleRevokeCollaborator(c.id)}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#D64545] text-[10px] font-bold rounded-lg border border-red-200 transition cursor-pointer"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                    className="px-2.5 py-1 bg-white hover:bg-[#F8FBFA] text-[#20A66A] text-[10px] font-semibold rounded-lg border border-[#E3ECE8] cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E3ECE8] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-xl text-[#263B33] my-6">
            <div className="flex items-center justify-between border-b border-[#E3ECE8] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#20A66A] tracking-wider block">
                  SUPERUSER GOVERNANCE §11.17
                </span>
                <h4 className="text-base font-bold text-[#263B33] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#20A66A]" />
                  Invite Delegated Collaborator
                </h4>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-[#5E7A70] hover:text-[#263B33] text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#F0F7F4] border border-[#20A66A]/20 rounded-2xl text-[11px] text-[#1E744F] leading-relaxed">
                <strong>Invitation Protocol:</strong> An official email with an immutable token and detailed access rights will be generated. The invitee must review what they can control and create their secure password to activate administrative authority.
              </div>

              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Full Name &amp; Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Pharm. Brenda Namatovu"
                  value={newCollabName}
                  onChange={(e) => setNewCollabName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs focus:outline-none focus:border-[#20A66A]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#263B33] font-semibold mb-1">Official Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. brenda.namatovu@zenithrx.ug"
                    value={newCollabEmail}
                    onChange={(e) => setNewCollabEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs focus:outline-none focus:border-[#20A66A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#263B33] font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+256 700 123456"
                    value={newCollabPhone}
                    onChange={(e) => setNewCollabPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs focus:outline-none focus:border-[#20A66A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#263B33] font-semibold mb-1">Collaborator Role</label>
                  <select
                    value={newCollabRole}
                    onChange={(e) => {
                      const r = e.target.value as any;
                      setNewCollabRole(r);
                      updatePermissionsForScope(newCollabScope, r);
                    }}
                    className="w-full px-2.5 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs focus:outline-none focus:border-[#20A66A] cursor-pointer"
                  >
                    <option value="Domain Admin">Domain Admin</option>
                    <option value="Admin Collaborator">Admin Collaborator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#263B33] font-semibold mb-1">Domain Scope</label>
                  <select
                    value={newCollabScope}
                    onChange={(e) => {
                      const s = e.target.value as any;
                      setNewCollabScope(s);
                      updatePermissionsForScope(s, newCollabRole);
                    }}
                    className="w-full px-2.5 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs focus:outline-none focus:border-[#20A66A] cursor-pointer"
                  >
                    <option value="CLINICAL_OVERSIGHT">Clinical Oversight</option>
                    <option value="FINANCE">Finance &amp; Billing</option>
                    <option value="INVENTORY">Inventory Master</option>
                    <option value="SECURITY_COMPLIANCE">Security &amp; NDA</option>
                    <option value="FULL_PLATFORM">Full Platform</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#263B33] font-semibold mb-1">Time-Bound Validity (Days)</label>
                <input
                  type="number"
                  value={newCollabExpiryDays}
                  onChange={(e) => setNewCollabExpiryDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] text-xs font-bold focus:outline-none focus:border-[#20A66A]"
                />
              </div>

              {/* Explicit Access Rights Level & Controls Breakdown */}
              <div className="border border-[#E3ECE8] rounded-2xl p-3 bg-[#F8FBFA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#263B33] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#20A66A]" />
                    Access Rights &amp; System Controls (§11.17)
                  </span>
                  <span className="text-[10px] text-[#5E7A70]">Visible in Invitee Email</span>
                </div>
                <p className="text-[10px] text-[#5E7A70] leading-snug">
                  Select which administrative powers this collaborator will control upon accepting their invitation:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  {[
                    { key: 'dispensingOverrides', label: 'Clinical Dispensing & Opiate Overrides' },
                    { key: 'policyConfiguration', label: 'Global Safety Policies & FEFO Rules' },
                    { key: 'aiSafetyControls', label: 'AI Clinical Safety & Prompt Redaction' },
                    { key: 'tenantOnboarding', label: 'Pharmacy Tenant Provisioning' },
                    { key: 'tierManagement', label: 'SaaS Billing Tiers & Payer Tariffs' },
                    { key: 'posSettings', label: 'POS Registers & Cashier Governance' },
                    { key: 'complianceExport', label: 'NDA Regulatory & Audit Exports' },
                    { key: 'collaboratorManagement', label: 'Collaborator Elevation Control' },
                  ].map((p) => {
                    const isChecked = (newCollabPerms as any)[p.key];
                    return (
                      <label
                        key={p.key}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-[#E8F7F0] border-[#20A66A]/30 text-[#1E744F] font-semibold'
                            : 'bg-white border-[#E3ECE8] text-[#5E7A70]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setNewCollabPerms({
                              ...newCollabPerms,
                              [p.key]: e.target.checked,
                            })
                          }
                          className="rounded text-[#20A66A] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="line-clamp-1">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E3ECE8]">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollaborator}
                className="px-5 py-2 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send Invitation Email &amp; Issue Token</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Invitation Email & Access Rights Preview Modal */}
      {emailPreviewModalCollab && (() => {
        const emailData = generateCollaboratorEmailContent(emailPreviewModalCollab);
        const inviteUrl = getCollaboratorAcceptanceUrl(emailPreviewModalCollab.invitationToken || '');

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-[#E3ECE8] rounded-3xl w-full max-w-2xl p-6 space-y-4 shadow-2xl text-[#263B33] my-6">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#E3ECE8] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#E8F7F0] text-[#1E744F]">
                    <Mail className="w-5 h-5 text-[#20A66A]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#20A66A] tracking-wider block">
                      OFFICIAL INVITATION DISPATCH PREVIEW
                    </span>
                    <h4 className="text-base font-bold text-[#263B33]">
                      Delegated Authority Appointment Email
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setEmailPreviewModalCollab(null)}
                  className="text-[#5E7A70] hover:text-[#263B33] text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Status Notice for Administrator */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    <strong>Status:</strong> {emailPreviewModalCollab.status === 'INVITATION_PENDING' ? 'Invitation Pending Acceptance (Awaiting Password Creation)' : 'Active & Validated'}
                  </span>
                </div>
                <span className="text-[10px] text-amber-800 font-mono">
                  Ref: {emailPreviewModalCollab.id}
                </span>
              </div>

              {/* Email Delivery Diagnostics & Live SMTP Dispatch */}
              <div className="p-4 rounded-2xl bg-[#F8FBFA] border border-[#E3ECE8] text-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#20A66A]" />
                    <span className="font-bold text-[#263B33]">Automated Email Delivery Channel:</span>
                    {emailPreviewModalCollab.emailDeliveryStatus === 'SENT' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#20A66A]" /> Delivered via SMTP
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending SMTP Configuration
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSendingSmtp}
                      onClick={async () => {
                        setIsSendingSmtp(true);
                        setSmtpFeedback(null);
                        const res = await dispatchCollaboratorEmailApi(emailPreviewModalCollab, emailData);
                        setIsSendingSmtp(false);
                        if (res.delivered) {
                          setSmtpFeedback({
                            id: emailPreviewModalCollab.id,
                            success: true,
                            message: `Invitation successfully transmitted to ${emailPreviewModalCollab.email} via SMTP!`,
                          });
                          await loadAllGovernanceData();
                        } else {
                          setSmtpFeedback({
                            id: emailPreviewModalCollab.id,
                            success: false,
                            message: res.message || res.error || 'SMTP credentials (SMTP_USER & SMTP_PASS) not configured in .env. Click "Open in Mail Client" or configure Gmail App Password.',
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-[10px] rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-60 shadow-xs"
                    >
                      {isSendingSmtp ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending via SMTP...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Dispatch via Server SMTP Now</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSmtpGuide(!showSmtpGuide)}
                      className="text-[10px] text-[#2F80C9] hover:underline font-semibold"
                    >
                      {showSmtpGuide ? 'Hide SMTP Guide' : 'Connect Gmail SMTP Guide'}
                    </button>
                  </div>
                </div>

                {smtpFeedback && (
                  <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                    smtpFeedback.success
                      ? 'bg-[#E8F7F0] border-[#20A66A]/40 text-[#1E744F]'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    {smtpFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#20A66A] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>{smtpFeedback.message}</span>
                  </div>
                )}

                {showSmtpGuide && (
                  <div className="p-3 bg-white border border-[#E3ECE8] rounded-xl text-[11px] space-y-2 text-[#263B33]">
                    <p className="font-bold text-[#20A66A]">
                      How to Enable Automated Background Delivery to Any Email (Gmail, Outlook, Yahoo):
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[#5E7A70]">
                      <li>Open your <code>.env</code> file in the project root.</li>
                      <li>
                        Add your Gmail App Password credentials:
                        <pre className="mt-1 p-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-lg font-mono text-[10px] text-[#263B33] overflow-x-auto">
SMTP_HOST="smtp.gmail.com"&#10;SMTP_PORT=465&#10;SMTP_SECURE=true&#10;SMTP_USER="your_email@gmail.com"&#10;SMTP_PASS="your_16_digit_app_password"&#10;SMTP_FROM="ZenithRx Enterprise &lt;notifications@zenithrx.ug&gt;"
                        </pre>
                      </li>
                      <li>
                        To get a Gmail App Password: Go to <strong>Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App passwords</strong> &rarr; generate a password for &quot;ZenithRx&quot;.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Email Envelope Container */}
              <div className="border border-[#E3ECE8] rounded-2xl overflow-hidden bg-[#F8FBFA] text-xs">
                {/* Email Header Fields */}
                <div className="bg-slate-100/70 p-3.5 border-b border-[#E3ECE8] space-y-1 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#5E7A70] w-16">To:</span>
                    <strong className="text-[#263B33]">{emailData.recipientName} &lt;{emailData.recipientEmail}&gt;</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#5E7A70] w-16">From:</span>
                    <span className="text-[#263B33]">ZenithRx Governance System &lt;governance@zenithrx.ug&gt; on behalf of {emailData.invitedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#5E7A70] w-16">Subject:</span>
                    <strong className="text-[#20A66A]">{emailData.subject}</strong>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-5 space-y-4 bg-white text-[#263B33] leading-relaxed">
                  <div>
                    <p className="font-bold text-sm text-[#263B33]">
                      Dear {emailData.recipientName},
                    </p>
                    <p className="text-xs text-[#5E7A70] mt-1">
                      You have been appointed by <strong>{emailData.invitedBy}</strong> (Super Admin) to serve with delegated administrative authority on the <strong>ZenithRx Enterprise Pharmacy Management System</strong>.
                    </p>
                  </div>

                  {/* Appointment Details Box */}
                  <div className="bg-[#F8FBFA] border border-[#E3ECE8] p-3.5 rounded-2xl grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-[#5E7A70] block text-[10px] uppercase font-bold">Appointed Role</span>
                      <strong className="text-[#20A66A] text-xs">{emailData.role}</strong>
                    </div>
                    <div>
                      <span className="text-[#5E7A70] block text-[10px] uppercase font-bold">Domain Scope</span>
                      <strong className="text-[#263B33]">{emailData.domainScope.replace(/_/g, ' ')}</strong>
                    </div>
                    <div>
                      <span className="text-[#5E7A70] block text-[10px] uppercase font-bold">Tenant Authority</span>
                      <strong className="text-[#263B33]">{emailPreviewModalCollab.assignedTenants.join(', ')}</strong>
                    </div>
                    <div>
                      <span className="text-[#5E7A70] block text-[10px] uppercase font-bold">Validity Until</span>
                      <strong className="text-[#263B33]">{new Date(emailData.expiresAt).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  {/* What the invitee can control */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-[#20A66A]" />
                      <h5 className="font-bold text-xs text-[#263B33]">
                        Designated Level of Access Rights &amp; What You Can Control (§11.17)
                      </h5>
                    </div>
                    <p className="text-[11px] text-[#5E7A70]">
                      In accordance with National Drug Authority (NDA) statutory regulations and ZenithRx governance policies, you are granted the following administrative powers:
                    </p>

                    <div className="divide-y divide-[#E3ECE8] border border-[#E3ECE8] rounded-2xl overflow-hidden bg-[#F8FBFA]">
                      {emailData.controlsBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 flex items-start gap-2.5 text-[11px] ${
                            item.granted ? 'bg-white' : 'bg-slate-50 opacity-60'
                          }`}
                        >
                          <div className="mt-0.5">
                            {item.granted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#20A66A]" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <strong className={item.granted ? 'text-[#263B33]' : 'text-slate-500 line-through'}>
                              {item.category}
                            </strong>
                            <p className="text-[10px] text-[#5E7A70] mt-0.5">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call to action instructions */}
                  <div className="p-3.5 bg-[#E8F7F0] border border-[#20A66A]/30 rounded-2xl text-xs space-y-2">
                    <p className="font-bold text-[#1E744F]">
                      Next Step: Accept Appointment &amp; Create Your Password
                    </p>
                    <p className="text-[11px] text-[#263B33]">
                      Please click the secure link below to review your authority rights, accept the statutory governance agreement, and choose your custom password to begin your work.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#20A66A]/30 rounded-xl font-mono text-[10px] text-[#263B33]"
                      />
                      <button
                        onClick={() => handleCopyLink(inviteUrl)}
                        className="px-3 py-1.5 bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-[10px] rounded-xl flex items-center gap-1 cursor-pointer flex-shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E3ECE8]">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`mailto:${emailData.recipientEmail}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(
                      `Dear ${emailData.recipientName},\n\nYou have been appointed by ${emailData.invitedBy} as ${emailData.role} (${emailData.domainScope}) on ZenithRx.\n\nPlease accept your invitation and configure your password here:\n${inviteUrl}\n\nAuthorized Controls:\n${emailData.accessRightsDescription.join('\n')}\n\nBest regards,\nZenithRx Enterprise System Administration`
                    )}`}
                    className="px-3.5 py-2 bg-[#2F80C9] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open in Gmail / Mail Client</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const fullMsg = `Subject: ${emailData.subject}\n\nDear ${emailData.recipientName},\n\nYou have been appointed by ${emailData.invitedBy} as ${emailData.role} (${emailData.domainScope}) on ZenithRx.\n\nPlease accept your invitation and configure your password here:\n${inviteUrl}\n\nAuthorized Controls:\n${emailData.accessRightsDescription.join('\n')}\n\nBest regards,\nZenithRx Enterprise System Administration`;
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(fullMsg);
                        setCopiedEmailText(true);
                        setTimeout(() => setCopiedEmailText(false), 2500);
                      }
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>{copiedEmailText ? 'Email Copied!' : 'Copy Email Text'}</span>
                  </button>

                  {emailPreviewModalCollab.status === 'INVITATION_PENDING' && (
                    <button
                      onClick={() => handleResendInvite(emailPreviewModalCollab.id)}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate &amp; Resend</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Dedicated Page</span>
                  </a>

                  <button
                    onClick={() => {
                      const collab = emailPreviewModalCollab;
                      setEmailPreviewModalCollab(null);
                      handleOpenAcceptanceForCollab(collab);
                    }}
                    className="px-3.5 py-2 bg-[#F8FBFA] hover:bg-[#E8F7F0] text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#20A66A]" />
                    <span>In-App Modal</span>
                  </button>

                  <button
                    onClick={() => setEmailPreviewModalCollab(null)}
                    className="px-4 py-2 bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Invitee Acceptance & Password Creation Portal Modal */}
      {showAcceptPortalToken && acceptingCollab && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E3ECE8] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-[#263B33] my-6">
            
            {/* Acceptance Header */}
            <div className="flex items-center justify-between border-b border-[#E3ECE8] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#20A66A] tracking-wider block">
                  ZENITHRX ENTERPRISE APPOINTMENT ACCEPTANCE
                </span>
                <h4 className="text-base font-bold text-[#263B33] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#20A66A]" />
                  Accept Delegated Authority &amp; Create Credentials
                </h4>
              </div>
              <button
                onClick={() => {
                  setShowAcceptPortalToken(null);
                  setAcceptingCollab(null);
                }}
                className="text-[#5E7A70] hover:text-[#263B33] text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            {acceptSuccess ? (
              <div className="p-6 bg-[#E8F7F0] border border-[#20A66A]/30 rounded-2xl text-center space-y-3 animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-[#20A66A] mx-auto" />
                <h5 className="text-base font-bold text-[#1E744F]">Credentials Configured Successfully!</h5>
                <p className="text-xs text-[#263B33] leading-relaxed">
                  {acceptSuccess}
                </p>
                <div className="p-3 bg-white rounded-xl border border-[#20A66A]/20 text-[11px] text-[#5E7A70]">
                  Your administrative status has transitioned to <strong>ACTIVE</strong> in the Superuser Governance Matrix. You may now sign in using your official email (<strong>{acceptingCollab.email}</strong>) and new password.
                </div>
              </div>
            ) : (
              <form onSubmit={handleAcceptInviteSubmit} className="space-y-4 text-xs">
                
                {/* Invitee Welcome Card */}
                <div className="bg-[#F8FBFA] border border-[#E3ECE8] p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] text-[#5E7A70] uppercase font-bold">Collaborator Profile</span>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-[#263B33]">{acceptingCollab.fullName}</strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20">
                      {acceptingCollab.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5E7A70]">
                    Appointed by: <strong className="text-[#263B33]">{acceptingCollab.grantedBy}</strong> • Domain: <strong className="text-[#20A66A]">{acceptingCollab.domainScope?.replace(/_/g, ' ')}</strong>
                  </p>
                </div>

                {/* Level of Access Rights Display */}
                <div className="border border-[#E3ECE8] rounded-2xl p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#263B33] uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#20A66A]" />
                      Your Level of Access Rights &amp; Control
                    </span>
                    <span className="text-[10px] text-[#20A66A] font-semibold">Authorized</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    {Object.entries(acceptingCollab.permissions)
                      .filter(([, val]) => val)
                      .map(([key]) => (
                        <div key={key} className="flex items-center gap-1.5 p-1.5 bg-[#F8FBFA] rounded-lg border border-[#E3ECE8]">
                          <Check className="w-3 h-3 text-[#20A66A] flex-shrink-0" />
                          <span className="capitalize text-[#263B33] font-medium">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Error Banner */}
                {acceptError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-[#D64545] rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{acceptError}</span>
                  </div>
                )}

                {/* Password Creation Inputs */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[#263B33] font-semibold mb-1">Create Admin Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters..."
                        value={acceptPassword}
                        onChange={(e) => setAcceptPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] pr-10 focus:outline-none focus:border-[#20A66A]"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[#5E7A70] hover:text-[#263B33]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#263B33] font-semibold mb-1">Confirm Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password to confirm..."
                      value={acceptConfirmPassword}
                      onChange={(e) => setAcceptConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[#263B33] focus:outline-none focus:border-[#20A66A]"
                      required
                    />
                  </div>
                </div>

                {/* Compliance Agreement Checkbox */}
                <div className="p-3 bg-[#F0F7F4] border border-[#20A66A]/20 rounded-2xl flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="acceptCompliance"
                    checked={acceptAgreedCompliance}
                    onChange={(e) => setAcceptAgreedCompliance(e.target.checked)}
                    className="rounded text-[#20A66A] w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="acceptCompliance" className="text-[11px] text-[#263B33] leading-relaxed cursor-pointer">
                    <strong>Statutory Governance Agreement:</strong> I accept the designated administrative authority and agree to perform my duties strictly compliant with the National Drug Authority (NDA) statutory regulations and ZenithRx immutable audit requirements.
                  </label>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E3ECE8]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAcceptPortalToken(null);
                      setAcceptingCollab(null);
                    }}
                    className="px-4 py-2 bg-white hover:bg-[#F8FBFA] text-[#5E7A70] hover:text-[#263B33] text-xs font-bold rounded-xl border border-[#E3ECE8] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#20A66A] hover:bg-[#1E9760] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Appointment &amp; Activate Account</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminControlPlane;
