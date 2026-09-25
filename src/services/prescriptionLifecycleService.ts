/**
 * prescriptionLifecycleService.ts — ZenithRx Clinical Prescription Lifecycle & Partial Dispensing Engine
 * Clean Architecture: Application / Domain Services Layer
 * Complies with Uganda National Drug Authority (NDA) & Pharmaceutical Society of Uganda (PSU) dispensing standards.
 */

import {
  Prescription,
  PrescriptionItem,
  PrescriptionStatus,
  PartialDispensingRecord,
  PrescriptionAmendmentRecord,
  MedicationRoute,
} from '../types';

// Mock Initial Lifecycle Prescriptions
const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'RX-2026-08942',
    rxNumber: 'RX-2026-08942',
    issueDate: '2026-09-22',
    expiryDate: '2026-10-22',
    date: '2026-09-22',
    patientName: 'Grace Nabukenya',
    patientAge: 44,
    patientGender: 'Female',
    patientPhone: '+256-701-445892',
    patientAllergies: ['Penicillin G (Severe Anaphylaxis)'],
    patientChronicConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    prescriberName: 'Dr. Joseph Kanyike',
    prescriberCadre: 'Consultant Physician',
    prescriberRegNo: 'UMDPC/REG/2018/4421',
    prescriberPhone: '+256-772-990112',
    doctorName: 'Dr. Joseph Kanyike',
    doctorLicence: 'UMDPC/REG/2018/4421',
    hospitalName: 'Mulago National Referral Hospital (Endocrine Clinic)',
    diagnosis: 'Hypertensive Heart Disease & Glycemic Control',
    status: 'Partially Dispensed',
    verifiedBy: 'Pharm. Brenda Namubiru (PSU/REG/2019/084)',
    verifiedByPsu: 'PSU/REG/2019/084',
    verifiedAt: '2026-09-22T10:15:00Z',
    refillsAllowed: 2,
    refillsRemaining: 2,
    totalCost: 145000,
    amountPaid: 50000,
    outstandingBalance: 95000,
    medications: [
      {
        id: 'ITEM-01',
        drugId: 'drug-amlo-10',
        drugName: 'Amlodipine Besylate',
        brandName: 'Norvasc',
        genericName: 'Amlodipine',
        strength: '10mg',
        dosageForm: 'Tablets',
        route: 'Oral',
        dosage: '10mg Oral Once Daily (OD) in the morning',
        dose: '1 Tablet',
        frequency: 'OD (Once Daily)',
        duration: '60 Days',
        quantity: 60,
        dispensedQty: 20,
        remainingQty: 40,
        unitPrice: 1500,
        isPOM: true,
        isControlled: false,
        status: 'Partially Dispensed',
        specialInstructions: 'Take with or without food. Monitor blood pressure weekly.',
      },
      {
        id: 'ITEM-02',
        drugId: 'drug-metform-850',
        drugName: 'Metformin Hydrochloride',
        brandName: 'Glucophage',
        genericName: 'Metformin',
        strength: '850mg',
        dosageForm: 'Film-Coated Tablets',
        route: 'Oral',
        dosage: '850mg Oral Twice Daily (BD) after meals',
        dose: '1 Tablet',
        frequency: 'BD (Twice Daily)',
        duration: '30 Days',
        quantity: 60,
        dispensedQty: 60,
        remainingQty: 0,
        unitPrice: 900,
        isPOM: true,
        isControlled: false,
        status: 'Dispensed',
        specialInstructions: 'Take immediately after food to avoid gastrointestinal irritation.',
      },
    ],
    partialDispensingHistory: [
      {
        id: 'PART-001',
        sessionNumber: 1,
        prescriptionItemId: 'ITEM-01',
        drugName: 'Amlodipine Besylate 10mg (Norvasc)',
        batchNumber: 'AML-2026-B88',
        batchExpiry: '2027-08-30',
        quantityDispensed: 20,
        remainingAfter: 40,
        unitPriceUgx: 1500,
        totalChargedUgx: 30000,
        dispensingPharmacist: 'Pharm. Brenda Namubiru',
        dispensingPharmacistPsu: 'PSU/REG/2019/084',
        dispensingBranch: 'Mulago Care Pharmacy (Main Branch)',
        reasonForPartial: 'Local stock deficit of 40 tablets. Balance reserved from incoming central order.',
        nextExpectedDate: '2026-09-29',
        notes: 'Patient advised to collect outstanding 40 tablets on Friday. No extra consultation fee.',
        timestamp: '2026-09-22T10:30:00Z',
      },
    ],
    amendmentHistory: [
      {
        id: 'AMD-001',
        timestamp: '2026-09-22T10:10:00Z',
        amendedBy: 'Pharm. Brenda Namubiru',
        psuNo: 'PSU/REG/2019/084',
        fieldChanged: 'Dosage Form / Generic Substitution',
        oldValue: 'Norvasc 10mg Capsule',
        newValue: 'Norvasc 10mg Tablet (Film-Coated)',
        clinicalJustification: 'Capsule formulation out of stock nationwide; substituted with identical bioequivalent tablet per NDA formulary.',
        prescriberContacted: true,
        prescriberNotes: 'Confirmed via phone with Dr. Kanyike at 10:08 AM.',
      },
    ],
  },
  {
    id: 'RX-2026-09104',
    rxNumber: 'RX-2026-09104',
    issueDate: '2026-09-24',
    expiryDate: '2026-10-24',
    date: '2026-09-24',
    patientName: 'David Kibuuka',
    patientAge: 32,
    patientGender: 'Male',
    patientPhone: '+256-778-112233',
    patientAllergies: ['None Documented'],
    patientChronicConditions: ['Asthma (Mild Persistent)'],
    prescriberName: 'Dr. Sarah Alitwala',
    prescriberCadre: 'Senior Medical Officer',
    prescriberRegNo: 'UMDPC/REG/2021/7890',
    prescriberPhone: '+256-782-334455',
    doctorName: 'Dr. Sarah Alitwala',
    doctorLicence: 'UMDPC/REG/2021/7890',
    hospitalName: 'Case Hospital Kampala',
    diagnosis: 'Acute Bronchospasm & Upper Respiratory Tract Infection',
    status: 'Verified / Approved',
    verifiedBy: 'Pharm. Moses Musoke (PSU/REG/2020/552)',
    verifiedByPsu: 'PSU/REG/2020/552',
    verifiedAt: '2026-09-24T14:20:00Z',
    refillsAllowed: 1,
    refillsRemaining: 1,
    totalCost: 88000,
    amountPaid: 0,
    outstandingBalance: 88000,
    medications: [
      {
        id: 'ITEM-03',
        drugId: 'drug-azith-500',
        drugName: 'Azithromycin Monohydrate',
        brandName: 'Zithromax',
        genericName: 'Azithromycin',
        strength: '500mg',
        dosageForm: 'Film-Coated Tablets',
        route: 'Oral',
        dosage: '500mg Oral Once Daily for 3 Days',
        dose: '1 Tablet',
        frequency: 'OD (Once Daily)',
        duration: '3 Days',
        quantity: 3,
        dispensedQty: 0,
        remainingQty: 3,
        unitPrice: 12000,
        isPOM: true,
        isControlled: false,
        status: 'Pending',
        specialInstructions: 'Take 1 hour before or 2 hours after meals.',
      },
      {
        id: 'ITEM-04',
        drugId: 'drug-salb-100',
        drugName: 'Salbutamol HFA Inhaler',
        brandName: 'Ventolin Evohaler',
        genericName: 'Salbutamol',
        strength: '100mcg/dose',
        dosageForm: 'Metered Dose Inhaler',
        route: 'Inhalation',
        dosage: '2 puffs as needed for acute shortness of breath (PRN)',
        dose: '2 Puffs',
        frequency: 'PRN (As Needed)',
        duration: '30 Days',
        quantity: 1,
        dispensedQty: 0,
        remainingQty: 1,
        unitPrice: 52000,
        isPOM: true,
        isControlled: false,
        status: 'Pending',
        specialInstructions: 'Rinse mouth with water after inhalation. Max 8 puffs in 24 hours.',
      },
    ],
    partialDispensingHistory: [],
    amendmentHistory: [],
  },
  {
    id: 'RX-2026-09210',
    rxNumber: 'RX-2026-09210',
    issueDate: '2026-09-20',
    expiryDate: '2026-09-27',
    date: '2026-09-20',
    patientName: 'Harriet Namatovu',
    patientAge: 58,
    patientGender: 'Female',
    patientPhone: '+256-752-889900',
    patientAllergies: ['Sulphonamides (Stevens-Johnson Rash)'],
    patientChronicConditions: ['Chronic Lumbar Spondylosis'],
    prescriberName: 'Dr. Timothy Mukasa',
    prescriberCadre: 'Orthopedic Surgeon',
    prescriberRegNo: 'UMDPC/REG/2015/1029',
    prescriberPhone: '+256-702-556677',
    doctorName: 'Dr. Timothy Mukasa',
    doctorLicence: 'UMDPC/REG/2015/1029',
    hospitalName: 'Nakasero Hospital',
    diagnosis: 'Severe Degenerative Disc Disease',
    status: 'Rejected',
    rejectionReason: 'Prescription for Class A Morphine Oral Solution lacked mandatory physical MDA counter-signature and patient NIN verification.',
    rejectedBy: 'Pharm. Arthur Ssenabulya (Supervising Pharmacist)',
    rejectedAt: '2026-09-20T16:45:00Z',
    refillsAllowed: 0,
    refillsRemaining: 0,
    totalCost: 120000,
    medications: [
      {
        id: 'ITEM-05',
        drugId: 'drug-morph-10',
        drugName: 'Morphine Sulphate Oral Solution',
        brandName: 'Sevredol',
        genericName: 'Morphine',
        strength: '10mg/5ml',
        dosageForm: 'Oral Liquid',
        route: 'Oral',
        dosage: '10mg (5ml) every 4 hours as required for breakthrough pain',
        dose: '5ml',
        frequency: 'q4h (Every 4 Hours)',
        duration: '7 Days',
        quantity: 1,
        dispensedQty: 0,
        remainingQty: 1,
        unitPrice: 120000,
        isPOM: true,
        isControlled: true,
        status: 'Pending',
        specialInstructions: 'Class A Narcotic. Must be stored in lockable DDA poison safe.',
      },
    ],
  },
];

