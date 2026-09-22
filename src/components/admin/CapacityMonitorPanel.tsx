import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Send,
  PhoneCall,
  Mail,
  Bell,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Phone,
  RefreshCw,
  Info
} from 'lucide-react';
import { ClientSubscription, CapacityAlert, TenantCapacityMetrics, NotificationChannel } from '../../types';
import { getAllTenantsCapacity, getCapacityAlerts, acknowledgeAlert, resolveAlert, evaluateCapacityAlerts } from '../../services/capacityService';
import { dispatchMultiChannelNotification, getNotificationDeliveryLogs, NotificationDeliveryRecord } from '../../services/notificationService';

interface CapacityMonitorPanelProps {
  clients: ClientSubscription[];
  onNavigateTab?: (tab: any) => void;
}

export const CapacityMonitorPanel: React.FC<CapacityMonitorPanelProps> = ({ clients, onNavigateTab }) => {
  const [metrics, setMetrics] = useState<TenantCapacityMetrics[]>([]);
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<NotificationDeliveryRecord[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [dispatchChannels, setDispatchChannels] = useState<Record<NotificationChannel, boolean>>({
    in_system: true,
    email: true,
    phone: false,
    admin_call: false,
  });
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [targetTenant, setTargetTenant] = useState<ClientSubscription | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    setIsRefreshing(true);
    const m = getAllTenantsCapacity();
    setMetrics(m);
    
    // Evaluate alerts
    m.forEach((metric) => evaluateCapacityAlerts(metric));
    
    setAlerts(getCapacityAlerts());
    setDeliveryLogs(getNotificationDeliveryLogs());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadData();
  }, [clients]);

  const handleOpenDispatchModal = (client: ClientSubscription, defaultAlert?: CapacityAlert) => {
    setTargetTenant(client);
    setCustomSubject(
      defaultAlert
        ? `ZenithRx Capacity Warning: ${defaultAlert.metric.toUpperCase()} limit at ${defaultAlert.usagePercent}%`
        : `Advance Capacity & Plan Upgrade Notification for ${client.clientName}`
    );
    setCustomMessage(
      `Dear ${client.clientName} Management,\n\nOur automated telemetry indicates your current ${client.packageTier} subscription is approaching peak volume thresholds. To ensure uninterrupted dispensing and staff access, we recommend upgrading to ${defaultAlert?.recommendedTier || 'Enterprise'} plan before next renewal.\n\nPlease reply directly to this notification or contact our support desk.`
    );
    setIsDispatchModalOpen(true);
  };

  const handleSendNotification = () => {
    if (!targetTenant) return;

    const channels: NotificationChannel[] = (
      Object.keys(dispatchChannels) as NotificationChannel[]
    ).filter((c) => dispatchChannels[c]);

    if (channels.length === 0) {
      alert('Please select at least one notification channel.');
      return;
    }

    dispatchMultiChannelNotification(
      targetTenant.id,
      targetTenant.clientName,
      channels,
      customSubject,
      customMessage,
      targetTenant.contactPhone,
      targetTenant.contactEmail
    );

    setIsDispatchModalOpen(false);
    setFeedbackMsg(`Upgrade notification dispatched to ${targetTenant.clientName} via ${channels.join(', ')}.`);
    loadData();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId, 'Acknowledged by System Administrator.');
    loadData();
  };

  const handleResolve = (alertId: string) => {
    resolveAlert(alertId);
    loadData();
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'acknowledged');
  const sortedMetrics = [...metrics].sort((a, b) => b.overallUsagePercent - a.overallUsagePercent);

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-xl text-red-600 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Alerts</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{activeAlerts.length}</h3>
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Require admin review</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upgrade Recommendations</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {metrics.filter((m) => m.recommendedTier).length}
            </h3>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Heaviest pharmacies</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notices Dispatched</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{deliveryLogs.length}</h3>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Multi-channel delivery</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Capacity Health</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">99.4%</h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">System headroom OK</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Grid: Real-time Capacity Rankings & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ranked Tenants by Capacity Usage */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" /> Real-time Pharmacy Capacity Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ranked by overall system resource utilization (staff accounts, drug items, prescriptions, transactions)
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {sortedMetrics.map((m) => {
              const client = clients.find((c) => c.id === m.tenantId);
              const isHeavy = m.overallUsagePercent >= 75;

              return (
                <div
                  key={m.tenantId}
                  className={`p-4 rounded-xl border transition-all ${
                    isHeavy
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{m.tenantName}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {m.currentTier}
                        </span>
                        {m.recommendedTier && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Upgrade to {m.recommendedTier}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Staff: <span className="font-semibold">{m.staffCount}/{m.staffLimit}</span> • Drugs: <span className="font-semibold">{m.drugsCount}/{m.drugsLimit}</span> • Rx: <span className="font-semibold">{m.prescriptionsCount}/{m.prescriptionsLimit}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${
                        m.overallUsagePercent >= 85 ? 'text-red-600 dark:text-red-400' : m.overallUsagePercent >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {m.overallUsagePercent}%
                      </span>
                      {client && (
                        <button
                          onClick={() => handleOpenDispatchModal(client)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" /> Notify Upgrade
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.overallUsagePercent >= 85 ? 'bg-red-500' : m.overallUsagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(m.overallUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Capacity Alerts Queue */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Alerts & Action Queue
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
              {activeAlerts.length} Pending
            </span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-medium">All pharmacies within plan capacity limits.</p>
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const client = clients.find((c) => c.id === alert.tenantId);

                return (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/30 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{alert.tenantName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-bold text-red-700 dark:text-red-300 uppercase">
                            {alert.metric} {alert.usagePercent}% Used
                          </span>
                          <span className="text-[11px] text-slate-400">({alert.currentValue}/{alert.maxLimit})</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {alert.alertType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      Recommended: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{alert.recommendedTier || 'Enterprise Plan'}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-red-100 dark:border-red-900/40">
                      {client && (
                        <button
                          onClick={() => handleOpenDispatchModal(client, alert)}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-200 transition-all flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Advance Notice
                        </button>
                      )}

                      <div className="flex items-center gap-1">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                          >
                            Ack
                          </button>
                        )}
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                        >
                          Resolve
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

      {/* Multi-Channel Notification Dispatch Modal */}
      {isDispatchModalOpen && targetTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" /> Dispatch Advance Upgrade Notice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Target Pharmacy: <span className="font-semibold text-slate-700 dark:text-slate-200">{targetTenant.clientName}</span> ({targetTenant.packageTier} Plan)
                </p>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Channel Checkboxes */}
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Select Dispatch Channels (4 Supported)
              </label>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={dispatchChannels.in_system}
                    onChange={(e) => setDispatchChannels({ ...dispatchChannels, in_system: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <Bell className="w-3.5 h-3.5 text-blue-500" /> In-App Notification
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={dispatchChannels.email}
                    onChange={(e) => setDispatchChannels({ ...dispatchChannels, email: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-amber-500" /> Pharmacy Email
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={dispatchChannels.phone}
                    onChange={(e) => setDispatchChannels({ ...dispatchChannels, phone: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> Pharmacy Phone / SMS
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={dispatchChannels.admin_call}
                    onChange={(e) => setDispatchChannels({ ...dispatchChannels, admin_call: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <PhoneCall className="w-3.5 h-3.5 text-red-500" /> Direct Admin Call Log
                </label>
              </div>
            </div>

            {/* Notice Subject */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notice Title</label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Notice Body */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Message Content</label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch History Audit Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" /> Multi-Channel Upgrade Notification Audit Trail
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Pharmacy</th>
                <th className="pb-2 font-medium">Channel</th>
                <th className="pb-2 font-medium">Recipient Target</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deliveryLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    No upgrade alerts dispatched yet.
                  </td>
                </tr>
              ) : (
                deliveryLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-2.5 font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-white">{log.tenantName}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                        {log.channel.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300">{log.recipient}</td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">{log.subject}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
