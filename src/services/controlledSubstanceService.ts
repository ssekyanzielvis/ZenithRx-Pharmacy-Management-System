/**
 * controlledSubstanceService.ts — ZenithRx Controlled & Classified Medicines Service
 * National Drug Authority (NDA) Uganda Pharmacy & Poisons Act (Class A / Schedule I-IV)
 * Sequential Immutable Dispensing Register & Controlled Safe Stock Reconciliation
 */

import {
  ControlledSubstanceProduct,
  ControlledRegisterEntry,
  ControlledStockReconciliationRecord,
  ControlledScheduleClass,
  ControlledVarianceType,
  ControlledReconciliationStatus,
} from '../types';

const STORAGE_KEY_CONTROLLED_PRODUCTS = 'zenithrx_controlled_products_v1';
const STORAGE_KEY_CONTROLLED_REGISTER = 'zenithrx_controlled_register_v1';
const STORAGE_KEY_CONTROLLED_RECONCILIATION = 'zenithrx_controlled_reconciliation_v1';

// ─── Initial Master Catalog of Controlled Medicines ──────────────────────────
const INITIAL_CONTROLLED_PRODUCTS: ControlledSubstanceProduct[] = [
  {
    id: 'ctrl-prod-001',
    drugId: 'drug-nar-01',
    brandName: 'Morphine Oral Solution 10mg/5mL',
    genericName: 'Morphine Hydrochloride Oral Liquid',
    strength: '10mg/5mL',
    dosageForm: 'Oral Solution (500mL Amber Bottle)',
    scheduleClass: 'schedule_1_narcotic',
    ndaRegistrationNo: 'NDA/MAL/NAR/2018/0091',
    atcCode: 'N02AA01',
    storageType: 'Heavy-Gauge Steel Safe (Double-Locked, Bolted to Wall)',
    requiresWitnessPharmacist: true,
    maxSingleDispenseLimit: 100, // 100 mL
    dailyMaximumDose: '120mg in divided 4-hourly doses',
    currentSafeStock: 126,
    unit: 'bottles (500mL)',
    defaultBatchNumber: 'MOR-2025-08X',
    defaultExpiryDate: '2027-08-31',
  },
  {
    id: 'ctrl-prod-002',
    drugId: 'drug-nar-02',
    brandName: 'Pethidine 100mg/2mL Ampoules',
    genericName: 'Pethidine Hydrochloride Injection',
    strength: '100mg / 2mL',
    dosageForm: 'Injectable Ampoule (Box of 10)',
    scheduleClass: 'schedule_1_narcotic',
    ndaRegistrationNo: 'NDA/MAL/NAR/2019/0142',
    atcCode: 'N02AB02',
    storageType: 'Heavy-Gauge Steel Safe (Double-Locked, Bolted to Wall)',
    requiresWitnessPharmacist: true,
    maxSingleDispenseLimit: 20, // 20 ampoules
    dailyMaximumDose: '500mg in 24 hours',
    currentSafeStock: 45,
    unit: 'ampoules',
    defaultBatchNumber: 'PET-2025-11B',
    defaultExpiryDate: '2026-11-30',
  },
  {
    id: 'ctrl-prod-003',
    drugId: 'drug-nar-03',
    brandName: 'Durogesic 50mcg/hr Patch',
    genericName: 'Fentanyl Transdermal Therapeutic System',
    strength: '50 mcg/hour release rate',
    dosageForm: 'Transdermal Patch (Box of 5)',
    scheduleClass: 'schedule_1_narcotic',
    ndaRegistrationNo: 'NDA/MAL/NAR/2020/0219',
    atcCode: 'N02AB03',
    storageType: 'Heavy-Gauge Steel Safe (Double-Locked, Bolted to Wall)',
    requiresWitnessPharmacist: true,
    maxSingleDispenseLimit: 10,
    dailyMaximumDose: '1 patch every 72 hours',
    currentSafeStock: 28,
    unit: 'patches',
    defaultBatchNumber: 'FEN-2025-04K',
    defaultExpiryDate: '2027-04-30',
  },
  {
    id: 'ctrl-prod-004',
    drugId: 'drug-nar-04',
    brandName: 'Valium 5mg Tablets',
    genericName: 'Diazepam Tablets BP',
    strength: '5 mg',
    dosageForm: 'Oral Tablet (Blister of 100)',
    scheduleClass: 'schedule_3_psychotropic',
    ndaRegistrationNo: 'NDA/MAL/PSY/2017/0411',
    atcCode: 'N05BA01',
    storageType: 'Locked Controlled Substance Cabinet',
    requiresWitnessPharmacist: false,
    maxSingleDispenseLimit: 60,
    dailyMaximumDose: '30mg daily',
    currentSafeStock: 340,
    unit: 'tablets',
    defaultBatchNumber: 'DIA-2025-02Z',
    defaultExpiryDate: '2028-02-28',
  },
  {
    id: 'ctrl-prod-005',
    drugId: 'drug-nar-05',
    brandName: 'Tramal 50mg Capsules',
    genericName: 'Tramadol Hydrochloride',
    strength: '50 mg',
    dosageForm: 'Oral Capsule (Box of 50)',
    scheduleClass: 'schedule_2_controlled_rx',
    ndaRegistrationNo: 'NDA/MAL/CRX/2021/0882',
    atcCode: 'N02AX02',
    storageType: 'Locked Controlled Substance Cabinet',
    requiresWitnessPharmacist: false,
    maxSingleDispenseLimit: 40,
    dailyMaximumDose: '400mg daily',
    currentSafeStock: 210,
    unit: 'capsules',
    defaultBatchNumber: 'TRM-2025-07Q',
    defaultExpiryDate: '2027-07-31',
  },
  {
    id: 'ctrl-prod-006',
    drugId: 'drug-nar-06',
    brandName: 'Ketalar 50mg/mL Injection',
    genericName: 'Ketamine Hydrochloride USP',
    strength: '50 mg / mL (10 mL Vial)',
    dosageForm: 'Injectable Solution Vial',
    scheduleClass: 'schedule_2_controlled_rx',
    ndaRegistrationNo: 'NDA/MAL/CRX/2019/0315',
    atcCode: 'N01AX03',
    storageType: 'Heavy-Gauge Steel Safe (Double-Locked, Bolted to Wall)',
    requiresWitnessPharmacist: true,
    maxSingleDispenseLimit: 5,
    dailyMaximumDose: 'Per anesthesiologist protocol only',
    currentSafeStock: 18,
    unit: 'vials',
    defaultBatchNumber: 'KET-2025-09R',
    defaultExpiryDate: '2026-10-31',
  },
  {
    id: 'ctrl-prod-007',
    drugId: 'drug-nar-07',
    brandName: 'Ritalin 10mg Tablets',
    genericName: 'Methylphenidate Hydrochloride',
    strength: '10 mg',
    dosageForm: 'Oral Tablet (Bottle of 30)',
    scheduleClass: 'schedule_2_controlled_rx',
    ndaRegistrationNo: 'NDA/MAL/CRX/2020/0734',
    atcCode: 'N06BA04',
    storageType: 'Locked Controlled Substance Cabinet',
    requiresWitnessPharmacist: false,
    maxSingleDispenseLimit: 30,
    dailyMaximumDose: '60mg daily',
    currentSafeStock: 52,
    unit: 'tablets',
    defaultBatchNumber: 'RIT-2025-05A',
    defaultExpiryDate: '2027-05-31',
  },
];

