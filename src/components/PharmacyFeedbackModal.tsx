import React, { useState, useEffect } from 'react';
import { ClientSubscription, PharmacyFeedbackTicket, TierName } from '../types';
import {
  getTicketsForClient,
  submitPharmacyFeedback,
} from '../services/feedbackService';
import {
  MessageSquarePlus,
  Send,
  CheckCircle2,
  Clock,
  MessageCircle,
  X,
  AlertTriangle,
  Sparkles,
  Building2,
  Mail,
  Phone,
  Tag,
  ShieldCheck,
  Lock,
  ArrowRight
} from 'lucide-react';

interface PharmacyFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClient: ClientSubscription;
  onActivatePlan?: (tier: TierName) => void;
  initialTab?: 'submit' | 'history';
}

export const PharmacyFeedbackModal: React.FC<PharmacyFeedbackModalProps> = ({
  isOpen,
  onClose,
  activeClient,
  onActivatePlan,
  initialTab = 'submit',
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>(initialTab);
  const [tickets, setTickets] = useState<PharmacyFeedbackTicket[]>([]);

  // Form State
  const [category, setCategory] = useState<PharmacyFeedbackTicket['category']>('General Feedback');
  const [urgency, setUrgency] = useState<PharmacyFeedbackTicket['urgency']>('Normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(activeClient.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(activeClient.contactPhone || '');
  const [submitting, setSubmitting] = useState(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Check if subscription plan is active
  const isSubscriptionActive = activeClient.billingStatus === 'Active' || activeClient.billingStatus === 'Pending Renewal' || activeClient.billingStatus === 'Grace Period';

  const loadTickets = () => {
    const list = getTicketsForClient(activeClient.id);
    setTickets(list);
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadTickets();
      setContactEmail(activeClient.contactEmail || '');
      setContactPhone(activeClient.contactPhone || '');
    }
  }, [isOpen, activeClient, initialTab]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert('Please enter a subject and message for your feedback.');
      return;
    }

    setSubmitting(true);

    const created = submitPharmacyFeedback({
      clientId: activeClient.id,
      clientName: activeClient.clientName,
      contactEmail: contactEmail || activeClient.contactEmail,
      contactPhone: contactPhone || activeClient.contactPhone,
      category,
      urgency,
      subject,
      message,
    });

    setSubmitting(false);
    setSuccessNotification(`Feedback ticket ${created.id} sent to System Admin!`);
    
    // Reset form
    setSubject('');
    setMessage('');
    loadTickets();

    setTimeout(() => {
      setSuccessNotification(null);
      setActiveTab('history');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0B1E36] rounded-3xl border border-[#1E3B63] shadow-2xl max-w-2xl w-full overflow-hidden text-white relative flex flex-col">
        
        {/* Modal Header Bar */}
        <div className="p-5 border-b border-[#1E3B63] bg-[#071629] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-slate-950 shadow-md">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Pharmacy Support Desk</span>
              <h3 className="text-lg font-black text-white">Send Feedback to ZenithRx Admin</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IF PLAN IS NOT ACTIVE: SHOW PLAN ACTIVATION REQUIRED LOCK SCREEN */}
        {!isSubscriptionActive ? (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest">
                Subscription Plan Activation Required
              </span>
              <h3 className="text-xl font-black text-white">Unlock Pharmacy Support &amp; Admin Desk</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The <strong>Pharmacy Support &amp; Feedback Desk</strong> is reserved for pharmacies on an active plan. Select and activate a plan below to send feedback, request priority technical assistance, and receive official admin responses.
              </p>
            </div>

            {/* Quick Plan Activation Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              
              {/* Starter Plan */}
              <div className="bg-[#071629] p-4 rounded-2xl border border-sky-900/60 hover:border-cyan-400/80 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest">Starter Package</span>
                  <h4 className="text-base font-black text-white mt-0.5">UGX 40,000<span className="text-xs text-slate-400 font-normal">/mo</span></h4>
                  <p className="text-[11px] text-slate-400 mt-1">Dispensary sales, POS receipting &amp; support desk.</p>
                </div>
                <button
                  onClick={() => {
                    if (onActivatePlan) onActivatePlan('Starter');
                  }}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Activate Starter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Professional Plan */}
              <div className="bg-[#0F2847] p-4 rounded-2xl border border-cyan-500/50 hover:border-cyan-300 transition-all flex flex-col justify-between space-y-3 shadow-lg relative">
                <span className="absolute -top-2.5 right-3 bg-cyan-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  Most Popular
                </span>
                <div>
                  <span className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-widest">Professional Package</span>
                  <h4 className="text-base font-black text-white mt-0.5">UGX 100,000<span className="text-xs text-slate-400 font-normal">/mo</span></h4>
                  <p className="text-[11px] text-slate-300 mt-1">Prescription AI OCR, automated POs &amp; support desk.</p>
                </div>
                <button
                  onClick={() => {
                    if (onActivatePlan) onActivatePlan('Professional');
                  }}
                  className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Activate Professional</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-[#1A122E] p-4 rounded-2xl border border-purple-900/60 hover:border-purple-400 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-widest">Enterprise Package</span>
                  <h4 className="text-base font-black text-white mt-0.5">UGX 220,000<span className="text-xs text-slate-400 font-normal">/mo</span></h4>
                  <p className="text-[11px] text-slate-400 mt-1">Uganda NDA Registry sync &amp; priority admin channel.</p>
                </div>
                <button
                  onClick={() => {
                    if (onActivatePlan) onActivatePlan('Enterprise');
                  }}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Activate Enterprise</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation inside Modal */}
            <div className="px-6 pt-4 bg-[#071629] border-b border-[#1E3B63] flex items-center gap-3">
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'submit'
                    ? 'border-cyan-400 text-cyan-300 bg-[#0B1E36]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit New Feedback</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-cyan-400 text-cyan-300 bg-[#0B1E36]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ticket History &amp; Admin Replies</span>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] px-1.5 py-0.2 rounded-full border border-sky-500/30">
                  {tickets.length}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              
              {/* Success Alert Banner */}
              {successNotification && (
                <div className="bg-emerald-500 text-white p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce shadow-lg">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successNotification}</span>
                </div>
              )}

              {/* ── TAB 1: SUBMIT FEEDBACK FORM ── */}
              {activeTab === 'submit' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Branch & Contact Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#071629] p-3.5 rounded-2xl border border-sky-900/40">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-cyan-400" />
                        Pharmacy Client Branch
                      </label>
                      <p className="text-xs font-black text-white mt-0.5">{activeClient.clientName}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Subscription Tier
                      </label>
                      <p className="text-xs font-bold text-sky-300 mt-0.5">{activeClient.packageTier} Package (Active)</p>
                    </div>
                  </div>

                  {/* Category & Urgency Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Feedback Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#071629] border border-sky-900/60 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="General Feedback">General Feedback</option>
                        <option value="Bug Report">Bug Report</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="Billing Inquiry">Billing Inquiry</option>
                        <option value="NDA Compliance">NDA Compliance</option>
                        <option value="Performance">System Performance</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Urgency Level</label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#071629] border border-sky-900/60 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="Normal">Normal Urgency</option>
                        <option value="High Priority">High Priority</option>
                        <option value="Critical">Critical Issue</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Subject / Summary</label>
                    <input
                      type="text"
                      placeholder="Brief summary of your feedback or inquiry..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#071629] border border-sky-900/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Detailed Message / Feedback</label>
                    <textarea
                      rows={4}
                      placeholder="Describe your issue, feature suggestion, or question in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#071629] border border-sky-900/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                      required
                    />
                  </div>

                  {/* Contact Email & Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Reply Contact Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#071629] border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Reply Contact Phone</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#071629] border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Sending Ticket...' : 'Send Feedback to System Admin'}</span>
                    </button>
                  </div>

                </form>
              )}

              {/* ── TAB 2: TICKET HISTORY & ADMIN REPLIES ── */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {tickets.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-2 bg-[#071629] rounded-2xl border border-sky-900/30">
                      <MessageCircle className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs font-bold">No feedback tickets submitted yet.</p>
                      <p className="text-[11px] text-slate-500">Submit a ticket in the first tab to communicate directly with System Admin.</p>
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <div
                        key={t.id}
                        className="bg-[#071629] rounded-2xl p-4 border border-sky-900/40 space-y-3 shadow-md"
                      >
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{t.id}</span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full border ${
                                t.status === 'Resolved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : t.status === 'In Progress'
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {t.status}
                              </span>
                              <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.2 rounded-full font-semibold">
                                {t.category}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white mt-1">{t.subject}</h4>
                          </div>

                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{t.dateSubmitted}</span>
                        </div>

                        {/* Pharmacy Submitted Message */}
                        <div className="bg-[#0E2542] p-3 rounded-xl border border-sky-900/30 text-xs text-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Your Submitted Feedback:</p>
                          <p className="leading-relaxed">{t.message}</p>
                        </div>

                        {/* Admin Reply Box */}
                        {t.adminReply ? (
                          <div className="bg-gradient-to-r from-[#0C2D4A] to-[#12385C] p-3.5 rounded-xl border border-cyan-500/40 text-xs space-y-1.5 shadow-inner">
                            <div className="flex items-center justify-between text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-cyan-400" />
                                Admin Official Response — {t.adminReply.repliedBy}
                              </span>
                              <span className="text-slate-400 font-semibold">{t.adminReply.dateReplied}</span>
                            </div>
                            <p className="text-white text-xs leading-relaxed font-medium pt-1">
                              "{t.adminReply.replyMessage}"
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-medium pt-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Awaiting reply from ZenithRx System Administration...</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1E3B63] bg-[#071629] flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Quantum Networks Support Desk • Live Admin Response</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
