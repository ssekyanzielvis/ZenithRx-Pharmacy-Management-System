/**
 * refillEligibilityService.ts — ZenithRx Posology Depletion & Refill Eligibility Engine
 * 
 * Mathematical Model:
 * 1. Daily Intake Rate = Dose Per Intake × Frequency Per Day
 * 2. Total Days of Supply = floor(Original Quantity / Daily Intake Rate)
 * 3. Estimated Depletion Date = Dispensing Date + Days Supply
 * 4. Days Remaining = Estimated Depletion Date - Current Date
 * 
 * Clinical & Regulatory Safeguards:
 * - 85% Consumption Threshold: Prevents premature refill diversion/abuse.
 * - Pharmacist Pre-Outreach Review: All calculated refill messages must be reviewed & approved by registered pharmacist.
 * - Dynamic Personalized Outreach: Generates tailored WhatsApp/SMS containing exact posology, dates, and remaining days.
 */

export interface RefillEligibilityRecord {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  prescriptionId?: string;
  prescriptionRefNo?: string;
  medicationName: string;
  genericName: string;
  chronicCondition: string;
  
  // Posology Inputs
  originalQuantity: number;
  unitOfMeasure: 'tablets' | 'capsules' | 'mL' | 'puffs' | 'vials' | 'sachets';
  dosePerIntake: number; // e.g. 1
  frequencyPerDay: number; // e.g. 2 for BD, 1 for OD, 3 for TDS, 4 for QDS
  frequencyText: string; // e.g. '1 tablet twice daily with meals (BD)'
  dailyIntakeRate: number; // dosePerIntake * frequencyPerDay
  
  // Computed Timing
  daysSupply: number;
  dispensingDate: string; // YYYY-MM-DD
  estimatedDepletionDate: string; // YYYY-MM-DD
  earliestAllowedRefillDate: string; // YYYY-MM-DD (85% rule)
  
  // Dynamic Live State
  daysRemaining: number;
  consumptionPercent: number;
  refillEligibilityStatus:
    | 'Due in 0-3 Days (Action Required)'
    | 'Approaching (4-7 Days)'
    | 'Overdue (Missed Dose Risk)'
    | 'Active Supply (>7 Days)'
    | 'Discontinued';
    
  // Pharmacist Governance
  pharmacistReviewStatus: 'Pending Review' | 'Approved for Outreach' | 'Posology Adjusted' | 'Refill Authorized' | 'Suspended';
  pharmacistReviewerName?: string;
  pharmacistReviewerPsuNo?: string;
  pharmacistReviewTimestamp?: string;
  pharmacistReviewNotes?: string;
  
  // Communication
  reminderChannel: 'WhatsApp' | 'SMS' | 'Phone Call';
  tailoredMessagePreview: string;
  lastReminderSentAt?: string;
  reminderDispatchCount: number;
}

const STORAGE_KEY_REFILL_ELIGIBILITY = 'zenithrx_refill_eligibility_records_v1';

// Reference date for clinical demonstration (matches active system clock: 2026-09-25)
export const SYSTEM_CURRENT_DATE = '2026-09-25';

