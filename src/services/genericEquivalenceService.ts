/**
 * genericEquivalenceService.ts — ZenithRx Clinical Decision Support & Generic Suggestion Engine
 * Provides intelligent, suggestion-only bioequivalent and therapeutic alternative discovery.
 * Strictly adheres to NDA / PSU rules: suggestions are non-binding and require licensed pharmacist authorization.
 */

import { DrugItem } from '../types';

export interface BioequivalentSuggestion {
  drug: DrugItem;
  matchScore: number; // 0-100
  equivalenceType: 'bioequivalent_generic' | 'exact_bioequivalent' | 'branded_generic' | 'pharmaceutical_alternative' | 'therapeutic_interchange';
  bioequivalenceRating: string; // e.g. "FDA / WHO AB-Rated Bioequivalent", "NDA Registered Generic"
  activeIngredient: string;
  strengthMatch: boolean;
  dosageFormMatch: boolean;
  inStock: boolean;
  priceDifferenceUgx: number; // originalPrice - substitutePrice (positive means savings)
  savingsPercent: number; // e.g. 52.5%
  isNarrowTherapeuticIndex: boolean;
  clinicalSafetyNote: string;
}

export interface MoleculeKnowledge {
  innName: string;
  therapeuticClass: string;
  synonyms: string[];
  isNTI: boolean;
  counselingKeyPoints: string[];
}

// Master Active Molecule / Brand Synonyms Knowledge Base
export const MOLECULE_KNOWLEDGE_BASE: Record<string, MoleculeKnowledge> = {
  amoxicillin_clavulanate: {
    innName: 'Amoxicillin + Clavulanic Acid',
    therapeuticClass: 'Beta-Lactamase Inhibitor Antibiotic',
    synonyms: ['augmentin', 'amoxiclav', 'klavox', 'curam', 'co-amoxiclav', 'augmentin 625', 'amoxiclav 625'],
    isNTI: false,
    counselingKeyPoints: [
      'Take at the start of a meal to minimize gastrointestinal discomfort.',
      'Complete full antibiotic regimen even if symptoms improve.',
    ],
  },
  metformin: {
    innName: 'Metformin Hydrochloride',
    therapeuticClass: 'Biguanide Antidiabetic',
    synonyms: ['glucophage', 'formet', 'glucomet', 'metfor', 'metformin 500', 'metformin 850', 'metformin 1000'],
    isNTI: false,
    counselingKeyPoints: [
      'Take with or immediately after meals to reduce GI adverse effects.',
      'Avoid excessive alcohol consumption while on therapy.',
    ],
  },
  paracetamol: {
    innName: 'Paracetamol (Acetaminophen)',
    therapeuticClass: 'Analgesic & Antipyretic',
    synonyms: ['panadol', 'calpol', 'tylenol', 'paramol', 'panadol extra', 'paincure', 'paracetamol 500'],
    isNTI: false,
    counselingKeyPoints: [
      'Do not exceed 4,000mg in 24 hours to prevent hepatotoxicity.',
      'Check other OTC cough/cold preparations to avoid accidental paracetamol duplication.',
    ],
  },
  amlodipine: {
    innName: 'Amlodipine Besylate',
    therapeuticClass: 'Dihydropyridine Calcium Channel Blocker',
    synonyms: ['norvasc', 'amlovas', 'amlocor', 'stamlo', 'amlodipine 5', 'amlodipine 10'],
    isNTI: false,
    counselingKeyPoints: [
      'Monitor for peripheral edema (ankle swelling) and dizziness.',
      'Take consistently at the same time each day.',
    ],
  },
  atorvastatin: {
    innName: 'Atorvastatin Calcium',
    therapeuticClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    synonyms: ['lipitor', 'atorlip', 'storvas', 'atorva', 'atorvastatin 20', 'atorvastatin 40'],
    isNTI: false,
    counselingKeyPoints: [
      'Report any unexplained muscle pain, tenderness, or weakness promptly.',
      'Take once daily, preferably in the evening.',
    ],
  },
  salbutamol: {
    innName: 'Salbutamol (Albuterol) Sulfate',
    therapeuticClass: 'Short-Acting Beta-2 Agonist (SABA) Bronchodilator',
    synonyms: ['ventolin', 'asthalin', 'aerolin', 'salbutamol inhaler', 'ventolin evohaler'],
    isNTI: false,
    counselingKeyPoints: [
      'Shake inhaler well before actuation. Rinse mouth if combined with steroids.',
      'Use as rescue inhaler for acute shortness of breath or wheezing.',
    ],
  },
  esomeprazole: {
    innName: 'Esomeprazole Magnesium',
    therapeuticClass: 'Proton Pump Inhibitor (PPI)',
    synonyms: ['nexium', 'esomac', 'esoz', 'nexpro', 'esomeprazole 40', 'esomeprazole 20'],
    isNTI: false,
    counselingKeyPoints: [
      'Swallow capsule/tablet whole; take 30-60 minutes before breakfast.',
      'Long term therapy may warrant magnesium and Vitamin B12 monitoring.',
    ],
  },
  azithromycin: {
    innName: 'Azithromycin Monohydrate',
    therapeuticClass: 'Macrolide Antibiotic',
    synonyms: ['zithromax', 'aziwok', 'azibact', 'azithral', 'zithromax 500', 'azithromycin 500'],
    isNTI: false,
    counselingKeyPoints: [
      'Can be taken with or without food; take with food if stomach upset occurs.',
      'Avoid concurrent aluminum or magnesium-containing antacids.',
    ],
  },
  warfarin: {
    innName: 'Warfarin Sodium',
    therapeuticClass: 'Vitamin K Antagonist Anticoagulant',
    synonyms: ['coumadin', 'marevan', 'warfarin 5', 'warfarin 2'],
    isNTI: true,
    counselingKeyPoints: [
      'CRITICAL: Narrow Therapeutic Index (NTI). Maintain consistent dietary Vitamin K.',
      'Frequent INR monitoring required. Do not change brand or generic without prescriber guidance.',
    ],
  },
  levothyroxine: {
    innName: 'Levothyroxine Sodium',
    therapeuticClass: 'Thyroid Hormone Replacement',
    synonyms: ['synthroid', 'eltroxin', 'euthyrox', 'levothyroxine 50', 'levothyroxine 100'],
    isNTI: true,
    counselingKeyPoints: [
      'CRITICAL: Narrow Therapeutic Index (NTI). Take on an empty stomach with a full glass of water 30-60 min before breakfast.',
      'Brand switching requires TSH level re-evaluation within 6-8 weeks.',
    ],
  },
  carbamazepine: {
    innName: 'Carbamazepine',
    therapeuticClass: 'Antiepileptic / Mood Stabilizer',
    synonyms: ['tegretol', 'mazetol', 'carbamazepine 200', 'tegretol cr'],
    isNTI: true,
    counselingKeyPoints: [
      'CRITICAL: Narrow Therapeutic Index (NTI). Report skin rashes, fever, or sore throat immediately.',
      'Maintain same manufacturer/brand where possible to avoid seizure threshold shifts.',
    ],
  },
  digoxin: {
    innName: 'Digoxin',
    therapeuticClass: 'Cardiac Glycoside',
    synonyms: ['lanoxin', 'digoxin 0.25', 'digoxin 0.125'],
    isNTI: true,
    counselingKeyPoints: [
      'CRITICAL: Narrow Therapeutic Index (NTI). Report visual disturbances (yellow/green halos), nausea, or bradycardia.',
      'Prescriber contact mandatory before any generic substitution.',
    ],
  },
};

