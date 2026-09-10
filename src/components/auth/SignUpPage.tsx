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
    <div className="w-full max-w-md bg-[#0B1E36] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Close button if modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close sign-up modal"
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
          Create your account
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed">
          {auth.isConfigured ? (
            'Register to get started with ZenithRx pharmacy management.'
          ) : (
            <span className="text-amber-400 font-semibold flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Demo Mode — registration will create a local account.
            </span>
          )}
        </p>
      </div>

      {/* Error Banner */}
      {displayError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-700/50 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs font-medium leading-relaxed">{displayError}</p>
        </div>
      )}

      {/* Sign-Up Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              required
              autoComplete="name"
              placeholder="Dr. Jane Nakato"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
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

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+256 7XX XXX XXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Min. 6 characters"
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
          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
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
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all ${
                confirmPw && confirmPw === password
                  ? 'border-emerald-500/50 focus:border-emerald-500/60'
                  : confirmPw && confirmPw !== password
                    ? 'border-red-500/50 focus:border-red-500/60'
                    : 'border-white/10 focus:border-sky-500/60'
              }`}
            />
            {confirmPw && confirmPw === password && (
              <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Create Account</>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 pt-4 border-t border-white/5 text-center">
        <p className="text-slate-400 text-xs">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-sky-400 font-bold hover:text-sky-300 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
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
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px]" />
      <div className="relative z-10 w-full flex justify-center my-auto">
        {content}
      </div>
    </div>
  );
};