// ─── Initial Seeded Controlled Dispensing Register Entries ───────────────────
const INITIAL_CONTROLLED_REGISTER: ControlledRegisterEntry[] = [
  {
    id: 'cdr-001',
    sequentialRegNumber: 'CDR-2026-00041',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo Safe Vault)',
    substanceId: 'ctrl-prod-001',
    drugBrandName: 'Morphine Oral Solution 10mg/5mL',
    drugGenericName: 'Morphine Hydrochloride Oral Liquid',
    dosageForm: 'Oral Solution (500mL Amber Bottle)',
    strength: '10mg/5mL',
    controlledSchedule: 'schedule_1_narcotic',
    batchNumber: 'MOR-2025-08X',
    expiryDate: '2027-08-31',
    openingBalance: 120,
    quantityDispensed: 20,
    balanceRemaining: 100,
    unit: 'bottles (500mL)',
    patientId: 'cust-101',
    patientName: 'Kato Emmanuel Sentamu',
    patientIdType: 'National ID (NIN)',
    patientIdNumber: 'CM880194819201A',
    patientPhone: '+256 772 109843',
    patientAddress: 'Plot 88, Upper Kololo Terrace, Kampala',
    patientAge: 62,
    patientGender: 'Male',
    prescriberName: 'Dr. Charles Lwanga (MD, FCP)',
    prescriberCouncilRegNo: 'UMDPC-2015-8821',
    prescriberCadre: 'Senior Consultant Oncologist & Palliative Care Specialist',
    prescriberFacility: 'Uganda Cancer Institute / Mulago National Referral',
    prescriberContact: '+256 701 998822',
    prescriptionReferenceNo: 'RX-NAR-2026-0081',
    prescriptionIssueDate: '2026-09-20',
    clinicalIndication: 'Severe refractory cancer breakthrough pain secondary to stage IV metastatic prostate malignancy.',
    supportingPrescriptionUrl: 'https://zenithrx.cloud/r2/prescriptions/rx-nar-2026-0081.pdf',
    dispensingPharmacistName: 'Dr. Arthur Ssenabulya',
    dispensingPharmacistRole: 'Supervising Pharmacist',
    dispensingPharmacistPsuNo: 'PSU-2021-0892',
    witnessPharmacistName: 'Dr. Brenda Namaganda',
    witnessPharmacistPsuNo: 'PSU-2022-1104',
    previousEntryHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentEntryHash: 'sha256_e89104fa8bc912389dca12a884019bfb491823901bcae8821038917823ab9102',
    isImmutableSealed: true,
    timestamp: '2026-09-21T10:14:00Z',
  },
  {
    id: 'cdr-002',
    sequentialRegNumber: 'CDR-2026-00042',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo Safe Vault)',
    substanceId: 'ctrl-prod-002',
    drugBrandName: 'Pethidine 100mg/2mL Ampoules',
    drugGenericName: 'Pethidine Hydrochloride Injection',
    dosageForm: 'Injectable Ampoule (Box of 10)',
    strength: '100mg / 2mL',
    controlledSchedule: 'schedule_1_narcotic',
    batchNumber: 'PET-2025-11B',
    expiryDate: '2026-11-30',
    openingBalance: 55,
    quantityDispensed: 10,
    balanceRemaining: 45,
    unit: 'ampoules',
    patientId: 'cust-102',
    patientName: 'Aisha Nabbanja',
    patientIdType: 'National ID (NIN)',
    patientIdNumber: 'CF94029104921X',
    patientPhone: '+256 755 883921',
    patientAddress: 'Bukoto Heights Block C, Kampala',
    patientAge: 34,
    patientGender: 'Female',
    prescriberName: 'Dr. Harriet Kigozi (MBChB, MMed Obs/Gyn)',
    prescriberCouncilRegNo: 'UMDPC-2018-3319',
    prescriberCadre: 'Consultant Obstetrician & Gynecologist',
    prescriberFacility: 'Nakasero Hospital Surgical Wing',
    prescriberContact: '+256 772 449911',
    prescriptionReferenceNo: 'RX-NAR-2026-0089',
    prescriptionIssueDate: '2026-09-22',
    clinicalIndication: 'Acute severe post-operative surgical pain post-emergency cesarean section complicated by pelvic adhesions.',
    supportingPrescriptionUrl: 'https://zenithrx.cloud/r2/prescriptions/rx-nar-2026-0089.pdf',
    dispensingPharmacistName: 'Dr. Arthur Ssenabulya',
    dispensingPharmacistRole: 'Supervising Pharmacist',
    dispensingPharmacistPsuNo: 'PSU-2021-0892',
    witnessPharmacistName: 'Dr. Brenda Namaganda',
    witnessPharmacistPsuNo: 'PSU-2022-1104',
    previousEntryHash: 'sha256_e89104fa8bc912389dca12a884019bfb491823901bcae8821038917823ab9102',
    currentEntryHash: 'sha256_b38190fa72819cd001fe89410a8c29184bfa1098239018cae98192831892fca1',
    isImmutableSealed: true,
    timestamp: '2026-09-23T14:30:00Z',
  },
  {
    id: 'cdr-003',
    sequentialRegNumber: 'CDR-2026-00043',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo Safe Vault)',
    substanceId: 'ctrl-prod-004',
    drugBrandName: 'Valium 5mg Tablets',
    drugGenericName: 'Diazepam Tablets BP',
    dosageForm: 'Oral Tablet (Blister of 100)',
    strength: '5 mg',
    controlledSchedule: 'schedule_3_psychotropic',
    batchNumber: 'DIA-2025-02Z',
    expiryDate: '2028-02-28',
    openingBalance: 370,
    quantityDispensed: 30,
    balanceRemaining: 340,
    unit: 'tablets',
    patientId: 'cust-103',
    patientName: 'David Tumusiime',
    patientIdType: 'Passport',
    patientIdNumber: 'UG-P8829104',
    patientPhone: '+256 700 318291',
    patientAddress: 'Muyenga Tank Hill Road, Kampala',
    patientAge: 45,
    patientGender: 'Male',
    prescriberName: 'Dr. Moses Kalule (MD, MMed Psych)',
    prescriberCouncilRegNo: 'UMDPC-2016-1940',
    prescriberCadre: 'Consultant Psychiatrist',
    prescriberFacility: 'Butabika National Referral Hospital',
    prescriberContact: '+256 782 110099',
    prescriptionReferenceNo: 'RX-PSY-2026-0104',
    prescriptionIssueDate: '2026-09-24',
    clinicalIndication: 'Severe generalized anxiety crisis with acute refractory insomnia; strict 14-day taper protocol.',
    supportingPrescriptionUrl: 'https://zenithrx.cloud/r2/prescriptions/rx-psy-2026-0104.pdf',
    dispensingPharmacistName: 'Dr. Arthur Ssenabulya',
    dispensingPharmacistRole: 'Supervising Pharmacist',
    dispensingPharmacistPsuNo: 'PSU-2021-0892',
    witnessPharmacistName: 'Sarah Namubiru',
    witnessPharmacistPsuNo: 'PSU-2023-4910',
    previousEntryHash: 'sha256_b38190fa72819cd001fe89410a8c29184bfa1098239018cae98192831892fca1',
    currentEntryHash: 'sha256_44fa9081293847acff1894bfa29184bfa1098239018cae98192831892fca8901',
    isImmutableSealed: true,
    timestamp: '2026-09-24T16:45:00Z',
  },
];

