import React from 'react';
import {
  ModuleTab,
  ClientSubscription,
} from '../types';
import { AuthUser } from '../hooks/useAuth';
import { canUserAccessTab, getRoleBadgeStyle } from '../lib/rolePermissions';
import {
  FileText,
  Package,
  AlertTriangle,
  Users,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  Smartphone,
  Sliders,
  CreditCard,
  UserCheck,
  Layers,
  Activity,
  Zap,
  Gift,
  Shield,
  Building2,
  UserCog,
  Lock,
  ChevronRight,
  Boxes,
  ShieldAlert,
  History,
  Pill,
  ShoppingBag,
  RotateCcw,
  Truck,
  HeartPulse,
  FileSpreadsheet,
  AlertOctagon,
  Scale,
  Headphones,
  TrendingUp,
  Eye,
  Scan,
  MessageSquarePlus,
  Radio,
  CheckCircle2,
} from 'lucide-react';

interface MainRoleDashboardProps {
  user?: AuthUser | null;
  activeClient: ClientSubscription;
  clients?: ClientSubscription[];
  onNavigateTab: (tab: ModuleTab) => void;
  lowStockCount: number;
  expiringCount: number;
  pendingRxCount: number;
  onOpenBarcodeScanner?: () => void;
  onOpenAiCounseling?: () => void;
  onOpenFeedbackModal?: () => void;
}

interface DashboardCardDef {
  id: ModuleTab;
  title: string;
  category: 'Administration' | 'Clinical' | 'Inventory' | 'Sales' | 'Finance' | 'Patient Care';
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor?: string;
  accentGradient: string;
}

