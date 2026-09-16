import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Printer,
  Sparkles,
  Zap,
  ArrowLeft,
  AlertCircle,
  Clock,
  QrCode,
  Radio,
  FileCode2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Wifi,
  Battery,
} from 'lucide-react';
import { PackageTier, BillingCycle } from '../../types';
import { UseAuthReturn } from '../../hooks/useAuth';
import { recordSubscriptionPayment } from '../../services/paymentOrchestrationService';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: PackageTier;
  billingCycle: BillingCycle;
  auth: UseAuthReturn;
  onSuccess?: () => void;
}

type PaymentTab = 'momo' | 'card' | 'apiDocs';
type MobileNetwork = 'MTN' | 'AIRTEL';

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  tier,
  billingCycle,
  auth,
  onSuccess,
}) => {
  // ─── Payment Options State ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<PaymentTab>('momo');
  const [momoNetwork, setMomoNetwork] = useState<MobileNetwork>('MTN');
  const [phoneNumber, setPhoneNumber] = useState(auth.user?.phone || '');
  const [accountName, setAccountName] = useState(auth.user?.fullName || '');

  // ─── Card State ───────────────────────────────────────────────────────────
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(auth.user?.fullName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // ─── Flow & Simulation State ──────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSimPrompt, setShowSimPrompt] = useState(false);
  const [activeReferenceId, setActiveReferenceId] = useState<string>('');
  const [ussdPin, setUssdPin] = useState('');
  const [ussdTimer, setUssdTimer] = useState(60);
  const [simStep, setSimStep] = useState<'prompt' | 'verifying' | 'deducted'>('prompt');
  const [deductedBalance, setDeductedBalance] = useState<number>(348200);

  const [showCardOtp, setShowCardOtp] = useState(false);
  const [cardOtp, setCardOtp] = useState('');
  const [cardOtpVerifying, setCardOtpVerifying] = useState(false);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    invoiceNo: string;
    refNo: string;
    amount: number;
    channel: string;
    providerRef: string;
    paidAt: string;
    taxAmount: number;
    nextBillingDate: string;
  } | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Calculate pricing
  const yearlyMultiplier = 10;
  const basePrice =
    billingCycle === 'yearly'
      ? tier.discountPriceUgx * yearlyMultiplier
      : tier.discountPriceUgx;
  const originalPrice =
    billingCycle === 'yearly'
      ? tier.originalPriceUgx * yearlyMultiplier
      : tier.originalPriceUgx;

  const formatUgx = (amt: number) => `UGX ${amt.toLocaleString('en-UG')}`;

  // Smart carrier prefix detection
  useEffect(() => {
    const clean = phoneNumber.replace(/\D/g, '');
    if (
      clean.startsWith('25677') ||
      clean.startsWith('25678') ||
      clean.startsWith('25676') ||
      clean.startsWith('077') ||
      clean.startsWith('078') ||
      clean.startsWith('076')
    ) {
      setMomoNetwork('MTN');
    } else if (
      clean.startsWith('25670') ||
      clean.startsWith('25675') ||
      clean.startsWith('25674') ||
      clean.startsWith('070') ||
      clean.startsWith('075') ||
      clean.startsWith('074')
    ) {
      setMomoNetwork('AIRTEL');
    }
  }, [phoneNumber]);

  // Real-time SIM Prompt Countdown & Polling
  useEffect(() => {
    let interval: any;
    let pollInterval: any;
    if (showSimPrompt && ussdTimer > 0 && simStep === 'prompt') {
      interval = setInterval(() => {
        setUssdTimer((prev) => prev - 1);
      }, 1000);

      pollInterval = setInterval(async () => {
        if (activeReferenceId) {
          try {
            const res = await fetch(`/api/payments/status/${activeReferenceId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.status === 'SUCCESSFUL') {
                setSimStep('deducted');
                clearInterval(pollInterval);
                clearInterval(interval);
                
                const invoiceNo = `INV-ZR-${Date.now().toString().slice(-6)}`;
                const now = new Date();
                const nextDate = new Date();
                if (billingCycle === 'yearly') {
                  nextDate.setFullYear(now.getFullYear() + 1);
                } else {
                  nextDate.setMonth(now.getMonth() + 1);
                }
                
                setReceiptData({
                  invoiceNo,
                  refNo: data.referenceId,
                  amount: data.amountUgx,
                  channel: `${momoNetwork === 'MTN' ? 'MTN Mobile Money' : 'Airtel Money'} (${phoneNumber})`,
                  providerRef: data.providerTxId || data.referenceId,
                  paidAt: now.toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short' }),
                  taxAmount: Math.round(data.amountUgx * (18 / 118)),
                  nextBillingDate: nextDate.toLocaleDateString('en-UG', { dateStyle: 'medium' }),
                });
                
                setTimeout(() => {
                  setShowSimPrompt(false);
                  setIsProcessing(false);
                  setPaymentSuccess(true);
                }, 2000);
              } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
                alert('Payment failed or was rejected by the user.');
                setShowSimPrompt(false);
                setIsProcessing(false);
                clearInterval(pollInterval);
                clearInterval(interval);
              }
            }
          } catch (err) {
            console.error('Polling error:', err);
          }
        }
      }, 3000);
    } else if (ussdTimer === 0 && showSimPrompt && simStep === 'prompt') {
      setShowSimPrompt(false);
      setIsProcessing(false);
      alert('SIM Toolkit session expired. Please retry.');
    }
    return () => { clearInterval(interval); clearInterval(pollInterval); };
  }, [showSimPrompt, ussdTimer, simStep, activeReferenceId, momoNetwork, phoneNumber, billingCycle]);

  if (!isOpen) return null;

  // ─── Format Helpers ───────────────────────────────────────────────────────
  const formatCardNumber = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const getCardBrand = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'Mastercard';
    if (cleaned.startsWith('34') || cleaned.startsWith('37')) return 'Amex';
    return 'Universal Card';
  };

  const formatExpiry = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) return `${raw.slice(0, 2)}/${raw.slice(2)}`;
    return raw;
  };

  // ─── Mobile Money Trigger (Dispatches STK Push to SIM via Backend) ────────
  const handleInitiateMomo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim() || cleanPhone.length < 9) {
      alert('Please enter a valid Ugandan phone number (e.g. 0772 123 456).');
      return;
    }

    setIsProcessing(true);
    setSimStep('prompt');
    setUssdTimer(60);

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: momoNetwork === 'MTN' ? 'MTN_MOMO' : 'AIRTEL_MONEY',
          phoneNumber: cleanPhone.startsWith('256') ? cleanPhone : `256${cleanPhone.replace(/^0/, '')}`,
          amountUgx: basePrice,
          tierId: tier.id,
          tierName: tier.name,
          billingCycle,
          payerName: accountName || auth.user?.fullName,
          payerEmail: auth.user?.email,
          userId: auth.user?.id
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActiveReferenceId(data.referenceId);
        setShowSimPrompt(true);
      } else {
        alert(data.error || 'Failed to initiate payment.');
        setIsProcessing(false);
      }
    } catch (err) {
      alert('Network error while initiating payment.');
      setIsProcessing(false);
    }
  };

  // ─── Card Payment Trigger (Redirects to Flutterwave Standard) ─────────────
  const handleInitiateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'CARD_VISA_MC',
          amountUgx: basePrice,
          tierId: tier.id,
          tierName: tier.name,
          billingCycle,
          payerName: cardHolder || auth.user?.fullName,
          payerEmail: auth.user?.email,
          userId: auth.user?.id
        }),
      });

      const data = await response.json();
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to initiate card checkout.');
        setIsProcessing(false);
      }
    } catch (err) {
      alert('Network error while initiating payment.');
      setIsProcessing(false);
    }
  };

  // ─── Final Activation Handshake ───────────────────────────────────────────
  const handleFinalizeAndEnter = () => {
    if (receiptData) {
      auth.activateSubscription(tier.id, billingCycle, {
        method: receiptData.channel,
        ref: receiptData.providerRef,
        amount: receiptData.amount,
      });
    } else {
      auth.activateSubscription(tier.id, billingCycle);
    }
    if (onSuccess) onSuccess();
    onClose();
  };

  // Print Receipt Handler
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      {/* Container */}
      <div
        className="relative w-full max-w-4xl bg-[#081325] border border-white/10 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden my-auto"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Glow ambient effects */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-[#0A182F]/70 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing || paymentSuccess}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40"
              title="Return to plans"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                  ZenithRx Secure Checkout
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-slate-400">
                  National Payment Gateway Integration
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {paymentSuccess ? 'Payment Confirmed & Active' : 'Choose Payment Method'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!paymentSuccess && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'apiDocs' ? 'momo' : 'apiDocs')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'apiDocs'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="View telecom APIs and technical architecture"
              >
                <FileCode2 className="w-4 h-4" />
                <span className="hidden sm:inline">APIs & Architecture</span>
              </button>
            )}

            {!paymentSuccess && (
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ─── SUCCESS VIEW / TAX INVOICE RECEIPT ────────────────────────── */}
        {paymentSuccess && receiptData ? (
          <div className="p-6 sm:p-10 relative z-10 animate-fadeIn">
            {/* Celebration Banner */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-4 animate-bounce">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Subscription Successfully Activated
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Welcome to ZenithRx {tier.name}
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
                Your payment was received and verified. Your pharmacy instance is fully provisioned and ready for operations.
              </p>
            </div>

            {/* Official Printable Tax Receipt Card */}
            <div
              ref={receiptRef}
              className="bg-[#0B1E36] border border-white/15 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl relative overflow-hidden"
            >
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      ZENITHRX ENTERPRISE
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                      URA E-INVOICE
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Quantum Networks Ltd · TIN: 1009842183 · Kampala, Uganda
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-slate-400 text-[11px] block">Invoice No</span>
                  <span className="text-white font-mono font-bold text-sm tracking-wider">
                    {receiptData.invoiceNo}
                  </span>
                </div>
              </div>

              {/* Receipt Body Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6 text-xs border-b border-white/10">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Subscriber</span>
                  <span className="text-white font-bold block truncate">{auth.user?.fullName || 'Supervising Pharmacist'}</span>
                  <span className="text-slate-400 text-[11px] truncate block">{auth.user?.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Selected Plan</span>
                  <span className="text-sky-400 font-bold block">{tier.name} ({billingCycle.toUpperCase()})</span>
                  <span className="text-slate-400 text-[11px]">Valid until: {receiptData.nextBillingDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="text-white font-bold block truncate">{receiptData.channel}</span>
                  <span className="text-slate-400 font-mono text-[10px] truncate block">Ref: {receiptData.providerRef}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="text-slate-300 font-medium block">{receiptData.paidAt}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">VAT (18% Incl.)</span>
                  <span className="text-slate-300 font-medium block">{formatUgx(receiptData.taxAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SETTLED
                  </span>
                </div>
              </div>

              {/* Total Row */}
              <div className="flex items-center justify-between pt-5">
                <div>
                  <span className="text-slate-400 text-xs block">Total Amount Deducted</span>
                  <span className="text-slate-500 text-[11px]">Authorized through National Payment Gateway</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {formatUgx(receiptData.amount)}
                  </span>
                </div>
              </div>

              {/* QR Verification Barcode */}
              <div className="mt-6 pt-4 border-t border-dashed border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-sky-400" />
                  <span>URA Verification Hash: <strong className="font-mono text-slate-300">{receiptData.refNo}</strong></span>
                </div>
                <span className="text-emerald-400 font-bold">● Fiscalized</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <button
                onClick={handlePrintReceipt}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 border border-white/15 text-slate-200 text-xs font-bold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print / Save Tax Invoice
              </button>

              <button
                onClick={handleFinalizeAndEnter}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-white text-sm font-black shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Launch Pharmacy Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : activeTab === 'apiDocs' ? (
          /* ─── TAB: TELECOM & PAYMENT APIS ARCHITECTURE ──────────────────── */
          <div className="p-6 sm:p-8 space-y-6 relative z-10 max-h-[75vh] overflow-y-auto">
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                Integration Architecture & Specifications
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Payment APIs & Telecom SIM Protocols
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                ZenithRx connects to the Bank of Uganda National Payment Systems (NPS) regulated infrastructure to trigger SIM STK pushes and settle card payments.
              </p>
            </div>

            {/* API 1: MTN MoMo Open API */}
            <div className="p-5 rounded-2xl bg-[#0B1E36] border border-amber-400/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFCC00] text-black font-black flex items-center justify-center text-xs">
                    MTN
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">MTN MoMo Open API (Collection v1.0 / v2.0)</h4>
                    <span className="text-[10px] text-amber-300/80 font-mono">POST /collection/v1_0/requesttopay</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-bold border border-amber-400/20">
                  Direct USSD / STK Push
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dispatches an asynchronous SIM Toolkit (STK) prompt directly to the subscriber's phone screen. The telecom network pauses other operations on the phone to display the Class 0 PIN request. Once the PIN is verified at the telecom HLR/VLR, funds are debited from the subscriber's MoMo wallet and credited to Quantum Networks Ltd.
              </p>
              <div className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-300 border border-white/5 space-y-1">
                <p><span className="text-sky-400">Endpoint:</span> https://proxy.momoapi.mtn.com/collection/v1_0/requesttopay</p>
                <p><span className="text-sky-400">Headers:</span> X-Reference-Id (UUID v4), Ocp-Apim-Subscription-Key, X-Target-Environment</p>
                <p><span className="text-sky-400">Callback:</span> /api/payments/webhook/mtn_momo (Instant Payment Notification)</p>
              </div>
            </div>

            {/* API 2: Airtel Money Africa API */}
            <div className="p-5 rounded-2xl bg-[#0B1E36] border border-red-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E60000] text-white font-black flex items-center justify-center text-xs">
                    airtel
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Airtel Money Africa Developer API (Collections)</h4>
                    <span className="text-[10px] text-red-300/80 font-mono">POST /merchant/v1/payments/</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 text-[10px] font-bold border border-red-400/20">
                  Direct USSD Push
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connects through Airtel Uganda's payment gateway via OAuth2 Bearer Tokens. Pushes a native prompt to the subscriber's Airtel SIM for authorization of the exact subscription fee.
              </p>
              <div className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-300 border border-white/5 space-y-1">
                <p><span className="text-red-400">Endpoint:</span> https://openapi.airtel.africa/merchant/v1/payments/</p>
                <p><span className="text-red-400">Headers:</span> X-Country: UG, X-Currency: UGX, Authorization: Bearer &lt;token&gt;</p>
                <p><span className="text-red-400">Callback:</span> /api/payments/webhook/airtel_money</p>
              </div>
            </div>

            {/* API 3: Pesapal 3.0 & Card Gateway */}
            <div className="p-5 rounded-2xl bg-[#0B1E36] border border-sky-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black flex items-center justify-center text-xs">
                    VISA
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Pesapal 3.0 API / Bank of Uganda National Gateway</h4>
                    <span className="text-[10px] text-sky-300/80 font-mono">POST /api/Transactions/SubmitOrderRequest</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-400 text-[10px] font-bold border border-sky-400/20">
                  PCI-DSS Level 1 & 3DS 2.0
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unified East African aggregator licensed by the Bank of Uganda. Handles Visa, Mastercard, American Express, and telecom routing with 3D-Secure 2.0 fraud prevention and instantaneous URA EFRIS fiscalized reconciliation.
              </p>
              <div className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-300 border border-white/5 space-y-1">
                <p><span className="text-sky-400">Auth Token:</span> POST /api/Auth/RequestToken</p>
                <p><span className="text-sky-400">Order Submit:</span> POST /api/Transactions/SubmitOrderRequest</p>
                <p><span className="text-sky-400">Status Check:</span> GET /api/Transactions/GetTransactionStatus?orderTrackingId=...</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('momo')}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Return to Payment Checkout
              </button>
            </div>
          </div>
        ) : (
          /* ─── CHECKOUT FORM VIEW ────────────────────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10">
            {/* Left Column: Order Summary & Plan Information (5 cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-[#071120] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Order Summary
                </span>

                {/* Plan Card */}
                <div className="mt-4 p-5 rounded-2xl bg-[#0B1E36] border border-sky-500/30 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-wider">
                        {tier.name} Tier
                      </span>
                      <h3 className="text-xl font-black text-white mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {tier.name}
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white/5 text-slate-300 border border-white/10 capitalize">
                      {billingCycle}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    {tier.tagline}
                  </p>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-baseline justify-between">
                    <span className="text-slate-400 text-xs">Total Payable:</span>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {formatUgx(basePrice)}
                      </div>
                      {originalPrice > basePrice && (
                        <div className="text-xs text-slate-500 line-through">
                          {formatUgx(originalPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  {billingCycle === 'yearly' && (
                    <div className="mt-2 text-right">
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ✨ 2 Months Free (Save 17%)
                      </span>
                    </div>
                  )}
                </div>

                {/* What you get */}
                <div className="mt-6 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Key Features Included:
                  </span>
                  {tier.features.slice(0, 5).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantees */}
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>30-Day Money Back Guarantee & 99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Lock className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>256-Bit Bank Grade SSL & NDA Compliant</span>
                </div>
              </div>
            </div>

            {/* Right Column: Payment Method Selection & Action (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8">
              {/* Tabs Switcher */}
              <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-black/40 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('momo')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === 'momo'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Money</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${activeTab === 'momo' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'}`}>
                    SIM STK Push
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === 'card'
                      ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Debit / Credit Card</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${activeTab === 'card' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'}`}>
                    Universal
                  </span>
                </button>
              </div>

              {/* ─── TAB 1: MOBILE MONEY (MTN & AIRTEL) ───────────────────── */}
              {activeTab === 'momo' && (
                <form onSubmit={handleInitiateMomo} className="space-y-5 animate-fadeIn">
                  {/* Carrier Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Choose Telecom Network (SIM Card Provider)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* MTN Option */}
                      <button
                        type="button"
                        onClick={() => setMomoNetwork('MTN')}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          momoNetwork === 'MTN'
                            ? 'bg-[#FFCC00]/10 border-[#FFCC00] shadow-lg shadow-[#FFCC00]/10'
                            : 'bg-[#0B1E36] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#FFCC00] text-black font-black flex items-center justify-center text-xs shadow-md">
                            MTN
                          </div>
                          <div>
                            <span className="text-white font-bold text-xs block">MTN MoMo</span>
                            <span className="text-slate-400 text-[10px]">077, 078, 076</span>
                          </div>
                        </div>
                        {momoNetwork === 'MTN' && (
                          <div className="w-5 h-5 rounded-full bg-[#FFCC00] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-black" />
                          </div>
                        )}
                      </button>

                      {/* Airtel Option */}
                      <button
                        type="button"
                        onClick={() => setMomoNetwork('AIRTEL')}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          momoNetwork === 'AIRTEL'
                            ? 'bg-[#E60000]/10 border-[#E60000] shadow-lg shadow-[#E60000]/10'
                            : 'bg-[#0B1E36] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#E60000] text-white font-black flex items-center justify-center text-xs shadow-md">
                            airtel
                          </div>
                          <div>
                            <span className="text-white font-bold text-xs block">Airtel Money</span>
                            <span className="text-slate-400 text-[10px]">070, 075, 074</span>
                          </div>
                        </div>
                        {momoNetwork === 'AIRTEL' && (
                          <div className="w-5 h-5 rounded-full bg-[#E60000] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {momoNetwork === 'MTN' ? 'MTN' : 'Airtel'} Mobile Money Phone Number (Where SIM Card is placed)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-xs font-bold">🇺🇬 +256</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="772 123 456"
                        className="w-full pl-20 pr-4 py-3 bg-[#0B1E36] border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>An instant SIM Toolkit prompt will pop up on your mobile handset to enter your PIN.</span>
                    </p>
                  </div>

                  {/* Registered Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Subscriber / Pharmacy Account Name
                    </label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. Dr. Elvis Sekyanzi / Mulago Care"
                      className="w-full px-4 py-3 bg-[#0B1E36] border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  {/* Pay Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={`w-full py-4 rounded-xl font-black text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 ${
                        momoNetwork === 'MTN'
                          ? 'bg-gradient-to-r from-[#FFCC00] to-amber-400 text-black hover:brightness-110 shadow-[#FFCC00]/20'
                          : 'bg-gradient-to-r from-[#E60000] to-red-500 text-white hover:brightness-110 shadow-[#E60000]/20'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Send SIM Prompt & Deduct {formatUgx(basePrice)}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <p className="text-center text-slate-500 text-[10px] mt-2">
                      Powered by MTN MoMo OpenAPI & Airtel Money Africa Direct Collection Gateway
                    </p>
                  </div>
                </form>
              )}

              {/* ─── TAB 2: CREDIT / DEBIT CARD (ANY KIND) ────────────────── */}
              {activeTab === 'card' && (
                <form onSubmit={handleInitiateCard} className="space-y-4 animate-fadeIn">
                  {/* Interactive Live 3D Holographic Card Preview */}
                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="relative w-full h-44 sm:h-48 rounded-2xl p-5 bg-gradient-to-br from-[#122B4D] via-[#0D2038] to-[#0A172A] border border-white/20 shadow-2xl text-white flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-transform hover:scale-[1.01]"
                  >
                    {/* Glass gloss effect */}
                    <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl" />
                    <div className="pointer-events-none absolute -bottom-10 -left-10 w-36 h-36 bg-sky-400/10 rounded-full blur-xl" />

                    {!isCardFlipped ? (
                      <>
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-3">
                            {/* Chip */}
                            <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 to-amber-500 flex items-center justify-center shadow-inner">
                              <div className="w-6 h-4 border border-amber-800/40 rounded-sm" />
                            </div>
                            {/* Contactless symbol */}
                            <svg className="w-5 h-5 text-slate-300 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M8.5 10a4 4 0 0 1 0 4" />
                              <path d="M12 7a8 8 0 0 1 0 10" />
                              <path d="M15.5 4a12 12 0 0 1 0 16" />
                            </svg>
                          </div>
                          <span className="text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-white/10 border border-white/20">
                            {getCardBrand(cardNumber)}
                          </span>
                        </div>

                        {/* Card Number display */}
                        <div className="relative z-10 my-auto">
                          <div className="text-lg sm:text-xl font-mono tracking-widest text-white/90 drop-shadow">
                            {cardNumber ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'}
                          </div>
                        </div>

                        <div className="flex items-end justify-between relative z-10 text-xs">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                              Cardholder Name
                            </span>
                            <span className="font-bold uppercase tracking-wider text-slate-100 truncate block max-w-[180px]">
                              {cardHolder || 'Dr. Pharmacist'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                              Expires
                            </span>
                            <span className="font-mono font-bold text-slate-100">
                              {cardExpiry || 'MM/YY'}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Card Back (CVV strip) */
                      <div className="h-full flex flex-col justify-between py-2">
                        <div className="w-full h-8 bg-black/80 -mx-5 px-5 my-1" />
                        <div className="flex items-center justify-end gap-3 px-4">
                          <span className="text-[10px] text-slate-400">CVV/CVC:</span>
                          <div className="w-14 py-1.5 bg-white text-black font-mono font-black text-center rounded text-xs shadow-inner">
                            {cardCvv || '•••'}
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 text-center">
                          Secured by 256-bit encryption. Tap to flip back.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Form Inputs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Card Number (Any Visa, MasterCard, Amex, UnionPay)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        onFocus={() => setIsCardFlipped(false)}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full px-4 py-2.5 bg-[#0B1E36] border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-400 transition-colors"
                      />
                      <div className="absolute right-3 top-2.5">
                        <CreditCard className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Cardholder Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        onFocus={() => setIsCardFlipped(false)}
                        placeholder="Name as on card"
                        className="w-full px-3.5 py-2.5 bg-[#0B1E36] border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-400 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Expires
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          onFocus={() => setIsCardFlipped(false)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2.5 bg-[#0B1E36] border border-white/10 rounded-xl text-white text-xs font-mono text-center placeholder:text-slate-600 focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          onFocus={() => setIsCardFlipped(true)}
                          onBlur={() => setIsCardFlipped(false)}
                          placeholder="•••"
                          className="w-full px-3 py-2.5 bg-[#0B1E36] border border-white/10 rounded-xl text-white text-xs font-mono text-center placeholder:text-slate-600 focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-white shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Pay {formatUgx(basePrice)} with Card</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <div className="flex items-center justify-center gap-4 text-slate-500 text-[10px] mt-2">
                      <span>✓ Visa</span>
                      <span>✓ MasterCard</span>
                      <span>✓ American Express</span>
                      <span>✓ UnionPay</span>
                      <span>✓ 3D Secure 2.0</span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ─── MODAL 1: PHYSICAL SMARTPHONE SIM TOOLKIT PROMPT (WHERE SIM IS PLACED) ─── */}
        {showSimPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="relative flex flex-col items-center max-w-md w-full">
              {/* Context Banner */}
              <div className="w-full mb-3 p-3 rounded-2xl bg-[#0B1E36] border border-sky-500/30 text-center shadow-lg">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-400 mb-1">
                  <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
                  <span>SIM STK PUSH DISPATCHED TO HANDSET</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Check your physical phone screen for <strong className="text-white">{phoneNumber}</strong>. The popup below is what is showing on your phone screen right now.
                </p>
              </div>

              {/* Realistic Mobile Device Frame */}
              <div className="w-full max-w-[340px] bg-[#0E1B2E] border-4 border-slate-700/80 rounded-[44px] p-3.5 shadow-2xl shadow-black relative overflow-hidden">
                {/* Phone Speaker Notch & Camera */}
                <div className="w-28 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                  <div className="w-8 h-1 bg-slate-800 rounded-full" />
                </div>

                {/* Handset Screen Display */}
                <div className="w-full min-h-[440px] bg-slate-900 rounded-[32px] p-4 flex flex-col justify-between relative overflow-hidden border border-white/5">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-2 border-b border-white/5">
                    <span className="font-bold text-white">
                      {momoNetwork === 'MTN' ? 'MTN-UG' : 'Airtel-UG'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-white" />
                      <Battery className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>

                  {/* Center Content: Native SIM Toolkit Flash Message */}
                  {simStep === 'prompt' && (
                    <div className="my-auto animate-fadeIn">
                      <div className="bg-[#18273D] border-2 border-amber-400/80 rounded-2xl p-4 shadow-2xl shadow-black/80 text-center space-y-3">
                        {/* SIM Prompt Header */}
                        <div className="flex items-center justify-center gap-2 border-b border-white/10 pb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              momoNetwork === 'MTN' ? 'bg-[#FFCC00] text-black' : 'bg-[#E60000] text-white'
                            }`}
                          >
                            {momoNetwork === 'MTN' ? 'MTN SIM Toolkit' : 'Airtel SIM Tool'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">⏱ {ussdTimer}s</span>
                        </div>

                        {/* USSD Flash Message */}
                        <div className="text-left text-xs space-y-1.5 font-mono text-slate-200">
                          <p className="font-bold text-white text-xs">
                            Pay {formatUgx(basePrice)} to QUANTUM NETWORKS LTD for ZenithRx {tier.name}?
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Ref: <span className="text-amber-400">{activeReferenceId || 'ZR-SUB-01'}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Fee: <span className="text-emerald-400">UGX 0</span>
                          </p>
                        </div>

                        {/* PIN Entry Field Removed - Polling instead */}
                        <div className="pt-1">
                          <label className="block text-[11px] font-bold text-slate-300 mb-1.5 animate-pulse text-amber-400">
                            Awaiting PIN entry on handset...
                          </label>
                        </div>

                        {/* Native SIM Buttons */}
                        <div className="grid grid-cols-1 gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSimPrompt(false);
                              setIsProcessing(false);
                            }}
                            className="py-2.5 rounded-xl bg-white/10 text-slate-300 text-xs font-bold hover:bg-white/15 cursor-pointer"
                          >
                            Cancel Payment
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 text-center mt-3">
                        💡 Check your physical phone and enter your PIN to approve.
                      </p>
                    </div>
                  )}

                  {simStep === 'verifying' && (
                    <div className="my-auto text-center space-y-4 py-8 animate-fadeIn">
                      <div className="w-12 h-12 rounded-full border-3 border-amber-400 border-t-transparent animate-spin mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Contacting Telecom Base Station...</h4>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                          Verifying SIM credentials and deducting {formatUgx(basePrice)} from mobile wallet.
                        </p>
                      </div>
                    </div>
                  )}

                  {simStep === 'deducted' && (
                    <div className="my-auto text-center space-y-3 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl animate-fadeIn">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-black text-white">SIM Wallet Deducted!</h4>
                      <p className="text-[11px] text-slate-300 font-mono">
                        UGX {basePrice.toLocaleString()} paid to QUANTUM NETWORKS LTD.
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Remaining Bal: UGX {deductedBalance.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Phone Home Bar */}
                  <div className="w-24 h-1 bg-white/20 rounded-full mx-auto mt-2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 2: 3D SECURE OTP FOR CARD HAS BEEN REMOVED (FLUTTERWAVE HANDLES THIS VIA REDIRECT) ─── */}
      </div>
    </div>
  );
};