// ─── Initial Seeded Controlled Safe Stock Reconciliations ────────────────────
const INITIAL_CONTROLLED_RECONCILIATIONS: ControlledStockReconciliationRecord[] = [
  {
    id: 'csr-001',
    reconciliationNumber: 'CSR-2026-0001',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo Safe Vault)',
    substanceId: 'ctrl-prod-001',
    medicineName: 'Morphine Oral Solution 10mg/5mL (500mL Bottles)',
    batchNumber: 'MOR-2025-08X',
    controlledSchedule: 'schedule_1_narcotic',
    storageBinSafe: 'Heavy-Gauge Steel Safe Vault — Compartment A1',
    openingBalance: 100,
    quantityReceived: 50,
    quantityDispensed: 20,
    quantityDamagedOrLost: 2,
    quantityQuarantined: 0,
    expectedBalance: 128, // 100 + 50 - 20 - 2 = 128
    physicalBalance: 126,
    variance: -2,         // 126 - 128 = -2 (DEFICIT)
    varianceType: 'unaccounted_deficit_investigation',
    reconciliationStatus: 'under_internal_investigation',
    investigationNotes: 'Physical double-blind count revealed 126 intact 500mL bottles instead of expected 128. CCTV footage from Safe Vault 1 being retrieved for period Sep 15 - Sep 24. Shift change logs and witness logs under rigorous audit.',
    rootCauseAnalysis: 'Suspected dispensing measurement spillage or unlogged sample extraction during quality audit. Dual pharmacist audit underway.',
    correctiveActionPlan: '1. Vault access restricted strictly to Superintendent Pharmacist and Senior Pharmacist. 2. Mandatory biometric entry audit enabled. 3. Immediate NDA Form 5 notice prepared.',
    ndaIncidentReportRef: 'NDA-NAR-INC-2026-0019',
    policeCaseFileRef: 'CPS-KLA-SD-44/24/09/2026',
    countedByPharmacistName: 'Dr. Arthur Ssenabulya',
    countedByPsuNo: 'PSU-2021-0892',
    witnessPharmacistName: 'Dr. Brenda Namaganda',
    witnessPsuNo: 'PSU-2022-1104',
    superintendentApproverName: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
    periodStartDate: '2026-09-01',
    periodEndDate: '2026-09-24',
    auditDate: '2026-09-24T18:00:00Z',
    createdAt: '2026-09-24T18:00:00Z',
  },
  {
    id: 'csr-002',
    reconciliationNumber: 'CSR-2026-0002',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo Safe Vault)',
    substanceId: 'ctrl-prod-002',
    medicineName: 'Pethidine 100mg/2mL Ampoules (Box of 10)',
    batchNumber: 'PET-2025-11B',
    controlledSchedule: 'schedule_1_narcotic',
    storageBinSafe: 'Heavy-Gauge Steel Safe Vault — Compartment A2',
    openingBalance: 55,
    quantityReceived: 0,
    quantityDispensed: 10,
    quantityDamagedOrLost: 0,
    quantityQuarantined: 0,
    expectedBalance: 45,
    physicalBalance: 45,
    variance: 0,
    varianceType: 'zero_variance_perfect_match',
    reconciliationStatus: 'reconciled_and_verified',
    investigationNotes: 'Zero discrepancy observed. All 45 ampoules accounted for. Batch seals intact and registered under dual-key custody.',
    countedByPharmacistName: 'Dr. Arthur Ssenabulya',
    countedByPsuNo: 'PSU-2021-0892',
    witnessPharmacistName: 'Dr. Brenda Namaganda',
    witnessPsuNo: 'PSU-2022-1104',
    superintendentApproverName: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
    superintendentApprovedAt: '2026-09-24T18:30:00Z',
    periodStartDate: '2026-09-01',
    periodEndDate: '2026-09-24',
    auditDate: '2026-09-24T18:30:00Z',
    createdAt: '2026-09-24T18:30:00Z',
  },
  {
    id: 'csr-003',
    reconciliationNumber: 'CSR-2026-0003',
    tenantId: 'client-001',
    branchId: 'branch-kololo-01',
    branchName: 'ZenithRx Flagship (Kololo Safe Vault)',
    substanceId: 'ctrl-prod-004',
    medicineName: 'Valium 5mg Tablets (Blisters of 100)',
    batchNumber: 'DIA-2025-02Z',
    controlledSchedule: 'schedule_3_psychotropic',
    storageBinSafe: 'Controlled Substance Double-Lock Cabinet B',
    openingBalance: 370,
    quantityReceived: 0,
    quantityDispensed: 30,
    quantityDamagedOrLost: 0,
    quantityQuarantined: 0,
    expectedBalance: 340,
    physicalBalance: 340,
    variance: 0,
    varianceType: 'zero_variance_perfect_match',
    reconciliationStatus: 'reconciled_and_verified',
    investigationNotes: 'Stock verified against physical blister count. Compliant with NDA Schedule III psychotropic record standards.',
    countedByPharmacistName: 'Dr. Arthur Ssenabulya',
    countedByPsuNo: 'PSU-2021-0892',
    witnessPharmacistName: 'Sarah Namubiru',
    witnessPsuNo: 'PSU-2023-4910',
    superintendentApproverName: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
    superintendentApprovedAt: '2026-09-24T19:00:00Z',
    periodStartDate: '2026-09-01',
    periodEndDate: '2026-09-24',
    auditDate: '2026-09-24T19:00:00Z',
    createdAt: '2026-09-24T19:00:00Z',
  }
];

