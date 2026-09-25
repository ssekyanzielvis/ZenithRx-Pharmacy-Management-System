/**
 * batchManagementService.ts — ZenithRx Enterprise Batch Lifecycle & Recall Service
 * Technical Specs: Complies with NDA Uganda Good Pharmacy Practice §11.6, §11.20
 * Covers: 7-State Lifecycle, PO/GRN traceability, Storage zone tracking, Recall Orchestration
 */

import {
  PharmacyBatchItem,
  BatchLifecycleState,
  BatchRecallStatus,
  BatchAuditTrailEntry,
  RecallPatientEntry,
} from '../types';

const INITIAL_BATCHES: PharmacyBatchItem[] = [
  {
    id: 'BATCH-001',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2026-AUG01',
    drugId: 'DRUG-001',
    medicineName: 'Paracetamol 500mg Tablets (Box of 100)',
    brandName: 'Panadol Extra',
    genericName: 'Paracetamol / Acetaminophen',
    dosageForm: 'Tablet',
    strength: '500 mg',
    manufacturerName: 'Cipla Quality Chemicals Uganda Ltd',
    countryOfManufacture: 'Uganda',
    manufacturingDate: '2026-01-10',
    expiryDate: '2028-01-10',
    quantityReceived: 500,
    quantityAvailable: 450,
    quantityQuarantined: 0,
    quantityDamaged: 0,
    quantityReturned: 0,
    quantityDestroyed: 0,
    packSize: 'Box of 100 (10x10 Blister)',
    unitOfMeasure: 'tablets',
    purchasePriceUgx: 4500,
    sellingPriceUgx: 7500,
    supplierName: 'Rene Industries Ltd',
    supplierId: 'SUP-001',
    purchaseOrderNumber: 'PO-2026-0841',
    goodsReceivedNoteNumber: 'GRN-2026-0199',
    invoiceNumber: 'INV-RN-9921',
    receivedDate: '2026-02-15T09:30:00Z',
    receivedBy: 'Pharm. Brenda Namubiru (PSU #4412)',
    storageLocation: 'Aisle 1, Shelf A-03, Bin 12',
    storageZone: 'ambient_shelf',
    temperatureRequirement: '15-25°C Room Temp',
    isColdChain: false,
    isLightSensitive: false,
    batchStatus: 'available',
    recallStatus: 'none',
    createdAt: '2026-02-15T09:30:00Z',
    updatedAt: '2026-02-15T09:30:00Z',
  },
  {
    id: 'BATCH-002',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2026-AMX09',
    drugId: 'DRUG-003',
    medicineName: 'Co-Amoxiclav 625mg Tablets (Box of 14)',
    brandName: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    dosageForm: 'Tablet',
    strength: '625 mg',
    manufacturerName: 'GlaxoSmithKline (GSK) UK',
    countryOfManufacture: 'United Kingdom',
    manufacturingDate: '2025-11-20',
    expiryDate: '2027-11-20',
    quantityReceived: 200,
    quantityAvailable: 0,
    quantityQuarantined: 200,
    quantityDamaged: 0,
    quantityReturned: 0,
    quantityDestroyed: 0,
    packSize: 'Box of 14 (2x7 Alu-Alu Blister)',
    unitOfMeasure: 'tablets',
    purchasePriceUgx: 28000,
    sellingPriceUgx: 42000,
    supplierName: 'Abacus Pharma Africa Ltd',
    supplierId: 'SUP-002',
    purchaseOrderNumber: 'PO-2026-0792',
    goodsReceivedNoteNumber: 'GRN-2026-0174',
    invoiceNumber: 'INV-AB-5510',
    receivedDate: '2026-03-01T11:00:00Z',
    receivedBy: 'Pharm. Denis Kigozi (PSU #3890)',
    storageLocation: 'Quarantine Lockup Cage #1',
    storageZone: 'quarantine_cage_isolated',
    temperatureRequirement: 'Store below 25°C in dry place',
    isColdChain: false,
    isLightSensitive: false,
    batchStatus: 'quarantined',
    recallStatus: 'none',
    recallReason: 'Desiccant moisture seal check failed on arrival sample. Awaiting NDA laboratory confirmation.',
    quarantineWitnessPharmacist: 'Pharm. Sarah Akello (PSU #5011)',
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-03-01T11:00:00Z',
  },
  {
    id: 'BATCH-003',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2026-INS77',
    drugId: 'DRUG-006',
    medicineName: 'Insulin Glargine 100 IU/mL SoloStar Pen',
    brandName: 'Lantus SoloStar',
    genericName: 'Insulin Glargine',
    dosageForm: 'Subcutaneous Solution',
    strength: '100 IU/mL',
    manufacturerName: 'Sanofi-Aventis Deutschland GmbH',
    countryOfManufacture: 'Germany',
    manufacturingDate: '2025-10-01',
    expiryDate: '2027-04-30',
    quantityReceived: 100,
    quantityAvailable: 65,
    quantityQuarantined: 0,
    quantityDamaged: 0,
    quantityReturned: 0,
    quantityDestroyed: 0,
    packSize: 'Box of 5 Prefilled Pens (3 mL each)',
    unitOfMeasure: 'pens',
    purchasePriceUgx: 58000,
    sellingPriceUgx: 75000,
    supplierName: 'Surgipharm Uganda Ltd',
    supplierId: 'SUP-003',
    purchaseOrderNumber: 'PO-2026-0902',
    goodsReceivedNoteNumber: 'GRN-2026-0211',
    invoiceNumber: 'INV-SP-8199',
    receivedDate: '2026-03-10T08:15:00Z',
    receivedBy: 'Pharm. Brenda Namubiru (PSU #4412)',
    storageLocation: 'Cold-Chain Refrigerator #2 (2.0°C - 8.0°C)',
    storageZone: 'cold_chain_fridge_2_8',
    temperatureRequirement: '2.0°C - 8.0°C (Do Not Freeze)',
    isColdChain: true,
    isLightSensitive: true,
    batchStatus: 'available',
    recallStatus: 'none',
    createdAt: '2026-03-10T08:15:00Z',
    updatedAt: '2026-03-10T08:15:00Z',
  },
  {
    id: 'BATCH-004',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2025-COA44',
    drugId: 'DRUG-009',
    medicineName: 'Coartem 20/120mg Dispersible Tablets (Box of 24)',
    brandName: 'Coartem Dispersible',
    genericName: 'Artemether 20mg + Lumefantrine 120mg',
    dosageForm: 'Dispersible Tablet',
    strength: '20 mg / 120 mg',
    manufacturerName: 'Novartis Pharma AG',
    countryOfManufacture: 'Switzerland',
    manufacturingDate: '2025-02-14',
    expiryDate: '2027-02-14',
    quantityReceived: 300,
    quantityAvailable: 0,
    quantityQuarantined: 80,
    quantityDamaged: 0,
    quantityReturned: 0,
    quantityDestroyed: 0,
    packSize: 'Box of 24 (4x6 Blister)',
    unitOfMeasure: 'tablets',
    purchasePriceUgx: 6500,
    sellingPriceUgx: 11000,
    supplierName: 'Norvik Enterprises Ltd',
    supplierId: 'SUP-004',
    purchaseOrderNumber: 'PO-2025-0410',
    goodsReceivedNoteNumber: 'GRN-2025-0098',
    invoiceNumber: 'INV-NV-3120',
    receivedDate: '2025-03-12T14:20:00Z',
    receivedBy: 'Pharm. Sarah Akello (PSU #5011)',
    storageLocation: 'Quarantine Lockup Cage #2 (Recall Isolated)',
    storageZone: 'quarantine_cage_isolated',
    temperatureRequirement: 'Store below 30°C',
    isColdChain: false,
    isLightSensitive: false,
    batchStatus: 'recalled',
    recallStatus: 'patient_alerts_dispatched',
    recallReason: 'National Drug Authority (NDA) Uganda Mandatory Alert: Sub-lot dissolution profile variation identified during national pharmacovigilance surveillance.',
    recallAuthority: 'National Drug Authority (NDA)',
    recallReferenceNumber: 'NDA-REC-2026-004',
    recallInitiatedAt: '2026-03-18T10:00:00Z',
    recallInitiatedBy: 'Chief Pharmacist Dr. Elvis Ssekyanzi',
    statusChangeReason: 'Immediate stock freeze and customer recall outreach enforced per NDA mandate.',
    createdAt: '2025-03-12T14:20:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'BATCH-005',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2024-MET02',
    drugId: 'DRUG-007',
    medicineName: 'Metformin HCl 500mg Tablets (Box of 100)',
    brandName: 'Glucophage 500mg',
    genericName: 'Metformin Hydrochloride',
    dosageForm: 'Tablet',
    strength: '500 mg',
    manufacturerName: 'Medreich Ltd Uganda',
    countryOfManufacture: 'Uganda',
    manufacturingDate: '2024-01-15',
    expiryDate: '2026-01-15', // Expired
    quantityReceived: 250,
    quantityAvailable: 0,
    quantityQuarantined: 35,
    quantityDamaged: 0,
    quantityReturned: 0,
    quantityDestroyed: 0,
    packSize: 'Box of 100',
    unitOfMeasure: 'tablets',
    purchasePriceUgx: 8000,
    sellingPriceUgx: 12000,
    supplierName: 'Medreich Uganda Supply',
    supplierId: 'SUP-005',
    purchaseOrderNumber: 'PO-2024-0120',
    goodsReceivedNoteNumber: 'GRN-2024-0033',
    receivedDate: '2024-02-01T10:00:00Z',
    receivedBy: 'Pharm. Denis Kigozi (PSU #3890)',
    storageLocation: 'Expired Segregation Shelf Z (Pending Disposal)',
    storageZone: 'quarantine_cage_isolated',
    temperatureRequirement: 'Store below 25°C',
    isColdChain: false,
    isLightSensitive: false,
    batchStatus: 'expired',
    recallStatus: 'none',
    statusChangeReason: 'Automatic FEFO system lock: Batch crossed expiration date on 2026-01-15.',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'BATCH-006',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2026-SAL12',
    drugId: 'DRUG-008',
    medicineName: 'Salbutamol 100mcg Inhaler (200 Doses)',
    brandName: 'Ventolin Evohaler',
    genericName: 'Salbutamol / Albuterol',
    dosageForm: 'Metered Dose Inhaler',
    strength: '100 mcg / actuation',
    manufacturerName: 'Glaxo Wellcome Production',
    countryOfManufacture: 'France',
    manufacturingDate: '2025-08-10',
    expiryDate: '2027-08-10',
    quantityReceived: 150,
    quantityAvailable: 130,
    quantityQuarantined: 0,
    quantityDamaged: 20,
    quantityReturned: 0,
    quantityDestroyed: 0,
    packSize: '200 Doses Canister + Actuator',
    unitOfMeasure: 'inhalers',
    purchasePriceUgx: 14000,
    sellingPriceUgx: 22000,
    supplierName: 'Laborex Uganda Ltd',
    supplierId: 'SUP-006',
    purchaseOrderNumber: 'PO-2026-0611',
    goodsReceivedNoteNumber: 'GRN-2026-0145',
    invoiceNumber: 'INV-LX-4901',
    receivedDate: '2026-01-20T12:00:00Z',
    receivedBy: 'Pharm. Brenda Namubiru (PSU #4412)',
    storageLocation: 'Aisle 2, Shelf B-01 (Damaged in Quarantine Bay B)',
    storageZone: 'damaged_returns_bay',
    temperatureRequirement: 'Store below 30°C. Protect from direct heat/sunlight.',
    isColdChain: false,
    isLightSensitive: false,
    batchStatus: 'damaged',
    recallStatus: 'none',
    statusChangeReason: '20 units sustained nozzle actuator impact fracture during pallet offloading.',
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-01-21T09:00:00Z',
  },
  {
    id: 'BATCH-007',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2026-CIP33',
    drugId: 'DRUG-010',
    medicineName: 'Ciprofloxacin 500mg Tablets (Box of 100)',
    brandName: 'Cipro-Denk 500',
    genericName: 'Ciprofloxacin Hydrochloride',
    dosageForm: 'Film-coated Tablet',
    strength: '500 mg',
    manufacturerName: 'Denk Pharma GmbH',
    countryOfManufacture: 'Germany',
    manufacturingDate: '2025-09-01',
    expiryDate: '2028-09-01',
    quantityReceived: 100,
    quantityAvailable: 0,
    quantityQuarantined: 0,
    quantityDamaged: 0,
    quantityReturned: 100,
    quantityDestroyed: 0,
    packSize: 'Box of 100 (10x10 Blister)',
    unitOfMeasure: 'tablets',
    purchasePriceUgx: 18000,
    sellingPriceUgx: 28000,
    supplierName: 'Astra Pharma Uganda Ltd',
    supplierId: 'SUP-007',
    purchaseOrderNumber: 'PO-2026-0504',
    goodsReceivedNoteNumber: 'GRN-2026-0121',
    invoiceNumber: 'INV-AST-1922',
    receivedDate: '2026-02-02T15:00:00Z',
    receivedBy: 'Pharm. Denis Kigozi (PSU #3890)',
    storageLocation: 'Outbound Supplier Returns Bay (RTV Staging)',
    storageZone: 'damaged_returns_bay',
    temperatureRequirement: 'Store below 25°C',
    isColdChain: false,
    isLightSensitive: false,
    batchStatus: 'returned',
    recallStatus: 'returned_to_vendor',
    statusChangeReason: 'Supplier specification discrepancy: Shipped 500mg instead of contracted 250mg pediatric pack. Returned with RTV Credit Note #RTV-2026-011.',
    createdAt: '2026-02-02T15:00:00Z',
    updatedAt: '2026-02-05T11:30:00Z',
  },
  {
    id: 'BATCH-008',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2024-AZI01',
    drugId: 'DRUG-011',
    medicineName: 'Azithromycin 500mg Tablets (Box of 3)',
    brandName: 'Zithromax 500mg',
    genericName: 'Azithromycin Dihydrate',
    dosageForm: 'Tablet',
    strength: '500 mg',
    manufacturerName: 'Pfizer Inc',
    countryOfManufacture: 'Italy',
    manufacturingDate: '2023-08-01',
    expiryDate: '2025-08-01',
    quantityReceived: 100,
    quantityAvailable: 0,
    quantityQuarantined: 0,
    quantityDamaged: 0,
    quantityReturned: 0,
    quantityDestroyed: 45,
    packSize: 'Box of 3 Tablets',
    unitOfMeasure: 'tablets',
    purchasePriceUgx: 9500,
    sellingPriceUgx: 16000,
    supplierName: 'Medipharm Industries',
    supplierId: 'SUP-008',
    purchaseOrderNumber: 'PO-2024-0315',
    goodsReceivedNoteNumber: 'GRN-2024-0072',
    receivedDate: '2024-03-20T10:00:00Z',
    receivedBy: 'Pharm. Brenda Namubiru (PSU #4412)',
    storageLocation: 'NEMA Approved Medical Waste High-Temp Incineration Facility',
    storageZone: 'damaged_returns_bay',
    temperatureRequirement: 'Hazardous Waste Neutralized',
    isColdChain: false,
    isLightSensitive: false,
    batchStatus: 'destroyed',
    recallStatus: 'destroyed_witnessed',
    destructionCertificateNumber: 'NDA-DISP-CERT-2026-0881',
    statusChangeReason: 'Expired stock incinerated at Nakasongola Waste Management facility witnessed by NDA Inspector Mr. Peter Mugisha.',
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2026-02-18T16:45:00Z',
  },
  {
    id: 'BATCH-009',
    tenantId: 'tenant_prime',
    branchId: 'branch_kampala_central',
    batchNumber: 'BAT-2026-MRP08',
    drugId: 'DRUG-012',
    medicineName: 'Morphine Sulphate 10mg/5mL Oral Liquid (100mL)',
    brandName: 'Oramorph Oral Solution',
    genericName: 'Morphine Sulphate',
    dosageForm: 'Oral Liquid',
    strength: '10 mg / 5 mL',
    manufacturerName: 'Martindale Pharma UK',
    countryOfManufacture: 'United Kingdom',
    manufacturingDate: '2025-10-15',
    expiryDate: '2027-10-15',
    quantityReceived: 50,
    quantityAvailable: 38,
    quantityQuarantined: 0,
    quantityDamaged: 0,
    quantityReturned: 0,
    quantityDestroyed: 0,
    packSize: '100 mL Amber Glass Bottle',
    unitOfMeasure: 'bottles',
    purchasePriceUgx: 45000,
    sellingPriceUgx: 65000,
    supplierName: 'Joint Medical Store (JMS)',
    supplierId: 'SUP-009',
    purchaseOrderNumber: 'PO-2026-0740',
    goodsReceivedNoteNumber: 'GRN-2026-0160',
    invoiceNumber: 'INV-JMS-8812',
    receivedDate: '2026-02-18T11:00:00Z',
    receivedBy: 'Pharm. Sarah Akello (PSU #5011)',
    storageLocation: 'Schedule 1 Poison Safe - Vault A (Dual Combination Lock)',
    storageZone: 'schedule_1_poison_safe',
    temperatureRequirement: 'Store below 25°C. Protect from Light.',
    isColdChain: false,
    isLightSensitive: true,
    batchStatus: 'available',
    recallStatus: 'none',
    createdAt: '2026-02-18T11:00:00Z',
    updatedAt: '2026-02-18T11:00:00Z',
  }
];

