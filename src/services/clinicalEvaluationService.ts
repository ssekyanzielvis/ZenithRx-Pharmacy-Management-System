/**
 * clinicalEvaluationService.ts — ZenithRx Context-Aware Drug Interaction & Allergy Engine
 * Evaluates candidate prescription drugs against comprehensive Patient Medication Profiles:
 * Current Medicines, Previous Medicines, Allergies, Previous ADRs, Chronic Conditions & OTCs.
 * Enforces: System flags with rich clinical context; Pharmacist makes the final decision.
 */

import {
  PatientMedicationProfile,
  ClinicalSafetyAlert,
  ClinicalEvaluationResult,
  PharmacistClinicalDecision,
  ClinicalAlertSeverity,
  ClinicalAlertCategory,
} from '../types';

const STORAGE_KEY_PATIENT_PROFILES = 'zenithrx_patient_med_profiles_v1';
const STORAGE_KEY_CLINICAL_DECISIONS = 'zenithrx_pharmacist_clinical_decisions_v1';

// ─── Initial Seeded Patient Medication Profiles ───────────────────────────────
export const INITIAL_PATIENT_PROFILES: PatientMedicationProfile[] = [
  {
    id: 'prof-001',
    patientId: 'cust-1',
    tenantId: 'client-001',
    patientName: 'Grace Nakato',
    patientNinOrId: 'CM92014819201K',
    dateOfBirth: '1984-06-12',
    gender: 'Female',
    phone: '+256 701 234567',
    currentMedications: [
      {
        id: 'act-001',
        drugBrandName: 'Glucophage 500mg',
        genericName: 'Metformin Hydrochloride',
        strength: '500mg',
        dosageForm: 'Oral Tablet',
        doseAndFrequency: '1 tablet twice daily with meals',
        prescriberDoctor: 'Dr. Sarah Nabwire (Norvik Hospital)',
        startDate: '2025-01-10',
        indication: 'Type 2 Diabetes Mellitus Glycemic Control',
        source: 'prescribed_dispensed',
      },
      {
        id: 'act-002',
        drugBrandName: 'Norvasc 5mg',
        genericName: 'Amlodipine Besylate',
        strength: '5mg',
        dosageForm: 'Oral Tablet',
        doseAndFrequency: '1 tablet once daily in the morning',
        prescriberDoctor: 'Dr. Ronald Mukasa (Mulago Hospital)',
        startDate: '2025-03-15',
        indication: 'Essential Hypertension',
        source: 'prescribed_dispensed',
      },
    ],
    previousMedications: [
      {
        id: 'past-001',
        drugBrandName: 'Augmentin 625mg',
        genericName: 'Co-Amoxiclav',
        strength: '625mg',
        startDate: '2023-04-01',
        endDate: '2023-04-03',
        discontinuationReason: 'adverse_reaction',
        notes: 'Discontinued due to immediate acute facial angioedema and diffuse urticaria.',
      },
    ],
    knownAllergies: [
      {
        id: 'all-001',
        allergenName: 'Penicillins / Beta-Lactams (Amoxicillin, Ampicillin, Co-Amoxiclav)',
        allergyCategory: 'drug',
        reactionType: 'Anaphylaxis / Angioedema',
        severity: 'Severe / Life-Threatening',
        diagnosedDate: '2023-04-03',
        source: 'confirmed_clinical_diagnosis',
      },
    ],
    previousAdrs: [
      {
        id: 'adr-hist-001',
        suspectedDrug: 'Co-Amoxiclav (Augmentin)',
        brandName: 'Augmentin 625mg',
        reactionDescription: 'Severe angioedema of upper lip, eyelid swelling, and severe generalized pruritus within 45 mins of first dose.',
        causality: 'Certain',
        severity: 'Severe',
        dateReported: '2023-04-03',
        ndaReportRef: 'ADR-UG-2023-0891',
      },
    ],
    chronicConditions: [
      {
        id: 'cond-001',
        conditionName: 'Type 2 Diabetes Mellitus',
        icd10Code: 'E11.9',
        diagnosedDate: '2021-09-14',
        severityLevel: 'Moderate',
        status: 'controlled',
        notes: 'Target HbA1c 6.8%. Monitored on Metformin monotherapy.',
      },
      {
        id: 'cond-002',
        conditionName: 'Bronchial Asthma (Moderate Persistent)',
        icd10Code: 'J45.4',
        diagnosedDate: '2018-05-20',
        severityLevel: 'Moderate',
        status: 'active',
        notes: 'History of exercise-induced bronchospasm. Avoid non-selective beta-blockers.',
      },
    ],
    otcMedicationsReported: [
      {
        id: 'otc-001',
        productName: 'Ibuprofen 400mg Tablets',
        activeIngredient: 'Ibuprofen',
        doseAndFrequency: '400mg PRN for tension headache (approx 2-3x weekly)',
        purpose: 'Acute tension headaches',
        isHerbalOrSupplement: false,
        dateStarted: '2026-02-01',
      },
      {
        id: 'otc-002',
        productName: 'Vitamin C 1000mg + Zinc Effervescent',
        activeIngredient: 'Ascorbic Acid + Zinc',
        doseAndFrequency: '1 tablet daily in water',
        purpose: 'Immune support',
        isHerbalOrSupplement: true,
        dateStarted: '2026-01-15',
      },
    ],
    totalPrescriptionsCount: 14,
    totalDispensingCount: 12,
    lastClinicalReviewDate: '2026-08-15T10:00:00Z',
    lastReviewedByPharmacist: 'Dr. Arthur Ssenabulya',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'prof-002',
    patientId: 'cust-2',
    tenantId: 'client-001',
    patientName: 'John Baptist Okello',
    patientNinOrId: 'CM84029104921M',
    dateOfBirth: '1976-11-23',
    gender: 'Male',
    phone: '+256 772 345678',
    currentMedications: [
      {
        id: 'act-003',
        drugBrandName: 'Marevan 5mg',
        genericName: 'Warfarin Sodium',
        strength: '5mg',
        dosageForm: 'Oral Tablet',
        doseAndFrequency: '5mg once daily at 6:00 PM (Target INR 2.0 - 3.0)',
        prescriberDoctor: 'Dr. Charles Lwanga (Uganda Heart Institute)',
        startDate: '2024-06-01',
        indication: 'Non-valvular Atrial Fibrillation stroke prevention',
        source: 'prescribed_dispensed',
      },
      {
        id: 'act-004',
        drugBrandName: 'Zestril 10mg',
        genericName: 'Lisinopril',
        strength: '10mg',
        dosageForm: 'Oral Tablet',
        doseAndFrequency: '10mg once daily',
        prescriberDoctor: 'Dr. Ronald Mukasa',
        startDate: '2024-06-01',
        indication: 'Renoprotection & Hypertension',
        source: 'prescribed_dispensed',
      },
    ],
    previousMedications: [
      {
        id: 'past-002',
        drugBrandName: 'Bactrim DS',
        genericName: 'Co-Trimoxazole (Sulfamethoxazole + Trimethoprim)',
        strength: '800mg/160mg',
        startDate: '2022-08-10',
        endDate: '2022-08-12',
        discontinuationReason: 'adverse_reaction',
        notes: 'Severe bullous rash and oral mucosal ulcerations.',
      },
    ],
    knownAllergies: [
      {
        id: 'all-002',
        allergenName: 'Sulfonamides / Sulfa Drugs (Co-Trimoxazole, Sulfadiazine)',
        allergyCategory: 'drug',
        reactionType: 'Severe Rash / Urticaria',
        severity: 'Severe / Life-Threatening',
        diagnosedDate: '2022-08-12',
        source: 'confirmed_clinical_diagnosis',
      },
    ],
    previousAdrs: [
      {
        id: 'adr-hist-002',
        suspectedDrug: 'Co-Trimoxazole (Bactrim)',
        brandName: 'Bactrim DS',
        reactionDescription: 'Severe erythema multiforme-like cutaneous eruption with lip ulceration.',
        causality: 'Certain',
        severity: 'Severe',
        dateReported: '2022-08-12',
        ndaReportRef: 'ADR-UG-2022-0412',
      },
    ],
    chronicConditions: [
      {
        id: 'cond-003',
        conditionName: 'Chronic Kidney Disease (Stage 3b — eGFR 38 mL/min)',
        icd10Code: 'N18.32',
        diagnosedDate: '2023-02-18',
        severityLevel: 'Severe / High Risk',
        status: 'active',
        notes: 'Serum Creatinine 185 umol/L. Require renally adjusted dosing on all cleared agents.',
      },
      {
        id: 'cond-004',
        conditionName: 'Peptic Ulcer Disease (PUD with prior melena)',
        icd10Code: 'K27.9',
        diagnosedDate: '2021-11-04',
        severityLevel: 'Moderate',
        status: 'controlled',
        notes: 'History of NSAID-induced gastric ulcer. Strict avoidance of systemic NSAIDs.',
      },
    ],
    otcMedicationsReported: [
      {
        id: 'otc-003',
        productName: "St. John's Wort 300mg Capsules",
        activeIngredient: 'Hypericum perforatum extract',
        doseAndFrequency: '300mg once daily',
        purpose: 'Mild mood enhancement / sleep',
        isHerbalOrSupplement: true,
        dateStarted: '2026-08-01',
      },
    ],
    totalPrescriptionsCount: 28,
    totalDispensingCount: 26,
    lastClinicalReviewDate: '2026-09-01T14:00:00Z',
    lastReviewedByPharmacist: 'Dr. Arthur Ssenabulya',
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2026-09-01T14:00:00Z',
  },
  {
    id: 'prof-003',
    patientId: 'cust-101',
    tenantId: 'client-001',
    patientName: 'Kato Emmanuel Sentamu',
    patientNinOrId: 'CM880194819201A',
    dateOfBirth: '1964-03-18',
    gender: 'Male',
    phone: '+256 772 109843',
    currentMedications: [
      {
        id: 'act-005',
        drugBrandName: 'Morphine Oral Solution 10mg/5mL',
        genericName: 'Morphine Hydrochloride',
        strength: '10mg/5mL',
        dosageForm: 'Oral Solution',
        doseAndFrequency: '10mg (5mL) every 4 hours PRN for breakthrough pain',
        prescriberDoctor: 'Dr. Charles Lwanga (Mulago Oncology)',
        startDate: '2026-09-21',
        indication: 'Metastatic prostate bone pain palliative care',
        source: 'prescribed_dispensed',
      },
    ],
    previousMedications: [],
    knownAllergies: [
      {
        id: 'all-003',
        allergenName: 'Tramadol (Synthetic Opioid)',
        allergyCategory: 'drug',
        reactionType: 'GI Upset',
        severity: 'Moderate',
        diagnosedDate: '2025-04-10',
        source: 'patient_self_reported',
      },
    ],
    previousAdrs: [],
    chronicConditions: [
      {
        id: 'cond-005',
        conditionName: 'Metastatic Prostate Carcinoma (Bone Metastases)',
        icd10Code: 'C61',
        diagnosedDate: '2024-11-12',
        severityLevel: 'Severe / High Risk',
        status: 'active',
        notes: 'Palliative radiotherapy and opioid analgesia protocol.',
      },
    ],
    otcMedicationsReported: [
      {
        id: 'otc-004',
        productName: 'Senna Syrup 7.5mg/5mL',
        activeIngredient: 'Sennosides',
        doseAndFrequency: '10mL at bedtime',
        purpose: 'Opioid-induced constipation prevention',
        isHerbalOrSupplement: false,
        dateStarted: '2026-09-21',
      },
    ],
    totalPrescriptionsCount: 8,
    totalDispensingCount: 8,
    lastClinicalReviewDate: '2026-09-21T10:14:00Z',
    lastReviewedByPharmacist: 'Dr. Arthur Ssenabulya',
    createdAt: '2026-09-21T10:14:00Z',
    updatedAt: '2026-09-21T10:14:00Z',
  },
];

