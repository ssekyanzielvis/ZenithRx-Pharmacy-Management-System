/**
 * insuranceRepository.ts — ZenithRx Insurance Provider Repository
 * Clean Architecture: Infrastructure Layer
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InsuranceProvider } from '../types';
import { DbInsuranceProvider } from '../lib/database.types';
import { INITIAL_INSURANCE_PROVIDERS } from '../data/mockData';

function dbToDomain(row: DbInsuranceProvider): InsuranceProvider {
  const statusCapitalized = row.status === 'active' ? 'Active' : 'Under Review';
  return {
    id:                  row.id,
    providerName:        row.provider_name,
    code:                row.code,
    contactPhone:        row.contact_phone,
    coverageRatio:       Number(row.coverage_ratio),
    pendingClaimsCount:  row.pending_claims_count,
    totalClaimedAmount:  Number(row.total_claimed_amount),
    status:              statusCapitalized,
  };
}

export async function getAllInsuranceProviders(tenantId: string): Promise<InsuranceProvider[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_INSURANCE_PROVIDERS;
  }
  const { data, error } = await supabase
    .from('insurance_providers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('provider_name', { ascending: true });

  if (error) throw new Error(`[insuranceRepository.getAll] ${error.message}`);
  return ((data as DbInsuranceProvider[]) ?? []).map(dbToDomain);
}

export async function updateClaimStats(
  id: string,
  amountToAdd: number
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await (supabase.rpc as any)('increment_insurance_claim', {
    p_provider_id:  id,
    p_claim_amount: amountToAdd,
  });
  if (error) throw new Error(`[insuranceRepository.updateClaimStats] ${error.message}`);
}
