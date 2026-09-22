import { TenantCapacityMetrics, CapacityAlert, TierName, NotificationChannel } from '../types';
import { logSecurityAudit } from './auditLogger';

const STORAGE_KEY_CAPACITY = 'zenithrx_tenant_capacity';
const STORAGE_KEY_ALERTS = 'zenithrx_capacity_alerts';

// Standard tier capacity limits
export const TIER_LIMITS: Record<TierName, { staff: number; drugs: number; prescriptions: number; transactions: number; storageMb: number }> = {
  'Starter': { staff: 5, drugs: 500, prescriptions: 1000, transactions: 2000, storageMb: 1024 },
  'Professional': { staff: 15, drugs: 2500, prescriptions: 5000, transactions: 10000, storageMb: 5120 },
  'Enterprise': { staff: 50, drugs: 10000, prescriptions: 25000, transactions: 50000, storageMb: 25600 },
  'Custom Tailored': { staff: 200, drugs: 50000, prescriptions: 100000, transactions: 200000, storageMb: 102400 },
};

// Seed realistic tenant capacity data
const SEED_CAPACITY: Record<string, Partial<TenantCapacityMetrics>> = {
  'client-1': {
    tenantId: 'client-1',
    tenantName: 'Nakasero Pharmacy Branch',
    currentTier: 'Professional',
    staffCount: 13,
    drugsCount: 2340,
    prescriptionsCount: 4620,
    transactionsCount: 8900,
    storageMb: 4200,
  },
  'client-2': {
    tenantId: 'client-2',
    tenantName: 'Ecopharm Kampala Ltd',
    currentTier: 'Starter',
    staffCount: 5,
    drugsCount: 485,
    prescriptionsCount: 960,
    transactionsCount: 1950,
    storageMb: 980,
  },
  'client-3': {
    tenantId: 'client-3',
    tenantName: 'Mbarara City Pharmacy',
    currentTier: 'Starter',
    staffCount: 3,
    drugsCount: 310,
    prescriptionsCount: 450,
    transactionsCount: 1100,
    storageMb: 450,
  },
  'client-4': {
    tenantId: 'client-4',
    tenantName: 'Gulu Regional Pharmacy',
    currentTier: 'Enterprise',
    staffCount: 22,
    drugsCount: 4500,
    prescriptionsCount: 11200,
    transactionsCount: 21000,
    storageMb: 11500,
  },
  'client-5': {
    tenantId: 'client-5',
    tenantName: 'Jinja Apex Dispensary',
    currentTier: 'Starter',
    staffCount: 4,
    drugsCount: 410,
    prescriptionsCount: 880,
    transactionsCount: 1720,
    storageMb: 850,
  }
};

const getStoredCapacity = (): Record<string, TenantCapacityMetrics> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAPACITY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading capacity store:', err);
  }
  
  // Calculate initial metrics from seed
  const initial: Record<string, TenantCapacityMetrics> = {};
  for (const [id, data] of Object.entries(SEED_CAPACITY)) {
    initial[id] = calculateMetrics(id, data.tenantName || 'Pharmacy', data.currentTier || 'Starter', data);
  }
  saveCapacityToStorage(initial);
  return initial;
};

const saveCapacityToStorage = (data: Record<string, TenantCapacityMetrics>) => {
  try {
    localStorage.setItem(STORAGE_KEY_CAPACITY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving capacity store:', err);
  }
};

const getStoredAlerts = (): CapacityAlert[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading capacity alerts:', err);
  }
  return [];
};

const saveAlertsToStorage = (alerts: CapacityAlert[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
  } catch (err) {
    console.error('Error saving capacity alerts:', err);
  }
};

function calculateMetrics(
  tenantId: string,
  tenantName: string,
  currentTier: TierName,
  counts: { staffCount?: number; drugsCount?: number; prescriptionsCount?: number; transactionsCount?: number; storageMb?: number }
): TenantCapacityMetrics {
  const limits = TIER_LIMITS[currentTier] || TIER_LIMITS['Starter'];
  const staff = counts.staffCount ?? 1;
  const drugs = counts.drugsCount ?? 50;
  const prescriptions = counts.prescriptionsCount ?? 100;
  const transactions = counts.transactionsCount ?? 200;
  const storageMb = counts.storageMb ?? 100;

  const staffUsagePercent = Number(((staff / limits.staff) * 100).toFixed(1));
  const drugsUsagePercent = Number(((drugs / limits.drugs) * 100).toFixed(1));
  const prescriptionsUsagePercent = Number(((prescriptions / limits.prescriptions) * 100).toFixed(1));
  const transactionsUsagePercent = Number(((transactions / limits.transactions) * 100).toFixed(1));
  const storageUsagePercent = Number(((storageMb / limits.storageMb) * 100).toFixed(1));

  const overallUsagePercent = Number(
    ((staffUsagePercent + drugsUsagePercent + prescriptionsUsagePercent + transactionsUsagePercent + storageUsagePercent) / 5).toFixed(1)
  );

  let recommendedTier: TierName | undefined = undefined;
  if (overallUsagePercent >= 80 || staffUsagePercent >= 90 || drugsUsagePercent >= 90 || prescriptionsUsagePercent >= 90) {
    if (currentTier === 'Starter') recommendedTier = 'Professional';
    else if (currentTier === 'Professional') recommendedTier = 'Enterprise';
    else if (currentTier === 'Enterprise') recommendedTier = 'Custom Tailored';
  }

  return {
    tenantId,
    tenantName,
    currentTier,
    recommendedTier,
    staffCount: staff,
    staffLimit: limits.staff,
    drugsCount: drugs,
    drugsLimit: limits.drugs,
    prescriptionsCount: prescriptions,
    prescriptionsLimit: limits.prescriptions,
    transactionsCount: transactions,
    transactionsLimit: limits.transactions,
    storageMb,
    storageLimitMb: limits.storageMb,
    staffUsagePercent,
    drugsUsagePercent,
    prescriptionsUsagePercent,
    transactionsUsagePercent,
    storageUsagePercent,
    overallUsagePercent,
    recordedAt: new Date().toISOString(),
  };
}

