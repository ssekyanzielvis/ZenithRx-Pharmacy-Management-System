import React, { useState, useEffect } from 'react';
import {
  getQueueTickets,
  getQueueCategories,
  getQueueMetrics,
  issueNewQueueTicket,
  callQueueTicket,
  startConsultationSession,
  completeConsultationSession,
  updateTicketStatus,
  QueueTicket,
  PharmacyQueueCategory,
  QueueSummaryMetrics,
  PriorityLevel,
  CheckInChannel
} from '../services/physicalQueueService';
import {
  Users,
  Clock,
  Volume2,
  Stethoscope,
  PlusCircle,
  Tv,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  UserCheck,
  Search,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Pill,
  HeartPulse,
  Activity,
  Printer,
  Check,
  X,
  Play,
  Share2,
  BellRing
} from 'lucide-react';

export const PhysicalPharmacyQueueConsole: React.FC = () => {
  const [viewMode, setViewMode] = useState<'DESK_OPERATIONS' | 'LOUNGE_TV_DISPLAY' | 'KIOSK_CHECK_IN'>('DESK_OPERATIONS');
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [categories, setCategories] = useState<PharmacyQueueCategory[]>([]);
  const [metrics, setMetrics] = useState<QueueSummaryMetrics>(getQueueMetrics());
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Pharmacist Active Consultation Form State
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [soapPlan, setSoapPlan] = useState('');
  const [prescriptionsLinked, setPrescriptionsLinked] = useState<string[]>([]);
  const [rxInput, setRxInput] = useState('');
  
  // Kiosk / Walk-in Check-In Form State
  const [kioskPatientName, setKioskPatientName] = useState('');
  const [kioskPatientPhone, setKioskPatientPhone] = useState('');
  const [kioskSelectedCategory, setKioskSelectedCategory] = useState('cat-gen-consult');
  const [kioskPatientNotes, setKioskPatientNotes] = useState('I want to consult a pharmacist regarding my medication regimen.');
  const [kioskPriority, setKioskPriority] = useState<PriorityLevel>('STANDARD');
  const [generatedTicket, setGeneratedTicket] = useState<QueueTicket | null>(null);
  
  // Audio chime alert state
  const [audioChimePlayed, setAudioChimePlayed] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 10000); // Live poll every 10s
    return () => clearInterval(timer);
  }, []);

  const loadData = () => {
    const t = getQueueTickets();
    const c = getQueueCategories();
    const m = getQueueMetrics();
    setTickets(t);
    setCategories(c);
    setMetrics(m);

    if (!selectedTicketId && t.length > 0) {
      const active = t.find(item => item.ticketStatus === 'IN_CONSULTATION' || item.ticketStatus === 'CALLED');
      setSelectedTicketId(active ? active.id : t[0].id);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0] || null;

  const handleCallPatient = (ticket: QueueTicket) => {
    const updated = callQueueTicket(
      ticket.id,
      ticket.assignedCounter || 'Consultation Room 1',
      'Dr. Arthur Ssenabulya (Supervising Pharmacist)',
      'NDA/PHARM/2019/0411'
    );
    if (updated) {
      setAudioChimePlayed(`Now Calling Ticket #${updated.ticketNumber} to ${updated.assignedCounter}`);
      setTimeout(() => setAudioChimePlayed(null), 6000);
      loadData();
      setSelectedTicketId(updated.id);
    }
  };

  const handleStartConsultation = (ticketId: string) => {
    const updated = startConsultationSession(ticketId);
    if (updated) {
      loadData();
      setSelectedTicketId(updated.id);
    }
  };

  const handleCompleteConsultation = (ticketId: string) => {
    const fullNotes = `Clinical Assessment: ${clinicalNotes}\nAction Plan: ${soapPlan}`;
    const updated = completeConsultationSession(ticketId, fullNotes, prescriptionsLinked);
    if (updated) {
      setClinicalNotes('');
      setSoapPlan('');
      setPrescriptionsLinked([]);
      loadData();
    }
  };

  const handleGenerateKioskTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kioskPatientName.trim() || !kioskPatientPhone.trim()) return;

    const newTicket = issueNewQueueTicket(
      kioskSelectedCategory,
      kioskPatientName,
      kioskPatientPhone,
      'WALK_IN_KIOSK',
      kioskPatientNotes,
      kioskPriority
    );

    setGeneratedTicket(newTicket);
    setKioskPatientName('');
    setKioskPatientPhone('');
    loadData();
  };

  const handleAddPrescriptionLink = () => {
    if (rxInput.trim() && !prescriptionsLinked.includes(rxInput.trim())) {
      setPrescriptionsLinked([...prescriptionsLinked, rxInput.trim()]);
      setRxInput('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Audio Calling Chime Banner */}
      {audioChimePlayed && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 rounded-3xl shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                Lounge Audio Call Announcement
              </span>
              <div className="text-base font-black tracking-tight">{audioChimePlayed}</div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white/20 px-3 py-1.5 rounded-xl">
            Chime Active 🔊
          </span>
        </div>
      )}

      {/* Main Mode Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Physical Pharmacy Smart Queue &amp; Appointment Suite
            </span>
            <span className="text-xs font-semibold text-slate-500">Live Kiosk • Lounge Display • Clinical Desk</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            In-Store Consultation Queue Management
          </h2>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setViewMode('DESK_OPERATIONS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              viewMode === 'DESK_OPERATIONS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Pharmacist Desk</span>
          </button>

          <button
            onClick={() => setViewMode('LOUNGE_TV_DISPLAY')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              viewMode === 'LOUNGE_TV_DISPLAY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Lounge TV Display</span>
          </button>

          <button
            onClick={() => setViewMode('KIOSK_CHECK_IN')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              viewMode === 'KIOSK_CHECK_IN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Walk-In Kiosk ("I want to consult")</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 1: PHARMACIST DESK OPERATIONS & ACTIVE CONSULTATION WORKSPACE
      ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'DESK_OPERATIONS' && (
        <div className="space-y-6">
          
          {/* Top Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Now Serving</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {metrics.currentlyServing ? `#${metrics.currentlyServing.ticketNumber}` : 'None Active'}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {metrics.currentlyServing ? `${metrics.currentlyServing.patientName} (${metrics.currentlyServing.assignedCounter})` : 'Waiting for next patient'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Next In Line</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {metrics.nextInLine ? `#${metrics.nextInLine.ticketNumber}` : 'Queue Empty'}
              </div>
              <p className="text-[11px] text-slate-500">
                {metrics.nextInLine ? `Est: ${metrics.nextInLine.estimatedWaitMinutes} mins wait` : 'No waiting tickets'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Patients in Lounge</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {metrics.totalWaiting} Waiting
              </div>
              <p className="text-[11px] text-slate-500">
                {metrics.totalInConsultation} currently with pharmacists
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avg. Wait Time</span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {metrics.averageWaitTimeMinutes}m
              </div>
              <p className="text-[11px] text-slate-500">
                {metrics.completedTodayCount} completed today
              </p>
            </div>
          </div>

          {/* Split Workspace: Left Roster & Right Consultation Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Queue Ticket Roster (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Live Physical Queue Roster ({tickets.length})
                </h3>
                <button
                  onClick={loadData}
                  className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {/* Tickets List */}
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {tickets.map(t => {
                  const isSelected = t.id === selectedTicketId;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 shadow-sm ring-1 ring-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-indigo-700 dark:text-indigo-400">
                            #{t.ticketNumber}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            t.ticketStatus === 'IN_CONSULTATION'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                              : t.ticketStatus === 'CALLED'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                              : t.ticketStatus === 'WAITING'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {t.ticketStatus}
                          </span>
                        </div>

                        {t.priorityLevel !== 'STANDARD' && (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                            {t.priorityLevel.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-1.5">
                        {t.patientName} <span className="text-slate-400 font-normal">({t.patientPhone})</span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {t.consultationType}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Est: <strong>{t.estimatedWaitMinutes} mins</strong> ({t.patientsAheadCount} ahead)
                        </span>
                        <span className="font-mono text-slate-400">
                          {t.assignedCounter || 'Room 1'}
                        </span>
                      </div>

                      {/* Quick Action Buttons for Ticket */}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {t.ticketStatus === 'WAITING' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCallPatient(t);
                            }}
                            className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> Call to Counter
                          </button>
                        )}

                        {t.ticketStatus === 'CALLED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartConsultation(t.id);
                            }}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Consultation
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Active Consultation Clinical Workspace (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedTicket ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          Queue #{selectedTicket.ticketNumber}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          selectedTicket.ticketStatus === 'IN_CONSULTATION'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {selectedTicket.ticketStatus}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                        {selectedTicket.patientName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Contact: {selectedTicket.patientPhone} • Check-in: {new Date(selectedTicket.checkInTime).toLocaleTimeString()} ({selectedTicket.checkInChannel})
                      </p>
                    </div>

                    <div className="text-right sm:self-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Consultation Location</span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                        {selectedTicket.assignedCounter || 'Consultation Room 1'}
                      </span>
                    </div>
                  </div>

                  {/* Patient Initial Request Card */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                      Patient Initial Check-In Request
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium italic">
                      "{selectedTicket.patientNotes}"
                    </p>
                  </div>

                  {/* Pharmacist SOAP / Clinical Notes Entry */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Clinical Assessment &amp; Symptoms Review (Subjective / Objective)
                      </label>
                      <textarea
                        rows={3}
                        value={clinicalNotes}
                        onChange={e => setClinicalNotes(e.target.value)}
                        placeholder="Document patient presenting symptoms, current medications evaluated, blood pressure or glucose readings..."
                        className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Pharmacist Plan &amp; Counseling Directives (Plan / MTM)
                      </label>
                      <textarea
                        rows={2}
                        value={soapPlan}
                        onChange={e => setSoapPlan(e.target.value)}
                        placeholder="Document recommended dosage adjustments, OTC products recommended, or physician referral note..."
                        className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Prescriptions Linked */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">
                        Link Dispensed Medicines / Prescriptions to Session
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={rxInput}
                          onChange={e => setRxInput(e.target.value)}
                          placeholder="e.g. Paracetamol 500mg (30 tabs) or Rx #2026-08101"
                          className="flex-1 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={handleAddPrescriptionLink}
                          className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      {prescriptionsLinked.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {prescriptionsLinked.map((rx, idx) => (
                            <span key={idx} className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Pill className="w-3 h-3 text-emerald-600" /> {rx}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completion Action */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => updateTicketStatus(selectedTicket.id, 'NO_SHOW')}
                        className="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-black border border-rose-200 transition cursor-pointer"
                      >
                        Patient No-Show
                      </button>

                      <button
                        onClick={() => handleCompleteConsultation(selectedTicket.id)}
                        className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Consultation &amp; Save EHR Record
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 2: LOUNGE TV WAITING DISPLAY (WIDESCREEN DIGITAL BOARD)
      ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'LOUNGE_TV_DISPLAY' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 text-white shadow-2xl space-y-8 min-h-[650px] flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                  ZenithRx Clinical Lounge
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Consultation Queue &amp; Patient Calling Display
                </h2>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-400 block">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-xl font-mono font-black text-emerald-400">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Core Calling Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left: NOW SERVING BIG TICKER */}
            <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 p-8 rounded-3xl border border-indigo-500/40 shadow-2xl flex flex-col justify-center items-center text-center space-y-3 relative overflow-hidden">
              <span className="text-xs font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/20 border border-indigo-400/30 px-4 py-1.5 rounded-full">
                📢 NOW SERVING
              </span>

              <div className="text-7xl font-black tracking-tighter text-white font-mono animate-pulse">
                {metrics.currentlyServing ? `#${metrics.currentlyServing.ticketNumber}` : '--'}
              </div>

              <div className="text-xl font-black text-emerald-400 mt-2">
                {metrics.currentlyServing ? metrics.currentlyServing.assignedCounter : 'Next Patient Calling...'}
              </div>

              <div className="text-xs text-slate-400 mt-1">
                {metrics.currentlyServing ? `Patient: ${metrics.currentlyServing.patientName}` : 'Please watch display for your ticket number'}
              </div>
            </div>

            {/* Right: WAITING QUEUE TICKETS */}
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Upcoming Queue Tickets
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {metrics.totalWaiting} Patients Waiting
                </span>
              </div>

              <div className="divide-y divide-slate-800">
                {tickets.filter(t => t.ticketStatus === 'WAITING' || t.ticketStatus === 'CALLED').map(t => (
                  <div key={t.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl font-black text-amber-400">
                        #{t.ticketNumber}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{t.consultationType}</span>
                        <span className="text-[10px] text-slate-500">{t.patientsAheadCount} ahead in queue</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        ~{t.estimatedWaitMinutes} mins
                      </span>
                      <span className="text-[10px] text-slate-500">Estimated wait</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Health Announcement Ticker Footer */}
          <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-900/50 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <strong>Pharmacist Tip:</strong> Free blood pressure &amp; blood glucose screening available today at Counter 2.
            </span>
            <span className="font-mono text-slate-500">
              ZenithRx Physical Pharmacy OS
            </span>
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 3: WALK-IN PATIENT SELF-SERVICE KIOSK / TICKET GENERATOR
      ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'KIOSK_CHECK_IN' && (
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950 mx-auto flex items-center justify-center text-emerald-600">
                <PlusCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                "I want to consult a pharmacist"
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Check-in instantly to receive your physical queue ticket and real-time waiting time estimate.
              </p>
            </div>

            <form onSubmit={handleGenerateKioskTicket} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                  Select Consultation Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map(cat => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setKioskSelectedCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                        kioskSelectedCategory === cat.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-400/30 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">{cat.categoryName}</span>
                        <span className="font-mono text-[10px] font-bold text-emerald-600">~{cat.averageDurationMinutes}m</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{cat.targetCounterRoom}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert Mukasa"
                    value={kioskPatientName}
                    onChange={e => setKioskPatientName(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone Number (For SMS Call Alert)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+256 700 000000"
                    value={kioskPatientPhone}
                    onChange={e => setKioskPatientPhone(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Consultation / Questions
                </label>
                <input
                  type="text"
                  value={kioskPatientNotes}
                  onChange={e => setKioskPatientNotes(e.target.value)}
                  placeholder="e.g. Inquiring about diabetes medication schedule..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-xl transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Printer className="w-5 h-5" />
                Issue Queue Ticket &amp; Start Wait Countdown
              </button>
            </form>
          </div>

          {/* Generated Ticket Result Card */}
          {generatedTicket && (
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-2xl space-y-4 text-center animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                Your Physical Pharmacy Queue Ticket
              </span>

              <div className="text-6xl font-black tracking-tighter font-mono my-2">
                #{generatedTicket.ticketNumber}
              </div>

              <div className="text-lg font-bold">
                Estimated Waiting Time: <span className="font-mono font-black text-amber-200">{generatedTicket.estimatedWaitMinutes} minutes</span>
              </div>

              <p className="text-xs text-emerald-100 max-w-sm mx-auto">
                {generatedTicket.patientsAheadCount} patient(s) ahead of you in line. Please proceed to the waiting lounge. An SMS alert will be sent when your turn is called.
              </p>

              <div className="pt-3 border-t border-white/20 flex items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Thermal Slip
                </button>
                <button
                  onClick={() => setGeneratedTicket(null)}
                  className="px-4 py-2 bg-white/20 text-white font-bold text-xs rounded-xl hover:bg-white/30 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default PhysicalPharmacyQueueConsole;
