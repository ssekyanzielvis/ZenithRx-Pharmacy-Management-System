/**
 * aiService.ts — ZenithRx AI Service Adapter
 * Wraps all Gemini AI API calls with typed responses and graceful fallbacks.
 * Clean Architecture: Infrastructure / Service Layer
 */

export interface ParsedPrescriptionMedication {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  substitutionAllowed?: boolean;
}

export interface ParsedPrescription {
  patientName: string;
  patientAge?: string;
  patientGender?: 'Male' | 'Female';
  patientPhone?: string;
  doctorName?: string;
  doctorLicence?: string;
  hospitalName?: string;
  diagnosis?: string;
  medications: ParsedPrescriptionMedication[];
  clinicalNotes?: string;
  warnings?: string[];
}

export interface DrugInteractionAnalysis {
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  interactions: Array<{
    severity: string;
    drugsInvolved: string[];
    description: string;
    actionRequired: string;
  }>;
  allergyAlerts: string[];
  recommendations: string[];
}

export interface ParsePrescriptionInput {
  textContent?: string;
  imageBase64?: string;
}

/** Parse prescription from text notes or scanned image using Gemini AI */
export async function parsePrescription(
  input: string | ParsePrescriptionInput
): Promise<{ success: boolean; data?: ParsedPrescription; error?: string; fallback?: boolean }> {
  try {
    const payload = typeof input === 'string' ? { textContent: input } : input;
    const res = await fetch('/api/ai/parse-prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 503) {
      // No API key — graceful fallback
      return { success: false, fallback: true, error: 'AI service unavailable. Please enter prescription details manually.' };
    }

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json.error ?? 'Failed to parse prescription.' };
    }

    return { success: true, data: json.data as ParsedPrescription };
  } catch (err) {
    console.error('[aiService] parsePrescription error:', err);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

/** Generate patient counseling leaflet using Gemini AI */
export async function getCounseling(
  drugName: string,
  patientName: string,
  dosage: string
): Promise<{ success: boolean; counselingText?: string; error?: string }> {
  try {
    const res = await fetch('/api/ai/counseling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drugName, patientName, dosage }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json.error ?? 'Failed to generate counseling.' };
    }

    return { success: true, counselingText: json.counselingText };
  } catch (err) {
    console.error('[aiService] getCounseling error:', err);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

/** Check drug interactions and allergy risks */
export async function checkDrugInteractions(
  medications: string[],
  patientAllergies: string,
  conditions: string
): Promise<{ success: boolean; analysis?: DrugInteractionAnalysis; error?: string }> {
  try {
    const res = await fetch('/api/ai/drug-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medications, patientAllergies, conditions }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json.error ?? 'Failed to check interactions.' };
    }

    return { success: true, analysis: json.analysis as DrugInteractionAnalysis };
  } catch (err) {
    console.error('[aiService] checkDrugInteractions error:', err);
    return { success: false, error: 'Network error.' };
  }
}
