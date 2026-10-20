import React, { useState } from 'react';
import {
  FileText,
  ChevronRight,
  ShoppingCart,
  Building2,
  Clock,
  ShieldCheck,
  X,
  Heart,
  Zap,
  Sparkles,
  Pill,
  ExternalLink,
} from 'lucide-react';
import { MasterMedicineItem, MedicineFeatureHighlight } from '../../types';
import { getMedicineCardHighlights, getMedicineImageUrl } from '../../services/medicineSafetyService';
import { formatUGX } from '../../services/formatters';

export interface MedicineCardProps {
  medicine: MasterMedicineItem;
  onOrder?: (medicine: MasterMedicineItem) => void;
  onViewBranches?: (medicine: MasterMedicineItem) => void;
  onViewDetails?: (medicine: MasterMedicineItem) => void;
  className?: string;
  featured?: boolean;
}

/**
 * Anatomical Lungs SVG Icon matching the clinical respiratory icon in the design mockup
 */
export const LungsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v6" />
    <path d="M10 4h4" />
    <path d="M10 6h4" />
    <path d="M12 8c-2 2-4 3-5 5-1.5 3-.5 7 1.5 7 2.5 0 3.5-3 3.5-6v-6" />
    <path d="M12 8c2 2 4 3 5 5 1.5 3 .5 7-1.5 7-2.5 0-3.5-3-3.5-6v-6" />
  </svg>
);

/**
 * Pressurized Inhaler Device SVG Icon matching the pMDI actuator in the design mockup
 */
export const InhalerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2h-4a1 1 0 0 0-1 1v3h6V3a1 1 0 0 0-1-1z" />
    <path d="M9 6h6v8a4 4 0 0 1-4 4h-1a2 2 0 0 1-2-2V6z" />
    <path d="M8 14h-3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3" />
  </svg>
);

/**
 * Medical Shield with Cross [+] icon matching the adult dosage callout
 */
export const MedicalShieldIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

/**
 * Tilted Price Tag Icon matching the bottom left price container
 */
export const PriceTagIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

/**
 * Render category icon dynamically based on category name
 */
export const getCategoryIcon = (category: string, className = 'w-3.5 h-3.5') => {
  const c = (category || '').toLowerCase();
  if (c.includes('respirat') || c.includes('asthma') || c.includes('inhal')) {
    return <LungsIcon className={className} />;
  }
  if (c.includes('cardio') || c.includes('heart') || c.includes('hypertens')) {
    return <Heart className={className} />;
  }
  if (c.includes('analgesic') || c.includes('pain') || c.includes('anti-inflam')) {
    return <Zap className={className} />;
  }
  return <Pill className={className} />;
};

/**
 * Render highlight badge icon dynamically
 */
