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
    <div className="w-full max-w-md bg-[#0B1E36] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Close button if modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close login modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
          <Pill className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-xl tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>ZenithRx</p>
          <p className="text-sky-400/70 text-[10px] font-bold uppercase tracking-[0.2em]">Next-Gen Pharmacy Platform</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Sign in to your account
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed">
          {auth.isConfigured ? (
            'Enter your pharmacy staff credentials to access your system.'
          ) : (
            <span className="text-amber-400 font-semibold flex items-center gap-1.5 mt-1">
              <Zap className="w-3.5 h-3.5" /> Demo Mode Active — click Sign In to continue.
            </span>
          )}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
        {(['password', 'magic'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); auth.clearError(); setMagicSent(false); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === m ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {m === 'password' ? '🔑  Password' : '✉️  Magic Link'}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {auth.error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-700/50 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs font-medium leading-relaxed">{auth.error}</p>
        </div>
      )}

      {/* Magic Link Sent Banner */}
      {magicSent && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 text-sm font-bold">Check your email!</p>
            <p className="text-emerald-400/70 text-xs mt-0.5">
              We sent a sign-in link to <strong>{email}</strong>. Click it to access your account.
            </p>
          </div>
        </div>
      )}

      {/* Password Form */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required={auth.isConfigured}
                autoComplete="email"
                placeholder={auth.isConfigured ? 'pharmacist@yourpharmacy.ug' : 'pharmacist@zenithrx.ug (Demo)'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPw ? 'text' : 'password'}
                required={auth.isConfigured}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <><Zap className="w-4 h-4" /> Sign In to System</>
            )}
          </button>
        </form>
      )}

      {/* Magic Link Form */}
      {mode === 'magic' && !magicSent && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="pharmacist@yourpharmacy.ug"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-black text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
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
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-slate-400 text-xs">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>
      )}

      {/* Not yet a customer CTA */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 to-violet-950/30 border border-sky-500/20">
        <p className="text-white text-xs font-bold mb-1">Need help or a demo?</p>
        <p className="text-slate-400 text-[11px] mb-3">Reach out to Quantum Networks for instant support.</p>
        <div className="flex gap-2">
          <a
            href="tel:0200913555"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300 hover:text-white hover:border-white/20 transition-all"
          >
            <Phone className="w-3 h-3" /> 0200 913 555
          </a>
          <a
            href="https://wa.me/256755091826"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-[11px] text-emerald-300 hover:bg-emerald-600/30 transition-all"
          >
            <ArrowRight className="w-3 h-3" /> WhatsApp
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 text-center">
        <p className="text-slate-500 text-[10px]">
          Powered by Quantum Networks Ltd · NDA Certified Platform
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070F1C] p-4 py-8 sm:py-12 relative overflow-y-auto flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      <div className="relative z-10 w-full flex justify-center my-auto">
        {content}
      </div>
    </div>
  );
};
