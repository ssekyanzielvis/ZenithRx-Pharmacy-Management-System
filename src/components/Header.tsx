import React, { useState } from 'react';
import { ModuleTab, ClientSubscription, UserRoleRank } from '../types';
import { getRoleBadgeStyle } from '../lib/rolePermissions';
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
  UserCheck,
} from 'lucide-react';
import { AuthUser } from '../hooks/useAuth';
import { ThemeToggle } from './ui/ThemeToggle';
import { SystemNotificationBell } from './SystemNotificationBell';
import { isQuantumEngineerAuthenticated } from '../services/quantumAuthService';

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
  onSwitchRoleDemo?: (role: UserRoleRank | 'Super Admin') => void;
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
  onSwitchRoleDemo,
}) => {
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const isLandingPage = activeTab === 'overview' || showPromoFlyer;

  return (
    <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-50 shadow-xs transition-colors">
      
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
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-xs overflow-hidden group-hover:scale-105 transition-transform bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest text-slate-500 font-extrabold uppercase">
                  QUANTUM NETWORKS LTD
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] px-2 py-0.2 rounded-full font-bold">
                  CLINICAL PLATFORM
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                ZenithRx
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
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
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Subscription Plans
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('platform-features-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Features &amp; Modules
            </button>

            <button
              onClick={() => {
                setShowPromoFlyer(false);
                setActiveTab('pos');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-102"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Appearance Mode Switcher (Landing) */}
            <ThemeToggle variant="segmented" />

            {/* System Notification Bell */}
            <SystemNotificationBell
              tenantId={activeClient.id}
              userId={user?.id}
              userRole={user?.rankRole}
              onNavigateTab={setActiveTab}
            />

            {user && onSignOut && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex flex-col text-right leading-none">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">{user.fullName}</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[120px]">{user.rankRole}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title={`Log Out (${user.email})`}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
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
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
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
              <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-xs overflow-hidden group-hover:scale-105 transition-transform bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img src="/icon.png" alt="ZenithRx Logo" className="w-full h-full object-contain" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-widest text-slate-500 font-extrabold uppercase">
                    QUANTUM NETWORKS LTD
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    SYSTEM ONLINE
                  </span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  ZenithRx
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                    PMS v3.2
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Centre: Active Branch Context (Switchable ONLY for Super Admins, Static for Pharmacy Staff) */}
          {user?.isSuperAdmin || user?.rankRole === 'Super Admin' || isQuantumEngineerAuthenticated() ? (
            <div className="relative">
              <button
                onClick={() => setClientDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 text-xs transition-all cursor-pointer max-w-xs shadow-xs"
                title="Super Admin: Switch client pharmacy tenant context"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Tenant:</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold truncate">{activeClient.clientName}</span>
                <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 border border-cyan-200 dark:border-cyan-800">
                  {activeClient.packageTier}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Branch Dropdown Panel */}
              {clientDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-80 bg-white dark:bg-[#0D1A2A] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between">
                    <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Super Admin Tenant Switcher
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                      {clients.length} Clients
                    </span>
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
                            ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-900 dark:text-cyan-200 font-bold border-l-4 border-cyan-600'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className={`w-3.5 h-3.5 shrink-0 ${client.id === activeClient.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                          <span className="font-semibold truncate">{client.clientName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                            {client.packageTier}
                          </span>
                          {client.id === activeClient.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Secure Static Pharmacy Identity Badge for Regular Staff */
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs max-w-xs shadow-xs select-none">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Pharmacy:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold truncate">{activeClient.clientName}</span>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 border border-emerald-200 dark:border-emerald-800">
                {activeClient.packageTier}
              </span>
            </div>
          )}

          {/* Right: Operational Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Clinical Assistant Trigger */}
            <button
              onClick={onOpenAiCounseling}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all border border-emerald-500 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-100 animate-pulse" />
              <span>AI Clinical Assistant</span>
            </button>

            {/* Barcode Scanner */}
            <button
              onClick={onOpenBarcodeScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Open Barcode Scanner"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Scan</span>
            </button>

            {/* Cloudflare R2 Document Archive */}
            {openR2Archive && (
              <button
                onClick={openR2Archive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-slateald-900 dark:hover:text-slate-100 transition-all cursor-pointer"
                title="Cloudflare R2 Document Archive & Backup Center"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>R2 Archive</span>
              </button>
            )}

            {/* Appearance Mode Switcher (Operational) */}
            <ThemeToggle variant="menu" />

            {/* System Notification Bell */}
            <SystemNotificationBell
              tenantId={activeClient.id}
              userId={user?.id}
              userRole={user?.rankRole}
              onNavigateTab={setActiveTab}
            />

            {/* Return to Landing Page */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setShowPromoFlyer(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <Pill className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xl:inline">Platform Overview</span>
            </button>

            {/* User Profile & Role Switcher / PoLP Inspector */}
            {user && (
              <div className="relative flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden lg:flex flex-col text-right leading-none">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                    {user.fullName}
                  </span>
                  
                  {onSwitchRoleDemo ? (
                    <button
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border mt-0.5 flex items-center gap-1 cursor-pointer transition-all ${getRoleBadgeStyle(
                        user.rankRole
                      )}`}
                      title="Click to test different staff roles under Principle of Least Privilege (PoLP)"
                    >
                      <UserCheck className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[110px]">{user.rankRole}</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[130px]">
                      {user.rankRole}
                    </span>
                  )}
                </div>

                {/* Role Switcher Menu */}
                {roleDropdownOpen && onSwitchRoleDemo && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Principle of Least Privilege (PoLP) Tester
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        Switch persona to inspect privilege boundaries:
                      </p>
                    </div>

                    {[
                      { role: 'Supervising Pharmacist' as UserRoleRank, desc: 'Full clinical, staff accounts, reorders, financial reports' },
                      { role: 'Assistant Pharmacist' as UserRoleRank, desc: 'Dispensing & insurance, no staff or financial margin access' },
                      { role: 'Pharmacy Technician' as UserRoleRank, desc: 'Dispensing & stock management only' },
                      { role: 'POS Cashier / Dispenser' as UserRoleRank, desc: 'Strictly POS retail checkout only' },
                      { role: 'Store & Inventory Manager' as UserRoleRank, desc: 'Stock inventory & purchase orders only' },
                      { role: 'Finance & Claims Officer' as UserRoleRank, desc: 'Financial reports & insurance schemes only' },
                      { role: 'Intern Pharmacist' as UserRoleRank, desc: 'Supervised dispensing and AI counseling' },
                      { role: 'Super Admin' as const, desc: 'Quantum Networks Systems Engineering Ring 0 clearance' },
                    ].map((item) => (
                      <button
                        key={item.role}
                        onClick={() => {
                          onSwitchRoleDemo(item.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex flex-col transition-all cursor-pointer ${
                          user.rankRole === item.role
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 font-bold text-emerald-900 dark:text-emerald-200'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{item.role}</span>
                          {user.rankRole === item.role && (
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title={`Log Out (${user.email})`}
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </header>
  );
};
