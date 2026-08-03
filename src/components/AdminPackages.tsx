import React, { useState } from 'react';
import {
  ClientSubscription,
  PackageTier,
  TierName,
  NdaPharmacyRecord,
  PharmacyUserAccount,
  UserRoleRank,
  UserAccessRights
} from '../types';
import {
  INITIAL_PACKAGE_TIERS,
  INITIAL_CLIENT_SUBSCRIPTIONS,
  NDA_REGISTERED_PHARMACIES
} from '../data/mockData';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Users,
  Sparkles,
  Sliders,
  DollarSign,
  PlusCircle,
  Building2,
  Phone,
  Mail,
  Globe,
  Tag,
  Search,
  Save,
  Check,
  Zap,
  Gift,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Database,
  FileText,
  Keyboard,
  ExternalLink,
  UserPlus,
  UserCheck,
  UserX,
  Lock,
  Key,
  ShieldAlert,
  Edit3,
  Trash2,
  Send,
  BadgeCheck,
  UserCog,
  CheckSquare,
  Square,
  User,
  Filter
} from 'lucide-react';

interface AdminPackagesProps {
  activeClient: ClientSubscription;
  setActiveClient: (client: ClientSubscription) => void;
}

export const getDefaultRightsForRole = (role: UserRoleRank): UserAccessRights => {
  switch (role) {
    case 'Supervising Pharmacist':
      return {
        canAccessPOS: true,
        canManageInventory: true,
        canProcessPrescriptions: true,
        canApproveReorders: true,
        canViewReports: true,
        canSubmitInsurance: true,
        canUseAiAssistant: true,
        canManageStaffAccounts: true,
      };
    case 'Assistant Pharmacist':
      return {
        canAccessPOS: true,
        canManageInventory: true,
        canProcessPrescriptions: true,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: true,
        canUseAiAssistant: true,
        canManageStaffAccounts: false,
      };
    case 'Pharmacy Technician':
      return {
        canAccessPOS: true,
        canManageInventory: true,
        canProcessPrescriptions: true,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: false,
        canUseAiAssistant: false,
        canManageStaffAccounts: false,
      };
    case 'POS Cashier / Dispenser':
      return {
        canAccessPOS: true,
        canManageInventory: false,
        canProcessPrescriptions: true,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: true,
        canUseAiAssistant: false,
        canManageStaffAccounts: false,
      };
    case 'Store & Inventory Manager':
      return {
        canAccessPOS: false,
        canManageInventory: true,
        canProcessPrescriptions: false,
        canApproveReorders: true,
        canViewReports: true,
        canSubmitInsurance: false,
        canUseAiAssistant: false,
        canManageStaffAccounts: false,
      };
    case 'Finance & Claims Officer':
      return {
        canAccessPOS: true,
        canManageInventory: false,
        canProcessPrescriptions: false,
        canApproveReorders: false,
        canViewReports: true,
        canSubmitInsurance: true,
        canUseAiAssistant: false,
        canManageStaffAccounts: false,
      };
    case 'Intern Pharmacist':
    default:
      return {
        canAccessPOS: false,
        canManageInventory: false,
        canProcessPrescriptions: true,
        canApproveReorders: false,
        canViewReports: false,
        canSubmitInsurance: false,
        canUseAiAssistant: true,
        canManageStaffAccounts: false,
      };
  }
};