const INITIAL_AUDIT_TRAIL: BatchAuditTrailEntry[] = [
  {
    id: 'AUDIT-001',
    batchId: 'BATCH-004',
    batchNumber: 'BAT-2025-COA44',
    actionType: 'RECALL_INITIATED',
    previousState: 'available',
    newState: 'recalled',
    quantityAffected: 80,
    reason: 'National Drug Authority (NDA) Uganda Mandatory Alert #NDA-REC-2026-004 received.',
    performedByName: 'Dr. Elvis Ssekyanzi (Superintendent Pharmacist)',
    witnessName: 'Pharm. Sarah Akello',
    regulatoryReference: 'NDA-REC-2026-004',
    createdAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'AUDIT-002',
    batchId: 'BATCH-004',
    batchNumber: 'BAT-2025-COA44',
    actionType: 'PATIENT_ALERT_DISPATCHED',
    newState: 'recalled',
    quantityAffected: 220,
    reason: 'Automated SMS & App push alerts broadcast to 18 patients who received this batch during the active window.',
    performedByName: 'ZenithRx Automated Pharmacovigilance Engine',
    regulatoryReference: 'NDA-REC-2026-004',
    createdAt: '2026-03-18T10:05:00Z',
  },
  {
    id: 'AUDIT-003',
    batchId: 'BATCH-002',
    batchNumber: 'BAT-2026-AMX09',
    actionType: 'QUARANTINE_ENFORCED',
    previousState: 'available',
    newState: 'quarantined',
    quantityAffected: 200,
    reason: 'Desiccant moisture seal check failed on intake inspection sample.',
    performedByName: 'Pharm. Denis Kigozi',
    witnessName: 'Pharm. Sarah Akello',
    createdAt: '2026-03-01T11:15:00Z',
  },
  {
    id: 'AUDIT-004',
    batchId: 'BATCH-008',
    batchNumber: 'BAT-2024-AZI01',
    actionType: 'DISPOSAL_WITNESSED',
    previousState: 'expired',
    newState: 'destroyed',
    quantityAffected: 45,
    reason: 'Witnessed incineration of expired stock at Nakasongola certified hazardous medical waste facility.',
    performedByName: 'Pharm. Brenda Namubiru',
    witnessName: 'NDA Inspector Peter Mugisha',
    regulatoryReference: 'NDA-DISP-CERT-2026-0881',
    createdAt: '2026-02-18T16:45:00Z',
  }
];

