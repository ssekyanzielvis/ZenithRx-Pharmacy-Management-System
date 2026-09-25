/**
 * medicineKnowledgeBaseService.ts — ZenithRx Structured Medicine Knowledge Base & Clinical Decision Engine
 * 
 * CORE ARCHITECTURAL PRINCIPLE:
 * 1. REFERENCE INFORMATION (Static, General Medical Knowledge, Formulary Monographs)
 * 2. CLINICAL DECISION-MAKING (Dynamic, Patient-Contextual, Prescribing Pharmacist Judgement)
 */

export interface DrugInteractionItem {
  interactingDrug: string;
  mechanism: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  management: string;
}

export interface DosageReferences {
  adultStandard: string;
  pediatric: string;
  geriatric: string;
  renalAdjustment: string;
  hepaticAdjustment: string;
  maxDailyCeiling: string;
}

export interface ContraindicationsList {
  absolute: string[];
  relative: string[];
}

export interface SideEffectsProfile {
  common: string[];
  rare: string[];
  blackBox: string[];
}

export interface StorageGuidelines {
  temperatureCelsius: string;
  lightSensitive: boolean;
  hygroscopic: boolean;
  postReconstitutionSuspension: string;
}

export interface AdministrationInstructions {
  timing: string;
  withFood: boolean;
  specialInstructions: string;
}

export interface PatientEducationHandout {
  summary: string;
  keyCounselingPoints: string[];
  missedDoseGuidance: string;
  redFlagSymptoms: string[];
}

export interface MedicineKnowledgeMonograph {
  id: string;
  tenantId: string;
  drugId: string;
  genericName: string;
  brandNames: string[];
  therapeuticClass: string;
  atcCode: string;
  approvedUses: string[];
  offLabelUses: string[];
  dosageReferences: DosageReferences;
  contraindications: ContraindicationsList;
  sideEffects: SideEffectsProfile;
  drugInteractions: DrugInteractionItem[];
  storageGuidelines: StorageGuidelines;
  warningsPrecautions: string[];
  administrationInstructions: AdministrationInstructions;
  patientEducationHandout: PatientEducationHandout;
  lastClinicalReviewDate: string;
  referenceSources: string[];
}

export interface PatientClinicalContext {
  patientId: string;
  patientName: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  weightKg: number;
  egfrMlMin: number; // Renal function
  childPughClass?: 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'NORMAL'; // Hepatic
  isPregnant?: boolean;
  isLactating?: boolean;
  knownAllergies: string[];
  concurrentMedications: string[];
  diagnosedConditions: string[];
}

export interface ClinicalDecisionRisk {
  category: 'ALLERGY_CONTRAINDICATION' | 'RENAL_DOSAGE_MISMATCH' | 'SEVERE_DDI' | 'ORGAN_TOXICITY' | 'DUPLICATE_THERAPY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  clinicalExplanation: string;
  evidenceBasedAction: string;
}

export interface ClinicalDecisionOutcome {
  id: string;
  patientContext: PatientClinicalContext;
  targetDrug: MedicineKnowledgeMonograph;
  prescribedDose: string;
  decisionRecommendation: 'DISPENSE_AS_IS' | 'DOSE_ADJUSTMENT_REQUIRED' | 'CONTRAINDICATED_SUBSTITUTE' | 'COUNSEL_WITH_MONITORING';
  recommendedAdjustedDosage?: string;
  risksIdentified: ClinicalDecisionRisk[];
  pharmacistActionSummary: string;
  monitoringParameters: string[];
  evaluatedAt: string;
}

const STORAGE_KEY_KNOWLEDGE_MONOGRAPHS = 'zenithrx_medicine_knowledge_monographs_v1';
const STORAGE_KEY_CLINICAL_DECISION_LOGS = 'zenithrx_clinical_decision_evaluations_v1';

