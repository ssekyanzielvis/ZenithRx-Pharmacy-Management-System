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
  MessageSquare,
  Building2,
  TrendingUp,
  Cpu,
  LogOut,
  DollarSign,
  Award,
  BookOpen,
  Scan,
  Truck,
  HeartPulse,
  FileSpreadsheet,
  AlertOctagon,
  ArrowLeftRight,
  Pill,
  ShoppingBag,
  ClipboardCheck,
  RotateCcw,
  Scale,
  Headphones,
  Bell,
  TrendingDown,
} from 'lucide-react';
import { AuthUser } from '../hooks/useAuth';
import { canUserAccessTab } from '../lib/rolePermissions';

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
    activeTab === 'adminQuantumWorkbench' ||
    activeTab === 'adminRevenueLedger' ||
    activeTab === 'adminExecutive' ||
    activeTab === 'adminPolicies' ||
    activeTab === 'adminDelegated' ||
    activeTab === 'adminDualControl' ||
    activeTab === 'adminIncidents' ||
    activeTab === 'adminMatrix' ||
    activeTab === 'adminUsers' ||
    activeTab === 'adminBilling' ||
    activeTab === 'adminRegister' ||
    activeTab === 'adminPharmacyRegistry' ||
    activeTab === 'adminCapacity' ||
    activeTab === 'adminMessagingHub' ||
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
      label: 'Quantum Networks Systems Engineering',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      items: [
        {
          id: 'adminQuantumWorkbench',
          label: 'Engineering Workbench',
          description: 'SQL migrations, RLS scanner & runtime telemetry',
          icon: <Cpu className="w-4 h-4 text-cyan-400" />,
          badge: 'Ring 0',
          badgeColor: 'bg-cyan-600 text-white font-mono',
        },
        {
          id: 'adminPharmacyRegistry',
          label: 'Subscribed Pharmacies',
          description: 'Overview of all subscribed pharmacies & NDA compliance',
          icon: <Building2 className="w-4 h-4 text-emerald-400" />,
          badge: 'Super Admin',
          badgeColor: 'bg-emerald-600 text-white',
        },
        {
          id: 'adminCapacity',
          label: 'System Capacity & Upgrades',
          description: 'Real-time telemetry, 70/85/95% alerts & upgrade dispatch',
          icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
          badge: 'Alerts',
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
        {
          id: 'adminMessagingHub',
          label: 'Admin ↔ Pharmacy Messages',
          description: '2-way threaded direct messaging & templates',
          icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
          badge: '2-Way',
          badgeColor: 'bg-blue-600 text-white',
        },
        {
          id: 'adminExecutive',
          label: 'Executive Overview & Health',
          description: 'High-level system health & tenant metrics',
          icon: <Activity className="w-4 h-4 text-green-500" />,
        },
        {
          id: 'adminFeedback',
          label: 'Pharmacy Feedback Inbox',
          description: 'View pharmacy feedback tickets & dispatch replies',
          icon: <MessageSquarePlus className="w-4 h-4 text-green-500" />,
          badge: 'Inbox',
          badgeColor: 'bg-green-600 text-white',
        },
        {
          id: 'adminPolicies',
          label: 'Global Policy Engine',
          description: 'Enforce platform-wide compliance rules',
          icon: <SlidersHorizontal className="w-4 h-4 text-blue-400" />,
        },
        {
          id: 'adminDelegated',
          label: 'Delegated Collaborators',
          description: 'Manage admin domain delegates & access scopes',
          icon: <Users className="w-4 h-4 text-blue-400" />,
          badge: 3,
          badgeColor: 'bg-blue-600 text-white',
        },
        {
          id: 'adminDualControl',
          label: 'Dual-Control 4-Eyes Queue',
          description: 'Dual approval requests requiring 4-eyes signoff',
          icon: <Eye className="w-4 h-4 text-amber-400" />,
          badge: 2,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
        {
          id: 'adminIncidents',
          label: 'Security Incidents',
          description: 'Platform security logs & compliance alerts',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          badge: 2,
          badgeColor: 'bg-red-600 text-white',
        },
        {
          id: 'adminMatrix',
          label: 'Tenant Feature Matrix',
          description: 'Toggle module permissions per pharmacy client',
          icon: <Sliders className="w-4 h-4 text-blue-400" />,
        },
        {
          id: 'adminUsers',
          label: 'Branch Staff Accounts',
          description: 'Manage staff user limits, seats & role credentials',
          icon: <UserCog className="w-4 h-4 text-blue-400" />,
          badge: '3 Users',
          badgeColor: 'bg-slate-700 text-slate-200',
        },
        {
          id: 'adminPharmacistVerification',
          label: 'PSU Pharmacist Registry',
          description: 'Annual practicing certificates & supervisory credentials',
          icon: <Award className="w-4 h-4 text-emerald-400" />,
          badge: 'PSU',
          badgeColor: 'bg-emerald-600 text-white',
        },
        {
          id: 'adminMedicineCatalogue',
          label: 'Medicine Knowledge & Decision Base',
          description: 'Reference monographs & contextual clinical decision engine',
          icon: <Pill className="w-4 h-4 text-cyan-400" />,
          badge: 'Clinical KB',
          badgeColor: 'bg-indigo-600 text-white font-bold',
        },
        {
          id: 'adminHealthEducation',
          label: 'Health Education CMS',
          description: 'Manage patient health guides & counseling articles',
          icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
        },
        {
          id: 'adminOCR',
          label: 'Prescription OCR Queue',
          description: 'Handwritten Rx parsing, UMDPC doctor licence check',
          icon: <Scan className="w-4 h-4 text-indigo-400" />,
          badge: 'OCR',
          badgeColor: 'bg-indigo-600 text-white',
        },
        {
          id: 'adminRevenueLedger',
          label: 'Revenue & SaaS Ledger',
          description: 'Double-entry bookkeeping, 18% URA VAT & system-mediated payments',
          icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
          badge: 'Accounting',
          badgeColor: 'bg-emerald-600 text-white font-bold',
        },
        {
          id: 'adminBilling',
          label: 'Package & Billing Control',
          description: 'UGX subscription rates & discount coupons',
          icon: <Gift className="w-4 h-4 text-blue-400" />,
          badge: '-20% OFF',
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
        {
          id: 'adminRegister',
          label: 'Register Pharmacy Tenant',
          description: 'Onboard new client branches linked with NDA registry',
          icon: <PlusCircle className="w-4 h-4 text-green-500" />,
        },
        {
          id: 'tenancy',
          label: 'Multi-Tenant SaaS Operations',
          description: 'Multi-branch chain overview & organization controls',
          icon: <Layers className="w-4 h-4 text-blue-400" />,
        },
      ],
    },
  ];

  // User Operational Sidebar (Includes Send Feedback to Admin)
  const userCategories: NavCategory[] = [
    {
      id: 'clinical',
      label: 'Clinical & Patient Care',
      icon: <Stethoscope className="w-4 h-4 text-green-500" />,
      items: [
        {
          id: 'prescriptions',
          label: 'Prescription Queue',
          description: 'AI prescription processing & label printing',
          icon: <FileText className="w-4 h-4" />,
          badge: pendingRxCount,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
        {
          id: 'dispensingRegister',
          label: 'NDA Dispensing Register',
          description: 'Statutory poison & prescription register (Regulation 1970)',
          icon: <FileSpreadsheet className="w-4 h-4 text-indigo-500" />,
          badge: 'NDA',
          badgeColor: 'bg-indigo-600 text-white',
        },
        {
          id: 'prescriptionSubstitutions',
          label: 'Drug Substitution & Interchange',
          description: 'Prescribed vs generic/therapeutic interchange, NTI safety & NDA labels',
          icon: <ArrowLeftRight className="w-4 h-4 text-teal-400" />,
          badge: 'Interchange',
          badgeColor: 'bg-teal-600 text-white font-bold',
        },
        {
          id: 'pharmacistInterventions',
          label: 'Clinical Interventions',
          description: 'Dose clarifications, interactions, allergy & prescriber modifications',
          icon: <Stethoscope className="w-4 h-4 text-teal-500" />,
          badge: 'GPP',
          badgeColor: 'bg-teal-600 text-white font-bold',
        },
        {
          id: 'adrReporting',
          label: 'ADR & Pharmacovigilance',
          description: 'Log adverse reactions & submit NDA Yellow Sheets',
          icon: <AlertOctagon className="w-4 h-4 text-rose-500" />,
        },
        {
          id: 'adminConsultation',
          label: 'Consultation & Smart Queue',
          description: 'Physical walk-in queue (#A023, EWT) & virtual clinical desk',
          icon: <Stethoscope className="w-4 h-4 text-sky-500" />,
          badge: 'Smart Queue',
          badgeColor: 'bg-emerald-600 text-white font-bold',
        },
        {
          id: 'adminAdherenceRefill',
          label: 'Refill Eligibility & Depletion',
          description: 'Calculates quantity ÷ daily dose, runout dates & pharmacist review',
          icon: <HeartPulse className="w-4 h-4 text-rose-500" />,
          badge: 'Refill Calc',
          badgeColor: 'bg-indigo-600 text-white font-bold',
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
          badgeColor: 'bg-red-600 text-white font-bold',
        },
        {
          id: 'medicineRecall',
          label: 'Medicine Recall Command',
          description: 'Multi-branch batch isolation, POS lock & patient safety outreach',
          icon: <AlertOctagon className="w-4 h-4 text-red-500" />,
          badge: 'NDA Recall',
          badgeColor: 'bg-red-600 text-white font-bold',
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
      label: 'POS & Delivery Operations',
      icon: <Receipt className="w-4 h-4 text-blue-400" />,
      items: [
        {
          id: 'pos',
          label: 'Retail Counter (POS)',
          description: 'Fast barcode checkout & receipt printing',
          icon: <ShoppingCart className="w-4 h-4" />,
        },
        {
          id: 'onlineOrders',
          label: 'Patient Online Orders',
          description: 'Live queue of patient PWA orders — verify, dispatch & track delivery',
          icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
          badge: 3,
          badgeColor: 'bg-emerald-600 text-white font-bold',
        },
        {
          id: 'adminOrdersDelivery',
          label: 'Delivery & Cold Chain',
          description: 'Courier dispatch & OTP customer verification',
          icon: <Truck className="w-4 h-4 text-emerald-500" />,
        },
        {
          id: 'customerSupport',
          label: 'Customer Support & Complaints',
          description: 'Patient inquiries, delivery delay tickets & payment dispute resolution',
          icon: <Headphones className="w-4 h-4 text-blue-500" />,
          badge: 2,
          badgeColor: 'bg-blue-600 text-white font-bold',
        },
        {
          id: 'adminNotifications',
          label: 'Notification Center & Inbox',
          description: 'Multi-channel alerting, SMS dispatch & live audit logs across all 10 categories',
          icon: <Bell className="w-4 h-4 text-emerald-500" />,
          badge: '10 Cats',
          badgeColor: 'bg-emerald-600 text-white font-bold',
        },
        {
          id: 'financialAccounting',
          label: 'Financial Accounting & P&L',
          description: 'P&L statements, COGS, OpEx ledger, cash drawer & channel recon',
          icon: <Scale className="w-4 h-4 text-emerald-500" />,
          badge: 'P&L',
          badgeColor: 'bg-emerald-600 text-white font-bold',
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
      icon: <Boxes className="w-4 h-4 text-blue-400" />,
      items: [
        {
          id: 'inventory',
          label: 'Stock & Shelves',
          description: 'Multi-shelf tracking & barcode search',
          icon: <Package className="w-4 h-4" />,
        },
        {
          id: 'batchManagement',
          label: 'Batch Control & Recalls',
          description: '7-State batch lifecycle, PO/GRN traceability & NDA recalls',
          icon: <Boxes className="w-4 h-4 text-blue-500" />,
          badge: '7-State',
          badgeColor: 'bg-blue-600 text-white font-bold',
        },
        {
          id: 'stockReconciliation',
          label: 'Stocktake & Reconciliation',
          description: 'Physical count vs system variance, shrinkage & loss adjustments',
          icon: <ClipboardCheck className="w-4 h-4 text-purple-500" />,
          badge: 'Audit',
          badgeColor: 'bg-purple-600 text-white font-bold',
        },
        {
          id: 'returnsManagement',
          label: 'Medicine Returns & RTV',
          description: 'Customer & supplier returns, 4-path disposition & credit notes',
          icon: <RotateCcw className="w-4 h-4 text-teal-500" />,
          badge: '4-Path',
          badgeColor: 'bg-teal-600 text-white font-bold',
        },
        {
          id: 'procureToPay',
          label: 'Procure-to-Pay (P2P)',
          description: '9-Stage requisition, PO, GRN, batch reg, QC, 3-way match & settlement',
          icon: <Layers className="w-4 h-4 text-emerald-400" />,
          badge: '9-Stage',
          badgeColor: 'bg-emerald-600 text-white font-bold',
        },
        {
          id: 'storageAndTransfers',
          label: 'Storage Bins & Transfers',
          description: 'Store rooms, shelf/bin maps & inter-branch transfer gates',
          icon: <Boxes className="w-4 h-4 text-teal-400" />,
          badge: 'Topology',
          badgeColor: 'bg-teal-600 text-white font-bold',
        },
        {
          id: 'invoiceReconciliation',
          label: 'Invoice Reconciliation',
          description: '3-Way Matching: PO × GRN × Invoice with tolerance & disputes',
          icon: <Scale className="w-4 h-4 text-amber-400" />,
          badge: '3-Way',
          badgeColor: 'bg-amber-600 text-white font-bold',
        },
        {
          id: 'supplierManagement',
          label: 'Supplier Marketplace',
          description: 'Verified NDA wholesale distributors & RFQs',
          icon: <Building2 className="w-4 h-4 text-cyan-500" />,
        },
        {
          id: 'reordering',
          label: 'Automated Re-ordering',
          description: 'Stock depletion forecasts & supplier POs',
          icon: <RefreshCw className="w-4 h-4" />,
          badge: lowStockCount,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
        {
          id: 'stockForecasting',
          label: 'Low-Stock Forecasting & Holds',
          description: 'ADU burn rate, runout days, customer hold reservations & waitlists',
          icon: <TrendingDown className="w-4 h-4 text-cyan-400" />,
          badge: 'Velocity',
          badgeColor: 'bg-cyan-600 text-white font-bold',
        },
      ],
    },
    {
      id: 'owner_dashboard',
      label: 'Enterprise Owner',
      icon: <Building2 className="w-4 h-4 text-violet-500" />,
      items: [
        {
          id: 'ownerDashboard',
          label: 'Pharmacy Owner Hub',
          description: 'Multi-branch aggregated P&L & stock transfers',
          icon: <Building2 className="w-4 h-4 text-violet-500" />,
          badge: 'Executive',
          badgeColor: 'bg-violet-600 text-white',
        },
        {
          id: 'pharmacyServices',
          label: 'Service Catalogue & Care',
          description: 'Configure clinical screenings, vaccinations & delivery offerings',
          icon: <Stethoscope className="w-4 h-4 text-emerald-500" />,
          badge: 'Services',
          badgeColor: 'bg-emerald-600 text-white font-bold',
        },
      ],
    },
    {
      id: 'security',
      label: 'Security & Staff Roles',
      icon: <ShieldAlert className="w-4 h-4 text-blue-400" />,
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
        {
          id: 'backupDisasterRecovery',
          label: 'Backup & Disaster Recovery',
          description: 'RPO/RTO SLAs, WAL streaming, WORM vault & drills',
          icon: <ShieldAlert className="w-4 h-4" />,
          badge: 'DR / RTO',
          badgeColor: 'bg-indigo-600 text-white font-bold',
        },
        {
          id: 'securityHardening',
          label: 'Security & SIEM Radar',
          description: 'Mandatory MFA, 12+ char policy, auto-quarantine',
          icon: <Lock className="w-4 h-4" />,
          badge: 'MFA / 2FA',
          badgeColor: 'bg-rose-600 text-white font-bold',
        },
        {
          id: 'dataPrivacy',
          label: 'Data Privacy & PHI Governance',
          description: 'Patient consent, PHI access logs, 7-yr retention',
          icon: <Eye className="w-4 h-4" />,
          badge: 'PHI / GDPR',
          badgeColor: 'bg-teal-600 text-white font-bold',
        },
      ],
    },
  ];

  const categories = isAdminContext ? adminCategories : userCategories;

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-white dark:bg-[#0D1A2A] border-r border-slate-200/90 dark:border-slate-700/70 transition-all duration-300 flex flex-col justify-between select-none shadow-xs ${
        isOpen ? 'w-64 lg:w-72' : 'w-16'
      }`}
    >
      {/* Sidebar Header Title & Collapse Toggle */}
      <div className="p-3.5 border-b border-slate-200/90 dark:border-slate-700/70 bg-slate-50/60 dark:bg-[#0A1520]/80 flex items-center justify-between gap-2">
        {isOpen ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center p-1 shadow-xs shrink-0">
              <div className="grid grid-cols-2 gap-0.5 w-full h-full transform rotate-45 items-center justify-center">
                <div className="bg-white rounded-xs opacity-95"></div>
                <div className="bg-blue-200 rounded-xs"></div>
                <div className="bg-emerald-200 rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest leading-none text-emerald-700 dark:text-emerald-400">
                {isAdminContext ? 'ADMIN CONTROL PLANE' : 'ZENITHRX CLINICAL'}
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate mt-0.5">
                {isAdminContext ? 'System Administration' : 'Pharmacy Workstation'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center p-1 mx-auto shadow-xs">
            <div className="grid grid-cols-2 gap-0.5 w-full h-full transform rotate-45">
              <div className="bg-white rounded-xs opacity-95"></div>
              <div className="bg-blue-200 rounded-xs"></div>
              <div className="bg-emerald-200 rounded-xs"></div>
              <div className="bg-white rounded-xs"></div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar Navigation Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        
        {/* Admin / Operational Context Switcher */}
        {isAdminContext ? (
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 shadow-xs"
              title="Switch to Pharmacy Counter / Clinical Operations"
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0 text-blue-600" />
              {isOpen && <span className="truncate">← Pharmacy Operations</span>}
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-l-4 border-blue-600 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
              title="Platform Overview Landing Page"
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0 text-blue-600" />
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
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 shadow-xs'
                  : 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-200'
              }`}
              title="Send Feedback & Inquiries to System Admin"
            >
              <MessageSquarePlus className="w-4.5 h-4.5 shrink-0 text-emerald-600" />
              {isOpen && <span className="truncate">Send Feedback to Admin</span>}
            </button>

            {/* Switch to Admin Control Plane if user is Super Admin */}
            {user?.isSuperAdmin && (
              <button
                onClick={() => setActiveTab('adminControlPlane')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-xs"
                title="Open System Administrator Control Plane"
              >
                <Shield className="w-4.5 h-4.5 shrink-0 text-amber-600" />
                {isOpen && <span className="truncate">Admin Control Plane</span>}
              </button>
            )}
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
                  className="w-full px-2 py-1.5 flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {cat.icon}
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCatExpanded ? '' : '-rotate-90'}`} />
                  </div>
                </button>
              ) : (
                <div className="h-0.5 bg-slate-200 dark:bg-slate-700 my-2" title={cat.label} />
              )}

              {/* Category Sub-items */}
              {(isCatExpanded || !isOpen) && (
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const access = canUserAccessTab(user, item.id);
                    const isLocked = !access.allowed;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-3 transition-all cursor-pointer relative group ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 font-bold border-l-4 border-emerald-600 dark:border-emerald-500 shadow-xs'
                            : isLocked
                            ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 opacity-75'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-700/60 hover:text-slate-950 dark:hover:text-slate-100 font-medium'
                        }`}
                        title={
                          isLocked
                            ? `Restricted (PoLP): ${access.reason}`
                            : `${item.label} — ${item.description}`
                        }
                      >
                        <span
                          className={`shrink-0 ${
                            isActive
                              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                              : isLocked
                              ? 'text-slate-400 dark:text-slate-600'
                              : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                          }`}
                        >
                          {item.icon}
                        </span>

                        {isOpen && (
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                            <span className="truncate">{item.label}</span>
                            {isLocked ? (
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                                <Lock className="w-3 h-3" />
                              </span>
                            ) : (
                              item.badge !== undefined && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                    item.badgeColor || 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-700/70 bg-slate-50/90 dark:bg-[#0A1520]/90 text-[11px] text-slate-600 dark:text-slate-400 space-y-2">
        {user && onSignOut && (
          <button
            onClick={onSignOut}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-xs ${
              !isOpen ? 'justify-center px-2' : ''
            }`}
            title={`Log Out (${user.email})`}
          >
            <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
            {isOpen && <span className="truncate">Log Out ({user.fullName.split(' ')[0]})</span>}
          </button>
        )}
        {isOpen && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isAdminContext ? 'System Admin Mode' : 'ZenithRx Clinical Engine'}</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-500">
              {isAdminContext ? 'Least Privilege Enforced' : 'Clinical Safe • Fast Dispense'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
