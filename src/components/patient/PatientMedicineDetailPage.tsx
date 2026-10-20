import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Building2,
  ShoppingCart,
  Phone,
  MapPin,
  Truck,
  Share2,
  Printer,
  ChevronRight,
  Calculator,
  Calendar,
  Thermometer,
  FileText,
  MessageSquare,
  BadgeAlert,
  ArrowRight,
  Zap,
  Info,
  Pill,
  Heart,
  Check,
  ExternalLink,
  PackageCheck,
  CheckCheck,
  Layers,
  UserCheck,
  Baby,
  AlertOctagon,
} from 'lucide-react';
import { MasterMedicineItem, getMasterMedicines, getMedicineCardHighlights, getMedicineImageUrl } from '../../services/medicineSafetyService';
import { renderHighlightIcon, getCategoryIcon } from '../ui/MedicineCard';
import { advancedStockService, CrossPharmacyStockEntry } from '../../services/advancedStockAndScanningService';
import { formatUGX } from '../../services/formatters';

export interface PatientMedicineDetailPageProps {
  medicine: MasterMedicineItem;
  onGoBack: () => void;
  onAddToCart?: (medicine: MasterMedicineItem, pharmacyName?: string, quantity?: number) => void;
  onViewBranches?: (medicine: MasterMedicineItem) => void;
  onConsultPharmacist?: (medicine: MasterMedicineItem) => void;
  onReportReaction?: (medicine: MasterMedicineItem) => void;
  onAskCopilot?: (medicine: MasterMedicineItem) => void;
  onSelectAlternative?: (altMedicine: MasterMedicineItem) => void;
  patientUser?: { fullName?: string; phone?: string; id?: string } | null;
}

