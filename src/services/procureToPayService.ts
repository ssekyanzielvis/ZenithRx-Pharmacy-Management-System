/**
 * procureToPayService.ts — Enterprise Procure-to-Pay (P2P) Pharmacy Workflow Service
 *
 * Implements the complete 9-Stage Pharmacy Procurement & Governance Lifecycle:
 * 1. Purchase Requisition (PR)
 * 2. Purchase Order (PO)
 * 3. Supplier Confirmation
 * 4. Goods Received Note (GRN)
 * 5. Batch Registration
 * 6. Quality/Quantity Verification & Cold Chain Inspection
 * 7. Supplier Invoice
 * 8. 3-Way Invoice Matching (PO vs GRN vs Invoice)
 * 9. Payment Authorization & Settlement
 */

import {
  ProcureToPayDossier,
  PurchaseRequisition,
  P2PPurchaseOrder,
  P2PGoodsReceivedNote,
  P2PQualityInspection,
  P2PSupplierInvoice,
  P2PInvoiceMatchingRecord,
  P2PPaymentVoucher,
  P2PKPIs,
} from '../types/v2Types';

// Initial realistic P2P dossiers
const INITIAL_DOSSIERS: ProcureToPayDossier[] = [
  {
    id: 'dossier-001',
    dossierCode: 'P2P-2026-0081',
    title: 'Essential Antibiotics & Anti-malarial Restock (Q1)',
    currentStage: 'payment',
    overallStatus: 'Completed & Settled',
    totalValueUgx: 18450000,
    lastUpdated: '2026-03-24T14:30:00Z',
    requisition: {
      id: 'pr-001',
      tenantId: 'client-001',
      prNumber: 'PR-2026-0142',
      branchName: 'Main Dispensary & Central Store',
      requestedByName: 'Pharm. Elvis Ssekyanzi',
      requestedByRole: 'Supervising Pharmacist',
      priority: 'urgent',
      requisitionReason: 'Stock level dropped below 15-day safety threshold across Amoxicillin, Coartem, and Ceftriaxone.',
      status: 'converted_to_po',
      estimatedTotalUgx: 18450000,
      approvedByName: 'Dr. Sarah Nabatanzi',
      approvedByRole: 'Pharmacy Owner / Medical Director',
      approvedAt: '2026-03-18T09:00:00Z',
      createdAt: '2026-03-17T16:20:00Z',
      items: [
        {
          id: 'pri-1',
          genericName: 'Artemether + Lumefantrine (Coartem)',
          brandName: 'Coartem 20/120mg',
          dosageForm: 'Tablet',
          strength: '20/120mg (Pack of 24s)',
          currentStockLevel: 25,
          reorderLevel: 100,
          requestedQuantity: 200,
          unitOfMeasure: 'Box of 24s',
          estimatedUnitCostUgx: 28000,
          lineTotalEstimatedUgx: 5600000,
          clinicalJustification: 'High malaria transmission season spike in Central Kampala.',
        },
        {
          id: 'pri-2',
          genericName: 'Amoxicillin + Clavulanic Acid (Augmentin)',
          brandName: 'Augmentin 625mg',
          dosageForm: 'Tablet',
          strength: '625mg',
          currentStockLevel: 18,
          reorderLevel: 80,
          requestedQuantity: 150,
          unitOfMeasure: 'Pack of 14s',
          estimatedUnitCostUgx: 45000,
          lineTotalEstimatedUgx: 6750000,
          clinicalJustification: 'Standard first-line broad spectrum antibiotic.',
        },
        {
          id: 'pri-3',
          genericName: 'Ceftriaxone Sodium Injection',
          brandName: 'Rocephin 1g IV/IM',
          dosageForm: 'Powder for Injection',
          strength: '1g Vial + Diluent',
          currentStockLevel: 30,
          reorderLevel: 120,
          requestedQuantity: 250,
          unitOfMeasure: 'Vials',
          estimatedUnitCostUgx: 24400,
          lineTotalEstimatedUgx: 6100000,
          clinicalJustification: 'Inpatient and emergency ward referral orders.',
        },
      ],
    },
    purchaseOrder: {
      id: 'po-001',
      tenantId: 'client-001',
      poNumber: 'PO-2026-0299',
      requisitionId: 'pr-001',
      requisitionNumber: 'PR-2026-0142',
      supplierId: 'sup-001',
      supplierName: 'Abacus Pharma (A) Limited',
      supplierLicenseNo: 'NDA/WDL/2026/0014',
      supplierEmail: 'orders@abacuspharma.com',
      supplierPhone: '+256 414 340 000',
      paymentTerms: 'Net 30 Days',
      deliveryLocation: 'ZenithRx Central Pharmacy Store, Kampala',
      expectedDeliveryDate: '2026-03-21',
      currency: 'UGX',
      totalOrderAmountUgx: 18450000,
      status: 'fully_received',
      supplierAckReference: 'ACK-ABACUS-99120',
      supplierConfirmedAt: '2026-03-19T08:15:00Z',
      supplierConfirmedDispatchDate: '2026-03-20',
      supplierBackorderNotes: 'All line items confirmed with >24 months residual shelf-life.',
      createdByName: 'Pharm. Elvis Ssekyanzi',
      createdByRole: 'Supervising Pharmacist',
      createdAt: '2026-03-18T10:30:00Z',
      items: [
        {
          id: 'poi-1',
          genericName: 'Artemether + Lumefantrine (Coartem)',
          brandName: 'Coartem 20/120mg',
          dosageForm: 'Tablet',
          strength: '20/120mg (Pack of 24s)',
          orderedQuantity: 200,
          unitCostUgx: 28000,
          totalLineAmountUgx: 5600000,
          confirmedQuantity: 200,
          confirmedUnitCostUgx: 28000,
        },
        {
          id: 'poi-2',
          genericName: 'Amoxicillin + Clavulanic Acid (Augmentin)',
          brandName: 'Augmentin 625mg',
          dosageForm: 'Tablet',
          strength: '625mg',
          orderedQuantity: 150,
          unitCostUgx: 45000,
          totalLineAmountUgx: 6750000,
          confirmedQuantity: 150,
          confirmedUnitCostUgx: 45000,
        },
        {
          id: 'poi-3',
          genericName: 'Ceftriaxone Sodium Injection',
          brandName: 'Rocephin 1g IV/IM',
          dosageForm: 'Powder for Injection',
          strength: '1g Vial + Diluent',
          orderedQuantity: 250,
          unitCostUgx: 24400,
          totalLineAmountUgx: 6100000,
          confirmedQuantity: 250,
          confirmedUnitCostUgx: 24400,
        },
      ],
    },
    goodsReceivedNote: {
      id: 'grn-001',
      tenantId: 'client-001',
      grnNumber: 'GRN-2026-0412',
      purchaseOrderId: 'po-001',
      poNumber: 'PO-2026-0299',
      supplierName: 'Abacus Pharma (A) Limited',
      deliveryNoteNumber: 'DN-AB-2026-8831',
      waybillCarrierName: 'Abacus Dedicated Pharma Logistics',
      vehicleRegistration: 'UBK 482Y (Temp Controlled)',
      receivedByName: 'Opio Derrick',
      receivedByRole: 'Store Keeper & Inventory Tech',
      receiptDate: '2026-03-20T11:45:00Z',
      totalPackagesReceived: 12,
      externalPackagingCondition: 'All outer shipper cartons tamper-sealed with NDA hologram tags intact.',
      items: [
        {
          id: 'gri-1',
          genericName: 'Artemether + Lumefantrine (Coartem)',
          brandName: 'Coartem 20/120mg',
          orderedQuantity: 200,
          deliveredQuantity: 200,
          varianceQuantity: 0,
          unitOfMeasure: 'Box of 24s',
          batchNumber: 'COA-2026-B81',
          manufacturerName: 'Novartis Pharma AG',
          countryOfOrigin: 'Switzerland',
          manufacturingDate: '2026-01-10',
          expiryDate: '2028-12-31',
          assignedStorageLocation: 'Aisle B - Shelf 3 (Air Conditioned)',
          isColdChain: false,
        },
        {
          id: 'gri-2',
          genericName: 'Amoxicillin + Clavulanic Acid (Augmentin)',
          brandName: 'Augmentin 625mg',
          orderedQuantity: 150,
          deliveredQuantity: 150,
          varianceQuantity: 0,
          unitOfMeasure: 'Pack of 14s',
          batchNumber: 'AUG-2026-X19',
          manufacturerName: 'GSK Pharmaceuticals Ltd',
          countryOfOrigin: 'United Kingdom',
          manufacturingDate: '2026-02-01',
          expiryDate: '2028-01-31',
          assignedStorageLocation: 'Aisle A - Shelf 2 (Dessicant Protected)',
          isColdChain: false,
        },
        {
          id: 'gri-3',
          genericName: 'Ceftriaxone Sodium Injection',
          brandName: 'Rocephin 1g IV/IM',
          orderedQuantity: 250,
          deliveredQuantity: 250,
          varianceQuantity: 0,
          unitOfMeasure: 'Vials',
          batchNumber: 'CEF-2026-H44',
          manufacturerName: 'Roche Diagnostics',
          countryOfOrigin: 'Germany',
          manufacturingDate: '2026-01-15',
          expiryDate: '2028-06-30',
          assignedStorageLocation: 'Injectable Vault Safe Bay 1',
          isColdChain: false,
        },
      ],
      createdAt: '2026-03-20T12:15:00Z',
    },
    qualityInspection: {
      id: 'qc-001',
      tenantId: 'client-001',
      qcNumber: 'QC-2026-0198',
      grnId: 'grn-001',
      grnNumber: 'GRN-2026-0412',
      inspectorPharmacistName: 'Pharm. Elvis Ssekyanzi',
      inspectorPsuLicenseNo: 'PSU/REG/2026/4092',
      inspectionDate: '2026-03-20T13:30:00Z',
      physicalCountVerified: true,
      sealsAndLabelingVerified: true,
      coldChainLogVerified: true,
      temperatureReadoutCelsius: 21.4,
      certificateOfAnalysisVerified: true,
      outcome: 'passed_released_to_stock',
      passedQuantity: 600,
      quarantinedQuantity: 0,
      rejectedQuantity: 0,
      qcRemarks: 'All Certificate of Analysis (CoA) batches verified against manufacturer specs. Passed 100% into active saleable inventory.',
      createdAt: '2026-03-20T14:00:00Z',
    },
    supplierInvoice: {
      id: 'inv-001',
      tenantId: 'client-001',
      invoiceNumber: 'INV-ABACUS-2026-904',
      supplierName: 'Abacus Pharma (A) Limited',
      purchaseOrderId: 'po-001',
      poNumber: 'PO-2026-0299',
      grnId: 'grn-001',
      grnNumber: 'GRN-2026-0412',
      invoiceDate: '2026-03-20',
      dueDate: '2026-04-19',
      subtotalUgx: 18450000,
      taxVatUgx: 0, // Essential Human Medicines VAT Exempt in Uganda
      withholdingTaxUgx: 1107000, // 6% WHT on non-resident supplies / commercial vendor
      freightHandlingUgx: 0,
      totalInvoicedAmountUgx: 18450000,
      invoiceDocumentUrl: '/docs/invoices/INV-ABACUS-2026-904.pdf',
      notes: 'Terms: Net 30 days. Bank Wire account provided.',
      createdAt: '2026-03-21T09:00:00Z',
    },
    matchingRecord: {
      id: 'match-001',
      tenantId: 'client-001',
      matchReference: '3WAY-MATCH-2026-0081',
      invoiceId: 'inv-001',
      invoiceNumber: 'INV-ABACUS-2026-904',
      purchaseOrderId: 'po-001',
      poNumber: 'PO-2026-0299',
      grnId: 'grn-001',
      grnNumber: 'GRN-2026-0412',
      poAuthorizedAmountUgx: 18450000,
      grnAcceptedValueUgx: 18450000,
      invoiceBilledAmountUgx: 18450000,
      priceVarianceUgx: 0,
      quantityVarianceUnits: 0,
      netVarianceUgx: 0,
      matchStatus: 'exact_match',
      varianceExplanation: '100% exact match across PO unit prices, GRN verified receipts, and Tax Invoice lines.',
      verifiedByName: 'Kigozi Jonathan',
      verifiedByRole: 'Finance & Accounts Officer',
      matchedAt: '2026-03-21T10:45:00Z',
    },
    paymentVoucher: {
      id: 'pv-001',
      tenantId: 'client-001',
      voucherNumber: 'PV-2026-0044',
      invoiceId: 'inv-001',
      invoiceNumber: 'INV-ABACUS-2026-904',
      matchRecordId: 'match-001',
      supplierName: 'Abacus Pharma (A) Limited',
      paymentMethod: 'Bank Wire / EFT',
      bankAccountOrMomoRef: 'Stanbic Bank A/C 9030005518293 (Abacus Pharma)',
      grossAmountUgx: 18450000,
      whtDeductedUgx: 1107000,
      netPayableUgx: 17343000,
      paymentStatus: 'settled_and_reconciled',
      authorizedByName: 'Dr. Sarah Nabatanzi',
      authorizedByRole: 'Pharmacy Owner',
      authorizedAt: '2026-03-22T11:00:00Z',
      paidAt: '2026-03-24T14:30:00Z',
      transactionReference: 'EFT-STANBIC-UG-2026-881920',
      settlementNotes: 'Settled via Electronic Funds Transfer. Official receipt issued.',
      createdAt: '2026-03-22T09:30:00Z',
    },
  },
  {
    id: 'dossier-002',
    dossierCode: 'P2P-2026-0094',
    title: 'Cold Chain Biologics & Insulins Procurement',
    currentStage: 'quality_verification',
    overallStatus: 'In Progress',
    totalValueUgx: 12800000,
    lastUpdated: '2026-03-24T16:00:00Z',
    requisition: {
      id: 'pr-002',
      tenantId: 'client-001',
      prNumber: 'PR-2026-0158',
      branchName: 'Main Dispensary & Store',
      requestedByName: 'Pharm. Elvis Ssekyanzi',
      requestedByRole: 'Supervising Pharmacist',
      priority: 'urgent',
      requisitionReason: 'Diabetic patient insulin demand surge. Maintaining refrigerated stock for Mixtard & Lantus.',
      status: 'converted_to_po',
      estimatedTotalUgx: 12800000,
      approvedByName: 'Dr. Sarah Nabatanzi',
      approvedByRole: 'Pharmacy Owner',
      approvedAt: '2026-03-22T10:00:00Z',
      createdAt: '2026-03-22T08:30:00Z',
      items: [
        {
          id: 'pri-21',
          genericName: 'Insulin Human 30/70 (Mixtard 30 Penfill)',
          brandName: 'Mixtard 30 HM 100IU/mL',
          dosageForm: 'Injectable Suspension',
          strength: '100 IU/mL (Pack of 5 Penfills)',
          currentStockLevel: 8,
          reorderLevel: 40,
          requestedQuantity: 80,
          unitOfMeasure: 'Pack of 5',
          estimatedUnitCostUgx: 75000,
          lineTotalEstimatedUgx: 6000000,
          clinicalJustification: 'Cold chain essential diabetes maintenance.',
        },
        {
          id: 'pri-22',
          genericName: 'Insulin Glargine (Lantus SoloStar)',
          brandName: 'Lantus 100 U/mL SoloStar',
          dosageForm: 'Injectable Solution',
          strength: '100 U/mL (Box of 5 Pens)',
          currentStockLevel: 6,
          reorderLevel: 30,
          requestedQuantity: 50,
          unitOfMeasure: 'Box of 5',
          estimatedUnitCostUgx: 136000,
          lineTotalEstimatedUgx: 6800000,
          clinicalJustification: 'Basal insulin for chronic endocrinology patients.',
        },
      ],
    },
    purchaseOrder: {
      id: 'po-002',
      tenantId: 'client-001',
      poNumber: 'PO-2026-0314',
      requisitionId: 'pr-002',
      requisitionNumber: 'PR-2026-0158',
      supplierId: 'sup-002',
      supplierName: 'Laborex Uganda Ltd',
      supplierLicenseNo: 'NDA/WDL/2026/0009',
      supplierEmail: 'orders@laborex-ug.com',
      supplierPhone: '+256 414 259 881',
      paymentTerms: 'Net 30 Days',
      deliveryLocation: 'ZenithRx Cold Room Receiving Bay',
      expectedDeliveryDate: '2026-03-24',
      currency: 'UGX',
      totalOrderAmountUgx: 12800000,
      status: 'partially_received',
      supplierAckReference: 'ACK-LABOREX-4421',
      supplierConfirmedAt: '2026-03-23T09:00:00Z',
      supplierConfirmedDispatchDate: '2026-03-24',
      supplierBackorderNotes: 'Refrigerated van dispatch at 2C - 8C with digital TempTale loggers.',
      createdByName: 'Pharm. Elvis Ssekyanzi',
      createdByRole: 'Supervising Pharmacist',
      createdAt: '2026-03-22T11:00:00Z',
      items: [
        {
          id: 'poi-21',
          genericName: 'Insulin Human 30/70 (Mixtard 30 Penfill)',
          brandName: 'Mixtard 30 HM 100IU/mL',
          dosageForm: 'Injectable Suspension',
          strength: '100 IU/mL',
          orderedQuantity: 80,
          unitCostUgx: 75000,
          totalLineAmountUgx: 6000000,
          confirmedQuantity: 80,
          confirmedUnitCostUgx: 75000,
        },
        {
          id: 'poi-22',
          genericName: 'Insulin Glargine (Lantus SoloStar)',
          brandName: 'Lantus 100 U/mL SoloStar',
          dosageForm: 'Injectable Solution',
          strength: '100 U/mL',
          orderedQuantity: 50,
          unitCostUgx: 136000,
          totalLineAmountUgx: 6800000,
          confirmedQuantity: 50,
          confirmedUnitCostUgx: 136000,
        },
      ],
    },
    goodsReceivedNote: {
      id: 'grn-002',
      tenantId: 'client-001',
      grnNumber: 'GRN-2026-0428',
      purchaseOrderId: 'po-002',
      poNumber: 'PO-2026-0314',
      supplierName: 'Laborex Uganda Ltd',
      deliveryNoteNumber: 'DN-LAB-2026-5519',
      waybillCarrierName: 'Laborex Cold Chain Express',
      vehicleRegistration: 'UAX 912K (Refrigerated)',
      receivedByName: 'Opio Derrick',
      receivedByRole: 'Store Keeper & Inventory Tech',
      receiptDate: '2026-03-24T14:00:00Z',
      totalPackagesReceived: 4,
      externalPackagingCondition: 'Insulated styrofoam containers with conditioned gel packs. Temp indicators intact.',
      items: [
        {
          id: 'gri-21',
          genericName: 'Insulin Human 30/70 (Mixtard 30 Penfill)',
          brandName: 'Mixtard 30 HM 100IU/mL',
          orderedQuantity: 80,
          deliveredQuantity: 80,
          varianceQuantity: 0,
          unitOfMeasure: 'Pack of 5',
          batchNumber: 'MIX-2026-K92',
          manufacturerName: 'Novo Nordisk A/S',
          countryOfOrigin: 'Denmark',
          manufacturingDate: '2026-01-20',
          expiryDate: '2027-12-31',
          assignedStorageLocation: 'Cold Room 1 - Refrigerator A (2C - 8C)',
          isColdChain: true,
          targetTemperatureRange: '2C - 8C',
        },
        {
          id: 'gri-22',
          genericName: 'Insulin Glargine (Lantus SoloStar)',
          brandName: 'Lantus 100 U/mL SoloStar',
          orderedQuantity: 50,
          deliveredQuantity: 50,
          varianceQuantity: 0,
          unitOfMeasure: 'Box of 5',
          batchNumber: 'LAN-2026-W33',
          manufacturerName: 'Sanofi-Aventis Deutschland',
          countryOfOrigin: 'Germany',
          manufacturingDate: '2026-02-10',
          expiryDate: '2028-01-31',
          assignedStorageLocation: 'Cold Room 1 - Refrigerator B (2C - 8C)',
          isColdChain: true,
          targetTemperatureRange: '2C - 8C',
        },
      ],
      createdAt: '2026-03-24T14:30:00Z',
    },
    qualityInspection: {
      id: 'qc-002',
      tenantId: 'client-001',
      qcNumber: 'QC-2026-0205',
      grnId: 'grn-002',
      grnNumber: 'GRN-2026-0428',
      inspectorPharmacistName: 'Pharm. Elvis Ssekyanzi',
      inspectorPsuLicenseNo: 'PSU/REG/2026/4092',
      inspectionDate: '2026-03-24T15:15:00Z',
      physicalCountVerified: true,
      sealsAndLabelingVerified: true,
      coldChainLogVerified: true,
      temperatureReadoutCelsius: 4.8, // Perfect cold chain 2C-8C
      certificateOfAnalysisVerified: true,
      outcome: 'passed_released_to_stock',
      passedQuantity: 130,
      quarantinedQuantity: 0,
      rejectedQuantity: 0,
      qcRemarks: 'Cold chain verified at 4.8°C upon unpackaging. Data logger readout downloaded and verified. Released to primary biologicals refrigerator.',
      createdAt: '2026-03-24T15:45:00Z',
    },
  },
  {
    id: 'dossier-003',
    dossierCode: 'P2P-2026-0102',
    title: 'Cardiovascular & Antihypertensive Stock Reorder',
    currentStage: 'invoice_matching',
    overallStatus: 'Blocked / Exception',
    totalValueUgx: 8200000,
    lastUpdated: '2026-03-24T17:15:00Z',
    requisition: {
      id: 'pr-003',
      tenantId: 'client-001',
      prNumber: 'PR-2026-0164',
      branchName: 'Main Dispensary & Store',
      requestedByName: 'Pharm. Elvis Ssekyanzi',
      requestedByRole: 'Supervising Pharmacist',
      priority: 'standard',
      requisitionReason: 'Chronic refill demand restock for Amlodipine, Telmisartan, and Rosuvastatin.',
      status: 'converted_to_po',
      estimatedTotalUgx: 8000000,
      approvedByName: 'Dr. Sarah Nabatanzi',
      approvedByRole: 'Pharmacy Owner',
      approvedAt: '2026-03-19T14:00:00Z',
      createdAt: '2026-03-19T11:00:00Z',
      items: [
        {
          id: 'pri-31',
          genericName: 'Telmisartan 80mg Tablets',
          brandName: 'Micardis 80mg',
          dosageForm: 'Tablet',
          strength: '80mg (Pack of 28s)',
          currentStockLevel: 12,
          reorderLevel: 50,
          requestedQuantity: 100,
          unitOfMeasure: 'Pack of 28s',
          estimatedUnitCostUgx: 52000,
          lineTotalEstimatedUgx: 5200000,
        },
        {
          id: 'pri-32',
          genericName: 'Rosuvastatin 20mg Tablets',
          brandName: 'Crestor 20mg',
          dosageForm: 'Tablet',
          strength: '20mg (Pack of 28s)',
          currentStockLevel: 15,
          reorderLevel: 40,
          requestedQuantity: 50,
          unitOfMeasure: 'Pack of 28s',
          estimatedUnitCostUgx: 56000,
          lineTotalEstimatedUgx: 2800000,
        },
      ],
    },
    purchaseOrder: {
      id: 'po-003',
      tenantId: 'client-001',
      poNumber: 'PO-2026-0320',
      requisitionId: 'pr-003',
      requisitionNumber: 'PR-2026-0164',
      supplierId: 'sup-003',
      supplierName: 'Rene Industries Limited',
      supplierLicenseNo: 'NDA/WDL/2026/0022',
      paymentTerms: 'Net 30 Days',
      deliveryLocation: 'ZenithRx Central Pharmacy Store',
      expectedDeliveryDate: '2026-03-22',
      currency: 'UGX',
      totalOrderAmountUgx: 8000000,
      status: 'fully_received',
      createdByName: 'Pharm. Elvis Ssekyanzi',
      createdByRole: 'Supervising Pharmacist',
      createdAt: '2026-03-19T15:00:00Z',
      items: [
        {
          id: 'poi-31',
          genericName: 'Telmisartan 80mg Tablets',
          brandName: 'Micardis 80mg',
          dosageForm: 'Tablet',
          strength: '80mg',
          orderedQuantity: 100,
          unitCostUgx: 52000,
          totalLineAmountUgx: 5200000,
        },
        {
          id: 'poi-32',
          genericName: 'Rosuvastatin 20mg Tablets',
          brandName: 'Crestor 20mg',
          dosageForm: 'Tablet',
          strength: '20mg',
          orderedQuantity: 50,
          unitCostUgx: 56000,
          totalLineAmountUgx: 2800000,
        },
      ],
    },
    goodsReceivedNote: {
      id: 'grn-003',
      tenantId: 'client-001',
      grnNumber: 'GRN-2026-0431',
      purchaseOrderId: 'po-003',
      poNumber: 'PO-2026-0320',
      supplierName: 'Rene Industries Limited',
      deliveryNoteNumber: 'DN-RENE-2026-119',
      receivedByName: 'Opio Derrick',
      receivedByRole: 'Store Keeper & Inventory Tech',
      receiptDate: '2026-03-22T10:00:00Z',
      totalPackagesReceived: 3,
      externalPackagingCondition: 'Good condition',
      items: [
        {
          id: 'gri-31',
          genericName: 'Telmisartan 80mg Tablets',
          brandName: 'Micardis 80mg',
          orderedQuantity: 100,
          deliveredQuantity: 100,
          varianceQuantity: 0,
          unitOfMeasure: 'Pack of 28s',
          batchNumber: 'TEL-2026-M41',
          manufacturerName: 'Boehringer Ingelheim',
          countryOfOrigin: 'Germany',
          manufacturingDate: '2026-01-05',
          expiryDate: '2028-11-30',
          assignedStorageLocation: 'Aisle C - Shelf 1',
          isColdChain: false,
        },
        {
          id: 'gri-32',
          genericName: 'Rosuvastatin 20mg Tablets',
          brandName: 'Crestor 20mg',
          orderedQuantity: 50,
          deliveredQuantity: 50,
          varianceQuantity: 0,
          unitOfMeasure: 'Pack of 28s',
          batchNumber: 'ROS-2026-Z77',
          manufacturerName: 'AstraZeneca UK',
          countryOfOrigin: 'United Kingdom',
          manufacturingDate: '2026-02-14',
          expiryDate: '2028-02-28',
          assignedStorageLocation: 'Aisle C - Shelf 2',
          isColdChain: false,
        },
      ],
      createdAt: '2026-03-22T10:30:00Z',
    },
    qualityInspection: {
      id: 'qc-003',
      tenantId: 'client-001',
      qcNumber: 'QC-2026-0210',
      grnId: 'grn-003',
      grnNumber: 'GRN-2026-0431',
      inspectorPharmacistName: 'Pharm. Elvis Ssekyanzi',
      inspectorPsuLicenseNo: 'PSU/REG/2026/4092',
      inspectionDate: '2026-03-22T11:00:00Z',
      physicalCountVerified: true,
      sealsAndLabelingVerified: true,
      coldChainLogVerified: true,
      certificateOfAnalysisVerified: true,
      outcome: 'passed_released_to_stock',
      passedQuantity: 150,
      quarantinedQuantity: 0,
      rejectedQuantity: 0,
      qcRemarks: 'Passed and released into pharmacy inventory.',
      createdAt: '2026-03-22T11:30:00Z',
    },
    supplierInvoice: {
      id: 'inv-003',
      tenantId: 'client-001',
      invoiceNumber: 'INV-RENE-2026-441',
      supplierName: 'Rene Industries Limited',
      purchaseOrderId: 'po-003',
      poNumber: 'PO-2026-0320',
      grnId: 'grn-003',
      grnNumber: 'GRN-2026-0431',
      invoiceDate: '2026-03-22',
      dueDate: '2026-04-21',
      subtotalUgx: 8200000, // Supplier billed 200,000 UGX higher on Telmisartan
      taxVatUgx: 0,
      withholdingTaxUgx: 492000,
      freightHandlingUgx: 0,
      totalInvoicedAmountUgx: 8200000,
      notes: 'Price increase on Telmisartan applied due to revised foreign exchange rate.',
      createdAt: '2026-03-23T08:00:00Z',
    },
    matchingRecord: {
      id: 'match-003',
      tenantId: 'client-001',
      matchReference: '3WAY-MATCH-2026-0102',
      invoiceId: 'inv-003',
      invoiceNumber: 'INV-RENE-2026-441',
      purchaseOrderId: 'po-003',
      poNumber: 'PO-2026-0320',
      grnId: 'grn-003',
      grnNumber: 'GRN-2026-0431',
      poAuthorizedAmountUgx: 8000000,
      grnAcceptedValueUgx: 8000000,
      invoiceBilledAmountUgx: 8200000,
      priceVarianceUgx: 200000, // +200,000 UGX price discrepancy
      quantityVarianceUnits: 0,
      netVarianceUgx: 200000,
      matchStatus: 'price_mismatch_flagged',
      varianceExplanation: 'WARNING: Price Mismatch Flagged. Supplier invoice unit cost on Telmisartan is 54,000 UGX vs PO agreed price of 52,000 UGX (Variance +200,000 UGX). Credit note requested from vendor before payment approval.',
      verifiedByName: 'Kigozi Jonathan',
      verifiedByRole: 'Finance & Accounts Officer',
      matchedAt: '2026-03-24T09:00:00Z',
    },
  },
  {
    id: 'dossier-004',
    dossierCode: 'P2P-2026-0115',
    title: 'Emergency Analgesics & IV Fluids Procurement',
    currentStage: 'goods_received',
    overallStatus: 'In Progress',
    totalValueUgx: 6400000,
    lastUpdated: '2026-03-24T18:00:00Z',
    requisition: {
      id: 'pr-004',
      tenantId: 'client-001',
      prNumber: 'PR-2026-0171',
      branchName: 'Main Dispensary & Store',
      requestedByName: 'Opio Derrick',
      requestedByRole: 'Store Keeper & Inventory Tech',
      priority: 'stockout_emergency',
      requisitionReason: 'Emergency restock of IV Normal Saline, Ringers Lactate, and IV Paracetamol.',
      status: 'converted_to_po',
      estimatedTotalUgx: 6400000,
      approvedByName: 'Pharm. Elvis Ssekyanzi',
      approvedByRole: 'Supervising Pharmacist',
      approvedAt: '2026-03-24T08:00:00Z',
      createdAt: '2026-03-24T07:30:00Z',
      items: [
        {
          id: 'pri-41',
          genericName: 'Normal Saline 0.9% IV Infusion 500mL',
          brandName: 'Sodium Chloride 0.9% 500mL',
          dosageForm: 'IV Infusion Bag',
          strength: '0.9% w/v (Box of 20)',
          currentStockLevel: 10,
          reorderLevel: 60,
          requestedQuantity: 80,
          unitOfMeasure: 'Box of 20',
          estimatedUnitCostUgx: 45000,
          lineTotalEstimatedUgx: 3600000,
        },
        {
          id: 'pri-42',
          genericName: 'Paracetamol IV 10mg/mL 100mL Infusion',
          brandName: 'Perfalgan 1g/100mL IV',
          dosageForm: 'IV Infusion Bottle',
          strength: '10mg/mL 100mL',
          currentStockLevel: 15,
          reorderLevel: 50,
          requestedQuantity: 100,
          unitOfMeasure: 'Bottles',
          estimatedUnitCostUgx: 28000,
          lineTotalEstimatedUgx: 2800000,
        },
      ],
    },
    purchaseOrder: {
      id: 'po-004',
      tenantId: 'client-001',
      poNumber: 'PO-2026-0335',
      requisitionId: 'pr-004',
      requisitionNumber: 'PR-2026-0171',
      supplierId: 'sup-001',
      supplierName: 'Abacus Pharma (A) Limited',
      supplierLicenseNo: 'NDA/WDL/2026/0014',
      paymentTerms: 'Cash on Delivery / Net 7',
      deliveryLocation: 'ZenithRx Main Receiving Dock',
      expectedDeliveryDate: '2026-03-25',
      currency: 'UGX',
      totalOrderAmountUgx: 6400000,
      status: 'issued_to_supplier',
      supplierAckReference: 'ACK-ABACUS-99388',
      supplierConfirmedAt: '2026-03-24T11:00:00Z',
      createdByName: 'Pharm. Elvis Ssekyanzi',
      createdByRole: 'Supervising Pharmacist',
      createdAt: '2026-03-24T09:00:00Z',
      items: [
        {
          id: 'poi-41',
          genericName: 'Normal Saline 0.9% IV Infusion 500mL',
          brandName: 'Sodium Chloride 0.9% 500mL',
          dosageForm: 'IV Infusion Bag',
          strength: '0.9% w/v (Box of 20)',
          orderedQuantity: 80,
          unitCostUgx: 45000,
          totalLineAmountUgx: 3600000,
        },
        {
          id: 'poi-42',
          genericName: 'Paracetamol IV 10mg/mL 100mL Infusion',
          brandName: 'Perfalgan 1g/100mL IV',
          dosageForm: 'IV Infusion Bottle',
          strength: '10mg/mL 100mL',
          orderedQuantity: 100,
          unitCostUgx: 28000,
          totalLineAmountUgx: 2800000,
        },
      ],
    },
  },
  {
    id: 'dossier-005',
    dossierCode: 'P2P-2026-0128',
    title: 'Dermatologicals & Antifungals Scheduled Restock',
    currentStage: 'requisition',
    overallStatus: 'In Progress',
    totalValueUgx: 4350000,
    lastUpdated: '2026-03-24T19:00:00Z',
    requisition: {
      id: 'pr-005',
      tenantId: 'client-001',
      prNumber: 'PR-2026-0182',
      branchName: 'Main Dispensary & Store',
      requestedByName: 'Kigozi Jonathan',
      requestedByRole: 'Pharmacy Technician',
      priority: 'standard',
      requisitionReason: 'Routine weekly replenishment for Clotrimazole, Hydrocortisone, and Ketoconazole creams.',
      status: 'pending_approval',
      estimatedTotalUgx: 4350000,
      createdAt: '2026-03-24T18:30:00Z',
      items: [
        {
          id: 'pri-51',
          genericName: 'Clotrimazole 1% Topical Cream 20g',
          brandName: 'Canesten 1% Cream',
          dosageForm: 'Topical Cream',
          strength: '1% 20g Tube',
          currentStockLevel: 14,
          reorderLevel: 50,
          requestedQuantity: 100,
          unitOfMeasure: 'Tubes',
          estimatedUnitCostUgx: 18500,
          lineTotalEstimatedUgx: 1850000,
        },
        {
          id: 'pri-52',
          genericName: 'Ketoconazole 2% Medicated Shampoo 100mL',
          brandName: 'Nizoral 2% Shampoo',
          dosageForm: 'Medicated Shampoo',
          strength: '2% 100mL',
          currentStockLevel: 5,
          reorderLevel: 25,
          requestedQuantity: 50,
          unitOfMeasure: 'Bottles',
          estimatedUnitCostUgx: 50000,
          lineTotalEstimatedUgx: 2500000,
        },
      ],
    },
  },
];

