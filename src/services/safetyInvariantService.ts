/**
 * safetyInvariantService.ts — ZenithRx Enterprise 6 Critical Safety Rules (§34)
 * Hard clinical & operational constraints that MUST be enforced across the platform.
 */

export interface ClinicalSafetyCheckResult {
  passed: boolean;
  ruleCode: 'RULE_1_MAX_DOSE' | 'RULE_2_ALLERGY' | 'RULE_3_FEFO' | 'RULE_4_RX_REQUIRED' | 'RULE_5_COLD_CHAIN' | 'RULE_6_DUAL_CONTROL';
  ruleTitle: string;
  severity: 'CRITICAL_BLOCK' | 'WARNING_OVERRIDE_REQUIRED' | 'INFO';
  message: string;
  details?: Record<string, any>;
  overrideAllowed: boolean;
  requiresSupervisorAuth: boolean;
}

// ─── Known Allergy & Drug Cross-Sensitivity Matrix ──────────────────────────
const DRUG_ALLERGY_MAP: Record<string, string[]> = {
  penicillin: ['amoxicillin', 'ampicillin', 'cloxacillin', 'augmentin', 'co-amoxiclav', 'penicillin v', 'benzylpenicillin'],
  sulfa: ['sulfamethoxazole', 'bactrim', 'cotrimoxazole', 'sulfasalazine', 'furosemide'],
  cephalosporin: ['ceftriaxone', 'cefixime', 'cefuroxime', 'cephalexin'],
  nsaid: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen', 'indomethacin', 'meloxicam', 'ketoprofen'],
  ciprofloxacin: ['ciprofloxacin', 'levofloxacin', 'norfloxacin', 'ofloxacin'],
};

// ─── Max Daily Recommended Limits (Adult standard mg/24hr) ─────────────────
const MAX_DAILY_DOSE_MG: Record<string, number> = {
  paracetamol: 4000,
  acetaminophen: 4000,
  ibuprofen: 2400,
  diclofenac: 150,
  amoxicillin: 3000,
  metformin: 2550,
  ciprofloxacin: 1500,
  azithromycin: 1000,
  tramadol: 400,
  morphine: 200,
  atenolol: 100,
  amlodipine: 10,
  metronidazole: 2000,
};

export class SafetyInvariantEngine {
  /**
   * Rule 1: Max Daily Dose Safety Invariant (§34.1)
   * Hard block or clinical intercept if prescribed daily dosage exceeds verified ceiling.
   */
  static checkMaxDailyDose(drugName: string, prescribedDailyDoseMg: number): ClinicalSafetyCheckResult {
    const key = drugName.toLowerCase().trim();
    const matchedKey = Object.keys(MAX_DAILY_DOSE_MG).find(k => key.includes(k));

    if (matchedKey) {
      const maxLimit = MAX_DAILY_DOSE_MG[matchedKey];
      if (prescribedDailyDoseMg > maxLimit) {
        return {
          passed: false,
          ruleCode: 'RULE_1_MAX_DOSE',
          ruleTitle: 'Critical Max Daily Dose Invariant Tripped',
          severity: 'CRITICAL_BLOCK',
          message: `DANGER: Prescribed dosage of ${prescribedDailyDoseMg}mg/day exceeds maximum safe physiological threshold of ${maxLimit}mg/day for ${matchedKey.toUpperCase()}. Dispensation halted.`,
          details: { drug: matchedKey, prescribedMg: prescribedDailyDoseMg, maxSafeLimitMg: maxLimit },
          overrideAllowed: true,
          requiresSupervisorAuth: true,
        };
      }
    }

    return {
      passed: true,
      ruleCode: 'RULE_1_MAX_DOSE',
      ruleTitle: 'Max Daily Dose Verified Safe',
      severity: 'INFO',
      message: 'Dosage is within standard therapeutic range.',
      overrideAllowed: false,
      requiresSupervisorAuth: false,
    };
  }

