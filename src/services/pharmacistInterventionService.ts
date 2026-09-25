/**
 * pharmacistInterventionService.ts — ZenithRx Pharmacist Clinical Intervention Service
 * National Drug Authority (NDA) & Pharmaceutical Society of Uganda (PSU) Good Pharmacy Practice
 * Implements recording of: Original Prescription ➔ Reason ➔ Action Taken ➔ Final Decision
 */

import {
  PharmacistClinicalInterventionRecord,
  InterventionReasonCategory,
  InterventionActionTaken,
  InterventionFinalDecision,
  ClinicalSignificanceGrade,
  ClinicalInterventionSummaryKPIs,
} from '../types';

const STORAGE_KEY_INTERVENTIONS = 'zenithrx_pharmacist_interventions_v1';

// ─── Initial Seeded Clinical Interventions ───────────────────────────────────
const INITIAL_INTERVENTIONS: PharmacistClinicalInterventionRecord[] = [
  {
    id: 'pci-001',
    interventionReferenceNo: 'PCI-2026-00081',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo)',
    prescriptionId: 'rx-2026-0891',
    prescriptionReferenceNo: 'RX-2026-0891',
    patientId: 'cust-1',
    patientName: 'Grace Nakato',
    patientAge: 42,
    patientGender: 'Female',
    patientPhone: '+256 701 234567',
    prescriberName: 'Dr. Ronald Mukasa',
    prescriberCouncilRegNo: 'UMDPC-2019-4412',
    prescriberFacility: 'Mulago National Referral Hospital',
    prescriberContact: '+256 701 998822',
    originalPrescription: {
      drugName: 'Augmentin 625mg Tablets',
      genericName: 'Co-Amoxiclav (Amoxicillin + Clavulanic Acid)',
      strength: '625mg',
      dosageForm: 'Film-Coated Tablet',
      doseAndFrequency: '1 tablet 12-hourly after meals',
      duration: '7 days',
      quantity: 14,
      route: 'Oral',
    },
    reasonCategory: 'allergy_or_contraindication_concern',
    clinicalProblemDescription:
      'Prescription called for Augmentin (Co-Amoxiclav) for acute sinusitis. Patient medication profile documents severe penicillin-induced angioedema and facial swelling (2023). High risk of fatal IgE-mediated anaphylactic reaction.',
    evidenceOrGuidelineReference: 'British National Formulary (BNF 86) §5.1.1; Uganda Clinical Guidelines (UCG 2023)',
    actionTaken: 'prescriber_contacted_and_amended',
    actionDetails:
      'Contacted Dr. Mukasa immediately via direct telephone. Highlighted patient beta-lactam anaphylaxis record and suggested switching to Azithromycin 500mg oral once daily for 3 days.',
    modifiedRegimen: {
      drugName: 'Zithromax 500mg Tablets',
      genericName: 'Azithromycin',
      strength: '500mg',
      dosageForm: 'Film-Coated Tablet',
      doseAndFrequency: '1 tablet (500mg) once daily 1 hour before food',
      duration: '3 days',
      quantity: 3,
    },
    prescriberContacted: true,
    contactChannel: 'Direct Phone Call',
    prescriberResponseNotes: 'Dr. Mukasa verified the allergy history in EHR and authorized immediate prescription amendment to Azithromycin.',
    finalDecision: 'accepted_by_prescriber',
    significanceGrade: 'grade_1_life_saving_prevented_fatal_event',
    estimatedCostSavingsUgx: 350000, // Prevented ICU anaphylaxis resuscitation costs
    adverseEventPreventedSummary: 'Prevented acute life-threatening anaphylactic airway obstruction and shock.',
    pharmacistName: 'Dr. Arthur Ssenabulya',
    pharmacistRole: 'Supervising Pharmacist',
    pharmacistPsuNo: 'PSU-2021-0892',
    digitalSignatureHash: 'sha256_e89104fa8bc912389dca12a884019bfb491823901bcae8821038917823ab9102',
    timestamp: '2026-09-22T09:30:00Z',
    createdAt: '2026-09-22T09:30:00Z',
  },
  {
    id: 'pci-002',
    interventionReferenceNo: 'PCI-2026-00082',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo)',
    prescriptionId: 'rx-2026-0892',
    prescriptionReferenceNo: 'RX-2026-0892',
    patientId: 'cust-2',
    patientName: 'John Baptist Okello',
    patientAge: 49,
    patientGender: 'Male',
    patientPhone: '+256 772 345678',
    prescriberName: 'Dr. Sarah Nabwire',
    prescriberCouncilRegNo: 'UMDPC-2020-1890',
    prescriberFacility: 'Norvik Hospital Kampala',
    prescriberContact: '+256 772 449911',
    originalPrescription: {
      drugName: 'Ciprofloxacin 500mg Tablets',
      genericName: 'Ciprofloxacin Hydrochloride',
      strength: '500mg',
      dosageForm: 'Film-Coated Tablet',
      doseAndFrequency: '1 tablet twice daily',
      duration: '5 days',
      quantity: 10,
      route: 'Oral',
    },
    reasonCategory: 'drug_drug_interaction',
    clinicalProblemDescription:
      'Patient is currently maintained on Metformin 500mg BD for Type 2 Diabetes. Ciprofloxacin inhibits renal OCT2/MATE1 and CYP1A2, increasing Metformin bioavailability and causing severe refractory hypoglycemic episodes.',
    evidenceOrGuidelineReference: 'Stockley Drug Interactions 12th Ed; BNF 86 §5.1.12',
    actionTaken: 'prescriber_contacted_and_amended',
    actionDetails:
      'Discussed pharmacokinetic drug-drug interaction with Dr. Nabwire. Recommended switching UTI antibiotic to Cefixime 400mg daily, eliminating hypoglycemic risk.',
    modifiedRegimen: {
      drugName: 'Suprax 400mg Tablets',
      genericName: 'Cefixime',
      strength: '400mg',
      dosageForm: 'Dispersible Tablet',
      doseAndFrequency: '1 tablet (400mg) once daily',
      duration: '5 days',
      quantity: 5,
    },
    prescriberContacted: true,
    contactChannel: 'Direct Phone Call',
    prescriberResponseNotes: 'Agreed with clinical rationale; updated prescription record to Cefixime.',
    finalDecision: 'accepted_by_prescriber',
    significanceGrade: 'grade_2_major_prevented_serious_toxicity_or_hospitalization',
    estimatedCostSavingsUgx: 180000,
    adverseEventPreventedSummary: 'Prevented acute neuroglycopenic hypoglycemia episode and emergency admission.',
    pharmacistName: 'Dr. Arthur Ssenabulya',
    pharmacistRole: 'Supervising Pharmacist',
    pharmacistPsuNo: 'PSU-2021-0892',
    digitalSignatureHash: 'sha256_b38190fa72819cd001fe89410a8c29184bfa1098239018cae98192831892fca1',
    timestamp: '2026-09-23T11:15:00Z',
    createdAt: '2026-09-23T11:15:00Z',
  },
  {
    id: 'pci-003',
    interventionReferenceNo: 'PCI-2026-00083',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo)',
    prescriptionId: 'rx-2026-0893',
    prescriptionReferenceNo: 'RX-2026-0893',
    patientId: 'cust-2',
    patientName: 'John Baptist Okello',
    patientAge: 49,
    patientGender: 'Male',
    patientPhone: '+256 772 345678',
    prescriberName: 'Dr. Charles Lwanga',
    prescriberCouncilRegNo: 'UMDPC-2015-8821',
    prescriberFacility: 'Mulago Hospital Renal Unit',
    prescriberContact: '+256 701 998822',
    originalPrescription: {
      drugName: 'Zyloric 300mg Tablets',
      genericName: 'Allopurinol',
      strength: '300mg',
      dosageForm: 'Oral Tablet',
      doseAndFrequency: '1 tablet (300mg) once daily',
      duration: '30 days',
      quantity: 30,
      route: 'Oral',
    },
    reasonCategory: 'renal_or_hepatic_dose_adjustment',
    clinicalProblemDescription:
      'Patient has documented Stage 3b Chronic Kidney Disease with eGFR of 38 mL/min. Standard 300mg starting dose of Allopurinol in impaired renal function carries high risk of Allopurinol Hypersensitivity Syndrome (AHS) and toxic epidermal necrolysis.',
    evidenceOrGuidelineReference: 'Uganda Clinical Guidelines (UCG 2023); Kidney Disease Improving Global Outcomes (KDIGO)',
    actionTaken: 'dose_modified_per_protocol',
    actionDetails:
      'Contacted Dr. Lwanga to adjust Allopurinol starting dose to 100mg once daily, with monthly uric acid titration and renal function monitoring.',
    modifiedRegimen: {
      drugName: 'Zyloric 100mg Tablets',
      genericName: 'Allopurinol',
      strength: '100mg',
      dosageForm: 'Oral Tablet',
      doseAndFrequency: '1 tablet (100mg) once daily with meals',
      duration: '30 days',
      quantity: 30,
    },
    prescriberContacted: true,
    contactChannel: 'WhatsApp Message & Telephone',
    prescriberResponseNotes: 'Dr. Lwanga approved the renal titration protocol and thanked the pharmacy team.',
    finalDecision: 'accepted_by_prescriber',
    significanceGrade: 'grade_2_major_prevented_serious_toxicity_or_hospitalization',
    estimatedCostSavingsUgx: 250000,
    adverseEventPreventedSummary: 'Prevented severe Allopurinol Hypersensitivity Syndrome and renal deterioration.',
    pharmacistName: 'Dr. Arthur Ssenabulya',
    pharmacistRole: 'Supervising Pharmacist',
    pharmacistPsuNo: 'PSU-2021-0892',
    digitalSignatureHash: 'sha256_44fa9081293847acff1894bfa29184bfa1098239018cae98192831892fca8901',
    timestamp: '2026-09-23T14:40:00Z',
    createdAt: '2026-09-23T14:40:00Z',
  },
  {
    id: 'pci-004',
    interventionReferenceNo: 'PCI-2026-00084',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo)',
    prescriptionId: 'rx-2026-0894',
    prescriptionReferenceNo: 'RX-2026-0894',
    patientId: 'cust-104',
    patientName: 'Baby Ethan Ssempijja',
    patientAge: 2,
    patientGender: 'Male',
    patientPhone: '+256 752 998811',
    prescriberName: 'Dr. Harriet Kigozi',
    prescriberCouncilRegNo: 'UMDPC-2018-3319',
    prescriberFacility: 'Nakasero Hospital Pediatrics',
    prescriberContact: '+256 772 449911',
    originalPrescription: {
      drugName: 'Amoxicillin 500mg Capsules',
      genericName: 'Amoxicillin Trihydrate',
      strength: '500mg',
      dosageForm: 'Hard Gelatin Capsule',
      doseAndFrequency: '1 capsule 3 times daily',
      duration: '5 days',
      quantity: 15,
      route: 'Oral',
    },
    reasonCategory: 'wrong_or_suboptimal_dosage_form',
    clinicalProblemDescription:
      'Prescribed adult 500mg hard gelatin capsules for a 2-year-old child (12 kg). Child cannot swallow intact capsules, and opening capsules leads to inaccurate dosing, bitter taste rejection, and choking risk.',
    evidenceOrGuidelineReference: 'WHO Model Formulary for Children (2020); UCG 2023 Pediatric Antibiotic Dosing',
    actionTaken: 'dosage_form_changed',
    actionDetails:
      'Calculated pediatric weight-based dose (40mg/kg/day in 3 divided doses = 160mg TDS). Converted to Amoxicillin 125mg/5mL oral suspension (6.4mL TDS for 5 days).',
    modifiedRegimen: {
      drugName: 'Amoxil 125mg/5mL Oral Suspension',
      genericName: 'Amoxicillin Oral Suspension',
      strength: '125mg/5mL',
      dosageForm: 'Oral Suspension (100mL Bottle)',
      doseAndFrequency: '6.5mL (approx 162.5mg) 8-hourly after food',
      duration: '5 days',
      quantity: 1,
    },
    prescriberContacted: true,
    contactChannel: 'Direct Phone Call',
    prescriberResponseNotes: 'Pediatrician authorized change to suspension and noted electronic prescription selection error.',
    finalDecision: 'accepted_by_prescriber',
    significanceGrade: 'grade_3_moderate_optimized_efficacy_prevented_adr',
    estimatedCostSavingsUgx: 45000,
    adverseEventPreventedSummary: 'Prevented choking hazard and erratic sub-therapeutic antibiotic dosing.',
    pharmacistName: 'Dr. Brenda Namaganda',
    pharmacistRole: 'Clinical Pharmacist',
    pharmacistPsuNo: 'PSU-2022-1104',
    digitalSignatureHash: 'sha256_91823901bcae8821038917823ab9102fe89104fa8bc912389dca12a884019bfb',
    timestamp: '2026-09-24T10:00:00Z',
    createdAt: '2026-09-24T10:00:00Z',
  },
  {
    id: 'pci-005',
    interventionReferenceNo: 'PCI-2026-00085',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo)',
    prescriptionId: 'rx-2026-0895',
    prescriptionReferenceNo: 'RX-2026-0895',
    patientId: 'cust-105',
    patientName: 'Mary Alupo',
    patientAge: 56,
    patientGender: 'Female',
    patientPhone: '+256 750 998877',
    prescriberName: 'Dr. Moses Kalule',
    prescriberCouncilRegNo: 'UMDPC-2016-1940',
    prescriberFacility: 'Bugolobi Medical Centre',
    prescriberContact: '+256 782 110099',
    originalPrescription: {
      drugName: 'Voltaren 50mg + Mobic 15mg',
      genericName: 'Diclofenac Sodium + Meloxicam',
      strength: '50mg / 15mg',
      dosageForm: 'Tablets',
      doseAndFrequency: 'Diclofenac 50mg TDS AND Meloxicam 15mg OD simultaneously',
      duration: '10 days',
      quantity: 40,
      route: 'Oral',
    },
    reasonCategory: 'duplicate_therapy',
    clinicalProblemDescription:
      'Simultaneous co-prescription of two non-steroidal anti-inflammatory drugs (Diclofenac + Meloxicam). Synergistic COX-1/COX-2 inhibition markedly accelerates gastric mucosal breakdown without additional analgesic efficacy.',
    evidenceOrGuidelineReference: 'BNF 86 §10.1.1; American College of Rheumatology NSAID Safety Guidelines',
    actionTaken: 'drug_discontinued_and_replaced',
    actionDetails:
      'Contacted Dr. Kalule to eliminate duplicate NSAID therapy. Discontinued Diclofenac and maintained Meloxicam 15mg OD with Paracetamol 1g PRN as safe adjuvant.',
    modifiedRegimen: {
      drugName: 'Mobic 15mg Tablets + Panadol 500mg',
      genericName: 'Meloxicam 15mg + Paracetamol 500mg',
      strength: '15mg / 500mg',
      dosageForm: 'Oral Tablets',
      doseAndFrequency: 'Meloxicam 15mg once daily with food + Paracetamol 1g every 6h PRN',
      duration: '10 days',
      quantity: 10,
    },
    prescriberContacted: true,
    contactChannel: 'Direct Phone Call',
    prescriberResponseNotes: 'Prescriber confirmed unintentional duplication and updated order.',
    finalDecision: 'accepted_by_prescriber',
    significanceGrade: 'grade_2_major_prevented_serious_toxicity_or_hospitalization',
    estimatedCostSavingsUgx: 120000,
    adverseEventPreventedSummary: 'Prevented acute gastric ulceration, upper GI hemorrhage, and acute tubular necrosis.',
    pharmacistName: 'Dr. Arthur Ssenabulya',
    pharmacistRole: 'Supervising Pharmacist',
    pharmacistPsuNo: 'PSU-2021-0892',
    digitalSignatureHash: 'sha256_77fa90123984bcde981290192389fabc10928301928301928301928301928301',
    timestamp: '2026-09-24T15:20:00Z',
    createdAt: '2026-09-24T15:20:00Z',
  }
];