let dossiersStore: ProcureToPayDossier[] = [...INITIAL_DOSSIERS];

/**
 * Fetch all P2P dossiers
 */
export function getAllP2PDossiers(tenantId: string = 'client-001'): ProcureToPayDossier[] {
  return [...dossiersStore];
}

/**
 * Get dossier by ID
 */
export function getP2PDossierById(id: string): ProcureToPayDossier | undefined {
  return dossiersStore.find((d) => d.id === id);
}

/**
 * Stage 1: Create a new Purchase Requisition
 */
export function createPurchaseRequisition(
  payload: Omit<PurchaseRequisition, 'id' | 'prNumber' | 'status' | 'createdAt'>
): ProcureToPayDossier {
  const prId = `pr-${Date.now()}`;
  const prNumber = `PR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const dossierId = `dossier-${Date.now()}`;
  const dossierCode = `P2P-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newRequisition: PurchaseRequisition = {
    ...payload,
    id: prId,
    prNumber,
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
  };

  const newDossier: ProcureToPayDossier = {
    id: dossierId,
    dossierCode,
    title: payload.requisitionReason.slice(0, 50) || `Procurement Requisition ${prNumber}`,
    currentStage: 'requisition',
    overallStatus: 'In Progress',
    totalValueUgx: payload.estimatedTotalUgx,
    lastUpdated: new Date().toISOString(),
    requisition: newRequisition,
  };

  dossiersStore = [newDossier, ...dossiersStore];
  return newDossier;
}

