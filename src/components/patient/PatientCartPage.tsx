import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Building2,
  Pill,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Sparkles,
  Phone,
  MapPin,
  Tag,
  CreditCard,
  Search,
  BadgeCheck,
  Check,
} from 'lucide-react';
import { MasterMedicineItem } from '../../services/medicineSafetyService';
import { PatientProfile } from '../../services/patientAuthService';
import { DeliveryOrder, createDeliveryOrder } from '../../services/deliveryLogisticsService';
import { formatUGX } from '../../services/formatters';

export interface CartItem {
  id: string;
  drug: MasterMedicineItem;
  quantity: number;
  pharmacyName: string;
  unitPriceUgx: number;
}

interface PatientCartPageProps {
  cartItems: CartItem[];
  patientUser: PatientProfile | null;
  onUpdateQty: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onAddToCart: (med: MasterMedicineItem, pharmacyName: string) => void;
  onGoBack: () => void;
  onNavigateTab: (tab: string, payload?: any) => void;
  onCheckoutSuccess: (order: DeliveryOrder) => void;
}

export const PatientCartPage: React.FC<PatientCartPageProps> = ({
  cartItems,
  patientUser,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onAddToCart,
  onGoBack,
  onNavigateTab,
  onCheckoutSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'Airtel'>('MTN');
  const [momoPhone, setMomoPhone] = useState(patientUser?.phone || '+256 774 607782');
  const [deliveryAddress, setDeliveryAddress] = useState('Plot 42, Kampala Road, Central Division, Kampala');
  const [deliveryNotes, setDeliveryNotes] = useState('Call recipient upon arrival at main gate');
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<DeliveryOrder | null>(null);
  const [stkPromptCountdown, setStkPromptCountdown] = useState<number | null>(null);

  // Suggested Quick-Add OTC Essentials
  const quickAddEssentials: Array<{
    id: string;
    brandName: string;
    genericName: string;
    category: string;
    unitPriceUgx: number;
    dosageForm: string;
    packSize: string;
    strength: string;
    requiresPrescription: boolean;
    inStock: boolean;
  }> = [
    {
      id: 'med-otc-vitc',
      brandName: 'Redoxon Vitamin C + Zinc',
      genericName: 'Ascorbic Acid + Zinc Effervescent',
      category: 'Vitamins & Supplements',
      unitPriceUgx: 25000,
      dosageForm: 'Effervescent Tablet',
      packSize: '10 Tablets',
      strength: '1000mg',
      requiresPrescription: false,
      inStock: true,
    },
    {
      id: 'med-otc-panadol',
      brandName: 'Panadol Extra',
      genericName: 'Paracetamol + Caffeine',
      category: 'Analgesics / Pain Relief',
      unitPriceUgx: 8000,
      dosageForm: 'Tablet',
      packSize: '24 Tablets',
      strength: '500mg / 65mg',
      requiresPrescription: false,
      inStock: true,
    },
    {
      id: 'med-otc-ors',
      brandName: 'Oral Rehydration Salts (WHO)',
      genericName: 'Oral Electrolytes Formula',
      category: 'Gastrointestinal',
      unitPriceUgx: 5000,
      dosageForm: 'Sachet Powder',
      packSize: '5 Sachets',
      strength: 'WHO Standard',
      requiresPrescription: false,
      inStock: true,
    },
    {
      id: 'med-otc-cetirizine',
      brandName: 'Zyrtec (Cetirizine HCl)',
      genericName: 'Cetirizine Dihydrochloride',
      category: 'Allergy & Respiratory',
      unitPriceUgx: 18000,
      dosageForm: 'Tablet',
      packSize: '10 Tablets',
      strength: '10mg',
      requiresPrescription: false,
      inStock: true,
    },
  ];

  // Price computations
  const cartSubtotalUgx = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPriceUgx * item.quantity, 0);
  }, [cartItems]);

  const deliveryFeeUgx = cartItems.length > 0 ? 3500 : 0;
  const grandTotalUgx = Math.max(0, cartSubtotalUgx + deliveryFeeUgx - appliedDiscount);

  // Handle promo code application
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'ZENITHFIRST' || code === 'MINISTRYCARE' || code === 'HEALTH2026') {
      const discount = Math.round(cartSubtotalUgx * 0.1);
      setAppliedDiscount(discount);
      setPromoMessage(`Promo code "${code}" applied: 10% discount (-${formatUGX(discount)})!`);
    } else if (code) {
      setPromoMessage('Invalid or expired promotional code. Try ZENITHFIRST');
    }
  };

  // Process MoMo Checkout
  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setIsProcessingPayment(true);
    setStkPromptCountdown(5);

    const formattedPhone = momoPhone.startsWith('+256')
      ? momoPhone
      : `+256 ${momoPhone.replace(/^0/, '').replace(/\s+/g, '')}`;

    const primaryPharmacy = cartItems[0]?.pharmacyName || 'Kampala City Pharmacy';
    const requiresColdChain = cartItems.some((i) =>
      i.drug.storageRequirement?.toLowerCase().includes('cold') ||
      i.drug.storageRequirement?.toLowerCase().includes('refrigerat') ||
      i.drug.brandName.toLowerCase().includes('insulin')
    );

    const newOrder = createDeliveryOrder({
      tenantId: 'client-001',
      pharmacyName: primaryPharmacy,
      patientName: patientUser?.fullName || 'ZenithRx Verified Patient',
      patientPhone: formattedPhone,
      deliveryAddress: deliveryAddress,
      deliveryDistrict: patientUser?.district || 'Kampala',
      itemsSummary: cartItems.map((i) => `${i.quantity}x ${i.drug.brandName}`).join(', '),
      totalOrderAmountUgx: grandTotalUgx,
      deliveryFeeUgx: deliveryFeeUgx,
      paymentMethod: `${momoProvider} Mobile Money`,
      paymentStatus: 'Paid Online',
      status: 'Out for Delivery',
      isColdChainRequired: requiresColdChain,
      assignedCourierName: 'Moses Kaggwa (ZenithRx Rider #12)',
      assignedCourierPhone: '+256 701 445566',
      courierVehiclePlate: 'UDL 892K (Bajaj Boxer)',
      estimatedDeliveryTime: new Date(Date.now() + 25 * 60000).toISOString(),
      patientCoordinates: { lat: 0.3255, lng: 32.5788 },
      coldChainLogs: requiresColdChain
        ? [
            {
              timestamp: new Date().toISOString(),
              temperatureCelsius: 4.5,
              isWithinSafeRange: true,
              recordedByDeviceId: 'IOT-COOLBOX-12',
            },
          ]
        : undefined,
    });

    // Countdown simulation
    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setStkPromptCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
      }
    }, 500);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setStkPromptCountdown(null);
      setConfirmedOrder(newOrder);
      setCurrentStep('confirmed');
      onCheckoutSuccess(newOrder);
      onClearCart();
    }, 2800);
  };

  return (
    <div
      className="font-sans w-full max-w-[1600px] mx-auto px-1 sm:px-2 pb-36 animate-in fade-in duration-200"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.8cm' }}
    >
      {/* ── 1. Top Navigation Bar (Spacious Standalone Row) ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Previous Page</span>
        </button>

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>NDA Licensed Dispensary Care Network</span>
        </div>
      </div>

      {/* ── 2. Hero Banner Card (Spacious Full Width Card) ── */}
      <div
        className="w-full bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800/80 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between transition-colors"
        style={{ padding: '0.9cm 1cm', gap: '0.8cm' }}
      >
        <div className="flex items-center gap-5 sm:gap-6 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
            <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '0.25cm' }}>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
                Prescription Desk
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items in Cart
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Medicine Cart &amp; Order
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Authentic Uganda National Drug Authority formulary • Express 25-minute cold-chain rider delivery
            </p>
          </div>
        </div>

        {cartItems.length > 0 && currentStep === 'cart' && (
          <button
            onClick={() => setCurrentStep('checkout')}
            className="w-full md:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 active:scale-95"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* ── 3. Dedicated 3-Step Progress Stepper Card ── */}
      <div
        className="w-full bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800/80 rounded-3xl shadow-xs transition-colors"
        style={{ padding: '0.6cm 0.8cm' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => {
              if (currentStep !== 'confirmed') setCurrentStep('cart');
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all text-left flex items-center gap-3.5 cursor-pointer ${
              currentStep === 'cart'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400/30'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400/50'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                currentStep === 'cart'
                  ? 'bg-white text-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider opacity-80">Step 1</p>
              <p className="text-sm font-black truncate">1. Review Cart</p>
              <p className="text-[11px] opacity-75 truncate">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} medications selected</p>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            disabled={cartItems.length === 0 || currentStep === 'confirmed'}
            onClick={() => {
              if (cartItems.length > 0 && currentStep !== 'confirmed') setCurrentStep('checkout');
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all text-left flex items-center gap-3.5 ${
              currentStep === 'checkout'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400/30 cursor-pointer'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400/50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                currentStep === 'checkout'
                  ? 'bg-white text-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider opacity-80">Step 2</p>
              <p className="text-sm font-black truncate">2. MoMo Checkout</p>
              <p className="text-[11px] opacity-75 truncate">MTN &amp; Airtel Mobile Money</p>
            </div>
          </button>

          {/* Step 3 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all text-left flex items-center gap-3.5 ${
              currentStep === 'confirmed'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400/30'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                currentStep === 'confirmed'
                  ? 'bg-white text-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider opacity-80">Step 3</p>
              <p className="text-sm font-black truncate">3. Rider Dispatch</p>
              <p className="text-[11px] opacity-75 truncate">Live GPS &amp; OTP Handoff</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. STEP 1 CONTENT: REVIEW CART & PRESCRIPTION ITEMS ── */}
      {currentStep === 'cart' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items & OTC Recommendations */}
          <div
            className="lg:col-span-8"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.8cm' }}
          >
            {/* Cart Items Card */}
            <div
              className="rounded-3xl bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800/80 shadow-xs transition-colors"
              style={{ padding: '0.9cm 1cm', display: 'flex', flexDirection: 'column', gap: '0.6cm' }}
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shadow-xs">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      Selected Medications
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      All items authenticated with Uganda National Drug Authority verification
                    </p>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Cart</span>
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-16 sm:py-20 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800/80 text-slate-300 dark:text-slate-600 mx-auto flex items-center justify-center shadow-inner">
                    <ShoppingCart className="w-10 h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
                      Your medicine cart is currently empty
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      Search our national formulary of verified medications, chronic refills, and OTC essentials to add to your order.
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => onNavigateTab('search')}
                      className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 mx-auto active:scale-95"
                    >
                      <Search className="w-4 h-4" />
                      <span>Browse Medicine Formulary</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.55cm' }}
                >
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-2xs hover:shadow-xs"
                      style={{ padding: '0.65cm 0.8cm' }}
                    >
                      {/* Left: Icon & Medication Details */}
                      <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs border border-slate-200/80 dark:border-slate-700 mt-0.5">
                          <Pill className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          {/* Title & Badges */}
                          <div className="space-y-1.5">
                            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                              {item.drug.brandName}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
                                {item.drug.dosageForm || 'Oral Form'}
                              </span>
                              {item.drug.requiresPrescription ? (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  Rx Required
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                  OTC Essential
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Generic Details & Pharmacy */}
                          <div className="space-y-1 pt-0.5">
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                              {item.drug.genericName} • {item.drug.strength || 'Standard Dosage'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{item.pharmacyName}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Stepper Action */}
                      <div className="flex items-center justify-between lg:justify-end gap-5 sm:gap-7 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200/70 dark:border-slate-800">
                        <div className="text-left lg:text-right min-w-[100px]">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Item Total</p>
                          <p className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {formatUGX(item.unitPriceUgx * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                              {formatUGX(item.unitPriceUgx)} each
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <button
                            onClick={() => onUpdateQty(item.id, -1)}
                            className="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer active:scale-90 transition-all"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs sm:text-sm font-black w-7 text-center text-slate-900 dark:text-white select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQty(item.id, 1)}
                            className="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer active:scale-90 transition-all"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2.5 sm:p-3 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 shadow-2xs"
                          title="Remove item from order"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onNavigateTab('search')}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add More Medications</span>
                  </button>

                  <p className="text-xs text-slate-400 font-medium">
                    Protected by Uganda Data Protection and Privacy Act 2019
                  </p>
                </div>
              )}
            </div>

            {/* Recommended OTC Essentials Carousel/Card */}
            <div
              className="rounded-3xl bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800/80 shadow-xs transition-colors"
              style={{ padding: '0.9cm 1cm', display: 'flex', flexDirection: 'column', gap: '0.6cm' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center font-black shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Frequently Added OTC Essentials
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Over-the-counter family wellness • No doctor prescription required
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 self-start sm:self-auto">
                  Instant Dispatch
                </span>
              </div>

              <div className="flex flex-col gap-3.5" style={{ gap: '0.5cm' }}>
                {quickAddEssentials.map((otc) => {
                  const alreadyInCart = cartItems.some((i) => i.drug.id === otc.id);
                  return (
                    <div
                      key={otc.id}
                      className="rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:shadow-xs"
                      style={{ padding: '0.55cm 0.7cm' }}
                    >
                      {/* Left: Info */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs border border-slate-200/70 dark:border-slate-700">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-base font-black text-slate-900 dark:text-white">
                              {otc.brandName}
                            </h4>
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
                              {otc.dosageForm}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              In Stock
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {otc.genericName} • {otc.strength || 'Standard OTC Dose'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Price & Add to Order Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/70 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Unit Price</p>
                          <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {formatUGX(otc.unitPriceUgx)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(
                              {
                                id: otc.id,
                                brandName: otc.brandName,
                                genericName: otc.genericName,
                                category: otc.category,
                                dosageForm: otc.dosageForm,
                                strength: otc.strength,
                                unitPriceUgx: otc.unitPriceUgx,
                                requiresPrescription: otc.requiresPrescription,
                                inStock: otc.inStock,
                                manufacturer: 'ZenithCare Verified',
                                description: 'OTC essential medication',
                                sideEffects: [],
                                interactions: [],
                              } as any,
                              'Kampala City Pharmacy'
                            );
                          }}
                          className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95 ${
                            alreadyInCart
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/20'
                          }`}
                        >
                          {alreadyInCart ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added to Order</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Add to Order</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Action */}
          <div
            className="lg:col-span-4"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.8cm' }}
          >
            {/* Order Breakdown Card */}
            <div
              className="rounded-3xl bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800/80 shadow-xs sticky top-24 transition-colors"
              style={{ padding: '0.85cm 0.9cm', display: 'flex', flexDirection: 'column', gap: '0.55cm' }}
            >
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Order Summary
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Live calculation with express dispatch fee
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Prescription Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
                  <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                    {formatUGX(cartSubtotalUgx)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>Express Rider Delivery</span>
                    <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      ~25m
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                    {cartItems.length > 0 ? formatUGX(deliveryFeeUgx) : 'UGX 0'}
                  </span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Promo Discount (10%)</span>
                    <span className="whitespace-nowrap shrink-0">-{formatUGX(appliedDiscount)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block truncate">
                      Total Payable
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium block truncate">All taxes &amp; rider fee included</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    {formatUGX(grandTotalUgx)}
                  </span>
                </div>
              </div>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Have a Promo Voucher?
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center h-11 sm:h-12 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 px-3.5 gap-2.5 transition-all">
                    <Tag className="w-4 h-4 text-slate-400 shrink-0 select-none" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. ZENITHFIRST"
                      className="flex-1 w-full bg-transparent border-0 p-0 text-xs font-bold text-slate-900 dark:text-white focus:outline-none uppercase placeholder:normal-case placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-xs transition-all cursor-pointer shrink-0 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p
                    className={`text-xs font-semibold ${
                      appliedDiscount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {promoMessage}
                  </p>
                )}
              </form>

              {/* Proceed to Checkout Button */}
              <button
                disabled={cartItems.length === 0}
                onClick={() => setCurrentStep('checkout')}
                className="w-full py-4 sm:py-4.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 active:scale-98 whitespace-nowrap"
              >
                <span>Proceed to MoMo Payment</span>
                <ArrowRight className="w-4.5 h-4.5 shrink-0" />
              </button>

              {/* Safety & Logistics Badge */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Licensed Clinical Dispatch</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
                  Temperature controlled transit (15-25°C). 4-digit OTP provided upon payment for delivery verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. STEP 2 CONTENT: CHECKOUT & MOBILE MONEY PAYMENT ── */}
      {currentStep === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Delivery Details & Payment Form */}
          <div
            className="lg:col-span-8"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2cm' }}
          >
            <form
              onSubmit={handleProcessCheckout}
              className="rounded-3xl bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800/80 shadow-xs transition-colors"
              style={{ padding: '2.4rem 2.2rem', display: 'flex', flexDirection: 'column', gap: '2.2rem' }}
            >
              {/* Delivery Address Section */}
              <div
                className="border-b border-slate-100 dark:border-slate-800"
                style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', paddingBottom: '2rem' }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black shadow-xs shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Delivery Location &amp; Contact
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Where should our express courier deliver your medication?
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Destination Address / Building / Plot <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Plot 14, Acacia Avenue, Kololo"
                      className="w-full h-12 px-4.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Courier Delivery Notes / Gate Code
                    </label>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="e.g. Apartment 4B, ring bell on arrival"
                      className="w-full h-12 px-4.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Money Provider Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shadow-xs shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Instant Mobile Money Authorization
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Select telecom provider for direct USSD PIN prompt push
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* MTN MoMo Button */}
                  <button
                    type="button"
                    onClick={() => setMomoProvider('MTN')}
                    className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                      momoProvider === 'MTN'
                        ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-lg shadow-amber-400/20 ring-4 ring-amber-400/20 scale-[1.01]'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-950 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        MTN
                      </div>
                      <div>
                        <span className="block text-sm font-black">MTN MoMo Uganda</span>
                        <span className="text-xs font-semibold opacity-80">*165# Push System</span>
                      </div>
                    </div>
                    {momoProvider === 'MTN' && (
                      <CheckCircle2 className="w-6 h-6 text-amber-950 shrink-0" />
                    )}
                  </button>

                  {/* Airtel Money Button */}
                  <button
                    type="button"
                    onClick={() => setMomoProvider('Airtel')}
                    className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                      momoProvider === 'Airtel'
                        ? 'bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-600/20 ring-4 ring-rose-500/20 scale-[1.01]'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        airtel
                      </div>
                      <div>
                        <span className="block text-sm font-black">Airtel Money Uganda</span>
                        <span className="text-xs font-semibold opacity-80">*185# Push System</span>
                      </div>
                    </div>
                    {momoProvider === 'Airtel' && (
                      <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
                    )}
                  </button>
                </div>

                {/* Phone Number Input */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Enter Mobile Money Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center h-13 sm:h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all px-4 gap-3">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 select-none">
                      +256
                    </span>
                    <input
                      type="tel"
                      required
                      value={momoPhone.replace(/^\+?256\s*|^0/, '')}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9\s]/g, '');
                        setMomoPhone(clean);
                      }}
                      placeholder="772 987 654"
                      className="flex-1 h-full bg-transparent border-0 text-base font-bold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 tracking-wider"
                    />
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed pt-0.5">
                    A secure USSD PIN prompt will appear automatically on this handset to authorize payment.
                  </p>
                </div>
              </div>

              {/* Payment Processing Buttons */}
              <div
                className="pt-6 border-t border-slate-100 dark:border-slate-800"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-4.5 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        Pushing {momoProvider} USSD PIN Prompt... {stkPromptCountdown ? `(${stkPromptCountdown}s)` : ''}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>Pay {formatUGX(grandTotalUgx)} via {momoProvider} MoMo</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('cart')}
                  className="w-full py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer text-center"
                >
                  ← Back to Cart Items
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Order Review Recap */}
          <div
            className="lg:col-span-4"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2cm' }}
          >
            <div
              className="rounded-3xl bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800/80 shadow-xs transition-colors"
              style={{ padding: '2.2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}
            >
              <h3 className="text-lg font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Summary of Order
              </h3>

              <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {item.quantity}x {item.drug.brandName}
                      </p>
                      <p className="text-[11px] text-slate-400">{item.pharmacyName}</p>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {formatUGX(item.unitPriceUgx * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">{formatUGX(cartSubtotalUgx)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">{formatUGX(deliveryFeeUgx)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Discount</span>
                    <span className="whitespace-nowrap shrink-0">-{formatUGX(appliedDiscount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                  <span>Total Due</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base font-black whitespace-nowrap shrink-0">
                    {formatUGX(grandTotalUgx)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. STEP 3 CONTENT: ORDER CONFIRMED & DISPATCH TRACKING ── */}
      {currentStep === 'confirmed' && confirmedOrder && (
        <div
          className="max-w-3xl mx-auto w-full animate-in zoom-in-95 duration-200"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.8cm' }}
        >
          <div
            className="rounded-3xl bg-white dark:bg-[#0e1d33] border border-slate-200/90 dark:border-slate-800/80 shadow-xl text-center transition-colors"
            style={{ padding: '1.2cm', display: 'flex', flexDirection: 'column', gap: '0.8cm' }}
          >
            {/* Success Badge */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2.5">
              <span className="px-4 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-block">
                Payment Authorized &amp; Verified
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Order #{confirmedOrder.orderNumber} Confirmed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Payment of <strong className="text-slate-900 dark:text-white">{formatUGX(confirmedOrder.totalOrderAmountUgx)}</strong> via {confirmedOrder.paymentMethod} has been received. Our licensed pharmacist is packing your items for immediate dispatch.
              </p>
            </div>

            {/* OTP Handoff Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/50 border-2 border-emerald-500/40 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  Delivery Security Code (OTP)
                </span>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Provide this 4-digit code to rider <strong>{confirmedOrder.assignedCourierName}</strong> to receive package.
                </p>
              </div>

              <div className="px-7 py-3.5 rounded-2xl bg-white dark:bg-[#0B131F] border border-emerald-400/50 text-center shrink-0 shadow-md">
                <span className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                  {confirmedOrder.deliveryOtpCode}
                </span>
              </div>
            </div>

            {/* Courier & Dispatch Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assigned Rider</span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5">{confirmedOrder.assignedCourierName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{confirmedOrder.courierVehiclePlate || 'Express Courier'}</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estimated Delivery</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1.5">~25 Minutes</p>
                <p className="text-xs text-slate-500 mt-0.5">Express Dispatch</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Dispensing Branch</span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5 truncate">{confirmedOrder.pharmacyName}</p>
                <p className="text-xs text-slate-500 mt-0.5">Verified Stock</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={() => onNavigateTab('orders')}
                className="w-full sm:flex-1 py-4.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <Truck className="w-5 h-5" />
                <span>Track Live Order &amp; GPS</span>
              </button>

              <button
                onClick={() => {
                  setCurrentStep('cart');
                  onNavigateTab('search');
                }}
                className="w-full sm:w-auto px-7 py-4.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
