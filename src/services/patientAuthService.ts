/**
 * patientAuthService.ts — Patient Identity, Authentication & Profile Management
 * Clean Architecture: Application / Patient Domain Layer
 *
 * Provides dedicated patient authentication, registration with allergy & chronic
 * condition tracking, session persistence, and pre-seeded demo patient accounts.
 */

export interface PatientProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nin?: string;
  district: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'Female' | 'Male' | 'Other';
  allergies: string[];
  chronicConditions: string[];
  registeredAt: string;
  avatarUrl?: string;
}

const PATIENT_SESSION_STORAGE_KEY = 'zenithrx_patient_session_v2';
const PATIENT_ACCOUNTS_STORAGE_KEY = 'zenithrx_patient_accounts_v2';

// ─── Pre-seeded Demo Patients ──────────────────────────────────────────────────
export const DEMO_PATIENTS: PatientProfile[] = [
  {
    id: 'PAT-UG-001',
    fullName: 'Grace Nakato',
    phone: '+256 701 234567',
    email: 'grace.nakato@gmail.com',
    nin: 'CM92014819201K',
    district: 'Kampala (Kololo)',
    address: 'Plot 14, Prince Charles Drive, Kololo',
    dateOfBirth: '1992-04-12',
    gender: 'Female',
    allergies: ['Penicillin (Mild hives / rash)', 'Sulfa Drugs'],
    chronicConditions: ['Hypertension'],
    registeredAt: '2026-01-15',
  },
  {
    id: 'PAT-UG-002',
    fullName: 'David Kato',
    phone: '+256 772 987654',
    email: 'david.kato@outlook.com',
    nin: 'CM88019283716M',
    district: 'Wakiso (Entebbe Town)',
    address: 'Airport Road, Entebbe',
    dateOfBirth: '1988-11-03',
    gender: 'Male',
    allergies: ['Aspirin (Bronchospasm / Wheezing)'],
    chronicConditions: ['Asthma'],
    registeredAt: '2026-02-20',
  },
  {
    id: 'PAT-UG-003',
    fullName: 'Sarah Namubiru',
    phone: '+256 755 123890',
    email: 'sarah.namu@gmail.com',
    nin: 'CF95029381726P',
    district: 'Jinja (Main Street)',
    address: 'Plot 8, Bell Avenue, Jinja',
    dateOfBirth: '1995-07-28',
    gender: 'Female',
    allergies: [],
    chronicConditions: ['Type 2 Diabetes'],
    registeredAt: '2026-03-05',
  },
  {
    id: 'PAT-UG-004',
    fullName: 'Brian Mukasa',
    phone: '+256 788 456123',
    email: 'brian.mukasa@gmail.com',
    nin: 'CM90048192837L',
    district: 'Kampala (Ntinda)',
    address: 'Semawata Road, Ntinda',
    dateOfBirth: '1990-09-18',
    gender: 'Male',
    allergies: ['NSAIDs / Ibuprofen'],
    chronicConditions: ['Hypertension', 'Dyslipidemia'],
    registeredAt: '2026-04-10',
  },
];

