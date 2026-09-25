import React, { useState } from 'react';
import {
  Search,
  Upload,
  Calendar,
  MessageSquare,
  Truck,
  Sparkles,
  ShoppingCart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Pill,
  Building2,
  Bell,
  BookOpen,
  AlertTriangle,
  Headphones,
  User,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type PatientTab =
  | 'search'
  | 'branches'
  | 'prescriptions'
  | 'refills'
  | 'telehealth'
  | 'orders'
  | 'notifications'
  | 'healthLibrary'
  | 'adr'
  | 'support'
  | 'profile';

export interface NavItem {
  id: PatientTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  isAi?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'search',
    label: 'Medicine Search',
    sublabel: '& Order',
    icon: Search,
  },
  {
    id: 'branches',
    label: 'Partner Pharmacies',
    sublabel: '& Live Stock',
    icon: Building2,
  },
  {
    id: 'prescriptions',
    label: 'My Prescriptions',
    sublabel: 'Upload & verify Rx',
    icon: Upload,
    badge: 'NEW',
    badgeColor: 'bg-purple-600 text-white',
  },
  {
    id: 'refills',
    label: 'Chronic Refills',
    sublabel: 'Dose schedule & streak',
    icon: Calendar,
  },
  {
    id: 'telehealth',
    label: 'Ask a Pharmacist',
    sublabel: 'Virtual consultation',
    icon: MessageSquare,
    badge: 'LIVE',
    badgeColor: 'bg-orange-600 text-white',
  },
  {
    id: 'orders',
    label: 'Live Orders',
    sublabel: '& Delivery tracking',
    icon: Truck,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    sublabel: '& Adherence alerts',
    icon: Bell,
  },
  {
    id: 'healthLibrary',
    label: 'Health Library',
    sublabel: '& Drug education',
    icon: BookOpen,
  },
  {
    id: 'adr',
    label: 'Adverse Reactions',
    sublabel: 'Report side effects',
    icon: AlertTriangle,
  },
  {
    id: 'support',
    label: 'Patient Support',
    sublabel: 'Emergency & help',
    icon: Headphones,
  },
  {
    id: 'profile',
    label: 'Health Passport',
    sublabel: 'Digital medical ID',
    icon: User,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface PatientSidebarProps {
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  patientName: string;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAI: () => void;
  onLogout: () => void;
  onInstallPWA?: () => void;
  showInstallHint?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  activeTab,
  onTabChange,
  patientName = 'Grace Nakato',
  cartCount,
  onOpenCart,
  onOpenAI,
  onLogout,
  onInstallPWA,
  showInstallHint,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const renderNavContent = (isDrawer = false) => (
    <div
      className="flex flex-col h-full relative overflow-hidden select-none"
      style={{
        background: '#07111e',
        borderRight: isDrawer ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── 1. Top Brand Header ── */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
          <Pill className="w-5 h-5 rotate-45" />
        </div>
        {(!collapsed || isDrawer) && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-400">ZenithRx</p>
            <p className="text-white font-extrabold text-sm leading-tight">Patient Portal</p>
          </div>
        )}
        {!isDrawer ? (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0 ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        ) : (
          <button
            onClick={onCloseMobile}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0 ml-auto"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── 2. Signed In Profile Card ── */}
      {(!collapsed || isDrawer) && (
        <div className="mx-3 mt-3.5 mb-2 p-2.5 rounded-2xl bg-[#0e1d33] border border-slate-800/80 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
              {patientName ? patientName.slice(0, 1).toUpperCase() : 'G'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 leading-tight">Signed in as</p>
              <p className="text-xs font-extrabold text-white truncate">{patientName || 'Grace Nakato'}</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs ring-2 ring-emerald-500/20" />
        </div>
      )}

      {/* ── 3. Nav Items (MY HEALTH MODULES) ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-none">
        {(!collapsed || isDrawer) && (
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 px-2 pb-1">
            MY HEALTH MODULES
          </p>
        )}

        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isAi) {
            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => onOpenAI()}
                className={`w-full flex items-center gap-3 rounded-2xl cursor-pointer transition-all p-3 text-left border ${
                  collapsed && !isDrawer ? 'justify-center' : ''
                } bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-950/50 text-white shadow-xs`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                </div>
                {(!collapsed || isDrawer) && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white">Ask RxAI</p>
                    <p className="text-[10px] text-emerald-400 font-medium">AI Clinical Copilot</p>
                  </div>
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (isDrawer && onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 rounded-2xl cursor-pointer transition-all p-2.5 text-left ${
                collapsed && !isDrawer ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-emerald-600/90 text-white font-bold shadow-md shadow-emerald-600/25 border border-emerald-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isActive
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'bg-slate-800/80 text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {(!collapsed || isDrawer) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold leading-snug truncate">{item.label}</p>
                  <p
                    className={`text-[10px] leading-snug truncate ${
                      isActive ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {item.sublabel}
                  </p>
                </div>
              )}

              {(!collapsed || isDrawer) && item.badge && (
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-xs ${
                    item.badgeColor || 'bg-emerald-600 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── 4. Bottom Actions (Cart + Sign Out) ── */}
      <div className="shrink-0 p-3 space-y-2.5 border-t border-slate-800/80">
        {(!collapsed || isDrawer) ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenCart}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#0e1d33] hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/60 transition-all cursor-pointer shadow-2xs"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cart {cartCount > 0 && `(${cartCount})`}</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#0e1d33] hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 text-xs font-bold border border-slate-700/60 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={onOpenCart}
              className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-700"
              title="Cart"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onLogout}
              className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center hover:bg-rose-900"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        )}

        {(!collapsed || isDrawer) && (
          <p className="text-[9px] text-slate-500 text-center leading-tight font-medium pt-1">
            ZenithRx PWA v2.0 · NDA &amp; PSU Licensed Platform
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible) */}
      <aside
        className={`hidden md:block shrink-0 h-screen transition-all duration-300 ease-in-out ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
