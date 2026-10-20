import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
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
  ArrowLeft,
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
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { PatientSidebar } from './components/patient/PatientSidebar';
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
import { MedicineCard } from './components/ui/MedicineCard';
import { getHealthEducationArticles, HealthEducationArticle } from './services/healthEducationService';
import { getDeliveryOrders, createDeliveryOrder, DeliveryOrder } from './services/deliveryLogisticsService';
import { sendSystemNotification } from './services/notificationService';
import { getAdherenceRecords, AdherenceRecord } from './services/adherenceRefillService';
import { getTeleconsultationSessions, bookTeleconsultation, TeleconsultationSession } from './services/teleconsultationService';
import { submitPrescriptionForOcrVerification } from './services/prescriptionOcrService';
import { submitAdrReport } from './services/adrReportingService';
import { formatUGX } from './services/formatters';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PatientHealthPassportPage } from './components/patient/PatientHealthPassportPage';

// Lazy-loaded Sub-pages for instantaneous initial bundle delivery
const PatientLandingPage = React.lazy(() => import('./components/patient/PatientLandingPage').then(m => ({ default: m.PatientLandingPage || (m as any).default })));
const PatientAuthPage = React.lazy(() => import('./components/patient/PatientAuthModal').then(m => ({ default: m.PatientAuthPage || (m as any).default })));
const PatientCartPage = React.lazy(() => import('./components/patient/PatientCartPage').then(m => ({ default: m.PatientCartPage || (m as any).default })));
const PatientAICopilotPage = React.lazy(() => import('./components/patient/PatientAICopilotPage').then(m => ({ default: m.PatientAICopilotPage || (m as any).default })));
const PatientBranchesPage = React.lazy(() => import('./components/patient/PatientBranchesPage').then(m => ({ default: m.PatientBranchesPage || (m as any).default })));
const PatientSupportHub = React.lazy(() => import('./components/patient/PatientSupportHub').then(m => ({ default: m.PatientSupportHub || (m as any).default })));
const PatientNotificationCenter = React.lazy(() => import('./components/patient/PatientNotificationCenter').then(m => ({ default: m.PatientNotificationCenter || (m as any).default })));
const PatientProfilePage = React.lazy(() => import('./components/patient/PatientProfilePage').then(m => ({ default: m.PatientProfilePage || (m as any).default })));
const PatientMedicineDetailPage = React.lazy(() => import('./components/patient/PatientMedicineDetailPage').then(m => ({ default: m.PatientMedicineDetailPage || (m as any).default })));

