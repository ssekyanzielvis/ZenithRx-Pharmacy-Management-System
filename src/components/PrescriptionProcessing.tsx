/**
 * PrescriptionProcessing.tsx — ZenithRx Clinical Prescription & Lifecycle Management Hub
 * Clean Architecture: Presentation Layer
 * Integrates Cloudflare R2 direct document uploads, multimodal Gemini AI extraction,
 * real-time allergy/drug interaction checks, full lifecycle transitions, partial dispensing,
 * and clinical amendment tracking per Uganda NDA / PSU standards.
 */

import React, { useState, useRef } from 'react';
import {
  Prescription,
  DrugItem,
  PrescriptionItem,
  PartialDispensingRecord,
  PrescriptionAmendmentRecord,
} from '../types';
import { usePrescriptionProcessing } from '../hooks/usePrescriptionProcessing';
import { prescriptionLifecycleService } from '../services/prescriptionLifecycleService';
import { PatientClinicalProfileInspector } from './PatientClinicalProfileInspector';
import { GenericSubstitutionFinderModal } from './GenericSubstitutionFinderModal';
import { FefoBatchSelector } from './FefoBatchSelector';
import { fefoDispensingService } from '../services/fefoDispensingService';
import { PrescriptionSubstitutionService } from '../services/prescriptionSubstitutionService';
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
  ChevronRight,
  Pill,
  Building2,
  Layers,
  ShieldCheck,
  PackageCheck,
  FileEdit,
  XCircle,
  History,
  Calendar,
  Phone,
  RefreshCw,
  ArrowLeftRight,
} from 'lucide-react';

interface PrescriptionProcessingProps {
  prescriptions: Prescription[];
  drugs: DrugItem[];
  tenantId?: string;
  onDispensePrescription: (rxId: string) => void;
  onAddPrescription: (newRx: Prescription) => void;
}

