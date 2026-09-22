import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  CheckCheck,
  Clock
} from 'lucide-react';
import { SystemNotification, ModuleTab } from '../types';
import {
  getSystemNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
} from '../services/notificationService';

interface SystemNotificationBellProps {
  tenantId?: string;
  userId?: string;
  userRole?: string;
  onNavigateTab?: (tab: ModuleTab) => void;
}

export const SystemNotificationBell: React.FC<SystemNotificationBellProps> = ({
  tenantId,
  userId,
  userRole,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    const list = getSystemNotifications({ tenantId, userId });
    setNotifications(list);
    setUnreadCount(getUnreadNotificationsCount(tenantId, userId));
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [tenantId, userId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(tenantId, userId);
    loadNotifications();
  };

  const handleNotificationClick = (n: SystemNotification) => {
    markNotificationAsRead(n.id);
    loadNotifications();
    if (n.actionUrl && onNavigateTab) {
      onNavigateTab(n.actionUrl as ModuleTab);
      setIsOpen(false);
    }
  };

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'upgrade_recommendation':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'compliance_notice':
        return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        title="System Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                System Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1 opacity-70" />
                No system alerts or notices.
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all flex gap-3 items-start ${
                    !n.isRead ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h5 className={`text-xs font-bold leading-tight ${
                        !n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {n.title}
                      </h5>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {n.actionUrl && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold flex items-center gap-0.5">
                          Open <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
