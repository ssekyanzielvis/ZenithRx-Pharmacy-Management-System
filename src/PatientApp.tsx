import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Upload,
  Calendar,
  BookOpen,
  AlertTriangle,
  MessageSquare,
  Truck,
  User,
  Pill,
  HeartPulse,
  Clock,
  ShieldCheck,
  CheckCircle,
  FileText,
  Phone,
  Sparkles,
  Download,
  Share2,
  Lock,
  ArrowRight,
  LogOut,
  MapPin,
  ExternalLink,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Layers,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Smartphone,
  Plus,
  Minus,
  Headphones,
  Bell,
  Building2,
  BookmarkCheck,
  BellRing,
  Menu,
  X,
} from 'lucide-react';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { PatientLandingPage } from './components/patient/PatientLandingPage';
import { PatientAuthModal } from './components/patient/PatientAuthModal';
import { PatientAICopilot } from './components/patient/PatientAICopilot';
import { PatientSidebar } from './components/patient/PatientSidebar';
import { PatientBranchesPage } from './components/patient/PatientBranchesPage';
import { PatientSupportHub } from './components/patient/PatientSupportHub';
import { PatientNotificationCenter } from './components/patient/PatientNotificationCenter';
import { notificationCenterService } from './services/notificationCenterService';
import {
  advancedStockService,
  CrossPharmacyStockEntry,
  StockReservation,
  StockWaitlistEntry,
} from './services/advancedStockAndScanningService';
import { patientAuthService, PatientProfile } from './services/patientAuthService';
import { pharmacyDiscoveryService, PharmacyBranchDetails } from './services/pharmacyDiscoveryService';
import { getMasterMedicines, MasterMedicineItem } from './services/medicineSafetyService';
import { getHealthEducationArticles, HealthEducationArticle } from './services/healthEducationService';
import { getDeliveryOrders, DeliveryOrder } from './services/deliveryLogisticsService';
import { getAdherenceRecords, AdherenceRecord } from './services/adherenceRefillService';
import { getTeleconsultationSessions, bookTeleconsultation, TeleconsultationSession } from './services/teleconsultationService';
import { submitPrescriptionForOcrVerification } from './services/prescriptionOcrService';
import { submitAdrReport } from './services/adrReportingService';
import { formatUGX } from './services/formatters';

interface CartItem {
  id: string;
  drug: MasterMedicineItem;
  quantity: number;
  pharmacyName: string;
  unitPriceUgx: number;
}

