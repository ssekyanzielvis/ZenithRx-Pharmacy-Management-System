import React, { useState } from 'react';
import {
  Search,
  Upload,
  MapPin,
  ShieldCheck,
  Truck,
  Phone,
  Pill,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  HeartPulse,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Star,
  Layers,
  FileText,
  Lock,
  Eye,
  X,
  Building2,
  Calendar,
  Stethoscope,
  Syringe,
  Activity,
  RefreshCw,
  Check,
  DollarSign,
  HelpCircle,
  Info,
  Shield,
  Zap,
  Award,
  BadgeCheck,
  Navigation,
  MessageCircle,
} from 'lucide-react';
import {
  pharmacyDiscoveryService,
  PharmacyBranchDetails,
  PharmacyStockItem,
} from '../../services/pharmacyDiscoveryService';
import {
  pharmacyServicesCatalogueService,
  PharmacyServiceItem,
  ServiceCategory,
  SERVICE_CATEGORIES,
} from '../../services/pharmacyServicesCatalogueService';
import { getMasterMedicines, MasterMedicineItem } from '../../services/medicineSafetyService';
import { getHealthEducationArticles } from '../../services/healthEducationService';
import { formatUGX } from '../../services/formatters';
import { ThemeToggle } from '../ui/ThemeToggle';

interface PatientLandingPageProps {
  onOpenAuth: (mode: 'signin' | 'register', reason?: string) => void;
  onSelectAction: (action: 'prescriptions' | 'search' | 'refills' | 'telehealth' | 'adr') => void;
  currentUser?: { fullName: string; phone?: string; id?: string } | null;
  onReturnToPortal?: () => void;
}

