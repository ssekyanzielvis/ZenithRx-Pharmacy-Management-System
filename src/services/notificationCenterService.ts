// ============================================================================
// Notification Center Domain Service
// Handles persistent multi-channel notification inboxes for patients & staff
// across the 10 core clinical and operational notification categories.
// ============================================================================

export type NotificationCategory =
  | 'prescription_verified'
  | 'prescription_rejected'
  | 'order_confirmed'
  | 'payment_received'
  | 'order_ready'
  | 'delivery_dispatched'
  | 'delivery_completed'
  | 'refill_reminder'
  | 'adr_update'
  | 'system_announcement';

export type NotificationPriority = 'normal' | 'high' | 'urgent';

export type NotificationRecipientType = 'patient' | 'staff' | 'all';

export type NotificationActionType =
  | 'view_prescription'
  | 'track_order'
  | 'view_receipt'
  | 'refill_now'
  | 'view_adr'
  | 'none';

export interface NotificationItem {
  id: string;
  tenantId: string;
  pharmacyId: string;
  recipientType: NotificationRecipientType;
  recipientId?: string;
  recipientPhone?: string;
  recipientName?: string;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  actionType: NotificationActionType;
  actionPayload?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  channels: {
    in_app?: 'delivered' | 'pending';
    sms?: 'delivered' | 'failed' | 'pending';
    whatsapp?: 'delivered' | 'pending';
    push?: 'sent' | 'pending';
  };
  createdAt: string;
}

export interface NotificationCategoryMeta {
  category: NotificationCategory;
  label: string;
  iconName: string;
  colorClass: string;
  badgeBg: string;
  group: 'clinical' | 'orders' | 'safety' | 'announcements';
}