export const computeTenantCapacity = (
  tenantId: string,
  tenantName: string = 'Nakasero Pharmacy Branch',
  currentTier: TierName = 'Starter',
  currentCounts?: { staffCount?: number; drugsCount?: number; prescriptionsCount?: number; transactionsCount?: number; storageMb?: number }
): TenantCapacityMetrics => {
  const store = getStoredCapacity();
  const existing = store[tenantId];
  
  const mergedCounts = {
    staffCount: currentCounts?.staffCount ?? existing?.staffCount,
    drugsCount: currentCounts?.drugsCount ?? existing?.drugsCount,
    prescriptionsCount: currentCounts?.prescriptionsCount ?? existing?.prescriptionsCount,
    transactionsCount: currentCounts?.transactionsCount ?? existing?.transactionsCount,
    storageMb: currentCounts?.storageMb ?? existing?.storageMb,
  };

  const metrics = calculateMetrics(tenantId, tenantName, currentTier, mergedCounts);
  store[tenantId] = metrics;
  saveCapacityToStorage(store);

  // Check alerts
  evaluateCapacityAlerts(metrics);

  return metrics;
};

export const getAllTenantsCapacity = (): TenantCapacityMetrics[] => {
  const store = getStoredCapacity();
  return Object.values(store);
};

export const evaluateCapacityAlerts = (metrics: TenantCapacityMetrics): CapacityAlert[] => {
  const alerts = getStoredAlerts();
  const newAlerts: CapacityAlert[] = [];

  const checkMetric = (
    metricName: 'staff' | 'drugs' | 'prescriptions' | 'transactions' | 'storage' | 'overall',
    usage: number,
    current: number,
    limit: number
  ) => {
    if (usage >= 70) {
      let alertType: CapacityAlert['alertType'] = 'warning_70';
      let channels: NotificationChannel[] = ['in_system'];
      
      if (usage >= 95) {
        alertType = 'breach_95';
        channels = ['in_system', 'email', 'phone', 'admin_call'];
      } else if (usage >= 85) {
        alertType = 'critical_85';
        channels = ['in_system', 'email', 'phone'];
      }

      // Check if duplicate active alert exists
      const exists = alerts.find(
        (a) => a.tenantId === metrics.tenantId && a.metric === metricName && a.status === 'active' && a.alertType === alertType
      );

      if (!exists) {
        const alert: CapacityAlert = {
          id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId: metrics.tenantId,
          tenantName: metrics.tenantName,
          alertType,
          metric: metricName,
          usagePercent: usage,
          currentValue: current,
          maxLimit: limit,
          currentTier: metrics.currentTier,
          recommendedTier: metrics.recommendedTier,
          status: 'active',
          notificationChannels: channels,
          createdAt: new Date().toISOString(),
        };
        newAlerts.push(alert);
      }
    }
  };

  checkMetric('staff', metrics.staffUsagePercent, metrics.staffCount, metrics.staffLimit);
  checkMetric('drugs', metrics.drugsUsagePercent, metrics.drugsCount, metrics.drugsLimit);
  checkMetric('prescriptions', metrics.prescriptionsUsagePercent, metrics.prescriptionsCount, metrics.prescriptionsLimit);
  checkMetric('transactions', metrics.transactionsUsagePercent, metrics.transactionsCount, metrics.transactionsLimit);
  checkMetric('storage', metrics.storageUsagePercent, metrics.storageMb, metrics.storageLimitMb);
  checkMetric('overall', metrics.overallUsagePercent, Math.round(metrics.overallUsagePercent), 100);

  if (newAlerts.length > 0) {
    const updated = [...newAlerts, ...alerts];
    saveAlertsToStorage(updated);

    // Audit log
    for (const a of newAlerts) {
      logSecurityAudit(
        'CAPACITY_THRESHOLD_ALERT_TRIGGERED',
        `Capacity alert triggered for ${metrics.tenantName || metrics.tenantId}: ${a.metric} at ${a.usagePercent}% capacity. Recommended tier: ${a.recommendedTier || 'None'}. Channels: ${a.notificationChannels.join(', ')}`,
        'admin_system'
      );
    }
  }

  return getCapacityAlerts(metrics.tenantId);
};

export const getCapacityAlerts = (tenantId?: string): CapacityAlert[] => {
  const alerts = getStoredAlerts();
  if (tenantId) {
    return alerts.filter((a) => a.tenantId === tenantId);
  }
  return alerts;
};

export const acknowledgeAlert = (alertId: string, adminNotes?: string): boolean => {
  const alerts = getStoredAlerts();
  const updated = alerts.map((a) => {
    if (a.id === alertId) {
      return { ...a, status: 'acknowledged' as const, adminNotes: adminNotes || a.adminNotes };
    }
    return a;
  });
  saveAlertsToStorage(updated);
  return true;
};

export const resolveAlert = (alertId: string): boolean => {
  const alerts = getStoredAlerts();
  const updated = alerts.map((a) => {
    if (a.id === alertId) {
      return { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString() };
    }
    return a;
  });
  saveAlertsToStorage(updated);
  return true;
};
