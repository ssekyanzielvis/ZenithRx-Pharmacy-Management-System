/**
 * v2Types.ts — ZenithRx Enterprise V2 Domain Types
 * Covers all modules outlined in additionals.md:
 * ADR, Dispensing Register, Medicine Safety, Health Education CMS,
 * Prescription OCR, Supplier Marketplace, Delivery & Logistics,
 * Adherence & Refill, Teleconsultation, Pharmacy Owner Multi-Branch,
 * Admin Dual Control, Policies, Incident Response & Safety Invariants.
 */

// ─── 1. Adverse Drug Reaction (ADR) & Pharmacovigilance (§10, §30) ─────────

export type AdrSeverity = 'Mild' | 'Moderate' | 'Severe' | 'Life-Threatening' | 'Fatal';
export type AdrCausality = 'Certain' | 'Probable / Likely' | 'Possible' | 'Unlikely' | 'Conditional / Unclassified' | 'Unassessable';
export type AdrOutcome = 'Recovered / Resolved' | 'Recovering / Resolving' | 'Not Recovered' | 'Recovered with Sequelae' | 'Fatal' | 'Unknown';

export interface AdverseDrugReactionReport {
  id: string;
  reportNumber: string; // e.g. ADR-UG-2026-0042
  tenantId: string;
  pharmacyName: string;
  reporterName: string;
  reporterRole: string;
  reporterContact: string;
  patientInitials: string; // Confidentiality
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientWeightKg?: number;
  suspectedDrugName: string;
  suspectedDrugBrand?: string;
  suspectedDrugBatchNumber?: string;
  suspectedDrugManufacturer?: string;
  suspectedDrugDose: string;
  suspectedDrugRoute: 'Oral' | 'Intravenous' | 'Intramuscular' | 'Topical' | 'Inhalation' | 'Sublingual' | 'Other';
  dateStarted: string;
  dateReactionStarted: string;
  reactionDescription: string;
  severity: AdrSeverity;
  causality: AdrCausality;
  outcome: AdrOutcome;
  concomitantDrugs?: string;
  relevantMedicalHistory?: string;
  ndaYellowSheetStatus: 'Draft' | 'Submitted to NDA' | 'Acknowledged by NDA';
  ndaReferenceNumber?: string;
  dateSubmittedToNda?: string;
  createdAt: string;
}

// ─── 2. Dispensing Register (§13, §34) ──────────────────────────────────────

export interface DispensingRegisterEntry {
  id: string;
  registerNumber: string; // e.g. DSP-2026-09142
  tenantId: string;
  branchName: string;
  timestamp: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientNationalIdOrNin?: string;
  patientAddress?: string;
  isPrescription: boolean;
  rxNumber?: string;
  prescriberDoctorName?: string;
  prescriberLicenceNo?: string;
  prescriberClinicOrHospital?: string;
  drugId: string;
  drugBrandName: string;
  drugGenericName: string;
  batchNumber: string;
  expiryDate: string;
  dispensedQuantity: number;
  unit: string;
  dosageInstructions: string;
  unitPriceUgx: number;
  totalUgx: number;
  dispensedByPharmacistName: string;
  dispensedByPharmacistRole: string;
  dispensedByPsuLicenseNo?: string;
  dispenserDigitalSignatureHash: string;
  patientCounseled: boolean;
  ndaPoisonClass?: 'Class A (Narcotics/Poison)' | 'Class B (Controlled Rx)' | 'Class C (Pharmacy Only)' | 'OTC';
  paymentMethod: string;
  receiptNumber?: string;
}

// ─── 3. Medicine Safety & Master Catalogue (§6, §34) ────────────────────────

export type PregnancyCategory = 'A' | 'B' | 'C' | 'D' | 'X' | 'N';

export interface DrugInteraction {
  id: string;
  primaryDrugGeneric: string;
  interactingDrugGeneric: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Contraindicated';
  clinicalEffect: string;
  managementAdvice: string;
}

export type PrescriptionLegalStatus = 'POM' | 'OTC' | 'Pharmacy (P)' | 'Hospital Only';
export type ControlledScheduleType = 'Non-Controlled' | 'Class A Narcotic (Lockable Safe)' | 'Class B Psychotropic' | 'Precursor';
export type StorageTemperatureClass = 'Room Temp (15°C - 25°C)' | 'Controlled Room (15°C - 30°C)' | 'Cold Chain (2°C - 8°C)' | 'Frozen (< -15°C)' | 'Cool Storage (< 20°C)';
export type MedicineLifecycleStatus = 'active' | 'inactive' | 'discontinued' | 'under_review';

export interface MasterMedicineItem {
  id: string;
  productGroupId?: string; // e.g. 'PROD-PARACETAMOL'
  genericInnName?: string; // e.g. 'Paracetamol (Acetaminophen)'
  genericName: string;
  brandName: string;
  activeIngredients?: string[]; // e.g. ['Paracetamol 500mg'] or ['Amoxicillin 500mg', 'Clavulanic Acid 125mg']
  ndaRegistrationNumber: string;
  category: string;
  therapeuticClass: string;
  atcClassificationCode?: string; // e.g. 'N02BE01', 'J01CR02'
  
  // Formulation Posology
  form: 'Tablet' | 'Film-Coated Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Suspension' | 'Oral Suspension' | 'Inhaler' | 'Ointment' | 'Drops' | 'Suppository' | 'IV Infusion' | 'Vial';
  dosageForm?: string;
  strength: string; // e.g. '500 mg', '120 mg/5 mL', '625 mg'
  route?: string; // e.g. 'Oral', 'Intravenous (IV)', 'Inhalation', 'Topical'
  
  // Packaging Structure
  packageSize?: string; // e.g. 'Box of 100 Tablets (10x10 Blister)', 'Bottle of 100 mL'
  packageType?: string; // e.g. 'Blister Pack', 'Amber Glass Bottle', 'HDPE Bottle', 'Vial'
  standardUnit: string; // 'tablets', 'capsules', 'mL', 'ampoules', 'inhaler', 'vial'
  unitOfMeasure?: string;
  packQuantity?: number; // e.g. 100, 1
  
  // Manufacturer Demographics
  manufacturer?: string; // e.g. 'Cipla Quality Chemicals Ltd', 'GlaxoSmithKline'
  countryOfManufacture?: string; // e.g. 'Uganda', 'Kenya', 'UK', 'India'

  // Regulatory & Classification
  prescriptionStatus?: PrescriptionLegalStatus;
  controlledStatus?: ControlledScheduleType;
  isPoisonScheduleA: boolean;

  // Inventory & Reorder Thresholds
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  reorderQuantity?: number;

  // Storage & Environmental Controls
  isColdChainRequired: boolean; // Must be stored at 2-8°C
  storageTemperatureRange: string;
  temperatureRequirement?: StorageTemperatureClass;
  storageRequirements?: string;
  isLightSensitive?: boolean;
  specialHandlingRequirements?: string; // e.g. 'Protect from moisture', 'Cytotoxic hazard', 'Poison Safe'

  // Clinical Safety Profile
  standardDoseAdult: string;
  standardDosePediatric?: string;
  maxDailyDose: string;
  maxDailyDoseNumericMg?: number;
  pregnancyCategory: PregnancyCategory;
  pregnancyWarning?: string;
  ageRestrictions?: string; // e.g. 'Not recommended for children under 12 years'
  blackboxWarning?: string;
  commonAllergies: string[];
  contraindications: string[];
  counselingNotes: string;

