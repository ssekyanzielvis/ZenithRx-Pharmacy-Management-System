import React, { useState } from 'react';
import { ModuleTab } from '../types';
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
  Sliders
} from 'lucide-react';

import pharmacistImg from '../assets/images/pharmacist_portrait_1784717590593.jpg';

interface PromoBannerViewProps {
  onSelectFeature: (tab: ModuleTab) => void;
  openBarcodeScanner: () => void;
}

export const PromoBannerView: React.FC<PromoBannerViewProps> = ({
  onSelectFeature,
  openBarcodeScanner,
}) => {
  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  const keyFeatures: { title: string; tab: ModuleTab; description: string; icon: React.ReactNode }[] = [
    {
      title: 'Prescription Processing',
      tab: 'prescriptions',
      description: 'Digitize handwritten & e-prescriptions with AI OCR, clinical interaction checks, and label printing.',
      icon: <FileText className="w-5 h-5 text-sky-300" />,
    },
    {
      title: 'Stock & Inventory Control',
      tab: 'inventory',
      description: 'Real-time multi-shelf drug tracking, batch numbers, storage temp control, and barcode search.',
      icon: <Package className="w-5 h-5 text-sky-300" />,
    },
    {
      title: 'Expiry Alerts',
      tab: 'expiry',
      description: 'Automatic early warning engine for expiring batches with clearance discount tagger & quarantine.',
      icon: <AlertTriangle className="w-5 h-5 text-amber-300" />,
    },
    {
      title: 'Customer Medication Profiles',
      tab: 'customers',
      description: 'Patient refill history, chronic conditions, allergy records, and automated SMS/WhatsApp alerts.',
      icon: <Users className="w-5 h-5 text-sky-300" />,
    },
    {
      title: 'Automated Re-ordering',
      tab: 'reordering',
      description: 'Auto-calculates min stock thresholds and generates purchase orders directly to suppliers.',
      icon: <RefreshCw className="w-5 h-5 text-sky-300" />,
    },
    {
      title: 'Price & Billing Management',
      tab: 'pos',
      description: 'Fast POS checkout, itemized receipt generation, VAT/tax splits, and multi-payment gateways.',
      icon: <ShoppingCart className="w-5 h-5 text-emerald-300" />,
    },
    {
      title: 'Sales Reports',
      tab: 'reports',
      description: 'Real-time revenue analytics, margin breakdown, top-selling drugs, and cashier audit logs.',
      icon: <BarChart3 className="w-5 h-5 text-sky-300" />,
    },
    {
      title: 'Insurance & Medical Scheme Support',
      tab: 'insurance',
      description: 'Direct insurance co-pay calculation, pre-authorization codes, and scheme claim submissions.',
      icon: <ShieldCheck className="w-5 h-5 text-sky-300" />,
    },
    {
      title: 'Client Service Packages (Admin)',
      tab: 'adminPackages',
      description: 'Tailor PharmSync packages (Starter, Professional, Enterprise), user seats, and UGX rates per client.',
      icon: <Sliders className="w-5 h-5 text-cyan-300" />,
    },
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContact(label);
    setTimeout(() => setCopiedContact(null), 2500);
  };

  return (
    <div className="w-full bg-[#07172B] min-h-screen py-8 px-4 flex flex-col items-center justify-center font-sans">
      {/* Outer Banner Container matching exact promotional proportions */}
      <div className="max-w-5xl w-full bg-[#0E2542] rounded-3xl shadow-2xl overflow-hidden border border-sky-900/60 relative flex flex-col">
        {/* Subtle Background Geometric Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Main Banner Body */}
        <div className="p-6 md:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Brand Logo, Headline & Key Features */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* Quantum Header Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-sky-600 rounded-xl flex items-center justify-center p-2 shadow-lg shadow-cyan-900/50">
                <div className="grid grid-cols-2 gap-1 w-full h-full transform rotate-45">
                  <div className="bg-white rounded-xs"></div>
                  <div className="bg-sky-200 rounded-xs"></div>
                  <div className="bg-sky-300 rounded-xs"></div>
                  <div className="bg-white rounded-xs"></div>
                </div>
              </div>
              <div>
                <h2 className="text-sm tracking-[0.25em] text-sky-300 font-extrabold uppercase">
                  QUANTUM
                </h2>
                <p className="text-[11px] tracking-widest text-slate-300 font-bold uppercase">
                  NETWORKS LTD
                </p>
              </div>
            </div>

            {/* Main Headline Title */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05]">
                Zenith
                <span className="text-sky-200">Rx</span>
              </h1>
              <p className="text-base sm:text-lg text-sky-100 font-semibold mt-2">
                (Pharmacy Management System – PMS)
              </p>
            </div>

            {/* Key Features Bullet List */}
            <div className="bg-[#0B1E38]/80 backdrop-blur-md p-5 rounded-2xl border border-sky-800/40 space-y-3">
              <div className="flex items-center justify-between border-b border-sky-800/60 pb-2">
                <span className="text-sky-200 font-bold text-sm tracking-wide uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  Key System Features
                </span>
                <span className="text-xs text-sky-300/80">Click any feature to test live</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {keyFeatures.map((feat) => (
                  <button
                    key={feat.tab}
                    onClick={() => onSelectFeature(feat.tab)}
                    className="flex items-start gap-2.5 p-2 rounded-xl bg-[#122D50] hover:bg-sky-900/60 border border-sky-800/30 hover:border-sky-400/50 transition-all text-left group cursor-pointer"
                  >
                    <span className="mt-0.5 group-hover:scale-110 transition-transform">{feat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-sky-200 truncate flex items-center justify-between">
                        {feat.title}
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-sky-300" />
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Speech Bubble Highlight + Pharmacist Image */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            
            {/* Speech Bubble Highlight: "Efficient, Compliant, And Profitable." */}
            <div className="relative mb-4 z-20 w-full max-w-xs animate-bounce-subtle">
              <div className="bg-sky-200 text-slate-900 p-5 rounded-3xl shadow-xl border-2 border-white/60 text-center relative">
                <p className="text-xl sm:text-2xl font-black tracking-tight leading-snug font-serif text-slate-950">
                  Efficient,
                  <br />
                  Compliant,
                  <br />
                  And
                  <br />
                  <span className="text-sky-900 underline decoration-sky-500 font-extrabold">Profitable.</span>
                </p>
                {/* Speech Bubble Pointer Arrow */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-sky-200 transform rotate-45 border-r-2 border-b-2 border-white/60"></div>
              </div>
            </div>

            {/* Pharmacist Hero Portrait Image */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-sky-300/30 group">
              <img
                src={pharmacistImg}
                alt="Pharmacist holding digital tablet"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E2542] via-transparent to-transparent opacity-40"></div>
            </div>

            {/* Quick Launch CTA Button */}
            <button
              onClick={() => onSelectFeature('pos')}
              className="mt-6 w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm tracking-wide uppercase shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Launch Live PMS System</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Footer Contact Bar matching image design */}
        <div className="bg-white text-slate-900 px-6 py-4 border-t-4 border-sky-400 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Barcode Scanner CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={openBarcodeScanner}
              className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center p-2 hover:bg-sky-700 transition-colors cursor-pointer group shadow-md"
              title="Click to test Barcode / QR Scanner"
            >
              <QrCode className="w-7 h-7 group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <p className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                SCAN BARCODE
                <span className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.5 rounded font-bold">POS Ready</span>
              </p>
              <a
                href="https://www.quantumnetworks.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-600 hover:text-sky-700 font-medium flex items-center gap-1"
              >
                <Globe className="w-3 h-3 text-sky-600" />
                www.quantumnetworks.com
              </a>
            </div>
          </div>

          {/* Center/Right: Phone & WhatsApp Details */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">WhatsApp</p>
                <button
                  onClick={() => handleCopy('+256-755091826', 'WhatsApp')}
                  className="text-xs font-black text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-1"
                >
                  +256-755091826
                  {copiedContact === 'WhatsApp' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Call Line</p>
                <button
                  onClick={() => handleCopy('0200913555', 'Call')}
                  className="text-xs font-black text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-1"
                >
                  0200 913 555
                  {copiedContact === 'Call' && <CheckCircle2 className="w-3 h-3 text-sky-600" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Email Support</p>
                <button
                  onClick={() => handleCopy('quantumnetworks@gmail.com', 'Email')}
                  className="text-xs font-black text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-1"
                >
                  quantumnetworks@gmail.com
                  {copiedContact === 'Email' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
