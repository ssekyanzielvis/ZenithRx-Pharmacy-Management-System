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
  Sparkles,
  Smartphone,
  ShieldCheck,
  X,
  Radio,
  Layers,
  Clock,
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

  const resetFilters = () => {
    setSelectedFilter('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-16">
      {/* ── 1. Page Header Hero Section ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Bell className="w-7 h-7" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  Notification Center &amp; Clinical Inbox
                </h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{unreadCount} new</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Real-time clinical updates on prescription verification, dispensary packing, MoMo payments, courier OTP, and refill schedules.
              </p>
            </div>
          </div>

          {/* Right Action & Multi-channel Status */}
          <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-700">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>SMS &amp; WhatsApp Live</span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Chips & Search Command Bar ── */}
        <div className="pt-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
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
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  selectedFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Main Grid: Left Hub (Multi-Channel Delivery + Categories) & Right Activity Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Multi-Channel Delivery & Categories Hub (4-5 cols) ── */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card 1: Multi-Channel Delivery Guarantee (Moved to Left) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md space-y-4 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <h4 className="text-sm sm:text-base font-black text-white tracking-tight">Multi-Channel Delivery</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              ZenithRx guarantees instant failover across 3 notification rails so you never miss an urgent clinical notice or courier arrival.
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-semibold text-slate-100">In-App Realtime</span>
                </div>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="font-semibold text-slate-100">Telecom SMS (OTP)</span>
                </div>
                <span className="text-[10px] font-black text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-md uppercase tracking-wider border border-blue-500/30">
                  ENABLED
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
                  <span className="font-semibold text-slate-100">WhatsApp Receipts</span>
                </div>
                <span className="text-[10px] font-black text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-md uppercase tracking-wider border border-teal-500/30">
                  CONNECTED
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Category Filter Hub */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Notification Categories ({NOTIFICATION_CATEGORIES_META.length})
                </h3>
              </div>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Click any category below to filter alerts across clinical and operational events:
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {NOTIFICATION_CATEGORIES_META.map((meta) => {
                const isCatSelected = selectedCategory === meta.category;
                return (
                  <button
                    key={meta.category}
                    onClick={() =>
                      setSelectedCategory(isCatSelected ? 'all' : meta.category)
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCatSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getCategoryIcon(meta.category)}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {meta.label}
                      </span>
                    </div>

                    {isCatSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column: Activity Stream & Inspector (7-8 cols) ── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Activity Stream
              </h3>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
              </span>
            </div>

            {(selectedCategory !== 'all' || selectedFilter !== 'all' || searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Selected Notification Inspector (displayed above stream when an item is chosen) */}
          {selectedItem && (
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 rounded-3xl p-6 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Notification Details Inspector
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Close inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedItem.title}
                </h4>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedItem.message}
                </div>

                {selectedItem.actionPayload && Object.keys(selectedItem.actionPayload).length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Associated Reference Data
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(selectedItem.actionPayload).map(([key, val]) => (
                        <div key={key} className="truncate">
                          <span className="text-slate-400 capitalize">{key}: </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.actionType !== 'none' && (
                  <button
                    onClick={() => handleActionClick(selectedItem)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Proceed to Relevant Clinical Module</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {notifications.length === 0 ? (
            /* Spacious & Balanced Empty State */
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-10 sm:p-14 text-center shadow-xs space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  You're all caught up!
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  No notifications match your current filter. When a pharmacist validates your prescription, an order is dispatched with an OTP, or a refill is due, updates will appear here.
                </p>
              </div>

              {(selectedCategory !== 'all' || selectedFilter !== 'all' || searchQuery) && (
                <div className="pt-2">
                  <button
                    onClick={resetFilters}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Notification Cards List */
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
                  className={`p-6 sm:p-7 rounded-3xl border transition-all cursor-pointer relative space-y-4 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/30'
                      : !item.isRead
                      ? 'bg-white dark:bg-slate-900 border-slate-300/90 dark:border-slate-700 shadow-xs hover:border-emerald-400'
                      : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  {/* Unread Accent Bar */}
                  {!item.isRead && (
                    <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-emerald-500 rounded-r-full" />
                  )}

                  {/* Top Meta & Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border shadow-2xs ${
                          meta?.badgeBg || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {getCategoryIcon(item.category)}
                        <span>{meta?.label || item.category}</span>
                      </span>

                      {item.priority === 'urgent' && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 uppercase tracking-wider">
                          Urgent
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
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
                  </div>

                  {/* Content Row: Title & Message */}
                  <div className="space-y-1.5">
                    <h4
                      className={`text-base font-extrabold leading-snug ${
                        !item.isRead
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-800 dark:text-slate-200 font-bold'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Footer Row: Multi-Channel Delivery Badges & Quick Action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    {/* Channel delivery confirmations */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                      <span className="text-slate-400">Delivered:</span>
                      {item.channels.in_app && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/60 dark:border-emerald-800/60">
                          <Check className="w-3 h-3 text-emerald-600" /> In-App
                        </span>
                      )}
                      {item.channels.sms && (
                        <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md font-semibold border border-blue-200/60 dark:border-blue-800/60">
                          <Check className="w-3 h-3 text-blue-600" /> SMS
                        </span>
                      )}
                      {item.channels.whatsapp && (
                        <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md font-extrabold border border-emerald-300/60 dark:border-emerald-700/60">
                          <Check className="w-3 h-3 text-emerald-600" /> WhatsApp
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
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {item.actionType === 'view_prescription' && 'View Rx'}
                          {item.actionType === 'track_order' && 'Track Order'}
                          {item.actionType === 'view_receipt' && 'View Receipt'}
                          {item.actionType === 'refill_now' && 'Refill Now'}
                          {item.actionType === 'view_adr' && 'Review ADR'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