  // Pricing & Commercials
  averageWholesalePriceUgx: number;
  suggestedRetailPriceUgx: number;
  
  // Lifecycle Status
  verifiedByNda: boolean;
  isActive: boolean;
  status?: MedicineLifecycleStatus;
}

// ─── 4. Patient Health Education CMS (§7, §29) ─────────────────────────────

export interface HealthEducationArticle {
  id: string;
  slug: string;
  title: string;
  category: 'Chronic Illness' | 'Medication Safety' | 'Child Health' | 'Women Health' | 'Antibiotic Stewardship' | 'Nutrition & Lifestyle' | 'First Aid';
  summary: string;
  contentMarkdown: string;
  readTimeMinutes: number;
  authorName: string;
  authorTitle: string; // e.g., 'Lead Clinical Pharmacist'
  reviewerPharmacistName?: string;
  isPublished: boolean;
  publishedAt: string;
  coverImageUrl?: string;
  tags: string[];
  featured: boolean;
  relatedMedications?: string[];
}

// ─── 5. Prescription OCR & Verification Queue (§8, §21) ─────────────────────

export interface PrescriptionVerificationItem {
  id: string;
  queueNumber: string;
  tenantId: string;
  pharmacyName: string;
  patientName: string;
  patientPhone: string;
  uploadedVia: 'Patient Portal PWA' | 'Staff Counter Upload' | 'WhatsApp Bot' | 'Telemedicine';
  prescriptionImageUrl: string;
  ocrExtractedDoctorName?: string;
  ocrExtractedDoctorLicence?: string;
  ocrExtractedHospital?: string;
  ocrExtractedDate?: string;
  ocrExtractedMedications: Array<{
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    confidenceScore: number; // 0 - 100
  }>;
  doctorVerificationStatus: 'Verified Licensed MD' | 'Unverified Doctor' | 'Suspected Fraudulent';
  clinicalSafetyFlags: Array<{
    type: 'Interaction' | 'Dosage High' | 'Allergy' | 'Duplicate Therapy';
    message: string;
    severity: 'High' | 'Medium' | 'Low';
  }>;
  verificationStatus: 'Pending Pharmacist Review' | 'Approved & Ready for POS' | 'Clarification Needed' | 'Rejected';
  reviewedByPharmacistName?: string;
  pharmacistClinicalNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

// ─── 6. Supplier Marketplace & Procurement (§9, §23) ────────────────────────

export interface SupplierProfile {
  id: string;
  companyName: string;
  ndaWholesaleLicenseNo: string;
  psuSupervisingPharmacist: string;
  contactPerson: string;
  email: string;
  phone: string;
  physicalAddress: string;
  districtsCovered: string[];
  leadTimeDays: number;
  minimumOrderValueUgx: number;
  paymentTerms: 'Cash on Delivery' | '30 Days Net' | '14 Days Net' | 'Prepayment';
  verifiedCompliance: boolean;
  ratingScore: number; // 1 to 5 stars
  categoriesSupplied: string[];
}

export interface SupplierCatalogueItem {
  id: string;
  supplierId: string;
  supplierName: string;
  drugBrandName: string;
  genericName: string;
  strength: string;
  packSize: string;
  unitPriceUgx: number;
  inStock: boolean;
  moq: number; // Minimum order quantity
  expiryDateEstimate: string;
}

export interface SupplierRFQ {
  id: string;
  rfqNumber: string;
  tenantId: string;
  pharmacyName: string;
  status: 'Draft' | 'Sent to Suppliers' | 'Quotes Received' | 'PO Issued' | 'Closed';
  items: Array<{
    drugGeneric: string;
    preferredBrand?: string;
    quantity: number;
    unit: string;
    targetPriceUgx?: number;
  }>;
  supplierBids?: Array<{
    supplierId: string;
    supplierName: string;
    quotedTotalUgx: number;
    leadTimeDays: number;
    bidTimestamp: string;
  }>;
  createdAt: string;
}

// ─── 7. Order Fulfilment & Delivery Logistics (§11, §24) ────────────────────

export type DeliveryStatus =
  | 'Order Placed'
  | 'Prescription Verified'
  | 'Packed & Sealed'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Failed / Returned';

export interface ColdChainLog {
  timestamp: string;
  temperatureCelsius: number;
  isWithinSafeRange: boolean; // 2°C - 8°C
  recordedByDeviceId?: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  tenantId: string;
  pharmacyName: string;
  patientName: string;
  patientPhone: string;
  deliveryAddress: string;
  deliveryDistrict: string;
  patientCoordinates?: { lat: number; lng: number };
  itemsSummary: string;
  totalOrderAmountUgx: number;
  deliveryFeeUgx: number;
  paymentMethod: string;
  paymentStatus: 'Paid Online' | 'Cash on Delivery' | 'Insurance Co-Pay Pending';
  status: DeliveryStatus;
  isColdChainRequired: boolean;
  coldChainLogs?: ColdChainLog[];
  assignedCourierName?: string;
  assignedCourierPhone?: string;
  courierVehiclePlate?: string;
  estimatedDeliveryTime?: string;
  deliveryOtpCode: string;
  deliveryOtpConfirmed: boolean;
  deliveredAt?: string;
  createdAt: string;
}

// ─── 8. Chronic Patient Adherence & Refill (§12, §25) ───────────────────────

export interface PatientAdherenceRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  tenantId: string;
  chronicCondition: string; // Hypertension, Diabetes Type 2, Asthma, HIV/ART, Dyslipidemia
  medicationName: string;
  dosageSchedule: string;
  daysSupplyGiven: number;
  lastDispensedDate: string;
  nextRefillDueDate: string;
  adherenceRatePercent: number; // e.g. 92%
  refillStreakMonths: number;
  status: 'Adherent (On Track)' | 'Refill Due (0-3 Days)' | 'Overdue (Missed Dose Risk)' | 'Discontinued';
  reminderChannel: 'WhatsApp' | 'SMS' | 'Phone Call' | 'In-App';
  lastReminderSentAt?: string;
  nextScheduledReminderDate: string;
  pharmacistFollowUpNotes?: string;
}

// ─── 9. Teleconsultation & Virtual Pharmacy Hub (§14, §26) ───────────────────

export type ConsultationStatus = 'Waiting in Queue' | 'In Consultation' | 'Completed' | 'Cancelled';

export interface TeleconsultationSession {
  id: string;
  sessionNumber: string;
  tenantId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  chiefComplaint: string;
  status: ConsultationStatus;
  scheduledTime: string;
  pharmacistName?: string;
  pharmacistNotes?: string;
  allergiesReported?: string[];
  currentMedications?: string[];
  recommendedAdvice?: string;
  generatedPrescriptionId?: string;
  vitalSigns?: {
    bloodPressure?: string;
    bloodSugarMgDl?: number;
    temperatureC?: number;
  };
  durationMinutes?: number;
  createdAt: string;
}

// ─── 10. Pharmacy Owner & Multi-Branch Operations (§17) ─────────────────────

export interface BranchPerformanceMetric {
  branchId: string;
  branchName: string;
  district: string;
  supervisingPharmacist: string;
  dailyRevenueUgx: number;
  monthlyRevenueUgx: number;
  grossProfitMarginPercent: number;
  activePrescriptionsCount: number;
  stockValuationUgx: number;
  lowStockItemsCount: number;
  expiringItemsCount: number;
  staffOnDutyCount: number;
  status: 'Optimal' | 'Attention Needed' | 'Critical Stockout';
}

