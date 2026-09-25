/**
 * assistivePrescriptionAIService.ts — ZenithRx Assistive AI / OCR Prescription Safety Engine
 * 
 * CORE SAFETY DOCTRINE:
 * 1. AI -> Suggests (OCR extraction, handwriting deciphering, catalog matching)
 * 2. System -> Flags (Duplicate therapy, abnormal dosage, DDI, allergy, compliance)
 * 3. Pharmacist -> Decides (Sole clinical authority; OCR cannot auto-approve)
 */

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export type SystemFlagCategory = 
  | 'DUPLICATE_THERAPY'
  | 'ABNORMAL_DOSAGE'
  | 'DRUG_INTERACTION'
  | 'ALLERGY_CONFLICT'
  | 'UNMATCHED_DRUG'
  | 'CONTROLLED_CLASS_A_FLAG'
  | 'UNVERIFIED_PRESCRIBER';

export interface HandwritingAmbiguity {
  phrase: string;
  confidence: number;
  notes: string;
  alternativeInterpretations?: string[];
}

export interface ExtractedMedicationItem {
  id: string;
  rawText: string;
  suggestedDrugName: string;
  matchedInventorySku?: string;
  matchedStockOnHand?: number;
  matchedUnitPrice?: number;
  suggestedDosage: string;
  suggestedFrequency: string;
  suggestedDuration: string;
  suggestedQuantity: number;
  confidenceScore: number;
  matchConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNMATCHED';
  isDuplicate?: boolean;
  duplicateDetails?: string;
  isAbnormalDose?: boolean;
  abnormalDoseDetails?: string;
}

export interface SystemSafetyFlag {
  id: string;
  category: SystemFlagCategory;
  severity: SeverityLevel;
  title: string;
  message: string;
  recommendation: string;
  associatedDrugName?: string;
  requiresMandatoryPharmacistAck: boolean;
}

export type PharmacistDecisionStatus = 
  | 'PENDING_REVIEW'
  | 'APPROVED_BY_PHARMACIST'
  | 'MODIFIED_AND_APPROVED'
  | 'REJECTED_BY_PHARMACIST'
  | 'ESCALATED_TO_DOCTOR';

export interface PharmacistModification {
  medicationId: string;
  field: 'drugName' | 'dosage' | 'frequency' | 'duration' | 'quantity';
  originalValue: string | number;
  modifiedValue: string | number;
  clinicalReason: string;
}

export interface AssistiveOcrPrescription {
  id: string;
  tenantId: string;
  prescriptionId: string;
  queueNumber: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  imageUrl: string;
  
  // AI Assistive Layer
  aiModelVersion: string;
  rawOcrText: string;
  handwritingDifficultyScore: number; // 0-100%
  handwritingAmbiguities: HandwritingAmbiguity[];
  extractedPrescriberName: string;
  extractedPrescriberReg: string;
  extractedClinicHospital: string;
  extractedDate: string;
  extractedMedications: ExtractedMedicationItem[];
  
  // System Safety Flags Layer
  systemFlags: SystemSafetyFlag[];
  hasCriticalFlags: boolean;
  duplicateMedicationsFound: string[];
  abnormalDosageFlags: string[];
  unmatchedDrugsFlags: string[];
  
