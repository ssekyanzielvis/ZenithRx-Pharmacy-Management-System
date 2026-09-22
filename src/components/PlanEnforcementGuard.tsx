import React, { useEffect } from 'react';
import { Lock, Sparkles, ShieldAlert, ArrowRight, PhoneCall, MessageSquare } from 'lucide-react';
import { TierName, ModuleTab } from '../types';
import { checkFeatureAccess, PlanFeatureKey, logEnforcementViolation } from '../services/planEnforcementService';

interface PlanEnforcementGuardProps {
  feature: PlanFeatureKey;
  currentTier?: TierName;
  billingStatus?: 'Active' | 'Pending Renewal' | 'Grace Period' | 'Suspended';
  tenantId?: string;
  tenantName?: string;
  userName?: string;
  onNavigateTab?: (tab: ModuleTab) => void;
  children: React.ReactNode;
}

export const PlanEnforcementGuard: React.FC<PlanEnforcementGuardProps> = ({
  feature,
  currentTier = 'Starter',
  billingStatus = 'Active',
  tenantId = 'client-1',
  tenantName = 'Pharmacy Branch',
  userName = 'Current User',
  onNavigateTab,
  children,
}) => {
  const tier = (currentTier as TierName) || 'Starter';
  const status = (billingStatus as 'Active' | 'Pending Renewal' | 'Grace Period' | 'Suspended') || 'Active';
  const result = checkFeatureAccess(feature, tier, status);

  useEffect(() => {
    if (!result.allowed) {
      logEnforcementViolation(
        tenantId,
        tenantName,
        `Access to ${result.featureRule?.label || feature}`,
        feature,
        result.requiredTier || 'Professional',
        tier,
        result.reason || 'Plan restriction enforced',
        'user-current',
        userName
      );
    }
  }, [result.allowed, feature, tier]);

  if (result.allowed) {
    return <>{children}</>;
  }

  const rule = result.featureRule;

  return (
    <div className="relative min-h-[480px] w-full flex items-center justify-center p-6">
      {/* Background blurred placeholder */}
      <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 pointer-events-none" />

      {/* Modern Locked Gate Card */}
      <div className="relative z-10 max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-2xl text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 mx-auto bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Sparkles className="w-3.5 h-3.5" />
            {result.requiredTier || 'Professional'} Tier Feature
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {rule?.label || 'Feature Gated by Plan'}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            {result.reason || `This capability is exclusively available on higher ZenithRx tiers.`}
          </p>
        </div>

        {/* Current Plan vs Required Plan Banner */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="text-left">
            <span className="text-slate-400 block text-[11px]">Current Plan:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{currentTier}</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400" />

          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Required Plan:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {result.requiredTier || 'Professional'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('adminPackages')}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> View Upgrade Options
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('feedback')}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" /> Message Administrator
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-400">
          Strict plan boundaries are enforced in accordance with statutory NDA governance & ZenithRx multi-tenant limits.
        </p>
      </div>
    </div>
  );
};