// Initialize local patient accounts storage if empty
function initializePatientAccounts(): PatientProfile[] {
  try {
    const raw = localStorage.getItem(PATIENT_ACCOUNTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse patient accounts:', e);
  }
  localStorage.setItem(PATIENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(DEMO_PATIENTS));
  return DEMO_PATIENTS;
}

// ─── Patient Auth Service ─────────────────────────────────────────────────────

type AuthChangeCallback = (patient: PatientProfile | null) => void;
const authListeners: Set<AuthChangeCallback> = new Set();

export const patientAuthService = {
  /**
   * Get the currently logged-in patient, or null if unauthenticated.
   */
  getCurrentPatient(): PatientProfile | null {
    try {
      const saved = localStorage.getItem(PATIENT_SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load patient session:', e);
    }
    return null;
  },

  /**
   * Log in with phone or email and password.
   */
  login(identifier: string, _password?: string): { success: boolean; error?: string; patient?: PatientProfile } {
    const cleanId = identifier.trim().toLowerCase();
    const accounts = initializePatientAccounts();

    const matched = accounts.find(
      (acc) =>
        acc.phone.toLowerCase().includes(cleanId) ||
        acc.email.toLowerCase() === cleanId ||
        acc.fullName.toLowerCase() === cleanId
    );

    if (matched) {
      localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(matched));
      authListeners.forEach((cb) => cb(matched));
      return { success: true, patient: matched };
    }

    // If identifier doesn't exist, create a dynamic guest patient session
    const newGuest: PatientProfile = {
      id: `PAT-UG-${Date.now().toString().slice(-4)}`,
      fullName: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      phone: identifier.startsWith('+') || /^\d+$/.test(identifier) ? identifier : '+256 700 000000',
      email: identifier.includes('@') ? identifier : `${identifier.replace(/\s+/g, '').toLowerCase()}@patient.zenithrx.ug`,
      district: 'Kampala (Central)',
      allergies: [],
      chronicConditions: [],
      registeredAt: new Date().toISOString().split('T')[0],
    };

    const updatedAccounts = [...accounts, newGuest];
    localStorage.setItem(PATIENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(newGuest));
    authListeners.forEach((cb) => cb(newGuest));

    return { success: true, patient: newGuest };
  },

  /**
   * Quick login using a pre-configured demo patient account.
   */
  loginAsDemo(patientId: string): { success: boolean; patient?: PatientProfile } {
    const accounts = initializePatientAccounts();
    const patient = accounts.find((p) => p.id === patientId) || DEMO_PATIENTS.find((p) => p.id === patientId);
    if (patient) {
      localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(patient));
      authListeners.forEach((cb) => cb(patient));
      return { success: true, patient };
    }
    return { success: false };
  },

  /**
   * Register a new patient account with full medical baseline profile.
   */
  register(data: {
    fullName: string;
    phone: string;
    email: string;
    district: string;
    address?: string;
    nin?: string;
    gender?: 'Female' | 'Male' | 'Other';
    dateOfBirth?: string;
    allergies?: string[];
    chronicConditions?: string[];
  }): { success: boolean; error?: string; patient?: PatientProfile } {
    if (!data.fullName || !data.phone) {
      return { success: false, error: 'Full name and phone number are required.' };
    }

    const accounts = initializePatientAccounts();
    const existing = accounts.find(
      (a) => a.phone === data.phone || (data.email && a.email.toLowerCase() === data.email.toLowerCase())
    );

    if (existing) {
      // Log them in if already registered
      localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(existing));
      authListeners.forEach((cb) => cb(existing));
      return { success: true, patient: existing };
    }

    const newPatient: PatientProfile = {
      id: `PAT-UG-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || `${data.phone.replace(/[^0-9]/g, '')}@patient.zenithrx.ug`,
      nin: data.nin || undefined,
      district: data.district || 'Kampala',
      address: data.address || '',
      gender: data.gender || 'Female',
      dateOfBirth: data.dateOfBirth || '1995-01-01',
      allergies: data.allergies || [],
      chronicConditions: data.chronicConditions || [],
      registeredAt: new Date().toISOString().split('T')[0],
    };

    const updatedAccounts = [newPatient, ...accounts];
    localStorage.setItem(PATIENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(newPatient));
    authListeners.forEach((cb) => cb(newPatient));

    return { success: true, patient: newPatient };
  },

  /**
   * Update the active patient's profile details.
   */
  updateProfile(updates: Partial<PatientProfile>): PatientProfile | null {
    const current = this.getCurrentPatient();
    if (!current) return null;

    const updated: PatientProfile = { ...current, ...updates };
    localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(updated));

    const accounts = initializePatientAccounts().map((a) => (a.id === updated.id ? updated : a));
    localStorage.setItem(PATIENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));

    authListeners.forEach((cb) => cb(updated));
    return updated;
  },

  /**
   * Log out active patient.
   */
  logout(): void {
    localStorage.removeItem(PATIENT_SESSION_STORAGE_KEY);
    authListeners.forEach((cb) => cb(null));
  },

  /**
   * Subscribe to authentication state changes.
   */
  subscribe(callback: AuthChangeCallback): () => void {
    authListeners.add(callback);
    return () => {
      authListeners.delete(callback);
    };
  },

  /**
   * Get all demo patients for quick selection.
   */
  getDemoPatients(): PatientProfile[] {
    return DEMO_PATIENTS;
  },
};