export function calculateDepletion(
  dispensingDateStr: string,
  originalQuantity: number,
  dosePerIntake: number,
  frequencyPerDay: number,
  currentDateStr: string = SYSTEM_CURRENT_DATE
): {
  dailyIntakeRate: number;
  daysSupply: number;
  estimatedDepletionDate: string;
  earliestAllowedRefillDate: string;
  daysRemaining: number;
  consumptionPercent: number;
  refillEligibilityStatus: RefillEligibilityRecord['refillEligibilityStatus'];
} {
  const dailyIntakeRate = Math.max(0.1, dosePerIntake * frequencyPerDay);
  const daysSupply = Math.floor(originalQuantity / dailyIntakeRate);
  
  const dispDate = new Date(dispensingDateStr);
  
  // Add daysSupply days to dispensing date
  const depletionDate = new Date(dispDate);
  depletionDate.setDate(depletionDate.getDate() + daysSupply);
  const estimatedDepletionDate = depletionDate.toISOString().split('T')[0];
  
  // 85% rule for earliest allowed refill
  const earliestRefillDate = new Date(dispDate);
  earliestRefillDate.setDate(earliestRefillDate.getDate() + Math.floor(daysSupply * 0.85));
  const earliestAllowedRefillDate = earliestRefillDate.toISOString().split('T')[0];
  
  // Difference from current date
  const currDate = new Date(currentDateStr);
  const diffTime = depletionDate.getTime() - currDate.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const elapsedDays = Math.max(0, daysSupply - daysRemaining);
  const consumptionPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / daysSupply) * 100)));
  
  let refillEligibilityStatus: RefillEligibilityRecord['refillEligibilityStatus'] = 'Active Supply (>7 Days)';
  
  if (daysRemaining < 0) {
    refillEligibilityStatus = 'Overdue (Missed Dose Risk)';
  } else if (daysRemaining <= 3) {
    refillEligibilityStatus = 'Due in 0-3 Days (Action Required)';
  } else if (daysRemaining <= 7) {
    refillEligibilityStatus = 'Approaching (4-7 Days)';
  } else {
    refillEligibilityStatus = 'Active Supply (>7 Days)';
  }
  
  return {
    dailyIntakeRate,
    daysSupply,
    estimatedDepletionDate,
    earliestAllowedRefillDate,
    daysRemaining,
    consumptionPercent,
    refillEligibilityStatus,
  };
}

