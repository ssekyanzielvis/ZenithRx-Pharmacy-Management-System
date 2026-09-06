import { ClientSubscription, TierName } from '../types';

export interface PackageTierConfig {
  maxUsers: number;
  monthlyRate: number;
  allowedFeatures: ClientSubscription['allowedFeatures'];
}

const baseFeatures: ClientSubscription['allowedFeatures'] = {
  basicInventory: true,
  batchTracking: true,
  autoReordering: true,
  expiryAlerts: true,
  posBilling: true,
  salesAnalytics: true,
  insuranceClaims: true,
  aiCounseling: true,
  multiLocation: false,
  apiAccess: false,
};

export const getPackageTierConfig = (tier: TierName): PackageTierConfig => {
  switch (tier) {
    case 'Starter':
      return {
        maxUsers: 5,
        monthlyRate: 40000,
        allowedFeatures: {
          ...baseFeatures,
          batchTracking: false,
          autoReordering: false,
          salesAnalytics: false,
          insuranceClaims: false,
          aiCounseling: false,
        },
      };
    case 'Enterprise':
      return {
        maxUsers: 25,
        monthlyRate: 104000,
        allowedFeatures: {
          ...baseFeatures,
          multiLocation: true,
          apiAccess: true,
        },
      };
    case 'Professional':
    default:
      return {
        maxUsers: 15,
        monthlyRate: 72000,
        allowedFeatures: baseFeatures,
      };
  }
};

export const applyPackageTierToClient = (
  client: ClientSubscription,
  tier: TierName,
  promoApplied = false
): ClientSubscription => {
  const config = getPackageTierConfig(tier);

  return {
    ...client,
    packageTier: tier,
    customMaxUsers: config.maxUsers,
    monthlyUgxRate: promoApplied ? Math.round(config.monthlyRate * 0.8) : config.monthlyRate,
    allowedFeatures: config.allowedFeatures,
  };
};
