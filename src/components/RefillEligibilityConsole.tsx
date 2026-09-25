/**
 * RefillEligibilityConsole.tsx — ZenithRx Posology Depletion & Refill Eligibility Review Console
 * Clean Architecture: Presentation Layer
 * 
 * Pharmacist clinical workbench to inspect medication runout calculations:
 * Original Quantity ÷ (Dose × Frequency) = Days Supply
 * Dispensing Date + Days Supply = Estimated Depletion Date
 * 
 * Flags: "Refill due in 3 days", "Overdue by 2 days", "Active supply (15 days remaining)"
 * Provides registered pharmacist review and 1-click precision WhatsApp dispatch.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  refillEligibilityService,
  RefillEligibilityRecord,
  SYSTEM_CURRENT_DATE,
  calculateDepletion,
  generateTailoredMessage,
} from '../services/refillEligibilityService';
import {
  Calendar,
  Clock,
  Pill,
  Send,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Sparkles,
  RefreshCw,
  Calculator,
  ChevronRight,
  Eye,
  Sliders,
  X,
  FileCheck,
  Building2,
  HeartPulse,
  Info,
} from 'lucide-react';

interface RefillEligibilityConsoleProps {
  tenantId?: string;
  pharmacistName?: string;
  pharmacistPsuNo?: string;
  onSelectPatient?: (patientId: string) => void;
}

export const RefillEligibilityConsole: React.FC<RefillEligibilityConsoleProps> = ({
  tenantId = 'client-001',
  pharmacistName = 'Dr. Arthur Ssenabulya',
  pharmacistPsuNo = 'PSU-2021-0892',
  onSelectPatient,
}) => {
  const [records, setRecords] = useState<RefillEligibilityRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [reviewFilter, setReviewFilter] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<RefillEligibilityRecord | null>(null);
  
  // Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCalcTester, setShowCalcTester] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Review Form
  const [reviewAction, setReviewAction] = useState<'Approved for Outreach' | 'Refill Authorized' | 'Suspended'>('Approved for Outreach');
  const [reviewNotes, setReviewNotes] = useState('');

  // Posology Adjustment Form
  const [adjustDose, setAdjustDose] = useState<number>(1);
  const [adjustFreq, setAdjustFreq] = useState<number>(1);
  const [adjustFreqText, setAdjustFreqText] = useState<string>('');
  const [adjustRationale, setAdjustRationale] = useState<string>('');

  // Sandbox Calculator State
  const [calcQty, setCalcQty] = useState<number>(60);
  const [calcDose, setCalcDose] = useState<number>(1);
  const [calcFreq, setCalcFreq] = useState<number>(2);
  const [calcDispDate, setCalcDispDate] = useState<string>('2026-08-29');

  const reloadRecords = () => {
    setRecords(refillEligibilityService.getAllRecords(tenantId));
  };

  useEffect(() => {
    reloadRecords();
  }, [tenantId]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return records.filter((r) => {
      const matchQuery =
        r.patientName.toLowerCase().includes(q) ||
        r.medicationName.toLowerCase().includes(q) ||
        r.chronicCondition.toLowerCase().includes(q) ||
        r.patientPhone.includes(q);

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'due03' && r.refillEligibilityStatus.includes('Due in 0-3')) ||
        (statusFilter === 'overdue' && r.refillEligibilityStatus.includes('Overdue')) ||
        (statusFilter === 'approaching' && r.refillEligibilityStatus.includes('Approaching')) ||
        (statusFilter === 'active' && r.refillEligibilityStatus.includes('Active Supply'));

      const matchReview =
        reviewFilter === 'All' || r.pharmacistReviewStatus === reviewFilter;

      return matchQuery && matchStatus && matchReview;
    });
  }, [records, searchQuery, statusFilter, reviewFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const due03 = records.filter((r) => r.refillEligibilityStatus.includes('Due in 0-3')).length;
    const overdue = records.filter((r) => r.refillEligibilityStatus.includes('Overdue')).length;
    const pendingReview = records.filter((r) => r.pharmacistReviewStatus === 'Pending Review').length;
    const total = records.length;
    return { due03, overdue, pendingReview, total };
  }, [records]);

  // Handle Review Submission
  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    refillEligibilityService.reviewAndApproveRecord(
      selectedRecord.id,
      pharmacistName,
      pharmacistPsuNo,
      reviewAction,
      reviewNotes || 'Posology and clinical eligibility verified by supervising pharmacist.'
    );

    reloadRecords();
    setShowReviewModal(false);
    setNotificationToast(`Pharmacist review signed off for ${selectedRecord.patientName}.`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Handle Posology Adjustment
  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    refillEligibilityService.adjustPosology(
      selectedRecord.id,
      adjustDose,
      adjustFreq,
      adjustFreqText || `${adjustDose} unit(s) ${adjustFreq} time(s) daily`,
      pharmacistName,
      pharmacistPsuNo,
      adjustRationale || 'Dose adjustment noted following patient review.'
    );

    reloadRecords();
    setShowAdjustModal(false);
    setNotificationToast(`Posology adjusted and depletion dates recalculated for ${selectedRecord.patientName}.`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Handle WhatsApp Dispatch
  const handleDispatchOutreach = (record: RefillEligibilityRecord) => {
    const res = refillEligibilityService.dispatchRefillOutreach(record.id);
    if (res.success && res.link) {
      window.open(res.link, '_blank');
      reloadRecords();
      setNotificationToast(`Precision refill alert dispatched to ${record.patientName}!`);
      setTimeout(() => setNotificationToast(null), 4000);
    }
  };

  // Live Sandbox Calculator evaluation
  const sandboxResult = useMemo(() => {
    return calculateDepletion(calcDispDate, calcQty, calcDose, calcFreq, SYSTEM_CURRENT_DATE);
  }, [calcDispDate, calcQty, calcDose, calcFreq]);

  return (
    <div className="space-y-6">
      
      {/* ─── Top Clinical Banner ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/30 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Posology Depletion Engine
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Registered Pharmacist Signoff Required
            </span>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
              System Date: {SYSTEM_CURRENT_DATE}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Refill Eligibility &amp; Medication Depletion</h1>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl">
            Calculates exact runout dates from <strong>Original Quantity ÷ (Dose × Frequency)</strong> and displays live countdowns like <em>"Refill due in 3 days"</em> for pharmacist verification before automated outreach.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCalcTester(!showCalcTester)}
            className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl border border-indigo-400/30 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>{showCalcTester ? 'Close Formula Sandbox' : 'Open Posology Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationToast && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{notificationToast}</span>
          </div>
          <button onClick={() => setNotificationToast(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Interactive Posology Formula Sandbox Drawer (Optional) ────────── */}
      {showCalcTester && (
        <div className="p-6 bg-slate-900 border border-indigo-700/80 rounded-3xl text-white shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <h3 className="font-black text-sm">Interactive Posology Depletion Sandbox</h3>
            </div>
            <span className="text-[11px] text-indigo-300">Live Mathematical Verification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Original Quantity</label>
              <input
                type="number"
                value={calcQty}
                onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Dose Per Intake</label>
              <input
                type="number"
                step="0.5"
                value={calcDose}
                onChange={(e) => setCalcDose(Math.max(0.1, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Frequency Per Day</label>
              <select
                value={calcFreq}
                onChange={(e) => setCalcFreq(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
              >
                <option value="1">Once daily (OD) - 1x/day</option>
                <option value="2">Twice daily (BD) - 2x/day</option>
                <option value="3">Three times daily (TDS) - 3x/day</option>
                <option value="4">Four times daily (QDS) - 4x/day</option>
                <option value="0.14">Once weekly - 0.14x/day</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Dispensing Date</label>
              <input
                type="date"
                value={calcDispDate}
                onChange={(e) => setCalcDispDate(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>
          </div>

          {/* Sandbox Live Math Breakdown */}
          <div className="p-4 bg-indigo-950/60 border border-indigo-700/50 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Daily Intake Rate:</span>
              <p className="font-black text-indigo-300 text-sm mt-0.5">
                {sandboxResult.dailyIntakeRate} units/day
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Total Days of Supply:</span>
              <p className="font-black text-white text-sm mt-0.5">
                {sandboxResult.daysSupply} days
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Estimated Depletion Date:</span>
              <p className="font-black text-amber-300 text-sm mt-0.5">
                {sandboxResult.estimatedDepletionDate}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Calculated Eligibility:</span>
              <span className={`inline-block font-black px-2.5 py-1 rounded-full text-xs mt-0.5 ${
                sandboxResult.daysRemaining <= 3 && sandboxResult.daysRemaining >= 0
                  ? 'bg-rose-500 text-white animate-pulse'
                  : sandboxResult.daysRemaining < 0
                  ? 'bg-red-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {sandboxResult.daysRemaining < 0
                  ? `Overdue by ${Math.abs(sandboxResult.daysRemaining)} days`
                  : sandboxResult.daysRemaining === 0
                  ? 'Refill due today'
                  : `Refill due in ${sandboxResult.daysRemaining} days`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Metric KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Monitored Regimens
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {metrics.total}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active chronic posologies</p>
          </div>
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-2xl">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Refill Due in 0-3 Days
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {metrics.due03} Patients
            </div>
            <p className="text-[11px] text-rose-600 font-bold mt-0.5">Imminent depletion window</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Overdue Runouts
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {metrics.overdue} Patients
            </div>
            <p className="text-[11px] text-amber-600 font-bold mt-0.5">Missed dose risk flagged</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Pharmacist Review
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {metrics.pendingReview} Regimens
            </div>
            <p className="text-[11px] text-indigo-500 font-bold mt-0.5">Requires clinical signoff</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, phone, condition, medication..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Depletion Statuses</option>
            <option value="due03">Due in 0-3 Days (Imminent)</option>
            <option value="overdue">Overdue Runout</option>
            <option value="approaching">Approaching (4-7 Days)</option>
            <option value="active">Active Supply (&gt;7 Days)</option>
          </select>

          {/* Review Status Filter */}
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Review Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved for Outreach">Approved for Outreach</option>
            <option value="Posology Adjusted">Posology Adjusted</option>
          </select>
        </div>
      </div>

      {/* ─── Main Patient Refill Eligibility Registry ──────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-indigo-600" />
            <h3 className="font-black text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Longitudinal Posology &amp; Calculated Depletion Register ({filteredRecords.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Rule: 85% Depletion Threshold Enforced
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Pill className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No matching patient refill records found</p>
              <p className="mt-1">Try clearing your search query or changing filters.</p>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isDueSoon = rec.daysRemaining >= 0 && rec.daysRemaining <= 3;
              const isOverdue = rec.daysRemaining < 0;

              return (
                <div
                  key={rec.id}
                  className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left Column: Patient & Posology Calculation */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {rec.patientName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({rec.patientPhone})</span>
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-bold text-[10px]">
                        {rec.chronicCondition}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Rx: {rec.prescriptionRefNo}
                      </span>
                    </div>

                    {/* Medication & Exact Posology Formula Display */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-indigo-500" />
                          {rec.medicationName}
                        </span>
                        <span className="text-[11px] text-slate-500 italic">
                          ({rec.genericName})
                        </span>
                      </div>

                      {/* Explicit Mathematical Calculation Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Original Quantity:</span>
                          <b className="text-slate-800 dark:text-slate-200">
                            {rec.originalQuantity} {rec.unitOfMeasure}
                          </b>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Prescribed Frequency:</span>
                          <b className="text-indigo-600 dark:text-indigo-400">
                            {rec.frequencyText}
                          </b>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Computed Supply:</span>
                          <b className="text-slate-800 dark:text-slate-200">
                            {rec.daysSupply} Days Supply ({rec.dailyIntakeRate} {rec.unitOfMeasure}/day)
                          </b>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Depletion Dates Row */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Dispensed: <b>{rec.dispensingDate}</b>
                      </span>
                      <span>───(<b>{rec.daysSupply} days</b>)───&gt;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        Estimated Depletion: <b className="text-amber-600 dark:text-amber-400">{rec.estimatedDepletionDate}</b>
                      </span>
                    </div>

                    {/* Pharmacist Review Badge & Notes */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                      <span className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                        rec.pharmacistReviewStatus === 'Approved for Outreach' || rec.pharmacistReviewStatus === 'Refill Authorized'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : rec.pharmacistReviewStatus === 'Posology Adjusted'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}>
                        <Stethoscope className="w-3 h-3" />
                        {rec.pharmacistReviewStatus}
                        {rec.pharmacistReviewerName && ` by ${rec.pharmacistReviewerName}`}
                      </span>

                      {rec.pharmacistReviewNotes && (
                        <span className="text-slate-500 italic truncate max-w-md">
                          "{rec.pharmacistReviewNotes}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Depletion Countdown Gauge & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 shrink-0">
                    
                    {/* Visual Countdown Badge */}
                    <div className="text-right">
                      <div className={`px-3 py-1.5 rounded-xl font-black text-xs inline-flex items-center gap-1.5 shadow-2xs ${
                        isDueSoon
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700 animate-pulse'
                          : isOverdue
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {rec.daysRemaining < 0
                            ? `Overdue by ${Math.abs(rec.daysRemaining)} days`
                            : rec.daysRemaining === 0
                            ? `Refill due today (0 days)`
                            : `Refill due in ${rec.daysRemaining} days`}
                        </span>
                      </div>

                      {/* Supply Consumption Bar */}
                      <div className="w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 ml-auto">
                        <div
                          className={`h-full rounded-full ${
                            rec.consumptionPercent >= 90
                              ? 'bg-rose-500'
                              : rec.consumptionPercent >= 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${rec.consumptionPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {rec.consumptionPercent}% of supply consumed
                      </span>
                    </div>

                    {/* Pharmacist Action Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Review / Signoff Button */}
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setReviewNotes(rec.pharmacistReviewNotes || '');
                          setShowReviewModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        title="Review clinical posology & sign off"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Review</span>
                      </button>

                      {/* Adjust Posology Button */}
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setAdjustDose(rec.dosePerIntake);
                          setAdjustFreq(rec.frequencyPerDay);
                          setAdjustFreqText(rec.frequencyText);
                          setAdjustRationale('');
                          setShowAdjustModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        title="Adjust posology or dose titration"
                      >
                        <Sliders className="w-3.5 h-3.5 text-sky-500" />
                        <span>Adjust</span>
                      </button>

                      {/* Preview Calculated Message Button */}
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setShowPreviewModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        title="Preview tailored message with calculated dates"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-500" />
                        <span>Preview</span>
                      </button>

                      {/* 1-Click WhatsApp Dispatch */}
                      <button
                        onClick={() => handleDispatchOutreach(rec)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer transform hover:scale-102"
                        title="Dispatch personalized WhatsApp refill alert with calculated depletion date"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp Alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── MODAL 1: PHARMACIST REVIEW & SIGNOFF ───────────────────────────── */}
      {showReviewModal && selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-xs space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  Pharmacist Clinical Refill Signoff
                </h3>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {selectedRecord.patientName} • {selectedRecord.medicationName}
              </div>
              <p className="text-[11px] text-slate-500">
                Calculation: {selectedRecord.originalQuantity} {selectedRecord.unitOfMeasure} ÷ {selectedRecord.dailyIntakeRate}/day = <strong>{selectedRecord.daysSupply} days supply</strong>.
                Runs out on <strong>{selectedRecord.estimatedDepletionDate}</strong> ({selectedRecord.daysRemaining} days remaining).
              </p>
            </div>

            <form onSubmit={handleConfirmReview} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pharmacist Action &amp; Regulatory Authorization *
                </label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="Approved for Outreach">Approve Refill &amp; Authorize Outreach</option>
                  <option value="Refill Authorized">Directly Authorize Refill Preparation</option>
                  <option value="Suspended">Suspend (Requires Prescriber Review)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Clinical Assessment &amp; Follow-up Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Patient blood pressure and kidney markers reviewed. Posology confirmed. Approved for dispatch."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300">
                Signing Pharmacist: <strong>{pharmacistName}</strong> ({pharmacistPsuNo})
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Sign &amp; Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: POSOLOGY ADJUSTMENT ───────────────────────────────────── */}
      {showAdjustModal && selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-xs space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  Adjust Posology &amp; Recalculate Depletion
                </h3>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Dose Per Intake *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={adjustDose}
                    onChange={(e) => setAdjustDose(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Frequency (Times/Day) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={adjustFreq}
                    onChange={(e) => setAdjustFreq(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Posology Description Text *
                </label>
                <input
                  type="text"
                  required
                  value={adjustFreqText}
                  onChange={(e) => setAdjustFreqText(e.target.value)}
                  placeholder="e.g. 1 tablet twice daily with meals (BD)"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Clinical Rationale for Adjustment *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustRationale}
                  onChange={(e) => setAdjustRationale(e.target.value)}
                  placeholder="e.g. Prescriber titrated dosage down to 1 tablet OD due to mild dizziness."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Recalculate &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: PREVIEW CALCULATED OUTREACH MESSAGE ───────────────────── */}
      {showPreviewModal && selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-xs space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  Precision Refill Outreach Preview
                </h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 text-[11px]">
              Instead of generic text ("Your medicine is due"), this personalized message incorporates exact quantity, dosage, dispensing date, runout date, and remaining days:
            </p>

            {/* WhatsApp Chat Bubble Simulation */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-slate-800 dark:text-slate-200 whitespace-pre-line font-sans text-xs leading-relaxed shadow-inner">
              {selectedRecord.tailoredMessagePreview}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                Recipient: <strong>{selectedRecord.patientPhone}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleDispatchOutreach(selectedRecord);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