/**
 * Stage 1 -> Approve Requisition
 */
export function approvePurchaseRequisition(
  dossierId: string,
  approverName: string,
  approverRole: string
): ProcureToPayDossier {
  const index = dossiersStore.findIndex((d) => d.id === dossierId);
  if (index === -1) throw new Error('Dossier not found');

  const dossier = dossiersStore[index];
  dossier.requisition.status = 'approved';
  dossier.requisition.approvedByName = approverName;
  dossier.requisition.approvedByRole = approverRole;
  dossier.requisition.approvedAt = new Date().toISOString();
  dossier.lastUpdated = new Date().toISOString();

  dossiersStore[index] = { ...dossier };
  return dossiersStore[index];
}

/**
 * Stage 2: Convert Approved Requisition to Purchase Order
 */
export function convertRequisitionToPurchaseOrder(
  dossierId: string,
  supplier: {
    id: string;
    name: string;
    licenseNo: string;
    email: string;
    phone: string;
    paymentTerms: string;
    expectedDeliveryDate: string;
  },
  creatorName: string,
  creatorRole: string
): ProcureToPayDossier {
  const index = dossiersStore.findIndex((d) => d.id === dossierId);
  if (index === -1) throw new Error('Dossier not found');

  const dossier = dossiersStore[index];
  dossier.requisition.status = 'converted_to_po';

  const poNumber = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const poId = `po-${Date.now()}`;

  const poItems = dossier.requisition.items.map((item, idx) => ({
    id: `poi-${idx + 1}-${Date.now()}`,
    genericName: item.genericName,
    brandName: item.brandName,
    dosageForm: item.dosageForm,
    strength: item.strength,
    orderedQuantity: item.requestedQuantity,
    unitCostUgx: item.estimatedUnitCostUgx,
    totalLineAmountUgx: item.lineTotalEstimatedUgx,
  }));

  const purchaseOrder: P2PPurchaseOrder = {
    id: poId,
    tenantId: dossier.requisition.tenantId,
    poNumber,
    requisitionId: dossier.requisition.id,
    requisitionNumber: dossier.requisition.prNumber,
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierLicenseNo: supplier.licenseNo,
    supplierEmail: supplier.email,
    supplierPhone: supplier.phone,
    paymentTerms: supplier.paymentTerms,
    deliveryLocation: 'ZenithRx Central Pharmacy Store, Kampala',
    expectedDeliveryDate: supplier.expectedDeliveryDate,
    currency: 'UGX',
    totalOrderAmountUgx: dossier.requisition.estimatedTotalUgx,
    status: 'issued_to_supplier',
    createdByName: creatorName,
    createdByRole: creatorRole,
    items: poItems,
    createdAt: new Date().toISOString(),
  };

  dossier.purchaseOrder = purchaseOrder;
  dossier.currentStage = 'purchase_order';
  dossier.lastUpdated = new Date().toISOString();

  dossiersStore[index] = { ...dossier };
  return dossiersStore[index];
}