export const INITIAL_KNOWLEDGE_MONOGRAPHS: MedicineKnowledgeMonograph[] = [
  // 1. Amoxicillin + Clavulanic Acid
  {
    id: 'mono-amox-clav',
    tenantId: 'client-001',
    drugId: 'drug-amox-clav-625',
    genericName: 'Amoxicillin + Clavulanic Acid (Co-amoxiclav)',
    brandNames: ['Augmentin', 'Curam', 'Clavam', 'Amoksiklav'],
    therapeuticClass: 'Beta-Lactam Antibacterial / Penicillin with Beta-Lactamase Inhibitor',
    atcCode: 'J01CR02',
    approvedUses: [
      'Acute bacterial sinusitis',
      'Community-acquired pneumonia (CAP)',
      'Acute otitis media in children & adults',
      'Complicated urinary tract infections (UTI)',
      'Skin, wound, and soft tissue infections',
      'Animal and human bite wound prophylaxis'
    ],
    offLabelUses: [
      'Deep facial dental abscess spreading to facial fascial spaces',
      'Acute exacerbation of Chronic Obstructive Pulmonary Disease (AECOPD)'
    ],
    dosageReferences: {
      adultStandard: '625mg tablet orally every 12 hours (or 1g 12-hourly for severe infections)',
      pediatric: '25-45 mg/kg/day (based on amoxicillin) divided every 12 hours',
      geriatric: 'No initial adjustment unless eGFR <30 mL/min is confirmed',
      renalAdjustment: 'eGFR 10-30 mL/min: 625mg 12-hourly; eGFR <10 mL/min: 625mg every 24 hours; Hemodialysis: 625mg post-dialysis',
      hepaticAdjustment: 'Dose with caution; perform baseline and periodic liver enzyme tests in extended therapy',
      maxDailyCeiling: 'Amoxicillin 3000mg / Clavulanate 750mg in 24 hours'
    },
    contraindications: {
      absolute: [
        'Confirmed history of severe penicillin/beta-lactam anaphylaxis or angioedema',
        'History of co-amoxiclav associated cholestatic jaundice or acute hepatic dysfunction'
      ],
      relative: [
        'Infectious mononucleosis (high risk of erythematous morbilliform rash)',
        'Concurrent allopurinol therapy (elevated cutaneous hypersensitivity risk)'
      ]
    },
    sideEffects: {
      common: [
        'Diarrhea & loose stools (10-15%)',
        'Nausea, vomiting, and epigastric discomfort',
        'Mucocutaneous candidiasis (oral/vaginal thrush)'
      ],
      rare: [
        'Cholestatic jaundice / acute hepatitis (0.05%)',
        'Clostridioides difficile-associated pseudomembranous colitis',
        'Stevens-Johnson syndrome / Toxic Epidermal Necrolysis'
      ],
      blackBox: [
        'Severe hypersensitivity / anaphylactic shock risk in penicillin-sensitized individuals'
      ]
    },
    drugInteractions: [
      {
        interactingDrug: 'Methotrexate',
        mechanism: 'Penicillins competitively inhibit renal organic anion tubular secretion of methotrexate',
        severity: 'HIGH',
        management: 'Avoid co-administration; if unavoidable, monitor serum methotrexate levels and neutrophil count'
      },
      {
        interactingDrug: 'Oral Anticoagulants (Warfarin)',
        mechanism: 'Eradication of gut flora synthesizing Vitamin K enhances anticoagulant response',
        severity: 'MEDIUM',
        management: 'Monitor International Normalized Ratio (INR) on initiation and cessation of antibiotic'
      },
      {
        interactingDrug: 'Allopurinol',
        mechanism: 'Additive hyper-reactivity of skin rashes',
        severity: 'LOW',
        management: 'Counsel patient to report any skin rash immediately'
      }
    ],
    storageGuidelines: {
      temperatureCelsius: 'Store below 25°C in original dry packaging',
      lightSensitive: false,
      hygroscopic: true,
      postReconstitutionSuspension: 'Refrigerate suspension at 2°C - 8°C; strictly discard unused portion after 7 days'
    },
    warningsPrecautions: [
      'Prolonged therapy may result in fungal or bacterial superinfection',
      'Maintain generous fluid intake and urinary output to reduce amoxicillin crystalluria risk',
      'Clavulanate-associated liver injury is more common in elderly males (>65 years) and with prolonged courses'
    ],
    administrationInstructions: {
      timing: 'Take at the start of a meal or with the first bite of food',
      withFood: true,
      specialInstructions: 'Taking with food significantly reduces gastrointestinal intolerance and optimizes clavulanic acid bioavailability.'
    },
    patientEducationHandout: {
      summary: 'Co-amoxiclav is an effective antibiotic prescribed to kill bacteria causing lung, ear, sinus, skin, and urinary tract infections.',
      keyCounselingPoints: [
        'Take each tablet with a meal or snack to protect your stomach from nausea or loose stools.',
        'Space your doses evenly (every 12 hours, e.g. 8:00 AM and 8:00 PM).',
        'Finish the full course prescribed by your doctor even if you feel completely recovered after 3 days.',
        'Inform your pharmacist immediately if you develop a skin rash, swelling, or severe watery diarrhea.'
      ],
      missedDoseGuidance: 'Take the missed dose as soon as you remember with food. If your next scheduled dose is less than 4 hours away, skip the missed dose. Never take a double dose.',
      redFlagSymptoms: [
        'Difficulty breathing, wheezing, swelling of face, lips or throat (Emergency ER immediately)',
        'Severe watery diarrhea with intense abdominal cramps and fever',
        'Yellowing of skin or whites of eyes (jaundice)'
      ]
    },
    lastClinicalReviewDate: '2026-08-15',
    referenceSources: [
      'Uganda Clinical Guidelines (UCG) 2023',
      'British National Formulary (BNF 86)',
      'WHO Model Formulary 2024'
    ]
  },

  // 2. Metformin Hydrochloride
  {
    id: 'mono-metformin',
    tenantId: 'client-001',
    drugId: 'drug-metformin-500',
    genericName: 'Metformin Hydrochloride',
    brandNames: ['Glucophage', 'Formet', 'Diabex', 'Siofor'],
    therapeuticClass: 'Oral Biguanide Antihyperglycemic Agent',
    atcCode: 'A10BA02',
    approvedUses: [
      'Type 2 Diabetes Mellitus monotherapy or combination with sulfonylureas/SGLT2/insulin',
      'Prevention of type 2 diabetes in high-risk prediabetes patients'
    ],
    offLabelUses: [
      'Polycystic Ovary Syndrome (PCOS) insulin resistance & ovulatory induction',
      'Gestational diabetes second-line management'
    ],
    dosageReferences: {
      adultStandard: 'Initiate 500mg once or twice daily with meals; titrate weekly up to 1000mg twice daily',
      pediatric: 'Children >=10 years: 500mg daily, titrate to max 2000mg/day in divided doses',
      geriatric: 'Assess baseline eGFR prior to initiation; conservative dose titration',
      renalAdjustment: 'eGFR 45-59 mL/min: Max 1000mg/day; eGFR 30-44 mL/min: Max 500mg/day; eGFR <30 mL/min: STRICTLY CONTRAINDICATED (lactic acidosis risk)',
      hepaticAdjustment: 'Avoid in acute or severe hepatic impairment due to impaired lactate clearance',
      maxDailyCeiling: '2550mg/day (immediate-release) or 2000mg/day (extended-release)'
    },
    contraindications: {
      absolute: [
        'Severe renal failure or impairment (eGFR <30 mL/min)',
        'Acute or chronic metabolic acidosis, including diabetic ketoacidosis (DKA)',
        'Acute conditions with hypoxemia or tissue hypoperfusion (decompensated heart failure, cardiogenic shock, sepsis)'
      ],
      relative: [
        'Iodinated radiocontrast procedures (withhold 48 hours before and after)',
        'Excessive acute or chronic alcohol ingestion'
      ]
    },
    sideEffects: {
      common: [
        'Gastrointestinal disturbances (diarrhea, nausea, flatulence, abdominal cramps) (20-30%)',
        'Metallic taste in mouth',
        'Vitamin B12 malabsorption with long-term therapy (7-10%)'
      ],
      rare: [
        'Lactic acidosis (0.03 cases per 1,000 patient-years, 50% mortality rate)',
        'Hemolytic anemia'
      ],
      blackBox: [
        'Lactic Acidosis: Rare but fatal metabolic complication caused by metformin accumulation in renal failure or severe sepsis.'
      ]
    },
    drugInteractions: [
      {
        interactingDrug: 'Iodinated Radiocontrast Media',
        mechanism: 'Contrast-induced acute nephropathy causes toxic metformin accumulation and lactic acidosis',
        severity: 'CRITICAL',
        management: 'Discontinue metformin prior to imaging; verify eGFR 48 hours post-procedure before restarting'
      },
      {
        interactingDrug: 'Ciprofloxacin / Cimetidine / Ranolazine',
        mechanism: 'OCT2 transporter inhibition decreases renal clearance of metformin, increasing AUC by 40-60%',
        severity: 'MEDIUM',
        management: 'Monitor blood glucose and symptoms of lactic acidosis; consider lowering metformin dose'
      },
      {
        interactingDrug: 'Alcohol (Ethanol)',
        mechanism: 'Ethanol potentiates metformin effect on lactate metabolism and inhibits hepatic gluconeogenesis',
        severity: 'HIGH',
        management: 'Warn patient against heavy alcohol consumption or binge drinking'
      }
    ],
    storageGuidelines: {
      temperatureCelsius: 'Store at 15°C - 30°C in a dry place',
      lightSensitive: false,
      hygroscopic: false,
      postReconstitutionSuspension: 'N/A'
    },
    warningsPrecautions: [
      'Assess renal function (eGFR) at least annually in all patients and twice yearly in elderly patients',
      'Temporary discontinuation required during acute dehydrating illness (vomiting, diarrhea, high fever)',
      'Monitor serum Vitamin B12 levels every 2-3 years for early detection of peripheral neuropathy'
    ],
    administrationInstructions: {
      timing: 'Take with or immediately after main meals (breakfast and dinner)',
      withFood: true,
      specialInstructions: 'Swallow extended-release tablets whole; do not chew, crush, or split.'
    },
    patientEducationHandout: {
      summary: 'Metformin lowers your blood sugar by reducing glucose production in the liver and helping your body respond better to natural insulin.',
      keyCounselingPoints: [
        'Always take your tablets with meals to minimize stomach upset and diarrhea.',
        'Mild stomach cramps or loose stools are common during the first 1-2 weeks but fade as your body adjusts.',
        'Drink plenty of water every day to stay well hydrated.',
        'Avoid heavy alcohol drinking while taking this medication.'
      ],
      missedDoseGuidance: 'Take the missed dose with your next meal. If it is already time for your next scheduled dose, take only that dose. Never take 2 doses together.',
      redFlagSymptoms: [
        'Unusual muscle pain, severe weakness, difficulty breathing, slow heartbeat, or feeling extremely cold (Lactic Acidosis warning - go to hospital immediately)',
        'Severe dizziness or loss of consciousness'
      ]
    },
    lastClinicalReviewDate: '2026-08-20',
    referenceSources: [
      'American Diabetes Association (ADA) Standards of Care 2024',
      'Uganda Clinical Guidelines (UCG) 2023',
      'NICE Guidelines [NG28] Type 2 Diabetes'
    ]
  },

  // 3. Ciprofloxacin Hydrochloride
  {
    id: 'mono-cipro',
    tenantId: 'client-001',
    drugId: 'drug-cipro-500',
    genericName: 'Ciprofloxacin Hydrochloride',
    brandNames: ['Cipro', 'Cifran', 'Ciproxin', 'Ciplox'],
    therapeuticClass: 'Second-Generation Fluoroquinolone Antibacterial',
    atcCode: 'J01MA02',
    approvedUses: [
      'Complicated urinary tract infections and pyelonephritis',
      'Severe bacterial gastroenteritis / typhoid fever (Salmonella enterica)',
      'Bone and joint infections (osteomyelitis)',
      'Inhalation anthrax post-exposure prophylaxis',
      'Complicated intra-abdominal infections (with metronidazole)'
    ],
    offLabelUses: [
      'Empiric traveler diarrhea severe dysentery treatment',
      'Prophylaxis of meningococcal meningitis close contacts'
    ],
    dosageReferences: {
      adultStandard: '500mg tablet orally every 12 hours for 5-14 days (or 750mg 12-hourly for severe osteomyelitis)',
      pediatric: 'Generally restricted due to arthropathy risk; if indicated: 10-20 mg/kg 12-hourly (max 750mg/dose)',
      geriatric: 'Assess baseline renal function; higher risk of tendon rupture and CNS confusion',
      renalAdjustment: 'eGFR 30-50 mL/min: 250-500mg 12-hourly; eGFR <30 mL/min: 250-500mg every 18-24 hours',
      hepaticAdjustment: 'No dose adjustment required in hepatic impairment without concurrent renal failure',
      maxDailyCeiling: '1500mg in 24 hours (Oral)'
    },
    contraindications: {
      absolute: [
        'Hypersensitivity to ciprofloxacin or other quinolones/fluoroquinolones',
        'Concurrent administration with Tizanidine (severe hypotension & somnolence)'
      ],
      relative: [
        'Myasthenia gravis (Black box warning for muscle weakness exacerbation)',
        'History of tendon disorders related to fluoroquinolone administration',
        'Known QT interval prolongation or concurrent class IA/III antiarrhythmics'
      ]
    },
    sideEffects: {
      common: [
        'Nausea, diarrhea, dyspepsia',
        'Headache, dizziness, insomnia',
        'Photosensitivity / exaggerated sunburn rash'
      ],
      rare: [
        'Tendinitis and Achilles tendon rupture (can occur months post-therapy)',
        'QTc prolongation and Torsades de Pointes',
        'Peripheral neuropathy (potentially irreversible)',
        'Aortic aneurysm and dissection'
      ],
      blackBox: [
        'Disabling and potentially irreversible adverse reactions including tendinitis, peripheral neuropathy, and CNS toxicities. Avoid in uncomplicated UTIs/sinusitis when alternatives exist.'
      ]
    },
    drugInteractions: [
      {
        interactingDrug: 'Antacids / Iron / Zinc / Calcium Supplements',
        mechanism: 'Polyvalent cations chelate ciprofloxacin in the gut, reducing oral absorption by up to 85%',
        severity: 'HIGH',
        management: 'Administer ciprofloxacin at least 2 hours before or 6 hours after cation-containing antacids or minerals'
      },
      {
        interactingDrug: 'Theophylline',
        mechanism: 'CYP1A2 inhibition elevates theophylline serum concentration into toxic ranges',
        severity: 'HIGH',
        management: 'Reduce theophylline dose by 50% and monitor serum theophylline concentrations'
      },
      {
        interactingDrug: 'Warfarin',
        mechanism: 'Potentiation of anticoagulant effect through CYP inhibition and altered intestinal flora',
        severity: 'MEDIUM',
        management: 'Monitor INR frequently'
      }
    ],
    storageGuidelines: {
      temperatureCelsius: 'Store at 15°C - 30°C in a dry place protected from direct sunlight',
      lightSensitive: true,
      hygroscopic: false,
      postReconstitutionSuspension: 'Stable at room temperature for 14 days (do not freeze)'
    },
    warningsPrecautions: [
      'Discontinue immediately at first sign of tendon pain, swelling, or inflammation',
      'Avoid excessive exposure to sunlight or ultraviolet lamps during therapy',
      'Maintain vigorous hydration to prevent fluoroquinolone crystalluria in alkaline urine'
    ],
    administrationInstructions: {
      timing: 'Take 2 hours before or 6 hours after dairy products (milk/yogurt) or calcium-fortified juices',
      withFood: false,
      specialInstructions: 'May be taken with or without food, but avoid taking alone with dairy products alone as dietary calcium impairs absorption.'
    },
    patientEducationHandout: {
      summary: 'Ciprofloxacin is a broad-spectrum antibiotic prescribed to eradicate serious bacterial infections in the urine, kidneys, stomach, and bones.',
      keyCounselingPoints: [
        'Do not take antacids (magnesium/aluminum), iron tablets, or multivitamins within 2 hours of this medicine.',
        'Drink plenty of water every day while taking ciprofloxacin.',
        'Protect your skin from direct sunlight; wear hats or sunscreen.',
        'Stop taking this medicine and call your doctor immediately if you feel pain or swelling in your ankle or calf.'
      ],
      missedDoseGuidance: 'Take the missed dose as soon as you remember. If it is within 6 hours of your next scheduled dose, skip the missed dose and resume your regular schedule.',
      redFlagSymptoms: [
        'Sudden pain, snapping sound, or swelling in your ankle, heel, or calf (Achilles tendon warning)',
        'Burning, tingling, numbness, or shooting pain in your fingers or toes (Nerve damage warning)',
        'Irregular heartbeat, severe dizziness, or fainting'
      ]
    },
    lastClinicalReviewDate: '2026-08-22',
    referenceSources: [
      'FDA Drug Safety Communication on Fluoroquinolones',
      'Uganda Clinical Guidelines (UCG) 2023',
      'BNF 86 Fluoroquinolone Guidance'
    ]
  },

  // 4. Morphine Sulphate (Class A Controlled Safe Monograph)
  {
    id: 'mono-morphine',
    tenantId: 'client-001',
    drugId: 'drug-morphine-10',
    genericName: 'Morphine Sulphate (Class A Narcotic)',
    brandNames: ['MST Continus', 'Sevredol', 'Oramorph', 'Morphine Ampoules'],
    therapeuticClass: 'Pure Mu-Opioid Receptor Agonist Analgesic',
    atcCode: 'N02AA01',
    approvedUses: [
      'Severe chronic pain in cancer palliative care',
      'Acute severe post-operative and trauma pain',
      'Acute pulmonary edema (relieves dyspnea and anxiety)',
      'Pain management in acute myocardial infarction'
    ],
    offLabelUses: [
      'Refractory chronic breathlessness in advanced end-stage COPD'
    ],
    dosageReferences: {
      adultStandard: 'Oral: 10-20mg every 4 hours PRN (or MST 30mg 12-hourly); Injectable: 5-10mg SC/IM/IV 4-hourly',
      pediatric: 'Oral: 0.2-0.5 mg/kg every 4 hours; SC/IV: 0.1 mg/kg 4-hourly under specialist palliative supervision',
      geriatric: 'Reduce initial starting dose by 50%; titrate slowly due to increased CNS and respiratory sensitivity',
      renalAdjustment: 'eGFR 30-50 mL/min: Reduce dose by 25-50%; eGFR <30 mL/min: Reduce dose by 50-75% or switch to fentanyl (toxic metabolite M6G/M3G accumulation risk)',
      hepaticAdjustment: 'Reduce dose or extend dosing interval; oral bioavailability increases markedly in cirrhosis',
      maxDailyCeiling: 'No pharmacologic ceiling in opioid-tolerant palliative care; titrate strictly to pain relief'
    },
    contraindications: {
      absolute: [
        'Severe acute respiratory depression or acute respiratory failure',
        'Acute or severe bronchial asthma in unmonitored settings',
        'Paralytic ileus or suspected gastrointestinal obstruction',
        'Concurrent or within 14 days of Monoamine Oxidase Inhibitors (MAOIs)'
      ],
      relative: [
        'Raised intracranial pressure or head injury (masks pupillary signs)',
        'Severe chronic constipation or inflammatory bowel disease',
        'Known biliary colic or acute pancreatitis'
      ]
    },
    sideEffects: {
      common: [
        'Constipation (universal - requires routine co-prescribed stimulant laxative)',
        'Sedation, drowsiness, lightheadedness',
        'Nausea and vomiting (common on initiation, subsides within 3-5 days)',
        'Pruritus / histamine release itching'
      ],
      rare: [
        'Life-threatening respiratory depression',
        'Opioid-induced hyperalgesia (OIH)',
        'Severe hypotension and bradycardia'
      ],
      blackBox: [
        'Addiction, Abuse, and Misuse warning. Life-threatening respiratory depression. Concomitant use with Benzodiazepines or alcohol markedly increases fatal overdose risk.'
      ]
    },
    drugInteractions: [
      {
        interactingDrug: 'Benzodiazepines (Diazepam, Lorazepam) / CNS Depressants',
        mechanism: 'Synergistic CNS and respiratory center depression in the brainstem',
        severity: 'CRITICAL',
        management: 'Avoid concurrent use unless no alternative exists; limit dosage and duration; keep Naloxone antidote accessible'
      },
      {
        interactingDrug: 'Monoamine Oxidase Inhibitors (MAOIs)',
        mechanism: 'Massive serotonin syndrome or severe CNS excitation / fatal hyperpyrexia',
        severity: 'CRITICAL',
        management: 'Contraindicated within 14 days of MAOI cessation'
      },
      {
        interactingDrug: 'Anticholinergics (Atropine, Hyoscine)',
        mechanism: 'Additive anticholinergic slowing of gut motility increases risk of paralytic ileus and urinary retention',
        severity: 'MEDIUM',
        management: 'Monitor bowel function and urinary output closely'
      }
    ],
    storageGuidelines: {
      temperatureCelsius: 'Store at 15°C - 30°C in Uganda NDA Class A Locked Controlled Substance Safe',
      lightSensitive: true,
      hygroscopic: false,
      postReconstitutionSuspension: 'N/A'
    },
    warningsPrecautions: [
      'Under Uganda NDA Regulations 1970, strictly requires dual-pharmacist register sign-off and patient NIN verification',
      'Always co-prescribe a prophylactic laxative (e.g. Senna + Docusate) and antiemetic upon initiation',
      'Taper gradually when discontinuing chronic therapy to prevent opioid withdrawal syndrome'
    ],
    administrationInstructions: {
      timing: 'Take on a regular schedule around the clock for chronic palliative pain, or PRN for acute breakthrough pain',
      withFood: true,
      specialInstructions: 'Swallow modified-release tablets (MST) whole; crushing or chewing causes rapid fatal dose-dumping.'
    },
    patientEducationHandout: {
      summary: 'Morphine is a strong opioid medicine prescribed to provide powerful relief from severe pain when other painkillers are insufficient.',
      keyCounselingPoints: [
        'Take strictly at the exact dose and schedule prescribed by your doctor.',
        'This medicine causes constipation; always take your prescribed laxative and drink plenty of water.',
        'Do not drive, operate machinery, or drink alcohol while taking morphine as it causes drowsiness.',
        'Never share this medicine with anyone else; store safely in a locked location.'
      ],
      missedDoseGuidance: 'If taking on a regular schedule and you miss a dose, take it as soon as remembered. If close to next dose, skip and stay on schedule. Never double up.',
      redFlagSymptoms: [
        'Severe sleepiness, slurred speech, slow or shallow breathing (Emergency Overdose warning - call ER / administer Naloxone)',
        'Severe inability to urinate or complete absence of bowel movements for over 3 days'
      ]
    },
    lastClinicalReviewDate: '2026-09-01',
    referenceSources: [
      'Uganda Palliative Care Guidelines 2023',
      'WHO Guidelines for the Pharmacological and Radiotherapeutic Management of Cancer Pain',
      'NDA Class A Narcotic Schedule Regulations'
    ]
  }
];