const INITIAL_RECALL_PATIENTS: RecallPatientEntry[] = [
  {
    id: 'REC-PT-001',
    batchId: 'BATCH-004',
    batchNumber: 'BAT-2025-COA44',
    drugName: 'Coartem 20/120mg Dispersible Tablets',
    prescriptionId: 'RX-2026-0881',
    patientId: 'PT-1002',
    patientName: 'Grace Nakato',
    patientPhone: '+256 701 445 921',
    quantityDispensed: 24,
    dispensedDate: '2026-03-02T14:30:00Z',
    alertStatus: 'patient_contacted',
    contactNotes: 'Patient advised to withhold medication and return pack for free therapeutic replacement. Patient in good health.',
    alertDispatchedAt: '2026-03-18T10:05:00Z',
  },
  {
    id: 'REC-PT-002',
    batchId: 'BATCH-004',
    batchNumber: 'BAT-2025-COA44',
    drugName: 'Coartem 20/120mg Dispersible Tablets',
    prescriptionId: 'RX-2026-0914',
    patientId: 'PT-1088',
    patientName: 'David Mukasa',
    patientPhone: '+256 772 119 044',
    quantityDispensed: 24,
    dispensedDate: '2026-03-05T09:15:00Z',
    alertStatus: 'sms_dispatched',
    contactNotes: 'SMS delivered. Follow-up phone call pending by clinical pharmacist.',
    alertDispatchedAt: '2026-03-18T10:05:00Z',
  },
  {
    id: 'REC-PT-003',
    batchId: 'BATCH-004',
    batchNumber: 'BAT-2025-COA44',
    drugName: 'Coartem 20/120mg Dispersible Tablets',
    prescriptionId: 'RX-2026-0945',
    patientId: 'PT-1104',
    patientName: 'Kato Emmanuel',
    patientPhone: '+256 788 552 100',
    quantityDispensed: 12,
    dispensedDate: '2026-03-08T16:20:00Z',
    alertStatus: 'returned_to_pharmacy',
    contactNotes: 'Pack returned and exchanged with replacement lot BAT-2026-COA99. Return logged in NDA register.',
    alertDispatchedAt: '2026-03-18T10:05:00Z',
  }
];

