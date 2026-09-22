export type ModuleTab =
  | 'overview'
  | 'prescriptions'
  | 'inventory'
  | 'expiry'
  | 'customers'
  | 'reordering'
  | 'pos'
  | 'payments'
  | 'reports'
  | 'insurance'
  | 'audit'
  | 'collaborators'
  | 'health'
  | 'nda'
  | 'tenancy'
  | 'adminPackages'
  | 'adminControlPlane'
  | 'adminExecutive'
  | 'adminPolicies'
  | 'adminDelegated'
  | 'adminDualControl'
  | 'adminIncidents'
  | 'adminMatrix'
  | 'adminUsers'
  | 'adminBilling'
  | 'adminRegister'
  | 'adminCapacity'
  | 'adminPharmacyRegistry'
  | 'adminMessagingHub'
  | 'adminQuantumWorkbench'
  | 'adminRevenueLedger'
  | 'feedback'
  | 'adminFeedback';

export type SubscriptionStatus = 'active' | 'expired' | 'none';
export type BillingCycle = 'monthly' | 'yearly';

export type TierName = 'Starter' | 'Professional' | 'Enterprise' | 'Custom Tailored';

export interface PackageTier {
  id: TierName;
  name: string;
  tagline: string;
  originalPriceUgx: number;
  discountPriceUgx: number;
  maxUsers: number;
  isPopular?: boolean;
  features: string[];
  color: string;
}

export interface UserAccessRights {
  canAccessPOS: boolean;
  canManageInventory: boolean;
  canProcessPrescriptions: boolean;
  canApproveReorders: boolean;
  canViewReports: boolean;
  canSubmitInsurance: boolean;
  canUseAiAssistant: boolean;
  canManageStaffAccounts: boolean;
}

export type UserRoleRank = 
  | 'Supervising Pharmacist'
  | 'Assistant Pharmacist'
  | 'Pharmacy Technician'
  | 'POS Cashier / Dispenser'
  | 'Store & Inventory Manager'
  | 'Finance & Claims Officer'
  | 'Intern Pharmacist';

export interface PharmacyUserAccount {
  id: string;
  clientId: string;
  fullName: string;
  email: string;
  phone: string;
  staffRegNo?: string;
  rankRole: UserRoleRank;
  status: 'Active' | 'Suspended' | 'Pending Invite';
  accessRights: UserAccessRights;
  lastLogin?: string;
  dateCreated: string;
}

export interface ClientSubscription {
  id: string;
  clientName: string;
  location: string;
  contactPhone: string;
  contactEmail: string;
  packageTier: TierName;
  customMaxUsers: number;
  monthlyUgxRate: number;
  billingStatus: 'Active' | 'Pending Renewal' | 'Grace Period' | 'Suspended';
  nextBillingDate: string;
  ndaLicenseNo?: string;
  ndaVerified?: boolean;
  supervisingPharmacist?: string;
  users?: PharmacyUserAccount[];
  allowedFeatures: {
    basicInventory: boolean;
    batchTracking: boolean;
    autoReordering: boolean;
    expiryAlerts: boolean;
    posBilling: boolean;
    salesAnalytics: boolean;
    insuranceClaims: boolean;
    aiCounseling: boolean;
    multiLocation: boolean;
    apiAccess: boolean;
  };
}

export interface NdaPharmacyRecord {
  licenseNo: string;
  pharmacyName: string;
  branchName: string;
  district: string;
  region: string;
  supervisingPharmacist: string;
  psuRegNo: string;
  licenseCategory: 'Retail' | 'Retail & Wholesale' | 'Wholesale' | 'Hospital Pharmacy';
  contactPhone: string;
  contactEmail: string;
  status: 'Active & Licensed' | 'Pending Renewal';
  expiryDate: string;
}

export interface DrugItem {
  id: string;
  brandName: string;
  genericName: string;
  barcode: string;
  batchNumber: string;
  category: 'Antibiotics' | 'Analgesics' | 'Cardiovascular' | 'Diabetes' | 'Respiratory' | 'OTC & Supplements' | 'Gastrointestinal' | 'Dermatology';
  shelfLocation: string;
  costPrice: number;
  sellingPrice: number;
  stockQty: number;
  reorderLevel: number;
  expiryDate: string; // YYYY-MM-DD
  manufacturer: string;
  prescriptionRequired: boolean;
  unit: string; // 'tablets', 'capsules', 'bottle (100ml)', 'inhaler', 'vial'
}