export interface StockTransferRequest {
  id: string;
  transferNumber: string;
  sourceBranchId: string;
  sourceBranchName: string;
  destinationBranchId: string;
  destinationBranchName: string;
  drugId: string;
  drugBrandName: string;
  batchNumber: string;
  expiryDate: string;
  quantityTransferred: number;
  transferStatus: 'Pending Dispatch' | 'In Transit' | 'Received & Verified' | 'Cancelled';
  dispatchedBy: string;
  dispatchedAt: string;
  receivedBy?: string;
  receivedAt?: string;
  transferNotes?: string;
}

// ─── 11. Admin Dual Control & Security Governance (§4.1 - §4.5) ─────────────

export interface DualControlActionRequest {
  id: string;
  actionType: 'TIER_DELETION' | 'DATABASE_PURGE' | 'GLOBAL_FEATURE_REVOCATION' | 'EMERGENCY_PRICE_OVERRIDE' | 'LICENSE_REVOCATION';
  description: string;
  targetEntityId: string;
  initiatedByUserId: string;
  initiatedByUserName: string;
  initiatedByIp: string;
  initiatedAt: string;
  status: 'PENDING_SECOND_APPROVAL' | 'APPROVED_AND_EXECUTED' | 'REJECTED';
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface CircuitBreakerState {
  globalEmergencyFreeze: boolean;
  isolatePosTransactions: boolean;
  isolatePaymentGateways: boolean;
  isolateAiServices: boolean;
  isolatedTenantIds: string[];
  activeIncidentsCount: number;
  lastTrippedAt?: string;
  lastTrippedBy?: string;
  reason?: string;
}

export interface PlatformPolicySettings {
  autoLockoutIdleMinutes: number;
  enforce2FAForPharmacists: boolean;
  requireDoctorLicenceStrictValidation: boolean;
  enableEmergencyMaintenanceBanner: boolean;
  maintenanceMessage: string;
  ipWhitelistEnabled: boolean;
  whitelistedIps: string[];
  maxDailyPrescriptionDispensePerUser: number;
  ndaYellowSheetAutoSubmit: boolean;
}

// ─── 12. Pharmacist Verification Record (§5) ────────────────────────────────

export interface PharmacistCredentialRecord {
  id: string;
  pharmacistName: string;
  email: string;
  phone: string;
  psuRegNumber: string; // Pharmaceutical Society of Uganda
  annualPracticingCertNo: string;
  certExpiryDate: string;
  ndaSupervisingLicenceNo?: string;
  pharmacyAssignedId?: string;
  pharmacyAssignedName?: string;
  verificationStatus: 'VERIFIED_ACTIVE' | 'PENDING_VERIFICATION' | 'EXPIRED_CERT' | 'SUSPENDED';
  verifiedByAdminName?: string;
  verifiedAt?: string;
  uploadedCertificateUrl?: string;
}

// ─── 13. Deep Batch Lifecycle Management & Recall Governance (§11.6, §11.20) ─

export type BatchLifecycleState =
  | 'available'
  | 'quarantined'
  | 'expired'
  | 'recalled'
  | 'damaged'
  | 'returned'
  | 'destroyed';

export type BatchRecallStatus =
  | 'none'
  | 'recall_initiated'
  | 'quarantine_enforced'
  | 'patient_alerts_dispatched'
  | 'isolated_in_lockup'
  | 'returned_to_vendor'
  | 'destroyed_witnessed';

export type StorageZoneType =
  | 'ambient_shelf'
  | 'cold_chain_fridge_2_8'
  | 'frozen_freezer_minus_20'
  | 'schedule_1_poison_safe'
  | 'quarantine_cage_isolated'
  | 'damaged_returns_bay';

export interface PharmacyBatchItem {
  id: string;
  tenantId: string;
  branchId: string;
  batchNumber: string;
  drugId: string;
  medicineName: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  manufacturerName: string;
  countryOfManufacture: string;
  manufacturingDate?: string;
  expiryDate: string;
  quantityReceived: number;
  quantityAvailable: number;
  quantityQuarantined: number;
  quantityDamaged: number;
  quantityReturned: number;
  quantityDestroyed: number;
  packSize: string;
  unitOfMeasure: string;
  purchasePriceUgx: number;
  sellingPriceUgx: number;
  supplierName: string;
  supplierId?: string;
  purchaseOrderNumber: string;
  goodsReceivedNoteNumber: string;
  invoiceNumber?: string;
  receivedDate: string;
  receivedBy: string;
  storageLocation: string;
  storageZone: StorageZoneType;
  temperatureRequirement: string;
  isColdChain: boolean;
  isLightSensitive: boolean;
  batchStatus: BatchLifecycleState;
  recallStatus: BatchRecallStatus;
  recallReason?: string;
  recallAuthority?: string;
  recallReferenceNumber?: string;
  recallInitiatedAt?: string;
  recallInitiatedBy?: string;
  statusChangeReason?: string;
  quarantineWitnessPharmacist?: string;
  destructionCertificateNumber?: string;
  barcodeData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchAuditTrailEntry {
  id: string;
  batchId: string;
  batchNumber: string;
  actionType:
    | 'STATE_TRANSITION'
    | 'QUARANTINE_ENFORCED'
    | 'RECALL_INITIATED'
    | 'PATIENT_ALERT_DISPATCHED'
    | 'STOCK_ADJUSTMENT'
    | 'RETURN_TO_SUPPLIER'
    | 'DISPOSAL_WITNESSED';
  previousState?: string;
  newState: string;
  quantityAffected: number;
  reason: string;
  performedByName: string;
  witnessName?: string;
  regulatoryReference?: string;
  createdAt: string;
}

export interface RecallPatientEntry {
  id: string;
  batchId: string;
  batchNumber: string;
  drugName: string;
  prescriptionId?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  quantityDispensed: number;
  dispensedDate: string;
  alertStatus: 'pending' | 'sms_dispatched' | 'patient_contacted' | 'returned_to_pharmacy';
  contactNotes?: string;
  alertDispatchedAt?: string;
}

// ─── 14. Stock Adjustment & Physical Stocktake (§11.6, §11.20) ──────────────

export type StockAdjustmentReason =
  | 'damaged_medicine'
  | 'expired_medicine'
  | 'lost_medicine'
  | 'theft'
  | 'breakage'
  | 'incorrect_receiving'
  | 'data_entry_correction'
  | 'returned_medicine'
  | 'stock_count_variance';

export type StockAdjustmentStatus = 'pending_approval' | 'approved' | 'rejected';

export type StocktakeSessionStatus =
  | 'draft'
  | 'in_progress'
  | 'reconciliation_pending'
  | 'approved_and_posted'
  | 'cancelled';

export type StocktakeScopeType =
  | 'full_pharmacy'
  | 'category_cycle_count'
  | 'storage_zone_count'
  | 'controlled_drugs_audit'
  | 'high_value_items';

export interface StockAdjustmentRecord {
  id: string;
  adjustmentNumber: string;
  tenantId: string;
  branchId: string;
  drugId: string;
  drugName: string;
  brandName: string;
  genericName: string;
  batchId?: string;
  batchNumber: string;
  expiryDate?: string;
  previousQuantity: number;
  newQuantity: number;
  quantityDifference: number;
  unitCostPriceUgx: number;
  financialImpactUgx: number;
  reason: StockAdjustmentReason;
  justificationNotes: string;
  initiatedByUserId: string;
  initiatedByName: string;
  initiatedByRole: string;
  initiatedAt: string;
  status: StockAdjustmentStatus;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  stocktakeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StocktakeCountItem {
  id: string;
  stocktakeSessionId: string;
  drugId: string;
  drugName: string;
  batchNumber: string;
  expiryDate?: string;
  storageLocation?: string;
  systemExpectedQty: number;
  physicalCountedQty?: number;
  varianceQty: number;
  unitCostPriceUgx: number;
  varianceValueUgx: number;
  counterUserName?: string;
  countedAt?: string;
  reconciliationReason?: StockAdjustmentReason;
  notes?: string;
  isReconciled: boolean;
  createdAt: string;
}

export interface StocktakeSession {
  id: string;
  stocktakeNumber: string;
  tenantId: string;
  branchId: string;
  title: string;
  scopeType: StocktakeScopeType;
  targetCategory?: string;
  targetStorageZone?: string;
  status: StocktakeSessionStatus;
  initiatedByName: string;
  initiatedByRole: string;
  initiatedAt: string;
  supervisorPharmacistName?: string;
  totalItemsScoped: number;
  itemsCounted: number;
  itemsWithVariance: number;
  totalSystemQuantity: number;
  totalCountedQuantity: number;
  totalVarianceUnits: number;
  netFinancialVarianceUgx: number;
  completedAt?: string;
  approvedByName?: string;
  approvedAt?: string;
  auditNotes?: string;
  countItems?: StocktakeCountItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── 15. Medicine Returns Management (§11.6, §11.20) ────────────────────────

export type ReturnType = 'customer_return' | 'supplier_return';

export type ReturnReason =
  | 'wrong_medicine'
  | 'damaged_product'
  | 'expired_product'
  | 'recall'
  | 'incorrect_quantity'
  | 'delivery_error'
  | 'defective_packaging'
  | 'adverse_drug_reaction'
  | 'treatment_changed_by_doctor';

export type ReturnDisposition =
  | 'restock_saleable'
  | 'quarantine_hold'
  | 'supplier_return_rtv'
  | 'destruction';

export type ReturnWorkflowStatus =
  | 'initiated'
  | 'pharmacist_inspected'
  | 'approved_and_processed'
  | 'rejected_no_refund'
  | 'credit_note_issued'
  | 'restocked'
  | 'disposed';

export type RefundPaymentMethod =
  | 'cash_refund'
  | 'store_credit_wallet'
  | 'mobile_money_reversal'
  | 'supplier_credit_note'
  | 'replacement_exchange'
  | 'none';

export interface MedicineReturnRecord {
  id: string;
  returnReferenceNumber: string;
  returnType: ReturnType;
  tenantId: string;
  branchId: string;
  drugId: string;
  medicineName: string;
  brandName: string;
  genericName: string;
  batchNumber: string;
  expiryDate?: string;
  quantityReturned: number;
  unitPriceUgx: number;
  totalRefundAmountUgx: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  originalReceiptNumber?: string;
  originalPrescriptionId?: string;
  originalSaleDate?: string;
  supplierId?: string;
  supplierName?: string;
  purchaseOrderNumber?: string;
  goodsReceivedNoteNumber?: string;
  supplierCreditNoteNumber?: string;
  reason: ReturnReason;
  isPackageOpened: boolean;
  isColdChainBreached: boolean;
  physicalInspectionNotes?: string;
  disposition: ReturnDisposition;
  dispositionRationale: string;
  targetStorageLocation: string;
  refundMethod: RefundPaymentMethod;
  refundStatus: 'pending' | 'refunded' | 'credit_issued' | 'denied';
  replacementBatchNumber?: string;
  status: ReturnWorkflowStatus;
  initiatedByName: string;
  initiatedByRole: string;
  initiatedAt: string;
  inspectedByPharmacistName?: string;
  inspectedByPharmacistRole?: string;
  inspectedAt?: string;
  approvedBySupervisorName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnDispositionEvaluation {
  recommendedDisposition: ReturnDisposition;
  rationale: string;
  allowedDispositions: ReturnDisposition[];
  warningFlags: string[];
  targetLocationSuggestion: string;
}

// ─── 16. Medicine Recall Incident Command (§11.6, §11.20) ───────────────────

export type RecallIncidentSeverity =
  | 'class_1_critical_life_threatening'
  | 'class_2_serious_harm'
  | 'class_3_minor_defect_or_labeling';

export type RecallIncidentStatus =
  | 'active_investigation'
  | 'quarantine_enforced'
  | 'notifications_dispatched'
  | 'quarantine_completed'
  | 'closed_and_archived';

export interface RecallBranchHolding {
  id: string;
  recallIncidentId: string;
  tenantId: string;
  pharmacyName: string;
  branchId: string;
  branchName: string;
  branchLocation: string;
  quantityReceived: number;
  quantityRemaining: number;
  quantityQuarantined: number;
  quantityDispensed: number;
  quarantineLocation: string;
  isPosLocked: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface RecallDispensingAuditEntry {
  id: string;
  recallIncidentId: string;
  tenantId: string;
  pharmacyName: string;
  branchName: string;
  prescriptionNumber?: string;
  orderNumber?: string;
  receiptNumber?: string;
  dispensedAt: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientDistrict?: string;
  quantityDispensed: number;
  dispensingPharmacistName: string;
  patientAlertStatus:
    | 'pending'
    | 'sms_delivered'
    | 'phone_call_confirmed'
    | 'medicine_returned_exchanged'
    | 'unreachable';
  patientClinicalStatus: 'healthy_no_symptoms' | 'mild_reaction_reported' | 'referred_to_hospital';
  contactNotes?: string;
  lastContactAt?: string;
  createdAt: string;
}

export interface RecallIncidentRecord {
  id: string;
  recallCaseNumber: string;
  title: string;
  severity: RecallIncidentSeverity;
  drugId: string;
  medicineName: string;
  brandName: string;
  genericName: string;
  dosageForm?: string;
  strength?: string;
  targetBatchNumber: string;
  expiryDate?: string;
  manufacturerName: string;
  countryOfManufacture: string;
  supplierName: string;
  supplierId?: string;
  issuingAuthority: string;
  recallReason: string;
  clinicalHazardSummary: string;
  initiatedByName: string;
  initiatedByRole: string;
  initiatedAt: string;
  status: RecallIncidentStatus;
  totalAffectedPharmaciesCount: number;
  totalAffectedBranchesCount: number;
  totalInitialReceivedQty: number;
  totalQuarantinedRemainingQty: number;
  totalDispensedQty: number;
  totalAffectedPatientsCount: number;
  totalAlertsDeliveredCount: number;
  branchHoldings?: RecallBranchHolding[];
  dispensingAudit?: RecallDispensingAuditEntry[];
  closedAt?: string;
  closedByName?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── 17. Controlled & Classified Medicines Governance (§11.12, §11.24) ────────
export type ControlledScheduleClass =
  | 'schedule_1_narcotic'
  | 'schedule_2_controlled_rx'
  | 'schedule_3_psychotropic'
  | 'schedule_4_targeted_substance'
  | 'class_a_poison';

export type ControlledVarianceType =
  | 'zero_variance_perfect_match'
  | 'minor_spillage_or_measurement'
  | 'unaccounted_deficit_investigation'
  | 'stock_surplus_investigation'
  | 'damage_or_breakage_verified';

export type ControlledReconciliationStatus =
  | 'reconciled_and_verified'
  | 'under_internal_investigation'
  | 'nda_regulatory_incident_filed'
  | 'superintendent_approved_adjustment'
  | 'rejected_audit_failed';

export interface ControlledSubstanceProduct {
  id: string;
  drugId: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  scheduleClass: ControlledScheduleClass;
  ndaRegistrationNo: string;
  atcCode?: string;
  storageType: string;
  requiresWitnessPharmacist: boolean;
  maxSingleDispenseLimit: number;
  dailyMaximumDose?: string;
  currentSafeStock: number;
  unit: string;
  defaultBatchNumber: string;
  defaultExpiryDate: string;
}

export interface ControlledRegisterEntry {
  id: string;
  sequentialRegNumber: string;
  tenantId: string;
  branchId: string;
  branchName: string;
  substanceId?: string;
  drugBrandName: string;
  drugGenericName: string;
  dosageForm: string;
  strength: string;
  controlledSchedule: ControlledScheduleClass;
  batchNumber: string;
  expiryDate: string;
  openingBalance: number;
  quantityDispensed: number;
  balanceRemaining: number;
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
  previousEntryHash: string;
  currentEntryHash: string;
  isImmutableSealed: boolean;
  timestamp: string;
}

export interface ControlledStockReconciliationRecord {
  id: string;
  reconciliationNumber: string;
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
  quantityQuarantined: number;
  expectedBalance: number;
  physicalBalance: number;
  variance: number;
  varianceType: ControlledVarianceType;
  reconciliationStatus: ControlledReconciliationStatus;
  investigationNotes?: string;
  rootCauseAnalysis?: string;
  correctiveActionPlan?: string;
  ndaIncidentReportRef?: string;
  policeCaseFileRef?: string;
  countedByPharmacistName: string;
  countedByPsuNo: string;
  witnessPharmacistName: string;
  witnessPsuNo: string;
  superintendentApproverName?: string;
  superintendentApprovedAt?: string;
  periodStartDate: string;
  periodEndDate: string;
  auditDate: string;
  createdAt: string;
}

// ─── 18. Patient Medication Profile & Clinical Interaction Engine (§11.14, §11.26) ─

export type ClinicalAlertSeverity =
  | 'contraindicated_fatal_risk'
  | 'major_clinical_hazard'
  | 'moderate_advisory'
  | 'minor_precaution';

export type ClinicalAlertCategory =
  | 'drug_drug_interaction'
  | 'allergy_cross_reactivity'
  | 'disease_contraindication'
  | 'previous_adr_recurrence'
  | 'duplicate_therapy'
  | 'otc_herb_drug_interaction';

export type PharmacistDecisionAction =
  | 'approved_safe'
  | 'overridden_with_justification'
  | 'prescriber_clarification_requested'
  | 'rejected_safety_grounds';

export interface ActiveMedicationEntry {
  id: string;
  drugBrandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  doseAndFrequency: string;
  prescriberDoctor?: string;
  startDate: string;
  expectedDuration?: string;
  indication?: string;
  source: 'prescribed_dispensed' | 'patient_self_reported';
}

export interface PastMedicationEntry {
  id: string;
  drugBrandName: string;
  genericName: string;
  strength: string;
  startDate: string;
  endDate: string;
  discontinuationReason: 'completed_course' | 'adverse_reaction' | 'ineffective' | 'switched' | 'patient_choice';
  notes?: string;
}

export interface PatientAllergyEntry {
  id: string;
  allergenName: string; // e.g. "Penicillins / Beta-lactams", "Sulfa Drugs", "Aspirin / NSAIDs"
  allergyCategory: 'drug' | 'food' | 'environmental' | 'latex';
  reactionType: 'Anaphylaxis / Angioedema' | 'Severe Rash / Urticaria' | 'Bronchospasm / Wheezing' | 'Mild Pruritus' | 'GI Upset';
  severity: 'Severe / Life-Threatening' | 'Moderate' | 'Mild';
  diagnosedDate?: string;
  source: 'confirmed_clinical_diagnosis' | 'patient_self_reported';
}

export interface PatientAdrHistoryEntry {
  id: string;
  suspectedDrug: string;
  brandName?: string;
  reactionDescription: string;
  causality: 'Certain' | 'Probable' | 'Possible';
  severity: 'Fatal' | 'Life-Threatening' | 'Severe' | 'Moderate';
  dateReported: string;
  ndaReportRef?: string;
}

export interface ChronicConditionEntry {
  id: string;
  conditionName: string; // e.g. "Type 2 Diabetes Mellitus", "Hypertension", "Asthma", "CKD Stage 3"
  icd10Code?: string;
  diagnosedDate?: string;
  severityLevel?: 'Mild' | 'Moderate' | 'Severe / High Risk';
  status: 'active' | 'controlled' | 'remission';
  notes?: string;
}

export interface OtcMedicationEntry {
  id: string;
  productName: string; // e.g. "Ibuprofen 400mg Tablets", "St. John's Wort Capsule", "Ginkgo Biloba"
  activeIngredient: string;
  doseAndFrequency: string;
  purpose: string;
  isHerbalOrSupplement: boolean;
  dateStarted?: string;
}

export interface PatientMedicationProfile {
  id: string;
  patientId: string;
  tenantId: string;
  patientName: string;
  patientNinOrId?: string;
  dateOfBirth?: string;
  gender?: string;
  phone: string;
  currentMedications: ActiveMedicationEntry[];
  previousMedications: PastMedicationEntry[];
  knownAllergies: PatientAllergyEntry[];
  previousAdrs: PatientAdrHistoryEntry[];
  chronicConditions: ChronicConditionEntry[];
  otcMedicationsReported: OtcMedicationEntry[];
  totalPrescriptionsCount: number;
  totalDispensingCount: number;
  lastClinicalReviewDate?: string;
  lastReviewedByPharmacist?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalSafetyAlert {
  id: string;
  category: ClinicalAlertCategory;
  severity: ClinicalAlertSeverity;
  headline: string;
  primaryOffendingDrug: string;
  interactingContext: string; // e.g. "Current Metformin", "Penicillin Allergy", "Asthma"
  clinicalMechanism: string;
  clinicalHazardExplanation: string;
  recommendedAction: string;
  isVoluntaryConditionTrigger: boolean;
}

export interface ClinicalEvaluationResult {
  hasAlerts: boolean;
  totalAlertsCount: number;
  highestSeverity: ClinicalAlertSeverity | 'none';
  alerts: ClinicalSafetyAlert[];
  patientProfileSnapshot?: PatientMedicationProfile;
  evaluatedAt: string;
}

export interface PharmacistClinicalDecision {
  prescriptionId: string;
  prescriptionReferenceNo: string;
  patientId: string;
  action: PharmacistDecisionAction;
  pharmacistName: string;
  pharmacistRole: string;
  pharmacistPsuNo: string;
  clinicalOverrideJustification?: string;
  prescriberContactedNotes?: string;
  timestamp: string;
}

// ─── 19. Pharmacist Clinical Intervention Recording (§11.16, §11.28) ──────────

export type InterventionReasonCategory =
  | 'dose_clarification_or_adjustment'
  | 'drug_drug_interaction'
  | 'allergy_or_contraindication_concern'
  | 'duplicate_therapy'
  | 'wrong_or_inappropriate_strength'
  | 'wrong_or_excessive_quantity'
  | 'wrong_or_suboptimal_dosage_form'
  | 'prescriber_clarification_needed'
  | 'therapeutic_or_generic_substitution'
  | 'renal_or_hepatic_dose_adjustment'
  | 'adherence_or_cost_optimization';

export type InterventionActionTaken =
  | 'prescriber_contacted_and_amended'
  | 'dose_modified_per_protocol'
  | 'generic_brand_substituted'
  | 'dosage_form_changed'
  | 'drug_discontinued_and_replaced'
  | 'patient_counseled_and_staggered'
  | 'prescription_refused_safety_grounds';

export type InterventionFinalDecision =
  | 'accepted_by_prescriber'
  | 'partially_accepted_with_modification'
  | 'overridden_by_prescriber_with_rationale'
  | 'pharmacist_authorized_protocol_change'
  | 'prescription_cancelled_and_reissued'
  | 'referred_back_to_clinic';

export type ClinicalSignificanceGrade =
  | 'grade_1_life_saving_prevented_fatal_event'
  | 'grade_2_major_prevented_serious_toxicity_or_hospitalization'
  | 'grade_3_moderate_optimized_efficacy_prevented_adr'
  | 'grade_4_minor_administrative_or_clarification';

export interface OriginalPrescriptionSnapshot {
  drugName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  doseAndFrequency: string;
  duration?: string;
  quantity?: number;
  route?: string;
}

export interface ModifiedRegimenSnapshot {
  drugName?: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  doseAndFrequency?: string;
  duration?: string;
  quantity?: number;
}

export interface PharmacistClinicalInterventionRecord {
  id: string;
  interventionReferenceNo: string;
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
  originalPrescription: OriginalPrescriptionSnapshot;
  reasonCategory: InterventionReasonCategory;
  clinicalProblemDescription: string;
  evidenceOrGuidelineReference?: string;
  actionTaken: InterventionActionTaken;
  actionDetails: string;
  modifiedRegimen?: ModifiedRegimenSnapshot;
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
  digitalSignatureHash: string;
  timestamp: string;
  createdAt: string;
}

export interface ClinicalInterventionSummaryKPIs {
  totalInterventionsCount: number;
  prescriberAcceptanceRatePercent: number;
  grade1LifeSavingCount: number;
  grade2MajorToxicityPreventedCount: number;
  topInterventionCategory: string;
  estimatedNetSavingsUgx: number;
}

// ─── 24. Procure-to-Pay (P2P) Enterprise Pharmacy Workflow ──────────────────

export type P2PStage =
  | 'requisition'
  | 'purchase_order'
  | 'supplier_confirmation'
  | 'goods_received'
  | 'batch_registration'
  | 'quality_verification'
  | 'invoice'
  | 'invoice_matching'
  | 'payment';

export type P2PRequisitionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'converted_to_po';

export type P2PPOLifecycleStatus =
  | 'draft'
  | 'issued_to_supplier'
  | 'confirmed_by_supplier'
  | 'partially_received'
  | 'fully_received'
  | 'closed'
  | 'cancelled';

export type P2PQcOutcome =
  | 'passed_released_to_stock'
  | 'passed_with_minor_defects'
  | 'quarantined_pending_investigation'
  | 'rejected_damaged_or_spurious'
  | 'rejected_cold_chain_breached'
  | 'rejected_shortage';

export type P2PMatchStatus =
  | 'exact_match'
  | 'matched_within_tolerance'
  | 'price_mismatch_flagged'
  | 'quantity_mismatch_flagged'
  | 'unmatched_blocked';

export type P2PPaymentStatus =
  | 'pending_authorization'
  | 'authorized_for_payment'
  | 'payment_initiated'
  | 'settled_and_reconciled'
  | 'voided';

export interface PurchaseRequisitionItem {
  id: string;
  drugId?: string;
  genericName: string;
  brandName?: string;
  dosageForm: string;
  strength?: string;
  currentStockLevel: number;
  reorderLevel: number;
  requestedQuantity: number;
  unitOfMeasure: string;
  estimatedUnitCostUgx: number;
  lineTotalEstimatedUgx: number;
  clinicalJustification?: string;
}

export interface PurchaseRequisition {
  id: string;
  tenantId: string;
  prNumber: string;
  branchName: string;
  requestedByName: string;
  requestedByRole: string;
  priority: 'standard' | 'urgent' | 'stockout_emergency';
  requisitionReason: string;
  status: P2PRequisitionStatus;
  estimatedTotalUgx: number;
  approvedByName?: string;
  approvedByRole?: string;
  approvedAt?: string;
  rejectionReason?: string;
  items: PurchaseRequisitionItem[];
  createdAt: string;
}

export interface P2PPurchaseOrderItem {
  id: string;
  drugId?: string;
  genericName: string;
  brandName?: string;
  dosageForm: string;
  strength?: string;
  orderedQuantity: number;
  unitCostUgx: number;
  totalLineAmountUgx: number;
  confirmedQuantity?: number;
  confirmedUnitCostUgx?: number;
}

export interface P2PPurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  requisitionId?: string;
  requisitionNumber?: string;
  supplierId: string;
  supplierName: string;
  supplierLicenseNo?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  paymentTerms: string;
  deliveryLocation: string;
  expectedDeliveryDate: string;
  currency: string;
  totalOrderAmountUgx: number;
  status: P2PPOLifecycleStatus;
  supplierAckReference?: string;
  supplierConfirmedAt?: string;
  supplierConfirmedDispatchDate?: string;
  supplierBackorderNotes?: string;
  createdByName: string;
  createdByRole: string;
  items: P2PPurchaseOrderItem[];
  createdAt: string;
}

export interface P2PGoodsReceivedItem {
  id: string;
  drugId?: string;
  genericName: string;
  brandName?: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  varianceQuantity: number;
  unitOfMeasure: string;
  batchNumber: string;
  manufacturerName: string;
  countryOfOrigin: string;
  manufacturingDate: string;
  expiryDate: string;
  assignedStorageLocation: string;
  isColdChain: boolean;
  targetTemperatureRange?: string;
}

export interface P2PGoodsReceivedNote {
  id: string;
  tenantId: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierName: string;
  deliveryNoteNumber: string;
  waybillCarrierName?: string;
  vehicleRegistration?: string;
  receivedByName: string;
  receivedByRole: string;
  receiptDate: string;
  totalPackagesReceived: number;
  externalPackagingCondition: string;
  notes?: string;
  items: P2PGoodsReceivedItem[];
  createdAt: string;
}

export interface P2PQualityInspection {
  id: string;
  tenantId: string;
  qcNumber: string;
  grnId: string;
  grnNumber: string;
  inspectorPharmacistName: string;
  inspectorPsuLicenseNo?: string;
  inspectionDate: string;
  physicalCountVerified: boolean;
  sealsAndLabelingVerified: boolean;
  coldChainLogVerified: boolean;
  temperatureReadoutCelsius?: number;
  certificateOfAnalysisVerified: boolean;
  outcome: P2PQcOutcome;
  passedQuantity: number;
  quarantinedQuantity: number;
  rejectedQuantity: number;
  qcRemarks?: string;
  createdAt: string;
}

export interface P2PSupplierInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  supplierName: string;
  purchaseOrderId: string;
  poNumber: string;
  grnId?: string;
  grnNumber?: string;
  invoiceDate: string;
  dueDate: string;
  subtotalUgx: number;
  taxVatUgx: number;
  withholdingTaxUgx: number;
  freightHandlingUgx: number;
  totalInvoicedAmountUgx: number;
  invoiceDocumentUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface P2PInvoiceMatchingRecord {
  id: string;
  tenantId: string;
  matchReference: string;
  invoiceId: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  grnId: string;
  grnNumber: string;
  poAuthorizedAmountUgx: number;
  grnAcceptedValueUgx: number;
  invoiceBilledAmountUgx: number;
  priceVarianceUgx: number;
  quantityVarianceUnits: number;
  netVarianceUgx: number;
  matchStatus: P2PMatchStatus;
  varianceExplanation?: string;
  verifiedByName: string;
  verifiedByRole: string;
  matchedAt: string;
}

export interface P2PPaymentVoucher {
  id: string;
  tenantId: string;
  voucherNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  matchRecordId?: string;
  supplierName: string;
  paymentMethod: string;
  bankAccountOrMomoRef: string;
  grossAmountUgx: number;
  whtDeductedUgx: number;
  netPayableUgx: number;
  paymentStatus: P2PPaymentStatus;
  authorizedByName?: string;
  authorizedByRole?: string;
  authorizedAt?: string;
  paidAt?: string;
  transactionReference?: string;
  settlementNotes?: string;
  createdAt: string;
}

export interface ProcureToPayDossier {
  id: string;
  dossierCode: string;
  title: string;
  requisition: PurchaseRequisition;
  purchaseOrder?: P2PPurchaseOrder;
  goodsReceivedNote?: P2PGoodsReceivedNote;
  qualityInspection?: P2PQualityInspection;
  supplierInvoice?: P2PSupplierInvoice;
  matchingRecord?: P2PInvoiceMatchingRecord;
  paymentVoucher?: P2PPaymentVoucher;
  currentStage: P2PStage;
  overallStatus: 'In Progress' | 'Completed & Settled' | 'Blocked / Exception' | 'Cancelled';
  totalValueUgx: number;
  lastUpdated: string;
}

export interface P2PKPIs {
  activeRequisitionsCount: number;
  openPurchaseOrdersCount: number;
  pendingGoodsArrivalsCount: number;
  pendingQcInspectionsCount: number;
  invoicesAwaitingMatchCount: number;
  authorizedPendingPaymentUgx: number;
  totalSettledThisQuarterUgx: number;
  threeWayMatchPassRatePercent: number;
}

// ─── 24B. 3-Way Invoice Matching & Reconciliation Engine ─────────────────────

export type ThreeWayLineVerdict =
  | 'exact_match'
  | 'within_tolerance'
  | 'quantity_mismatch'
  | 'price_mismatch'
  | 'quantity_and_price_mismatch'
  | 'item_missing_from_invoice'
  | 'item_missing_from_grn'
  | 'unmatched';

export type ThreeWaySessionVerdict =
  | 'full_match'
  | 'partial_match_within_tolerance'
  | 'blocked_quantity_discrepancy'
  | 'blocked_price_discrepancy'
  | 'blocked_multiple_discrepancies'
  | 'pending_review'
  | 'dispute_raised'
  | 'override_approved';

export type MatchDisputeStatus =
  | 'open'
  | 'credit_note_requested'
  | 'credit_note_received'
  | 'price_adjustment_accepted'
  | 'debit_note_issued'
  | 'escalated_to_management'
  | 'resolved_and_closed'
  | 'written_off';

export interface MatchToleranceConfig {
  id: string;
  tenantId: string;
  quantityTolerancePercent: number;
  quantityToleranceAbsoluteUnits: number;
  priceTolerancePercent: number;
  priceToleranceAbsoluteUgx: number;
  totalValueToleranceUgx: number;
  autoApproveExactMatch: boolean;
  autoApproveWithinTolerance: boolean;
  requireDualAuthorizationAboveUgx: number;
  configuredByName: string;
  configuredByRole: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  poItemId?: string;
  drugId?: string;
  genericName: string;
  brandName?: string;
  dosageForm?: string;
  strength?: string;
  invoicedQuantity: number;
  unitCostUgx: number;
  lineTotalUgx: number;
  batchNumberReferenced?: string;
  unitOfMeasure: string;
  notes?: string;
}

export interface ThreeWayMatchLineDetail {
  id: string;
  matchSessionId: string;
  drugId?: string;
  genericName: string;
  brandName?: string;
  unitOfMeasure: string;

