/**
 * usePrescriptionProcessing.ts — ZenithRx Clinical Prescription Application Hook
 * Encapsulates prescription queue management, R2 file upload, multimodal Gemini AI extraction,
 * allergy/contraindication safety checks, and stock-aware dispensing.
 * Clean Architecture: Application Layer
 */

import { useState, useMemo, useCallback } from 'react';
import { Prescription, DrugItem } from '../types';
import {
  parsePrescription,
  checkDrugInteractions,
  ParsedPrescription,
  DrugInteractionAnalysis,
} from '../services/aiService';
import { uploadFile } from '../services/fileService';

export interface StockShortage {
  drugName: string;
  requiredQty: number;
  availableQty: number;
}

export interface UsePrescriptionProcessingProps {
  prescriptions: Prescription[];
  drugs: DrugItem[];
  tenantId?: string;
  onDispensePrescription: (rxId: string) => void;
  onAddPrescription: (newRx: Prescription) => void;
}

export function usePrescriptionProcessing({
  prescriptions,
  drugs,
  tenantId,
  onDispensePrescription,
  onAddPrescription,
}: UsePrescriptionProcessingProps) {
  // ─── Queue & Search State ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRxId, setSelectedRxId] = useState<string | null>(prescriptions[0]?.id ?? null);
  const [showAddModal, setShowAddModal] = useState(false);

  // ─── Document Upload State ─────────────────────────────────────────────────
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [r2FileId, setR2FileId] = useState<string | null>(null);

  // ─── AI Parsing State ──────────────────────────────────────────────────────
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [rxNotesText, setRxNotesText] = useState('');
  const [parsedAiData, setParsedAiData] = useState<ParsedPrescription | null>(null);

  // ─── Clinical Analysis State ───────────────────────────────────────────────
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [clinicalAnalysis, setClinicalAnalysis] = useState<DrugInteractionAnalysis | null>(null);

  // ─── Computed Filtered Queue ───────────────────────────────────────────────
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
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
  }, [prescriptions, searchTerm, statusFilter]);

  const selectedRx = useMemo(() => {
    return prescriptions.find((rx) => rx.id === selectedRxId) ?? prescriptions[0] ?? null;
  }, [prescriptions, selectedRxId]);

  // ─── Document File Handling & R2 Upload ─────────────────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadedFile(file);
    setAiError(null);
    setParsedAiData(null);

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Convert to base64 for direct AI analysis if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const b64 = e.target?.result as string;
        setImageBase64(b64);
      };
      reader.readAsDataURL(file);
    } else {
      setImageBase64(null);
    }

    // Direct Cloudflare R2 Upload in background if tenantId is available
    if (tenantId) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const result = await uploadFile(
          file,
          {
            retentionClass: 'clinical',
            referenceType:  'prescription',
          },
          (progress) => setUploadProgress(progress)
        );
        setR2FileId(result.fileId);
      } catch (err: any) {
        console.warn('[usePrescriptionProcessing] R2 upload failed (falling back to local preview):', err.message);
      } finally {
        setIsUploading(false);
      }
    }
  }, [tenantId]);

  const clearUploadedFile = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setPreviewUrl(null);
    setImageBase64(null);
    setR2FileId(null);
    setUploadProgress(0);
    setParsedAiData(null);
    setAiError(null);
  }, [previewUrl]);

  // ─── AI Extraction ─────────────────────────────────────────────────────────
  const handleAiParse = useCallback(async (mode: 'text' | 'image' | 'both' = 'both') => {
    setIsAiParsing(true);
    setAiError(null);

    try {
      let payload: { textContent?: string; imageBase64?: string } = {};

      if (mode === 'text' || mode === 'both') {
        if (rxNotesText.trim()) payload.textContent = rxNotesText.trim();
      }
      if (mode === 'image' || mode === 'both') {
        if (imageBase64) payload.imageBase64 = imageBase64;
      }

      if (!payload.textContent && !payload.imageBase64) {
        setAiError('Please provide prescription notes or upload a prescription image to scan.');
        setIsAiParsing(false);
        return;
      }

      const res = await parsePrescription(payload);

      if (res.success && res.data) {
        setParsedAiData(res.data);
      } else {
        setAiError(res.error ?? 'Failed to parse prescription. Please check and try again.');
      }
    } catch (err: any) {
      setAiError(err.message ?? 'An unexpected error occurred during AI parsing.');
    } finally {
      setIsAiParsing(false);
    }
  }, [rxNotesText, imageBase64]);

  // ─── Clinical Safety Check ─────────────────────────────────────────────────
  const handleCheckInteractions = useCallback(async (
    rx: Prescription,
    patientAllergies = 'None reported',
    conditions = 'None reported'
  ) => {
    setIsCheckingInteractions(true);
    setClinicalAnalysis(null);
    try {
      const drugNames = rx.medications.map((m) => m.drugName);
      const res = await checkDrugInteractions(drugNames, patientAllergies, conditions);
      if (res.success && res.analysis) {
        setClinicalAnalysis(res.analysis);
      }
    } catch (err) {
      console.error('[usePrescriptionProcessing] Check interactions error:', err);
    } finally {
      setIsCheckingInteractions(false);
    }
  }, []);

  // ─── Stock Validation & Dispensing ─────────────────────────────────────────
  const getStockShortages = useCallback((rx: Prescription): StockShortage[] => {
    const shortages: StockShortage[] = [];
    for (const med of rx.medications) {
      const matchingDrug = drugs.find(
        (d) => d.id === med.drugId || d.brandName.toLowerCase() === med.drugName.toLowerCase()
      );
      const available = matchingDrug ? matchingDrug.stockQty : 0;
      const remainingNeeded = med.quantity - med.dispensedQty;
      if (available < remainingNeeded) {
        shortages.push({
          drugName: med.drugName,
          requiredQty: remainingNeeded,
          availableQty: available,
        });
      }
    }
    return shortages;
  }, [drugs]);

  const canDispense = useCallback((rx: Prescription): boolean => {
    return rx.status !== 'Dispensed' && getStockShortages(rx).length === 0;
  }, [getStockShortages]);

  const handleDispense = useCallback((rxId: string) => {
    onDispensePrescription(rxId);
  }, [onDispensePrescription]);

  // ─── Convert Parsed AI Data to New Prescription ───────────────────────────
  const handleCreatePrescriptionFromAi = useCallback((parsed: ParsedPrescription) => {
    const now = new Date().toISOString().split('T')[0];
    const rxNumber = `RX-${Date.now().toString().slice(-6)}`;

    let totalCost = 0;
    const medications = parsed.medications.map((m) => {
      const matchingDrug = drugs.find(
        (d) => d.brandName.toLowerCase().includes(m.drugName.toLowerCase()) ||
               d.genericName.toLowerCase().includes(m.drugName.toLowerCase())
      );
      const unitPrice = matchingDrug ? matchingDrug.sellingPrice : 5000;
      const lineCost = unitPrice * (m.quantity || 1);
      totalCost += lineCost;

      return {
        drugId: matchingDrug ? matchingDrug.id : '',
        drugName: m.drugName,
        dosage: m.dosage || '1 tab',
        frequency: m.frequency || 'OD (Once Daily)',
        duration: m.duration || '5 days',
        quantity: m.quantity || 10,
        unitPrice,
        dispensedQty: 0,
        status: 'Pending' as const,
      };
    });

    const newPrescription: Prescription = {
      id: `rx-${Date.now()}`,
      rxNumber,
      patientName: parsed.patientName || 'Unknown Patient',
      patientAge: Number(parsed.patientAge) || 30,
      patientGender: parsed.patientGender || 'Male',
      patientPhone: parsed.patientPhone || '+256700000000',
      doctorName: parsed.doctorName || 'Dr. Medical Officer',
      doctorLicence: parsed.doctorLicence || 'UMDPC-2026-REG',
      hospitalName: parsed.hospitalName || 'Mulago National Referral Hospital',
      date: now,
      status: 'Pending',
      medications,
      totalCost,
      notes: parsed.clinicalNotes || parsed.diagnosis || '',
    };

    onAddPrescription(newPrescription);
    setSelectedRxId(newPrescription.id);
    setShowAddModal(false);
    clearUploadedFile();
    setRxNotesText('');
    setParsedAiData(null);
  }, [drugs, onAddPrescription, clearUploadedFile]);

  return {
    // Queue & Filter
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
    imageBase64,
    isUploading,
    uploadProgress,
    r2FileId,
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

    // Dispensing & Stock
    canDispense,
    getStockShortages,
    handleDispense,
  };
}