export const PatientApp: React.FC = () => {
  // Authentication State
  const [patientUser, setPatientUser] = useState<PatientProfile | null>(() =>
    patientAuthService.getCurrentPatient()
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [authRedirectReason, setAuthRedirectReason] = useState<string | undefined>();
  const [forceExploreView, setForceExploreView] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'search' | 'branches' | 'prescriptions' | 'refills' | 'telehealth' | 'orders' | 'notifications' | 'healthLibrary' | 'adr' | 'support' | 'profile'
  >('search');

  // Listen to auth changes
  useEffect(() => {
    const unsub = patientAuthService.subscribe((user) => {
      setPatientUser(user);
    });
    return unsub;
  }, []);

  // Medicines & Search State
  const [medSearch, setMedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState<string>('all');
  const medicines = getMasterMedicines();
  const pharmacies = pharmacyDiscoveryService.getAllPharmacies();

  const filteredMeds = medicines.filter((m) => {
    const matchesSearch =
      m.brandName.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.genericName.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(medSearch.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // Cart & Checkout State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'Airtel'>('MTN');
  const [momoPhone, setMomoPhone] = useState(patientUser?.phone || '+256 774 607782');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Health Articles
  const articles = getHealthEducationArticles(true);

  // Deliveries / Orders
  const [orders, setOrders] = useState<DeliveryOrder[]>(() => getDeliveryOrders());

  // Refills & Adherence State
  const [refills, setRefills] = useState<AdherenceRecord[]>(() => getAdherenceRecords());
  const [doseLoggedSuccess, setDoseLoggedSuccess] = useState<string | null>(null);

  // Teleconsultations
  const [consultations, setConsultations] = useState<TeleconsultationSession[]>(() =>
    getTeleconsultationSessions()
  );
  const [consultComplaint, setConsultComplaint] = useState('');
  const [consultSuccess, setConsultSuccess] = useState(false);

  // Prescription Upload State
  const [rxPatientName, setRxPatientName] = useState(patientUser?.fullName || '');
  const [rxPhone, setRxPhone] = useState(patientUser?.phone || '');
  const [rxSelectedPharmacy, setRxSelectedPharmacy] = useState(pharmacies[0]?.name || 'Kampala City Pharmacy');
  const [rxUploadedSuccess, setRxUploadedSuccess] = useState(false);
  const [uploadedPrescriptionsList, setUploadedPrescriptionsList] = useState<
    {
      id: string;
      date: string;
      pharmacy: string;
      status: 'Awaiting Verification' | 'Verified by Pharmacist' | 'Ready for Dispatch';
      medicines: string[];
      pharmacistName: string;
    }[]
  >([
    {
      id: 'RX-PWA-2026-091',
      date: '2026-07-22',
      pharmacy: 'Kampala City Pharmacy',
      status: 'Verified by Pharmacist',
      medicines: ['Augmentin 625mg (14 tabs)', 'Panadol Extra (20 tabs)'],
      pharmacistName: 'Pharm. Moses Musoke (PSU/REG/2021/1042)',
    },
  ]);

  // ADR State
  const [adrDrug, setAdrDrug] = useState('');
  const [adrSymptoms, setAdrSymptoms] = useState('');
  const [adrBatch, setAdrBatch] = useState('');
  const [adrSeverity, setAdrSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [adrSuccess, setAdrSuccess] = useState(false);

  // Cross-Pharmacy Stock Discovery & Reservations State
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);
  const [selectedStockMedicine, setSelectedStockMedicine] = useState<MasterMedicineItem | null>(null);
  const [reservationTarget, setReservationTarget] = useState<{
    med: MasterMedicineItem;
    branch: CrossPharmacyStockEntry;
  } | null>(null);
  const [reserveQty, setReserveQty] = useState<number>(2);
  const [reserveHoldHours, setReserveHoldHours] = useState<number>(24);
  const [reservationSuccessPin, setReservationSuccessPin] = useState<string | null>(null);

  // Waitlist State
  const [waitlistTarget, setWaitlistTarget] = useState<{
    med: MasterMedicineItem;
    branch: CrossPharmacyStockEntry;
  } | null>(null);
  const [waitlistChannel, setWaitlistChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [waitlistSuccessMsg, setWaitlistSuccessMsg] = useState<string | null>(null);

  // Local active reservations & waitlists for patient
  const [patientReservations, setPatientReservations] = useState<StockReservation[]>(() =>
    advancedStockService.getReservations({ patientPhoneOrId: patientUser?.phone || 'pat-001' })
  );
  const [patientWaitlists, setPatientWaitlists] = useState<StockWaitlistEntry[]>(() =>
    advancedStockService.getWaitlists({ patientPhoneOrId: patientUser?.phone || 'pat-001' })
  );

  const refreshPatientHolds = () => {
    setPatientReservations(
      advancedStockService.getReservations({ patientPhoneOrId: patientUser?.phone || 'pat-001' })
    );
    setPatientWaitlists(
      advancedStockService.getWaitlists({ patientPhoneOrId: patientUser?.phone || 'pat-001' })
    );
  };

  // Consolidated User Profile Dropdown Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Consolidated Clinical Services Dropdown Menu State
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const servicesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target as Node)) {
        setIsServicesMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // PWA Install prompt banner state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      });
    }
  };

  const triggerAuth = (mode: 'signin' | 'register', reason?: string) => {
    setAuthModalMode(mode);
    setAuthRedirectReason(reason);
    setIsAuthModalOpen(true);
  };

  const handleAddToCart = (med: MasterMedicineItem, pharmacyName = 'Kampala City Pharmacy') => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.drug.id === med.id && i.pharmacyName === pharmacyName);
      if (existing) {
        return prev.map((i) =>
          i.drug.id === med.id && i.pharmacyName === pharmacyName
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `CART-${Date.now()}-${med.id}`,
          drug: med,
          quantity: 1,
          pharmacyName,
          unitPriceUgx: med.suggestedRetailPriceUgx,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const cartTotalUgx = cartItems.reduce((acc, item) => acc + item.unitPriceUgx * item.quantity, 0);
  const deliveryFeeUgx = cartItems.length > 0 ? 3500 : 0;
  const grandTotalUgx = cartTotalUgx + deliveryFeeUgx;

  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setCheckoutStep('success');

      // Create new live order
      const newOrder: DeliveryOrder = {
        id: `ORD-UG-${Date.now().toString().slice(-4)}`,
        orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        tenantId: 'client-001',
        pharmacyName: cartItems[0]?.pharmacyName || 'Kampala City Pharmacy',
        patientName: patientUser?.fullName || 'Patient',
        patientPhone: momoPhone,
        deliveryAddress: patientUser?.address || 'Kololo, Kampala',
        deliveryDistrict: patientUser?.district || 'Kampala',
        patientCoordinates: { lat: 0.3341, lng: 32.5892 },
        itemsSummary: cartItems.map((i) => `${i.quantity}x ${i.drug.brandName}`).join(', '),
        totalOrderAmountUgx: grandTotalUgx,
        deliveryFeeUgx: deliveryFeeUgx,
        paymentMethod: `${momoProvider} Mobile Money`,
        paymentStatus: 'Paid Online',
        status: 'Out for Delivery',
        isColdChainRequired: false,
        assignedCourierName: 'Juma Kigozi (Boda Express #41)',
        assignedCourierPhone: '+256 701 998877',
        estimatedDeliveryTime: '25 mins',
        deliveryOtpCode: Math.floor(1000 + Math.random() * 9000).toString(),
        deliveryOtpConfirmed: false,
        createdAt: new Date().toISOString(),
      };

      setOrders((prev) => [newOrder, ...prev]);
      setCartItems([]);
    }, 2500);
  };

  const handleUploadRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxPatientName || !rxPhone) return;

    submitPrescriptionForOcrVerification({
      tenantId: 'client-001',
      pharmacyName: rxSelectedPharmacy,
      patientName: rxPatientName,
      patientPhone: rxPhone,
      uploadedVia: 'Patient Portal PWA',
      prescriptionImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60',
      ocrExtractedMedications: [
        {
          drugName: 'Prescription Parsing in Progress...',
          dosage: '1 tab',
          frequency: 'Daily',
          duration: '30 days',
          quantity: 30,
          confidenceScore: 95,
        },
      ],
      doctorVerificationStatus: 'Verified Licensed MD',
      clinicalSafetyFlags: [],
    });

    setUploadedPrescriptionsList((prev) => [
      {
        id: `RX-PWA-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        pharmacy: rxSelectedPharmacy,
        status: 'Awaiting Verification',
        medicines: ['OCR Digitization in Progress...'],
        pharmacistName: 'Assigned to On-Duty Pharmacist',
      },
      ...prev,
    ]);

    setRxUploadedSuccess(true);
    setTimeout(() => {
      setRxUploadedSuccess(false);
    }, 4000);
  };

  const handleReportAdr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adrDrug || !adrSymptoms) return;

    submitAdrReport({
      tenantId: 'client-001',
      pharmacyName: 'Kampala City Pharmacy',
      reporterName: patientUser?.fullName || 'Patient Direct Self-Report',
      reporterRole: 'Patient / Consumer',
      reporterContact: patientUser?.phone || '+256 701 234567',
      patientInitials: patientUser ? patientUser.fullName.slice(0, 2).toUpperCase() : 'P.U.',
      patientAge: 34,
      patientGender: patientUser?.gender || 'Female',
      suspectedDrugName: adrDrug,
      suspectedDrugDose: 'Standard prescribed dose',
      suspectedDrugRoute: 'Oral',
      dateStarted: new Date().toISOString().split('T')[0],
      dateReactionStarted: new Date().toISOString().split('T')[0],
      reactionDescription: `${adrSymptoms}${adrBatch ? ` (Batch: ${adrBatch})` : ''}`,
      severity: adrSeverity,
      causality: 'Possible',
      outcome: 'Recovering / Resolving',
    });

    setAdrSuccess(true);
    setTimeout(() => {
      setAdrSuccess(false);
      setAdrDrug('');
      setAdrSymptoms('');
      setAdrBatch('');
    }, 4000);
  };

  const handleBookConsult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultComplaint) return;

    const newSession = bookTeleconsultation({
      tenantId: 'client-001',
      patientName: patientUser?.fullName || 'Patient User',
      patientPhone: patientUser?.phone || '+256 701 234567',
      patientAge: 34,
      patientGender: 'Female',
      chiefComplaint: consultComplaint,
      scheduledTime: new Date().toISOString(),
    });

    setConsultations((prev) => [newSession, ...prev]);
    setConsultSuccess(true);
    setTimeout(() => {
      setConsultSuccess(false);
      setConsultComplaint('');
    }, 4000);
  };

  const handleLogDose = (refillId: string) => {
    setRefills((prev) =>
      prev.map((r) =>
        r.id === refillId
          ? {
              ...r,
              adherenceRatePercent: Math.min(100, r.adherenceRatePercent + 2),
            }
          : r
      )
    );
    setDoseLoggedSuccess(refillId);
    setTimeout(() => setDoseLoggedSuccess(null), 3000);
  };

  // If user is NOT logged in or explicitly clicked "Explore System", render the full Public Landing Page
  if (!patientUser || forceExploreView) {
    return (
      <>
        {/* PWA Install Banner — shown on landing before login too */}
        {showInstallBanner && (
          <div
            className="fixed bottom-0 left-0 right-0 z-50 m-3 rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">Install ZenithRx Patient App</p>
                  <p className="text-white/80 text-xs truncate">Works offline • Dose reminders • Instant access</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-white text-emerald-800 rounded-lg text-xs font-extrabold hover:bg-emerald-50 transition-all shadow cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Add to Home
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="text-white/70 hover:text-white text-lg leading-none"
                >✕</button>
              </div>
            </div>
          </div>
        )}

        <PatientLandingPage
          currentUser={patientUser}
          onReturnToPortal={() => setForceExploreView(false)}
          onOpenAuth={(mode, reason) => {
            setForceExploreView(false);
            triggerAuth(mode, reason);
          }}
          onSelectAction={(action) => {
            setForceExploreView(false);
            if (patientUser) {
              setActiveTab(action as any);
            } else {
              triggerAuth('signin', `Sign in to access ${action}`);
            }
          }}
        />

        <PatientAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          redirectReason={authRedirectReason}
          onSuccess={(patient) => {
            setPatientUser(patient);
            setForceExploreView(false);
          }}
        />
      </>
    );
  }

  // ─── AUTHENTICATED PATIENT APP VIEW ──────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden bg-[#F4F7FB] dark:bg-[#0B131F] text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-200">

      {/* ─── Creative Sidebar Navigation (Desktop + Mobile Drawer + Bottom Bar) ─── */}
      <PatientSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as any);
          setIsMobileNavOpen(false);
        }}
        patientName={patientUser.fullName}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => { setCheckoutStep('cart'); setIsCartOpen(true); }}
        onOpenAI={() => setIsAICopilotOpen(true)}
        onLogout={() => patientAuthService.logout()}
        onInstallPWA={deferredPrompt ? handleInstallClick : undefined}
        showInstallHint={showInstallBanner}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* ─── Main content area (Pinned Header & Body-Only Scrolling) ─────── */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">

        {/* PWA Install Banner — Generously spaced with rounded floating card */}
        {showInstallBanner && (
          <div className="mx-4 mt-3 mb-0 sm:mx-6 lg:mx-8 rounded-2xl shadow-md overflow-hidden shrink-0 border border-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 60%, #0891b2 100%)' }}
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm tracking-tight truncate">Install as mobile app</p>
                  <p className="text-white/80 text-xs truncate mt-0.5">Works offline • Automatic dose reminders • Faster checkout</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-3.5 sm:px-4 py-1.5 bg-white text-emerald-800 rounded-xl text-xs font-black hover:bg-emerald-50 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Install</span>
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                  title="Dismiss banner"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Header — Fixed Clinical Command Bar (Compact on mobile, Spacious on Desktop) */}
        <header
          className="shrink-0 z-30 flex items-center justify-between px-3.5 sm:px-8 py-2.5 sm:py-4 border-b gap-3 sm:gap-6 min-h-[64px] sm:min-h-[76px] bg-[#07111e] border-slate-800 text-slate-100 shadow-md transition-all"
        >
          {/* 1. Left Section: Hamburger + Brand Title + System Online */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              aria-label="Open Navigation Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
              onClick={() => {
                setActiveTab('search');
                setForceExploreView(false);
              }}
              title="ZenithRx Patient Care Network"
            >
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs overflow-hidden group-hover:scale-105 transition-transform bg-slate-800 border border-slate-700 p-1 sm:p-1.5 shrink-0">
                <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
              </div>

              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-widest text-slate-400 font-extrabold uppercase">
                    QUANTUM NETWORKS LTD
                  </span>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    SYSTEM ONLINE
                  </span>
                </div>
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                  ZenithRx
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-lg">
                    Patient v3.2
                  </span>
                </h1>
              </div>

              {/* Mobile compact title */}
              <div className="block sm:hidden">
                <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                  ZenithRx
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded-md">
                    Live
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* 2. Center Section: Consolidated Clinical Services Dropdown Menu */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-xl px-2">
            <div className="relative inline-block text-left" ref={servicesMenuRef}>
              <button
                type="button"
                onClick={() => setIsServicesMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-white font-bold text-xs shadow-xs transition cursor-pointer group"
                title="Clinical Services & Network Hub"
              >
                <div className="w-6 h-6 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
                </div>
                <span>Clinical Services</span>
                <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-800/80">
                  Kampala Hub
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform group-hover:text-emerald-400 ${isServicesMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Clinical Services Dropdown Panel */}
              {isServicesMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 rounded-2xl bg-[#0B131F] border border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  {/* Network Context Header */}
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-white">Kampala Care Hub</span>
                    </div>
                    <span className="bg-cyan-950 text-cyan-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-cyan-800">
                      Enterprise Network
                    </span>
                  </div>

                  {/* Menu Options */}
                  <div className="py-1 space-y-0.5 text-xs">
                    {/* 1. AI Clinical Assistant */}
                    <button
                      onClick={() => {
                        setIsAICopilotOpen(true);
                        setIsServicesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-950/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">AI Clinical Assistant</p>
                        <p className="text-[10px] text-slate-400 truncate">24/7 Dosage triage &amp; drug guidance</p>
                      </div>
                    </button>

                    {/* 2. Upload Doctor Prescription */}
                    <button
                      onClick={() => {
                        setActiveTab('prescriptions');
                        setIsServicesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-violet-950/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors">Doctor Prescriptions &amp; AI OCR</p>
                        <p className="text-[10px] text-slate-400 truncate">Upload doctor slips for verification</p>
                      </div>
                    </button>

                    {/* 3. Explore Partner Pharmacies */}
                    <button
                      onClick={() => {
                        setForceExploreView(true);
                        setIsServicesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-cyan-950/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">Explore Partner Pharmacies</p>
                        <p className="text-[10px] text-slate-400 truncate">Live cross-pharmacy stock network</p>
                      </div>
                    </button>

                    {/* 4. Branch Stock Checker */}
                    <button
                      onClick={() => {
                        setActiveTab('branches');
                        setIsServicesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Branch Stock &amp; Hold</p>
                        <p className="text-[10px] text-slate-400 truncate">Hold items for counter pickup</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Right Header Section: Profile & Theme (Zero Header Congestion) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Dropdown Menu */}
            <ThemeToggle variant="menu" />

            {/* Consolidated Patient Account Dropdown Menu (Includes Notifications, Cart, Profile, Prescriptions, Orders, Sign Out) */}
            {patientUser && (
              <div className="relative inline-block text-left" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs group"
                  title="Patient Profile & Account Menu"
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {patientUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    {(notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id) > 0 || cartItems.length > 0) && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow ring-2 ring-[#07111e] animate-pulse">
                        {notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id) > 0
                          ? notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id)
                          : cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                      </span>
                    )}
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[100px] block group-hover:text-emerald-400 transition-colors">
                      {patientUser.fullName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                      <span>Patient</span>
                      <ChevronDown className={`w-2.5 h-2.5 text-amber-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </button>

                {/* Patient Account Dropdown Panel */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0B131F] border border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    {/* User Header */}
                    <div className="px-3 py-2.5 border-b border-slate-800 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                        {patientUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{patientUser.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{patientUser.phone}</p>
                        <span className="inline-block text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded mt-0.5 border border-emerald-800/60">
                          NDA Verified Patient
                        </span>
                      </div>
                    </div>

                    {/* Quick Menu Options */}
                    <div className="py-1 space-y-0.5 text-xs">
                      {/* Notifications & Alerts */}
                      <button
                        onClick={() => {
                          setActiveTab('notifications');
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                          activeTab === 'notifications'
                            ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-800/60'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold">Notifications &amp; Alerts</span>
                        </div>
                        {notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id) > 0 ? (
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow ring-1 ring-emerald-400/50 animate-pulse">
                            {notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id)} new
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">0 unread</span>
                        )}
                      </button>

                      {/* Medicine Cart & Checkout */}
                      <button
                        onClick={() => {
                          setCheckoutStep('cart');
                          setIsCartOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShoppingCart className="w-4 h-4 text-amber-400" />
                          <span className="font-semibold">Medicine Cart</span>
                        </div>
                        {cartItems.length > 0 ? (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Empty</span>
                        )}
                      </button>

                      {/* Digital Health Passport */}
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer text-left"
                      >
                        <User className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">Digital Health Passport</span>
                      </button>

                      {/* My Prescriptions */}
                      <button
                        onClick={() => {
                          setActiveTab('prescriptions');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer text-left"
                      >
                        <Upload className="w-4 h-4 text-violet-400" />
                        <span className="font-semibold">My Prescriptions</span>
                      </button>

                      {/* Live Orders */}
                      <button
                        onClick={() => {
                          setActiveTab('orders');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer text-left"
                      >
                        <Truck className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold">Live Orders &amp; Deliveries</span>
                      </button>
                    </div>

                    {/* Log Out Option in Dropdown */}
                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          patientAuthService.logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition cursor-pointer text-xs font-bold text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out of Patient Portal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area — Single-Child Body Scroll View (Header Stays Pinned at Top) */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col focus:outline-none">
          {/* Default Clean Responsive Viewport for all screen sizes with expanded canvas for branches */}
          <div className={`flex-1 w-full ${activeTab === 'branches' ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8`}>

          {/* ── 1. Medicine Search & Multi-Pharmacy Formulary ── */}
          {activeTab === 'search' && (
            <div className="space-y-4 sm:space-y-6">

              {/* ── Search & Filter Bar (Clean, Unified & Breathable) ── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                  <div className="relative flex-1 flex items-center">
                    <span className="absolute left-3.5 sm:left-4 z-10 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search medicines (e.g. Augmentin, Metformin, Ventolin)..."
                      value={medSearch}
                      onChange={(e) => setMedSearch(e.target.value)}
                      style={{ paddingLeft: '2.75rem', paddingRight: '1rem' }}
                      className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
                    />
                  </div>
                  <select
                    value={selectedPharmacyFilter}
                    onChange={(e) => setSelectedPharmacyFilter(e.target.value)}
                    className="px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 sm:w-64 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="all">🏥 All Partner Pharmacies</option>
                    {pharmacies.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Therapeutic Category Filter Pills */}
                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 overflow-x-auto flex-1 py-0.5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                    {['all', 'Antibiotics', 'Diabetes', 'Cardiovascular', 'Respiratory', 'Analgesics'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          selectedCategory === cat
                            ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {cat === 'all' ? 'All Medicines' : cat}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{filteredMeds.length}</span> results
                  </div>
                </div>
              </div>

              {/* ── Medicine Formulary Clean Grid ── */}
              {filteredMeds.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-3">
                  <Search className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">No medicines match your search</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Try searching generic compounds like Amoxicillin, Paracetamol, or reset the therapeutic category filters.</p>
                  <button
                    onClick={() => { setMedSearch(''); setSelectedCategory('all'); }}
                    className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {filteredMeds.map((med) => {
                    const isExpanded = expandedMedId === med.id;
                    return (
                      <div
                        key={med.id}
                        className={`bg-white dark:bg-slate-900 border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs transition-all flex flex-col justify-between space-y-3 sm:space-y-4 hover:shadow-md ${
                          isExpanded
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Header & Identification */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                              {med.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-medium">
                              NDA: {med.ndaRegistrationNumber}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                              {med.brandName}
                            </h4>
                            <p className="text-xs text-slate-500 italic mt-0.5">{med.genericName}</p>
                          </div>

                          {/* Formulation Details Inline */}
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap font-medium">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{med.strength}</span>
                            <span>•</span>
                            <span>{med.form}</span>
                            {med.route && (
                              <>
                                <span>•</span>
                                <span>{med.route}</span>
                              </>
                            )}
                          </div>

                          {/* Adult Dose & Usage Guidance */}
                          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                            <p className="leading-relaxed">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Adult Dosage:</span> {med.standardDoseAdult}
                            </p>
                            {isExpanded && (
                              <div className="pt-2 text-xs space-y-1 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Manufacturer:</span> {med.manufacturer} ({med.countryOfManufacture || 'Uganda'})</p>
                                {med.blackboxWarning && (
                                  <p className="text-rose-600 dark:text-rose-400 font-semibold pt-1">
                                    ⚠️ Caution: {med.blackboxWarning}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Action Row (Clean, uncrowded 2-column layout) */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                          <div className="shrink-0">
                            <span className="text-[10px] text-slate-400 font-semibold block leading-none">Price per pack</span>
                            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                              {formatUGX(med.suggestedRetailPriceUgx)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-2.5 justify-end">
                            <button
                              onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              {isExpanded ? 'Less' : 'Details'}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedStockMedicine(med);
                                setActiveTab('branches');
                              }}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            >
                              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Branches</span>
                            </button>

                            <button
                              onClick={() => handleAddToCart(med, selectedPharmacyFilter === 'all' ? 'Kampala City Pharmacy' : selectedPharmacyFilter)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                              <span>Order</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 2. Dedicated Pharmacy Branches & Live Stock Network Page ── */}
          {activeTab === 'branches' && (
            <PatientBranchesPage
              selectedStockMedicine={selectedStockMedicine}
              onSelectMedicine={(med) => setSelectedStockMedicine(med)}
              onBackToSearch={() => setActiveTab('search')}
              onAddToCart={(med, pharmacyName) => {
                handleAddToCart(med, pharmacyName);
                setIsCartOpen(true);
              }}
              onReserve={(med, branch) => {
                setReservationTarget({ med, branch });
                setReservationSuccessPin(null);
              }}
              onWaitlist={(med, branch) => {
                setWaitlistTarget({ med, branch });
                setWaitlistSuccessMsg(null);
              }}
              patientUser={patientUser}
              patientReservations={patientReservations}
              patientWaitlists={patientWaitlists}
              onRefreshHolds={refreshPatientHolds}
            />
          )}

          {/* ── 3. Prescription Upload & Verification History ── */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-8">
              {/* Header Title & Registered Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                    Doctor Prescription Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Upload handwritten or printed doctor slips for pharmacist clinical validation, drug interaction checks, and automated digitization into your records.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl sm:rounded-2xl bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 text-xs font-extrabold border border-violet-200 dark:border-violet-800/80 shadow-xs shrink-0 self-start sm:self-auto">
                  <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>PSU Registered Pharmacist Review</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
                {/* Prescription Upload Form (Left Column - 6 Cols) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100">
                      Upload New Prescription
                    </h3>
                    <p className="text-xs text-slate-400">
                      Fill out patient details and attach a clear image or document.
                    </p>
                  </div>

                  {rxUploadedSuccess && (
                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-3 shadow-xs">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-black">Prescription Uploaded Successfully!</p>
                        <p className="text-[11px] sm:text-xs font-normal text-emerald-700 dark:text-emerald-300 mt-0.5">
                          Our clinical pharmacy team has queued this slip for review and dosage safety verification.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleUploadRx} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Patient Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={rxPatientName}
                          onChange={(e) => setRxPatientName(e.target.value)}
                          placeholder="Full Legal Name"
                          className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Phone / WhatsApp <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={rxPhone}
                          onChange={(e) => setRxPhone(e.target.value)}
                          placeholder="+256 700 000000"
                          className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Preferred Dispensing Pharmacy <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={rxSelectedPharmacy}
                        onChange={(e) => setRxSelectedPharmacy(e.target.value)}
                        className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        {pharmacies.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} — {p.district}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Elevated Dropzone */}
                    <div className="border-2 border-dashed border-violet-200 dark:border-violet-900/60 hover:border-violet-500 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center space-y-2 sm:space-y-3 cursor-pointer transition-all bg-violet-50/30 dark:bg-violet-950/20 hover:bg-violet-50/60 group">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          Snap photo or upload prescription file
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400">
                          Supports high-res JPG, PNG, PDF formats up to 10MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl sm:rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs sm:text-sm shadow-md shadow-violet-600/25 hover:shadow-lg hover:shadow-violet-600/35 active:scale-[0.98] cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Submit for Pharmacist Review</span>
                    </button>
                  </form>
                </div>

                {/* Prescription Status & History List (Right Column - 6 Cols) */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100">
                      Verification History ({uploadedPrescriptionsList.length})
                    </h3>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-400">
                      Live status tracker
                    </span>
                  </div>

                  <div className="space-y-4">
                    {uploadedPrescriptionsList.map((rx) => (
                      <div
                        key={rx.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-violet-400/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 transition-all"
                      >
                        {/* Header with Rx ID and Status Badge */}
                        <div className="flex justify-between items-start gap-2.5">
                          <div className="space-y-0.5 min-w-0">
                            <span className="inline-block font-mono text-[10px] sm:text-[11px] font-extrabold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-md border border-violet-200/60 dark:border-violet-800/60">
                              {rx.id}
                            </span>
                            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
                              {rx.pharmacy}
                            </h4>
                            <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Uploaded on {rx.date}
                            </span>
                          </div>

                          <span
                            className={`text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full shrink-0 shadow-2xs ${
                              rx.status === 'Verified by Pharmacist'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                            }`}
                          >
                            {rx.status}
                          </span>
                        </div>

                        {/* Digitized Medicines Breakdown */}
                        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                            Digitized Medications:
                          </span>
                          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                            {rx.medicines.map((m, idx) => (
                              <li key={idx} className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                                <span className="font-semibold text-xs">{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Reviewer and Track Order Action */}
                        <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            Reviewer: <strong className="text-slate-700 dark:text-slate-300">{rx.pharmacistName}</strong>
                          </span>
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="inline-flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:underline cursor-pointer"
                          >
                            <span>Track Order</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Chronic Refills & Interactive Adherence Tracker ── */}
          {activeTab === 'refills' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    Chronic Medication &amp; Refills
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Track daily intake schedules, maintain your streak, and order 30-day refills before your supply ends.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  <span>94% Adherence · 18-Day Streak 🔥</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {refills.map((refill) => (
                  <div
                    key={refill.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3.5 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header with Condition and Adherence Gauge */}
                      <div className="flex justify-between items-start gap-2.5">
                        <div className="space-y-0.5 min-w-0">
                          <span className="inline-block text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                            {refill.chronicCondition}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                            {refill.medicationName}
                          </h3>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                            {refill.adherenceRatePercent}% Adherence
                          </span>
                          <div className="w-20 sm:w-28 bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-1 overflow-hidden border border-slate-200/60 dark:border-slate-700">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${refill.adherenceRatePercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dosage Schedule & Due Date */}
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                        <p>
                          <strong className="text-slate-800 dark:text-slate-200 font-bold">Dosage Schedule:</strong>{' '}
                          {refill.dosageSchedule}
                        </p>
                        <p>
                          <strong className="text-slate-800 dark:text-slate-200 font-bold">Next Refill Due:</strong>{' '}
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{refill.nextRefillDueDate}</span>
                        </p>
                      </div>

                      {doseLoggedSuccess === refill.id && (
                        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Today's dose logged! Streak updated.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Command Row */}
                    <div className="pt-3.5 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleLogDose(refill.id)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Log Dose</span>
                      </button>

                      <button
                        onClick={() => {
                          const matchedDrug = medicines.find((m) => m.brandName.toLowerCase().includes(refill.medicationName.toLowerCase())) || medicines[0];
                          handleAddToCart(matchedDrug);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Order Refill</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. Live Pharmacist Teleconsultation ── */}
          {activeTab === 'telehealth' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* 1. Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                    Ask a Licensed Pharmacist
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Virtual clinical triage for dosage questions, drug interactions, and medical guidance.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/80 shadow-xs shrink-0 self-start sm:self-auto">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>3 Pharmacists Online Now</span>
                </div>
              </div>

              {/* 2. Main Content Grid (Two Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Submit Clinical Inquiry (lg:col-span-5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      Submit Clinical Inquiry
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Ask our clinical pharmacy team about dosage instructions, drug interactions, side effects, or general health concerns.
                    </p>
                  </div>

                  {consultSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-start gap-3 shadow-xs animate-in fade-in">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold">Inquiry submitted successfully!</p>
                        <p className="text-emerald-700 dark:text-emerald-300">
                          A licensed pharmacist has received your request and will review it in our clinical queue.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleBookConsult} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Your Medication or Health Query <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Describe your symptoms or medicine dosage question..."
                        value={consultComplaint}
                        onChange={(e) => setConsultComplaint(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y min-h-[120px] max-h-[260px] leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.99] cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Submit Pharmacist Inquiry</span>
                    </button>
                  </form>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="leading-snug">Encrypted &amp; reviewed by PSU registered pharmacists</span>
                  </div>
                </div>

                {/* Right Column: Your Pharmacist Consultations (lg:col-span-7) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      Your Pharmacist Consultations
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {consultations.length} {consultations.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>

                  {consultations.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No consultations yet</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Have a question about your medicines or dosage? Use the form on the left to submit a clinical inquiry.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {consultations.map((c) => {
                        const isCompleted = c.status === 'Completed';
                        const isInConsult = c.status === 'In Consultation';
                        const isWaiting = c.status === 'Waiting in Queue';

                        const pharmacistDisplayName =
                          c.pharmacistName || (c as any).assignedPharmacistName || 'Pharm. Moses Musoke';

                        const adviceText =
                          c.recommendedAdvice || c.pharmacistNotes || (c as any).consultationNotes;

                        const sessionCode =
                          c.sessionNumber || (c as any).sessionCode || (c.id ? `TC-${c.id.slice(-5)}` : 'TC-2026');

                        return (
                          <div
                            key={c.id}
                            className={`bg-white dark:bg-slate-900 border rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
                              isCompleted
                                ? 'border-slate-200/70 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/60'
                                : 'border-slate-200/90 dark:border-slate-800'
                            }`}
                          >
                            {/* Top Meta & Status Row */}
                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                  {sessionCode}
                                </span>
                              </div>

                              {/* Status Pill Aligned Right with Fixed Space */}
                              <div className="shrink-0">
                                {isWaiting && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Waiting in Queue</span>
                                  </span>
                                )}
                                {isInConsult && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 shadow-2xs">
                                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                                    <span>In Consultation</span>
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Completed</span>
                                  </span>
                                )}
                                {!isWaiting && !isInConsult && !isCompleted && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                    <span>{c.status}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Consultation / Question Subject */}
                            <div className="space-y-1">
                              <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed break-words">
                                {c.chiefComplaint}
                              </p>
                            </div>

                            {/* Pharmacist Guidance / Advice Callout if Available */}
                            {adviceText && (
                              <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 space-y-1">
                                <p className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>Pharmacist Clinical Guidance:</span>
                                </p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                                  {adviceText}
                                </p>
                              </div>
                            )}

                            {/* Pharmacist Secondary Info Footer */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <span className="font-normal text-slate-400">Pharmacist:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {pharmacistDisplayName}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 5. Orders & Live Delivery Tracking ── */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">Live Deliveries &amp; Orders</h2>
                <p className="text-xs text-slate-500 mt-1">Track express motorcycle delivery orders and view your 4-digit handover OTP code.</p>
              </div>

              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{order.orderNumber}</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">{order.itemsSummary}</h3>
                        <p className="text-xs text-slate-500">From {order.pharmacyName}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Deliver To:</span> {order.deliveryAddress}
                        <span className="text-slate-400 ml-2">({order.deliveryDistrict})</span>
                      </div>

                      {order.deliveryOtpCode && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">Handover OTP:</span>
                          <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {order.deliveryOtpCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 6. Health Education Library ── */}
          {activeTab === 'healthLibrary' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">Health Education &amp; Advice</h2>
                <p className="text-xs text-slate-500 mt-1">Clinically verified health advice written by registered Ugandan pharmacists.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-md">
                        {art.category}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-2">{art.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{art.summary}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
                      <span>By {art.authorName}</span>
                      <span>{art.readTimeMinutes} min read</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 7. Report Drug Side Effect (ADR) ── */}
          {activeTab === 'adr' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-xs space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 pt-2">Report an Adverse Drug Side Effect</h3>
                <p className="text-xs text-slate-500">
                  Directly report unexpected symptoms or reactions to the National Drug Authority Pharmacovigilance Centre.
                </p>
              </div>

              {adrSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Safety report received! A supervising pharmacist will evaluate your case immediately.</span>
                </div>
              )}

              <form onSubmit={handleReportAdr} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Medication Brand / Generic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625mg or Metformin"
                    value={adrDrug}
                    onChange={(e) => setAdrDrug(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Batch Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. AUG-2025-08"
                      value={adrBatch}
                      onChange={(e) => setAdrBatch(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Severity *</label>
                    <select
                      value={adrSeverity}
                      onChange={(e) => setAdrSeverity(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    >
                      <option value="Mild">Mild Discomfort</option>
                      <option value="Moderate">Moderate Reaction</option>
                      <option value="Severe">Severe Reaction</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Symptoms Experienced *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe rashes, swelling, breathing difficulty, dizziness, or gastrointestinal pain..."
                    value={adrSymptoms}
                    onChange={(e) => setAdrSymptoms(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  Submit Patient Safety Report
                </button>
              </form>
            </div>
          )}

          {/* ── 8. Customer Support & Complaints Desk ── */}
          {activeTab === 'support' && (
            <PatientSupportHub
              patient={patientUser}
              onOpenAuth={triggerAuth}
            />
          )}

          {/* ── 9. Notification Center & Clinical Inbox ── */}
          {activeTab === 'notifications' && (
            <PatientNotificationCenter
              patientPhoneOrId={patientUser?.phone || patientUser?.id}
              patientName={patientUser?.fullName}
              onNavigateTab={(tab, payload) => setActiveTab(tab as any)}
            />
          )}

          {/* ── 10. My Health Profile (Streamlined & Clean) ── */}
          {activeTab === 'profile' && patientUser && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xs space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  {patientUser.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{patientUser.fullName}</h3>
                  <p className="text-xs text-slate-500">{patientUser.phone} • {patientUser.district}</p>
                  {patientUser.nin && <p className="text-[11px] font-mono text-slate-400 mt-0.5">National ID (NIN): {patientUser.nin}</p>}
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Known Allergies:</span>
                  <p className="text-rose-600 dark:text-rose-400 font-semibold">{patientUser.allergies.join(', ') || 'None documented'}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Chronic Conditions:</span>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold">{patientUser.chronicConditions.join(', ') || 'None documented'}</p>
                </div>

                {/* Active Reservations */}
                {patientReservations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Active 24h Counter Reservations ({patientReservations.filter((r) => r.status === 'active').length})
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {patientReservations.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-xs py-1">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{r.quantityReserved}x {r.brandName}</span>
                            <span className="text-[11px] text-slate-400 ml-2">({r.pharmacyName})</span>
                          </div>
                          <span className="font-mono font-bold text-xs text-emerald-600">
                            PIN: {r.reservationPin}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  Data securely cached offline for seamless emergency access.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => patientAuthService.logout()}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  Sign Out of Patient Portal
                </button>
              </div>
            </div>
          )}

          </div>

          {/* ── Executive Clinical Footer (Expanded Length & Height with Generous Spacing) ── */}
          <footer className="w-full bg-[#07111e] border-t border-slate-800 mt-20 sm:mt-28 py-12 sm:py-16 px-6 sm:px-12 text-center text-xs space-y-4 shadow-md shrink-0 text-slate-400 pb-36 sm:pb-44">
            <div className="max-w-7xl mx-auto space-y-3.5 sm:space-y-4">
              <p className="text-white font-black tracking-wider text-sm sm:text-base uppercase">
                ZENITHRX – CLINICAL PHARMACY MANAGEMENT SYSTEM
              </p>
              <p className="text-slate-300 text-xs sm:text-sm font-medium">
                WhatsApp: <span className="text-emerald-400 font-bold">+256-755091826</span> | Call:{' '}
                <span className="text-blue-400 font-bold">0200 913 555</span> | Email:{' '}
                <span className="text-slate-200 font-semibold">quantumnetworks@gmail.com</span>
              </p>
              <p className="text-slate-400 text-xs pt-1">
                Official Web: <span className="text-slate-300 underline font-medium">www.quantumnetworks.com</span> • Powered by Gemini AI Clinical Engine
                {patientUser && (
                  <span className="ml-2 text-slate-300 font-medium">
                    | {patientUser.fullName} (Patient Portal) • NDA Verified Network
                  </span>
                )}
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Slide-Over Cart & Mobile Money Checkout Drawer ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {checkoutStep === 'cart' ? 'Medicine Cart' : checkoutStep === 'payment' ? 'Mobile Money Checkout' : 'Order Confirmed'}
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {checkoutStep === 'cart' ? (
                cartItems.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-bold text-slate-500">Your cart is empty</p>
                    <p className="text-xs text-slate-400">Search medicines to add to your order.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="truncate">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{item.drug.brandName}</h4>
                          <span className="text-[10px] text-slate-400 block">{item.pharmacyName}</span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{formatUGX(item.unitPriceUgx)}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleUpdateCartQty(item.id, -1)}
                            className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQty(item.id, 1)}
                            className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveCartItem(item.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : checkoutStep === 'payment' ? (
                <form onSubmit={handleProcessCheckout} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Items Total:</span>
                      <span>{formatUGX(cartTotalUgx)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Express Rider Delivery:</span>
                      <span>{formatUGX(deliveryFeeUgx)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-emerald-700 dark:text-emerald-300 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <span>Total Amount:</span>
                      <span>{formatUGX(grandTotalUgx)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Select Mobile Money Provider *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMomoProvider('MTN')}
                        className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          momoProvider === 'MTN'
                            ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        MTN MoMo (Uganda)
                      </button>

                      <button
                        type="button"
                        onClick={() => setMomoProvider('Airtel')}
                        className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          momoProvider === 'Airtel'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        Airtel Money (Uganda)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number for USSD Prompt *
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="+256 774 607782"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <span>Sending MoMo PIN Prompt to Phone...</span>
                    ) : (
                      <>
                        <span>Pay {formatUGX(grandTotalUgx)} via {momoProvider}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Order Confirmed!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Your payment has been received. The pharmacy has been notified and is preparing your express dispatch.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveTab('orders');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer"
                  >
                    Track Live Delivery
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {checkoutStep === 'cart' && cartItems.length > 0 && (
              <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold">{formatUGX(cartTotalUgx)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Express Delivery:</span>
                  <span className="font-bold">{formatUGX(deliveryFeeUgx)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatUGX(grandTotalUgx)}</span>
                </div>
                <button
                  onClick={() => setCheckoutStep('payment')}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Proceed to Mobile Money Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Medication Reservation Sheet ── */}
      {reservationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Reserve Medication
                  </h3>
                  <p className="text-xs text-slate-500">Hold at Counter for Pickup</p>
                </div>
              </div>
              <button
                onClick={() => setReservationTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reservationSuccessPin ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Reservation Confirmed!
                </h4>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 space-y-1">
                  <p className="text-xs text-slate-500">Your Pickup Verification PIN:</p>
                  <p className="text-2xl font-black font-mono text-blue-700 dark:text-blue-300">
                    {reservationSuccessPin}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Held for {reserveHoldHours} hours at {reservationTarget.branch?.pharmacyName || 'Partner Pharmacy'}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReservationTarget(null);
                    setSelectedStockMedicine(null);
                    refreshPatientHolds();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {reservationTarget.med?.brandName || reservationTarget.med?.genericName || 'Medication'}
                  </p>
                  <p className="text-slate-500">{reservationTarget.branch?.pharmacyName || 'Partner Pharmacy'}</p>
                  <p className="font-mono font-bold text-emerald-600 pt-1">
                    UGX {(reservationTarget.branch?.unitPriceUgx || reservationTarget.med?.suggestedRetailPriceUgx || 0).toLocaleString()} / box
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Quantity to Hold
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReserveQty(Math.max(1, reserveQty - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-black text-base w-8 text-center">{reserveQty}</span>
                      <button
                        type="button"
                        onClick={() => setReserveQty(Math.min(5, reserveQty + 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Hold Period
                    </label>
                    <select
                      value={reserveHoldHours}
                      onChange={(e) => setReserveHoldHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value={24}>24 Hours Hold</option>
                      <option value={48}>48 Hours Hold</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold">
                  <span>Total Amount at Pickup:</span>
                  <span className="font-mono text-sm text-emerald-600">
                    UGX {(((reservationTarget.branch?.unitPriceUgx || reservationTarget.med?.suggestedRetailPriceUgx || 0)) * reserveQty).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const res = advancedStockService.createReservation({
                      pharmacyId: reservationTarget.branch?.pharmacyId || 'client-001',
                      pharmacyName: reservationTarget.branch?.pharmacyName || 'Zenith Partner Pharmacy',
                      patientId: patientUser?.id || 'pat-001',
                      patientName: patientUser?.fullName || 'Patient User',
                      patientPhone: patientUser?.phone || '+256 701 234 567',
                      drugId: reservationTarget.med?.id || 'med-001',
                      brandName: reservationTarget.med?.brandName || reservationTarget.med?.genericName || 'Medication',
                      genericName: reservationTarget.med?.genericName || '',
                      quantityReserved: reserveQty,
                      unitPriceUgx: reservationTarget.branch?.unitPriceUgx || reservationTarget.med?.suggestedRetailPriceUgx || 0,
                      holdHours: reserveHoldHours,
                    });
                    setReservationSuccessPin(res.reservationPin);
                    refreshPatientHolds();
                  }}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  Confirm Hold &amp; Generate Pickup PIN
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal 3: Back-In-Stock Waitlist Modal ── */}
      {waitlistTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Back-in-Stock Notification
                  </h3>
                  <p className="text-xs text-slate-500">Priority Replenishment Queue</p>
                </div>
              </div>
              <button
                onClick={() => setWaitlistTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {waitlistSuccessMsg ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  You're on the Waitlist!
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We will automatically alert you via {waitlistChannel.toUpperCase()} as soon as new stock arrives at {waitlistTarget.branch?.pharmacyName || 'Partner Pharmacy'}.
                </p>
                <button
                  onClick={() => {
                    setWaitlistTarget(null);
                    setSelectedStockMedicine(null);
                    refreshPatientHolds();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  <strong>{waitlistTarget.med?.brandName || waitlistTarget.med?.genericName || 'Medication'}</strong> is currently out of stock at{' '}
                  <strong>{waitlistTarget.branch?.pharmacyName || 'Partner Pharmacy'}</strong>. Subscribe below for an instant alert upon replenishment:
                </p>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Notification Channel
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWaitlistChannel('sms')}
                      className={`p-2.5 rounded-xl border font-bold transition-all cursor-pointer ${
                        waitlistChannel === 'sms'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Telecom SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaitlistChannel('whatsapp')}
                      className={`p-2.5 rounded-xl border font-bold transition-all cursor-pointer ${
                        waitlistChannel === 'whatsapp'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      WhatsApp Alert
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                  Alert will be delivered to: <strong>{patientUser?.phone || '+256 701 234 567'}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    advancedStockService.joinWaitlist({
                      pharmacyId: waitlistTarget.branch?.pharmacyId || 'client-001',
                      pharmacyName: waitlistTarget.branch?.pharmacyName || 'Zenith Partner Pharmacy',
                      patientId: patientUser?.id || 'pat-001',
                      patientName: patientUser?.fullName || 'Patient User',
                      patientPhone: patientUser?.phone || '+256 701 234 567',
                      drugId: waitlistTarget.med?.id || 'med-001',
                      brandName: waitlistTarget.med?.brandName || waitlistTarget.med?.genericName || 'Medication',
                      genericName: waitlistTarget.med?.genericName || '',
                      preferredChannel: waitlistChannel,
                    });
                    setWaitlistSuccessMsg('Subscribed to waitlist');
                    refreshPatientHolds();
                  }}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                >
                  Notify Me When Available
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Quantum RxAI Copilot Launcher */}
      <aside aria-label="Clinical AI Assistant" className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsAICopilotOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 hover:from-teal-500 hover:to-emerald-500 text-white rounded-full shadow-2xl hover:shadow-teal-500/40 border border-teal-400/40 transition-all hover:scale-105 cursor-pointer"
          title="Ask Quantum RxAI Copilot"
        >
          <div className="p-1.5 bg-white/20 rounded-full animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <span>Stuck? Ask RxAI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <div className="text-[10px] text-teal-100 font-medium">24/7 Clinical Triage &amp; Q&amp;A</div>
          </div>
        </button>
      </aside>
      {/* Patient AI Copilot Modal */}
      <PatientAICopilot
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        patientUser={patientUser}
        onOpenTeleconsult={() => setActiveTab('telehealth')}
      />
    </div>
  );
};
