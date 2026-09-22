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
  const isSubscriptionActive =
    activeClient.billingStatus === 'Active' ||
    activeClient.billingStatus === 'Pending Renewal' ||
    activeClient.billingStatus === 'Grace Period';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn select-none overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full text-slate-900 dark:text-slate-100 relative flex flex-col max-h-[90vh] my-auto overflow-hidden">
        
        {/* Modal Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                Pharmacy Support Desk
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Send Feedback to ZenithRx Admin
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IF PLAN IS NOT ACTIVE: SHOW PLAN ACTIVATION REQUIRED LOCK SCREEN */}
        {!isSubscriptionActive ? (
          <div className="p-6 space-y-6 text-center overflow-y-auto flex-1 min-h-0">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Subscription Plan Activation Required
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Unlock Pharmacy Support &amp; Admin Desk
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                The <strong>Pharmacy Support &amp; Feedback Desk</strong> is reserved for pharmacies on an active plan. Select and activate a plan below to send feedback, request priority technical assistance, and receive official admin responses.
              </p>
            </div>

            {/* Quick Plan Activation Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {/* Starter Plan */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Starter Package</span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    UGX 40,000<span className="text-xs text-slate-400 font-normal">/mo</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">Dispensary sales, POS receipting &amp; support desk.</p>
                </div>
                <button
                  onClick={() => onActivatePlan && onActivatePlan('Starter')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Activate Starter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Professional Plan */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-emerald-500 hover:border-emerald-600 transition-all flex flex-col justify-between space-y-3 shadow-xs relative">
                <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                  Most Popular
                </span>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Professional Package</span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    UGX 100,000<span className="text-xs text-slate-400 font-normal">/mo</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">Prescription AI OCR, automated POs &amp; support desk.</p>
                </div>
                <button
                  onClick={() => onActivatePlan && onActivatePlan('Professional')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Activate Professional</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enterprise Package</span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    UGX 220,000<span className="text-xs text-slate-400 font-normal">/mo</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">Uganda NDA Registry sync &amp; priority admin channel.</p>
                </div>
                <button
                  onClick={() => onActivatePlan && onActivatePlan('Enterprise')}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Activate Enterprise</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Cards inside Modal */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'submit',
                    title: 'Submit New Feedback',
                    desc: 'Log feature requests, bug reports, workflow friction, or clinical UX feedback.',
                    icon: <Send className="w-4 h-4" />,
                    badge: 'Direct Dispatch',
                  },
                  {
                    id: 'history',
                    title: 'Ticket History & Admin Replies',
                    desc: 'Track ticket status, super admin responses, and resolution timelines in real-time.',
                    icon: <MessageCircle className="w-4 h-4" />,
                    badge: `${tickets.length} Tickets`,
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`p-3 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                        isActive
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>
                            {tab.icon}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                            {tab.badge}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold tracking-tight ${isActive ? 'text-emerald-950 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                          {tab.title}
                        </h4>
                        <p className={`text-[11px] mt-0.5 line-clamp-1 leading-relaxed ${isActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {tab.desc}
                        </p>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                        <span className={isActive ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'}>
                          {isActive ? 'Active Mode' : 'Switch Mode'}
                        </span>
                        <span className={isActive ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}>→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              
              {/* Success Alert Banner */}
              {successNotification && (
                <div className="bg-emerald-600 text-white p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successNotification}</span>
                </div>
              )}

              {/* ── TAB 1: SUBMIT FEEDBACK FORM ── */}
              {activeTab === 'submit' && (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  
                  {/* Branch & Contact Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Pharmacy Client Branch
                      </label>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{activeClient.clientName}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Subscription Tier
                      </label>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{activeClient.packageTier} Package (Active)</p>
                    </div>
                  </div>

                  {/* Category & Urgency Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Feedback Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Urgency Level</label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Normal">Normal Urgency</option>
                        <option value="High Priority">High Priority</option>
                        <option value="Critical">Critical Issue</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject / Summary</label>
                    <input
                      type="text"
                      placeholder="Brief summary of your feedback or inquiry..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Detailed Message / Feedback</label>
                    <textarea
                      rows={3}
                      placeholder="Describe your issue, feature suggestion, or question in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                      required
                    />
                  </div>

                  {/* Contact Email & Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Reply Contact Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Reply Contact Phone</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Sending Ticket...' : 'Send Feedback to System Admin'}</span>
                    </button>
                  </div>

                </form>
              )}

              {/* ── TAB 2: TICKET HISTORY & ADMIN REPLIES ── */}
              {activeTab === 'history' && (
                <div className="space-y-3.5">
                  {tickets.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <MessageCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No feedback tickets submitted yet.</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Submit a ticket in the first tab to communicate directly with System Admin.</p>
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs"
                      >
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t.id}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${
                                t.status === 'Resolved'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : t.status === 'In Progress'
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              }`}>
                                {t.status}
                              </span>
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-2 py-0.2 rounded-full font-semibold">
                                {t.category}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{t.subject}</h4>
                          </div>

                          <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">{t.dateSubmitted}</span>
                        </div>

                        {/* Pharmacy Submitted Message */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Your Submitted Feedback:</p>
                          <p className="leading-relaxed">{t.message}</p>
                        </div>

                        {/* Admin Reply Box */}
                        {t.adminReply ? (
                          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5 shadow-xs">
                            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                Admin Official Response — {t.adminReply.repliedBy}
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{t.adminReply.dateReplied}</span>
                            </div>
                            <p className="text-slate-900 dark:text-slate-100 text-xs leading-relaxed font-medium pt-1">
                              "{t.adminReply.replyMessage}"
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
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
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="text-[11px]">Quantum Networks Support Desk • Live Admin Response</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