export const PatientLandingPage: React.FC<PatientLandingPageProps> = ({
  onOpenAuth,
  onSelectAction,
  currentUser,
  onReturnToPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [emergency24hOnly, setEmergency24hOnly] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [pickupOnly, setPickupOnly] = useState(false);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<ServiceCategory | 'all'>('all');

  const [bookingToast, setBookingToast] = useState<string | null>(null);
  const [selectedPharmacyForModal, setSelectedPharmacyForModal] = useState<PharmacyBranchDetails | null>(null);
  const [selectedMedicineForModal, setSelectedMedicineForModal] = useState<MasterMedicineItem | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'services' | 'hours' | 'shelf' | 'fulfillment'>('services');
  const [shelfSearchQuery, setShelfSearchQuery] = useState('');

  const allPharmacies = pharmacyDiscoveryService.getAllPharmacies();
  const districts = ['all', ...pharmacyDiscoveryService.getAvailableDistricts()];
  const masterMedicines = getMasterMedicines();
  const articles = getHealthEducationArticles(true).slice(0, 3);

  // Filter pharmacies based on search, district, live availability, and services
  const filteredPharmacies = pharmacyDiscoveryService.searchPharmacies({
    query: searchQuery,
    district: selectedDistrict,
    openNowOnly,
    emergency24hOnly,
    deliveryOnly,
    pickupOnly,
    serviceCategory: selectedServiceCategory,
  });

  const handleActionClick = (action: 'prescriptions' | 'search' | 'refills' | 'telehealth' | 'adr', reason?: string) => {
    if (currentUser) {
      if (onReturnToPortal) onReturnToPortal();
      onSelectAction(action);
    } else {
      onOpenAuth('signin', reason);
    }
  };

  const hasActiveFilters =
    openNowOnly ||
    emergency24hOnly ||
    deliveryOnly ||
    pickupOnly ||
    selectedServiceCategory !== 'all' ||
    selectedDistrict !== 'all' ||
    Boolean(searchQuery.trim());

  const resetAllFilters = () => {
    setOpenNowOnly(false);
    setEmergency24hOnly(false);
    setDeliveryOnly(false);
    setPickupOnly(false);
    setSelectedServiceCategory('all');
    setSelectedDistrict('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070E18] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white pb-12">
      
      {/* ── 1. Top Clinical Regulatory Ticker Bar ── */}
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

      {/* ── 2. Glassmorphic Navigation Bar ── */}
      <nav className="bg-white/90 dark:bg-[#0B131F]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-950/20 p-1 flex items-center justify-center shadow-xs shrink-0">
              <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  ZENITHRX
                </span>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
                  NDA
                </span>
              </div>
              <h1 className="text-xs sm:text-base font-black tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                Patient Portal
              </h1>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#pharmacies" className="px-3 py-1.5 rounded-xl hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all">
              Live Pharmacies
            </a>
            <a href="#medicines" className="px-3 py-1.5 rounded-xl hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all">
              Price Index
            </a>
            <a href="#workflow" className="px-3 py-1.5 rounded-xl hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all">
              Safety Workflow
            </a>
            <a href="#health-library" className="px-3 py-1.5 rounded-xl hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all">
              Health Guides
            </a>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="segmented" />

            {currentUser ? (
              <button
                onClick={() => {
                  if (onReturnToPortal) onReturnToPortal();
                  else onSelectAction('search');
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] sm:text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Portal ({currentUser.fullName.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-bold transition-all cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Register</span>
                  <ArrowRight className="w-3 h-3 hidden sm:inline" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── 3. Clean, Airy Hero Section (Mobile Optimized) ── */}
      <section className="relative overflow-hidden pt-6 pb-8 sm:pt-16 sm:pb-20 px-3 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-slate-500/5 to-transparent">
        
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 relative z-10">
          
          {/* Regulatory Trust Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-xs font-black shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Uganda National Drug Authority (NDA) &amp; PSU Licensed</span>
          </div>

          {/* Punchy Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Verified Uganda Pharmacies, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
                Live Stock &amp; Honest Prices
              </span>
            </h2>

            <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Real-time cross-pharmacy stock lookup, doctor prescription verification, and 30-min express medicine dispatch across Uganda.
            </p>
          </div>

          {/* ── Search Input (Streamlined on Mobile) ── */}
          <div className="max-w-2xl mx-auto bg-white dark:bg-[#0c1626] p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 sm:left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search medicine name, generic, or pharmacy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem' }}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('pharmacies');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          </div>

          {/* ── 4 Quick Actions (2x2 Grid on Mobile, 4-Col on Desktop) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 pt-2 max-w-4xl mx-auto">
            {/* 1. Upload Rx */}
            <button
              onClick={() => handleActionClick('prescriptions', 'Sign in to upload your doctor prescription')}
              className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 shadow-2xs hover:shadow-xs transition-all text-left flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  Upload Rx
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">AI OCR &amp; Verification</p>
              </div>
            </button>

            {/* 2. Chronic Refills */}
            <button
              onClick={() => handleActionClick('refills', 'Sign in to automate your chronic refill schedule')}
              className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/60 shadow-2xs hover:shadow-xs transition-all text-left flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                  Chronic Refills
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">Automated Schedules</p>
              </div>
            </button>

            {/* 3. Ask Pharmacist */}
            <button
              onClick={() => handleActionClick('telehealth', 'Sign in to consult with a licensed pharmacist')}
              className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 shadow-2xs hover:shadow-xs transition-all text-left flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                  Ask Pharmacist
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">24/7 Clinical Help</p>
              </div>
            </button>

            {/* 4. Find Local Pharmacy */}
            <button
              onClick={() => {
                const el = document.getElementById('pharmacies');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/60 shadow-2xs hover:shadow-xs transition-all text-left flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                  Pharmacies
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">{allPharmacies.length} Active Branches</p>
              </div>
            </button>
          </div>

          {/* ── Compact Trust Metric Strip ── */}
          <div className="grid grid-cols-4 gap-2 max-w-3xl mx-auto pt-2 text-center text-xs">
            <div className="bg-white/80 dark:bg-[#0c1626]/80 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block">100%</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate block">NDA Licensed</span>
            </div>
            <div className="bg-white/80 dark:bg-[#0c1626]/80 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-sm sm:text-lg font-black text-teal-600 dark:text-teal-400 block">&lt;30m</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate block">Express Delivery</span>
            </div>
            <div className="bg-white/80 dark:bg-[#0c1626]/80 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-sm sm:text-lg font-black text-cyan-600 dark:text-cyan-400 block">450+</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate block">Formularies</span>
            </div>
            <div className="bg-white/80 dark:bg-[#0c1626]/80 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block">0%</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate block">Counterfeits</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Participating Pharmacies Section (Clean & De-congested) ── */}
      <section id="pharmacies" className="py-8 sm:py-14 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                LIVE PHARMACIES &amp; STOCK
              </span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-black border border-emerald-300 dark:border-emerald-800">
                {allPharmacies.length} BRANCHES
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
              Participating Pharmacies &amp; Real-Time Availability
            </h2>
          </div>

          {/* Horizontal Scrollable District Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:max-w-md" style={{ scrollbarWidth: 'none' }}>
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedDistrict === d
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {d === 'all' ? 'All Uganda' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Scrollable Quick Filters Bar (One Clean Row) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setOpenNowOnly(!openNowOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              openNowOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${openNowOnly ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>Open Now</span>
          </button>

          <button
            onClick={() => setEmergency24hOnly(!emergency24hOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              emergency24hOnly
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>24/7 Emergency</span>
          </button>

          <button
            onClick={() => setDeliveryOnly(!deliveryOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              deliveryOnly
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Delivery</span>
          </button>

          <button
            onClick={() => setPickupOnly(!pickupOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              pickupOnly
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-teal-500" />
            <span>Pickup</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:underline shrink-0 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* ── Pharmacy Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPharmacies.length === 0 ? (
            <div className="col-span-full p-8 sm:p-12 bg-white dark:bg-[#0c1626] rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs space-y-3 shadow-xs">
              <Building2 className="w-8 h-8 mx-auto text-slate-400" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">No pharmacies match current filters</h4>
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredPharmacies.map((pharm) => (
              <div
                key={pharm.id}
                className="bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all group"
              >
                <div className="space-y-2.5">
                  
                  {/* Status & Rating */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {pharm.isTemporarilyClosed ? (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                          Closed
                        </span>
                      ) : pharm.is24HoursEmergency ? (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          24/7 Emergency
                        </span>
                      ) : pharm.isOpenNow ? (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Open Now
                        </span>
                      ) : (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                          Closed Now
                        </span>
                      )}

                      <span className="text-[10px] font-bold text-slate-400 truncate">
                        • {pharm.district}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{pharm.rating}</span>
                    </div>
                  </div>

                  {/* Pharmacy Identity */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight leading-snug">
                      {pharm.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{pharm.branchName} • {pharm.distanceKm} km</span>
                    </p>
                  </div>

                  {/* Hours & Fulfillment Mini Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-[11px]">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {pharm.openingHoursDisplay}
                      </span>
                      <span className="text-[10px] text-slate-400">{pharm.nextOpenTimeDisplay}</span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                      <span className="flex items-center gap-1">
                        <Truck className={`w-3 h-3 ${pharm.deliveryAvailable ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {pharm.deliveryAvailable ? `Delivery (${pharm.deliveryTimeMin})` : 'No Delivery'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className={`w-3 h-3 ${pharm.pickupAvailable ? 'text-teal-600' : 'text-slate-400'}`} />
                        {pharm.pickupAvailable ? 'Pickup' : 'No Pickup'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPharmacyForModal(pharm);
                      setModalActiveTab('services');
                      setShelfSearchQuery('');
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Services &amp; Stock
                  </button>

                  <button
                    onClick={() => handleActionClick('prescriptions', `Sign in to place an order from ${pharm.name}`)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    Order
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </section>

      {/* ── 5. National Medicine Price Index ── */}
      <section id="medicines" className="py-8 sm:py-14 bg-white dark:bg-[#09111c] border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                PRICE TRANSPARENCY
              </span>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                Uganda National Medicine Price Index
              </h2>
            </div>

            <button
              onClick={() => handleActionClick('search', 'Sign in to access the complete Medicine Catalog')}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Formularies</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {masterMedicines.slice(0, 6).map((med) => (
              <div
                key={med.id}
                className="bg-slate-50/80 dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:shadow-xs transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-extrabold uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {med.category}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">{med.ndaRegistrationNumber}</span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {med.brandName}
                    </h4>
                    <p className="text-xs text-slate-500 italic mt-0.5">{med.genericName}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-slate-600 dark:text-slate-300 space-y-1 border border-slate-100 dark:border-slate-800/80">
                    <p><span className="font-bold">Form:</span> {med.form} ({med.strength})</p>
                    <p><span className="font-bold">Dose:</span> {med.standardDoseAdult}</p>
                  </div>
                </div>

                <div className="pt-2.5 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Price per pack</span>
                    <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {formatUGX(med.suggestedRetailPriceUgx)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedMedicineForModal(med)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleActionClick('prescriptions', `Sign in to order ${med.brandName}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer"
                    >
                      Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Safety-First Clinical Stepper ── */}
      <section id="workflow" className="py-8 sm:py-14 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            SAFETY-FIRST ARCHITECTURE
          </span>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            How ZenithRx Protects Your Health
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            {
              step: '01',
              title: 'Upload Rx',
              desc: 'Snap prescription photo. OCR extracts drugs in seconds.',
              icon: Upload,
              color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80',
            },
            {
              step: '02',
              title: 'Verification',
              desc: 'Pharmacist confirms dosing and clinical interactions.',
              icon: ShieldCheck,
              color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/80',
            },
            {
              step: '03',
              title: 'FEFO Pack',
              desc: 'Dispensed from audited First-Expiry-First-Out batches.',
              icon: Pill,
              color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/80',
            },
            {
              step: '04',
              title: 'OTP Delivery',
              desc: 'Motorcycle rider delivers with secure 4-digit OTP handover.',
              icon: Truck,
              color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/80',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-2 relative"
              >
                <div className="flex justify-between items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-200 dark:text-slate-800">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 7. Health Articles ── */}
      <section id="health-library" className="py-8 sm:py-14 bg-white dark:bg-[#09111c] border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                CLINICAL ADVICE
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                Health Advice by Pharmacists
              </h2>
            </div>
            <button
              onClick={() => handleActionClick('search', 'Sign in to access articles')}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {articles.map((art) => (
              <div
                key={art.id}
                className="bg-slate-50 dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    {art.category}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-2">{art.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{art.summary}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between">
                  <span>{art.authorName}</span>
                  <span>{art.readTimeMinutes}m read</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Emergency Helpline Card ── */}
      <section className="py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 border border-slate-800">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-[10px] font-black uppercase text-emerald-400">
              24/7 PHARMACY HELPLINE
            </span>
            <h3 className="text-xl sm:text-2xl font-black">Need Urgent Medication Advice?</h3>
            <p className="text-xs text-slate-300">
              Speak directly with an on-duty accredited pharmacist via WhatsApp or Phone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
            <a
              href="https://wa.me/256755091826"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Helpline</span>
            </a>

            <button
              onClick={() => handleActionClick('adr', 'Sign in to report side effect')}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Reaction</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Modal: Inspect Full Pharmacy Shelf, Hours & Fulfillment ── */}
      {selectedPharmacyForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1626] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {selectedPharmacyForModal.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedPharmacyForModal.address} · {selectedPharmacyForModal.district}
                </p>
              </div>

              <button
                onClick={() => setSelectedPharmacyForModal(null)}
                className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex items-center gap-1.5 p-2.5 bg-white dark:bg-[#0c1626] border-b border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setModalActiveTab('services')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'services'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Services ({selectedPharmacyForModal.services?.length || 0})
              </button>

              <button
                onClick={() => setModalActiveTab('hours')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'hours'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Hours &amp; Schedule
              </button>

              <button
                onClick={() => setModalActiveTab('shelf')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'shelf'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Shelf Stock ({selectedPharmacyForModal.inventory?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {modalActiveTab === 'services' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedPharmacyForModal.services || []).map((srv) => (
                    <div key={srv.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{srv.serviceName}</span>
                        <span className="font-black text-emerald-600">{srv.priceType === 'free' ? 'Free' : formatUGX(srv.priceUgx)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{srv.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {modalActiveTab === 'hours' && (
                <div className="space-y-2">
                  {(selectedPharmacyForModal.weeklySchedule || []).map((s) => (
                    <div key={s.day} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs">
                      <span className="font-bold">{s.day}</span>
                      <span className="text-slate-600 dark:text-slate-300 font-mono">{s.is24Hours ? 'Open 24 Hours' : `${s.openTime} – ${s.closeTime}`}</span>
                    </div>
                  ))}
                </div>
              )}

              {modalActiveTab === 'shelf' && (
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter shelf..."
                      value={shelfSearchQuery}
                      onChange={(e) => setShelfSearchQuery(e.target.value)}
                      style={{ paddingLeft: '2rem', paddingRight: '0.75rem' }}
                      className="w-full py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                  {(selectedPharmacyForModal.inventory || [])
                    .filter((i) => !shelfSearchQuery || i.brandName.toLowerCase().includes(shelfSearchQuery.toLowerCase()))
                    .map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{item.brandName}</p>
                          <p className="text-[10px] text-slate-400">{item.genericName}</p>
                        </div>
                        <span className="font-black text-emerald-600">{formatUGX(item.priceUgx)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedPharmacyForModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Medicine Details ── */}
      {selectedMedicineForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0c1626] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3.5">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  {selectedMedicineForModal.category}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                  {selectedMedicineForModal.brandName}
                </h3>
                <p className="text-xs text-slate-500 italic">{selectedMedicineForModal.genericName}</p>
              </div>
              <button onClick={() => setSelectedMedicineForModal(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <p><strong className="text-slate-900 dark:text-slate-100">Dosage:</strong> {selectedMedicineForModal.standardDoseAdult}</p>
                <p><strong className="text-slate-900 dark:text-slate-100">Form:</strong> {selectedMedicineForModal.form} ({selectedMedicineForModal.strength})</p>
                <p><strong className="text-slate-900 dark:text-slate-100">Manufacturer:</strong> {selectedMedicineForModal.manufacturer}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="text-[9px] text-slate-400 block font-semibold">Retail Price</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatUGX(selectedMedicineForModal.suggestedRetailPriceUgx)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const med = selectedMedicineForModal;
                    setSelectedMedicineForModal(null);
                    handleActionClick('prescriptions', `Sign in to order ${med.brandName}`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center text-[11px] text-slate-500 pt-8 border-t border-slate-200 dark:border-slate-800">
        <p>© 2026 ZenithRx Uganda · NDA Regulated Platform · 24/7 Helpline: 0200 913 555</p>
      </footer>

    </div>
  );
};
