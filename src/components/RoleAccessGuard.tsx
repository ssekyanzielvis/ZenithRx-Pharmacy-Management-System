import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Building2,
  MessageSquarePlus,
} from 'lucide-react';
import { AuthUser } from '../hooks/useAuth';
import { ModuleTab } from '../types';
import { canUserAccessTab, getRoleBadgeStyle } from '../lib/rolePermissions';
import { logAuditEvent } from '../repositories/auditRepository';

interface RoleAccessGuardProps {
  user: AuthUser | null | undefined;
  tab: ModuleTab;
  onNavigateTab: (tab: ModuleTab) => void;
  children: React.ReactNode;
}

export const RoleAccessGuard: React.FC<RoleAccessGuardProps> = ({
  user,
  tab,
  onNavigateTab,
  children,
}) => {
  const checkResult = canUserAccessTab(user, tab);
  const [hasLoggedAudit, setHasLoggedAudit] = useState(false);

  useEffect(() => {
    if (!checkResult.allowed && user && !hasLoggedAudit) {
      setHasLoggedAudit(true);
      void logAuditEvent({
        tenantId: user.tenantId || '00000000-0000-0000-0000-000000000001',
        performedBy: user.id || 'unauthenticated',
        action: 'unauthorized_access_blocked',
        entityType: 'module_route',
        entityId: tab,
        newValue: {
          attemptedTab: tab,
          userEmail: user.email,
          userRole: user.rankRole,
          reason: checkResult.reason,
          requiredPermission: checkResult.requiredPermission,
        },
      });
    }
  }, [checkResult.allowed, user, tab, hasLoggedAudit, checkResult.reason, checkResult.requiredPermission]);

  if (checkResult.allowed) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-center shrink-0 shadow-inner">
            <Lock className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                PoLP Security Enforced
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Tab: /{tab}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Access Restricted: Principle of Least Privilege
            </h2>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-xl border ${getRoleBadgeStyle(user?.rankRole || '')}`}>
            Current Role: {user?.rankRole || 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Main explanation card */}
      <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-slate-800 dark:text-slate-200 space-y-3">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-rose-900 dark:text-rose-200">
              Why is this module locked?
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {checkResult.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Permission Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Active Permissions */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Your Current Assigned Privileges
            </h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Point of Sale Dispensing:</span>
              {user?.accessRights?.canAccessPOS ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Granted</span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Blocked</span>
              )}
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Prescription Processing:</span>
              {user?.accessRights?.canProcessPrescriptions ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Granted</span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Blocked</span>
              )}
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Inventory &amp; Stock Count:</span>
              {user?.accessRights?.canManageInventory ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Granted</span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Blocked</span>
              )}
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Financial Reports &amp; Margins:</span>
              {user?.accessRights?.canViewReports ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Granted</span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Blocked</span>
              )}
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Staff &amp; Credential Control:</span>
              {user?.accessRights?.canManageStaffAccounts ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Granted</span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Blocked</span>
              )}
            </div>
          </div>
        </div>

        {/* Roles Authorized to View This Module */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Roles Authorized For This Module
            </h3>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {checkResult.allowedRoles && checkResult.allowedRoles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {checkResult.allowedRoles.map((r) => (
                  <span key={r} className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-[11px]">
                    {r}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">Supervising Pharmacist clearance required.</p>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>NDA &amp; Clinical Compliance:</strong> ZenithRx enforces strict segregation of duties (SoD) to safeguard patient medical privacy and prevent unauthorized inventory or financial discrepancies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onNavigateTab('overview')}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Platform Overview</span>
        </button>

        <button
          onClick={() => onNavigateTab('feedback')}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Request Permission Elevation</span>
        </button>
      </div>
    </div>
  );
};
