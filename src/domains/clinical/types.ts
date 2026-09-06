/**
 * Bounded Context: Prescription & Clinical Safety
 * Complies with technical.md §11.6 & §11.20
 */

export interface MedicationItemDto {
  drugId?: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  isSubstitutionAllowed: boolean;
}

export interface PrescriptionSafetyAnalysisDto {
  prescriptionId: string;
  patientName: string;
  doctorName: string;
  overallRiskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contraindications: string[];
  drugInteractions: {
    severity: 'MAJOR' | 'MODERATE' | 'MINOR';
    drugs: string[];
    description: string;
  }[];
  isApprovedForDispense: boolean;
  pharmacistOverrideReason?: string;
  dispensedByPharmacist?: string;
}