export interface Prescription {
  id: string;
  rxNumber: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientPhone: string;
  doctorName: string;
  doctorLicence: string;
  hospitalName: string;
  date: string;
  status: 'Pending' | 'Dispensed' | 'Partially Dispensed' | 'Cancelled';
  medications: Array<{
    drugId: string;
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    unitPrice: number;
    dispensedQty: number;
    status: 'Pending' | 'Dispensed';
  }>;
  insuranceClaimId?: string;
  notes?: string;
  totalCost: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  age: number;
  gender: 'Male' | 'Female';
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  activePrescriptionsCount: number;
  totalPurchasesCount: number;
  totalAmountSpent: number;
  lastVisit: string;
  loyaltyPoints?: number;
  insuranceProvider?: string;
  policyNumber?: string;
  chronicMedications?: Array<{
    drugName: string;
    dosage: string;
    frequency: string;
    daysSupply: number;
    nextRefillDate: string;
    status: 'Due' | 'Upcoming' | 'Refilled';
  }>;
  lastRefillReminderSent?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierEmail: string;
  dateCreated: string;
  items: Array<{
    drugId: string;
    brandName: string;
    currentStock: number;
    orderQty: number;
    unitCost: number;
  }>;
  status: 'Draft' | 'Sent to Supplier' | 'Fulfilled' | 'Cancelled';
  totalAmount: number;
}

export interface POSTransaction {
  id: string;
  receiptNo: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    drugId: string;
    brandName: string;
    unitPrice: number;
    quantity: number;
    total: number;
    isPrescription: boolean;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  insuranceCopayAmount: number;
  insuranceCoveredAmount: number;
  totalPaid: number;
  paymentMethod: 'Cash' | 'Mobile Money' | 'M-Pesa / Mobile' | 'MTN Mobile Money / Airtel Money' | 'Card' | 'Insurance Scheme' | 'WhatsApp Invoice';
  mpesaRef?: string;
  cashierName: string;
  timestamp: string;
}

