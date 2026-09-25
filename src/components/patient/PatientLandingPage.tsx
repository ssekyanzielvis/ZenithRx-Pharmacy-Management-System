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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070E18] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      
      {/* ── 1. Top Clinical Regulatory Ticker Bar ── */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-emerald-100 text-[11px] sm:text-xs py-2 px-4 border-b border-emerald-800/40 shadow-xs flex items-center justify-between gap-4">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 font-semibold">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">
              Uganda National Drug Authority (NDA) Certified Network · Verified Dispensing &amp; 30-Min Delivery Across Kampala &amp; Entebbe
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 shrink-0 text-[11px] text-emerald-300/80">
            <span>Helpline: <strong>0200 913 555</strong></span>
            <span>•</span>
            <span>PSU Verified Practitioners</span>
          </div>
        </div>
      </div>

      {/* ── 2. Glassmorphic Navigation Bar ── */}
      <nav className="bg-white/85 dark:bg-[#0B131F]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Clinical Subtitle */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-950/20 p-1.5 flex items-center justify-center shadow-xs group">
              <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  ZENITHRX
                </span>
                <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider">
                  NDA VERIFIED
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                Patient Health Portal
              </h1>
            </div>
          </div>

          {/* Center Navigation Anchors */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-600 dark:text-slate-300">
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
          <div className="flex items-center gap-3">
            <ThemeToggle variant="segmented" />

            {currentUser ? (
              <button
                onClick={() => {
                  if (onReturnToPortal) onReturnToPortal();
                  else onSelectAction('search');
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>My Portal ({currentUser.fullName.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Sign In
                </button>

                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── 3. High-Impact Clinical Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-slate-500/5 to-transparent">
        
        {/* Subtle Decorative Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-400/15 dark:bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-teal-400/10 dark:bg-cyan-500/10 blur-[90px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
          
          {/* Regulatory Trust Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-black shadow-2xs animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Uganda National Drug Authority (NDA) &amp; PSU Licensed Platform</span>
          </div>

          {/* Commanding Headline */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Explore Verified Pharmacies, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
                Live Stock &amp; Honest Prices
              </span>
            </h2>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Search Uganda&apos;s registered pharmacy network in real-time. Verify prescription safety with licensed pharmacists, check shelf stock, and receive tamper-evident express delivery.
            </p>
          </div>

          {/* ── Commanding Search Console ── */}
          <div className="max-w-3xl mx-auto bg-white dark:bg-[#0c1626] p-2.5 sm:p-3.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search any medicine (e.g. Augmentin, Ventolin, Metformin) or pharmacy name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '3.25rem', paddingRight: '1rem' }}
                className="w-full py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('pharmacies');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Stock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ── 4 Interactive Hero Quick Action Tiles ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3 max-w-4xl mx-auto">
            {/* 1. Upload Rx */}
            <button
              onClick={() => handleActionClick('prescriptions', 'Sign in to upload your doctor prescription')}
              className="p-4 rounded-2xl bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all text-left flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Upload Prescription
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Assistive AI OCR &amp; Verification</p>
              </div>
            </button>

            {/* 2. Chronic Refills */}
            <button
              onClick={() => handleActionClick('refills', 'Sign in to automate your chronic refill schedule')}
              className="p-4 rounded-2xl bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 shadow-xs hover:shadow-md transition-all text-left flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Chronic Refills
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Automated Dosage Reminders</p>
              </div>
            </button>

            {/* 3. Ask Pharmacist */}
            <button
              onClick={() => handleActionClick('telehealth', 'Sign in to consult with a licensed pharmacist')}
              className="p-4 rounded-2xl bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-sky-500/60 shadow-xs hover:shadow-md transition-all text-left flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Ask a Pharmacist
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">24/7 Clinical Consultation</p>
              </div>
            </button>

            {/* 4. Find Local Pharmacy */}
            <button
              onClick={() => {
                const el = document.getElementById('pharmacies');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all text-left flex items-center gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Find Pharmacies
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{allPharmacies.length} Licensed Branches</p>
              </div>
            </button>
          </div>

          {/* ── Trust Metric Counters Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-4xl mx-auto pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="bg-white/80 dark:bg-[#0c1626]/80 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center shadow-2xs">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">100%</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">NDA Licensed Network</span>
            </div>
            <div className="bg-white/80 dark:bg-[#0c1626]/80 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center shadow-2xs">
              <span className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 block">&lt; 30 Mins</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Express Delivery</span>
            </div>
            <div className="bg-white/80 dark:bg-[#0c1626]/80 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center shadow-2xs">
              <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 block">450+</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Verified Medicines</span>
            </div>
            <div className="bg-white/80 dark:bg-[#0c1626]/80 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center shadow-2xs">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">0%</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Counterfeit Tolerance</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Participating Pharmacies & Availability Engine ── */}
      <section id="pharmacies" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                REGISTERED DISPENSARIES &amp; LIVE AVAILABILITY
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-800">
                {allPharmacies.length} ACTIVE BRANCHES
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              Cross-Pharmacy Search &amp; Availability Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
              Check real-time <strong>open/closed status</strong>, <strong>24/7 emergency branches</strong>, <strong>opening hours</strong>, and choose between <strong>express delivery</strong> or <strong>counter pickup</strong>.
            </p>
          </div>

          {/* District Filter Pills */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 max-w-md">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDistrict === d
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {d === 'all' ? 'All Uganda' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Control Dashboard Bar */}
        <div className="bg-white dark:bg-[#0c1626] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 text-xs">
          
          {/* Row 1: Operational Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Availability:
              </span>

              {/* Open Now Filter */}
              <button
                onClick={() => setOpenNowOnly(!openNowOnly)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  openNowOnly
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${openNowOnly ? 'bg-white' : 'bg-emerald-500'}`} />
                <span>Open Now</span>
              </button>

              {/* 24/7 Emergency Filter */}
              <button
                onClick={() => setEmergency24hOnly(!emergency24hOnly)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  emergency24hOnly
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>24/7 Emergency Branches</span>
              </button>

              {/* Delivery Available Filter */}
              <button
                onClick={() => setDeliveryOnly(!deliveryOnly)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  deliveryOnly
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Delivery Available</span>
              </button>

              {/* Pickup Available Filter */}
              <button
                onClick={() => setPickupOnly(!pickupOnly)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  pickupOnly
                    ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-teal-500" />
                <span>Pickup Available</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Row 2: Service Catalogue Filter Pills */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Services:
            </span>

            <button
              onClick={() => setSelectedServiceCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedServiceCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Services
            </button>

            <button
              onClick={() => setSelectedServiceCategory('consultation')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedServiceCategory === 'consultation'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3 h-3 text-blue-500" />
              <span>Consultations</span>
            </button>

            <button
              onClick={() => setSelectedServiceCategory('vaccination')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedServiceCategory === 'vaccination'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Syringe className="w-3 h-3 text-indigo-500" />
              <span>Vaccinations</span>
            </button>

            <button
              onClick={() => setSelectedServiceCategory('screening')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedServiceCategory === 'screening'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3 h-3 text-purple-500" />
              <span>Screenings (BP, Sugar, RDT)</span>
            </button>

            <button
              onClick={() => setSelectedServiceCategory('refill')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedServiceCategory === 'refill'
                  ? 'bg-cyan-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3 h-3 text-cyan-500" />
              <span>Auto Refills</span>
            </button>

            <button
              onClick={() => setSelectedServiceCategory('delivery')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedServiceCategory === 'delivery'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3 h-3 text-amber-500" />
              <span>Home Delivery</span>
            </button>
          </div>
        </div>

        {/* ── Pharmacy Cards Grid (3-Columns) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPharmacies.length === 0 ? (
            <div className="col-span-full p-12 bg-white dark:bg-[#0c1626] rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs space-y-3 shadow-xs">
              <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">No pharmacies match current filters</h4>
              <p className="max-w-sm mx-auto">Try resetting the availability filters or selecting another district.</p>
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            filteredPharmacies.map((pharm) => (
              <div
                key={pharm.id}
                className="bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
              >
                <div className="space-y-3.5">
                  
                  {/* Status & Rating Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pharm.isTemporarilyClosed ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Temporarily Closed
                        </span>
                      ) : pharm.is24HoursEmergency ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          24/7 Emergency
                        </span>
                      ) : pharm.isOpenNow ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Open Now
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 flex items-center gap-1.5 border border-rose-200 dark:border-rose-800">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Closed Now
                        </span>
                      )}

                      <span className="text-[10px] font-bold text-slate-400">
                        • {pharm.district}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 text-xs font-black bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{pharm.rating}</span>
                    </div>
                  </div>

                  {/* Pharmacy Identity */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight leading-snug">
                      {pharm.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{pharm.branchName} • {pharm.distanceKm} km away</span>
                    </p>
                  </div>

                  {/* Hours & Fulfillment Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 space-y-2 text-xs border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{pharm.openingHoursDisplay}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{pharm.nextOpenTimeDisplay}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      <span className="flex items-center gap-1">
                        <Truck className={`w-3.5 h-3.5 ${pharm.deliveryAvailable ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        {pharm.deliveryAvailable ? `Delivery (${pharm.deliveryTimeMin})` : 'No Delivery'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className={`w-3.5 h-3.5 ${pharm.pickupAvailable ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                        {pharm.pickupAvailable ? 'Pickup Ready' : 'No Pickup'}
                      </span>
                    </div>
                  </div>

                  {/* Pharmacist in charge */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Supervised by <strong className="text-slate-700 dark:text-slate-200">{pharm.supervisingPharmacist}</strong></span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPharmacyForModal(pharm);
                      setModalActiveTab('services');
                      setShelfSearchQuery('');
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                    <span>Services &amp; Stock</span>
                  </button>

                  <button
                    onClick={() => handleActionClick('prescriptions', `Sign in to place an order from ${pharm.name}`)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                  >
                    <span>Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </section>

      {/* ── 5. National Medicine Price & Formulary Index ── */}
      <section id="medicines" className="py-12 sm:py-16 bg-white dark:bg-[#09111c] border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                TRANSPARENT CROSS-PHARMACY PRICING
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                Uganda National Medicine Price Index
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Search by brand name or generic INN compound to check availability across all participating pharmacies in Uganda before stepping out.
              </p>
            </div>

            <button
              onClick={() => handleActionClick('search', 'Sign in to access the complete Medicine Catalog')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>View All 450+ Formularies</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masterMedicines.slice(0, 6).map((med) => (
              <div
                key={med.id}
                className="bg-slate-50/70 dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {med.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">{med.ndaRegistrationNumber}</span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
                      {med.brandName}
                    </h4>
                    <p className="text-xs text-slate-500 italic mt-0.5">{med.genericName}</p>
                  </div>

                  {/* Formulation Specs */}
                  <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1 border border-slate-100 dark:border-slate-800/80">
                    <p><span className="font-bold text-slate-800 dark:text-slate-100">Formulation:</span> {med.form} ({med.strength})</p>
                    <p><span className="font-bold text-slate-800 dark:text-slate-100">Adult Dosage:</span> {med.standardDoseAdult}</p>
                  </div>
                </div>

                <div className="pt-3.5 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-none">Price per pack</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {formatUGX(med.suggestedRetailPriceUgx)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedMedicineForModal(med)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-all"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleActionClick('prescriptions', `Sign in to order ${med.brandName}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer transition-all active:scale-98"
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

      {/* ── 6. Safety-First Clinical Workflow ── */}
      <section id="workflow" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            SAFETY-FIRST ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            How ZenithRx Protects Your Health &amp; Delivers Fast
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Our assistive clinical engine pairs instant digital prescription scanning with mandatory human pharmacist validation to guarantee 100% medication safety.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              title: 'Upload Prescription',
              desc: 'Snap a clear photo of your prescription. Our assistive OCR extracts drug names, dosages, and quantities in seconds.',
              icon: Upload,
              color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800',
            },
            {
              step: '02',
              title: 'Pharmacist Verification',
              desc: 'A certified Ugandan pharmacist checks interactions, confirms dosing against clinical references, and approves the order.',
              icon: ShieldCheck,
              color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800',
            },
            {
              step: '03',
              title: 'FEFO Dispensing & Pack',
              desc: 'Pharmacy staff dispense from audited First-Expiry-First-Out batches and generate classified dispensing register records.',
              icon: Pill,
              color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800',
            },
            {
              step: '04',
              title: 'Secure OTP Handover',
              desc: 'Our express motorcycle courier brings your order directly to your door. Provide your 4-digit OTP to complete handover.',
              icon: Truck,
              color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3.5 relative overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black font-mono text-slate-200 dark:text-slate-800">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 7. Clinical Health Advice & Education Library ── */}
      <section id="health-library" className="py-12 sm:py-16 bg-white dark:bg-[#09111c] border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                CLINICAL HEALTH ADVICE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                Articles Written by Registered Pharmacists
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Evidence-based guides on hypertension, diabetes management, malaria prevention, and antibiotic stewardship.
              </p>
            </div>

            <button
              onClick={() => handleActionClick('search', 'Sign in to access the full Health Education Library')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>View All Articles</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((art) => (
              <div
                key={art.id}
                className="bg-slate-50 dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all"
              >
                <div>
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {art.category}
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-2.5 leading-snug">{art.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">{art.summary}</p>
                </div>

                <div className="pt-3.5 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between items-center font-medium">
                  <span>Author: {art.authorName}</span>
                  <span>{art.readTimeMinutes} min read</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. 24/7 Helpline & ADR Safety Console ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 relative overflow-hidden">
          
          <div className="space-y-2 max-w-xl text-center md:text-left relative z-10">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              24/7 PHARMACY HELPLINE &amp; SAFETY DESK
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">Need Urgent Medication Advice?</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Speak directly with an accredited pharmacist via phone or WhatsApp. Report adverse side effects or seek dosage consultations anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto relative z-10">
            <a
              href="https://wa.me/256755091826"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp Helpline</span>
            </a>

            <button
              onClick={() => handleActionClick('adr', 'Sign in to file an Adverse Drug Reaction report')}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Side Effect (ADR)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Modal: Inspect Full Pharmacy Shelf, Hours & Fulfillment ── */}
      {selectedPharmacyForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#0c1626] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[88vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {selectedPharmacyForModal.isTemporarilyClosed ? (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Temporarily Closed
                    </span>
                  ) : selectedPharmacyForModal.is24HoursEmergency ? (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      24/7 Emergency Branch
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Open Now
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {selectedPharmacyForModal.district} • {selectedPharmacyForModal.distanceKm} km away
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {selectedPharmacyForModal.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedPharmacyForModal.address} • Supervised by <strong>{selectedPharmacyForModal.supervisingPharmacist}</strong> ({selectedPharmacyForModal.licenseNo})
                </p>
              </div>

              <button
                onClick={() => setSelectedPharmacyForModal(null)}
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#0c1626] border-b border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setModalActiveTab('services')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalActiveTab === 'services'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Clinical Services ({selectedPharmacyForModal.services?.length || 0})</span>
              </button>

              <button
                onClick={() => setModalActiveTab('hours')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalActiveTab === 'hours'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Opening Hours &amp; Schedule</span>
              </button>

              <button
                onClick={() => setModalActiveTab('shelf')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalActiveTab === 'shelf'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Live Medicine Shelf ({selectedPharmacyForModal.inventory?.length || 0})</span>
              </button>

              <button
                onClick={() => setModalActiveTab('fulfillment')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalActiveTab === 'fulfillment'
                    ? 'bg-teal-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Delivery &amp; Pickup</span>
              </button>
            </div>

            {/* Toast Feedback for Service Booking */}
            {bookingToast && (
              <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 flex items-center justify-between gap-3 shadow-md animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold">{bookingToast}</span>
                </div>
                <button onClick={() => setBookingToast(null)} className="text-xs font-bold">✕</button>
              </div>
            )}

            {/* Tab 1: Clinical Services */}
            {modalActiveTab === 'services' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Available Clinical &amp; Community Services
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Offered on-site at {selectedPharmacyForModal.name} ({selectedPharmacyForModal.branchName}).
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 text-[10px] font-black">
                    NDA Certified Clinical Premises
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(!selectedPharmacyForModal.services || selectedPharmacyForModal.services.length === 0) ? (
                    <div className="col-span-full p-8 text-center text-slate-400">
                      <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No additional clinical services published for this branch.</p>
                    </div>
                  ) : (
                    (selectedPharmacyForModal.services || []).map((srv) => (
                      <div
                        key={srv.id}
                        className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {srv.serviceCategory}
                            </span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                              {srv.priceType === 'free' ? 'Complimentary' : formatUGX(srv.priceUgx)}
                            </span>
                          </div>

                          <h5 className="font-black text-sm text-slate-900 dark:text-slate-100">
                            {srv.serviceName}
                          </h5>

                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {srv.description}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-500" />
                              ~{srv.estimatedDurationMinutes} mins
                            </span>
                            {srv.requiresAppointment ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold">
                                Appointment Required
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold">
                                Walk-in Welcome
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setBookingToast(`Inquiry sent for "${srv.serviceName}" at ${selectedPharmacyForModal.name}. Our pharmacist will contact you.`);
                            setTimeout(() => setBookingToast(null), 5000);
                          }}
                          className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>{srv.requiresAppointment ? 'Book Appointment' : 'Inquire / Request Service'}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Hours & Schedule */}
            {modalActiveTab === 'hours' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {selectedPharmacyForModal.isTemporarilyClosed ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-sm">Temporary Branch Closure in Progress</h4>
                      <p className="mt-1 leading-relaxed">{selectedPharmacyForModal.temporaryClosureReason}</p>
                    </div>
                  </div>
                ) : selectedPharmacyForModal.is24HoursEmergency ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-start gap-3 text-emerald-900 dark:text-emerald-200">
                    <HeartPulse className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-sm">24-Hour Emergency &amp; Outpatient Facility</h4>
                      <p className="mt-1 leading-relaxed">
                        This pharmacy operates round-the-clock with an accredited night-shift dispensing pharmacist on active duty. Curbside drive-thru and emergency deliveries are supported 24/7.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <div>
                        <span className="font-black text-slate-800 dark:text-slate-200 block">Current Operating Status</span>
                        <span className="text-slate-500">{selectedPharmacyForModal.nextOpenTimeDisplay}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                      Open Regular Hours
                    </span>
                  </div>
                )}

                {/* 7-Day Weekly Schedule */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Weekly Opening Schedule
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-700">
                    {(selectedPharmacyForModal.weeklySchedule || []).map((s) => (
                      <div key={s.day} className="p-3 flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{s.day}</span>
                        {s.is24Hours ? (
                          <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            Open 24 Hours
                          </span>
                        ) : s.isClosed ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Closed</span>
                        ) : (
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {s.openTime} — {s.closeTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Public Holiday Exceptions */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Upcoming Uganda Public Holiday Hours
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(selectedPharmacyForModal.holidaySchedule || []).map((h, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{h.holidayName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{h.date}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">{h.status}</span>
                          {h.hours && <span className="text-slate-500">{h.hours}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Shelf Stock */}
            {modalActiveTab === 'shelf' && (
              <>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1626]">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter medicines in this pharmacy..."
                      value={shelfSearchQuery}
                      onChange={(e) => setShelfSearchQuery(e.target.value)}
                      style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                      className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                  {(selectedPharmacyForModal.inventory || [])
                    .filter(
                      (i) =>
                        !shelfSearchQuery ||
                        i.brandName.toLowerCase().includes(shelfSearchQuery.toLowerCase()) ||
                        i.genericName.toLowerCase().includes(shelfSearchQuery.toLowerCase()) ||
                        i.category.toLowerCase().includes(shelfSearchQuery.toLowerCase())
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {item.category}
                            </span>
                            {item.prescriptionRequired && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                Prescription Only
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{item.brandName}</h4>
                          <p className="text-xs text-slate-500 italic">{item.genericName} • {item.dosageForm} ({item.strength})</p>
                          <p className="text-[11px] font-mono text-slate-400">Batch: {item.batchNumber} • Exp: {item.expiryDate}</p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-700">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">Price per pack</span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              {formatUGX(item.priceUgx)}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedPharmacyForModal(null);
                              handleActionClick('prescriptions', `Sign in to order ${item.brandName} from ${selectedPharmacyForModal.name}`);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Order from Branch
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* Tab 4: Fulfillment */}
            {modalActiveTab === 'fulfillment' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                        Doorstep Delivery Service
                      </h4>
                    </div>
                    <span className="font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-0.5 rounded-full text-[11px]">
                      {selectedPharmacyForModal.deliveryTimeMin}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Orders are dispatched in sealed tamper-evident medical delivery bags with optional cold-chain packaging for temperature-sensitive drugs.
                  </p>

                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Covered Neighborhoods &amp; Zones:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedPharmacyForModal.deliveryCoverageAreas || []).map((area, idx) => (
                        <span key={idx} className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800 flex justify-between items-center font-bold">
                    <span>Standard Delivery Fee:</span>
                    <span className="text-indigo-700 dark:text-indigo-300 text-sm">
                      {formatUGX(selectedPharmacyForModal.deliveryFeeUgx)}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-600" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                        Pharmacy Counter &amp; Pickup
                      </h4>
                    </div>
                    <span className="font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/60 px-2.5 py-0.5 rounded-full text-[11px]">
                      {selectedPharmacyForModal.pickupEstimatedTime}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedPharmacyForModal.pickupInstructions}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                {selectedPharmacyForModal.openingHoursDisplay}
              </span>
              <button
                onClick={() => setSelectedPharmacyForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Close Shelf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Medicine Details Modal ── */}
      {selectedMedicineForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0c1626] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {selectedMedicineForModal.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1.5">
                  {selectedMedicineForModal.brandName}
                </h3>
                <p className="text-xs text-slate-500 italic">
                  {selectedMedicineForModal.genericName} · {selectedMedicineForModal.form} ({selectedMedicineForModal.strength})
                </p>
              </div>
              <button
                onClick={() => setSelectedMedicineForModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <p><strong className="text-slate-900 dark:text-slate-100">Standard Adult Dosage:</strong> {selectedMedicineForModal.standardDoseAdult}</p>
                <p><strong className="text-slate-900 dark:text-slate-100">Route of Administration:</strong> {selectedMedicineForModal.route || 'Oral'}</p>
                <p><strong className="text-slate-900 dark:text-slate-100">Manufacturer:</strong> {selectedMedicineForModal.manufacturer} ({selectedMedicineForModal.countryOfManufacture || 'Uganda'})</p>
                <p className="text-[11px] font-mono text-slate-400">NDA Registration: {selectedMedicineForModal.ndaRegistrationNumber}</p>
              </div>

              {selectedMedicineForModal.blackboxWarning && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-900 dark:text-rose-200 block text-[11px]">Special Precaution &amp; Warning</strong>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">{selectedMedicineForModal.blackboxWarning}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Average Retail Price</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    {formatUGX(selectedMedicineForModal.suggestedRetailPriceUgx)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const med = selectedMedicineForModal;
                    setSelectedMedicineForModal(null);
                    handleActionClick('prescriptions', `Sign in to order ${med.brandName}`);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  Order via ZenithRx
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. First-Class Luxury Patient Portal Footer ── */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md">
                  <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    ZENITHRX · QUANTUM INNOVATIONS
                  </span>
                  <h3 className="text-base font-black text-white">Uganda Patient Health &amp; Pharmacy Network</h3>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Empowering Ugandan families with transparent cross-pharmacy stock visibility, authentic NDA-verified medicines, automated chronic refills, and fast 30-minute motorcycle dispatch.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NDA Regulated Network</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-[10px] font-bold">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>256-Bit SSL Encrypted</span>
                </span>
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Patient Services</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#pharmacies" className="hover:text-emerald-400 transition-colors">Find Local Pharmacy</a></li>
                <li><a href="#medicines" className="hover:text-emerald-400 transition-colors">National Price Index</a></li>
                <li><button onClick={() => handleActionClick('prescriptions', 'Upload prescription')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">Prescription Verification</button></li>
                <li><button onClick={() => handleActionClick('refills', 'Chronic Refills')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">Chronic Refill Schedules</button></li>
                <li><button onClick={() => handleActionClick('telehealth', 'Ask a Pharmacist')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">Virtual Pharmacist Chat</button></li>
              </ul>
            </div>

            {/* Helpline & Emergency */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Emergency &amp; Support</h4>
              <div className="space-y-2 text-xs">
                <p><span className="text-slate-500">24/7 Hotline:</span> <strong className="text-white">0200 913 555</strong></p>
                <p><span className="text-slate-500">WhatsApp Dispatch:</span> <strong className="text-emerald-400">+256 755 091826</strong></p>
                <p><span className="text-slate-500">Headquarters:</span> <span className="text-slate-300">Plot 14 Nakasero Hill Rd, Kampala</span></p>
                <p><span className="text-slate-500">Clinical Oversight:</span> <span className="text-slate-300">PSU Certified Practitioners</span></p>
              </div>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 ZenithRx Patient Portal. Built by Quantum Innovations for Uganda Healthcare.</p>
            <div className="flex items-center gap-4">
              <a href="#pharmacies" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#medicines" className="hover:text-slate-400 transition-colors">Terms of Care</a>
              <button onClick={() => handleActionClick('adr', 'Report adverse side effect')} className="hover:text-rose-400 transition-colors cursor-pointer">Report Drug Reaction (ADR)</button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
