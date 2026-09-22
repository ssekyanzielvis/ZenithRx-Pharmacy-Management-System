import React, { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  Zap,
  AlertCircle,
  CheckCircle2,
  Pill,
  ArrowRight,
  Phone,
  X,
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';

interface LoginPageProps {
  auth: UseAuthReturn;
  onClose?: () => void;
  onSwitchToSignUp?: () => void;
  isModal?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ auth, onClose, onSwitchToSignUp, isModal = false }) => {
  const [mode, setMode]             = useState<'password' | 'magic'>('password');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent]   = useState(false);

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && auth.isConfigured) return;
    auth.clearError();
    setSubmitting(true);
    try {
      await auth.signIn(email || 'pharmacist@zenithrx.ug', password || 'demo');
    } catch {
      /* error is set in auth hook */
    } finally {
      setSubmitting(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    auth.clearError();
    setSubmitting(true);
    try {
      await auth.sendMagicLink(email);
      setMagicSent(true);
    } catch {
      /* error set in hook */
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="w-full max-w-md bg-white dark:bg-[#132032] border border-[#E3ECE8] dark:border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Close button if modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-[#263B33] p-1.5 rounded-full hover:bg-[#F5FAF8] transition-colors cursor-pointer"
          aria-label="Close login modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#E8F7F0] border border-[#C3E8D8] flex items-center justify-center text-[#20A66A] shadow-xs">
          <Pill className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[#263B33] dark:text-slate-100 font-black text-xl tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>ZenithRx</p>
          <p className="text-[#20A66A] text-[10px] font-bold uppercase tracking-[0.15em]">Dispensing &amp; Management System</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#263B33] dark:text-slate-100 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Sign in to your account
        </h2>
        <p className="text-[#5E7A70] text-xs leading-relaxed">
          {auth.isConfigured ? (
            'Enter your pharmacy staff credentials to access your system.'
          ) : (
            <span className="text-[#B45309] font-medium flex items-center gap-1.5 mt-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Demo Mode Active — click Sign In to continue.
            </span>
          )}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-[#F0F5F3] dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-700 rounded-xl p-1 mb-6">
        {(['password', 'magic'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); auth.clearError(); setMagicSent(false); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === m ? 'bg-white dark:bg-slate-700 text-[#20A66A] dark:text-emerald-300 shadow-xs border border-[#E3ECE8] dark:border-slate-600' : 'text-[#5E7A70] dark:text-slate-400 hover:text-[#263B33] dark:hover:text-slate-200'
            }`}
          >
            {m === 'password' ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>Magic Link</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {auth.error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-xs font-medium leading-relaxed">{auth.error}</p>
        </div>
      )}

      {/* Magic Link Sent Banner */}
      {magicSent && (
        <div className="mb-5 p-4 rounded-xl bg-[#E8F7F0] border border-[#C3E8D8] flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#20A66A] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#1E744F] text-sm font-bold">Check your email!</p>
            <p className="text-[#263B33] text-xs mt-0.5">
              We sent a sign-in link to <strong>{email}</strong>. Click it to access your account.
            </p>
          </div>
        </div>
      )}

      {/* Password Form */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#263B33] dark:text-slate-300 uppercase tracking-wider mb-1.5">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
              <input
                type="email"
                required={auth.isConfigured}
                autoComplete="email"
                placeholder={auth.isConfigured ? 'pharmacist@yourpharmacy.ug' : 'pharmacist@zenithrx.ug (Demo)'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FBFA] dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-600 rounded-xl text-sm text-[#263B33] dark:text-slate-200 placeholder-[#8FA69D] dark:placeholder-slate-500 focus:border-[#20A66A] focus:ring-2 focus:ring-[#20A66A]/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#263B33] dark:text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
              <input
                type={showPw ? 'text' : 'password'}
                required={auth.isConfigured}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-[#F8FBFA] dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-600 rounded-xl text-sm text-[#263B33] dark:text-slate-200 placeholder-[#8FA69D] dark:placeholder-slate-500 focus:border-[#20A66A] focus:ring-2 focus:ring-[#20A66A]/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70] hover:text-[#263B33] transition-colors cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#20A66A] hover:bg-[#188755] text-white font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <><Shield className="w-4 h-4" /> Sign In to System</>
            )}
          </button>
        </form>
      )}

      {/* Magic Link Form */}
      {mode === 'magic' && !magicSent && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#263B33] dark:text-slate-300 uppercase tracking-wider mb-1.5">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="pharmacist@yourpharmacy.ug"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FBFA] dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-600 rounded-xl text-sm text-[#263B33] dark:text-slate-200 placeholder-[#8FA69D] dark:placeholder-slate-500 focus:border-[#20A66A] focus:ring-2 focus:ring-[#20A66A]/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email}
            className="w-full py-3 rounded-xl bg-[#2F80C9] hover:bg-[#2568A5] text-white font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              <><Mail className="w-4 h-4" /> Send Magic Link</>
            )}
          </button>
        </form>
      )}

      {/* Sign-Up Link */}
      {onSwitchToSignUp && (
        <div className="mt-6 pt-4 border-t border-[#E3ECE8] dark:border-slate-700 text-center">
          <p className="text-[#5E7A70] text-xs">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-[#20A66A] font-bold hover:underline transition-colors cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>
      )}

      {/* Support Info Box */}
      <div className="mt-6 p-4 rounded-2xl bg-[#F5FAF8] dark:bg-slate-800/60 border border-[#E3ECE8] dark:border-slate-700">
        <p className="text-[#263B33] dark:text-slate-200 text-xs font-bold mb-1">Need assistance or staff access?</p>
        <p className="text-[#5E7A70] text-[11px] mb-3">Contact ZenithRx technical support desk for guidance.</p>
        <div className="flex gap-2">
          <a
            href="tel:0200913555"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-600 text-[11px] text-[#263B33] dark:text-slate-300 font-semibold hover:bg-[#F0F5F3] dark:hover:bg-slate-700 transition-all shadow-2xs"
          >
            <Phone className="w-3 h-3 text-[#2F80C9]" /> 0200 913 555
          </a>
          <a
            href="https://wa.me/256755091826"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#E8F7F0] border border-[#C3E8D8] text-[11px] text-[#1E744F] font-semibold hover:bg-[#D7EFE4] transition-all shadow-2xs"
          >
            <ArrowRight className="w-3 h-3 text-[#20A66A]" /> WhatsApp Support
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-[#E3ECE8] dark:border-slate-700 text-center">
        <p className="text-[#5E7A70] text-[10px]">
          Powered by Quantum Networks Ltd · Uganda NDA Aligned Platform
        </p>
      </div>
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
    <div className="min-h-screen bg-[#F5FAF8] dark:bg-[#0B131F] p-4 py-8 sm:py-12 relative overflow-y-auto flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="relative z-10 w-full flex justify-center my-auto">
        {content}
      </div>
    </div>
  );
};