class BatchManagementService {
  private batches: PharmacyBatchItem[] = [...INITIAL_BATCHES];
  private auditTrail: BatchAuditTrailEntry[] = [...INITIAL_AUDIT_TRAIL];
  private recallPatients: RecallPatientEntry[] = [...INITIAL_RECALL_PATIENTS];

  public getAllBatches(): PharmacyBatchItem[] {
    return [...this.batches];
  }

  public getBatchById(id: string): PharmacyBatchItem | undefined {
    return this.batches.find((b) => b.id === id || b.batchNumber === id);
  }

  public getBatchesByDrugId(drugId: string): PharmacyBatchItem[] {
    return this.batches.filter((b) => b.drugId === drugId);
  }

  public getBatchesByState(state: BatchLifecycleState): PharmacyBatchItem[] {
    return this.batches.filter((b) => b.batchStatus === state);
  }

  public getBatchesByStorageZone(zone: string): PharmacyBatchItem[] {
    return this.batches.filter((b) => b.storageZone === zone);
  }

  public getBatchKPIs() {
    const totalBatches = this.batches.length;
    const availableCount = this.batches.filter((b) => b.batchStatus === 'available').length;
    const quarantinedCount = this.batches.filter((b) => b.batchStatus === 'quarantined').length;
    const recalledCount = this.batches.filter((b) => b.batchStatus === 'recalled').length;
    const expiredCount = this.batches.filter((b) => b.batchStatus === 'expired').length;
    const damagedCount = this.batches.filter((b) => b.batchStatus === 'damaged').length;
    const returnedCount = this.batches.filter((b) => b.batchStatus === 'returned').length;
    const destroyedCount = this.batches.filter((b) => b.batchStatus === 'destroyed').length;

    const totalValuationUgx = this.batches.reduce((sum, b) => sum + (b.quantityAvailable * b.sellingPriceUgx), 0);
    const quarantinedValuationUgx = this.batches.reduce((sum, b) => sum + (b.quantityQuarantined * b.purchasePriceUgx), 0);
    const damagedValuationUgx = this.batches.reduce((sum, b) => sum + (b.quantityDamaged * b.purchasePriceUgx), 0);

    return {
      totalBatches,
      availableCount,
      quarantinedCount,
      recalledCount,
      expiredCount,
      damagedCount,
      returnedCount,
      destroyedCount,
      totalValuationUgx,
      quarantinedValuationUgx,
      damagedValuationUgx,
    };
  }