export const getRoleBadgeStyle = (role: UserRoleRank) => {
  switch (role) {
    case 'Supervising Pharmacist':
      return 'bg-purple-100 text-purple-900 border-purple-300';
    case 'Assistant Pharmacist':
      return 'bg-indigo-100 text-indigo-900 border-indigo-300';
    case 'Pharmacy Technician':
      return 'bg-sky-100 text-sky-900 border-sky-300';
    case 'POS Cashier / Dispenser':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    case 'Store & Inventory Manager':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'Finance & Claims Officer':
      return 'bg-teal-100 text-teal-900 border-teal-300';
    case 'Intern Pharmacist':
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};

export const AdminPackages: React.FC<AdminPackagesProps> = ({
  activeClient,
  setActiveClient,
}) => {
  const [clients, setClients] = useState<ClientSubscription[]>(INITIAL_CLIENT_SUBSCRIPTIONS);
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClient.id);
  const [activeTab, setActiveTab] = useState<'matrix' | 'userAccounts' | 'showcase' | 'addClient'>('matrix');
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Form for new client creation & NDA linking
  const [registrationMode, setRegistrationMode] = useState<'ndaLink' | 'manualEntry'>('ndaLink');
  const [ndaSearchQuery, setNdaSearchQuery] = useState('');
  const [selectedNdaPharmacy, setSelectedNdaPharmacy] = useState<NdaPharmacyRecord | null>(null);
  const [isNdaSyncing, setIsNdaSyncing] = useState(false);
  const [manualNdaLicense, setManualNdaLicense] = useState('');
  const [supervisingPharmacistInput, setSupervisingPharmacistInput] = useState('');

  const [newClientName, setNewClientName] = useState('');
  const [newClientLocation, setNewClientLocation] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientTier, setNewClientTier] = useState<TierName>('Professional');

  // State for Designated Staff User Accounts Management
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userStaffRegNo, setUserStaffRegNo] = useState('');
  const [userRankRole, setUserRankRole] = useState<UserRoleRank>('Supervising Pharmacist');
  const [userAccountStatus, setUserAccountStatus] = useState<'Active' | 'Suspended' | 'Pending Invite'>('Active');
  const [userAccessRights, setUserAccessRights] = useState<UserAccessRights>(
    getDefaultRightsForRole('Supervising Pharmacist')
  );

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('All');

  const currentSelectedClient =
    clients.find((c) => c.id === selectedClientId) ||
    clients.find((c) => c.id === activeClient.id) ||
    clients[0];

  const handleToggleFeature = (featureKey: keyof ClientSubscription['allowedFeatures']) => {
    setClients((prevClients) =>
      prevClients.map((client) => {
        if (client.id === currentSelectedClient.id) {
          const updatedAllowed = {
            ...client.allowedFeatures,
            [featureKey]: !client.allowedFeatures[featureKey],
          };
          const updatedClient = { ...client, allowedFeatures: updatedAllowed };
          if (client.id === activeClient.id) {
            setActiveClient(updatedClient);
          }
          return updatedClient;
        }
        return client;
      })
    );
  };

  const handleUpdateUsers = (newUsers: number) => {
    setClients((prevClients) =>
      prevClients.map((client) => {
        if (client.id === currentSelectedClient.id) {
          const updatedClient = { ...client, customMaxUsers: Math.max(1, newUsers) };
          if (client.id === activeClient.id) {
            setActiveClient(updatedClient);
          }
          return updatedClient;
        }
        return client;
      })
    );
  };

  const handleUpdatePrice = (newRate: number) => {
    setClients((prevClients) =>
      prevClients.map((client) => {
        if (client.id === currentSelectedClient.id) {
          const updatedClient = { ...client, monthlyUgxRate: Math.max(0, newRate) };
          if (client.id === activeClient.id) {
            setActiveClient(updatedClient);
          }
          return updatedClient;
        }
        return client;
      })
    );
  };

  const handleApplyPresetTier = (tier: TierName) => {
    const tierTemplate = INITIAL_PACKAGE_TIERS.find((t) => t.id === tier);

    setClients((prevClients) =>
      prevClients.map((client) => {
        if (client.id === currentSelectedClient.id) {
          let updatedFeatures = { ...client.allowedFeatures };
          let maxUsers = client.customMaxUsers;
          let rate = client.monthlyUgxRate;

          if (tier === 'Starter') {
            maxUsers = 5;
            rate = 40000;
            updatedFeatures = {
              basicInventory: true,
              batchTracking: false,
              autoReordering: false,
              expiryAlerts: true,
              posBilling: true,
              salesAnalytics: false,
              insuranceClaims: false,
              aiCounseling: false,
              multiLocation: false,
              apiAccess: false,
            };
          } else if (tier === 'Professional') {
            maxUsers = 15;
            rate = 72000;
            updatedFeatures = {
              basicInventory: true,
              batchTracking: true,
              autoReordering: true,
              expiryAlerts: true,
              posBilling: true,
              salesAnalytics: true,
              insuranceClaims: true,
              aiCounseling: true,
              multiLocation: false,
              apiAccess: false,
            };
          } else if (tier === 'Enterprise') {
            maxUsers = 25;
            rate = 104000;
            updatedFeatures = {
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
            };
          }

          const updated = {
            ...client,
            packageTier: tier,
            customMaxUsers: maxUsers,
            monthlyUgxRate: promoApplied ? Math.round(rate * 0.8) : rate,
            allowedFeatures: updatedFeatures,
          };

          if (client.id === activeClient.id) {
            setActiveClient(updated);
          }
          return updated;
        }
        return client;
      })
    );

    setSaveNotification(`Applied ${tier} Package preset to ${currentSelectedClient.clientName}`);
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const handleApplyPromoCode = () => {
    if (promoCodeInput.trim().toUpperCase() === 'HOT 20' || promoCodeInput.trim().toUpperCase() === 'HOT20') {
      setPromoApplied(true);
      setPromoDiscountPercent(20);
      setSaveNotification('Promo code HOT 20 applied! 20% discount enabled for all client packages.');
      setTimeout(() => setSaveNotification(null), 3500);
    } else {
      alert('Invalid promo code. Try HOT 20 for a 20% discount.');
    }
  };

  const handleSelectNdaPharmacy = (pharmacy: NdaPharmacyRecord) => {
    setSelectedNdaPharmacy(pharmacy);
    setNewClientName(pharmacy.pharmacyName);
    setNewClientLocation(`${pharmacy.branchName}, ${pharmacy.district}`);
    setNewClientPhone(pharmacy.contactPhone);
    setNewClientEmail(pharmacy.contactEmail);
    setSupervisingPharmacistInput(`${pharmacy.supervisingPharmacist} (${pharmacy.psuRegNo})`);
    setSaveNotification(`Auto-filled details from NDA License: ${pharmacy.licenseNo}`);
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const handleSimulateNdaSync = () => {
    setIsNdaSyncing(true);
    setTimeout(() => {
      setIsNdaSyncing(false);
      setSaveNotification('Live NDA National Pharmacy Register synced! 100% verified licensing records loaded.');
      setTimeout(() => setSaveNotification(null), 3500);
    }, 1200);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    let initialFeatures = {
      basicInventory: true,
      batchTracking: true,
      autoReordering: true,
      expiryAlerts: true,
      posBilling: true,
      salesAnalytics: true,
      insuranceClaims: true,
      aiCounseling: true,
      multiLocation: false,
      apiAccess: false,
    };
    let users = 15;
    let price = 72000;

    if (newClientTier === 'Starter') {
      users = 5;
      price = 40000;
      initialFeatures.batchTracking = false;
      initialFeatures.autoReordering = false;
      initialFeatures.salesAnalytics = false;
      initialFeatures.insuranceClaims = false;
      initialFeatures.aiCounseling = false;
    } else if (newClientTier === 'Enterprise') {
      users = 25;
      price = 104000;
      initialFeatures.multiLocation = true;
      initialFeatures.apiAccess = true;
    }

    const assignedNdaLicense = registrationMode === 'ndaLink' && selectedNdaPharmacy
      ? selectedNdaPharmacy.licenseNo
      : (manualNdaLicense.trim() || undefined);

    const isVerified = registrationMode === 'ndaLink' && !!selectedNdaPharmacy;

    const assignedPharmacist = supervisingPharmacistInput.trim() || (selectedNdaPharmacy ? `${selectedNdaPharmacy.supervisingPharmacist} (${selectedNdaPharmacy.psuRegNo})` : undefined);

    const newClientId = `CLIENT-${Math.floor(100 + Math.random() * 900)}`;

    const initialUsersList: PharmacyUserAccount[] = assignedPharmacist
      ? [
          {
            id: `USR-${Math.floor(100 + Math.random() * 900)}`,
            clientId: newClientId,
            fullName: assignedPharmacist.split('(')[0].trim(),
            email: newClientEmail || `admin@${newClientName.toLowerCase().replace(/\s+/g, '')}.pharmsync.online`,
            phone: newClientPhone || '+256 700 000000',
            staffRegNo: assignedPharmacist.includes('(') ? assignedPharmacist.split('(')[1].replace(')', '') : 'PSU/REG/2026/NEW',
            rankRole: 'Supervising Pharmacist',
            status: 'Active',
            dateCreated: new Date().toISOString().split('T')[0],
            lastLogin: 'Never (Pending Activation)',
            accessRights: getDefaultRightsForRole('Supervising Pharmacist'),
          },
        ]
      : [];

    const newClientObj: ClientSubscription = {
      id: newClientId,
      clientName: newClientName,
      location: newClientLocation || 'Kampala, Uganda',
      contactPhone: newClientPhone || '+256 700 000000',
      contactEmail: newClientEmail || `${newClientName.toLowerCase().replace(/\s+/g, '')}@pharmsync.online`,
      packageTier: newClientTier,
      customMaxUsers: users,
      monthlyUgxRate: price,
      billingStatus: 'Active',
      nextBillingDate: '2026-08-30',
      ndaLicenseNo: assignedNdaLicense,
      ndaVerified: isVerified,
      supervisingPharmacist: assignedPharmacist,
      users: initialUsersList,
      allowedFeatures: initialFeatures,
    };

    setClients([newClientObj, ...clients]);
    setSelectedClientId(newClientObj.id);
    setActiveTab('matrix');
    setSaveNotification(`New client "${newClientName}" registered successfully on ${newClientTier} Package!`);
    setTimeout(() => setSaveNotification(null), 4000);

    // Reset form
    setNewClientName('');
    setNewClientLocation('');
    setNewClientPhone('');
    setNewClientEmail('');
    setSelectedNdaPharmacy(null);
    setManualNdaLicense('');
    setSupervisingPharmacistInput('');
  };

  // User Account Management Handlers
  const handleOpenAddUserModal = () => {
    setEditingUserId(null);
    setUserFullName('');
    setUserEmail('');
    setUserPhone('');
    setUserStaffRegNo('');
    setUserRankRole('Supervising Pharmacist');
    setUserAccountStatus('Active');
    setUserAccessRights(getDefaultRightsForRole('Supervising Pharmacist'));
    setIsUserFormOpen(true);
  };

  const handleOpenEditUserModal = (user: PharmacyUserAccount) => {
    setEditingUserId(user.id);
    setUserFullName(user.fullName);
    setUserEmail(user.email);
    setUserPhone(user.phone || '');
    setUserStaffRegNo(user.staffRegNo || '');
    setUserRankRole(user.rankRole);
    setUserAccountStatus(user.status);
    setUserAccessRights(user.accessRights);
    setIsUserFormOpen(true);
  };

  const handleRoleChange = (role: UserRoleRank) => {
    setUserRankRole(role);
    setUserAccessRights(getDefaultRightsForRole(role));
  };

  const handleToggleAccessRight = (rightKey: keyof UserAccessRights) => {
    setUserAccessRights((prev) => ({
      ...prev,
      [rightKey]: !prev[rightKey],
    }));
  };

  const handleSaveUserAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim() || !userEmail.trim()) {
      setSaveNotification('Please fill in the staff full name and email address.');
      setTimeout(() => setSaveNotification(null), 3000);
      return;
    }

    const currentUsers = currentSelectedClient.users || [];

    if (!editingUserId && currentUsers.length >= currentSelectedClient.customMaxUsers) {
      setSaveNotification(
        `User Quota Exceeded! ${currentSelectedClient.clientName} has reached its limit of ${currentSelectedClient.customMaxUsers} active user accounts. Upgrade user seats in Package Customizer.`
      );
      setTimeout(() => setSaveNotification(null), 4000);
      return;
    }

    if (editingUserId) {
      const updatedUsers = currentUsers.map((u) => {
        if (u.id === editingUserId) {
          return {
            ...u,
            fullName: userFullName,
            email: userEmail,
            phone: userPhone,
            staffRegNo: userStaffRegNo,
            rankRole: userRankRole,
            status: userAccountStatus,
            accessRights: userAccessRights,
          };
        }
        return u;
      });

      setClients((prev) =>
        prev.map((c) => (c.id === currentSelectedClient.id ? { ...c, users: updatedUsers } : c))
      );
      setSaveNotification(`Updated designated account for ${userFullName} (${userRankRole})`);
    } else {
      const newUser: PharmacyUserAccount = {
        id: `USR-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-3)}`,
        clientId: currentSelectedClient.id,
        fullName: userFullName,
        email: userEmail,
        phone: userPhone || '+256 700 000000',
        staffRegNo: userStaffRegNo || `STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
        rankRole: userRankRole,
        status: userAccountStatus,
        accessRights: userAccessRights,
        dateCreated: new Date().toISOString().split('T')[0],
        lastLogin: 'Never (Pending Activation)',
      };

      const updatedUsers = [...currentUsers, newUser];

      setClients((prev) =>
        prev.map((c) => (c.id === currentSelectedClient.id ? { ...c, users: updatedUsers } : c))
      );
      setSaveNotification(
        `Activated new ${userRankRole} account for ${userFullName} at ${currentSelectedClient.clientName}!`
      );
    }

    setIsUserFormOpen(false);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const handleToggleUserStatus = (userId: string) => {
    const currentUsers = currentSelectedClient.users || [];
    const updatedUsers = currentUsers.map((u) => {
      if (u.id === userId) {
        const nextStatus: PharmacyUserAccount['status'] = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    });

    setClients((prev) =>
      prev.map((c) => (c.id === currentSelectedClient.id ? { ...c, users: updatedUsers } : c))
    );
    setSaveNotification('Account status updated successfully.');
    setTimeout(() => setSaveNotification(null), 2500);
  };

  const handleDeleteUser = (userId: string) => {
    const currentUsers = currentSelectedClient.users || [];
    const updatedUsers = currentUsers.filter((u) => u.id !== userId);

    setClients((prev) =>
      prev.map((c) => (c.id === currentSelectedClient.id ? { ...c, users: updatedUsers } : c))
    );
    setSaveNotification('Staff account de-provisioned and removed.');
    setTimeout(() => setSaveNotification(null), 2500);
  };

  const handleSendInvite = (user: PharmacyUserAccount) => {
    setSaveNotification(`Activation invite and temporary credentials dispatched to ${user.email}`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const totalMonthlyRevenueUGX = clients.reduce((acc, c) => acc + c.monthlyUgxRate, 0);
  const totalMaxUsersCombined = clients.reduce((acc, c) => acc + c.customMaxUsers, 0);

  const filteredClients = clients.filter(
    (c) =>
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.packageTier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Notification */}
      {saveNotification && (
        <div className="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between font-bold text-xs animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            <span>{saveNotification}</span>
          </div>
          <button onClick={() => setSaveNotification(null)} className="hover:opacity-80">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Admin Dashboard Header */}
      <div className="bg-gradient-to-r from-[#0B1E36] via-[#102C50] to-[#0D223E] rounded-3xl p-6 text-white shadow-xl border border-[#1E3B63] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Shield className="w-80 h-80 text-cyan-300" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                SYSTEM ADMINISTRATOR CONSOLE
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                PharmSync Tiering Active
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Client Service Package Customizer
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Tailor pharmacy management features, user limits, and monthly UGX billing rates for each client depending on their preferred package.
            </p>
          </div>

          {/* Key Admin KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-sky-200">Active Clients</p>
              <p className="text-xl font-black text-white mt-0.5">{clients.length} Pharmacies</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-200">Monthly Revenue</p>
              <p className="text-xl font-black text-emerald-300 mt-0.5">
                UGX {totalMonthlyRevenueUGX.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase font-bold text-cyan-200">User Seats Quota</p>
              <p className="text-xl font-black text-cyan-300 mt-0.5">{totalMaxUsersCombined} Users</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs inside Console */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Client Tailoring Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('userAccounts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'userAccounts'
                ? 'bg-purple-500 text-white shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>Designated Staff Accounts & Access Control</span>
            <span className="bg-purple-900/60 text-purple-200 border border-purple-400/30 text-[10px] px-2 py-0.2 rounded-full font-extrabold">
              {currentSelectedClient.users?.length || 0} Users
            </span>
          </button>

          <button
            onClick={() => setActiveTab('showcase')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'showcase'
                ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>PharmSync Package Showcase (UGX Rates)</span>
            <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
              -20% OFF
            </span>
          </button>

          <button
            onClick={() => setActiveTab('addClient')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'addClient'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Client Pharmacy</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CLIENT TAILORING MATRIX */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Client List Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  Pharmacy Clients
                </h3>
                <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                  {filteredClients.length} Registered
                </span>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search client name or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Client Cards List */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredClients.map((client) => {
                  const isSelected = client.id === currentSelectedClient.id;
                  const isCurrentlyOperatingSystem = client.id === activeClient.id;

                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setActiveClient(client);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-400/30'
                          : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-slate-900">{client.clientName}</h4>
                            {isCurrentlyOperatingSystem && (
                              <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">
                                ACTIVE CONTEXT
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {client.location}
                          </p>
                          {client.ndaLicenseNo ? (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 w-fit">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>NDA: {client.ndaLicenseNo}</span>
                            </div>
                          ) : (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                              <Keyboard className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Physical Manual Entry</span>
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            client.packageTier === 'Enterprise'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : client.packageTier === 'Professional'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : client.packageTier === 'Starter'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {client.packageTier}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">
                          UGX <strong className="text-slate-900 font-black">{client.monthlyUgxRate.toLocaleString()}</strong> / mo
                        </span>
                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-sky-600" />
                          {client.customMaxUsers} Users max
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Tailoring Control Panel for Selected Client */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              {/* Selected Client Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                      Client ID: {currentSelectedClient.id}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      ● {currentSelectedClient.billingStatus}
                    </span>
                    {currentSelectedClient.ndaLicenseNo ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        NDA: {currentSelectedClient.ndaLicenseNo}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Manual Entry
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {currentSelectedClient.clientName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-sky-600" />
                      {currentSelectedClient.contactPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-sky-600" />
                      {currentSelectedClient.contactEmail}
                    </span>
                    {currentSelectedClient.supervisingPharmacist && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        {currentSelectedClient.supervisingPharmacist}
                      </span>
                    )}
                  </p>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold w-full sm:w-auto">Preset Template:</span>
                  <button
                    onClick={() => handleApplyPresetTier('Starter')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
                  >
                    Starter
                  </button>
                  <button
                    onClick={() => handleApplyPresetTier('Professional')}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all"
                  >
                    Professional
                  </button>
                  <button
                    onClick={() => handleApplyPresetTier('Enterprise')}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-all"
                  >
                    Enterprise
                  </button>
                </div>
              </div>

              {/* Package Tier & Custom Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Active Tier */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                    Assigned Package
                  </label>
                  <select
                    value={currentSelectedClient.packageTier}
                    onChange={(e) => {
                      const tier = e.target.value as TierName;
                      if (tier === 'Starter' || tier === 'Professional' || tier === 'Enterprise') {
                        handleApplyPresetTier(tier);
                      } else {
                        handleUpdatePrice(currentSelectedClient.monthlyUgxRate);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Starter">Starter Package (Small)</option>
                    <option value="Professional">Professional Package (Growing)</option>
                    <option value="Enterprise">Enterprise Package (Chains)</option>
                    <option value="Custom Tailored">Custom Tailored Plan</option>
                  </select>
                </div>

                {/* User Limit Quota */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                    Max User Licenses
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={currentSelectedClient.customMaxUsers}
                      onChange={(e) => handleUpdateUsers(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-xs font-bold text-slate-600">Users</span>
                  </div>
                </div>

                {/* Monthly UGX Rate */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                    Monthly Rate (UGX)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-black text-slate-400">UGX</span>
                    <input
                      type="number"
                      step={1000}
                      value={currentSelectedClient.monthlyUgxRate}
                      onChange={(e) => handleUpdatePrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Service Feature Customization Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    Feature Access & Module Controls
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Toggle enabled modules for <strong>{currentSelectedClient.clientName}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'basicInventory' as const,
                      title: 'Basic Inventory Control',
                      desc: 'Stock lists, shelf locations, unit costs, basic reorder levels',
                      badge: 'Core Feature',
                    },
                    {
                      key: 'batchTracking' as const,
                      title: 'Batch Tracking & FEFO',
                      desc: 'Batch numbers, manufacturer tracking, First-Expiry-First-Out logic',
                      badge: 'Professional+',
                    },
                    {
                      key: 'autoReordering' as const,
                      title: 'Automated Low Stock Re-ordering',
                      desc: 'Purchase order generation and supplier notifications',
                      badge: 'Professional+',
                    },
                    {
                      key: 'expiryAlerts' as const,
                      title: 'Expiry Alerts & Quarantine Engine',
                      desc: '30/60/90 days color coded risk flags and return logs',
                      badge: 'Core Feature',
                    },
                    {
                      key: 'posBilling' as const,
                      title: 'Billing POS & Thermal Receipts',
                      desc: 'Cash, Mobile Money/M-Pesa, Card & thermal print support',
                      badge: 'Core Feature',
                    },
                    {
                      key: 'salesAnalytics' as const,
                      title: 'Sales & Profit Reports',
                      desc: 'Revenue charts, margin calculations, daily profit breakdowns',
                      badge: 'Professional+',
                    },
                    {
                      key: 'insuranceClaims' as const,
                      title: 'Insurance Claims & Schemes',
                      desc: 'Pre-authorization codes, co-pay split, provider reconciliation',
                      badge: 'Enterprise',
                    },
                    {
                      key: 'aiCounseling' as const,
                      title: 'AI Prescription OCR & Patient Guidance',
                      desc: 'Gemini AI digitizer, dosage check, patient leaflets',
                      badge: 'Enterprise',
                    },
                    {
                      key: 'multiLocation' as const,
                      title: 'Multi-Location Branch Sync',
                      desc: 'Inter-branch stock transfers and central reporting',
                      badge: 'Enterprise Only',
                    },
                    {
                      key: 'apiAccess' as const,
                      title: 'API Access & Webhooks',
                      desc: 'REST API endpoints for ERP integration and third-party tools',
                      badge: 'Enterprise Only',
                    },
                  ].map((feat) => {
                    const isEnabled = currentSelectedClient.allowedFeatures[feat.key];

                    return (
                      <div
                        key={feat.key}
                        onClick={() => handleToggleFeature(feat.key)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isEnabled
                            ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900">{feat.title}</span>
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                              {feat.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">{feat.desc}</p>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {isEnabled ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Designated Staff User Accounts Summary Card */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                      Designated User Accounts & Access Rights
                    </span>
                    <span className="bg-purple-200 text-purple-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                      {currentSelectedClient.users?.length || 0} / {currentSelectedClient.customMaxUsers} Accounts
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800">
                    System admin can open individual user accounts for staff at <strong>{currentSelectedClient.clientName}</strong> and assign rank-based rights (POS, Stock, Rx, AI, Claims).
                  </p>

                  {/* Registered users preview avatars */}
                  {currentSelectedClient.users && currentSelectedClient.users.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {currentSelectedClient.users.map((u) => (
                        <span
                          key={u.id}
                          className="bg-white border border-purple-200 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {u.fullName} ({u.rankRole})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('userAccounts')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider shrink-0 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Manage Designated Accounts →</span>
                </button>
              </div>

              {/* Set Active Context Button */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Currently viewing system as: <strong>{activeClient.clientName}</strong> ({activeClient.packageTier} Package)
                </div>

                <button
                  onClick={() => {
                    setActiveClient(currentSelectedClient);
                    setSaveNotification(`Switched active system context to ${currentSelectedClient.clientName}!`);
                    setTimeout(() => setSaveNotification(null), 3000);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-cyan-200 animate-pulse" />
                  <span>Activate Context for System</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DESIGNATED USER ACCOUNTS & ACCESS RIGHTS MANAGEMENT */}
      {activeTab === 'userAccounts' && (
        <div className="space-y-6">
          {/* Pharmacy Client Context Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                    Client Pharmacy Accounts
                  </span>
                  {currentSelectedClient.ndaLicenseNo && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      NDA: {currentSelectedClient.ndaLicenseNo}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Designated Staff Accounts: {currentSelectedClient.clientName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Open individual staff user accounts, assign rank/role credentials, and enforce granular module access rights.
                </p>
              </div>

              {/* Client Dropdown Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 shrink-0">Switch Client:</span>
                <select
                  value={currentSelectedClient.id}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} ({c.packageTier} - {c.users?.length || 0}/{c.customMaxUsers} Users)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* User Seat Quota Progress & Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-purple-700 tracking-wider">
                    Active User Accounts
                  </p>
                  <p className="text-xl font-black text-purple-950 mt-0.5">
                    {currentSelectedClient.users?.length || 0} / {currentSelectedClient.customMaxUsers} Seats
                  </p>
                  <div className="w-32 bg-purple-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (((currentSelectedClient.users?.length || 0) / currentSelectedClient.customMaxUsers) * 100)
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <Users className="w-8 h-8 text-purple-400 opacity-80" />
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">
                    Package Tier Quota
                  </p>
                  <p className="text-xl font-black text-emerald-950 mt-0.5">
                    {currentSelectedClient.packageTier} Plan
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                    UGX {currentSelectedClient.monthlyUgxRate.toLocaleString()} / mo
                  </p>
                </div>
                <ShieldCheck className="w-8 h-8 text-emerald-400 opacity-80" />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleOpenAddUserModal}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Open New Staff Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* USER ACCOUNT CREATION / EDITING FORM (MODAL / PANEL) */}
          {isUserFormOpen && (
            <div className="bg-white rounded-3xl p-6 border-2 border-purple-400 shadow-xl space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <UserCog className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      {editingUserId ? 'Edit Staff Account & Access Rights' : 'Open Designated Staff Account'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Assign rank, role credentials, and customize granular system module rights for {currentSelectedClient.clientName}.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsUserFormOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleSaveUserAccount} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pharm. Moses Musoke"
                      value={userFullName}
                      onChange={(e) => setUserFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Email / Username *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. moses@pharmsync.online"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+256 700 000000"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Staff / PSU Registration No</label>
                    <input
                      type="text"
                      placeholder="e.g. PSU/REG/2021/1042"
                      value={userStaffRegNo}
                      onChange={(e) => setUserStaffRegNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rank / Role Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 block">Assigned Staff Rank / Role *</label>
                    <select
                      value={userRankRole}
                      onChange={(e) => handleRoleChange(e.target.value as UserRoleRank)}
                      className="w-full px-3.5 py-2.5 text-xs border border-purple-300 bg-purple-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-black text-purple-950 cursor-pointer"
                    >
                      <option value="Supervising Pharmacist">Supervising Pharmacist (Full Admin & Clinical)</option>
                      <option value="Assistant Pharmacist">Assistant Pharmacist (Clinical & Dispensing)</option>
                      <option value="Pharmacy Technician">Pharmacy Technician (Stock & Dispensing)</option>
                      <option value="POS Cashier / Dispenser">POS Cashier / Dispenser (Sales & Billing)</option>
                      <option value="Store & Inventory Manager">Store & Inventory Manager (Stock & POs)</option>
                      <option value="Finance & Claims Officer">Finance & Claims Officer (Billing & Insurance)</option>
                      <option value="Intern Pharmacist">Intern Pharmacist (Counseling & Trainee)</option>
                    </select>
                    <p className="text-[11px] text-purple-700 italic">
                      💡 Standard role template automatically configures the recommended module permissions below.
                    </p>
                  </div>

                  {/* Account Status */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Initial Account Status</label>
                    <div className="flex items-center gap-3 pt-1">
                      {[
                        { status: 'Active' as const, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                        { status: 'Pending Invite' as const, color: 'bg-amber-100 text-amber-800 border-amber-300' },
                        { status: 'Suspended' as const, color: 'bg-rose-100 text-rose-800 border-rose-300' },
                      ].map((item) => (
                        <label
                          key={item.status}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                            userAccountStatus === item.status
                              ? `${item.color} shadow-xs ring-2 ring-purple-400`
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="userStatus"
                            checked={userAccountStatus === item.status}
                            onChange={() => setUserAccountStatus(item.status)}
                            className="sr-only"
                          />
                          <span>{item.status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Granular Module Access Rights Checklist */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-600" />
                        Granular System Access Rights & Rights Matrix
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Check or uncheck individual privileges to grant tailored access for this staff member.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setUserAccessRights({
                            canAccessPOS: true,
                            canManageInventory: true,
                            canProcessPrescriptions: true,
                            canApproveReorders: true,
                            canViewReports: true,
                            canSubmitInsurance: true,
                            canUseAiAssistant: true,
                            canManageStaffAccounts: true,
                          })
                        }
                        className="text-[10px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-lg cursor-pointer"
                      >
                        Grant All
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setUserAccessRights(getDefaultRightsForRole(userRankRole))
                        }
                        className="text-[10px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-lg cursor-pointer"
                      >
                        Reset Role Default
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {[
                      {
                        key: 'canAccessPOS' as const,
                        label: 'POS Sales & Cash Billing',
                        desc: 'Issue thermal receipts & cash register',
                        icon: DollarSign,
                      },
                      {
                        key: 'canManageInventory' as const,
                        label: 'Inventory & Stock Control',
                        desc: 'Add stock batches, prices & stock takes',
                        icon: Database,
                      },
                      {
                        key: 'canProcessPrescriptions' as const,
                        label: 'Rx Dispensing & Counseling',
                        desc: 'Dispense prescriptions & dosage check',
                        icon: FileText,
                      },
                      {
                        key: 'canApproveReorders' as const,
                        label: 'Supplier POs & Auto-Reorders',
                        desc: 'Approve purchase orders & stock orders',
                        icon: RefreshCw,
                      },
                      {
                        key: 'canViewReports' as const,
                        label: 'Sales Reports & Profit Margins',
                        desc: 'Access revenue charts & profit logs',
                        icon: Sliders,
                      },
                      {
                        key: 'canSubmitInsurance' as const,
                        label: 'Insurance & Claims Co-pays',
                        desc: 'Submit claims & pre-authorization',
                        icon: Shield,
                      },
                      {
                        key: 'canUseAiAssistant' as const,
                        label: 'Gemini AI Clinical Assistant',
                        desc: 'AI prescription OCR & drug lookup',
                        icon: Sparkles,
                      },
                      {
                        key: 'canManageStaffAccounts' as const,
                        label: 'Staff Admin & User Rights',
                        desc: 'Create & manage pharmacy staff accounts',
                        icon: Lock,
                      },
                    ].map((right) => {
                      const isGranted = userAccessRights[right.key];
                      const IconComp = right.icon;

                      return (
                        <div
                          key={right.key}
                          onClick={() => handleToggleAccessRight(right.key)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isGranted
                              ? 'bg-purple-50/90 border-purple-300 text-purple-950 shadow-xs'
                              : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {isGranted ? (
                              <CheckSquare className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-xs font-black leading-tight flex items-center gap-1">
                              <IconComp className="w-3 h-3 text-purple-600 shrink-0" />
                              {right.label}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight">{right.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUserFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingUserId ? 'Save Updated Rights' : 'Activate User Account'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* USER DIRECTORY & ACCESS CONTROL TABLE */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-purple-600" />
                  Staff Directory & Access Control List
                </h4>
                <p className="text-xs text-slate-500">
                  Registered designated user accounts for <strong>{currentSelectedClient.clientName}</strong>
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search staff name or reg no..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="Supervising Pharmacist">Supervising Pharmacist</option>
                  <option value="Assistant Pharmacist">Assistant Pharmacist</option>
                  <option value="Pharmacy Technician">Pharmacy Technician</option>
                  <option value="POS Cashier / Dispenser">POS Cashier / Dispenser</option>
                  <option value="Store & Inventory Manager">Store & Inventory Manager</option>
                  <option value="Finance & Claims Officer">Finance & Claims Officer</option>
                  <option value="Intern Pharmacist">Intern Pharmacist</option>
                </select>
              </div>
            </div>

            {/* Staff List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Staff Member</th>
                    <th className="py-3 px-3">Rank / Role</th>
                    <th className="py-3 px-3">Granted Rights Matrix</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Last Active</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(currentSelectedClient.users || [])
                    .filter(
                      (u) =>
                        (userRoleFilter === 'All' || u.rankRole === userRoleFilter) &&
                        (u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          (u.staffRegNo && u.staffRegNo.toLowerCase().includes(userSearchQuery.toLowerCase())))
                    )
                    .map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/80 transition-all">
                        {/* Name & Phone */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-black flex items-center justify-center text-xs shrink-0">
                              {usr.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900">{usr.fullName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{usr.email}</p>
                              {usr.staffRegNo && (
                                <p className="text-[9px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded w-fit mt-0.5">
                                  ID: {usr.staffRegNo}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Rank / Role */}
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${getRoleBadgeStyle(
                              usr.rankRole
                            )}`}
                          >
                            <Shield className="w-3 h-3 shrink-0" />
                            {usr.rankRole}
                          </span>
                        </td>

                        {/* Granted Access Rights */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1 max-w-xs">
                            {usr.accessRights.canAccessPOS && (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                POS
                              </span>
                            )}
                            {usr.accessRights.canManageInventory && (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                Stock
                              </span>
                            )}
                            {usr.accessRights.canProcessPrescriptions && (
                              <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded">
                                Rx
                              </span>
                            )}
                            {usr.accessRights.canApproveReorders && (
                              <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                                Reorder
                              </span>
                            )}
                            {usr.accessRights.canViewReports && (
                              <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                                Reports
                              </span>
                            )}
                            {usr.accessRights.canSubmitInsurance && (
                              <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">
                                Claims
                              </span>
                            )}
                            {usr.accessRights.canUseAiAssistant && (
                              <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                                AI
                              </span>
                            )}
                            {usr.accessRights.canManageStaffAccounts && (
                              <span className="text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.2 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Account Status */}
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(usr.id)}
                            title="Click to toggle Active / Suspended"
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border cursor-pointer transition-all ${
                              usr.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : usr.status === 'Pending Invite'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            ● {usr.status}
                          </button>
                        </td>

                        {/* Last Active */}
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {usr.lastLogin || 'Never'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUserModal(usr)}
                              title="Edit Rank & Access Rights"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendInvite(usr)}
                              title="Send Access Credentials / Invite Code"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 transition-all cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(usr.id)}
                              title="De-provision Account"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {(!currentSelectedClient.users || currentSelectedClient.users.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                        No designated staff user accounts created yet for {currentSelectedClient.clientName}.
                        <br />
                        <button
                          onClick={handleOpenAddUserModal}
                          className="mt-2 text-xs text-purple-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Open First User Account
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHARMSYNC PACKAGE SHOWCASE (MATCHING IMAGE) */}
      {activeTab === 'showcase' && (
        <div className="space-y-6">
          {/* Header Callout Banner Matching Poster Content */}
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  PharmSync Official Tiers
                </span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  SPECIAL 20% DISCOUNT
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                EXPIRED DRUGS, STOCK OUTS, NO CLEAR PROFITS?
              </h3>
              <p className="text-lg font-extrabold text-cyan-200 uppercase tracking-widest">
                USE PHARMSYNC!
              </p>
              <p className="text-xs text-sky-100 leading-relaxed">
                Choose the perfect pharmacy management plan tailored to your operational scale. All packages include standard cloud backup and POS invoicing.
              </p>
            </div>
          </div>

          {/* Promo Code Entry Widget */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-950 uppercase">Have a Promo Coupon?</h4>
                <p className="text-[11px] text-amber-800">
                  Use Code <strong className="font-extrabold text-amber-900">HOT 20</strong> (Expires Nov 1) to claim an additional 20% off all packages.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Enter HOT 20"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                className="bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleApplyPromoCode}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase transition-colors shrink-0 cursor-pointer"
              >
                Apply Code
              </button>
            </div>
          </div>

          {/* 3 Pricing Cards Grid Matching the Image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INITIAL_PACKAGE_TIERS.map((pkg) => {
              const displayPrice = promoApplied
                ? Math.round(pkg.discountPriceUgx * 0.8)
                : pkg.discountPriceUgx;

              return (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-3xl border-2 transition-all shadow-md relative flex flex-col justify-between overflow-hidden ${
                    pkg.isPopular
                      ? 'border-sky-500 ring-4 ring-sky-500/20 scale-102 z-10'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Popular Badge */}
                  {pkg.isPopular && (
                    <div className="bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest text-center py-1">
                      ★ MOST POPULAR CHOICE
                    </div>
                  )}

                  <div className="p-6 space-y-5">
                    {/* Package Header */}
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{pkg.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{pkg.tagline}</p>
                    </div>

                    {/* Price Block */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1 relative">
                      <p className="text-[11px] text-slate-400 line-through font-bold">
                        UGX {pkg.originalPriceUgx.toLocaleString()}.00 / month
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-sky-700 tracking-tight">
                          UGX {displayPrice.toLocaleString()}/=
                        </span>
                        <span className="text-xs font-bold text-slate-500">/mo</span>
                      </div>
                      {promoApplied && (
                        <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Extra 20% Promo HOT 20 Applied
                        </p>
                      )}
                    </div>

                    {/* User Quota Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-black">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>Up to {pkg.maxUsers} users</span>
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-2.5 pt-2">
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Included Features:
                      </p>
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => {
                        handleApplyPresetTier(pkg.id);
                        setActiveTab('matrix');
                      }}
                      className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                        pkg.isPopular
                          ? 'bg-sky-600 hover:bg-sky-500 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      Assign {pkg.id} to Client
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Poster Footer Contacts matching uploaded image */}
          <div className="bg-[#0B1E36] text-white rounded-3xl p-6 border border-[#1E3A5F] flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1 text-center md:text-left">
              <p className="font-extrabold text-sky-300 uppercase tracking-widest text-[11px]">
                PharmSync Official Support Hotlines & Inquiries
              </p>
              <p className="text-slate-300 font-bold flex items-center justify-center md:justify-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                +256 774 607782 | +256 704 425357 | +256 755 091826
              </p>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <a
                href="mailto:info@pharmsync.online"
                className="hover:text-white flex items-center gap-1 font-semibold"
              >
                <Mail className="w-4 h-4 text-sky-400" />
                info@pharmsync.online
              </a>
              <a
                href="https://www.pharmsync.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white flex items-center gap-1 font-semibold text-cyan-300"
              >
                <Globe className="w-4 h-4" />
                www.pharmsync.online
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGISTER NEW CLIENT PHARMACY */}
      {activeTab === 'addClient' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Activate Pharmacy Service Package
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Link to the NDA Uganda Licensed Pharmacies Register or physically type custom pharmacy details.
              </p>
            </div>

            {/* Registration Mode Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setRegistrationMode('ndaLink')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  registrationMode === 'ndaLink'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Link NDA Database</span>
              </button>
              <button
                type="button"
                onClick={() => setRegistrationMode('manualEntry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  registrationMode === 'manualEntry'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>
            </div>
          </div>

          {/* MODE 1: NDA DATABASE LINKING PANEL */}
          {registrationMode === 'ndaLink' && (
            <div className="bg-gradient-to-br from-sky-50/70 via-slate-50 to-emerald-50/40 rounded-2xl p-5 border border-sky-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-sky-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      NDA Uganda National Register
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ● Active API
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mt-1">
                    Auto-Generate Pharmacy Details from NDA Database
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Search official Uganda National Drug Authority pharmacy licensing records to pre-fill client credentials.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateNdaSync}
                  disabled={isNdaSyncing}
                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 hover:bg-sky-50 text-sky-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isNdaSyncing ? 'animate-spin' : ''}`} />
                  <span>{isNdaSyncing ? 'Syncing Portal...' : 'Sync NDA Registry'}</span>
                </button>
              </div>

              {/* NDA Registry Live Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-sky-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search NDA database by pharmacy name, district, license no (e.g., NDA/LIC/PHA/2026/0182) or pharmacist..."
                  value={ndaSearchQuery}
                  onChange={(e) => setNdaSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-sky-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium placeholder:text-slate-400"
                />
              </div>

              {/* NDA Search Results / Directory Picklist */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {NDA_REGISTERED_PHARMACIES.filter((p) =>
                  p.pharmacyName.toLowerCase().includes(ndaSearchQuery.toLowerCase()) ||
                  p.district.toLowerCase().includes(ndaSearchQuery.toLowerCase()) ||
                  p.licenseNo.toLowerCase().includes(ndaSearchQuery.toLowerCase()) ||
                  p.supervisingPharmacist.toLowerCase().includes(ndaSearchQuery.toLowerCase())
                ).map((pharm) => {
                  const isSelected = selectedNdaPharmacy?.licenseNo === pharm.licenseNo;

                  return (
                    <div
                      key={pharm.licenseNo}
                      onClick={() => handleSelectNdaPharmacy(pharm)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-400/30'
                          : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900">{pharm.pharmacyName}</span>
                          <span className="text-[10px] font-mono font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded">
                            {pharm.licenseNo}
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            {pharm.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>📍 {pharm.branchName} ({pharm.district})</span>
                          <span>• 👨‍⚕️ {pharm.supervisingPharmacist}</span>
                          <span className="text-slate-400">({pharm.psuRegNo})</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectNdaPharmacy(pharm);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-sky-100 hover:bg-sky-200 text-sky-800'
                        }`}
                      >
                        {isSelected ? '✓ Linked & Filled' : 'Select & Fill'}
                      </button>
                    </div>
                  );
                })}

                {NDA_REGISTERED_PHARMACIES.filter((p) =>
                  p.pharmacyName.toLowerCase().includes(ndaSearchQuery.toLowerCase()) ||
                  p.district.toLowerCase().includes(ndaSearchQuery.toLowerCase()) ||
                  p.licenseNo.toLowerCase().includes(ndaSearchQuery.toLowerCase()) ||
                  p.supervisingPharmacist.toLowerCase().includes(ndaSearchQuery.toLowerCase())
                ).length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4 italic">
                    No matching NDA licensed pharmacy found. Switch to "Manual Entry" tab to type custom details.
                  </p>
                )}
              </div>

              {selectedNdaPharmacy && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-extrabold">Linked to NDA Verified Record: {selectedNdaPharmacy.pharmacyName}</p>
                      <p className="text-[10px] text-emerald-700">License: {selectedNdaPharmacy.licenseNo} | Pharmacist: {selectedNdaPharmacy.supervisingPharmacist}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedNdaPharmacy(null)}
                    className="text-[10px] font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    Clear Link
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: MANUAL ENTRY BANNER */}
          {registrationMode === 'manualEntry' && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
              <Keyboard className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-extrabold">Manual Physical Typing Active</p>
                <p className="text-[11px] text-amber-800">
                  Type in any pharmacy name, branch address, contact phone, and optional custom license code manually below.
                </p>
              </div>
            </div>
          )}

          {/* MAIN CLIENT FORM */}
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Pharmacy / Client Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Arua Care Pharmacy"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Location / Branch / District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arua, Uganda"
                  value={newClientLocation}
                  onChange={(e) => setNewClientLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Contact Phone (WhatsApp)
                </label>
                <input
                  type="text"
                  placeholder="+256 700 000000"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="pharma@pharmsync.online"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  NDA License Number (Optional / Custom)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NDA/LIC/PHA/2026/099"
                  value={selectedNdaPharmacy ? selectedNdaPharmacy.licenseNo : manualNdaLicense}
                  onChange={(e) => {
                    setManualNdaLicense(e.target.value);
                    if (selectedNdaPharmacy) setSelectedNdaPharmacy(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Supervising Pharmacist & PSU Reg No (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Pharm. Moses Musoke (PSU/REG/2021/1042)"
                value={supervisingPharmacistInput}
                onChange={(e) => setSupervisingPharmacistInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Preferred Package Tier
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Starter', label: 'Starter', price: 'UGX 40,000/mo' },
                  { id: 'Professional', label: 'Professional', price: 'UGX 72,000/mo' },
                  { id: 'Enterprise', label: 'Enterprise', price: 'UGX 104,000/mo' },
                ].map((tier) => (
                  <button
                    type="button"
                    key={tier.id}
                    onClick={() => setNewClientTier(tier.id as TierName)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      newClientTier === tier.id
                        ? 'bg-sky-50 border-sky-500 text-sky-900 font-black ring-2 ring-sky-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-xs font-bold">{tier.label}</p>
                    <p className="text-[10px] text-slate-500">{tier.price}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('matrix')}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Register & Activate Package</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
