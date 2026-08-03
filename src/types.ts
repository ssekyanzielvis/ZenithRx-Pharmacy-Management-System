export type ModuleTab =
  | 'overview'
  | 'prescriptions'
  | 'inventory'
  | 'expiry'
  | 'customers'
  | 'reordering'
  | 'pos'
  | 'reports'
  | 'insurance'
  | 'adminPackages';

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
  age: number;
  gender: 'Male' | 'Female';
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  activePrescriptionsCount: number;
  totalPurchasesCount: number;
  totalAmountSpent: number;
  lastVisit: string;
  insuranceProvider?: string;
  policyNumber?: string;
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

export interface ExpiryReportItem {
  drug: DrugItem;
  daysRemaining: number;
  riskStatus: 'Expired' | 'Critical (<30 days)' | 'Warning (<90 days)';
}
