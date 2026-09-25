import React, { useState } from 'react';
import {
  customerSupportService,
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketResolutionAction,
  TICKET_CATEGORIES,
} from '../services/customerSupportService';
import { formatUGX } from '../services/formatters';
import {
  Headphones,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Paperclip,
  Send,
  Lock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Truck,
  DollarSign,
  PackageX,
  UserX,
  HelpCircle,
  Star,
  ExternalLink,
  Tag,
  ArrowUpRight,
  CheckCircle,
} from 'lucide-react';

interface CustomerSupportDeskConsoleProps {
  currentStaffName?: string;
  currentStaffRole?: string;
}

const STAFF_MEMBERS = [
  { id: 'stf-001', name: 'Dr. Arthur Ssenabulya', role: 'Supervising Pharmacist' },
  { id: 'stf-002', name: 'Sarah Namubiru', role: 'Customer Support & Billing Agent' },
  { id: 'stf-003', name: 'Dr. Ronald Mukasa', role: 'Clinical Pharmacist' },
  { id: 'stf-004', name: 'Dennis Ochieng', role: 'Logistics & Courier Lead' },
];

export const CustomerSupportDeskConsole: React.FC<CustomerSupportDeskConsoleProps> = ({
  currentStaffName = 'Sarah Namubiru',
  currentStaffRole = 'Customer Support & Billing Agent',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'all'>('all');

  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    customerSupportService.getAllTickets()
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');

  // Reply Input State
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyStatusUpdate, setReplyStatusUpdate] = useState<TicketStatus | undefined>();

  // Resolution Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<TicketResolutionAction>('guidance_provided');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionReference, setResolutionReference] = useState('');
  const [resolutionPatientNote, setResolutionPatientNote] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshList = (newSelectedId?: string) => {
    const list = customerSupportService.getAllTickets();
    setTickets([...list]);
    if (newSelectedId) {
      setSelectedTicketId(newSelectedId);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  const analytics = customerSupportService.getAnalytics();

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    customerSupportService.addResponse(activeTicket.id, {
      senderType: 'staff',
      senderName: currentStaffName,
      senderRole: currentStaffRole,
      message: replyMessage.trim(),
      isInternalNote,
      updateStatus: replyStatusUpdate,
    });

    setReplyMessage('');
    setIsInternalNote(false);
    setReplyStatusUpdate(undefined);
    refreshList(activeTicket.id);
    showToast(isInternalNote ? 'Internal note added to case file' : 'Response dispatched to patient');
  };

  const handleAssign = (staffId: string) => {
    const staff = STAFF_MEMBERS.find((s) => s.id === staffId);
    if (!staff || !activeTicket) return;

    customerSupportService.assignStaff(activeTicket.id, staff);
    refreshList(activeTicket.id);
    showToast(`Case reassigned to ${staff.name}`);
  };

  const handleStatusChange = (status: TicketStatus) => {
    if (!activeTicket) return;
    customerSupportService.updateStatus(activeTicket.id, status, currentStaffName);
    refreshList(activeTicket.id);
    showToast(`Status updated to "${status.toUpperCase()}"`);
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    if (!activeTicket) return;
    customerSupportService.updatePriority(activeTicket.id, priority);
    refreshList(activeTicket.id);
    showToast(`Priority adjusted to "${priority.toUpperCase()}"`);
  };

  const handleCompleteResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !resolutionSummary.trim()) return;

    customerSupportService.resolveTicket(activeTicket.id, {
      resolutionSummary: resolutionSummary.trim(),
      resolutionActionTaken: resolutionAction,
      resolutionReference: resolutionReference.trim() || undefined,
      staffName: currentStaffName,
      staffRole: currentStaffRole,
      notifyPatientMessage: resolutionPatientNote.trim() || undefined,
    });

    setIsResolveModalOpen(false);
    setResolutionSummary('');
    setResolutionReference('');
    setResolutionPatientNote('');
    refreshList(activeTicket.id);
    showToast(`Ticket ${activeTicket.ticketNumber} marked as RESOLVED`);
  };

  const filteredTickets = tickets.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.patientName.toLowerCase().includes(q) ||
        t.patientPhone.includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryMeta = (cat: TicketCategory) => {
    return TICKET_CATEGORIES.find((c) => c.category === cat) || TICKET_CATEGORIES[0];
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'critical_urgent':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
      case 'high':
        return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300';
      case 'medium':
        return 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-300';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'open':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200';
      case 'in_review':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200';
      case 'escalated':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200';
      case 'pending_patient_response':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200';
      case 'closed':
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 flex items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs font-bold text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5" />
              Customer Support &amp; Complaints Desk
            </span>
            <span className="text-xs font-semibold text-slate-500">Non-Clinical Patient Care &amp; Service SLA</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Patient Support Tickets &amp; Service Complaints
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Resolve delivery delays, Mobile Money billing disputes, damaged packaging, refill inquiries, and staff conduct complaints with full audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <User className="w-4 h-4 text-emerald-600" />
          <span>On-Duty Agent: <strong>{currentStaffName}</strong></span>
        </div>
      </div>

      {/* SLA & KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Open</span>
            <Headphones className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{analytics.open}</div>
          <span className="text-[11px] text-slate-400">Needs agent response</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Escalated</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{analytics.escalated}</div>
          <span className="text-[11px] text-slate-400">Manager review</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Resolved Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{analytics.resolved}</div>
          <span className="text-[11px] text-slate-400">Case closed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">CSAT Score</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{analytics.avgCsat} / 5.0</div>
          <span className="text-[11px] text-slate-400">Patient satisfaction</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">SLA Breach Risk</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{analytics.breachedSla}</div>
          <span className="text-[11px] text-slate-400">Target response &lt; 2h</span>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Tickets Queue List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket #, patient name, phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-emerald-500"
            />
          </div>

          {/* Category & Status Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="all">All Categories</option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ticket Queue Cards */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Headphones className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No support tickets match the filters.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const catMeta = getCategoryMeta(t.category);
                const isSelected = t.id === selectedTicketId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs ring-2 ring-blue-400/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">
                          {t.ticketNumber}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(t.status)}`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${getPriorityBadge(t.priority)}`}>
                        {t.priority.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-2 line-clamp-1">
                      {t.subject}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {t.patientName}
                      </span>
                      <span className="font-mono">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Detail & Thread Workspace (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
          {activeTicket ? (
            <>
              {/* Ticket Top Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                      {activeTicket.ticketNumber}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadge(activeTicket.status)}`}>
                      {activeTicket.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${getPriorityBadge(activeTicket.priority)}`}>
                      {activeTicket.priority.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {getCategoryMeta(activeTicket.category).label}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-1.5">
                    {activeTicket.subject}
                  </h3>
                </div>

                {/* Resolve Button & Action Drawer */}
                <div className="flex items-center gap-2">
                  {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' ? (
                    <button
                      onClick={() => setIsResolveModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolve Case</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-xs bg-emerald-50 dark:bg-emerald-950 p-2 rounded-xl border border-emerald-200">
                      <CheckCircle className="w-4 h-4" />
                      <span>Resolved ({activeTicket.resolutionActionTaken?.replace(/_/g, ' ')})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Profile & Assignment Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Patient Contact
                  </span>
                  <div className="font-extrabold text-slate-800 dark:text-slate-200">
                    {activeTicket.patientName}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <a href={`tel:${activeTicket.patientPhone}`} className="hover:underline font-mono">
                      {activeTicket.patientPhone}
                    </a>
                  </div>
                  {activeTicket.patientEmail && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-mono text-[11px]">{activeTicket.patientEmail}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Assigned Handler
                    </span>
                    <span className="text-[10px] text-purple-600 font-mono font-bold">
                      SLA: {new Date(activeTicket.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <select
                    value={activeTicket.assignedStaffId || ''}
                    onChange={(e) => handleAssign(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Assign Staff Member --</option>
                    {STAFF_MEMBERS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange('in_review')}
                      className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px]"
                    >
                      In Review
                    </button>
                    <button
                      onClick={() => handleStatusChange('escalated')}
                      className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px]"
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => handleStatusChange('pending_patient_response')}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]"
                    >
                      Awaiting Patient
                    </button>
                  </div>
                </div>
              </div>

              {/* Initial Incident Description */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Initial Patient Complaint / Statement
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeTicket.description}
                </p>

                {/* Evidence Attachments */}
                {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400">Attachments:</span>
                    {activeTicket.attachments.map((att) => (
                      <span
                        key={att.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1"
                      >
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        <span>{att.fileName}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolution Summary Card (If Resolved) */}
              {activeTicket.resolutionSummary && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-100">
                  <div className="flex items-center justify-between">
                    <strong className="font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Resolution Action: {activeTicket.resolutionActionTaken?.replace(/_/g, ' ').toUpperCase()}
                    </strong>
                    {activeTicket.resolutionReference && (
                      <span className="font-mono text-[10px] font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-200">
                        Ref: {activeTicket.resolutionReference}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{activeTicket.resolutionSummary}</p>
                </div>
              )}

              {/* Threaded Conversation Timeline */}
              <div className="space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">
                  Threaded Communication &amp; Internal Audit Notes ({activeTicket.responses.length})
                </h4>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {activeTicket.responses.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
                      No replies recorded yet. Type a response below to contact the patient or add an internal case note.
                    </div>
                  ) : (
                    activeTicket.responses.map((resp) => (
                      <div
                        key={resp.id}
                        className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                          resp.isInternalNote
                            ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                            : resp.senderType === 'patient'
                            ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 ml-0 mr-8'
                            : 'bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 ml-8 mr-0'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-75">
                          <span className="font-extrabold flex items-center gap-1">
                            {resp.isInternalNote && <Lock className="w-3 h-3 text-amber-600" />}
                            {resp.senderName} ({resp.senderRole || resp.senderType})
                          </span>
                          <span className="font-mono">
                            {new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{resp.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className={isInternalNote ? 'text-amber-600 font-black' : ''}>
                        {isInternalNote ? '🔒 Internal Staff Note (Hidden from Patient)' : 'Public Reply to Patient'}
                      </span>
                    </label>
                  </div>

                  <span className="text-[10px] text-slate-400">Press send to update thread</span>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Type internal investigation note (e.g. checked MoMo gateway / spoken with courier)...'
                        : `Write message to ${activeTicket.patientName}...`
                    }
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-medium ${
                      isInternalNote
                        ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-100'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                    required
                  />

                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Headphones className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Select a support ticket from the queue on the left to inspect details.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Resolve Ticket Modal ── */}
      {isResolveModalOpen && activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Resolve Ticket: {activeTicket.ticketNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteResolution} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Action Taken *
                </label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="guidance_provided">Guidance &amp; Clarification Provided</option>
                  <option value="refund_processed">Refund Processed (MoMo / Cash Reversal)</option>
                  <option value="replacement_dispatched">Replacement Medicine Package Dispatched</option>
                  <option value="delivery_expedited">Delivery Expedited / Fee Waived</option>
                  <option value="staff_coached">Internal Staff Coaching / Process Correction</option>
                  <option value="no_fault_found">Investigation Complete (No Fault Found)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={resolutionReference}
                  onChange={(e) => setResolutionReference(e.target.value)}
                  placeholder="e.g. REF-MOMO-90123 or ORD-REPLACE-441"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Case Resolution Summary *
                </label>
                <textarea
                  rows={2}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Detail the root cause and remedy applied for records and quality audit..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Closing Notification to Patient (Optional)
                </label>
                <textarea
                  rows={2}
                  value={resolutionPatientNote}
                  onChange={(e) => setResolutionPatientNote(e.target.value)}
                  placeholder="Message dispatched to the patient confirming resolution..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs transition-all"
                >
                  Confirm &amp; Close Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