export interface InsuranceProvider {
  id: string;
  providerName: string;
  code: string;
  contactPhone: string;
  coverageRatio: number; // e.g., 0.8 for 80% coverage
  pendingClaimsCount: number;
  totalClaimedAmount: number;
  status: 'Active' | 'Under Review';
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  providerId: string;
  providerName: string;
  memberNumber: string;
  patientName: string;
  patientPhone: string;
  prescriptionId?: string;
  rxNumber?: string;
  diagnosisCode?: string;
  totalAmount: number;
  coveredAmount: number;
  copayAmount: number;
  preAuthCode: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Reconciled' | 'Rejected';
  submissionDate: string;
  reconciliationDate?: string;
  remittanceAdviceNo?: string;
  rejectionReason?: string;
  items: Array<{
    drugName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface ExpiryReportItem {
  drug: DrugItem;
  daysRemaining: number;
  riskStatus: 'Expired' | 'Critical (<30 days)' | 'Warning (<90 days)';
}

export interface PharmacyFeedbackTicket {
  id: string;
  clientId: string;
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  category: 'Bug Report' | 'Feature Request' | 'Billing Inquiry' | 'NDA Compliance' | 'General Feedback' | 'Performance';
  urgency: 'Normal' | 'High Priority' | 'Critical';
  subject: string;
  message: string;
  status: 'Pending Admin Review' | 'In Progress' | 'Resolved';
  dateSubmitted: string;
  adminReply?: {
    repliedBy: string;
    replyMessage: string;
    dateReplied: string;
  };
}

export type NotificationChannel = 'in_system' | 'email' | 'phone' | 'admin_call';

export interface TenantCapacityMetrics {
  id?: string;
  tenantId: string;
  tenantName?: string;
  currentTier: TierName;
  recommendedTier?: TierName;
  staffCount: number;
  staffLimit: number;
  drugsCount: number;
  drugsLimit: number;
  prescriptionsCount: number;
  prescriptionsLimit: number;
  transactionsCount: number;
  transactionsLimit: number;
  storageMb: number;
  storageLimitMb: number;
  staffUsagePercent: number;
  drugsUsagePercent: number;
  prescriptionsUsagePercent: number;
  transactionsUsagePercent: number;
  storageUsagePercent: number;
  overallUsagePercent: number;
  recordedAt: string;
}

export interface CapacityAlert {
  id: string;
  tenantId: string;
  tenantName?: string;
  alertType: 'warning_70' | 'critical_85' | 'breach_95' | 'limit_exceeded' | 'upgrade_recommended';
  metric: 'staff' | 'drugs' | 'prescriptions' | 'transactions' | 'storage' | 'overall';
  usagePercent: number;
  currentValue: number;
  maxLimit: number;
  currentTier: TierName;
  recommendedTier?: TierName;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  notificationChannels: NotificationChannel[];
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface PlanEnforcementEvent {
  id: string;
  tenantId: string;
  tenantName?: string;
  userId?: string;
  userName?: string;
  actionAttempted: string;
  featureKey: string;
  requiredTier: TierName;
  currentTier: TierName;
  blockedReason: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  tenantId?: string; // empty/null = global
  recipientUserId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'upgrade_recommendation' | 'compliance_notice' | 'system_alert';
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AdminPharmacyMessage {
  id: string;
  threadId: string;
  tenantId: string;
  tenantName?: string;
  senderUserId: string;
  senderName: string;
  senderType: 'admin' | 'pharmacy';
  recipientType: 'admin' | 'pharmacy';
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'plan_upgrade' | 'compliance_nda' | 'support' | 'billing' | 'escalation';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NdaComplianceCheckRecord {
  id: string;
  tenantId: string;
  tenantName?: string;
  checkedBy?: string;
  checkerName?: string;
  status: 'compliant' | 'warning' | 'breach_flagged' | 'suspended' | 'under_review';
  ndaLicenseNumber?: string;
  verificationNotes: string;
  patientDataSafetyVerified: boolean;
  auditTrailVerified: boolean;
  nextReviewDate?: string;
  createdAt: string;
}

// ─── Subscription Revenue & SaaS Bookkeeping Types ─────────────────────────

export type SubscriptionPaymentChannel =
  | 'MTN_MOMO'
  | 'AIRTEL_MONEY'
  | 'PESAPAL_VISA_MC'
  | 'BANK_EFT_STANBIC'
  | 'BANK_EFT_CENTENARY'
  | 'SYSTEM_ESCROW_SETTLEMENT';

export type SubscriptionPaymentStatus =
  | 'COMPLETED'
  | 'PENDING_CLEARANCE'
  | 'FAILED'
  | 'OVERDUE'
  | 'ESCROW_HOLD'
  | 'REFUNDED';

export interface SubscriptionPaymentRecord {
  id: string;
  invoiceNumber: string; // e.g. QNT-INV-2026-0812
  fiscalReceiptNumber: string; // e.g. URA-EFRIS-REC-991204
  tenantId: string;
  tenantName: string;
  packageTier: TierName;
  billingCycle: BillingCycle;
  grossAmountUgx: number;
  taxVatUgx: number; // 18% URA VAT
  netRevenueUgx: number;
  amountUsdEquivalent: number;
  paymentChannel: SubscriptionPaymentChannel;
  providerReference: string; // MoMo TxID / PesaPal Ref / Bank EFT Code
  paymentPhoneOrAccount?: string;
  paymentStatus: SubscriptionPaymentStatus;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  onboardingSource: 'ADMIN_PANEL_SYSTEM' | 'SELF_SERVICE_PORTAL' | 'RENEWAL_GATEWAY';
  processedByUserId: string;
  processedByUserName: string;
  digitalSignatureHash: string;
  qrVerificationUrl?: string;
  accountDebitGlCode: string; // e.g. 1020 - Mobile Money Clearing / 1010 - Stanbic Bank Account
  accountCreditGlCode: string; // e.g. 4010 - SaaS Subscription Revenue
  accountVatGlCode: string; // e.g. 2150 - Output VAT Payable (18%)
  notes?: string;
}

export interface GeneralLedgerJournalEntry {
  id: string;
  entryDate: string;
  referenceNumber: string;
  tenantId: string;
  tenantName: string;
  description: string;
  accountCode: string;
  accountName: string;
  debitUgx: number;
  creditUgx: number;
  reconciled: boolean;
  reconciledAt?: string;
}

export interface PlatformRevenueSummary {
  grossArrUgx: number;
  grossMrrUgx: number;
  netSaaSYtdUgx: number;
  totalVatCollectedUgx: number;
  activePaidTenantsCount: number;
  pendingPaymentTenantsCount: number;
  mtnMomoClearingBalanceUgx: number;
  airtelMoneyClearingBalanceUgx: number;
  bankSettlementBalanceUgx: number;
  pesapalGatewayBalanceUgx: number;
  systemComplianceRatePercent: number; // 100% when all subscriptions are mediated through system
}



