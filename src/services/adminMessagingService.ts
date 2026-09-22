import { AdminPharmacyMessage } from '../types';
import { logSecurityAudit } from './auditLogger';
import { sendSystemNotification } from './notificationService';

const STORAGE_KEY_ADMIN_MESSAGES = 'zenithrx_admin_pharmacy_messages';

const INITIAL_MESSAGES: AdminPharmacyMessage[] = [
  {
    id: 'MSG-001',
    threadId: 'TH-001',
    tenantId: 'client-1',
    tenantName: 'Nakasero Pharmacy Branch',
    senderUserId: 'user-nakasero-1',
    senderName: 'Dr. Sarah Nabatanzi (Supervising Pharmacist)',
    senderType: 'pharmacy',
    recipientType: 'admin',
    subject: 'Request for Plan Upgrade Assessment & Additional Staff Licenses',
    message: 'Hello ZenithRx Support, we are experiencing higher prescription traffic this month and our team has grown to 13 active dispensers. We would like to inquire about transitioning to Enterprise plan before next billing cycle.',
    priority: 'high',
    category: 'plan_upgrade',
    isRead: true,
    readAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'MSG-002',
    threadId: 'TH-001',
    tenantId: 'client-1',
    tenantName: 'Nakasero Pharmacy Branch',
    senderUserId: 'admin-super',
    senderName: 'Arthur Ssenabulya (System Administrator)',
    senderType: 'admin',
    recipientType: 'pharmacy',
    subject: 'Re: Request for Plan Upgrade Assessment & Additional Staff Licenses',
    message: 'Hello Dr. Nabatanzi. We reviewed your prescription volume (4,620 / 5,000) and staff metrics. Enterprise tier will grant your branch 50 staff accounts and 25,000 monthly prescriptions with automated NDA audit log exports. We have applied a 15% annual rebate option in your Billing tab.',
    priority: 'high',
    category: 'plan_upgrade',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'MSG-003',
    threadId: 'TH-002',
    tenantId: 'client-2',
    tenantName: 'Ecopharm Kampala Ltd',
    senderUserId: 'admin-super',
    senderName: 'System Compliance Desk',
    senderType: 'admin',
    recipientType: 'pharmacy',
    subject: 'NDA Annual Premises Renewal Reminder & Capacity Warning',
    message: 'Dear Ecopharm Management, our records indicate your current Starter plan has reached 100% of staff accounts (5/5). Additionally, your NDA premises license verification is scheduled for renewal in 30 days. Please reach out to avoid dispensing interruptions.',
    priority: 'urgent',
    category: 'compliance_nda',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'MSG-004',
    threadId: 'TH-003',
    tenantId: 'client-3',
    tenantName: 'Mbarara City Pharmacy',
    senderUserId: 'user-mbarara-1',
    senderName: 'David Kintu (Store Manager)',
    senderType: 'pharmacy',
    recipientType: 'admin',
    subject: 'Assistance with Offline POS Sync over Airtel 4G',
    message: 'During power fluctuations our cashiers switch to Airtel 4G backup router. Does ZenithRx buffer POS offline transactions before syncing to main database?',
    priority: 'normal',
    category: 'support',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  }
];

const getStoredMessages = (): AdminPharmacyMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading admin pharmacy messages:', err);
  }
  saveMessagesToStorage(INITIAL_MESSAGES);
  return INITIAL_MESSAGES;
};

const saveMessagesToStorage = (messages: AdminPharmacyMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_MESSAGES, JSON.stringify(messages));
  } catch (err) {
    console.error('Error saving admin pharmacy messages:', err);
  }
};

export const getAllMessages = (filter?: {
  tenantId?: string;
  senderType?: 'admin' | 'pharmacy';
  category?: string;
  isRead?: boolean;
}): AdminPharmacyMessage[] => {
  const all = getStoredMessages();
  return all.filter((m) => {
    if (filter?.tenantId && m.tenantId !== filter.tenantId) return false;
    if (filter?.senderType && m.senderType !== filter.senderType) return false;
    if (filter?.category && m.category !== filter.category) return false;
    if (filter?.isRead !== undefined && m.isRead !== filter.isRead) return false;
    return true;
  });
};

