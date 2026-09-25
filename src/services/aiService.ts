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

export interface PatientCopilotContext {
  patientId?: string;
  name?: string;
  age?: number;
  allergies?: string[];
  activeMedications?: string[];
  chronicConditions?: string[];
}

export interface PatientCopilotResponse {
  triageLevel: 'ROUTINE' | 'PHARMACIST_CONSULT_RECOMMENDED' | 'URGENT_EMERGENCY';
  reply: string;
  immediateAction: string;
  emergencyAlert: boolean;
  suggestedQuickReplies: string[];
}

/** Quantum RxAI Patient Copilot — interactive patient Q&A, dosage guidance, missed dose protocol, and symptom triage */
export async function askPatientCopilot(
  message: string,
  history: Array<{ sender: 'patient' | 'assistant'; content: string }> = [],
  patientContext: PatientCopilotContext = {},
  conversationId?: string
): Promise<{ success: boolean; data?: PatientCopilotResponse; error?: string; fallback?: boolean }> {
  try {
    const res = await fetch('/api/ai/patient-copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, patientContext, conversationId }),
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 503 && json.fallback) {
        return { success: true, fallback: true, data: json };
      }
      return { success: false, error: json.error || 'Failed to get response from AI Copilot' };
    }

    return { success: true, data: json.data as PatientCopilotResponse };
  } catch (err: any) {
    console.error('[aiService] askPatientCopilot error:', err);
    return {
      success: true,
      fallback: true,
      data: {
        triageLevel: 'ROUTINE',
        reply: "I am having trouble connecting to the cloud clinical engine right now. If this is an urgent health concern, please use the Teleconsult tab to speak with an on-duty licensed pharmacist.",
        immediateAction: "Contact the pharmacy on-duty pharmacist via phone or teleconsult.",
        emergencyAlert: false,
        suggestedQuickReplies: ["Book Teleconsultation", "Call Pharmacy Support", "View Emergency Numbers"]
      }
    };
  }
}

