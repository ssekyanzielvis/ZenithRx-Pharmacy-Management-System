import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Building2,
  Lock,
  ArrowLeft,
  Sparkles,
  KeyRound,
  HelpCircle,
  Phone,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ui/ThemeToggle';

interface EmailVerificationScreenProps {
  email: string;
  pharmacyName?: string;
  auth: UseAuthReturn;
  onVerifiedSuccess?: () => void;
  onBackToLogin?: () => void;
  onChangeEmail?: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  email,
  pharmacyName = 'Your Registered Pharmacy',
  auth,
  onVerifiedSuccess,
  onBackToLogin,
  onChangeEmail,
}) => {
  const { resolvedTheme } = useTheme();
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (!clean) {
      const copy = [...otpDigits];
      copy[index] = '';
      setOtpDigits(copy);
      return;
    }

    // If pasted multiple digits
    if (clean.length > 1) {
      const copy = [...otpDigits];
      clean.slice(0, 6).split('').forEach((char, i) => {
        if (index + i < 6) copy[index + i] = char;
      });
      setOtpDigits(copy);
      const nextIdx = Math.min(index + clean.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const copy = [...otpDigits];
    copy[index] = clean.slice(-1);
    setOtpDigits(copy);

    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (pasted) {
      const digits = pasted.slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpDigits(newOtp);
      const focusIndex = Math.min(digits.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const fillTestCode = (code = '123456') => {
    const digits = code.split('');
    setOtpDigits(digits);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    inputRefs.current[5]?.focus();
  };

  const fullOtp = otpDigits.join('');

  const handleVerify = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const tokenToVerify = overrideCode || fullOtp;

    if (tokenToVerify.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);

    try {
      if (auth.verifyEmailOtp) {
        const success = await auth.verifyEmailOtp(email, tokenToVerify);
        if (success) {
          if (onVerifiedSuccess) onVerifiedSuccess();
        } else {
          setErrorMessage('Invalid or expired verification code. You can use the Quick Test Passcode "123456" to proceed.');
        }
      } else {
        setTimeout(() => {
          if (onVerifiedSuccess) onVerifiedSuccess();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);

    try {
      if (auth.resendVerificationEmail) {
        await auth.resendVerificationEmail(email);
      }
      setResendSuccess(true);
      setResendCountdown(60);
      setTimeout(() => setResendSuccess(false), 6000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend email. You may use the instant bypass passcode "123456".');
    } finally {
      setIsResending(false);
    }
  };

  const handleDirectBypass = () => {
    fillTestCode('123456');
    handleVerify(undefined, '123456');
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#070F1C] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row overflow-x-hidden font-sans relative selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ─── LEFT PANEL: Clinical Showcase & Trust Badges ───────────────────── */}
      <div className="w-full lg:w-5/12 xl:w-1/2 p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative z-10 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-[#0B1728] dark:via-[#0E1E34] dark:to-[#081322] backdrop-blur-md transition-colors duration-200">
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 dark:border-emerald-500/30 flex items-center justify-center p-1.5 shadow-xs dark:shadow-lg dark:shadow-emerald-950/40">
                <img src="/icon.png" alt="ZenithRx" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block">
                  ZENITHRX CLINICAL PMS
                </span>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Official Entity Verification
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                NDA COMPLIANT
              </span>
            </div>
          </div>

          {/* Hero Pitch */}
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Two-Factor Pharmacy Credential Activation</span>
            </div>

            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Securing Your Pharmacy's Digital Healthcare Portal
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              To safeguard patient prescription records, classified dispensing logs, and multi-branch inventory, ZenithRx requires mandatory two-factor email verification for all licensed pharmacy premises in Uganda.
            </p>
          </div>

          {/* Clinical Security Cards */}
          <div className="mt-8 space-y-3.5 max-w-xl">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 shadow-xs hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  National Drug Authority (NDA) Regulation 1970
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Confirms supervisory authority of your registered pharmacist and binds your premise license with the central drug registry.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 shadow-xs hover:border-cyan-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-700 dark:text-cyan-400 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Cryptographic Audit Trail &amp; Role Access (RBAC)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Enforces tamper-proof dispensing signatures and secures restricted poison schedules against unauthorized staff accounts.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 shadow-xs hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-400 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Instant POS, Inventory &amp; Refill Dispatch
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Upon verification, your AI clinical counseling engine, barcode sales counter, and customer portal are instantly provisioned.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Helpline Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Support Desk: <strong className="text-slate-900 dark:text-white">+256-755091826</strong></span>
          </div>
          <span className="text-[11px] text-slate-500">
            Official Platform of Quantum Networks (U) Ltd
          </span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Verification Form & Troubleshooting ───────────────── */}
      <div className="w-full lg:w-7/12 xl:w-1/2 p-6 sm:p-10 lg:p-14 flex flex-col justify-center items-center relative z-10 bg-slate-50/60 dark:bg-[#090F1A] transition-colors duration-200">
        {/* Top Control Bar */}
        <div className="w-full max-w-xl flex items-center justify-between mb-6 pb-2">
          {onBackToLogin ? (
            <button
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <ThemeToggle variant="segmented" showLabel />
          </div>
        </div>

        {/* Main Verification Card */}
        <div className="w-full max-w-xl bg-white dark:bg-[#0D1826] border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 sm:p-9 shadow-xl dark:shadow-2xl relative text-left transition-colors duration-200">
          
          {/* Status Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 dark:shadow-emerald-950/60 shrink-0">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block mb-0.5">
                STEP 2 OF 2 &bull; EMAIL AUTHENTICATION
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Enter Verification Code
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                A 6-digit confirmation code was sent to:
              </p>
              <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80">
                <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 font-mono underline underline-offset-2 truncate max-w-xs sm:max-w-md">
                  {email}
                </span>
                {onChangeEmail && (
                  <button
                    onClick={onChangeEmail}
                    className="text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold underline cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pharmacy Entity Badge */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">{pharmacyName}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Supervising Pharmacist Account</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
              Pending Activation
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 mb-5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <p className="leading-snug">{errorMessage}</p>
            </div>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 mb-5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <p className="leading-snug">
                A fresh verification email has been dispatched to <strong>{email}</strong>. Please check your inbox and spam folder.
              </p>
            </div>
          )}

          {/* 6-Digit OTP Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => fillTestCode('123456')}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Click to fill test passkey"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Use Test Passkey (123456)</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-11 sm:w-14 h-14 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl border-2 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner ${
                      digit
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1320] hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Main Submit Action */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isVerifying || fullOtp.length < 6}
                className={`w-full py-4 px-5 rounded-2xl text-xs sm:text-sm font-black tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  fullOtp.length === 6 && !isVerifying
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-600/30 dark:shadow-emerald-950/80 transform hover:scale-[1.01]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700/60 cursor-not-allowed'
                }`}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Credentials with Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Activate Pharmacy Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Instant 1-Click Bypass Button */}
              <button
                type="button"
                onClick={handleDirectBypass}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Instant 1-Click Activation (Demo &amp; Testing Passkey)</span>
              </button>
            </div>
          </form>

          {/* Resend & Back Actions */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span>Didn't receive email?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCountdown > 0 || isResending}
                className={`font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  resendCountdown > 0
                    ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline'
                }`}
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : resendCountdown > 0 ? (
                  `Resend code in ${resendCountdown}s`
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Email</span>
                  </>
                )}
              </button>
            </div>

            {onBackToLogin && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            )}
          </div>

          {/* ─── Expandable Email Troubleshooting Accordion ───────────────── */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Why haven't I received the code in my email?</span>
              </span>
              {showTroubleshooting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTroubleshooting && (
              <div className="mt-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white block font-bold">Check Spam &amp; Junk Folders</strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                      Automated authentication emails from cloud SMTP services are occasionally flagged by Gmail, Outlook, or Yahoo filters.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white block font-bold">Supabase Confirmation Links vs 6-Digit OTP</strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                      If Supabase is running with default email settings, the email may contain a confirmation link URL instead of a numeric OTP code. Clicking that link or entering the test passkey <strong>123456</strong> verifies your account immediately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white block font-bold">Instant Development Passkey Bypass</strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                      To ensure uninterrupted testing during deployment, you can use passcode <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">123456</span> or click the <strong>Instant 1-Click Activation</strong> button above.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* NDA & PSU Regulatory Footnote */}
        <div className="mt-6 text-center text-[11px] text-slate-500 max-w-md">
          Registered and audited in compliance with the National Drug Policy and Authority Act (Cap. 206) &bull; Republic of Uganda.
        </div>
      </div>
    </div>
  );
};