  // PO Data
  poItemId?: string;
  poOrderedQuantity: number;
  poUnitCostUgx: number;
  poLineTotalUgx: number;

  // GRN Data
  grnItemId?: string;
  grnDeliveredQuantity: number;
  grnAcceptedQuantity: number;
  grnBatchNumber?: string;

  // Invoice Data
  invoiceItemId?: string;
  invoiceBilledQuantity: number;
  invoiceUnitCostUgx: number;
  invoiceLineTotalUgx: number;

  // Computed Variances
  qtyVariancePoVsGrn: number;
  qtyVarianceGrnVsInvoice: number;
  qtyVariancePoVsInvoice: number;
  priceVariancePoVsInvoiceUgx: number;
  valueVarianceUgx: number;

  // Verdict
  lineVerdict: ThreeWayLineVerdict;
  varianceExplanation?: string;
  isFlagged: boolean;
  flagReason?: string;
}

export interface ThreeWayMatchSession {
  id: string;
  tenantId: string;
  matchSessionReference: string;
  invoiceId: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  grnId: string;
  grnNumber: string;
  supplierName: string;

  // Header-Level Totals
  poTotalAuthorizedUgx: number;
  grnTotalAcceptedUgx: number;
  invoiceTotalBilledUgx: number;

  // Header-Level Variances
  poVsGrnQtyVarianceTotal: number;
  poVsInvoicePriceVarianceUgx: number;
  grnVsInvoiceQtyVarianceTotal: number;
  netFinancialVarianceUgx: number;

