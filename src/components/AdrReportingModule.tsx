import React, { useState, useEffect } from 'react';
import { AdverseDrugReactionReport, AdrSeverity, AdrCausality, AdrOutcome } from '../types';
import {
  getAdrReports,
  submitAdrReport,
  transmitAdrToNdaYellowSheet,
} from '../services/adrReportingService';
import {
  AlertOctagon,
  Plus,
  Send,
  CheckCircle2,
  FileText,
  Clock,
  ShieldAlert,
  Search,
  Activity,
  Download,
} from 'lucide-react';

interface AdrReportingModuleProps {
  tenantId?: string;
  pharmacyName?: string;
  currentUser?: {
    name?: string;
    role?: string;
    phone?: string;
  };
}

export const AdrReportingModule: React.FC<AdrReportingModuleProps> = ({
  tenantId = 'client-001',
  pharmacyName = 'Kampala City Pharmacy',
  currentUser = {
    name: 'Dr. Arthur Ssenabulya',
    role: 'Supervising Pharmacist',
    phone: '+256 701 234567',
  },
}) => {
  const [reports, setReports] = useState<AdverseDrugReactionReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AdverseDrugReactionReport | null>(null);

  // New ADR Form State
  const [patientInitials, setPatientInitials] = useState('');
  const [patientAge, setPatientAge] = useState(30);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [patientWeightKg, setPatientWeightKg] = useState<number | undefined>(60);
  const [suspectedDrug, setSuspectedDrug] = useState('');
  const [suspectedBrand, setSuspectedBrand] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [dose, setDose] = useState('');
  const [route, setRoute] = useState<AdverseDrugReactionReport['suspectedDrugRoute']>('Oral');
  const [dateStarted, setDateStarted] = useState('');
  const [dateReactionStarted, setDateReactionStarted] = useState('');
  const [reactionDescription, setReactionDescription] = useState('');
  const [severity, setSeverity] = useState<AdrSeverity>('Moderate');
  const [causality, setCausality] = useState<AdrCausality>('Probable / Likely');
  const [outcome, setOutcome] = useState<AdrOutcome>('Recovering / Resolving');
  const [concomitantDrugs, setConcomitantDrugs] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  useEffect(() => {
    setReports(getAdrReports(tenantId));
  }, [tenantId]);

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectedDrug || !reactionDescription || !patientInitials) return;

    const newReport = submitAdrReport({
      tenantId,
      pharmacyName,
      reporterName: currentUser.name || 'Clinical Staff',
      reporterRole: currentUser.role || 'Pharmacist',
      reporterContact: currentUser.phone || '+256 700 000000',
      patientInitials,
      patientAge,
      patientGender,
      patientWeightKg,
      suspectedDrugName: suspectedDrug,
      suspectedDrugBrand: suspectedBrand,
      suspectedDrugBatchNumber: batchNo,
      suspectedDrugManufacturer: manufacturer,
      suspectedDrugDose: dose,
      suspectedDrugRoute: route,
      dateStarted: dateStarted || new Date().toISOString().split('T')[0],
      dateReactionStarted: dateReactionStarted || new Date().toISOString().split('T')[0],
      reactionDescription,
      severity,
      causality,
      outcome,
      concomitantDrugs,
      relevantMedicalHistory: medicalHistory,
    });

    setReports([newReport, ...reports]);
    setIsModalOpen(false);

    // Reset
    setPatientInitials('');
    setSuspectedDrug('');
    setReactionDescription('');
    setConcomitantDrugs('');
    setMedicalHistory('');
  };

  const handleTransmitNda = (reportId: string) => {
    const updated = transmitAdrToNdaYellowSheet(reportId);
    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
      if (selectedReport?.id === reportId) {
        setSelectedReport(updated);
      }
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.suspectedDrugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reactionDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientInitials.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              National Pharmacovigilance Centre (NDA)
            </span>
            <span className="text-xs font-semibold text-slate-500">WHO-UMC Yellow Sheet Protocol</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Adverse Drug Reaction (ADR) &amp; Safety Reporting
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Log suspected drug reactions, evaluate clinical causality, and submit electronic Yellow Sheets directly to the National Drug Authority.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Report Adverse Drug Reaction</span>
        </button>
      </div>

      {/* Search & Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{reports.length}</div>
            <div className="text-xs text-slate-500 font-semibold">Total ADR Events Logged</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {reports.filter((r) => r.ndaYellowSheetStatus === 'Submitted to NDA').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Transmitted to NDA Yellow Sheet</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-700 dark:text-rose-300">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {reports.filter((r) => r.severity === 'Severe' || r.severity === 'Life-Threatening').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Severe / Life-Threatening Signals</div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search ADR report, drug, or patient initials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">No Adverse Drug Reaction Reports Found</p>
              <p className="text-xs text-slate-400">All pharmacovigilance reports are stored safely here.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-rose-600 dark:text-rose-400">
                      {report.reportNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        report.severity === 'Severe' || report.severity === 'Life-Threatening'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : report.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Severity: {report.severity}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Causality: {report.causality}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Suspected Drug: <span className="text-indigo-600 dark:text-indigo-400">{report.suspectedDrugName}</span>
                    {report.suspectedDrugBatchNumber && ` (Batch: ${report.suspectedDrugBatchNumber})`}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {report.reactionDescription}
                  </p>

                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Patient: {report.patientInitials} ({report.patientAge}y, {report.patientGender})</span>
                    <span>Reporter: {report.reporterName} ({report.reporterRole})</span>
                    <span>Reported: {new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {report.ndaYellowSheetStatus === 'Submitted to NDA' ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Transmitted to NDA
                      </span>
                      <div className="text-[9px] font-mono text-slate-400 mt-0.5">{report.ndaReferenceNumber}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleTransmitNda(report.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit to NDA Yellow Sheet</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New ADR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  New Adverse Drug Reaction Report
                </h3>
                <p className="text-xs text-slate-500">NDA Uganda Pharmacovigilance Yellow Sheet Form</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Patient Initials *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. J.K."
                    value={patientInitials}
                    onChange={(e) => setPatientInitials(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Suspected Drug &amp; Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625mg"
                    value={suspectedDrug}
                    onChange={(e) => setSuspectedDrug(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AUG-2024-09B"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Adverse Reaction Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the clinical symptoms, onset timing, affected organs, severity, and any medical interventions applied..."
                  value={reactionDescription}
                  onChange={(e) => setReactionDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Severity Grading</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Life-Threatening">Life-Threatening</option>
                    <option value="Fatal">Fatal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Causality Assessment</label>
                  <select
                    value={causality}
                    onChange={(e) => setCausality(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Certain">Certain</option>
                    <option value="Probable / Likely">Probable / Likely</option>
                    <option value="Possible">Possible</option>
                    <option value="Unlikely">Unlikely</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Patient Outcome</label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Recovered / Resolved">Recovered / Resolved</option>
                    <option value="Recovering / Resolving">Recovering / Resolving</option>
                    <option value="Not Recovered">Not Recovered</option>
                    <option value="Recovered with Sequelae">Recovered with Sequelae</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save ADR Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