// Sleek fast skeleton fallback
const PatientTabLoadingFallback: React.FC = () => (
  <div className="w-full py-24 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-150">
    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
      <RefreshCw className="w-5 h-5 animate-spin" />
    </div>
    <div className="text-center space-y-1">
      <p className="text-sm font-black text-slate-800 dark:text-slate-200">Loading Clinical Module...</p>
      <p className="text-xs text-slate-400 font-medium">Synchronizing verified Uganda health records</p>
    </div>
  </div>
);

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

  // Active Tab & Navigation History Stack
  type PatientTab =
    | 'search'
    | 'cart'
    | 'branches'
    | 'copilot'
    | 'prescriptions'
    | 'refills'
    | 'telehealth'
    | 'orders'
    | 'notifications'
    | 'healthLibrary'
    | 'adr'
    | 'support'
    | 'profile'
    | 'passport'
    | 'medicine-detail';

  const [activeTab, setActiveTabState] = useState<PatientTab>('search');
  const [tabHistory, setTabHistory] = useState<PatientTab[]>(['search']);
  const [selectedMedicineForDetail, setSelectedMedicineForDetail] = useState<MasterMedicineItem | null>(null);

  const getTabDisplayName = (tab?: PatientTab | string): string => {
    switch (tab) {
      case 'search': return 'Medicine Search';
      case 'medicine-detail': return selectedMedicineForDetail ? selectedMedicineForDetail.brandName : 'Medicine Monograph';
      case 'cart': return 'Medicine Cart & Order';
      case 'branches': return 'Partner Pharmacies';
      case 'copilot': return 'RxAI Copilot';
      case 'prescriptions': return 'My Prescriptions';
      case 'refills': return 'Dose Adherence';
      case 'telehealth': return 'Teleconsultation';
      case 'orders': return 'Live Orders';
      case 'notifications': return 'Notifications';
      case 'healthLibrary': return 'Health Education';
      case 'adr': return 'Report Reaction (ADR)';
      case 'support': return 'Support Hub';
      case 'passport': return 'Digital Health Passport';
      case 'profile': return 'Health Records & EHR';
      default: return 'Medicine Search';
    }
  };

  const navigateTab = (newTab: PatientTab, addToHistory = true) => {
    if (newTab === activeTab) return;
    setActiveTabState(newTab);
    if (addToHistory) {
      setTabHistory((prev) => {
        if (prev[prev.length - 1] === newTab) return prev;
        return [...prev, newTab];
      });
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ tab: newTab }, '', `#${newTab}`);
      }
    }
  };

  const setActiveTab = (tab: PatientTab) => {
    navigateTab(tab, true);
  };

  const handleOpenMedicineDetail = (med: MasterMedicineItem) => {
    setSelectedMedicineForDetail(med);
    navigateTab('medicine-detail');
  };

  const goBack = () => {
    if (activeTab === 'branches' && selectedStockMedicine) {
      setSelectedStockMedicine(null);
      return;
    }
    if (activeTab === 'medicine-detail') {
      if (tabHistory.length > 1) {
        const updated = [...tabHistory];
        updated.pop();
        const prevTab = updated[updated.length - 1] || 'search';
        setTabHistory(updated);
        setActiveTabState(prevTab);
      } else {
        setActiveTabState('search');
        setTabHistory(['search']);
      }
      return;
    }
    if (tabHistory.length > 1) {
      const updated = [...tabHistory];
      updated.pop();
      const prevTab = updated[updated.length - 1] || 'search';
      setTabHistory(updated);
      setActiveTabState(prevTab);
    } else if (activeTab !== 'search') {
      setActiveTabState('search');
      setTabHistory(['search']);
    }
  };

  const getPreviousTabName = (): string => {
    if (activeTab === 'branches' && selectedStockMedicine) {
      return 'All Pharmacies';
    }
    if (activeTab === 'medicine-detail') {
      return 'Medicine Search';
    }
    if (tabHistory.length > 1) {
      const prevTab = tabHistory[tabHistory.length - 2];
      return getTabDisplayName(prevTab);
    }
    return 'Medicine Search';
  };

  // Sync browser popstate (hardware back button / gesture) & initial deep link
  useEffect(() => {
    // Check initial hash route e.g. #passport, #profile, #medicine/med-salb-inh-100
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('medicine/') || hash === 'medicine-detail' || hash === 'medicine') {
        const parts = hash.split('/');
        const medId = parts[1];
        const allMeds = getMasterMedicines();
        const targetMed = medId
          ? allMeds.find((m) => m.id === medId || m.brandName.toLowerCase().includes(medId.toLowerCase()))
          : allMeds[0];
        if (targetMed) {
          setSelectedMedicineForDetail(targetMed);
          setActiveTabState('medicine-detail');
        }
      } else if ([
        'passport', 'profile', 'cart', 'branches', 'copilot', 'prescriptions',
        'refills', 'telehealth', 'orders', 'notifications', 'healthLibrary', 'adr', 'support'
      ].includes(hash)) {
        setActiveTabState(hash as PatientTab);
        setTabHistory(['search', hash as PatientTab]);
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTabState(event.state.tab);
        if (event.state.medicineId) {
          const allMeds = getMasterMedicines();
          const found = allMeds.find((m) => m.id === event.state.medicineId);
          if (found) setSelectedMedicineForDetail(found);
        }
        setTabHistory((prev) => {
          if (prev.length > 1) {
            const copy = [...prev];
            copy.pop();
            return copy;
          }
          return [event.state.tab];
        });
      } else {
        setActiveTabState('search');
        setTabHistory(['search']);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const unsub = patientAuthService.subscribe((user) => {
      setPatientUser(user);
    });
    return unsub;
  }, []);

  // Guaranteed non-null patient profile with verified array defaults for passport & clinical views
  const activePassportPatient = useMemo<PatientProfile>(() => {
    const fallback: PatientProfile = {
      id: 'PAT-UG-20999',
      fullName: 'Ssekyanzi Elvis',
      phone: '0706253680',
      email: 'elvis.ssekyanzi@zenithrx.ug',
      nin: 'CM0303110KW57F',
      allergies: ['None documented'],
      chronicConditions: ['None recorded'],
      district: 'Kampala (Central)',
      gender: 'Male',
      dateOfBirth: '1995-04-12',
      registeredAt: '2026-01-10',
    };
    if (!patientUser) return fallback;
    return {
      ...fallback,
      ...patientUser,
      id: patientUser.id || fallback.id,
      fullName: (patientUser.fullName || (patientUser as any).name || fallback.fullName).trim(),
      phone: patientUser.phone || fallback.phone,
      email: patientUser.email || fallback.email,
      nin: patientUser.nin || fallback.nin,
      allergies: Array.isArray(patientUser.allergies) && patientUser.allergies.length > 0 ? patientUser.allergies : fallback.allergies,
      chronicConditions: Array.isArray(patientUser.chronicConditions) && patientUser.chronicConditions.length > 0 ? patientUser.chronicConditions : fallback.chronicConditions,
      district: patientUser.district || fallback.district,
      gender: patientUser.gender || fallback.gender,
      dateOfBirth: patientUser.dateOfBirth || fallback.dateOfBirth,
    };
  }, [patientUser]);

  // Medicines & Search State
  const [medSearch, setMedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState<string>('all');
  const medicines = useMemo(() => getMasterMedicines(), []);
  const pharmacies = useMemo(() => pharmacyDiscoveryService.getAllPharmacies(), []);

  const filteredMeds = useMemo(() => {
    const query = medSearch.trim().toLowerCase();
    const cat = selectedCategory.toLowerCase();
    return medicines.filter((m) => {
      const matchesSearch = !query ||
        m.brandName.toLowerCase().includes(query) ||
        m.genericName.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query);
      const matchesCat = cat === 'all' || m.category.toLowerCase() === cat;
      return matchesSearch && matchesCat;
    });
  }, [medicines, medSearch, selectedCategory]);

  // Cart & Checkout State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'Airtel'>('MTN');
  const [momoPhone, setMomoPhone] = useState(patientUser?.phone || '+256 774 607782');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Health Articles
  const articles = useMemo(() => getHealthEducationArticles(true), []);

  // Deliveries / Orders
  const [orders, setOrders] = useState<DeliveryOrder[]>(() => getDeliveryOrders());

  // Refills & Adherence State
  const [refills, setRefills] = useState<AdherenceRecord[]>(() => getAdherenceRecords());
  const [doseLoggedSuccess, setDoseLoggedSuccess] = useState<string | null>(null);

  // Floating RxAI Copilot Widget Mode: 'expanded' | 'minimized' | 'hidden'
  const [floatingAiMode, setFloatingAiMode] = useState<'expanded' | 'minimized' | 'hidden'>(() => {
    try {
      const saved = localStorage.getItem('zenithrx_floating_ai_mode');
      if (saved === 'minimized' || saved === 'hidden' || saved === 'expanded') return saved;
    } catch {}
    return 'expanded';
  });

  const updateFloatingAiMode = (mode: 'expanded' | 'minimized' | 'hidden') => {
    setFloatingAiMode(mode);
    try {
      localStorage.setItem('zenithrx_floating_ai_mode', mode);
    } catch {}
  };

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

  const handleAddToCart = (med: MasterMedicineItem, pharmacyName = 'Kampala City Pharmacy', quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.drug.id === med.id && i.pharmacyName === pharmacyName);
      if (existing) {
        return prev.map((i) =>
          i.drug.id === med.id && i.pharmacyName === pharmacyName
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `CART-${Date.now()}-${med.id}`,
          drug: med,
          quantity: quantity,
          pharmacyName,
          unitPriceUgx: med.suggestedRetailPriceUgx,
        },
      ];
    });
    setActiveTab('cart');
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

      const formattedPhone = momoPhone.startsWith('+256')
        ? momoPhone
        : `+256 ${momoPhone.replace(/^0/, '').trim()}`;

      const requiresColdChain = cartItems.some((i) =>
        i.drug.storageRequirement?.toLowerCase().includes('cold') ||
        i.drug.storageRequirement?.toLowerCase().includes('refrigerat') ||
        i.drug.storageRequirement?.toLowerCase().includes('2°c') ||
        i.drug.brandName.toLowerCase().includes('insulin') ||
        i.drug.brandName.toLowerCase().includes('lantus') ||
        i.drug.brandName.toLowerCase().includes('vaccine')
      );

      const chosenPharmacy = cartItems[0]?.pharmacyName || 'Kampala City Pharmacy';
      const patientAddr = patientUser?.address || 'Kololo, Kampala';
      const patientDist = patientUser?.district || 'Kampala';
      const itemsText = cartItems.map((i) => `${i.quantity}x ${i.drug.brandName}`).join(', ');

      // 1. Create delivery order in persistent delivery logistics database
      const createdOrder = createDeliveryOrder({
        tenantId: 'client-001',
        pharmacyName: chosenPharmacy,
        patientName: patientUser?.fullName || 'Patient',
        patientPhone: formattedPhone,
        deliveryAddress: patientAddr,
        deliveryDistrict: patientDist,
        patientCoordinates: { lat: 0.3341, lng: 32.5892 },
        itemsSummary: itemsText,
        totalOrderAmountUgx: grandTotalUgx,
        deliveryFeeUgx: deliveryFeeUgx,
        paymentMethod: `${momoProvider} Mobile Money`,
        paymentStatus: 'Paid Online',
        status: 'Out for Delivery',
        isColdChainRequired: requiresColdChain,
        assignedCourierName: requiresColdChain ? 'Patrick Otim (Cold-Chain Specialist)' : 'Juma Kigozi (Boda Express #41)',
        assignedCourierPhone: requiresColdChain ? '+256 788 123456' : '+256 701 998877',
        courierVehiclePlate: requiresColdChain ? 'UEA 441P (Insulated Box Van)' : 'UDL 892K (Bajaj Boxer)',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
        coldChainLogs: requiresColdChain
          ? [
              {
                timestamp: new Date().toISOString(),
                temperatureCelsius: 4.2,
                isWithinSafeRange: true,
                recordedByDeviceId: 'IOT-COOLBOX-09',
              },
            ]
          : undefined,
      });

      // 2. Sync to patient online orders queue for PMS queue console
      try {
        const existingOnlineOrdersRaw = localStorage.getItem('zenithrx_patient_online_orders_v1');
        const existingOnlineOrders = existingOnlineOrdersRaw ? JSON.parse(existingOnlineOrdersRaw) : [];
        const newOnlineOrder = {
          id: createdOrder.id,
          order_number: createdOrder.orderNumber,
          patient_name: createdOrder.patientName,
          patient_phone: createdOrder.patientPhone,
          items: cartItems.map((i) => ({
            drug_name: i.drug.brandName,
            dosage: i.drug.strength || 'Standard Dose',
            quantity: i.quantity,
            unit_price_ugx: i.unitPriceUgx,
            total_ugx: i.unitPriceUgx * i.quantity,
          })),
          total_amount_ugx: grandTotalUgx,
          payment_status: 'Paid' as const,
          payment_method: momoProvider.toUpperCase().includes('AIRTEL') ? ('AIRTEL_MONEY' as const) : ('MTN_MOMO' as const),
          payment_ref: `MOMO-TXN-${Date.now().toString().slice(-8)}`,
          fulfillment_status: 'Processing' as const,
          delivery_type: 'Delivery' as const,
          delivery_address: createdOrder.deliveryAddress,
          has_prescription: cartItems.some((i) => i.drug.isPrescriptionRequired),
          prescription_status: cartItems.some((i) => i.drug.isPrescriptionRequired) ? 'Verified Online' : 'OTC Approved',
          rider_name: createdOrder.assignedCourierName,
          rider_phone: createdOrder.assignedCourierPhone,
          estimated_delivery_at: createdOrder.estimatedDeliveryTime,
          created_at: createdOrder.createdAt,
        };
        localStorage.setItem('zenithrx_patient_online_orders_v1', JSON.stringify([newOnlineOrder, ...existingOnlineOrders]));
      } catch (err) {
        console.error('Error syncing online orders queue:', err);
      }

      // 3. Reserve stock in inventory service
      try {
        cartItems.forEach((item) => {
          advancedStockService.reserveStock({
            drugId: item.drug.id,
            pharmacyId: 'client-001',
            quantity: item.quantity,
            customerPhone: formattedPhone,
          });
        });
      } catch (err) {
        console.error('Stock reservation error:', err);
      }

      // 4. Send Urgent Live Staff Notification (Pharmacy Management System Inbox)
      notificationCenterService.sendNotification({
        tenantId: 'client-001',
        pharmacyId: 'client-001',
        recipientType: 'staff',
        recipientName: 'Pharmacy Dispensing & Delivery Staff',
        category: 'order_confirmed',
        title: `🚨 Urgent Online Order #${createdOrder.orderNumber}`,
        message: `Patient ${createdOrder.patientName} (${createdOrder.patientPhone}) paid ${formatUGX(grandTotalUgx)} via ${momoProvider} Mobile Money for ${createdOrder.itemsSummary}. Destination: ${createdOrder.deliveryAddress}. Courier ${createdOrder.assignedCourierName} assigned with OTP: ${createdOrder.deliveryOtpCode}.`,
        priority: 'urgent',
        actionType: 'track_order',
        actionPayload: { orderId: createdOrder.id, orderNumber: createdOrder.orderNumber },
        channels: { in_app: 'delivered', sms: 'delivered', push: 'sent' },
      });

      // 5. Send System Header Notification to PMS
      sendSystemNotification({
        tenantId: 'client-001',
        title: `🚨 New Patient Delivery Order: ${createdOrder.orderNumber}`,
        message: `Delivery dispatch required for ${createdOrder.patientName} (${formatUGX(grandTotalUgx)}) - ${createdOrder.itemsSummary}.`,
        type: 'critical',
        actionUrl: 'adminOrdersDelivery',
        metadata: { orderId: createdOrder.id },
      });

      // 6. Send Patient In-App & SMS Confirmation Notification with OTP
      notificationCenterService.sendNotification({
        tenantId: 'client-001',
        pharmacyId: 'client-001',
        recipientType: 'patient',
        recipientId: patientUser?.id,
        recipientPhone: formattedPhone,
        recipientName: createdOrder.patientName,
        category: 'order_confirmed',
        title: `Order Confirmed & Rider Dispatched (${createdOrder.orderNumber})`,
        message: `Your payment of ${formatUGX(grandTotalUgx)} has been received by ${createdOrder.pharmacyName}. Express rider ${createdOrder.assignedCourierName} (${createdOrder.assignedCourierPhone}) is on the way. Provide 4-digit OTP ${createdOrder.deliveryOtpCode} upon arrival.`,
        priority: 'high',
        actionType: 'track_order',
        actionPayload: { orderId: createdOrder.id, otp: createdOrder.deliveryOtpCode },
        channels: { in_app: 'delivered', sms: 'delivered', whatsapp: 'delivered' },
      });

      // 7. Broadcast real-time custom event & update timestamp for cross-tab sync
      window.dispatchEvent(
        new CustomEvent('zenithrx_new_delivery_order', {
          detail: createdOrder,
        })
      );
      window.dispatchEvent(
        new CustomEvent('zenithrx_notification_event', {
          detail: { type: 'new_order', orderId: createdOrder.id },
        })
      );
      try {
        localStorage.setItem('zenithrx_last_order_event_time', Date.now().toString());
      } catch (err) {
        console.error('Error setting order event time:', err);
      }

      setOrders((prev) => [createdOrder, ...prev]);
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

  // If Auth page is active (either requested from landing page or in-app), render the dedicated standalone PatientAuthPage
  if (isAuthModalOpen) {
    return (
      <Suspense fallback={<PatientTabLoadingFallback />}>
        <PatientAuthPage
          initialMode={authModalMode}
          redirectReason={authRedirectReason}
          onBack={() => setIsAuthModalOpen(false)}
          onSuccess={(patient) => {
            setPatientUser(patient);
            setIsAuthModalOpen(false);
            setForceExploreView(false);
          }}
        />
      </Suspense>
    );
  }

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

        <Suspense fallback={<PatientTabLoadingFallback />}>
          <PatientLandingPage
            currentUser={patientUser}
            onReturnToPortal={() => setForceExploreView(false)}
            onViewMedicineDetail={(med) => {
              setForceExploreView(false);
              handleOpenMedicineDetail(med);
            }}
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
        </Suspense>
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
        onOpenCart={() => setActiveTab('cart')}
        onOpenAI={() => setActiveTab('copilot')}
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
          <div className="rounded-2xl shadow-md overflow-hidden shrink-0 border border-emerald-500/20"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #0d9488 60%, #0891b2 100%)',
              marginLeft: 'clamp(0.8cm, 2.5vw, 1.2cm)',
              marginRight: 'clamp(0.8cm, 2.5vw, 1.2cm)',
              marginTop: 'clamp(0.8cm, 2vh, 1cm)',
              marginBottom: 'clamp(0.8cm, 2vh, 1cm)',
            }}
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
          className="shrink-0 z-30 flex items-center justify-between border-b bg-white/95 dark:bg-[#07111e]/95 backdrop-blur-md border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs transition-all"
          style={{ paddingLeft: '1cm', paddingRight: '1cm', paddingTop: '0.45cm', paddingBottom: '0.45cm', minHeight: '80px', gap: '1cm' }}
        >
          {/* 1. Left Section: Hamburger + Brand Title + System Online */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              aria-label="Open Navigation Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              className="flex items-center gap-3 sm:gap-3.5 cursor-pointer group"
              onClick={() => {
                setActiveTab('search');
                setForceExploreView(false);
              }}
              title="ZenithRx Patient Care Network"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs overflow-hidden group-hover:scale-105 transition-transform bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 sm:p-1.5 shrink-0">
                <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
              </div>

              <div className="hidden sm:block">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] tracking-widest text-slate-500 dark:text-slate-400 font-extrabold uppercase">
                    QUANTUM NETWORKS LTD
                  </span>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    SYSTEM ONLINE
                  </span>
                </div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
                  ZenithRx
                </h1>
              </div>

              {/* Mobile compact title */}
              <div className="block sm:hidden">
                <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                  ZenithRx
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/80 px-1.5 py-0.5 rounded-md">
                    Live
                  </span>
                </h1>
              </div>
            </div>

            {/* Contextual Header Back Button */}
            {activeTab !== 'search' && (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 shadow-xs transition-all duration-200 cursor-pointer group active:scale-95 shrink-0"
                title={`Back to ${getPreviousTabName()}`}
                aria-label={`Back to ${getPreviousTabName()}`}
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <div className="flex flex-col items-start leading-none text-left hidden sm:flex">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">Back</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[130px] mt-0.5">{getPreviousTabName()}</span>
                </div>
                <span className="sm:hidden text-xs font-bold text-slate-700 dark:text-slate-200">Back</span>
              </button>
            )}
          </div>

          {/* 2. Center Section: Consolidated Clinical Services Dropdown Menu */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-xl px-2">
            <div className="relative inline-block text-left" ref={servicesMenuRef}>
              <button
                type="button"
                onClick={() => setIsServicesMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-slate-800 dark:text-white font-bold text-xs shadow-xs transition cursor-pointer group"
                title="Clinical Services & Network Hub"
              >
                <div className="w-6 h-6 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
                </div>
                <span>Clinical Services</span>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800/80">
                  Kampala Hub
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${isServicesMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Clinical Services Dropdown Panel */}
              {isServicesMenuOpen && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 mt-3 w-88 rounded-3xl bg-white dark:bg-[#0B131F] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 dark:text-white"
                  style={{ padding: '0.6cm', display: 'flex', flexDirection: 'column', gap: '0.45cm' }}
                >
                  {/* Network Context Header */}
                  <div 
                    className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    style={{ paddingBottom: '0.4cm' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4.5 h-4.5 text-teal-600 dark:text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Kampala Care Hub</span>
                    </div>
                    <span className="bg-teal-100 dark:bg-cyan-950 text-teal-800 dark:text-cyan-300 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-cyan-800">
                      Enterprise Network
                    </span>
                  </div>

                  {/* Menu Options */}
                  <div 
                    className="text-xs"
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.2cm' }}
                  >
                    {/* 1. AI Clinical Assistant */}
                    <button
                      onClick={() => {
                        setActiveTab('copilot');
                        setIsServicesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">AI Clinical Assistant</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">24/7 Dosage triage &amp; drug guidance</p>
                      </div>
                    </button>

                    {/* 2. Upload Doctor Prescription */}
                    <button
                      onClick={() => {
                        setActiveTab('prescriptions');
                        setIsServicesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Upload className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Doctor Prescriptions &amp; AI OCR</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Upload doctor slips for verification</p>
                      </div>
                    </button>

                    {/* 3. Explore Partner Pharmacies */}
                    <button
                      onClick={() => {
                        setForceExploreView(true);
                        setIsServicesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-teal-50 dark:hover:bg-cyan-950/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Layers className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">Explore Partner Pharmacies</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Live cross-pharmacy stock network</p>
                      </div>
                    </button>

                    {/* 4. Branch Stock Checker */}
                    <button
                      onClick={() => {
                        setActiveTab('branches');
                        setIsServicesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-800/80 text-left transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Building2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Branch Stock &amp; Hold</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Hold items for counter pickup</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Right Header Section: Profile & Theme (Zero Header Congestion) */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            {/* Theme Dropdown Menu */}
            <ThemeToggle variant="menu" />

            {/* Consolidated Patient Account Dropdown Menu (Includes Notifications, Cart, Profile, Prescriptions, Orders, Sign Out) */}
            {patientUser && (
              <div className="relative inline-block text-left" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs group"
                  title="Patient Profile & Account Menu"
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {patientUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    {(notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id) > 0 || cartItems.length > 0) && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow ring-2 ring-white dark:ring-[#07111e] animate-pulse">
                        {notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id) > 0
                          ? notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id)
                          : cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                      </span>
                    )}
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px] block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {patientUser.fullName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                      <span>Patient</span>
                      <ChevronDown className={`w-2.5 h-2.5 text-amber-600 dark:text-amber-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </button>

                {/* Patient Account Dropdown Panel */}
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-3 w-80 rounded-3xl bg-white dark:bg-[#0B131F] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 dark:text-white"
                    style={{ padding: '0.6cm', display: 'flex', flexDirection: 'column', gap: '0.45cm' }}
                  >
                    {/* User Header */}
                    <div 
                      className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-3.5"
                      style={{ paddingBottom: '0.45cm' }}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                        {patientUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{patientUser.fullName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{patientUser.phone}</p>
                        <span className="inline-block text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full mt-1 border border-emerald-200 dark:border-emerald-800/60">
                          NDA Verified Patient
                        </span>
                      </div>
                    </div>

                    {/* Quick Menu Options */}
                    <div 
                      className="text-xs"
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.2cm' }}
                    >
                      {/* Notifications & Alerts */}
                      <button
                        onClick={() => {
                          setActiveTab('notifications');
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer text-left ${
                          activeTab === 'notifications'
                            ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800/60'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-semibold text-xs">Notifications &amp; Alerts</span>
                        </div>
                        {notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id) > 0 ? (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow ring-1 ring-emerald-400/50 animate-pulse">
                            {notificationCenterService.getUnreadCount(patientUser?.phone || patientUser?.id)} new
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">0 unread</span>
                        )}
                      </button>

                      {/* Medicine Cart & Checkout */}
                      <button
                        onClick={() => {
                          setActiveTab('cart');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="w-4.5 h-4.5 text-amber-500" />
                          <span className="font-semibold text-xs">Medicine Cart</span>
                        </div>
                        {cartItems.length > 0 ? (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Empty</span>
                        )}
                      </button>

                      {/* Digital Health Passport & Smart ID */}
                      <button
                        onClick={() => {
                          setActiveTab('passport');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                      >
                        <CreditCard className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-xs">Digital Health Passport</span>
                      </button>

                      {/* Clinical Health Records & EHR */}
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                      >
                        <User className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-xs">Clinical EHR Records</span>
                      </button>

                      {/* My Prescriptions */}
                      <button
                        onClick={() => {
                          setActiveTab('prescriptions');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                      >
                        <Upload className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-xs">My Prescriptions</span>
                      </button>

                      {/* Live Orders */}
                      <button
                        onClick={() => {
                          setActiveTab('orders');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                      >
                        <Truck className="w-4.5 h-4.5 text-teal-600 dark:text-cyan-400" />
                        <span className="font-semibold text-xs">Live Orders &amp; Deliveries</span>
                      </button>

                      {/* Floating RxAI Widget Visibility Toggle */}
                      <div className="pt-1.5 pb-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <div className="text-left">
                              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">Floating RxAI</span>
                              <span className="text-[10px] text-slate-400 block">
                                {floatingAiMode === 'hidden' ? 'Hidden from screen' : floatingAiMode === 'minimized' ? 'Compact bubble' : 'Full helper card'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFloatingAiMode(floatingAiMode === 'hidden' ? 'expanded' : 'hidden');
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              floatingAiMode !== 'hidden' ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                            role="switch"
                            aria-checked={floatingAiMode !== 'hidden'}
                            title={floatingAiMode !== 'hidden' ? 'Turn off floating RxAI button' : 'Turn on floating RxAI button'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                floatingAiMode !== 'hidden' ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Log Out Option in Dropdown */}
                    <div 
                      className="border-t border-slate-200 dark:border-slate-800"
                      style={{ paddingTop: '0.45cm' }}
                    >
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          patientAuthService.logout();
                        }}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer text-xs font-bold text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
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
          {/* Default Clean Responsive Viewport for all screen sizes with expanded canvas for branches & medicine monograph */}
          <div
            className={`flex-1 w-full ${activeTab === 'branches' || activeTab === 'medicine-detail' ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto space-y-6 sm:space-y-10`}
            style={{
              paddingLeft: 'clamp(0.8cm, 2.5vw, 1.2cm)',
              paddingRight: 'clamp(0.8cm, 2.5vw, 1.2cm)',
              paddingTop: 'clamp(0.8cm, 2.5vh, 1.2cm)',
              paddingBottom: 'clamp(0.8cm, 2.5vh, 1.2cm)',
            }}
          >

            {/* ── Top-of-Page Contextual Back Navigation Banner (Suppressed on medicine-detail which has its own rich navigation bar) ── */}
            {(tabHistory.length > 1 || activeTab !== 'search') && activeTab !== 'medicine-detail' && (
              <div 
                className="flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80"
                style={{ paddingBottom: '0.6cm', marginBottom: '0.8cm' }}
              >
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 shadow-xs hover:shadow-md transition-all cursor-pointer font-bold text-xs sm:text-sm group active:scale-95"
                >
                  <div className="w-6 h-6 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-500 group-hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                  <span>Back to <strong className="font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{getPreviousTabName()}</strong></span>
                </button>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 hidden sm:flex">
                  <button
                    onClick={() => setActiveTab('search')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  >
                    Patient Care Portal
                  </button>
                  <span>/</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold">{getTabDisplayName(activeTab)}</span>
                </div>
              </div>
            )}

          {/* ── 1. Medicine Search & Multi-Pharmacy Formulary ── */}
          {activeTab === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1cm' }}>

              {/* ── Search & Filter Bar (Clean, Unified & Breathable with 1cm Spacing) ── */}
              <div
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs"
                style={{ padding: '1cm', display: 'flex', flexDirection: 'column', gap: '0.6cm' }}
              >
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
                  {/* Search Input */}
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

                  {/* Category Filter Dropdown */}
                  <div className="relative w-full md:w-56 shrink-0">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-all"
                    >
                      <option value="all">💊 All Categories</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Diabetes">Diabetes</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Analgesics">Analgesics</option>
                      <option value="OTC & Supplements">OTC & Supplements</option>
                      <option value="Gastrointestinal">Gastrointestinal</option>
                      <option value="Dermatology">Dermatology</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Pharmacy Partner Filter Dropdown */}
                  <div className="relative w-full md:w-60 shrink-0">
                    <select
                      value={selectedPharmacyFilter}
                      onChange={(e) => setSelectedPharmacyFilter(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-all"
                    >
                      <option value="all">🏥 All Partner Pharmacies</option>
                      {pharmacies.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Sub-bar with Active Category Indicator & Results Count */}
                <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold flex-wrap">
                    <span>Active Filtering:</span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                      {selectedCategory === 'all' ? 'All Medicines' : selectedCategory}
                    </span>
                    {selectedPharmacyFilter !== 'all' && (
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60">
                        {selectedPharmacyFilter}
                      </span>
                    )}
                    {(selectedCategory !== 'all' || selectedPharmacyFilter !== 'all' || medSearch) && (
                      <button
                        onClick={() => { setSelectedCategory('all'); setSelectedPharmacyFilter('all'); setMedSearch(''); }}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold ml-1 cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm mr-1">{filteredMeds.length}</span> results found
                  </div>
                </div>
              </div>

              {/* ── Medicine Formulary Clean Grid with 1cm Spacing ── */}
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                  {filteredMeds.map((med) => (
                    <MedicineCard
                      key={med.id}
                      medicine={med}
                      onViewDetails={handleOpenMedicineDetail}
                      onOrder={(m) =>
                        handleAddToCart(
                          m,
                          selectedPharmacyFilter === 'all' ? 'Kampala City Pharmacy' : selectedPharmacyFilter
                        )
                      }
                      onViewBranches={(m) => {
                        setSelectedStockMedicine(m);
                        setActiveTab('branches');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 1B. Dedicated Medicine Detail & Clinical Monograph Page ── */}
          {activeTab === 'medicine-detail' && (
            <Suspense fallback={<PatientTabLoadingFallback />}>
              <PatientMedicineDetailPage
                medicine={selectedMedicineForDetail || filteredMeds[0] || medicines[0]}
                onGoBack={goBack}
                patientUser={patientUser}
                onAddToCart={(med, pharmacyName, qty) => {
                  handleAddToCart(
                    med,
                    pharmacyName || (selectedPharmacyFilter === 'all' ? 'Kampala City Pharmacy' : selectedPharmacyFilter),
                    qty || 1
                  );
                }}
                onViewBranches={(med) => {
                  setSelectedStockMedicine(med);
                  setActiveTab('branches');
                }}
                onConsultPharmacist={() => setActiveTab('telehealth')}
                onReportReaction={() => setActiveTab('adr')}
                onAskCopilot={() => setActiveTab('copilot')}
                onSelectAlternative={(altMed) => {
                  setSelectedMedicineForDetail(altMed);
                  if (typeof window !== 'undefined' && window.history) {
                    window.history.pushState({ tab: 'medicine-detail', medicineId: altMed.id }, '', `#medicine/${altMed.id}`);
                  }
                }}
              />
            </Suspense>
          )}

          {/* ── 1C. Dedicated Medicine Cart & Mobile Money Checkout Page ── */}
          {activeTab === 'cart' && (
            <Suspense fallback={<PatientTabLoadingFallback />}>
              <PatientCartPage
                cartItems={cartItems}
                patientUser={patientUser}
                onUpdateQty={handleUpdateCartQty}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={() => setCartItems([])}
                onAddToCart={handleAddToCart}
                onGoBack={goBack}
                onNavigateTab={(tab, payload) => setActiveTab(tab as any)}
                onCheckoutSuccess={(createdOrder) => {
                  setOrders((prev) => [createdOrder, ...prev]);
                }}
              />
            </Suspense>
          )}

          {/* ── 2. Dedicated Pharmacy Branches & Live Stock Network Page ── */}
          {activeTab === 'branches' && (
            <Suspense fallback={<PatientTabLoadingFallback />}>
              <PatientBranchesPage
                selectedStockMedicine={selectedStockMedicine}
                onSelectMedicine={(med) => setSelectedStockMedicine(med)}
                onBackToSearch={goBack}
                onGoBack={goBack}
                onAddToCart={(med, pharmacyName) => {
                  handleAddToCart(med, pharmacyName);
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
                onViewDetails={handleOpenMedicineDetail}
              />
            </Suspense>
          )}

          {/* ── 3. Dedicated Quantum RxAI Copilot Independent Clinical Triage Page ── */}
          {activeTab === 'copilot' && (
            <Suspense fallback={<PatientTabLoadingFallback />}>
              <PatientAICopilotPage
                patientUser={patientUser}
                onGoBack={goBack}
                onOpenTeleconsult={() => setActiveTab('telehealth')}
                onNavigateToMedSearch={(query) => {
                  setMedSearch(query);
                  setActiveTab('search');
                }}
              />
            </Suspense>
          )}

          {/* ── 4. Prescription Upload & Verification History ── */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-[1cm]" style={{ gap: '1cm', display: 'flex', flexDirection: 'column' }}>
              {/* Header Title & Registered Badge */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800"
                style={{ paddingBottom: '1cm', marginBottom: '0.5cm' }}
              >
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                    Doctor Prescription Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Upload handwritten or printed doctor slips for pharmacist clinical validation, drug interaction checks, and automated digitization into your records.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 flex-wrap">
                  <button
                    onClick={goBack}
                    className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                    <span>Previous Page</span>
                  </button>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>PSU Registered Pharmacist Review</span>
                  </div>
                </div>
              </div>

              <div
                className="grid grid-cols-1 lg:grid-cols-12 items-start"
                style={{ gap: '1cm' }}
              >
                {/* Prescription Upload Form (Left Column - 6 Cols) */}
                <div
                  className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
                  style={{ padding: '2.2rem 2.2rem', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 pb-4">
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                      Upload New Prescription
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Fill out patient details and attach a clear image or document.
                    </p>
                  </div>

                  {rxUploadedSuccess && (
                    <div
                      className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-3 shadow-xs"
                      style={{ padding: '1rem 1.2rem' }}
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-black">Prescription Uploaded Successfully!</p>
                        <p className="text-[11px] sm:text-xs font-normal text-emerald-700 dark:text-emerald-300 mt-0.5">
                          Our clinical pharmacy team has queued this slip for review and dosage safety verification.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleUploadRx} style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Patient Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={rxPatientName}
                          onChange={(e) => setRxPatientName(e.target.value)}
                          placeholder="Full Legal Name"
                          className="w-full h-12 px-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Phone / WhatsApp <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={rxPhone}
                          onChange={(e) => setRxPhone(e.target.value)}
                          placeholder="+256 700 000000"
                          className="w-full h-12 px-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Preferred Dispensing Pharmacy <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={rxSelectedPharmacy}
                          onChange={(e) => setRxSelectedPharmacy(e.target.value)}
                          className="w-full h-12 px-4.5 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                        >
                          {pharmacies.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name} — {p.district}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Elevated Centered Dropzone */}
                    <div
                      className="border-2 border-dashed border-emerald-200/90 dark:border-emerald-800/70 hover:border-emerald-500 rounded-3xl text-center cursor-pointer transition-all bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 group flex flex-col items-center justify-center shadow-2xs"
                      style={{ padding: '2rem 1.6rem', gap: '0.9rem' }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                          Snap photo or upload prescription file
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Supports high-res JPG, PNG, PDF formats up to 10MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-13 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 active:scale-[0.98] cursor-pointer transition-all flex items-center justify-center gap-2.5"
                    >
                      <Upload className="w-4.5 h-4.5" />
                      <span>Submit for Pharmacist Review</span>
                    </button>
                  </form>
                </div>

                {/* Prescription Status & History List (Right Column - 6 Cols) */}
                <div className="lg:col-span-6 flex flex-col" style={{ gap: '1.2rem' }}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                        Verification History ({uploadedPrescriptionsList.length})
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Live clinical pharmacist review status
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
                      Live Tracker
                    </span>
                  </div>

                  <div className="flex flex-col" style={{ gap: '1.4rem' }}>
                    {uploadedPrescriptionsList.map((rx) => (
                      <div
                        key={rx.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400/50 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                        style={{ padding: '2rem 2rem', gap: '1.6rem' }}
                      >
                        {/* Header with Rx ID and Status Badge */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <div>
                              <span className="inline-block font-mono text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
                                {rx.id}
                              </span>
                            </div>
                            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                              {rx.pharmacy}
                            </h4>
                            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Uploaded on {rx.date}</span>
                            </span>
                          </div>

                          <span
                            className={`text-xs font-black px-3.5 py-1.5 rounded-full shrink-0 shadow-2xs ${
                              rx.status === 'Verified by Pharmacist'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {rx.status}
                          </span>
                        </div>

                        {/* Digitized Medicines Breakdown */}
                        <div
                          className="border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 pt-4"
                        >
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Digitized Medications:
                          </span>
                          <ul className="flex flex-col gap-2.5">
                            {rx.medicines.map((m, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-3 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60"
                                style={{ padding: '0.8rem 1.1rem' }}
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                                <span className="font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-200">{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Reviewer and Track Order Action */}
                        <div
                          className="flex items-center justify-between gap-3 text-xs sm:text-sm border-t border-slate-100 dark:border-slate-800 pt-4 flex-wrap"
                        >
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              Reviewer: <strong className="text-slate-900 dark:text-slate-100 font-bold">{rx.pharmacistName}</strong>
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs transition-all cursor-pointer shrink-0 shadow-2xs whitespace-nowrap active:scale-95"
                          >
                            <span>Track Order</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Back Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Back to Previous Page</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 3. Chronic Refills & Interactive Adherence Tracker ── */}
          {activeTab === 'refills' && (
            <div className="space-y-[1cm]" style={{ gap: '1cm', display: 'flex', flexDirection: 'column' }}>
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800"
                style={{ paddingBottom: '1cm', marginBottom: '0.5cm' }}
              >
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                    Chronic Medication &amp; Refills
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Track daily intake schedules, maintain your streak, and order 30-day refills before your supply ends.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 flex-wrap">
                  <button
                    onClick={goBack}
                    className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                    <span>Previous Page</span>
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <span>94% Adherence · 18-Day Streak 🔥</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1cm' }}>
                {refills.map((refill) => (
                  <div
                    key={refill.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-5 hover:shadow-md transition-all flex flex-col justify-between"
                    style={{ padding: '1cm' }}
                  >
                    <div className="space-y-4">
                      {/* Header with Condition and Adherence Gauge */}
                      <div className="flex justify-between items-start gap-2.5">
                        <div className="space-y-1 min-w-0">
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
                          <div className="w-20 sm:w-28 bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-1.5 overflow-hidden border border-slate-200/60 dark:border-slate-700">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${refill.adherenceRatePercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dosage Schedule & Due Date */}
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1.5 pt-1">
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
                        <div
                          className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 shadow-xs animate-in fade-in"
                          style={{ padding: '0.4cm' }}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Today's dose logged! Streak updated.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Command Row with 0.5cm top spacing */}
                    <div
                      className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800"
                      style={{ marginTop: '0.5cm', paddingTop: '0.5cm' }}
                    >
                      <button
                        onClick={() => handleLogDose(refill.id)}
                        className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Log Dose</span>
                      </button>

                      <button
                        onClick={() => {
                          const matchedDrug = medicines.find((m) => m.brandName.toLowerCase().includes(refill.medicationName.toLowerCase())) || medicines[0];
                          handleAddToCart(matchedDrug);
                        }}
                        className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Order Refill</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Back Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Back to Previous Page</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 4. Live Pharmacist Teleconsultation ── */}
          {activeTab === 'telehealth' && (
            <div className="space-y-[1cm]" style={{ gap: '1cm', display: 'flex', flexDirection: 'column' }}>
              {/* 1. Page Header */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800"
                style={{ paddingBottom: '1cm', marginBottom: '0.5cm' }}
              >
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                    Ask a Licensed Pharmacist
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Virtual clinical triage for dosage questions, drug interactions, and medical guidance.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 flex-wrap">
                  <button
                    onClick={goBack}
                    className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                    <span>Previous Page</span>
                  </button>
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>3 Pharmacists Online Now</span>
                  </div>
                </div>
              </div>

              {/* 2. Main Content Grid (Two Columns) */}
              <div
                className="grid grid-cols-1 lg:grid-cols-12 items-start"
                style={{ gap: '1cm' }}
              >
                {/* Left Column: Submit Clinical Inquiry (lg:col-span-5) */}
                <div
                  className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
                  style={{ padding: '2.4rem 2.2rem', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2 pb-4">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                      Submit Clinical Inquiry
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      Ask our clinical pharmacy team about dosage instructions, drug interactions, side effects, or general health concerns.
                    </p>
                  </div>

                  {consultSuccess && (
                    <div
                      className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-start gap-3 shadow-xs animate-in fade-in"
                      style={{ padding: '1rem 1.2rem' }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-sm">Inquiry submitted successfully!</p>
                        <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                          A licensed pharmacist has received your request and will review it in our clinical queue.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleBookConsult} style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
                    <div className="flex flex-col gap-2.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        Your Medication or Health Query <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Describe your symptoms or medicine dosage question..."
                        value={consultComplaint}
                        onChange={(e) => setConsultComplaint(e.target.value)}
                        className="w-full px-4.5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-y min-h-[140px] leading-relaxed shadow-2xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-13 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 active:scale-[0.98] cursor-pointer transition-all flex items-center justify-center gap-2.5"
                    >
                      <MessageSquare className="w-4.5 h-4.5" />
                      <span>Submit Pharmacist Inquiry</span>
                    </button>
                  </form>

                  <div
                    className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium"
                  >
                    <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Encrypted &amp; reviewed by PSU registered clinical pharmacists</span>
                  </div>
                </div>

                {/* Right Column: Your Pharmacist Consultations (lg:col-span-7) */}
                <div className="lg:col-span-7 flex flex-col" style={{ gap: '0.8cm' }}>
                  <div className="flex items-center justify-between" style={{ paddingBottom: '0.2cm' }}>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      Your Pharmacist Consultations
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {consultations.length} {consultations.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>

                  {consultations.length === 0 ? (
                    <div
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xs"
                      style={{ padding: '1.2cm' }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No consultations yet</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Have a question about your medicines or dosage? Use the form on the left to submit a clinical inquiry.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col" style={{ gap: '1cm' }}>
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
                            className={`bg-white dark:bg-slate-900 border rounded-3xl shadow-xs space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
                              isCompleted
                                ? 'border-slate-200/70 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/60'
                                : 'border-slate-200/90 dark:border-slate-800'
                            }`}
                            style={{ padding: '1cm' }}
                          >
                            {/* Top Meta & Status Row */}
                            <div
                              className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80"
                              style={{ paddingBottom: '0.4cm' }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
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
                              <div
                                className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl space-y-1.5"
                                style={{ marginTop: '0.5cm', padding: '0.6cm' }}
                              >
                                <p className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span>Pharmacist Clinical Guidance:</span>
                                </p>
                                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                                  {adviceText}
                                </p>
                              </div>
                            )}

                            {/* Pharmacist Secondary Info Footer */}
                            <div
                              className="border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
                              style={{ marginTop: '0.5cm', paddingTop: '0.5cm' }}
                            >
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

              {/* Bottom Back Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Back to Previous Page</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 5. Orders & Live Delivery Tracking ── */}
          {activeTab === 'orders' && (
            <div className="space-y-[1cm]" style={{ gap: '1cm', display: 'flex', flexDirection: 'column' }}>
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800"
                style={{ paddingBottom: '1cm', marginBottom: '0.5cm' }}
              >
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                    Live Deliveries &amp; Orders
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Track express motorcycle delivery orders and view your 4-digit handover OTP code.
                  </p>
                </div>
                <button
                  onClick={goBack}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Previous Page</span>
                </button>
              </div>

              <div className="flex flex-col" style={{ gap: '1cm' }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-5 transition-all hover:border-emerald-400/40"
                    style={{ padding: '1cm' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="inline-block font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                          {order.orderNumber}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                          {order.itemsSummary}
                        </h3>
                        <p className="text-xs text-slate-500">From {order.pharmacyName}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto shadow-2xs ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800"
                      style={{ marginTop: '0.5cm', paddingTop: '0.5cm' }}
                    >
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Deliver To:</span> {order.deliveryAddress}
                        <span className="text-slate-400 ml-2">({order.deliveryDistrict})</span>
                      </div>

                      {order.deliveryOtpCode && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">Handover OTP:</span>
                          <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                            {order.deliveryOtpCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Back Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Back to Previous Page</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 6. Health Education Library ── */}
          {activeTab === 'healthLibrary' && (
            <div className="space-y-[1cm]" style={{ gap: '1cm', display: 'flex', flexDirection: 'column' }}>
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800"
                style={{ paddingBottom: '1cm', marginBottom: '0.5cm' }}
              >
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                    Health Education &amp; Advice
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Clinically verified health advice written by registered Ugandan pharmacists.
                  </p>
                </div>
                <button
                  onClick={goBack}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Previous Page</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1cm' }}>
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between space-y-5 hover:shadow-md transition-all hover:border-emerald-400/40"
                    style={{ padding: '1cm' }}
                  >
                    <div className="space-y-3">
                      <span className="inline-block text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                        {art.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                        {art.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    <div
                      className="border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between items-center"
                      style={{ marginTop: '0.5cm', paddingTop: '0.5cm' }}
                    >
                      <span className="font-semibold text-slate-600 dark:text-slate-300">By {art.authorName}</span>
                      <span>{art.readTimeMinutes} min read</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Back Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Back to Previous Page</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 7. Report Drug Side Effect (ADR) ── */}
          {activeTab === 'adr' && (
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-xl mx-auto shadow-xs space-y-6"
              style={{ padding: '1cm' }}
            >
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>Previous Page</span>
                </button>
              </div>

              <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800" style={{ paddingBottom: '0.6cm' }}>
                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 pt-1">
                  Report an Adverse Drug Side Effect
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Directly report unexpected symptoms or reactions to the National Drug Authority Pharmacovigilance Centre.
                </p>
              </div>

              {adrSuccess && (
                <div
                  className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 shadow-xs"
                  style={{ padding: '0.5cm' }}
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Safety report received! A supervising pharmacist will evaluate your case immediately.</span>
                </div>
              )}

              <form onSubmit={handleReportAdr} style={{ display: 'flex', flexDirection: 'column', gap: '1cm' }}>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Medication Brand / Generic Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625mg or Metformin"
                    value={adrDrug}
                    onChange={(e) => setAdrDrug(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Batch Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AUG-2025-08"
                      value={adrBatch}
                      onChange={(e) => setAdrBatch(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Severity <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={adrSeverity}
                      onChange={(e) => setAdrSeverity(e.target.value as any)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                    >
                      <option value="Mild">Mild Discomfort</option>
                      <option value="Moderate">Moderate Reaction</option>
                      <option value="Severe">Severe Reaction</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Symptoms Experienced <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe rashes, swelling, breathing difficulty, dizziness, or gastrointestinal pain..."
                    value={adrSymptoms}
                    onChange={(e) => setAdrSymptoms(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all leading-relaxed placeholder:text-slate-400 min-h-[120px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer text-center active:scale-95"
                  >
                    Cancel &amp; Go Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Submit Patient Safety Report</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── 8. Customer Support & Complaints Desk ── */}
          {activeTab === 'support' && (
            <Suspense fallback={<PatientTabLoadingFallback />}>
              <PatientSupportHub
                patient={patientUser}
                onOpenAuth={triggerAuth}
                onGoBack={goBack}
              />
            </Suspense>
          )}

          {/* ── 9. Notification Center & Clinical Inbox ── */}
          {activeTab === 'notifications' && (
            <Suspense fallback={<PatientTabLoadingFallback />}>
              <PatientNotificationCenter
                patientPhoneOrId={patientUser?.phone || patientUser?.id}
                patientName={patientUser?.fullName}
                onNavigateTab={(tab, payload) => setActiveTab(tab as any)}
                onGoBack={goBack}
              />
            </Suspense>
          )}

          {/* ── 10. My Health Profile & EHR Records (Dedicated Page) ── */}
          {activeTab === 'profile' && patientUser && (
            <Suspense fallback={<PatientTabLoadingFallback />}>
              <PatientProfilePage
                patient={patientUser}
                reservations={patientReservations}
                onNavigateTab={(tab, payload) => setActiveTab(tab as any)}
                onRefreshReservations={refreshPatientHolds}
                onSignOut={() => patientAuthService.logout()}
                onGoBack={goBack}
              />
            </Suspense>
          )}

          {/* ── 11. Official Digital Health Passport & Smart ID Card (Dedicated Page) ── */}
          {activeTab === 'passport' && (
            <ErrorBoundary fallbackTitle="Digital Health Passport Module" onReset={() => setActiveTab('search')}>
              <PatientHealthPassportPage
                patient={activePassportPatient}
                reservations={patientReservations}
                onNavigateTab={(tab, payload) => setActiveTab(tab as any)}
                onGoBack={goBack}
                onEditProfile={() => setActiveTab('profile')}
              />
            </ErrorBoundary>
          )}

          </div>

          {/* ── Executive Clinical Footer (Expanded Length & Height with Generous Spacing) ── */}
          <footer 
            className="w-full bg-slate-100/90 dark:bg-[#07111e] border-t border-slate-200/90 dark:border-slate-800 mt-20 sm:mt-28 text-center text-xs shadow-md shrink-0 text-slate-600 dark:text-slate-400 transition-colors duration-200"
            style={{ padding: '1cm', paddingBottom: '3.5cm' }}
          >
            <div 
              className="max-w-7xl mx-auto"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5cm' }}
            >
              <p className="text-slate-900 dark:text-white font-black tracking-wider text-sm sm:text-base uppercase">
                ZENITHRX – CLINICAL PHARMACY MANAGEMENT SYSTEM
              </p>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
                WhatsApp: <span className="text-emerald-600 dark:text-emerald-400 font-bold">+256-755091826</span> | Call:{' '}
                <span className="text-blue-600 dark:text-blue-400 font-bold">0200 913 555</span> | Email:{' '}
                <span className="text-slate-800 dark:text-slate-200 font-semibold">quantumnetworks@gmail.com</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs pt-1">
                Official Web: <span className="text-slate-700 dark:text-slate-300 underline font-medium">www.quantumnetworks.com</span> • Powered by Gemini AI Clinical Engine
                {patientUser && (
                  <span className="ml-2 text-slate-700 dark:text-slate-300 font-medium">
                    | {patientUser.fullName} (Patient Portal) • NDA Verified Network
                  </span>
                )}
              </p>
            </div>
          </footer>
        </main>
      </div>

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
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
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

      {/* Floating Quantum RxAI Copilot Launcher with Toggle On/Off & Minimize Capability */}
      {activeTab !== 'copilot' && activeTab !== 'cart' && !isCartOpen && !reservationTarget && (
        <aside
          aria-label="Clinical AI Assistant"
          className="fixed z-40 transition-all duration-300"
          style={{
            right: 'clamp(0.8cm, 2.5vw, 1.5rem)',
            bottom: 'clamp(0.8cm, 2.5vw, 1.5rem)',
          }}
        >
          {floatingAiMode === 'expanded' && (
            <div className="relative group animate-in fade-in slide-in-from-bottom-3 duration-200">
              <button
                onClick={() => setActiveTab('copilot')}
                className="flex items-center gap-3.5 pl-5 pr-13 py-3.5 sm:pl-6 sm:pr-14 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-3xl shadow-2xl shadow-teal-900/40 border border-white/25 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer backdrop-blur-md"
                title="Ask Quantum RxAI Copilot (Click to open clinical triage)"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-2">
                    <span>Stuck? Ask RxAI</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                    </span>
                  </div>
                  <div className="text-[11px] text-teal-100 font-semibold tracking-normal mt-0.5 whitespace-nowrap">
                    24/7 Clinical Triage &amp; Q&amp;A
                  </div>
                </div>
              </button>

              {/* Quick Dismiss / Minimize Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFloatingAiMode('minimized');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/25 hover:bg-black/50 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/20 hover:scale-110 active:scale-95"
                title="Minimize RxAI button"
                aria-label="Minimize RxAI button"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}

          {floatingAiMode === 'minimized' && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/85 dark:bg-slate-900/90 border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => updateFloatingAiMode('expanded')}
                className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Click to expand RxAI full helper"
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>Ask RxAI</span>
              </button>

              <button
                type="button"
                onClick={() => updateFloatingAiMode('hidden')}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-rose-300 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Hide completely from screen"
                aria-label="Hide completely from screen"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {floatingAiMode === 'hidden' && (
            <button
              onClick={() => updateFloatingAiMode('expanded')}
              className="group flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 border border-emerald-400/40 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-70 hover:opacity-100"
              title="Show RxAI Assistant (Toggle back ON)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-black">Show RxAI</span>
            </button>
          )}
        </aside>
      )}
    </div>
  );
};