  // Line Match Summary
  totalLineItems: number;
  linesExactMatched: number;
  linesWithinTolerance: number;
  linesQtyMismatch: number;
  linesPriceMismatch: number;
  linesMissing: number;

  // Session Verdict
  sessionVerdict: ThreeWaySessionVerdict;
  verdictSummary: string;
  financialRiskAssessment?: string;
  recommendedAction?: string;

  // Workflow
  executedByName: string;
  executedByRole: string;
  executedAt: string;
  reviewedByName?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  approvedByName?: string;
  approvedByRole?: string;
  approvedAt?: string;
  overrideReason?: string;

  // Line Details
  lineDetails: ThreeWayMatchLineDetail[];
  createdAt: string;
}

export interface ThreeWayMatchDispute {
  id: string;
  tenantId: string;
  disputeReference: string;
  matchSessionId: string;
  matchSessionReference: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierName: string;
  disputeType: 'quantity_shortage' | 'price_overcharge' | 'both' | 'item_not_ordered';
  totalDisputedAmountUgx: number;
  disputedLineCount: number;
  disputeNarrative: string;
  supportingDocumentUrls?: string[];
  supplierResponse?: string;
  creditNoteNumber?: string;
  creditNoteAmountUgx?: number;
  creditNoteDate?: string;
  debitNoteNumber?: string;
  debitNoteAmountUgx?: number;
  status: MatchDisputeStatus;
  raisedByName: string;
  raisedByRole: string;
  raisedAt: string;
  resolvedByName?: string;
  resolvedByRole?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface ThreeWayReconciliationReport {
  matchSession: ThreeWayMatchSession;
  disputes: ThreeWayMatchDispute[];
  toleranceConfig: MatchToleranceConfig;
  generatedAt: string;
  generatedByName: string;
}

// ─── 25. POS & Pharmacy Dispensing Transaction Engine ────────────────────────

export type POSSaleType =
  | 'otc_sale'
  | 'prescription_sale'
  | 'refill_sale'
  | 'emergency_sale';

export type POSCustomerType =
  | 'walk_in'
  | 'registered_patient'
  | 'corporate_account'
  | 'staff';

export type POSPaymentMethod =
  | 'Cash'
  | 'Mobile Money'
  | 'Card'
  | 'Credit'
  | 'Insurance Scheme'
  | 'Split';

export type POSTransactionStatus =
  | 'completed'
  | 'voided'
  | 'refunded'
  | 'partially_refunded';

export interface POSCartItem {
  drugId: string;
  genericName: string;
  brandName: string;
  dosageForm: string;
  isPrescriptionOnly: boolean;
  quantity: number;
  availableStock: number;
  batchId?: string;
  batchNumber: string;
  batchExpiryDate: string;
  shelfLocation?: string;
  unitCostUgx: number;
  unitSellingPriceUgx: number;
  discountPercent: number;
  discountAmountUgx: number;
  taxRatePercent: number; // 0% on Essential Rx per Uganda tax law, 18% on general
  taxAmountUgx: number;
  lineTotalUgx: number;
  dosageInstructions?: string;
  daysSupply?: number;
}

export interface POSSalesTransaction {
  id: string;
  tenantId: string;
  receiptNo: string;
  saleType: POSSaleType;
  customerType: POSCustomerType;
  patientId?: string;
  customerName: string;
  customerPhone?: string;
  prescriptionId?: string;
  prescriptionRefNo?: string;
  prescriberName?: string;
  prescriberLicenceNo?: string;
  pharmacistUserId?: string;
  pharmacistName: string;
  dispensingNotes?: string;
  items: POSCartItem[];
  grossSubtotalUgx: number;
  lineDiscountsUgx: number;
  orderDiscountUgx: number;
  discountReason?: string;
  taxableAmountUgx: number;
  taxVatUgx: number;
  netTotalUgx: number;
  patientPaidUgx: number;
  insuranceCoveredUgx: number;
  paymentMethod: POSPaymentMethod;
  paymentSplits?: { method: string; amountUgx: number; reference?: string }[];
  cashTenderedUgx?: number;
  cashChangeUgx?: number;
  momoProvider?: string;
  momoPhone?: string;
  momoReference?: string;
  cardAuthCode?: string;
  creditDueDate?: string;
  creditAuthorizedBy?: string;
  status: POSTransactionStatus;
  voidedAt?: string;
  voidedByName?: string;
  voidReason?: string;
  supervisorOverrideCode?: string;
  refundedAmountUgx?: number;
  refundReason?: string;
  refundReturnDisposition?: 'return_to_saleable_stock' | 'quarantine' | 'destruction';
  createdAt: string;
}

export interface POSDailyZReport {
  date: string;
  totalTransactions: number;
  totalGrossSalesUgx: number;
  totalDiscountsUgx: number;
  totalNetSalesUgx: number;
  totalVatUgx: number;
  cashTotalUgx: number;
  momoTotalUgx: number;
  cardTotalUgx: number;
  creditTotalUgx: number;
  insuranceTotalUgx: number;
  totalVoidedTransactions: number;
  totalVoidedAmountUgx: number;
  totalRefundedAmountUgx: number;
  cashierName: string;
  generatedAt: string;
}

// ─── 26. Financial & Accounting Controls Engine ──────────────────────────────

export type OpExCategoryType =
  | 'utilities_electricity_water_internet'
  | 'rent_and_facility_lease'
  | 'salaries_wages_and_locum'
  | 'logistics_courier_and_transport'
  | 'generator_fuel_and_maintenance'
  | 'dispensary_packaging_and_supplies'
  | 'licensing_nda_and_regulatory_fees'
  | 'audit_legal_and_professional'
  | 'marketing_and_patient_education'
  | 'miscellaneous_petty_expenses';

export interface CashDrawerSession {
  id: string;
  tenantId: string;
  sessionNumber: string;
  tillIdentifier: string;
  cashierUserId?: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingCashFloatUgx: number;
  cashSalesInUgx: number;
  cashRefundsOutUgx: number;
  cashExpensesOutUgx: number;
  cashWithdrawalsBankDropsUgx: number;
  expectedClosingCashUgx: number;
  actualCountedCashUgx?: number;
  cashVarianceUgx: number;
  varianceExplanation?: string;
  status: 'open' | 'closed_pending_audit' | 'balanced_and_reconciled' | 'flagged_cash_variance';
  auditedByName?: string;
  auditedByRole?: string;
  auditedAt?: string;
  supervisorNotes?: string;
  createdAt: string;
}

export interface PettyCashMovement {
  id: string;
  sessionId?: string;
  tenantId: string;
  voucherNumber: string;
  movementType: 'cash_expense_payout' | 'bank_deposit_drop' | 'float_replenishment';
  category: string;
  amountUgx: number;
  payeeOrRecipient: string;
  justification: string;
  receiptDocReference?: string;
  authorizedByName: string;
  timestamp: string;
}

export interface OperatingExpense {
  id: string;
  tenantId: string;
  expenseVoucherNo: string;
  category: OpExCategoryType;
  expenseTitle: string;
  vendorOrPayee: string;
  invoiceOrBillRef?: string;
  grossAmountUgx: number;
  taxWithheldWhtUgx: number;
  netPayableUgx: number;
  paymentMethod: string;
  expenseDate: string;
  status: 'draft' | 'pending_approval' | 'approved_for_payment' | 'paid_and_settled' | 'rejected';
  approvedByName?: string;
  approvedAt?: string;
  paidAt?: string;
  paymentTransactionRef?: string;
  accountingNotes?: string;
  createdAt: string;
}

export interface DailyChannelReconciliation {
  id: string;
  tenantId: string;
  reconciliationDate: string;
  systemRecordedGrossSalesUgx: number;
  gatewayMomoSettledUgx: number;
  gatewayCardSettledUgx: number;
  cashDrawerCountedUgx: number;
  patientCreditReceivablesUgx: number;
  insuranceClaimsReceivablesUgx: number;
  totalReconciledInflowUgx: number;
  netReconciliationVarianceUgx: number;
  reconciliationStatus: 'balanced' | 'minor_rounding_variance' | 'investigation_required';
  varianceNarrative?: string;
  reconciledByName: string;
  createdAt: string;
}

export interface PharmacyProfitabilityStatement {
  periodLabel: string;
  startDate: string;
  endDate: string;
  grossRevenueUgx: number;
  discountsGrantedUgx: number;
  netRevenueUgx: number;
  costOfGoodsSoldCogsUgx: number;
  grossProfitUgx: number;
  grossProfitMarginPercent: number;
  operatingExpensesByCategory: { category: string; categoryLabel: string; totalUgx: number }[];
  totalOperatingExpensesUgx: number;
  netOperatingProfitEbitdaUgx: number;
  netProfitMarginPercent: number;
}

export interface FinancialAccountingKPIs {
  totalNetRevenueMonthToDateUgx: number;
  totalCogsMonthToDateUgx: number;
  grossProfitMonthToDateUgx: number;
  grossMarginPercent: number;
  totalOpexMonthToDateUgx: number;
  netOperatingProfitUgx: number;
  netMarginPercent: number;
  activeCashDrawerVarianceUgx: number;
  pendingOpexApprovalsCount: number;
  pendingOpexAmountUgx: number;
}



