import React, { useState } from 'react';
import {
  getMasterMedicines,
  MASTER_DRUG_INTERACTIONS,
} from '../../services/medicineSafetyService';
import { MasterMedicineItem, DrugInteraction } from '../../types';
import { MedicineKnowledgeBaseConsole } from '../MedicineKnowledgeBaseConsole';
import {
  Pill,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  Search,
  ThermometerSnowflake,
  Activity,
  Layers,
  Package,
  Building2,
  Globe,
  Sun,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  X,
  FileText,
  Lock,
} from 'lucide-react';
import { formatUGX } from '../../services/formatters';

export const AdminMedicineSafetyCatalogue: React.FC = () => {
  const [medicines] = useState<MasterMedicineItem[]>(getMasterMedicines());
  const [interactions] = useState<DrugInteraction[]>(MASTER_DRUG_INTERACTIONS);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'interactions' | 'knowledgeBase'>('knowledgeBase');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStorageFilter, setSelectedStorageFilter] = useState<string>('all');
  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState<string>('all');
  const [selectedMedicineModal, setSelectedMedicineModal] = useState<MasterMedicineItem | null>(null);

  // Grouping by Product Group / INN
  const productGroups: Record<string, MasterMedicineItem[]> = {};
  medicines.forEach((m) => {
    const groupKey = m.productGroupId || m.genericInnName || m.genericName;
    if (!productGroups[groupKey]) {
      productGroups[groupKey] = [];
    }
    productGroups[groupKey].push(m);
  });

  const filteredMeds = medicines.filter((m) => {
    const matchesSearch =
      m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.genericInnName && m.genericInnName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.atcClassificationCode && m.atcClassificationCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ndaRegistrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesStorage =
      selectedStorageFilter === 'all' ||
      (selectedStorageFilter === 'cold_chain' && m.isColdChainRequired) ||
      (selectedStorageFilter === 'room_temp' && !m.isColdChainRequired) ||
      (selectedStorageFilter === 'light_sensitive' && m.isLightSensitive);

    const matchesSchedule =
      selectedScheduleFilter === 'all' ||
      (selectedScheduleFilter === 'class_a' && (m.isPoisonScheduleA || m.controlledStatus?.includes('Class A'))) ||
      (selectedScheduleFilter === 'pom' && m.prescriptionStatus === 'POM') ||
      (selectedScheduleFilter === 'otc' && m.prescriptionStatus === 'OTC');

    return matchesSearch && matchesCategory && matchesStorage && matchesSchedule;
  });

  const filteredInteractions = interactions.filter(
    (i) =>
      i.primaryDrugGeneric.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.interactingDrugGeneric.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.clinicalEffect.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(medicines.map((m) => m.category)));

  const getPregnancyBadge = (cat: string) => {
    switch (cat) {
      case 'A':
      case 'B':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300';
      case 'C':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300';
      case 'D':
      case 'X':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              National Formulary &amp; Product/Packaging Master (§7, §8)
            </span>
            <span className="text-xs font-semibold text-slate-500">WHO INN &amp; Uganda NDA Aligned</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Medicine Master Data: Products • Formulations • Packaging
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Explicit modeling across INN active ingredients, strength formulations, packaging sizes, ATC codes, cold-chain profiles, and clinical contraindications.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('knowledgeBase')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'knowledgeBase'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Medicine Knowledge Base &amp; Clinical Decision Engine</span>
        </button>
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'catalogue'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Product &amp; Packaging Catalogue ({medicines.length} Formulations)
        </button>
        <button
          onClick={() => setActiveTab('interactions')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'interactions'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Clinical DDI &amp; Allergy Interaction Matrix ({interactions.length})
        </button>
      </div>

      {activeTab === 'knowledgeBase' ? (
        <MedicineKnowledgeBaseConsole />
      ) : (
        <>
      {/* Search & Multi-Axis Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'catalogue'
                  ? 'Search INN, brand name, ATC code (e.g. N02BE01), manufacturer, or NDA Reg...'
                  : 'Search interacting drugs or clinical management advice...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {activeTab === 'catalogue' && (
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Storage Filter */}
              <select
                value={selectedStorageFilter}
                onChange={(e) => setSelectedStorageFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Storage Profiles</option>
                <option value="cold_chain">Cold Chain (2°C - 8°C)</option>
                <option value="room_temp">Room Temperature</option>
                <option value="light_sensitive">Light Sensitive (Amber Protect)</option>
              </select>

              {/* Schedule Filter */}
              <select
                value={selectedScheduleFilter}
                onChange={(e) => setSelectedScheduleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Legal Classes</option>
                <option value="pom">Prescription-Only (POM)</option>
                <option value="otc">Over-The-Counter (OTC)</option>
                <option value="class_a">Class A Narcotic (DDA Lock)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─── TAB 1: Master Medicine Product & Packaging Catalogue ──────────── */}
      {activeTab === 'catalogue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeds.map((med) => (
              <div
                key={med.id}
                onClick={() => setSelectedMedicineModal(med)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  {/* Category & Status Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {med.category}
                    </span>

                    <div className="flex items-center gap-1">
                      {med.prescriptionStatus === 'POM' ? (
                        <span className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                          POM
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                          OTC
                        </span>
                      )}

                      {med.isPoisonScheduleA && (
                        <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> DDA
                        </span>
                      )}

                      {med.isColdChainRequired && (
                        <span className="text-[10px] font-black bg-cyan-100 text-cyan-900 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <ThermometerSnowflake className="w-2.5 h-2.5 text-cyan-700" /> 2-8°C
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Brand & INN Generic Hierarchy */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                      {med.brandName}
                    </h3>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                      {med.genericInnName || med.genericName}
                    </p>
                    {med.activeIngredients && med.activeIngredients.length > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Active: {med.activeIngredients.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Formulation & Packaging Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Strength:</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{med.strength}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Form / Route:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{med.form} ({med.route || 'Oral'})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Package Size:</span>
                      <span className="font-mono font-bold text-[11px] text-indigo-700 dark:text-indigo-300">{med.packageSize || med.standardUnit}</span>
                    </div>
                  </div>

                  {/* Manufacturer & Country */}
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{med.manufacturer || 'Licensed MFR'}</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Globe className="w-3 h-3 text-slate-400" />
                      {med.countryOfManufacture || 'Uganda'}
                    </span>
                  </div>
                </div>

                {/* Footer Pricing & Clinical Flags */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Retail Price</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {formatUGX(med.suggestedRetailPriceUgx)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getPregnancyBadge(med.pregnancyCategory)}`}>
                      Preg: Cat {med.pregnancyCategory}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 group-hover:underline">
                      Inspect &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMeds.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm">No medicines found matching the active query and filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Clinical Drug Interaction Rules ────────────────────────── */}
      {activeTab === 'interactions' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Primary Drug</th>
                  <th className="p-3.5">Interacting Drug</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Clinical Mechanism &amp; Effect</th>
                  <th className="p-3.5">Pharmacist Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInteractions.map((int) => (
                  <tr key={int.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{int.primaryDrugGeneric}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{int.interactingDrugGeneric}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          int.severity === 'Contraindicated'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : int.severity === 'Severe'
                            ? 'bg-red-100 text-red-800'
                            : int.severity === 'Moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {int.severity}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs">{int.clinicalEffect}</td>
                    <td className="p-3.5 font-medium text-indigo-600 dark:text-indigo-400 max-w-xs">{int.managementAdvice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: Deep Product • Formulation • Packaging Clinical Card ────── */}
      {selectedMedicineModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded uppercase">
                    ATC: {selectedMedicineModal.atcClassificationCode || 'N/A'}
                  </span>
                  <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded">
                    NDA Reg: {selectedMedicineModal.ndaRegistrationNumber}
                  </span>
                </div>
                <h3 className="font-black text-lg mt-1">
                  {selectedMedicineModal.brandName} ({selectedMedicineModal.strength})
                </h3>
                <p className="text-xs text-indigo-100">
                  {selectedMedicineModal.genericInnName || selectedMedicineModal.genericName}
                </p>
              </div>

              <button
                onClick={() => setSelectedMedicineModal(null)}
                className="text-white hover:text-indigo-200 p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Product, Formulation & Packaging Structure */}
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Product • Formulation • Packaging Architecture
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Strength Formulation</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedMedicineModal.strength}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dosage Form &amp; Route</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedMedicineModal.form} ({selectedMedicineModal.route || 'Oral'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Package Size</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedMedicineModal.packageSize || selectedMedicineModal.standardUnit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Manufacturer &amp; Country</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedMedicineModal.manufacturer || 'Licensed MFR'} ({selectedMedicineModal.countryOfManufacture || 'Uganda'})</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Storage & Environmental Requirements */}
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />
                  Storage &amp; Environmental Integrity
                </h4>

                <div className="p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-extrabold text-cyan-950 dark:text-cyan-200">
                      Temperature Range: {selectedMedicineModal.storageTemperatureRange}
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedMedicineModal.isColdChainRequired && (
                        <span className="bg-cyan-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                          ● Cold Chain Mandatory (2°C - 8°C)
                        </span>
                      )}
                      {selectedMedicineModal.isLightSensitive && (
                        <span className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sun className="w-3 h-3" /> Light Sensitive
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    <b>Handling Instructions:</b> {selectedMedicineModal.storageRequirements || 'Store in cool dry conditions.'}
                  </p>
                  {selectedMedicineModal.specialHandlingRequirements && (
                    <p className="text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                      * Special Notice: {selectedMedicineModal.specialHandlingRequirements}
                    </p>
                  )}
                </div>
              </div>

              {/* Section 3: Inventory & Reorder Thresholds */}
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Inventory Limits &amp; Automated Reorder Triggers
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-center">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Min Stock Level</span>
                    <span className="font-black text-sm text-slate-900 dark:text-slate-100">{selectedMedicineModal.minStockLevel || 50}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Stock Cap</span>
                    <span className="font-black text-sm text-slate-900 dark:text-slate-100">{selectedMedicineModal.maxStockLevel || 1000}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Reorder Trigger</span>
                    <span className="font-black text-sm text-amber-600">{selectedMedicineModal.reorderLevel || 100}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Reorder Qty (ROQ)</span>
                    <span className="font-black text-sm text-emerald-600">{selectedMedicineModal.reorderQuantity || 200}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Clinical Safety, Warnings & Pregnancy Category */}
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Clinical Safety &amp; Physiological Thresholds
                </h4>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 font-bold block">Standard Adult Dosing:</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{selectedMedicineModal.standardDoseAdult}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Maximum Safe Daily Dose:</span>
                      <p className="font-black text-rose-600 mt-0.5">{selectedMedicineModal.maxDailyDose}</p>
                    </div>
                  </div>

                  {selectedMedicineModal.blackboxWarning && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-900 dark:text-rose-200">
                      <b>BLACKBOX WARNING:</b> {selectedMedicineModal.blackboxWarning}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-500 font-bold block">Pregnancy Safety (FDA Category {selectedMedicineModal.pregnancyCategory}):</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                        {selectedMedicineModal.pregnancyWarning || 'Consult clinical guidelines before prescribing in pregnancy.'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Age Restrictions / Pediatric Guide:</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                        {selectedMedicineModal.ageRestrictions || 'Standard age-adjusted dosing.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold block">Pharmacist Counseling Notes:</span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 italic">
                      "{selectedMedicineModal.counselingNotes}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-bold">Wholesale Price:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatUGX(selectedMedicineModal.averageWholesalePriceUgx)}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-500 font-bold">Suggested Retail:</span>
                <span className="font-black text-emerald-600">{formatUGX(selectedMedicineModal.suggestedRetailPriceUgx)}</span>
              </div>

              <button
                onClick={() => setSelectedMedicineModal(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Close Formulation Sheet
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
