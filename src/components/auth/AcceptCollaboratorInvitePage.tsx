import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  Building2,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  FileCheck2,
  Users,
  Copy,
  Terminal,
  Cpu,
  Mail
} from 'lucide-react';
import {
  DelegatedCollaborator,
  getCollaboratorByInviteToken,
  acceptCollaboratorInvitation,
  getDelegatedCollaborators,
  generateCollaboratorEmailContent
} from '../../services/adminControlPlaneService';

interface AcceptCollaboratorInvitePageProps {
  initialToken?: string;
  onNavigateHome?: () => void;
  onNavigateLogin?: () => void;
  onSuccessLaunch?: (collab: DelegatedCollaborator) => void;
}

export const AcceptCollaboratorInvitePage: React.FC<AcceptCollaboratorInvitePageProps> = ({
  initialToken,
  onNavigateHome,
  onNavigateLogin,
  onSuccessLaunch,
}) => {
  const [token, setToken] = useState<string>(() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const fullUrl = window.location.href || '';

      if (search.includes('token=')) {
        const params = new URLSearchParams(search);
        const t = params.get('token');
        if (t) return decodeURIComponent(t).trim();
      }
      if (hash.includes('token=')) {
        const parts = hash.split('token=');
        if (parts[1]) return decodeURIComponent(parts[1].split('&')[0]).trim();
      }
      if (hash.includes('?')) {
        const queryPart = hash.split('?')[1];
        if (queryPart) {
          const params = new URLSearchParams(queryPart);
          const t = params.get('token');
          if (t) return decodeURIComponent(t).trim();
        }
      }
      // Direct token match for any INV- token in URL
      const match = fullUrl.match(/INV-[A-Za-z0-9_-]+/i);
      if (match) return match[0].trim();
    }
    return '';
  });

  const [collaborator, setCollaborator] = useState<DelegatedCollaborator | null>(null);
  const [allCollaborators, setAllCollaborators] = useState<DelegatedCollaborator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeStatutory, setAgreeStatutory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<DelegatedCollaborator | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [mailtoFallbackLink, setMailtoFallbackLink] = useState<string | null>(null);

  // Load collaborator details
  const fetchCollaboratorData = async (targetToken: string) => {
    setLoading(true);
    setNotFound(false);
    setErrorMessage(null);

    const all = await getDelegatedCollaborators();
    setAllCollaborators(all);

    if (!targetToken) {
      // If no token specified, pick the most recent pending collaborator or first available
      const pending = all.find((c) => c.status === 'INVITATION_PENDING') || all[0];
      if (pending && pending.invitationToken) {
        setToken(pending.invitationToken);
        setCollaborator(pending);
      } else if (pending) {
        setCollaborator(pending);
      } else {
        setNotFound(true);
      }
      setLoading(false);
      return;
    }

    const found = await getCollaboratorByInviteToken(targetToken);
    if (found) {
      setCollaborator(found);
      setNotFound(false);
    } else {
      // Check if maybe it matched by ID
      const byId = all.find((c) => c.id === targetToken);
      if (byId) {
        setCollaborator(byId);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCollaboratorData(token);
  }, []);

  const handleTokenSelect = (newTok: string) => {
    setToken(newTok);
    fetchCollaboratorData(newTok);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!collaborator) return;

    if (!agreeStatutory) {
      setErrorMessage('You must acknowledge and accept the statutory regulatory agreement.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters with numbers and letters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and re-enter.');
      return;
    }

    setSubmitting(true);
    const activeToken = collaborator.invitationToken || token;
    const result = await acceptCollaboratorInvitation(activeToken, password);
    setSubmitting(false);

    if (result.success && result.collaborator) {
      if (result.collaborator.engineerId) {
        sessionStorage.setItem('zenithrx_quantum_prefill_id', result.collaborator.engineerId);
      }
      if (result.collaborator.engineeringMasterKey) {
        sessionStorage.setItem('zenithrx_quantum_prefill_key', result.collaborator.engineeringMasterKey);
      }
      if (result.collaborator.email) {
        sessionStorage.setItem('zenithrx_quantum_prefill_email', result.collaborator.email);
      }
      if (result.mailtoLink) {
        setMailtoFallbackLink(result.mailtoLink);
      }
      setCollaborator(result.collaborator);
      setSuccessResult(result.collaborator);
    } else {
      setErrorMessage(result.message || 'Failed to activate credentials. Please contact your Super Administrator.');
    }
  };

  const emailData = collaborator ? generateCollaboratorEmailContent(collaborator) : null;

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#263B33] flex flex-col justify-between selection:bg-[#20A66A] selection:text-white">
      
      {/* Top Enterprise Navigation Header */}
      <header className="bg-white border-b border-[#E3ECE8] px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="p-2 rounded-xl text-[#5E7A70] hover:text-[#263B33] hover:bg-[#F8FBFA] transition cursor-pointer"
                title="Return to Main Portal"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#20A66A] flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm tracking-tight text-[#263B33]">ZenithRx</span>
                  <span className="bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Enterprise Governance §11.17
                  </span>
                </div>
                <p className="text-[10px] text-[#5E7A70] font-medium leading-none mt-0.5">
                  Official Delegated Administrator Appointment Portal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-[11px] text-[#5E7A70]">
              <Lock className="w-3.5 h-3.5 text-[#20A66A]" />
              <span>256-Bit Encrypted Statutory Acceptance</span>
            </div>

            {onNavigateLogin && (
              <button
                onClick={onNavigateLogin}
                className="px-3.5 py-1.5 text-xs font-bold text-[#20A66A] hover:bg-[#E8F7F0] rounded-xl transition cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex-1">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#20A66A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#5E7A70]">Verifying invitation credentials...</p>
          </div>
        ) : notFound || !collaborator ? (
          <div className="max-w-md mx-auto bg-white border border-[#E3ECE8] rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#263B33]">Invitation Token Not Found</h3>
            <p className="text-xs text-[#5E7A70] leading-relaxed">
              We could not locate an active delegated appointment matching this link. The token may have expired or was revoked by the System Administrator.
            </p>

            {allCollaborators.length > 0 && (
              <div className="pt-2 text-left space-y-2">
                <span className="text-[10px] font-bold text-[#5E7A70] uppercase tracking-wider block">
                  Select Existing Collaborator for Demonstration:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {allCollaborators.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleTokenSelect(c.invitationToken || c.id)}
                      className="w-full p-2.5 rounded-xl border border-[#E3ECE8] bg-[#F8FBFA] hover:bg-[#E8F7F0] hover:border-[#20A66A]/30 text-left transition flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <strong className="block text-[#263B33]">{c.fullName}</strong>
                        <span className="text-[10px] text-[#5E7A70]">{c.role} • {c.domainScope}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'INVITATION_PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : successResult ? (
          /* Quantum Networks Level 5 Root Console Credentials Presentation */
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
            {/* Top Success Banner */}
            <div className="bg-[#E8F7F0] border border-[#20A66A]/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#20A66A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1E744F] block">
                    PASSWORD CONFIGURED &amp; VERIFIED
                  </span>
                  <h4 className="text-sm font-black text-[#263B33]">
                    Level-5 Root Credentials Created &amp; Dispatched
                  </h4>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white border border-[#20A66A]/20 rounded-full text-[11px] font-bold text-[#1E744F]">
                <Cpu className="w-3.5 h-3.5 text-[#20A66A]" />
                <span>256-Bit Cryptographic CSPRNG</span>
              </div>
            </div>

            {/* Quantum Networks Console Credentials Card (Exact Match to Screenshot) */}
            <div className="bg-white border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Console Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-inner">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-widest text-cyan-700 uppercase">
                        QUANTUM NETWORKS LTD
                      </span>
                      <span className="bg-cyan-100 text-cyan-800 border border-cyan-300 text-[9px] px-2 py-0.5 rounded-full font-bold">
                        LEVEL 5 ROOT
                      </span>
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 mt-0.5">
                      System Engineering Console
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">CLEARANCE</span>
                  <span className="text-xs font-bold text-emerald-600 font-mono">ROOT_ADMIN</span>
                </div>
              </div>

              {/* Security Statement Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-slate-700">
                    <p className="font-bold text-slate-900 mb-0.5">
                      Restricted to Quantum Networks Technical Engineering Staff
                    </p>
                    <p className="text-[11px] text-slate-600">
                      ZenithRx System Administration is governed exclusively by <strong>Quantum Networks Ltd</strong> (the platform architecture &amp; engineering firm). Client pharmacy personnel (pharmacists, cashiers, dispensers) cannot access this control plane.
                    </p>
                  </div>
                </div>
              </div>

              {/* The Two Fields From Screenshot */}
              <div className="space-y-4">
                {/* Field 1: QUANTUM NETWORKS ENGINEER ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      QUANTUM NETWORKS ENGINEER ID
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (successResult.engineerId) {
                          navigator.clipboard.writeText(successResult.engineerId);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                        }
                      }}
                      className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm text-cyan-900 font-bold flex items-center gap-2 select-all shadow-inner">
                      <span className="text-slate-400 select-none">&gt;_</span>
                      <span>{successResult.engineerId || 'QN-ENG-8801'}</span>
                    </div>
                  </div>
                </div>

                {/* Field 2: ENGINEERING AUTHORIZATION MASTER KEY */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      ENGINEERING AUTHORIZATION MASTER KEY
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (successResult.engineeringMasterKey) {
                          navigator.clipboard.writeText(successResult.engineeringMasterKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }
                      }}
                      className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Master Key</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm text-slate-900 font-bold flex items-center gap-2 select-all break-all shadow-inner">
                      <KeyRound className="w-4 h-4 text-slate-400 shrink-0 select-none" />
                      <span className="text-slate-800">{successResult.engineeringMasterKey}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#20A66A]" />
                    <span>Protected by Level-5 Quantum Security Protocol &amp; Immutable Audit Telemetry.</span>
                  </p>
                </div>
              </div>

              {/* Automatic Email Notification Box */}
              <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Mail className="w-4 h-4 text-[#20A66A]" />
                  <span>Credentials Automatically Dispatched to Email:</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="font-mono text-xs text-[#263B33] font-bold">
                    {successResult.email}
                  </p>
                  <p className="text-[11px] text-[#5E7A70]">
                    A copy of your Engineer ID, Engineering Master Key, and direct console access instructions has been sent to your inbox.
                  </p>
                </div>
                {mailtoFallbackLink && (
                  <div className="pl-6 pt-1">
                    <a
                      href={mailtoFallbackLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1E744F] underline hover:text-[#20A66A]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Credentials Dispatch in Email App</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Action Button: Authenticate in System Engineering Console Now */}
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccessLaunch) {
                      onSuccessLaunch(successResult);
                    } else if (onNavigateLogin) {
                      onNavigateLogin();
                    } else {
                      window.location.hash = '#admin';
                      window.location.reload();
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Authenticate as Quantum Systems Engineer</span>
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="hover:text-slate-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Pharmacy Workspace
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">
                    Server-verified · 5 attempts then lockout
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dedicated Main Acceptance Page */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 7 Columns: Dedicated Authority & What You Can Control Matrix */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Page Banner Title */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="bg-[#E8F7F0] text-[#1E744F] border border-[#20A66A]/20 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#20A66A]" />
                    SUPERUSER DELEGATED AUTHORITY §11.17
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    collaborator.status === 'INVITATION_PENDING'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    Status: {collaborator.status === 'INVITATION_PENDING' ? 'Invitation Pending Acceptance' : 'Active'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#263B33] tracking-tight">
                  Official Delegated Authority Appointment
                </h1>
                <p className="text-xs text-[#5E7A70] mt-1.5 leading-relaxed">
                  You have been designated by <strong>{collaborator.grantedBy}</strong> to assume administrative and clinical governance responsibility across the ZenithRx Enterprise platform.
                </p>
              </div>

              {/* Dedicated 4-Grid Appointment Card (Exact Match to User's Uploaded Screenshot) */}
              <div className="bg-white border border-[#E3ECE8] rounded-3xl p-5 sm:p-6 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5E7A70] block">
                      APPOINTED ROLE
                    </span>
                    <strong className="text-base font-black text-[#20A66A] block mt-0.5">
                      {collaborator.role}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5E7A70] block">
                      DOMAIN SCOPE
                    </span>
                    <strong className="text-sm font-bold text-[#263B33] block mt-0.5">
                      {collaborator.domainScope?.replace(/_/g, ' ') || 'FULL PLATFORM'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5E7A70] block">
                      TENANT AUTHORITY
                    </span>
                    <strong className="text-sm font-bold text-[#263B33] block mt-0.5">
                      {collaborator.assignedTenants.join(', ')}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5E7A70] block">
                      VALIDITY UNTIL
                    </span>
                    <strong className="text-sm font-bold text-[#263B33] block mt-0.5">
                      {new Date(collaborator.expiresAt).toLocaleDateString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Designated Level of Access Rights & What You Can Control (§11.17) */}
              <div className="bg-white border border-[#E3ECE8] rounded-3xl p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-sm font-black text-[#263B33] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#20A66A]" />
                    Designated Level of Access Rights &amp; What You Can Control (§11.17)
                  </h3>
                  <p className="text-xs text-[#5E7A70] mt-1 leading-relaxed">
                    In accordance with National Drug Authority (NDA) statutory regulations and ZenithRx governance policies, you are granted the following administrative powers:
                  </p>
                </div>

                <div className="border border-[#E3ECE8] rounded-2xl overflow-hidden divide-y divide-[#E3ECE8] bg-white">
                  {emailData?.controlsBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 flex items-start gap-3.5 transition-colors ${
                        item.granted ? 'bg-white hover:bg-[#F8FBFA]' : 'bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {item.granted ? (
                          <div className="w-5 h-5 rounded-full border border-[#20A66A] flex items-center justify-center text-[#20A66A] bg-[#E8F7F0]">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 bg-slate-100">
                            <span className="text-[10px] font-bold">&times;</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <strong className={`text-xs font-bold block ${item.granted ? 'text-[#263B33]' : 'text-slate-500 line-through'}`}>
                          {item.category}
                        </strong>
                        <p className="text-[11px] text-[#5E7A70] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Acceptance & Password Creation Form */}
            <div className="lg:col-span-5 space-y-4 sticky top-20">
              
              <div className="bg-white border border-[#E3ECE8] rounded-3xl p-6 sm:p-7 shadow-lg space-y-5">
                <div className="border-b border-[#E3ECE8] pb-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#20A66A] uppercase tracking-wider mb-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Credentials Provisioning</span>
                  </div>
                  <h3 className="text-base font-black text-[#263B33]">
                    Configure Your Admin Password
                  </h3>
                  <p className="text-xs text-[#5E7A70] mt-0.5">
                    Choose a strong password to authenticate your administrative duties on ZenithRx.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-[#D64545] rounded-2xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  
                  {/* Account Summary */}
                  <div className="p-3 bg-[#F8FBFA] border border-[#E3ECE8] rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-[#5E7A70] uppercase tracking-wider block">
                      Designated Account
                    </span>
                    <strong className="text-sm font-bold text-[#263B33] block">
                      {collaborator.fullName}
                    </strong>
                    <span className="text-xs font-mono text-[#5E7A70] block">
                      {collaborator.email}
                    </span>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-[#263B33] font-bold mb-1.5">
                      New Administrator Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters..."
                        className="w-full px-3.5 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-xs text-[#263B33] pr-10 focus:outline-none focus:border-[#20A66A]"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#5E7A70] hover:text-[#263B33] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label className="block text-[#263B33] font-bold mb-1.5">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password to confirm..."
                      className="w-full px-3.5 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-xs text-[#263B33] focus:outline-none focus:border-[#20A66A]"
                      required
                    />
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="flex items-center gap-3 text-[11px] text-[#5E7A70]">
                    <span className={`flex items-center gap-1 ${password.length >= 8 ? 'text-[#1E744F] font-bold' : ''}`}>
                      <Check className="w-3 h-3" /> 8+ chars
                    </span>
                    <span className={`flex items-center gap-1 ${password && password === confirmPassword ? 'text-[#1E744F] font-bold' : ''}`}>
                      <Check className="w-3 h-3" /> Passwords match
                    </span>
                  </div>

                  {/* Statutory Compliance Agreement */}
                  <div className="p-3.5 bg-[#F0F7F4] border border-[#20A66A]/20 rounded-2xl flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="statutoryPledge"
                      checked={agreeStatutory}
                      onChange={(e) => setAgreeStatutory(e.target.checked)}
                      className="rounded text-[#20A66A] w-4 h-4 mt-0.5 cursor-pointer"
                      required
                    />
                    <label htmlFor="statutoryPledge" className="text-[11px] text-[#263B33] leading-relaxed cursor-pointer">
                      <strong>Statutory Governance Pledge:</strong> I accept the designated administrative privileges and confirm I will exercise dual-control and clinical oversight in accordance with National Drug Authority (NDA) statutory regulations.
                    </label>
                  </div>

                  {/* Submission CTA */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Validating Credentials...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Appointment &amp; Create Credentials</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Token Switcher for Easy Testing */}
                {allCollaborators.length > 1 && (
                  <div className="pt-2 border-t border-[#E3ECE8]">
                    <span className="text-[10px] text-[#5E7A70] block mb-1">
                      Switch Collaborator Preview (Test Mode):
                    </span>
                    <select
                      value={collaborator.id}
                      onChange={(e) => {
                        const sel = allCollaborators.find((c) => c.id === e.target.value);
                        if (sel) handleTokenSelect(sel.invitationToken || sel.id);
                      }}
                      className="w-full px-2 py-1.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-lg text-[11px] text-[#263B33] cursor-pointer"
                    >
                      {allCollaborators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} — {c.role} ({c.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3ECE8] bg-white py-4 px-4 text-center text-xs text-[#5E7A70]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ZenithRx Enterprise Pharmacy Management System • NDA Licensed &amp; Audited</span>
          <span className="font-mono text-[10px]">Security Protocol §11.17 — Dual-Control Immutable Registry</span>
        </div>
      </footer>
    </div>
  );
};
export default AcceptCollaboratorInvitePage;
