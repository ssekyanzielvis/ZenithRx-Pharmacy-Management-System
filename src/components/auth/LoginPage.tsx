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
  Building2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  X,
  Sparkles,
  Pill,
  Activity,
  Phone,
  FileCheck2,
  KeyRound,
  Users2,
  Stethoscope,
  HelpCircle,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';
import { EmailVerificationScreen } from './EmailVerificationScreen';
import { UserRoleRank } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface LoginPageProps {
  auth: UseAuthReturn;
  onClose?: () => void;
  onBackToLanding?: () => void;
  onSwitchToSignUp?: () => void;
  onOpenAdmin?: () => void;
  isModal?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  auth,
  onClose,
  onBackToLanding,
  onSwitchToSignUp,
  onOpenAdmin,
  isModal = false,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // If email verification is pending, render the dedicated EmailVerificationScreen
  if (auth.pendingEmailVerification) {
    return (
      <EmailVerificationScreen
        email={auth.pendingEmailVerification}
        pharmacyName={auth.user?.tenantName || 'Your Registered Pharmacy'}
        auth={auth}
        onVerifiedSuccess={() => {
          auth.setPendingEmailVerification(null);
        }}
        onBackToLogin={() => auth.setPendingEmailVerification(null)}
        onChangeEmail={() => auth.setPendingEmailVerification(null)}
      />
    );
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    auth.clearError();

    if (!email.trim() && auth.isConfigured) {
      setLocalError('Please enter your registered pharmacy staff email.');
      return;
    }

    setSubmitting(true);
    try {
      await auth.signIn(email || 'pharmacist@zenithrx.ug', password || 'demo');
    } catch {
      /* error set in auth hook */
    } finally {
      setSubmitting(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLocalError('Please enter your registered pharmacy email address.');
      return;
    }
    setLocalError(null);
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

  const handleQuickDemoRole = (role: UserRoleRank | 'Pharmacy Owner') => {
    setEmail(
      role === 'Pharmacy Owner'
        ? 'owner@kampalapharmacy.ug'
        : role === 'Supervising Pharmacist'
        ? 'pharmacist@zenithrx.ug'
        : role === 'POS Cashier / Dispenser'
        ? 'cashier@zenithrx.ug'
        : 'inventory@zenithrx.ug'
    );
    setPassword('demo');
    setMode('password');
  };

  // If used as a modal popup
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#0D1829] border border-slate-200 dark:border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left text-slate-900 dark:text-white transition-colors duration-200">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close login modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header Logo */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-500/30 flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
                <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-black text-lg tracking-tight">ZenithRx PMS</p>
                <p className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Pharmacy Staff Portal
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer mr-6"
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              Sign In to Your Pharmacy
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Enter your authorized staff credentials to access the dispensing console.
            </p>
          </div>

          {/* Error Alert */}
          {(localError || auth.error) && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <p className="leading-snug">{localError || auth.error}</p>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-5 border border-slate-200 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'password'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'magic'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder={auth.isConfigured ? 'pharmacist@pharmacy.ug' : 'pharmacist@zenithrx.ug'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('magic')}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required={auth.isConfigured}
                    placeholder={auth.isConfigured ? '••••••••' : 'demo'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dispensing Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="pharmacist@pharmacy.ug"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {magicSent ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Magic login link sent. Check your inbox to sign in instantly.</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Magic Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Magic Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* Switch to Register Pharmacy Link */}
          {onSwitchToSignUp && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              Not registered yet?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Register Certified Pharmacy
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DEDICATED FULL-SCREEN PHARMACY STAFF & OWNER SIGN-IN PAGE ───────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070F1C] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* ── Top Header Navigation Bar ── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B1526]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="mr-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Return to System Overview"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Overview</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center p-0.5 shadow-xs overflow-hidden">
            <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-900 dark:text-white font-black text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                ZenithRx
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-widest hidden sm:inline-block">
                Staff &amp; Owner Portal
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] hidden md:block">
              Clinical Pharmacy Management System · NDA-Regulated Workstation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode (Ctrl+Shift+D)`}
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {onSwitchToSignUp && (
            <button
              onClick={onSwitchToSignUp}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Register Pharmacy</span>
            </button>
          )}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Enter System Administrator Control Plane (/admin)"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Main Two-Column Hero / Auth Container ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* ── Left Column: Platform Showcase & Trust Features ── */}
          <div className="lg:col-span-6 space-y-6 text-left hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Secure Clinical Authentication &amp; Multi-Role Access</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sign in to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-cyan-400">Certified Pharmacy</span> Workstation
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Access your prescription dispensing registers, POS checkout counters, batch tracking inventory, automated reorder ledger, and 24/7 AI-assisted clinical safety checkers.
            </p>

            {/* Role Capabilities Pills */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pharmacy Owner</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Highest privilege: Staff role delegation, revenue analytics &amp; audit controls.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 text-xs font-bold">
                  <Stethoscope className="w-4 h-4" />
                  <span>Supervising Pharmacist</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  NDA compliance supervision, ADR reporting &amp; clinical drug validation.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                  <Pill className="w-4 h-4" />
                  <span>Dispenser &amp; Cashier</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Fast barcode POS sales, e-prescriptions, receipts &amp; mobile money payments.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  <Activity className="w-4 h-4" />
                  <span>Inventory Manager</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Batch expiry tracking, stock valuation, automated POs &amp; supplier sync.
                </p>
              </div>
            </div>

            {/* Trust Footer Highlights */}
            <div className="pt-2 flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>NDA &amp; PSU Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>256-Bit Encrypted Data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Role-Based Isolation</span>
              </div>
            </div>
          </div>

          {/* ── Right Column: The Dedicated Sign-In Card ── */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white dark:bg-[#0F1D32]/95 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-9 shadow-xl dark:shadow-2xl relative text-left backdrop-blur-xl transition-colors duration-200">
              
              {/* Top Banner on Mobile */}
              <div className="lg:hidden flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-500/30 flex items-center justify-center p-0.5 shadow-xs overflow-hidden">
                    <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-slate-900 dark:text-white font-black text-lg tracking-tight">Staff Portal</h2>
                    <p className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      ZenithRx Clinical Workstation
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <span>Sign In to Workstation</span>
                  <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  Enter your official pharmacy email and password to access your authorized modules.
                </p>
              </div>

              {/* Error Alert */}
              {(localError || auth.error) && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 mb-5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <p className="leading-snug">{localError || auth.error}</p>
                </div>
              )}

              {/* Mode Toggle: Password vs Magic Link */}
              <div className="flex bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl mb-6 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'password'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('magic')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'magic'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Magic Link
                </button>
              </div>

              {/* Sign In Form */}
              {mode === 'password' ? (
                <form onSubmit={handlePasswordSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Official Pharmacy Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder={auth.isConfigured ? 'pharmacist@pharmacy.ug' : 'pharmacist@zenithrx.ug'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode('magic')}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        required={auth.isConfigured}
                        placeholder={auth.isConfigured ? '••••••••' : 'demo'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying with Supabase...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Dispensing Workstation</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Official Pharmacy Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="pharmacist@pharmacy.ug"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {magicSent ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Magic login link sent to <strong className="font-bold">{email}</strong>. Check your inbox to sign in with one click.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Magic Link...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Passwordless Magic Link</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </form>
              )}

              {/* Quick Demo Staff Logins */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center justify-between">
                  <span>Quick Demo Workstation Access:</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">1-Click Fill</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoRole('Pharmacy Owner')}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Pharmacy Owner</p>
                    <p className="text-[9px] text-slate-500 truncate">owner@kampalapharmacy.ug</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoRole('Supervising Pharmacist')}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <p className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400">Pharmacist</p>
                    <p className="text-[9px] text-slate-500 truncate">pharmacist@zenithrx.ug</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoRole('POS Cashier / Dispenser')}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">Cashier / POS</p>
                    <p className="text-[9px] text-slate-500 truncate">cashier@zenithrx.ug</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoRole('Store & Inventory Manager')}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Inventory Lead</p>
                    <p className="text-[9px] text-slate-500 truncate">inventory@zenithrx.ug</p>
                  </button>
                </div>
              </div>

              {/* Bottom Registration & Admin Actions */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 text-center text-xs">
                {onSwitchToSignUp && (
                  <div className="text-slate-500 dark:text-slate-400">
                    Need to register a new pharmacy?{' '}
                    <button
                      type="button"
                      onClick={onSwitchToSignUp}
                      className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Register Pharmacy Entity</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {onOpenAdmin && (
                  <div>
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>Platform System Administrator Portal (/admin)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Page Footer ── */}
      <footer className="bg-white dark:bg-[#0B1526]/80 border-t border-slate-200 dark:border-slate-800 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            ZenithRx · Uganda National Drug Authority (NDA) Regulated Platform
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Support: +256 755 091826</span>
            <span>·</span>
            <span>Email: quantumnetworks@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
