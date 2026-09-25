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
  ShieldAlert,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  notificationCenterService,
  NotificationItem,
  NotificationCategory,
  NOTIFICATION_CATEGORIES_META,
} from '../../services/notificationCenterService';

interface PatientNotificationCenterProps {
  patientPhoneOrId?: string;
  patientName?: string;
  onNavigateTab: (tab: string, payload?: any) => void;
}

export const PatientNotificationCenter: React.FC<PatientNotificationCenterProps> = ({
  patientPhoneOrId,
  patientName = 'Patient',
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'clinical' | 'orders' | 'safety' | 'announcements'>('all');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);

  const loadNotifications = () => {
    const list = notificationCenterService.getPatientNotifications({
      patientPhoneOrId,
      category: selectedCategory,
      unreadOnly: selectedFilter === 'unread',
      query: searchQuery,
    });

    let filtered = list;
    if (selectedFilter === 'clinical') {
      filtered = list.filter((n) =>
        ['prescription_verified', 'prescription_rejected', 'refill_reminder'].includes(n.category)
      );
    } else if (selectedFilter === 'orders') {
      filtered = list.filter((n) =>
        ['order_confirmed', 'payment_received', 'order_ready', 'delivery_dispatched', 'delivery_completed'].includes(n.category)
      );
    } else if (selectedFilter === 'safety') {
      filtered = list.filter((n) => n.category === 'adr_update');
    } else if (selectedFilter === 'announcements') {
      filtered = list.filter((n) => n.category === 'system_announcement');
    }

    setNotifications(filtered);
  };

  useEffect(() => {
    loadNotifications();
  }, [patientPhoneOrId, selectedCategory, selectedFilter, searchQuery]);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    notificationCenterService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    notificationCenterService.markAllAsRead(patientPhoneOrId);
    loadNotifications();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationCenterService.deleteNotification(id);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    loadNotifications();
  };

  const handleActionClick = (item: NotificationItem) => {
    handleMarkAsRead(item.id);
    switch (item.actionType) {
      case 'view_prescription':
        onNavigateTab('prescriptions', item.actionPayload);
        break;
      case 'track_order':
        onNavigateTab('orders', item.actionPayload);
        break;
      case 'view_receipt':
        onNavigateTab('orders', item.actionPayload);
        break;
      case 'refill_now':
        onNavigateTab('refills', item.actionPayload);
        break;
      case 'view_adr':
        onNavigateTab('adr', item.actionPayload);
        break;
      default:
        break;
    }
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

  const getCategoryMeta = (cat: NotificationCategory) => {
    return NOTIFICATION_CATEGORIES_META.find((m) => m.category === cat);
  };

  const unreadCount = notificationCenterService.getUnreadCount(patientPhoneOrId);

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Notification Center &amp; Clinical Inbox
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time updates on prescription verification, dispensary packing, MoMo payments, courier OTP, and refill schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Tabs & Search Bar ── */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Updates' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'clinical', label: 'Prescriptions & Refills' },
              { id: 'orders', label: 'Orders & Deliveries' },
              { id: 'safety', label: 'ADR & Safety' },
              { id: 'announcements', label: 'Announcements' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── Inbox Items List ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                You're all caught up!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                No notifications match your current filter. When a pharmacist reviews your prescription or a rider is dispatched, you'll see alerts here.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const meta = getCategoryMeta(item.category);
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
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500'
                      : !item.isRead
                      ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-90'
                  }`}
                >
                  {/* Unread indicator stripe */}
                  {!item.isRead && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full" />
                  )}

                  <div className="flex items-start gap-3.5 pl-1.5">
                    {/* Category Icon */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Badge row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              meta?.badgeBg || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {meta?.label || item.category}
                          </span>
                          {item.priority === 'urgent' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200">
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

                      {/* Title */}
                      <h4
                        className={`text-sm font-bold leading-tight truncate ${
                          !item.isRead
                            ? 'text-slate-900 dark:text-white font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Message preview */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Bottom row: Multi-channel indicators & Action trigger */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                        {/* Channel icons */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>Delivered via:</span>
                          {item.channels.in_app && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                              <Check className="w-2.5 h-2.5" /> In-App
                            </span>
                          )}
                          {item.channels.sms && (
                            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                              <Check className="w-2.5 h-2.5" /> SMS
                            </span>
                          )}
                          {item.channels.whatsapp && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded font-bold">
                              <Check className="w-2.5 h-2.5" /> WhatsApp
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {item.actionType !== 'none' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(item);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              {item.actionType === 'view_prescription' && 'View Rx'}
                              {item.actionType === 'track_order' && 'Track Order'}
                              {item.actionType === 'view_receipt' && 'View Receipt'}
                              {item.actionType === 'refill_now' && 'Refill Now'}
                              {item.actionType === 'view_adr' && 'Review ADR'}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                            title="Delete notification"
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

        {/* ── Detail Panel & Communication Guide ── */}
        <div className="space-y-5">
          {selectedItem ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Notification Details
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: #{selectedItem.id}
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
                      Sent {new Date(selectedItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>{selectedItem.message}</p>
                </div>

                {/* Metadata payload overview if available */}
                {selectedItem.actionPayload && Object.keys(selectedItem.actionPayload).length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Associated Reference
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(selectedItem.actionPayload).map(([key, val]) => (
                        <div key={key} className="truncate">
                          <span className="text-slate-400 capitalize">{key}: </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-channel audit status */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Multi-Channel Dispatch Posture
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">In-App Inbox</span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded">
                        DELIVERED
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex items-center justify-between">
                      <span className="text-blue-800 dark:text-blue-300 font-medium">Telecom SMS</span>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                        {selectedItem.channels.sms?.toUpperCase() || 'DELIVERED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deep-link Action Button */}
                {selectedItem.actionType !== 'none' && (
                  <button
                    onClick={() => handleActionClick(selectedItem)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Proceed to Relevant Module</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                Notification Categories
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ZenithRx guarantees multi-channel delivery across all 10 critical operational and clinical notification categories:
              </p>

              <div className="space-y-2 pt-2">
                {NOTIFICATION_CATEGORIES_META.map((meta) => (
                  <div
                    key={meta.category}
                    onClick={() => setSelectedCategory(meta.category)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                      selectedCategory === meta.category
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getCategoryIcon(meta.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {meta.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
