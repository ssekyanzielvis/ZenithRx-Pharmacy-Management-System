import React, { useState, useEffect } from 'react';
import {
  getOcrQueueItems,
  updatePrescriptionVerificationStatus,
} from '../../services/prescriptionOcrService';
import { PrescriptionVerificationItem } from '../../types';
import { AssistivePrescriptionAIDesk } from './AssistivePrescriptionAIDesk';
import {
  Scan,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Search,
  Sparkles,
  ShieldCheck,
  Layers
} from 'lucide-react';

export const AdminPrescriptionOCRQueue: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<'ASSISTIVE_AI_DESK' | 'LEGACY_QUEUE'>('ASSISTIVE_AI_DESK');
  const [queue, setQueue] = useState<PrescriptionVerificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pharmacistNotes, setPharmacistNotes] = useState('');

  useEffect(() => {
    setQueue(getOcrQueueItems());
  }, []);

  const handleUpdateStatus = (id: string, status: PrescriptionVerificationItem['verificationStatus']) => {
    const updated = updatePrescriptionVerificationStatus(
      id,
      status,
      'Dr. Arthur Ssenabulya (Supervising Pharmacist)',
      pharmacistNotes
    );
    if (updated) {
      setQueue(getOcrQueueItems());
      setPharmacistNotes('');
    }
  };

  const filtered = queue.filter(
    (q) =>
      q.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.queueNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.ocrExtractedDoctorName && q.ocrExtractedDoctorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* View Switcher Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            Prescription Vision &amp; Clinical Safety Verification
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubView('ASSISTIVE_AI_DESK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              activeSubView === 'ASSISTIVE_AI_DESK'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assistive AI Safety Desk (3-Tier Rule)</span>
          </button>

          <button
            onClick={() => setActiveSubView('LEGACY_QUEUE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubView === 'LEGACY_QUEUE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Compact Audit Queue</span>
          </button>
        </div>
      </div>

      {activeSubView === 'ASSISTIVE_AI_DESK' ? (
        <AssistivePrescriptionAIDesk />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Scan className="w-3.5 h-3.5" />
                  Prescription OCR &amp; Verification Queue (§8, §21)
                </span>
                <span className="text-xs font-semibold text-slate-500">Optical Character Recognition &amp; Fraud Prevention</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                Prescription OCR &amp; Doctor Licence Verification Desk
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Automated image parsing of handwritten doctor prescriptions, OCR confidence scoring, UMDPC doctor licence checking, and clinical drug interaction triage.
              </p>
            </div>
          </div>

          {/* Queue List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search prescription #, patient, or doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.queueNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.verificationStatus === 'Approved & Ready for POS'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.verificationStatus === 'Pending Pharmacist Review'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {item.verificationStatus}
                    </span>

                    <span className="text-[10px] font-semibold text-slate-500">Source: {item.uploadedVia}</span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Patient: {item.patientName} <span className="text-xs font-normal text-slate-500">({item.patientPhone})</span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div>
                      Prescriber: <strong>{item.ocrExtractedDoctorName || 'Doctor'}</strong> ({item.ocrExtractedHospital}) — Lic: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.ocrExtractedDoctorLicence}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.ocrExtractedMedications.map((med, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {med.drugName} ({med.dosage} {med.frequency}) — <span className="text-emerald-600 dark:text-emerald-400">{med.confidenceScore}% OCR confidence</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {item.clinicalSafetyFlags.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Clinical Flag: {item.clinicalSafetyFlags[0].message}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {item.verificationStatus === 'Pending Pharmacist Review' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'Approved & Ready for POS')}
                        className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve Prescription</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(item.id, 'Rejected')}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold border border-rose-200 dark:border-rose-800 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified &amp; Stamped
                      </span>
                      {item.reviewedByPharmacistName && (
                        <div className="text-[10px] text-slate-400 mt-0.5">By {item.reviewedByPharmacistName}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrescriptionOCRQueue;
