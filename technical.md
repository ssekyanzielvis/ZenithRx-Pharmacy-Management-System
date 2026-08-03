# ZenithRx Pharmacy Management System — Technical Documentation

## Executive Overview
**ZenithRx** is an enterprise-grade, multi-tenant **Pharmacy Management System (PMS)** engineered for retail, wholesale, and hospital pharmacies. Built using React 18, TypeScript, and Tailwind CSS, ZenithRx integrates core clinical workflow modules with automated inventory control, point-of-sale billing, insurance claims processing, regulatory NDA (National Drug Authority) compliance verifications, and AI-powered clinical counseling via Google Gemini AI.

---

## Architecture & Technology Stack

### Core Technologies
* **Frontend Framework:** React 18 with TypeScript
* **Build System & Tooling:** Vite, ESBuild, PostCSS
* **Styling & UI:** Tailwind CSS v3 with custom utility classes & responsive flex/grid layouts
* **Iconography:** Lucide React (`lucide-react`)
* **AI Integration:** Google Gemini AI (@google/genai SDK) for prescription OCR digitization and clinical patient counseling guidance
* **Data Layer:** Strong TypeScript typing (`src/types.ts`) with reactive state management, initial seed dataset (`src/data/mockData.ts`), and client-side memory/persistence context
* **Barcode Handling:** Camera feed simulation & hardware barcode scanner input handler (`src/components/BarcodeScannerModal.tsx`)

### Directory Structure
```
/
├── index.html                    # HTML5 entry point & viewport configuration
├── metadata.json                 # Application metadata and camera frame permissions
├── package.json                  # NPM scripts & dependency definitions
├── src/
│   ├── main.tsx                  # React DOM bootstrap entry point
│   ├── App.tsx                   # Top-level state manager, module routing, client context
│   ├── types.ts                  # Shared TypeScript interfaces, types & enums
│   ├── index.css                 # Global CSS rules & Tailwind directives
│   ├── data/
│   │   └── mockData.ts           # Pre-seeded inventory, prescriptions, clients, NDA records
│   └── components/
│       ├── Header.tsx            # Global navigation, active client badges, module tab bar
│       ├── PointOfSale.tsx       # Billing POS terminal, payment gateway & thermal receipts
│       ├── PrescriptionProcessing.tsx # Clinical Rx queue & Gemini AI digitizer
│       ├── StockInventory.tsx    # FEFO stock control, batch management & search
│       ├── ExpiryAlerts.tsx      # Batch expiry monitoring (FEFO, write-offs, risk tiers)
│       ├── CustomerProfiles.tsx  # Patient medical history, allergy alerts & WhatsApp refills
│       ├── AutomatedReordering.tsx # Reorder triggers, supplier PO dispatch
│       ├── SalesReports.tsx      # Financial analytics, profit margins & revenue charts
│       ├── InsuranceSchemes.tsx  # Third-party insurance coverage & claims co-pay
│       ├── AdminPackages.tsx     # Multi-tenant SaaS subscription & staff rights matrix
│       ├── AICounselingModal.tsx # Gemini AI drug lookup & patient counseling assistant
│       ├── BarcodeScannerModal.tsx # Barcode camera/laser scanning modal
│       └── PromoBannerView.tsx   # System showcase & features poster view
```

---

## Data Models & Type System (`src/types.ts`)

### Key Entities

#### 1. `DrugItem` (Inventory & Batch Control)
```typescript
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
  unit: string;
}
```

#### 2. `Prescription` (Clinical Dispensing Queue)
```typescript
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
```

#### 3. `PharmacyUserAccount` & `UserAccessRights` (Designated Staff Accounts)
```typescript
export type UserRoleRank = 
  | 'Supervising Pharmacist'
  | 'Assistant Pharmacist'
  | 'Pharmacy Technician'
  | 'POS Cashier / Dispenser'
  | 'Store & Inventory Manager'
  | 'Finance & Claims Officer'
  | 'Intern Pharmacist';

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
```

#### 4. `ClientSubscription` (SaaS Multi-Tenancy & NDA Verification)
```typescript
export interface ClientSubscription {
  id: string;
  clientName: string;
  location: string;
  contactPhone: string;
  contactEmail: string;
  packageTier: TierName; // 'Starter' | 'Professional' | 'Enterprise' | 'Custom Tailored'
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
```

#### 5. `POSTransaction` & `InsuranceProvider`
* **POSTransaction:** Captures payment method (Cash, Mobile Money, M-Pesa, Card, Insurance, WhatsApp Invoice), items breakdown, tax, co-pay split, and cashier details.
* **InsuranceProvider:** Tracks provider coverage ratio (e.g. 80%), pending claim balances, and active policy verification.

---

## Key Modules & System Workflows

