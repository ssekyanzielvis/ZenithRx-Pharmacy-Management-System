import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Building2,
  User,
  Plus,
  RefreshCw,
  PhoneCall,
  CheckCheck
} from 'lucide-react';
import { AdminPharmacyMessage, ClientSubscription } from '../../types';
import {
  getDistinctThreads,
  getThreadMessages,
  sendAdminPharmacyMessage,
  markThreadAsRead,
} from '../../services/adminMessagingService';

interface AdminMessagingHubProps {
  clients?: ClientSubscription[];
  currentUserRole?: string; // 'super_admin' or 'pharmacy_staff'
  currentTenantId?: string;
  currentUserName?: string;
}

export const AdminMessagingHub: React.FC<AdminMessagingHubProps> = ({
  clients = [],
  currentUserRole = 'super_admin',
  currentTenantId,
  currentUserName = 'System Administrator',
}) => {
  const isAdmin = currentUserRole === 'super_admin';
  const [threads, setThreads] = useState<{ threadId: string; latestMessage: AdminPharmacyMessage; count: number; unreadCount: number }[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminPharmacyMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);

  // New Thread Form state
  const [newTargetTenantId, setNewTargetTenantId] = useState(clients[0]?.id || 'client-1');
  const [newSubject, setNewSubject] = useState('');
  const [newMessageBody, setNewMessageBody] = useState('');
  const [newCategory, setNewCategory] = useState<AdminPharmacyMessage['category']>('general');
  const [newPriority, setNewPriority] = useState<AdminPharmacyMessage['priority']>('normal');

  const loadThreads = () => {
    const list = getDistinctThreads(isAdmin ? undefined : currentTenantId);
    setThreads(list);
    if (!activeThreadId && list.length > 0) {
      setActiveThreadId(list[0].threadId);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [isAdmin, currentTenantId]);

  useEffect(() => {
    if (activeThreadId) {
      const msgs = getThreadMessages(activeThreadId);
      setMessages(msgs);
      markThreadAsRead(activeThreadId, isAdmin ? 'admin' : 'pharmacy');
    }
  }, [activeThreadId]);

  const handleSendReply = () => {
    if (!replyText.trim() || !activeThreadId) return;
    const currentThread = threads.find((t) => t.threadId === activeThreadId);
    const tenantId = currentThread?.latestMessage.tenantId || currentTenantId || 'client-1';
    const tenantName = currentThread?.latestMessage.tenantName || 'Pharmacy';

    sendAdminPharmacyMessage({
      threadId: activeThreadId,
      tenantId,
      tenantName,
      senderUserId: 'user-active',
      senderName: currentUserName,
      senderType: isAdmin ? 'admin' : 'pharmacy',
      recipientType: isAdmin ? 'pharmacy' : 'admin',
      subject: currentThread?.latestMessage.subject || 'Direct Inquiry',
      message: replyText.trim(),
      category: currentThread?.latestMessage.category || 'general',
      priority: currentThread?.latestMessage.priority || 'normal',
    });

    setReplyText('');
    const updatedMsgs = getThreadMessages(activeThreadId);
    setMessages(updatedMsgs);
    loadThreads();
  };

  const handleCreateNewThread = () => {
    if (!newSubject.trim() || !newMessageBody.trim()) return;

    const targetClient = clients.find((c) => c.id === newTargetTenantId);
    const tenantId = isAdmin ? newTargetTenantId : (currentTenantId || 'client-1');
    const tenantName = targetClient?.clientName || 'Pharmacy Branch';

    const newMsg = sendAdminPharmacyMessage({
      tenantId,
      tenantName,
      senderUserId: 'user-creator',
      senderName: currentUserName,
      senderType: isAdmin ? 'admin' : 'pharmacy',
      recipientType: isAdmin ? 'pharmacy' : 'admin',
      subject: newSubject.trim(),
      message: newMessageBody.trim(),
      category: newCategory,
      priority: newPriority,
    });

    setIsNewThreadModalOpen(false);
    setNewSubject('');
    setNewMessageBody('');
    setActiveThreadId(newMsg.threadId);
    loadThreads();
  };

  const applyQuickTemplate = (templateType: 'upgrade' | 'nda' | 'call' | 'resolved') => {
    if (templateType === 'upgrade') {
      setReplyText(
        'Based on your monthly transaction volume telemetry, we recommend transitioning to our Enterprise tier to unlock unthrottled dispensing, 50 staff seats, and dedicated NDA auto-auditing.'
      );
    } else if (templateType === 'nda') {
      setReplyText(
        'Please provide an updated copy of your Supervising Pharmacist annual PSU license registration and NDA premise inspection certificate for regulatory verification.'
      );
    } else if (templateType === 'call') {
      setReplyText(
        'Our Super Administrator has logged a direct phone call check-in with your pharmacy leadership regarding this matter.'
      );
    } else if (templateType === 'resolved') {
      setReplyText(
        'This issue has been thoroughly resolved and logged in the system security audit trail. Please let us know if you need any further assistance.'
      );
    }
  };

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.latestMessage.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.latestMessage.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.latestMessage.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.latestMessage.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeThread = threads.find((t) => t.threadId === activeThreadId);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col md:flex-row h-[750px]">
      {/* Left Sidebar: Threads List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50/50 dark:bg-slate-900/40">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              {isAdmin ? 'Pharmacy Messaging Hub' : 'System Admin Support Desk'}
            </h3>
            <button
              onClick={() => setIsNewThreadModalOpen(true)}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-sm flex items-center gap-1 text-xs font-bold"
              title="New Thread"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          </div>

          {/* Search & Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3 h-3" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="plan_upgrade">Plan Upgrades</option>
              <option value="compliance_nda">NDA Compliance</option>
              <option value="support">Technical Support</option>
              <option value="billing">Billing & Rate</option>
              <option value="escalation">Escalations</option>
            </select>
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-12 text-slate-400 px-4 text-xs">
              No messaging conversations found.
            </div>
          ) : (
            filteredThreads.map((t) => {
              const isSelected = t.threadId === activeThreadId;
              const msg = t.latestMessage;

              return (
                <div
                  key={t.threadId}
                  onClick={() => setActiveThreadId(t.threadId)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-l-4 border-l-emerald-600'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[190px]">
                      {isAdmin ? msg.tenantName : msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mb-1">
                    {msg.subject}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {msg.message}
                  </p>

                  <div className="flex items-center justify-between gap-1 mt-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                      {msg.category.replace('_', ' ')}
                    </span>

                    {t.unreadCount > 0 && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {t.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {activeThread.latestMessage.subject}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    activeThread.latestMessage.priority === 'urgent'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : activeThread.latestMessage.priority === 'high'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {activeThread.latestMessage.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pharmacy: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeThread.latestMessage.tenantName}</span> • Thread ID: <span className="font-mono">{activeThread.threadId}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCheck className="w-4 h-4" /> End-to-End Audited
                </span>
              </div>
            </div>

            {/* Messages Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/20">
              {messages.map((m) => {
                const isMyMessage = (isAdmin && m.senderType === 'admin') || (!isAdmin && m.senderType === 'pharmacy');

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{m.senderName}</span>
                      <span>({m.senderType === 'admin' ? 'System Administrator' : 'Pharmacy Staff'})</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMyMessage
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-600 shadow-sm'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Response Templates (Admin view) */}
            {isAdmin && (
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Fast Templates:
                </span>
                <button
                  onClick={() => applyQuickTemplate('upgrade')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-all whitespace-nowrap"
                >
                  Plan Upgrade Proposal
                </button>
                <button
                  onClick={() => applyQuickTemplate('nda')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-all whitespace-nowrap"
                >
                  NDA License Request
                </button>
                <button
                  onClick={() => applyQuickTemplate('call')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-all whitespace-nowrap"
                >
                  Direct Call Log
                </button>
                <button
                  onClick={() => applyQuickTemplate('resolved')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-all whitespace-nowrap"
                >
                  Resolution Log
                </button>
              </div>
            )}

            {/* Input Composer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-800">
              <input
                type="text"
                placeholder={isAdmin ? "Type reply to pharmacy..." : "Type message to System Administrator..."}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Select a Conversation Thread</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Choose a message from the sidebar or initiate a new inquiry to message pharmacies or system administrators.
            </p>
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      {isNewThreadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" /> Start New Conversation Thread
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct encrypted channel between Pharmacy and System Administration
                </p>
              </div>
              <button
                onClick={() => setIsNewThreadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {isAdmin && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Pharmacy</label>
                <select
                  value={newTargetTenantId}
                  onChange={(e) => setNewTargetTenantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} ({c.packageTier} Plan)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="general">General Support</option>
                  <option value="plan_upgrade">Plan Upgrade</option>
                  <option value="compliance_nda">NDA Compliance</option>
                  <option value="billing">Billing & Renewal</option>
                  <option value="escalation">Urgent Escalation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
              <input
                type="text"
                placeholder="Brief summary of inquiry..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Message</label>
              <textarea
                rows={4}
                placeholder="Provide detailed information..."
                value={newMessageBody}
                onChange={(e) => setNewMessageBody(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsNewThreadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewThread}
                disabled={!newSubject.trim() || !newMessageBody.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Start Thread
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
