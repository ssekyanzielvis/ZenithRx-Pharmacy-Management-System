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
}

export const PatientLandingPage: React.FC<PatientLandingPageProps> = ({
  onOpenAuth,
  onSelectAction,
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

  // Cross-pharmacy medicine search matching
  const matchingMedicines = searchQuery.trim()
    ? masterMedicines.filter(
        (m) =>
          m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleActionClick = (action: 'prescriptions' | 'search' | 'refills' | 'telehealth' | 'adr', reason?: string) => {
    onOpenAuth('signin', reason);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0B131F] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* ── Top Announcement Banner ── */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-xs">
        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
        <span>
          Uganda National Drug Authority (NDA) Certified Patient Network • Express 30-Min Medicine Delivery Available Across Kampala &amp; Entebbe
        </span>
      </div>

      {/* ── Navigation Bar ── */}
      <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
              <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  ZENITHRX
                </span>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  NDA VERIFIED
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                Patient Health Portal
              </h1>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-extrabold text-slate-600 dark:text-slate-400">
            <a href="#pharmacies" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Participating Pharmacies
            </a>
            <a href="#medicines" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Medicine Price Index
            </a>
            <a href="#workflow" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#health-library" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Health Advice
            </a>
          </div>

          {/* Actions & Theme */}
          <div className="flex items-center gap-3">
            <ThemeToggle variant="segmented" />

            <button
              onClick={() => onOpenAuth('signin')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-[#F4F7FB] dark:from-emerald-950/20 dark:via-slate-900 dark:to-[#0B131F] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold shadow-xs animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Uganda National Drug Authority (NDA) &amp; PSU Licensed Digital Platform</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Explore Verified Pharmacies, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Live Stock &amp; Honest Prices
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
            Search registered pharmacies across Uganda to see what medicines they have in stock right now, verify doctor prescriptions with licensed pharmacists, and receive fast home delivery.
          </p>

          {/* Hero Search Bar */}
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search any medicine (e.g. Augmentin, Ventolin, Metformin) or pharmacy name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-none text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('pharmacies');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>Explore Stock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleActionClick('prescriptions', 'Sign in or create an account to upload your doctor prescription')}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Upload Prescription</span>
            </button>

            <button
              onClick={() => handleActionClick('refills', 'Sign in to schedule and automate your chronic refills')}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-purple-600" />
              <span>Chronic Refills</span>
            </button>

            <button
              onClick={() => handleActionClick('telehealth', 'Sign in to speak directly with an on-duty licensed pharmacist')}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 text-sky-600" />
              <span>Ask a Pharmacist</span>
            </button>
          </div>

          {/* Trust Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">100%</span>
              <span className="text-[11px] font-bold text-slate-500">NDA Licensed Network</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">30 Mins</span>
              <span className="text-[11px] font-bold text-slate-500">Express Delivery</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">450+</span>
              <span className="text-[11px] font-bold text-slate-500">Verified Medicines</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">0%</span>
              <span className="text-[11px] font-bold text-slate-500">Counterfeit Tolerance</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 1: Participating Pharmacies & Real-time Availability ── */}
      <section id="pharmacies" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                REGISTERED DISPENSARIES &amp; LIVE AVAILABILITY
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold">
                {allPharmacies.length} ACTIVE BRANCHES
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              Cross-Pharmacy Search &amp; Availability Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
              Check real-time <strong>open/closed status</strong>, <strong>24/7 emergency branches</strong>, <strong>opening hours</strong>, <strong>holiday schedules</strong>, and choose between <strong>express delivery</strong> or <strong>counter pickup</strong>.
            </p>
          </div>

          {/* District Filter Pills */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDistrict === d
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {d === 'all' ? 'All Uganda' : d}
              </button>
            ))}
          </div>
        </div>

        {/* ── Real-Time Availability & Services Filter Chips Bar ── */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          
          {/* Row 1: Operational Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Availability:
              </span>

              {/* Open Now Filter */}
              <button
                onClick={() => setOpenNowOnly(!openNowOnly)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  openNowOnly
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${openNowOnly ? 'bg-white' : 'bg-emerald-500'}`} />
                <span>Open Now</span>
              </button>

              {/* 24/7 Emergency Filter */}
              <button
                onClick={() => setEmergency24hOnly(!emergency24hOnly)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  emergency24hOnly
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>24/7 Emergency Branches</span>
              </button>

              {/* Delivery Available Filter */}
              <button
                onClick={() => setDeliveryOnly(!deliveryOnly)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  deliveryOnly
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Delivery Available</span>
              </button>

              {/* Pickup Available Filter */}
              <button
                onClick={() => setPickupOnly(!pickupOnly)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  pickupOnly
                    ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-teal-500" />
                <span>Pickup Available</span>
              </button>
            </div>

            {(openNowOnly || emergency24hOnly || deliveryOnly || pickupOnly || selectedServiceCategory !== 'all' || selectedDistrict !== 'all') && (
              <button
                onClick={() => {
                  setOpenNowOnly(false);
                  setEmergency24hOnly(false);
                  setDeliveryOnly(false);
                  setPickupOnly(false);
                  setSelectedServiceCategory('all');
                  setSelectedDistrict('all');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Row 2: Service Catalogue Filter Pills */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Services:
            </span>

            <button
              onClick={() => setSelectedServiceCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedServiceCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Services
            </button>

            <button
              onClick={() => setSelectedServiceCategory('consultation')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedServiceCategory === 'consultation'
                  ? 'bg-blue-600 text-white shadow-xs'
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
                  ? 'bg-indigo-600 text-white shadow-xs'
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
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3 h-3 text-purple-500" />
              <span>Health Screenings (BP, Glucose, RDT)</span>
            </button>

            <button
              onClick={() => setSelectedServiceCategory('refill')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedServiceCategory === 'refill'
                  ? 'bg-cyan-600 text-white shadow-xs'
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
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3 h-3 text-amber-500" />
              <span>Home Delivery</span>
            </button>

            <button
              onClick={() => setSelectedServiceCategory('other')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedServiceCategory === 'other'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3 h-3 text-rose-500" />
              <span>Wound Care &amp; Special</span>
            </button>
          </div>
        </div>

        {/* Pharmacy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPharmacies.length === 0 ? (
            <div className="col-span-full p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No pharmacies match current filters</h4>
              <p className="mt-1">Try resetting the availability filters or selecting another district.</p>
            </div>
          ) : (
            filteredPharmacies.map((pharm) => (
              <div
                key={pharm.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-lg transition-all group ${
                  pharm.isTemporarilyClosed
                    ? 'border-amber-300 dark:border-amber-800/60 opacity-90'
                    : pharm.is24HoursEmergency
                    ? 'border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                }`}
              >
                <div className="space-y-3.5">
                  
                  {/* Top Status Badges Row */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pharm.isTemporarilyClosed ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Temporarily Closed
                        </span>
                      ) : pharm.is24HoursEmergency ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 flex items-center gap-1 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          24/7 Emergency Open
                        </span>
                      ) : pharm.isOpenNow ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Open Now
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Closed Now
                        </span>
                      )}

                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                        {pharm.district}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{pharm.rating}</span>
                    </div>
                  </div>

                  {/* Pharmacy Name & Location */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {pharm.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{pharm.branchName} • {pharm.distanceKm} km away</span>
                    </p>
                  </div>

                  {/* Operating Hours & Next Open Time Display */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{pharm.openingHoursDisplay}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Status: <strong className="text-slate-800 dark:text-slate-200">{pharm.nextOpenTimeDisplay}</strong>
                    </div>
                    {pharm.temporaryClosureReason && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                        Reason: {pharm.temporaryClosureReason}
                      </div>
                    )}
                  </div>

                  {/* Fulfillment Options & Delivery / Pickup Badges */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      pharm.deliveryAvailable
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1 font-bold">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Delivery</span>
                      </div>
                      <span className="font-semibold mt-1">
                        {pharm.deliveryAvailable ? `${pharm.deliveryTimeMin}` : 'Unavailable'}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      pharm.pickupAvailable
                        ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1 font-bold">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Counter Pickup</span>
                      </div>
                      <span className="font-semibold mt-1">
                        {pharm.pickupAvailable ? `${pharm.pickupEstimatedTime}` : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Clinical & Retail Services Badges */}
                  {pharm.services && pharm.services.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400">
                        <span>Clinical &amp; Care Offerings</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pharm.services.length} Available</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {pharm.services.slice(0, 3).map((srv) => (
                          <span
                            key={srv.id}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[200px]"
                            title={srv.description}
                          >
                            {srv.serviceCategory === 'vaccination' && '💉 '}
                            {srv.serviceCategory === 'screening' && '🧪 '}
                            {srv.serviceCategory === 'consultation' && '🩺 '}
                            {srv.serviceCategory === 'delivery' && '🚚 '}
                            {srv.serviceCategory === 'refill' && '🔄 '}
                            {srv.serviceName}
                          </span>
                        ))}
                        {pharm.services.length > 3 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            +{pharm.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Supervising & Duty Pharmacist */}
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Pharmacist: <strong className="text-slate-700 dark:text-slate-300">{pharm.supervisingPharmacist}</strong></span>
                    <span className="font-mono text-[10px] text-emerald-600 font-bold">{pharm.licenseNo}</span>
                  </div>

                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPharmacyForModal(pharm);
                      setModalActiveTab('services');
                      setShelfSearchQuery('');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="View clinical services, opening hours & live stock"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                    <span>Services &amp; Hours</span>
                  </button>

                  <button
                    onClick={() => handleActionClick('prescriptions', `Sign in to place an order from ${pharm.name}`)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
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

      {/* ── Section 2: Medicine Price & Stock Search Engine ── */}
      <section id="medicines" className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="max-w-3xl">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              TRANSPARENT CROSS-PHARMACY PRICING
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              Uganda National Medicine Price &amp; Availability Index
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Search by brand name or generic INN compound to check availability across all participating pharmacies in Uganda before stepping out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {masterMedicines.slice(0, 6).map((med) => (
              <div
                key={med.id}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                        {med.category}
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1.5">{med.brandName}</h4>
                      <p className="text-xs text-slate-500 italic">{med.genericName}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{med.ndaRegistrationNumber}</span>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Adult Dosage:</span> {med.standardDoseAdult}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Form &amp; Strength:</span> {med.form} ({med.strength})</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Average Retail Price</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {formatUGX(med.suggestedRetailPriceUgx)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleActionClick('prescriptions', `Sign in to order ${med.brandName}`)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Order Medicine
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: How the System Works (4-Step Clinical Workflow) ── */}
      <section id="workflow" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            SAFETY-FIRST ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            How ZenithRx Protects Your Health &amp; Delivers Fast
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
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
              color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60',
            },
            {
              step: '02',
              title: 'Pharmacist Verification',
              desc: 'A certified Ugandan pharmacist checks interactions, confirms dosing against clinical references, and approves the order.',
              icon: ShieldCheck,
              color: 'text-sky-600 bg-sky-100 dark:bg-sky-950/60',
            },
            {
              step: '03',
              title: 'FEFO Dispensing & Pack',
              desc: 'Pharmacy staff dispense from audited First-Expiry-First-Out batches and generate classified dispensing register records.',
              icon: Pill,
              color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/60',
            },
            {
              step: '04',
              title: 'Secure OTP Handover',
              desc: 'Our express motorcycle courier brings your order directly to your door. Provide your 4-digit OTP to complete handover.',
              icon: Truck,
              color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black font-mono text-slate-200 dark:text-slate-800">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 4: Health Advice & Educational Library Preview ── */}
      <section id="health-library" className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                CLINICAL HEALTH ADVICE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                Articles Written by Registered Pharmacists
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {articles.map((art) => (
              <div
                key={art.id}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div>
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                    {art.category}
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-2">{art.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">{art.summary}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 flex justify-between">
                  <span>Author: {art.authorName}</span>
                  <span>{art.readTimeMinutes} min read</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Emergency Helpline & ADR Safety Banner ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              24/7 PHARMACY HELPLINE &amp; SAFETY DESK
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">Need Urgent Medication Advice?</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Speak directly with an accredited pharmacist via phone or WhatsApp. Report adverse side effects or seek dosage consultations anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href="https://wa.me/256755091826"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp Helpline</span>
            </a>

            <button
              onClick={() => handleActionClick('adr', 'Sign in to file an Adverse Drug Reaction report')}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Side Effect (ADR)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Modal: Inspect Full Pharmacy Shelf, Hours & Fulfillment ── */}
      {selectedPharmacyForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
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
                    {selectedPharmacyForModal.district} • {selectedPharmacyForModal.distanceKm} km
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {selectedPharmacyForModal.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPharmacyForModal.address} • Supervised by <strong>{selectedPharmacyForModal.supervisingPharmacist}</strong> ({selectedPharmacyForModal.licenseNo})
                </p>
              </div>

              <button
                onClick={() => setSelectedPharmacyForModal(null)}
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setModalActiveTab('services')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalActiveTab === 'services'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Clinical &amp; Care Services ({selectedPharmacyForModal.services?.length || 0})</span>
              </button>

              <button
                onClick={() => setModalActiveTab('hours')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalActiveTab === 'hours'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Opening Hours &amp; Holiday Schedule</span>
              </button>

              <button
                onClick={() => setModalActiveTab('shelf')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalActiveTab === 'shelf'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Live Medicine Shelf ({selectedPharmacyForModal.inventory.length})</span>
              </button>

              <button
                onClick={() => setModalActiveTab('fulfillment')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalActiveTab === 'fulfillment'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Delivery &amp; Pickup Options</span>
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

            {/* Modal Tab 0: Clinical & Retail Services */}
            {modalActiveTab === 'services' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Available Clinical &amp; Community Pharmacy Services
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
                    selectedPharmacyForModal.services.map((srv) => (
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

                          {srv.prerequisites && (
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                              <strong>Prerequisite: </strong>{srv.prerequisites}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setBookingToast(`Inquiry sent for "${srv.serviceName}" at ${selectedPharmacyForModal.name}. Our pharmacist will contact you via WhatsApp/Call.`);
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

            {/* Modal Tab 1: Opening Hours & Holiday Schedule */}
            {modalActiveTab === 'hours' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                
                {/* Emergency / Temporary Status Banner */}
                {selectedPharmacyForModal.isTemporarilyClosed ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-sm">Temporary Branch Closure in Progress</h4>
                      <p className="mt-1 leading-relaxed">{selectedPharmacyForModal.temporaryClosureReason}</p>
                      <span className="font-bold block mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                        Estimated Reopening: 2:00 PM today. Emergency on-call pharmacist is active.
                      </span>
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

                {/* 7-Day Weekly Hours Table */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Weekly Opening Schedule
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-700">
                    {selectedPharmacyForModal.weeklySchedule.map((s) => (
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

                {/* Public Holiday Exceptions Table */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Upcoming Uganda Public Holiday Hours
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedPharmacyForModal.holidaySchedule.map((h, i) => (
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

                {/* Duty Pharmacist On-Call Contact */}
                {selectedPharmacyForModal.dutyPharmacist && (
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        On-Duty Supervising Pharmacist
                      </span>
                      <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                        {selectedPharmacyForModal.dutyPharmacist.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        PSU License: {selectedPharmacyForModal.dutyPharmacist.psuNo} • Available for urgent dosage consultation
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${selectedPharmacyForModal.dutyPharmacist.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Pharmacist</span>
                    </a>
                  </div>
                )}

              </div>
            )}

            {/* Modal Tab 2: Live Medicine Shelf */}
            {modalActiveTab === 'shelf' && (
              <>
                {/* Search Inside Shelf */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter medicines in this pharmacy..."
                      value={shelfSearchQuery}
                      onChange={(e) => setShelfSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Inventory List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                  {selectedPharmacyForModal.inventory
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

            {/* Modal Tab 3: Fulfillment & Delivery Coverage */}
            {modalActiveTab === 'fulfillment' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Delivery Service Card */}
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
                      {selectedPharmacyForModal.deliveryCoverageAreas.map((area, idx) => (
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

                {/* Pickup Instructions Card */}
                <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-600" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                        Pharmacy Counter &amp; Drive-Thru Pickup
                      </h4>
                    </div>
                    <span className="font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/60 px-2.5 py-0.5 rounded-full text-[11px]">
                      {selectedPharmacyForModal.pickupEstimatedTime}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedPharmacyForModal.pickupInstructions}
                  </p>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Pickup Location:</span>
                    <p className="text-slate-500">{selectedPharmacyForModal.address}</p>
                  </div>
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

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white">ZENITHRX PATIENT HEALTH PLATFORM</h4>
            <p className="text-[11px] text-slate-400">
              Accredited by Uganda National Drug Authority (NDA) and the Pharmaceutical Society of Uganda (PSU).
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Emergency Dispatch Line: +256 755 091826 • 24/7 Clinical Desk
          </div>
        </div>
      </footer>

    </div>
  );
};
