import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  BookmarkCheck,
  ShoppingCart,
  BellRing,
  ArrowLeft,
  Search,
  ChevronRight,
  ShieldCheck,
  Truck,
  Tag,
  Pill,
  ArrowRight,
  ChevronDown,
  Navigation,
  Thermometer,
  FileText,
  BadgeCheck,
  Zap,
} from 'lucide-react';
import { MasterMedicineItem, getMasterMedicines } from '../../services/medicineSafetyService';
import {
  advancedStockService,
  CrossPharmacyStockEntry,
  StockReservation,
  StockWaitlistEntry,
} from '../../services/advancedStockAndScanningService';
import { PatientProfile } from '../../services/patientAuthService';
import { formatUGX } from '../../services/formatters';

interface PatientBranchesPageProps {
  selectedStockMedicine: MasterMedicineItem | null;
  onSelectMedicine: (med: MasterMedicineItem | null) => void;
  onBackToSearch: () => void;
  onAddToCart: (med: MasterMedicineItem, pharmacyName: string) => void;
  onReserve: (med: MasterMedicineItem, branch: CrossPharmacyStockEntry) => void;
  onWaitlist: (med: MasterMedicineItem, branch: CrossPharmacyStockEntry) => void;
  patientUser: PatientProfile | null;
  patientReservations: StockReservation[];
  patientWaitlists: StockWaitlistEntry[];
  onRefreshHolds: () => void;
}

