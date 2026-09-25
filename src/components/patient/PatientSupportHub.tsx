import React, { useState } from 'react';
import {
  customerSupportService,
  SupportTicket,
  TicketCategory,
  TICKET_CATEGORIES,
} from '../../services/customerSupportService';
import { PatientProfile } from '../../services/patientAuthService';
import {
  Headphones,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  Send,
  Star,
  Check,
  Truck,
  DollarSign,
  PackageX,
  UserX,
  HelpCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface PatientSupportHubProps {
  patient: PatientProfile | null;
  onOpenAuth: (mode: 'signin' | 'register', reason?: string) => void;
}

export const PatientSupportHub: React.FC<PatientSupportHubProps> = ({
  patient,
  onOpenAuth,
}) => {
  const patientIdentifier = patient?.phone || patient?.id || '+256 701 234 567';
  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    customerSupportService.getTicketsForPatient(patientIdentifier)
  );

  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newCategory, setNewCategory] = useState<TicketCategory>('order_delivery_delay');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOrderReference, setNewOrderReference] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');

  // Reply State
  const [replyMessage, setReplyMessage] = useState('');

  // Rating State
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshList = (newSelectedId?: string) => {
    const list = customerSupportService.getTicketsForPatient(patientIdentifier);
    setTickets([...list]);
    if (newSelectedId) {
      setSelectedTicketId(newSelectedId);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) {
      onOpenAuth('signin', 'Sign in to submit a support ticket');
      return;
    }
    if (!newSubject.trim() || !newDescription.trim()) return;

    const descWithOrder = newOrderReference.trim()
      ? `[Order / Transaction Ref: ${newOrderReference.trim()}]\n\n${newDescription.trim()}`
      : newDescription.trim();

    const created = customerSupportService.createTicket({
      pharmacyId: 'client-001',
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      category: newCategory,
      subject: newSubject.trim(),
      description: descWithOrder,
      attachmentFileNames: newAttachmentName.trim() ? [newAttachmentName.trim()] : undefined,
    });

    setIsCreateModalOpen(false);
    setNewSubject('');
    setNewDescription('');
    setNewOrderReference('');
    setNewAttachmentName('');
    refreshList(created.id);
    showToast(`Support Ticket ${created.ticketNumber} submitted. Our team is reviewing it.`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) {
      onOpenAuth('signin', 'Sign in to reply to support tickets');
      return;
    }
    if (!replyMessage.trim() || !activeTicket) return;

    customerSupportService.addResponse(activeTicket.id, {
      senderType: 'patient',
      senderId: patient.id,
      senderName: patient.fullName,
      senderRole: 'Patient',
      message: replyMessage.trim(),
      isInternalNote: false,
    });

    setReplyMessage('');
    refreshList(activeTicket.id);
    showToast('Your message has been sent to the support desk.');
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    customerSupportService.submitSatisfactionRating(
      activeTicket.id,
      selectedRating,
      ratingFeedback.trim() || undefined
    );

    setHasSubmittedRating(true);
    refreshList(activeTicket.id);
    showToast('Thank you for rating our resolution!');
  };

  const getCategoryMeta = (cat: TicketCategory) => {
    return TICKET_CATEGORIES.find((c) => c.category === cat) || TICKET_CATEGORIES[0];
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'open':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'in_review':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'resolved':
      case 'closed':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
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
          <button onClick={() => setToastMessage(null)} className="text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold border border-white/20">
            <Headphones className="w-4 h-4 text-amber-300" />
            <span>Patient Support &amp; Complaints Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            How can our customer care team assist you today?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Track active complaints, report order delays, resolve payment deductions, or get assistance with deliveries.
            <em> Note: For clinical dosage and medical questions, please use the Clinical Consultation hub.</em>
          </p>
        </div>

        <button
          onClick={() => {
            if (!patient) {
              onOpenAuth('signin', 'Sign in to file a support request');
            } else {
              setIsCreateModalOpen(true);
            }
          }}
          className="px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Support Ticket</span>
        </button>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Patient Ticket History (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
              Your Support Inquiries ({tickets.length})
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Uganda SLA: &lt; 2h</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
                <Headphones className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>You have no open support tickets.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-3 text-xs text-blue-600 font-bold hover:underline"
                >
                  Create your first ticket
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const catMeta = getCategoryMeta(t.category);
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                        {t.ticketNumber}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(t.status)}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-1">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                      <span>{catMeta.label}</span>
                      <span className="font-mono">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Ticket Thread & Conversation (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
          {activeTicket ? (
            <>
              {/* Header */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                      {activeTicket.ticketNumber}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadge(activeTicket.status)}`}>
                      {activeTicket.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    Opened: {new Date(activeTicket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {activeTicket.subject}
                </h3>
              </div>

              {/* Initial Problem Statement */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Your Description
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {activeTicket.description}
                </p>
              </div>

              {/* Resolution Summary (If Resolved) */}
              {activeTicket.status === 'resolved' && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 space-y-3 text-xs text-emerald-950 dark:text-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-sm">Issue Marked as Resolved by Pharmacy Staff</h4>
                      <p className="text-[11px] opacity-80 mt-0.5">{activeTicket.resolutionSummary}</p>
                    </div>
                  </div>

                  {/* Rating Prompt */}
                  {!activeTicket.satisfactionRating && !hasSubmittedRating ? (
                    <form onSubmit={handleSubmitRating} className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 space-y-2">
                      <span className="font-bold text-[11px] block">How satisfied were you with this resolution?</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setSelectedRating(star)}
                            className="p-1 cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= selectedRating
                                  ? 'text-amber-500 fill-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ratingFeedback}
                          onChange={(e) => setRatingFeedback(e.target.value)}
                          placeholder="Optional comment (e.g. Quick and polite)..."
                          className="flex-1 p-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs"
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Submit Rating
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>You rated this resolution: {activeTicket.satisfactionRating || selectedRating} / 5 stars</span>
                    </div>
                  )}
                </div>
              )}

              {/* Threaded Message Replies */}
              <div className="space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
                  Staff Communication Trail
                </h4>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activeTicket.responses.filter((r) => !r.isInternalNote).length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                      A pharmacy support specialist is reviewing your case. Responses will appear here.
                    </div>
                  ) : (
                    activeTicket.responses
                      .filter((r) => !r.isInternalNote)
                      .map((resp) => (
                        <div
                          key={resp.id}
                          className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                            resp.senderType === 'patient'
                              ? 'bg-slate-100 dark:bg-slate-800 ml-8 mr-0'
                              : 'bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 mr-8 ml-0'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] opacity-75">
                            <span className="font-black">{resp.senderName} ({resp.senderRole || 'Care Team'})</span>
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

              {/* Reply Box */}
              {activeTicket.status !== 'closed' && (
                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type additional details or reply to support staff..."
                    className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Headphones className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Select a support ticket from the list to view updates.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Submit Ticket Modal ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Submit Customer Support Ticket
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.label} (SLA: &lt; {c.slaHours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Delivery rider delayed in Ntinda"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Order ID or Mobile Money Reference (Optional)
                </label>
                <input
                  type="text"
                  value={newOrderReference}
                  onChange={(e) => setNewOrderReference(e.target.value)}
                  placeholder="e.g. ORD-2026-9921 or MTN MoMo TID #998231"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Please describe what happened, timestamps, and how we can best assist you..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Attach Photo / Proof of Delivery (Optional)
                </label>
                <input
                  type="text"
                  value={newAttachmentName}
                  onChange={(e) => setNewAttachmentName(e.target.value)}
                  placeholder="e.g. damaged_package.jpg or receipt.pdf"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-xs transition-all"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
