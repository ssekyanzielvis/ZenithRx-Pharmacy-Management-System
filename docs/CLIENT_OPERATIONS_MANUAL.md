# ZenithRx Pharmacy Management System (PMS) — Enterprise Client Operations Manual & Full Capacity User Guide

> **Document Classification:** Official Masterclass Client User Manual & Operational Standard (SOP)
> **Target Audience:** Pharmacy Staff (Supervising Pharmacists, Dispensing Technicians, POS Cashiers, Store Managers, Finance & Claims Officers, Intern Pharmacists), Tech Company Onboarding Specialists, Support Engineers
> **System Version:** ZenithRx Enterprise v3.2
> **Regulatory Alignment:** Uganda National Drug Authority (NDA) & Pharmacy Society of Uganda (PSU)
> **Primary Jurisdiction & Currency:** East Africa (UGX — Ugandan Shillings) & Multi-Currency Ready

---

# Master Table of Contents

1. [System Vision &amp; Operational Foundations](#1-system-vision--operational-foundations)
2. [User Personas, Roles &amp; Healthcare Access Matrix](#2-user-personas-roles--healthcare-access-matrix)
3. [Interface Architecture &amp; Global Controls](#3-interface-architecture--global-controls)
4. [Clinical &amp; Patient Care Suite](#4-clinical--patient-care-suite)
   - [4.1 Prescription Processing &amp; Gemini AI Multimodal Digitizer](#41-prescription-processing--gemini-ai-multimodal-digitizer)
   - [4.2 Quantum RxAI Patient Counseling Assistant](#42-quantum-rxai-patient-counseling-assistant)
   - [4.3 Patient Directory &amp; WhatsApp Chronic Refill Gateway](#43-patient-directory--whatsapp-chronic-refill-gateway)
   - [4.4 FEFO Expiry Risk Triage &amp; Early Warning Matrix](#44-fefo-expiry-risk-triage--early-warning-matrix)
   - [4.5 Uganda NDA Licensed Premises &amp; Pharmacist Registry](#45-uganda-nda-licensed-premises--pharmacist-registry)
5. [Point of Sale (POS) &amp; Financial Operations Suite](#5-point-of-sale-pos--financial-operations-suite)
   - [5.1 Retail Counter POS Terminal &amp; Barcode Scanning](#51-retail-counter-pos-terminal--barcode-scanning)
   - [5.2 Multi-Channel Split Payment Orchestration](#52-multi-channel-split-payment-orchestration)
   - [5.3 Financial Ledger, Settlement Statements &amp; Supervisor Voids/Refunds](#53-financial-ledger-settlement-statements--supervisor-voidsrefunds)
   - [5.4 80mm Thermal Receipt Printing Subsystem](#54-80mm-thermal-receipt-printing-subsystem)
   - [5.5 Shift Closing &amp; Cash-Up Drawer Reconciliation](#55-shift-closing--cash-up-drawer-reconciliation)
6. [Inventory &amp; Supply Chain Management Suite](#6-inventory--supply-chain-management-suite)
   - [6.1 FEFO Stock Catalog &amp; Batch Management](#61-fefo-stock-catalog--batch-management)
   - [6.2 Automated Reordering Engine &amp; Supplier PO Generator](#62-automated-reordering-engine--supplier-po-generator)
   - [6.3 Stock Inward Intake, Adjustments &amp; Write-Off Auditing](#63-stock-inward-intake-adjustments--write-off-auditing)
7. [Insurance Schemes &amp; Third-Party Claims Suite](#7-insurance-schemes--third-party-claims-suite)
   - [7.1 Insurer Configuration &amp; Co-Pay Split Ratios](#71-insurer-configuration--co-pay-split-ratios)
   - [7.2 Claim Submission, Pre-Auth Verification &amp; Remittance Settlement](#72-claim-submission-pre-auth-verification--remittance-settlement)
8. [Analytics, Financial Intelligence &amp; Data Portability](#8-analytics-financial-intelligence--data-portability)
   - [8.1 Real-Time Revenue, Profit Margins &amp; COGS Intelligence](#81-real-time-revenue-profit-margins--cogs-intelligence)
   - [8.2 URA 18% VAT Tax Reports &amp; Top-Selling Formularies](#82-ura-18-vat-tax-reports--top-selling-formularies)
   - [8.3 Secure Async Data Export Engine &amp; Cloudflare R2 Archive](#83-secure-async-data-export-engine--cloudflare-r2-archive)
9. [Pharmacy Feedback Desk &amp; Offline Resilience](#9-pharmacy-feedback-desk--offline-resilience)
   - [9.1 In-App Pharmacy Support Ticket Desk](#91-in-app-pharmacy-support-ticket-desk)
   - [9.2 POS Graceful Degradation (Offline Mode)](#92-pos-graceful-degradation-offline-mode)
10. [Comprehensive Daily Operational Checklist for Pharmacy Staff](#10-comprehensive-daily-operational-checklist-for-pharmacy-staff)
11. [Role-Based Quick-Reference Action Guides (Cheat Sheets)](#11-role-based-quick-reference-guides-cheat-sheets)

---

# 1. System Vision & Operational Foundations

ZenithRx is an enterprise-grade Pharmacy Management System built to unify:

- **Clinical Safety:** Eliminating prescription errors with automatic allergy contraindication checks, drug-drug interaction alerts, and multimodal AI handwriting transcription.
- **First-Expired, First-Out (FEFO) Zero-Waste Control:** Preserving pharmacy capital by ensuring older drug batches are dispensed first and applying automated markdown discounts to near-expiry stock.
- **Omnichannel Revenue Processing:** Fast barcode checkout supporting Cash, MTN Mobile Money, Airtel Money, M-Pesa, Visa/Mastercard, Third-Party Insurance co-pays, and digital WhatsApp payment invoice links.
- **Patient Adherence & Chronic Care:** Automated WhatsApp refill reminders for hypertension, diabetes, and asthma patients.
- **Regulatory Rigor:** Direct integration with the **Uganda National Drug Authority (NDA)** and **Pharmacy Society of Uganda (PSU)** regulatory frameworks.

---

# 2. User Personas, Roles & Healthcare Access Matrix

Staff accounts operate under strict Role-Based Access Control (RBAC):

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            ZENITHRX HEALTHCARE ROLE MATRIX                               │
├──────────────────────────┬─────┬───────────┬──────────────┬────────┬────────┬──────┬─────┤
│ User Role Rank           │ POS │ Inventory │ Prescription │ PO App │ Report │ Ins. │ AI  │
├──────────────────────────┼─────┼───────────┼──────────────┼────────┼────────┼──────┼─────┤
│ Supervising Pharmacist   │  ✅ │     ✅    │      ✅      │   ✅   │   ✅   │  ✅  │  ✅ │
│ Assistant Pharmacist     │  ✅ │     ✅    │      ✅      │   ❌   │   ✅   │  ✅  │  ✅ │
│ Pharmacy Technician      │  ✅ │     ✅    │      ✅      │   ❌   │   ❌   │  ❌  │  ✅ │
│ POS Cashier / Dispenser  │  ✅ │     ❌    │      ❌      │   ❌   │   ❌   │  ❌  │  ❌ │
│ Store & Inventory Manager│  ❌ │     ✅    │      ❌      │   ✅   │   ✅   │  ❌  │  ❌ │
│ Finance & Claims Officer │  ❌ │     ❌    │      ❌      │   ❌   │   ✅   │  ✅  │  ❌ │
│ Intern Pharmacist        │  ✅ │     ✅    │  ✅ (Superv) │   ❌   │   ❌   │  ❌  │  ✅ │
└──────────────────────────┴─────┴───────────┴──────────────┴────────┴────────┴──────┴─────┘
```

---

# 3. Interface Architecture & Global Controls

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [ZenithRx Logo]   [Branch: Mulago Care Pharmacy ▼]   [Search...]   [AI] [Heartbeat]   │
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│ 📁 CLINICAL & CARE │                                                                    │
│ • Prescription Q  │                     ACTIVE WORKSPACE VIEW                          │
│ • Patient Profiles│                                                                    │
│ • Expiry Triage   │   (Dynamic Workspace: POS Terminal, Prescription Processing,       │
│ • NDA Registry    │    Stock Inventory Grid, Financial Ledger, Insurance Schemes,      │
│                   │    or Real-Time Revenue Analytics)                                 │
│ 💳 POS & BILLING  │                                                                    │
│ • Retail Counter  │                                                                    │
│ • Financial Ledger│                                                                    │
│                   │                                                                    │
│ 📦 INVENTORY      │                                                                    │
│ • Stock Inventory │                                                                    │
│ • Auto Reordering │                                                                    │
│                   │                                                                    │
│ 🛡️ COMPLIANCE     │                                                                    │
│ • Insurance Claims│                                                                    │
│ • Sales Reports   │                                                                    │
│ • Support Desk    │                                                                    │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

# 4. Clinical & Patient Care Suite

---

## 4.1 Prescription Processing & Gemini AI Multimodal Digitizer

**Navigation:** Sidebar ➔ `Clinical & Patient Care` ➔ `Prescription Queue` (`PrescriptionProcessing.tsx`)

### Purpose:

Manages doctor prescriptions entering the pharmacy, digitizes unstructured handwriting using **Google Gemini Multimodal AI**, detects clinical contraindications, and performs stock-aware FEFO dispensing.

```
                      PRESCRIPTION PROCESSING PIPELINE
                    
┌───────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 1. Upload Rx Document │ ───► │ 2. Gemini AI Parsing    │ ───► │ 3. Clinical Safety Check│
│ Photo, PDF, scan      │      │ Patient, Doctor, Regimen│      │ Allergies, Interactions │
└───────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                             │
                                                                             ▼
┌───────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 6. Thermal Label Print│ ◄─── │ 5. Complete Dispensing  │ ◄─── │ 4. Stock Availability   │
│ 80mm Patient Leaflet  │      │ Deduct FEFO Inventory   │      │ Check Shortages/Batch   │
└───────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### Complete Step-by-Step SOP:

#### Step 1: Uploading a Prescription Document

1. Click the blue **`+ New Prescription`** button.
2. Drag and drop the physical prescription scan/photo (PNG, JPG, PDF) into the upload dropzone.
3. Use the document inspection controls:
   - **Zoom In / Zoom Out:** Enlarge small physician handwriting.
   - **Rotate Image (90°):** Re-orient rotated smartphone camera captures.

#### Step 2: Executing Gemini AI Handwriting Parsing

1. Click **`✨ Extract Prescription with Gemini AI`**.
2. The AI reads the image and automatically populates the form:
   - **Patient Details:** Full Name, Age, Gender, Telephone.
   - **Prescriber Details:** Doctor Name, Medical Council License No., Hospital/Clinic Name.
   - **Medication Items:** Drug Name, Strength, Dosage (e.g., `1 tablet`), Frequency (e.g., `BD / Twice Daily`), Duration (e.g., `7 days`), Total Quantity (e.g., `14 tablets`).
3. If necessary, manually edit or add any additional lines.
4. Click **`Save to Clinical Queue`**.

#### Step 3: Automated Clinical Interaction & Allergy Safety Check

1. Select the prescription from the queue table.
2. Click **`🛡️ Run Clinical Interaction Check`**.
3. The system scans the patient's recorded allergies and cross-checks all prescribed items for dangerous drug-drug interactions:
   - 🔴 **CRITICAL ALERT:** High-risk contraindication (e.g., Penicillin allergy with Amoxicillin). Requires Supervising Pharmacist PIN to override.
   - 🟡 **MODERATE WARNING:** Advisory warning (e.g., Ciprofloxacin with Antacids).
   - 🟢 **VERIFIED SAFE:** No adverse interactions found.

#### Step 4: Stock-Aware Allocation & Dispensing

1. The system checks active branch stock for each line item.
2. If all items are in stock, click **`Dispense Full Prescription`**.
3. If stock is limited, click **`Partial Dispense`** (the system dispenses available units and tracks the remainder as owed).
4. Stock is deducted automatically from the oldest batch according to FEFO rules.

#### Step 5: Printing 80mm Thermal Dispensing Labels

1. Click **`🖨️ Print Dispensing Label`**.
2. An 80mm thermal label is generated containing:
   - Pharmacy Name & Contact Phone
   - Patient Name & Rx Reference Number
   - Medication Name & Quantity
   - Clear Directions (e.g., *"Take 1 tablet twice daily after food for 7 days"*)
   - Storage Precautions & Expiry Date
3. Affix the printed label to the medicine package.

---

## 4.2 Quantum RxAI Patient Counseling Assistant

**Navigation:** Top Navigation Header ➔ Click **`✨ AI Counseling`** (`AICounselingModal.tsx`)

### Purpose:

Generates instant, customized, clinical counseling sheets and patient advice leaflets.

### Step-by-Step Instructions:

1. Open the **Quantum RxAI Counseling** modal.
2. Select the **Medication** (e.g., `Augmentin 625mg Tablets`).
3. Enter the **Patient Name** and specific **Directions** (e.g., `1 tab TDS after meals for 5 days`).
4. Click **`Generate Personalized Counseling Leaflet`**.
5. The assistant outputs comprehensive patient guidance:
   - **Administration Instructions:** How to take with water, timing relative to meals.
   - **Dietary & Beverage Precautions:** Alcohol restrictions, dairy/calcium interactions.
   - **Missed Dose Protocol:** Exact steps if a dose is skipped.
   - **Side Effects to Monitor:** Mild symptoms vs red-flag emergency symptoms.
   - **Safe Storage Conditions:** Temperature and moisture guidelines.
6. Click **`🖨️ Print Leaflet`** or **`📱 Share via WhatsApp`** to send directly to the patient's smartphone.

---

## 4.3 Patient Directory & WhatsApp Chronic Refill Gateway

**Navigation:** Sidebar ➔ `Clinical & Patient Care` ➔ `Patient Directory` (`CustomerProfiles.tsx`)

### Purpose:

Maintains patient electronic health records (EHR), tracks chronic disease refill cadences (Hypertension, Diabetes, Asthma), manages customer loyalty points, and dispatches 1-click WhatsApp refill reminders.

```
                      WHATSAPP REFILL CADENCE ENGINE
                    
┌───────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 1. Chronic Profile    │ ───► │ 2. Automated Countdown  │ ───► │ 3. 1-Click WhatsApp Ref.│
│ Drug, Dosage, Days Sup│      │ Days remaining tracked  │      │ Pre-filled reminder sent│
└───────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### Complete Patient Directory SOP:

#### A. Creating a Patient Profile

1. Click **`+ Add Patient Profile`**.
2. Enter Demographics: Full Name, Phone Number, Date of Birth (system auto-computes exact age in years/months), Gender, Blood Group.
3. Record Clinical Tags:
   - **Allergies:** Type and save (e.g., `Penicillin`, `NSAIDs`, `Sulfa`).
   - **Chronic Conditions:** Select (e.g., `Hypertension`, `Type 2 Diabetes`, `Asthma`).
   - **Insurance Provider & Policy Number:** Link insurer for instant co-pay checkouts.
4. Click **`Create Patient Record`**.

#### B. Managing Chronic Medication Refill Cadences

1. In the patient profile, scroll to **Chronic Care Medications**.
2. Click **`+ Add Chronic Medication`**.
3. Enter Drug Name, Dosage, Frequency, and **Days Supply** (e.g., 30 days).
4. ZenithRx calculates the **Next Refill Due Date** and updates status:
   - 🔴 `Due Now` (Refill date reached or passed)
   - 🟡 `Upcoming` (Refill due in $< 5$ days)
   - 🟢 `Refilled` (Patient currently stocked)

#### C. Dispatching WhatsApp Refill Reminders

1. Filter the Patient Directory by **`Refills Due`**.
2. Click the green **`📱 Dispatch WhatsApp Refill Reminder`** button.
3. ZenithRx opens WhatsApp Web / Mobile with a personalized message pre-filled:
   > *"Hello Sarah Wanjiku, this is Mulago Care Pharmacy. Your refill for Amlodipine 5mg (30-day supply) is due for renewal on 22-Sep-2026. Reply to this message to reserve your pack or request home delivery. Thank you!"*
   >
4. Click Send in WhatsApp. The patient profile logs the dispatch timestamp automatically.

---

## 4.4 FEFO Expiry Risk Triage & Early Warning Matrix

**Navigation:** Sidebar ➔ `Clinical & Patient Care` ➔ `FEFO Expiry Alerts` (`ExpiryAlerts.tsx`)

### Purpose:

Triage medicine batches to prevent dispensing expired products and apply automated markdown discounts to sell near-expiry stock before write-offs occur.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FEFO RISK TRIAGE MATRIX                                 │
├─────────────────────┬──────────────────────────┬───────────────────────────────────────┤
│ 🔴 EXPIRED (0 Days) │ 🟠 CRITICAL (< 30 Days)  │ 🟡 WARNING (< 90 Days)                │
│ • Locked from POS   │ • 25% Auto-Markdown      │ • 15% Auto-Markdown                   │
│ • Move to Quarantine│ • Highlighted at Counter │ • Prioritize in FEFO Dispensing Queue │
│ • 1-Click Write-Off │ • Alert Prescribers      │ • Slow-Moving Stock Warning           │
└─────────────────────┴──────────────────────────┴───────────────────────────────────────┘
```

### Expiry SOP:

1. **Critical Stock (< 30 Days):**
   - The POS terminal automatically applies the global **FEFO Markdown Discount (e.g., 25% OFF)**.
   - Cashiers see a flashing amber badge on POS search results.
2. **Expired Stock (0 Days Remaining):**
   - The batch is **automatically locked** from retail checkout.
   - Click **`Isolate to Quarantine Holding Area`** to physically remove stock from shelves.
   - Click **`Execute Write-Off Disposal`** to record the financial loss with an audit note.

---

## 4.5 Uganda NDA Licensed Premises & Pharmacist Registry

**Navigation:** Sidebar ➔ `Clinical & Patient Care` ➔ `NDA Registry` (`NdaRegistryViewer.tsx`)

### Purpose:

Instant lookup tool to verify supplier licenses, collaborating branches, and registered supervising pharmacists against official **Uganda National Drug Authority (NDA)** and **Pharmacy Society of Uganda (PSU)** records.

---

# 5. Point of Sale (POS) & Financial Operations Suite

---

## 5.1 Retail Counter POS Terminal & Barcode Scanning

**Navigation:** Sidebar ➔ `POS & Financial Operations` ➔ `Retail Counter (POS)` (`PointOfSale.tsx`)

### Purpose:

Fast-paced retail checkout terminal for barcode scanning, OTC sales, prescription billing, and thermal receipt printing.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ZENITHRX POS TERMINAL                                  │
├──────────────────────────────────────────────────────┬─────────────────────────────────┤
│ 🔍 Search Drug Catalog / Scan Barcode                │ 🛒 ACTIVE TRANSACTION CART      │
│ ┌──────────────────────────────────────────────────┐ │ • Augmentin 625mg  x2  UGX 36,000│
│ │ [ Augmentin 625mg ] [ In Stock: 84 ] [ UGX 18,000│ │ • Panadol Extra    x1  UGX  3,500│
│ │ [ Paracetamol 500mg] [ In Stock: 420] [ UGX 1,000│ │ • Cetirizine 10mg  x1  UGX  8,000│
│ └──────────────────────────────────────────────────┘ ├─────────────────────────────────┤
│ 📷 [Open Optical Barcode Scanner]                    │ Subtotal:             UGX 47,500│
│                                                      │ VAT (18% Included):   UGX  7,245│
│ 👤 Customer: [ Sarah Wanjiku (+256 701 555 888)    ] │ Discount:             UGX      0│
│ ⭐ Loyalty Points: [ 150 Pts Available (Redeem)   ] │ TOTAL PAYABLE:        UGX 47,500│
├──────────────────────────────────────────────────────┴─────────────────────────────────┤
│ 💳 [ Launch Multi-Channel Split Payment Orchestrator ]                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Checkout SOP:

#### Step 1: Adding Items to Cart

- **Search:** Type brand name, generic name, category, or batch.
- **Optical Camera Scanner (`BarcodeScannerModal.tsx`):** Click **`📷 Scan Barcode`**. Hold box to camera; item is added instantly with audio confirmation.
- **USB Hardware Barcode Gun:** Scan packaging directly at any time.

#### Step 2: Prescriptions & Loyalty Redemption

- If a drug is flagged **`Prescription Required`**, verify prescription before checkout.
- If customer has loyalty points, toggle **`Redeem Loyalty Points`** to apply a direct discount.

#### Step 3: Opening Payment Orchestration

- Click **`Launch Multi-Channel Payment Orchestrator`** to select payment methods or split the bill.

---

## 5.2 Multi-Channel Split Payment Orchestration

**Access:** POS Checkout ➔ `PaymentOrchestratorModal.tsx`

### Purpose:

Allows complex payment splitting across multiple channels in a single transaction (e.g., part Cash, part MTN MoMo, part Insurance Co-pay).

```
                      SPLIT PAYMENT ORCHESTRATION
                    
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOTAL BILL: UGX 100,000 | ALLOCATED: UGX 100,000 | REMAINING DUE: UGX 0 [BALANCED]    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Channel 1: [ CASH            ] -> Amount: UGX 30,000 | Register Drawer 01              │
│ Channel 2: [ MTN_MOMO        ] -> Amount: UGX 40,000 | Phone: +256 772 123 456 (Push)  │
│ Channel 3: [ INSURANCE_COPAY ] -> Amount: UGX 30,000 | Jubilee Insurance (Pre-Auth)    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ + Add Payment Channel ]             [ ⚡ Process Split Payment & Print Receipt ]     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Supported Payment Channels:

1. **Cash Drawer (`CASH`):** Enter cash handed; system computes exact change due.
2. **MTN Mobile Money (`MTN_MOMO`):** Triggers direct USSD push prompt to customer phone; captures provider reference.
3. **Airtel Money (`AIRTEL_MONEY`):** Triggers Airtel Money push prompt.
4. **Card / Visa / Mastercard (`CARD_VISA_MC`):** Counter POS terminal swipe; captures authorization code.
5. **Insurance Co-Pay (`INSURANCE_COPAY`):** Deducts patient co-pay and creates claim for balance.
6. **Loyalty Voucher (`LOYALTY_VOUCHER`):** Converts patient loyalty points to UGX discount.
7. **WhatsApp Invoice:** Dispatches remote payment link for home delivery orders.

---

## 5.3 Financial Ledger, Settlement Statements & Supervisor Voids/Refunds

**Navigation:** Sidebar ➔ `POS & Financial Operations` ➔ `Financial Ledger` (`FinancialReconciliationView.tsx`)

### Purpose:

Complete audit view of all transactions, digital settlement statements, discrepancy detection, and supervisor PIN-protected refunds/voids.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         FINANCIAL RECONCILIATION & LEDGER                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 📑 Tabs: [ 1. Payment Ledger ] [ 2. Settlement Statements ] [ 3. Discrepancies (0) ]   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Filters: [ Channel: ALL ▼ ] [ Status: ALL ▼ ] [ Search Receipt / TX ID...            ] │
│                                                                                        │
│ Receipt No.   | Customer      | Channel    | Amount UGX | Status    | Actions          │
│ REC-2026-0091 | Sarah Wanjiku | MTN MoMo   |     47,500 | CAPTURED  | [Refund / Void]  │
│ REC-2026-0090 | Walk-in       | Cash       |     12,000 | CAPTURED  | [Refund / Void]  │
│ REC-2026-0089 | John Baptist  | Card (Visa)|    115,000 | CAPTURED  | [Refund / Void]  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Supervisor Refund / Void SOP:

1. Locate the transaction in the ledger.
2. Click **`Refund / Void`**.
3. Select Action Type: `REFUND` (Customer returned goods) or `VOID` (Entry error).
4. Enter mandatory **Supervisor Security PIN**.
5. Enter the **Audit Reason** (e.g., *"Customer purchased wrong strength; returned intact"*).
6. Click **`Authorize & Execute`**. The transaction is reversed, financial ledgers update, and stock is returned to inventory.

### Settlement Statement Reconciliation:

- Navigate to **Settlement Statements** to reconcile daily payouts from MTN, Airtel, and Card processors against recorded POS sales, including automated processing fee deduction tracking.

---

## 5.4 80mm Thermal Receipt Printing Subsystem

Every completed transaction generates an official 80mm thermal receipt formatted with:

- Pharmacy Name, NDA Premise License, Address, Phone.
- Sequential Receipt Number & Timestamp.
- Itemized Medication Names, Strengths, Quantities, Unit Prices.
- URA 18% VAT Breakdown & Payment Method Breakdown.
- Cashier Name & Official Tax QR Verification Code.

---

## 5.5 Shift Closing & Cash-Up Drawer Reconciliation

**Navigation:** Sidebar ➔ `POS & Financial Operations` ➔ Click **`Cash Up / Close Shift`** (`CashUpModal.tsx`)

### Purpose:

Reconciles physical cash in the drawer against the electronic ledger at the end of every cashier shift.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             END-OF-SHIFT CASH-UP DRAWER                                │
├──────────────────────────────────────┬─────────────────────────────────────────────────┤
│ 💵 PHYSICAL CASH DENOMINATION COUNT  │ 📊 SYSTEM LEDGER SUMMARY                        │
│ • UGX 50,000 Notes:  [ 24 ] = 1,200K │ • Total Cash Sales:             UGX 1,585,000   │
│ • UGX 20,000 Notes:  [ 15 ] =   300K │ • Total MTN MoMo Sales:         UGX   890,000   │
│ • UGX 10,000 Notes:  [  8 ] =    80K │ • Total Airtel Money Sales:     UGX   420,000   │
│ • UGX  5,000 Notes:  [  1 ] =     5K │ • Total Card Sales:             UGX   350,000   │
│ • Coins (1K, 500, 200, 100):     0K  │ • Total Insurance Co-Pays:      UGX   120,000   │
│ ──────────────────────────────────── ├─────────────────────────────────────────────────┤
│ TOTAL PHYSICAL CASH:   UGX 1,585,000 │ TOTAL EXPECTED CASH:            UGX 1,585,000   │
│                                      │ DRAWER VARIANCE:                UGX         0   │
│                                      │ STATUS:                         🟢 PERFECT MATCH │
├──────────────────────────────────────┴─────────────────────────────────────────────────┤
│ 📝 Shift Notes: [ "Morning shift closed with zero discrepancy. Handover to John." ]   │
│ 🖨️ [Print Official Shift Report]    🔒 [Lock Drawer & Submit Shift Close]             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Cash-Up SOP:

1. Count physical banknotes (50K, 20K, 10K, 5K) and coins; enter counts into denomination fields.
2. Review the **Drawer Variance**:
   - `UGX 0 (Perfect Match):` Physical drawer matches ledger.
   - `Discrepancy:` Investigate unrecorded expenses or change errors before sign-off.
3. Click **`Print Official Shift Report`** and submit shift lock.

---

# 6. Inventory & Supply Chain Management Suite

---

## 6.1 FEFO Stock Catalog & Batch Management

**Navigation:** Sidebar ➔ `Inventory & Supply Chain` ➔ `Stock Inventory` (`StockInventory.tsx`)

### Purpose:

Central catalog of all medications, batch numbers, shelf locations, unit acquisition costs, selling prices, and real-time stock balances.

### Adding a Medication:

1. Click **`+ Add New Medication`**.
2. Enter Identity: Brand Name, Generic Name, Category (`Antibiotics`, `Analgesics`, `Cardiovascular`, `Diabetes`, `Respiratory`, `OTC`, `Gastrointestinal`, `Dermatology`), Dosage Form (`Tablets`, `Capsules`, `Vial`, etc.), Barcode, Shelf Location Code.
3. Enter Initial Batch: Batch Number, Expiry Date, Cost Price, Selling Price (system auto-computes Profit Margin %), Initial Quantity, Reorder Trigger Level, Prescription Required (`Yes`/`No`).
4. Click **`Save Medicine to Inventory`**.

---

## 6.2 Automated Reordering Engine & Supplier PO Generator

**Navigation:** Sidebar ➔ `Inventory & Supply Chain` ➔ `Automated Reordering` (`AutomatedReordering.tsx`)

### Purpose:

Monitors inventory consumption velocity and generates automated Purchase Orders (POs) before stockouts occur.

```
                      PURCHASE ORDER (PO) LIFECYCLE
                    
┌───────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 1. Stockout Trigger   │ ───► │ 2. Auto-Generate PO     │ ───► │ 3. Dispatch to Supplier │
│ Stock reaches reorder │      │ Optimal order quantity  │      │ Email PDF / WhatsApp    │
└───────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                             │
                                                                             ▼
┌───────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 6. Stock Auto-Updated │ ◄─── │ 5. Batch Quality Check  │ ◄─── │ 4. Receive Delivery     │
│ Available at POS      │      │ Verify expiry & seal    │      │ Match against PO items  │
└───────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### Reordering SOP:

1. Review items flagged under **`Stockout Risk Alert`**.
2. Click **`✨ Generate Draft Purchase Order`**.
3. Select Supplier (e.g., `Abacus Pharma Africa`, `Elys Chemical Industries`, `Medreich`).
4. Review suggested quantities; click **`Export & Send PO to Supplier`** (generates official PO PDF).

---

## 6.3 Stock Inward Intake, Adjustments & Write-Off Auditing

### Fulfilling a Supplier Delivery:

1. When supplier delivers boxes, open the PO under **Active Purchase Orders**.
2. Click **`Receive & Verify Stock`**.
3. Verify box quantities, check manufactured batch numbers and expiry dates.
4. Click **`Confirm Stock Inward`**.
5. Stock counts increase, new FEFO batches are activated, and the PO transitions to `Fulfilled`.

### Manual Stock Adjustments:

- Click **`Adjust Stock`** on any item to log variances with mandatory audit reasons (`Stocktake Variance`, `Damaged Vial`, `Expired Quarantine`, `Supplier Return`).

---

# 7. Insurance Schemes & Third-Party Claims Suite

---

## 7.1 Insurer Configuration & Co-Pay Split Ratios

**Navigation:** Sidebar ➔ `Compliance & Governance` ➔ `Insurance Schemes` (`InsuranceSchemes.tsx`)

### Pre-Configured Providers:

- **AAR Insurance Uganda**
- **Jubilee Health Insurance**
- **UAP Old Mutual Insurance**
- **Prudential Uganda**
- **ICEA LION General Insurance**
- **Sanlam Health**

### Configuring Co-Pay Ratios:

- Set standard coverage ratios (e.g., `0.80` for 80% insurer coverage / 20% patient co-pay).

---

## 7.2 Claim Submission, Pre-Auth Verification & Remittance Settlement

**Navigation:** `Insurance Schemes` ➔ `Claims Processing Matrix`

### Insurance Dispensing SOP:

1. Verify patient's insurance membership card.
2. Enter the approved **Pre-Authorization Code** (e.g., `AUTH-JUB-2026-9912`).
3. Dispense medications:
   - Patient pays 20% co-pay at counter.
   - Claim for 80% is queued under status `Submitted`.
4. At month-end, click **`Export Batch Claims (CSV/PDF)`** for insurer submission.
5. When remittance advice is received from the insurer, click **`Reconcile Claim`**, record payment reference, and settle claim to `Reconciled`.

---

# 8. Analytics, Financial Intelligence & Data Portability

---

## 8.1 Real-Time Revenue, Profit Margins & COGS Intelligence

**Navigation:** Sidebar ➔ `Compliance & Governance` ➔ `Sales Reports` (`SalesReports.tsx`)

### Monitored Financial KPIs:

- **Total Gross Revenue (UGX):** Real-time gross sales across all payment methods.
- **Cost of Goods Sold (COGS):** Total drug acquisition costs for dispensed items.
- **Gross Profit Margin (%):** Realized margin (e.g., `34.8%`).
- **Average Basket Value:** Average spend per patient visit.

---

## 8.2 URA 18% VAT Tax Reports & Top-Selling Formularies

- **URA VAT Breakdown Table:** Gross revenue, VAT-exempt medicines, standard rated 18% VAT collected, and net tax liability.
- **Top 10 Selling Medications:** Ranked by volume and revenue for shelf space optimization.
- **Hourly Sales Traffic Heatmap:** Identifies peak rush hours (`11:00 AM - 1:00 PM` and `5:30 PM - 7:30 PM`) for optimal staff shift scheduling.

---

## 8.3 Secure Async Data Export Engine & Cloudflare R2 Archive

**Access:** Click **`Export Archive`** on any table (`ExportArchiveModal.tsx`)

### Features:

- Queue async export jobs for large historical datasets.
- Download verified, encrypted files from Cloudflare R2 storage via signed URLs.
- Automated patient PII masking ensures strict regulatory compliance.

---

# 9. Pharmacy Feedback Desk & Offline Resilience

---

## 9.1 In-App Pharmacy Support Ticket Desk

**Navigation:** Top Header ➔ Click **`MessageSquare` (Feedback)** (`PharmacyFeedbackModal.tsx`)

### How to Contact the Tech Company:

1. Click the **Send Feedback / Support** button.
2. Select Category: `Bug Report`, `Feature Request`, `Billing Inquiry`, `NDA Compliance`, `Performance`.
3. Select Urgency: `Normal`, `High Priority`, or `Critical`.
4. Enter Subject and Message; click **`Submit Support Ticket`**.
5. When the Tech Company System Admin replies, an instant notification badge appears on your screen.

---

## 9.2 POS Graceful Degradation (Offline Mode)

ZenithRx is engineered to survive power and internet cuts:

- If internet connection drops, the system displays a yellow **`Offline Mode Active`** indicator.
- Cashiers can continue barcode scanning, ringing up sales, and printing receipts.
- Transactions are stored securely in browser **IndexedDB local storage**.
- When internet returns, the background worker automatically syncs offline sales with the central server and decrements FEFO inventory.

---

# 10. Comprehensive Daily Operational Checklist for Pharmacy Staff

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DAILY PHARMACY OPERATIONAL CHECKLIST                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ☀️ MORNING OPENING ROUTINE (08:00 - 08:30)                                            │
│ [ ] Log in with individual staff credentials (never share supervisor passwords).       │
│ [ ] Check System Health heartbeat in the top header.                                   │
│ [ ] Review FEFO Expiry Alerts; quarantine any stock that expired overnight.            │
│ [ ] Check Automated Reordering tab for low-stock purchase order alerts.               │
│ [ ] Open cash drawer, perform initial float count, and begin POS morning session.      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ⛅ MID-DAY CLINICAL & DISPENSING OPERATIONS (08:30 - 20:30)                            │
│ [ ] Process incoming prescriptions through Gemini AI digitizer & interaction check.    │
│ [ ] Print 80mm thermal dispensing instruction labels for all dispensed medicines.      │
│ [ ] Use Quantum RxAI to generate counseling leaflets for complex prescriptions.        │
│ [ ] Dispatch WhatsApp refill reminders to chronic care patients whose refills are due. │
│ [ ] Receive supplier deliveries against open Purchase Orders and verify batch numbers. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 🌙 EVENING SHIFT CLOSE & CASH-UP ROUTINE (20:30 - 21:00)                              │
│ [ ] Complete final prescription queue items.                                           │
│ [ ] Open Cash Up Modal; count physical cash denominations.                             │
│ [ ] Reconcile Mobile Money (MTN/Airtel) and Card ledger totals against physical slips. │
│ [ ] Print and sign official End-of-Shift Cash-Up Report.                               │
│ [ ] Log out of active terminal.                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 11. Role-Based Quick-Reference Action Guides (Cheat Sheets)

### 👨‍⚕️ 1. Supervising Pharmacist Cheat Sheet

- **Clinical Sign-Off:** Review orange/red contraindication alerts in `Prescription Processing` before authorizing narcotic dispensing.
- **AI Counseling:** Use `AICounselingModal` for pediatric, geriatric, or polypharmacy patients.
- **Stock Write-Offs:** Authorize batch write-offs in `Expiry Alerts` for damaged or expired items.
- **Supplier POs:** Review and digitally sign off on draft purchase orders in `Automated Reordering`.

### 👩‍💼 2. POS Cashier / Dispenser Cheat Sheet

- **Scan Barcode:** Point camera scanner or use handheld USB scanner at medicine barcode.
- **Prescription Check:** Confirm doctor prescription is attached for Schedule 2 and 3 medications.
- **Mobile Money Payments:** Verify MTN/Airtel SMS reference on customer's phone before completing sale.
- **Thermal Receipts:** Hand 80mm thermal receipt to every patient; ensure tax QR code is legible.
- **Shift Handover:** Always count cash drawer denominations in `Cash Up` before leaving counter.

### 📦 3. Store & Inventory Manager Cheat Sheet

- **Receiving Deliveries:** Match physical invoice boxes against PO items in `Automated Reordering`.
- **Batch & Expiry Dates:** Always verify manufactured batch number and expiry date match packaging.
- **FEFO Placement:** Place newer stock behind older stock on shelves (First-Expired, First-Out).
- **Weekly Expiry Triage:** Check `Expiry Alerts` every Monday morning; apply 25% markdowns to 30-day stock.

### 💼 4. Finance & Insurance Claims Officer Cheat Sheet

- **Pre-Auth Codes:** Ensure pre-authorization code is entered for all insurance co-pay sales.
- **Claims Export:** Export weekly claims batches in `Insurance Schemes` to submit to HMOs.
- **Remittance Matching:** Reconcile paid remittances against pending claims in the claims matrix.
- **VAT Tax Reporting:** Download monthly URA 18% VAT summary from `Sales Reports`.

---

> **ZenithRx Operations Guarantee:**
> *With full mastery of ZenithRx, your pharmacy operates with maximum clinical safety, zero preventable stock loss, accelerated cash flow, and exceptional patient loyalty.*
