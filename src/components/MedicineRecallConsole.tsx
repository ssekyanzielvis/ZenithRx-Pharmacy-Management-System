import React, { useState } from 'react';
import {
  RecallIncidentRecord,
  RecallIncidentSeverity,
  RecallBranchHolding,
  RecallDispensingAuditEntry,
} from '../types';
import { medicineRecallService } from '../services/medicineRecallService';
import { getMasterMedicines } from '../services/medicineSafetyService';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Boxes,
  Building2,
  Users,
  Send,
  Download,
  CheckCircle2,
  PhoneCall,
  Clock,
  Eye,
  Plus,
  Lock,
  Search,
  Filter,
  FileText,
  MapPin,
  X,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

export const MedicineRecallConsole: React.FC = () => {
  const [incidents, setIncidents] = useState<RecallIncidentRecord[]>(
    medicineRecallService.getAllIncidents()
  );
  const [selectedIncident, setSelectedIncident] = useState<RecallIncidentRecord | null>(
    incidents[0] || null
  );
  const [activeTab, setActiveTab] = useState<'holdings' | 'patients' | 'dossier'>('holdings');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewRecallModal, setShowNewRecallModal] = useState(false);
  const [selectedPatientAudit, setSelectedPatientAudit] = useState<RecallDispensingAuditEntry | null>(null);

  // New Recall Form State
  const [newRecallForm, setNewRecallForm] = useState({
    batchNumber: 'ABC123',
    medicineName: 'Paracetamol 500mg Tablets (Box of 100)',
    brandName: 'Panadol Extra',
    genericName: 'Paracetamol',
    manufacturerName: 'Cipla Quality Chemicals Uganda',
    supplierName: 'Rene Industries Ltd',
    authority: 'National Drug Authority (NDA) Uganda',
    severity: 'class_1_critical_life_threatening' as RecallIncidentSeverity,
    reason: 'Active ingredient potency failure identified during routine market surveillance.',
    clinicalHazard: 'Sub-therapeutic blood levels or failure to relieve acute pain/pyrexia. Immediate quarantine enforced.',
    initiatedByName: 'Dr. Elvis Ssekyanzi',
    initiatedByRole: 'Superintendent Pharmacist',
  });

  const refreshData = () => {
    const all = medicineRecallService.getAllIncidents();
    setIncidents(all);
    if (selectedIncident) {
      setSelectedIncident(medicineRecallService.getIncidentById(selectedIncident.id) || all[0] || null);
    }
  };

  const kpis = medicineRecallService.getRecallKPIs();

  const handleCreateRecall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecallForm.batchNumber || !newRecallForm.reason) {
      alert('Batch Number and Recall Reason are mandatory.');
      return;
    }

    const created = medicineRecallService.triggerBatchRecall(newRecallForm);
    refreshData();
    setSelectedIncident(created);
    setShowNewRecallModal(false);
    alert(`Emergency Recall for Batch ${newRecallForm.batchNumber} initiated! All branch POS registers have been locked.`);
  };

  const handleDispatchAlerts = (incidentId: string) => {
    const count = medicineRecallService.dispatchPatientRecallAlerts(incidentId);
    refreshData();
    alert(`Urgent SMS recall safety alerts successfully dispatched to ${count} patients.`);
  };

  const handleUpdatePatientClinicalStatus = (
    entry: RecallDispensingAuditEntry,
    status: 'healthy_no_symptoms' | 'mild_reaction_reported' | 'referred_to_hospital',
    alertStatus: 'phone_call_confirmed' | 'medicine_returned_exchanged',
    notes: string
  ) => {
    if (!selectedIncident) return;
    medicineRecallService.updatePatientClinicalAudit(selectedIncident.id, entry.id, {
      alertStatus,
      clinicalStatus: status,
      contactNotes: notes,
    });
    refreshData();
    setSelectedPatientAudit(null);
  };

  const getSeverityBadge = (sev: RecallIncidentSeverity) => {
    switch (sev) {
      case 'class_1_critical_life_threatening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-xs animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5" />
            Class I (Life Threatening)
          </span>
        );
      case 'class_2_serious_harm':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Class II (Serious Harm)
          </span>
        );
      case 'class_3_minor_defect_or_labeling':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Class III (Minor Defect)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              National Medicine Recall Command (§11.6, §11.20)
            </span>
            <span className="text-xs font-semibold text-slate-500">Uganda National Drug Authority Pharmacovigilance Protocol</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Batch Recall &amp; Multi-Branch Incident Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Identify holding pharmacies, freeze point-of-sale registers, audit dispensing &amp; order history, trace affected patients, and generate official NDA regulatory dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewRecallModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <AlertOctagon className="w-4 h-4" />
            Trigger Emergency Batch Recall
          </button>
        </div>
      </div>

      {/* KPI Cockpit */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Recalls</span>
          <p className="text-2xl font-black text-red-600 mt-1">{kpis.activeRecalls}</p>
          <span className="text-[10px] text-slate-500">Under active surveillance</span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Branches Locked</span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{kpis.totalBranchesLocked}</p>
          <span className="text-[10px] text-amber-600 font-bold">100% POS Sales Frozen</span>
        </div>

        <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Units Quarantined</span>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">{kpis.totalQuarantinedUnits}</p>
          <span className="text-[10px] text-purple-600">Isolated in secure cages</span>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Exposed Public Units</span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{kpis.totalExposedDispensedUnits}</p>
          <span className="text-[10px] text-rose-600">Dispensed historically</span>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Affected Patients</span>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{kpis.totalAffectedPatients}</p>
          <span className="text-[10px] text-blue-600">Identified via Rx scan</span>
        </div>
      </div>

      {/* Main Incident Selector & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incidents List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Active Recall Incidents
          </h3>

          <div className="space-y-2">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  selectedIncident?.id === inc.id
                    ? 'bg-red-50/60 dark:bg-red-950/30 border-red-300 dark:border-red-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400">
                    {inc.recallCaseNumber}
                  </span>
                  {getSeverityBadge(inc.severity)}
                </div>

                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                  {inc.medicineName}
                </h4>

                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Target Batch: <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{inc.targetBatchNumber}</span>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block">BRANCHES</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{inc.totalAffectedBranchesCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">QUARANTINED</span>
                    <span className="font-bold text-purple-600">{inc.totalQuarantinedRemainingQty}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">PATIENTS</span>
                    <span className="font-bold text-rose-600">{inc.totalAffectedPatientsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Deep Incident Command Center */}
        {selectedIncident ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Header Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-red-600">
                      {selectedIncident.recallCaseNumber}
                    </span>
                    {getSeverityBadge(selectedIncident.severity)}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                    {selectedIncident.medicineName}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDispatchAlerts(selectedIncident.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch SMS Alerts ({selectedIncident.totalAffectedPatientsCount})
                  </button>
                </div>
              </div>

              {/* Rationale & Hazard summary */}
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Recall Rationale: {selectedIncident.recallReason}
                </span>
                <p className="text-red-900 dark:text-red-200 text-[11px]">{selectedIncident.clinicalHazardSummary}</p>
                <div className="text-[10px] text-red-700 dark:text-red-400 font-medium pt-1">
                  Manufacturer: {selectedIncident.manufacturerName} ({selectedIncident.countryOfManufacture}) &bull; Supplier: {selectedIncident.supplierName} &bull; Authority: {selectedIncident.issuingAuthority}
                </div>
              </div>

              {/* Sub Tabs */}
              <div className="border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setActiveTab('holdings')}
                  className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'holdings'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Multi-Branch Holdings ({selectedIncident.branchHoldings?.length || 0})
                </button>

                <button
                  onClick={() => setActiveTab('patients')}
                  className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'patients'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Patient Safety Outreach ({selectedIncident.dispensingAudit?.length || 0})
                </button>

                <button
                  onClick={() => setActiveTab('dossier')}
                  className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'dossier'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  NDA Regulatory Dossier
                </button>
              </div>

              {/* Tab 1: Multi-Branch Holdings Table */}
              {activeTab === 'holdings' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Pharmacy &amp; Branch</th>
                        <th className="px-3 py-2.5">Received Qty</th>
                        <th className="px-3 py-2.5">Quarantined (Remaining)</th>
                        <th className="px-3 py-2.5">Dispensed Qty</th>
                        <th className="px-3 py-2.5">Storage Location</th>
                        <th className="px-3 py-2.5">POS Register Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedIncident.branchHoldings?.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{h.pharmacyName}</div>
                            <div className="text-[10px] text-slate-500">{h.branchName} ({h.branchLocation})</div>
                          </td>
                          <td className="px-3 py-3 font-semibold">{h.quantityReceived}</td>
                          <td className="px-3 py-3 font-bold text-purple-600">{h.quantityQuarantined}</td>
                          <td className="px-3 py-3 font-bold text-rose-600">{h.quantityDispensed}</td>
                          <td className="px-3 py-3 text-slate-600 dark:text-slate-300 font-medium">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{h.quarantineLocation}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Patient Safety Outreach Ledger */}
              {activeTab === 'patients' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Patient Name &amp; Contact</th>
                        <th className="px-3 py-2.5">Prescription / Order</th>
                        <th className="px-3 py-2.5">Dispensed On</th>
                        <th className="px-3 py-2.5">Outreach Status</th>
                        <th className="px-3 py-2.5">Clinical Follow-up Notes</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedIncident.dispensingAudit?.map((aud) => (
                        <tr key={aud.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{aud.patientName}</div>
                            <div className="font-mono text-[10px] text-slate-500">{aud.patientPhone}</div>
                            <div className="text-[9px] text-slate-400">{aud.patientDistrict}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-mono text-[11px] font-semibold">{aud.prescriptionNumber || aud.orderNumber || 'Counter Sale'}</div>
                            <div className="text-[10px] text-slate-500">{aud.quantityDispensed} units dispensed</div>
                          </td>
                          <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                            {new Date(aud.dispensedAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3">
                            {aud.patientAlertStatus === 'sms_delivered' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                SMS Delivered
                              </span>
                            )}
                            {aud.patientAlertStatus === 'phone_call_confirmed' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Call Confirmed
                              </span>
                            )}
                            {aud.patientAlertStatus === 'medicine_returned_exchanged' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                Pack Exchanged
                              </span>
                            )}
                            {aud.patientAlertStatus === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                Pending Outreach
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-600 dark:text-slate-400 text-[11px] italic max-w-xs">
                            "{aud.contactNotes}"
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => setSelectedPatientAudit(aud)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-semibold"
                            >
                              Log Call
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: Official NDA Dossier Report */}
              {activeTab === 'dossier' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Official Regulatory Form NDA-REC-STD</span>
                    <button
                      onClick={() => {
                        const txt = medicineRecallService.generateRecallDossierText(selectedIncident.id);
                        navigator.clipboard.writeText(txt);
                        alert('Official NDA Recall Dossier copied to clipboard!');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Copy / Export Dossier Text
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-900 text-emerald-400 text-[11px] font-mono rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                    {medicineRecallService.generateRecallDossierText(selectedIncident.id)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
            Select a recall incident to view multi-branch exposure and patient outreach.
          </div>
        )}
      </div>

      {/* Trigger New Recall Modal */}
      {showNewRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateRecall} className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900 pb-3">
              <h3 className="text-lg font-black text-red-600 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" />
                Execute National Medicine Batch Recall
              </h3>
              <button
                type="button"
                onClick={() => setShowNewRecallModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Batch Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC123"
                  value={newRecallForm.batchNumber}
                  onChange={(e) => setNewRecallForm({ ...newRecallForm, batchNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Severity Classification *</label>
                <select
                  value={newRecallForm.severity}
                  onChange={(e) => setNewRecallForm({ ...newRecallForm, severity: e.target.value as RecallIncidentSeverity })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="class_1_critical_life_threatening">Class I: Critical / Life-Threatening</option>
                  <option value="class_2_serious_harm">Class II: Serious Health Hazard</option>
                  <option value="class_3_minor_defect_or_labeling">Class III: Minor Defect / Labeling</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg Tablets"
                  value={newRecallForm.medicineName}
                  onChange={(e) => setNewRecallForm({ ...newRecallForm, medicineName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={newRecallForm.manufacturerName}
                  onChange={(e) => setNewRecallForm({ ...newRecallForm, manufacturerName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Supplier / Distributor</label>
                <input
                  type="text"
                  value={newRecallForm.supplierName}
                  onChange={(e) => setNewRecallForm({ ...newRecallForm, supplierName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Recall Reason *</label>
              <textarea
                required
                rows={2}
                value={newRecallForm.reason}
                onChange={(e) => setNewRecallForm({ ...newRecallForm, reason: e.target.value })}
                placeholder="Reason for recall (e.g. dissolution failure, bacterial contamination, mislabeled strength)..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinical Hazard Summary</label>
              <textarea
                rows={2}
                value={newRecallForm.clinicalHazard}
                onChange={(e) => setNewRecallForm({ ...newRecallForm, clinicalHazard: e.target.value })}
                placeholder="Clinical risk description and patient counseling instructions..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewRecallModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                Enforce Multi-Branch Lock &amp; Recall
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log Patient Call Modal */}
      {selectedPatientAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-600" />
              Log Patient Safety Contact: {selectedPatientAudit.patientName}
            </h3>

            <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <div>Phone: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedPatientAudit.patientPhone}</span></div>
              <div>Prescription: <span className="font-mono">{selectedPatientAudit.prescriptionNumber || selectedPatientAudit.orderNumber}</span></div>
              <div>Quantity: <span className="font-bold">{selectedPatientAudit.quantityDispensed} units</span></div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() =>
                  handleUpdatePatientClinicalStatus(
                    selectedPatientAudit,
                    'healthy_no_symptoms',
                    'phone_call_confirmed',
                    'Spoke with patient. Confirmed feeling well with no adverse reaction. Advised on retaining remaining tablets.'
                  )
                }
                className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl text-xs font-bold text-left"
              >
                ✓ Patient Call Confirmed — Healthy / No Symptoms
              </button>

              <button
                onClick={() =>
                  handleUpdatePatientClinicalStatus(
                    selectedPatientAudit,
                    'healthy_no_symptoms',
                    'medicine_returned_exchanged',
                    'Patient brought pack to counter. Returned stock quarantined and exchanged for replacement lot.'
                  )
                }
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-xl text-xs font-bold text-left"
              >
                🔄 Pack Returned to Pharmacy &amp; Exchanged
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPatientAudit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