class PrescriptionLifecycleService {
  private prescriptions: Prescription[] = [];

  constructor() {
    // Load from local storage or seeds
    const cached = localStorage.getItem('zenithrx_prescriptions_lifecycle');
    if (cached) {
      try {
        this.prescriptions = JSON.parse(cached);
      } catch {
        this.prescriptions = SEED_PRESCRIPTIONS;
      }
    } else {
      this.prescriptions = SEED_PRESCRIPTIONS;
      this.saveToStorage();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('zenithrx_prescriptions_lifecycle', JSON.stringify(this.prescriptions));
    } catch {
      // Storage unavailable
    }
  }

  public getAll(): Prescription[] {
    return [...this.prescriptions];
  }

  public getById(id: string): Prescription | undefined {
    return this.prescriptions.find((p) => p.id === id || p.rxNumber === id);
  }

  /**
   * Approve / Verify a prescription
   */
  public verifyPrescription(
    rxId: string,
    pharmacistName: string,
    psuNo: string
  ): Prescription | null {
    const rx = this.prescriptions.find((p) => p.id === rxId);
    if (!rx) return null;

    rx.status = 'Verified / Approved';
    rx.verifiedBy = `${pharmacistName} (${psuNo})`;
    rx.verifiedByPsu = psuNo;
    rx.verifiedAt = new Date().toISOString();
    rx.rejectionReason = undefined;
    rx.rejectedBy = undefined;
    rx.rejectedAt = undefined;

    this.saveToStorage();
    return { ...rx };
  }

