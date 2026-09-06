import React, { useState } from 'react';
import { ModuleTab, ClientSubscription, TierName } from '../types';
import { applyPackageTierToClient } from '../lib/packageTierRules';
import {
  FileText,
  Package,
  AlertTriangle,
  Users,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Sliders,
  CreditCard,
  UserCheck,
  Layers,
  Activity,
  BadgeCheck,
  Check,
  Zap,
  Gift,
  Shield,
  X,
  Building2,
  UserCog,
  Lock,
  ChevronRight,
  MessageSquarePlus,
  MessageCircle
} from 'lucide-react';

import pharmacistImg from '../assets/images/pharmacist_portrait_1784717590593.jpg';

interface PromoBannerViewProps {
  onSelectFeature: (tab: ModuleTab) => void;
  openBarcodeScanner: () => void;
  activeClient: ClientSubscription;
  setActiveClient: (client: ClientSubscription) => void;
  onOpenFeedbackModal?: (tab?: 'submit' | 'history') => void;
}

interface FeatureCard {
  title: string;
  tab: ModuleTab;
  badge: string;
  badgeColor: string;
  requiredTier: TierName;
  featureFlagKey: keyof ClientSubscription['allowedFeatures'];
  imageUrl: string;
  description: string;
  icon: React.ReactNode;
}

export interface DetailedPlanCard {
  id: TierName;
  name: string;
  tagline: string;
  bestFor: string;
  originalPriceUgx: number;
  discountPriceUgx: number;
  maxUsers: number;
  isPopular?: boolean;
  badge: string;
  badgeColor: string;
  borderColor: string;
  bgGradient: string;
  features: string[];
  detailedDescription: string;
}

