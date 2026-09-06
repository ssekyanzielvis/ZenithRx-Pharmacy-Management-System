/**
 * tenantRepository.ts — ZenithRx Tenant / Client Subscription Repository
 * Clean Architecture: Infrastructure Layer
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ClientSubscription } from '../types';
import { DbTenant } from '../lib/database.types';
import { INITIAL_CLIENT_SUBSCRIPTIONS } from '../data/mockData';

function dbToDomain(row: DbTenant): ClientSubscription {
  const allowedFeatures = row.allowed_features ?? {
    basic_inventory: true,
    batch_tracking: true,
    auto_reordering: true,
    expiry_alerts: true,
    pos_billing: true,
    sales_analytics: true,
    insurance_claims: true,
    ai_counseling: true,
    multi_location: false,
    api_access: false,
  };

  return {
    id:                   row.id,
    clientName:           row.name,
    location:             row.location,
    contactPhone:         row.contact_phone,
    contactEmail:         row.contact_email,
    packageTier:          row.package_tier as ClientSubscription['packageTier'],
    customMaxUsers:       row.max_users,
    monthlyUgxRate:       Number(row.monthly_ugx_rate),
    billingStatus:        row.billing_status === 'active' ? 'Active' : 'Pending Renewal',
    nextBillingDate:      row.next_billing_date ?? '',
    ndaLicenseNo:         row.nda_license_no ?? undefined,
    ndaVerified:          row.nda_verified,
    supervisingPharmacist: row.supervising_pharmacist ?? undefined,
    allowedFeatures: {
      basicInventory:    allowedFeatures.basic_inventory,
      batchTracking:     allowedFeatures.batch_tracking,
      autoReordering:    allowedFeatures.auto_reordering,
      expiryAlerts:      allowedFeatures.expiry_alerts,
      posBilling:        allowedFeatures.pos_billing,
      salesAnalytics:    allowedFeatures.sales_analytics,
      insuranceClaims:   allowedFeatures.insurance_claims,
      aiCounseling:      allowedFeatures.ai_counseling,
      multiLocation:     allowedFeatures.multi_location,
      apiAccess:         allowedFeatures.api_access,
    },
    users: [],
  };
}

export async function getAllTenants(): Promise<ClientSubscription[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_CLIENT_SUBSCRIPTIONS;
  }
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`[tenantRepository.getAll] ${error.message}`);
  return ((data as DbTenant[]) ?? []).map(dbToDomain);
}

export async function getTenantById(id: string): Promise<ClientSubscription | null> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_CLIENT_SUBSCRIPTIONS.find(t => t.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToDomain(data as DbTenant);
}

export async function updateTenantFeatures(
  id: string,
  features: ClientSubscription['allowedFeatures']
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await (supabase
    .from('tenants') as any)
    .update({
      allowed_features: {
        basic_inventory:  features.basicInventory,
        batch_tracking:   features.batchTracking,
        auto_reordering:  features.autoReordering,
        expiry_alerts:    features.expiryAlerts,
        pos_billing:      features.posBilling,
        sales_analytics:  features.salesAnalytics,
        insurance_claims: features.insuranceClaims,
        ai_counseling:    features.aiCounseling,
        multi_location:   features.multiLocation,
        api_access:       features.apiAccess,
      },
    })
    .eq('id', id);
  if (error) throw new Error(`[tenantRepository.updateFeatures] ${error.message}`);
}
