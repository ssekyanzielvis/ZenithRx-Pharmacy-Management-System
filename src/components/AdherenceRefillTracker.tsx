import React, { useState, useEffect } from 'react';
import { PatientAdherenceRecord } from '../types';
import {
  getAdherenceRecords,
  triggerRefillReminderMessage,
} from '../services/adherenceRefillService';
import {
  HeartPulse,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  MessageSquare,
  PhoneCall,
  Calendar,
  Sparkles,
  Calculator,
  Layers,
} from 'lucide-react';
import { RefillEligibilityConsole } from './RefillEligibilityConsole';

interface AdherenceRefillTrackerProps {
  tenantId?: string;
  pharmacyName?: string;
}

export const AdherenceRefillTracker: React.FC<AdherenceRefillTrackerProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'Kampala City Pharmacy',
}) => {
  const [activeTab, setActiveTab] = useState<'eligibility' | 'pdc'>('eligibility');
  const [records, setRecords] = useState<PatientAdherenceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    setRecords(getAdherenceRecords(tenantId));
  }, [tenantId]);

  const handleSendReminder = (recordId: string) => {
    const res = triggerRefillReminderMessage(recordId);
    if (res.success) {
      setNotificationStatus(res.message);
      setRecords(getAdherenceRecords(tenantId));
      setTimeout(() => setNotificationStatus(null), 5000);
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.chronicCondition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.medicationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ─── Top Navigation Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('eligibility')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'eligibility'
              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Posology Depletion &amp; Refill Eligibility Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('pdc')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pdc'
              ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>PDC Chronic Adherence Registry</span>
        </button>
      </div>

      {activeTab === 'eligibility' ? (
        <RefillEligibilityConsole tenantId={tenantId} />
      ) : (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5" />
                  Chronic Disease Care Protocol
                </span>
                <span className="text-xs font-semibold text-slate-500">PDC (Proportion of Days Covered) Adherence Engine</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                Chronic Patient Adherence &amp; Refill Automation
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Automated WhatsApp &amp; SMS refill reminders for hypertension, diabetes, and asthma patients to prevent dose-skipping and complications.
              </p>
            </div>
          </div>

          {notificationStatus && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notificationStatus}</span>
            </div>
          )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {records.filter((r) => r.adherenceRatePercent >= 80).length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">High Adherence Patients (&gt;80%)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {records.filter((r) => r.status.includes('Refill Due')).length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Refills Due in 0-3 Days</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {records.filter((r) => r.status.includes('Overdue')).length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Overdue / Missed Dose Risks</div>
          </div>
        </div>
      </div>

      {/* Patient Adherence Registry Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search chronic patient, condition, or medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{record.patientName}</span>
                  <span className="text-xs text-slate-500 font-medium">({record.patientPhone})</span>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    {record.chronicCondition}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Medication: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{record.medicationName}</span>
                  <span className="text-slate-500 font-normal"> — {record.dosageSchedule}</span>
                </div>

                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Last Dispensed: {record.lastDispensedDate}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Next Refill Due: <span className="text-rose-600 dark:text-rose-400">{record.nextRefillDueDate}</span>
                  </span>
                  <span>Refill Streak: {record.refillStreakMonths} months</span>
                </div>

                {record.pharmacistFollowUpNotes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                    Note: {record.pharmacistFollowUpNotes}
                  </p>
                )}
              </div>

              {/* Adherence Gauge & Reminder Button */}
              <div className="flex items-center gap-5 shrink-0">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs text-slate-400 font-semibold">PDC Adherence:</span>
                    <span
                      className={`text-base font-black ${
                        record.adherenceRatePercent >= 85
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : record.adherenceRatePercent >= 70
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {record.adherenceRatePercent}%
                    </span>
                  </div>
                  <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 ml-auto">
                    <div
                      className={`h-full rounded-full ${
                        record.adherenceRatePercent >= 85
                          ? 'bg-emerald-500'
                          : record.adherenceRatePercent >= 70
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${record.adherenceRatePercent}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSendReminder(record.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all transform hover:scale-102"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send {record.reminderChannel} Reminder</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
);
};