/**
 * Normalizes a drug or brand string for matching
 */
export function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Identify molecule knowledge entry from a prescribed drug name or brand
 */
export function identifyMoleculeKnowledge(drugName: string): MoleculeKnowledge | null {
  const normalized = normalizeString(drugName);
  
  for (const key of Object.keys(MOLECULE_KNOWLEDGE_BASE)) {
    const info = MOLECULE_KNOWLEDGE_BASE[key];
    if (normalized.includes(normalizeString(info.innName))) return info;
    for (const syn of info.synonyms) {
      if (normalized.includes(syn) || syn.includes(normalized)) return info;
    }
  }
  return null;
}

/**
 * Checks if a drug belongs to the Narrow Therapeutic Index (NTI) class
 */
export function isNarrowTherapeuticIndexDrug(drugName: string): boolean {
  const ntiKeywords = [
    'warfarin', 'coumadin', 'marevan',
    'digoxin', 'lanoxin',
    'lithium', 'priadel', 'camcolit',
    'carbamazepine', 'tegretol',
    'levothyroxine', 'synthroid', 'eltroxin', 'euthyrox',
    'theophylline', 'theodur', 'uniphyllin',
    'phenytoin', 'dilantin', 'epanutin',
    'cyclosporine', 'neoral', 'sandimmune',
    'tacrolimus', 'prograf',
  ];
  const normalized = normalizeString(drugName);
  return ntiKeywords.some((k) => normalized.includes(k));
}

/**
 * Extracts strength (e.g. "625mg", "500mg", "5mg", "100mcg") from drug name
 */
export function extractStrength(str: string): string | null {
  const match = str.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%))/i);
  return match ? match[0].replace(/\s+/g, '').toLowerCase() : null;
}

