/**
 * customerRepository.ts — ZenithRx Customer/Patient Profile Repository
 * Clean Architecture: Infrastructure Layer
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CustomerProfile } from '../types';
import { DbCustomer } from '../lib/database.types';
import { INITIAL_CUSTOMERS } from '../data/mockData';

function dbToDomain(row: DbCustomer): CustomerProfile {
  const genderCapitalized =
    row.gender === 'male' ? 'Male' : row.gender === 'female' ? 'Female' : 'Male';

  return {
    id:                       row.id,
    name:                     row.name,
    phone:                    row.phone,
    email:                    row.email ?? '',
    age:                      row.age ?? 0,
    gender:                   genderCapitalized,
    bloodGroup:               row.blood_group ?? 'O+',
    allergies:                row.allergies ?? [],
    chronicConditions:        row.chronic_conditions ?? [],
    activePrescriptionsCount: 0,
    totalPurchasesCount:      0,
    totalAmountSpent:         Number(row.total_purchases_ugx ?? 0),
    lastVisit:                row.last_visit ?? new Date().toISOString().split('T')[0],
    insuranceProvider:        row.insurance_provider ?? undefined,
    policyNumber:             row.policy_number ?? undefined,
  };
}

export async function getAllCustomers(tenantId: string): Promise<CustomerProfile[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_CUSTOMERS;
  }
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (error) throw new Error(`[customerRepository.getAll] ${error.message}`);
  return ((data as DbCustomer[]) ?? []).map(dbToDomain);
}

export async function searchCustomers(tenantId: string, query: string): Promise<CustomerProfile[]> {
  if (!isSupabaseConfigured || !supabase) {
    const q = query.toLowerCase();
    return INITIAL_CUSTOMERS.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);

  if (error) throw new Error(`[customerRepository.search] ${error.message}`);
  return ((data as DbCustomer[]) ?? []).map(dbToDomain);
}

export async function upsertCustomer(
  customer: Omit<CustomerProfile, 'id'>,
  tenantId: string
): Promise<CustomerProfile> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');
  const genderLower = (customer.gender?.toLowerCase() === 'female' ? 'female' : 'male') as 'male' | 'female';

  const { data, error } = await (supabase
    .from('customers') as any)
    .insert({
      tenant_id:            tenantId,
      name:                 customer.name,
      phone:                customer.phone,
      email:                customer.email || null,
      age:                  customer.age,
      gender:               genderLower,
      blood_group:          customer.bloodGroup || null,
      allergies:            customer.allergies ?? [],
      chronic_conditions:   customer.chronicConditions ?? [],
      loyalty_points:       0,
      total_purchases_ugx:  customer.totalAmountSpent ?? 0,
      insurance_provider:   customer.insuranceProvider || null,
      policy_number:        customer.policyNumber || null,
    })
    .select()
    .single();

  if (error) throw new Error(`[customerRepository.upsert] ${error.message}`);
  return dbToDomain(data as DbCustomer);
}

export async function updateLoyaltyPoints(
  id: string,
  points: number,
  totalPurchasesIncrease: number
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await (supabase.rpc as any)('increment_loyalty_points', {
    p_customer_id:           id,
    p_points:                points,
    p_purchase_amount:       totalPurchasesIncrease,
  });
  if (error) throw new Error(`[customerRepository.updateLoyalty] ${error.message}`);
}