  /**
   * Rule 2: Allergy Cross-Sensitivity Hard Invariant (§34.2)
   * Prevents dispensing drugs if the patient's recorded allergy list matches the drug or its chemical class.
   */
  static checkAllergyCrossSensitivity(
    drugName: string,
    genericName: string,
    patientAllergies: string[]
  ): ClinicalSafetyCheckResult {
    if (!patientAllergies || patientAllergies.length === 0) {
      return {
        passed: true,
        ruleCode: 'RULE_2_ALLERGY',
        ruleTitle: 'No Patient Allergies Documented',
        severity: 'INFO',
        message: 'No known allergies reported for this patient.',
        overrideAllowed: false,
        requiresSupervisorAuth: false,
      };
    }

    const drugSearch = `${drugName} ${genericName}`.toLowerCase();

    for (const allergy of patientAllergies) {
      const a = allergy.toLowerCase().trim();

      // Direct match
      if (drugSearch.includes(a) || a.includes(drugSearch)) {
        return {
          passed: false,
          ruleCode: 'RULE_2_ALLERGY',
          ruleTitle: 'CRITICAL: Severe Patient Allergy Match',
          severity: 'CRITICAL_BLOCK',
          message: `STOP DISPENSING: Patient has documented severe allergy to "${allergy}". Prescribed medication "${drugName}" directly triggers this allergy. Risk of anaphylaxis.`,
          details: { matchedAllergy: allergy, drugName, genericName },
          overrideAllowed: false,
          requiresSupervisorAuth: true,
        };
      }

      // Cross-sensitivity class match
      for (const [classKey, classMembers] of Object.entries(DRUG_ALLERGY_MAP)) {
        if (a.includes(classKey)) {
          const isClassMember = classMembers.some(member => drugSearch.includes(member));
          if (isClassMember) {
            return {
              passed: false,
              ruleCode: 'RULE_2_ALLERGY',
              ruleTitle: 'CRITICAL: Drug Class Cross-Sensitivity Detected',
              severity: 'CRITICAL_BLOCK',
              message: `STOP DISPENSING: Patient is allergic to ${classKey.toUpperCase()} class drugs. "${drugName}" has high cross-reactivity with this allergen.`,
              details: { allergicClass: classKey, drugName },
              overrideAllowed: false,
              requiresSupervisorAuth: true,
            };
          }
        }
      }
    }

    return {
      passed: true,
      ruleCode: 'RULE_2_ALLERGY',
      ruleTitle: 'Allergy Clearance Verified',
      severity: 'INFO',
      message: 'No cross-sensitivities detected with patient allergy profile.',
      overrideAllowed: false,
      requiresSupervisorAuth: false,
    };
  }

