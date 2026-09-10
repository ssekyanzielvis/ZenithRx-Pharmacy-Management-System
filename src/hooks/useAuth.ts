/**
 * useAuth.ts — ZenithRx Authentication Application Hook
 * Manages Supabase session, user profile, role, and tenant context.
 * Clean Architecture: Application Layer
 */

import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SubscriptionStatus, BillingCycle } from '../types';

export interface AuthUser {
  id:          string;
  email:       string;
  fullName:    string;
  phone:       string;
  rankRole:    string;
  tenantId:    string;
  tenantName:  string;
  accessRights: {
    canAccessPOS:              boolean;
    canManageInventory:        boolean;
    canProcessPrescriptions:   boolean;
    canApproveReorders:        boolean;
    canViewReports:            boolean;
    canSubmitInsurance:        boolean;
    canUseAiAssistant:         boolean;
    canManageStaffAccounts:    boolean;
  };
  isSuperAdmin: boolean;
  subscriptionStatus: SubscriptionStatus;
  billingCycle: BillingCycle | null;
  selectedTier: string | null;
}

export interface UseAuthReturn {
  session:    Session | null;
  user:       AuthUser | null;
  loading:    boolean;
  error:      string | null;
  isConfigured: boolean;
  signIn:     (email: string, password: string) => Promise<void>;
  signUp:     (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut:    () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  activateSubscription: (tier: string, cycle: BillingCycle) => void;
  clearError: () => void;
}

/** Demo user — used when Supabase is not configured */
const DEMO_USER: AuthUser = {
  id:         'demo-user-001',
  email:      'pharmacist@zenithrx.ug',
  fullName:   'Jane Nakato (Demo Mode)',
  phone:      '+256700000001',
  rankRole:   'Supervising Pharmacist',
  tenantId:   '00000000-0000-0000-0000-000000000001',
  tenantName: 'ZenithRx Demo Pharmacy',
  accessRights: {
    canAccessPOS:            true,
    canManageInventory:      true,
    canProcessPrescriptions: true,
    canApproveReorders:      true,
    canViewReports:          true,
    canSubmitInsurance:      true,
    canUseAiAssistant:       true,
    canManageStaffAccounts:  true,
  },
  isSuperAdmin: false,
  subscriptionStatus: 'active',
  billingCycle: 'monthly',
  selectedTier: 'Professional',
};

export function useAuth(): UseAuthReturn {
  const [session,  setSession]  = useState<Session | null>(null);
  const [user,     setUser]     = useState<AuthUser | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  /** Fetch user profile + tenant info after authentication */
  const loadUserProfile = useCallback(async (supabaseUser: User) => {
    if (!supabase) return;
    try {
      // Fetch staff profile from users table
      const { data, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      const profile = data as any;

      if (profileErr || !profile) {
        // If no profile yet, use email as fallback
        setUser({
          id:           supabaseUser.id,
          email:        supabaseUser.email ?? '',
          fullName:     supabaseUser.email ?? 'Unknown User',
          phone:        '',
          rankRole:     'Supervising Pharmacist',
          tenantId:     '',
          tenantName:   '',
          accessRights: DEMO_USER.accessRights,
          isSuperAdmin: false,
          subscriptionStatus: 'none',
          billingCycle: null,
          selectedTier: null,
        });
        return;
      }

      const rights = (profile.access_rights ?? {}) as Record<string, boolean>;
      setUser({
        id:         profile.id,
        email:      supabaseUser.email ?? profile.email,
        fullName:   profile.full_name,
        phone:      profile.phone,
        rankRole:   profile.rank_role,
        tenantId:   profile.tenant_id,
        tenantName: '',
        accessRights: {
          canAccessPOS:            rights['can_access_pos']           ?? false,
          canManageInventory:      rights['can_manage_inventory']     ?? false,
          canProcessPrescriptions: rights['can_process_prescriptions']?? false,
          canApproveReorders:      rights['can_approve_reorders']     ?? false,
          canViewReports:          rights['can_view_reports']         ?? false,
          canSubmitInsurance:      rights['can_submit_insurance']     ?? false,
          canUseAiAssistant:       rights['can_use_ai_assistant']     ?? false,
          canManageStaffAccounts:  rights['can_manage_staff_accounts']?? false,
        },
        isSuperAdmin: Boolean(supabaseUser.app_metadata?.['is_super_admin']),
        subscriptionStatus: (profile.subscription_status as SubscriptionStatus) ?? 'none',
        billingCycle: (profile.billing_cycle as BillingCycle) ?? null,
        selectedTier: profile.selected_tier ?? null,
      });
    } catch (err) {
      console.error('[useAuth] loadUserProfile error:', err);
    }
  }, []);

  // ─── Bootstrap auth state ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo mode — auto-sign-in
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadUserProfile(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        if (s?.user) {
          await loadUserProfile(s.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo mode — any credentials work
      setUser(DEMO_USER);
      return;
    }
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(signInError.message);
      }
      throw signInError;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo mode — create a local user without a subscription
      setUser({
        ...DEMO_USER,
        id: `demo-${Date.now()}`,
        email,
        fullName,
        phone,
        subscriptionStatus: 'none',
        billingCycle: null,
        selectedTier: null,
      });
      return;
    }
    setError(null);
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      throw signUpError;
    }
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Magic link requires Supabase to be configured.');
      return;
    }
    const { error: mlError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (mlError) setError(mlError.message);
  }, []);

  const activateSubscription = useCallback((tier: string, cycle: BillingCycle) => {
    setUser(prev => prev ? {
      ...prev,
      subscriptionStatus: 'active' as SubscriptionStatus,
      billingCycle: cycle,
      selectedTier: tier,
    } : prev);
    // In production, this would persist to Supabase:
    // supabase?.from('users').update({ subscription_status: 'active', billing_cycle: cycle, selected_tier: tier }).eq('id', user?.id)
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    session,
    user,
    loading,
    error,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    sendMagicLink,
    activateSubscription,
    clearError,
  };
}