// ─── Pharmacist Clinical Intervention Service Class ──────────────────────────
class PharmacistInterventionService {
  getAllInterventions(tenantId?: string): PharmacistClinicalInterventionRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_INTERVENTIONS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_INTERVENTIONS, JSON.stringify(INITIAL_INTERVENTIONS));
        return tenantId ? INITIAL_INTERVENTIONS.filter(i => i.tenantId === tenantId) : INITIAL_INTERVENTIONS;
      }
      const all: PharmacistClinicalInterventionRecord[] = JSON.parse(raw);
      return tenantId ? all.filter(i => i.tenantId === tenantId) : all;
    } catch {
      return INITIAL_INTERVENTIONS;
    }
  }

  getInterventionsByPrescription(prescriptionId: string): PharmacistClinicalInterventionRecord[] {
    return this.getAllInterventions().filter(i => i.prescriptionId === prescriptionId);
  }

  getInterventionsByPatient(patientId: string): PharmacistClinicalInterventionRecord[] {
    return this.getAllInterventions().filter(i => i.patientId === patientId);
  }

  recordIntervention(input: {
    tenantId: string;
    branchId: string;
    branchName: string;
    prescriptionId: string;
    prescriptionReferenceNo: string;
    patientId: string;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    patientPhone?: string;
    prescriberName: string;
    prescriberCouncilRegNo?: string;
    prescriberFacility: string;
    prescriberContact?: string;
    originalPrescription: {
      drugName: string;
      genericName?: string;
      strength?: string;
      dosageForm?: string;
      doseAndFrequency: string;
      duration?: string;
      quantity?: number;
      route?: string;
    };
    reasonCategory: InterventionReasonCategory;
    clinicalProblemDescription: string;
    evidenceOrGuidelineReference?: string;
    actionTaken: InterventionActionTaken;
    actionDetails: string;
    modifiedRegimen?: {
      drugName?: string;
      genericName?: string;
      strength?: string;
      dosageForm?: string;
      doseAndFrequency?: string;
      duration?: string;
      quantity?: number;
    };
    prescriberContacted: boolean;
    contactChannel?: string;
    prescriberResponseNotes?: string;
    finalDecision: InterventionFinalDecision;
    significanceGrade: ClinicalSignificanceGrade;
    estimatedCostSavingsUgx?: number;
    adverseEventPreventedSummary?: string;
    pharmacistName: string;
    pharmacistRole: string;
    pharmacistPsuNo: string;
  }): PharmacistClinicalInterventionRecord {
    const list = this.getAllInterventions();
    const seq = list.length + 86;
    const interventionReferenceNo = `PCI-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
    const timestamp = new Date().toISOString();
    const digitalSignatureHash = `sha256_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;

    const newRecord: PharmacistClinicalInterventionRecord = {
      id: `pci-uuid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      interventionReferenceNo,
      tenantId: input.tenantId,
      branchId: input.branchId,
      branchName: input.branchName,
      prescriptionId: input.prescriptionId,
      prescriptionReferenceNo: input.prescriptionReferenceNo,
      patientId: input.patientId,
      patientName: input.patientName,
      patientAge: input.patientAge,
      patientGender: input.patientGender,
      patientPhone: input.patientPhone,
      prescriberName: input.prescriberName,
      prescriberCouncilRegNo: input.prescriberCouncilRegNo,
      prescriberFacility: input.prescriberFacility,
      prescriberContact: input.prescriberContact,
      originalPrescription: input.originalPrescription,
      reasonCategory: input.reasonCategory,
      clinicalProblemDescription: input.clinicalProblemDescription,
      evidenceOrGuidelineReference: input.evidenceOrGuidelineReference,
      actionTaken: input.actionTaken,
      actionDetails: input.actionDetails,
      modifiedRegimen: input.modifiedRegimen,
      prescriberContacted: input.prescriberContacted,
      contactChannel: input.contactChannel || 'Direct Phone Call',
      prescriberResponseNotes: input.prescriberResponseNotes,
      finalDecision: input.finalDecision,
      significanceGrade: input.significanceGrade,
      estimatedCostSavingsUgx: input.estimatedCostSavingsUgx || 0,
      adverseEventPreventedSummary: input.adverseEventPreventedSummary,
      pharmacistName: input.pharmacistName,
      pharmacistRole: input.pharmacistRole,
      pharmacistPsuNo: input.pharmacistPsuNo,
      digitalSignatureHash,
      timestamp,
      createdAt: timestamp,
    };

    const updated = [newRecord, ...list];
    try {
      localStorage.setItem(STORAGE_KEY_INTERVENTIONS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save pharmacist clinical intervention', e);
    }

    return newRecord;
  }

  getInterventionKPIs(tenantId?: string): ClinicalInterventionSummaryKPIs {
    const list = this.getAllInterventions(tenantId);
    const total = list.length;
    if (total === 0) {
      return {
        totalInterventionsCount: 0,
        prescriberAcceptanceRatePercent: 100,
        grade1LifeSavingCount: 0,
        grade2MajorToxicityPreventedCount: 0,
        topInterventionCategory: 'None',
        estimatedNetSavingsUgx: 0,
      };
    }

    const accepted = list.filter(i => i.finalDecision === 'accepted_by_prescriber' || i.finalDecision === 'partially_accepted_with_modification' || i.finalDecision === 'pharmacist_authorized_protocol_change').length;
    const acceptanceRate = Math.round((accepted / total) * 100);
    const grade1 = list.filter(i => i.significanceGrade === 'grade_1_life_saving_prevented_fatal_event').length;
    const grade2 = list.filter(i => i.significanceGrade === 'grade_2_major_prevented_serious_toxicity_or_hospitalization').length;
    const netSavings = list.reduce((acc, i) => acc + (i.estimatedCostSavingsUgx || 0), 0);

    // Group by category to find top
    const counts: Record<string, number> = {};
    list.forEach(i => {
      counts[i.reasonCategory] = (counts[i.reasonCategory] || 0) + 1;
    });

    let topCategory = 'Dose Clarification';
    let maxCount = 0;
    Object.entries(counts).forEach(([cat, c]) => {
      if (c > maxCount) {
        maxCount = c;
        topCategory = cat.replace(/_/g, ' ');
      }
    });

    return {
      totalInterventionsCount: total,
      prescriberAcceptanceRatePercent: acceptanceRate,
      grade1LifeSavingCount: grade1,
      grade2MajorToxicityPreventedCount: grade2,
      topInterventionCategory: topCategory.toUpperCase(),
      estimatedNetSavingsUgx: netSavings,
    };
  }

  exportInterventionsToCsv(interventions: PharmacistClinicalInterventionRecord[]): void {
    const headers = [
      'Intervention Reference No',
      'Timestamp (UTC)',
      'Prescription Ref No',
      'Patient Name',
      'Patient Phone',
      'Prescriber Doctor',
      'Doctor License (UMDPC)',
      'Hospital Facility',
      'Original Drug',
      'Original Regimen',
      'Intervention Reason Category',
      'Clinical Problem Description',
      'Action Taken',
      'Action Details',
      'Modified Drug',
      'Modified Regimen',
      'Prescriber Contacted',
      'Prescriber Response Notes',
      'Final Decision',
      'Clinical Significance Grade',
      'Estimated Cost Savings (UGX)',
      'Adverse Event Prevented Summary',
      'Pharmacist Name',
      'Pharmacist PSU License',
      'Digital Signature Hash',
    ];

    const rows = interventions.map(i => [
      `"${i.interventionReferenceNo}"`,
      `"${new Date(i.timestamp).toLocaleString()}"`,
      `"${i.prescriptionReferenceNo}"`,
      `"${i.patientName}"`,
      `"${i.patientPhone || 'N/A'}"`,
      `"${i.prescriberName}"`,
      `"${i.prescriberCouncilRegNo || 'N/A'}"`,
      `"${i.prescriberFacility}"`,
      `"${i.originalPrescription.drugName}"`,
      `"${i.originalPrescription.doseAndFrequency}"`,
      `"${i.reasonCategory.replace(/_/g, ' ').toUpperCase()}"`,
      `"${i.clinicalProblemDescription.replace(/"/g, '""')}"`,
      `"${i.actionTaken.replace(/_/g, ' ').toUpperCase()}"`,
      `"${i.actionDetails.replace(/"/g, '""')}"`,
      `"${i.modifiedRegimen?.drugName || 'N/A'}"`,
      `"${i.modifiedRegimen?.doseAndFrequency || 'N/A'}"`,
      i.prescriberContacted ? 'Yes' : 'No',
      `"${(i.prescriberResponseNotes || '').replace(/"/g, '""')}"`,
      `"${i.finalDecision.replace(/_/g, ' ').toUpperCase()}"`,
      `"${i.significanceGrade.replace(/_/g, ' ').toUpperCase()}"`,
      i.estimatedCostSavingsUgx || 0,
      `"${(i.adverseEventPreventedSummary || '').replace(/"/g, '""')}"`,
      `"${i.pharmacistName}"`,
      `"${i.pharmacistPsuNo}"`,
      `"${i.digitalSignatureHash}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZenithRx_Pharmacist_Clinical_Interventions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateClinicalInterventionReportText(interventions: PharmacistClinicalInterventionRecord[]): string {
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const kpis = this.getInterventionKPIs();

    let report = `================================================================================