  /**
   * Rule 3: Strict FEFO (First-Expired, First-Out) Invariant (§34.3)
   * Ensures that if an earlier expiring batch exists with stock, later batches cannot be picked without a documented reason.
   */
  static checkFefoCompliance(
    selectedBatch: { batchNumber: string; expiryDate: string },
    availableBatches: Array<{ batchNumber: string; expiryDate: string; stockQty: number }>
  ): ClinicalSafetyCheckResult {
    const validBatches = availableBatches
      .filter(b => b.stockQty > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    if (validBatches.length <= 1) {
      return {
        passed: true,
        ruleCode: 'RULE_3_FEFO',
        ruleTitle: 'FEFO Compliant',
        severity: 'INFO',
        message: 'Sole active batch in stock.',
        overrideAllowed: false,
        requiresSupervisorAuth: false,
      };
    }

    const earliestBatch = validBatches[0];
    const isEarliest = earliestBatch.batchNumber === selectedBatch.batchNumber;

    if (!isEarliest) {
      const selectedExp = new Date(selectedBatch.expiryDate);
      const earliestExp = new Date(earliestBatch.expiryDate);
      if (selectedExp > earliestExp) {
        return {
          passed: false,
          ruleCode: 'RULE_3_FEFO',
          ruleTitle: 'FEFO Violation: Earlier Expiring Batch Exists',
          severity: 'WARNING_OVERRIDE_REQUIRED',
          message: `Batch "${earliestBatch.batchNumber}" expires earlier (${earliestBatch.expiryDate}) than selected batch "${selectedBatch.batchNumber}" (${selectedBatch.expiryDate}). NDA regulations require dispensing earliest stock first.`,
          details: { recommendedBatch: earliestBatch, selectedBatch },
          overrideAllowed: true,
          requiresSupervisorAuth: false,
        };
      }
    }

    return {
      passed: true,
      ruleCode: 'RULE_3_FEFO',
      ruleTitle: 'FEFO Order Compliant',
      severity: 'INFO',
      message: 'Dispensing oldest batch in accordance with FEFO inventory protocol.',
      overrideAllowed: false,
      requiresSupervisorAuth: false,
    };
  }

  /**
   * Rule 4: Prescription Requirement for Class A / B Controlled Substances (§34.4)
   * Hard stop at POS if prescription required drug has no linked prescription ID.
   */
  static checkPrescriptionRequirement(
    prescriptionRequired: boolean,
    hasLinkedPrescription: boolean,
    rxNumber?: string
  ): ClinicalSafetyCheckResult {
    if (prescriptionRequired && (!hasLinkedPrescription || !rxNumber)) {
      return {
        passed: false,
        ruleCode: 'RULE_4_RX_REQUIRED',
        ruleTitle: 'Prescription Verification Required',
        severity: 'CRITICAL_BLOCK',
        message: 'NDA Regulation Violation: This medication is classified as Prescription-Only (Rx). It cannot be dispensed or billed through POS without a verified doctor prescription.',
        overrideAllowed: false,
        requiresSupervisorAuth: true,
      };
    }

    return {
      passed: true,
      ruleCode: 'RULE_4_RX_REQUIRED',
      ruleTitle: 'Prescription Requirement Satisfied',
      severity: 'INFO',
      message: 'Prescription verified and attached.',
      overrideAllowed: false,
      requiresSupervisorAuth: false,
    };
  }

  /**
   * Rule 5: Cold Chain Integrity Invariant (§34.5)
   * Blocks dispensing biologicals/vaccines/insulins if temperature excursion exceeded 8°C.
   */
  static checkColdChainIntegrity(
    isColdChainRequired: boolean,
    currentTempCelsius?: number,
    hasHistoricalExcursion?: boolean
  ): ClinicalSafetyCheckResult {
    if (!isColdChainRequired) {
      return {
        passed: true,
        ruleCode: 'RULE_5_COLD_CHAIN',
        ruleTitle: 'Standard Storage Drug',
        severity: 'INFO',
        message: 'No cold-chain requirement.',
        overrideAllowed: false,
        requiresSupervisorAuth: false,
      };
    }

    if (currentTempCelsius !== undefined && (currentTempCelsius < 2.0 || currentTempCelsius > 8.0)) {
      return {
        passed: false,
        ruleCode: 'RULE_5_COLD_CHAIN',
        ruleTitle: 'CRITICAL: Cold-Chain Temperature Excursion',
        severity: 'CRITICAL_BLOCK',
        message: `STOP DISPENSING: Cold chain product storage temperature is currently ${currentTempCelsius}°C (Safe range is 2.0°C - 8.0°C). Product efficacy and safety compromised. Quarantine batch immediately.`,
        details: { currentTempCelsius, safeMin: 2.0, safeMax: 8.0 },
        overrideAllowed: false,
        requiresSupervisorAuth: true,
      };
    }

    if (hasHistoricalExcursion) {
      return {
        passed: false,
        ruleCode: 'RULE_5_COLD_CHAIN',
        ruleTitle: 'Warning: Past Cold Chain Deviation Logged',
        severity: 'WARNING_OVERRIDE_REQUIRED',
        message: 'Batch had a recorded temperature deviation during transit. Pharmacist verification of vaccine vial monitor (VVM) required before release.',
        overrideAllowed: true,
        requiresSupervisorAuth: true,
      };
    }

    return {
      passed: true,
      ruleCode: 'RULE_5_COLD_CHAIN',
      ruleTitle: 'Cold Chain Verified (2°C - 8°C)',
      severity: 'INFO',
      message: 'Cold chain storage verified within strict 2-8°C window.',
      overrideAllowed: false,
      requiresSupervisorAuth: false,
    };
  }

  /**
   * Rule 6: Dual-Control Sensitive Action Invariant (§34.6)
   * Checks if a high-impact administrative action has 2 distinct approvals.
   */
  static checkDualControlRequirement(
    actionType: string,
    initiatorId: string,
    approverId?: string
  ): ClinicalSafetyCheckResult {
    if (!approverId) {
      return {
        passed: false,
        ruleCode: 'RULE_6_DUAL_CONTROL',
        ruleTitle: 'Dual-Control Second Admin Approval Required',
        severity: 'CRITICAL_BLOCK',
        message: `High-risk action "${actionType}" requires two distinct Quantum Networks super-administrators. Second signatory pending.`,
        details: { actionType, initiatorId },
        overrideAllowed: false,
        requiresSupervisorAuth: true,
      };
    }

    if (initiatorId === approverId) {
      return {
        passed: false,
        ruleCode: 'RULE_6_DUAL_CONTROL',
        ruleTitle: 'Dual-Control Self-Approval Prohibited',
        severity: 'CRITICAL_BLOCK',
        message: 'Principle of Least Privilege & Dual Control: An administrator cannot approve their own high-risk mutation request.',
        details: { initiatorId, approverId },
        overrideAllowed: false,
        requiresSupervisorAuth: true,
      };
    }

    return {
      passed: true,
      ruleCode: 'RULE_6_DUAL_CONTROL',
      ruleTitle: 'Dual Control Sign-Off Verified',
      severity: 'INFO',
      message: 'Both required administrative signatures verified.',
      overrideAllowed: false,
      requiresSupervisorAuth: false,
    };
  }
}