export const getMedicineKnowledgeMonographs = (tenantId?: string): MedicineKnowledgeMonograph[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KNOWLEDGE_MONOGRAPHS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_KNOWLEDGE_MONOGRAPHS, JSON.stringify(INITIAL_KNOWLEDGE_MONOGRAPHS));
      return tenantId ? INITIAL_KNOWLEDGE_MONOGRAPHS.filter(i => i.tenantId === tenantId) : INITIAL_KNOWLEDGE_MONOGRAPHS;
    }
    const all: MedicineKnowledgeMonograph[] = JSON.parse(raw);
    return tenantId ? all.filter(i => i.tenantId === tenantId) : all;
  } catch {
    return INITIAL_KNOWLEDGE_MONOGRAPHS;
  }
};

export const getMonographById = (id: string): MedicineKnowledgeMonograph | null => {
  const all = getMedicineKnowledgeMonographs();
  return all.find(m => m.id === id || m.drugId === id || m.genericName.toLowerCase().includes(id.toLowerCase())) || null;
};

/**
 * CLINICAL DECISION-MAKING ENGINE
 * Evaluates reference information against a dynamic, contextual patient profile.
 */
export const evaluateClinicalDecision = (
  patient: PatientClinicalContext,
  targetDrug: MedicineKnowledgeMonograph,
  prescribedDose: string,
  pharmacistName: string,
  pharmacistLicense: string
): ClinicalDecisionOutcome => {
  const risks: ClinicalDecisionRisk[] = [];
  let recommendation: ClinicalDecisionOutcome['decisionRecommendation'] = 'DISPENSE_AS_IS';
  let suggestedDose: string | undefined = undefined;
  const monitoringParams: string[] = [];

  // 1. Check Allergy Contraindications
  const normalizedAllergies = patient.knownAllergies.map(a => a.toLowerCase());
  if (
    (targetDrug.genericName.toLowerCase().includes('amoxicillin') || targetDrug.therapeuticClass.toLowerCase().includes('penicillin')) &&
    normalizedAllergies.some(a => a.includes('penicillin') || a.includes('amox') || a.includes('beta-lactam'))
  ) {
    risks.push({
      category: 'ALLERGY_CONTRAINDICATION',
      severity: 'CRITICAL',
      title: 'Life-Threatening Penicillin Hypersensitivity Detected',
      clinicalExplanation: `Patient has documented allergy: "${patient.knownAllergies.join(', ')}". Co-amoxiclav contains penicillin core beta-lactam ring with extreme anaphylaxis risk.`,
      evidenceBasedAction: 'STRICTLY CONTRAINDICATED. Must substitute with non-beta-lactam class (e.g. Azithromycin or Clarithromycin or Doxycycline).'
    });
    recommendation = 'CONTRAINDICATED_SUBSTITUTE';
  }

  // 2. Check Renal Function Adjustments (eGFR)
  if (targetDrug.drugId === 'drug-metformin-500') {
    if (patient.egfrMlMin < 30) {
      risks.push({
        category: 'RENAL_DOSAGE_MISMATCH',
        severity: 'CRITICAL',
        title: 'Severe Renal Impairment (eGFR <30 mL/min) - Lactic Acidosis Risk',
        clinicalExplanation: `Patient eGFR is ${patient.egfrMlMin} mL/min/1.73m2. Metformin clearance is critically impaired, causing dangerous biguanide accumulation and fatal lactic acidosis.`,
        evidenceBasedAction: 'STRICTLY CONTRAINDICATED. Discontinue Metformin and substitute with renal-safe antidiabetic (e.g. Linagliptin or Insulin).'
      });
      recommendation = 'CONTRAINDICATED_SUBSTITUTE';
    } else if (patient.egfrMlMin >= 30 && patient.egfrMlMin < 45) {
      risks.push({
        category: 'RENAL_DOSAGE_MISMATCH',
        severity: 'HIGH',
        title: 'Moderate-Severe Renal Impairment (eGFR 30-44 mL/min) - Dose Ceiling Exceeded',
        clinicalExplanation: `Patient eGFR is ${patient.egfrMlMin} mL/min/1.73m2. Standard reference maximum daily dose in this renal tranche is 500mg/day. Prescribed dose: "${prescribedDose}".`,
        evidenceBasedAction: 'Dose adjustment required: Cap maximum dose at 500mg once daily with evening meal.'
      });
      if (recommendation !== 'CONTRAINDICATED_SUBSTITUTE') {
        recommendation = 'DOSE_ADJUSTMENT_REQUIRED';
        suggestedDose = '500mg once daily with main meal';
      }
      monitoringParams.push('Serum Creatinine & eGFR in 3 months', 'Lactic acidosis symptoms triage');
    }
  }

  // Renal check for Morphine
  if (targetDrug.drugId === 'drug-morphine-10' && patient.egfrMlMin < 30) {
    risks.push({
      category: 'ORGAN_TOXICITY',
      severity: 'HIGH',
      title: 'Renal Clearance Failure - Morphine-6-Glucuronide (M6G) Neurotoxicity',
      clinicalExplanation: `Patient eGFR is ${patient.egfrMlMin} mL/min/1.73m2. Active metabolites M6G and M3G accumulate rapidly in renal failure, leading to prolonged narcosis, myoclonus, and severe respiratory depression.`,
      evidenceBasedAction: 'Reduce dose by 50-75%, extend interval to 8-12 hours, or switch to non-renally cleared opioid (Fentanyl).'
    });
    if (recommendation !== 'CONTRAINDICATED_SUBSTITUTE') {
      recommendation = 'DOSE_ADJUSTMENT_REQUIRED';
      suggestedDose = '5mg every 8-12 hours PRN with Naloxone at bedside';
    }
    monitoringParams.push('Respiratory rate (<10 bpm alert)', 'Sedation score', 'Myoclonus / twitching');
  }

  // 3. Check Drug-Drug Interactions with Patient's Active Regimen
  patient.concurrentMedications.forEach(currentMed => {
    const ddiMatch = targetDrug.drugInteractions.find(
      ddi => currentMed.toLowerCase().includes(ddi.interactingDrug.toLowerCase()) || ddi.interactingDrug.toLowerCase().includes(currentMed.toLowerCase())
    );

    if (ddiMatch) {
      risks.push({
        category: 'SEVERE_DDI',
        severity: ddiMatch.severity,
        title: `Concurrent Interaction: ${targetDrug.genericName} + ${currentMed}`,
        clinicalExplanation: `Mechanism: ${ddiMatch.mechanism}`,
        evidenceBasedAction: ddiMatch.management
      });

      if (ddiMatch.severity === 'CRITICAL' && recommendation !== 'CONTRAINDICATED_SUBSTITUTE') {
        recommendation = 'CONTRAINDICATED_SUBSTITUTE';
      } else if (recommendation === 'DISPENSE_AS_IS') {
        recommendation = 'COUNSEL_WITH_MONITORING';
      }
      monitoringParams.push(`Monitor interaction parameters for ${currentMed}`);
    }
  });

  // Default monitoring
  if (monitoringParams.length === 0) {
    monitoringParams.push('Standard treatment response assessment', 'Adverse drug reaction triage');
  }

  let summary = '';
  if (recommendation === 'DISPENSE_AS_IS') {
    summary = `Prescription evaluated against patient profile. No contraindications, renal mismatch, or critical interactions detected. Safe to dispense as prescribed (${prescribedDose}).`;
  } else if (recommendation === 'DOSE_ADJUSTMENT_REQUIRED') {
    summary = `Patient-specific clinical risk identified (e.g. reduced eGFR). Dosage adjusted from "${prescribedDose}" to evidence-based safe regimen: "${suggestedDose}".`;
  } else if (recommendation === 'CONTRAINDICATED_SUBSTITUTE') {
    summary = `Absolute clinical contraindication or severe interaction detected. Prescription CANNOT be dispensed safely in its current form. Clinical intervention with prescriber required.`;
  } else {
    summary = `Prescription can be dispensed with targeted clinical monitoring and specialized patient counseling on specific interaction risks.`;
  }

  const outcome: ClinicalDecisionOutcome = {
    id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patientContext: patient,
    targetDrug,
    prescribedDose,
    decisionRecommendation: recommendation,
    recommendedAdjustedDosage: suggestedDose,
    risksIdentified: risks,
    pharmacistActionSummary: summary,
    monitoringParameters: monitoringParams,
    evaluatedAt: new Date().toISOString()
  };

  // Save to log
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLINICAL_DECISION_LOGS);
    const logs: ClinicalDecisionOutcome[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(STORAGE_KEY_CLINICAL_DECISION_LOGS, JSON.stringify([outcome, ...logs]));
  } catch (e) {
    console.error('Failed to log clinical decision evaluation', e);
  }

  return outcome;
};

export const getPastClinicalEvaluations = (): ClinicalDecisionOutcome[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLINICAL_DECISION_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