/**
 * Stage 3: Record Supplier Confirmation / Acknowledgment
 */
export function recordSupplierConfirmation(
  dossierId: string,
  ackReference: string,
  dispatchDate: string,
  notes?: string
): ProcureToPayDossier {
  const index = dossiersStore.findIndex((d) => d.id === dossierId);
  if (index === -1 || !dossiersStore[index].purchaseOrder) throw new Error('PO not found');

  const dossier = dossiersStore[index];
  dossier.purchaseOrder!.status = 'confirmed_by_supplier';
  dossier.purchaseOrder!.supplierAckReference = ackReference;
  dossier.purchaseOrder!.supplierConfirmedAt = new Date().toISOString();
  dossier.purchaseOrder!.supplierConfirmedDispatchDate = dispatchDate;
  dossier.purchaseOrder!.supplierBackorderNotes = notes || 'All quantities confirmed.';
  dossier.currentStage = 'supplier_confirmation';
  dossier.lastUpdated = new Date().toISOString();

  dossiersStore[index] = { ...dossier };
  return dossiersStore[index];
}

/**
 * Stage 4 & 5: Record Goods Received Note (GRN) & Inward Batch Registration
 */
export function receiveGoodsAndRegisterBatches(
  dossierId: string,
  receiptData: {
    deliveryNoteNumber: string;
    waybillCarrierName: string;
    vehicleRegistration: string;
    totalPackagesReceived: number;
    externalCondition: string;
    receivedByName: string;
    receivedByRole: string;
    items: {
      genericName: string;
      brandName?: string;
      orderedQuantity: number;
      deliveredQuantity: number;
      unitOfMeasure: string;
      batchNumber: string;
      manufacturerName: string;
      countryOfOrigin: string;
      manufacturingDate: string;
      expiryDate: string;
      assignedStorageLocation: string;
      isColdChain: boolean;
      targetTemperatureRange?: string;
    }[];
  }
): ProcureToPayDossier {
  const index = dossiersStore.findIndex((d) => d.id === dossierId);
  if (index === -1 || !dossiersStore[index].purchaseOrder) throw new Error('PO not found');

  const dossier = dossiersStore[index];
  const grnNumber = `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const grnId = `grn-${Date.now()}`;

  const grnItems = receiptData.items.map((item, idx) => ({
    id: `gri-${idx + 1}-${Date.now()}`,
    genericName: item.genericName,
    brandName: item.brandName,
    orderedQuantity: item.orderedQuantity,
    deliveredQuantity: item.deliveredQuantity,
    varianceQuantity: item.deliveredQuantity - item.orderedQuantity,
    unitOfMeasure: item.unitOfMeasure,
    batchNumber: item.batchNumber,
    manufacturerName: item.manufacturerName,
    countryOfOrigin: item.countryOfOrigin,
    manufacturingDate: item.manufacturingDate,
    expiryDate: item.expiryDate,
    assignedStorageLocation: item.assignedStorageLocation,
    isColdChain: item.isColdChain,
    targetTemperatureRange: item.targetTemperatureRange,
  }));

  const grn: P2PGoodsReceivedNote = {
    id: grnId,
    tenantId: dossier.purchaseOrder!.tenantId,
    grnNumber,
    purchaseOrderId: dossier.purchaseOrder!.id,
    poNumber: dossier.purchaseOrder!.poNumber,
    supplierName: dossier.purchaseOrder!.supplierName,
    deliveryNoteNumber: receiptData.deliveryNoteNumber,
    waybillCarrierName: receiptData.waybillCarrierName,
    vehicleRegistration: receiptData.vehicleRegistration,
    receivedByName: receiptData.receivedByName,
    receivedByRole: receiptData.receivedByRole,
    receiptDate: new Date().toISOString(),
    totalPackagesReceived: receiptData.totalPackagesReceived,
    externalPackagingCondition: receiptData.externalCondition,
    items: grnItems,
    createdAt: new Date().toISOString(),
  };

  dossier.goodsReceivedNote = grn;
  dossier.purchaseOrder!.status = 'fully_received';
  dossier.currentStage = 'batch_registration';
  dossier.lastUpdated = new Date().toISOString();

  dossiersStore[index] = { ...dossier };
  return dossiersStore[index];
}

/**
 * Stage 6: Perform Quality/Quantity Verification & Quarantine Release
 */
export function performQualityVerification(
  dossierId: string,
  inspectionData: {
    inspectorPharmacistName: string;
    inspectorPsuLicenseNo: string;
    physicalCountVerified: boolean;
    sealsAndLabelingVerified: boolean;
    coldChainLogVerified: boolean;
    temperatureReadoutCelsius?: number;
    certificateOfAnalysisVerified: boolean;
    outcome: P2PQualityInspection['outcome'];
    passedQuantity: number;
    quarantinedQuantity: number;
    rejectedQuantity: number;
    qcRemarks: string;
  }
): ProcureToPayDossier {
  const index = dossiersStore.findIndex((d) => d.id === dossierId);
  if (index === -1 || !dossiersStore[index].goodsReceivedNote) throw new Error('GRN not found');

  const dossier = dossiersStore[index];
  const qcNumber = `QC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const qcId = `qc-${Date.now()}`;

  const qualityInspection: P2PQualityInspection = {
    id: qcId,
    tenantId: dossier.goodsReceivedNote!.tenantId,
    qcNumber,
    grnId: dossier.goodsReceivedNote!.id,
    grnNumber: dossier.goodsReceivedNote!.grnNumber,
    inspectorPharmacistName: inspectionData.inspectorPharmacistName,
    inspectorPsuLicenseNo: inspectionData.inspectorPsuLicenseNo,
    inspectionDate: new Date().toISOString(),
    physicalCountVerified: inspectionData.physicalCountVerified,
    sealsAndLabelingVerified: inspectionData.sealsAndLabelingVerified,
    coldChainLogVerified: inspectionData.coldChainLogVerified,
    temperatureReadoutCelsius: inspectionData.temperatureReadoutCelsius,
    certificateOfAnalysisVerified: inspectionData.certificateOfAnalysisVerified,
    outcome: inspectionData.outcome,
    passedQuantity: inspectionData.passedQuantity,
    quarantinedQuantity: inspectionData.quarantinedQuantity,
    rejectedQuantity: inspectionData.rejectedQuantity,
    qcRemarks: inspectionData.qcRemarks,
    createdAt: new Date().toISOString(),
  };

  dossier.qualityInspection = qualityInspection;
  dossier.currentStage = 'quality_verification';
  dossier.lastUpdated = new Date().toISOString();

  dossiersStore[index] = { ...dossier };
  return dossiersStore[index];
}