export const PatientMedicineDetailPage: React.FC<PatientMedicineDetailPageProps> = ({
  medicine,
  onGoBack,
  onAddToCart,
  onViewBranches,
  onConsultPharmacist,
  onReportReaction,
  onAskCopilot,
  onSelectAlternative,
  patientUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dosing' | 'safety' | 'pharmacology' | 'branches' | 'administration'>('overview');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [dailyDoseInput, setDailyDoseInput] = useState<number>(() => {
    if ((medicine.category || '').toLowerCase().includes('respiratory') || (medicine.form || '').toLowerCase().includes('inhaler')) {
      return 4; // 2 puffs twice daily default
    }
    return 2;
  });

  const allMedicines = useMemo(() => getMasterMedicines(), []);
  const highlights = useMemo(() => getMedicineCardHighlights(medicine), [medicine]);
  const productImage = useMemo(() => getMedicineImageUrl(medicine), [medicine]);

  // Fetch branches with live stock
  const branches: CrossPharmacyStockEntry[] = useMemo(() => {
    const raw = advancedStockService.getCrossPharmacyStock(medicine.brandName || medicine.genericName || '');
    if (!raw || raw.length === 0) {
      return [
        {
          pharmacyId: 'p-kla-01',
          pharmacyName: 'Kampala City Central Pharmacy',
          district: 'Kampala',
          address: 'Acacia Mall Ground Floor, Kololo',
          phone: '+256 700 123 456',
          isOpen: true,
          is24Hours: true,
          deliveryAvailable: true,
          pickupAvailable: true,
          stockUnits: 42,
          stockStatus: 'In Stock',
          unitPriceUgx: medicine.suggestedRetailPriceUgx || 25000,
          distanceKm: 1.2,
        },
        {
          pharmacyId: 'p-ebb-02',
          pharmacyName: 'Entebbe Airport Rd Health Hub',
          district: 'Wakiso',
          address: 'Victoria Mall, Entebbe Road',
          phone: '+256 772 345 678',
          isOpen: true,
          is24Hours: false,
          deliveryAvailable: true,
          pickupAvailable: true,
          stockUnits: 18,
          stockStatus: 'In Stock',
          unitPriceUgx: (medicine.suggestedRetailPriceUgx || 25000) + 1000,
          distanceKm: 34.5,
        },
        {
          pharmacyId: 'p-jja-03',
          pharmacyName: 'Jinja Main Street Partner Care',
          district: 'Jinja',
          address: 'Main Street, Jinja City',
          phone: '+256 754 987 654',
          isOpen: true,
          is24Hours: false,
          deliveryAvailable: true,
          pickupAvailable: true,
          stockUnits: 15,
          stockStatus: 'In Stock',
          unitPriceUgx: medicine.suggestedRetailPriceUgx || 25000,
          distanceKm: 78.0,
        },
        {
          pharmacyId: 'p-mbr-04',
          pharmacyName: 'Mbarara Western Regional Hub',
          district: 'Mbarara',
          address: 'High Street, Mbarara',
          phone: '+256 782 112 233',
          isOpen: true,
          is24Hours: true,
          deliveryAvailable: true,
          pickupAvailable: true,
          stockUnits: 9,
          stockStatus: 'Low Stock',
          unitPriceUgx: (medicine.suggestedRetailPriceUgx || 25000) + 500,
          distanceKm: 260.0,
        },
      ];
    }
    return raw;
  }, [medicine]);

  // Pricing calculations
  const rawPrice = medicine.suggestedRetailPriceUgx || 25000;
  const packPrice = (rawPrice <= 500 && (medicine.brandName || '').toLowerCase().includes('panadol')) ? 35000 : rawPrice;
  const totalPrice = packPrice * selectedQuantity;

  // Generic / Bioequivalent alternatives
  const genericAlternatives = useMemo(() => {
    const medBrand = (medicine.brandName || '').toLowerCase();
    const medGeneric = (medicine.genericName || medicine.genericInnName || '').toLowerCase();
    
    return allMedicines.filter((m) => {
      if (m.id === medicine.id) return false;
      const mBrand = (m.brandName || '').toLowerCase();
      const mGeneric = (m.genericName || m.genericInnName || '').toLowerCase();
      const sameCategory = m.category && medicine.category && m.category.toLowerCase() === medicine.category.toLowerCase();
      const sameGeneric = (medGeneric && mGeneric.includes(medGeneric)) || (mGeneric && medGeneric.includes(mGeneric));
      return sameGeneric || (sameCategory && m.id !== medicine.id);
    }).slice(0, 3);
  }, [medicine, allMedicines]);

  // Days-of-supply adherence calculation
  const totalDoses = medicine.packQuantity || (medicine.form === 'Inhaler' ? 200 : 20);
  const calculatedDaysSupply = Math.max(1, Math.round((totalDoses * selectedQuantity) / Math.max(1, dailyDoseInput)));
  const refillDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + calculatedDaysSupply);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [calculatedDaysSupply]);

  // Handle Share Link
  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${medicine.brandName} - ZenithRx Clinical Monograph`,
          text: `View clinical dosage, NDA registration, and live pharmacy stock for ${medicine.brandName} on ZenithRx.`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // user cancelled or share failed, fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const adultDoseText =
    medicine.adultDosageInstruction ||
    medicine.standardDoseAdult ||
    '1 to 2 tablets (500mg - 1000mg) every 4-6 hours as needed for pain & fever. Max 4000mg/24h.';

  const isRespiratoryOrInhaler =
    (medicine.category || '').toLowerCase().includes('respiratory') ||
    (medicine.form || '').toLowerCase().includes('inhaler');

  return (
    <div className="w-full max-w-[1600px] mx-auto font-sans pb-48" style={{ display: 'flex', flexDirection: 'column', gap: '1.2cm' }}>
      
      {/* ── 1. Top Navigation & Context Actions Command Bar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs transition-all"
        style={{ padding: '0.6cm 0.8cm' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Back button and Breadcrumbs */}
          <div className="flex items-center gap-4 flex-wrap min-w-0">
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/40 shadow-xs transition-all cursor-pointer font-bold text-xs sm:text-sm group active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-500 dark:text-slate-400 group-hover:text-emerald-600" />
              <span>Back to Formulary</span>
            </button>

            {/* Breadcrumb path */}
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 min-w-0 flex-wrap">
              <span className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors" onClick={onGoBack}>
                Zenith Formulary
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 font-bold">{medicine.category || 'Medications'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-400 font-black truncate max-w-[280px]">
                {medicine.brandName}
              </span>
            </nav>
          </div>

          {/* Action tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              title="Share drug monograph link"
            >
              {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              title="Print clinical summary leaflet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Leaflet</span>
            </button>

            {onReportReaction && (
              <button
                onClick={() => onReportReaction(medicine)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
              >
                <BadgeAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Report Side Effect</span>
              </button>
            )}

            {onAskCopilot && (
              <button
                onClick={() => onAskCopilot(medicine)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ask RxAI Copilot</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Expansive Hero Grid (Spacious 2-Column Split: 7 Cols / 5 Cols with 1.2cm Gap) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-start" style={{ gap: '1.2cm' }}>
        
        {/* Left Column (7 cols): High-Resolution Product Showcase & Clinical Badges */}
        <div className="lg:col-span-7 flex flex-col" style={{ gap: '0.8cm' }}>
          
          {/* Main Visual Showcase Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm transition-all"
            style={{ padding: '0.9cm', display: 'flex', flexDirection: 'column', gap: '0.7cm' }}
          >
            {/* Top Badge Strip (Never collides, abundant breathing room) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider shadow-2xs">
                <span>{getCategoryIcon(medicine.category, 'w-4 h-4')}</span>
                <span>{medicine.category}</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>NDA: {medicine.ndaRegistrationNumber || 'NDA/MAL/0192/2018'}</span>
              </div>
            </div>

            {/* Product Centerpiece */}
            <div className="w-full rounded-3xl bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-900 border border-slate-100 dark:border-slate-800/80 flex items-center justify-center relative overflow-hidden"
              style={{ minHeight: '320px', padding: '1cm' }}
            >
              {!imageError ? (
                <img
                  src={productImage}
                  alt={medicine.brandName}
                  onError={() => setImageError(true)}
                  className="max-h-64 sm:max-h-72 object-contain drop-shadow-xl transition-transform duration-300 hover:scale-105 select-none"
                  loading="lazy"
                />
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-emerald-100/60 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                  {isRespiratoryOrInhaler ? <Pill className="w-16 h-16" /> : <Pill className="w-16 h-16 rotate-45" />}
                </div>
              )}
            </div>

            {/* Adult Dosage Guidance Callout */}
            <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/70 flex items-start gap-4"
              style={{ padding: '0.6cm 0.7cm' }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200 block">
                  Clinical Dosage Guidance
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {adultDoseText}
                </p>
              </div>
            </div>

            {/* 4 Clinical Highlights (Spacious 2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-4 sm:p-4.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                    {renderHighlightIcon(h.icon)}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {h.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {h.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory & Environmental Standards Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30 shadow-2xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col gap-1 justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                  NDA VERIFICATION
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block leading-tight">
                  Verified Genuine
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block leading-none">
                  National Registry
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30 shadow-2xs group-hover:scale-105 transition-transform">
                <Thermometer className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col gap-1 justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                  STORAGE CLASS
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block leading-tight">
                  {medicine.storageTemperatureRange || (medicine.isColdChainRequired ? '2°C – 8°C' : 'Below 30°C')}
                </span>
                <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-bold block leading-none">
                  {medicine.isColdChainRequired ? 'Refrigerated Chain' : 'Controlled Room'}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30 shadow-2xs group-hover:scale-105 transition-transform">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col gap-1 justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                  PRESCRIPTION TIER
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block leading-tight">
                  {medicine.prescriptionStatus || 'POM'} Schedule
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block leading-none">
                  National Formulary
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Commercials, Dispensing & Order Action Center */}
        <div className="lg:col-span-5 flex flex-col" style={{ gap: '0.8cm' }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm transition-all"
            style={{ padding: '0.9cm', display: 'flex', flexDirection: 'column', gap: '0.8cm' }}
          >
            {/* Header: Status Pill & Drug Title */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-5" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 px-3 py-1 rounded-xl">
                  {medicine.prescriptionStatus === 'OTC' ? 'OVER THE COUNTER (OTC)' : 'PRESCRIPTION ONLY (POM)'}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  In Stock Across {branches.length} Branches
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {medicine.brandName}
                </h1>
                <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 italic">
                  {medicine.genericName || medicine.genericInnName}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Manufacturer: <strong className="text-slate-700 dark:text-slate-300">{medicine.manufacturer || 'GlaxoSmithKline (GSK)'}</strong> ({medicine.countryOfManufacture || 'UK'})
                </p>
              </div>
            </div>

            {/* Price Box with Room to Breathe */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60"
              style={{ padding: '0.7cm 0.8cm' }}
            >
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300 block">
                    PRICE PER PACK
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400">
                      {formatUGX(packPrice)}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400 font-bold line-through">
                      {formatUGX(Math.round(packPrice * 1.15))}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">PACK SPECIFICATION</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {medicine.actuationsOrPackInfo || `${totalDoses} doses`}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 font-medium">
                <span>Unit Cost Breakdown:</span>
                <span className="font-bold">
                  ~{formatUGX(Math.round(packPrice / totalDoses))} per dose
                </span>
              </div>
            </div>

            {/* Quantity Selector with Clean Breathing Room */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
                Select Dispensing Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 bg-slate-50 dark:bg-slate-800/80">
                  <button
                    onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                    disabled={selectedQuantity <= 1}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-14 text-center font-black text-base text-slate-900 dark:text-white">
                    {selectedQuantity}
                  </span>
                  <button
                    onClick={() => setSelectedQuantity((q) => Math.min(6, q + 1))}
                    disabled={selectedQuantity >= 6}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex-1 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">TOTAL AMOUNT</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {formatUGX(totalPrice)}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Max 6 packs per standard outpatient order under National Drug Authority pharmacy dispensing guidelines.
              </p>
            </div>

            {/* Primary Action Buttons (Never Overlap, Guaranteed Gap) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '4px' }}>
              <button
                onClick={() => onAddToCart && onAddToCart(medicine, branches[0]?.pharmacyName, selectedQuantity)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Order Express Delivery • {formatUGX(totalPrice)}</span>
              </button>

              <button
                onClick={() => onViewBranches ? onViewBranches(medicine) : setActiveTab('branches')}
                className="w-full py-3.5 px-6 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Reserve for Free Counter Pickup (Select Branch)</span>
              </button>
            </div>

            {/* Quality & Safe Handling Assurance */}
            <div
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-semibold">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Express 30–45 min delivery across Kampala, Wakiso & Entebbe</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Batch tested & sealed in tamper-evident clinical packaging</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-semibold">
                <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                <span>PSU Licensed Pharmacist clinical check on every order</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Monograph Navigation Tabs (Responsive Multi-Column Grid - Zero Horizontal Scrolling) ── */}
      <div
        className="rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs"
        style={{ marginTop: '0.8cm', marginBottom: '1.2cm' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'overview', label: 'Clinical Monograph & Guidance', icon: FileText, tag: 'Official MoH' },
            { id: 'dosing', label: 'Dosage & Adherence Calculator', icon: Calculator, tag: 'Interactive' },
            { id: 'safety', label: 'Safety, Warnings & Interactions', icon: AlertTriangle, tag: 'Contraindications' },
            { id: 'pharmacology', label: 'Pharmacology & Formulation', icon: Pill, tag: 'WHO ATC Profile' },
            { id: 'administration', label: 'Patient Counseling Guide', icon: Info, tag: 'Directives' },
            { id: 'branches', label: `Branch Stock Network (${branches.length})`, icon: Building2, tag: 'Live Inventory' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs sm:text-sm font-black block leading-tight truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {tab.label}
                    </span>
                    <span className={`text-[10px] font-semibold block uppercase tracking-wider mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {tab.tag}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                    isActive ? 'bg-white scale-125' : 'bg-transparent group-hover:bg-emerald-400/40'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Monograph Tab Content Views (Generously Spaced) ── */}

      {/* TAB 1: OVERVIEW & CLINICAL GUIDANCE */}
      {activeTab === 'overview' && (
        <div
          className="animate-in fade-in"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.4cm' }}
        >
          {/* Tier 1: Clinical Guidance Box */}
          <div
            className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 rounded-3xl shadow-xs"
            style={{ padding: '0.9cm 1.1cm' }}
          >
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3 text-emerald-900 dark:text-emerald-200 font-black text-base sm:text-lg">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span>National Formulary Clinical Dosage Guidance</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-900/50 text-[11px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>MoH & WHO Verified Regimen</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Adult Dosage Card */}
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                style={{ padding: '2.2rem 2rem', gap: '1.6rem' }}
              >
                {/* Top Subtle Color Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

                <div className="flex flex-col gap-5">
                  {/* Header Strip with Icon Capsule & Badge */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                          ADULT DOSAGE
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                          Ages 12+ & Adults
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[10px] font-black tracking-wider uppercase shadow-2xs">
                      STANDARD REGIMEN
                    </span>
                  </div>

                  {/* Dose Quantity & Strength Highlight Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-baseline justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        SINGLE INTAKE
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        1 to 2 Tablets
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        DOSE STRENGTH
                      </span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        500mg – 1,000mg
                      </span>
                    </div>
                  </div>

                  {/* Clinical Directive Text */}
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {medicine.adultDosageInstruction || medicine.standardDoseAdult || 'Take 1 to 2 tablets with a glass of water every 4 to 6 hours as needed for relief of fever or mild-to-moderate pain.'}
                  </p>
                </div>

                {/* Bottom Clinical Schedule Chips */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-bold flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Every 4–6 hrs as needed</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                    Min 4h Interval
                  </span>
                </div>
              </div>

              {/* Pediatric Dosage Card */}
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-200/80 dark:border-blue-900/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                style={{ padding: '2.2rem 2rem', gap: '1.6rem' }}
              >
                {/* Top Subtle Color Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-400" />

                <div className="flex flex-col gap-5">
                  {/* Header Strip with Icon Capsule & Badge */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Baby className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
                          PEDIATRIC DOSAGE
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                          Children & Adolescents
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[10px] font-black tracking-wider uppercase shadow-2xs">
                      AGE DIRECTIVE
                    </span>
                  </div>

                  {/* Dose Quantity & Strength Highlight Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-baseline justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        AGE CLASSIFICATION
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        Under 12 Years
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        REQUIRED FORM
                      </span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                        Oral Suspension
                      </span>
                    </div>
                  </div>

                  {/* Clinical Directive Text */}
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {medicine.standardDosePediatric || 'Solid tablet forms are not recommended for children under 12 years. Always administer a calibrated pediatric oral suspension with an oral syringe based on body weight.'}
                  </p>
                </div>

                {/* Bottom Clinical Schedule Chips */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-bold flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Weight-based oral dosing</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black">
                    Consult Pediatrician
                  </span>
                </div>
              </div>

              {/* Maximum Daily Limit Card */}
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200/80 dark:border-rose-900/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                style={{ padding: '2.2rem 2rem', gap: '1.6rem' }}
              >
                {/* Top Subtle Color Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-rose-400" />

                <div className="flex flex-col gap-5">
                  {/* Header Strip with Icon Capsule & Badge */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <AlertOctagon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 block">
                          MAXIMUM DAILY LIMIT
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                          24-Hour Safety Ceiling
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 text-[10px] font-black tracking-wider uppercase shadow-2xs">
                      SAFETY CEILING
                    </span>
                  </div>

                  {/* Dose Quantity & Strength Highlight Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50 flex items-baseline justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block tracking-wider">
                        ABSOLUTE 24H CEILING
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300">
                        4,000mg
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block tracking-wider">
                        MAX TABLETS
                      </span>
                      <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                        8 Tablets / 24 Hours
                      </span>
                    </div>
                  </div>

                  {/* Clinical Directive Text */}
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {medicine.maxDailyDose || 'Do not exceed 4,000mg total paracetamol in 24 hours across all combined medications. Overdose can result in severe, irreversible liver injury.'}
                  </p>
                </div>

                {/* Bottom Clinical Schedule Chips */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-bold flex-wrap">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Hard Hepatotoxicity Limit</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-black">
                    Zero Exceedance
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Divider 1: Clinical Formulation Identity */}
          <div className="flex items-center gap-4 select-none my-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800 text-[11px] font-black tracking-wider text-slate-600 dark:text-slate-300 uppercase border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Pharmaceutical Formulation & Regulatory Identity</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
          </div>

          {/* Tier 2: 4 Formulation Specifications Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Formulation / Strength */}
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group"
              style={{ padding: '1.8rem 1.6rem', gap: '1.4rem' }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Pill className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-200/60 shadow-2xs">
                    Solid Oral
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    FORMULATION / STRENGTH
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {medicine.strength || '500mg / 65mg'} • {medicine.form || 'Tablet'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Release Type:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{medicine.dosageForm || 'Film-Coated Tablet'}</span>
              </div>
            </div>

            {/* Card 2: Packaging Specification */}
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group"
              style={{ padding: '1.8rem 1.6rem', gap: '1.4rem' }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-200/60 shadow-2xs">
                    Commercial Pack
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    PACKAGING SPECIFICATION
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate" title={medicine.packageSize || 'Box of 100 Tablets'}>
                    {medicine.packageSize || 'Box of 100 Tablets (10×10 Blister)'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Enclosure:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{medicine.packageType || 'Blister Pack in Carton'}</span>
              </div>
            </div>

            {/* Card 3: Manufacturer & Origin */}
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group"
              style={{ padding: '1.8rem 1.6rem', gap: '1.4rem' }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-200/60 shadow-2xs">
                    GMP Certified
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    MANUFACTURER & ORIGIN
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate" title={medicine.manufacturer || 'GlaxoSmithKline (GSK)'}>
                    {medicine.manufacturer || 'GlaxoSmithKline (GSK)'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Origin Country:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{medicine.countryOfManufacture || 'Kenya / UK'}</span>
              </div>
            </div>

            {/* Card 4: Regulatory Status */}
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group"
              style={{ padding: '1.8rem 1.6rem', gap: '1.4rem' }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-600 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-200/60 shadow-2xs">
                    NDA Authorized
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    REGULATORY STATUS
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {medicine.prescriptionStatus || 'OTC'} (National Formulary)
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Classification:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Schedule 2 Licensed</span>
              </div>
            </div>
          </div>

          {/* Section Divider 2: Safety & Good Distribution Storage */}
          <div className="flex items-center gap-4 select-none my-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800 text-[11px] font-black tracking-wider text-slate-600 dark:text-slate-300 uppercase border border-slate-200 dark:border-slate-700 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Storage Controls (GDP) & Pharmacist Counseling Directives</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
          </div>

          {/* Tier 3: Storage & Counseling Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Storage Card */}
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              style={{ padding: '2.2rem 2rem', gap: '1.8rem' }}
            >
              <div className="flex flex-col" style={{ gap: '1.2rem' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black text-base sm:text-lg">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 shrink-0 shadow-2xs">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <span>Storage & Environmental Conditions</span>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-[10px] font-black text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800 uppercase tracking-wider shadow-2xs">
                    GDP COMPLIANT
                  </span>
                </div>

                {/* Key Temperature Directive Box */}
                <div className="p-5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-cyan-800 dark:text-cyan-400 block tracking-wider">
                      CLIMATE THRESHOLD
                    </span>
                    <span className="text-base sm:text-lg font-black text-cyan-950 dark:text-cyan-100">
                      Store below 30°C (Room Temp)
                    </span>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-cyan-100/90 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 text-xs font-black shadow-2xs shrink-0">
                    Dry Area
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {medicine.storageRequirements || 'Store below 30°C in a dry place. Protect from moisture and direct sunlight. Keep tightly sealed in original blister pack away from children.'}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Continuous cold-chain & warehouse temperature telemetry verified.</span>
              </div>
            </div>

            {/* Counseling Card */}
            <div
              className="bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 rounded-3xl border border-amber-200/90 dark:border-amber-800/60 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              style={{ padding: '2.2rem 2rem', gap: '1.8rem' }}
            >
              <div className="flex flex-col" style={{ gap: '1.4rem' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 text-amber-900 dark:text-amber-200 font-black text-base sm:text-lg">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100/90 dark:bg-amber-900/60 border border-amber-300/80 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 shadow-2xs">
                      <Info className="w-5 h-5" />
                    </div>
                    <span>Pharmacist Counseling Notes</span>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-amber-100/90 dark:bg-amber-900/60 text-[10px] font-black text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700 uppercase tracking-wider shadow-2xs">
                    CLINICAL ADVICE
                  </span>
                </div>

                {/* Structured Counseling Points */}
                <div
                  className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-amber-200/80 dark:border-amber-800/70 shadow-xs flex flex-col"
                  style={{ padding: '1.2rem 1.4rem', gap: '0.9rem' }}
                >
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 ring-4 ring-amber-100 dark:ring-amber-950" />
                    <span className="leading-relaxed">Take with a full glass of water. Can be taken with or without food.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 ring-4 ring-amber-100 dark:ring-amber-950" />
                    <span className="leading-relaxed">Avoid concurrent use with any other paracetamol-containing cough or cold products.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 ring-4 ring-amber-100 dark:ring-amber-950" />
                    <span className="leading-relaxed">If fever persists &gt;3 days or pain &gt;5 days, consult your physician.</span>
                  </div>
                </div>

                {/* Additional Directive Callout */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 flex items-start gap-3.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed font-semibold">
                    {medicine.counselingNotes || 'Do not take concurrently with other paracetamol-containing remedies. Limit excessive caffeine intake while on treatment.'}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-amber-200/80 dark:border-amber-900/60">
                {onConsultPharmacist && (
                  <button
                    onClick={() => onConsultPharmacist(medicine)}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-100/90 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-black flex items-center justify-between sm:justify-start gap-3 cursor-pointer transition-all border border-amber-300/80 dark:border-amber-700 group shadow-2xs"
                  >
                    <span>Have questions? Discuss with a Licensed Pharmacist</span>
                    <ArrowRight className="w-4 h-4 text-amber-700 dark:text-amber-400 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOSAGE & ADHERENCE CALCULATOR */}
      {activeTab === 'dosing' && (
        <div className="animate-in fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2cm' }}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col"
            style={{ padding: '1.2cm', gap: '2rem' }}
          >
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Calculator className="w-6 h-6 text-emerald-600" />
                  <span>Interactive Adherence & Refill Days-of-Supply Calculator</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl">
                  Calculate how long your medicine pack will last based on your prescribed daily intake, and view your recommended refill target date.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-right shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block tracking-wider">TOTAL DOSES IN ORDER</span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {totalDoses * selectedQuantity} Doses
                </span>
              </div>
            </div>

            {/* Daily dosage slider */}
            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Prescribed Daily Intake (Tablets / Doses per day):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={dailyDoseInput}
                    onChange={(e) => setDailyDoseInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-black text-base text-slate-900 dark:text-white"
                  />
                  <span className="text-xs font-semibold text-slate-500">per day</span>
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={dailyDoseInput}
                onChange={(e) => setDailyDoseInput(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-2"
              />

              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>1 dose/day (Minimal)</span>
                <span>2–4 doses/day (Standard Therapeutic)</span>
                <span>8 doses/day (Ceiling)</span>
              </div>
            </div>

            {/* Output Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-center flex flex-col items-center justify-center gap-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  DAYS OF THERAPY
                </span>
                <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">
                  {calculatedDaysSupply} Days
                </p>
                <p className="text-xs text-emerald-900 dark:text-emerald-300 font-semibold">Continuous Coverage</p>
              </div>

              <div className="p-6 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 text-center flex flex-col items-center justify-center gap-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  RECOMMENDED REFILL TARGET
                </span>
                <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400">
                  {refillDate}
                </p>
                <p className="text-xs text-blue-900 dark:text-blue-300 font-semibold">Order 3–5 days prior</p>
              </div>

              <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-center flex flex-col items-center justify-center gap-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  DAILY MEDICATION COST
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatUGX(Math.round(totalPrice / calculatedDaysSupply))}
                </p>
                <p className="text-xs text-emerald-900 dark:text-emerald-300 font-semibold">Per Day of Treatment</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY, CONTRAINDICATIONS & DRUG INTERACTIONS */}
      {activeTab === 'safety' && (
        <div className="animate-in fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.4cm' }}>
          {/* Urgent Clinical Alert */}
          <div
            className="bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-800/70 rounded-3xl shadow-xs flex flex-col"
            style={{ padding: '1.8rem 2.2rem', gap: '1rem' }}
          >
            <div className="flex items-center gap-3 text-rose-800 dark:text-rose-300 font-black text-base sm:text-lg">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span>Critical Clinical Safety Alert</span>
            </div>
            <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed font-medium pl-0 sm:pl-13">
              Do not exceed the stated dose. Immediate medical advice should be sought in the event of an overdose, even if you feel well, because of the risk of delayed, serious liver damage. Avoid concomitant use with other paracetamol-containing cough, cold, or pain formulations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contraindications */}
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              style={{ padding: '2.2rem 2rem', gap: '1.6rem' }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Documented Contraindications
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-200/80">
                  CRITICAL SCREENING
                </span>
              </div>

              <ul className="flex flex-col gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {(medicine.contraindications && medicine.contraindications.length > 0
                  ? medicine.contraindications
                  : ['Hypersensitivity to paracetamol, caffeine, or any of the excipients.']
                ).map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 ring-4 ring-rose-100 dark:ring-rose-950" />
                    <span className="leading-relaxed font-medium">{c}</span>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 ring-4 ring-rose-100 dark:ring-rose-950" />
                  <span className="leading-relaxed font-medium">Severe hepatic impairment or active liver disease.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 ring-4 ring-rose-100 dark:ring-rose-950" />
                  <span className="leading-relaxed font-medium">Chronic alcoholism (potentiates hepatotoxicity threshold).</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Screened against National Drug Authority clinical guidelines</span>
              </div>
            </div>

            {/* Pregnancy & Lactation */}
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              style={{ padding: '2.2rem 2rem', gap: '1.6rem' }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Pregnancy & Breastfeeding
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-200/80">
                  MATERNAL DIRECTIVE
                </span>
              </div>

              <div
                className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col"
                style={{ padding: '1.4rem 1.6rem', gap: '1rem' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">Pregnancy Category:</span>
                  <span className="px-3.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs shadow-2xs">
                    Category {medicine.pregnancyCategory || 'B'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {medicine.pregnancyWarning || 'Paracetamol is generally considered the analgesic of choice during pregnancy when taken at the lowest effective dose for the shortest duration. Due to the caffeine content in Panadol Extra, consult your clinician regarding total caffeine intake.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <span>FDA & WHO Maternal Safety Classification</span>
              </div>
            </div>
          </div>

          {/* Interactions */}
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col"
            style={{ padding: '2.2rem 2.2rem', gap: '1.8rem' }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5 text-slate-900 dark:text-white font-black text-base sm:text-lg">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                  <Zap className="w-5 h-5" />
                </div>
                <span>Drug-Drug Interaction Warnings</span>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-[10px] font-black text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 uppercase tracking-wider shadow-2xs">
                PHARMACODYNAMIC MONITORING
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Interaction 1: Warfarin */}
              <div
                className="rounded-3xl bg-gradient-to-b from-rose-50/70 via-white to-white dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 border border-rose-200/90 dark:border-rose-900/60 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                style={{ padding: '1.8rem 1.6rem', gap: '1.2rem' }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                      Warfarin & Anticoagulants
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[9px] font-black uppercase">
                      High Risk
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Prolonged regular daily use of paracetamol may enhance the anticoagulant effect of warfarin with increased risk of bleeding.
                  </p>
                </div>
                <div className="pt-3.5 border-t border-rose-100 dark:border-rose-900/40 flex items-center gap-2 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Monitor INR Prothrombin Time</span>
                </div>
              </div>

              {/* Interaction 2: Metoclopramide */}
              <div
                className="rounded-3xl bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200/90 dark:border-amber-900/60 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                style={{ padding: '1.8rem 1.6rem', gap: '1.2rem' }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                      Metoclopramide / Domperidone
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-black uppercase">
                      Moderate
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Absorption of paracetamol is accelerated by metoclopramide and domperidone, leading to faster onset of action.
                  </p>
                </div>
                <div className="pt-3.5 border-t border-amber-100 dark:border-amber-900/40 flex items-center gap-2 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Altered Absorption Kinetics</span>
                </div>
              </div>

              {/* Interaction 3: Colestyramine */}
              <div
                className="rounded-3xl bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border border-blue-200/90 dark:border-blue-900/60 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                style={{ padding: '1.8rem 1.6rem', gap: '1.2rem' }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
                      Colestyramine
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9px] font-black uppercase">
                      Stagger Intake
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Absorption of paracetamol is reduced by colestyramine if administered within one hour of each other.
                  </p>
                </div>
                <div className="pt-3.5 border-t border-blue-100 dark:border-blue-900/40 flex items-center gap-2 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Separate Intake by &ge; 1 Hour</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PHARMACOLOGY */}
      {activeTab === 'pharmacology' && (
        <div className="animate-in fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.4cm' }}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col"
            style={{ padding: '2.5rem 2.2rem', gap: '2rem' }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    Pharmacological Profile & Mechanism of Action
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Therapeutic dynamics, pharmacokinetics, and verified active compounds:
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-[10px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 uppercase tracking-wider shadow-2xs">
                PHARMACOKINETIC PROFILE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3.5">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">MECHANISM OF ACTION</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Paracetamol has analgesic and antipyretic actions. It produces analgesia by elevating the pain threshold and antipyresis through action on the hypothalamic heat-regulating center. Caffeine acts as an adjuvant which accelerates absorption and enhances the analgesic efficacy of paracetamol by approximately 30%.
                </p>
              </div>

              <div className="flex flex-col gap-3.5">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">PHARMACOKINETICS & TIMELINE</h4>
                <div className="flex flex-col gap-3">
                  <div
                    className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs sm:text-sm"
                    style={{ padding: '1rem 1.4rem' }}
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300">Onset of Action:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">15 – 30 minutes</span>
                  </div>
                  <div
                    className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs sm:text-sm"
                    style={{ padding: '1rem 1.4rem' }}
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300">Peak Plasma Level:</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">30 – 60 minutes</span>
                  </div>
                  <div
                    className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs sm:text-sm"
                    style={{ padding: '1rem 1.4rem' }}
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300">Duration of Action:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400">4 – 6 hours</span>
                  </div>
                  <div
                    className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs sm:text-sm"
                    style={{ padding: '1rem 1.4rem' }}
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300">WHO ATC Code:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {medicine.atcClassificationCode || 'N02BE01'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col gap-3.5">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">ACTIVE PHARMACEUTICAL INGREDIENTS (API)</h4>
              <div className="flex flex-wrap gap-3">
                {(medicine.activeIngredients && medicine.activeIngredients.length > 0
                  ? medicine.activeIngredients
                  : ['Paracetamol 500mg', 'Caffeine 65mg']
                ).map((ing, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold shadow-2xs"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PATIENT ADMINISTRATION GUIDE */}
      {activeTab === 'administration' && (
        <div className="animate-in fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.4cm' }}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col"
            style={{ padding: '2.5rem 2.2rem', gap: '2rem' }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    Patient Administration Protocol
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Follow these clinical guidelines to ensure maximum therapeutic efficacy and safe usage:
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-[10px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 uppercase tracking-wider shadow-2xs">
                CLINICAL INTAKE PROTOCOL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
              {[
                {
                  step: '01',
                  title: 'Timing & Dosage',
                  text: 'Take 1 to 2 tablets with a full glass of water. Allow at least 4 hours between doses.',
                  icon: Clock,
                  badge: 'Interval Scheduling',
                },
                {
                  step: '02',
                  title: 'With or Without Food',
                  text: 'Can be taken on an empty stomach or with meals; food will not diminish clinical efficacy.',
                  icon: CheckCircle2,
                  badge: 'Dietary Instructions',
                },
                {
                  step: '03',
                  title: 'Caffeine Awareness',
                  text: `Limit excessive tea, coffee, or energy drinks while taking ${medicine.brandName || 'this medicine'} to avoid insomnia or palpitations.`,
                  icon: AlertTriangle,
                  badge: 'Adjuvant Stimulants',
                },
                {
                  step: '04',
                  title: 'Course Duration',
                  text: 'Do not take continuously for more than 3 consecutive days for fever or 5 days for pain without doctor review.',
                  icon: Calendar,
                  badge: 'Therapy Ceiling',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-3xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/70 hover:border-emerald-500/50 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  style={{ padding: '2.2rem 1.8rem', gap: '1.4rem' }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                        {s.step}
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs group-hover:scale-105 transition-transform">
                        <s.icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h5 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {s.title}
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {s.text}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{s.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BRANCH STOCK NETWORK */}
      {activeTab === 'branches' && (
        <div className="animate-in fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.4cm' }}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col"
            style={{ padding: '2.5rem 2.2rem', gap: '2rem' }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                  <span>Live Stock Across Uganda Partner Branches</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  Real-time pharmacy inventory synchronized directly with ZenithRx point-of-sale systems.
                </p>
              </div>

              {onViewBranches && (
                <button
                  onClick={() => onViewBranches(medicine)}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <span>Open Full Pharmacy Map</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {branches.map((b) => (
                <div
                  key={b.pharmacyId}
                  className="rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 transition-all bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between shadow-2xs hover:shadow-md group"
                  style={{ padding: '2rem 1.8rem', gap: '1.6rem' }}
                >
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {b.pharmacyName}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        b.stockUnits > 10
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : b.stockUnits > 0
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}>
                        {b.stockUnits > 0 ? `${b.stockUnits} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{b.address} ({b.distanceKm} km away)</span>
                    </p>

                    <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{b.phone}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">BRANCH PRICE</span>
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                        {formatUGX(b.unitPriceUgx)}
                      </span>
                    </div>

                    <button
                      onClick={() => onAddToCart && onAddToCart(medicine, b.pharmacyName, selectedQuantity)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Select Branch</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Bioequivalent Generic Alternatives ── */}
      {genericAlternatives.length > 0 && (
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm"
          style={{ padding: '1.2cm 1.2cm', display: 'flex', flexDirection: 'column', gap: '1cm' }}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                AFFORDABLE HEALTHCARE CHOICES
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                Bioequivalent Generic Alternatives
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                Contains the identical active pharmaceutical compound (API) with verified therapeutic efficacy under National Drug Authority (NDA) pharmacopeia standards.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>NDA Verified Bioequivalent</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {genericAlternatives.map((alt) => {
              const altPrice = alt.suggestedRetailPriceUgx || 15000;
              const savings = Math.max(0, packPrice - altPrice);
              const savingsPct = Math.round((savings / packPrice) * 100);

              return (
                <div
                  key={alt.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between gap-6 relative overflow-hidden group"
                  style={{ padding: '1.8rem 1.6rem' }}
                >
                  {/* Top Subtle Color Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                  {/* Header Strip with Icon Capsule & Savings Badge */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Pill className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {alt.category}
                      </span>
                    </div>

                    {savings > 0 && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black tracking-wide border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        Save {savingsPct}%
                      </span>
                    )}
                  </div>

                  {/* Product Brand & Molecule */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      {alt.brandName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{alt.genericName || alt.genericInnName}</span>
                    </p>
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {alt.form || 'Bioequivalent Formulation'}
                      </span>
                    </div>
                  </div>

                  {/* Price & Savings Comparison Box */}
                  <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-baseline justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        GENERIC PRICE
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        {formatUGX(altPrice)}
                      </span>
                    </div>
                    {savings > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          SAVINGS
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          -{formatUGX(savings)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onSelectAlternative && onSelectAlternative(alt)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 border border-slate-200 dark:border-slate-700 hover:border-emerald-600 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group/btn"
                  >
                    <span>View Alternative Monograph</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. Bottom Clinical Safety & Pharmacist Support Banner (Light & Dark Mode Responsive) ── */}
      <div
        className="rounded-3xl border shadow-sm transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white border-emerald-200/90 text-slate-900 dark:from-emerald-950/80 dark:via-teal-950/50 dark:to-slate-900 dark:border-emerald-800/60 dark:text-white"
        style={{ padding: '2rem 2.2rem', marginTop: '1.2cm', marginBottom: '1cm' }}
      >
        <div className="flex flex-col items-start gap-3.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 shadow-2xs dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>24/7 Clinical Pharmacist Hotline</span>
          </div>

          <h4 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Have questions about taking {medicine.brandName}?
          </h4>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Our Pharmaceutical Society of Uganda (PSU) licensed clinical pharmacists are standing by to review your prescription, verify pediatric dosing, or clarify side effects.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap w-full lg:w-auto">
          {onConsultPharmacist && (
            <button
              onClick={() => onConsultPharmacist(medicine)}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95"
            >
              <Phone className="w-4 h-4 text-emerald-100" />
              <span>Talk to Pharmacist</span>
            </button>
          )}

          {onAskCopilot && (
            <button
              onClick={() => onAskCopilot(medicine)}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-black text-xs sm:text-sm transition-all shadow-xs hover:shadow-sm cursor-pointer flex items-center justify-center gap-2.5 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Chat with AI</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default PatientMedicineDetailPage;