  public transitionBatchState(
    batchId: string,
    newState: BatchLifecycleState,
    params: {
      reason: string;
      performedBy: string;
      witnessName?: string;
      regulatoryRef?: string;
      quantity?: number;
      newStorageLocation?: string;
      newRecallStatus?: BatchRecallStatus;
    }
  ): PharmacyBatchItem {
    const index = this.batches.findIndex((b) => b.id === batchId || b.batchNumber === batchId);
    if (index === -1) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const batch = this.batches[index];
    const previousState = batch.batchStatus;
    const qtyAffected = params.quantity ?? (batch.quantityAvailable || batch.quantityQuarantined || batch.quantityReceived);

    // Update quantities according to target state
    const updated: PharmacyBatchItem = {
      ...batch,
      batchStatus: newState,
      statusChangeReason: params.reason,
      storageLocation: params.newStorageLocation || batch.storageLocation,
      recallStatus: params.newRecallStatus !== undefined ? params.newRecallStatus : batch.recallStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newState === 'quarantined') {
      updated.quantityQuarantined = (batch.quantityQuarantined || 0) + qtyAffected;
      updated.quantityAvailable = Math.max(0, batch.quantityAvailable - qtyAffected);
    } else if (newState === 'available') {
      updated.quantityAvailable = (batch.quantityAvailable || 0) + qtyAffected;
      updated.quantityQuarantined = Math.max(0, (batch.quantityQuarantined || 0) - qtyAffected);
      updated.recallStatus = 'none';
    } else if (newState === 'recalled') {
      updated.quantityQuarantined = (batch.quantityQuarantined || 0) + batch.quantityAvailable;
      updated.quantityAvailable = 0;
      updated.recallStatus = 'quarantine_enforced';
    } else if (newState === 'damaged') {
      updated.quantityDamaged = (batch.quantityDamaged || 0) + qtyAffected;
      updated.quantityAvailable = Math.max(0, batch.quantityAvailable - qtyAffected);
    } else if (newState === 'returned') {
      updated.quantityReturned = (batch.quantityReturned || 0) + qtyAffected;
      updated.quantityAvailable = Math.max(0, batch.quantityAvailable - qtyAffected);
      updated.recallStatus = 'returned_to_vendor';
    } else if (newState === 'destroyed') {
      updated.quantityDestroyed = (batch.quantityDestroyed || 0) + qtyAffected;
      updated.quantityAvailable = 0;
      updated.quantityQuarantined = 0;
      updated.destructionCertificateNumber = params.regulatoryRef || `NDA-DISP-${Date.now().toString().slice(-4)}`;
      updated.recallStatus = 'destroyed_witnessed';
    }

    this.batches[index] = updated;

    // Log Audit Trail
    this.logBatchAudit({
      batchId: updated.id,
      batchNumber: updated.batchNumber,
      actionType: 'STATE_TRANSITION',
      previousState,
      newState,
      quantityAffected: qtyAffected,
      reason: params.reason,
      performedByName: params.performedBy,
      witnessName: params.witnessName,
      regulatoryReference: params.regulatoryRef,
    });

    return updated;
  }