export const PrescriptionProcessing: React.FC<PrescriptionProcessingProps> = ({
  prescriptions: initialPrescriptions,
  drugs,
  tenantId,
  onDispensePrescription,
  onAddPrescription,
}) => {
  // Local reactive copy of prescriptions from service
  const [localRxList, setLocalRxList] = useState<Prescription[]>(() =>
    prescriptionLifecycleService.getAll()
  );

  const syncLocalList = () => {
    setLocalRxList(prescriptionLifecycleService.getAll());
  };

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedRxId,
    setSelectedRxId,
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
    prescriptions: localRxList,
    drugs,
    tenantId,
    onDispensePrescription,
    onAddPrescription: (newRx) => {
      prescriptionLifecycleService.addPrescription(newRx);
      syncLocalList();
      onAddPrescription(newRx);
    },
  });

  // Modal & Workbench states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'manual'>('upload');
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<'items' | 'partialHistory' | 'amendments' | 'clinicalSafety'>('items');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Partial Dispense Modal State
  const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
  const [partialSelectedMed, setPartialSelectedMed] = useState<PrescriptionItem | null>(null);
  const [partialQtyToDispense, setPartialQtyToDispense] = useState<number>(10);
  const [partialBatchNo, setPartialBatchNo] = useState<string>('BAT-2026-081');
  const [partialBatchExpiry, setPartialBatchExpiry] = useState<string>('2027-12-31');
  const [partialReason, setPartialReason] = useState<string>('Temporary local pharmacy stock deficit. Remaining quantity reserved upon restock.');
  const [partialNextDate, setPartialNextDate] = useState<string>(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [partialPharmacistName, setPartialPharmacistName] = useState('Pharm. Brenda Namubiru');
  const [partialPharmacistPsu, setPartialPharmacistPsu] = useState('PSU/REG/2019/084');
  const [partialNotes, setPartialNotes] = useState('');

  // Generic Substitution Suggestion Finder State
  const [isSubFinderOpen, setIsSubFinderOpen] = useState(false);
  const [subFinderMed, setSubFinderMed] = useState<PrescriptionItem | null>(null);

  const handleApplySubstitution = (
    originalItem: PrescriptionItem,
    substituteDrug: DrugItem,
    details: {
      reason: string;
      consentMethod: string;
      prescriberContacted: boolean;
      prescriberNotes: string;
      clinicalJustification: string;
    }
  ) => {
    if (!selectedRx) return;

    // 1. Create clinical substitution record
    PrescriptionSubstitutionService.createSubstitution({
      prescriptionId: selectedRx.id,
      patientId: 'UG-PAT-1029',
      patientName: selectedRx.patientName,
      prescribedName: originalItem.brandName || originalItem.drugName,
      prescribedMolecule: originalItem.drugName,
      prescribedStrength: originalItem.strength || 'Standard',
      prescribedDosageForm: originalItem.dosageForm || 'Tablets',
      prescribedQuantity: originalItem.quantity,
      prescribedUnitPrice: originalItem.unitPrice || 0,
      substituteName: substituteDrug.brandName,
      substituteMolecule: substituteDrug.genericName,
      substituteStrength: (substituteDrug as any).strength || originalItem.strength || 'Standard',
      substituteDosageForm: substituteDrug.unit || originalItem.dosageForm || 'Tablets',
      substituteQuantity: originalItem.quantity,
      substituteUnitPrice: substituteDrug.sellingPrice,
      batchNumber: substituteDrug.batchNumber,
      expiryDate: substituteDrug.expiryDate,
      substitutionType: substituteDrug.genericName.toLowerCase().includes('generic') ? 'bioequivalent_generic' : 'branded_generic',
      reason: details.reason as any,
      clinicalRationale: details.clinicalJustification,
      pharmacistName: 'Pharm. Brenda Namubiru',
      pharmacistLicense: 'PSU/REG/2019/084',
      patientAcknowledged: true,
      patientAckMethod: 'verbal_pos_confirmation',
      patientCounselingNotes: details.clinicalJustification,
      prescriberConsulted: details.prescriberContacted,
      prescriberName: selectedRx.prescriberName || selectedRx.doctorName,
      prescriberDecision: details.prescriberContacted ? 'approved_substitution' : 'approved_substitution',
      prescriberNotes: details.prescriberNotes,
    });

    // 2. Update prescription medication item in active prescription
    const updatedMeds = selectedRx.medications.map((m) => {
      if (m.drugName === originalItem.drugName || (originalItem.brandName && m.brandName === originalItem.brandName)) {
        return {
          ...m,
          brandName: substituteDrug.brandName,
          drugName: substituteDrug.genericName,
          unitPrice: substituteDrug.sellingPrice,
          specialInstructions: `Substituted with ${substituteDrug.brandName} (Batch: ${substituteDrug.batchNumber}) per patient & pharmacist consent.`,
        };
      }
      return m;
    });

    const updatedRx: Prescription = {
      ...selectedRx,
      medications: updatedMeds,
      totalCost: updatedMeds.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0),
    };

    prescriptionLifecycleService.updatePrescription(updatedRx);
    syncLocalList();
    setToastMessage(`Substituted with bioequivalent generic: ${substituteDrug.brandName}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Prescription Amendment Modal State
  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
  const [amendField, setAmendField] = useState('Dosage / Regimen');
  const [amendOldVal, setAmendOldVal] = useState('');
  const [amendNewVal, setAmendNewVal] = useState('');
  const [amendJustification, setAmendJustification] = useState('');
  const [amendPrescriberContacted, setAmendPrescriberContacted] = useState(true);
  const [amendPrescriberNotes, setAmendPrescriberNotes] = useState('Prescriber contacted via WhatsApp telephone; agreed to modification.');

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState(
    'Contraindicated dosage / potential severe adverse drug interaction with patient documented allergy.'
  );

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReasonInput, setCancellationReasonInput] = useState(
    'Patient requested cancellation or treatment discontinued by prescriber.'
  );

  // Manual Fallback Form State
  const [manualForm, setManualForm] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'Female' as const,
    patientPhone: '+256 700 000000',
    doctorName: '',
    doctorLicence: 'UMDPC/REG/2026/01',
    hospitalName: 'Mulago National Referral Hospital',
    diagnosis: '',
    refillsAllowed: 0,
    medications: [
      {
        drugName: '',
        strength: '500mg',
        dosageForm: 'Tablets',
        route: 'Oral' as const,
        dosage: '1 Tablet Once Daily',
        frequency: 'OD (Once Daily)',
        duration: '7 Days',
        quantity: 14,
      },
    ],
  });

  const selectedRx = localRxList.find((rx) => rx.id === selectedRxId) || localRxList[0] || null;

  const filteredPrescriptions = localRxList.filter((rx) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      rx.rxNumber.toLowerCase().includes(q) ||
      rx.patientName.toLowerCase().includes(q) ||
      (rx.doctorName && rx.doctorName.toLowerCase().includes(q)) ||
      (rx.prescriberName && rx.prescriberName.toLowerCase().includes(q)) ||
      (rx.patientPhone && rx.patientPhone.includes(q)) ||
      (rx.diagnosis && rx.diagnosis.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'All' ||
      rx.status === statusFilter ||
      (statusFilter === 'Pending' && (rx.status === 'Pending' || rx.status === 'Pending Verification')) ||
      (statusFilter === 'Dispensed' && (rx.status === 'Dispensed' || rx.status === 'Fully Dispensed'));

    return matchesSearch && matchesStatus;
  });

  const shortages = selectedRx ? getStockShortages(selectedRx) : [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── Thermal Print Handlers ────────────────────────────────────────────────
  const handlePrintLabel = (rx: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Dispensing Slip - ${rx.rxNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 340px; margin: 0 auto; line-height: 1.3; }
            h2 { text-align: center; margin: 0; font-size: 15px; font-weight: bold; }
            .meta { font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            .med-item { margin: 8px 0; border-bottom: 1px dotted #888; padding-bottom: 4px; font-size: 12px; }
            .warning { font-size: 10px; margin-top: 12px; font-style: italic; text-align: center; }
            .footer { text-align: center; font-size: 10px; margin-top: 12px; border-top: 1px dashed #000; padding-top: 5px; }
            .badge { display: inline-block; padding: 2px 6px; font-weight: bold; font-size: 10px; border: 1px solid #000; }
          </style>
        </head>
        <body>
          <h2>ZENITHRX PHARMACY NETWORK</h2>
          <p style="text-align:center;font-size:10px;margin:2px 0;">Official NDA Licensed Dispensing Voucher</p>
          <div class="meta">
            <div><b>Rx Number:</b> ${rx.rxNumber}</div>
            <div><b>Issue Date:</b> ${rx.issueDate || rx.date} | <b>Expiry:</b> ${rx.expiryDate || 'N/A'}</div>
            <div><b>Patient:</b> ${rx.patientName} (${rx.patientAge}y, ${rx.patientGender})</div>
            <div><b>Phone:</b> ${rx.patientPhone}</div>
            <div><b>Prescriber:</b> ${rx.prescriberName || rx.doctorName} (${rx.prescriberRegNo || rx.doctorLicence})</div>
            <div><b>Facility:</b> ${rx.hospitalName}</div>
            <div><b>Status:</b> <span class="badge">${rx.status.toUpperCase()}</span></div>
            ${rx.patientAllergies?.length ? `<div style="color:red;font-weight:bold;margin-top:3px;">ALLERGIES: ${rx.patientAllergies.join(', ')}</div>` : ''}
          </div>
          <div><b>MEDICATIONS REGIMEN:</b></div>
          ${rx.medications
            .map(
              (m, idx) => `
            <div class="med-item">
              <div><b>${idx + 1}. ${m.brandName ? `${m.brandName} (${m.drugName})` : m.drugName} ${m.strength || ''}</b></div>
              <div><i>Route / Form:</i> ${m.route || 'Oral'} • ${m.dosageForm || 'Tablets'}</div>
              <div><i>Posology:</i> ${m.dosage || `${m.dose || '1 tab'} ${m.frequency}`}</div>
              <div><i>Duration:</i> ${m.duration}</div>
              <div><i>Prescribed:</i> ${m.quantity} | <i>Dispensed:</i> ${m.dispensedQty || 0} | <b>Remaining: ${m.remainingQty ?? (m.quantity - (m.dispensedQty || 0))}</b></div>
              ${m.specialInstructions ? `<div style="font-size:10px;color:#444;">* ${m.specialInstructions}</div>` : ''}
            </div>
          `
            )
            .join('')}
          <div class="warning">Keep all medicines out of reach of children. Store in a cool dry place below 30°C.</div>
          <div class="footer">
            Verified by Licensed Pharmacist • Uganda NDA Reg: NDA/P/2026/0491
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handlePrintPartialSlip = (rx: Prescription, event: PartialDispensingRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Partial Dispensing Voucher - ${rx.rxNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 340px; margin: 0 auto; line-height: 1.3; }
            h2 { text-align: center; margin: 0; font-size: 15px; font-weight: bold; }
            .meta { font-size: 11px; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
            .box { border: 2px solid #000; padding: 8px; margin: 10px 0; font-size: 12px; }
            .footer { text-align: center; font-size: 10px; margin-top: 12px; border-top: 1px dashed #000; padding-top: 5px; }
          </style>
        </head>
        <body>
          <h2>ZENITHRX PHARMACY</h2>
          <p style="text-align:center;font-size:10px;margin:2px 0;">PARTIAL DISPENSING & BALANCE COLLECTION VOUCHER</p>
          <div class="meta">
            <div><b>Rx Number:</b> ${rx.rxNumber}</div>
            <div><b>Session #:</b> ${event.sessionNumber} | <b>Date:</b> ${event.timestamp.split('T')[0]}</div>
            <div><b>Patient:</b> ${rx.patientName} (${rx.patientPhone})</div>
            <div><b>Prescriber:</b> ${rx.prescriberName || rx.doctorName}</div>
          </div>
          <div class="box">
            <div><b>MEDICATION:</b> ${event.drugName}</div>
            <div><b>Batch Number:</b> ${event.batchNumber} (Exp: ${event.batchExpiry})</div>
            <hr style="border:none;border-top:1px dashed #ccc;margin:6px 0;" />
            <div><b>DISPENSED THIS VISIT:</b> ${event.quantityDispensed} Units</div>
            <div style="font-size:13px;font-weight:bold;color:#b91c1c;margin-top:4px;">OUTSTANDING BALANCE: ${event.remainingAfter} Units</div>
            ${event.nextExpectedDate ? `<div><b>Expected Collection Date:</b> ${event.nextExpectedDate}</div>` : ''}
            <div><b>Session Charge:</b> UGX ${event.totalChargedUgx.toLocaleString()}</div>
          </div>
          <div style="font-size:10px;margin-top:6px;">
            <b>Dispenser:</b> ${event.dispensingPharmacist} (${event.dispensingPharmacistPsu})<br/>
            <b>Branch:</b> ${event.dispensingBranch}<br/>
            <b>Reason:</b> ${event.reasonForPartial}
          </div>
          <div class="footer">
            Please present this original slip to collect the remaining balance.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ─── Lifecycle Execution Handlers ──────────────────────────────────────────
  const handleOpenPartialModal = (med?: PrescriptionItem) => {
    if (!selectedRx) return;
    const targetMed = med || selectedRx.medications.find((m) => (m.remainingQty ?? m.quantity - (m.dispensedQty || 0)) > 0) || selectedRx.medications[0];
    setPartialSelectedMed(targetMed);
    const rem = targetMed.remainingQty ?? Math.max(1, targetMed.quantity - (targetMed.dispensedQty || 0));
    setPartialQtyToDispense(Math.min(rem, 10));
    setIsPartialModalOpen(true);
  };

  const handleConfirmPartialDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx || !partialSelectedMed) return;

    const result = prescriptionLifecycleService.executePartialDispense({
      rxId: selectedRx.id,
      itemId: partialSelectedMed.id,
      drugName: partialSelectedMed.drugName,
      batchNumber: partialBatchNo,
      batchExpiry: partialBatchExpiry,
      quantityToDispense: Number(partialQtyToDispense),
      pharmacistName: partialPharmacistName,
      pharmacistPsu: partialPharmacistPsu,
      branchName: 'Main Dispensary',
      reasonForPartial: partialReason,
      nextExpectedDate: partialNextDate,
      notes: partialNotes,
    });

    if (result) {
      syncLocalList();
      setIsPartialModalOpen(false);
      showToast(`Partially dispensed ${partialQtyToDispense} units. Outstanding balance updated!`);
      handlePrintPartialSlip(result.rx, result.event);
    }
  };

  const handleVerifyPrescription = (rxId: string) => {
    const updated = prescriptionLifecycleService.verifyPrescription(
      rxId,
      'Pharm. Moses Musoke',
      'PSU/REG/2020/552'
    );
    if (updated) {
      syncLocalList();
      showToast(`Prescription ${updated.rxNumber} clinically verified and approved!`);
    }
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx) return;
    const updated = prescriptionLifecycleService.rejectPrescription(
      selectedRx.id,
      rejectionReasonInput,
      'Pharm. Moses Musoke (PSU/REG/2020/552)'
    );
    if (updated) {
      syncLocalList();
      setIsRejectModalOpen(false);
      showToast(`Prescription ${updated.rxNumber} has been rejected with recorded clinical reasoning.`);
    }
  };

  const handleConfirmCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx) return;
    const updated = prescriptionLifecycleService.cancelPrescription(
      selectedRx.id,
      cancellationReasonInput,
      'Pharm. Moses Musoke (Supervising Pharmacist)'
    );
    if (updated) {
      syncLocalList();
      setIsCancelModalOpen(false);
      showToast(`Prescription ${updated.rxNumber} marked as Cancelled.`);
    }
  };

  const handleConfirmAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx) return;
    const updated = prescriptionLifecycleService.amendPrescription({
      rxId: selectedRx.id,
      fieldChanged: amendField,
      oldValue: amendOldVal,
      newValue: amendNewVal,
      clinicalJustification: amendJustification,
      amendedBy: 'Pharm. Moses Musoke',
      psuNo: 'PSU/REG/2020/552',
      prescriberContacted: amendPrescriberContacted,
      prescriberNotes: amendPrescriberNotes,
    });
    if (updated) {
      syncLocalList();
      setIsAmendmentModalOpen(false);
      setAmendOldVal('');
      setAmendNewVal('');
      setAmendJustification('');
      showToast(`Prescription ${updated.rxNumber} amended & clinical justification logged.`);
    }
  };

  const handleManualSubmit = () => {
    const newRxObj: Prescription = {
      id: `RX-${Date.now()}`,
      rxNumber: `RX-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      patientName: manualForm.patientName || 'Unknown Patient',
      patientAge: Number(manualForm.patientAge) || 30,
      patientGender: manualForm.patientGender,
      patientPhone: manualForm.patientPhone,
      doctorName: manualForm.doctorName || 'Dr. Arthur Ssenabulya',
      prescriberName: manualForm.doctorName || 'Dr. Arthur Ssenabulya',
      prescriberCadre: 'Medical Officer',
      prescriberRegNo: manualForm.doctorLicence,
      doctorLicence: manualForm.doctorLicence,
      hospitalName: manualForm.hospitalName,
      diagnosis: manualForm.diagnosis || 'Clinical Prescription',
      status: 'Pending Verification',
      refillsAllowed: Number(manualForm.refillsAllowed) || 0,
      refillsRemaining: Number(manualForm.refillsAllowed) || 0,
      totalCost: manualForm.medications.reduce((acc, m) => acc + m.quantity * 1500, 0),
      medications: manualForm.medications.map((m, idx) => ({
        id: `ITEM-${idx + 1}`,
        drugId: `drug-${idx + 1}`,
        drugName: m.drugName,
        strength: m.strength,
        dosageForm: m.dosageForm,
        route: m.route,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        quantity: Number(m.quantity) || 1,
        dispensedQty: 0,
        remainingQty: Number(m.quantity) || 1,
        unitPrice: 1500,
        isPOM: true,
        status: 'Pending',
      })),
      partialDispensingHistory: [],
      amendmentHistory: [],
    };

    prescriptionLifecycleService.addPrescription(newRxObj);
    syncLocalList();
    setSelectedRxId(newRxObj.id);
    setShowAddModal(false);
    showToast(`Prescription ${newRxObj.rxNumber} created and enqueued for verification.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fully Dispensed':
      case 'Dispensed':
        return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Partially Dispensed':
        return 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Verified / Approved':
        return 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800';
      case 'Rejected':
        return 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'Cancelled':
        return 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
      case 'Pending Verification':
      case 'Pending':
      default:
        return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Notification Toast ─────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Top Header & Action Controls ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Gemini AI OCR
            </span>
            <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-purple-600" /> Lifecycle &amp; Partial Dispense (§31, §32)
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Prescription Lifecycle &amp; Clinical Dispensing Hub
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Explicit lifecycle tracking, multi-session partial dispensing, and audit-logged clinical amendments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Prescription</span>
          </button>
        </div>
      </div>

      {/* ─── Filter Tabs & Search Bar ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Rx#, patient, doctor, phone, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {[
            { id: 'All', label: 'All Records' },
            { id: 'Pending Verification', label: 'Pending Verification' },
            { id: 'Verified / Approved', label: 'Verified / Approved' },
            { id: 'Partially Dispensed', label: 'Partially Dispensed' },
            { id: 'Fully Dispensed', label: 'Fully Dispensed' },
            { id: 'Rejected', label: 'Rejected' },
            { id: 'Cancelled', label: 'Cancelled' },
          ].map((tab) => {
            const count = localRxList.filter((rx) => {
              if (tab.id === 'All') return true;
              if (tab.id === 'Pending Verification') return rx.status === 'Pending Verification' || rx.status === 'Pending';
              if (tab.id === 'Fully Dispensed') return rx.status === 'Fully Dispensed' || rx.status === 'Dispensed';
              return rx.status === tab.id;
            }).length;
            const isActive = statusFilter === tab.id || (tab.id === 'All' && statusFilter === 'All');

            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main Two-Column Clinical Workbench ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prescription Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Prescription Queue ({filteredPrescriptions.length})
            </h2>
          </div>

          {filteredPrescriptions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-medium text-slate-700 dark:text-slate-300">No prescriptions match this filter</p>
              <p className="text-xs text-slate-400 mt-1">Try switching tabs or searching by prescription number.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredPrescriptions.map((rx) => {
                const isSelected = rx.id === selectedRx?.id;
                const totalMeds = rx.medications.length;
                const dispensedMeds = rx.medications.filter((m) => (m.dispensedQty || 0) >= m.quantity).length;

                return (
                  <div
                    key={rx.id}
                    onClick={() => setSelectedRxId(rx.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">
                            {rx.rxNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              rx.status
                            )}`}
                          >
                            {rx.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-1">
                          {rx.patientName}
                          <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                            ({rx.patientAge}y, {rx.patientGender})
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Stethoscope className="w-3 h-3 text-slate-400" />
                          {rx.prescriberName || rx.doctorName} • {rx.hospitalName}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {formatUGX(rx.totalCost)}
                        </span>
                        <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {rx.issueDate || rx.date}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar for Dispensing */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {dispensedMeds}/{totalMeds} Items Dispensed
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        Inspect Lifecycle <ChevronRight className="w-3.5 h-3.5" />
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
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {selectedRx.rxNumber}
                    </h3>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                        selectedRx.status
                      )}`}
                    >
                      {selectedRx.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span><b>Issued:</b> {selectedRx.issueDate || selectedRx.date}</span>
                    <span>•</span>
                    <span><b>Expires:</b> {selectedRx.expiryDate || 'N/A'}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">
                      Refills Left: {selectedRx.refillsRemaining ?? 0} of {selectedRx.refillsAllowed ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handlePrintLabel(selectedRx)}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Print Thermal Dispensing Slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>

                  <button
                    onClick={() => handleCheckInteractions(selectedRx)}
                    disabled={isCheckingInteractions}
                    className="px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCheckingInteractions ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span>AI DDI Scan</span>
                  </button>

                  <button
                    onClick={() => setIsAmendmentModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Amend</span>
                  </button>
                </div>
              </div>

              {/* Patient & Prescriber Detailed Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs">
                {/* Patient Profile */}
                <div className="space-y-1.5">
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Patient Information
                  </div>
                  <div className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                    {selectedRx.patientName}
                  </div>
                  <div className="text-slate-500">
                    Age: {selectedRx.patientAge} yrs • Gender: {selectedRx.patientGender}
                  </div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {selectedRx.patientPhone}
                  </div>
                  {selectedRx.patientAllergies && selectedRx.patientAllergies.length > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-2 rounded-lg text-rose-800 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Allergies: {selectedRx.patientAllergies.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Prescriber Profile */}
                <div className="space-y-1.5">
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Prescriber Information
                  </div>
                  <div className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                    {selectedRx.prescriberName || selectedRx.doctorName}
                  </div>
                  <div className="text-slate-500">
                    Cadre: {selectedRx.prescriberCadre || 'Medical Officer'} • Reg No: {selectedRx.prescriberRegNo || selectedRx.doctorLicence}
                  </div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {selectedRx.hospitalName}
                  </div>
                  {selectedRx.diagnosis && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <b>Clinical Indication:</b> {selectedRx.diagnosis}
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection / Cancellation Alerts if applicable */}
              {selectedRx.rejectionReason && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-4 rounded-xl text-xs text-rose-900 dark:text-rose-200 space-y-1">
                  <div className="font-black flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                    <XCircle className="w-4 h-4" />
                    Prescription Rejected by Pharmacist
                  </div>
                  <p><b>Reason:</b> {selectedRx.rejectionReason}</p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    Rejected by {selectedRx.rejectedBy} on {selectedRx.rejectedAt ? new Date(selectedRx.rejectedAt).toLocaleString() : 'Recorded'}
                  </p>
                </div>
              )}

              {/* AI Clinical Contraindication Analysis */}
              {clinicalAnalysis && (
                <div className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                        AI Clinical Safety &amp; DDI Analysis
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
                </div>
              )}

              {/* ─── Inner Workbench Tabs (Regimen vs Partial History vs Amendments) ─── */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  onClick={() => setActiveWorkbenchTab('items')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeWorkbenchTab === 'items'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Medication Regimen ({selectedRx.medications.length})
                </button>
                <button
                  onClick={() => setActiveWorkbenchTab('partialHistory')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeWorkbenchTab === 'partialHistory'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Partial Dispense Logs ({selectedRx.partialDispensingHistory?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveWorkbenchTab('amendments')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeWorkbenchTab === 'amendments'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Amendments ({selectedRx.amendmentHistory?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveWorkbenchTab('clinicalSafety')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeWorkbenchTab === 'clinicalSafety'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Patient Profile &amp; Interaction Safety</span>
                </button>
              </div>

              {/* TAB 1: Medication Items & Regimen */}
              {activeWorkbenchTab === 'items' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3">Medicine &amp; Posology</th>
                          <th className="p-3 text-center">Prescribed</th>
                          <th className="p-3 text-center">Dispensed</th>
                          <th className="p-3 text-center">Outstanding</th>
                          <th className="p-3 text-right">Unit / Total</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedRx.medications.map((med, idx) => {
                          const dispensed = med.dispensedQty || 0;
                          const remaining = med.remainingQty ?? Math.max(0, med.quantity - dispensed);
                          const isComplete = remaining === 0;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-3">
                                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <span>{med.brandName ? `${med.brandName} (${med.drugName})` : med.drugName}</span>
                                  {med.strength && (
                                    <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold px-1.5 py-0.2 rounded">
                                      {med.strength}
                                    </span>
                                  )}
                                  {med.isControlled && (
                                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                                      Class A/B
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 text-[11px] mt-0.5">
                                  <b>Route:</b> {med.route || 'Oral'} • <b>Form:</b> {med.dosageForm || 'Tablets'} • {med.dosage || `${med.dose || '1 tab'} ${med.frequency}`} ({med.duration})
                                </div>
                                {med.specialInstructions && (
                                  <div className="text-[10px] text-amber-700 dark:text-amber-400 italic">
                                    {med.specialInstructions}
                                  </div>
                                )}
                              </td>

                              <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                {med.quantity}
                              </td>

                              <td className="p-3 text-center font-bold text-emerald-600">
                                {dispensed}
                              </td>

                              <td className="p-3 text-center font-bold">
                                {remaining > 0 ? (
                                  <span className="text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                                    {remaining} left
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-black">0 (Complete)</span>
                                )}
                              </td>

                              <td className="p-3 text-right">
                                <div className="text-slate-500 text-[10px]">{formatUGX(med.unitPrice)}/unit</div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {formatUGX(med.unitPrice * med.quantity)}
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubFinderMed(med);
                                      setIsSubFinderOpen(true);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                    title="Suggest equivalent generic products in stock"
                                  >
                                    <ArrowLeftRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Equivalents</span>
                                  </button>

                                  {!isComplete && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPartialModal(med)}
                                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                                    >
                                      Partial
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Partial Dispensing History */}
              {activeWorkbenchTab === 'partialHistory' && (
                <div className="space-y-3">
                  {(!selectedRx.partialDispensingHistory || selectedRx.partialDispensingHistory.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                      <History className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                      <p className="font-bold text-xs">No partial dispensing sessions recorded yet.</p>
                      <p className="text-[11px]">Execute a partial dispense when stock is limited or patient requests split quantities.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRx.partialDispensingHistory.map((hist) => (
                        <div
                          key={hist.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px]">
                                Session #{hist.sessionNumber}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{hist.drugName}</span>
                            </div>
                            <p className="text-slate-500 text-[11px]">
                              Dispensed: <b>{hist.quantityDispensed} units</b> (Batch: {hist.batchNumber}, Exp: {hist.batchExpiry}) • Outstanding Balance: <b className="text-amber-600">{hist.remainingAfter} units</b>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              By {hist.dispensingPharmacist} ({hist.dispensingPharmacistPsu}) at {new Date(hist.timestamp).toLocaleDateString()}
                            </p>
                          </div>

                          <button
                            onClick={() => handlePrintPartialSlip(selectedRx, hist)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Voucher</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Prescription Amendments History */}
              {activeWorkbenchTab === 'amendments' && (
                <div className="space-y-3">
                  {(!selectedRx.amendmentHistory || selectedRx.amendmentHistory.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                      <FileEdit className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                      <p className="font-bold text-xs">No clinical amendments recorded on this prescription.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRx.amendmentHistory.map((amd) => (
                        <div
                          key={amd.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded text-[10px]">
                              Modified: {amd.fieldChanged}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(amd.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="text-slate-400 block">Original Value:</span>
                              <span className="font-bold text-rose-600 line-through">{amd.oldValue}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Amended Value:</span>
                              <span className="font-bold text-emerald-600">{amd.newValue}</span>
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                            <b>Clinical Reason:</b> {amd.clinicalJustification}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Amended by {amd.amendedBy} ({amd.psuNo}) • Prescriber Contacted: {amd.prescriberContacted ? '✓ Yes' : '✕ No'} ({amd.prescriberNotes})
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Patient Medication Profile & Clinical Safety Engine */}
              {activeWorkbenchTab === 'clinicalSafety' && (
                <div className="space-y-3">
                  <PatientClinicalProfileInspector
                    prescriptionId={selectedRx.id}
                    prescriptionRefNo={selectedRx.rxNumber}
                    patientName={selectedRx.patientName}
                    patientId={selectedRx.customerId || 'cust-1'}
                    prescribedDrugNames={selectedRx.medications.map(m => m.name || m.brandName || m.genericName || 'Medicine')}
                    pharmacistName="Dr. Arthur Ssenabulya"
                    pharmacistPsuNo="PSU-2021-0892"
                    onDecisionSubmitted={(action, rationale) => {
                      if (action === 'overridden_with_justification') {
                        setToastMessage(`Prescription safety override recorded with clinical rationale: "${rationale?.substring(0, 45)}..."`);
                      } else if (action === 'rejected_safety_grounds') {
                        setIsRejectModalOpen(true);
                      } else if (action === 'approved_safe') {
                        if (selectedRx.status === 'Pending' || selectedRx.status === 'Pending Verification') {
                          handleVerifyPrescription(selectedRx.id);
                        }
                      }
                    }}
                  />
                </div>
              )}

              {/* ─── Footer Execution Bar & Lifecycle State Machine Actions ─── */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">Prescription Total Valuation</div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {formatUGX(selectedRx.totalCost)}
                  </div>
                  {selectedRx.outstandingBalance !== undefined && selectedRx.outstandingBalance > 0 && (
                    <div className="text-[11px] text-amber-600 font-bold">
                      Outstanding Balance to Collect: {formatUGX(selectedRx.outstandingBalance)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  {/* Action 1: If Pending -> Pharmacist Verify or Reject */}
                  {(selectedRx.status === 'Pending' || selectedRx.status === 'Pending Verification') && (
                    <>
                      <button
                        onClick={() => setIsRejectModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                      >
                        Reject Rx
                      </button>
                      <button
                        onClick={() => handleVerifyPrescription(selectedRx.id)}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify &amp; Approve</span>
                      </button>
                    </>
                  )}

                  {/* Action 2: Partial Dispense Trigger */}
                  {selectedRx.status !== 'Fully Dispensed' && selectedRx.status !== 'Dispensed' && selectedRx.status !== 'Rejected' && selectedRx.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleOpenPartialModal()}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Execute Partial Dispense</span>
                    </button>
                  )}

                  {/* Action 3: Complete Full Dispense */}
                  {selectedRx.status !== 'Fully Dispensed' && selectedRx.status !== 'Dispensed' && selectedRx.status !== 'Rejected' && selectedRx.status !== 'Cancelled' && (
                    <button
                      onClick={() => {
                        handleDispense(selectedRx.id);
                        syncLocalList();
                        showToast(`Prescription ${selectedRx.rxNumber} fully dispensed!`);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Full Dispense</span>
                    </button>
                  )}

                  {(selectedRx.status === 'Fully Dispensed' || selectedRx.status === 'Dispensed') && (
                    <div className="bg-emerald-100 text-emerald-800 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>100% Fully Dispensed</span>
                    </div>
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
                Select a prescription from the queue to inspect posology or execute partial dispensing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL 1: Execute Partial Dispensing ────────────────────────────── */}
      {isPartialModalOpen && selectedRx && partialSelectedMed && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-500 text-white">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Partial Dispensing Session (§31, §32)
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  Rx: {selectedRx.rxNumber} • Patient: {selectedRx.patientName}
                </p>
              </div>
              <button onClick={() => setIsPartialModalOpen(false)} className="text-white hover:text-amber-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPartialDispense} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl space-y-1">
                <span className="font-extrabold text-slate-700 dark:text-slate-300">Prescribed Drug:</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {partialSelectedMed.brandName ? `${partialSelectedMed.brandName} (${partialSelectedMed.drugName})` : partialSelectedMed.drugName} {partialSelectedMed.strength || ''}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Total Prescribed: <b>{partialSelectedMed.quantity}</b> | Already Dispensed: <b>{partialSelectedMed.dispensedQty || 0}</b> | Current Outstanding: <b className="text-amber-600">{partialSelectedMed.remainingQty ?? (partialSelectedMed.quantity - (partialSelectedMed.dispensedQty || 0))} units</b>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Quantity to Dispense NOW *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={partialSelectedMed.remainingQty ?? (partialSelectedMed.quantity - (partialSelectedMed.dispensedQty || 0))}
                    required
                    value={partialQtyToDispense}
                    onChange={(e) => setPartialQtyToDispense(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm text-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Remaining Balance After
                  </label>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 font-black text-sm text-amber-700 dark:text-amber-300 text-center">
                    {Math.max(0, (partialSelectedMed.remainingQty ?? (partialSelectedMed.quantity - (partialSelectedMed.dispensedQty || 0))) - partialQtyToDispense)} Units Outstanding
                  </div>
                </div>
              </div>

              {/* Active FEFO Batch Selector */}
              <div>
                <FefoBatchSelector
                  drugId={partialSelectedMed.drugId || partialSelectedMed.id || 'DRUG-001'}
                  drugName={partialSelectedMed.brandName || partialSelectedMed.drugName}
                  requestedQuantity={partialQtyToDispense}
                  treatmentDurationDays={30}
                  selectedBatchNumber={partialBatchNo}
                  onSelectBatch={(batch, overrideReason) => {
                    setPartialBatchNo(batch.batchNumber);
                    setPartialBatchExpiry(batch.expiryDate);
                    if (overrideReason) {
                      setPartialNotes((prev) => `${prev ? prev + ' | ' : ''}FEFO Override: ${overrideReason}`);
                    }
                  }}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Partial Dispensing *
                </label>
                <select
                  value={partialReason}
                  onChange={(e) => setPartialReason(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-xs"
                >
                  <option value="Temporary local pharmacy stock deficit. Remaining quantity reserved upon restock.">Temporary local pharmacy stock deficit</option>
                  <option value="Patient requested split dose due to immediate budget constraint.">Patient requested split quantity (Financial)</option>
                  <option value="Short-course trial to monitor adverse reaction/tolerance before full issue.">Trial course to monitor drug tolerance</option>
                  <option value="Central warehouse supply delayed; balance promised on collection date.">Central supply in-transit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Next Expected Collection Date
                  </label>
                  <input
                    type="date"
                    value={partialNextDate}
                    onChange={(e) => setPartialNextDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Session Cost (UGX)
                  </label>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200">
                    {formatUGX(partialQtyToDispense * (partialSelectedMed.unitPrice || 1000))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Execute &amp; Print Balance Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Prescription Amendment ──────────────────────────────── */}
      {isAmendmentModalOpen && selectedRx && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-600 text-white">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <FileEdit className="w-5 h-5" />
                  Prescription Amendment &amp; Clinical Justification (§32)
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  Rx: {selectedRx.rxNumber}
                </p>
              </div>
              <button onClick={() => setIsAmendmentModalOpen(false)} className="text-white hover:text-amber-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAmendment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Field to Amend *
                </label>
                <select
                  value={amendField}
                  onChange={(e) => setAmendField(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="Generic Substitution / Brand Formulation">Generic Substitution / Bioequivalent Brand Switch</option>
                  <option value="Dosage Form (e.g. Capsule to Film-Coated Tablet)">Dosage Form</option>
                  <option value="Strength / Dose Adjustment (e.g. Renal Dose Reduction)">Strength / Dose Adjustment</option>
                  <option value="Dosing Frequency (e.g. TDS to BD)">Dosing Frequency</option>
                  <option value="Duration / Quantity Prescribed">Duration / Quantity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Original Value (Old) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625mg Capsules"
                    value={amendOldVal}
                    onChange={(e) => setAmendOldVal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Amended Value (New) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clavulin 625mg Film-Coated Tablet"
                    value={amendNewVal}
                    onChange={(e) => setAmendNewVal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Clinical Justification (Mandatory) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="State the clinical or formulary reason for this alteration..."
                  value={amendJustification}
                  onChange={(e) => setAmendJustification(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={amendPrescriberContacted}
                    onChange={(e) => setAmendPrescriberContacted(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Prescriber was contacted &amp; authorized amendment</span>
                </label>
                <input
                  type="text"
                  placeholder="Doctor contact notes (e.g. Dr. Kanyike agreed by phone at 10:15 AM)"
                  value={amendPrescriberNotes}
                  onChange={(e) => setAmendPrescriberNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAmendmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md cursor-pointer"
                >
                  Record Clinical Amendment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Rejection with Mandatory Reason ────────────────────── */}
      {isRejectModalOpen && selectedRx && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-600 text-white">
              <h3 className="font-black text-base flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Reject Prescription (§32, §34 Rule 6)
              </h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-white hover:text-rose-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRejection} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Under NDA Uganda regulations, rejecting a prescription requires a mandatory recorded clinical justification.
              </p>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Multimodal AI Digitizer & Cloudflare R2 Upload ─────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Prescription Lifecycle Digitizer &amp; Cloudflare R2 Upload
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  OCR doctor notes or enter structured posology with routes, strengths, and refills.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  clearUploadedFile();
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Rx Document / Image (R2)</span>
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Paste Handwritten Doctor Text</span>
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    activeTab === 'manual'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Form Entry</span>
                </button>
              </div>

              {/* MODE 1: FILE UPLOAD */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      uploadedFile
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                    {uploadedFile ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                        </p>
                        <p className="text-xs text-emerald-600 font-medium">
                          {isUploading ? `Uploading to Cloudflare R2... ${uploadProgress}%` : '✓ Ready for Gemini AI Parsing'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          Click to browse or drop doctor prescription slip here
                        </p>
                        <p className="text-xs text-slate-400">
                          Supports PNG, JPG, WEBP &amp; PDF scans up to 15MB
                        </p>
                      </div>
                    )}
                  </div>

                  {previewUrl && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 flex items-center justify-center bg-slate-950">
                      <img src={previewUrl} alt="Prescription Preview" className="max-h-60 object-contain" />
                    </div>
                  )}

                  <button
                    onClick={handleAiParse}
                    disabled={!uploadedFile || isAiParsing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAiParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isAiParsing ? 'Analyzing with Gemini AI...' : 'Run Gemini AI Extraction'}</span>
                  </button>
                </div>
              )}

              {/* MODE 2: TEXT PASTE */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <textarea
                    rows={6}
                    placeholder="Paste transcribed doctor notes (e.g. Rx: Amoxicillin 500mg capsules TDS x 7 days, Paracetamol 1g QDS PRN...)"
                    value={rxNotesText}
                    onChange={(e) => setRxNotesText(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <button
                    onClick={handleAiParse}
                    disabled={!rxNotesText.trim() || isAiParsing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAiParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isAiParsing ? 'Parsing with Gemini AI...' : 'Parse Text with Gemini AI'}</span>
                  </button>
                </div>
              )}

              {/* MODE 3: MANUAL FORM */}
              {activeTab === 'manual' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Patient Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Juliet Namaganda"
                        value={manualForm.patientName}
                        onChange={(e) => setManualForm({ ...manualForm, patientName: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Patient Age</label>
                      <input
                        type="number"
                        placeholder="35"
                        value={manualForm.patientAge}
                        onChange={(e) => setManualForm({ ...manualForm, patientAge: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={manualForm.patientPhone}
                        onChange={(e) => setManualForm({ ...manualForm, patientPhone: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Prescribing Doctor *</label>
                      <input
                        type="text"
                        placeholder="Dr. Moses Musoke"
                        value={manualForm.doctorName}
                        onChange={(e) => setManualForm({ ...manualForm, doctorName: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Doctor UMDPC Reg No</label>
                      <input
                        type="text"
                        value={manualForm.doctorLicence}
                        onChange={(e) => setManualForm({ ...manualForm, doctorLicence: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Refills Allowed</label>
                      <select
                        value={manualForm.refillsAllowed}
                        onChange={(e) => setManualForm({ ...manualForm, refillsAllowed: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value={0}>0 (No refills)</option>
                        <option value={1}>1 Repeat</option>
                        <option value={2}>2 Repeats</option>
                        <option value={3}>3 Repeats</option>
                        <option value={5}>5 Repeats (Chronic)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Diagnosis / Indication</label>
                    <input
                      type="text"
                      placeholder="e.g. Essential Hypertension &amp; High Lipid Profile"
                      value={manualForm.diagnosis}
                      onChange={(e) => setManualForm({ ...manualForm, diagnosis: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  {/* Medications Lines */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-800 dark:text-slate-200">Prescribed Medicine Posology:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setManualForm({
                            ...manualForm,
                            medications: [
                              ...manualForm.medications,
                              {
                                drugName: '',
                                strength: '500mg',
                                dosageForm: 'Tablets',
                                route: 'Oral' as const,
                                dosage: '1 Tablet Once Daily',
                                frequency: 'OD (Once Daily)',
                                duration: '7 Days',
                                quantity: 14,
                              },
                            ],
                          })
                        }
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        + Add Drug Line
                      </button>
                    </div>

                    {manualForm.medications.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-6 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 font-bold">Drug Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Amlodipine"
                            value={m.drugName}
                            onChange={(e) => {
                              const copy = [...manualForm.medications];
                              copy[idx].drugName = e.target.value;
                              setManualForm({ ...manualForm, medications: copy });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Strength</label>
                          <input
                            type="text"
                            placeholder="10mg"
                            value={m.strength}
                            onChange={(e) => {
                              const copy = [...manualForm.medications];
                              copy[idx].strength = e.target.value;
                              setManualForm({ ...manualForm, medications: copy });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Frequency</label>
                          <input
                            type="text"
                            placeholder="OD / BD"
                            value={m.frequency}
                            onChange={(e) => {
                              const copy = [...manualForm.medications];
                              copy[idx].frequency = e.target.value;
                              setManualForm({ ...manualForm, medications: copy });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Duration</label>
                          <input
                            type="text"
                            placeholder="30 Days"
                            value={m.duration}
                            onChange={(e) => {
                              const copy = [...manualForm.medications];
                              copy[idx].duration = e.target.value;
                              setManualForm({ ...manualForm, medications: copy });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold">Total Qty</label>
                          <input
                            type="number"
                            value={m.quantity}
                            onChange={(e) => {
                              const copy = [...manualForm.medications];
                              copy[idx].quantity = Number(e.target.value);
                              setManualForm({ ...manualForm, medications: copy });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleManualSubmit}
                    disabled={manualForm.medications.every((m) => !m.drugName)}
                    className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
                  >
                    Create Prescription with Full Lifecycle Tracking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generic Bioequivalent Substitution Suggestion Finder Modal */}
      {isSubFinderOpen && subFinderMed && (
        <GenericSubstitutionFinderModal
          isOpen={isSubFinderOpen}
          onClose={() => {
            setIsSubFinderOpen(false);
            setSubFinderMed(null);
          }}
          prescribedItem={subFinderMed}
          patientName={selectedRx?.patientName}
          prescriberName={selectedRx?.prescriberName || selectedRx?.doctorName}
          inventory={drugs}
          currentPharmacistName="Pharm. Brenda Namubiru"
          currentPharmacistRole="Supervising Pharmacist"
          onApplySubstitution={handleApplySubstitution}
        />
      )}
    </div>
  );
};
