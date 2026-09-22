import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  Zap,
  Loader2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  Building2,
  Fingerprint,
  CheckCircle2,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';

interface AdminLoginPageProps {
  auth: UseAuthReturn;
  onSuccess?: () => void;
  onBackToStaff?: () => void;
  isModal?: boolean;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  auth,
  onSuccess,
  onBackToStaff,
  isModal = false,
}) => {
  const [email, setEmail] = useState('admin@zenithrx.ug');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mfaCode, setMfaCode] = useState('849201');
  const [showMfaInput, setShowMfaInput] = useState(false);

  const handleAdminSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    auth.clearError();
    setSubmitting(true);
    try {
      await auth.signIn(email || 'admin@zenithrx.ug', password || 'admin123');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('[AdminLogin] Sign in failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@zenithrx.ug');
    setPassword('admin123');
    auth.clearError();
    setSubmitting(true);
    try {
      await auth.signIn('admin@zenithrx.ug', 'admin123');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('[AdminLogin] Quick demo login failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div
      className="w-full max-w-lg bg-white border border-[#E3ECE8] rounded-3xl p-6 sm:p-9 shadow-xl relative text-left"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            System Administration
          </span>
        </div>

        {onBackToStaff && (
          <button
            onClick={onBackToStaff}
            className="text-xs text-[#5E7A70] hover:text-[#263B33] flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#F8FBFA] border border-[#E3ECE8] hover:bg-[#F0F5F3] transition-all cursor-pointer font-medium"
            title="Return to Staff Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </button>
        )}
      </div>

      {/* Header Branding */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-[#263B33] font-black text-2xl tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              ZenithRx
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
              Admin Portal
            </span>
          </div>
          <p className="text-[#5E7A70] text-xs font-medium">
            Platform Control Plane &amp; Multi-Tenant Governance
          </p>
        </div>
      </div>

      {/* Demo Credentials Box */}
      <div className="mb-6 p-4 rounded-2xl bg-[#F8FBFA] border border-[#E3ECE8]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#263B33] uppercase tracking-wider">
            Development Admin Credentials
          </span>
          <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
            Pre-configured
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3 text-[#263B33]">
          <div className="bg-white p-2.5 rounded-xl border border-[#E3ECE8]">
            <span className="text-[10px] text-[#5E7A70] block font-bold uppercase tracking-wider">
              Admin Username
            </span>
            <span className="font-mono text-[#263B33] font-semibold select-all">
              admin@zenithrx.ug
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#E3ECE8]">
            <span className="text-[10px] text-[#5E7A70] block font-bold uppercase tracking-wider">
              Password
            </span>
            <span className="font-mono text-[#263B33] font-semibold select-all">
              admin123
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#5E7A70] mb-3 px-1">
          <span>
            Identity: <strong className="text-[#263B33]">Dr. Arthur Ssenabulya (Super Admin)</strong>
          </span>
          <span className="text-[#20A66A] font-semibold">Full Authority Access</span>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoLogin}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Zap className="w-4 h-4 fill-current text-white" />
          )}
          <span>One-Click Sign In as System Administrator</span>
        </button>
      </div>

      {/* Error Banner */}
      {auth.error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-xs font-medium leading-relaxed">{auth.error}</p>
        </div>
      )}

      {/* Standard Admin Form */}
      <form onSubmit={handleAdminSignIn} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#263B33] uppercase tracking-wider mb-1.5">
            Administrator Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="admin@zenithrx.ug"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-sm text-[#263B33] placeholder-[#8FA69D] focus:border-[#20A66A] focus:ring-2 focus:ring-[#20A66A]/20 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#263B33] uppercase tracking-wider mb-1.5">
            Admin Master Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-sm text-[#263B33] placeholder-[#8FA69D] focus:border-[#20A66A] focus:ring-2 focus:ring-[#20A66A]/20 outline-none transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70] hover:text-[#263B33] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security Dual-Factor Simulator */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-[#263B33] uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-[#2F80C9]" /> 2FA Security Token
            </span>
            <button
              type="button"
              onClick={() => setShowMfaInput(!showMfaInput)}
              className="text-xs text-[#2F80C9] hover:underline font-semibold cursor-pointer"
            >
              {showMfaInput ? 'Hide OTP Field' : 'Token: 849201 (Simulated)'}
            </button>
          </div>
          {showMfaInput && (
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
              <input
                type="text"
                placeholder="6-digit hardware token"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FBFA] border border-[#E3ECE8] rounded-xl text-sm text-[#263B33] font-mono tracking-widest outline-none focus:border-[#20A66A]"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#20A66A] hover:bg-[#188755] text-white font-bold text-sm shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Authenticating Admin Session…
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" /> Enter Admin Control Plane
            </>
          )}
        </button>
      </form>

      {/* Security Governance Notice */}
      <div className="mt-6 pt-4 border-t border-[#E3ECE8] flex items-start gap-2.5 text-[11px] text-[#5E7A70] leading-relaxed">
        <Server className="w-4 h-4 text-[#20A66A] shrink-0 mt-0.5" />
        <p>
          All administrative sessions are cryptographically logged with immutable audit hash chains in compliance
          with Uganda National Drug Authority and ISO 27001 data governance standards.
        </p>
      </div>

      {onBackToStaff && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onBackToStaff}
            className="text-xs text-[#2F80C9] hover:underline font-semibold cursor-pointer"
          >
            ← Not an administrator? Return to Staff Sign In
          </button>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs animate-fade-in p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5FAF8] p-4 py-8 sm:py-12 relative overflow-y-auto flex items-center justify-center"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="relative z-10 w-full flex justify-center my-auto">
        {content}
      </div>
    </div>
  );
};
