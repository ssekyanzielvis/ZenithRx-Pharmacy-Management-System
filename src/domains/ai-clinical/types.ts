/**
 * Bounded Context: AI Services & Document Processing
 * Complies with technical.md §11.6 & §11.20
 */

export interface PrescriptionOcrRequestDto {
  imageBase64?: string;
  textContent?: string;
  tenantId?: string;
}

export interface PrescriptionOcrResponseDto {
  patientName: string;
  patientAge?: string;
  doctorName: string;
  doctorLicence?: string;
  diagnosis?: string;
  medications: {
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
    substitutionAllowed: boolean;
  }[];
  clinicalNotes?: string;
  warnings?: string[];
}