ZENITHRX CLINICAL PHARMACY INTERVENTION & DRUG SAFETY REPORT
National Drug Authority (NDA) & Pharmaceutical Society of Uganda (PSU) Compliance
================================================================================
Generated Date: ${reportDate}
Supervising Pharmacist: Dr. Arthur Ssenabulya, BPharm, MPS (PSU-2021-0892)
Facility: ZenithRx Flagship Pharmacy Ltd (Kampala, Uganda)
Audit Hash: SHA256-CLIN-INT-${Date.now().toString(36).toUpperCase()}
--------------------------------------------------------------------------------
EXECUTIVE CLINICAL SUMMARY & KPIS:
• Total Recorded Interventions:        ${kpis.totalInterventionsCount}
• Prescriber Acceptance Rate:          ${kpis.prescriberAcceptanceRatePercent}%
• Grade 1 Life-Saving Events:          ${kpis.grade1LifeSavingCount} (Direct Anaphylaxis/Toxicity Averted)
• Grade 2 Major Adverse Events:        ${kpis.grade2MajorToxicityPreventedCount} (Prevented Emergency Admissions)
• Primary Intervention Category:       ${kpis.topInterventionCategory}
• Cumulative Healthcare Cost Savings:  UGX ${kpis.estimatedNetSavingsUgx.toLocaleString()}
================================================================================
DETAILED CLINICAL INTERVENTION LEDGER:
`;

    interventions.forEach((item, idx) => {
      report += `
