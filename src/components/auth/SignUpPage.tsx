import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Pill,
  UserPlus,
  Phone,
  User,
  X,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';

interface SignUpPageProps {
  auth: UseAuthReturn;
  onClose?: () => void;
  onSwitchToLogin: () => void;
  isModal?: boolean;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ auth, onClose, onSwitchToLogin, isModal = false }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const passwordStrength = (() => {
    if (password.length === 0) return { label: '', color: '', width: '0%' };
    if (password.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '20%' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-orange-500', width: '40%' };
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-500', width: '60%' };
    if (score === 3) return { label: 'Good', color: 'bg-sky-500', width: '80%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    auth.clearError();

    // Validation
    if (!fullName.trim()) { setLocalError('Please enter your full name.'); return; }
    if (!email.trim()) { setLocalError('Please enter your email address.'); return; }
    if (password.length < 6) { setLocalError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPw) { setLocalError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      await auth.signUp(email, password, fullName.trim(), phone.trim());
      // On success, the auth hook sets the user with subscriptionStatus: 'none'
      // App.tsx will then route to the SubscriptionPage
    } catch {
      /* error is set in auth hook */
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || auth.error;

  const content = (
    <div className="w-full max-w-md bg-white dark:bg-[#132032] border border-[#E3ECE8] dark:border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Close button if modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-[#263B33] p-1.5 rounded-full hover:bg-[#F5FAF8] transition-colors cursor-pointer"
          aria-label="Close sign-up modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white border border-[#C3E8D8] flex items-center justify-center p-0.5 shadow-xs overflow-hidden">
          <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-[#263B33] dark:text-slate-100 font-black text-xl tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>ZenithRx</p>
          <p className="text-[#20A66A] text-[10px] font-bold uppercase tracking-[0.15em]">Dispensing &amp; Management System</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#263B33] dark:text-slate-100 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Create your account
        </h2>
        <p className="text-[#5E7A70] text-xs leading-relaxed">
          {auth.isConfigured ? (
            'Register to get started with ZenithRx pharmacy management.'
          ) : (
            <span className="text-[#1E744F] font-medium flex items-center gap-1.5 mt-1 bg-[#E8F7F0] p-2 rounded-lg border border-[#C3E8D8]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#20A66A] shrink-0" /> Demo Mode — registration will create a local account.
            </span>
          )}
        </p>
      </div>

      {/* Error Banner */}
      {displayError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-xs font-medium leading-relaxed">{displayError}</p>
        </div>
      )}

      {/* Sign-Up Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-[#263B33] dark:text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
            <input
              type="text"
              required
              autoComplete="name"
              placeholder="Dr. Jane Nakato"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FBFA] dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-600 rounded-xl text-sm text-[#263B33] dark:text-slate-200 placeholder-[#8FA69D] dark:placeholder-slate-500 focus:border-[#20A66A] focus:ring-2 focus:ring-[#20A66A]/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-[#263B33] dark:text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
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

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-[#263B33] dark:text-slate-300 uppercase tracking-wider mb-1.5">Phone Number</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+256 7XX XXX XXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FBFA] dark:bg-slate-800 border border-[#E3ECE8] dark:border-slate-600 rounded-xl text-sm text-[#263B33] dark:text-slate-200 placeholder-[#8FA69D] dark:placeholder-slate-500 focus:border-[#20A66A] focus:ring-2 focus:ring-[#20A66A]/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-[#263B33] dark:text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Min. 6 characters"
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
          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-[#E3ECE8] rounded-full overflow-hidden">
                <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }} />
              </div>
              <p className={`text-[10px] mt-1 font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-[#263B33] dark:text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E7A70]" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className={`w-full pl-10 pr-12 py-2.5 bg-[#F8FBFA] dark:bg-slate-800 border rounded-xl text-sm text-[#263B33] dark:text-slate-200 placeholder-[#8FA69D] dark:placeholder-slate-500 focus:ring-2 focus:ring-[#20A66A]/20 outline-none transition-all ${
                confirmPw && confirmPw === password
                  ? 'border-[#20A66A] focus:border-[#20A66A]'
                  : confirmPw && confirmPw !== password
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#E3ECE8] focus:border-[#20A66A]'
              }`}
            />
            {confirmPw && confirmPw === password && (
              <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#20A66A]" />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#20A66A] hover:bg-[#188755] text-white font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Create Account</>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 pt-4 border-t border-[#E3ECE8] dark:border-slate-700 text-center">
        <p className="text-[#5E7A70] text-xs">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#20A66A] font-bold hover:underline transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
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