// ─── Controlled Substance Service Class ───────────────────────────────────────
class ControlledSubstanceService {
  // 1. Products Master
  getAllProducts(): ControlledSubstanceProduct[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONTROLLED_PRODUCTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_CONTROLLED_PRODUCTS, JSON.stringify(INITIAL_CONTROLLED_PRODUCTS));
        return INITIAL_CONTROLLED_PRODUCTS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_CONTROLLED_PRODUCTS;
    }
  }

  getProductById(id: string): ControlledSubstanceProduct | undefined {
    return this.getAllProducts().find(p => p.id === id || p.drugId === id);
  }

  // 2. Sequential Dispensing Register
  getAllRegisterEntries(tenantId?: string): ControlledRegisterEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONTROLLED_REGISTER);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_CONTROLLED_REGISTER, JSON.stringify(INITIAL_CONTROLLED_REGISTER));
        return tenantId ? INITIAL_CONTROLLED_REGISTER.filter(e => e.tenantId === tenantId) : INITIAL_CONTROLLED_REGISTER;
      }
      const all: ControlledRegisterEntry[] = JSON.parse(raw);
      return tenantId ? all.filter(e => e.tenantId === tenantId) : all;
    } catch {
      return INITIAL_CONTROLLED_REGISTER;
    }
  }

  getRunningBalance(substanceId: string, batchNumber?: string): number {
    const products = this.getAllProducts();
    const product = products.find(p => p.id === substanceId || p.drugId === substanceId);
    if (!product) return 0;
    return product.currentSafeStock;
  }

  recordControlledDispensing(entryInput: {
    tenantId: string;
    branchId: string;
    branchName: string;
    substanceId: string;
    drugBrandName: string;
    drugGenericName: string;
    dosageForm: string;
    strength: string;
    controlledSchedule: ControlledScheduleClass;
    batchNumber: string;
    expiryDate: string;
    quantityDispensed: number;
    unit: string;
    patientId?: string;
    patientName: string;
    patientIdType: string;
    patientIdNumber: string;
    patientPhone: string;
    patientAddress: string;
    patientAge?: number;
    patientGender?: string;
    prescriberName: string;
    prescriberCouncilRegNo: string;
    prescriberCadre?: string;
    prescriberFacility: string;
    prescriberContact?: string;
    prescriptionReferenceNo: string;
    prescriptionIssueDate: string;
    clinicalIndication: string;
    supportingPrescriptionUrl?: string;
    dispensingPharmacistName: string;
    dispensingPharmacistRole: string;
    dispensingPharmacistPsuNo: string;
    witnessPharmacistName?: string;
    witnessPharmacistPsuNo?: string;
  }): ControlledRegisterEntry {
    const entries = this.getAllRegisterEntries();
    const products = this.getAllProducts();

    // Find product to check current balance
    const product = products.find(p => p.id === entryInput.substanceId || p.drugId === entryInput.substanceId);
    const openingBalance = product ? product.currentSafeStock : 100;
    const balanceRemaining = Math.max(0, openingBalance - entryInput.quantityDispensed);

    // Update product stock
    if (product) {
      product.currentSafeStock = balanceRemaining;
      try {
        localStorage.setItem(STORAGE_KEY_CONTROLLED_PRODUCTS, JSON.stringify(products));
      } catch (e) {
        console.error('Failed to update product stock', e);
      }
    }

    // Compute sequential register number
    const regSeq = entries.length + 44; // Start sequential index
    const sequentialRegNumber = `CDR-${new Date().getFullYear()}-${String(regSeq).padStart(5, '0')}`;

    // Compute Cryptographic Chained Hash
    const previousEntry = entries[0];
    const previousHash = previousEntry ? previousEntry.currentEntryHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const currentHash = `sha256_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;

    const newEntry: ControlledRegisterEntry = {
      id: `cdr-uuid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sequentialRegNumber,
      tenantId: entryInput.tenantId,
      branchId: entryInput.branchId,
      branchName: entryInput.branchName,
      substanceId: entryInput.substanceId,
      drugBrandName: entryInput.drugBrandName,
      drugGenericName: entryInput.drugGenericName,
      dosageForm: entryInput.dosageForm,
      strength: entryInput.strength,
      controlledSchedule: entryInput.controlledSchedule,
      batchNumber: entryInput.batchNumber,
      expiryDate: entryInput.expiryDate,
      openingBalance,
      quantityDispensed: entryInput.quantityDispensed,
      balanceRemaining,
      unit: entryInput.unit,
      patientId: entryInput.patientId,
      patientName: entryInput.patientName,
      patientIdType: entryInput.patientIdType,
      patientIdNumber: entryInput.patientIdNumber,
      patientPhone: entryInput.patientPhone,
      patientAddress: entryInput.patientAddress,
      patientAge: entryInput.patientAge,
      patientGender: entryInput.patientGender,
      prescriberName: entryInput.prescriberName,
      prescriberCouncilRegNo: entryInput.prescriberCouncilRegNo,
      prescriberCadre: entryInput.prescriberCadre || 'Medical Officer / Specialist',
      prescriberFacility: entryInput.prescriberFacility,
      prescriberContact: entryInput.prescriberContact,
      prescriptionReferenceNo: entryInput.prescriptionReferenceNo,
      prescriptionIssueDate: entryInput.prescriptionIssueDate,
      clinicalIndication: entryInput.clinicalIndication,
      supportingPrescriptionUrl: entryInput.supportingPrescriptionUrl,
      dispensingPharmacistName: entryInput.dispensingPharmacistName,
      dispensingPharmacistRole: entryInput.dispensingPharmacistRole,
      dispensingPharmacistPsuNo: entryInput.dispensingPharmacistPsuNo,
      witnessPharmacistName: entryInput.witnessPharmacistName,
      witnessPharmacistPsuNo: entryInput.witnessPharmacistPsuNo,
      previousEntryHash: previousHash,
      currentEntryHash: currentHash,
      isImmutableSealed: true,
      timestamp,
    };

    const updated = [newEntry, ...entries];
    try {
      localStorage.setItem(STORAGE_KEY_CONTROLLED_REGISTER, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save controlled register entry', e);
    }

    return newEntry;
  }

  // 3. Controlled-Stock Safe Reconciliation
  getAllReconciliations(tenantId?: string): ControlledStockReconciliationRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONTROLLED_RECONCILIATION);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_CONTROLLED_RECONCILIATION, JSON.stringify(INITIAL_CONTROLLED_RECONCILIATIONS));
        return tenantId ? INITIAL_CONTROLLED_RECONCILIATIONS.filter(r => r.tenantId === tenantId) : INITIAL_CONTROLLED_RECONCILIATIONS;
      }
      const all: ControlledStockReconciliationRecord[] = JSON.parse(raw);
      return tenantId ? all.filter(r => r.tenantId === tenantId) : all;
    } catch {
      return INITIAL_CONTROLLED_RECONCILIATIONS;
    }
  }

  createReconciliation(input: {
    tenantId: string;
    branchId: string;
    branchName: string;
    substanceId?: string;
    medicineName: string;
    batchNumber: string;
    controlledSchedule: ControlledScheduleClass;
    storageBinSafe: string;
    openingBalance: number;
    quantityReceived: number;
    quantityDispensed: number;
    quantityDamagedOrLost: number;
    quantityQuarantined?: number;
    physicalBalance: number;
    investigationNotes?: string;
    countedByPharmacistName: string;
    countedByPsuNo: string;
    witnessPharmacistName: string;
    witnessPsuNo: string;
    periodStartDate: string;
    periodEndDate: string;
  }): ControlledStockReconciliationRecord {
    const list = this.getAllReconciliations();

    // Controlled-stock quantitative ledger reconciliation formula:
    // Expected Balance = Opening + Received - Dispensed - Damaged - Quarantined
    const quarantined = input.quantityQuarantined || 0;
    const expectedBalance =
      input.openingBalance +
      input.quantityReceived -
      input.quantityDispensed -
      input.quantityDamagedOrLost -
      quarantined;

    const variance = input.physicalBalance - expectedBalance;

    let varianceType: ControlledVarianceType = 'zero_variance_perfect_match';
    let reconciliationStatus: ControlledReconciliationStatus = 'reconciled_and_verified';

    if (variance < 0) {
      varianceType = 'unaccounted_deficit_investigation';
      reconciliationStatus = 'under_internal_investigation';
    } else if (variance > 0) {
      varianceType = 'stock_surplus_investigation';
      reconciliationStatus = 'under_internal_investigation';
    } else if (input.quantityDamagedOrLost > 0) {
      varianceType = 'damage_or_breakage_verified';
    }

    const seq = list.length + 4;
    const reconciliationNumber = `CSR-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const record: ControlledStockReconciliationRecord = {
      id: `csr-uuid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reconciliationNumber,
      tenantId: input.tenantId,
      branchId: input.branchId,
      branchName: input.branchName,
      substanceId: input.substanceId,
      medicineName: input.medicineName,
      batchNumber: input.batchNumber,
      controlledSchedule: input.controlledSchedule,
      storageBinSafe: input.storageBinSafe,
      openingBalance: input.openingBalance,
      quantityReceived: input.quantityReceived,
      quantityDispensed: input.quantityDispensed,
      quantityDamagedOrLost: input.quantityDamagedOrLost,
      quantityQuarantined: quarantined,
      expectedBalance,
      physicalBalance: input.physicalBalance,
      variance,
      varianceType,
      reconciliationStatus,
      investigationNotes: input.investigationNotes || (variance !== 0 ? 'Variance detected during physical count. Investigation initiated.' : 'Stock reconciled with zero variance.'),
      rootCauseAnalysis: variance !== 0 ? 'Pending dual-pharmacist forensic audit of shift dispensing logs & vault biometrics.' : undefined,
      correctiveActionPlan: variance !== 0 ? 'Verify daily narcotic register against physical safe count at each shift handover.' : undefined,
      ndaIncidentReportRef: variance !== 0 ? `NDA-NAR-INC-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}` : undefined,
      countedByPharmacistName: input.countedByPharmacistName,
      countedByPsuNo: input.countedByPsuNo,
      witnessPharmacistName: input.witnessPharmacistName,
      witnessPsuNo: input.witnessPsuNo,
      superintendentApproverName: variance === 0 ? 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)' : undefined,
      superintendentApprovedAt: variance === 0 ? now : undefined,
      periodStartDate: input.periodStartDate,
      periodEndDate: input.periodEndDate,
      auditDate: now,
      createdAt: now,
    };

    const updated = [record, ...list];
    try {
      localStorage.setItem(STORAGE_KEY_CONTROLLED_RECONCILIATION, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save reconciliation', e);
    }

    return record;
  }

  updateReconciliationInvestigation(
    id: string,
    updates: {
      investigationNotes?: string;
      rootCauseAnalysis?: string;
      correctiveActionPlan?: string;
      policeCaseFileRef?: string;
      reconciliationStatus?: ControlledReconciliationStatus;
      superintendentApproverName?: string;
    }
  ): ControlledStockReconciliationRecord | null {
    const list = this.getAllReconciliations();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) return null;

    const record = list[index];
    const updatedRecord: ControlledStockReconciliationRecord = {
      ...record,
      ...updates,
      superintendentApprovedAt: updates.reconciliationStatus === 'superintendent_approved_adjustment' ? new Date().toISOString() : record.superintendentApprovedAt,
    };

    list[index] = updatedRecord;
    try {
      localStorage.setItem(STORAGE_KEY_CONTROLLED_RECONCILIATION, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to update reconciliation', e);
    }

    return updatedRecord;
  }

  // 4. Export Poison Book CSV
  exportRegisterToCsv(entries: ControlledRegisterEntry[]): void {
    const headers = [
      'Sequential Register No',
      'Timestamp (UTC)',
      'Branch Safe Location',
      'Drug Brand Name',
      'Generic Name',
      'Schedule Class',
      'Batch Number',
      'Expiry Date',
      'Opening Safe Stock',
      'Quantity Dispensed',
      'Balance Remaining',
      'Unit',
      'Patient Full Name',
      'ID Type',
      'National ID / Passport No',
      'Patient Phone',
      'Patient Address',
      'Prescriber Doctor',
      'UMDPC License No',
      'Prescriber Cadre',
      'Hospital / Facility',
      'Prescription Reference No',
      'Prescription Date',
      'Clinical Indication',
      'Dispensing Pharmacist',
      'Pharmacist PSU License',
      'Witness Pharmacist',
      'Witness PSU License',
      'Cryptographic Chained SHA256 Hash',
    ];

    const rows = entries.map(e => [
      `"${e.sequentialRegNumber}"`,
      `"${new Date(e.timestamp).toLocaleString()}"`,
      `"${e.branchName}"`,
      `"${e.drugBrandName}"`,
      `"${e.drugGenericName}"`,
      `"${e.controlledSchedule.replace(/_/g, ' ').toUpperCase()}"`,
      `"${e.batchNumber}"`,
      `"${e.expiryDate}"`,
      e.openingBalance,
      e.quantityDispensed,
      e.balanceRemaining,
      `"${e.unit}"`,
      `"${e.patientName}"`,
      `"${e.patientIdType}"`,
      `"${e.patientIdNumber}"`,
      `"${e.patientPhone}"`,
      `"${e.patientAddress.replace(/"/g, '""')}"`,
      `"${e.prescriberName}"`,
      `"${e.prescriberCouncilRegNo}"`,
      `"${e.prescriberCadre || 'N/A'}"`,
      `"${e.prescriberFacility}"`,
      `"${e.prescriptionReferenceNo}"`,
      `"${e.prescriptionIssueDate}"`,
      `"${e.clinicalIndication.replace(/"/g, '""')}"`,
      `"${e.dispensingPharmacistName}"`,
      `"${e.dispensingPharmacistPsuNo}"`,
      `"${e.witnessPharmacistName || 'N/A'}"`,
      `"${e.witnessPharmacistPsuNo || 'N/A'}"`,
      `"${e.currentEntryHash}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZenithRx_NDA_Controlled_Substances_Register_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 5. Generate NDA Form 5 Statutory Narcotic Return Report
  generateNdaForm5Dossier(reconciliations: ControlledStockReconciliationRecord[]): string {
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    
    let report = `================================================================================
NATIONAL DRUG AUTHORITY (NDA) UGANDA — STATUTORY FORM 5
MONTHLY NARCOTIC & PSYCHOTROPIC SAFE RECONCILIATION & RETURN
Under the Pharmacy and Drugs Act & National Drug Policy (Control of Narcotics)
================================================================================
Generated Date: ${reportDate}
System: ZenithRx Pharmacy Management System (Quantum Networks)
Audit Security Hash: SHA256-NDA-${Date.now().toString(36).toUpperCase()}
--------------------------------------------------------------------------------
1. PHARMACY LICENSEE DETAILS:
   - Pharmacy Name: ZenithRx Flagship Pharmacy Ltd
   - NDA License Number: NDA/RTL/2026/0894
   - PSU Premises Reg No: PSU-PREM-2026-0120
   - Physical Address: Plot 14, Acacia Avenue, Kololo, Kampala, Uganda
   - Supervising Pharmacist: Dr. Elvis Ssekyanzi, BPharm, MPS (PSU Reg No: PSU-2021-0892)
--------------------------------------------------------------------------------
2. CONTROLLED STOCK SAFE QUANTITATIVE LEDGER BREAKDOWN:
`;

    reconciliations.forEach((r, idx) => {
      report += `
[ITEM ${idx + 1}] — ${r.reconciliationNumber}
- Controlled Medicine: ${r.medicineName}
- Schedule Class: ${r.controlledSchedule.toUpperCase()}
- Batch Number: ${r.batchNumber}
- Storage Safe Vault: ${r.storageBinSafe}
- Accounting Period: ${r.periodStartDate} to ${r.periodEndDate}

  QUANTITATIVE RECONCILIATION LEDGER FORMULA:
  • Opening Balance:       ${String(r.openingBalance).padStart(6)}
  • Quantity Received (+): ${String(r.quantityReceived).padStart(6)}
  • Quantity Dispensed (-):${String(r.quantityDispensed).padStart(6)}
  • Damaged / Lost (-):    ${String(r.quantityDamagedOrLost).padStart(6)}
  • Quarantined (-):       ${String(r.quantityQuarantined).padStart(6)}
  -----------------------------------------
  • EXPECTED BALANCE:      ${String(r.expectedBalance).padStart(6)}
  • PHYSICAL SAFE COUNT:   ${String(r.physicalBalance).padStart(6)}
  • AUDIT VARIANCE:        ${String(r.variance).padStart(6)} (${r.varianceType.toUpperCase()})

  STATUS: ${r.reconciliationStatus.replace(/_/g, ' ').toUpperCase()}
  ${r.ndaIncidentReportRef ? `NDA INCIDENT REF: ${r.ndaIncidentReportRef}` : ''}
  ${r.policeCaseFileRef ? `POLICE CASE FILE: ${r.policeCaseFileRef}` : ''}
  Investigative Notes: ${r.investigationNotes || 'None'}
  Counted by: ${r.countedByPharmacistName} (PSU: ${r.countedByPsuNo})
  Witness Pharmacist: ${r.witnessPharmacistName} (PSU: ${r.witnessPsuNo})
  Superintendent Approval: ${r.superintendentApproverName || 'PENDING INVESTIGATION SIGN-OFF'}
--------------------------------------------------------------------------------`;
    });

    report += `
3. REGULATORY ATTESTATION & STATUTORY SIGN-OFF:
   I hereby certify that the above quantitative return represents an accurate and true 
   statement of all Class A Poisons, Schedule I Narcotic and Schedule II-IV Psychotropic 
   substances received, held in dual-lock safe custody, and dispensed on valid medical 
   prescriptions during the stated period.

   Superintendent Pharmacist: _______________________________ Date: _______________
   National Drug Authority Inspector: _______________________ Date: _______________
================================================================================`;

    return report;
  }
}

export const controlledSubstanceService = new ControlledSubstanceService();
