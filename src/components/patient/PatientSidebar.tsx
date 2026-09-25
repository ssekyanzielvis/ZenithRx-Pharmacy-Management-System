import React, { useState } from 'react';
import {
  Search,
  Upload,
  Calendar,
  MessageSquare,
  Truck,
  BookOpen,
  AlertTriangle,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingCart,
  LogOut,
  Download,
  Pill,
  Headphones,
  Bell,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type PatientTab =
  | 'search'
  | 'prescriptions'
  | 'refills'
  | 'telehealth'
  | 'orders'
  | 'notifications'
  | 'healthLibrary'
  | 'adr'
  | 'support'
  | 'profile';

interface NavItem {
  id: PatientTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  accentFrom: string;
  accentTo: string;
  glowColor: string;
  badge?: string | number;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'search',
    label: 'Medicine Search',
    sublabel: '& Order',
    icon: Search,
    accentFrom: '#059669',
    accentTo: '#0d9488',
    glowColor: 'rgba(5,150,105,0.35)',
  },
  {
    id: 'prescriptions',
    label: 'My Prescriptions',
    sublabel: 'Upload & verify Rx',
    icon: Upload,
    accentFrom: '#7c3aed',
    accentTo: '#6d28d9',
    glowColor: 'rgba(124,58,237,0.35)',
    badge: 'NEW',
    badgeColor: 'bg-violet-600',
  },
  {
    id: 'refills',
    label: 'Chronic Refills',
    sublabel: 'Dose schedule & streak',
    icon: Calendar,
    accentFrom: '#0891b2',
    accentTo: '#0e7490',
    glowColor: 'rgba(8,145,178,0.35)',
  },
  {
    id: 'telehealth',
    label: 'Ask a Pharmacist',
    sublabel: 'Virtual consultation',
    icon: MessageSquare,
    accentFrom: '#ea580c',
    accentTo: '#c2410c',
    glowColor: 'rgba(234,88,12,0.35)',
    badge: 'LIVE',
    badgeColor: 'bg-orange-600',
  },
  {
    id: 'orders',
    label: 'Live Orders',
    sublabel: '& Delivery tracking',
    icon: Truck,
    accentFrom: '#0284c7',
    accentTo: '#075985',
    glowColor: 'rgba(2,132,199,0.35)',
  },
  {
    id: 'notifications',
    label: 'Notification Center',
    sublabel: 'Inbox & status history',
    icon: Bell,
    accentFrom: '#10b981',
    accentTo: '#059669',
    glowColor: 'rgba(16,185,129,0.35)',
    badge: '10 CATEGORIES',
    badgeColor: 'bg-emerald-600',
  },
  {
    id: 'healthLibrary',
    label: 'Health Library',
    sublabel: 'NDA-reviewed guides',
    icon: BookOpen,
    accentFrom: '#16a34a',
    accentTo: '#15803d',
    glowColor: 'rgba(22,163,74,0.35)',
  },
  {
    id: 'adr',
    label: 'Report Side Effect',
    sublabel: 'ADR pharmacovigilance',
    icon: AlertTriangle,
    accentFrom: '#dc2626',
    accentTo: '#b91c1c',
    glowColor: 'rgba(220,38,38,0.35)',
  },
  {
    id: 'support',
    label: 'Support & Help Desk',
    sublabel: 'Complaints & Inquiries',
    icon: Headphones,
    accentFrom: '#2563eb',
    accentTo: '#1d4ed8',
    glowColor: 'rgba(37,99,235,0.35)',
    badge: 'SLA <2h',
    badgeColor: 'bg-blue-600',
  },
  {
    id: 'profile',
    label: 'My Health Profile',
    sublabel: 'Allergies & conditions',
    icon: User,
    accentFrom: '#7c3aed',
    accentTo: '#4f46e5',
    glowColor: 'rgba(124,58,237,0.25)',
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
}

// ─── Component ────────────────────────────────────────────────────────────────
export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  activeTab,
  onTabChange,
  patientName,
  cartCount,
  onOpenCart,
  onOpenAI,
  onLogout,
  onInstallPWA,
  showInstallHint,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<PatientTab | null>(null);

  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab);

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-screen sticky top-0 z-30 transition-all duration-300"
      style={{ width: collapsed ? '72px' : '236px' }}
    >
      <div
        className="flex flex-col h-full relative overflow-hidden"
        style={{
          background: 'linear-gradient(175deg, #080f1e 0%, #0a1628 45%, #091520 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Ambient glow blobs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #059669 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #0891b2 0%, transparent 70%)', transform: 'translate(30%, 30%)' }}
          />
          {activeItem && (
            <div
              className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full opacity-10 transition-all duration-700"
              style={{
                background: `radial-gradient(circle, ${activeItem.accentFrom} 0%, transparent 70%)`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
        </div>

        {/* ── Logo + collapse toggle ── */}
        <div
          className="relative flex items-center gap-3 px-3 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
          >
            <Pill className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-400">ZenithRx</p>
              <p className="text-white font-extrabold text-sm leading-tight">Patient Portal</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0 ml-auto"
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronLeft className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* ── Patient card ── */}
        {!collapsed && (
          <div className="relative px-3 py-3 shrink-0">
            <div
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
              >
                {patientName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-slate-500 font-medium">Signed in as</p>
                <p className="text-white text-xs font-bold truncate">{patientName.split(' ').slice(0, 2).join(' ')}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shrink-0" style={{ boxShadow: '0 0 6px #059669' }} />
            </div>
          </div>
        )}

        {/* ── Nav section label ── */}
        {!collapsed && (
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 px-4 pt-1 pb-1 shrink-0">
            My Health Modules
          </p>
        )}

        {/* ── Nav items ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-0.5 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredId === item.id;
            const lit = isActive || isHovered;

            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => onTabChange(item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  title={collapsed ? `${item.label} — ${item.sublabel}` : undefined}
                  className="w-full flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200 text-left"
                  style={{
                    padding: collapsed ? '11px 0' : '10px 10px',
                    justifyContent: collapsed ? 'center' : undefined,
                    background: isActive
                      ? `linear-gradient(135deg, ${item.accentFrom}1a, ${item.accentTo}26)`
                      : isHovered
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                    border: isActive
                      ? `1px solid ${item.accentFrom}44`
                      : '1px solid transparent',
                    boxShadow: isActive ? `0 2px 20px ${item.glowColor}` : 'none',
                  }}
                >
                  {/* Active accent bar */}
                  {isActive && !collapsed && (
                    <div
                      className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full"
                      style={{ background: `linear-gradient(to bottom, ${item.accentFrom}, ${item.accentTo})` }}
                    />
                  )}

                  {/* Icon tile */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${item.accentFrom}, ${item.accentTo})`
                        : lit
                        ? `${item.accentFrom}22`
                        : 'rgba(255,255,255,0.06)',
                      boxShadow: isActive ? `0 4px 14px ${item.glowColor}` : 'none',
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5 transition-colors duration-200"
                      style={{ color: isActive ? '#fff' : lit ? item.accentFrom : '#64748b' }}
                    />
                  </div>

                  {/* Text */}
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold leading-tight truncate transition-colors duration-150"
                        style={{ color: isActive ? '#fff' : lit ? '#e2e8f0' : '#94a3b8' }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="text-[10px] leading-tight truncate transition-colors duration-150"
                        style={{ color: isActive ? `${item.accentFrom}cc` : '#475569' }}
                      >
                        {item.sublabel}
                      </p>
                    </div>
                  )}

                  {/* Badge */}
                  {!collapsed && item.badge && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white shrink-0 ${item.badgeColor ?? 'bg-emerald-600'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Collapsed floating tooltip */}
                {collapsed && isHovered && (
                  <div
                    className="fixed ml-2 top-auto bg-[#0d1f3c] text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap border pointer-events-none z-[200]"
                    style={{
                      left: '78px',
                      borderColor: `${item.accentFrom}55`,
                      boxShadow: `0 8px 30px ${item.glowColor}, 0 0 0 1px ${item.accentFrom}33`,
                    }}
                  >
                    <p style={{ color: item.accentFrom }}>{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{item.sublabel}</p>
                    {item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white ml-1 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Quick actions ── */}
        <div
          className="relative shrink-0 px-2 py-3 space-y-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Ask RxAI button */}
          <button
            onClick={onOpenAI}
            className="w-full flex items-center gap-2.5 rounded-xl cursor-pointer transition-all duration-200 group"
            style={{
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : undefined,
              background: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(5,150,105,0.12))',
              border: '1px solid rgba(20,184,166,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,184,166,0.22), rgba(5,150,105,0.22))';
              e.currentTarget.style.borderColor = 'rgba(20,184,166,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(5,150,105,0.12))';
              e.currentTarget.style.borderColor = 'rgba(20,184,166,0.2)';
            }}
            title={collapsed ? 'Ask RxAI — AI Clinical Copilot' : undefined}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #059669)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-black text-teal-300">Ask RxAI</p>
                <p className="text-[9px] text-slate-500">AI Clinical Copilot</p>
              </div>
            )}
          </button>

          {/* Cart + Install row */}
          <div className={`flex gap-1.5 ${collapsed ? 'flex-col items-center' : ''}`}>
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center gap-1.5 rounded-xl py-2 cursor-pointer transition-all"
              style={{
                flex: collapsed ? undefined : '1',
                width: collapsed ? '44px' : undefined,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              title={collapsed ? `Cart (${cartCount} items)` : undefined}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
              {!collapsed && <span className="text-xs text-slate-400 font-semibold">Cart</span>}
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {showInstallHint && onInstallPWA && (
              <button
                onClick={onInstallPWA}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 cursor-pointer transition-all"
                style={{
                  flex: collapsed ? undefined : '1',
                  width: collapsed ? '44px' : undefined,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                title="Install as mobile app"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                {!collapsed && <span className="text-xs text-slate-400 font-semibold">Install</span>}
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 cursor-pointer transition-all"
              style={{
                flex: collapsed ? undefined : '1',
                width: collapsed ? '44px' : undefined,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
              }}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              {!collapsed && <span className="text-xs text-slate-500 font-semibold">Sign out</span>}
            </button>
          </div>
        </div>

        {/* ── Version tag ── */}
        {!collapsed && (
          <div className="px-4 pb-3 shrink-0">
            <p className="text-[9px] text-slate-700 text-center font-medium">
              ZenithRx PWA v2.0 · NDA & PSU Licensed Platform
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
