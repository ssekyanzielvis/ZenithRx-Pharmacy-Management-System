import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  FileX,
  ShoppingBag,
  CreditCard,
  PackageCheck,
  Truck,
  RefreshCw,
  BellRing,
  Search,
  CheckCheck,
  Trash2,
  ExternalLink,
  Plus,
  Send,
  Users,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Phone,
  Layers,
  Radio,
  Clock,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react';
import {
  notificationCenterService,
  NotificationItem,
  NotificationCategory,
  NotificationPriority,
  NotificationRecipientType,
  NOTIFICATION_CATEGORIES_META,
} from '../services/notificationCenterService';

interface NotificationCenterConsoleProps {
  tenantId?: string;
  onNavigateTab?: (tab: string, payload?: any) => void;
}

export const NotificationCenterConsole: React.FC<NotificationCenterConsoleProps> = ({
  tenantId = 'client-001',
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [selectedRecipientType, setSelectedRecipientType] = useState<NotificationRecipientType | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);

  // Broadcast / Compose Modal State
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [composeRecipientType, setComposeRecipientType] = useState<NotificationRecipientType>('patient');
  const [composeRecipientName, setComposeRecipientName] = useState('Harriet Nakato');
  const [composeRecipientPhone, setComposeRecipientPhone] = useState('+256 701 234 567');
  const [composeCategory, setComposeCategory] = useState<NotificationCategory>('system_announcement');
  const [composePriority, setComposePriority] = useState<NotificationPriority>('normal');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeChannels, setComposeChannels] = useState<{
    in_app: boolean;
    sms: boolean;
    whatsapp: boolean;
  }>({ in_app: true, sms: true, whatsapp: false });
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const loadNotifications = () => {
    let list = notificationCenterService.getStaffNotifications({
      tenantId,
      category: selectedCategory,
      unreadOnly,
      query: searchQuery,
    });

    if (selectedRecipientType !== 'all') {
      list = list.filter((n) => n.recipientType === selectedRecipientType);
    }

    if (selectedPriority !== 'all') {
      list = list.filter((n) => n.priority === selectedPriority);
    }

    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
  }, [selectedCategory, selectedRecipientType, selectedPriority, unreadOnly, searchQuery]);

  const handleMarkAsRead = (id: string) => {
    notificationCenterService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    notificationCenterService.markAllAsRead();
    loadNotifications();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationCenterService.deleteNotification(id);
    if (selectedItem?.id === id) setSelectedItem(null);
    loadNotifications();
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeMessage.trim()) return;

    notificationCenterService.sendNotification({
      tenantId,
      pharmacyId: tenantId,
      recipientType: composeRecipientType,
      recipientName: composeRecipientType === 'all' ? 'All Platform Users' : composeRecipientName,
      recipientPhone: composeRecipientType === 'all' ? undefined : composeRecipientPhone,
      category: composeCategory,
      title: composeTitle.trim(),
      message: composeMessage.trim(),
      priority: composePriority,
      channels: {
        in_app: composeChannels.in_app ? 'delivered' : 'pending',
        sms: composeChannels.sms ? 'delivered' : 'pending',
        whatsapp: composeChannels.whatsapp ? 'delivered' : 'pending',
      },
    });

    setBroadcastSuccess(true);
    setTimeout(() => {
      setBroadcastSuccess(false);
      setIsComposeModalOpen(false);
      setComposeTitle('');
      setComposeMessage('');
    }, 1200);

    loadNotifications();
  };

  const triggerPreset = (category: NotificationCategory) => {
    const meta = NOTIFICATION_CATEGORIES_META.find((m) => m.category === category);
    if (!meta) return;

    const presets: Record<NotificationCategory, { title: string; message: string; priority: NotificationPriority; actionType: any }> = {
      prescription_verified: {
        title: 'Prescription Verified by Licensed Pharmacist',
        message: 'Prescription #RX-8842 for Harriet Nakato has been verified. Patient notified to proceed with order payment.',
        priority: 'normal',
        actionType: 'view_prescription',
      },
      prescription_rejected: {
        title: 'Prescription Re-upload Requested',
        message: 'Prescription #RX-8843 requires re-upload: illegible physician stamp. SMS notice sent to patient.',
        priority: 'high',
        actionType: 'view_prescription',
      },
      order_confirmed: {
        title: 'Order Confirmed: #ORD-9912',
        message: 'Dispensary counter received payment confirmation and started medication packaging.',
        priority: 'normal',
        actionType: 'track_order',
      },
      payment_received: {
        title: 'Payment Received: UGX 54,000 (Airtel Money)',
        message: 'Transaction #TXN-88192 validated. Digital receipt generated and stored in ledger.',
        priority: 'normal',
        actionType: 'view_receipt',
      },
      order_ready: {
        title: 'Package Sealed & Ready at Counter 2',
        message: 'Order #ORD-9912 packed with tamper-evident seal and waiting for customer pickup or rider collection.',
        priority: 'normal',
        actionType: 'track_order',
      },
      delivery_dispatched: {
        title: 'Courier En Route with Handover OTP [9128]',
        message: 'Rider Joseph (Boda #UFE-231P) dispatched for doorstep delivery in Kololo. OTP sent to customer SMS.',
        priority: 'high',
        actionType: 'track_order',
      },
      delivery_completed: {
        title: 'Order #ORD-9912 Delivered & Handover Verified',
        message: 'OTP 9128 verified by rider at 10:14 AM. Delivery completed successfully.',
        priority: 'normal',
        actionType: 'track_order',
      },
      refill_reminder: {
        title: 'Chronic Refill Due: Amlodipine 10mg',
        message: 'Calculated 30-day depletion reached. Automated replenishment alert sent to patient Harriet Nakato.',
        priority: 'high',
        actionType: 'refill_now',
      },
      adr_update: {
        title: 'Pharmacovigilance ADR Review Complete',
        message: 'Dr. Arthur Ssenabulya completed clinical assessment for ADR #ADR-2026-091. NDA report submitted.',
        priority: 'urgent',
        actionType: 'view_adr',
      },
      system_announcement: {
        title: 'System Notice: Night Shift Rota Activated',
        message: 'Kampala Flagship 24/7 night shift is active with Dr. Arthur Ssenabulya on primary clinical triage.',
        priority: 'normal',
        actionType: 'none',
      },
    };

    const config = presets[category];
    notificationCenterService.sendNotification({
      tenantId,
      recipientType: 'staff',
      recipientName: 'Dispensary Team',
      category,
      title: config.title,
      message: config.message,
      priority: config.priority,
      actionType: config.actionType,
      channels: { in_app: 'delivered', sms: 'delivered' },
    });

    loadNotifications();
  };

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'prescription_verified':
        return <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'prescription_rejected':
        return <FileX className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'order_confirmed':
        return <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'order_ready':
        return <PackageCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'delivery_dispatched':
        return <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'delivery_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'refill_reminder':
        return <RefreshCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'adr_update':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'system_announcement':
        return <BellRing className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const urgentCount = notifications.filter((n) => n.priority === 'urgent').length;
  const deliveryCount = notifications.filter((n) =>
    ['order_ready', 'delivery_dispatched', 'delivery_completed'].includes(n.category)
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Notification Center &amp; Omni-Channel Dispatch Desk
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                  Live Unified Inbox
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full-history audit trail, multi-channel alerting (In-App, SMS, WhatsApp), and automated triggers across all 10 clinical & operational categories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Mark all read
            </button>

            <button
              onClick={() => setIsComposeModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Dispatch Notification / Announcement
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Total Notifications
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalCount}
            </p>
            <span className="text-[10px] text-slate-400">All registered alerts</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40">
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Unread in Inbox
            </p>
            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100 mt-1">
              {unreadCount}
            </p>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Requires triage</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Urgent Safety / ADR
            </p>
            <p className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">
              {urgentCount}
            </p>
            <span className="text-[10px] text-rose-600 dark:text-rose-400">Clinical priority</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Dispatched / Orders
            </p>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
              {deliveryCount}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Live fulfillment</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar & Quick Category Triggers ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="all">All 10 Categories</option>
              {NOTIFICATION_CATEGORIES_META.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Recipient Filter */}
            <select
              value={selectedRecipientType}
              onChange={(e) => setSelectedRecipientType(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="all">All Recipient Types</option>
              <option value="patient">Patient Alerts</option>
              <option value="staff">Staff Alerts</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="all">All Priorities</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                unreadOnly
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {unreadOnly ? 'Showing Unread Only' : 'Show Unread'}
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications & logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Quick Demo Preset Trigger Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
            Simulate Category Alert:
          </span>
          {NOTIFICATION_CATEGORIES_META.map((m) => (
            <button
              key={m.category}
              onClick={() => triggerPreset(m.category)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold whitespace-nowrap transition-colors border border-slate-200/60 dark:border-slate-700/60 shrink-0 cursor-pointer"
            >
              + {m.label.split(' ')[0]} {m.label.split(' ')[1] || ''}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Notifications Table & Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Notifications */}
        <div className="lg:col-span-2 space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                No notification records match this filter
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                You can trigger quick simulation alerts above or compose a custom broadcast.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const meta = NOTIFICATION_CATEGORIES_META.find((m) => m.category === item.category);
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    if (!item.isRead) handleMarkAsRead(item.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500'
                      : !item.isRead
                      ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-90'
                  }`}
                >
                  {!item.isRead && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full" />
                  )}

                  <div className="flex items-start gap-3.5 pl-1.5">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              meta?.badgeBg || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {meta?.label || item.category}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            To: {item.recipientName || item.recipientType}
                          </span>
                          {item.priority === 'urgent' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-red-300 border border-rose-200">
                              URGENT
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-bold leading-tight truncate ${
                          !item.isRead
                            ? 'text-slate-900 dark:text-white font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>Delivery Channels:</span>
                          {item.channels.in_app && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-semibold">
                              <Check className="w-2.5 h-2.5" /> App
                            </span>
                          )}
                          {item.channels.sms && (
                            <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-semibold">
                              <Check className="w-2.5 h-2.5" /> SMS
                            </span>
                          )}
                          {item.channels.whatsapp && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded font-semibold">
                              <Check className="w-2.5 h-2.5" /> WA
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Inspection Panel ── */}
        <div className="space-y-5">
          {selectedItem ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Notification Audit Inspector
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  #{selectedItem.id}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {getCategoryIcon(selectedItem.category)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {selectedItem.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Dispatched: {new Date(selectedItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedItem.message}
                </div>

                {/* Recipient details */}
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 space-y-1.5 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Target Recipient Information
                  </p>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedItem.recipientName || 'N/A'}
                    </span>
                  </div>
                  {selectedItem.recipientPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone (SMS/WA):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedItem.recipientPhone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">
                      {selectedItem.recipientType}
                    </span>
                  </div>
                </div>

                {/* Status audit */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Multi-Channel Status
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between">
                      <span className="text-slate-500">Read in App:</span>
                      <span className={`font-bold ${selectedItem.isRead ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {selectedItem.isRead ? 'YES' : 'UNREAD'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between">
                      <span className="text-slate-500">SMS Route:</span>
                      <span className="font-bold text-emerald-600">DELIVERED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Notification System Standards
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The ZenithRx Notification Center operates in accordance with Uganda NDA and PSU digital health guidelines:
              </p>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>Prescriptions require licensed pharmacist verification notices before patient payment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>Delivery dispatches automatically generate unique 4-digit handover OTPs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>Adverse Drug Reaction updates are logged and prioritized for clinical pharmacovigilance.</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Broadcast / Dispatch Modal ── */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Broadcast Notification / Announcement
                </h3>
              </div>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Notification Dispatched!
                </h4>
                <p className="text-xs text-slate-500">
                  Sent via In-App inbox and selected telecom SMS channels.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Recipient Type
                    </label>
                    <select
                      value={composeRecipientType}
                      onChange={(e) => setComposeRecipientType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="patient">Single Patient</option>
                      <option value="staff">Pharmacy Staff</option>
                      <option value="all">All Patients &amp; Staff (Global)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Category
                    </label>
                    <select
                      value={composeCategory}
                      onChange={(e) => setComposeCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      {NOTIFICATION_CATEGORIES_META.map((c) => (
                        <option key={c.category} value={c.category}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {composeRecipientType === 'patient' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Patient Name
                      </label>
                      <input
                        type="text"
                        value={composeRecipientName}
                        onChange={(e) => setComposeRecipientName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        placeholder="e.g. Harriet Nakato"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Phone Number (UGX)
                      </label>
                      <input
                        type="text"
                        value={composeRecipientPhone}
                        onChange={(e) => setComposeRecipientPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold"
                        placeholder="+256 701 234 567"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    placeholder="e.g. Order #ORD-8821 Ready for Pickup"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Detailed Message Body
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed"
                    placeholder="Enter full notice or clinical instruction..."
                  />
                </div>

                {/* Delivery Channels */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Dispatch Channels
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={composeChannels.in_app}
                        onChange={(e) =>
                          setComposeChannels({ ...composeChannels, in_app: e.target.checked })
                        }
                        className="rounded text-indigo-600"
                      />
                      <span>In-App Inbox</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={composeChannels.sms}
                        onChange={(e) =>
                          setComposeChannels({ ...composeChannels, sms: e.target.checked })
                        }
                        className="rounded text-indigo-600"
                      />
                      <span>Telecom SMS</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={composeChannels.whatsapp}
                        onChange={(e) =>
                          setComposeChannels({ ...composeChannels, whatsapp: e.target.checked })
                        }
                        className="rounded text-indigo-600"
                      />
                      <span>WhatsApp Cloud</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Now
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
