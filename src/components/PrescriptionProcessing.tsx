/**
 * PrescriptionProcessing.tsx — ZenithRx Clinical Prescription & AI Digitizer Hub
 * Clean Architecture: Presentation Layer
 * Integrates Cloudflare R2 direct document uploads, multimodal Gemini AI extraction,
 * real-time allergy/drug interaction checks, and stock-aware dispensing.
 */

import React, { useState, useRef } from 'react';
import { Prescription, DrugItem } from '../types';
import { usePrescriptionProcessing } from '../hooks/usePrescriptionProcessing';
import { formatUGX } from '../services/formatters';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Printer,
  Upload,
  User,
  Stethoscope,
  Clock,
  ShieldAlert,
  Loader2,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Pill,
  Building2,
  FileCheck2,
  Layers,
  ArrowRight,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

interface PrescriptionProcessingProps {
  prescriptions: Prescription[];
  drugs: DrugItem[];
  tenantId?: string;
  onDispensePrescription: (rxId: string) => void;
  onAddPrescription: (newRx: Prescription) => void;
}

export const PrescriptionProcessing: React.FC<PrescriptionProcessingProps> = ({
  prescriptions,
  drugs,
  tenantId,
  onDispensePrescription,
  onAddPrescription,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedRx,
    selectedRxId,
    setSelectedRxId,
    filteredPrescriptions,
    showAddModal,
    setShowAddModal,

    // File Upload & Preview
    uploadedFile,
    previewUrl,
    isUploading,
    uploadProgress,
    handleFileSelect,
    clearUploadedFile,

    // AI Digitizer
    isAiParsing,
    aiError,
    rxNotesText,
    setRxNotesText,
    parsedAiData,
    setParsedAiData,
    handleAiParse,
    handleCreatePrescriptionFromAi,

    // Clinical Safety
    isCheckingInteractions,
    clinicalAnalysis,
    handleCheckInteractions,

    // Stock & Dispense
    canDispense,
    getStockShortages,
    handleDispense,
  } = usePrescriptionProcessing({
    prescriptions,
    drugs,
    tenantId,
    onDispensePrescription,
    onAddPrescription,
  });

  // Modal & Viewer states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'manual'>('upload');
  const [dispenseSuccess, setDispenseSuccess] = useState(false);

  // Manual Fallback Form State
  const [manualForm, setManualForm] = useState({
    patientName: '',
    patientAge: '',
    doctorName: '',
    diagnosis: '',
    medications: [{ drugName: '', dosage: '', frequency: '', duration: '', quantity: 1 }]
  });

  const handleManualSubmit = () => {
    handleCreatePrescriptionFromAi({
      patientName: manualForm.patientName || 'Unknown Patient',
      patientAge: manualForm.patientAge,
      doctorName: manualForm.doctorName || 'Unknown Doctor',
      diagnosis: manualForm.diagnosis,
      medications: manualForm.medications.filter(m => m.drugName.trim() !== '')
    });
    setManualForm({
      patientName: '', patientAge: '', doctorName: '', diagnosis: '',
      medications: [{ drugName: '', dosage: '', frequency: '', duration: '', quantity: 1 }]
    });
  };

  const shortages = selectedRx ? getStockShortages(selectedRx) : [];

  const handlePrintLabel = (rx: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Dispensing Slip - ${rx.rxNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
            h2 { text-align: center; margin: 0; font-size: 16px; }
            .meta { font-size: 12px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            .med-item { margin: 8px 0; border-bottom: 1px dotted #ccc; padding-bottom: 4px; font-size: 13px; }
            .warning { font-size: 11px; margin-top: 15px; font-style: italic; text-align: center; }
            .footer { text-align: center; font-size: 11px; margin-top: 15px; border-top: 1px dashed #000; padding-top: 5px; }
          </style>
        </head>
        <body>
          <h2>ZENITHRX PHARMACY</h2>
          <p style="text-align:center;font-size:11px;margin:2px 0;">Official Clinical Dispensing Label</p>
          <div class="meta">
            <div><b>Rx Number:</b> ${rx.rxNumber}</div>
            <div><b>Patient:</b> ${rx.patientName} (${rx.patientAge}y, ${rx.patientGender})</div>
            <div><b>Prescriber:</b> ${rx.doctorName}</div>
            <div><b>Hospital:</b> ${rx.hospitalName}</div>
            <div><b>Date:</b> ${rx.date}</div>
            <div><b>Status:</b> ${rx.status.toUpperCase()}</div>
          </div>
          <div><b>PRESCRIBED MEDICATIONS:</b></div>
          ${rx.medications.map((m, idx) => `
            <div class="med-item">
              <div><b>${idx + 1}. ${m.drugName}</b> (Qty: ${m.quantity})</div>
              <div><i>Dosage:</i> ${m.dosage} - ${m.frequency}</div>
              <div><i>Duration:</i> ${m.duration}</div>
            </div>
          `).join('')}
          <div class="warning">Keep all medicines out of reach of children. Store in a cool dry place below 30°C.</div>
          <div class="footer">Dispensed by Registered Pharmacist • NDA Reg: NDA/P/2026/0491</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExecuteDispense = (rxId: string) => {
    handleDispense(rxId);
    setDispenseSuccess(true);
    setTimeout(() => setDispenseSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Header & Action Controls ──────────────────────────────────── */}
      <div className="bg-[#1E293B] rounded-2xl p-6 text-white border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-green-500/20 text-green-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-400/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Multimodal Gemini 2.0 Flash
            </span>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5" /> Cloudflare R2 Clinical Storage
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Clinical Prescription &amp; AI Digitizer Hub</h1>
          <p className="text-slate-300 text-sm mt-0.5">
            OCR handwritten doctor notes, verify contraindications in real-time, and execute stock-aware dispensing.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Digitize &amp; Upload Rx</span>
        </button>
      </div>

      {/* ─── Filter Tabs & Search Bar ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Rx#, patient, or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Pending', 'Dispensed', 'Partially Dispensed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === filter
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter} ({prescriptions.filter((rx) => filter === 'All' || rx.status === filter).length})
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Two-Column Clinical Workbench ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prescription Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              Clinical Queue ({filteredPrescriptions.length})
            </h2>
          </div>

          {filteredPrescriptions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-medium text-slate-700 dark:text-slate-300">No prescriptions found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or upload a new prescription.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {filteredPrescriptions.map((rx) => {
                const isSelected = rx.id === selectedRx?.id;
                const isPending = rx.status === 'Pending';
                return (
                  <div
                    key={rx.id}
                    onClick={() => {
                      setSelectedRxId(rx.id);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-500 shadow-md ring-1 ring-sky-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                            {rx.rxNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              rx.status === 'Dispensed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : rx.status === 'Partially Dispensed'
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            }`}
                          >
                            {rx.status}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                          {rx.patientName}
                          <span className="text-xs font-normal text-slate-500 ml-2">
                            ({rx.patientAge}y, {rx.patientGender})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Stethoscope className="w-3 h-3 text-slate-400" />
                          {rx.doctorName} • {rx.hospitalName}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {formatUGX(rx.totalCost)}
                        </span>
                        <p className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {rx.date}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {rx.medications.length} {rx.medications.length === 1 ? 'Medication' : 'Medications'}
                      </span>
                      <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-0.5">
                        Inspect & Dispense <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Prescription Inspection Workbench */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRx ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedRx.rxNumber}
                    </h3>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                        selectedRx.status === 'Dispensed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {selectedRx.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Prescribed on {selectedRx.date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintLabel(selectedRx)}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                    title="Print Thermal Dispensing Slip"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Slip</span>
                  </button>

                  <button
                    onClick={() => handleCheckInteractions(selectedRx)}
                    disabled={isCheckingInteractions}
                    className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {isCheckingInteractions ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span>AI Safety Scan</span>
                  </button>
                </div>
              </div>

              {/* Patient & Doctor Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" /> Patient Details
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
                    {selectedRx.patientName}
                  </div>
                  <div className="text-slate-500">
                    Age: {selectedRx.patientAge} yrs • Gender: {selectedRx.patientGender}
                  </div>
                  <div className="text-slate-500">Phone: {selectedRx.patientPhone}</div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> Prescriber & Facility
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
                    {selectedRx.doctorName}
                  </div>
                  <div className="text-slate-500">License: {selectedRx.doctorLicence}</div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {selectedRx.hospitalName}
                  </div>
                </div>
              </div>

              {/* Clinical Notes if available */}
              {selectedRx.notes && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Prescriber Clinical Notes / Diagnosis:</span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-300">{selectedRx.notes}</p>
                  </div>
                </div>
              )}

              {/* AI Clinical Safety Scan Results */}
              {clinicalAnalysis && (
                <div className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                        AI Clinical Contraindication Analysis
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        clinicalAnalysis.overallRiskLevel === 'LOW'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : clinicalAnalysis.overallRiskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      Risk: {clinicalAnalysis.overallRiskLevel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {clinicalAnalysis.summary}
                  </p>

                  {clinicalAnalysis.interactions.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Drug-Drug Interactions:
                      </span>
                      {clinicalAnalysis.interactions.map((int, i) => (
                        <div
                          key={i}
                          className="text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {int.drugsInvolved.join(' + ')}
                            </span>
                            <span className="text-[10px] font-bold text-red-600 uppercase">
                              {int.severity}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">{int.description}</p>
                          <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                            Action: {int.actionRequired}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {clinicalAnalysis.recommendations.length > 0 && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Pharmacist Recommendations:
                      </span>
                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                        {clinicalAnalysis.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Prescribed Medications Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-sky-500" /> Prescribed Medications ({selectedRx.medications.length})
                  </h4>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Medication & Regimen</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-center">Stock Status</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedRx.medications.map((med, idx) => {
                        const matchingDrug = drugs.find(
                          (d) => d.id === med.drugId || d.brandName.toLowerCase() === med.drugName.toLowerCase()
                        );
                        const stockQty = matchingDrug ? matchingDrug.stockQty : 0;
                        const hasSufficientStock = stockQty >= (med.quantity - med.dispensedQty);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {med.drugName}
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                {med.dosage} • {med.frequency} • {med.duration}
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {med.quantity}
                            </td>
                            <td className="p-3 text-center">
                              {matchingDrug ? (
                                hasSufficientStock ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                                    In Stock ({stockQty})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300">
                                    Low ({stockQty} avail)
                                  </span>
                                )
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Not in Master
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                              {formatUGX(med.unitPrice)}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                              {formatUGX(med.unitPrice * med.quantity)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shortage warning if applicable */}
              {shortages.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3.5 text-xs text-red-800 dark:text-red-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Cannot Dispense: Insufficient Stock
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {shortages.map((s, i) => (
                      <li key={i}>
                        <b>{s.drugName}</b>: Requires {s.requiredQty}, but only {s.availableQty} available in inventory.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dispense Success banner */}
              {dispenseSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3.5 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold">Prescription successfully dispensed! Stock deducted and audit record logged.</span>
                </div>
              )}

              {/* Footer Total & Dispense Action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">Total Prescription Value</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatUGX(selectedRx.totalCost)}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {selectedRx.status === 'Dispensed' ? (
                    <div className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 font-bold px-6 py-3 rounded-xl border border-green-300 dark:border-green-800 flex items-center gap-2 w-full sm:w-auto justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Dispensed &amp; Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleExecuteDispense(selectedRx.id)}
                      disabled={!canDispense(selectedRx)}
                      className={`font-bold px-7 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer ${
                        canDispense(selectedRx)
                          ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Dispense Medicine</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No Prescription Selected
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select a prescription from the clinical queue to inspect medication items or execute dispensing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal: Multimodal AI Digitizer & Cloudflare R2 Document Upload ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-[#1E293B] text-white">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Prescription Digitizer & Cloudflare R2 Upload
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Upload prescription scans/PDFs directly to Cloudflare R2 or parse handwritten clinical notes with Gemini AI.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  clearUploadedFile();
                }}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Input Mode Selector */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'upload'
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Rx Document / Image (R2)</span>
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'text'
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Paste Clinical Notes</span>
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'manual'
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Manual Entry Fallback</span>
                </button>
              </div>

              {/* Tab 1: Document Upload & Dropzone */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  {!previewUrl ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 rounded-2xl p-8 text-center bg-sky-50/40 dark:bg-sky-950/20 cursor-pointer transition-all hover:bg-sky-50/70"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                      <Upload className="w-10 h-10 text-sky-500 mx-auto mb-2" />
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        Click or drag prescription scan / photo here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports JPEG, PNG, WEBP, and PDF documents. Uploads securely to Cloudflare R2 bucket.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          <FileCheck2 className="w-4 h-4 text-emerald-400" />
                          <span>{uploadedFile?.name}</span>
                          <span className="text-slate-500">
                            ({(Number(uploadedFile?.size || 0) / 1024).toFixed(1)} KB)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setImageRotation((r) => (r + 90) % 360)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setImageZoom((z) => Math.max(0.6, z - 0.2))}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setImageZoom((z) => Math.min(2.5, z + 0.2))}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button
                            onClick={clearUploadedFile}
                            className="p-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 rounded-lg"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* R2 Upload Progress Indicator */}
                      {isUploading && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-sky-300">
                            <span>Uploading to Cloudflare R2...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-500 transition-all duration-200"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Image Viewer Frame */}
                      <div className="h-64 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center relative">
                        <img
                          src={previewUrl}
                          alt="Prescription Scan"
                          style={{
                            transform: `rotate(${imageRotation}deg) scale(${imageZoom})`,
                            transition: 'transform 0.2s ease',
                          }}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleAiParse('image')}
                    disabled={!previewUrl || isAiParsing}
                    className={`w-full py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                      previewUrl && !isAiParsing
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-sky-500/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isAiParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing Document with Gemini Multimodal AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Scan & Extract Prescription with Gemini AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 2: Text Notes Input */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Handwritten Prescription Notes / Doctor Memo:
                    </label>
                    <button
                      onClick={() =>
                        setRxNotesText(
                          'Pt: John Mukasa, 45y Male. Mulago OPD. Dr. Kasule Lic: UMDPC-8821.\nDx: Severe Peptic Ulcer Disease & Hypertension.\n1. Esomeprazole 40mg daily x 14 days\n2. Amoxicillin 1g BD x 7 days\n3. Clarithromycin 500mg BD x 7 days\n4. Amlodipine 5mg daily x 30 days\nNo known penicillin allergy reported.'
                        )
                      }
                      className="text-xs text-sky-600 hover:underline font-medium"
                    >
                      Insert Sample Note
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={rxNotesText}
                    onChange={(e) => setRxNotesText(e.target.value)}
                    placeholder="e.g. Pt: Sarah Achieng, 32y. Dr. Okello. Amoxicillin 500mg TDS x 5 days, Paracetamol 1g QID x 3 days..."
                    className="w-full p-3.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />

                  <button
                    onClick={() => handleAiParse('text')}
                    disabled={!rxNotesText.trim() || isAiParsing}
                    className={`w-full py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                      rxNotesText.trim() && !isAiParsing
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-sky-500/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isAiParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting Structured Rx via Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Extract Structured Prescription Data</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 3: Manual Entry Fallback */}
              {activeTab === 'manual' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Manual Fallback Mode Activated</span>
                      <p className="mt-0.5">Use this structured form if AI parsing fails or API is unavailable.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Patient Name</label>
                      <input
                        type="text"
                        value={manualForm.patientName}
                        onChange={(e) => setManualForm({ ...manualForm, patientName: e.target.value })}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Patient Age</label>
                      <input
                        type="text"
                        value={manualForm.patientAge}
                        onChange={(e) => setManualForm({ ...manualForm, patientAge: e.target.value })}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Doctor Name</label>
                      <input
                        type="text"
                        value={manualForm.doctorName}
                        onChange={(e) => setManualForm({ ...manualForm, doctorName: e.target.value })}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Diagnosis / Notes</label>
                      <input
                        type="text"
                        value={manualForm.diagnosis}
                        onChange={(e) => setManualForm({ ...manualForm, diagnosis: e.target.value })}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 transition-shadow"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">Medications</label>
                      <button
                        onClick={() => setManualForm(prev => ({
                          ...prev,
                          medications: [...prev.medications, { drugName: '', dosage: '', frequency: '', duration: '', quantity: 1 }]
                        }))}
                        className="text-[10px] bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-2.5 py-1.5 rounded-lg font-bold hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Drug
                      </button>
                    </div>
                    {manualForm.medications.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 text-xs border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 shadow-sm relative group">
                        <div className="col-span-12 sm:col-span-3">
                          <input placeholder="Drug Name" value={m.drugName} onChange={e => {
                            const newMeds = [...manualForm.medications];
                            newMeds[idx].drugName = e.target.value;
                            setManualForm({ ...manualForm, medications: newMeds });
                          }} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                          <input placeholder="Dosage (e.g. 500mg)" value={m.dosage} onChange={e => {
                            const newMeds = [...manualForm.medications];
                            newMeds[idx].dosage = e.target.value;
                            setManualForm({ ...manualForm, medications: newMeds });
                          }} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                          <input placeholder="Freq (TDS)" value={m.frequency} onChange={e => {
                            const newMeds = [...manualForm.medications];
                            newMeds[idx].frequency = e.target.value;
                            setManualForm({ ...manualForm, medications: newMeds });
                          }} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                          <input placeholder="Duration" value={m.duration} onChange={e => {
                            const newMeds = [...manualForm.medications];
                            newMeds[idx].duration = e.target.value;
                            setManualForm({ ...manualForm, medications: newMeds });
                          }} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        </div>
                        <div className="col-span-10 sm:col-span-1">
                          <input placeholder="Qty" type="number" min="1" value={m.quantity || ''} onChange={e => {
                            const newMeds = [...manualForm.medications];
                            newMeds[idx].quantity = Number(e.target.value);
                            setManualForm({ ...manualForm, medications: newMeds });
                          }} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 text-center" />
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                           <button 
                             onClick={() => {
                               const newMeds = manualForm.medications.filter((_, i) => i !== idx);
                               if (newMeds.length === 0) newMeds.push({ drugName: '', dosage: '', frequency: '', duration: '', quantity: 1 });
                               setManualForm({ ...manualForm, medications: newMeds });
                             }}
                             className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                           >
                             <X className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleManualSubmit}
                    disabled={manualForm.medications.every(m => !m.drugName)}
                    className={`w-full py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                      manualForm.medications.some(m => m.drugName)
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 transform hover:-translate-y-0.5'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Create Prescription Manually</span>
                  </button>
                </div>
              )}

              {/* AI Error Feedback */}
              {aiError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3.5 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Parsed AI Data Review Card */}
              {parsedAiData && (
                <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                        AI Extraction Successful — Review & Confirm
                      </h4>
                    </div>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                      {parsedAiData.medications?.length || 0} Medications Extracted
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400">Patient:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {parsedAiData.patientName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Age:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {parsedAiData.patientAge ? `${parsedAiData.patientAge}y` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Doctor:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {parsedAiData.doctorName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Diagnosis:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {parsedAiData.diagnosis || 'Clinical Rx'}
                      </p>
                    </div>
                  </div>

                  {/* Extracted Medications List */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Extracted Medication Regimens:
                    </span>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 font-semibold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-2.5">Medication</th>
                            <th className="p-2.5">Dosage</th>
                            <th className="p-2.5">Frequency</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5 text-center">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {parsedAiData.medications?.map((m, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                                {m.drugName}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">{m.dosage}</td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">{m.frequency}</td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">{m.duration}</td>
                              <td className="p-2.5 text-center font-bold text-slate-800 dark:text-slate-200">
                                {m.quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {parsedAiData.warnings && parsedAiData.warnings.length > 0 && (
                    <div className="bg-amber-100/70 dark:bg-amber-950/40 p-3 rounded-lg text-xs text-amber-900 dark:text-amber-300">
                      <span className="font-bold">AI Clinical Warnings:</span>
                      <ul className="list-disc pl-4 mt-0.5">
                        {parsedAiData.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Add to Queue Button */}
                  <button
                    onClick={() => handleCreatePrescriptionFromAi(parsedAiData)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create & Enqueue Prescription</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
