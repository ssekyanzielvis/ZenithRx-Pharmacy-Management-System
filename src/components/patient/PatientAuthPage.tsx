import React, { useState } from 'react';
import {
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
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  Pill,
  Building2,
  KeyRound,
  BadgeCheck,
  Check,
  Info,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { patientAuthService, PatientProfile, DEMO_PATIENTS } from '../../services/patientAuthService';

export interface PatientAuthPageProps {
  initialMode?: 'signin' | 'register';
  redirectReason?: string;
  onBack: () => void;
  onSuccess: (patient: PatientProfile) => void;
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
  'Mukono',
  'Masaka City',
];

export const PatientAuthPage: React.FC<PatientAuthPageProps> = ({
  initialMode = 'signin',
  redirectReason,
  onBack,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);

  // Sign In Form State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDistrict, setRegDistrict] = useState('Kampala (Central)');
  const [regAddress, setRegAddress] = useState('');
  const [regNin, setRegNin] = useState('');
  const [regGender, setRegGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [regSelectedAllergies, setRegSelectedAllergies] = useState<string[]>([]);
  const [regSelectedChronic, setRegSelectedChronic] = useState<string[]>([]);
  const [regError, setRegError] = useState('');

  const handleDemoSelect = (demo: PatientProfile) => {
    const res = patientAuthService.loginAsDemo(demo.id);
    if (res.success && res.patient) {
      onSuccess(res.patient);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginId.trim()) {
      setLoginError('Please enter your registered phone number or email.');
      return;
    }

    const res = patientAuthService.login(loginId, loginPassword);
    if (res.success && res.patient) {
      onSuccess(res.patient);
    } else {
      setLoginError(res.error || 'Invalid credentials. You can also click any test profile on the left for instant access.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim() || !regPhone.trim()) {
      setRegError('Full legal name and WhatsApp phone number are required.');
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
    } else {
      setRegError(res.error || 'Registration failed. Please verify your details.');
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

  const handleForgotPassword = () => {
    setForgotPasswordMessage(
      'SMS verification code has been dispatched to your contact. Or click any 1-Click Demo Patient on the left.'
    );
    setTimeout(() => {
      setForgotPasswordMessage(null);
    }, 7000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070E18] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* ─── 1. Inherited Top Clinical Regulatory Ticker Bar ─── */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-emerald-200 text-[10px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-emerald-800/40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">
              NDA Certified Network · 30-Min Express Medicine Delivery Across Uganda
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 shrink-0 text-[11px] text-emerald-300/80 font-bold">
            <span>Helpline: <strong>0200 913 555</strong></span>
          </div>
        </div>
      </div>

      {/* ─── 2. Inherited Glassmorphic Header (Min 90px Height with 1cm Padding) ─── */}
      <nav 
        className="bg-white/90 dark:bg-[#0B131F]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 transition-all flex items-center shadow-xs"
        style={{ paddingLeft: '1cm', paddingRight: '1cm', paddingTop: '0.45cm', paddingBottom: '0.45cm', minHeight: '90px' }}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between" style={{ gap: '1cm' }}>
          
          {/* Brand Logo */}
          <div className="flex items-center gap-4 cursor-pointer group" onClick={onBack}>
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-950/10 dark:bg-emerald-950/30 p-2 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  ZENITHRX
                </span>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border border-emerald-300/80 dark:border-emerald-800 shadow-2xs">
                  NDA VERIFIED
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                Patient Portal
              </h1>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Directory</span>
              <span className="sm:hidden">Back</span>
            </button>

            <ThemeToggle variant="segmented" />
          </div>

        </div>
      </nav>

      {/* ─── 3. Main Split-Hero Content ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-[1cm] items-stretch my-4" style={{ gap: '1cm', marginTop: '1cm', marginBottom: '1cm' }}>
          
          {/* ─── LEFT COLUMN: Atmospheric Clinical Brand & 1-Click Access (5 Cols) ─── */}
          <div className="lg:col-span-5 flex flex-col justify-between" style={{ gap: '1cm' }}>
            
            {/* Clinical Brand Hero Card */}
            <div
              className="rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#0F766E] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden flex-1 flex flex-col justify-between"
              style={{ padding: '1cm', gap: '1cm' }}
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '0.6cm' }}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold border border-white/20 w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Licensed Uganda Healthcare Network</span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                    Safe, Verified Patient Care at Your Fingertips
                  </h2>

                  <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-normal">
                    Refill authenticated prescriptions, check real-time stock across licensed Uganda pharmacies, and consult licensed doctors online.
                  </p>
                </div>

                {/* Key Benefits Grid with 1cm Vertical Separation */}
                <div className="grid grid-cols-2 gap-3 border-t border-white/15" style={{ marginTop: '0.6cm', paddingTop: '0.6cm' }}>
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-1">
                    <Shield className="w-4 h-4 text-emerald-200 mb-1" />
                    <p className="text-xs font-bold text-white">100% Genuine Meds</p>
                    <p className="text-[10px] text-emerald-100/80">NDA batch tracking</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-1">
                    <Activity className="w-4 h-4 text-emerald-200 mb-1" />
                    <p className="text-xs font-bold text-white">Safety Safeguards</p>
                    <p className="text-[10px] text-emerald-100/80">Allergy &amp; dosage checks</p>
                  </div>
                </div>
              </div>

              {/* ⚡ Quick Demo Patient Profiles (1-Click Test Access with Generous Spacing) */}
              <div className="border-t border-white/15 relative z-10" style={{ marginTop: '0.8cm', paddingTop: '0.8cm' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    1-Click Demo Profiles
                  </span>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full text-white font-bold backdrop-blur-xs">
                    Test Access
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {DEMO_PATIENTS.map((demo) => (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => handleDemoSelect(demo)}
                      className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/40 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-xs active:scale-98"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-black text-white group-hover:text-amber-200 transition-colors truncate">
                          {demo.fullName}
                        </span>
                        <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                      <span className="text-xs text-emerald-100/90 font-medium truncate mt-1.5">
                        {demo.district.split(' ')[0]} • {demo.phone.slice(-6)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ─── RIGHT COLUMN: Elegant Authentication Terminal (7 Cols) ─── */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div
              className="bg-white dark:bg-[#0E1726] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all"
              style={{ padding: '1cm' }}
            >
              
              {/* Segmented Mode Switcher */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner" style={{ marginBottom: '0.8cm' }}>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setLoginError(''); }}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'signin'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Patient Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('register'); setRegError(''); }}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'register'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Form Title & Introduction */}
              <div style={{ marginBottom: '0.8cm' }}>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {mode === 'signin' ? 'Welcome Back to ZenithRx' : 'Create Your Patient Account'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {mode === 'signin'
                    ? 'Access your digital prescription records, active refills, and health consultations.'
                    : 'Register your clinical profile to enable safe prescription dispensing across Uganda.'}
                </p>
              </div>

              {/* System Messages / Redirect Reason */}
              {redirectReason && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5" style={{ marginBottom: '0.6cm' }}>
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{redirectReason}</span>
                </div>
              )}

              {forgotPasswordMessage && (
                <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs font-semibold text-cyan-800 dark:text-cyan-300 flex items-start gap-2.5" style={{ marginBottom: '0.6cm' }}>
                  <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <span>{forgotPasswordMessage}</span>
                </div>
              )}

              {/* ─── SIGN IN FORM ─── */}
              {mode === 'signin' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8cm' }}>
                  {loginError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6cm' }}>
                    
                    {/* Phone or Email (Bulletproof Flexbox Input Group) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        Phone Number or Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center w-full h-13 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs overflow-hidden px-4 gap-3">
                        <div className="flex items-center justify-center text-slate-400 shrink-0 select-none">
                          <Phone className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="+256 701 234567 or email@domain.ug"
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          className="flex-1 h-full bg-transparent border-0 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* Password (Bulletproof Flexbox Input Group) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="flex items-center w-full h-13 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs overflow-hidden px-4 gap-3">
                        <div className="flex items-center justify-center text-slate-400 shrink-0 select-none">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your confidential password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="flex-1 h-full bg-transparent border-0 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ marginTop: '0.4cm' }}>
                      <button
                        type="submit"
                        className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                      >
                        <span>Sign In to Patient Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>

                  <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800" style={{ marginTop: '0.4cm' }}>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      New to ZenithRx?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                      >
                        Create a free patient account
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                /* ─── REGISTRATION FORM ─── */
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8cm' }}>
                  {regError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6cm' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          Full Legal Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs overflow-hidden px-3.5 gap-2.5">
                          <div className="flex items-center justify-center text-slate-400 shrink-0 select-none">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Grace Nakato"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            className="flex-1 h-full bg-transparent border-0 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs overflow-hidden px-3.5 gap-2.5">
                          <div className="flex items-center justify-center text-slate-400 shrink-0 select-none">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="+256 701 234567"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="flex-1 h-full bg-transparent border-0 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          Email Address (Optional)
                        </label>
                        <div className="flex items-center w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs overflow-hidden px-3.5 gap-2.5">
                          <div className="flex items-center justify-center text-slate-400 shrink-0 select-none">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            placeholder="grace@example.ug"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="flex-1 h-full bg-transparent border-0 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          District / Region <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs overflow-hidden px-3.5 gap-2.5">
                          <div className="flex items-center justify-center text-slate-400 shrink-0 select-none">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <select
                            value={regDistrict}
                            onChange={(e) => setRegDistrict(e.target.value)}
                            className="flex-1 h-full bg-transparent border-0 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            {UGANDA_DISTRICTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          National ID (NIN)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. CM92014819201K"
                          value={regNin}
                          onChange={(e) => setRegNin(e.target.value)}
                          className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 uppercase font-mono transition-all shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          Gender
                        </label>
                        <div className="flex items-center w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs overflow-hidden px-3.5 gap-2.5">
                          <div className="flex items-center justify-center text-slate-400 shrink-0 select-none">
                            <User className="w-4 h-4" />
                          </div>
                          <select
                            value={regGender}
                            onChange={(e) => setRegGender(e.target.value as 'Female' | 'Male' | 'Other')}
                            className="flex-1 h-full bg-transparent border-0 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        Residential / Delivery Address
                      </label>
                      <input
                        type="text"
                        placeholder="Plot / Street / Landmark"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Clinical Safety Profile Section */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-3.5">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Clinical Safety Profile (Critical for Safe Prescriptions)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          Known Drug Allergies
                        </label>
                        <div className="flex items-center w-full h-12 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 transition-all shadow-2xs overflow-hidden px-3.5 gap-2.5">
                          <div className="flex items-center justify-center text-rose-500 shrink-0 select-none">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <select
                            value={regSelectedAllergies[0] || 'None Known'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRegSelectedAllergies(val === 'None Known' ? ['None Known'] : [val]);
                            }}
                            className="flex-1 h-full bg-transparent border-0 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            {COMMON_ALLERGIES.map((allergy) => (
                              <option key={allergy} value={allergy}>
                                {allergy}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          Chronic Medical Conditions
                        </label>
                        <div className="flex items-center w-full h-12 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 transition-all shadow-2xs overflow-hidden px-3.5 gap-2.5">
                          <div className="flex items-center justify-center text-purple-500 shrink-0 select-none">
                            <HeartPulse className="w-4 h-4" />
                          </div>
                          <select
                            value={regSelectedChronic[0] || 'None'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRegSelectedChronic(val === 'None' ? ['None'] : [val]);
                            }}
                            className="flex-1 h-full bg-transparent border-0 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            {COMMON_CHRONIC.map((cond) => (
                              <option key={cond} value={cond}>
                                {cond}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.4cm' }}>
                    <button
                      type="submit"
                      className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                    >
                      <span>Complete Registration &amp; Open Portal</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800" style={{ marginTop: '0.4cm' }}>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                      >
                        Sign In instead
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* Security Note at Bottom */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center" style={{ marginTop: '0.8cm' }}>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit Encrypted • Uganda National Drug Authority (NDA) Compliant</span>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ─── 4. Inherited Footer ─── */}
      <footer className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 text-center text-[11px] text-slate-500 dark:text-slate-400 py-6 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <p>© 2026 ZenithRx Uganda · NDA Regulated Platform · 24/7 Helpline: 0200 913 555</p>
      </footer>
    </div>
  );
};
