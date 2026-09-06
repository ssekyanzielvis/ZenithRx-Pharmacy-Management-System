/**
 * useAdminPackages.ts — ZenithRx Multi-Tenant Package Tiers & NDA Verification Hook
 * Clean Architecture: Application Layer
 * Manages pharmacy subscriptions, tier feature rights, staff RBAC accounts,
 * and Uganda NDA pharmacy registry verification.
 */

import { useState, useMemo, useCallback } from 'react';
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
import { applyPackageTierToClient, getPackageTierConfig } from '../lib/packageTierRules';
import {
  createUserAccount,
  removeUserAccount,
  toggleUserStatus,
  updateUserAccount
} from '../lib/adminUserAccounts';
import {
  buildAllClientsExportRows,
  buildAllStaffExportRows,
  buildSelectedClientExportRows,
  downloadCsv
} from '../lib/adminExports';

export interface UseAdminPackagesProps {
  activeClient: ClientSubscription;
  setActiveClient: (client: ClientSubscription) => void;
}

export function useAdminPackages({ activeClient, setActiveClient }: UseAdminPackagesProps) {
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

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || activeClient;
  }, [clients, selectedClientId, activeClient]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.packageTier.toLowerCase().includes(q) ||
        c.ndaLicenseNo.toLowerCase().includes(q)
    );
  }, [clients, searchTerm]);

  // NDA Register search results
  const ndaSearchResults = useMemo(() => {
    if (!ndaSearchQuery.trim()) return [];
    const q = ndaSearchQuery.toLowerCase();
    return NDA_REGISTERED_PHARMACIES.filter(
      (p) =>
        p.pharmacyName.toLowerCase().includes(q) ||
        p.licenseNo.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.supervisingPharmacist.toLowerCase().includes(q)
    );
  }, [ndaSearchQuery]);

  // ─── Apply Tier Change to Client ──────────────────────────────────────────
  const handleApplyTier = useCallback(
    (tierName: TierName) => {
      const updated = applyPackageTierToClient(selectedClient, tierName);
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (updated.id === activeClient.id) {
        setActiveClient(updated);
      }
      setSaveNotification(`Successfully switched ${updated.clientName} to ${tierName} Tier!`);
      setTimeout(() => setSaveNotification(null), 4000);
    },
    [selectedClient, activeClient, setActiveClient]
  );

  // ─── Toggle Individual Feature Right ──────────────────────────────────────
  const handleToggleFeature = useCallback(
    (featureKey: keyof ClientSubscription['allowedFeatures']) => {
      const updated: ClientSubscription = {
        ...selectedClient,
        allowedFeatures: {
          ...selectedClient.allowedFeatures,
          [featureKey]: !selectedClient.allowedFeatures[featureKey],
        },
      };
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (updated.id === activeClient.id) {
        setActiveClient(updated);
      }
      setSaveNotification(`Feature permission "${featureKey}" updated!`);
      setTimeout(() => setSaveNotification(null), 3000);
    },
    [selectedClient, activeClient, setActiveClient]
  );

  // ─── NDA Registry Link & Autofill ─────────────────────────────────────────
  const handleSelectNdaRecord = useCallback((record: NdaPharmacyRecord) => {
    setIsNdaSyncing(true);
    setTimeout(() => {
      setSelectedNdaPharmacy(record);
      setManualNdaLicense(record.licenseNo);
      setSupervisingPharmacistInput(`${record.supervisingPharmacist} (${record.psuRegNo})`);
      setIsNdaSyncing(false);
    }, 400);
  }, []);

  // ─── Export Functions ──────────────────────────────────────────────────────
  const handleExportClientsCsv = useCallback(() => {
    const rows = buildAllClientsExportRows(clients);
    downloadCsv(`zenithrx_client_subscriptions_${new Date().toISOString().split('T')[0]}.csv`, rows);
  }, [clients]);

  const handleExportStaffCsv = useCallback(() => {
    const rows = buildAllStaffExportRows(clients);
    downloadCsv(`zenithrx_staff_accounts_${new Date().toISOString().split('T')[0]}.csv`, rows);
  }, [clients]);

  return {
    clients,
    setClients,
    selectedClientId,
    setSelectedClientId,
    selectedClient,
    filteredClients,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    promoCodeInput,
    setPromoCodeInput,
    promoApplied,
    setPromoApplied,
    promoDiscountPercent,
    setPromoDiscountPercent,
    saveNotification,
    setSaveNotification,
    registrationMode,
    setRegistrationMode,
    ndaSearchQuery,
    setNdaSearchQuery,
    selectedNdaPharmacy,
    setSelectedNdaPharmacy,
    ndaSearchResults,
    isNdaSyncing,
    manualNdaLicense,
    setManualNdaLicense,
    supervisingPharmacistInput,
    setSupervisingPharmacistInput,
    handleApplyTier,
    handleToggleFeature,
    handleSelectNdaRecord,
    handleExportClientsCsv,
    handleExportStaffCsv,
  };
}
