import React, { useState, useEffect } from 'react';
import { ModuleTab, DrugItem, Prescription, CustomerProfile, PurchaseOrder, POSTransaction, ClientSubscription } from './types';
import {
  INITIAL_DRUGS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_CUSTOMERS,
  INITIAL_INSURANCE_PROVIDERS,
  INITIAL_POS_TRANSACTIONS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_CLIENT_SUBSCRIPTIONS
} from './data/mockData';

import { Header } from './components/Header';
import { PromoBannerView } from './components/PromoBannerView';
import { PrescriptionProcessing } from './components/PrescriptionProcessing';
import { StockInventory } from './components/StockInventory';
import { ExpiryAlerts } from './components/ExpiryAlerts';
import { CustomerProfiles } from './components/CustomerProfiles';
import { AutomatedReordering } from './components/AutomatedReordering';
import { PointOfSale } from './components/PointOfSale';
import { SalesReports } from './components/SalesReports';
import { InsuranceSchemes } from './components/InsuranceSchemes';
import { AdminPackages } from './components/AdminPackages';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AICounselingModal } from './components/AICounselingModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ModuleTab>('overview');
  const [showPromoFlyer, setShowPromoFlyer] = useState<boolean>(true);

  useEffect(() => {
    document.title = 'ZenithRx Pharmacy Management System';
  }, []);

  // Client Subscription State (System Administrator Context)
  const [activeClient, setActiveClient] = useState<ClientSubscription>(INITIAL_CLIENT_SUBSCRIPTIONS[0]);

  // App Data State
  const [drugs, setDrugs] = useState<DrugItem[]>(INITIAL_DRUGS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [insuranceProviders] = useState(INITIAL_INSURANCE_PROVIDERS);
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>(INITIAL_POS_TRANSACTIONS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);

  // Modal States
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Counters
  const lowStockCount = drugs.filter((d) => d.stockQty <= d.reorderLevel).length;
  const expiringCount = drugs.filter((d) => {
    const diffTime = new Date(d.expiryDate).getTime() - new Date('2026-07-22').getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 90;
  }).length;
  const pendingRxCount = prescriptions.filter((rx) => rx.status === 'Pending').length;

  // Handler functions
  const handleSelectFeatureFromPoster = (tab: ModuleTab) => {
    setActiveTab(tab);
    setShowPromoFlyer(false);
  };

  const handleAddDrug = (newDrug: DrugItem) => {
    setDrugs((prev) => [newDrug, ...prev]);
  };

  const handleUpdateDrug = (updated: DrugItem) => {
    setDrugs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDispenseRx = (rxId: string) => {
    setPrescriptions((prev) =>
      prev.map((rx) => (rx.id === rxId ? { ...rx, status: 'Dispensed' } : rx))
    );
  };

  const handleAddPrescription = (newRx: Prescription) => {
    setPrescriptions((prev) => [newRx, ...prev]);
  };

  const handleAddCustomer = (newCust: CustomerProfile) => {
    setCustomers((prev) => [newCust, ...prev]);
  };

  const handleCreatePO = (newPO: PurchaseOrder) => {
    setPurchaseOrders((prev) => [newPO, ...prev]);
  };

  const handleCompleteSale = (transaction: POSTransaction) => {
    setPosTransactions((prev) => [transaction, ...prev]);

    // Decrement inventory stock
    setDrugs((prevDrugs) =>
      prevDrugs.map((d) => {
        const soldItem = transaction.items.find((item) => item.drugId === d.id);
        if (soldItem) {
          return {
            ...d,
            stockQty: Math.max(0, d.stockQty - soldItem.quantity),
          };
        }
        return d;
      })
    );
  };

  const handleApplyClearanceDiscount = (drugId: string) => {
    setDrugs((prev) =>
      prev.map((d) => {
        if (d.id === drugId) {
          return {
            ...d,
            sellingPrice: Math.round(d.sellingPrice * 0.7),
          };
        }
        return d;
      })
    );
  };

  const handleQuarantineStock = (drugId: string) => {
    setDrugs((prev) =>
      prev.map((d) => {
        if (d.id === drugId) {
          return {
            ...d,
            shelfLocation: 'Quarantine Rack Q-01',
            stockQty: 0,
          };
        }
        return d;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 font-sans flex flex-col">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setShowPromoFlyer(false);
        }}
        showPromoFlyer={showPromoFlyer}
        setShowPromoFlyer={setShowPromoFlyer}
        lowStockCount={lowStockCount}
        expiringCount={expiringCount}
        pendingRxCount={pendingRxCount}
        openAiModal={() => setIsAiModalOpen(true)}
        activeClientTier={activeClient.packageTier}
        activeClientName={activeClient.clientName}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {showPromoFlyer ? (
          <PromoBannerView
            onSelectFeature={handleSelectFeatureFromPoster}
            openBarcodeScanner={() => setIsBarcodeOpen(true)}
          />
        ) : (
          <div>
            {activeTab === 'overview' && (
              <PromoBannerView
                onSelectFeature={handleSelectFeatureFromPoster}
                openBarcodeScanner={() => setIsBarcodeOpen(true)}
              />
            )}

            {activeTab === 'prescriptions' && (
              <PrescriptionProcessing
                prescriptions={prescriptions}
                drugs={drugs}
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
              />
            )}

            {activeTab === 'customers' && (
              <CustomerProfiles
                customers={customers}
                onAddCustomer={handleAddCustomer}
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
                onCompleteSale={handleCompleteSale}
                openBarcodeScanner={() => setIsBarcodeOpen(true)}
              />
            )}

            {activeTab === 'reports' && (
              <SalesReports transactions={posTransactions} />
            )}

            {activeTab === 'insurance' && (
              <InsuranceSchemes providers={insuranceProviders} />
            )}

            {activeTab === 'adminPackages' && (
              <AdminPackages
                activeClient={activeClient}
                setActiveClient={setActiveClient}
              />
            )}
          </div>
        )}
      </main>

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
          Official Web Application: www.quantumnetworks.com • Powered by Gemini 3.6 AI Clinical Engine
        </p>
      </footer>

      {/* Modals */}
      <BarcodeScannerModal
        drugs={drugs}
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onScanResult={(drug) => {
          setActiveTab('pos');
          setShowPromoFlyer(false);
        }}
      />

      <AICounselingModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        drugs={drugs}
      />
    </div>
  );
}
