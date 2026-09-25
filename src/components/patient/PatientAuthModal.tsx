import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  AlertTriangle,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { patientAuthService, PatientProfile, DEMO_PATIENTS } from '../../services/patientAuthService';

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: PatientProfile) => void;
  initialMode?: 'signin' | 'register';
  redirectReason?: string;
}

const COMMON_ALLERGIES = [
  'Penicillin / Amoxicillin',
  'Sulfa Drugs (Bactrim)',
  'Aspirin / NSAIDs',
  'Codeine / Opioids',
  'Cephalosporins',
  'None Known',
];

const COMMON_CHRONIC = [
  'Hypertension (High BP)',
  'Type 2 Diabetes',
  'Asthma / COPD',
  'Epilepsy',
  'Sickle Cell Disease',
  'None',
];

const UGANDA_DISTRICTS = [
  'Kampala (Central)',
  'Kampala (Kololo & Nakasero)',
  'Kampala (Ntinda & Kyambogo)',
  'Kampala (Wandegeya & Mulago)',
  'Wakiso (Entebbe Town)',
  'Wakiso (Nansana & Kira)',
  'Jinja City',
  'Mbarara City',
  'Gulu City',
  'Arua City',
  'Mbale City',
  'Fort Portal',
];

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  redirectReason,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDistrict, setRegDistrict] = useState('Kampala (Central)');
  const [regAddress, setRegAddress] = useState('');
  const [regNin, setRegNin] = useState('');
  const [regGender, setRegGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [regSelectedAllergies, setRegSelectedAllergies] = useState<string[]>([]);
  const [regSelectedChronic, setRegSelectedChronic] = useState<string[]>([]);
  const [regError, setRegError] = useState('');

  if (!isOpen) return null;

  const handleDemoSelect = (demo: PatientProfile) => {
    const res = patientAuthService.loginAsDemo(demo.id);
    if (res.success && res.patient) {
      onSuccess(res.patient);
      onClose();
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginId.trim()) {
      setLoginError('Please enter your phone number or email.');
      return;
    }

    const res = patientAuthService.login(loginId, loginPassword);
    if (res.success && res.patient) {
      onSuccess(res.patient);
      onClose();
    } else {
      setLoginError(res.error || 'Unable to log in. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim() || !regPhone.trim()) {
      setRegError('Full name and phone number are required.');
      return;
    }

    const res = patientAuthService.register({
      fullName: regFullName,
      phone: regPhone,
      email: regEmail,
      district: regDistrict,
      address: regAddress,
      nin: regNin,
      gender: regGender,
      allergies: regSelectedAllergies,
      chronicConditions: regSelectedChronic,
    });

    if (res.success && res.patient) {
      onSuccess(res.patient);
      onClose();
    } else {
      setRegError(res.error || 'Registration failed. Please try again.');
    }
  };

  const toggleAllergy = (allergy: string) => {
    if (allergy === 'None Known') {
      setRegSelectedAllergies(['None Known']);
      return;
    }
    setRegSelectedAllergies((prev) => {
      const filtered = prev.filter((a) => a !== 'None Known');
      return filtered.includes(allergy) ? filtered.filter((a) => a !== allergy) : [...filtered, allergy];
    });
  };

  const toggleChronic = (condition: string) => {
    if (condition === 'None') {
      setRegSelectedChronic(['None']);
      return;
    }
    setRegSelectedChronic((prev) => {
      const filtered = prev.filter((c) => c !== 'None');
      return filtered.includes(condition) ? filtered.filter((c) => c !== condition) : [...filtered, condition];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-200 block">
                UGANDA NDA VERIFIED PORTAL
              </span>
              <h2 className="text-xl font-black tracking-tight">Patient Care Access</h2>
            </div>
          </div>

          {redirectReason && (
            <div className="mt-4 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{redirectReason}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex bg-black/20 p-1 rounded-2xl mt-5">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-emerald-800 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              Patient Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white text-emerald-800 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              Create Patient Account
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {mode === 'signin' ? (
            /* ── Sign In View ── */
            <div className="space-y-6">
              {/* Quick Demo Logins */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  ⚡ Quick Demo Patient Access (1-Click Login)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_PATIENTS.map((demo) => (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => handleDemoSelect(demo)}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                          {demo.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400">{demo.district} • {demo.phone}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-400">
                  Or sign in with your phone or email
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number or Email Address *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="+256 701 234567 or email@domain.com"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                    <span className="text-[11px] text-emerald-600 font-semibold cursor-pointer hover:underline">
                      Forgot Password?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In to Patient Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center">
                <p className="text-xs text-slate-500">
                  New to ZenithRx?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Create a free patient account
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* ── Register View ── */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grace Nakato"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="+256 701 234567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="grace@example.ug"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    District / Region *
                  </label>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {UGANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    National ID (NIN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CM92014819201K"
                    value={regNin}
                    onChange={(e) => setRegNin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Residential / Delivery Address
                  </label>
                  <input
                    type="text"
                    placeholder="Plot / Street / Landmark"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Safety Clinical Baselines */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Clinical Safety Profile (Critical for Prescriptions &amp; Interactions)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Known Drug Allergies:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_ALLERGIES.map((allergy) => {
                      const isSelected = regSelectedAllergies.includes(allergy);
                      return (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => toggleAllergy(allergy)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {allergy}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Chronic Medical Conditions:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_CHRONIC.map((cond) => {
                      const isSelected = regSelectedChronic.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => toggleChronic(cond)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {cond}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Complete Registration &amp; Open Portal</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Sign In instead
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
