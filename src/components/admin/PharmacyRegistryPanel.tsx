import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Search,
  Phone,
  Mail,
  ExternalLink,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Pill,
  FileText,
  Sparkles,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Clock,
  Award,
  MapPin,
  Check,
  X,
} from 'lucide-react';
import { ClientSubscription, TierName, TenantCapacityMetrics } from '../../types';
import { getAllTenantsCapacity, computeTenantCapacity } from '../../services/capacityService';
import { getNdaComplianceChecks, recordNdaComplianceAudit } from '../../services/ndaComplianceService';
import { sendSystemNotification, dispatchMultiChannelNotification } from '../../services/notificationService';
import {
  pharmacyRegistrationService,
  CertifiedPharmacyEntity,
  PharmacyApprovalStatus,
} from '../../services/pharmacyRegistrationService';
import { formatUGX } from '../../services/formatters';

interface PharmacyRegistryPanelProps {
  clients: ClientSubscription[];
  onSelectClient?: (client: ClientSubscription) => void;
  onNavigateTab?: (tab: any) => void;
}

export const PharmacyRegistryPanel: React.FC<PharmacyRegistryPanelProps> = ({
  clients,
  onSelectClient,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'pending' | 'compliance'>('all');
  const [certifiedPharmacies, setCertifiedPharmacies] = useState<CertifiedPharmacyEntity[]>(() =>
    pharmacyRegistrationService.getAllPharmacies()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [capacityData, setCapacityData] = useState<Record<string, TenantCapacityMetrics>>({});
  const [selectedEntity, setSelectedEntity] = useState<CertifiedPharmacyEntity | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load capacity & metrics
  const refreshMetrics = () => {
    setIsRefreshing(true);
    const all = pharmacyRegistrationService.getAllPharmacies();
    setCertifiedPharmacies(all);

    const map: Record<string, TenantCapacityMetrics> = {};
    clients.forEach((c) => {
      const metric = computeTenantCapacity(c.id, c.clientName, c.packageTier);
      map[c.id] = metric;
    });
    setCapacityData(map);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    refreshMetrics();

    const handleRegistryUpdated = () => {
      setCertifiedPharmacies(pharmacyRegistrationService.getAllPharmacies());
    };

    window.addEventListener('zenithrx_pharmacy_registry_updated', handleRegistryUpdated);
    window.addEventListener('storage', handleRegistryUpdated);

    return () => {
      window.removeEventListener('zenithrx_pharmacy_registry_updated', handleRegistryUpdated);
      window.removeEventListener('storage', handleRegistryUpdated);
    };
  }, [clients]);

  const pendingApprovals = certifiedPharmacies.filter(
    (p) =>
      p.approvalStatus === 'Pending Admin Verification' ||
      p.approvalStatus === 'Under Regulatory Review'
  );

  const handleApprovePharmacy = async (pharmacyId: string) => {
    const res = await pharmacyRegistrationService.approvePharmacy(
      pharmacyId,
      'Arthur Ssenabulya (Super Admin)',
      'Verified with National Drug Authority Uganda master premises register.'
    );

    if (res.success) {
      setActionSuccessMsg(
        `✓ Pharmacy "${res.entity?.pharmacyName}" approved! NDA certificate verified & operating tools unlocked.`
      );
      setCertifiedPharmacies(pharmacyRegistrationService.getAllPharmacies());
      setSelectedEntity(null);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    }
  };

  const handleRejectPharmacy = async (pharmacyId: string) => {
    const reason = window.prompt('Enter regulatory rejection reason for this pharmacy application:');
    if (!reason) return;

    const res = await pharmacyRegistrationService.rejectPharmacy(
      pharmacyId,
      'Arthur Ssenabulya (Super Admin)',
      reason
    );

    if (res.success) {
      setActionSuccessMsg(`Pharmacy application rejected. Reason logged for regulatory records.`);
      setCertifiedPharmacies(pharmacyRegistrationService.getAllPharmacies());
      setSelectedEntity(null);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    }
  };

  const filteredPharmacies = certifiedPharmacies.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.pharmacyName.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.ndaLicenseNo.toLowerCase().includes(q) ||
      p.supervisingPharmacistName.toLowerCase().includes(q) ||
      p.psuRegNo.toLowerCase().includes(q);

    const matchesTier = tierFilter === 'all' || p.packageTier === tierFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'Pending' && p.approvalStatus !== 'Approved') ||
      (statusFilter === 'Approved' && p.approvalStatus === 'Approved');

    const matchesSubTab =
      activeSubTab === 'all' ||
      (activeSubTab === 'pending' && p.approvalStatus !== 'Approved') ||
      (activeSubTab === 'compliance' && p.ndaVerified);

    return matchesSearch && matchesTier && matchesStatus && matchesSubTab;
  });

  const totalRegistered = certifiedPharmacies.length;
  const approvedCount = certifiedPharmacies.filter((p) => p.approvalStatus === 'Approved').length;
  const ndaCompliantCount = certifiedPharmacies.filter((p) => p.ndaVerified).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Entities</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalRegistered}</h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">100% Tenant Isolated</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending NDA Approvals</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{pendingApprovals.length}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Requires Admin Sign-off</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved &amp; Active</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{approvedCount}</h3>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Live Workstations</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">NDA Statutory Verified</p>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{ndaCompliantCount}</h3>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Full NDA Audit Trail</span>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Sub-tab Switcher & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Certified Pharmacies ({totalRegistered})
          </button>
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:text-amber-900'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingApprovals.length > 0 && (
              <span className="bg-white text-amber-900 text-[10px] font-black px-1.5 rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('compliance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'compliance'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            NDA Compliant ({ndaCompliantCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pharmacy, license, PSU, pharmacist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <span>Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="Starter">Starter</option>
              <option value="Professional">Professional</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Custom Tailored">Custom</option>
            </select>
          </div>

          <button
            onClick={refreshMetrics}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pharmacies Grid / Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredPharmacies.map((pharmacy) => {
          const isPending = pharmacy.approvalStatus !== 'Approved';

          return (
            <div
              key={pharmacy.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-xs ${
                isPending
                  ? 'border-amber-300 dark:border-amber-600/80 ring-2 ring-amber-400/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div>
                {/* Pharmacy Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {pharmacy.pharmacyName}
                      </h4>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          pharmacy.approvalStatus === 'Approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200'
                        }`}
                      >
                        {pharmacy.approvalStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{pharmacy.physicalAddress}, {pharmacy.district}</span>
                    </div>
                  </div>

                  <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0">
                    {pharmacy.packageTier} Tier
                  </span>
                </div>

                {/* Statutory Credentials */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 text-xs mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">NDA Premise License</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {pharmacy.ndaLicenseNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Supervising Pharmacist</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {pharmacy.supervisingPharmacistName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">PSU Reg Number</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {pharmacy.psuRegNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Official Email</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                      {pharmacy.contactEmail}
                    </span>
                  </div>
                </div>

                {/* Attached Compliance Documents Badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      pharmacy.documentsAttached.ndaOperatingLicense
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" /> NDA License
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      pharmacy.documentsAttached.psuPracticingCertificate
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" /> PSU Practicing Cert
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      pharmacy.documentsAttached.premisesSuitabilityCert
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pharmacy.documentsAttached.premisesSuitabilityCert ? <Check className="w-2.5 h-2.5" /> : '•'} Premises Cert
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                {isPending ? (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleApprovePharmacy(pharmacy.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve &amp; Issue License</span>
                    </button>
                    <button
                      onClick={() => handleRejectPharmacy(pharmacy.id)}
                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all border border-rose-200 dark:border-rose-800 cursor-pointer"
                    >
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Approved by {pharmacy.verifiedByAdmin || 'SysAdmin'}</span>
                    </span>
                    <button
                      onClick={() => {
                        const matchedClient = clients.find((c) => c.id === pharmacy.id) || {
                          id: pharmacy.id,
                          clientName: pharmacy.pharmacyName,
                          location: pharmacy.district,
                          contactPhone: pharmacy.contactPhone,
                          contactEmail: pharmacy.contactEmail,
                          packageTier: pharmacy.packageTier,
                          customMaxUsers: 5,
                          monthlyUgxRate: 72000,
                          billingStatus: 'Active' as const,
                          nextBillingDate: new Date().toISOString(),
                          allowedFeatures: {
                            basicInventory: true,
                            batchTracking: true,
                            autoReordering: true,
                            expiryAlerts: true,
                            posBilling: true,
                            salesAnalytics: true,
                            insuranceClaims: true,
                            aiCounseling: true,
                            multiLocation: true,
                            apiAccess: true,
                          },
                        };
                        if (onSelectClient) onSelectClient(matchedClient);
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