export const NOTIFICATION_CATEGORIES_META: NotificationCategoryMeta[] = [
  {
    category: 'prescription_verified',
    label: 'Prescription Verified',
    iconName: 'FileCheck',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
    group: 'clinical',
  },
  {
    category: 'prescription_rejected',
    label: 'Prescription Needs Re-Upload',
    iconName: 'FileX',
    colorClass: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200',
    group: 'clinical',
  },
  {
    category: 'order_confirmed',
    label: 'Order Confirmed',
    iconName: 'ShoppingBag',
    colorClass: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
    group: 'orders',
  },
  {
    category: 'payment_received',
    label: 'Payment Received',
    iconName: 'CreditCard',
    colorClass: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200',
    group: 'orders',
  },
  {
    category: 'order_ready',
    label: 'Order Ready for Pickup',
    iconName: 'PackageCheck',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200',
    group: 'orders',
  },
  {
    category: 'delivery_dispatched',
    label: 'Delivery Dispatched (OTP)',
    iconName: 'Truck',
    colorClass: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200',
    group: 'orders',
  },
  {
    category: 'delivery_completed',
    label: 'Delivery Completed',
    iconName: 'CheckCircle2',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
    group: 'orders',
  },
  {
    category: 'refill_reminder',
    label: 'Chronic Refill Due',
    iconName: 'RefreshCw',
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200',
    group: 'clinical',
  },
  {
    category: 'adr_update',
    label: 'ADR Safety Update',
    iconName: 'AlertTriangle',
    colorClass: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200',
    group: 'safety',
  },
  {
    category: 'system_announcement',
    label: 'System Announcement',
    iconName: 'BellRing',
    colorClass: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200',
    group: 'announcements',
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-001',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-001',
    recipientPhone: '+256 701 234 567',
    recipientName: 'Harriet Nakato',
    category: 'prescription_verified',
    title: 'Prescription Verified by Pharmacist',
    message: 'Your uploaded prescription #RX-9921 for Amoxicillin & Paracetamol has been clinically validated by Dr. Arthur Ssenabulya. You can now complete checkout for express delivery or counter pickup.',
    priority: 'normal',
    actionType: 'view_prescription',
    actionPayload: { rxId: 'RX-9921', status: 'verified' },
    isRead: false,
    channels: { in_app: 'delivered', sms: 'delivered' },
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'notif-002',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-002',
    recipientPhone: '+256 772 987 654',
    recipientName: 'Moses Kigozi',
    category: 'prescription_rejected',
    title: 'Prescription Needs Re-Upload',
    message: 'Prescription #RX-9908 could not be verified: Doctor signature is cut off at the bottom of the photo. Please take a clearer photo showing the full clinic stamp and re-upload.',
    priority: 'high',
    actionType: 'view_prescription',
    actionPayload: { rxId: 'RX-9908', status: 'rejected', reason: 'Cut off signature' },
    isRead: true,
    readAt: new Date(Date.now() - 60 * 60000).toISOString(),
    channels: { in_app: 'delivered', sms: 'delivered' },
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: 'notif-003',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-001',
    recipientPhone: '+256 701 234 567',
    recipientName: 'Harriet Nakato',
    category: 'order_confirmed',
    title: 'Order #ORD-7734 Confirmed',
    message: 'Zenith Central Kampala has received and accepted your order for Ventolin Inhaler and Multivitamin Syrup. Our dispensing team is preparing your package.',
    priority: 'normal',
    actionType: 'track_order',
    actionPayload: { orderId: 'ORD-7734' },
    isRead: false,
    channels: { in_app: 'delivered', sms: 'delivered' },
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: 'notif-004',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-001',
    recipientPhone: '+256 701 234 567',
    recipientName: 'Harriet Nakato',
    category: 'payment_received',
    title: 'Payment Received: UGX 38,500',
    message: 'MTN MoMo transaction #MM-UGX-88219 confirmed for order #ORD-7734. Digital receipt is available in your account.',
    priority: 'normal',
    actionType: 'view_receipt',
    actionPayload: { orderId: 'ORD-7734', amountUgx: 38500, txnRef: 'MM-UGX-88219' },
    isRead: false,
    channels: { in_app: 'delivered', sms: 'delivered' },
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'notif-005',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-003',
    recipientPhone: '+256 752 443 211',
    recipientName: 'Grace Akello',
    category: 'order_ready',
    title: 'Order #ORD-7719 Ready for In-Store Pickup',
    message: 'Your medication package is packaged with safety seals at Counter 1 inside Zenith Central Kampala. Please present SMS or QR code upon arrival.',
    priority: 'normal',
    actionType: 'track_order',
    actionPayload: { orderId: 'ORD-7719', pickupLocation: 'Counter 1' },
    isRead: true,
    readAt: new Date(Date.now() - 180 * 60000).toISOString(),
    channels: { in_app: 'delivered', sms: 'delivered' },
    createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
  },
  {
    id: 'notif-006',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-001',
    recipientPhone: '+256 701 234 567',
    recipientName: 'Harriet Nakato',
    category: 'delivery_dispatched',
    title: 'Courier Dispatched with Order #ORD-7734',
    message: 'Rider Joseph (Boda #UFE-231P • 0755091826) is en route to Kololo. Estimated arrival in 20 minutes. Your secure handover OTP is [8492].',
    priority: 'high',
    actionType: 'track_order',
    actionPayload: { orderId: 'ORD-7734', riderName: 'Joseph', otp: '8492' },
    isRead: false,
    channels: { in_app: 'delivered', sms: 'delivered', whatsapp: 'delivered' },
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'notif-007',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-002',
    recipientPhone: '+256 772 987 654',
    recipientName: 'Moses Kigozi',
    category: 'delivery_completed',
    title: 'Delivery Completed Successfully',
    message: 'Order #ORD-7688 was delivered and verified with OTP handover at 09:15 AM. Thank you for choosing ZenithRx.',
    priority: 'normal',
    actionType: 'track_order',
    actionPayload: { orderId: 'ORD-7688' },
    isRead: true,
    channels: { in_app: 'delivered', sms: 'delivered' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'notif-008',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-001',
    recipientPhone: '+256 701 234 567',
    recipientName: 'Harriet Nakato',
    category: 'refill_reminder',
    title: 'Refill Due in 3 Days: Metformin 500mg',
    message: 'Based on your daily dosing frequency, your 30-day supply of Metformin will deplete on Sep 28. Click to request an automated renewal with 1-click doorstep delivery.',
    priority: 'high',
    actionType: 'refill_now',
    actionPayload: { medication: 'Metformin 500mg', depletionDate: '2026-09-28' },
    isRead: false,
    channels: { in_app: 'delivered', sms: 'delivered', whatsapp: 'delivered' },
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'notif-009',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'patient',
    recipientId: 'pat-003',
    recipientPhone: '+256 752 443 211',
    recipientName: 'Grace Akello',
    category: 'adr_update',
    title: 'Safety Assessment Update on Reported Side Effect',
    message: 'Dr. Arthur Ssenabulya has reviewed your ADR safety report #ADR-2026-091 regarding mild rash from Amoxicillin. Clinical note: Discontinue therapy immediately and switch to Erythromycin as discussed.',
    priority: 'urgent',
    actionType: 'view_adr',
    actionPayload: { adrId: 'ADR-2026-091', status: 'reviewed' },
    isRead: false,
    channels: { in_app: 'delivered', sms: 'delivered' },
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'notif-010',
    tenantId: 'client-001',
    pharmacyId: 'client-001',
    recipientType: 'all',
    recipientName: 'All ZenithRx Patients',
    category: 'system_announcement',
    title: 'Uganda Independence Day Holiday Operating Schedule',
    message: 'All ZenithRx 24/7 flagship branches remain fully open with round-the-clock emergency dispensing and night-shift pharmacists during the upcoming public holiday.',
    priority: 'normal',
    actionType: 'none',
    isRead: false,
    channels: { in_app: 'delivered' },
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

const STORAGE_KEY = 'zenithrx_notification_inbox_v1';

function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading notifications storage:', e);
  }
  return INITIAL_NOTIFICATIONS;
}

function saveStoredNotifications(items: NotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Error saving notifications storage:', e);
  }
}