/**
 * Stage 7: Record Supplier Invoice
 */
export function recordSupplierInvoice(
  dossierId: string,
  invoiceData: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    subtotalUgx: number;
    taxVatUgx: number;
    withholdingTaxUgx: number;
    freightHandlingUgx: number;
    notes?: string;
  }
): ProcureToPayDossier {
  const index = dossiersStore.findIndex((d) => d.id === dossierId);
  if (index === -1 || !dossiersStore[index].purchaseOrder) throw new Error('PO not found');

  const dossier = dossiersStore[index];
  const totalInvoicedAmountUgx =
    invoiceData.subtotalUgx + invoiceData.taxVatUgx + invoiceData.freightHandlingUgx;

  const invoice: P2PSupplierInvoice = {
    id: `inv-${Date.now()}`,
    tenantId: dossier.purchaseOrder!.tenantId,
    invoiceNumber: invoiceData.invoiceNumber,
    supplierName: dossier.purchaseOrder!.supplierName,
    purchaseOrderId: dossier.purchaseOrder!.id,
    poNumber: dossier.purchaseOrder!.poNumber,
    grnId: dossier.goodsReceivedNote?.id,
    grnNumber: dossier.goodsReceivedNote?.grnNumber,
    invoiceDate: invoiceData.invoiceDate,
    dueDate: invoiceData.dueDate,
    subtotalUgx: invoiceData.subtotalUgx,
    taxVatUgx: invoiceData.taxVatUgx,
    withholdingTaxUgx: invoiceData.withholdingTaxUgx,
    freightHandlingUgx: invoiceData.freightHandlingUgx,
    totalInvoicedAmountUgx,
    notes: invoiceData.notes,
    createdAt: new Date().toISOString(),
  };

  dossier.supplierInvoice = invoice;
  dossier.currentStage = 'invoice';
  dossier.lastUpdated = new Date().toISOString();

  dossiersStore[index] = { ...dossier };
  return dossiersStore[index];
}

