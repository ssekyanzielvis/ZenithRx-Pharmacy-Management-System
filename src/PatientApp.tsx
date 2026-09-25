import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { PatientLandingPage } from './components/patient/PatientLandingPage';
import { PatientAuthModal } from './components/patient/PatientAuthModal';
import { PatientAICopilot } from './components/patient/PatientAICopilot';
import { PatientSidebar } from './components/patient/PatientSidebar';
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
    'search' | 'prescriptions' | 'refills' | 'telehealth' | 'orders' | 'notifications' | 'healthLibrary' | 'adr' | 'support' | 'profile'
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
          onOpenAuth={(mode, reason) => {
            setForceExploreView(false);
            triggerAuth(mode, reason);
          }}
          onSelectAction={(action) => {
            setForceExploreView(false);
            triggerAuth('signin', `Sign in to access ${action}`);
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
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0B131F] text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-200">

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

      {/* ─── Main content area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">

        {/* PWA Install Banner */}
        {showInstallBanner && (
          <div
            className="m-2 mb-0 rounded-xl shadow-lg overflow-hidden shrink-0"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 60%, #0891b2 100%)' }}
          >
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-xs truncate">Install as mobile app</p>
                  <p className="text-white/75 text-[11px] truncate">Works offline • Dose reminders</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-2.5 sm:px-3 py-1 bg-white text-emerald-800 rounded-lg text-xs font-extrabold hover:bg-emerald-50 transition-all shadow cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden xs:inline">Add</span>
                </button>
                <button onClick={() => setShowInstallBanner(false)} className="text-white/70 hover:text-white text-sm p-1">✕</button>
              </div>
            </div>
          </div>
        )}

        {/* Top Header — Mobile Menu Button + Explore Link + Notifications + Theme Toggle */}
        <header
          className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b shrink-0 gap-2"
          style={{ borderColor: 'rgba(148,163,184,0.15)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger button */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
              aria-label="Open Navigation Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => setForceExploreView(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 truncate"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Explore Pharmacies</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative p-2 rounded-xl transition-all border ${
                activeTab === 'notifications'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Open Notification Center"
            >
              <Bell className="w-4 h-4" />
              {notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white shadow ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id)}
                </span>
              )}
            </button>
            <ThemeToggle variant="segmented" />
          </div>
        </header>

        {/* Scrollable content — padded at bottom on mobile for navigation bar */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 space-y-6 pb-28 md:pb-8">

          {/* ── 1. Medicine Search & Multi-Pharmacy Shelf ── */}
          {activeTab === 'search' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    Search Verified Medicines &amp; Direct Order
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Lookup medicines across Uganda National Drug Authority registered pharmacies, view dosage indications, and order for express delivery.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Pharmacy:</span>
                  <select
                    value={selectedPharmacyFilter}
                    onChange={(e) => setSelectedPharmacyFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="all">All Pharmacies</option>
                    {pharmacies.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search brand or generic medicine (e.g. Augmentin, Metformin, Amlodipine, Ventolin, Lantus)..."
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {['all', 'Antibiotics', 'Diabetes', 'Cardiovascular', 'Respiratory', 'Analgesics'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicine Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMeds.map((med) => (
                <div
                  key={med.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/50 hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                          {med.category}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">{med.brandName}</h3>
                        <p className="text-xs text-slate-500 italic">{med.genericName}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{med.ndaRegistrationNumber}</span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Adult Dosage:</span> {med.standardDoseAdult}</p>
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Form:</span> {med.form} ({med.strength})</p>
                    </div>

                    {med.blackboxWarning && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[11px] text-rose-800 dark:text-rose-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>{med.blackboxWarning}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Retail Price</span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {formatUGX(med.suggestedRetailPriceUgx)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedStockMedicine(med)}
                        className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                        title="Check branch stock levels, 24h reservations & waitlists"
                      >
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="hidden xs:inline">Branches</span>
                      </button>

                      <button
                        onClick={() => handleAddToCart(med, selectedPharmacyFilter === 'all' ? 'Kampala City Pharmacy' : selectedPharmacyFilter)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. Prescription Upload & Verification History ── */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Prescription Upload Form */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 pt-2">Upload Doctor's Prescription</h3>
                  <p className="text-xs text-slate-500">
                    Snap a photo of your prescription. Our assistive OCR and certified on-duty pharmacists will verify it before dispensing.
                  </p>
                </div>

                {rxUploadedSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Prescription uploaded successfully! Pharmacist verification in progress.</span>
                  </div>
                )}

                <form onSubmit={handleUploadRx} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Patient Name *</label>
                    <input
                      type="text"
                      required
                      value={rxPatientName}
                      onChange={(e) => setRxPatientName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={rxPhone}
                      onChange={(e) => setRxPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Dispensing Pharmacy *</label>
                    <select
                      value={rxSelectedPharmacy}
                      onChange={(e) => setRxSelectedPharmacy(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    >
                      {pharmacies.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} — {p.district} (Supervised by {p.supervisingPharmacist.split(' ')[1] || p.supervisingPharmacist})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-2 cursor-pointer hover:border-emerald-500 transition-colors">
                    <Upload className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click or tap to snap / attach photo</p>
                    <p className="text-[11px] text-slate-400">JPG, PNG, PDF up to 10MB</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Submit Prescription for Pharmacist Verification
                  </button>
                </form>
              </div>

              {/* Prescription Queue & Verification Status */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Prescription Status &amp; E-Prescriptions</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Track OCR analysis and pharmacist clinical sign-offs.</p>
                </div>

                <div className="space-y-3">
                  {uploadedPrescriptionsList.map((rx) => (
                    <div
                      key={rx.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{rx.id}</span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">{rx.pharmacy}</h4>
                          <span className="text-[11px] text-slate-400">Uploaded: {rx.date}</span>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            rx.status === 'Verified by Pharmacist'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          }`}
                        >
                          {rx.status}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">Digitized Medications:</span>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                          {rx.medicines.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">{rx.pharmacistName}</span>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          Track Dispensing →
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
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Chronic Medication Refill Schedules</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Log your daily medication intake to maintain your adherence streak and automate timely 30-day refills.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-2xl text-xs font-black text-emerald-800 dark:text-emerald-300">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <span>Overall Adherence: 94%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {refills.map((refill) => (
                <div
                  key={refill.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full">
                        {refill.chronicCondition}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">{refill.medicationName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {refill.adherenceRatePercent}% Adherence
                      </span>
                      <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${refill.adherenceRatePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Dosage:</span> {refill.dosageSchedule}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Next Refill Due:</span> <strong className="text-rose-600 dark:text-rose-400">{refill.nextRefillDueDate}</strong></p>
                  </div>

                  {doseLoggedSuccess === refill.id && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Today's dose recorded! Adherence streak updated.</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleLogDose(refill.id)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Log Dose Taken</span>
                    </button>

                    <button
                      onClick={() => {
                        const matchedDrug = medicines.find((m) => m.brandName.toLowerCase().includes(refill.medicationName.toLowerCase())) || medicines[0];
                        handleAddToCart(matchedDrug);
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                    >
                      Order 30-Day Refill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Live Pharmacist Teleconsultation ── */}
        {activeTab === 'telehealth' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 pt-2">Live Pharmacist Consultation</h3>
                <p className="text-xs text-slate-500">
                  Directly consult licensed pharmacists regarding dosage clarifications, drug interactions, or symptoms.
                </p>
              </div>

              {consultSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Consultation request queued! A pharmacist will connect via chat and phone.</span>
                </div>
              )}

              <form onSubmit={handleBookConsult} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    What would you like to discuss with the pharmacist? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your questions, symptoms, or current medications..."
                    value={consultComplaint}
                    onChange={(e) => setConsultComplaint(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  Submit Consultation Request
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Consultation Session History</h3>
                <p className="text-xs text-slate-500">View notes &amp; guidance from supervising pharmacists.</p>
              </div>

              <div className="space-y-3">
                {consultations.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">{c.sessionCode}</span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{c.chiefComplaint}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {c.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1">
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Pharmacist:</span> {c.assignedPharmacistName || 'Pharm. Moses Musoke'}</p>
                      {c.consultationNotes && <p><span className="font-semibold text-slate-700 dark:text-slate-300">Notes:</span> {c.consultationNotes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Orders & Live Delivery Tracking ── */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Active &amp; Past Medicine Deliveries</h2>
              <p className="text-xs text-slate-500 mt-1">Track express motorcycle delivery orders and view your 4-digit handover OTP code.</p>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{order.orderNumber}</span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{order.itemsSummary}</h3>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 animate-pulse'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Deliver To:</span> {order.deliveryAddress}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Courier:</span> {order.assignedCourierName || 'Assigning Rider...'}</p>
                  </div>

                  {order.status === 'Out for Delivery' && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block">
                          Handover Verification OTP:
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          Provide this 4-digit code to the delivery rider upon arrival.
                        </span>
                      </div>
                      <span className="text-2xl font-mono font-black text-emerald-700 dark:text-emerald-300 tracking-widest bg-white dark:bg-slate-900 px-4 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 self-start sm:self-auto">
                        {order.deliveryOtpCode}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. Health Education Library ── */}
        {activeTab === 'healthLibrary' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Patient Health &amp; Medication Library</h2>
              <p className="text-xs text-slate-500 mt-1">Clinically verified health advice written by registered Ugandan pharmacists.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-sm space-y-6">
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

        {/* ── 10. My Health Profile ── */}
        {activeTab === 'profile' && patientUser && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xl">
                {patientUser.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{patientUser.fullName}</h3>
                <p className="text-xs text-slate-500">{patientUser.phone} • {patientUser.district}</p>
                {patientUser.nin && <p className="text-[11px] font-mono text-slate-400">NIN: {patientUser.nin}</p>}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Documented Allergies:</span>
                <p className="text-rose-600 dark:text-rose-400 font-semibold">{patientUser.allergies.join(', ') || 'None documented'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Chronic Health Conditions:</span>
                <p className="text-purple-600 dark:text-purple-400 font-semibold">{patientUser.chronicConditions.join(', ') || 'None documented'}</p>
              </div>

              {/* Active Reservations */}
              {patientReservations.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-blue-600" />
                      Active 24h Medication Reservations ({patientReservations.filter((r) => r.status === 'active').length})
                    </span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {patientReservations.map((r) => (
                      <div key={r.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{r.quantityReserved}x {r.brandName}</p>
                          <p className="text-[10px] text-slate-400">{r.pharmacyName}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                            PIN: {r.reservationPin}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5">Status: {r.status.toUpperCase()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Waitlists */}
              {patientWaitlists.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                  <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <BellRing className="w-4 h-4 text-amber-600" />
                    Back-in-Stock Waitlist Subscriptions ({patientWaitlists.length})
                  </span>
                  <div className="space-y-2 pt-1">
                    {patientWaitlists.map((w) => (
                      <div key={w.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{w.requestedQuantity}x {w.brandName}</p>
                          <p className="text-[10px] text-slate-400">{w.pharmacyName}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {w.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">Offline PWA Sync:</span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Active prescriptions, refills, and medication history are cached securely on your local device.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => patientAuthService.logout()}
                className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs hover:bg-rose-100 transition-colors"
              >
                Sign Out of Patient Portal
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm text-slate-500 py-4 px-4 border-t border-slate-200/50 dark:border-slate-800/50 text-center text-xs space-y-1 mt-auto shrink-0">
          <p className="font-bold text-slate-600 dark:text-slate-400">ZENITHRX PATIENT CARE &amp; HEALTH COMPANION</p>
          <p className="text-[11px]">WhatsApp Pharmacy Helpline: +256-755091826 • Call: 0200 913 555</p>
          <p className="text-[10px] text-slate-400">Uganda NDA Regulated Partner Network · PSU Licensed Pharmacists</p>
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

      {/* ── Modal 1: Pharmacy-to-Pharmacy Stock Discovery Breakdown ── */}
      {selectedStockMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Cross-Pharmacy Stock Availability
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStockMedicine.brandName} • {selectedStockMedicine.genericName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStockMedicine(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Real-time dispensary inventory levels across the ZenithRx network:
              </p>

              <div className="space-y-3">
                {advancedStockService.getCrossPharmacyStock(selectedStockMedicine.brandName).map((branch) => {
                  const isInStock = branch.stockUnits > 0;
                  const isLow = branch.stockUnits > 0 && branch.stockUnits <= 15;

                  return (
                    <div
                      key={branch.pharmacyId}
                      className={`p-4 rounded-2xl border transition-all ${
                        !isInStock
                          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xs hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {branch.pharmacyName}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({branch.distanceKm} km)
                            </span>
                          </div>

                          <p className="text-xs text-slate-500">{branch.address}</p>

                          <div className="flex items-center gap-3 pt-1 text-[11px]">
                            <span
                              className={`font-black px-2 py-0.5 rounded-md ${
                                !isInStock
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {branch.stockUnits} units {branch.stockStatus}
                            </span>

                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              UGX {branch.unitPriceUgx.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-col items-end gap-1.5 shrink-0">
                          {isInStock ? (
                            <>
                              <button
                                onClick={() => {
                                  handleAddToCart(selectedStockMedicine, branch.pharmacyName);
                                  setSelectedStockMedicine(null);
                                  setIsCartOpen(true);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>Order Direct</span>
                              </button>

                              <button
                                onClick={() => {
                                  setReservationTarget({
                                    med: selectedStockMedicine,
                                    branch,
                                  });
                                  setReservationSuccessPin(null);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                              >
                                <BookmarkCheck className="w-3 h-3" />
                                <span>Reserve 24h</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setWaitlistTarget({
                                  med: selectedStockMedicine,
                                  branch,
                                });
                                setWaitlistSuccessMsg(null);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                              <span>Notify Me (Waitlist)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Medication Reservation Sheet ── */}
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
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
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
                    Held for {reserveHoldHours} hours at {reservationTarget.branch.pharmacyName}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReservationTarget(null);
                    setSelectedStockMedicine(null);
                    refreshPatientHolds();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{reservationTarget.med.brandName}</p>
                  <p className="text-slate-500">{reservationTarget.branch.pharmacyName}</p>
                  <p className="font-mono font-bold text-emerald-600 pt-1">
                    UGX {reservationTarget.branch.unitPriceUgx.toLocaleString()} / box
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
                    UGX {(reservationTarget.branch.unitPriceUgx * reserveQty).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const res = advancedStockService.createReservation({
                      pharmacyId: reservationTarget.branch.pharmacyId,
                      pharmacyName: reservationTarget.branch.pharmacyName,
                      patientId: patientUser?.id || 'pat-001',
                      patientName: patientUser?.fullName || 'Harriet Nakato',
                      patientPhone: patientUser?.phone || '+256 701 234 567',
                      drugId: reservationTarget.med.id,
                      brandName: reservationTarget.med.brandName,
                      genericName: reservationTarget.med.genericName,
                      quantityReserved: reserveQty,
                      unitPriceUgx: reservationTarget.branch.unitPriceUgx,
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
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
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
                  We will automatically alert you via {waitlistChannel.toUpperCase()} as soon as new stock arrives at {waitlistTarget.branch.pharmacyName}.
                </p>
                <button
                  onClick={() => {
                    setWaitlistTarget(null);
                    setSelectedStockMedicine(null);
                    refreshPatientHolds();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  <strong>{waitlistTarget.med.brandName}</strong> is currently out of stock at{' '}
                  <strong>{waitlistTarget.branch.pharmacyName}</strong>. Subscribe below for an instant alert upon replenishment:
                </p>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Notification Channel
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWaitlistChannel('sms')}
                      className={`p-2.5 rounded-xl border font-bold transition-all ${
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
                      className={`p-2.5 rounded-xl border font-bold transition-all ${
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
                      pharmacyId: waitlistTarget.branch.pharmacyId,
                      pharmacyName: waitlistTarget.branch.pharmacyName,
                      patientId: patientUser?.id || 'pat-001',
                      patientName: patientUser?.fullName || 'Harriet Nakato',
                      patientPhone: patientUser?.phone || '+256 701 234 567',
                      drugId: waitlistTarget.med.id,
                      brandName: waitlistTarget.med.brandName,
                      genericName: waitlistTarget.med.genericName,
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