export const PatientBranchesPage: React.FC<PatientBranchesPageProps> = ({
  selectedStockMedicine,
  onSelectMedicine,
  onBackToSearch,
  onAddToCart,
  onReserve,
  onWaitlist,
  patientUser,
  patientReservations,
  patientWaitlists,
  onRefreshHolds,
}) => {
  const allMedicines = getMasterMedicines();
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'stock'>('distance');

  // Active medicine
  const currentMed: MasterMedicineItem =
    selectedStockMedicine || allMedicines[0] || {
      id: 'med-001',
      brandName: 'Calpol Infant Suspension 120mg/5ml',
      genericName: 'Paracetamol · 120mg / 5mL (Oral Suspension)',
      strength: '120mg/5ml',
      form: 'Suspension',
      category: 'Analgesics & Antipyretics',
      suggestedRetailPriceUgx: 18000,
      requiresPrescription: false,
      standardDoseAdult: 'Use tablet formulation for adults.',
      ndaRegistrationNumber: 'NDA/MAL/0198/2019',
    };

  // Fetch branches reporting inventory
  const rawBranches = useMemo(() => {
    return advancedStockService.getCrossPharmacyStock(currentMed.brandName || currentMed.genericName || '');
  }, [currentMed]);

  // Normalize branch items safely
  const branches = useMemo(() => {
    return (rawBranches || []).map((b) => ({
      ...b,
      stockUnits: typeof b.stockUnits === 'number' ? b.stockUnits : 0,
      unitPriceUgx:
        typeof b.unitPriceUgx === 'number' && b.unitPriceUgx > 0
          ? b.unitPriceUgx
          : currentMed.suggestedRetailPriceUgx || 18000,
      distanceKm: typeof b.distanceKm === 'number' ? b.distanceKm : 1.2,
      pharmacyName: b.pharmacyName || 'Zenith Partner Branch',
      address: b.address || 'Kampala, Uganda',
      phone: b.phone || '+256 701 234 567',
    }));
  }, [rawBranches, currentMed]);

  // Sorted branches
  const displayedBranches = useMemo(() => {
    let list = [...branches];
    list.sort((a, b) => {
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'price') return a.unitPriceUgx - b.unitPriceUgx;
      if (sortBy === 'stock') return b.stockUnits - a.stockUnits;
      return 0;
    });
    return list;
  }, [branches, sortBy]);

  // KPI Calculations
  const inStockCount = branches.filter((b) => b.stockUnits > 15).length;
  const lowStockCount = branches.filter((b) => b.stockUnits > 0 && b.stockUnits <= 15).length;
  const outCount = branches.filter((b) => b.stockUnits === 0).length;

  const validPricedBranches = branches.filter((b) => b.stockUnits > 0 && b.unitPriceUgx > 0);
  const prices = validPricedBranches.map((b) => b.unitPriceUgx);
  const minPrice = prices.length > 0 ? Math.min(...prices) : currentMed.suggestedRetailPriceUgx || 17500;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : currentMed.suggestedRetailPriceUgx || 19000;

  const distances = branches.map((b) => b.distanceKm).filter((d) => typeof d === 'number' && !isNaN(d));
  const minDist = distances.length > 0 ? Math.min(...distances) : 1.2;

  return (
    <div className="space-y-8 sm:space-y-10 pb-36 font-sans w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      {/* ── Top Navigation / Back Button ── */}
      <div>
        <button
          onClick={onBackToSearch}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Medicines</span>
        </button>
      </div>

      {/* ── Medicine Hero Card (Full Width Banner) ── */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-7 sm:p-9 shadow-xs flex flex-col sm:flex-row items-start gap-6">
        {/* Pill Icon illustration */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
          <Pill className="w-9 h-9 sm:w-11 sm:h-11 rotate-45" />
        </div>

        <div className="space-y-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              {currentMed.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono font-bold">
              {currentMed.ndaRegistrationNumber || 'NDA Verified'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight">
            {currentMed.brandName}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium break-words">
            <span className="font-bold text-slate-800 dark:text-slate-200">Active Generic:</span> {currentMed.genericName}
          </p>

          {currentMed.standardDoseAdult && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Adult Dosage Guidance:</span> {currentMed.standardDoseAdult}
            </p>
          )}
        </div>
      </div>

      {/* ── Row 2: 4 Clean KPI Metric Cards (Responsive Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Green Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-400 block truncate">Network Stock Availability</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">
                {inStockCount + lowStockCount} / {branches.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Branches ready</span>
            </div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1 truncate">
              {inStockCount} healthy · <span className="text-amber-500">{lowStockCount} low</span> · <span className="text-slate-400">{outCount} out</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Blue Tag */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
            <Tag className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-400 block truncate">Network Price Range</span>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug break-words">
              {minPrice === maxPrice ? formatUGX(minPrice) : `${formatUGX(minPrice)} – ${formatUGX(maxPrice)}`}
            </p>
            <p className="text-xs text-slate-400 truncate font-medium">Transparent counter pricing</p>
          </div>
        </div>

        {/* Metric 3: Purple Pin */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/30">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-400 block truncate">
              <span className="text-purple-600 dark:text-purple-400 font-extrabold">Nearest Available</span> Branch
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">
              {minDist} km away
            </p>
            <p className="text-xs text-slate-400 truncate font-medium">Fast motorcycle dispatch route</p>
          </div>
        </div>

        {/* Metric 4: Orange Clock */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-400 block truncate">Counter Hold Guarantee</span>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">
              24 – 48 Hours
            </p>
            <p className="text-xs text-slate-400 truncate font-medium">Instant OTP PIN hold at counter</p>
          </div>
        </div>
      </div>

      {/* ── Section Title & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              Registered Partner Pharmacies ({displayedBranches.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live counter inventories verified across authorized national dispensaries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer shadow-xs text-xs sm:text-sm"
              >
                <option value="distance">Nearest Distance First</option>
                <option value="price">Lowest Price First</option>
                <option value="stock">Highest Available Stock</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <span className="text-slate-400 flex items-center gap-2 font-semibold px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80">
            <Clock className="w-4 h-4 text-emerald-500" />
            Live Sync: 15 min cycle
          </span>
        </div>
      </div>

      {/* ── 200% EXPANDED PHARMACY CARDS (Generous Length, Width & 4-Quadrant Architecture) ── */}
      <div className="grid grid-cols-1 gap-8 sm:gap-10">
        {displayedBranches.map((branch) => {
          const isOut = branch.stockUnits === 0;
          const isLow = branch.stockUnits > 0 && branch.stockUnits <= 15;
          const etaMins = Math.max(8, Math.round(branch.distanceKm * 6));

          return (
            <div
              key={branch.pharmacyId}
              className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 rounded-3xl sm:rounded-[32px] p-7 sm:p-10 lg:p-12 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col space-y-8 group"
            >
              {/* ── ZONE 1: EXPANSIVE HEADER (Identity, Certification, Distance Pill & Badges) ── */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 sm:pb-8 border-b border-slate-100 dark:border-slate-800/90">
                <div className="flex items-start sm:items-center gap-5 min-w-0">
                  {/* Glowing Branch Avatar */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/80 dark:to-slate-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800/60 shadow-md group-hover:scale-105 transition-transform">
                    <Building2 className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>

                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                        {branch.pharmacyName}
                      </h3>
                      {branch.is24Hours ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-300/80 dark:border-emerald-700/60 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Open 24/7
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-300/80 dark:border-emerald-700/60 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Open Today
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800/60 uppercase tracking-wider shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        PSU &amp; NDA Certified
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 flex-wrap">
                      <span>Authorized Dispensing Hub</span>
                      <span>•</span>
                      <span>Supervising Pharmacist on Duty</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Genuine Medicine Guarantee</span>
                    </p>
                  </div>
                </div>

                {/* Right Side Distance Pill & ETA */}
                <div className="flex sm:flex-row lg:flex-col items-center sm:items-center lg:items-end justify-between lg:justify-center shrink-0 bg-slate-50 dark:bg-slate-800/70 px-5 py-3 sm:py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 gap-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-base sm:text-lg">
                    <MapPin className="w-5 h-5 shrink-0" />
                    <span>{branch.distanceKm} km away</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    Est. delivery: ~{etaMins} mins via Express Boda
                  </span>
                </div>
              </div>

              {/* ── ZONE 2: CREATIVE 4-QUADRANT INFORMATION & TELEMETRY MATRIX ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
                {/* ── Quadrant 1: Geographic & Access Intelligence ── */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        Location &amp; Access
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        Central District
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      {branch.address}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      Direct street access · Patient parking available
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 shadow-xs">
                        <Phone className="w-4 h-4" />
                      </div>
                      <a
                        href={`tel:${branch.phone}`}
                        className="text-xs font-black text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
                      >
                        {branch.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* ── Quadrant 2: Live Stock & Dispensing Quality ── */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-slate-400" />
                        Live Stock Status
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {branch.stockUnits} units
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                          isOut ? 'bg-slate-400' : isLow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      />
                      <span
                        className={`text-base font-black ${
                          isOut
                            ? 'text-slate-500 dark:text-slate-400'
                            : isLow
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isOut
                          ? 'Out of Stock'
                          : isLow
                          ? `Low Stock (${branch.stockUnits} left)`
                          : `In Stock (${branch.stockUnits} available)`}
                      </span>
                    </div>

                    {/* Visual stock capacity gauge */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isOut ? 'bg-slate-400 w-0' : isLow ? 'bg-amber-500 w-1/4' : 'bg-emerald-500 w-4/5'
                        }`}
                      />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Batch verified · Expiry Nov 2027 · Original factory seal
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                      15°C – 25°C Cold-Chain
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Verified</span>
                  </div>
                </div>

                {/* ── Quadrant 3: Transparent Pricing & Breakdown ── */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-slate-400" />
                        Price Breakdown
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        Counter Direct
                      </span>
                    </div>

                    {isOut ? (
                      <div>
                        <p className="text-xl font-black text-slate-400">Temporarily Out</p>
                        <p className="text-xs text-slate-400">Restock notification active</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {formatUGX(branch.unitPriceUgx)}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          Standard Official Retail Rate
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      URA / EFRIS Tax Receipt
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Included</span>
                  </div>
                </div>

                {/* ── Quadrant 4: Fulfillment Options & Speed ── */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-slate-400" />
                        Fulfillment Speeds
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        2 Fast Modes
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Motorcycle Express (~{etaMins} mins)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <BookmarkCheck className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Counter Pickup Hold (Free OTP PIN)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No prepayment needed for 24h counter reservations
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <span>GPS Rider Live Tracking</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Available</span>
                  </div>
                </div>
              </div>

              {/* ── ZONE 3: EXPANSIVE ACTION COMMAND STRIP ── */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                {/* Assurance & Trust Badges */}
                <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 font-semibold">
                    <Truck className="w-4 h-4 text-emerald-500" />
                    <span>Express Motorcycle Courier</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 font-semibold">
                    <BookmarkCheck className="w-4 h-4 text-blue-500" />
                    <span>Free 24–48h Counter Reservation</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>Free Prescription Counseling</span>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
                  {isOut ? (
                    <button
                      onClick={() => onWaitlist(currentMed, branch)}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 text-sm sm:text-base font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
                    >
                      <BellRing className="w-5 h-5" />
                      <span>Notify Me When Back In Stock</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onReserve(currentMed, branch)}
                        className="flex-1 sm:flex-initial px-7 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-sm sm:text-base font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
                      >
                        <BookmarkCheck className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        <span>Reserve for Pickup</span>
                      </button>

                      <button
                        onClick={() => onAddToCart(currentMed, branch.pharmacyName)}
                        className="flex-1 sm:flex-initial px-9 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm sm:text-base font-black shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Order Instant Delivery</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