  public initiateRecall(
    batchId: string,
    recallData: {
      reason: string;
      authority: string;
      referenceNumber: string;
      initiatedBy: string;
      witnessName?: string;
    }
  ): PharmacyBatchItem {
    const index = this.batches.findIndex((b) => b.id === batchId || b.batchNumber === batchId);
    if (index === -1) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const batch = this.batches[index];
    const previousState = batch.batchStatus;
    const qtyToLock = batch.quantityAvailable;

    const updated: PharmacyBatchItem = {
      ...batch,
      batchStatus: 'recalled',
      recallStatus: 'recall_initiated',
      recallReason: recallData.reason,
      recallAuthority: recallData.authority,
      recallReferenceNumber: recallData.referenceNumber,
      recallInitiatedAt: new Date().toISOString(),
      recallInitiatedBy: recallData.initiatedBy,
      quantityQuarantined: (batch.quantityQuarantined || 0) + qtyToLock,
      quantityAvailable: 0,
      storageLocation: `Quarantine Safe - Recalled (${recallData.referenceNumber})`,
      storageZone: 'quarantine_cage_isolated',
      statusChangeReason: `Mandatory Recall enforced by ${recallData.authority}: ${recallData.reason}`,
      updatedAt: new Date().toISOString(),
    };

    this.batches[index] = updated;

    this.logBatchAudit({
      batchId: updated.id,
      batchNumber: updated.batchNumber,
      actionType: 'RECALL_INITIATED',
      previousState,
      newState: 'recalled',
      quantityAffected: qtyToLock,
      reason: recallData.reason,
      performedByName: recallData.initiatedBy,
      witnessName: recallData.witnessName,
      regulatoryReference: recallData.referenceNumber,
    });

    return updated;
  }

