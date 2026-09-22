import { SystemNotification, NotificationChannel } from '../types';
import { logSecurityAudit } from './auditLogger';

const STORAGE_KEY_NOTIFICATIONS = 'zenithrx_system_notifications';
const STORAGE_KEY_DELIVERY_LOG = 'zenithrx_notification_delivery_log';

export interface NotificationDeliveryRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  channel: NotificationChannel;
  recipient: string; // email or phone or 'In-App Inbox'
  subject: string;
  body: string;
  status: 'delivered' | 'pending' | 'failed' | 'logged_for_admin_call';
  timestamp: string;
  adminActionTaken?: boolean;
}

const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NOTIF-001',
    tenantId: 'client-1',
    title: 'Capacity Warning: Prescriptions at 92.4%',
    message: 'Nakasero Pharmacy has used 4,620 of 5,000 monthly prescription capacity. Upgrade to Enterprise to prevent checkout throttles.',
    type: 'upgrade_recommendation',
    actionUrl: 'adminPackages',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'NOTIF-002',
    tenantId: 'client-1',
    title: 'NDA Compliance Audit Notice',
    message: 'Annual National Drug Authority (NDA) Uganda clinical data compliance verification is scheduled for this quarter. Verify all patient health records.',
    type: 'compliance_notice',
    actionUrl: 'nda',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'NOTIF-003',
    tenantId: 'client-2',
    title: 'Staff Capacity Limit Exceeded (5/5)',
    message: 'Ecopharm Kampala has reached maximum staff accounts allowed on Starter Plan. Upgrade to Professional for up to 15 pharmacists.',
    type: 'critical',
    actionUrl: 'adminPackages',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'NOTIF-004',
    title: 'System Security & NDA Data Privacy Update',
    message: 'All staff activities are actively recorded in dual-audit logs for National Drug Authority inspection. Strict patient health data confidentiality enforced.',
    type: 'info',
    actionUrl: 'audit',
    isRead: true,
    readAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

const getStoredNotifications = (): SystemNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
  saveNotificationsToStorage(INITIAL_NOTIFICATIONS);
  return INITIAL_NOTIFICATIONS;
};

const saveNotificationsToStorage = (notifications: SystemNotification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  } catch (err) {
    console.error('Error saving notifications:', err);
  }
};

const getStoredDeliveryLogs = (): NotificationDeliveryRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELIVERY_LOG);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading delivery logs:', err);
  }
  return [];
};

const saveDeliveryLogsToStorage = (logs: NotificationDeliveryRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_DELIVERY_LOG, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving delivery logs:', err);
  }
};

export const getSystemNotifications = (filter?: {
  tenantId?: string;
  userId?: string;
  role?: string;
  isRead?: boolean;
}): SystemNotification[] => {
  const all = getStoredNotifications();
  return all.filter((n) => {
    // If tenantId provided, match specific tenant or global broadcasts (tenantId is undefined/null)
    if (filter?.tenantId && n.tenantId && n.tenantId !== filter.tenantId) {
      return false;
    }
    if (filter?.userId && n.recipientUserId && n.recipientUserId !== filter.userId) {
      return false;
    }
    if (filter?.isRead !== undefined && n.isRead !== filter.isRead) {
      return false;
    }
    return true;
  });
};

export const sendSystemNotification = (params: {
  tenantId?: string;
  recipientUserId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type?: SystemNotification['type'];
  actionUrl?: string;
  metadata?: Record<string, any>;
}): SystemNotification => {
  const all = getStoredNotifications();
  const newNotif: SystemNotification = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tenantId: params.tenantId,
    recipientUserId: params.recipientUserId,
    targetRole: params.targetRole,
    title: params.title,
    message: params.message,
    type: params.type || 'info',
    actionUrl: params.actionUrl,
    metadata: params.metadata,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newNotif, ...all];
  saveNotificationsToStorage(updated);
  return newNotif;
};

export const markNotificationAsRead = (id: string): boolean => {
  const all = getStoredNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
  saveNotificationsToStorage(updated);
  return true;
};

export const markAllNotificationsAsRead = (tenantId?: string, userId?: string): boolean => {
  const all = getStoredNotifications();
  const updated = all.map((n) => {
    if (tenantId && n.tenantId && n.tenantId !== tenantId) return n;
    if (userId && n.recipientUserId && n.recipientUserId !== userId) return n;
    return { ...n, isRead: true, readAt: new Date().toISOString() };
  });
  saveNotificationsToStorage(updated);
  return true;
};

export const getUnreadNotificationsCount = (tenantId?: string, userId?: string): number => {
  const unread = getSystemNotifications({ tenantId, userId, isRead: false });
  return unread.length;
};

export const dispatchMultiChannelNotification = (
  tenantId: string,
  tenantName: string,
  channels: NotificationChannel[],
  title: string,
  message: string,
  contactPhone?: string,
  contactEmail?: string
): NotificationDeliveryRecord[] => {
  const deliveryLogs = getStoredDeliveryLogs();
  const newLogs: NotificationDeliveryRecord[] = [];

  for (const channel of channels) {
    let recipient = 'In-App System Bell';
    let status: NotificationDeliveryRecord['status'] = 'delivered';

    if (channel === 'in_system') {
      sendSystemNotification({
        tenantId,
        title,
        message,
        type: 'upgrade_recommendation',
        actionUrl: 'adminPackages',
      });
      recipient = `${tenantName} In-App Inbox`;
    } else if (channel === 'email') {
      recipient = contactEmail || `admin@${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '')}.pharmsync.online`;
      status = 'delivered'; // In prod, connect to Resend/Sendgrid
    } else if (channel === 'phone') {
      recipient = contactPhone || '+256 700 000000';
      status = 'delivered'; // In prod, connect to Twilio/Africa's Talking SMS gateway
    } else if (channel === 'admin_call') {
      recipient = `Direct Super Admin Escalation (${contactPhone || '+256 700 000000'})`;
      status = 'logged_for_admin_call';
      
      // Also notify Super Admin inbox
      sendSystemNotification({
        targetRole: 'super_admin',
        title: `URGENT: Direct Call Required for ${tenantName}`,
        message: `Pharmacy has reached critical capacity (${title}). Contact via phone: ${contactPhone || 'N/A'} to assist with plan upgrade.`,
        type: 'critical',
        actionUrl: 'adminCapacity',
      });
    }

    const logRecord: NotificationDeliveryRecord = {
      id: `DLV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      tenantName,
      channel,
      recipient,
      subject: title,
      body: message,
      status,
      timestamp: new Date().toISOString(),
    };
    newLogs.push(logRecord);
  }

  const updatedLogs = [...newLogs, ...deliveryLogs];
  saveDeliveryLogsToStorage(updatedLogs);

  logSecurityAudit(
    'MULTI_CHANNEL_NOTIFICATION_DISPATCHED',
    `Dispatched multi-channel alerts to ${tenantName} across channels: ${channels.join(', ')}. Title: "${title}"`,
    'admin_system'
  );

  return newLogs;
};

export const getNotificationDeliveryLogs = (tenantId?: string): NotificationDeliveryRecord[] => {
  const logs = getStoredDeliveryLogs();
  if (tenantId) {
    return logs.filter((l) => l.tenantId === tenantId);
  }
  return logs;
};
