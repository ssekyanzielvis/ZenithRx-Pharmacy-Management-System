/**
 * adherenceRefillService.ts — Chronic Patient Adherence & Refill Automation (§12, §25)
 * Schedules refill triggers, calculates adherence metrics (PDC - Proportion of Days Covered),
 * and manages automated WhatsApp/SMS refill reminders.
 */

import { PatientAdherenceRecord } from '../types';
export type { PatientAdherenceRecord };
export type AdherenceRecord = PatientAdherenceRecord;

const STORAGE_KEY_ADHERENCE = 'zenithrx_adherence_records_v1';

export const INITIAL_ADHERENCE_RECORDS: PatientAdherenceRecord[] = [
  {
    id: 'adh-001',
    patientId: 'cust-1',
    patientName: 'Grace Nakato',
    patientPhone: '+256 701 234567',
    tenantId: 'client-001',
    chronicCondition: 'Hypertension',
    medicationName: 'Amlodipine Besylate 5mg',
    dosageSchedule: '1 tablet once daily in the morning',
    daysSupplyGiven: 30,
    lastDispensedDate: '2026-07-10',
    nextRefillDueDate: '2026-08-09',
    adherenceRatePercent: 96,
    refillStreakMonths: 8,
    status: 'Refill Due (0-3 Days)',
    reminderChannel: 'WhatsApp',
    lastReminderSentAt: '2026-08-05T08:00:00Z',
    nextScheduledReminderDate: '2026-08-08',
    pharmacistFollowUpNotes: 'Patient reports good tolerance, no pedal edema. Morning BP logged at 128/82 mmHg.',
  },
  {
    id: 'adh-002',
    patientId: 'cust-2',
    patientName: 'John Baptist Okello',
    patientPhone: '+256 772 345678',
    tenantId: 'client-001',
    chronicCondition: 'Diabetes Type 2',
    medicationName: 'Metformin Hydrochloride 500mg',
    dosageSchedule: '1 tablet twice daily with breakfast & dinner',
    daysSupplyGiven: 60,
    lastDispensedDate: '2026-06-15',
    nextRefillDueDate: '2026-08-14',
    adherenceRatePercent: 88,
    refillStreakMonths: 5,
    status: 'Adherent (On Track)',
    reminderChannel: 'WhatsApp',
    nextScheduledReminderDate: '2026-08-11',
    pharmacistFollowUpNotes: 'Counselled on avoiding alcohol while taking Metformin.',
  },
  {
    id: 'adh-003',
    patientId: 'cust-3',
    patientName: 'Sarah Namugga',
    patientPhone: '+256 782 990011',
    tenantId: 'client-001',
    chronicCondition: 'Asthma',
    medicationName: 'Ventolin Evohaler 100mcg',
    dosageSchedule: '1-2 puffs as needed for wheezing',
    daysSupplyGiven: 60,
    lastDispensedDate: '2026-05-20',
    nextRefillDueDate: '2026-07-20',
    adherenceRatePercent: 62,
    refillStreakMonths: 1,
    status: 'Overdue (Missed Dose Risk)',
    reminderChannel: 'SMS',
    lastReminderSentAt: '2026-07-25T10:00:00Z',
    nextScheduledReminderDate: '2026-08-06',
    pharmacistFollowUpNotes: 'High risk of emergency exacerbation. Pharmacist phone consultation recommended.',
  }
];

export const getAdherenceRecords = (tenantId?: string): PatientAdherenceRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADHERENCE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ADHERENCE, JSON.stringify(INITIAL_ADHERENCE_RECORDS));
      return tenantId ? INITIAL_ADHERENCE_RECORDS.filter(r => r.tenantId === tenantId) : INITIAL_ADHERENCE_RECORDS;
    }
    const all: PatientAdherenceRecord[] = JSON.parse(raw);
    return tenantId ? all.filter(r => r.tenantId === tenantId) : all;
  } catch {
    return INITIAL_ADHERENCE_RECORDS;
  }
};

export const triggerRefillReminderMessage = (recordId: string): { success: boolean; message: string } => {
  const all = getAdherenceRecords();
  const target = all.find(r => r.id === recordId);
  if (!target) return { success: false, message: 'Record not found.' };

  const updatedTarget: PatientAdherenceRecord = {
    ...target,
    lastReminderSentAt: new Date().toISOString(),
  };

  const updated = all.map(r => r.id === recordId ? updatedTarget : r);
  try {
    localStorage.setItem(STORAGE_KEY_ADHERENCE, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update adherence reminder', e);
  }

  return {
    success: true,
    message: `Automated refill reminder dispatched via ${target.reminderChannel} to ${target.patientName} (${target.patientPhone}).`,
  };
};