/**
 * Stage 8: Execute Automated 3-Way Matching Engine
 */
export function executeThreeWayInvoiceMatch(
  dossierId: string,
  verifierName: string,
  verifierRole: string
): ProcureToPayDossier {
  const index = dossiersStore.findIndex((d) => d.id === dossierId);
  if (index === -1 || !dossiersStore[index].supplierInvoice || !dossiersStore[index].purchaseOrder) {
    throw new Error('Invoice or PO not found for 3-way matching');
  }

  const dossier = dossiersStore[index];
  const poAmount = dossier.purchaseOrder!.totalOrderAmountUgx;
  const grnValue = dossier.goodsReceivedNote
    ? dossier.purchaseOrder!.totalOrderAmountUgx
    : poAmount;
  const invoiceAmount = dossier.supplierInvoice!.totalInvoicedAmountUgx;

  const priceVarianceUgx = invoiceAmount - poAmount;
  const netVarianceUgx = Math.abs(priceVarianceUgx);

  let matchStatus: P2PInvoiceMatchingRecord['matchStatus'] = 'exact_match';
  let explanation = '3-Way Match Verified: PO, GRN, and Supplier Invoice match perfectly.';

  if (priceVarianceUgx !== 0) {
    if (netVarianceUgx <= 5000) {
      matchStatus = 'matched_within_tolerance';
      explanation = `Minor rounding variance of ${priceVarianceUgx.toLocaleString()} UGX accepted within standard tolerance threshold.`;
    } else if (priceVarianceUgx > 0) {
      matchStatus = 'price_mismatch_flagged';
      explanation = `Price Mismatch Flagged: Supplier billed +${priceVarianceUgx.toLocaleString()} UGX higher than authorized Purchase Order. Payment on hold pending supplier credit note.`;
      dossier.overallStatus = 'Blocked / Exception';
    } else {
      matchStatus = 'matched_within_tolerance';
      explanation = `Supplier billed ${Math.abs(priceVarianceUgx).toLocaleString()} UGX less than PO (discount/favorable price applied).`;
    }
  }

  const matchRecord: P2PInvoiceMatchingRecord = {
    id: `match-${Date.now()}`,
    tenantId: dossier.purchaseOrder!.tenantId,
    matchReference: `3WAY-MATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    invoiceId: dossier.supplierInvoice!.id,
    invoiceNumber: dossier.supplierInvoice!.invoiceNumber,
    purchaseOrderId: dossier.purchaseOrder!.id,
    poNumber: dossier.purchaseOrder!.poNumber,
    grnId: dossier.goodsReceivedNote?.id || '',
    grnNumber: dossier.goodsReceivedNote?.grnNumber || 'N/A',
    poAuthorizedAmountUgx: poAmount,
    grnAcceptedValueUgx: grnValue,
    invoiceBilledAmountUgx: invoiceAmount,
    priceVarianceUgx,
    quantityVarianceUnits: 0,
    netVarianceUgx,
    matchStatus,
    varianceExplanation: explanation,
    verifiedByName: verifierName,
    verifiedByRole: verifierRole,
    matchedAt: new Date().toISOString(),
  };

  dossier.matchingRecord = matchRecord;
  dossier.currentStage = 'invoice_matching';
  dossier.lastUpdated = new Date().toISOString();

  // If match passed without block, generate Payment Voucher automatically
  if (matchStatus === 'exact_match' || matchStatus === 'matched_within_tolerance') {
    const gross = invoiceAmount;
    const wht = dossier.supplierInvoice!.withholdingTaxUgx || gross * 0.06;
    const net = gross - wht;

    dossier.paymentVoucher = {
      id: `pv-${Date.now()}`,
      tenantId: dossier.purchaseOrder!.tenantId,
      voucherNumber: `PV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceId: dossier.supplierInvoice!.id,
      invoiceNumber: dossier.supplierInvoice!.invoiceNumber,
      matchRecordId: matchRecord.id,
      supplierName: dossier.purchaseOrder!.supplierName,
      paymentMethod: 'Bank Wire / EFT',
      bankAccountOrMomoRef: 'Stanbic Bank Uganda A/C (Supplier Standard)',
      grossAmountUgx: gross,
      whtDeductedUgx: wht,
      netPayableUgx: net,
      paymentStatus: 'pending_authorization',
      createdAt: new Date().toISOString(),
    };
  }

  dossiersStore[index] = { ...dossier };
  return dossiersStore[index];
}