### 1. Point of Sale (POS) & Billing Terminal (`PointOfSale.tsx`)
* **Barcode Item Lookup:** Instant inventory filtering by typing or hardware/camera barcode scan.
* **Prescription Integration:** Pulls pending prescriptions directly into POS cart with automatic dosage/price computation.
* **Multi-Gateway Payment Processing:** Supports Cash, MTN Mobile Money / Airtel Money, M-Pesa, Credit/Debit Card, Insurance Co-pay splits, and WhatsApp digital invoice links.
* **Thermal Receipt Printing:** Generates print-ready thermal tax receipts with customizable store branding, QR/Barcode references, tax breakdown, and cashier signatures.

### 2. Clinical Prescription Digitizer & Processing (`PrescriptionProcessing.tsx`)
* **Gemini AI Note Digitizer:** Uses AI prompt engineering to extract structured medication lists (drug name, dosage, frequency, duration, quantity) from unstructured clinical doctor notes or handwritten prescription transcriptions.
* **Drug Interaction & Safety Checks:** Validates dosage ranges and alerts pharmacists to potential contraindications or allergy risks.
* **Dispensing Queue:** Tracks status transitions (`Pending` -> `Partially Dispensed` -> `Dispensed`). Updates stock balances in real time upon fulfillment.

### 3. Inventory & Expiry Control (`StockInventory.tsx` & `ExpiryAlerts.tsx`)
* **FEFO Protocol (First-Expired, First-Out):** Prioritizes batches approaching expiry during sale and dispensing workflows.
* **Risk Categorization:** Real-time monitoring into 3 alert tiers:
  * 🔴 **Expired:** Stock locked for immediate write-off.
  * 🟡 **Critical (<30 Days):** Discount promo candidate or manufacturer return.
  * 🟠 **Warning (<90 Days):** Re-location to high-turnover sales shelves.
* **Batch Adjustments:** Supports stock counts, damaged batch write-offs, and batch location reassignments.

### 4. Automated Reordering (`AutomatedReordering.tsx`)
* **Threshold Triggers:** Automatically identifies medications where `stockQty <= reorderLevel`.
* **Purchase Order (PO) Workflow:** Generates formal supplier POs with unit costs, order quantities, and total estimates. Dispatches directly to suppliers via simulated email/WhatsApp notification channels.

### 5. Patient Profiles & Chronic Care (`CustomerProfiles.tsx`)
* **Patient Medical Records:** Tracks age, blood group, drug allergies, chronic conditions, and past purchasing history.
* **WhatsApp Refill Reminders:** Computes refill due dates based on prescription duration and triggers automated WhatsApp gateway reminders.

### 6. Insurance Claims & Co-Pay Management (`InsuranceSchemes.tsx`)
* **Split Billing Engine:** Calculates insurer coverage amount based on provider ratio (e.g., 80% coverage / 20% patient co-pay) at checkout.
* **Claims Submissions:** Logs claim IDs, provider approvals, and pending reimbursement balances.

### 7. Multi-Tenant SaaS & Staff Rights Management (`AdminPackages.tsx`)
* **Uganda NDA Registry Integration:** Includes a pre-seeded Uganda National Drug Authority (NDA) licensed pharmacy register for auto-verifying client license numbers and supervising pharmacists.
* **Custom Plan Customizer:** Tailors allowed features, maximum designated staff user limits, and monthly UGX rates per client branch.
* **Granular Role Matrix:** Configures 7 staff roles (`Supervising Pharmacist`, `Assistant Pharmacist`, `Pharmacy Technician`, `POS Cashier`, `Store Manager`, `Claims Officer`, `Intern`) with fine-grained permissions for POS, Inventory, Prescriptions, Reorders, Analytics, Claims, AI, and User Management.

---

## Security, Access Control & Compliance

1. **Role-Based Access Control (RBAC):** Default role profiles enforce strict operational boundaries (e.g., POS cashiers cannot approve reorders or edit cost prices; Store Managers cannot issue clinical prescriptions).
2. **NDA Verification Gateways:** Integrates NDA license codes to ensure regulatory compliance for licensed pharmaceutical distributors.
3. **Audit Trails:** Logs cashier IDs, transaction timestamps, receipt numbers, and prescription fulfillment steps.

---

## Build & Deployment Procedures

### Development Commands
* `npm run dev`: Boots Vite development server on port `3000` (`0.0.0.0:3000`).
* `npm run lint`: Runs TypeScript compiler (`tsc --noEmit`) to verify strict type compliance.
* `npm run build`: Bundles static client assets into `dist/`.

### Deployment Rules
* ZenithRx is configured as a single-page React client application (SPA).
* Served behind an nginx reverse proxy on port 3000.
* Environment settings stored in `.env.example` and accessed safely via `import.meta.env` or server proxy endpoints.

---

## Summary of Core Capabilities
* **Full-Spectrum Pharmacy Workflow:** From doctor prescription digitization to thermal receipt issuing.
* **Regulatory Standard:** NDA Uganda registration compliance & PSU registered pharmacist tracking.
* **AI-Augmented:** Google Gemini AI clinical assistant for drug safety, interaction alerts, and unstructured Rx parsing.
* **Financially Precise:** UGX currency support, multi-gateway payments, profit margin calculations, and insurance claim co-pay splits.