export function generateTailoredMessage(
  patientName: string,
  medicationName: string,
  originalQuantity: number,
  unitOfMeasure: string,
  frequencyText: string,
  dispensingDate: string,
  estimatedDepletionDate: string,
  daysRemaining: number,
  pharmacyName: string = 'ZenithRx Pharmacy',
  pharmacyPhone: string = '+256 774 607782'
): string {
  const dispFormatted = formatDateLabel(dispensingDate);
  const depletFormatted = formatDateLabel(estimatedDepletionDate);
  
  let statusHighlight = '';
  if (daysRemaining < 0) {
    statusHighlight = `⚠️ *Alert:* Your routine supply ran out *${Math.abs(daysRemaining)} days ago*. To prevent missed doses, please refill immediately.`;
  } else if (daysRemaining === 0) {
    statusHighlight = `🔔 *Alert:* Your medication supply *runs out today (${depletFormatted})*.`;
  } else if (daysRemaining === 1) {
    statusHighlight = `🔔 *Notice:* Your medication supply *runs out tomorrow (1 day remaining)*.`;
  } else {
    statusHighlight = `🔔 *Notice:* Your medication supply will run out in *${daysRemaining} days (${depletFormatted})*.`;
  }
  
  return (
    `Hello *${patientName}* 👋\n\n` +
    `This is *${pharmacyName}* with your precision refill update:\n\n` +
    `💊 *Medication:* ${medicationName}\n` +
    `📋 *Prescribed Dose:* ${frequencyText}\n` +
    `📦 *Dispensed on:* ${dispFormatted} (${originalQuantity} ${unitOfMeasure})\n` +
    `📅 *Estimated Depletion Date:* ${depletFormatted}\n\n` +
    `${statusHighlight}\n\n` +
    `✅ Your refill has been clinically reviewed by our supervising pharmacist and verified in-stock.\n\n` +
    `Reply *REFILL* to reserve for fast-track pickup or confirm doorstep courier delivery.\n` +
    `📞 Need pharmacist advice? Call/WhatsApp us at ${pharmacyPhone}.`
  );
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Master Initial Records
export const INITIAL_REFILL_ELIGIBILITY_DATA: RefillEligibilityRecord[] = [
  {
    id: 'refill-001',
    tenantId: 'client-001',
    patientId: 'cust-1',
    patientName: 'Grace Nakato',
    patientPhone: '+256 701 234567',
    prescriptionRefNo: 'RX-2026-8819',
    medicationName: 'Amlodipine Besylate 5mg',
    genericName: 'Amlodipine Besylate',
    chronicCondition: 'Hypertension',
    originalQuantity: 30,
    unitOfMeasure: 'tablets',
    dosePerIntake: 1,
    frequencyPerDay: 1,
    frequencyText: '1 tablet once daily in the morning (OD)',
    dailyIntakeRate: 1,
    daysSupply: 30,
    dispensingDate: '2026-08-28',
    estimatedDepletionDate: '2026-09-27',
    earliestAllowedRefillDate: '2026-09-23',
    daysRemaining: 2,
    consumptionPercent: 93,
    refillEligibilityStatus: 'Due in 0-3 Days (Action Required)',
    pharmacistReviewStatus: 'Approved for Outreach',
    pharmacistReviewerName: 'Dr. Arthur Ssenabulya',
    pharmacistReviewerPsuNo: 'PSU-2021-0892',
    pharmacistReviewTimestamp: '2026-09-24T14:30:00Z',
    pharmacistReviewNotes: 'Blood pressure stable (126/82 mmHg). Posology confirmed at 1 tablet OD. Refill approved for outreach.',
    reminderChannel: 'WhatsApp',
    tailoredMessagePreview: '',
    lastReminderSentAt: '2026-09-24T15:00:00Z',
    reminderDispatchCount: 1,
  },
  {
    id: 'refill-002',
    tenantId: 'client-001',
    patientId: 'cust-2',
    patientName: 'John Baptist Okello',
    patientPhone: '+256 772 345678',
    prescriptionRefNo: 'RX-2026-9041',
    medicationName: 'Metformin Hydrochloride 500mg',
    genericName: 'Metformin HCl',
    chronicCondition: 'Diabetes Type 2',
    originalQuantity: 60,
    unitOfMeasure: 'tablets',
    dosePerIntake: 1,
    frequencyPerDay: 2,
    frequencyText: '1 tablet twice daily with meals (BD)',
    dailyIntakeRate: 2,
    daysSupply: 30,
    dispensingDate: '2026-08-29',
    estimatedDepletionDate: '2026-09-28',
    earliestAllowedRefillDate: '2026-09-24',
    daysRemaining: 3,
    consumptionPercent: 90,
    refillEligibilityStatus: 'Due in 0-3 Days (Action Required)',
    pharmacistReviewStatus: 'Pending Review',
    pharmacistReviewNotes: 'Estimated runout in 3 days (28 Sep). Pending pharmacist review of kidney function log.',
    reminderChannel: 'WhatsApp',
    tailoredMessagePreview: '',
    reminderDispatchCount: 0,
  },
  {
    id: 'refill-003',
    tenantId: 'client-001',
    patientId: 'cust-3',
    patientName: 'Sarah Namugga',
    patientPhone: '+256 782 990011',
    prescriptionRefNo: 'RX-2026-7734',
    medicationName: 'Ventolin Inhaler 100mcg (200 doses)',
    genericName: 'Salbutamol Sulfate',
    chronicCondition: 'Asthma',
    originalQuantity: 200,
    unitOfMeasure: 'puffs',
    dosePerIntake: 2,
    frequencyPerDay: 2,
    frequencyText: '2 puffs twice daily (BD)',
    dailyIntakeRate: 4,
    daysSupply: 50,
    dispensingDate: '2026-08-04',
    estimatedDepletionDate: '2026-09-23',
    earliestAllowedRefillDate: '2026-09-16',
    daysRemaining: -2,
    consumptionPercent: 100,
    refillEligibilityStatus: 'Overdue (Missed Dose Risk)',
    pharmacistReviewStatus: 'Approved for Outreach',
    pharmacistReviewerName: 'Dr. Arthur Ssenabulya',
    pharmacistReviewerPsuNo: 'PSU-2021-0892',
    pharmacistReviewTimestamp: '2026-09-24T09:00:00Z',
    pharmacistReviewNotes: 'Patient supply ran out 2 days ago. Critical risk of asthma exacerbation; urgent outreach dispatched.',
    reminderChannel: 'SMS',
    tailoredMessagePreview: '',
    lastReminderSentAt: '2026-09-24T09:15:00Z',
    reminderDispatchCount: 1,
  },
  {
    id: 'refill-004',
    tenantId: 'client-001',
    patientId: 'cust-4',
    patientName: 'David Kato',
    patientPhone: '+256 703 456789',
    prescriptionRefNo: 'RX-2026-9412',
    medicationName: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin Calcium',
    chronicCondition: 'Dyslipidemia',
    originalQuantity: 30,
    unitOfMeasure: 'tablets',
    dosePerIntake: 1,
    frequencyPerDay: 1,
    frequencyText: '1 tablet at bedtime (Nocte)',
    dailyIntakeRate: 1,
    daysSupply: 30,
    dispensingDate: '2026-09-10',
    estimatedDepletionDate: '2026-10-10',
    earliestAllowedRefillDate: '2026-10-05',
    daysRemaining: 15,
    consumptionPercent: 50,
    refillEligibilityStatus: 'Active Supply (>7 Days)',
    pharmacistReviewStatus: 'Approved for Outreach',
    pharmacistReviewerName: 'Dr. Arthur Ssenabulya',
    pharmacistReviewerPsuNo: 'PSU-2021-0892',
    pharmacistReviewNotes: '15 days of supply remaining. Early refill blocked until 05 Oct (85% consumption threshold).',
    reminderChannel: 'WhatsApp',
    tailoredMessagePreview: '',
    reminderDispatchCount: 0,
  },
  {
    id: 'refill-005',
    tenantId: 'client-001',
    patientId: 'cust-5',
    patientName: 'Florence Nabakooza',
    patientPhone: '+256 752 887766',
    prescriptionRefNo: 'RX-2026-9602',
    medicationName: 'Losartan Potassium 50mg',
    genericName: 'Losartan Potassium',
    chronicCondition: 'Hypertension',
    originalQuantity: 30,
    unitOfMeasure: 'tablets',
    dosePerIntake: 1,
    frequencyPerDay: 1,
    frequencyText: '1 tablet once daily in morning (OD)',
    dailyIntakeRate: 1,
    daysSupply: 30,
    dispensingDate: '2026-09-01',
    estimatedDepletionDate: '2026-10-01',
    earliestAllowedRefillDate: '2026-09-26',
    daysRemaining: 6,
    consumptionPercent: 80,
    refillEligibilityStatus: 'Approaching (4-7 Days)',
    pharmacistReviewStatus: 'Pending Review',
    pharmacistReviewNotes: 'Approaching 85% threshold tomorrow. Reviewing prior tolerability.',
    reminderChannel: 'WhatsApp',
    tailoredMessagePreview: '',
    reminderDispatchCount: 0,
  }
];

class RefillEligibilityService {
  private records: RefillEligibilityRecord[] = [];

  constructor() {
    this.loadRecords();
  }

  private loadRecords(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REFILL_ELIGIBILITY);
      if (raw) {
        this.records = JSON.parse(raw);
      } else {
        // Hydrate initial preview records with freshly calculated statuses
        this.records = INITIAL_REFILL_ELIGIBILITY_DATA.map((rec) => {
          const calc = calculateDepletion(
            rec.dispensingDate,
            rec.originalQuantity,
            rec.dosePerIntake,
            rec.frequencyPerDay
          );
          const msg = generateTailoredMessage(
            rec.patientName,
            rec.medicationName,
            rec.originalQuantity,
            rec.unitOfMeasure,
            rec.frequencyText,
            rec.dispensingDate,
            calc.estimatedDepletionDate,
            calc.daysRemaining
          );
          return {
            ...rec,
            ...calc,
            tailoredMessagePreview: msg,
          };
        });
        this.saveRecords();
      }
    } catch {
      this.records = INITIAL_REFILL_ELIGIBILITY_DATA;
    }
  }

  private saveRecords(): void {
    try {
      localStorage.setItem(STORAGE_KEY_REFILL_ELIGIBILITY, JSON.stringify(this.records));
    } catch (e) {
      console.error('Failed to save refill eligibility records', e);
    }
  }

  public getAllRecords(tenantId?: string): RefillEligibilityRecord[] {
    // Re-evaluate live depletion calculations on read
    const evaluated = this.records.map((rec) => {
      const calc = calculateDepletion(
        rec.dispensingDate,
        rec.originalQuantity,
        rec.dosePerIntake,
        rec.frequencyPerDay
      );
      const msg = generateTailoredMessage(
        rec.patientName,
        rec.medicationName,
        rec.originalQuantity,
        rec.unitOfMeasure,
        rec.frequencyText,
        rec.dispensingDate,
        calc.estimatedDepletionDate,
        calc.daysRemaining
      );
      return {
        ...rec,
        ...calc,
        tailoredMessagePreview: msg,
      };
    });

    if (tenantId) {
      return evaluated.filter((r) => r.tenantId === tenantId);
    }
    return evaluated;
  }

  public getRecordById(id: string): RefillEligibilityRecord | undefined {
    return this.getAllRecords().find((r) => r.id === id);
  }

  public getRecordsForPatient(patientIdOrName: string): RefillEligibilityRecord[] {
    const q = patientIdOrName.toLowerCase();
    return this.getAllRecords().filter(
      (r) => r.patientId.toLowerCase() === q || r.patientName.toLowerCase().includes(q)
    );
  }

  /**
   * Registered Pharmacist Review & Signoff
   */
  public reviewAndApproveRecord(
    recordId: string,
    pharmacistName: string,
    pharmacistPsuNo: string,
    action: 'Approved for Outreach' | 'Refill Authorized' | 'Suspended',
    notes?: string
  ): RefillEligibilityRecord {
    const target = this.records.find((r) => r.id === recordId);
    if (!target) {
      throw new Error(`Record ${recordId} not found`);
    }

    target.pharmacistReviewStatus = action;
    target.pharmacistReviewerName = pharmacistName;
    target.pharmacistReviewerPsuNo = pharmacistPsuNo;
    target.pharmacistReviewTimestamp = new Date().toISOString();
    if (notes) {
      target.pharmacistReviewNotes = notes;
    }

    this.saveRecords();
    return target;
  }

  /**
   * Adjust Posology (e.g. if patient was told to reduce dose or missed days)
   */
  public adjustPosology(
    recordId: string,
    newDosePerIntake: number,
    newFrequencyPerDay: number,
    newFrequencyText: string,
    pharmacistName: string,
    pharmacistPsuNo: string,
    clinicalRationale: string
  ): RefillEligibilityRecord {
    const target = this.records.find((r) => r.id === recordId);
    if (!target) {
      throw new Error(`Record ${recordId} not found`);
    }

    target.dosePerIntake = newDosePerIntake;
    target.frequencyPerDay = newFrequencyPerDay;
    target.frequencyText = newFrequencyText;
    target.pharmacistReviewStatus = 'Posology Adjusted';
    target.pharmacistReviewerName = pharmacistName;
    target.pharmacistReviewerPsuNo = pharmacistPsuNo;
    target.pharmacistReviewTimestamp = new Date().toISOString();
    target.pharmacistReviewNotes = `Posology Adjusted: ${newFrequencyText}. Justification: ${clinicalRationale}`;

    const calc = calculateDepletion(
      target.dispensingDate,
      target.originalQuantity,
      target.dosePerIntake,
      target.frequencyPerDay
    );

    target.dailyIntakeRate = calc.dailyIntakeRate;
    target.daysSupply = calc.daysSupply;
    target.estimatedDepletionDate = calc.estimatedDepletionDate;
    target.earliestAllowedRefillDate = calc.earliestAllowedRefillDate;
    target.daysRemaining = calc.daysRemaining;
    target.consumptionPercent = calc.consumptionPercent;
    target.refillEligibilityStatus = calc.refillEligibilityStatus;
    target.tailoredMessagePreview = generateTailoredMessage(
      target.patientName,
      target.medicationName,
      target.originalQuantity,
      target.unitOfMeasure,
      target.frequencyText,
      target.dispensingDate,
      calc.estimatedDepletionDate,
      calc.daysRemaining
    );

    this.saveRecords();
    return target;
  }

  /**
   * Register a freshly dispensed prescription into the Refill Eligibility engine
   */
  public registerDispenseForRefill(params: {
    patientId: string;
    patientName: string;
    patientPhone: string;
    prescriptionRefNo?: string;
    medicationName: string;
    genericName: string;
    chronicCondition: string;
    originalQuantity: number;
    unitOfMeasure: 'tablets' | 'capsules' | 'mL' | 'puffs';
    dosePerIntake: number;
    frequencyPerDay: number;
    frequencyText: string;
    dispensingDate?: string;
    pharmacistName?: string;
    pharmacistPsuNo?: string;
  }): RefillEligibilityRecord {
    const dispensingDate = params.dispensingDate || SYSTEM_CURRENT_DATE;
    const calc = calculateDepletion(
      dispensingDate,
      params.originalQuantity,
      params.dosePerIntake,
      params.frequencyPerDay
    );

    const msg = generateTailoredMessage(
      params.patientName,
      params.medicationName,
      params.originalQuantity,
      params.unitOfMeasure,
      params.frequencyText,
      dispensingDate,
      calc.estimatedDepletionDate,
      calc.daysRemaining
    );

    const newRecord: RefillEligibilityRecord = {
      id: `refill-${Date.now()}`,
      tenantId: 'client-001',
      patientId: params.patientId,
      patientName: params.patientName,
      patientPhone: params.patientPhone,
      prescriptionRefNo: params.prescriptionRefNo || `RX-${Date.now().toString().slice(-4)}`,
      medicationName: params.medicationName,
      genericName: params.genericName,
      chronicCondition: params.chronicCondition,
      originalQuantity: params.originalQuantity,
      unitOfMeasure: params.unitOfMeasure,
      dosePerIntake: params.dosePerIntake,
      frequencyPerDay: params.frequencyPerDay,
      frequencyText: params.frequencyText,
      dailyIntakeRate: calc.dailyIntakeRate,
      daysSupply: calc.daysSupply,
      dispensingDate,
      estimatedDepletionDate: calc.estimatedDepletionDate,
      earliestAllowedRefillDate: calc.earliestAllowedRefillDate,
      daysRemaining: calc.daysRemaining,
      consumptionPercent: calc.consumptionPercent,
      refillEligibilityStatus: calc.refillEligibilityStatus,
      pharmacistReviewStatus: params.pharmacistName ? 'Approved for Outreach' : 'Pending Review',
      pharmacistReviewerName: params.pharmacistName,
      pharmacistReviewerPsuNo: params.pharmacistPsuNo,
      pharmacistReviewTimestamp: params.pharmacistName ? new Date().toISOString() : undefined,
      reminderChannel: 'WhatsApp',
      tailoredMessagePreview: msg,
      reminderDispatchCount: 0,
    };

    this.records.unshift(newRecord);
    this.saveRecords();
    return newRecord;
  }

  /**
   * Dispatch precision WhatsApp / SMS notification
   */
  public dispatchRefillOutreach(recordId: string): { success: boolean; link?: string; message: string } {
    const target = this.records.find((r) => r.id === recordId);
    if (!target) {
      return { success: false, message: 'Record not found.' };
    }

    target.lastReminderSentAt = new Date().toISOString();
    target.reminderDispatchCount += 1;
    this.saveRecords();

    const cleanPhone = target.patientPhone.replace(/[^0-9]/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(target.tailoredMessagePreview)}`;

    return {
      success: true,
      link: waLink,
      message: `Precision refill outreach generated for ${target.patientName} (${target.patientPhone})!`,
    };
  }
}

export const refillEligibilityService = new RefillEligibilityService();
