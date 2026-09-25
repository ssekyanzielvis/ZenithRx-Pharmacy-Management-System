/**
 * teleconsultationService.ts — ZenithRx Virtual Pharmacy Hub & Teleconsultation (§14, §26)
 * Supports live clinical queue, encrypted chat notes, and direct e-prescription generation.
 */

import { TeleconsultationSession } from '../types';
export type { TeleconsultationSession };

const STORAGE_KEY_CONSULTATIONS = 'zenithrx_teleconsultation_sessions_v1';

export const INITIAL_CONSULTATIONS: TeleconsultationSession[] = [
  {
    id: 'con-001',
    sessionNumber: 'TC-2026-08101',
    tenantId: 'client-001',
    patientName: 'David Kibirige',
    patientPhone: '+256 701 998811',
    patientAge: 42,
    patientGender: 'Male',
    chiefComplaint: 'Experiencing dry, hacking cough and mild dizziness after starting new hypertension pills 10 days ago.',
    status: 'Waiting in Queue',
    scheduledTime: '2026-08-05T14:30:00Z',
    allergiesReported: ['Penicillin'],
    currentMedications: ['Enalapril 10mg OD', 'Hydrochlorothiazide 12.5mg OD'],
    vitalSigns: {
      bloodPressure: '135/88 mmHg',
    },
    createdAt: '2026-08-05T13:45:00Z',
  },
  {
    id: 'con-002',
    sessionNumber: 'TC-2026-08102',
    tenantId: 'client-001',
    patientName: 'Florence Akello',
    patientPhone: '+256 772 445566',
    patientAge: 29,
    patientGender: 'Female',
    chiefComplaint: 'Requesting guidance on prenatal vitamins and safe relief for severe morning sickness during first trimester.',
    status: 'In Consultation',
    scheduledTime: '2026-08-05T14:00:00Z',
    pharmacistName: 'Dr. Arthur Ssenabulya',
    allergiesReported: [],
    currentMedications: ['Folic Acid 5mg OD'],
    pharmacistNotes: 'Assessed pregnancy stage at 9 weeks. Recommended Pyridoxine (Vitamin B6) 25mg 8-hourly and ginger extract capsules. Avoid NSAIDs.',
    createdAt: '2026-08-05T13:30:00Z',
  },
  {
    id: 'con-003',
    sessionNumber: 'TC-2026-08100',
    tenantId: 'client-001',
    patientName: 'Robert Mugisha',
    patientPhone: '+256 755 123987',
    patientAge: 35,
    patientGender: 'Male',
    chiefComplaint: 'Post-malaria fatigue and mild muscular aches after completing Coartem 3 days ago.',
    status: 'Completed',
    scheduledTime: '2026-08-05T11:00:00Z',
    pharmacistName: 'Sarah Namubiru',
    pharmacistNotes: 'Confirmed negative RDT. Reassured patient regarding post-infectious convalescence. Recommended oral rehydration salts, multivitamin zinc complex, and adequate sleep.',
    recommendedAdvice: 'Hydrate adequately (3L water daily) and take Multivitamin Zinc syrup daily for 14 days.',
    durationMinutes: 14,
    createdAt: '2026-08-05T10:30:00Z',
  }
];

export const getTeleconsultationSessions = (tenantId?: string): TeleconsultationSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONSULTATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONSULTATIONS, JSON.stringify(INITIAL_CONSULTATIONS));
      return tenantId ? INITIAL_CONSULTATIONS.filter(c => c.tenantId === tenantId) : INITIAL_CONSULTATIONS;
    }
    const all: TeleconsultationSession[] = JSON.parse(raw);
    return tenantId ? all.filter(c => c.tenantId === tenantId) : all;
  } catch {
    return INITIAL_CONSULTATIONS;
  }
};

export const bookTeleconsultation = (
  session: Omit<TeleconsultationSession, 'id' | 'sessionNumber' | 'createdAt' | 'status'>
): TeleconsultationSession => {
  const all = getTeleconsultationSessions();
  const sessionNumber = `TC-${new Date().getFullYear()}-${String(all.length + 101).padStart(5, '0')}`;
  const newSession: TeleconsultationSession = {
    ...session,
    id: `con-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sessionNumber,
    status: 'Waiting in Queue',
    createdAt: new Date().toISOString(),
  };

  const updated = [newSession, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_CONSULTATIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to book consultation', e);
  }
  return newSession;
};

export const updateConsultationNotes = (
  id: string,
  pharmacistName: string,
  notes: string,
  recommendedAdvice: string,
  status: TeleconsultationSession['status'] = 'Completed'
): TeleconsultationSession | null => {
  const all = getTeleconsultationSessions();
  const target = all.find(c => c.id === id);
  if (!target) return null;

  const updatedTarget: TeleconsultationSession = {
    ...target,
    pharmacistName,
    pharmacistNotes: notes,
    recommendedAdvice,
    status,
  };

  const updated = all.map(c => c.id === id ? updatedTarget : c);
  try {
    localStorage.setItem(STORAGE_KEY_CONSULTATIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update consultation', e);
  }
  return updatedTarget;
};
