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
    <header className="bg-[#0B1E36] text-white border-b border-[#1E3A5F] sticky top-0 z-50 shadow-xl">
      
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
            <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-sky-700 rounded-lg flex items-center justify-center p-1.5 shadow-md shadow-cyan-900/40 group-hover:scale-105 transition-transform">
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
                  OFFICIAL PLATFORM
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

          {/* Right: Public Landing Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button
              onClick={() => {
                const el = document.getElementById('pricing-plans-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Subscription Plans
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('platform-features-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Features &amp; Modules
            </button>



            <button
              onClick={() => {
                setShowPromoFlyer(false);
                setActiveTab('pos');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-900/50 transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-102"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {user && onSignOut && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
                <div className="hidden sm:flex flex-col text-right leading-none">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.fullName}</span>
                  <span className="text-[10px] text-sky-400 font-medium truncate max-w-[120px]">{user.rankRole}</span>
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
              className="p-2 rounded-xl bg-[#162C4A] hover:bg-[#1E3B63] border border-[#254B7C] text-sky-300 hover:text-white transition-all cursor-pointer shadow-sm"
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
              <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-sky-700 rounded-lg flex items-center justify-center p-1.5 shadow-md shadow-cyan-900/40 group-hover:scale-105 transition-transform">
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
          </div>

          {/* Centre: Active Branch Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setClientDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#162C4A] border border-[#254B7C] hover:border-sky-400 text-xs transition-all cursor-pointer max-w-xs shadow-inner"
              title="Switch active client pharmacy branch"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-slate-300 font-medium shrink-0">Client Branch:</span>
              <span className="text-sky-200 font-black truncate">{activeClient.clientName}</span>
              <span className="bg-sky-600/30 text-sky-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 border border-sky-600/30">
                {activeClient.packageTier}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Branch Dropdown Panel */}
            {clientDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-[#0E2240] border border-[#1E3A5F] rounded-2xl shadow-2xl shadow-slate-950/60 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-[#1E3A5F]">
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
                          ? 'bg-sky-600/20 text-white'
                          : 'text-slate-300 hover:bg-[#162C4A] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${client.id === activeClient.id ? 'text-sky-400' : 'text-slate-500'}`} />
                        <span className="font-semibold truncate">{client.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                          client.packageTier === 'Enterprise'
                            ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                            : client.packageTier === 'Professional'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                        }`}>
                          {client.packageTier}
                        </span>
                        {client.id === activeClient.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
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
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-medium text-xs shadow-md transition-all border border-cyan-400/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
              <span>AI Clinical Assistant</span>
            </button>

            {/* Barcode Scanner */}
            <button
              onClick={onOpenBarcodeScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-md transition-all border border-violet-400/30 cursor-pointer"
              title="Open Barcode Scanner"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan</span>
            </button>

            {/* Cloudflare R2 Document Archive */}
            {openR2Archive && (
              <button
                onClick={openR2Archive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162C4A] border border-[#254B7C] text-xs text-sky-200 hover:border-sky-400 hover:text-white transition-all cursor-pointer"
                title="Cloudflare R2 Document Archive & Backup Center"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span>R2 Archive</span>
              </button>
            )}

            {/* Return to Landing Page */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setShowPromoFlyer(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[#162C4A] text-sky-200 border border-[#254B7C] hover:bg-[#1E3B63] hover:text-white transition-all cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Platform Overview</span>
            </button>

            {/* User Profile & Global Logout Button */}
            {user && onSignOut && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
                <div className="hidden lg:flex flex-col text-right leading-none">
                  <span className="text-xs font-bold text-white truncate max-w-[130px]">{user.fullName}</span>
                  <span className="text-[10px] text-sky-400 font-medium truncate max-w-[130px]">{user.rankRole}</span>
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