  /**
   * Reject a prescription with mandatory clinical reason
   */
  public rejectPrescription(
    rxId: string,
    reason: string,
    pharmacistName: string
  ): Prescription | null {
    const rx = this.prescriptions.find((p) => p.id === rxId);
    if (!rx) return null;

    rx.status = 'Rejected';
    rx.rejectionReason = reason;
    rx.rejectedBy = pharmacistName;
    rx.rejectedAt = new Date().toISOString();

    this.saveToStorage();
    return { ...rx };
  }

  /**
   * Cancel a prescription with mandatory reason
   */
  public cancelPrescription(
    rxId: string,
    reason: string,
    cancelledBy: string
  ): Prescription | null {
    const rx = this.prescriptions.find((p) => p.id === rxId);
    if (!rx) return null;

    rx.status = 'Cancelled';
    rx.cancellationReason = reason;
    rx.cancelledBy = cancelledBy;
    rx.cancelledAt = new Date().toISOString();

    this.saveToStorage();
    return { ...rx };
  }

  /**
   * Execute Partial Dispensing on a prescription line item
   */
  public executePartialDispense(params: {
    rxId: string;
    itemId?: string;
    drugName: string;
    batchNumber: string;
    batchExpiry: string;
    quantityToDispense: number;
    pharmacistName: string;
    pharmacistPsu: string;
    branchName: string;
    reasonForPartial: string;
    nextExpectedDate?: string;
    notes?: string;
  }): { rx: Prescription; event: PartialDispensingRecord } | null {
    const rx = this.prescriptions.find((p) => p.id === params.rxId);
    if (!rx) return null;

    // Find the item or match by name
    const item =
      rx.medications.find((m) => m.id === params.itemId) ||
      rx.medications.find((m) => m.drugName.toLowerCase().includes(params.drugName.toLowerCase())) ||
      rx.medications[0];

    if (!item) return null;

    const currentDispensed = item.dispensedQty || 0;
    const newDispensed = Math.min(item.quantity, currentDispensed + params.quantityToDispense);
    const newRemaining = Math.max(0, item.quantity - newDispensed);

    item.dispensedQty = newDispensed;
    item.remainingQty = newRemaining;
    item.status = newRemaining === 0 ? 'Dispensed' : 'Partially Dispensed';

    // Calculate charge
    const chargedThisSession = params.quantityToDispense * (item.unitPrice || 1000);
    rx.amountPaid = (rx.amountPaid || 0) + chargedThisSession;
    rx.outstandingBalance = Math.max(0, rx.totalCost - (rx.amountPaid || 0));

    // Session number
    const sessionCount = (rx.partialDispensingHistory || []).length + 1;

    const record: PartialDispensingRecord = {
      id: `PART-${Date.now()}`,
      sessionNumber: sessionCount,
      prescriptionItemId: item.id,
      drugName: `${item.drugName} ${item.strength || ''}`,
      batchNumber: params.batchNumber,
      batchExpiry: params.batchExpiry,
      quantityDispensed: params.quantityToDispense,
      remainingAfter: newRemaining,
      unitPriceUgx: item.unitPrice || 1000,
      totalChargedUgx: chargedThisSession,
      dispensingPharmacist: params.pharmacistName,
      dispensingPharmacistPsu: params.pharmacistPsu,
      dispensingBranch: params.branchName,
      reasonForPartial: params.reasonForPartial,
      nextExpectedDate: params.nextExpectedDate,
      notes: params.notes,
      timestamp: new Date().toISOString(),
    };

    if (!rx.partialDispensingHistory) {
      rx.partialDispensingHistory = [];
    }
    rx.partialDispensingHistory.unshift(record);

    // Check if entire prescription is now fully dispensed or partially dispensed
    const allDone = rx.medications.every((m) => (m.dispensedQty || 0) >= m.quantity);
    rx.status = allDone ? 'Fully Dispensed' : 'Partially Dispensed';

    this.saveToStorage();
    return { rx: { ...rx }, event: record };
  }

