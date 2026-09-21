import React, { useState } from 'react';
import { ModuleTab, ClientSubscription } from '../types';
import {
  Pill,
  Sparkles,
  QrCode,
  Cloud,
  ChevronDown,
  Building2,
  Menu,
  ArrowRight,
  Shield,
  LogOut,
} from 'lucide-react';
import { AuthUser } from '../hooks/useAuth';

interface HeaderProps {
  activeTab: ModuleTab;
  setActiveTab: (tab: ModuleTab) => void;
  showPromoFlyer: boolean;
  setShowPromoFlyer: (show: boolean) => void;
  /** All registered client branches */
  clients: ClientSubscription[];
  /** Currently active branch context */
  activeClient: ClientSubscription;
  /** Switches the active branch across the entire system */
  setActiveClient: (client: ClientSubscription) => void;
  lowStockCount: number;
  expiringCount: number;
  pendingRxCount: number;
  /** Opens the Gemini AI Patient Counseling assistant */
  onOpenAiCounseling: () => void;
  /** Opens the barcode scanner modal */
  onOpenBarcodeScanner: () => void;
  openR2Archive?: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user?: AuthUser | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  showPromoFlyer,
  setShowPromoFlyer,
  clients,
  activeClient,
  setActiveClient,
  lowStockCount,
  expiringCount,
  pendingRxCount,
  onOpenAiCounseling,
  onOpenBarcodeScanner,
  openR2Archive,
  sidebarOpen,
  setSidebarOpen,
  user,
  onSignOut,
}) => {
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  const isLandingPage = activeTab === 'overview' || showPromoFlyer;

  return (
    <header className="bg-[#1E293B] text-white border-b border-slate-700/80 sticky top-0 z-50 shadow-xl">
      
      {/* ── LANDING PAGE HEADER (Clean Public Corporate Bar) ── */}
      {isLandingPage ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Title */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              setActiveTab('overview');
              setShowPromoFlyer(false);
            }}
            title="ZenithRx Platform Overview Landing Page"
          >
            <div className="relative w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center p-1.5 shadow-md shadow-slate-950/40 group-hover:scale-105 transition-transform">
              <div className="grid grid-cols-2 gap-0.5 w-full h-full transform rotate-45 items-center justify-center">
                <div className="bg-white rounded-xs opacity-90"></div>
                <div className="bg-blue-200 rounded-xs"></div>
                <div className="bg-green-200 rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs tracking-widest text-blue-400 font-extrabold uppercase">
                  QUANTUM NETWORKS LTD
                </span>
                <span className="bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                  OFFICIAL PLATFORM
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                ZenithRx
                <span className="text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                  PMS v3.2
                </span>
              </h1>
            </div>
          </div>

          {/* Right: Public Landing Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button
              onClick={() => {
                const el = document.getElementById('pricing-plans-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
            >
              Subscription Plans
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('platform-features-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
            >
              Features &amp; Modules
            </button>

            <button
              onClick={() => {
                setShowPromoFlyer(false);
                setActiveTab('pos');
              }}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-xs shadow-lg shadow-green-900/40 transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-102"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {user && onSignOut && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="hidden sm:flex flex-col text-right leading-none">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.fullName}</span>
                  <span className="text-[10px] text-blue-400 font-medium truncate max-w-[120px]">{user.rankRole}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title={`Log Out (${user.email})`}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ── OPERATIONAL WORKSPACE HEADER (When operating live pharmacy modules) ── */
        <div className="max-w-full px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Sidebar Toggle Button + Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title={sidebarOpen ? 'Collapse Navigation Sidebar' : 'Expand Navigation Sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                setActiveTab('overview');
                setShowPromoFlyer(false);
              }}
              title="Return to Platform Overview Landing Page"
            >
              <div className="relative w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center p-1.5 shadow-md shadow-slate-950/40 group-hover:scale-105 transition-transform">
                <div className="grid grid-cols-2 gap-0.5 w-full h-full transform rotate-45 items-center justify-center">
                  <div className="bg-white rounded-xs opacity-90"></div>
                  <div className="bg-blue-200 rounded-xs"></div>
                  <div className="bg-green-200 rounded-xs"></div>
                  <div className="bg-white rounded-xs"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs tracking-widest text-blue-400 font-extrabold uppercase">
                    QUANTUM NETWORKS LTD
                  </span>
                  <span className="bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    SYSTEM ONLINE
                  </span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  ZenithRx
                  <span className="text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                    PMS v3.2
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Centre: Active Branch Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setClientDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 text-xs transition-all cursor-pointer max-w-xs shadow-inner"
              title="Switch active client pharmacy branch"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-slate-300 font-medium shrink-0">Branch:</span>
              <span className="text-white font-bold truncate">{activeClient.clientName}</span>
              <span className="bg-blue-600/30 text-blue-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 border border-blue-600/30">
                {activeClient.packageTier}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Branch Dropdown Panel */}
            {clientDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-slate-950/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Registered Client Branches
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setActiveClient(client);
                        setClientDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between gap-3 transition-colors ${
                        client.id === activeClient.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${client.id === activeClient.id ? 'text-white' : 'text-slate-400'}`} />
                        <span className="font-semibold truncate">{client.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                          {client.packageTier}
                        </span>
                        {client.id === activeClient.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Operational Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Clinical Assistant Trigger */}
            <button
              onClick={onOpenAiCounseling}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all border border-blue-400/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
              <span>AI Clinical Assistant</span>
            </button>

            {/* Barcode Scanner */}
            <button
              onClick={onOpenBarcodeScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold shadow-md transition-all cursor-pointer"
              title="Open Barcode Scanner"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Scan</span>
            </button>

            {/* Cloudflare R2 Document Archive */}
            {openR2Archive && (
              <button
                onClick={openR2Archive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:border-blue-500 hover:text-white transition-all cursor-pointer"
                title="Cloudflare R2 Document Archive & Backup Center"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>R2 Archive</span>
              </button>
            )}

            {/* Return to Landing Page */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setShowPromoFlyer(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5 text-green-400" />
              <span>Platform Overview</span>
            </button>

            {/* User Profile & Global Logout Button */}
            {user && onSignOut && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="hidden lg:flex flex-col text-right leading-none">
                  <span className="text-xs font-bold text-white truncate max-w-[130px]">{user.fullName}</span>
                  <span className="text-[10px] text-blue-400 font-medium truncate max-w-[130px]">{user.rankRole}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title={`Log Out (${user.email})`}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </header>
  );
};
