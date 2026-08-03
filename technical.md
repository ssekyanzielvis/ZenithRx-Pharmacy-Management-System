# ZenithRx Pharmacy Management System — Comprehensive Technical Manual & Architecture Specification

## Document Information
* **System Name:** ZenithRx Pharmacy Management System (PMS)
* **Version:** v3.2 Enterprise Edition
* **Target Platforms:** Cloud Run Container, Web Browsers (Desktop, Tablet, POS Terminal)
* **Primary Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Google Gemini AI (`@google/genai`)
* **Regulatory Compliance:** Uganda National Drug Authority (NDA) License Alignment & Pharmacy Society of Uganda (PSU) Supervision Framework
* **Primary Currency:** Ugandan Shillings (UGX) & Multi-Currency Ready

---

# Table of Contents
1. [Executive Summary & System Vision](#1-executive-summary--system-vision)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [Global Directory & Modular Architecture](#3-global-directory--modular-architecture)
4. [Complete Data Model & Type Specification (`src/types.ts`)](#4-complete-data-model--type-specification-srctypests)
5. [Application Core & Reactive State Routing (`src/App.tsx`)](#5-application-core--reactive-state-routing-srcapptsx)
6. [Exhaustive Component-by-Component Technical Manual](#6-exhaustive-component-by-component-technical-manual)
   * 6.1 `Header.tsx` — Global Bar, Client Switcher & Navigation
   * 6.2 `PointOfSale.tsx` — Billing POS Terminal & Thermal Receipt Engine
   * 6.3 `PrescriptionProcessing.tsx` — Clinical Queue & Gemini AI Digitizer
   * 6.4 `StockInventory.tsx` — FEFO Stock & Batch Control Center
   * 6.5 `ExpiryAlerts.tsx` — Batch Expiry Risk Triage & Write-Off Matrix
   * 6.6 `CustomerProfiles.tsx` — Patient Directory & WhatsApp Refill Gateway
   * 6.7 `AutomatedReordering.tsx` — Stock Reorder Engine & Supplier PO Generator
   * 6.8 `SalesReports.tsx` — Financial Intelligence & Revenue Analytics
   * 6.9 `InsuranceSchemes.tsx` — Third-Party Insurance & Co-Pay Manager
   * 6.10 `AdminPackages.tsx` — Multi-Tenant SaaS & Role Access Control Matrix
   * 6.11 `AICounselingModal.tsx` — Quantum RxAI Patient Counseling Assistant
   * 6.12 `BarcodeScannerModal.tsx` — Optical & Hardware Barcode Scanning Engine
   * 6.13 `PromoBannerView.tsx` — Interactive Showcase & System Poster
7. [AI Integration & Prompt Engineering Architecture](#7-ai-integration--prompt-engineering-architecture)
8. [Multi-Tenant SaaS Architecture & User Rights Matrix](#8-multi-tenant-saas-architecture--user-rights-matrix)
9. [Regulatory Compliance, NDA Registry & Safety Protocol](#9-regulatory-compliance-nda-registry--safety-protocol)
10. [Build Pipeline, Dev Configuration & Deployment Specs](#10-build-pipeline-dev-configuration--deployment-specs)

---

# 1. Executive Summary & System Vision

**ZenithRx** is a full-featured, enterprise-grade, multi-tenant **Pharmacy Management System (PMS)** designed specifically for retail pharmacies, hospital dispensaries, wholesale distributors, and pharmacy chains. 

The application unifies clinical dispensing workflows, FEFO (First-Expired, First-Out) inventory control, point-of-sale (POS) multi-channel billing, automated supplier reordering, patient chronic care tracking, third-party insurance claims processing, and multi-tenant SaaS management. Furthermore, ZenithRx embeds **Google Gemini AI** directly into clinical workflows to parse unstructured doctor notes into digital prescriptions and provide real-time patient counseling guidance.

### Primary Objectives
1. **Clinical Safety:** Eliminate medication errors via built-in allergy warnings, dosage safety validation, prescription requirement flags, and AI-powered contraindication checks.
2. **Stock Optimization & Loss Prevention:** Implement strict FEFO batch tracking to minimize expired drug write-offs and trigger automated supplier purchase orders before stockout occurs.
3. **Omnichannel Revenue Processing:** Facilitate instant checkout using Cash, Mobile Money (MTN/Airtel), M-Pesa, Card, Insurance co-pay splits, and digital WhatsApp payment invoice links.
4. **Regulatory & SaaS Management:** Enable pharmacy network administrators to register client branches, verify against the Uganda National Drug Authority (NDA) register, assign staff role access permissions, and manage tiered subscription billing in Ugandan Shillings (UGX).

---

# 2. System Architecture & Technology Stack

ZenithRx is built on a modern, fully decoupled single-page application (SPA) architecture backed by Vite and server-side ready Gemini AI integration.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  ZenithRx PMS Frontend                                 │
│                                                                                        │
│  ┌──────────────────────┐  ┌────────────────────────┐  ┌────────────────────────────┐  │
│  │   React 18 Engine    │  │ TypeScript Type Guard  │  │ Tailwind CSS Design System │  │
│  └──────────┬───────────┘  └───────────┬────────────┘  └─────────────┬──────────────┘  │
│             │                          │                             │                 │
│             └──────────────────────────┼─────────────────────────────┘                 │
│                                        │                                               │
│                                        ▼                                               │
│                            ┌───────────────────────┐                                   │
│                            │    App.tsx Router     │                                   │
│                            │ (Central State Hub)   │                                   │
│                            └───────────┬───────────┘                                   │
└────────────────────────────────────────┼───────────────────────────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────────────┐
│ Clinical & POS Suite │     │  Inventory & Admin   │     │      AI Services Core        │
│ ──────────────────── │     │  ─────────────────── │     │      ─────────────────       │
│ • PointOfSale        │     │ • StockInventory     │     │ • Google Gemini AI SDK       │
│ • PrescriptionProc.  │     │ • ExpiryAlerts       │     │ • Rx Digitizer Engine        │
│ • InsuranceSchemes   │     │ • AutoReordering     │     │ • Patient Counseling Assistant│
│ • CustomerProfiles   │     │ • SalesReports       │     │ • Optical Barcode Scanner    │
│                      │     │ • AdminPackages      │     │                              │
└──────────────────────┘     └──────────────────────┘     └──────────────────────────────┘
```

### Core Technologies
* **Framework:** React 18.3+ with TypeScript 5.0+
* **Build Engine:** Vite 5.x with ESBuild bundler
* **Styling Paradigm:** Tailwind CSS v3 with custom color tokens (`#0B1E36`, `#1E3A5F`, `#0284C7`, `#10B981`)
* **Icons:** Lucide React (`lucide-react`)
* **AI Engine:** Google GenAI SDK (`@google/genai`) accessing Gemini models
* **Media Handling:** Camera stream API (`navigator.mediaDevices.getUserMedia`) for barcode scanning
* **Print Subsystem:** Native CSS `@media print` directives tailored for 80mm thermal receipt roll printers

---

# 3. Global Directory & Modular Architecture

```
/
├── index.html                        # Main HTML5 entry point & title declaration
├── metadata.json                     # Application metadata and camera permissions
├── package.json                      # Dependencies and npm script commands
├── src/
│   ├── main.tsx                      # React DOM mounting entry point
│   ├── App.tsx                       # Main application shell, state hub & module tabs
│   ├── index.css                     # Global Tailwind directives & custom CSS scrollbars
│   ├── types.ts                      # Shared TypeScript interface definitions & enums
│   ├── data/
│   │   └── mockData.ts               # Pre-populated enterprise dataset (drugs, Rx, clients)
│   └── components/
│       ├── Header.tsx                # Navigation header, active client badge & quick controls
│       ├── PointOfSale.tsx           # Billing terminal, payment processing & receipt generator
│       ├── PrescriptionProcessing.tsx # Dispensing queue & Gemini AI prescription note parser
│       ├── StockInventory.tsx        # Stock master list, search, filters & price editor
│       ├── ExpiryAlerts.tsx          # FEFO expiry tracker, risk tiers & write-off logging
│       ├── CustomerProfiles.tsx      # Patient database, allergy safety & WhatsApp reminders
│       ├── AutomatedReordering.tsx   # Reorder triggers & supplier purchase order generator
│       ├── SalesReports.tsx          # Financial dashboard, revenue analytics & profit charts
│       ├── InsuranceSchemes.tsx      # Insurance provider claims & patient co-pay manager
│       ├── AdminPackages.tsx         # SaaS client registration, NDA database & staff rights
│       ├── AICounselingModal.tsx     # Gemini AI drug lookup & patient counseling assistant
│       ├── BarcodeScannerModal.tsx   # Optical camera & laser scanner simulation modal
│       └── PromoBannerView.tsx       # Interactive system showcase & feature poster view
```

---

# 4. Complete Data Model & Type Specification (`src/types.ts`)

ZenithRx maintains strict compile-time type safety across all operational modules. The data model is structured as follows:

### 4.1 Module Routing Type
```typescript
export type ModuleTab =
  | 'overview'
  | 'inventory'
  | 'prescriptions'
  | 'pos'
  | 'reordering'
  | 'expiry'
  | 'customers'
  | 'reports'
  | 'insurance'
  | 'admin';
```

### 4.2 Drug & Inventory Item (`DrugItem`)
Represents an individual pharmaceutical stock batch within the inventory database.
```typescript
export interface DrugItem {
  id: string;                  // Unique drug identifier (e.g. 'DRUG-001')
  brandName: string;           // Commercial trade name (e.g. 'Amoxil')
  genericName: string;         // Active pharmaceutical ingredient (API) (e.g. 'Amoxicillin')
  barcode: string;             // EAN-13 or UPC barcode string
  batchNumber: string;         // Manufacturer batch number (e.g. 'AMX-2025-09')
  category:                    // Therapeutic category classification
    | 'Antibiotics'
    | 'Analgesics'
    | 'Cardiovascular'
    | 'Diabetes'
    | 'Respiratory'
    | 'OTC & Supplements'
    | 'Gastrointestinal'
    | 'Dermatology';
  shelfLocation: string;       // Physical storage location (e.g. 'Shelf A-12')
  costPrice: number;           // Wholesale acquisition price in UGX
  sellingPrice: number;        // Retail dispensing price in UGX
  stockQty: number;            // Current available units in store
  reorderLevel: number;        // Minimum stock threshold triggering PO generation
  expiryDate: string;          // ISO Date YYYY-MM-DD
  manufacturer: string;        // Manufacturing pharmaceutical firm
  prescriptionRequired: boolean;// True if Rx is mandatory before POS dispense
  unit: string;                // Packaging unit (e.g. 'Capsules', 'Bottles', 'Tablets')
}
```

### 4.3 Clinical Prescription & Dispensing Queue (`Prescription`)
Tracks patient prescriptions submitted by medical doctors or parsed via AI.
```typescript
export interface PrescriptionItem {
  drugId: string;
  drugName: string;
  dosage: string;              // e.g. '500mg'
  frequency: string;           // e.g. 'TDS (3 times daily)'
  duration: string;            // e.g. '7 Days'
  quantity: number;            // Total units prescribed
  unitPrice: number;           // Price per unit in UGX
  dispensedQty: number;        // Units already handed over to patient
  status: 'Pending' | 'Dispensed';
}

export interface Prescription {
  id: string;
  rxNumber: string;            // Official Rx identifier (e.g. 'RX-2026-8801')
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientPhone: string;
  doctorName: string;          // Prescribing physician
  doctorLicence: string;       // Uganda Medical Practitioners Council License
  hospitalName: string;
  date: string;                // ISO Date YYYY-MM-DD
  status: 'Pending' | 'Dispensed' | 'Partially Dispensed' | 'Cancelled';
  medications: PrescriptionItem[];
  insuranceClaimId?: string;   // Optional linked claim ID
  notes?: string;              // Clinical instructions
  totalCost: number;           // Computed total prescription value in UGX
}
```

### 4.4 Patient & Chronic Care Record (`CustomerProfile`)
Stores demographic data, clinical history, and automated refill tracking.
```typescript
export interface CustomerProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  age: number;
  gender: 'Male' | 'Female';
  bloodGroup?: string;         // e.g. 'O+'
  allergies: string[];         // Active drug allergy warnings (e.g. ['Penicillin', 'Sulfa'])
  chronicConditions: string[]; // e.g. ['Hypertension', 'Type 2 Diabetes']
  loyaltyPoints: number;
  totalPurchasesUgx: number;
  lastVisit: string;
  activeRefills: Array<{
    medicationName: string;
    nextRefillDate: string;    // YYYY-MM-DD
    frequencyDays: number;
  }>;
}
```

### 4.5 Point of Sale Transaction (`POSTransaction`)
Encapsulates finalized checkout receipts.
```typescript
export interface POSItem {
  drugId: string;
  drugName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface POSTransaction {
  id: string;
  receiptNo: string;           // e.g. 'RCP-2026-90412'
  timestamp: string;           // Full date and time string
  items: POSItem[];
  subtotal: number;
  tax: number;                 // Value Added Tax (VAT) in UGX
  discount: number;
  totalPaid: number;
  paymentMethod: 'Cash' | 'Mobile Money' | 'M-Pesa' | 'Credit Card' | 'Insurance' | 'WhatsApp Invoice';
  customerName?: string;
  insuranceClaimId?: string;
  cashierName: string;
}
```

### 4.6 Multi-Tenant SaaS, Roles & Access Control
Defines the client branch subscription and user rights matrix.
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
  staffRegNo?: string;         // PSU Registration Number
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
  packageTier: 'Starter' | 'Professional' | 'Enterprise' | 'Custom Tailored';
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

---

# 5. Application Core & Reactive State Routing (`src/App.tsx`)

`src/App.tsx` acts as the central coordinator and top-level router for the entire application state.

```
                                  ┌──────────────────────────┐
                                  │      App.tsx Shell       │
                                  └────────────┬─────────────┘
                                               │
      ┌────────────────────────────────────────┼────────────────────────────────────────┐
      │                                        │                                        │
      ▼                                        ▼                                        ▼
┌─────────────────────────┐        ┌─────────────────────────┐        ┌─────────────────────────┐
│     Global State        │        │     Modals & AI Hub     │        │     Module View Switch   │
│ ─────────────────────── │        │ ─────────────────────── │        │ ─────────────────────── │
│ • drugs                 │        │ • showAiCounselingModal │        │ • overview (Poster)     │
│ • prescriptions         │        │ • showBarcodeModal      │        │ • pos                   │
│ • customers             │        │ • scannedBarcode        │        │ • inventory             │
│ • purchaseOrders        │        │                         │        │ • prescriptions         │
│ • posTransactions       │        │                         │        │ • expiry                │
│ • insuranceProviders    │        │                         │        │ • reordering            │
│ • clients               │        │                         │        │ • customers             │
│ • activeClient          │        │                         │        │ • reports               │
│ • activeTab             │        │                         │        │ • insurance             │
└─────────────────────────┘        └─────────────────────────┘        │ • admin                 │
                                                                      └─────────────────────────┘
```

### State Synchronization Methods
1. **`handleCompleteTransaction(tx)`:** 
   * Receives finalized transaction from `PointOfSale.tsx`.
   * Automatically iterates through items and decrements `stockQty` in the global `drugs` array.
   * Appends `tx` to `posTransactions`.
2. **`handleFulfillPrescription(rxId)`:**
   * Marks prescription as `'Dispensed'`.
   * Cross-references prescribed items with `drugs` state to deduct stock quantities based on FEFO batch order.
3. **`handleClientSwitch(client)`:**
   * Switches the active client account across the entire system.
   * Dynamically filters data views according to the selected branch and tier capabilities.

---

# 6. Exhaustive Component-by-Component Technical Manual

## 6.1 `Header.tsx` — Global Bar, Client Switcher & Navigation

### Technical Purpose
The `Header` component provides top-level navigation, displays active client context, presents quick metric badges, and allows switching between system modules.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ZenithRx  [PMS v3.2]   | Client: [Mulago Care Pharmacy ▼] | 📦 Low: 3 | ⚠️ Expired: 2 │ [View Poster] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [POS Terminal] [Stock Inventory] [Prescriptions] [Expiry Alerts] [Auto-Reorder] [Admin] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Props Interface
```typescript
interface HeaderProps {
  activeTab: ModuleTab;
  setActiveTab: (tab: ModuleTab) => void;
  showPromoFlyer: boolean;
  setShowPromoFlyer: (show: boolean) => void;
  clients: ClientSubscription[];
  activeClient: ClientSubscription;
  setActiveClient: (client: ClientSubscription) => void;
  lowStockCount: number;
  expiredCount: number;
  pendingRxCount: number;
  onOpenAiCounseling: () => void;
  onOpenBarcodeScanner: () => void;
}
```

### Key Capabilities
* **Active Branch Selector:** Dropdown allowing system administrators to switch seamlessly between registered client pharmacies.
* **Alert Badges:** Dynamic counters rendering red/amber pill indicators for low stock items, expired batches, and pending prescriptions.
* **Module Switcher:** Tab bar with active highlight styling (`bg-sky-600 text-white font-bold`).

---

## 6.2 `PointOfSale.tsx` — Billing POS Terminal & Thermal Receipt Engine

### Technical Purpose
The Point of Sale module is the primary revenue capture interface. It handles real-time drug searching, prescription loading, barcode scanning, discount/tax calculations, multi-channel payment processing, and receipt rendering.

```
┌─────────────────────────────────────────────┬──────────────────────────────────────────┐
│              POS Product Finder             │             Current POS Cart             │
├─────────────────────────────────────────────┼──────────────────────────────────────────┤
│ 🔍 Search name or scan barcode...            │ • Amoxil 500mg x 2          UGX 24,000   │
│ Category: [All Categories  ▼]               │ • Panadol Extra x 1         UGX  5,000   │
│                                             ├──────────────────────────────────────────┤
│ [Amoxil 500mg]       [Panadol Extra 500mg]  │ Subtotal:                   UGX 29,000   │
│ Qty: 140 | UGX 12k   Qty: 450 | UGX 5k      │ VAT (18%):                  UGX  5,220   │
│ Batch: AMX-2025      Batch: PND-2026       │ Total Payable:              UGX 34,220   │
│ [ + Add to Cart ]    [ + Add to Cart ]      ├──────────────────────────────────────────┤
│                                             │ Payment Method: [Mobile Money MTN/Airtel]│
│ [ ⚡ Load Pending Prescription ]            │ [ Complete & Print Thermal Receipt ]     │
└─────────────────────────────────────────────┴──────────────────────────────────────────┘
```

### Key Inner Workflows
1. **Prescription Pull-In:** Clicking "Load Pending Prescription" opens a modal listing active prescriptions. Selecting an Rx populates the cart automatically with exact prescribed medications and quantities.
2. **Dynamic Price & Tax Calculation:**
   $$\text{Subtotal} = \sum (\text{item.unitPrice} \times \text{item.quantity})$$
   $$\text{Tax} = \text{Subtotal} \times 0.18 \quad (\text{18\% VAT})$$
   $$\text{Grand Total} = \text{Subtotal} + \text{Tax} - \text{Discount}$$
3. **Thermal Receipt Subsystem:** Generates printable receipts structured specifically for 80mm roll printers. Uses CSS print styling (`@media print`) to hide non-receipt UI elements during print execution.

---

## 6.3 `PrescriptionProcessing.tsx` — Clinical Queue & Gemini AI Digitizer

### Technical Purpose
Handles clinical dispensing workflows, doctor NDA/license validation, and AI-powered prescription parsing from handwritten/unstructured doctor notes.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Quantum RxAI Prescription Note Digitizer                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Unstructured Doctor Notes / Transcription Text Input:                                 │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Rx: Dr. Musoke Robert (MPCN: UG-8812) - Mulago Hospital                             │ │
│ │ Patient: Sarah Namukasa (28 Yrs, Female). Give Amoxicillin 500mg tds for 7 days.   │ │
│ │ Also Paracetamol 1g qds prn for fever x 5 days.                                    │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ [ 🤖 Analyze Rx Notes with Quantum AI ]                                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Extracted Structured Output:                                                           │
│ • Doctor: Dr. Musoke Robert (License: UG-8812)                                        │
│ • Patient: Sarah Namukasa (Age: 28, Female)                                           │
│ • Med 1: Amoxicillin 500mg | TDS | 7 Days | Qty: 21 Capsules | Status: Matched        │
│ • Med 2: Paracetamol 1g | QDS | 5 Days | Qty: 20 Tablets  | Status: Matched            │
│ [ Save to Dispensing Queue ]                                                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Gemini AI Prompt Pattern
```typescript
const prompt = `
You are Quantum RxAI, an expert clinical pharmacy assistant. Analyze the following handwritten or transcribed doctor prescription note and extract structured JSON output.

Input Notes: "${prescriptionText}"

Return JSON matching this schema:
{
  "doctorName": "string",
  "doctorLicence": "string",
  "hospitalName": "string",
  "patientName": "string",
  "patientAge": number,
  "patientGender": "Male" | "Female",
  "patientPhone": "string",
  "medications": [
    {
      "drugName": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "quantity": number
    }
  ]
}
`;
```

---

## 6.4 `StockInventory.tsx` — FEFO Stock & Batch Control Center

### Technical Purpose
The primary inventory dashboard. Manages physical stock levels, therapeutic categories, batch numbers, shelf locations, wholesale cost vs retail selling prices, and prescription requirement toggles.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Inventory Master Database                                  [ + Add New Stock Batch ]   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Filter: [All Categories ▼] | Search: [ 🔍 Type drug name or barcode... ]              │
├──────────────┬──────────────┬────────────┬──────────┬───────────┬──────────────┬───────┤
│ Brand Name   │ Generic Name │ Category   │ Stock    │ Sell Price│ Batch Expiry │ Rx Req│
├──────────────┼──────────────┼────────────┼──────────┼───────────┼──────────────┼───────┤
│ Amoxil 500mg │ Amoxicillin  │Antibiotics │ 140 Caps │ UGX 12,000│ 2026-11-15   │ [Yes] │
│ Coartem 80   │ Artemether   │Antimalarial│  12 Pks  │ UGX 18,000│ 2025-08-10   │ [Yes] │
│ Panadol Extra│ Paracetamol  │Analgesics  │ 450 Tabs │ UGX  5,000│ 2027-04-20   │ [No]  │
└──────────────┴──────────────┴────────────┴──────────┴───────────┴──────────────┴───────┘
```

### Capabilities
* **In-Line Quantity Modifier:** Quick modal to record stock arrival or inventory adjustments.
* **Prescription Requirement Guard:** Allows store managers to toggle whether an item strictly requires a valid Rx before dispensing at POS.
* **Export Subsystem:** Generates CSV dumps of stock master records for accounting reconciliation.

---

## 6.5 `ExpiryAlerts.tsx` — Batch Expiry Risk Triage & Write-Off Matrix

### Technical Purpose
Monitors batch expiration dates using strict FEFO rules to prevent hazardous dispensing and minimize inventory write-off losses.

### Risk Categorization Logic
$$\text{Days Remaining} = \frac{\text{Expiry Date} - \text{Current Date}}{86400 \times 1000}$$

1. 🔴 **Expired ($\text{Days} \le 0$):** Quarantined automatically. Trigger option for "Record Official Write-off".
2. 🟡 **Critical Risk ($0 < \text{Days} \le 30$):** High priority. Triggers "Promotional Clearance Discount" or "Manufacturer Return Notice".
3. 🟠 **Warning Risk ($30 < \text{Days} \le 90$):** Medium priority. Marked with "FEFO Expedite Sales" tag in POS.

---

## 6.6 `CustomerProfiles.tsx` — Patient Directory & WhatsApp Refill Gateway

### Technical Purpose
Manages patient medical records, tracks chronic conditions and allergy warnings, and generates automated WhatsApp refill reminders.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Patient Profiles & Chronic Care                                [ + New Patient Profile]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Patient: Sarah Namukasa (Age: 28, Female) | Phone: +256-772-123456                     │
│ Chronic Conditions: [Hypertension] [Type 2 Diabetes]                                   │
│ Allergy Alerts: ⚠️ PENICILLIN / SULFA DRUGS                                             │
│ Active Refills: Metformin 500mg (Due in 3 days - 2026-08-06)                           │
│ [ 📱 Send WhatsApp Refill Notification ]                                                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### WhatsApp Gateway Link Generator
```typescript
const generateWhatsAppLink = (phone: string, patientName: string, medName: string, date: string) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = `Hello ${patientName}, this is ZenithRx Pharmacy. Your prescription refill for ${medName} is due on ${date}. Please reply to confirm pickup or home delivery!`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
```

---

## 6.7 `AutomatedReordering.tsx` — Stock Reorder Engine & Supplier PO Generator

### Technical Purpose
Automatically scans inventory for items where `stockQty <= reorderLevel`, computes suggested replenishment quantities, and generates formal Purchase Orders (POs) dispatched to suppliers.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Automated Supplier Purchase Orders                                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Trigger Condition: stockQty <= reorderLevel                                            │
├─────────────────┬──────────────┬─────────────┬────────────────┬────────────────────────┤
│ Item Name       │ Current Stock│ Reorder Min │ Suggested Order│ Supplier               │
├─────────────────┼──────────────┼─────────────┼────────────────┼────────────────────────┤
│ Ventolin Inhaler│ 4 Units      │ 10 Units    │ 25 Units       │ Joint Medical Store    │
│ Insulin Glargine│ 2 Vials      │ 5 Vials     │ 15 Vials       │ Abacus Pharma (U) Ltd  │
├─────────────────┴──────────────┴─────────────┴────────────────┴────────────────────────┤
│ [ 📑 Generate Consolidated Purchase Order ]                                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6.8 `SalesReports.tsx` — Financial Intelligence & Revenue Analytics

### Technical Purpose
Provides executive financial analytics including Revenue, Gross Profit, Cost of Goods Sold (COGS), Margin Percentage, payment channel distribution, and top-performing therapeutic categories.

### Key Financial Formulas
$$\text{Gross Profit} = \text{Total Revenue} - \text{Total COGS}$$
$$\text{Profit Margin \%} = \left( \frac{\text{Gross Profit}}{\text{Total Revenue}} \right) \times 100$$

---

## 6.9 `InsuranceSchemes.tsx` — Third-Party Insurance & Co-Pay Manager

### Technical Purpose
Manages third-party healthcare insurance coverage (e.g., Jubilee Health, AAR Insurance, UAP Old Mutual, Prudential) and processes patient co-pay splits at checkout.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Insurance Claims & Coverage Ratios                                                     │
├──────────────────────────┬─────────────────┬──────────────────┬────────────────────────┤
│ Insurance Provider       │ Coverage Ratio  │ Patient Co-Pay   │ Active Claims          │
├──────────────────────────┼─────────────────┼──────────────────┼────────────────────────┤
│ Jubilee Health Insurance │ 80% Insurer     │ 20% Patient      │ UGX 14,250,000 Pending │
│ AAR Health Services      │ 85% Insurer     │ 15% Patient      │ UGX  8,900,000 Approved│
└──────────────────────────┴─────────────────┴──────────────────┴────────────────────────┘
```

---

## 6.10 `AdminPackages.tsx` — Multi-Tenant SaaS & Role Access Control Matrix

### Technical Purpose
Acts as the central SaaS administration platform. Enables managing subscription client branches, verifying licenses against the Uganda NDA registry, and setting staff role permissions.

### 7-Role Granular Permission Matrix

| Role Rank | POS Billing | Inventory Control | Prescription Dispensing | Approve Reorders | Financial Reports | Insurance Claims | AI Counseling | Staff Mgmt |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Supervising Pharmacist** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Assistant Pharmacist** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Pharmacy Technician** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **POS Cashier / Dispenser**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Store & Inventory Manager**| ❌| ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Finance & Claims Officer**| ❌| ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Intern Pharmacist** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 6.11 `AICounselingModal.tsx` — Quantum RxAI Patient Counseling Assistant

### Technical Purpose
An interactive clinical counseling assistant powered by Google Gemini AI (`@google/genai`). Pharmacists query any drug or clinical presentation to receive structured guidance on indications, dosage schedules, side effects, contraindications, and patient counseling talking points.

---

## 6.12 `BarcodeScannerModal.tsx` — Optical & Hardware Barcode Scanning Engine

### Technical Purpose
Provides camera-based optical barcode scanning via WebRTC (`navigator.mediaDevices.getUserMedia`) as well as hardware laser scanner listener capabilities to match scanned codes with inventory drug items.

---

## 6.13 `PromoBannerView.tsx` — Interactive Showcase & System Poster

### Technical Purpose
Presents a visual feature poster showcasing ZenithRx PMS capabilities, NDA regulatory compliance, pricing plans, and system highlights.

---

# 7. AI Integration & Prompt Engineering Architecture

ZenithRx leverages the modern `@google/genai` TypeScript SDK server-side pattern using Gemini models.

### Gemini Initialization Guidelines
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
```

### Safety & Parsing Strategy
1. **Strict JSON Schemas:** All AI interactions request JSON output to eliminate markdown formatting errors during code execution.
2. **Fallback Protections:** If API keys are unconfigured or networks fail, the system degrades gracefully by providing structured manual entry forms.

---

# 8. Multi-Tenant SaaS Architecture & User Rights Matrix

ZenithRx supports isolated multi-tenancy. Multiple pharmacy branches (e.g. Mulago Branch, Arua Care Pharmacy, Jinja City Pharmacy) operate under their respective subscription tiers (`Starter`, `Professional`, `Enterprise`, `Custom Tailored`).

* **Starter Tier:** Up to 2 Staff Accounts, Basic POS & Stock Inventory.
* **Professional Tier:** Up to 5 Staff Accounts, FEFO Batch Tracking, Auto-Reordering, Expiry Alerts.
* **Enterprise Tier:** Unlimited Users, Insurance Claims Engine, Gemini AI Patient Counseling, Multi-Branch Analytics.

---

# 9. Regulatory Compliance, NDA Registry & Safety Protocol

ZenithRx integrates a pre-seeded register of Uganda National Drug Authority (NDA) licensed pharmacies and Pharmacy Society of Uganda (PSU) registered pharmacists.

* **License Verification:** Ensures client pharmacies possess valid NDA registration numbers (`NDA/LIC/PHA/...`).
* **Supervising Pharmacist Requirement:** Validates that every licensed pharmacy lists a qualified Supervising Pharmacist holding a valid PSU license.

---

# 10. Build Pipeline, Dev Configuration & Deployment Specs

### Port & Network Policy
* **Port Constraint:** Port `3000` is the single externally accessible port routed via reverse proxy.
* **Binding:** All dev and production servers bind to `0.0.0.0:3000`.

### `package.json` Configuration
```json
{
  "name": "zenithrx-pms",
  "private": true,
  "version": "3.2.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "lint": "tsc --noEmit",
    "preview": "vite preview --host 0.0.0.0 --port 3000"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "lucide-react": "^0.344.0",
    "motion": "^11.11.13",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}
```

### Verification Commands
To verify type safety and app compilation:
1. `npm run lint` — Validates TypeScript types across all 13 components without emitting assets.
2. `npm run build` — Bundles production SPA assets into the `/dist` directory.

---
*Documentation compiled for ZenithRx Pharmacy Management System v3.2.*