  // Pharmacist Decision Layer
  decisionStatus: PharmacistDecisionStatus;
  pharmacistId?: string;
  pharmacistName?: string;
  pharmacistUmdpcReg?: string;
  pharmacistClinicalNotes?: string;
  pharmacistModifications?: PharmacistModification[];
  pharmacistOverrides?: string[];
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionAuditEntry {
  id: string;
  ocrPrescriptionId: string;
  actionType: 'AI_SUGGESTED' | 'SYSTEM_FLAGGED' | 'PHARMACIST_MODIFIED' | 'PHARMACIST_APPROVED' | 'PHARMACIST_REJECTED' | 'ESCALATED_TO_DOCTOR';
  actorRole: 'AI_ENGINE' | 'SYSTEM_RULE_ENGINE' | 'SUPERVISING_PHARMACIST';
  actorName: string;
  actorLicense?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

const STORAGE_KEY_ASSISTIVE_PRESCRIPTIONS = 'zenithrx_assistive_ocr_prescriptions_v1';
const STORAGE_KEY_AI_DECISION_AUDIT = 'zenithrx_prescription_ai_decision_audits_v1';

// Standard Reference Inventory Catalog for Fuzzy Matching
export const STANDARD_DRUG_CATALOG = [
  { sku: 'SKU-AMOX-625', name: 'Amoxicillin + Clavulanic Acid 625mg', unitPrice: 2500, stockOnHand: 128, generic: 'Co-amoxiclav', category: 'Antibiotic' },
  { sku: 'SKU-AMOX-500', name: 'Amoxicillin 500mg Capsule', unitPrice: 800, stockOnHand: 240, generic: 'Amoxicillin', category: 'Antibiotic' },
  { sku: 'SKU-CIPRO-500', name: 'Ciprofloxacin 500mg Tablet', unitPrice: 1800, stockOnHand: 84, generic: 'Ciprofloxacin', category: 'Fluoroquinolone' },
  { sku: 'SKU-AUG-625', name: 'Co-Amoxiclav (Augmentin) 625mg', unitPrice: 3200, stockOnHand: 65, generic: 'Co-amoxiclav', category: 'Antibiotic' },
  { sku: 'SKU-PARA-500', name: 'Paracetamol 500mg Tablet', unitPrice: 300, stockOnHand: 450, generic: 'Acetaminophen', category: 'Analgesic' },
  { sku: 'SKU-MET-500', name: 'Metformin HCl 500mg Tablet', unitPrice: 400, stockOnHand: 310, generic: 'Metformin', category: 'Antidiabetic' },
  { sku: 'SKU-ATV-20', name: 'Atorvastatin 20mg Tablet', unitPrice: 2200, stockOnHand: 92, generic: 'Atorvastatin', category: 'Statin / Lipid-Lowering' },
  { sku: 'SKU-LOS-50', name: 'Losartan Potassium 50mg', unitPrice: 1500, stockOnHand: 110, generic: 'Losartan', category: 'Antihypertensive' },
  { sku: 'SKU-AZI-500', name: 'Azithromycin 500mg Tablet', unitPrice: 3500, stockOnHand: 42, generic: 'Azithromycin', category: 'Macrolide Antibiotic' },
  { sku: 'SKU-MOR-10', name: 'Morphine Sulphate 10mg/mL Ampoule (Class A Safe)', unitPrice: 12500, stockOnHand: 14, generic: 'Morphine', category: 'Controlled Narcotic' },
  { sku: 'SKU-TRAM-50', name: 'Tramadol HCl 50mg Capsule', unitPrice: 1200, stockOnHand: 78, generic: 'Tramadol', category: 'Controlled Opioid' }
];

export const INITIAL_ASSISTIVE_PRESCRIPTIONS: AssistiveOcrPrescription[] = [
  {
    id: 'ast-ocr-001',
    tenantId: 'client-001',
    prescriptionId: 'rx-ocr-8801',
    queueNumber: 'OCR-2026-08101',
    patientId: 'pat-101',
    patientName: 'Kato Emmanuel',
    patientPhone: '+256 704 556677',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60',
    aiModelVersion: 'ZenithRx-Vision-OCR-v4.2 (Gemini Flash Clinical)',
    rawOcrText: 'Rx:\n1. Amox-Clav 625mg tabs 1 b.i.d x 7/7\n2. Paracetamol 1g t.i.d p.r.n x 5/7\nDr. Mukasa David (UMDPC-2018-0912)\nMulago Women Hospital',
    handwritingDifficultyScore: 22.5,
    handwritingAmbiguities: [
      {
        phrase: 'Amox-Clav 625mg',
        confidence: 97,
        notes: 'Clear cursive script, matched to Amoxicillin+Clavulanate 625mg'
      },
      {
        phrase: '1 b.i.d x 7/7',
        confidence: 94,
        notes: 'Latin b.i.d transcribed as 12-hourly for 7 days'
      }
    ],
    extractedPrescriberName: 'Dr. Mukasa David',
    extractedPrescriberReg: 'UMDPC-2018-0912',
    extractedClinicHospital: 'Mulago Specialized Women Hospital',
    extractedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    extractedMedications: [
      {
        id: 'med-101',
        rawText: 'Amox-Clav 625mg tabs 1 b.i.d x 7/7',
        suggestedDrugName: 'Amoxicillin + Clavulanic Acid 625mg',
        matchedInventorySku: 'SKU-AMOX-625',
        matchedStockOnHand: 128,
        matchedUnitPrice: 2500,
        suggestedDosage: '1 tablet',
        suggestedFrequency: '12-hourly (b.i.d)',
        suggestedDuration: '7 days',
        suggestedQuantity: 14,
        confidenceScore: 97,
        matchConfidence: 'HIGH'
      },
      {
        id: 'med-102',
        rawText: 'Paracetamol 1g t.i.d p.r.n x 5/7',
        suggestedDrugName: 'Paracetamol 500mg Tablet',
        matchedInventorySku: 'SKU-PARA-500',
        matchedStockOnHand: 450,
        matchedUnitPrice: 300,
        suggestedDosage: '2 tablets (1000mg)',
        suggestedFrequency: '8-hourly PRN (t.i.d)',
        suggestedDuration: '5 days',
        suggestedQuantity: 30,
        confidenceScore: 95,
        matchConfidence: 'HIGH'
      }
    ],
    systemFlags: [
      {
        id: 'flag-101',
        category: 'UNVERIFIED_PRESCRIBER',
        severity: 'INFO',
        title: 'Prescriber Registry Active',
        message: 'Dr. Mukasa David (UMDPC-2018-0912) is active and verified in Uganda Medical and Dental Practitioners Council registry.',
        recommendation: 'Verification passed. Standard dispensing protocol applies.',
        requiresMandatoryPharmacistAck: false
      }
    ],
    hasCriticalFlags: false,
    duplicateMedicationsFound: [],
    abnormalDosageFlags: [],
    unmatchedDrugsFlags: [],
    decisionStatus: 'APPROVED_BY_PHARMACIST',
    pharmacistId: 'pharm-01',
    pharmacistName: 'Dr. Arthur Ssenabulya (Supervising Pharmacist)',
    pharmacistUmdpcReg: 'NDA/PHARM/2019/0411',
    pharmacistClinicalNotes: 'Prescription valid, appropriate indication for acute sinusitis. Dosages and duration verified compliant with Uganda Clinical Guidelines (UCG).',
    reviewedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'ast-ocr-002',
    tenantId: 'client-001',
    prescriptionId: 'rx-ocr-8802',
    queueNumber: 'OCR-2026-08102',
    patientId: 'pat-102',
    patientName: 'Aisha Namaganda',
    patientPhone: '+256 752 112233',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=60',
    aiModelVersion: 'ZenithRx-Vision-OCR-v4.2 (Gemini Flash Clinical)',
    rawOcrText: 'Rx:\n1. Ciprofloxacin 1000mg stat then 750mg b.i.d x 10/7\n2. Metformin 1000mg b.i.d\n3. Augmentin 625mg 1 b.i.d\nDr. John Kyeyune (UMDPC-2022-7719)\nCase Medical Centre Kampala',
    handwritingDifficultyScore: 48.0,
    handwritingAmbiguities: [
      {
        phrase: 'Cipro 1000mg stat',
        confidence: 81,
        notes: 'Possible supratherapeutic dosage flagged by system',
        alternativeInterpretations: ['Ciprofloxacin 500mg stat', 'Ciprofloxacin 1000mg stat']
      },
      {
        phrase: 'Augmentin + Metformin',
        confidence: 88,
        notes: 'Cursive ligature deciphered with 88% confidence'
      }
    ],
    extractedPrescriberName: 'Dr. John Kyeyune',
    extractedPrescriberReg: 'UMDPC-2022-7719',
    extractedClinicHospital: 'Case Medical Centre Kampala',
    extractedDate: new Date().toISOString().split('T')[0],
    extractedMedications: [
      {
        id: 'med-201',
        rawText: 'Ciprofloxacin 1000mg stat then 750mg b.i.d x 10/7',
        suggestedDrugName: 'Ciprofloxacin 500mg / 750mg',
        matchedInventorySku: 'SKU-CIPRO-500',
        matchedStockOnHand: 84,
        matchedUnitPrice: 1800,
        suggestedDosage: '750mg',
        suggestedFrequency: '12-hourly',
        suggestedDuration: '10 days',
        suggestedQuantity: 20,
        confidenceScore: 84,
        matchConfidence: 'MEDIUM',
        isAbnormalDose: true,
        abnormalDoseDetails: '1000mg stat + 750mg 12-hourly exceeds standard 500mg 12-hourly dosage ceiling.'
      },
      {
        id: 'med-202',
        rawText: 'Metformin 1000mg b.i.d',
        suggestedDrugName: 'Metformin HCl 500mg / 1000mg',
        matchedInventorySku: 'SKU-MET-500',
        matchedStockOnHand: 310,
        matchedUnitPrice: 400,
        suggestedDosage: '1000mg (2 x 500mg)',
        suggestedFrequency: '12-hourly with meals',
        suggestedDuration: '30 days',
        suggestedQuantity: 60,
        confidenceScore: 91,
        matchConfidence: 'HIGH'
      },
      {
        id: 'med-203',
        rawText: 'Augmentin 625mg 1 b.i.d',
        suggestedDrugName: 'Co-Amoxiclav (Augmentin) 625mg',
        matchedInventorySku: 'SKU-AUG-625',
        matchedStockOnHand: 65,
        matchedUnitPrice: 3200,
        suggestedDosage: '1 tablet',
        suggestedFrequency: '12-hourly',
        suggestedDuration: '7 days',
        suggestedQuantity: 14,
        confidenceScore: 93,
        matchConfidence: 'HIGH',
        isDuplicate: true,
        duplicateDetails: 'Therapeutic duplication with Ciprofloxacin (Concurrent broad-spectrum antibiotic).'
      }
    ],
    systemFlags: [
      {
        id: 'flag-201',
        category: 'ABNORMAL_DOSAGE',
        severity: 'CRITICAL',
        title: 'Supratherapeutic Ciprofloxacin Dosage',
        message: 'Extracted dosage of Ciprofloxacin 1000mg stat + 750mg b.i.d exceeds standard adult maximum guideline for uncomplicated infections (standard: 500mg 12-hourly).',
        recommendation: 'Pharmacist must clarify renal function and clinical indication or adjust dosage down to 500mg 12-hourly.',
        associatedDrugName: 'Ciprofloxacin',
        requiresMandatoryPharmacistAck: true
      },
      {
        id: 'flag-202',
        category: 'DUPLICATE_THERAPY',
        severity: 'HIGH',
        title: 'Therapeutic Duplication (Dual Antibiotics)',
        message: 'Prescription contains concurrent broad-spectrum systemic antibiotics: Ciprofloxacin (Fluoroquinolone) + Augmentin (Co-amoxiclav).',
        recommendation: 'Pharmacist review required to confirm if dual empiric coverage is clinically justified or if one antibiotic should be discontinued.',
        associatedDrugName: 'Augmentin 625mg',
        requiresMandatoryPharmacistAck: true
      },
      {
        id: 'flag-203',
        category: 'DRUG_INTERACTION',
        severity: 'MEDIUM',
        title: 'Pharmacokinetic Interaction (Ciprofloxacin + Metformin)',
        message: 'Ciprofloxacin may inhibit hepatic OCT2 transporters, potentiating Metformin exposure and increasing hypoglycemia risk.',
        recommendation: 'Counsel patient on blood glucose monitoring and hydration.',
        associatedDrugName: 'Metformin',
        requiresMandatoryPharmacistAck: false
      }
    ],
    hasCriticalFlags: true,
    duplicateMedicationsFound: ['Therapeutic Duplication: Ciprofloxacin 750mg + Augmentin 625mg concurrently'],
    abnormalDosageFlags: ['Ciprofloxacin 1000mg stat + 750mg b.i.d exceeds standard daily ceiling'],
    unmatchedDrugsFlags: [],
    decisionStatus: 'PENDING_REVIEW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ast-ocr-003',
    tenantId: 'client-001',
    prescriptionId: 'rx-ocr-8803',
    queueNumber: 'OCR-2026-08103',
    patientId: 'pat-103',
    patientName: 'Sarah Nalubega',
    patientPhone: '+256 772 998877',
    imageUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&auto=format&fit=crop&q=60',
    aiModelVersion: 'ZenithRx-Vision-OCR-v4.2 (Gemini Flash Clinical)',
    rawOcrText: 'Rx:\n1. Morphine Sulphate 10mg/mL Amp #6 (six) amps\nSig: 1 amp s.c every 4h p.r.n breakthrough cancer pain\nDr. Timothy Mugisha (UMDPC-2015-3321)\nUganda Cancer Institute Mulago',
    handwritingDifficultyScore: 35.0,
    handwritingAmbiguities: [
      {
        phrase: 'Morphine Sulphate 10mg/mL Amp #6 (six)',
        confidence: 96,
        notes: 'Words and figures match (#6 and six written out). Controlled Class A Narcotic format verified.'
      }
    ],
    extractedPrescriberName: 'Dr. Timothy Mugisha',
    extractedPrescriberReg: 'UMDPC-2015-3321',
    extractedClinicHospital: 'Uganda Cancer Institute Mulago',
    extractedDate: new Date().toISOString().split('T')[0],
    extractedMedications: [
      {
        id: 'med-301',
        rawText: 'Morphine Sulphate 10mg/mL Amp #6 (six) amps',
        suggestedDrugName: 'Morphine Sulphate 10mg/mL Ampoule (Class A Safe)',
        matchedInventorySku: 'SKU-MOR-10',
        matchedStockOnHand: 14,
        matchedUnitPrice: 12500,
        suggestedDosage: '10mg/mL ampoule',
        suggestedFrequency: '4-hourly PRN (s.c)',
        suggestedDuration: '3 days',
        suggestedQuantity: 6,
        confidenceScore: 96,
        matchConfidence: 'HIGH'
      }
    ],
    systemFlags: [
      {
        id: 'flag-301',
        category: 'CONTROLLED_CLASS_A_FLAG',
        severity: 'CRITICAL',
        title: 'Class A Narcotic Controlled Safe Protocol Enforced',
        message: 'Under Uganda National Drug Authority Regulations 1970, Class A Narcotics require physical prescriber signature verification, Patient National Identification Number (NIN), and dual-pharmacist safe register entry.',
        recommendation: 'Pharmacist MUST physically inspect ink prescription, verify patient NIN at counter, and witness safe balance reconciliation.',
        associatedDrugName: 'Morphine Sulphate 10mg/mL',
        requiresMandatoryPharmacistAck: true
      }
    ],
    hasCriticalFlags: true,
    duplicateMedicationsFound: [],
    abnormalDosageFlags: [],
    unmatchedDrugsFlags: [],
    decisionStatus: 'PENDING_REVIEW',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export const getAssistivePrescriptions = (tenantId?: string): AssistiveOcrPrescription[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSISTIVE_PRESCRIPTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ASSISTIVE_PRESCRIPTIONS, JSON.stringify(INITIAL_ASSISTIVE_PRESCRIPTIONS));
      return tenantId ? INITIAL_ASSISTIVE_PRESCRIPTIONS.filter(i => i.tenantId === tenantId) : INITIAL_ASSISTIVE_PRESCRIPTIONS;
    }
    const all: AssistiveOcrPrescription[] = JSON.parse(raw);
    return tenantId ? all.filter(i => i.tenantId === tenantId) : all;
  } catch {
    return INITIAL_ASSISTIVE_PRESCRIPTIONS;
  }
};

export const getAssistivePrescriptionById = (id: string): AssistiveOcrPrescription | null => {
  const all = getAssistivePrescriptions();
  return all.find(i => i.id === id || i.prescriptionId === id) || null;
};

export const fuzzyMatchDrugCatalog = (query: string) => {
  const clean = query.toLowerCase().trim();
  return STANDARD_DRUG_CATALOG.filter(drug => 
    drug.name.toLowerCase().includes(clean) ||
    drug.generic.toLowerCase().includes(clean) ||
    drug.category.toLowerCase().includes(clean)
  );
};

export const submitPharmacistDecision = (
  id: string,
  decision: PharmacistDecisionStatus,
  pharmacistName: string,
  pharmacistReg: string,
  clinicalNotes: string,
  modifications: PharmacistModification[] = [],
  flagOverrides: string[] = []
): AssistiveOcrPrescription | null => {
  const all = getAssistivePrescriptions();
  const target = all.find(i => i.id === id);
  if (!target) return null;

  const now = new Date().toISOString();

  // If modifications were made, apply them to the medications
  let updatedMedications = [...target.extractedMedications];
  if (modifications.length > 0) {
    updatedMedications = updatedMedications.map(med => {
      const medMods = modifications.filter(m => m.medicationId === med.id);
      if (medMods.length === 0) return med;
      
      const updatedMed = { ...med };
      medMods.forEach(mod => {
        if (mod.field === 'drugName') updatedMed.suggestedDrugName = String(mod.modifiedValue);
        if (mod.field === 'dosage') updatedMed.suggestedDosage = String(mod.modifiedValue);
        if (mod.field === 'frequency') updatedMed.suggestedFrequency = String(mod.modifiedValue);
        if (mod.field === 'duration') updatedMed.suggestedDuration = String(mod.modifiedValue);
        if (mod.field === 'quantity') updatedMed.suggestedQuantity = Number(mod.modifiedValue);
      });
      return updatedMed;
    });
  }

  const updatedTarget: AssistiveOcrPrescription = {
    ...target,
    decisionStatus: decision,
    pharmacistId: 'pharm-active',
    pharmacistName,
    pharmacistUmdpcReg: pharmacistReg,
    pharmacistClinicalNotes: clinicalNotes,
    pharmacistModifications: modifications,
    pharmacistOverrides: flagOverrides,
    extractedMedications: updatedMedications,
    reviewedAt: now,
    updatedAt: now
  };

  const updatedAll = all.map(i => i.id === id ? updatedTarget : i);
  try {
    localStorage.setItem(STORAGE_KEY_ASSISTIVE_PRESCRIPTIONS, JSON.stringify(updatedAll));
    
    // Log to immutable Audit Trail
    const auditEntry: DecisionAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ocrPrescriptionId: target.id,
      actionType: decision === 'APPROVED_BY_PHARMACIST' 
        ? 'PHARMACIST_APPROVED' 
        : decision === 'MODIFIED_AND_APPROVED' 
        ? 'PHARMACIST_MODIFIED' 
        : decision === 'ESCALATED_TO_DOCTOR'
        ? 'ESCALATED_TO_DOCTOR'
        : 'PHARMACIST_REJECTED',
      actorRole: 'SUPERVISING_PHARMACIST',
      actorName: pharmacistName,
      actorLicense: pharmacistReg,
      details: {
        decision,
        notes: clinicalNotes,
        modificationsCount: modifications.length,
        modifications,
        flagOverridesCount: flagOverrides.length,
        flagOverrides
      },
      timestamp: now
    };

    const existingAuditsRaw = localStorage.getItem(STORAGE_KEY_AI_DECISION_AUDIT);
    const audits: DecisionAuditEntry[] = existingAuditsRaw ? JSON.parse(existingAuditsRaw) : [];
    localStorage.setItem(STORAGE_KEY_AI_DECISION_AUDIT, JSON.stringify([auditEntry, ...audits]));

  } catch (e) {
    console.error('Failed to commit pharmacist clinical decision', e);
  }

  return updatedTarget;
};

export const getDecisionAuditTrail = (ocrPrescriptionId?: string): DecisionAuditEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_DECISION_AUDIT);
    if (!raw) return [];
    const all: DecisionAuditEntry[] = JSON.parse(raw);
    return ocrPrescriptionId ? all.filter(a => a.ocrPrescriptionId === ocrPrescriptionId) : all;
  } catch {
    return [];
  }
};
