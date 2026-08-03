import React, { useState } from 'react';
import { Prescription, DrugItem } from '../types';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Printer,
  Upload,
  User,
  Stethoscope,
  Clock,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';

interface PrescriptionProcessingProps {
  prescriptions: Prescription[];
  drugs: DrugItem[];
  onDispensePrescription: (rxId: string) => void;
  onAddPrescription: (newRx: Prescription) => void;
}

export const PrescriptionProcessing: React.FC<PrescriptionProcessingProps> = ({
  prescriptions,
  drugs,
  onDispensePrescription,
  onAddPrescription,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Dispensed'>('All');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(prescriptions[0] || null);
  const [showAddModal, setShowAddModal] = useState(false);

  // AI Parsing States
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [rxNotesText, setRxNotesText] = useState('');
  const [parsedAiData, setParsedAiData] = useState<any>(null);
  const [clinicalAnalysis, setClinicalAnalysis] = useState<any>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.rxNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAiParse = async () => {
    if (!rxNotesText.trim()) return;
    setIsAiParsing(true);
    try {
      const res = await fetch('/api/ai/parse-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: rxNotesText }),
      });
      const result = await res.json();
      if (result.data) {
        setParsedAiData(result.data);
      }
    } catch (err) {
      console.error('AI Parse error:', err);
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleCheckInteractions = async (rx: Prescription) => {
    setIsCheckingInteractions(true);
    setClinicalAnalysis(null);
    try {
      const res = await fetch('/api/ai/drug-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: rx.medications,
          patientAllergies: 'Penicillin mild rash',
          conditions: 'Asthma, Mild Hypertension',
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setClinicalAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Check interactions error:', err);
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-[#0D223C] text-white p-6 rounded-2xl border border-sky-900/60 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-sky-400" />
            Prescription Processing Center
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            Quantum AI-powered prescription digitizer, dosage safety check, and clinical dispensing queue.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Prescription / AI Scan</span>
        </button>
      </div>

      {/* Main Grid: Left Rx Queue, Right Prescription Details & Safety Check */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Prescription List Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Rx #, patient name, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none text-slate-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Dispensed">Dispensed</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {filteredPrescriptions.map((rx) => {
              const isSelected = selectedRx?.id === rx.id;
              return (
                <div
                  key={rx.id}
                  onClick={() => {
                    setSelectedRx(rx);
                    setClinicalAnalysis(null);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-sky-900 bg-sky-100 px-2 py-0.5 rounded">
                      {rx.rxNumber}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        rx.status === 'Dispensed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {rx.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rx.patientName}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-slate-400" />
                        {rx.doctorName}
                      </p>
                    </div>
                    <p className="text-xs font-black text-slate-900">
                      UGX {rx.totalCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Prescription Detail & Clinical Review Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          {selectedRx ? (
            <div className="space-y-6">
              
              {/* Rx Header details */}
              <div className="flex flex-wrap items-start justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedRx.rxNumber}</h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        selectedRx.status === 'Dispensed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedRx.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Issued on {selectedRx.date} • {selectedRx.hospitalName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCheckInteractions(selectedRx)}
                    disabled={isCheckingInteractions}
                    className="px-3 py-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs flex items-center gap-1.5 border border-sky-300 transition-colors cursor-pointer"
                  >
                    {isCheckingInteractions ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    )}
                    <span>AI Safety Check</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Label</span>
                  </button>
                </div>
              </div>

              {/* Patient & Doctor Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Patient Info
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{selectedRx.patientName}</p>
                  <p className="text-xs text-slate-600">
                    {selectedRx.patientAge} yrs • {selectedRx.patientGender} • {selectedRx.patientPhone}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" /> Prescriber
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{selectedRx.doctorName}</p>
                  <p className="text-xs text-slate-600">Licence: {selectedRx.doctorLicence}</p>
                </div>
              </div>

              {/* AI Clinical Safety Analysis Box */}
              {clinicalAnalysis && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Clinical AI Risk Assessment ({clinicalAnalysis.overallRiskLevel})
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">{clinicalAnalysis.summary}</p>
                  {clinicalAnalysis.interactions?.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] font-bold text-amber-900">Potential Interactions:</p>
                      {clinicalAnalysis.interactions.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs bg-white/80 p-2 rounded border border-amber-200/60">
                          <span className="font-bold text-rose-700">[{item.severity}]</span>{' '}
                          {item.description} - <span className="italic">{item.actionRequired}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Prescribed Medications Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Prescribed Drugs ({selectedRx.medications.length})
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Drug Name</th>
                        <th className="p-3">Dosage & Frequency</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedRx.medications.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{m.drugName}</td>
                          <td className="p-3 text-slate-600">
                            <div>{m.dosage}</div>
                            <div className="text-[10px] text-slate-400">{m.frequency}</div>
                          </td>
                          <td className="p-3 text-slate-600">{m.duration}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{m.quantity}</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            UGX {(m.unitPrice * m.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-bold">Total Prescription Price</p>
                  <p className="text-xl font-black text-slate-900">
                    UGX {selectedRx.totalCost.toLocaleString()}
                  </p>
                </div>

                {selectedRx.status === 'Pending' ? (
                  <button
                    onClick={() => onDispensePrescription(selectedRx.id)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dispense & Complete Prescription</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Prescription Fully Dispensed
                  </span>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a prescription from the queue</div>
          )}
        </div>

      </div>

      {/* Add / AI Parse Prescription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-600" />
                AI Digital Prescription Entry
              </h3>
              <p className="text-xs text-slate-500">
                Paste doctor handwritten notes or digital prescription text to let Quantum AI extract structured data.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Prescription Text / Doctor Notes:
              </label>
              <textarea
                rows={4}
                value={rxNotesText}
                onChange={(e) => setRxNotesText(e.target.value)}
                placeholder="Example: Patient Mary Mwangi age 42. Tab Augmentin 625mg 1 tab BD x 7 days. Tab Paracetamol 500mg 2 tabs TDS PRN x 5 days..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
              ></textarea>

              <button
                onClick={handleAiParse}
                disabled={isAiParsing || !rxNotesText.trim()}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isAiParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Analyze Rx Notes with Quantum AI</span>
              </button>
            </div>

            {parsedAiData && (
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-sky-900">Extracted Patient: {parsedAiData.patientName}</p>
                <div className="space-y-1">
                  <p className="font-bold text-slate-700">Medications Identified:</p>
                  {parsedAiData.medications?.map((m: any, i: number) => (
                    <div key={i} className="bg-white p-2 rounded border border-sky-200 font-mono">
                      {m.drugName} - {m.dosage} ({m.frequency}) Qty: {m.quantity}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newRxObj: Prescription = {
                      id: `RX-${Math.floor(Math.random() * 9000 + 1000)}`,
                      rxNumber: `RX-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
                      patientName: parsedAiData.patientName || 'New Patient',
                      patientAge: parseInt(parsedAiData.patientAge) || 30,
                      patientGender: 'Female',
                      patientPhone: '+256 700 000 000',
                      doctorName: parsedAiData.doctorName || 'Dr. Quantum AI',
                      doctorLicence: 'UMDPC-GEN',
                      hospitalName: 'Outpatient Clinic',
                      date: '2026-07-22',
                      status: 'Pending',
                      medications: parsedAiData.medications?.map((m: any) => ({
                        drugId: 'DRUG-001',
                        drugName: m.drugName,
                        dosage: m.dosage,
                        frequency: m.frequency,
                        duration: m.duration || '7 Days',
                        quantity: m.quantity || 10,
                        unitPrice: 1200,
                        dispensedQty: 0,
                        status: 'Pending',
                      })) || [],
                      totalCost: 2400,
                    };
                    onAddPrescription(newRxObj);
                    setSelectedRx(newRxObj);
                    setShowAddModal(false);
                    setParsedAiData(null);
                    setRxNotesText('');
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold uppercase text-xs cursor-pointer mt-2"
                >
                  Confirm & Save Prescription
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