export const notificationCenterService = {
  /**
   * Get all notifications for a patient.
   */
  getPatientNotifications(params: {
    patientPhoneOrId?: string;
    category?: NotificationCategory | 'all';
    unreadOnly?: boolean;
    query?: string;
  }): NotificationItem[] {
    const all = getStoredNotifications();
    let list = all.filter(
      (n) =>
        n.recipientType === 'all' ||
        !params.patientPhoneOrId ||
        n.recipientPhone === params.patientPhoneOrId ||
        n.recipientId === params.patientPhoneOrId
    );

    if (params.category && params.category !== 'all') {
      list = list.filter((n) => n.category === params.category);
    }

    if (params.unreadOnly) {
      list = list.filter((n) => !n.isRead);
    }

    if (params.query) {
      const q = params.query.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get notifications for pharmacy staff / workstation.
   */
  getStaffNotifications(params?: {
    tenantId?: string;
    category?: NotificationCategory | 'all';
    unreadOnly?: boolean;
    query?: string;
  }): NotificationItem[] {
    const all = getStoredNotifications();
    let list = all.filter(
      (n) =>
        n.recipientType === 'staff' ||
        n.recipientType === 'all' ||
        (params?.tenantId && n.tenantId === params.tenantId)
    );

    if (params?.category && params.category !== 'all') {
      list = list.filter((n) => n.category === params.category);
    }

    if (params?.unreadOnly) {
      list = list.filter((n) => !n.isRead);
    }

    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Send a new notification into the inbox.
   */
  sendNotification(input: {
    tenantId?: string;
    pharmacyId?: string;
    recipientType: NotificationRecipientType;
    recipientId?: string;
    recipientPhone?: string;
    recipientName?: string;
    category: NotificationCategory;
    title: string;
    message: string;
    priority?: NotificationPriority;
    actionType?: NotificationActionType;
    actionPayload?: Record<string, any>;
    channels?: NotificationItem['channels'];
  }): NotificationItem {
    const all = getStoredNotifications();
    const item: NotificationItem = {
      id: `notif-${Date.now()}`,
      tenantId: input.tenantId || 'client-001',
      pharmacyId: input.pharmacyId || 'client-001',
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      recipientPhone: input.recipientPhone,
      recipientName: input.recipientName,
      category: input.category,
      title: input.title,
      message: input.message,
      priority: input.priority || 'normal',
      actionType: input.actionType || 'none',
      actionPayload: input.actionPayload || {},
      isRead: false,
      channels: input.channels || { in_app: 'delivered', sms: 'delivered' },
      createdAt: new Date().toISOString(),
    };

    all.unshift(item);
    saveStoredNotifications(all);
    return item;
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead(id: string): boolean {
    const all = getStoredNotifications();
    const item = all.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
      saveStoredNotifications(all);
      return true;
    }
    return false;
  },

  /**
   * Mark all notifications as read for a recipient.
   */
  markAllAsRead(recipientPhoneOrId?: string): number {
    const all = getStoredNotifications();
    let count = 0;
    all.forEach((n) => {
      if (
        !recipientPhoneOrId ||
        n.recipientType === 'all' ||
        n.recipientPhone === recipientPhoneOrId ||
        n.recipientId === recipientPhoneOrId
      ) {
        if (!n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
          count++;
        }
      }
    });
    saveStoredNotifications(all);
    return count;
  },

  /**
   * Delete a notification item.
   */
  deleteNotification(id: string): boolean {
    const all = getStoredNotifications();
    const filtered = all.filter((n) => n.id !== id);
    if (filtered.length !== all.length) {
      saveStoredNotifications(filtered);
      return true;
    }
    return false;
  },

  /**
   * Get unread count.
   */
  getUnreadCount(recipientPhoneOrId?: string): number {
    return this.getPatientNotifications({
      patientPhoneOrId: recipientPhoneOrId,
      unreadOnly: true,
    }).length;
  },
};
