import React, { useState } from 'react';
import { ModuleTab } from '../types';
import {
  LayoutDashboard,
  FileText,
  Package,
  AlertTriangle,
  Users,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Sliders,
  History,
  UserCheck,
  Activity,
  CreditCard,
  BadgeCheck,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Receipt,
  Boxes,
  ShieldAlert,
  Sparkles,
  Shield,
  UserCog,
  Gift,
  PlusCircle,
  Eye,
  SlidersHorizontal,
  Lock,
  MessageSquarePlus,
  MessageCircle,
  LogOut,
} from 'lucide-react';
import { AuthUser } from '../hooks/useAuth';

interface SidebarProps {
  activeTab: ModuleTab;
  setActiveTab: (tab: ModuleTab) => void;
  lowStockCount: number;
  expiringCount: number;
  pendingRxCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenFeedbackModal?: () => void;
  user?: AuthUser | null;
  onSignOut?: () => void;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: {
    id: ModuleTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  expiringCount,
  pendingRxCount,
  isOpen,
  setIsOpen,
  onOpenFeedbackModal,
  user,
  onSignOut,
}) => {
  // Check if current context is Administrator (/admin)
  const isAdminContext =
    activeTab === 'adminPackages' ||
    activeTab === 'adminControlPlane' ||
    activeTab === 'adminExecutive' ||
    activeTab === 'adminPolicies' ||
    activeTab === 'adminDelegated' ||
    activeTab === 'adminDualControl' ||
    activeTab === 'adminIncidents' ||
    activeTab === 'adminMatrix' ||
    activeTab === 'adminUsers' ||
    activeTab === 'adminBilling' ||
    activeTab === 'adminRegister' ||
    activeTab === 'adminFeedback' ||
    activeTab === 'tenancy';

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    admin_control: true,
    clinical: true,
    sales: true,
    inventory: true,
    security: true,
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Dedicated Admin Sidebar
  const adminCategories: NavCategory[] = [
    {
      id: 'admin_control',
      label: 'Admin Governance & Controls',
      icon: <Shield className="w-4 h-4 text-cyan-400" />,
      items: [
        {
          id: 'adminExecutive',
          label: 'Executive Overview & Health',
          description: 'High-level system health & tenant metrics',
          icon: <Activity className="w-4 h-4 text-emerald-400" />,
        },
        {
          id: 'adminFeedback',
          label: 'Pharmacy Feedback Inbox',
          description: 'View pharmacy feedback tickets & dispatch replies',
          icon: <MessageSquarePlus className="w-4 h-4 text-emerald-400" />,
          badge: 'Inbox',
          badgeColor: 'bg-emerald-600 text-white',
        },
        {
          id: 'adminPolicies',
          label: 'Global Policy Engine',
          description: 'Enforce platform-wide compliance rules',
          icon: <SlidersHorizontal className="w-4 h-4 text-sky-400" />,
        },
        {
          id: 'adminDelegated',
          label: 'Delegated Collaborators',
          description: 'Manage admin domain delegates & access scopes',
          icon: <Users className="w-4 h-4 text-indigo-400" />,
          badge: 3,
          badgeColor: 'bg-indigo-600 text-white',
        },
        {
          id: 'adminDualControl',
          label: 'Dual-Control 4-Eyes Queue',
          description: 'Dual approval requests requiring 4-eyes signoff',
          icon: <Eye className="w-4 h-4 text-amber-400" />,
          badge: 2,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'adminIncidents',
          label: 'Security Incidents',
          description: 'Platform security logs & compliance alerts',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          badge: 2,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'adminMatrix',
          label: 'Tenant Feature Matrix',
          description: 'Toggle module permissions per pharmacy client',
          icon: <Sliders className="w-4 h-4 text-cyan-400" />,
        },
        {
          id: 'adminUsers',
          label: 'Branch Staff Accounts',
          description: 'Manage staff user limits, seats & role credentials',
          icon: <UserCog className="w-4 h-4 text-purple-400" />,
          badge: '3 Users',
          badgeColor: 'bg-purple-600 text-white',
        },
        {
          id: 'adminBilling',
          label: 'Package & Billing Control',
          description: 'UGX subscription rates & discount coupons',
          icon: <Gift className="w-4 h-4 text-teal-400" />,
          badge: '-20% OFF',
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'adminRegister',
          label: 'Register Pharmacy Tenant',
          description: 'Onboard new client branches linked with NDA registry',
          icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
        },
        {
          id: 'tenancy',
          label: 'Multi-Tenant SaaS Operations',
          description: 'Multi-branch chain overview & organization controls',
          icon: <Layers className="w-4 h-4 text-violet-400" />,
        },
      ],
    },
  ];

  // User Operational Sidebar (Includes Send Feedback to Admin)
  const userCategories: NavCategory[] = [
    {
      id: 'clinical',
      label: 'Clinical & Patient Care',
      icon: <Stethoscope className="w-4 h-4 text-cyan-400" />,
      items: [
        {
          id: 'prescriptions',
          label: 'Prescription Queue',
          description: 'AI prescription processing & label printing',
          icon: <FileText className="w-4 h-4" />,
          badge: pendingRxCount,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'customers',
          label: 'Patient Directory',
          description: 'Patient refill history & chronic profiles',
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'expiry',
          label: 'FEFO Expiry Alerts',
          description: '30/60/90 day early warning engine',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: expiringCount,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'nda',
          label: 'NDA Registry',
          description: 'Uganda NDA licensed premises lookup',
          icon: <BadgeCheck className="w-4 h-4" />,
        },
      ],
    },
    {
      id: 'sales',
      label: 'POS & Financial Operations',
      icon: <Receipt className="w-4 h-4 text-emerald-400" />,
      items: [
        {
          id: 'pos',
          label: 'Retail Counter (POS)',
          description: 'Fast barcode checkout & receipt printing',
          icon: <ShoppingCart className="w-4 h-4" />,
        },
        {
          id: 'payments',
          label: 'Financial Ledger',
          description: 'Cash, Mobile Money & card drawer balancing',
          icon: <CreditCard className="w-4 h-4" />,
        },
        {
          id: 'reports',
          label: 'Sales Reports & Analytics',
          description: 'Revenue growth & drug margin analytics',
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          id: 'insurance',
          label: 'Insurance & Claims',
          description: 'Co-pay calculations & scheme claim batches',
          icon: <ShieldCheck className="w-4 h-4" />,
        },
      ],
    },
    {
      id: 'inventory',
      label: 'Stock & Supply Chain',
      icon: <Boxes className="w-4 h-4 text-sky-400" />,
      items: [
        {
          id: 'inventory',
          label: 'Stock & Shelves',
          description: 'Multi-shelf tracking & barcode search',
          icon: <Package className="w-4 h-4" />,
        },
        {
          id: 'reordering',
          label: 'Automated Re-ordering',
          description: 'Stock depletion forecasts & supplier POs',
          icon: <RefreshCw className="w-4 h-4" />,
          badge: lowStockCount,
          badgeColor: 'bg-blue-500 text-white',
        },
      ],
    },
    {
      id: 'security',
      label: 'Security & Staff Roles',
      icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
      items: [
        {
          id: 'collaborators',
          label: 'Staff & Roles Control',
          description: 'Role permissions & staff accounts',
          icon: <UserCheck className="w-4 h-4" />,
        },
        {
          id: 'audit',
          label: 'NDA Audit Log',
          description: 'Compliant security activity & event trail',
          icon: <History className="w-4 h-4" />,
        },
        {
          id: 'health',
          label: 'System Health Dashboard',
          description: 'Database latency, uptime & Gemini API status',
          icon: <Activity className="w-4 h-4" />,
        },
      ],
    },
  ];

  const categories = isAdminContext ? adminCategories : userCategories;

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-[#071629] border-r border-[#152E4D] transition-all duration-300 flex flex-col justify-between select-none ${
        isOpen ? 'w-64 lg:w-72' : 'w-16'
      }`}
    >
      {/* Sidebar Header Title & Collapse Toggle */}
      <div className="p-3.5 border-b border-[#152E4D] flex items-center justify-between gap-2">
        {isOpen ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center p-1 shadow-md shrink-0 ${
              isAdminContext
                ? 'bg-gradient-to-br from-amber-400 to-rose-600'
                : 'bg-gradient-to-br from-cyan-400 to-sky-600'
            }`}>
              <div className="grid grid-cols-2 gap-0.5 w-full h-full transform rotate-45 items-center justify-center">
                <div className="bg-white rounded-xs opacity-90"></div>
                <div className="bg-sky-200 rounded-xs"></div>
                <div className="bg-sky-300 rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
              </div>
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                isAdminContext ? 'text-amber-400' : 'text-sky-400'
              }`}>
                {isAdminContext ? 'ADMIN CONTROL PLANE' : 'ZENITHRX OPERATIONAL'}
              </p>
              <p className="text-xs font-black text-white tracking-tight truncate mt-0.5">
                {isAdminContext ? 'System Admin Sidebar' : 'User Navigation Panel'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center p-1 mx-auto shadow-md">
            <div className="grid grid-cols-2 gap-0.5 w-full h-full transform rotate-45">
              <div className="bg-white rounded-xs opacity-90"></div>
              <div className="bg-sky-200 rounded-xs"></div>
              <div className="bg-sky-300 rounded-xs"></div>
              <div className="bg-white rounded-xs"></div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-[#0E2542] hover:bg-[#16355E] text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar Navigation Body */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-sky-900">
        
        {/* User Navigation Actions (Platform Overview + Send Feedback) */}
        {!isAdminContext && (
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50'
                  : 'text-sky-200 bg-[#0C203A] hover:bg-[#122E54] hover:text-white border border-sky-900/30'
              }`}
              title="Platform Overview Landing Page"
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0 text-cyan-300" />
              {isOpen && <span className="truncate">Platform Overview</span>}
            </button>

            {/* SEND FEEDBACK BUTTON IN USER NAVIGATION PANEL */}
            <button
              onClick={() => {
                if (onOpenFeedbackModal) {
                  onOpenFeedbackModal();
                } else {
                  setActiveTab('feedback');
                }
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-emerald-300 bg-[#0C2A34] hover:bg-[#123B4A] hover:text-white border border-emerald-500/30'
              }`}
              title="Send Feedback & Inquiries to System Admin"
            >
              <MessageSquarePlus className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
              {isOpen && <span className="truncate">Send Feedback to Admin</span>}
            </button>
          </div>
        )}

        {/* Categories Section */}
        {categories.map((cat) => {
          const isCatExpanded = expandedCategories[cat.id] ?? true;

          return (
            <div key={cat.id} className="space-y-1">
              
              {/* Category Header Button */}
              {isOpen ? (
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full px-2 py-1.5 flex items-center justify-between text-[11px] font-extrabold text-slate-400 hover:text-sky-300 uppercase tracking-wider transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {cat.icon}
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCatExpanded ? '' : '-rotate-90'}`} />
                  </div>
                </button>
              ) : (
                <div className="h-0.5 bg-[#152E4D] my-2" title={cat.label} />
              )}

              {/* Category Sub-items */}
              {(isCatExpanded || !isOpen) && (
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-3 transition-all cursor-pointer relative group ${
                          isActive
                            ? isAdminContext
                              ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold shadow-md'
                              : 'bg-sky-600 text-white font-bold shadow-md'
                            : 'text-slate-300 hover:bg-[#0E2542] hover:text-white'
                        }`}
                        title={`${item.label} — ${item.description}`}
                      >
                        <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'}`}>
                          {item.icon}
                        </span>

                        {isOpen && (
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                            <span className="truncate">{item.label}</span>
                            {item.badge !== undefined && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${item.badgeColor || 'bg-sky-500/80 text-white'}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#152E4D] bg-[#051121] text-[11px] text-slate-400 space-y-2">
        {user && onSignOut && (
          <button
            onClick={onSignOut}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-100 border border-rose-800/40 text-xs font-bold transition-all cursor-pointer shadow-sm ${
              !isOpen ? 'justify-center px-2' : ''
            }`}
            title={`Log Out (${user.email})`}
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            {isOpen && <span className="truncate">Log Out ({user.fullName.split(' ')[0]})</span>}
          </button>
        )}
        {isOpen && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAdminContext ? 'System Admin Mode' : 'ZenithRx Engine'}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {isAdminContext ? 'Strict Least Privilege Enforced' : 'Quantum PMS v3.2 • Enterprise'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