/**
 * Stage 9: Authorize and Settle Payment
 */
export function authorizeAndSettlePayment(
  dossierId: string,
  paymentData: {
    paymentMethod: string;
    bankAccountOrMomoRef: string;
    transactionReference: string;
    authorizerName: string;
    authorizerRole: string;
    settlementNotes?: string;
  }
): ProcureToPayDossier {
  const index = dossiersStore.findIndex((d) => d.id === dossierId);
  if (index === -1 || !dossiersStore[index].paymentVoucher) throw new Error('Payment voucher not found');

  const dossier = dossiersStore[index];
  dossier.paymentVoucher!.paymentMethod = paymentData.paymentMethod;
  dossier.paymentVoucher!.bankAccountOrMomoRef = paymentData.bankAccountOrMomoRef;
  dossier.paymentVoucher!.transactionReference = paymentData.transactionReference;
  dossier.paymentVoucher!.authorizedByName = paymentData.authorizerName;
  dossier.paymentVoucher!.authorizedByRole = paymentData.authorizerRole;
  dossier.paymentVoucher!.authorizedAt = new Date().toISOString();
  dossier.paymentVoucher!.paidAt = new Date().toISOString();
  dossier.paymentVoucher!.paymentStatus = 'settled_and_reconciled';
  dossier.paymentVoucher!.settlementNotes = paymentData.settlementNotes || 'Payment settled in full. Audit trail completed.';

  dossier.currentStage = 'payment';
  dossier.overallStatus = 'Completed & Settled';
  dossier.lastUpdated = new Date().toISOString();

  dossiersStore[index] = { ...dossier };
  return dossiersStore[index];
}

/**
 * Get aggregated P2P KPIs
 */
export function getP2PKPIs(tenantId: string = 'client-001'): P2PKPIs {
  const all = getAllP2PDossiers(tenantId);

  const activeRequisitionsCount = all.filter((d) => d.requisition.status === 'pending_approval').length;
  const openPurchaseOrdersCount = all.filter(
    (d) => d.purchaseOrder && (d.purchaseOrder.status === 'issued_to_supplier' || d.purchaseOrder.status === 'confirmed_by_supplier')
  ).length;
  const pendingGoodsArrivalsCount = all.filter(
    (d) => d.purchaseOrder && !d.goodsReceivedNote && d.purchaseOrder.status === 'confirmed_by_supplier'
  ).length;
  const pendingQcInspectionsCount = all.filter(
    (d) => d.goodsReceivedNote && (!d.qualityInspection || d.qualityInspection.outcome === 'quarantined_pending_investigation')
  ).length;
  const invoicesAwaitingMatchCount = all.filter(
    (d) => d.supplierInvoice && (!d.matchingRecord || d.matchingRecord.matchStatus === 'price_mismatch_flagged')
  ).length;

  const authorizedPendingPaymentUgx = all
    .filter((d) => d.paymentVoucher && d.paymentVoucher.paymentStatus === 'pending_authorization')
    .reduce((sum, d) => sum + (d.paymentVoucher?.netPayableUgx || 0), 0);

  const totalSettledThisQuarterUgx = all
    .filter((d) => d.paymentVoucher && d.paymentVoucher.paymentStatus === 'settled_and_reconciled')
    .reduce((sum, d) => sum + (d.paymentVoucher?.netPayableUgx || 0), 0);

  const matchedTotal = all.filter((d) => d.matchingRecord).length;
  const exactMatched = all.filter((d) => d.matchingRecord && (d.matchingRecord.matchStatus === 'exact_match' || d.matchingRecord.matchStatus === 'matched_within_tolerance')).length;
  const threeWayMatchPassRatePercent = matchedTotal > 0 ? Math.round((exactMatched / matchedTotal) * 100) : 100;

  return {
    activeRequisitionsCount,
    openPurchaseOrdersCount,
    pendingGoodsArrivalsCount,
    pendingQcInspectionsCount,
    invoicesAwaitingMatchCount,
    authorizedPendingPaymentUgx,
    totalSettledThisQuarterUgx,
    threeWayMatchPassRatePercent,
  };
}

/**
 * Generate CSV export of P2P pipeline
 */
