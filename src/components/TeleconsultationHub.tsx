import React, { useState, useEffect } from 'react';
import { TeleconsultationSession } from '../types';
import {
  getTeleconsultationSessions,
  bookTeleconsultation,
  updateConsultationNotes,
} from '../services/teleconsultationService';
import { PhysicalPharmacyQueueConsole } from './PhysicalPharmacyQueueConsole';
import {
  Video,
  MessageSquare,
  Clock,
  User,
  CheckCircle,
  Plus,
  ShieldCheck,
  Stethoscope,
  FileEdit,
  Phone,
  Search,
  Users,
  Tv
} from 'lucide-react';

interface TeleconsultationHubProps {
  tenantId?: string;
  pharmacyName?: string;
  currentPharmacistName?: string;
}

export const TeleconsultationHub: React.FC<TeleconsultationHubProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'Kampala City Pharmacy',
  currentPharmacistName = 'Dr. Arthur Ssenabulya',
}) => {
  const [sessions, setSessions] = useState<TeleconsultationSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<TeleconsultationSession | null>(null);
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const [recommendedAdvice, setRecommendedAdvice] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // New Booking State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState(30);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [chiefComplaint, setChiefComplaint] = useState('');

  useEffect(() => {
    setSessions(getTeleconsultationSessions(tenantId));
  }, [tenantId]);

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    const updated = updateConsultationNotes(
      selectedSession.id,
      currentPharmacistName,
      pharmacistNotes,
      recommendedAdvice,
      'Completed'
    );

    if (updated) {
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSelectedSession(null);
      setPharmacistNotes('');
      setRecommendedAdvice('');
    }
  };

  const handleBookSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !chiefComplaint) return;

    const newSession = bookTeleconsultation({
      tenantId,
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      chiefComplaint,
      scheduledTime: new Date().toISOString(),
    });

    setSessions([newSession, ...sessions]);
    setIsBookModalOpen(false);

    setPatientName('');
    setPatientPhone('');
    setChiefComplaint('');
  };

  const [consultationMode, setConsultationMode] = useState<'SMART_PHYSICAL_QUEUE' | 'VIRTUAL_TELEHEALTH'>('SMART_PHYSICAL_QUEUE');

  const filteredSessions = sessions.filter(
    (s) =>
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Consultation Hub Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 px-2">
          <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            Pharmacist Clinical Consultation &amp; Queue Operations
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setConsultationMode('SMART_PHYSICAL_QUEUE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              consultationMode === 'SMART_PHYSICAL_QUEUE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Physical Walk-In Queue (#A023 &amp; EWT)</span>
          </button>

          <button
            onClick={() => setConsultationMode('VIRTUAL_TELEHEALTH')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              consultationMode === 'VIRTUAL_TELEHEALTH'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Virtual / Video Teleconsultation</span>
          </button>
        </div>
      </div>

      {consultationMode === 'SMART_PHYSICAL_QUEUE' ? (
        <PhysicalPharmacyQueueConsole />
      ) : (
        <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5" />
              Virtual Clinical Consultation Hub
            </span>
            <span className="text-xs font-semibold text-slate-500">Encrypted Pharmacist-Patient Telehealth</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Teleconsultation &amp; Pharmacist Counseling Desk
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Conduct secure live virtual triage, medication therapy management (MTM), counseling, and document clinical advice for outpatients.
          </p>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Queue Walk-In / Virtual Patient</span>
        </button>
      </div>

      {/* Queue Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {sessions.filter((s) => s.status === 'Waiting in Queue').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Patients Waiting in Queue</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-100 dark:bg-sky-900/40 rounded-xl text-sky-700 dark:text-sky-300">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {sessions.filter((s) => s.status === 'In Consultation').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Active In-Progress Consults</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {sessions.filter((s) => s.status === 'Completed').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Completed Consultations</div>
          </div>
        </div>
      </div>

      {/* Consultations List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, consultation #, or complaint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">{session.sessionNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      session.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : session.status === 'In Consultation'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 animate-pulse'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {session.patientName} ({session.patientAge}y, {session.patientGender}) — {session.patientPhone}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Chief Complaint:</span> {session.chiefComplaint}
                </p>

                {session.vitalSigns?.bloodPressure && (
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Vitals:</span>
                    <span>BP: {session.vitalSigns.bloodPressure}</span>
                  </div>
                )}

                {session.pharmacistNotes && (
                  <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Pharmacist Advice ({session.pharmacistName}):</p>
                    <p>{session.recommendedAdvice || session.pharmacistNotes}</p>
                  </div>
                )}
              </div>

              <div className="shrink-0">
                {session.status !== 'Completed' ? (
                  <button
                    onClick={() => {
                      setSelectedSession(session);
                      setPharmacistNotes(session.pharmacistNotes || '');
                      setRecommendedAdvice(session.recommendedAdvice || '');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Attend &amp; Record Notes</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Consultation Documented
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Notes Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Document Consultation: {selectedSession.patientName}
                </h3>
                <p className="text-xs text-slate-500">Complaint: {selectedSession.chiefComplaint}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Clinical Assessment &amp; Findings *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Record symptoms evaluated, drug-related issues, suspected side effects, or differential considerations..."
                  value={pharmacistNotes}
                  onChange={(e) => setPharmacistNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Recommended Advice &amp; Patient Counseling *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specific counseling instructions provided to the patient (hydration, OTC options, lifestyle advice, physician referral)..."
                  value={recommendedAdvice}
                  onChange={(e) => setRecommendedAdvice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save &amp; Complete Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Consult Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Queue Patient for Consultation</h3>
              <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleBookSession} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Kibirige"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +256 701 998811"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Chief Complaint *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe patient's symptoms or medication question..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Add to Waiting Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