  public dispatchRecallAlerts(batchId: string): number {
    const batch = this.getBatchById(batchId);
    if (!batch) return 0;

    let alertCount = 0;
    this.recallPatients = this.recallPatients.map((p) => {
      if (p.batchId === batch.id || p.batchNumber === batch.batchNumber) {
        alertCount++;
        return {
          ...p,
          alertStatus: 'sms_dispatched',
          alertDispatchedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    // Update batch recall status
    this.updateBatch(batch.id, {
      recallStatus: 'patient_alerts_dispatched',
    });

    this.logBatchAudit({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      actionType: 'PATIENT_ALERT_DISPATCHED',
      newState: 'recalled',
      quantityAffected: alertCount,
      reason: `Automated urgent SMS recall notices dispatched to ${alertCount} registered patients.`,
      performedByName: 'ZenithRx Automated Pharmacovigilance Engine',
      regulatoryReference: batch.recallReferenceNumber,
    });

    return alertCount;
  }

  public logBatchAudit(entry: Omit<BatchAuditTrailEntry, 'id' | 'createdAt'>): BatchAuditTrailEntry {
    const newEntry: BatchAuditTrailEntry = {
      ...entry,
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.auditTrail.unshift(newEntry);
    return newEntry;
  }

  public getBatchAuditTrail(batchId?: string): BatchAuditTrailEntry[] {
    if (batchId) {
      return this.auditTrail.filter((a) => a.batchId === batchId || a.batchNumber === batchId);
    }
    return [...this.auditTrail];
  }

  public getRecallPatientLedger(batchId?: string): RecallPatientEntry[] {
    if (batchId) {
      return this.recallPatients.filter((p) => p.batchId === batchId || p.batchNumber === batchId);
    }
    return [...this.recallPatients];
  }

  public createBatch(batchData: Omit<PharmacyBatchItem, 'id' | 'createdAt' | 'updatedAt'>): PharmacyBatchItem {
    const newBatch: PharmacyBatchItem = {
      ...batchData,
      id: `BATCH-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.batches.unshift(newBatch);

    this.logBatchAudit({
      batchId: newBatch.id,
      batchNumber: newBatch.batchNumber,
      actionType: 'STOCK_ADJUSTMENT',
      newState: newBatch.batchStatus,
      quantityAffected: newBatch.quantityReceived,
      reason: `Initial stock intake via PO ${newBatch.purchaseOrderNumber} & GRN ${newBatch.goodsReceivedNoteNumber}.`,
      performedByName: newBatch.receivedBy,
    });

    return newBatch;
  }

  public updateBatch(id: string, updates: Partial<PharmacyBatchItem>): PharmacyBatchItem {
    const index = this.batches.findIndex((b) => b.id === id || b.batchNumber === id);
    if (index === -1) {
      throw new Error(`Batch ${id} not found`);
    }
    this.batches[index] = {
      ...this.batches[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.batches[index];
  }
}

export const batchManagementService = new BatchManagementService();
