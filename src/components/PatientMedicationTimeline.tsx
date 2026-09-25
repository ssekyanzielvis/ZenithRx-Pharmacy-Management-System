/**
 * PatientMedicationTimeline.tsx — ZenithRx Patient Longitudinal Medication Timeline & History View
 * Presentation Layer: Clinical Decision Support & Comprehensive Cross-Pharmacy Dispensing Timeline
 *
 * Displays:
 * Date | Medicine | Dose | Quantity | Pharmacy | Status | Prescriber | Batch
 * Example:
 * 02 Sep | Medicine A | 500mg | 30 | Pharmacy X | Dispensed
 * 20 Sep | Medicine B | 10mg  | 14 | Pharmacy Y | Dispensed
 */

import React, { useState, useMemo } from 'react';
import {
  patientMedicationTimelineService,
  MedicationTimelineEntry,
} from '../services/patientMedicationTimelineService';
import { formatUGX } from '../services/formatters';
import {
  History,
  Calendar,
  Pill,
  Building2,
  Stethoscope,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Printer,
  FileText,
  User,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  Download,
  AlertCircle,
} from 'lucide-react';

interface PatientMedicationTimelineProps {
  patientId?: string;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  onSelectMedication?: (medicine: MedicationTimelineEntry) => void;
  compact?: boolean;
}

export const PatientMedicationTimeline: React.FC<PatientMedicationTimelineProps> = ({
  patientId = 'UG-PAT-1029',
  patientName = 'Grace Nakato',
  patientAge = 44,
  patientGender = 'Female',
  onSelectMedication,
  compact = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedEntry, setSelectedEntry] = useState<MedicationTimelineEntry | null>(null);

  // Fetch longitudinal timeline
  const timeline = useMemo(() => {
    return patientMedicationTimelineService.getTimelineForPatient(patientName || patientId);
  }, [patientName, patientId]);

  const summary = useMemo(() => {
    return patientMedicationTimelineService.getTimelineSummary(patientName || patientId);
  }, [patientName, patientId]);

  // Filter items
  const filteredTimeline = useMemo(() => {
    return timeline.filter((item) => {
      const matchesSearch =
        item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.prescriberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dose.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || item.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [timeline, searchTerm, statusFilter, sourceFilter]);

  const handlePrintHistory = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      
      {/* ─── Top Clinical Header & Summary ─────────────────────────────────── */}
      {!compact && (
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl border border-teal-800/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-teal-800/50 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-teal-400/30 flex items-center gap-1">
                  <History className="w-3 h-3" /> Longitudinal Dispensing Timeline
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Cross-Pharmacy Connected
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-1">
                {patientName}
                <span className="text-xs font-normal text-teal-200/80 ml-2">
                  ({patientAge} yrs • {patientGender} • ID: {patientId})
                </span>
              </h2>
              <p className="text-xs text-teal-200/70 mt-0.5">
                Complete chronological medication dispense records from internal branch and verified partner pharmacies.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={handlePrintHistory}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Print Patient Medication History Slip"
              >
                <Printer className="w-3.5 h-3.5 text-teal-300" />
                <span>Print Medication Slip</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-teal-300 text-[10px] font-bold uppercase tracking-wider block">
                Total Dispensings
              </span>
              <span className="text-lg font-black text-white">{summary.totalDispensings} Records</span>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-teal-300 text-[10px] font-bold uppercase tracking-wider block">
                Unique Molecules
              </span>
              <span className="text-lg font-black text-white">{summary.uniqueMedicines} INNs</span>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-teal-300 text-[10px] font-bold uppercase tracking-wider block">
                Pharmacies Involved
              </span>
              <span className="text-lg font-black text-white">{summary.pharmaciesInvolved.length} Locations</span>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-teal-300 text-[10px] font-bold uppercase tracking-wider block">
                Timeline Span
              </span>
              <span className="text-xs font-bold text-slate-200 mt-1 block">
                {summary.earliestRecordDate} → {summary.latestRecordDate}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Search & Tab Filter Controls ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medicine, dose, prescriber, or pharmacy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Dispensed">Dispensed</option>
            <option value="Partially Dispensed">Partially Dispensed</option>
            <option value="Refill Due">Refill Due</option>
            <option value="Active">Active</option>
            <option value="Discontinued">Discontinued</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Sources</option>
            <option value="ZenithRx Internal">ZenithRx Internal</option>
            <option value="National EHR / External Pharmacy">External EHR / Partner</option>
          </select>
        </div>
      </div>

      {/* ─── Structured Medication Timeline Table ──────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Medicine</th>
                <th className="p-3.5">Dose</th>
                <th className="p-3.5 text-center">Quantity</th>
                <th className="p-3.5">Pharmacy</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Prescriber / Clinic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTimeline.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-bold text-xs">No medication history found matching filters</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing the search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredTimeline.map((row) => {
                  const isSelected = selectedEntry?.id === row.id;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setSelectedEntry(row);
                        if (onSelectMedication) onSelectMedication(row);
                      }}
                      className={`hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors cursor-pointer ${
                        isSelected ? 'bg-teal-50/80 dark:bg-teal-950/40 font-semibold' : ''
                      }`}
                    >
                      {/* Date Column */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          </span>
                          <div>
                            <span className="font-black text-slate-900 dark:text-slate-100 block">
                              {row.dispensedDateFormatted}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {row.dispensedDate}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Medicine Column */}
                      <td className="p-3.5">
                        <div>
                          <span className="font-black text-slate-900 dark:text-slate-100 block text-xs">
                            {row.medicineName}
                          </span>
                          <span className="text-[11px] text-slate-500 italic block">
                            {row.genericName}
                          </span>
                          <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold block mt-0.5">
                            {row.therapeuticClass}
                          </span>
                        </div>
                      </td>

                      {/* Dose / Posology Column */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div>
                          <span className="font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 text-[11px] inline-block font-mono">
                            {row.dose}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {row.frequency}
                          </span>
                        </div>
                      </td>

                      {/* Quantity Column */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                          {row.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({row.daysSupply} days)
                        </span>
                      </td>

                      {/* Pharmacy Column */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{row.pharmacyName}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {row.pharmacyLocation} • {row.dispensingPharmacist}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            Batch: {row.batchNumber} (Exp: {row.batchExpiryDate})
                          </span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shadow-2xs ${
                            row.status === 'Dispensed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : row.status === 'Partially Dispensed'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : row.status === 'Refill Due'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Prescriber / Clinic Column */}
                      <td className="p-3.5">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{row.prescriberName}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {row.prescriberClinic}
                          </span>
                          {row.clinicalNotes && (
                            <span className="text-[10px] text-slate-500 italic block mt-0.5">
                              "{row.clinicalNotes}"
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Detail Drawer / Inspection Box (When row is selected) ─────────── */}
      {selectedEntry && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              Detailed Dispensing Record: {selectedEntry.medicineName} ({selectedEntry.dispensedDateFormatted})
            </span>
            <button
              onClick={() => setSelectedEntry(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
            >
              Close Details
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 block">Prescriber Clinic &amp; Doctor</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {selectedEntry.prescriberName} • {selectedEntry.prescriberClinic}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Dispensing Pharmacist &amp; Branch</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {selectedEntry.dispensingPharmacist} ({selectedEntry.pharmacyName})
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Financial &amp; Pricing</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {formatUGX(selectedEntry.totalCostUgx)} ({formatUGX(selectedEntry.unitPriceUgx)}/unit)
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
