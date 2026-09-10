import React, { useState, useEffect, useCallback } from 'react';
import {
  ModuleTab,
  DrugItem,
  Prescription,
  CustomerProfile,
  PurchaseOrder,
  POSTransaction,
  ClientSubscription,
} from './types';
import {
  INITIAL_DRUGS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_CUSTOMERS,
  INITIAL_INSURANCE_PROVIDERS,
  INITIAL_POS_TRANSACTIONS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_CLIENT_SUBSCRIPTIONS,
} from './data/mockData';
import { applyPackageTierToClient } from './lib/packageTierRules';

// ─── Repositories ─────────────────────────────────────────────────────────────
import { getAllDrugs }             from './repositories/drugRepository';
import { getAllPrescriptions }     from './repositories/prescriptionRepository';
import { getAllCustomers }         from './repositories/customerRepository';
import { getTransactions, insertTransaction } from './repositories/posRepository';
import { getAllPurchaseOrders, createPurchaseOrder } from './repositories/purchaseOrderRepository';
import { getAllInsuranceProviders }from './repositories/insuranceRepository';
import { logAuditEvent }          from './repositories/auditRepository';

// ─── Auth ─────────────────────────────────────────────────────────────────────
import { useAuth }   from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { LandingPage } from './components/LandingPage';
import { SubscriptionPage } from './components/auth/SubscriptionPage';

// ─── Components ───────────────────────────────────────────────────────────────
import { Header }                from './components/Header';
import { Sidebar }               from './components/Sidebar';
import { PromoBannerView }       from './components/PromoBannerView';
import { PrescriptionProcessing }from './components/PrescriptionProcessing';
import { StockInventory }        from './components/StockInventory';
import { ExpiryAlerts }          from './components/ExpiryAlerts';
import { CustomerProfiles }      from './components/CustomerProfiles';
import { AutomatedReordering }   from './components/AutomatedReordering';
import { PointOfSale }           from './components/PointOfSale';
import { SalesReports }          from './components/SalesReports';
import { InsuranceSchemes }      from './components/InsuranceSchemes';
import { AdminPackages }         from './components/AdminPackages';
import { AuditLogViewer }        from './components/AuditLogViewer';
import { CollaboratorManagement }from './components/CollaboratorManagement';
import { SystemHealthDashboard } from './components/SystemHealthDashboard';
import { FinancialReconciliationView } from './components/FinancialReconciliationView';
import { NdaRegistryViewer }    from './components/NdaRegistryViewer';
import { MultiTenantDashboard } from './components/MultiTenantDashboard';
import { ExportArchiveModal }    from './components/ExportArchiveModal';
import { BarcodeScannerModal }   from './components/BarcodeScannerModal';
import { AICounselingModal }     from './components/AICounselingModal';
import { PharmacyFeedbackModal } from './components/PharmacyFeedbackModal';