export const PromoBannerView: React.FC<PromoBannerViewProps> = ({
  onSelectFeature,
  openBarcodeScanner,
  activeClient,
  setActiveClient,
  onOpenFeedbackModal,
}) => {
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const [selectedPlanModal, setSelectedPlanModal] = useState<DetailedPlanCard | null>(null);
  const [lockedFeatureModal, setLockedFeatureModal] = useState<FeatureCard | null>(null);
  const [planActivationSuccess, setPlanActivationSuccess] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContact(label);
    setTimeout(() => setCopiedContact(null), 2500);
  };

  // Subscription Package Plans Data
  const planCards: DetailedPlanCard[] = [
    {
      id: 'Starter',
      name: 'Starter Package',
      tagline: 'Perfect for small community dispensaries & retail drug shops',
      bestFor: 'Single-location community drug shops, clinic dispensaries, and retail drug counters requiring fast sales receipting and basic stock control.',
      originalPriceUgx: 50000,
      discountPriceUgx: 40000,
      maxUsers: 5,
      badge: 'Starter Tier',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
      borderColor: 'border-sky-800/60 hover:border-sky-400',
      bgGradient: 'bg-gradient-to-b from-[#0B1E36] to-[#0A182B]',
      features: [
        'Up to 5 active staff user accounts',
        'Retail POS cashier & barcode checkout',
        'Basic stock inventory & shelf tracking',
        'Standard daily cash drawer balancing',
        'Thermal receipt printing support'
      ],
      detailedDescription: 'The Starter Package is tailored for independent community drug shops and single-dispensary retail counters. It delivers fast barcode scanning, automated receipt printing, cash drawer balancing, and basic stock tracking for up to 5 staff members.'
    },
    {
      id: 'Professional',
      name: 'Professional Package',
      tagline: 'For fast-growing retail pharmacies with high prescription turnover',
      bestFor: 'Busy community pharmacies, multi-counter retail stores, and growing dispensaries managing FEFO stock expiry risks and automated supplier reorders.',
      originalPriceUgx: 100000,
      discountPriceUgx: 72000,
      maxUsers: 15,
      isPopular: true,
      badge: '⭐ MOST POPULAR',
      badgeColor: 'bg-[#00D8F6]/20 text-[#00D8F6] border-[#00D8F6]/50',
      borderColor: 'border-[#00D8F6]/80 shadow-lg shadow-[#00D8F6]/10',
      bgGradient: 'bg-gradient-to-b from-[#0C2B4D] via-[#0B233F] to-[#08172B]',
      features: [
        'Up to 15 active staff user accounts',
        '30/60/90-Day FEFO stock expiry engine',
        'Automated supplier re-ordering PO generation',
        'Patient chronic directory & refill history',
        'Profit margin analytics & sales growth reports',
        'Priority technical support & setup'
      ],
      detailedDescription: 'Our flagship Professional Package is engineered for high-turnover retail pharmacies. It unlocks automated FEFO batch tracking, automated supplier PO generation upon stock depletion, patient chronic refill reminders, sales margin breakdowns, and up to 15 staff accounts.'
    },
    {
      id: 'Enterprise',
      name: 'Enterprise Package',
      tagline: 'For hospital pharmacies, wholesale depots & multi-branch chains',
      bestFor: 'Hospital pharmacies, wholesale drug distributors, and multi-branch chains needing AI clinical OCR, NDA compliance sync, and insurance claims.',
      originalPriceUgx: 180000,
      discountPriceUgx: 104000,
      maxUsers: 25,
      badge: 'Enterprise Grade',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      borderColor: 'border-purple-800/60 hover:border-purple-400',
      bgGradient: 'bg-gradient-to-b from-[#161B3B] to-[#0A0D21]',
      features: [
        'Up to 25 active staff user accounts (Expandable)',
        'AI Clinical OCR prescription reader & safety engine',
        'Multi-location stock transfers & warehouse sync',
        'Direct Uganda NDA registry lookup & audit logs',
        'Insurance co-pay batch claims processor',
        'Dedicated 24/7 technical support & SLA'
      ],
      detailedDescription: 'The Enterprise Package provides comprehensive operational power for hospital pharmacies, wholesale drug distributors, and pharmacy chains. Features AI clinical OCR prescription processing, multi-branch stock transfers, direct Uganda NDA compliance lookup, and 25 user seats.'
    },
    {
      id: 'Custom Tailored',
      name: 'Custom Tailored Package',
      tagline: 'For large multi-branch networks requiring dedicated cloud SLA',
      bestFor: 'National pharmacy chains, government health institutions, and multi-tenant headquarters requiring custom ERP integration & unlimited user seats.',
      originalPriceUgx: 250000,
      discountPriceUgx: 150000,
      maxUsers: 100,
      badge: 'Custom SLA',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      borderColor: 'border-amber-800/60 hover:border-amber-400',
      bgGradient: 'bg-gradient-to-b from-[#1C162E] to-[#0D0B1C]',
      features: [
        'Unlimited staff user seats & branch locations',
        'Custom ERP & local database API connectors',
        'Dedicated isolated cloud server infrastructure',
        'Custom executive BI dashboard & export schemas',
        'Assigned senior technical account manager',
        'Guaranteed 99.99% uptime SLA contract'
      ],
      detailedDescription: 'Designed for enterprise multi-tenant networks and hospital groups. Includes unlimited user seats, custom ERP/database connectors, dedicated cloud hosting, tailored reporting schemas, and an assigned account manager.'
    }
  ];

  const featureCards: FeatureCard[] = [
    {
      title: 'Prescription Processing',
      tab: 'prescriptions',
      badge: 'Professional Tier Required',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      requiredTier: 'Professional',
      featureFlagKey: 'aiCounseling',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
      description: 'Digitize handwritten & e-prescriptions with AI OCR, dosage conflict checks, drug interactions, and label printing.',
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
    },
    {
      title: 'Stock & Inventory Control',
      tab: 'inventory',
      badge: 'Starter Tier Ready',
      badgeColor: 'bg-[#00D8F6]/20 text-[#00D8F6] border-[#00D8F6]/40',
      requiredTier: 'Starter',
      featureFlagKey: 'basicInventory',
      imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
      description: 'Multi-shelf tracking, batch numbers, temperature logs, barcode lookup, and real-time inventory reconciliation.',
      icon: <Package className="w-5 h-5 text-sky-400" />,
    },
    {
      title: 'Retail Counter (POS)',
      tab: 'pos',
      badge: 'Starter Tier Ready',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      requiredTier: 'Starter',
      featureFlagKey: 'posBilling',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0a675628540c?auto=format&fit=crop&w=600&q=80',
      description: 'High-speed POS checkout, itemized receipt printing, VAT/tax splits, discount approvals, and instant cash drawer sync.',
      icon: <ShoppingCart className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'FEFO Expiry Alerts',
      tab: 'expiry',
      badge: 'Starter Tier Ready',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
      requiredTier: 'Starter',
      featureFlagKey: 'expiryAlerts',
      imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
      description: 'Automated 30/60/90-day expiry engine with clearance discount tagger and one-click quarantine rack isolation.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    },
    {
      title: 'Customer Medication Profiles',
      tab: 'customers',
      badge: 'Starter Tier Ready',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
      requiredTier: 'Starter',
      featureFlagKey: 'basicInventory',
      imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80',
      description: 'Comprehensive refill history, chronic condition tags, allergy records, and automated SMS/WhatsApp refill alerts.',
      icon: <Users className="w-5 h-5 text-indigo-400" />,
    },
    {
      title: 'Automated Re-ordering',
      tab: 'reordering',
      badge: 'Professional Tier Required',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      requiredTier: 'Professional',
      featureFlagKey: 'autoReordering',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      description: 'Predictive stock depletion forecasts, minimum threshold triggers, and one-click supplier purchase order generation.',
      icon: <RefreshCw className="w-5 h-5 text-blue-400" />,
    },
    {
      title: 'Financial Ledger',
      tab: 'payments',
      badge: 'Professional Tier Required',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      requiredTier: 'Professional',
      featureFlagKey: 'salesAnalytics',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      description: 'Track Cash, MTN/Airtel Mobile Money, M-Pesa, card drawers, and automated shift end balancing.',
      icon: <CreditCard className="w-5 h-5 text-teal-400" />,
    },
    {
      title: 'Sales Reports & Margin Analytics',
      tab: 'reports',
      badge: 'Professional Tier Required',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      requiredTier: 'Professional',
      featureFlagKey: 'salesAnalytics',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
      description: 'Real-time revenue growth charts, top selling drug margins, staff sales targets, and CSV export capabilities.',
      icon: <BarChart3 className="w-5 h-5 text-purple-400" />,
    },
    {
      title: 'Uganda NDA Registry',
      tab: 'nda',
      badge: 'Enterprise Tier Required',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      requiredTier: 'Enterprise',
      featureFlagKey: 'apiAccess',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
      description: 'Direct verification with National Drug Authority Uganda licensed premises database & supervising pharmacist registry.',
      icon: <BadgeCheck className="w-5 h-5 text-emerald-400" />,
    },
  ];

  // Feature Gate Check Handler
  const handleFeatureCardClick = (card: FeatureCard) => {
    const isFeatureUnlocked = activeClient.allowedFeatures?.[card.featureFlagKey];

    if (isFeatureUnlocked) {
      onSelectFeature(card.tab);
    } else {
      // Feature is locked on current active plan -> Show upgrade modal
      setLockedFeatureModal(card);
    }
  };

  // Feedback Gate Check Handler (Requires Active Subscribed Plan)
  const handleFeedbackCardClick = (tab: 'submit' | 'history') => {
    // Check if pharmacy has an active plan tier enabled
    const hasActiveSubscribedPlan =
      activeClient.billingStatus === 'Active' &&
      Boolean(activeClient.packageTier) &&
      activeClient.packageTier !== ('Unsubscribed' as any);

    if (hasActiveSubscribedPlan && onOpenFeedbackModal) {
      onOpenFeedbackModal(tab);
    } else {
      // Plan is required -> Show Locked Feature Upgrade Modal for Pharmacy Support Desk!
      setLockedFeatureModal({
        title: 'Pharmacy Support & Admin Feedback Desk',
        tab: 'feedback',
        badge: 'Subscription Plan Activation Required',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        requiredTier: 'Starter',
        featureFlagKey: 'posBilling',
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
        description: 'The Pharmacy Support & Admin Feedback Desk is reserved for registered pharmacies on an active subscription plan. Activate a plan to submit tickets & receive live admin replies.',
        icon: <MessageSquarePlus className="w-5 h-5 text-emerald-400" />,
      });
    }
  };

  // Upgrade Plan Handler
  const handleUpgradePlan = (targetTier: TierName, moduleToLaunch?: ModuleTab) => {
    const updatedClient = applyPackageTierToClient(activeClient, targetTier);
    setActiveClient(updatedClient);
    
    setPlanActivationSuccess(`Upgraded ${activeClient.clientName} to ${targetTier} Package! Unlocked module capabilities.`);
    
    setTimeout(() => {
      setPlanActivationSuccess(null);
      setSelectedPlanModal(null);
      setLockedFeatureModal(null);
      if (moduleToLaunch) {
        if (moduleToLaunch === 'feedback') {
          if (onOpenFeedbackModal) onOpenFeedbackModal('submit');
        } else {
          onSelectFeature(moduleToLaunch);
        }
      }
    }, 1800);
  };

  return (
    <div className="space-y-12 pb-12 flex flex-col items-center">
      
      {/* ── TOP HERO POSTER / BANNER SECTION ── */}
      <div className="bg-gradient-to-br from-[#0B1E36] via-[#102A4A] to-[#0A1A2E] rounded-3xl p-6 sm:p-10 border border-[#1E3B63] shadow-2xl relative overflow-hidden max-w-6xl w-full">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Branding, Tagline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Badge Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#00D8F6]/15 text-[#00D8F6] border border-[#00D8F6]/30 text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                QUANTUM NETWORKS LTD • ZENITHRX v3.2
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                Uganda NDA Compliant
              </span>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Next-Gen Pharmacy <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-[#00D8F6]">
                  Management Platform
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed max-w-xl">
                Streamline drug stock inventory, AI-assisted prescription label printing, FEFO expiry alerts, retail POS checkout, and NDA regulatory compliance in one unified system.
              </p>
            </div>

            {/* Feature Bullets */}
            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-200">
              <div className="flex items-center gap-2 bg-[#0E2542] p-2.5 rounded-xl border border-sky-900/50">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>AI Clinical OCR Prescriptions</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0E2542] p-2.5 rounded-xl border border-sky-900/50">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Automated FEFO Expiry Engine</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0E2542] p-2.5 rounded-xl border border-sky-900/50">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Mobile Money & POS Ledger</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0E2542] p-2.5 rounded-xl border border-sky-900/50">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Multi-User Staff Permissions</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onSelectFeature('pos')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-900/40 hover:shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>Launch Live POS Counter</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={openBarcodeScanner}
                className="px-5 py-3.5 rounded-2xl bg-[#142F52] hover:bg-[#1E4373] text-sky-200 hover:text-white border border-[#254B7C] font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Scan Barcode</span>
              </button>
            </div>

          </div>

          {/* Right Column: Pharmacist Graphic & Speech Bubble */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-64 sm:w-72 h-80 sm:h-96 rounded-3xl overflow-hidden border-4 border-sky-500/30 shadow-2xl bg-slate-900">
              <img
                src={pharmacistImg}
                alt="ZenithRx Professional Pharmacist"
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E36] via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 bg-[#0E2542]/90 backdrop-blur-md p-3.5 rounded-2xl border border-sky-500/30 text-white shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Active Branch: {activeClient.clientName}</span>
                </div>
                <p className="text-xs font-bold text-slate-200 mt-1">
                  Plan Tier: <span className="text-cyan-300 font-extrabold">{activeClient.packageTier} Package</span>
                </p>
                <p className="text-[10px] text-sky-300 font-semibold mt-1">
                  Monthly UGX Rate: UGX {activeClient.monthlyUgxRate.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Corporate Support Bar */}
        <div className="mt-8 pt-6 border-t border-[#1B365D] bg-[#071629]/70 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Help Desk & Sales Line</p>
              <p className="text-xs font-black text-white">Quantum Networks Ltd Support</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">WhatsApp</p>
                <button
                  onClick={() => handleCopy('+256-755091826', 'WhatsApp')}
                  className="text-xs font-black text-white hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  +256-755091826
                  {copiedContact === 'WhatsApp' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Call Line</p>
                <button
                  onClick={() => handleCopy('0200913555', 'Call')}
                  className="text-xs font-black text-white hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  0200 913 555
                  {copiedContact === 'Call' && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Email Support</p>
                <button
                  onClick={() => handleCopy('quantumnetworks@gmail.com', 'Email')}
                  className="text-xs font-black text-white hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  quantumnetworks@gmail.com
                  {copiedContact === 'Email' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 💬 PHARMACY FEEDBACK & ADMIN COMMUNICATION CARDS SECTION ── */}
      <div id="pharmacy-feedback-section" className="max-w-6xl w-full space-y-6 pt-4 scroll-mt-20">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/60 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
              DIRECT PHARMACY-TO-ADMIN CHANNEL
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Pharmacy Support &amp; Feedback Desk
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Submit feature inquiries, bug reports, and NDA compliance questions directly to System Administration and track live replies.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Live Admin Response Active
          </span>
        </div>

        {/* 3 Columns Desktop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CARD 1: SUBMIT FEEDBACK */}
          <div
            onClick={() => handleFeedbackCardClick('submit')}
            className="bg-[#0A2626] rounded-2xl overflow-hidden border border-emerald-900/60 hover:border-emerald-400/80 shadow-xl hover:shadow-2xl hover:shadow-emerald-950/40 transition-all duration-300 flex flex-col group cursor-pointer transform hover:-translate-y-1"
          >
            <div className="relative h-44 w-full overflow-hidden bg-slate-950">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"
                alt="Submit Feedback to Admin"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A2626] via-[#0A2626]/40 to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border backdrop-blur-md shadow-md bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                  Submit Feedback
                </span>
              </div>

              <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-[#061C1C]/90 border border-emerald-700/50 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <MessageSquarePlus className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Send Message to System Admin
                </h3>
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                  Compose bug reports, feature requests, NDA compliance inquiries, or billing questions directly to ZenithRx System Administration.
                </p>
              </div>

              <div className="pt-3 border-t border-emerald-900/50 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-200">
                <span>Compose Ticket</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-emerald-400" />
              </div>
            </div>
          </div>

          {/* CARD 2: TICKET HISTORY & ADMIN REPLIES */}
          <div
            onClick={() => handleFeedbackCardClick('history')}
            className="bg-[#0F233B] rounded-2xl overflow-hidden border border-sky-900/60 hover:border-sky-400/80 shadow-xl hover:shadow-2xl hover:shadow-sky-950/40 transition-all duration-300 flex flex-col group cursor-pointer transform hover:-translate-y-1"
          >
            <div className="relative h-44 w-full overflow-hidden bg-slate-950">
              <img
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80"
                alt="Track Admin Replies"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F233B] via-[#0F233B]/40 to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border backdrop-blur-md shadow-md bg-sky-500/20 text-sky-300 border-sky-400/40">
                  Track Admin Replies
                </span>
              </div>

              <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-[#09172B]/90 border border-sky-700/50 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 text-sky-400" />
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                  View Ticket History &amp; Responses
                </h3>
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                  Track real-time status of your submitted tickets, read official admin responses, and view resolved inquiry history.
                </p>
              </div>

              <div className="pt-3 border-t border-sky-900/50 flex items-center justify-between text-xs font-bold text-sky-400 group-hover:text-sky-200">
                <span>View My Tickets</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-sky-400" />
              </div>
            </div>
          </div>

          {/* CARD 3: DIRECT HELP DESK & WHATSAPP */}
          <div
            onClick={() => handleCopy('+256-755091826', 'WhatsApp')}
            className="bg-[#20182E] rounded-2xl overflow-hidden border border-purple-900/60 hover:border-purple-400/80 shadow-xl hover:shadow-2xl hover:shadow-purple-950/40 transition-all duration-300 flex flex-col group cursor-pointer transform hover:-translate-y-1"
          >
            <div className="relative h-44 w-full overflow-hidden bg-slate-950">
              <img
                src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=600&q=80"
                alt="Direct Help Desk Line"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#20182E] via-[#20182E]/40 to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border backdrop-blur-md shadow-md bg-purple-500/20 text-purple-300 border-purple-400/40">
                  Instant Help Desk
                </span>
              </div>

              <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-[#140E1F]/90 border border-purple-700/50 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5 text-purple-400" />
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  WhatsApp &amp; Phone Line
                </h3>
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                  Connect instantly with Quantum Networks support team via WhatsApp (+256-755091826) or official call line (0200 913 555).
                </p>
              </div>

              <div className="pt-3 border-t border-purple-900/50 flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-200">
                <span>Copy Help Desk Contact</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-purple-400" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── 🌟 SUBSCRIPTION PLANS & PRICING CARDS ── */}
      <div id="pricing-plans-section" className="max-w-6xl w-full space-y-6 pt-4 scroll-mt-20">
        
        {/* Section Header */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-widest">
            <Gift className="w-3.5 h-3.5 text-cyan-400" />
            CHOOSE YOUR SUBSCRIPTION PLAN
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Tailored Packages for Every Pharmacy Scale
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Activating a plan unlocks all operational modules corresponding to that tier. Select any plan below to activate or view detailed terms.
          </p>
        </div>

        {/* 4 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {planCards.map((plan) => {
            const isCurrentActivePlan = activeClient.packageTier === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative shadow-xl hover:shadow-2xl ${plan.bgGradient} ${plan.borderColor} ${
                  isCurrentActivePlan ? 'ring-2 ring-emerald-400' : ''
                } transform hover:-translate-y-1`}
              >
                {/* Popular Badge ribbon */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                    <span className="px-3.5 py-1 rounded-full bg-[#00D8F6] text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-slate-950" />
                      MOST POPULAR PLAN
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <UserCog className="w-3 h-3 text-cyan-400" />
                      {plan.maxUsers} Users
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{plan.name}</h3>
                    <p className="text-slate-300 text-xs mt-1 leading-snug">{plan.tagline}</p>
                  </div>

                  {/* Price Display */}
                  <div className="pt-2 border-t border-slate-700/40">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">
                        UGX {plan.discountPriceUgx.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        UGX {plan.originalPriceUgx.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-cyan-400 mt-0.5">Billed monthly per branch</p>
                  </div>

                  {/* Active Plan Indicator */}
                  {isCurrentActivePlan && (
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Active Subscription Plan</span>
                    </div>
                  )}

                  {/* Feature Bullet Points */}
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">Core Features Included:</p>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Select / Activate Plan Button */}
                <div className="pt-6 mt-6 border-t border-slate-700/40 space-y-2">
                  <button
                    onClick={() => handleUpgradePlan(plan.id)}
                    className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isCurrentActivePlan
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : plan.isPopular
                        ? 'bg-[#00D8F6] hover:bg-cyan-300 text-slate-950 shadow-cyan-900/40'
                        : 'bg-[#142F52] hover:bg-[#1E4373] text-sky-200 hover:text-white border border-[#254B7C]'
                    }`}
                  >
                    <span>{isCurrentActivePlan ? 'Plan Active (Re-Activate)' : `Activate ${plan.name}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedPlanModal(plan)}
                    className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-cyan-300 transition-colors py-1 cursor-pointer"
                  >
                    View Plan Capabilities Overview
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ── 3-COLUMN DECORATED FEATURE CARDS GRID ── */}
      <div id="platform-features-section" className="max-w-6xl w-full space-y-6 pt-4 scroll-mt-20">
        
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-900/60 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              Platform Modules &amp; Operational Features
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Operational modules require an active corresponding subscription plan tier to launch.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-sky-900/40 border border-sky-700/50 text-sky-300 text-xs font-semibold">
            12 Operational Modules Ready
          </span>
        </div>

        {/* 3 Columns Desktop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card) => {
            const isUnlocked = activeClient.allowedFeatures?.[card.featureFlagKey];

            return (
              <div
                key={card.tab}
                onClick={() => handleFeatureCardClick(card)}
                className={`bg-[#0E2542] rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col group cursor-pointer transform hover:-translate-y-1 ${
                  isUnlocked
                    ? 'border-sky-900/50 hover:border-sky-400/60 shadow-xl hover:shadow-2xl hover:shadow-cyan-900/20'
                    : 'border-amber-900/40 hover:border-amber-500/60 opacity-90'
                }`}
              >
                {/* Card Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E2542] via-[#0E2542]/40 to-transparent" />
                  
                  {/* Badge Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border backdrop-blur-md shadow-md ${
                      isUnlocked
                        ? card.badgeColor
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    }`}>
                      {isUnlocked ? card.badge : `🔒 ${card.requiredTier} Required`}
                    </span>
                  </div>

                  {/* Icon Circle */}
                  <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-[#0B1E38]/90 border border-sky-700/50 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {isUnlocked ? card.icon : <Lock className="w-5 h-5 text-amber-400" />}
                  </div>
                </div>

                {/* Card Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                      <span>{card.title}</span>
                      {!isUnlocked && <Lock className="w-4 h-4 text-amber-400 shrink-0" />}
                    </h3>
                    <p className="text-slate-300 text-xs mt-2 leading-relaxed line-clamp-3">
                      {card.description}
                    </p>
                  </div>

                  {/* Card CTA Footer Button */}
                  <div className="pt-3 border-t border-sky-900/50 flex items-center justify-between text-xs font-bold">
                    {isUnlocked ? (
                      <>
                        <span className="text-cyan-400 group-hover:text-cyan-200">Launch Module</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-cyan-400" />
                      </>
                    ) : (
                      <>
                        <span className="text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          Activate {card.requiredTier} Plan
                        </span>
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── 🔍 INTERACTIVE PLAN OVERVIEW MODAL ── */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1E36] rounded-3xl border border-[#1E3B63] shadow-2xl max-w-xl w-full overflow-hidden text-white relative flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1E3B63] bg-[#071629] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${selectedPlanModal.badgeColor}`}>
                    {selectedPlanModal.badge}
                  </span>
                  <h3 className="text-xl font-black text-white tracking-tight mt-0.5">{selectedPlanModal.name}</h3>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              
              {/* Notification Banner */}
              {planActivationSuccess && (
                <div className="bg-emerald-500 text-white p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{planActivationSuccess}</span>
                </div>
              )}

              {/* Pricing Summary Box */}
              <div className="bg-[#071629] p-4 rounded-2xl border border-sky-900/50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Monthly Subscription Rate</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-cyan-300">
                      UGX {selectedPlanModal.discountPriceUgx.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      UGX {selectedPlanModal.originalPriceUgx.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                    Save UGX {(selectedPlanModal.originalPriceUgx - selectedPlanModal.discountPriceUgx).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{selectedPlanModal.maxUsers} Staff User Quota</p>
                </div>
              </div>

              {/* Best For Section */}
              <div className="space-y-1.5">
                <p className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  Who This Plan Is Designed For:
                </p>
                <p className="text-xs text-slate-200 leading-relaxed bg-[#0E2542] p-3 rounded-xl border border-sky-900/40">
                  {selectedPlanModal.bestFor}
                </p>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <p className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Plan Capability Overview:
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedPlanModal.detailedDescription}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-xs font-black uppercase text-slate-300 tracking-wider">Full Operational Stack Unlocked:</p>
                <div className="grid grid-cols-1 gap-2">
                  {selectedPlanModal.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-200 bg-[#071629] p-2 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer CTAs */}
            <div className="p-5 border-t border-[#1E3B63] bg-[#071629] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => handleCopy('+256-755091826', 'WhatsAppModal')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Request Custom Demo</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedPlanModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
                
                <button
                  onClick={() => handleUpgradePlan(selectedPlanModal.id, 'pos')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Activate {selectedPlanModal.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── 🔒 FEATURE LOCKED / SUBSCRIPTION UPGRADE MODAL ── */}
      {lockedFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1E36] rounded-3xl border border-amber-500/40 shadow-2xl max-w-md w-full overflow-hidden text-white relative flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-amber-500/30 bg-[#071629] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Subscription Required</span>
                  <h3 className="text-base font-black text-white">{lockedFeatureModal.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setLockedFeatureModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Notification Banner */}
              {planActivationSuccess && (
                <div className="bg-emerald-500 text-white p-3 rounded-xl font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{planActivationSuccess}</span>
                </div>
              )}

              <p className="text-slate-300 leading-relaxed">
                The <span className="text-cyan-300 font-bold">{lockedFeatureModal.title}</span> module is locked for your current plan tier. Upgrade to <span className="text-amber-300 font-bold">{lockedFeatureModal.requiredTier} Package</span> to launch this module.
              </p>

              <div className="bg-[#071629] p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Active Branch:</span>
                  <span className="text-white font-bold">{activeClient.clientName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Current Plan:</span>
                  <span className="text-sky-300 font-bold">{activeClient.packageTier} Package</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Required Plan:</span>
                  <span className="text-amber-300 font-bold">{lockedFeatureModal.requiredTier} Package</span>
                </div>
              </div>
            </div>

            {/* Footer CTAs */}
            <div className="p-4 border-t border-[#1E3B63] bg-[#071629] flex flex-col gap-2">
              <button
                onClick={() => handleUpgradePlan(lockedFeatureModal.requiredTier, lockedFeatureModal.tab)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Upgrade to {lockedFeatureModal.requiredTier} &amp; Launch</span>
              </button>

              <button
                onClick={() => {
                  setLockedFeatureModal(null);
                  const el = document.getElementById('pricing-plans-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors"
              >
                Compare All Subscription Plans
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
