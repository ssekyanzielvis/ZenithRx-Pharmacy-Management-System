/**
 * Bounded Context: Prescription & Clinical Safety Service Layer
 * Complies with technical.md §11.6 & §11.20
 */

import { MedicationItemDto, PrescriptionSafetyAnalysisDto } from './types';
import { logAuditEvent } from '../../repositories/auditRepository';

export class ClinicalSafetyService {
  /**
   * Deterministic local drug interaction check based on British National Formulary (BNF) guidelines
   */
  static evaluateLocalInteractions(medications: MedicationItemDto[]): {
    riskLevel: PrescriptionSafetyAnalysisDto['overallRiskLevel'];
    interactions: PrescriptionSafetyAnalysisDto['drugInteractions'];
  } {
    const names = medications.map((m) => m.drugName.toLowerCase());
    const interactions: PrescriptionSafetyAnalysisDto['drugInteractions'] = [];

    // Rule: Warfarin + Aspirin / NSAIDs
    const hasWarfarin = names.some((n) => n.includes('warfarin'));
    const hasNsaid = names.some((n) => n.includes('aspirin') || n.includes('ibuprofen') || n.includes('diclofenac'));
    if (hasWarfarin && hasNsaid) {
      interactions.push({
        severity: 'MAJOR',
        drugs: ['Warfarin', 'NSAID (Aspirin/Ibuprofen)'],
        description: 'Co-administration significantly elevates risk of severe gastrointestinal bleeding.',
      });
    }

    // Rule: ACE Inhibitors + Potassium-sparing diuretics
    const hasAce = names.some((n) => n.includes('lisinopril') || n.includes('enalapril') || n.includes('ramipril'));
    const hasPotassium = names.some((n) => n.includes('spironolactone') || n.includes('potassium'));
    if (hasAce && hasPotassium) {
      interactions.push({
        severity: 'MAJOR',
        drugs: ['ACE Inhibitor', 'Potassium-Sparing Agent'],
        description: 'Risk of life-threatening hyperkalemia. Requires serum potassium monitoring.',
      });
    }

    const riskLevel: PrescriptionSafetyAnalysisDto['overallRiskLevel'] =
      interactions.some((i) => i.severity === 'MAJOR') ? 'HIGH' : interactions.length > 0 ? 'MEDIUM' : 'SAFE';

    return { riskLevel, interactions };
  }
}