export default function App() {
  const auth = useAuth();

  const getInitialTab = (): ModuleTab => {
    const path = (window.location.pathname + window.location.hash).toLowerCase();
    if (path.includes('admin')) return 'adminPackages';
    if (path.includes('tenancy')) return 'tenancy';
    if (path.includes('pos')) return 'pos';
    if (path.includes('inventory')) return 'inventory';
    if (path.includes('expiry')) return 'expiry';
    if (path.includes('customers')) return 'customers';
    if (path.includes('reordering')) return 'reordering';
    if (path.includes('reports')) return 'reports';
    if (path.includes('insurance')) return 'insurance';
    if (path.includes('audit')) return 'audit';
    if (path.includes('collaborators') || path.includes('staff')) return 'collaborators';
    if (path.includes('health')) return 'health';
    if (path.includes('nda')) return 'nda';
    return 'overview';
  };

  const [activeTab, setActiveTab]         = useState<ModuleTab>(getInitialTab);
  const [showLanding, setShowLanding]     = useState<boolean>(!window.location.hash.includes('app'));
  const [showPromoFlyer, setShowPromoFlyer] = useState<boolean>(false);
  const [dataLoading, setDataLoading]     = useState(false);
  const [isR2ArchiveOpen, setIsR2ArchiveOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const handleTabChange = (tab: ModuleTab) => {
    setActiveTab(tab);
    setShowPromoFlyer(false);
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', `/${tab}`);
    }
  };

  // ─── Active client (Admin context) ──────────────────────────────────────────
  const [activeClient, setActiveClient] = useState<ClientSubscription>(
    INITIAL_CLIENT_SUBSCRIPTIONS[0]
  );

  // ─── App Data State — seeded with mock, overwritten by real data ──────────
  const [drugs,             setDrugs]             = useState<DrugItem[]>(INITIAL_DRUGS);
  const [prescriptions,     setPrescriptions]     = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [customers,         setCustomers]         = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [insuranceProviders,setInsuranceProviders]= useState(INITIAL_INSURANCE_PROVIDERS);
  const [posTransactions,   setPosTransactions]   = useState<POSTransaction[]>(INITIAL_POS_TRANSACTIONS);
  const [purchaseOrders,    setPurchaseOrders]    = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);

  // ─── Modal States ────────────────────────────────────────────────────────────
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'ZenithRx Pharmacy Management System';

    const handleLocationChange = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // ─── Load real data from Supabase once the user is authenticated ─────────
  const loadData = useCallback(async (tenantId: string) => {
    setDataLoading(true);
    try {
      const [
        dbDrugs,
        dbPrescriptions,
        dbCustomers,
        dbTransactions,
        dbPurchaseOrders,
        dbInsurance,
      ] = await Promise.allSettled([
        getAllDrugs(tenantId),
        getAllPrescriptions(tenantId),
        getAllCustomers(tenantId),
        getTransactions(tenantId, 200),
        getAllPurchaseOrders(tenantId),
        getAllInsuranceProviders(tenantId),
      ]);

      if (dbDrugs.status           === 'fulfilled') setDrugs(dbDrugs.value);
      if (dbPrescriptions.status   === 'fulfilled') setPrescriptions(dbPrescriptions.value);
      if (dbCustomers.status       === 'fulfilled') setCustomers(dbCustomers.value);
      if (dbTransactions.status    === 'fulfilled') setPosTransactions(dbTransactions.value);
      if (dbPurchaseOrders.status  === 'fulfilled') setPurchaseOrders(dbPurchaseOrders.value);
      if (dbInsurance.status       === 'fulfilled') setInsuranceProviders(dbInsurance.value);
    } catch (err) {
      console.warn('[App] Data load error — running on mock data:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.user?.tenantId) {
      void loadData(auth.user.tenantId);
    }
  }, [auth.user?.tenantId, loadData]);

  // ─── Computed badge counters ─────────────────────────────────────────────
  const lowStockCount  = drugs.filter(d => d.stockQty <= d.reorderLevel).length;
  const expiringCount  = drugs.filter(d => {
    const diff = new Date(d.expiryDate).getTime() - Date.now();
    return Math.ceil(diff / 86400000) <= 90;
  }).length;
  const pendingRxCount = prescriptions.filter(rx => rx.status === 'Pending').length;

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleSelectFeatureFromPoster = (tab: ModuleTab) => {
    setActiveTab(tab);
    setShowPromoFlyer(false);
  };

  const handleAddDrug = (newDrug: DrugItem) => {
    setDrugs(prev => [newDrug, ...prev]);
  };

  const handleUpdateDrug = (updated: DrugItem) => {
    setDrugs(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const handleDispenseRx = (rxId: string) => {
    setPrescriptions(prev =>
      prev.map(rx => rx.id === rxId ? { ...rx, status: 'Dispensed' as const } : rx)
    );
  };

  const handleAddPrescription = (newRx: Prescription) => {
    setPrescriptions(prev => [newRx, ...prev]);
  };

  const handleAddCustomer = (newCust: CustomerProfile) => {
    setCustomers(prev => [newCust, ...prev]);
  };

  const handleCreatePO = async (newPO: PurchaseOrder) => {
    setPurchaseOrders(prev => [newPO, ...prev]);
    if (auth.user?.tenantId && auth.user?.id) {
      try {
        await createPurchaseOrder(newPO, auth.user.tenantId, auth.user.id);
        await logAuditEvent({
          tenantId:    auth.user.tenantId,
          performedBy: auth.user.id,
          action:      'create',
          entityType:  'purchase_order',
          entityId:    newPO.id,
          newValue:    { poNumber: newPO.poNumber, supplier: newPO.supplierName, total: newPO.totalAmount },
        });
      } catch (err) {
        console.warn('[App.handleCreatePO] Persist failed — state already updated locally:', err);
      }
    }
  };

  const handleCompleteSale = async (transaction: POSTransaction) => {
    // Optimistic update — update UI immediately
    setPosTransactions(prev => [transaction, ...prev]);
    setDrugs(prev =>
      prev.map(d => {
        const sold = transaction.items.find(item => item.drugId === d.id);
        return sold ? { ...d, stockQty: Math.max(0, d.stockQty - sold.quantity) } : d;
      })
    );

    // Persist to Supabase in background
    if (auth.user?.tenantId) {
      try {
        await insertTransaction(transaction, auth.user.tenantId);
        await logAuditEvent({
          tenantId:    auth.user.tenantId,
          performedBy: auth.user.id,
          action:      'create',
          entityType:  'pos_transaction',
          entityId:    transaction.id,
          newValue:    { receiptNo: transaction.receiptNo, total: transaction.totalPaid, method: transaction.paymentMethod },
        });
      } catch (err) {
        console.warn('[App.handleCompleteSale] Persist failed — transaction kept in local state:', err);
      }
    }
  };

  const handleApplyClearanceDiscount = (drugId: string) => {
    setDrugs(prev =>
      prev.map(d => d.id === drugId
        ? { ...d, sellingPrice: Math.round(d.sellingPrice * 0.7) }
        : d
      )
    );
  };

  const handleQuarantineStock = (drugId: string) => {
    setDrugs(prev =>
      prev.map(d => d.id === drugId
        ? { ...d, shelfLocation: 'Quarantine Rack Q-01', stockQty: 0 }
        : d
      )
    );
  };

  // ─── Unauthenticated Landing & Auth Gate ─────────────────────────────────
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-[#070F1C] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 animate-pulse">
            <span className="text-white font-black text-xl">Rx</span>
          </div>
          <p className="text-sky-300/60 text-sm font-medium">Loading ZenithRx…</p>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return <LandingPage auth={auth} />;
  }

  // ─── Subscription Gate ───────────────────────────────────────────────────
  if (auth.user.subscriptionStatus !== 'active' && !auth.user.isSuperAdmin) {
    return <SubscriptionPage auth={auth} />;
  }

  // ─── Authenticated app shell ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 font-sans flex flex-col">

      {/* Loading overlay during data fetch */}
      {dataLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-sky-900/50">
          <div className="h-full bg-sky-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        showPromoFlyer={showPromoFlyer}
        setShowPromoFlyer={setShowPromoFlyer}
        clients={INITIAL_CLIENT_SUBSCRIPTIONS}
        activeClient={activeClient}
        setActiveClient={setActiveClient}
        lowStockCount={lowStockCount}
        expiringCount={expiringCount}
        pendingRxCount={pendingRxCount}
        onOpenAiCounseling={() => setIsAiModalOpen(true)}
        onOpenBarcodeScanner={() => setIsBarcodeOpen(true)}
        openR2Archive={() => setIsR2ArchiveOpen(true)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={auth.user}
        onSignOut={auth.signOut}
      />

      {/* Main Layout Container with Left Sidebar (Only visible when operating active system modules) */}
      <div className="flex flex-1 relative min-h-0">
        {activeTab !== 'overview' && !showPromoFlyer && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            lowStockCount={lowStockCount}
            expiringCount={expiringCount}
            pendingRxCount={pendingRxCount}
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
            onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
            user={auth.user}
            onSignOut={auth.signOut}
          />
        )}

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
        {showPromoFlyer ? (
          <PromoBannerView
            onSelectFeature={handleSelectFeatureFromPoster}
            openBarcodeScanner={() => setIsBarcodeOpen(true)}
            activeClient={activeClient}
            setActiveClient={setActiveClient}
            onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
          />
        ) : (
          <div>
            {activeTab === 'overview' && (
              <PromoBannerView
                onSelectFeature={handleSelectFeatureFromPoster}
                openBarcodeScanner={() => setIsBarcodeOpen(true)}
                activeClient={activeClient}
                setActiveClient={setActiveClient}
                onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
              />
            )}

            {activeTab === 'prescriptions' && (
              <PrescriptionProcessing
                prescriptions={prescriptions}
                drugs={drugs}
                tenantId={auth.user?.tenantId || activeClient.id}
                onDispensePrescription={handleDispenseRx}
                onAddPrescription={handleAddPrescription}
              />
            )}

            {activeTab === 'inventory' && (
              <StockInventory
                drugs={drugs}
                onAddDrug={handleAddDrug}
                onUpdateDrug={handleUpdateDrug}
                openBarcodeScanner={() => setIsBarcodeOpen(true)}
              />
            )}

            {activeTab === 'expiry' && (
              <ExpiryAlerts
                drugs={drugs}
                onApplyClearanceDiscount={handleApplyClearanceDiscount}
                onQuarantineStock={handleQuarantineStock}
                pharmacyName={activeClient.clientName}
                ndaLicenseNo={activeClient.ndaLicenseNo}
                supervisingPharmacist={activeClient.supervisingPharmacist}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerProfiles
                customers={customers}
                onAddCustomer={handleAddCustomer}
                pharmacyName={activeClient.clientName}
                pharmacyPhone={activeClient.contactPhone}
              />
            )}

            {activeTab === 'reordering' && (
              <AutomatedReordering
                drugs={drugs}
                purchaseOrders={purchaseOrders}
                onCreatePO={handleCreatePO}
              />
            )}

            {activeTab === 'pos' && (
              <PointOfSale
                drugs={drugs}
                prescriptions={prescriptions}
                transactions={posTransactions}
                onCompleteSale={handleCompleteSale}
                openBarcodeScanner={() => setIsBarcodeOpen(true)}
              />
            )}

            {activeTab === 'payments' && (
              <FinancialReconciliationView
                tenantId={auth.user?.tenantId || activeClient.id}
                tenantName={activeClient.clientName}
              />
            )}

            {activeTab === 'reports' && (
              <SalesReports
                transactions={posTransactions}
                drugs={drugs}
                prescriptions={prescriptions}
                customers={customers}
              />
            )}

            {activeTab === 'insurance' && (
              <InsuranceSchemes
                providers={insuranceProviders}
                tenantId={auth.user?.tenantId || activeClient.id}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogViewer
                tenantId={auth.user?.tenantId || activeClient.id}
              />
            )}

            {activeTab === 'collaborators' && (
              <CollaboratorManagement
                tenantId={auth.user?.tenantId || activeClient.id}
                tenantName={activeClient.clientName}
              />
            )}

            {activeTab === 'health' && (
              <SystemHealthDashboard />
            )}

            {activeTab === 'nda' && (
              <NdaRegistryViewer />
            )}

            {activeTab === 'tenancy' && (
              <MultiTenantDashboard />
            )}

            {(activeTab === 'adminPackages' ||
              activeTab === 'adminControlPlane' ||
              activeTab === 'adminExecutive' ||
              activeTab === 'adminPolicies' ||
              activeTab === 'adminDelegated' ||
              activeTab === 'adminDualControl' ||
              activeTab === 'adminIncidents' ||
              activeTab === 'adminMatrix' ||
              activeTab === 'adminUsers' ||
              activeTab === 'adminBilling' ||
              activeTab === 'adminRegister') && (
              <AdminPackages
                activeClient={activeClient}
                setActiveClient={setActiveClient}
                subTab={activeTab}
              />
            )}
          </div>
        )}
      </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#0B1E36] text-slate-400 py-6 px-4 border-t border-[#1E3A5F] text-center text-xs space-y-1">
        <p className="text-white font-black tracking-wide">
          ZENITHRX – PHARMACY MANAGEMENT SYSTEM
        </p>
        <p className="text-slate-400">
          WhatsApp: <span className="text-emerald-400 font-bold">+256-755091826</span> | Call:{' '}
          <span className="text-sky-300 font-bold">0200 913 555</span> | Email:{' '}
          <span className="text-slate-200">quantumnetworks@gmail.com</span>
        </p>
        <p className="text-slate-500 text-[11px] pt-1">
          Official Web: www.quantumnetworks.com • Powered by Gemini AI Clinical Engine
          {auth.user && (
            <span className="ml-2 text-slate-600">
              | {auth.user.fullName} ({auth.user.rankRole})
              {!auth.isConfigured && <span className="text-amber-500/70 ml-1">[Demo Mode]</span>}
            </span>
          )}
        </p>
      </footer>

      {/* Modals */}
      {isR2ArchiveOpen && (
        <ExportArchiveModal
          tenantId={auth.user?.tenantId || activeClient.id}
          tenantName={activeClient.clientName}
          onClose={() => setIsR2ArchiveOpen(false)}
        />
      )}

      <BarcodeScannerModal
        drugs={drugs}
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onScanResult={(_drug) => {
          setActiveTab('pos');
          setShowPromoFlyer(false);
        }}
      />

      <AICounselingModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        drugs={drugs}
      />

      <PharmacyFeedbackModal
        isOpen={isFeedbackModalOpen || activeTab === 'feedback'}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          if (activeTab === 'feedback') {
            setActiveTab('overview');
          }
        }}
        activeClient={activeClient}
        onActivatePlan={(tier) => {
          const updatedClient = applyPackageTierToClient(activeClient, tier);
          setActiveClient(updatedClient);
        }}
      />
    </div>
  );
}
