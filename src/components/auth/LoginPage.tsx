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
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';

interface LoginPageProps {
  auth: UseAuthReturn;
}

export const LoginPage: React.FC<LoginPageProps> = ({ auth }) => {
  const [mode, setMode]           = useState<'password' | 'magic'>('password');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    auth.clearError();
    setSubmitting(true);
    try {
      await auth.signIn(email, password);
    } catch {
      // error is already set in auth hook
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
      // error set in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070F1C] flex items-stretch">

      {/* ── Left Hero Panel ── */}
      <div className="hidden lg:flex lg:w-3/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1E36] via-[#0D2A4A] to-[#071424]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-600/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-800/5 rounded-full blur-[140px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-xl tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ZenithRx
            </p>
            <p className="text-sky-400/70 text-[10px] font-bold uppercase tracking-[0.2em]">
              Pharmacy Management System
            </p>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white leading-tight mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
            The Future of
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Pharmacy Management
            </span>
            <br />
            is Here.
          </h1>
          <p className="text-sky-200/60 text-base leading-relaxed max-w-md">
            Enterprise-grade POS, AI prescription processing, FEFO inventory,
            and insurance claims — purpose-built for Ugandan pharmacies.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {[
              'NDA-Compliant — meets all PSU registration requirements',
              'Gemini AI — prescriptions, counseling, and drug interaction checks',
              'Real-time stock alerts with automated re-ordering',
              'Multi-tenant SaaS — manage multiple pharmacy branches',
            ].map((feat) => (
              <div key={feat} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-sky-200/50 text-xs leading-relaxed">{feat}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-bold text-sky-300/70">
              SOC 2 | HIPAA-aware | Encrypted at rest & in transit
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Login Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#070F1C]">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>ZenithRx PMS</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sign in to your account
            </h2>
            <p className="text-slate-500 text-sm">
              {auth.isConfigured
                ? 'Enter your pharmacy staff credentials to continue.'
                : <span className="text-amber-400 font-semibold">Demo Mode — Supabase not configured. Any credentials will work.</span>
              }
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
            {(['password', 'magic'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); auth.clearError(); setMagicSent(false); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'password' ? '🔑  Password' : '✉️  Magic Link'}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {auth.error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-700/50 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs font-medium leading-relaxed">{auth.error}</p>
            </div>
          )}

          {/* Magic Link Sent */}
          {magicSent && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-start gap-2.5 animate-fade-in">
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Work Email Address
                </label>
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

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
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
                disabled={submitting || !email || !password}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  : <><Zap className="w-4 h-4" /> Sign In</>
                }
              </button>
            </form>
          )}

          {/* Magic Link Form */}
          {mode === 'magic' && !magicSent && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Work Email Address
                </label>
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
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Mail className="w-4 h-4" /> Send Magic Link</>
                }
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-600 text-[11px]">
              By signing in you agree to ZenithRx's{' '}
              <span className="text-sky-500/70 cursor-pointer hover:text-sky-400 transition-colors">Terms of Service</span>
              {' '}and{' '}
              <span className="text-sky-500/70 cursor-pointer hover:text-sky-400 transition-colors">Privacy Policy</span>
            </p>
            <p className="text-slate-700 text-[10px] mt-2">
              Powered by Quantum Networks Ltd · NDA Certified Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