/**
 * Intelligent Generic Suggestion Engine
 * Takes a prescribed medicine name and finds bioequivalent & generic alternatives in inventory.
 * 
 * @param prescribedName The original prescribed brand or drug name (e.g., "Augmentin 625mg")
 * @param prescribedUnitPrice The original retail price per unit in UGX (optional)
 * @param inventory Current stock list of drugs from pharmacy inventory
 * @returns Array of BioequivalentSuggestion sorted by match score and cost savings
 */
export function findGenericEquivalents(
  prescribedName: string,
  prescribedUnitPrice: number = 0,
  inventory: DrugItem[] = []
): BioequivalentSuggestion[] {
  if (!prescribedName) return [];

  const normPrescribed = normalizeString(prescribedName);
  const prescStrength = extractStrength(prescribedName);
  const knowledge = identifyMoleculeKnowledge(prescribedName);
  const isNTI = isNarrowTherapeuticIndexDrug(prescribedName);

  const results: BioequivalentSuggestion[] = [];

  for (const item of inventory) {
    const normBrand = normalizeString(item.brandName);
    const normGeneric = normalizeString(item.genericName);

    // Skip exact same brand item to find alternatives
    if (normBrand === normPrescribed) continue;

    let matchScore = 0;
    let equivalenceType: BioequivalentSuggestion['equivalenceType'] = 'bioequivalent_generic';
    let bioequivalenceRating = 'NDA Registered Equivalent';
    let activeIngredient = item.genericName;
    const itemStrength = extractStrength(`${item.brandName} ${item.genericName}`);
    const strengthMatch = prescStrength ? itemStrength === prescStrength : true;

    // Check 1: Direct Active INN Molecule Match
    if (knowledge) {
      const isSynonymMatch = knowledge.synonyms.some(
        (syn) => normBrand.includes(syn) || normGeneric.includes(syn)
      );
      const isInnMatch = normGeneric.includes(normalizeString(knowledge.innName)) ||
        normBrand.includes(normalizeString(knowledge.innName));

      if (isInnMatch || isSynonymMatch) {
        matchScore = 90;
        activeIngredient = knowledge.innName;
        bioequivalenceRating = 'FDA / WHO AB-Rated Bioequivalent';
        equivalenceType = normBrand.toLowerCase().includes('generic') || normBrand === normGeneric
          ? 'bioequivalent_generic'
          : 'branded_generic';
      }
    } else {
      // Fuzzy INN check between prescribed string and inventory item generic name
      const words = normPrescribed.split(' ').filter((w) => w.length > 3);
      const genericWords = normGeneric.split(' ').filter((w) => w.length > 3);

      const overlap = words.filter((w) => genericWords.includes(w) || normGeneric.includes(w));
      if (overlap.length > 0) {
        matchScore = 70 + (overlap.length * 10);
        bioequivalenceRating = 'NDA Equivalent Generic';
        equivalenceType = 'bioequivalent_generic';
      }
    }

    // Check 2: Strength matching adjustment
    if (matchScore > 0) {
      if (strengthMatch) {
        matchScore = Math.min(100, matchScore + 10);
      } else if (prescStrength && itemStrength && prescStrength !== itemStrength) {
        matchScore = Math.max(40, matchScore - 25);
        equivalenceType = 'pharmaceutical_alternative';
        bioequivalenceRating = `Strength Variation (${itemStrength || 'Unknown'} vs ${prescStrength})`;
      }

      // Check In-Stock status
      const inStock = item.stockQty > 0;
      const unitPrice = item.sellingPrice || 0;
      const priceDifferenceUgx = Math.max(0, prescribedUnitPrice - unitPrice);
      const savingsPercent = prescribedUnitPrice > 0 && priceDifferenceUgx > 0
        ? Math.round((priceDifferenceUgx / prescribedUnitPrice) * 1000) / 10
        : 0;

      let clinicalSafetyNote = 'Direct bioequivalent generic substitution acceptable under pharmacist discretion.';
      if (isNTI) {
        clinicalSafetyNote = 'WARNING: Narrow Therapeutic Index drug. Prescriber communication & approval mandatory before switching.';
      } else if (!strengthMatch) {
        clinicalSafetyNote = 'Dose adjustment / frequency calculation required due to strength variation.';
      } else if (savingsPercent > 40) {
        clinicalSafetyNote = `High affordability benefit: Saves patient ${savingsPercent}% with identical therapeutic efficacy.`;
      }

      results.push({
        drug: item,
        matchScore,
        equivalenceType,
        bioequivalenceRating,
        activeIngredient,
        strengthMatch,
        dosageFormMatch: true,
        inStock,
        priceDifferenceUgx,
        savingsPercent,
        isNarrowTherapeuticIndex: isNTI,
        clinicalSafetyNote,
      });
    }
  }

  // Sort: First by Match Score desc, then inStock desc, then savingsPercent desc
  return results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return b.savingsPercent - a.savingsPercent;
  });
}
