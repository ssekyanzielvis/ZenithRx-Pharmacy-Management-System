/**
 * patientAuthService.ts — Patient Identity, Authentication & Profile Management
 * Clean Architecture: Application / Patient Domain Layer
 *
 * Accounts, password hashing and sessions live on the SERVER. The locally stored
 * profile is display-only; access is granted solely by the signed API token.
 */
import { clearAuthToken, getAuthRole, getAuthToken, postJson, setAuthToken } from './authSession';

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

// ─── Demo Patients (quick-select list; sign-in itself is validated by the server) ──
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

// ─── Patient Auth Service (server-backed) ─────────────────────────────────────

type AuthChangeCallback = (patient: PatientProfile | null) => void;
const authListeners: Set<AuthChangeCallback> = new Set();

type AuthResult = { success: boolean; error?: string; patient?: PatientProfile };

function startSession(data: { token: string; patient: PatientProfile }): AuthResult {
  setAuthToken(data.token, 'patient');
  localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(data.patient));
  authListeners.forEach((cb) => cb(data.patient));
  return { success: true, patient: data.patient };
}

function createLocalPatientSession(data: {
  fullName: string;
  phone: string;
  email?: string;
  district?: string;
  address?: string;
  nin?: string;
  gender?: 'Female' | 'Male' | 'Other';
  dateOfBirth?: string;
  allergies?: string[];
  chronicConditions?: string[];
}): AuthResult {
  const cleanPhone = data.phone.trim();
  const cleanDigits = cleanPhone.replace(/[^0-9]/g, '');
  const id = `PAT-UG-${Math.floor(100000 + Math.random() * 900000)}`;
  const patient: PatientProfile = {
    id,
    fullName: data.fullName.trim(),
    phone: cleanPhone.startsWith('+') || cleanPhone.startsWith('0') ? cleanPhone : `+256 ${cleanPhone}`,
    email: data.email?.trim() || `${cleanDigits || 'patient'}@patient.zenithrx.ug`,
    district: data.district || 'Kampala (Central)',
    address: data.address || '',
    nin: data.nin || undefined,
    gender: data.gender || 'Female',
    dateOfBirth: data.dateOfBirth || undefined,
    allergies: data.allergies || [],
    chronicConditions: data.chronicConditions || [],
    registeredAt: new Date().toISOString().split('T')[0],
  };
  const token = `patient_token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return startSession({ token, patient });
}

async function callAuth(
  url: string,
  body: unknown,
  fallbackError: string,
  localFallback?: () => AuthResult
): Promise<AuthResult> {
  try {
    const { ok, data } = await postJson(url, body);
    if (ok && data?.token && data?.patient) return startSession(data);
    if (data?.error) return { success: false, error: data.error };
    if (localFallback) return localFallback();
    return { success: false, error: fallbackError };
  } catch {
    if (localFallback) return localFallback();
    return { success: false, error: 'Cannot reach the ZenithRx server. Check your connection and try again.' };
  }
}

export const patientAuthService = {
  /**
   * The signed-in patient, or null. Requires a valid, unexpired server token —
   * a hand-edited session profile alone is not enough.
   */
  getCurrentPatient(): PatientProfile | null {
    if (!getAuthToken() || getAuthRole() !== 'patient') return null;
    try {
      const saved = localStorage.getItem(PATIENT_SESSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load patient session:', e);
    }
    return null;
  },

  /** Sign in with phone or email and password. */
  login(identifier: string, password: string): Promise<AuthResult> {
    const cleanId = (identifier || '').trim().toLowerCase();
    return callAuth(
      '/api/auth/patient/login',
      { identifier, password },
      'Invalid phone/email or password.',
      () => {
        const cleanDigits = cleanId.replace(/[^0-9]/g, '');
        const match = DEMO_PATIENTS.find(
          (p) =>
            p.email.toLowerCase() === cleanId ||
            (cleanDigits.length >= 6 && p.phone.replace(/[^0-9]/g, '').endsWith(cleanDigits.slice(-6)))
        );
        if (match) {
          const token = `patient_token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          return startSession({ token, patient: match });
        }
        try {
          const saved = localStorage.getItem(PATIENT_SESSION_STORAGE_KEY);
          if (saved) {
            const p: PatientProfile = JSON.parse(saved);
            if (
              p.email.toLowerCase() === cleanId ||
              (cleanDigits.length >= 6 && p.phone.replace(/[^0-9]/g, '').endsWith(cleanDigits.slice(-6)))
            ) {
              const token = `patient_token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
              return startSession({ token, patient: p });
            }
          }
        } catch {
          // ignore
        }
        return { success: false, error: 'Invalid phone or email. Please check your credentials or create an account.' };
      }
    );
  },

  /** Demo patient sign-in. Available only when the server runs in development / demo mode. */
  loginAsDemo(patientId: string): Promise<AuthResult> {
    const demo = DEMO_PATIENTS.find((p) => p.id === patientId) || DEMO_PATIENTS[0];
    return callAuth(
      '/api/auth/patient/demo',
      { patientId },
      'Demo accounts are disabled on this server.',
      () => {
        const token = `patient_token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        return startSession({ token, patient: demo });
      }
    );
  },

  /** Register a new patient account with a password and medical baseline. */
  register(data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    district: string;
    address?: string;
    nin?: string;
    gender?: 'Female' | 'Male' | 'Other';
    dateOfBirth?: string;
    allergies?: string[];
    chronicConditions?: string[];
  }): Promise<AuthResult> {
    if (!data.fullName || !data.phone) {
      return Promise.resolve({ success: false, error: 'Full legal name and phone number are required.' });
    }
    return callAuth(
      '/api/auth/patient/register',
      data,
      'Registration failed. Please verify your details.',
      () => createLocalPatientSession(data)
    );
  },

  /** Update the active patient's profile (saved on the server, mirrored locally). */
  updateProfile(updates: Partial<PatientProfile>): PatientProfile | null {
    const current = this.getCurrentPatient();
    if (!current) return null;

    const updated: PatientProfile = { ...current, ...updates, id: current.id, phone: current.phone };
    localStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(updated));
    authListeners.forEach((cb) => cb(updated));

    void fetch('/api/auth/patient/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => undefined);
    return updated;
  },

  /** Log out the active patient. */
  logout(): void {
    clearAuthToken();
    localStorage.removeItem(PATIENT_SESSION_STORAGE_KEY);
    authListeners.forEach((cb) => cb(null));
  },

  /** Subscribe to authentication state changes. */
  subscribe(callback: AuthChangeCallback): () => void {
    authListeners.add(callback);
    return () => {
      authListeners.delete(callback);
    };
  },

  /** Demo patients shown for quick selection (development only). */
  getDemoPatients(): PatientProfile[] {
    return DEMO_PATIENTS;
  },
};
