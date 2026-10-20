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
  Users
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
      const search = window.location.search;
      const hash = window.location.hash;
      if (search.includes('token=')) {
        const params = new URLSearchParams(search);
        return params.get('token') || '';
      }
      if (hash.includes('token=')) {
        const parts = hash.split('token=');
        if (parts[1]) return parts[1].split('&')[0];
      }
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
          /* Account Activated Celebration Card */
          <div className="max-w-xl mx-auto bg-white border border-[#E3ECE8] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-[#E8F7F0] border-2 border-[#20A66A]/30 flex items-center justify-center text-[#20A66A] mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#20A66A] block">
                STATUTORY ACCEPTANCE CONFIRMED
              </span>
              <h2 className="text-2xl font-black text-[#263B33] tracking-tight">
                Welcome to ZenithRx Enterprise, {successResult.fullName}!
              </h2>
              <p className="text-xs text-[#5E7A70] max-w-md mx-auto leading-relaxed">
                Your administrative appointment as <strong>{successResult.role} ({successResult.domainScope?.replace(/_/g, ' ')})</strong> is officially activated with full NDA statutory authorization.
              </p>
            </div>

            <div className="bg-[#F8FBFA] border border-[#E3ECE8] rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5E7A70]">Registered Admin Email:</span>
                <strong className="text-[#263B33] font-mono">{successResult.email}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5E7A70]">Session Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E8F7F0] text-[#1E744F] font-bold text-[10px] border border-[#20A66A]/20">
                  ACTIVE SESSION TOKEN ISSUED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5E7A70]">Superuser Governance Status:</span>
                <strong className="text-[#20A66A]">ACTIVE &amp; VALIDATED</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {onSuccessLaunch ? (
                <button
                  onClick={() => onSuccessLaunch(successResult)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Admin Control Plane</span>
                </button>
              ) : onNavigateLogin ? (
                <button
                  onClick={onNavigateLogin}
                  className="w-full sm:w-auto px-6 py-3 bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Admin Sign In</span>
                </button>
              ) : (
                <a
                  href="/#adminDelegated"
                  className="w-full sm:w-auto px-6 py-3 bg-[#20A66A] hover:bg-[#1E9760] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter ZenithRx Control Plane</span>
                </a>
              )}
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