export const MainRoleDashboard: React.FC<MainRoleDashboardProps> = ({
  user,
  activeClient,
  clients = [],
  onNavigateTab,
  lowStockCount,
  expiringCount,
  pendingRxCount,
  onOpenBarcodeScanner,
  onOpenAiCounseling,
  onOpenFeedbackModal,
}) => {
  const isSuperAdmin = user?.isSuperAdmin || user?.rankRole === 'Super Admin';

  // ─── All System Modules Catalog ─────────────────────────────────────────────
  const allCards: DashboardCardDef[] = [
    // ── SYSTEM ADMINISTRATION & GOVERNANCE ──
    {
      id: 'adminControlPlane',
      title: 'Superuser Control Plane',
      category: 'Administration',
      description: 'Dual-control 4-eyes queue, global compliance policies & security incident response.',
      icon: <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badge: '§11.17 Security',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      accentGradient: 'from-blue-600 to-indigo-700',
    },
    {
      id: 'adminMatrix',
      title: 'Tenant Feature Matrix',
      category: 'Administration',
      description: 'Toggle POS, Clinical AI, Expiry radar, and multi-shelf modules per pharmacy branch.',
      icon: <Sliders className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      badge: 'Feature Gates',
      badgeColor: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      accentGradient: 'from-cyan-600 to-blue-700',
    },
    {
      id: 'adminUsers',
      title: 'Branch Staff Accounts',
      category: 'Administration',
      description: 'Manage user seats, role ranks, credentials, and granular permission rights.',
      icon: <UserCog className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badge: `${activeClient.users?.length || 0} Staff`,
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      accentGradient: 'from-indigo-600 to-purple-700',
    },
    {
      id: 'adminBilling',
      title: 'Package & Billing Control',
      category: 'Administration',
      description: 'Configure UGX subscription rates, package tier offerings, and discount coupons.',
      icon: <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: 'SaaS Quotas',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      accentGradient: 'from-amber-600 to-orange-700',
    },
    {
      id: 'adminRegister',
      title: 'Register Pharmacy Tenant',
      category: 'Administration',
      description: 'Onboard new pharmacy client branches linked to official Uganda NDA license records.',
      icon: <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: 'NDA Registry',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      accentGradient: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'adminPharmacyRegistry',
      title: 'Subscribed Pharmacies',
      category: 'Administration',
      description: 'Exclusive super admin registry, NDA compliance status, and quick direct phone dispatch.',
      icon: <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      badge: `${clients.length || 1} Subscribed`,
      badgeColor: 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      accentGradient: 'from-teal-600 to-emerald-700',
    },
    {
      id: 'adminCapacity',
      title: 'System Capacity & Upgrades',
      category: 'Administration',
      description: 'Real-time usage rankings, advance warning thresholds & 4-channel upgrade dispatch.',
      icon: <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: 'Telemetry',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      accentGradient: 'from-amber-600 to-yellow-700',
    },
    {
      id: 'adminMessagingHub',
      title: 'Multi-Tenant Messaging Hub',
      category: 'Administration',
      description: 'Multi-channel broadcasts, email dispatch, SMS notifications, and delivery telemetry.',
      icon: <Headphones className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      badge: 'Omni-Channel',
      badgeColor: 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      accentGradient: 'from-sky-600 to-blue-700',
    },
    {
      id: 'adminRevenueLedger',
      title: 'Revenue & SaaS Ledger',
      category: 'Administration',
      description: 'Double-entry bookkeeping, 18% URA VAT allocation & 100% system-mediated payment enforcement.',
      icon: <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Accounting',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      accentGradient: 'from-emerald-600 to-cyan-700',
    },
    {
      id: 'adminQuantumWorkbench',
      title: 'Quantum Systems Workbench',
      category: 'Administration',
      description: 'Multi-tenant runtime telemetry, DB schema diagnostics, and zero-trust governance.',
      icon: <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      badge: 'Systems Core',
      badgeColor: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      accentGradient: 'from-cyan-600 to-indigo-700',
    },
    {
      id: 'securityHardening',
      title: 'Security & SIEM Radar',
      category: 'Administration',
      description: 'Mandatory MFA enforcement, password policy, quarantine & live threat defense.',
      icon: <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      badge: 'MFA / 2FA',
      badgeColor: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      accentGradient: 'from-rose-600 to-red-700',
    },
    {
      id: 'backupDisasterRecovery',
      title: 'Backup & Disaster Recovery',
      category: 'Administration',
      description: 'Automated encrypted Cloudflare R2 snapshots, zero-data loss RPO, point-in-time restore.',
      icon: <ShieldAlert className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      badge: 'DR / RTO',
      badgeColor: 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      accentGradient: 'from-violet-600 to-indigo-700',
    },
    {
      id: 'dataPrivacy',
      title: 'Data Privacy & PHI Governance',
      category: 'Administration',
      description: 'Patient consent lifecycle, PHI audit logs, right-to-be-forgotten & NDA 7-year retention.',
      icon: <Eye className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      badge: 'PHI / GDPR',
      badgeColor: 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      accentGradient: 'from-teal-600 to-emerald-700',
    },
    {
      id: 'audit',
      title: 'System Audit Logs',
      category: 'Administration',
      description: 'Immutable regulatory audit trail recording every transaction, login, and prescription event.',
      icon: <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />,
      badge: 'NDA Cap 206',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      accentGradient: 'from-slate-700 to-slate-900',
    },

    // ── CLINICAL & DISPENSING ──
    {
      id: 'prescriptions',
      title: 'Prescriptions & Clinical Dispensing',
      category: 'Clinical',
      description: 'Clinical safety verification, dosage checking, FEFO batch selection, and label printing.',
      icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: pendingRxCount > 0 ? `${pendingRxCount} Pending` : 'Clinical Queue',
      badgeColor: pendingRxCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accentGradient: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'dispensingRegister',
      title: 'NDA Dispensing Register',
      category: 'Clinical',
      description: 'Official statutory prescription book, prescriber register, and Class A/B controlled ledger.',
      icon: <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      badge: 'Statutory Book',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      accentGradient: 'from-teal-600 to-cyan-700',
    },
    {
      id: 'prescriptionSubstitutions',
      title: 'Prescription Generic Substitutions',
      category: 'Clinical',
      description: 'Bioequivalent generic recommendations, cost comparison & prescriber-approved switch ledger.',
      icon: <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badge: 'Bioequivalent',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      accentGradient: 'from-blue-600 to-indigo-700',
    },
    {
      id: 'pharmacistInterventions',
      title: 'Pharmacist Clinical Interventions',
      category: 'Clinical',
      description: 'Document drug interactions, contraindications, dosage adjustments & doctor consultations.',
      icon: <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: 'Interventions',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      accentGradient: 'from-amber-600 to-orange-700',
    },
    {
      id: 'adrReporting',
      title: 'ADR & Pharmacovigilance Hub',
      category: 'Clinical',
      description: 'Adverse Drug Reaction clinical intake, WHO-UMC causality grading & NDA Cap 206 dispatch.',
      icon: <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      badge: 'Yellow Form',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      accentGradient: 'from-rose-600 to-red-700',
    },

    // ── RETAIL & POINT OF SALE ──
    {
      id: 'pos',
      title: 'Point of Sale (POS)',
      category: 'Sales',
      description: 'High-speed retail checkout, thermal 80mm receipts, Cash, Mobile Money & split payments.',
      icon: <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Retail Terminal',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      accentGradient: 'from-emerald-600 to-green-700',
    },
    {
      id: 'onlineOrders',
      title: 'Patient Online Orders Queue',
      category: 'Sales',
      description: 'Real-time patient web portal orders, prescription verification, packaging & boda dispatch.',
      icon: <ShoppingBag className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      badge: 'E-Commerce',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      accentGradient: 'from-sky-600 to-blue-700',
    },
    {
      id: 'customers',
      title: 'Customer Profiles & History',
      category: 'Patient Care',
      description: 'Patient directory, chronic medication profiles, allergy alerts & purchase statements.',
      icon: <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      badge: 'CRM',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      accentGradient: 'from-purple-600 to-pink-700',
    },

    // ── INVENTORY & SUPPLY CHAIN ──
    {
      id: 'inventory',
      title: 'Stock Inventory & Catalog',
      category: 'Inventory',
      description: 'Real-time drug balance, multi-tier pricing, shelf locations, barcodes & safety stock alerts.',
      icon: <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badge: lowStockCount > 0 ? `${lowStockCount} Low Stock` : 'Stock Live',
      badgeColor: lowStockCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' : 'bg-blue-100 text-blue-800 border-blue-200',
      accentGradient: 'from-blue-600 to-sky-700',
    },
    {
      id: 'batchManagement',
      title: 'Batch Management & FEFO',
      category: 'Inventory',
      description: 'Granular batch tracking, expiry date monitors, lot numbers & temperature storage logs.',
      icon: <Boxes className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badge: 'FEFO / Lots',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      accentGradient: 'from-indigo-600 to-blue-700',
    },
    {
      id: 'expiry',
      title: 'Expiry Alert Radar',
      category: 'Inventory',
      description: '30, 60, 90-day expiry threshold alerts, loss prevention and discount promotional staging.',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: expiringCount > 0 ? `${expiringCount} Expiring` : 'Expiry Safe',
      badgeColor: expiringCount > 0 ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' : 'bg-emerald-100 text-emerald-800 border-emerald-200',
      accentGradient: 'from-amber-600 to-rose-700',
    },
    {
      id: 'reordering',
      title: 'Automated Stock Reordering',
      category: 'Inventory',
      description: 'AI reorder forecasting, automated purchase order generation & supplier catalog matching.',
      icon: <RefreshCw className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      badge: 'Smart Reorder',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      accentGradient: 'from-cyan-600 to-teal-700',
    },
    {
      id: 'stockReconciliation',
      title: 'Stock Reconciliation & Take',
      category: 'Inventory',
      description: 'Physical count vs system balance reconciliation, variance analysis & adjustment approval.',
      icon: <Scale className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      badge: 'Stocktake',
      badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
      accentGradient: 'from-violet-600 to-purple-700',
    },
    {
      id: 'returnsManagement',
      title: 'Returns Management Console',
      category: 'Inventory',
      description: 'Patient returns, supplier returns, credit note generation & inspection quarantine.',
      icon: <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      badge: 'RMA / Returns',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      accentGradient: 'from-rose-600 to-pink-700',
    },
    {
      id: 'medicineRecall',
      title: 'Medicine Recall & Quarantine',
      category: 'Inventory',
      description: 'NDA / Manufacturer batch recall broadcast, instant stock freeze & customer notification.',
      icon: <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />,
      badge: 'Recall Protocol',
      badgeColor: 'bg-red-100 text-red-800 border-red-200 font-bold',
      accentGradient: 'from-red-600 to-rose-800',
    },
    {
      id: 'storageAndTransfers',
      title: 'Storage & Stock Transfers',
      category: 'Inventory',
      description: 'Warehouse bin allocation, temperature zone mapping & inter-branch stock dispatch.',
      icon: <Boxes className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Transfers',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      accentGradient: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'supplierManagement',
      title: 'Supplier & Vendor Directory',
      category: 'Inventory',
      description: 'NDA-licensed wholesale distributors, payment terms, delivery SLAs & lead-time analytics.',
      icon: <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badge: 'Vendors',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      accentGradient: 'from-indigo-600 to-blue-700',
    },

    // ── FINANCE, ACCOUNTING & CLAIMS ──
    {
      id: 'procureToPay',
      title: 'Procure-to-Pay (P2P)',
      category: 'Finance',
      description: 'End-to-end procurement: Purchase Requisitions, Supplier POs, GRN & 3-Way invoice match.',
      icon: <FileSpreadsheet className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      badge: '3-Way Match',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      accentGradient: 'from-purple-600 to-indigo-700',
    },
    {
      id: 'invoiceReconciliation',
      title: 'Invoice 3-Way Reconciliation',
      category: 'Finance',
      description: 'Match PO vs Delivery Note vs Supplier Invoice, detect variance and approve payment voucher.',
      icon: <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badge: 'Matching',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      accentGradient: 'from-indigo-600 to-cyan-700',
    },
    {
      id: 'financialAccounting',
      title: 'Financial Accounting & P&L',
      category: 'Finance',
      description: 'Chart of accounts, general ledger, daily cash-up audit & real-time Profit & Loss statement.',
      icon: <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: 'P&L / Ledger',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold',
      accentGradient: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'reports',
      title: 'Sales & Revenue Analytics',
      category: 'Finance',
      description: 'Daily gross sales, category breakdown, cashier shift summaries, margins & tax reports.',
      icon: <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      badge: 'Analytics',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      accentGradient: 'from-teal-600 to-emerald-700',
    },
    {
      id: 'insurance',
      title: 'Insurance Schemes & Claims',
      category: 'Finance',
      description: 'Health insurance providers (UAP, Jubilee, Prudential, AAR), pre-auth & claims reconciliation.',
      icon: <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badge: 'HMO Claims',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      accentGradient: 'from-blue-600 to-indigo-700',
    },

    // ── PATIENT CARE & ADVANCED OPERATIONS ──
    {
      id: 'adminConsultation',
      title: 'Teleconsultation & Video Hub',
      category: 'Patient Care',
      description: 'Encrypted pharmacist-to-patient video calls, clinical note taking & digital prescriptions.',
      icon: <Headphones className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      badge: 'Telehealth',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      accentGradient: 'from-sky-600 to-blue-700',
    },
    {
      id: 'adminAdherenceRefill',
      title: 'Adherence & Chronic Refills',
      category: 'Patient Care',
      description: 'Automated SMS / WhatsApp reminders for chronic medication refills & adherence scoring.',
      icon: <HeartPulse className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      badge: 'Chronic Care',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      accentGradient: 'from-rose-600 to-red-700',
    },
    {
      id: 'adminOrdersDelivery',
      title: 'Delivery & Logistics Hub',
      category: 'Patient Care',
      description: 'Boda rider dispatch, delivery routing, proof of delivery & cold-chain transport tracking.',
      icon: <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: 'Dispatch',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      accentGradient: 'from-amber-600 to-orange-700',
    },
    {
      id: 'collaborators',
      title: 'Pharmacy Staff & Collaborators',
      category: 'Administration',
      description: 'Branch staff access management, cashier shifts, pharmacist licenses & attendance ledger.',
      icon: <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badge: 'Staff Roster',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      accentGradient: 'from-indigo-600 to-purple-700',
    },
    {
      id: 'ownerDashboard',
      title: 'Pharmacy Owner Executive Cockpit',
      category: 'Administration',
      description: 'High-level multi-branch sales, cash flow, stock health & margin optimization metrics.',
      icon: <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      badge: 'Executive',
      badgeColor: 'bg-violet-100 text-violet-800 border-violet-200 font-bold',
      accentGradient: 'from-violet-600 to-purple-800',
    },
  ];

  // ─── Filter cards STRICTLY by role permissions ──────────────────────────────
  const authorizedCards = allCards.filter((card) => {
    const access = canUserAccessTab(user, card.id);
    return access.allowed;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* ─── 1. Welcome & Domain Dashboard Header ─── */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-[#0B1E36] dark:via-[#102C50] dark:to-[#0D223E] rounded-3xl p-6 text-slate-900 dark:text-white shadow-xs dark:shadow-xl border border-slate-200 dark:border-[#1E3B63] relative overflow-hidden transition-colors duration-200">
        <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-10 pointer-events-none">
          <Shield className="w-80 h-80 text-cyan-600 dark:text-cyan-300" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {isSuperAdmin ? 'QUANTUM NETWORKS GOVERNANCE DASHBOARD' : `${activeClient.clientName} WORKSTATION`}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadgeStyle(user?.rankRole || 'Staff')}`}>
                {user?.rankRole || 'Authorized User'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {isSuperAdmin
                ? 'Platform Governance & Systems Cockpit'
                : `Welcome, ${user?.fullName || 'Pharmacy Team'}`}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {isSuperAdmin
                ? 'Centralized multi-tenant control suite to manage system security, subscription quotas, and NDA Cap 206 regulatory compliance.'
                : `Logged in under Principle of Least Privilege. Select an authorized module card below to enter your operational workspace.`}
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenBarcodeScanner && (
              <button
                onClick={onOpenBarcodeScanner}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-white/10 shadow-xs"
                title="Scan medicine barcode"
              >
                <Scan className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Barcode Scanner</span>
              </button>
            )}

            {onOpenAiCounseling && (
              <button
                onClick={onOpenAiCounseling}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30"
                title="Launch Gemini AI Counseling Assistant"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>AI Clinical Copilot</span>
              </button>
            )}

            {onOpenFeedbackModal && (
              <button
                onClick={onOpenFeedbackModal}
                className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800 shadow-xs"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Feedback & Inquiries</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Key Operational / Governance Metrics ─── */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isSuperAdmin ? (
            <>
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-sky-200">Subscribed Pharmacies</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{clients.length || 1} Clients</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Active User Seats</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {clients.reduce((acc, c) => acc + (c.users?.length || 0), 0) || 5} Users
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-300">Security Clearance</p>
                <p className="text-xl font-black text-cyan-700 dark:text-cyan-300 mt-0.5">Ring 0 Root</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-violet-700 dark:text-violet-300">Authorized Modules</p>
                <p className="text-xl font-black text-violet-700 dark:text-violet-300 mt-0.5">{authorizedCards.length} Modules</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-sky-200">Active Branch</p>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5 truncate">{activeClient.clientName}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Low Stock Items</p>
                <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">{lowStockCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">Expiring Items</p>
                <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">{expiringCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/10 rounded-2xl p-3 border border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Pending Rx Queue</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{pendingRxCount}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── 2. Role-Authorized Module Cards Grid ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Authorized System Modules & Workspaces</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {authorizedCards.length} Available
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access is strictly governed by your assigned role: <span className="font-bold text-slate-700 dark:text-slate-300">{user?.rankRole || 'User'}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {authorizedCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onNavigateTab(card.id)}
              className="group text-left p-5 rounded-2xl bg-white dark:bg-[#0D1A2A] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              {/* Top Accent Gradient Bar on Hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3">
                {/* Header row: Icon & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shadow-xs">
                    {card.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                    {card.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Bottom CTA Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Open Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  {card.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