  /**
   * Amend a prescription line or posology with mandatory clinical reason
   */
  public amendPrescription(params: {
    rxId: string;
    fieldChanged: string;
    oldValue: string;
    newValue: string;
    clinicalJustification: string;
    amendedBy: string;
    psuNo: string;
    prescriberContacted: boolean;
    prescriberNotes?: string;
  }): Prescription | null {
    const rx = this.prescriptions.find((p) => p.id === params.rxId);
    if (!rx) return null;

    const amendment: PrescriptionAmendmentRecord = {
      id: `AMD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amendedBy: params.amendedBy,
      psuNo: params.psuNo,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue,
      newValue: params.newValue,
      clinicalJustification: params.clinicalJustification,
      prescriberContacted: params.prescriberContacted,
      prescriberNotes: params.prescriberNotes,
    };

    if (!rx.amendmentHistory) {
      rx.amendmentHistory = [];
    }
    rx.amendmentHistory.unshift(amendment);

    this.saveToStorage();
    return { ...rx };
  }

  /**
   * Add a newly created prescription
   */
  public addPrescription(newRx: Prescription): Prescription {
    const rxObj: Prescription = {
      ...newRx,
      issueDate: newRx.issueDate || new Date().toISOString().split('T')[0],
      expiryDate:
        newRx.expiryDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      refillsAllowed: newRx.refillsAllowed ?? 0,
      refillsRemaining: newRx.refillsRemaining ?? (newRx.refillsAllowed ?? 0),
      partialDispensingHistory: newRx.partialDispensingHistory || [],
      amendmentHistory: newRx.amendmentHistory || [],
    };

    this.prescriptions.unshift(rxObj);
    this.saveToStorage();
    return rxObj;
  }

  /**
   * Update an existing prescription directly
   */
  public updatePrescription(updatedRx: Prescription): Prescription {
    const idx = this.prescriptions.findIndex((p) => p.id === updatedRx.id);
    if (idx !== -1) {
      this.prescriptions[idx] = { ...updatedRx };
    } else {
      this.prescriptions.unshift({ ...updatedRx });
    }
    this.saveToStorage();
    return { ...updatedRx };
  }
}

export const prescriptionLifecycleService = new PrescriptionLifecycleService();
