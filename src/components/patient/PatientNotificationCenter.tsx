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
  ArrowLeft,
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
  onGoBack?: () => void;
}

export const PatientNotificationCenter: React.FC<PatientNotificationCenterProps> = ({
  patientPhoneOrId,
  patientName = 'Patient',
  onNavigateTab,
  onGoBack,
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
        return <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'delivery_dispatched':
        return <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'delivery_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'refill_reminder':
        return <RefreshCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'adr_update':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'system_announcement':
        return <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
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
    <div className="space-y-[1cm]" style={{ paddingTop: '1cm', paddingBottom: '1cm' }}>
      {/* ── 1. Page Header Hero Section ── */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
        style={{
          padding: '2rem 2.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          marginBottom: '1cm',
        }}
      >
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800"
          style={{ paddingBottom: '1.25rem' }}
        >
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
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Previous Page</span>
              </button>
            )}

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-700">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>SMS &amp; WhatsApp Live</span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Dropdown Selector & Search Command Bar ── */}
        <div
          className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-between items-stretch sm:items-center"
          style={{ paddingTop: '0.2rem' }}
        >
          {/* Notification Stream Filter Dropdown */}
          <div className="relative w-full sm:w-72 md:w-80">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-2xs"
            >
              <option value="all">🔔 All Updates</option>
              <option value="unread">📬 Unread Updates ({unreadCount})</option>
              <option value="clinical">📋 Prescriptions & Refills</option>
              <option value="orders">📦 Orders & Deliveries</option>
              <option value="safety">⚠️ ADR & Safety Notices</option>
              <option value="announcements">📢 System Announcements</option>
            </select>
          </div>

          {/* Search box with Centered Icon and Safe Left Padding */}
          <div className="relative w-full sm:flex-1 md:max-w-md flex items-center">
            <span className="absolute left-4 z-10 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search notifications by title, order ref, drug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }}
              className="w-full py-3 sm:py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 font-medium transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 z-10 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Main Grid: Left Hub (Multi-Channel Delivery + Categories) & Right Activity Stream ── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 items-start"
        style={{ marginTop: '1cm', gap: '1cm' }}
      >
        {/* ── Left Column: Multi-Channel Delivery & Categories Hub (4-5 cols) ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col" style={{ gap: '1cm' }}>
          {/* Card 1: Multi-Channel Delivery Guarantee */}
          <div
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 transition-colors duration-200"
            style={{ padding: '2rem 1.8rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Multi-Channel Delivery
                </h4>
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Instant Failover Guarantee
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              ZenithRx guarantees instant failover across 3 notification rails so you never miss an urgent clinical notice or courier arrival.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Row 1: In-App Realtime */}
              <div
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs hover:border-emerald-500/40 transition-all"
                style={{ padding: '0.9rem 1.1rem' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-100 dark:ring-emerald-950/80" />
                  <span className="font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 truncate">
                    In-App Realtime
                  </span>
                </div>
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/90 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0 leading-none">
                  ACTIVE
                </span>
              </div>

              {/* Row 2: Telecom SMS (OTP) */}
              <div
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs hover:border-blue-500/40 transition-all"
                style={{ padding: '0.9rem 1.1rem' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 ring-4 ring-blue-100 dark:ring-blue-950/80" />
                  <span className="font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 truncate">
                    Telecom SMS (OTP)
                  </span>
                </div>
                <span className="text-[10px] font-black text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/90 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-2xs shrink-0 leading-none">
                  ENABLED
                </span>
              </div>

              {/* Row 3: WhatsApp Receipts */}
              <div
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs hover:border-teal-500/40 transition-all"
                style={{ padding: '0.9rem 1.1rem' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 ring-4 ring-teal-100 dark:ring-teal-950/80" />
                  <span className="font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 truncate">
                    WhatsApp Receipts
                  </span>
                </div>
                <span className="text-[10px] font-black text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/90 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-teal-200 dark:border-teal-800 shadow-2xs shrink-0 leading-none">
                  CONNECTED
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Category Filter Hub */}
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs"
            style={{ padding: '2rem 1.8rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div
              className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: '0.9rem' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50 shadow-2xs">
                  <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Categories ({NOTIFICATION_CATEGORIES_META.length})
                  </h3>
                </div>
              </div>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Click any category below to filter alerts across clinical and operational events:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.2rem' }}>
              {NOTIFICATION_CATEGORIES_META.map((meta) => {
                const isCatSelected = selectedCategory === meta.category;
                return (
                  <button
                    key={meta.category}
                    onClick={() =>
                      setSelectedCategory(isCatSelected ? 'all' : meta.category)
                    }
                    className={`rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3.5 shadow-2xs hover:shadow-xs active:scale-98 ${isCatSelected
                        ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 shadow-xs ring-2 ring-emerald-500/30'
                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    style={{ padding: '0.85rem 1.1rem' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                        {getCategoryIcon(meta.category)}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {meta.label}
                      </span>
                    </div>

                    {isCatSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs ring-2 ring-emerald-200 dark:ring-emerald-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column: Activity Stream & Inspector (7-8 cols) ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col" style={{ gap: '1cm' }}>
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Activity Stream
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
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
            <div
              className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 rounded-3xl shadow-md animate-in fade-in"
              style={{
                padding: '2rem 2.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.4rem',
              }}
            >
              <div
                className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800"
                style={{ paddingBottom: '0.8rem' }}
              >
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Notification Details Inspector
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                  title="Close inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedItem.title}
                </h4>

                <div
                  className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
                  style={{ padding: '1.2rem 1.4rem' }}
                >
                  {selectedItem.message}
                </div>

                {selectedItem.actionPayload && Object.keys(selectedItem.actionPayload).length > 0 && (
                  <div
                    className="rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40"
                    style={{ padding: '1.1rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Associated Reference Data
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ marginTop: '0.4rem' }}
                  >
                    <span>Proceed to Relevant Clinical Module</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {notifications.length === 0 ? (
            /* Spacious & Balanced Empty State */
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl text-center shadow-xs"
              style={{
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
              }}
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '28rem' }}>
                <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  You're all caught up!
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  No notifications match your current filter. When a pharmacist validates your prescription, an order is dispatched with an OTP, or a refill is due, updates will appear here.
                </p>
              </div>

              {(selectedCategory !== 'all' || selectedFilter !== 'all' || searchQuery) && (
                <div style={{ paddingTop: '0.5rem' }}>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Notification Cards List with 1cm gap */
            <div className="flex flex-col" style={{ gap: '1cm' }}>
              {notifications.map((item) => {
                const meta = getCategoryMeta(item.category);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      if (!item.isRead) handleMarkAsRead(item.id);
                    }}
                    className={`rounded-3xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/25 dark:bg-emerald-950/25 shadow-md ring-2 ring-emerald-500/30'
                        : !item.isRead
                          ? 'bg-white dark:bg-slate-900 border-slate-300/90 dark:border-slate-700 shadow-xs hover:border-emerald-400 hover:shadow-sm'
                          : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300'
                    }`}
                    style={{
                      padding: '1.75rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                    }}
                  >
                    {/* Unread Accent Bar */}
                    {!item.isRead && (
                      <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-emerald-500 rounded-r-full shadow-xs" />
                    )}

                    {/* Top Meta & Badge Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-black px-3.5 py-1.5 rounded-xl border shadow-2xs leading-none shrink-0 ${
                            meta?.badgeBg || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {getCategoryIcon(item.category)}
                          <span>{meta?.label || item.category}</span>
                        </span>

                        {item.priority === 'urgent' && (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 uppercase tracking-wider leading-none shadow-2xs">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-bold shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <h4
                        className={`text-base sm:text-lg font-black tracking-tight leading-snug ${
                          !item.isRead
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        {item.message}
                      </p>
                    </div>

                    {/* Footer Row: Multi-Channel Delivery Badges & Quick Action */}
                    <div
                      className="border-t border-slate-100 dark:border-slate-800/80"
                      style={{
                        paddingTop: '1.1rem',
                        marginTop: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Channel delivery confirmations */}
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold flex-wrap">
                        <span className="text-slate-400 dark:text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                          Delivered:
                        </span>
                        {item.channels.in_app && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs leading-none">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>In-App</span>
                          </span>
                        )}
                        {item.channels.sms && (
                          <span className="inline-flex items-center gap-1.5 text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/70 px-3 py-1 rounded-xl text-xs font-bold border border-blue-200/80 dark:border-blue-800/80 shadow-2xs leading-none">
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>SMS</span>
                          </span>
                        )}
                        {item.channels.whatsapp && (
                          <span className="inline-flex items-center gap-1.5 text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/70 px-3 py-1 rounded-xl text-xs font-bold border border-teal-200/80 dark:border-teal-800/80 shadow-2xs leading-none">
                            <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span>WhatsApp</span>
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2.5">
                        {item.actionType !== 'none' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(item);
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer"
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
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Back Navigation */}
      {onGoBack && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Previous Page</span>
          </button>
        </div>
      )}
    </div>
  );
};