export const getThreadMessages = (threadId: string): AdminPharmacyMessage[] => {
  const all = getStoredMessages();
  return all.filter((m) => m.threadId === threadId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const getDistinctThreads = (tenantId?: string): { threadId: string; latestMessage: AdminPharmacyMessage; count: number; unreadCount: number }[] => {
  const all = getStoredMessages();
  const filtered = tenantId ? all.filter((m) => m.tenantId === tenantId) : all;

  const threadsMap = new Map<string, AdminPharmacyMessage[]>();
  for (const msg of filtered) {
    const list = threadsMap.get(msg.threadId) || [];
    list.push(msg);
    threadsMap.set(msg.threadId, list);
  }

  const result: { threadId: string; latestMessage: AdminPharmacyMessage; count: number; unreadCount: number }[] = [];
  threadsMap.forEach((msgs, threadId) => {
    const sorted = [...msgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = msgs.filter((m) => !m.isRead).length;
    result.push({
      threadId,
      latestMessage: sorted[0],
      count: msgs.length,
      unreadCount,
    });
  });

  return result.sort((a, b) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime());
};

export const sendAdminPharmacyMessage = (params: {
  tenantId: string;
  tenantName?: string;
  senderUserId: string;
  senderName: string;
  senderType: 'admin' | 'pharmacy';
  recipientType: 'admin' | 'pharmacy';
  subject: string;
  message: string;
  priority?: AdminPharmacyMessage['priority'];
  category?: AdminPharmacyMessage['category'];
  threadId?: string;
}): AdminPharmacyMessage => {
  const all = getStoredMessages();
  const threadId = params.threadId || `TH-${Date.now()}`;
  const newMessage: AdminPharmacyMessage = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    threadId,
    tenantId: params.tenantId,
    tenantName: params.tenantName || 'Pharmacy Client',
    senderUserId: params.senderUserId,
    senderName: params.senderName,
    senderType: params.senderType,
    recipientType: params.recipientType,
    subject: params.subject,
    message: params.message,
    priority: params.priority || 'normal',
    category: params.category || 'general',
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newMessage, ...all];
  saveMessagesToStorage(updated);

  // Security audit
  logSecurityAudit(
    'ADMIN_PHARMACY_MESSAGE_SENT',
    `${params.senderName} (${params.senderType}) sent message to ${params.recipientType} regarding "${params.subject}" [Category: ${params.category || 'general'}]`,
    params.senderName
  );

  // Send in-system notification to recipient
  if (params.recipientType === 'pharmacy') {
    sendSystemNotification({
      tenantId: params.tenantId,
      title: `New Message from System Administrator: ${params.subject}`,
      message: params.message.substring(0, 120) + (params.message.length > 120 ? '...' : ''),
      type: 'info',
      actionUrl: 'feedback',
    });
  } else {
    sendSystemNotification({
      targetRole: 'super_admin',
      title: `Pharmacy Inquiry: ${params.tenantName || 'Client'} - ${params.subject}`,
      message: params.message.substring(0, 120) + (params.message.length > 120 ? '...' : ''),
      type: 'info',
      actionUrl: 'adminMessagingHub',
    });
  }

  return newMessage;
};

export const markMessageAsRead = (messageId: string): boolean => {
  const all = getStoredMessages();
  const updated = all.map((m) => (m.id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m));
  saveMessagesToStorage(updated);
  return true;
};

export const markThreadAsRead = (threadId: string, readerType: 'admin' | 'pharmacy'): boolean => {
  const all = getStoredMessages();
  const updated = all.map((m) => {
    if (m.threadId === threadId && m.recipientType === readerType) {
      return { ...m, isRead: true, readAt: new Date().toISOString() };
    }
    return m;
  });
  saveMessagesToStorage(updated);
  return true;
};
