import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
  FileText,
  Sparkles,
  MapPin,
  Award,
  Check,
  Briefcase,
  Layers,
  HelpCircle,
  Truck,
  Zap,
  Activity,
  ChevronRight,
  Pill,
  Users,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UseAuthReturn } from '../../hooks/useAuth';
import { PharmacyPremiseCategory } from '../../services/pharmacyRegistrationService';
import { TierName } from '../../types';
import { EmailVerificationScreen } from './EmailVerificationScreen';
import { formatUGX } from '../../services/formatters';
import { useTheme } from '../../context/ThemeContext';

interface RegisterPharmacyPageProps {
  auth: UseAuthReturn;
  onBackToLanding?: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterPharmacyPage: React.FC<RegisterPharmacyPageProps> = ({
  auth,
  onBackToLanding,
  onSwitchToLogin,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // ─── Step 1: Pharmacy Business Entity Details ────────────────────────────
  const [pharmacyName, setPharmacyName] = useState('');
  const [ndaLicenseNo, setNdaLicenseNo] = useState('');
  const [premiseCategory, setPremiseCategory] = useState<PharmacyPremiseCategory>('Community Retail Pharmacy');
  const [district, setDistrict] = useState('Kampala');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [businessTin, setBusinessTin] = useState('');

  // ─── Step 2: Supervising Pharmacist / Owner ──────────────────────────────
  const [leadPharmacistName, setLeadPharmacistName] = useState('');
  const [psuRegNo, setPsuRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  // ─── Step 3: Package & Service Tier Selection ────────────────────────────
  const [selectedTier, setSelectedTier] = useState<TierName>('Professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // ─── Step 4: NDA Compliance Declaration ──────────────────────────────────
  const [docNdaLicense, setDocNdaLicense] = useState(true);
  const [docPsuCert, setDocPsuCert] = useState(true);
  const [docPremisesCert, setDocPremisesCert] = useState(true);
  const [docTaxCert, setDocTaxCert] = useState(true);
  const [attestationAgreed, setAttestationAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Password Strength Calculator
  const passwordStrength = (() => {
    if (password.length === 0) return { label: '', color: '', width: '0%' };
    if (password.length < 6) return { label: 'Too short', color: 'bg-rose-500', width: '20%' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-amber-500', width: '40%' };
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-500', width: '60%' };
    if (score === 3) return { label: 'Good', color: 'bg-sky-500', width: '80%' };
    return { label: 'Strong (Clinical Grade)', color: 'bg-emerald-500', width: '100%' };
  })();

  // If email verification is pending, render the dedicated EmailVerificationScreen
  if (auth.pendingEmailVerification) {
    return (
      <EmailVerificationScreen
        email={auth.pendingEmailVerification}
        pharmacyName={pharmacyName || 'Your Registered Pharmacy'}
        auth={auth}
        onVerifiedSuccess={() => {
          auth.setPendingEmailVerification(null);
        }}
        onBackToLogin={onSwitchToLogin}
        onChangeEmail={() => {
          auth.setPendingEmailVerification(null);
          setCurrentStep(2);
        }}
      />
    );
  }

  // ─── Step Transitions & Validations ──────────────────────────────────────
  const handleNextStep = () => {
    setLocalError(null);

    if (currentStep === 1) {
      if (!pharmacyName.trim()) {
        setLocalError('Please enter the registered trade / legal name of your pharmacy.');
        return;
      }
      if (!ndaLicenseNo.trim()) {
        setLocalError('Please enter your National Drug Authority (NDA) premise license number.');
        return;
      }
      if (!physicalAddress.trim()) {
        setLocalError('Please enter the physical street address / plot location.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!leadPharmacistName.trim()) {
        setLocalError('Please enter the Supervising Pharmacist / Owner full name.');
        return;
      }
      if (!psuRegNo.trim()) {
        setLocalError('Please enter the Pharmaceutical Society of Uganda (PSU) registration number.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setLocalError('Please enter a valid official business email address.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Master password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPw) {
        setLocalError('Passwords do not match.');
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    auth.clearError();

    if (!attestationAgreed) {
      setLocalError('You must attest to the legal NDA compliance & licensing declaration.');
      return;
    }

    setSubmitting(true);
    try {
      await auth.registerCertifiedPharmacy(
        {
          pharmacyName: pharmacyName.trim(),
          ndaLicenseNo: ndaLicenseNo.trim(),
          premiseCategory,
          district,
          physicalAddress: physicalAddress.trim(),
          businessTin: businessTin.trim() || '1000000000',
          supervisingPharmacistName: leadPharmacistName.trim(),
          psuRegNo: psuRegNo.trim(),
          contactEmail: email.trim().toLowerCase(),
          contactPhone: phone.trim() || '+256 700 000 000',
          packageTier: selectedTier,
          billingCycle,
          documentsAttached: {
            ndaOperatingLicense: docNdaLicense,
            psuPracticingCertificate: docPsuCert,
            premisesSuitabilityCert: docPremisesCert,
            taxComplianceCertificate: docTaxCert,
          },
        },
        password
      );
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to submit pharmacy registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const TIERS = [
    {
      name: 'Starter' as TierName,
      priceUgx: 40000,
      usersLimit: '2 Staff Accounts',
      tagline: 'Single Dispensing Counter',
      popular: false,
      features: ['POS & Counter Checkout', 'Standard Stock Inventory', 'Basic Sales Ledger', 'NDA Dual-Audit Log'],
    },
    {
      name: 'Professional' as TierName,
      priceUgx: 72000,
      usersLimit: '5 Qualified Staff Accounts',
      tagline: 'Most Popular for Community Pharmacies',
      popular: true,
      features: [
        'Everything in Starter',
        'FEFO Batch Tracking & Alerts',
        'Auto-Reorder Engine',
        'WhatsApp Refill Cadence',
        'Customer Support Desk',
      ],
    },
    {
      name: 'Enterprise' as TierName,
      priceUgx: 150000,
      usersLimit: '20 Staff Accounts',
      tagline: 'Full Clinical & AI Ecosystem',
      popular: false,
      features: [
        'Everything in Professional',
        'Gemini AI Clinical Assistant',
        'Multi-Branch Storage Transfers',
        'Insurance Direct Billing',
        'Prescription OCR Scanner',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070F1C] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans transition-colors duration-200">
      {/* ─── Left Sidebar Showcase & Trust Panel (Desktop) ─── */}
      <div className="lg:w-5/12 bg-white dark:bg-gradient-to-br dark:from-[#0B1728] dark:via-[#0E1E34] dark:to-[#081322] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
        {/* Glow blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Top Logo & Branding + Theme Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 dark:border-emerald-400/40 flex items-center justify-center p-1 shadow-xs">
                <img src="/icon.png" alt="ZenithRx" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  ZenithRx
                </h1>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest">
                  Uganda Clinical Pharmacy SaaS Platform
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          {/* Heading */}
          <div className="space-y-3 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              NDA Certified Enterprise Onboarding
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Register Your Certified Pharmacy Entity
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              Join Uganda's leading dispensing network with multi-staff role delegation, FEFO inventory tracking, real-time Boda delivery logistics, and Supabase security.
            </p>
          </div>

          {/* Key Advantages Checklist */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Owner Highest Privilege &amp; Staff Delegation</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  The registrant receives root owner rights and can invite qualified staff (Pharmacists, Technicians, Cashiers) with custom access limits.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">NDA Statutory Compliance &amp; Audit Logs</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Automatic immutable dual-audit trails, FEFO batch quarantine, and expiry monitoring compliant with NDA Uganda guidelines.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Live Patient Orders &amp; 4-Digit OTP Deliveries</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Direct connection with the ZenithRx Patient Web App with real-time courier dispatch and MTN/Airtel MoMo checkout.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Support & Back Link */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span>Need assistance? Call </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">+256 755 091 826</span>
          </div>
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Platform Overview</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Right Dedicated Form Panel ─── */}
      <div className="lg:w-7/12 p-6 sm:p-10 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-xl bg-white dark:bg-[#0D1826] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-xl dark:shadow-2xl relative text-left transition-colors duration-200">
          {/* Top Switcher Link */}
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                STEP {currentStep} OF 4
              </span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {currentStep === 1 && 'Pharmacy Entity Information'}
                {currentStep === 2 && 'Supervising Pharmacist / Owner'}
                {currentStep === 3 && 'Package & Tool Access Level'}
                {currentStep === 4 && 'NDA Compliance & Attestation'}
              </p>
            </div>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Have an account? <span className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2">Sign In</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6 flex">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300 h-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          {/* Error Alert */}
          {(localError || auth.error) && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 mb-6 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <p className="leading-snug">{localError || auth.error}</p>
            </div>
          )}

          {/* ─── STEP 1: Pharmacy Business Entity Details ─── */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide legal business premises details as officially registered on your National Drug Authority (NDA) Operating License.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Pharmacy Legal / Trade Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Victoria Care Pharmacy Ltd"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NDA Premise License Number *
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. NDA/PREM/2026/0894"
                      value={ndaLicenseNo}
                      onChange={(e) => setNdaLicenseNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Premise Classification
                  </label>
                  <select
                    value={premiseCategory}
                    onChange={(e) => setPremiseCategory(e.target.value as PharmacyPremiseCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Community Retail Pharmacy">Community Retail Pharmacy</option>
                    <option value="Hospital Pharmacy">Hospital Pharmacy</option>
                    <option value="Wholesale & Distribution">Wholesale &amp; Distribution</option>
                    <option value="Specialist Clinical Pharmacy">Specialist Clinical Pharmacy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    District / Municipality *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kampala / Wakiso / Jinja"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URA Business TIN (Tax ID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1009182374"
                    value={businessTin}
                    onChange={(e) => setBusinessTin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Street Address / Plot Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 14, Kampala Road, City Centre"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Supervising Pharmacist</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Supervising Pharmacist / Owner ─── */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/40">
                  Highest Privileges (Root Owner)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  The Supervising Pharmacist is assigned Root Privileges on the system to add qualified staff and configure access rights.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Arthur Ssenabulya"
                      value={leadPharmacistName}
                      onChange={(e) => setLeadPharmacistName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PSU Council Registration No. *
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. PSU/REG/2022/0411"
                      value={psuRegNo}
                      onChange={(e) => setPsuRegNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Business Email (Supabase Login) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="pharmacist@pharmacy.ug"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Phone (+256) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+256 700 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Master Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className={`${passwordStrength.color} h-full transition-all`} style={{ width: passwordStrength.width }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Master Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      placeholder="Repeat password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Subscription Tier</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Subscription Package & Tier Selection ─── */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your pharmacy will strictly access the tools permitted by your chosen package tier.
              </p>

              {/* Billing Cycle Switcher */}
              <div className="flex justify-center my-2">
                <div className="p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      billingCycle === 'yearly'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Annual (2 Months Free)</span>
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                      SAVE 17%
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {TIERS.map((tier) => {
                  const isSelected = selectedTier === tier.name;
                  return (
                    <div
                      key={tier.name}
                      onClick={() => setSelectedTier(tier.name)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-sm text-slate-900 dark:text-white">{tier.name}</span>
                          {tier.popular && (
                            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">{tier.tagline}</p>
                        <div className="mb-3">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {formatUGX(billingCycle === 'yearly' ? tier.priceUgx * 10 : tier.priceUgx)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                        </div>
                        <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md mb-2">
                          {tier.usersLimit}
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                          {tier.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className={`text-[11px] font-bold block text-center ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {isSelected ? '✓ Selected Plan' : 'Select Plan'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: NDA Compliance</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: NDA Regulatory & Operating Compliance Attestation ─── */}
          {currentStep === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your application will be verified and approved by the Platform System Administrator via the administrative console before live retail operations begin.
              </p>

              {/* Registration Review Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Pharmacy Entity:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{pharmacyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">NDA Premise License:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{ndaLicenseNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Supervising Pharmacist:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{leadPharmacistName} ({psuRegNo})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Selected Tier:</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">{selectedTier} Plan ({billingCycle})</span>
                  </div>
                </div>
              </div>

              {/* Attached documents */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Attached Regulatory Attestations:</p>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docNdaLicense}
                    onChange={(e) => setDocNdaLicense(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <span>Valid NDA Premises Operating License attached</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docPsuCert}
                    onChange={(e) => setDocPsuCert(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <span>Pharmaceutical Society of Uganda (PSU) Annual Practicing Certificate attached</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docPremisesCert}
                    onChange={(e) => setDocPremisesCert(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <span>Premises Suitability Certificate inspected</span>
                </label>
              </div>

              {/* Attestation Checkbox */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 mt-3">
                <label className="flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 cursor-pointer leading-snug">
                  <input
                    type="checkbox"
                    checked={attestationAgreed}
                    onChange={(e) => setAttestationAgreed(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0 mt-0.5 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <span>
                    I hereby declare that I am the authorized Supervising Pharmacist / Owner and that all premises details and regulatory licenses submitted are authentic and compliant with National Drug Authority (NDA) statutory regulations.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting || !attestationAgreed}
                  className={`px-7 py-3 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    attestationAgreed && !submitting
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white transform hover:scale-[1.02]'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Pharmacy &amp; Verify Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