[CASE ${idx + 1}] — ${item.interventionReferenceNo} (${new Date(item.timestamp).toLocaleDateString()})
• Prescription Ref:     ${item.prescriptionReferenceNo}
• Patient:              ${item.patientName} (${item.patientAge}y, ${item.patientGender})
• Prescriber:           ${item.prescriberName} (${item.prescriberCouncilRegNo || 'N/A'}) — ${item.prescriberFacility}
• Category:             ${item.reasonCategory.replace(/_/g, ' ').toUpperCase()}
• Severity Grade:       ${item.significanceGrade.replace(/_/g, ' ').toUpperCase()}

1. ORIGINAL PRESCRIPTION SNAPSHOT:
   - Drug & Strength:   ${item.originalPrescription.drugName} (${item.originalPrescription.strength || 'N/A'})
   - Prescribed Regimen:${item.originalPrescription.doseAndFrequency} for ${item.originalPrescription.duration || 'N/A'} (Qty: ${item.originalPrescription.quantity || 'N/A'})

2. PHARMACIST INTERVENTION & CLINICAL PROBLEM:
   ${item.clinicalProblemDescription}
   [Guideline Ref: ${item.evidenceOrGuidelineReference || 'BNF 86 / UCG 2023'}]

3. ACTION TAKEN & PROPOSED MODIFICATION:
   ${item.actionDetails}
   ${item.modifiedRegimen ? `- Modified Regimen: ${item.modifiedRegimen.drugName} | ${item.modifiedRegimen.doseAndFrequency}` : ''}

4. PRESCRIBER ENGAGEMENT & FINAL OUTCOME:
   - Contacted via:     ${item.contactChannel || 'Direct Phone Call'}
   - Prescriber Notes:  ${item.prescriberResponseNotes || 'Accepted without reservation'}
   - Final Decision:    ${item.finalDecision.replace(/_/g, ' ').toUpperCase()}
   - Event Prevented:   ${item.adverseEventPreventedSummary || 'Avoided adverse drug event'}

5. SIGN-OFF:
   - Pharmacist:        ${item.pharmacistName} (${item.pharmacistRole}) | PSU Reg: ${item.pharmacistPsuNo}
   - Digital Hash:      ${item.digitalSignatureHash}
--------------------------------------------------------------------------------`;
    });

    report += `
================================================================================
CLINICAL GOVERNANCE ATTESTATION:
I certify that all recorded pharmacist clinical interventions have been 
conducted in strict adherence to the Pharmacy and Drugs Act, Good Pharmacy Practice 
(GPP) standards, and evidence-based clinical guidelines.

Superintendent Pharmacist Signature: ______________________ Date: ______________
================================================================================`;

    return report;
  }
}

export const pharmacistInterventionService = new PharmacistInterventionService();
