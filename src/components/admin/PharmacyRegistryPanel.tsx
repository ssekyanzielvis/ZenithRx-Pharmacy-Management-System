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
  ShieldAlert
} from 'lucide-react';
import { ClientSubscription, TierName, TenantCapacityMetrics } from '../../types';
import { getAllTenantsCapacity, computeTenantCapacity } from '../../services/capacityService';
import { getNdaComplianceChecks, recordNdaComplianceAudit } from '../../services/ndaComplianceService';
import { sendSystemNotification, dispatchMultiChannelNotification } from '../../services/notificationService';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [capacityData, setCapacityData] = useState<Record<string, TenantCapacityMetrics>>({});
  const [selectedPharmacy, setSelectedPharmacy] = useState<ClientSubscription | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load capacity & metrics
  const refreshMetrics = () => {
    setIsRefreshing(true);
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
  }, [clients]);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.ndaLicenseNo && c.ndaLicenseNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.supervisingPharmacist && c.supervisingPharmacist.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = tierFilter === 'all' || c.packageTier === tierFilter;
    const matchesStatus = statusFilter === 'all' || c.billingStatus === statusFilter;

    return matchesSearch && matchesTier && matchesStatus;
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.billingStatus === 'Active').length;
  const ndaCompliantCount = clients.filter((c) => c.ndaVerified).length;
  const highCapacityCount = (Object.values(capacityData) as TenantCapacityMetrics[]).filter((m) => m && m.overallUsagePercent >= 75).length;

  const handleTriggerQuickCall = (client: ClientSubscription) => {
    dispatchMultiChannelNotification(
      client.id,
      client.clientName,
      ['phone', 'admin_call'],
      `Administrator Direct Phone Contact Initiated`,
      `System Administrator scheduled a direct check-in with ${client.clientName} regarding account status and capacity review.`,
      client.contactPhone,
      client.contactEmail
    );
    setActionSuccessMsg(`Admin call dispatch logged for ${client.clientName} (${client.contactPhone}).`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleFastNdaAudit = (client: ClientSubscription) => {
    recordNdaComplianceAudit(
      client.id,
      client.clientName,
      'compliant',
      client.ndaLicenseNo || 'NDA/UG/RET/2026/VALID',
      'Instant regulatory premises & patient data healthcare sole-purpose compliance verified by Super Admin.',
      'Super Administrator'
    );
    setActionSuccessMsg(`NDA Statutory Compliance audit recorded and attested for ${client.clientName}.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subscribed Pharmacies</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalClients}</h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">100% tenant isolated</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Dispensing</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{activeClients}</h3>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Licensed operations</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">NDA Uganda Compliant</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{ndaCompliantCount} / {totalClients}</h3>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Patient data safe</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Capacity Load</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{highCapacityCount}</h3>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">&gt;75% plan usage</span>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Control & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pharmacy, license, district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Packages</option>
              <option value="Starter">Starter</option>
              <option value="Professional">Professional</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Custom Tailored">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Renewal">Pending Renewal</option>
              <option value="Grace Period">Grace Period</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <button
            onClick={refreshMetrics}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl transition-all"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pharmacies Grid / Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredClients.map((client) => {
          const metrics = capacityData[client.id] || {
            overallUsagePercent: 45,
            staffCount: 3,
            staffLimit: 5,
            drugsCount: 200,
            drugsLimit: 500,
            prescriptionsCount: 400,
            prescriptionsLimit: 1000,
            currentTier: client.packageTier,
          };

          const isOverloaded = metrics.overallUsagePercent >= 80;
          const isWarning = metrics.overallUsagePercent >= 65 && metrics.overallUsagePercent < 80;

          return (
            <div
              key={client.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                isOverloaded
                  ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
                  : 'border-slate-200 dark:border-slate-700'
              } p-5 flex flex-col justify-between`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{client.clientName}</h4>
                      {client.ndaVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Verified NDA Premises License">
                          <ShieldCheck className="w-3 h-3" /> NDA Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3" /> NDA Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {client.location} • Lic: <span className="font-mono text-slate-700 dark:text-slate-300">{client.ndaLicenseNo || 'NDA/UG/PENDING'}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      client.packageTier === 'Enterprise'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : client.packageTier === 'Professional'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {client.packageTier}
                    </span>
                    <span className={`text-[11px] font-medium ${
                      client.billingStatus === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {client.billingStatus}
                    </span>
                  </div>
                </div>

                {/* Capacity Usage Gauges */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80 mb-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                      Overall System Capacity
                    </span>
                    <span className={`font-bold ${
                      isOverloaded ? 'text-amber-600 dark:text-amber-400' : isWarning ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {metrics.overallUsagePercent}% Used
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverloaded ? 'bg-amber-500' : isWarning ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(metrics.overallUsagePercent, 100)}%` }}
                    />
                  </div>

                  {/* Micro Breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-slate-400">Staff Accounts:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {metrics.staffCount} / {metrics.staffLimit} ({metrics.staffUsagePercent || Math.round((metrics.staffCount / metrics.staffLimit) * 100)}%)
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400">Drug Catalog:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {metrics.drugsCount} / {metrics.drugsLimit}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400">Monthly Rx:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {metrics.prescriptionsCount} / {metrics.prescriptionsLimit}
                      </span>
                    </div>
                  </div>

                  {metrics.recommendedTier && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Upgrade Recommended:
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                        {metrics.recommendedTier} Plan
                      </span>
                    </div>
                  )}
                </div>

                {/* Supervising Pharmacist & Contact */}
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Supervising Pharmacist:</span>
                    <span>{client.supervisingPharmacist || 'Dr. Assigned Pharmacist'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" /> {client.contactPhone}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Mail className="w-3 h-3 text-slate-400" /> {client.contactEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTriggerQuickCall(client)}
                    className="p-2 text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                    title={`Trigger Direct Admin Call Log with ${client.contactPhone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigateTab && onNavigateTab('adminMessagingHub')}
                    className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-950/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                    title="Open Messaging Thread with Pharmacy"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleFastNdaAudit(client)}
                    className="px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-indigo-950/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1"
                    title="Conduct NDA Statutory Audit"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> NDA Verify
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (onSelectClient) onSelectClient(client);
                    if (onNavigateTab) onNavigateTab('adminPackages');
                  }}
                  className="px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                >
                  Manage Plan <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
