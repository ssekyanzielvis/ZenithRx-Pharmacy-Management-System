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
      className="w-full max-w-lg bg-[#071322] border border-amber-500/30 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-black/90 relative text-left"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Ambient Glow Indicator */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
          RESTRICTED SYSTEM ACCESS
        </span>
      </div>

      {/* Header Branding */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/30 p-2">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-white font-black text-2xl tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                ZenithRx
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-600/40 px-2 py-0.5 rounded-md">
                Admin Portal
              </span>
            </div>
            <p className="text-slate-400 text-xs font-semibold">
              Platform Control Plane &amp; Multi-Tenant Governance
            </p>
          </div>
        </div>

        {onBackToStaff && (
          <button
            onClick={onBackToStaff}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            title="Return to Staff Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </button>
        )}
      </div>

      {/* Development Mode Demo Credentials Box */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-slate-900/80 border border-amber-500/30 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              Development Demo Admin Credentials
            </span>
          </div>
          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            Pre-configured
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3 text-slate-300">
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              Admin Username
            </span>
            <span className="font-mono text-amber-200 font-semibold select-all">
              admin@zenithrx.ug
            </span>
          </div>
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              Password
            </span>
            <span className="font-mono text-amber-200 font-semibold select-all">
              admin123
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1">
          <span>
            Identity: <strong className="text-white">Dr. Arthur Ssenabulya (Super Admin)</strong>
          </span>
          <span className="text-emerald-400 font-medium">Full Authority Access</span>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoLogin}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Zap className="w-4 h-4 fill-current" />
          )}
          <span>⚡ One-Click Sign In as System Administrator</span>
        </button>
      </div>

      {/* Error Banner */}
      {auth.error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-700/50 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs font-medium leading-relaxed">{auth.error}</p>
        </div>
      )}

      {/* Standard Admin Form */}
      <form onSubmit={handleAdminSignIn} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Administrator Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="admin@zenithrx.ug"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Admin Master Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security Dual-Factor Simulator */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" /> 2FA Security Token
            </span>
            <button
              type="button"
              onClick={() => setShowMfaInput(!showMfaInput)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              {showMfaInput ? 'Hide OTP Field' : 'Token: 849201 (Simulated)'}
            </button>
          </div>
          {showMfaInput && (
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="6-digit hardware token"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono tracking-widest outline-none focus:border-amber-500/60"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-rose-950/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Authenticating Admin Session…
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-300" /> Enter Admin Control Plane
            </>
          )}
        </button>
      </form>

      {/* Security Governance Notice */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
        <Server className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          All administrative sessions are cryptographic logged with audit hash chains in compliance
          with the Uganda National Drug Authority and ISO 27001 data governance standards.
        </p>
      </div>

      {onBackToStaff && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onBackToStaff}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
          >
            ← Not an administrator? Return to Staff Sign In / Operations
          </button>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-lg animate-fade-in p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#040B14] p-4 py-8 sm:py-12 relative overflow-y-auto flex items-center justify-center"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[140px]" />
      <div className="relative z-10 w-full flex justify-center my-auto">
        {content}
      </div>
    </div>
  );
};
