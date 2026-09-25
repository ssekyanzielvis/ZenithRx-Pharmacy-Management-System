import React, { useState } from 'react';
import {
  pharmacyServicesCatalogueService,
  PharmacyServiceItem,
  ServiceCategory,
  SERVICE_CATEGORIES,
} from '../../services/pharmacyServicesCatalogueService';
import { pharmacyDiscoveryService } from '../../services/pharmacyDiscoveryService';
import { formatUGX } from '../../services/formatters';
import {
  Building2,
  Stethoscope,
  Pill,
  Sparkles,
  Syringe,
  Activity,
  Truck,
  RefreshCw,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Plus,
  Edit3,
  RotateCcw,
  Search,
  ShieldCheck,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface PharmacyServiceCatalogueConsoleProps {
  currentBranchId?: string;
}

const BRANCHES = [
  { id: 'client-001', name: 'Zenith Central Flagship', location: 'Kampala CBD, Plot 14 Kampala Rd' },
  { id: 'client-002', name: 'Garden City Mall Branch', location: 'Yusuf Lule Rd, Level 1 Arcade' },
  { id: 'client-004', name: 'Entebbe Road 24/7 Care', location: 'Entebbe Highway, Kajjansi Stage' },
];

export const PharmacyServiceCatalogueConsole: React.FC<PharmacyServiceCatalogueConsoleProps> = ({
  currentBranchId = 'client-001',
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(currentBranchId);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Service list state for selected branch
  const [services, setServices] = useState<PharmacyServiceItem[]>(
    pharmacyServicesCatalogueService.getServicesForPharmacy(selectedBranchId)
  );
  
  // Feedback toast state
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Edit Service Modal State
  const [editingService, setEditingService] = useState<PharmacyServiceItem | null>(null);

  // Add Custom Service Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceCategory>('screening');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePriceType, setNewServicePriceType] = useState<'free' | 'fixed_fee'>('fixed_fee');
  const [newServicePrice, setNewServicePrice] = useState(15000);
  const [newServiceDuration, setNewServiceDuration] = useState(15);
  const [newServiceRequiresAppt, setNewServiceRequiresAppt] = useState(false);
  const [newServiceClinicalNotes, setNewServiceClinicalNotes] = useState('');
  const [newServicePrereqs, setNewServicePrereqs] = useState('');

  const refreshList = (branchId: string) => {
    const list = pharmacyServicesCatalogueService.getServicesForPharmacy(branchId);
    setServices([...list]);
    pharmacyDiscoveryService.invalidateCache();
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    refreshList(branchId);
  };

  const handleToggle = (serviceCode: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    pharmacyServicesCatalogueService.toggleServiceStatus(selectedBranchId, serviceCode, nextStatus);
    refreshList(selectedBranchId);
    setFeedbackMessage(
      `Service status updated: ${nextStatus ? 'Enabled and published to patients' : 'Temporarily disabled'}`
    );
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    pharmacyServicesCatalogueService.updateServiceConfig(
      selectedBranchId,
      editingService.serviceCode,
      {
        serviceName: editingService.serviceName,
        description: editingService.description,
        priceType: editingService.priceType,
        priceUgx: editingService.priceUgx,
        estimatedDurationMinutes: editingService.estimatedDurationMinutes,
        requiresAppointment: editingService.requiresAppointment,
        clinicalNotes: editingService.clinicalNotes,
        prerequisites: editingService.prerequisites,
      }
    );

    refreshList(selectedBranchId);
    setEditingService(null);
    setFeedbackMessage(`Service configuration for "${editingService.serviceName}" saved successfully.`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceDesc.trim()) return;

    const created = pharmacyServicesCatalogueService.addCustomService(selectedBranchId, {
      serviceCode: `custom_${Date.now()}`,
      serviceCategory: newServiceCategory,
      serviceName: newServiceName.trim(),
      description: newServiceDesc.trim(),
      isEnabled: true,
      priceType: newServicePriceType,
      priceUgx: newServicePriceType === 'free' ? 0 : Number(newServicePrice),
      estimatedDurationMinutes: Number(newServiceDuration),
      requiresAppointment: newServiceRequiresAppt,
      isNdaAccredited: true,
      clinicalNotes: newServiceClinicalNotes.trim() || undefined,
      prerequisites: newServicePrereqs.trim() || undefined,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    });

    refreshList(selectedBranchId);
    setIsAddModalOpen(false);

    // Reset Form
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServicePrice(15000);
    setNewServiceDuration(15);
    setNewServiceRequiresAppt(false);
    setNewServiceClinicalNotes('');
    setNewServicePrereqs('');

    setFeedbackMessage(`Custom service "${created.serviceName}" published to patient discovery!`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleReset = () => {
    if (confirm('Reset this branch to official standard clinical service catalogue?')) {
      pharmacyServicesCatalogueService.resetToDefaults(selectedBranchId);
      refreshList(selectedBranchId);
      setFeedbackMessage('Restored standard clinical services defaults.');
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const filteredServices = services.filter((s) => {
    if (selectedCategory !== 'all' && s.serviceCategory !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.serviceName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.serviceCategory.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryIcon = (cat: ServiceCategory) => {
    switch (cat) {
      case 'dispensing':
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'otc':
        return <Sparkles className="w-4 h-4 text-teal-600" />;
      case 'consultation':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'vaccination':
        return <Syringe className="w-4 h-4 text-indigo-600" />;
      case 'screening':
        return <Activity className="w-4 h-4 text-purple-600" />;
      case 'delivery':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'refill':
        return <RefreshCw className="w-4 h-4 text-cyan-600" />;
      case 'other':
      default:
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
    }
  };

  const totalEnabled = services.filter((s) => s.isEnabled).length;
  const currentBranchObj = BRANCHES.find((b) => b.id === selectedBranchId) || BRANCHES[0];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 flex items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              NDA Clinical Service Governance
            </span>
            <span className="text-xs font-semibold text-slate-500">Cross-Platform Discovery Configuration</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Pharmacy Service Catalogue &amp; Clinical Offerings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure clinical consultations, routine vaccinations, point-of-care health screenings, automated refills, and express delivery for patient discovery.
          </p>
        </div>

        {/* Branch Selector & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Building2 className="w-4 h-4 text-slate-500 ml-1.5" />
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-slate-800 dark:text-slate-200 border-none outline-hidden pr-2 cursor-pointer"
            >
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id} className="dark:bg-slate-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Service</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all cursor-pointer"
            title="Reset to default NDA service offerings"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Offerings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalEnabled}</span>
            <span className="text-xs text-slate-400">of {services.length} published</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
            Visible on Patient Mobile Portal
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Clinical Screenings</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600">
              {services.filter((s) => s.serviceCategory === 'screening' && s.isEnabled).length}
            </span>
            <span className="text-xs text-slate-400">POC tests active</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">BP, Glucose, Malaria RDT</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Vaccinations</span>
            <Syringe className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">
              {services.filter((s) => s.serviceCategory === 'vaccination' && s.isEnabled).length}
            </span>
            <span className="text-xs text-slate-400">Cold-chain ready</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Yellow Card, Flu, HPV</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Refills &amp; Logistics</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              {services.filter((s) => (s.serviceCategory === 'delivery' || s.serviceCategory === 'refill') && s.isEnabled).length}
            </span>
            <span className="text-xs text-slate-400">services</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Express Courier + Auto Sync</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service name, clinical notes, or keywords..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5 self-center">
            <span>Configuring:</span>
            <span className="text-slate-800 dark:text-slate-200 underline font-black">
              {currentBranchObj.name}
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Categories ({services.length})
          </button>
          {SERVICE_CATEGORIES.map((cat) => {
            const count = services.filter((s) => s.serviceCategory === cat.category).length;
            return (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat.category
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {getCategoryIcon(cat.category)}
                <span>{cat.label}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.length === 0 ? (
          <div className="col-span-full p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No services found</h4>
            <p className="mt-1">Try resetting the search filters or add a new custom service for this branch.</p>
          </div>
        ) : (
          filteredServices.map((srv) => {
            const catMeta = SERVICE_CATEGORIES.find((c) => c.category === srv.serviceCategory);
            return (
              <div
                key={srv.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  srv.isEnabled
                    ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                    : 'border-dashed border-slate-300 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Category badge & Active Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                        catMeta?.badgeColor || 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {getCategoryIcon(srv.serviceCategory)}
                      <span>{catMeta?.label || srv.serviceCategory}</span>
                    </span>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggle(srv.serviceCode, srv.isEnabled)}
                      className={`px-3 py-1 rounded-full text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                        srv.isEnabled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300'
                      }`}
                      title={srv.isEnabled ? 'Click to disable service' : 'Click to enable service'}
                    >
                      {srv.isEnabled ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {srv.serviceName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  {/* Pricing & Duration Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      <span>{srv.priceType === 'free' ? 'Complimentary / Free' : formatUGX(srv.priceUgx)}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>~{srv.estimatedDurationMinutes} mins</span>
                    </span>

                    {srv.requiresAppointment ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-[10px] font-bold">
                        Appointment Required
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-[10px] font-bold">
                        Walk-in Welcome
                      </span>
                    )}
                  </div>

                  {/* Clinical Notes / Prerequisites */}
                  {(srv.clinicalNotes || srv.prerequisites) && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                      {srv.clinicalNotes && (
                        <div>
                          <strong className="text-slate-700 dark:text-slate-300">Clinical: </strong>
                          {srv.clinicalNotes}
                        </div>
                      )}
                      {srv.prerequisites && (
                        <div>
                          <strong className="text-slate-700 dark:text-slate-300">Prereq: </strong>
                          {srv.prerequisites}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">
                    Code: <code className="font-mono">{srv.serviceCode}</code>
                  </span>

                  <button
                    onClick={() => setEditingService({ ...srv })}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Edit Config</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Edit Service Modal ── */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Configure Service: {editingService.serviceName}
                </h3>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Display Name
                </label>
                <input
                  type="text"
                  value={editingService.serviceName}
                  onChange={(e) => setEditingService({ ...editingService, serviceName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Description
                </label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Price Structure
                  </label>
                  <select
                    value={editingService.priceType}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        priceType: e.target.value as any,
                        priceUgx: e.target.value === 'free' ? 0 : editingService.priceUgx || 10000,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="free">Free / Complimentary</option>
                    <option value="fixed_fee">Fixed Fee (UGX)</option>
                    <option value="starts_at">Starts At (UGX)</option>
                  </select>
                </div>

                {editingService.priceType !== 'free' && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fee Amount (UGX)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={editingService.priceUgx}
                      onChange={(e) =>
                        setEditingService({ ...editingService, priceUgx: Number(e.target.value) })
                      }
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Est. Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={editingService.estimatedDurationMinutes}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        estimatedDurationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Booking Policy
                  </label>
                  <select
                    value={editingService.requiresAppointment ? 'yes' : 'no'}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        requiresAppointment: e.target.value === 'yes',
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="no">Walk-in Welcome (No Appointment)</option>
                    <option value="yes">Appointment Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Guidelines / Equipment
                </label>
                <input
                  type="text"
                  value={editingService.clinicalNotes || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, clinicalNotes: e.target.value })
                  }
                  placeholder="e.g. Private consultation room, cold chain batch log required"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Prerequisites
                </label>
                <input
                  type="text"
                  value={editingService.prerequisites || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, prerequisites: e.target.value })
                  }
                  placeholder="e.g. 10hr fasting required, bring valid passport for Yellow Card"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Custom Service Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Add New Custom Service Offering
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomService} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g. Home Phlebotomy Sample Collection"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Service Category *
                  </label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as ServiceCategory)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Price Model
                  </label>
                  <select
                    value={newServicePriceType}
                    onChange={(e) => setNewServicePriceType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="fixed_fee">Fixed Fee (UGX)</option>
                    <option value="free">Free / Included</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Description *
                </label>
                <textarea
                  rows={2}
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  placeholder="Explain the clinical or wellness procedure and patient benefits..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              {newServicePriceType !== 'free' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fee Amount (UGX)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Est. Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prerequisites / Patient Instructions
                </label>
                <input
                  type="text"
                  value={newServicePrereqs}
                  onChange={(e) => setNewServicePrereqs(e.target.value)}
                  placeholder="e.g. Bring laboratory request form or medical history"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs transition-all"
                >
                  Publish Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