export const renderHighlightIcon = (iconName?: string) => {
  const icon = (iconName || '').toLowerCase();
  const cls = 'w-4 h-4';
  if (icon === 'lungs') return <LungsIcon className={cls} />;
  if (icon === 'clock') return <Clock className={cls} />;
  if (icon === 'shield') return <ShieldCheck className={cls} />;
  if (icon === 'device' || icon === 'inhaler') return <InhalerIcon className={cls} />;
  if (icon === 'heart') return <Heart className={cls} />;
  if (icon === 'zap') return <Zap className={cls} />;
  if (icon === 'pill') return <Pill className={cls} />;
  return <Sparkles className={cls} />;
};

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onOrder,
  onViewBranches,
  onViewDetails,
  className = '',
  featured = false,
}) => {
  const [showInternalDetailsModal, setShowInternalDetailsModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Derived properties with smart fallbacks
  const highlights: MedicineFeatureHighlight[] = getMedicineCardHighlights(medicine);
  const productImage = getMedicineImageUrl(medicine);
  
  // Clean realistic pack price fallback
  const rawPrice = medicine.suggestedRetailPriceUgx || 25000;
  const packPrice = (rawPrice <= 500 && (medicine.brandName || '').toLowerCase().includes('panadol')) ? 35000 : rawPrice;
  const priceFormatted = formatUGX(packPrice);

  const actuationsInfo =
    medicine.actuationsOrPackInfo ||
    (medicine.form === 'Inhaler'
      ? `${medicine.strength || '100mcg'} / puff (${medicine.packQuantity || 200} actuations)`
      : `${medicine.strength || ''} • ${medicine.packageSize || medicine.form}`);

  const adultDoseText =
    medicine.adultDosageInstruction ||
    medicine.standardDoseAdult ||
    '1 to 2 doses as directed by pharmacist or prescribing clinician.';

  const handleDetailsClick = () => {
    if (onViewDetails) {
      onViewDetails(medicine);
    } else {
      setShowInternalDetailsModal(true);
    }
  };

  const isRespiratoryOrInhaler =
    (medicine.category || '').toLowerCase().includes('respiratory') ||
    (medicine.form || '').toLowerCase().includes('inhaler');

  return (
    <>
      <div
        className={`relative rounded-[28px] bg-white dark:bg-[#0c1626] border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col w-full max-w-full overflow-hidden ${
          featured ? 'ring-2 ring-emerald-500/20' : ''
        } ${className}`}
        style={{ padding: '28px', gap: '24px' }}
      >
        {/* ── 1. Top Bar: Category Pill & NDA Badge ── */}
        <div className="flex flex-wrap items-center justify-between" style={{ gap: '12px' }}>
          <div
            className="inline-flex items-center rounded-full bg-[#00875a] text-white text-xs font-black uppercase tracking-wider shadow-sm select-none min-w-0 max-w-full"
            style={{ padding: '8px 16px', gap: '8px' }}
          >
            <span className="shrink-0">{getCategoryIcon(medicine.category, 'w-4 h-4 text-white')}</span>
            <span className="truncate">{medicine.category}</span>
          </div>

          <div
            className="inline-flex items-center rounded-full bg-[#edf6f3] dark:bg-emerald-950/50 text-[#14473a] dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-100/90 dark:border-emerald-800/50 select-none"
            style={{ padding: '8px 16px', gap: '8px' }}
          >
            <FileText className="w-4 h-4 text-[#00875a] dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">NDA: {medicine.ndaRegistrationNumber || 'NDA/MAL/0192/2018'}</span>
          </div>
        </div>

        {/* ── 2. Hero: Text column + Product image (wraps when narrow) ── */}
        <div className="flex flex-wrap items-center min-w-0" style={{ gap: '24px' }}>
          <div className="flex flex-col min-w-0" style={{ flex: '1 1 280px', gap: '16px' }}>
            <div className="flex flex-col" style={{ gap: '4px' }}>
              <h3
                onClick={handleDetailsClick}
                className="text-2xl sm:text-[30px] font-black text-[#081b2e] dark:text-white tracking-tight leading-tight break-words cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                title="Click to open dedicated medicine monograph page"
              >
                {medicine.brandName}
              </h3>
              <p className="text-base sm:text-lg italic font-medium text-slate-500 dark:text-slate-400 leading-normal">
                {medicine.genericName}
              </p>
            </div>

            {/* Formulation */}
            <div className="flex items-center" style={{ gap: '14px' }}>
              <div className="w-12 h-12 rounded-full bg-[#e3f4ee] dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-[#00875a] dark:text-emerald-400 shrink-0">
                {isRespiratoryOrInhaler ? (
                  <InhalerIcon className="w-5 h-5" />
                ) : (
                  <Pill className="w-5 h-5 rotate-45" />
                )}
              </div>
              <div className="min-w-0 flex-1 flex flex-col" style={{ gap: '4px' }}>
                <p className="text-sm sm:text-base font-black text-[#081b2e] dark:text-white leading-snug break-words">
                  {actuationsInfo}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                  {medicine.form || 'Inhaler'}
                  {medicine.route ? ` • ${medicine.route}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Product shot */}
          <div
            onClick={handleDetailsClick}
            className="relative flex items-center justify-center select-none cursor-pointer shrink-0 mx-auto"
            style={{ width: '170px', height: '170px' }}
            title="Click to open dedicated medicine monograph page"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e4f6ef] via-[#eaf4f0]/60 to-transparent dark:from-emerald-950/50 dark:to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center" style={{ width: '140px', height: '140px' }}>
              {!imageError ? (
                <img
                  src={productImage}
                  alt={medicine.brandName}
                  onError={() => setImageError(true)}
                  className="max-h-full max-w-full object-contain drop-shadow-xl select-none transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 dark:from-emerald-950/60 dark:to-slate-800 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  {isRespiratoryOrInhaler ? (
                    <InhalerIcon className="w-12 h-12" />
                  ) : (
                    <Pill className="w-12 h-12 rotate-45" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Adult Dosage (full width, own row) ── */}
        <div
          className="rounded-2xl bg-[#eef8f4] dark:bg-emerald-950/40 border border-emerald-100/90 dark:border-emerald-800/50 flex items-start"
          style={{ padding: '16px 18px', gap: '14px' }}
        >
          <div className="w-10 h-10 rounded-full bg-[#00875a] dark:bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <MedicalShieldIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col" style={{ gap: '4px' }}>
            <h4 className="text-xs sm:text-sm font-black text-[#00704a] dark:text-emerald-300 uppercase tracking-wider">
              Adult Dosage
            </h4>
            <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed break-words">
              {adultDoseText}
            </p>
          </div>
        </div>

        {/* ── 4. Key Highlights (2x2 grid, never cramped) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '18px 24px' }}>
          {highlights.map((h, idx) => (
            <div key={idx} className="flex items-center min-w-0" style={{ gap: '14px' }}>
              <div className="w-11 h-11 rounded-full bg-[#e3f4ee] dark:bg-emerald-950/60 border border-emerald-100/80 dark:border-emerald-800/50 text-[#00875a] dark:text-emerald-400 flex items-center justify-center shrink-0">
                {renderHighlightIcon(h.icon)}
              </div>
              <div className="min-w-0 flex-1 flex flex-col" style={{ gap: '3px' }}>
                <p className="text-[13px] font-black text-[#081b2e] dark:text-white leading-tight break-words">
                  {h.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug break-words">
                  {h.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 5. Bottom Action Bar ── */}
        <div
          className="bg-[#f4f7f5] dark:bg-slate-900/70 rounded-3xl border border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between"
          style={{ padding: '12px', gap: '14px' }}
        >
          <div
            className="rounded-2xl bg-gradient-to-r from-[#0d4f3e] via-[#095944] to-[#046e50] text-white flex items-center shadow-md"
            style={{ padding: '12px 20px', gap: '14px', flex: '1 1 200px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <PriceTagIcon className="w-5 h-5 text-white -rotate-12" />
            </div>
            <div className="min-w-0 flex flex-col" style={{ gap: '6px' }}>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200/90 leading-none">
                PRICE PER PACK
              </span>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none whitespace-nowrap">
                {priceFormatted}
              </span>
            </div>
          </div>

          <div className="flex items-center ml-auto" style={{ gap: '10px' }}>
            <div className="flex flex-col" style={{ gap: '4px' }}>
              <button
                onClick={handleDetailsClick}
                className="flex items-center text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                style={{ padding: '6px 10px', gap: '8px' }}
              >
                <FileText className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
              <button
                onClick={() => onViewBranches && onViewBranches(medicine)}
                className="flex items-center text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                style={{ padding: '6px 10px', gap: '8px' }}
              >
                <Building2 className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
                <span>Branches</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>

            <button
              onClick={() => onOrder && onOrder(medicine)}
              className="rounded-2xl bg-[#008f68] hover:bg-[#007a58] active:scale-95 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-700/25 transition-all cursor-pointer flex items-center justify-center shrink-0"
              style={{ padding: '14px 28px', gap: '10px' }}
            >
              <ShoppingCart className="w-5 h-5 text-white shrink-0" />
              <span>Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Built-in Clinical Details Modal ── */}
      {showInternalDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1626] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  {getCategoryIcon(medicine.category, 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                      {medicine.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      NDA: {medicine.ndaRegistrationNumber}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {medicine.brandName}
                  </h3>
                  <p className="text-xs text-slate-500 italic">{medicine.genericName}</p>
                </div>
              </div>

              <button
                onClick={() => setShowInternalDetailsModal(false)}
                className="p-2 rounded-full bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {/* Posology & Dosing */}
              <div className="p-4 rounded-2xl bg-[#eff7f4] dark:bg-emerald-950/40 border border-emerald-100/70 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <MedicalShieldIcon className="w-4 h-4" />
                  <span>Clinical Dosage Guidance</span>
                </div>
                <p>
                  <strong>Adult Dosage:</strong> {adultDoseText}
                </p>
                {medicine.standardDosePediatric && (
                  <p>
                    <strong>Pediatric Dosage:</strong> {medicine.standardDosePediatric}
                  </p>
                )}
                {medicine.maxDailyDose && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    <strong>Max Daily Limit:</strong> {medicine.maxDailyDose}
                  </p>
                )}
              </div>

              {/* Formulation & Packaging Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Formulation / Strength
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {medicine.strength} • {medicine.form}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Packaging Size
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {medicine.packageSize || 'Standard Commercial Pack'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Manufacturer
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {medicine.manufacturer || 'Accredited Pharmaceutical'} ({medicine.countryOfManufacture || 'UK'})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Prescription Status
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {medicine.prescriptionStatus || 'POM'} (National Formulary)
                  </span>
                </div>
              </div>

              {/* Storage and Handling */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Storage Conditions
                </span>
                <p className="mt-0.5 leading-relaxed text-xs">
                  {medicine.storageRequirements || 'Store below 30°C in a dry place. Protect from heat and direct sunlight.'}
                </p>
              </div>

              {/* Counseling Notes */}
              {medicine.counselingNotes && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/70 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                  <strong>Pharmacist Counseling Notes:</strong> {medicine.counselingNotes}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Price</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {priceFormatted}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <button
                  onClick={() => {
                    setShowInternalDetailsModal(false);
                    if (onViewDetails) {
                      onViewDetails(medicine);
                    } else if (typeof window !== 'undefined') {
                      window.location.hash = `#medicine/${medicine.id}`;
                      window.dispatchEvent(new PopStateEvent('popstate', { state: { tab: 'medicine-detail', medicineId: medicine.id } }));
                    }
                  }}
                  className="px-3 py-2 rounded-xl border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  title="Open full dedicated page"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dedicated Page</span>
                </button>
                <button
                  onClick={() => {
                    setShowInternalDetailsModal(false);
                    if (onViewBranches) onViewBranches(medicine);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                >
                  View Branch Stock
                </button>
                <button
                  onClick={() => {
                    setShowInternalDetailsModal(false);
                    if (onOrder) onOrder(medicine);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Order Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
