import React from 'react';
import { ModuleTab, TierName } from '../types';
import {
  Pill,
  FileText,
  Package,
  AlertTriangle,
  Users,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  QrCode,
  Sliders
} from 'lucide-react';

interface HeaderProps {
  activeTab: ModuleTab;
  setActiveTab: (tab: ModuleTab) => void;
  showPromoFlyer: boolean;
  setShowPromoFlyer: (show: boolean) => void;
  lowStockCount: number;
  expiringCount: number;
  pendingRxCount: number;
  openAiModal: () => void;
  activeClientTier?: TierName;
  activeClientName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  showPromoFlyer,
  setShowPromoFlyer,
  lowStockCount,
  expiringCount,
  pendingRxCount,
  openAiModal,
  activeClientTier = 'Professional',
  activeClientName = 'Kampala Central Pharmacy',
}) => {
  const navItems: { id: ModuleTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Promo Flyer', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'prescriptions', label: 'Prescriptions', icon: <FileText className="w-4 h-4" />, badge: pendingRxCount, badgeColor: 'bg-amber-500' },
    { id: 'inventory', label: 'Stock & Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'expiry', label: 'Expiry Alerts', icon: <AlertTriangle className="w-4 h-4" />, badge: expiringCount, badgeColor: 'bg-rose-500' },
    { id: 'customers', label: 'Customer Profiles', icon: <Users className="w-4 h-4" /> },
    { id: 'reordering', label: 'Auto-Reorder', icon: <RefreshCw className="w-4 h-4" />, badge: lowStockCount, badgeColor: 'bg-blue-500' },
    { id: 'pos', label: 'POS Billing', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'reports', label: 'Sales Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'insurance', label: 'Insurance & Claims', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'adminPackages', label: 'Client Packages', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-[#0B1E36] text-white border-b border-[#1E3A5F] sticky top-0 z-40 shadow-xl">
      {/* Top Corporate Branding & Quick Info Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowPromoFlyer(true)}>
          <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-sky-700 rounded-lg flex items-center justify-center p-1.5 shadow-md shadow-cyan-900/40">
            {/* Custom chevron diamond icon matching Quantum logo */}
            <div className="grid grid-cols-2 gap-0.5 w-full h-full transform rotate-45 items-center justify-center">
              <div className="bg-white rounded-xs opacity-90"></div>
              <div className="bg-sky-200 rounded-xs"></div>
              <div className="bg-sky-300 rounded-xs"></div>
              <div className="bg-white rounded-xs"></div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest text-sky-300 font-extrabold uppercase">
                QUANTUM NETWORKS LTD
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                SYSTEM ONLINE
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              ZenithRx
              <span className="text-xs font-medium text-sky-200 bg-sky-950/80 border border-sky-700/50 px-2 py-0.5 rounded-md">
                PMS v3.2
              </span>
            </h1>
          </div>
        </div>

        {/* Quick System Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Package Badge Button */}
          <button
            onClick={() => {
              setShowPromoFlyer(false);
              setActiveTab('adminPackages');
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#162C4A] border border-[#254B7C] text-xs hover:border-sky-400 transition-all cursor-pointer"
            title="System Administrator Package Customizer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-medium">Tier:</span>
            <span className="text-cyan-300 font-black">{activeClientTier}</span>
          </button>

          {/* AI Clinical Assistant Trigger */}
          <button
            onClick={openAiModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-medium text-xs shadow-md transition-all border border-cyan-400/30"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span>AI Clinical Assistant</span>
          </button>

          {/* Quick View Toggle: Poster vs System */}
          <button
            onClick={() => setShowPromoFlyer(!showPromoFlyer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showPromoFlyer
                ? 'bg-sky-400 text-slate-950 border-sky-300 shadow-sm'
                : 'bg-[#162C4A] text-sky-200 border-[#254B7C] hover:bg-[#1E3B63]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{showPromoFlyer ? 'Show PMS Dashboard' : 'View Quantum Poster'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Module Tabs */}
      {!showPromoFlyer && (
        <div className="bg-[#081628] border-t border-[#162D4A] px-4 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all relative ${
                    isActive
                      ? 'bg-[#153459] text-white shadow-inner font-semibold border border-sky-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-[#0E2442]'
                  }`}
                >
                  <span className={isActive ? 'text-sky-300' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${
                        item.badgeColor || 'bg-sky-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-400 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