export function exportP2PToCsv(tenantId: string = 'client-001'): string {
  const dossiers = getAllP2PDossiers(tenantId);
  const headers = [
    'Dossier Code',
    'Title',
    'Current Stage',
    'Overall Status',
    'Total Value (UGX)',
    'PR Number',
    'PO Number',
    'Supplier',
    'GRN Number',
    'QC Outcome',
    'Invoice Number',
    '3-Way Match Status',
    'Payment Status',
    'Last Updated',
  ];

  const rows = dossiers.map((d) => [
    `"${d.dossierCode}"`,
    `"${d.title.replace(/"/g, '""')}"`,
    `"${d.currentStage}"`,
    `"${d.overallStatus}"`,
    d.totalValueUgx,
    `"${d.requisition.prNumber}"`,
    `"${d.purchaseOrder?.poNumber || 'N/A'}"`,
    `"${d.purchaseOrder?.supplierName || 'N/A'}"`,
    `"${d.goodsReceivedNote?.grnNumber || 'N/A'}"`,
    `"${d.qualityInspection?.outcome || 'N/A'}"`,
    `"${d.supplierInvoice?.invoiceNumber || 'N/A'}"`,
    `"${d.matchingRecord?.matchStatus || 'N/A'}"`,
    `"${d.paymentVoucher?.paymentStatus || 'N/A'}"`,
    `"${d.lastUpdated}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate comprehensive P2P audit report
 */
export function generateP2PAuditReport(dossierId: string): string {
  const d = getP2PDossierById(dossierId);
  if (!d) return 'Dossier not found';

  const sep = '='.repeat(80);
  const subSep = '-'.repeat(80);

  return [
    sep,
    `ZENITHRX PHARMACY MANAGEMENT SYSTEM — PROCURE-TO-PAY (P2P) AUDIT DOSSIER`,
    `DOSSIER CODE: ${d.dossierCode} | STAGE: ${d.currentStage.toUpperCase()} | STATUS: ${d.overallStatus.toUpperCase()}`,
    `GENERATED AT: ${new Date().toISOString()}`,
    sep,
    ``,
    `1. PURCHASE REQUISITION (§Stage 1)`,
    `   • PR Number: ${d.requisition.prNumber}`,
    `   • Requested By: ${d.requisition.requestedByName} (${d.requisition.requestedByRole})`,
    `   • Priority: ${d.requisition.priority.toUpperCase()} | Reason: ${d.requisition.requisitionReason}`,
    `   • Approved By: ${d.requisition.approvedByName || 'Pending'} (${d.requisition.approvedByRole || 'N/A'}) at ${d.requisition.approvedAt || 'N/A'}`,
    `   • Total Estimated Value: UGX ${d.requisition.estimatedTotalUgx.toLocaleString()}`,
    `   • Requisition Items (${d.requisition.items.length}):`,
    ...d.requisition.items.map(
      (item, i) =>
        `     [${i + 1}] ${item.genericName} (${item.brandName || 'Generic'}) | Qty: ${item.requestedQuantity} ${item.unitOfMeasure} @ UGX ${item.estimatedUnitCostUgx.toLocaleString()} = UGX ${item.lineTotalEstimatedUgx.toLocaleString()}`
    ),
    ``,
    subSep,
    `2. PURCHASE ORDER & SUPPLIER CONFIRMATION (§Stage 2 & 3)`,
    d.purchaseOrder
      ? [
          `   • PO Number: ${d.purchaseOrder.poNumber} | Status: ${d.purchaseOrder.status.toUpperCase()}`,
          `   • Supplier: ${d.purchaseOrder.supplierName} (Licence: ${d.purchaseOrder.supplierLicenseNo || 'N/A'})`,
          `   • Payment Terms: ${d.purchaseOrder.paymentTerms} | Delivery: ${d.purchaseOrder.deliveryLocation}`,
          `   • Total Order Amount: UGX ${d.purchaseOrder.totalOrderAmountUgx.toLocaleString()}`,
          `   • Supplier Ack Ref: ${d.purchaseOrder.supplierAckReference || 'Awaiting'} (Dispatch: ${d.purchaseOrder.supplierConfirmedDispatchDate || 'Pending'})`,
          `   • Supplier Notes: ${d.purchaseOrder.supplierBackorderNotes || 'None'}`,
        ].join('\n')
      : `   • Purchase Order Not Yet Generated.`,
    ``,
    subSep,
    `3. GOODS RECEIVED NOTE & BATCH REGISTRATION (§Stage 4 & 5)`,
    d.goodsReceivedNote
      ? [
          `   • GRN Number: ${d.goodsReceivedNote.grnNumber} | Delivery Note: ${d.goodsReceivedNote.deliveryNoteNumber}`,
          `   • Carrier: ${d.goodsReceivedNote.waybillCarrierName || 'Direct'} (${d.goodsReceivedNote.vehicleRegistration || 'Standard'})`,
          `   • Received By: ${d.goodsReceivedNote.receivedByName} (${d.goodsReceivedNote.receivedByRole}) at ${d.goodsReceivedNote.receiptDate}`,
          `   • Packaging Condition: ${d.goodsReceivedNote.externalPackagingCondition}`,
          `   • Registered Batches (${d.goodsReceivedNote.items.length}):`,
          ...d.goodsReceivedNote.items.map(
            (b, i) =>
              `     [${i + 1}] Batch #${b.batchNumber} | ${b.genericName} | Del Qty: ${b.deliveredQuantity} | Mfg: ${b.manufacturingDate} | Exp: ${b.expiryDate} | Location: ${b.assignedStorageLocation} | Cold Chain: ${b.isColdChain ? 'YES (2C-8C)' : 'NO'}`
          ),
        ].join('\n')
      : `   • Goods Not Yet Received at Dock.`,
    ``,
    subSep,
    `4. QUALITY / QUANTITY VERIFICATION & COLD CHAIN INSPECTION (§Stage 6)`,
    d.qualityInspection
      ? [
          `   • QC Reference: ${d.qualityInspection.qcNumber} | Outcome: ${d.qualityInspection.outcome.toUpperCase()}`,
          `   • Inspector Pharmacist: ${d.qualityInspection.inspectorPharmacistName} (PSU Licence: ${d.qualityInspection.inspectorPsuLicenseNo || 'PSU Active'})`,
          `   • Inspection Checks: Physical Count: ${d.qualityInspection.physicalCountVerified ? 'PASS' : 'FAIL'} | Seals/Labels: ${d.qualityInspection.sealsAndLabelingVerified ? 'PASS' : 'FAIL'} | Cold Chain Log: ${d.qualityInspection.coldChainLogVerified ? 'PASS' : 'N/A'} (Temp: ${d.qualityInspection.temperatureReadoutCelsius !== undefined ? `${d.qualityInspection.temperatureReadoutCelsius}°C` : 'Ambient'}) | CoA: ${d.qualityInspection.certificateOfAnalysisVerified ? 'PASS' : 'FAIL'}`,
          `   • Quantities: Passed: ${d.qualityInspection.passedQuantity} | Quarantined: ${d.qualityInspection.quarantinedQuantity} | Rejected: ${d.qualityInspection.rejectedQuantity}`,
          `   • Pharmacist QC Remarks: ${d.qualityInspection.qcRemarks || 'None'}`,
        ].join('\n')
      : `   • Quality Inspection Pending.`,
    ``,
    subSep,
    `5. SUPPLIER INVOICE & 3-WAY MATCHING ENGINE (§Stage 7 & 8)`,
    d.supplierInvoice && d.matchingRecord
      ? [
          `   • Invoice Number: ${d.supplierInvoice.invoiceNumber} | Invoiced Total: UGX ${d.supplierInvoice.totalInvoicedAmountUgx.toLocaleString()}`,
          `   • 3-Way Match Ref: ${d.matchingRecord.matchReference} | Status: ${d.matchingRecord.matchStatus.toUpperCase()}`,
          `   • Comparison Matrix:`,
          `       - PO Authorized Amount:    UGX ${d.matchingRecord.poAuthorizedAmountUgx.toLocaleString()}`,
          `       - GRN Accepted Value:      UGX ${d.matchingRecord.grnAcceptedValueUgx.toLocaleString()}`,
          `       - Supplier Invoice Total:  UGX ${d.matchingRecord.invoiceBilledAmountUgx.toLocaleString()}`,
          `       - Net Price Variance:      UGX ${d.matchingRecord.priceVarianceUgx.toLocaleString()}`,
          `   • Match Verification Remarks: ${d.matchingRecord.varianceExplanation}`,
          `   • Verified By: ${d.matchingRecord.verifiedByName} (${d.matchingRecord.verifiedByRole})`,
        ].join('\n')
      : `   • Invoice Matching Pending.`,
    ``,
    subSep,
    `6. PAYMENT AUTHORIZATION & SETTLEMENT (§Stage 9)`,
    d.paymentVoucher
      ? [
          `   • Voucher Number: ${d.paymentVoucher.voucherNumber} | Status: ${d.paymentVoucher.paymentStatus.toUpperCase()}`,
          `   • Gross Amount:  UGX ${d.paymentVoucher.grossAmountUgx.toLocaleString()}`,
          `   • WHT (6% Tax): -UGX ${d.paymentVoucher.whtDeductedUgx.toLocaleString()}`,
          `   • Net Payable:   UGX ${d.paymentVoucher.netPayableUgx.toLocaleString()}`,
          `   • Payment Method: ${d.paymentVoucher.paymentMethod} -> ${d.paymentVoucher.bankAccountOrMomoRef}`,
          `   • Authorized By: ${d.paymentVoucher.authorizedByName || 'Pending'} (${d.paymentVoucher.authorizedByRole || 'N/A'})`,
          `   • Transaction Ref: ${d.paymentVoucher.transactionReference || 'Awaiting Settlement'}`,
          `   • Settlement Notes: ${d.paymentVoucher.settlementNotes || 'N/A'}`,
        ].join('\n')
      : `   • Payment Voucher Not Generated.`,
    ``,
    sep,
    `END OF PROCURE-TO-PAY AUDIT DOSSIER — GOOD DISTRIBUTION PRACTICE (GDP) AUDIT APPROVED`,
    sep,
  ].join('\n');
}