// ─── Clinical Evaluation & Decision Engine Service Class ─────────────────────
class ClinicalEvaluationService {
  // 1. Patient Profile Management
  getAllProfiles(tenantId?: string): PatientMedicationProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PATIENT_PROFILES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_PATIENT_PROFILES, JSON.stringify(INITIAL_PATIENT_PROFILES));
        return tenantId ? INITIAL_PATIENT_PROFILES.filter(p => p.tenantId === tenantId) : INITIAL_PATIENT_PROFILES;
      }
      const all: PatientMedicationProfile[] = JSON.parse(raw);
      return tenantId ? all.filter(p => p.tenantId === tenantId) : all;
    } catch {
      return INITIAL_PATIENT_PROFILES;
    }
  }

  getProfileByPatientId(patientId: string): PatientMedicationProfile | undefined {
    return this.getAllProfiles().find(
      p => p.patientId === patientId || p.patientName.toLowerCase() === patientId.toLowerCase()
    );
  }

  getProfileByNameOrPhone(query: string): PatientMedicationProfile | undefined {
    const q = query.toLowerCase().trim();
    return this.getAllProfiles().find(
      p =>
        p.patientName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.patientNinOrId && p.patientNinOrId.toLowerCase().includes(q))
    );
  }

  saveProfile(profile: PatientMedicationProfile): PatientMedicationProfile {
    const profiles = this.getAllProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id || p.patientId === profile.patientId);
    const updated = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      profiles[idx] = updated;
    } else {
      profiles.unshift(updated);
    }

    try {
      localStorage.setItem(STORAGE_KEY_PATIENT_PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save patient profile', e);
    }

    return updated;
  }

  // 2. Comprehensive Clinical Prescription Safety Evaluation Engine
  evaluatePrescriptionSafety(
    candidateDrugNames: string[],
    patientProfile?: PatientMedicationProfile
  ): ClinicalEvaluationResult {
    const alerts: ClinicalSafetyAlert[] = [];
    const normalizedCandidateDrugs = candidateDrugNames.map(d => d.toLowerCase().trim());

    // Context from Profile
    const currentMeds = patientProfile?.currentMedications || [];
    const allergies = patientProfile?.knownAllergies || [];
    const adrs = patientProfile?.previousAdrs || [];
    const conditions = patientProfile?.chronicConditions || [];
    const otcs = patientProfile?.otcMedicationsReported || [];

    // ── CHECK 1: ALLERGY & CHEMICAL CROSS-REACTIVITY ──────────────────────────
    normalizedCandidateDrugs.forEach(drug => {
      // Penicillins / Beta-Lactams Check
      const isBetaLactam =
        drug.includes('amoxicillin') ||
        drug.includes('augmentin') ||
        drug.includes('co-amoxiclav') ||
        drug.includes('ampicillin') ||
        drug.includes('penicillin') ||
        drug.includes('cloxacillin') ||
        drug.includes('piperacillin') ||
        drug.includes('cephalexin') ||
        drug.includes('ceftriaxone');

      const hasPenicillinAllergy = allergies.some(
        a =>
          a.allergenName.toLowerCase().includes('penicillin') ||
          a.allergenName.toLowerCase().includes('beta-lactam') ||
          a.allergenName.toLowerCase().includes('amoxicillin')
      );

      if (isBetaLactam && hasPenicillinAllergy) {
        alerts.push({
          id: `alert-all-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          category: 'allergy_cross_reactivity',
          severity: 'contraindicated_fatal_risk',
          headline: `CRITICAL ALLERGY ALERT: ${drug.toUpperCase()} Contains Beta-Lactam Ring`,
          primaryOffendingDrug: drug,
          interactingContext: 'Documented Penicillin / Beta-Lactam Allergy (Anaphylaxis Risk)',
          clinicalMechanism:
            'Cross-reactivity via common beta-lactam bicyclic nuclear core structure triggers rapid IgE-mediated mast cell degranulation.',
          clinicalHazardExplanation:
            'Patient has documented history of severe anaphylaxis/angioedema to penicillin class. Prescribing beta-lactam antibiotics risks acute airway obstruction, bronchospasm, and cardiovascular collapse.',
          recommendedAction:
            'DO NOT DISPENSE without direct prescriber consultation. Switch immediately to a non-beta-lactam alternative (e.g. Macrolide such as Azithromycin or Clarithromycin, or Fluoroquinolone / Doxycycline).',
          isVoluntaryConditionTrigger: false,
        });
      }

      // Sulfa Allergy Check
      const isSulfa =
        drug.includes('cotrimoxazole') ||
        drug.includes('co-trimoxazole') ||
        drug.includes('bactrim') ||
        drug.includes('septrin') ||
        drug.includes('sulfamethoxazole') ||
        drug.includes('sulfadiazine') ||
        drug.includes('celecoxib');

      const hasSulfaAllergy = allergies.some(
        a =>
          a.allergenName.toLowerCase().includes('sulfa') ||
          a.allergenName.toLowerCase().includes('sulfonamide')
      );

      if (isSulfa && hasSulfaAllergy) {
        alerts.push({
          id: `alert-sulfa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          category: 'allergy_cross_reactivity',
          severity: 'contraindicated_fatal_risk',
          headline: `CRITICAL ALLERGY ALERT: ${drug.toUpperCase()} Contains Sulfonamide Moiety`,
          primaryOffendingDrug: drug,
          interactingContext: 'Documented Sulfonamide / Sulfa Allergy',
          clinicalMechanism:
            'Arylamine metabolite haptenation induces T-cell mediated severe cutaneous adverse reactions (SCAR / SJS / TEN).',
          clinicalHazardExplanation:
            'Patient has recorded severe reaction to sulfa agents. Administering sulfonamides risks Stevens-Johnson syndrome or toxic epidermal necrolysis.',
          recommendedAction:
            'Withhold sulfonamide antibiotic. Consult prescriber to switch to Cefuroxime, Amoxicillin (if non-penicillin allergic), or Nitrofurantoin.',
          isVoluntaryConditionTrigger: false,
        });
      }
    });

    // ── CHECK 2: DRUG-DRUG INTERACTIONS (WITH PATIENT CURRENT MEDICINES) ──────
    normalizedCandidateDrugs.forEach(prescribedDrug => {
      // A. Ciprofloxacin + Current Metformin (Hypoglycemia / Renal Clearance)
      const isCipro = prescribedDrug.includes('ciprofloxacin') || prescribedDrug.includes('cipro');
      const takingMetformin = currentMeds.some(m => m.genericName.toLowerCase().includes('metformin') || m.drugBrandName.toLowerCase().includes('glucophage'));

      if (isCipro && takingMetformin) {
        alerts.push({
          id: `alert-ddi-cipro-met-${Date.now()}`,
          category: 'drug_drug_interaction',
          severity: 'major_clinical_hazard',
          headline: `MAJOR DRUG-DRUG INTERACTION: Ciprofloxacin + Current Metformin Therapy`,
          primaryOffendingDrug: prescribedDrug,
          interactingContext: 'Active Current Medication: Metformin 500mg BD',
          clinicalMechanism:
            'Ciprofloxacin inhibits renal organic cation transporters (OCT2/MATE1) and hepatic CYP1A2, increasing metformin AUC by up to 40% and inhibiting compensatory gluconeogenesis.',
          clinicalHazardExplanation:
            'Significantly elevated risk of sudden, severe hypoglycemia and lactic acidosis, especially in elderly patients or mild renal compromise.',
          recommendedAction:
            'Advise patient to self-monitor blood glucose closely (every 4-6 hours). Consider alternative antibiotic (e.g. Cefixime or Azithromycin) or temporarily reduce Metformin dose during the 5-day course.',
          isVoluntaryConditionTrigger: false,
        });
      }

      // B. Prescribed Benzodiazepine / Sedative + Current Morphine (Fatal CNS Depression)
      const isSedative =
        prescribedDrug.includes('diazepam') ||
        prescribedDrug.includes('valium') ||
        prescribedDrug.includes('midazolam') ||
        prescribedDrug.includes('lorazepam') ||
        prescribedDrug.includes('clonazepam') ||
        prescribedDrug.includes('alprazolam');

      const takingOpioid = currentMeds.some(
        m =>
          m.genericName.toLowerCase().includes('morphine') ||
          m.genericName.toLowerCase().includes('pethidine') ||
          m.genericName.toLowerCase().includes('fentanyl') ||
          m.genericName.toLowerCase().includes('oxycodone')
      );

      if (isSedative && takingOpioid) {
        alerts.push({
          id: `alert-ddi-benzo-opioid-${Date.now()}`,
          category: 'drug_drug_interaction',
          severity: 'contraindicated_fatal_risk',
          headline: `CONTRAINDICATED: Benzodiazepine (${prescribedDrug}) + Opioid Analgesic`,
          primaryOffendingDrug: prescribedDrug,
          interactingContext: 'Active Current Medication: Morphine Hydrochloride Oral Liquid',
          clinicalMechanism:
            'Profound synergistic depressant action on medullary respiratory centers via simultaneous GABA-A and mu-opioid receptor potentiation.',
          clinicalHazardExplanation:
            'Black Box Warning: Concomitant administration of opioids and benzodiazepines carries extreme risk of severe respiratory arrest, profound sedation, coma, and death.',
          recommendedAction:
            'Strictly avoid concomitant use. If sedation is clinically non-negotiable for palliative agitation, use lowest possible titrated doses under continuous pulse oximetry monitoring with Naloxone available.',
          isVoluntaryConditionTrigger: false,
        });
      }

      // C. Prescribed Simvastatin / Statin + Current Amlodipine (CYP3A4 Myopathy)
      const isSimvastatin = prescribedDrug.includes('simvastatin') || prescribedDrug.includes('zocor');
      const takingAmlodipine = currentMeds.some(m => m.genericName.toLowerCase().includes('amlodipine') || m.drugBrandName.toLowerCase().includes('norvasc'));

      if (isSimvastatin && takingAmlodipine) {
        alerts.push({
          id: `alert-ddi-stat-amlo-${Date.now()}`,
          category: 'drug_drug_interaction',
          severity: 'moderate_advisory',
          headline: `MODERATE INTERACTION: Simvastatin + Current Amlodipine`,
          primaryOffendingDrug: prescribedDrug,
          interactingContext: 'Active Current Medication: Amlodipine 5mg OD',
          clinicalMechanism:
            'Amlodipine inhibits CYP3A4-mediated first-pass metabolism of simvastatin, elevating active simvastatin acid levels by up to 77%.',
          clinicalHazardExplanation:
            'Elevates the risk of statin-induced myotoxicity, muscle pain, and rare life-threatening rhabdomyolysis.',
          recommendedAction:
            'Ensure Simvastatin daily dose does not exceed 20mg daily when co-administered with Amlodipine. Alternatively, switch to Rosuvastatin or Atorvastatin which do not exhibit this interaction.',
          isVoluntaryConditionTrigger: false,
        });
      }
    });

    // ── CHECK 3: DRUG-OTC & HERBAL INTERACTIONS ───────────────────────────────
    normalizedCandidateDrugs.forEach(prescribedDrug => {
      // Warfarin / DOAC Prescribed + Patient Taking OTC Ibuprofen / NSAIDs
      const isAnticoagulant =
        prescribedDrug.includes('warfarin') ||
        prescribedDrug.includes('marevan') ||
        prescribedDrug.includes('rivaroxaban') ||
        prescribedDrug.includes('xarelto') ||
        prescribedDrug.includes('apixaban');

      const takingOtcNsaid = otcs.some(
        o =>
          o.activeIngredient.toLowerCase().includes('ibuprofen') ||
          o.activeIngredient.toLowerCase().includes('diclofenac') ||
          o.activeIngredient.toLowerCase().includes('aspirin') ||
          o.productName.toLowerCase().includes('ibuprofen')
      );

      if (isAnticoagulant && takingOtcNsaid) {
        alerts.push({
          id: `alert-otc-warfarin-nsaid-${Date.now()}`,
          category: 'otc_herb_drug_interaction',
          severity: 'contraindicated_fatal_risk',
          headline: `HIGH RISK OTC INTERACTION: Prescribed Anticoagulant (${prescribedDrug}) + Patient Reported OTC Ibuprofen`,
          primaryOffendingDrug: prescribedDrug,
          interactingContext: 'Patient-Reported OTC Medicine: Ibuprofen 400mg PRN',
          clinicalMechanism:
            'Synergistic antiplatelet action combined with NSAID-induced gastric mucosal cyclooxygenase inhibition and mucosal erosion.',
          clinicalHazardExplanation:
            'Increases risk of catastrophic gastrointestinal hemorrhage and intracranial bleeding by 4.5 to 6-fold.',
          recommendedAction:
            'Counsel patient to immediately cease all OTC Ibuprofen / NSAIDs. Switch pain relief to Paracetamol 1g QDS or topical rubefacients under strict INR supervision.',
          isVoluntaryConditionTrigger: false,
        });
      }

      // Prescribed Warfarin + Patient Taking St. John's Wort
      const takingStJohnsWort = otcs.some(
        o =>
          o.activeIngredient.toLowerCase().includes('hypericum') ||
          o.productName.toLowerCase().includes("st. john's wort")
      );

      if (isAnticoagulant && takingStJohnsWort) {
        alerts.push({
          id: `alert-otc-warfarin-stjohn-${Date.now()}`,
          category: 'otc_herb_drug_interaction',
          severity: 'major_clinical_hazard',
          headline: `HERBAL INTERACTION: Warfarin + Patient Reported St. John's Wort`,
          primaryOffendingDrug: prescribedDrug,
          interactingContext: "Patient-Reported Herbal Supplement: St. John's Wort 300mg",
          clinicalMechanism:
            'Hyperforin in St. John\'s Wort is a potent inducer of hepatic CYP2C9 and CYP3A4, markedly accelerating Warfarin clearance.',
          clinicalHazardExplanation:
            'Causes precipitous drop in INR levels, therapeutic failure of anticoagulation, and heightened risk of thromboembolic stroke or pulmonary embolism.',
          recommendedAction:
            'Patient must discontinue St. John\'s Wort immediately. Re-check INR in 3-5 days to re-stabilize dosage.',
          isVoluntaryConditionTrigger: false,
        });
      }
    });

    // ── CHECK 4: DRUG-DISEASE / CONTRAINDICATION FLAGS ───────────────────────
    normalizedCandidateDrugs.forEach(prescribedDrug => {
      // Non-selective Beta Blockers + Asthma
      const isNonSelectiveBetaBlocker =
        prescribedDrug.includes('propranolol') ||
        prescribedDrug.includes('timolol') ||
        prescribedDrug.includes('carvedilol') ||
        prescribedDrug.includes('labetalol');

      const hasAsthma = conditions.some(
        c =>
          c.conditionName.toLowerCase().includes('asthma') ||
          c.conditionName.toLowerCase().includes('copd') ||
          c.conditionName.toLowerCase().includes('bronchospasm')
      );

      if (isNonSelectiveBetaBlocker && hasAsthma) {
        alerts.push({
          id: `alert-dis-bb-asthma-${Date.now()}`,
          category: 'disease_contraindication',
          severity: 'contraindicated_fatal_risk',
          headline: `CONTRAINDICATION: ${prescribedDrug.toUpperCase()} in Bronchial Asthma / COPD`,
          primaryOffendingDrug: prescribedDrug,
          interactingContext: 'Recorded Chronic Condition: Bronchial Asthma (Moderate Persistent)',
          clinicalMechanism:
            'Antagonism of bronchial beta-2 adrenergic receptors leads to unopposed parasympathetic bronchoconstriction.',
          clinicalHazardExplanation:
            'Can precipitate acute refractory status asthmaticus that is poorly responsive to standard inhaled beta-agonist bronchodilators.',
          recommendedAction:
            'DO NOT DISPENSE. Non-selective beta-blockers are contraindicated in asthma. Request prescriber to select a cardioselective agent (e.g. Bisoprolol / Metoprolol at lowest dose) or a Calcium Channel Blocker.',
          isVoluntaryConditionTrigger: true,
        });
      }

      // NSAIDs + Peptic Ulcer Disease (PUD)
      const isNsaid =
        prescribedDrug.includes('diclofenac') ||
        prescribedDrug.includes('meloxicam') ||
        prescribedDrug.includes('indomethacin') ||
        prescribedDrug.includes('ibuprofen') ||
        prescribedDrug.includes('piroxicam') ||
        prescribedDrug.includes('ketorolac');

      const hasPud = conditions.some(
        c =>
          c.conditionName.toLowerCase().includes('peptic ulcer') ||
          c.conditionName.toLowerCase().includes('pud') ||
          c.conditionName.toLowerCase().includes('gastritis') ||
          c.conditionName.toLowerCase().includes('gi bleed')
      );

      if (isNsaid && hasPud) {
        alerts.push({
          id: `alert-dis-nsaid-pud-${Date.now()}`,
          category: 'disease_contraindication',
          severity: 'major_clinical_hazard',
          headline: `DISEASE CAUTION: Systemic NSAID (${prescribedDrug}) in Active/History Peptic Ulcer Disease`,
          primaryOffendingDrug: prescribedDrug,
          interactingContext: 'Recorded Chronic Condition: Peptic Ulcer Disease (Prior Melena)',
          clinicalMechanism:
            'Inhibition of gastroprotective PGE2 and PGI2 synthesis depletes gastric mucosal bicarbonate barrier and mucosal blood flow.',
          clinicalHazardExplanation:
            'High risk of ulcer reactivation, acute upper GI bleeding, or gastrointestinal perforation.',
          recommendedAction:
            'Recommend alternative analgesic (Paracetamol / weak opioid) or require co-prescription of a Proton Pump Inhibitor (e.g. Esomeprazole 40mg daily) if NSAID is mandatory.',
          isVoluntaryConditionTrigger: true,
        });
      }

      // Metformin + Severe Renal Impairment (CKD Stage 3b/4)
      const isMetformin = prescribedDrug.includes('metformin') || prescribedDrug.includes('glucophage');
      const hasCkd = conditions.some(
        c =>
          c.conditionName.toLowerCase().includes('ckd') ||
          c.conditionName.toLowerCase().includes('chronic kidney') ||
          c.conditionName.toLowerCase().includes('renal impairment') ||
          c.conditionName.toLowerCase().includes('egfr')
      );

      if (isMetformin && hasCkd) {
        alerts.push({
          id: `alert-dis-metformin-ckd-${Date.now()}`,
          category: 'disease_contraindication',
          severity: 'major_clinical_hazard',
          headline: `RENAL DOSE WARNING: Metformin in Chronic Kidney Disease Stage 3b/4`,
          primaryOffendingDrug: prescribedDrug,
          interactingContext: 'Recorded Chronic Condition: Chronic Kidney Disease Stage 3b (eGFR 38 mL/min)',
          clinicalMechanism:
            'Metformin is excreted unchanged by renal tubular secretion; reduced GFR causes drug accumulation and uncoupling of oxidative phosphorylation.',
          clinicalHazardExplanation:
            'Risk of Metformin-Associated Lactic Acidosis (MALA), with mortality rates exceeding 30%.',
          recommendedAction:
            'Verify current eGFR. If eGFR is 30-44 mL/min, maximum daily dose is 1000mg. If eGFR < 30 mL/min, Metformin is contraindicated (switch to Linagliptin or Insulin).',
          isVoluntaryConditionTrigger: true,
        });
      }
    });

    // ── CHECK 5: PREVIOUS ADR RECURRENCE ─────────────────────────────────────
    normalizedCandidateDrugs.forEach(prescribedDrug => {
      adrs.forEach(adr => {
        if (
          prescribedDrug.includes(adr.suspectedDrug.toLowerCase()) ||
          (adr.brandName && prescribedDrug.includes(adr.brandName.toLowerCase()))
        ) {
          alerts.push({
            id: `alert-prev-adr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            category: 'previous_adr_recurrence',
            severity: 'contraindicated_fatal_risk',
            headline: `PREVIOUS ADVERSE DRUG REACTION RECORDED: ${prescribedDrug.toUpperCase()}`,
            primaryOffendingDrug: prescribedDrug,
            interactingContext: `Prior ADR: ${adr.reactionDescription} (Causality: ${adr.causality})`,
            clinicalMechanism: 'Re-exposure to an agent that previously caused confirmed ADR.',
            clinicalHazardExplanation: `Patient experienced "${adr.reactionDescription}" on ${adr.dateReported}. Re-exposure risks rapid secondary hypersensitivity cascade.`,
            recommendedAction:
              'Do not dispense without thorough clinical justification and prescriber agreement.',
            isVoluntaryConditionTrigger: false,
          });
        }
      });
    });

    // Determine highest severity
    let highestSeverity: ClinicalAlertSeverity | 'none' = 'none';
    if (alerts.some(a => a.severity === 'contraindicated_fatal_risk')) {
      highestSeverity = 'contraindicated_fatal_risk';
    } else if (alerts.some(a => a.severity === 'major_clinical_hazard')) {
      highestSeverity = 'major_clinical_hazard';
    } else if (alerts.some(a => a.severity === 'moderate_advisory')) {
      highestSeverity = 'moderate_advisory';
    } else if (alerts.some(a => a.severity === 'minor_precaution')) {
      highestSeverity = 'minor_precaution';
    }

    return {
      hasAlerts: alerts.length > 0,
      totalAlertsCount: alerts.length,
      highestSeverity,
      alerts,
      patientProfileSnapshot: patientProfile,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // 3. Pharmacist Clinical Decision Audit Logging
  recordPharmacistDecision(decision: PharmacistClinicalDecision): PharmacistClinicalDecision {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CLINICAL_DECISIONS);
      const list: PharmacistClinicalDecision[] = raw ? JSON.parse(raw) : [];
      list.unshift(decision);
      localStorage.setItem(STORAGE_KEY_CLINICAL_DECISIONS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to log pharmacist decision', e);
    }
    return decision;
  }
}

export const clinicalEvaluationService = new ClinicalEvaluationService();
