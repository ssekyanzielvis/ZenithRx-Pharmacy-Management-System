/**
 * prescriptionOcrService.ts — ZenithRx Prescription OCR & Clinical Verification Queue (§8, §21)
 * Extracts prescription metadata, verifies doctor credentials, and queues for pharmacist review.
 */

import { PrescriptionVerificationItem } from '../types';

const STORAGE_KEY_OCR_QUEUE = 'zenithrx_ocr_verification_queue_v1';

export const INITIAL_OCR_QUEUE: PrescriptionVerificationItem[] = [
  {
    id: 'ocr-001',
    queueNumber: 'OCR-2026-08101',
    tenantId: 'client-001',
    pharmacyName: 'Kampala City Pharmacy',
    patientName: 'Kato Emmanuel',
    patientPhone: '+256 704 556677',
    uploadedVia: 'Patient Portal PWA',
    prescriptionImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60',
    ocrExtractedDoctorName: 'Dr. Mukasa David',
    ocrExtractedDoctorLicence: 'UMDPC-2018-0912',
    ocrExtractedHospital: 'Mulago Specialized Women Hospital',
    ocrExtractedDate: '2026-08-04',
    ocrExtractedMedications: [
      {
        drugName: 'Amoxicillin + Clavulanic Acid 625mg',
        dosage: '1 tab',
        frequency: '12-hourly',
        duration: '7 days',
        quantity: 14,
        confidenceScore: 98,
      },
      {
        drugName: 'Paracetamol 500mg',
        dosage: '2 tabs',
        frequency: '8-hourly PRN',
        duration: '5 days',
        quantity: 30,
        confidenceScore: 96,
      }
    ],
    doctorVerificationStatus: 'Verified Licensed MD',
    clinicalSafetyFlags: [],
    verificationStatus: 'Approved & Ready for POS',
    reviewedByPharmacistName: 'Dr. Arthur Ssenabulya',
    pharmacistClinicalNotes: 'Prescription valid, clear indication of upper respiratory tract infection. Verified doctor licence active in UMDPC register.',
    createdAt: '2026-08-04T12:00:00Z',
    reviewedAt: '2026-08-04T12:15:00Z',
  },
  {
    id: 'ocr-002',
    queueNumber: 'OCR-2026-08102',
    tenantId: 'client-001',
    pharmacyName: 'Kampala City Pharmacy',
    patientName: 'Aisha Namaganda',
    patientPhone: '+256 752 112233',
    uploadedVia: 'Staff Counter Upload',
    prescriptionImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=60',
    ocrExtractedDoctorName: 'Dr. John Kyeyune',
    ocrExtractedDoctorLicence: 'UMDPC-2022-7719',
    ocrExtractedHospital: 'Case Medical Centre Kampala',
    ocrExtractedDate: '2026-08-05',
    ocrExtractedMedications: [
      {
        drugName: 'Ciprofloxacin 500mg',
        dosage: '1 tab',
        frequency: '12-hourly',
        duration: '5 days',
        quantity: 10,
        confidenceScore: 92,
      },
      {
        drugName: 'Metformin 500mg',
        dosage: '1 tab',
        frequency: '12-hourly',
        duration: '30 days',
        quantity: 60,
        confidenceScore: 89,
      }
    ],
    doctorVerificationStatus: 'Verified Licensed MD',
    clinicalSafetyFlags: [
      {
        type: 'Interaction',
        message: 'Moderate interaction: Ciprofloxacin may enhance hypoglycemic action of Metformin.',
        severity: 'Medium',
      }
    ],
    verificationStatus: 'Pending Pharmacist Review',
    createdAt: '2026-08-05T09:30:00Z',
  }
];

export const getOcrQueueItems = (tenantId?: string): PrescriptionVerificationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OCR_QUEUE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_OCR_QUEUE, JSON.stringify(INITIAL_OCR_QUEUE));
      return tenantId ? INITIAL_OCR_QUEUE.filter(i => i.tenantId === tenantId) : INITIAL_OCR_QUEUE;
    }
    const all: PrescriptionVerificationItem[] = JSON.parse(raw);
    return tenantId ? all.filter(i => i.tenantId === tenantId) : all;
  } catch {
    return INITIAL_OCR_QUEUE;
  }
};

export const submitPrescriptionForOcrVerification = (
  item: Omit<PrescriptionVerificationItem, 'id' | 'queueNumber' | 'createdAt' | 'verificationStatus'>
): PrescriptionVerificationItem => {
  const all = getOcrQueueItems();
  const queueNumber = `OCR-${new Date().getFullYear()}-${String(all.length + 101).padStart(5, '0')}`;
  const newItem: PrescriptionVerificationItem = {
    ...item,
    id: `ocr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    queueNumber,
    verificationStatus: 'Pending Pharmacist Review',
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_OCR_QUEUE, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to submit OCR item', e);
  }
  return newItem;
};

export const updatePrescriptionVerificationStatus = (
  id: string,
  status: PrescriptionVerificationItem['verificationStatus'],
  pharmacistName: string,
  notes?: string
): PrescriptionVerificationItem | null => {
  const all = getOcrQueueItems();
  const target = all.find(i => i.id === id);
  if (!target) return null;

  const updatedTarget: PrescriptionVerificationItem = {
    ...target,
    verificationStatus: status,
    reviewedByPharmacistName: pharmacistName,
    pharmacistClinicalNotes: notes || target.pharmacistClinicalNotes,
    reviewedAt: new Date().toISOString(),
  };

  const updated = all.map(i => i.id === id ? updatedTarget : i);
  try {
    localStorage.setItem(STORAGE_KEY_OCR_QUEUE, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update verification status', e);
  }
  return updatedTarget;
};
