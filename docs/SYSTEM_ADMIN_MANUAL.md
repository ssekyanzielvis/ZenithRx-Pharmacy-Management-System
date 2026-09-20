# ZenithRx Pharmacy Management System (PMS) — Enterprise System Administrator Operating Manual & Training Guide

> **Document Classification:** Internal Technical Documentation / Operational SOP
> **Target Audience:** Tech Company Engineers, DevOps, System Administrators, Super Users, Support Leads
> **System Version:** ZenithRx Enterprise v3.2
> **Regulatory Alignment:** Uganda National Drug Authority (NDA) & Pharmacy Society of Uganda (PSU)
> **Primary Jurisdiction & Currency:** East Africa (UGX — Ugandan Shillings) & Multi-Currency Ready

---

# Table of Contents

1. [Executive Overview &amp; Governance Architecture](#1-executive-overview--governance-architecture)
2. [Authentication, Access Tiers &amp; Security Posture](#2-authentication-access-tiers--security-posture)
3. [Global Navigation &amp; The Admin Command Center](#3-global-navigation--the-admin-command-center)
4. [Standard Operating Procedures (SOPs) — Core Admin Modules](#4-standard-operating-procedures-sops--core-admin-modules)
   - [4.1 Executive Overview &amp; Health Telemetry](#41-executive-overview--health-telemetry)
   - [4.2 Global Policy Engine Configuration](#42-global-policy-engine-configuration)
   - [4.3 Delegated Collaborator Management &amp; Access Scopes](#43-delegated-collaborator-management--access-scopes)
   - [4.4 Dual-Control (4-Eyes Principle) Approval Queue](#44-dual-control-4-eyes-principle-approval-queue)
   - [4.5 Security Incident Management &amp; Threat Mitigation](#45-security-incident-management--threat-mitigation)
   - [4.6 Tenant Feature Matrix &amp; Entitlement Management](#46-tenant-feature-matrix--entitlement-management)
   - [4.7 Branch Staff &amp; User Account Provisioning](#47-branch-staff--user-account-provisioning)
   - [4.8 Package Tiers, Billing &amp; Promo Governance](#48-package-tiers-billing--promo-governance)
   - [4.9 Pharmacy Tenant Onboarding &amp; NDA License Verification](#49-pharmacy-tenant-onboarding--nda-license-verification)
   - [4.10 Multi-Tenant SaaS Operations &amp; Multi-Branch Chains](#410-multi-tenant-saas-operations--multi-branch-chains)
   - [4.11 Pharmacy Feedback &amp; Support Ticket Desk](#411-pharmacy-feedback--support-ticket-desk)
5. [System Reliability, Disaster Recovery &amp; Performance Tuning](#5-system-reliability-disaster-recovery--performance-tuning)
   - [5.1 Real-Time Infrastructure Telemetry](#51-real-time-infrastructure-telemetry)
   - [5.2 Automated &amp; Manual Cloud Backups (PITR)](#52-automated--manual-cloud-backups-pitr)
   - [5.3 Emergency Incident Runbooks](#53-emergency-incident-runbooks)
   - [5.4 POS Graceful Degradation (Offline Mode)](#54-pos-graceful-degradation-offline-mode)
   - [5.5 Redis Queue &amp; Cache Control Panel](#55-redis-queue--cache-control-panel)
6. [Audit Logging, Compliance &amp; Data Portability](#6-audit-logging-compliance--data-portability)
   - [6.1 Immutable Audit Trail Explorer](#61-immutable-audit-trail-explorer)
   - [6.2 Policy-Compliant Data Exports &amp; PII Masking](#62-policy-compliant-data-exports--pii-masking)
7. [Daily, Weekly &amp; Monthly Admin Checklists](#7-daily-weekly--monthly-admin-checklists)
8. [Troubleshooting &amp; Emergency Escalation Matrix](#8-troubleshooting--emergency-escalation-matrix)

---

# 1. Executive Overview & Governance Architecture

ZenithRx is an enterprise-grade, multi-tenant pharmacy management system designed for pharmacies ranging from single-counter community drugstores to multi-branch regional hospital networks.

As a **System Administrator (Super Admin)**, your role is to oversee the entire platform ecosystem:

- **Ensuring Tenancy Isolation:** Guaranteeing that patient records, prescriptions, inventory batches, and financial transactions from one pharmacy client are strictly segregated from other tenants.
- **Enforcing Regulatory Compliance:** Validating that onboarded pharmacies possess verifiable Uganda National Drug Authority (NDA) licenses and designated Pharmacy Society of Uganda (PSU) registered supervising pharmacists.
- **Safeguarding System Integrity:** Applying global policy rules (FEFO discount logic, tax thresholds, opiate dispensing limits, AI safety filters) across all client operations.
- **Preserving Business Continuity:** Managing real-time disaster recovery, Redis queues, background worker jobs, offline POS failover, and automated backups.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ZENITHRX GOVERNANCE PYRAMID                              │
│                                                                                        │
│                      ┌────────────────────────────────────────┐                        │
│                      │       SUPER ADMINISTRATOR (YOU)        │                        │
│                      │ Global Policies, Dual Control, Tenants │                        │
│                      └───────────────────┬────────────────────┘                        │
│                                          │                                             │
│                 ┌────────────────────────┴────────────────────────┐                    │
│                 ▼                                                 ▼                    │
│  ┌───────────────────────────────┐               ┌──────────────────────────────────┐  │
│  │     DELEGATED COLLABORATOR    │               │       PHARMACY TENANT ADMIN      │  │
│  │ Scoped Domain (Finance, Sec.) │               │ Branch Owner / Chief Pharmacist  │  │
│  └───────────────────────────────┘               └────────────────┬─────────────────┘  │
│                                                                   │                    │
│                                          ┌────────────────────────┴─────────────────┐  │
│                                          ▼                                          ▼  │
│                          ┌───────────────────────────────┐ ┌────────────────────────┐  │
│                          │     SUPERVISING PHARMACIST    │ │ POS CASHIERS / CLERKS  │  │
│                          │ Clinical Approvals & Dispense │ │ Retail Sales & Billing │  │
│                          └───────────────────────────────┘ └────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Authentication, Access Tiers & Security Posture

### 2.1 Administrator Roles & Hierarchies

1. **Super Admin (Root System Administrator):**
   - Has unrestricted read/write access to the entire platform, all tenant configurations, and global policies.
   - Can approve **Dual-Control 4-Eyes** requests and elevate collaborator permissions.
   - Default master persona: `Dr. Arthur Ssenabulya` / Platform Engineering Lead.
2. **Delegated Collaborator / Domain Admin:**
   - Temporary or domain-scoped administrators (e.g., `FINANCE`, `INVENTORY`, `CLINICAL_OVERSIGHT`, `SECURITY_COMPLIANCE`).
   - Bound to explicit expiration windows (e.g., 30, 60, or 90 days) with instant session kill switches.
3. **Tenant Administrator (Client Branch Owner):**
   - Manages internal branch staff, views branch financial ledgers, and configures local POS stations within their subscribed package limits.

### 2.2 Security Principles

- **Separation of Duties:** High-impact destructive actions (e.g., data purging, tenant suspension, global price overrides) cannot be executed unilaterally; they require 4-Eyes dual signoff.
- **Zero-Trust Audit Logging:** Every admin click, policy update, collaborator invite, or token revocation creates an append-only, SHA-256 traceable audit entry with timestamp, user ID, IP address, and tenant context.
- **Session Lifecycles & Forced Logouts:** Admin sessions expire after inactivity. Super Admins can invalidate all active sessions for any collaborator or compromised staff account with a single click.

---

# 3. Global Navigation & The Admin Command Center

When logged in with System Administrator privileges, the platform presents a dedicated **Admin Governance & Controls** navigation panel in the primary sidebar, alongside the standard pharmacy clinical modules.

### Admin Sidebar Navigation Map:

| Menu Item                             | System Tab Key       | Operational Scope                                                              |
| :------------------------------------ | :------------------- | :----------------------------------------------------------------------------- |
| **Executive Overview & Health** | `adminExecutive`   | High-level metrics, active tenant counts, system load, quick-action status     |
| **Pharmacy Feedback Inbox**     | `adminFeedback`    | Real-time support tickets, bug reports, and NDA queries from client pharmacies |
| **Global Policy Engine**        | `adminPolicies`    | Platform-wide business rules: VAT, FEFO discounts, NDA Schedule 1 locks        |
| **Delegated Collaborators**     | `adminDelegated`   | Management of domain-specific admin accounts and time-limited access grants    |
| **Dual-Control 4-Eyes Queue**   | `adminDualControl` | Staging queue requiring two-party signoff for high-risk administrative actions |
| **Security Incidents**          | `adminIncidents`   | Real-time threat detection, brute-force logs, and mitigation playbooks         |
| **Tenant Feature Matrix**       | `adminMatrix`      | Granular module toggles (AI, Insurance, POS, Reordering) per tenant            |
| **Branch Staff Accounts**       | `adminUsers`       | Managing user seats, role ranks, and permission toggles for client branches    |
| **Package & Billing Control**   | `adminBilling`     | UGX pricing tier editor, discount codes, and promotional campaigns             |
| **Register Pharmacy Tenant**    | `adminRegister`    | Onboarding wizard linked directly with the live Uganda NDA registry            |
| **Multi-Tenant Operations**     | `tenancy`          | Multi-branch chain oversight, database partition health, and SLA tracking      |

---

# 4. Standard Operating Procedures (SOPs) — Core Admin Modules

```
                                    ADMIN CONTROL FLOW
                                  
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 1. Onboard Tenant      │ ───► │ 2. Assign Tier & Matrix │ ───► │ 3. Provision Staff      │
│ Validate NDA License   │      │ Set Feature Entitlements│      │ Allocate User Roles     │
└────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
            │                                                                 │
            ▼                                                                 ▼
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 4. Enforce Policies    │ ───► │ 5. Monitor Health/DR    │ ───► │ 6. Audit & Dual Control │
│ FEFO, Tax, NDA Locks   │      │ PITR Backups & Telemetry│      │ 4-Eyes Signoff & Logs   │
└────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

---

## 4.1 Executive Overview & Health Telemetry

**Navigation:** `Admin Governance & Controls` ➔ `Executive Overview & Health`

### Purpose:

Provides a real-time command dashboard showing aggregate platform health, tenant distribution, revenue run-rates, and pending operational queues.

### Step-by-Step Instructions:

1. **Review System Vital Cards:**
   - **Active Pharmacy Tenants:** Total subscribed branches vs grace period accounts.
   - **Platform Monthly Recurring Revenue (MRR):** Total recurring billing in UGX.
   - **Dual-Control Pending Requests:** Counter for critical actions awaiting 4-eyes review.
   - **Open Security Incidents:** High/Critical severity security alerts requiring immediate attention.
2. **Execute Quick Actions:**
   - Click `Trigger Health Telemetry Scan` to query all microservices (Supabase PostgreSQL, Redis BullMQ, Gemini AI Gateway, Cloud Run instances).
   - Click `Inspect Active Alerts` to auto-scroll directly to open system incidents.

---

## 4.2 Global Policy Engine Configuration

**Navigation:** `Admin Governance & Controls` ➔ `Global Policy Engine`

### Purpose:

Establishes system-wide regulatory and operational rules that govern how all pharmacy tenants calculate prices, manage expiring drugs, dispense controlled medicines, and utilize AI.

### Configurable Parameter Groups:

#### A. Inventory & FEFO Pricing Policy:

- **Default Markup (%):** Base selling markup applied to wholesale drug acquisition costs (e.g., 30%).
- **FEFO Markdown (< 30 Days):** Automated discount applied at POS for stock expiring within 30 days (e.g., 25% OFF).
- **FEFO Markdown (< 60 Days):** Automated discount applied for stock expiring within 60 days (e.g., 15% OFF).
- **Auto-Quarantine Expired Stock:** If enabled (`ON`), any batch reaching `0 days` remaining is instantly locked from POS billing and transferred to the specified quarantine holding area.

#### B. Clinical & Dispensing Safety Overrides:

- **NDA Controlled Drugs (Schedule 1 Lock):** When enabled, restricts Class A controlled substances (Morphine, Pethidine, Ketamine) from being dispensed without mandatory prescription verification.
- **Require Dual Pharmacist Sign-Off for Opiates:** Enforces a 2-pharmacist verification pin at POS before narcotics can be checked out.
- **Max Daily Dispense Quota (Units):** Caps maximum allowable units per transaction to prevent unauthorized wholesale diversion.

#### C. POS, Taxes & Financial Governance:

- **VAT Rate (%):** Standard sales tax rate (default `18%` for Uganda URA compliance).
- **Cashier Maximum Discretionary Discount (%):** Maximum discount a frontline cashier can grant without supervisor override (e.g., `5%`).
- **Enforce Cash Drawer Variance Lock:** Prevents cashiers from closing shifts if discrepancy between physical cash and system ledger exceeds configured threshold.
- **Receipt Branding & Footer Text:** Global NDA and legal disclaimer printed on all thermal receipts.

#### D. AI Clinical Safety & Decision Support:

- **AI Clinical Assistant Enabled:** Master toggle for Gemini-assisted prescription digitizing and patient counseling.
- **Drug Interaction Strictness:** Choose between `CRITICAL_ONLY`, `MODERATE_AND_CRITICAL`, or `ALL_INTERACTIONS`.
- **Hallucination Filter & Prompt Redaction:** Strips all Patient Health Information (PHI) / Personally Identifiable Information (PII) before submitting queries to LLM inference endpoints.

### Procedure to Modify & Save Policies:

1. Adjust the toggles or numeric input fields.
2. Click the green **`Save Global Policy Rules`** button at the bottom of the form.
3. The system generates an immediate audit log entry and displays a confirmation notification banner.

---

## 4.3 Delegated Collaborator Management & Access Scopes

**Navigation:** `Admin Governance & Controls` ➔ `Delegated Collaborators`

### Purpose:

Enables Super Admins to safely delegate administrative responsibilities to specialist team members (financial auditors, inventory leads, clinical compliance officers) without giving them root credentials.

### Procedure to Invite a Delegated Collaborator:

1. Click the **`+ Invite Collaborator`** button at the top right.
2. Fill out the invitation modal:
   - **Full Name:** (e.g., `Sarah Nabawanuka`)
   - **Email Address:** (e.g., `sarah.n@techcompany.com`)
   - **Telephone Number:** (e.g., `+256 701 555 888`)
   - **Role:** Select `Domain Admin` or `Admin Collaborator`.
   - **Domain Scope:** Select one of:
     * `FINANCE` (Access to Billing, Tariffs, Insurance Ledgers)
     * `INVENTORY` (Access to FEFO, Supplier POs, Reorder Engine)
     * `CLINICAL_OVERSIGHT` (Access to NDA locks, Rx queues, AI Safety)
     * `SECURITY_COMPLIANCE` (Access to Audit Logs, Telemetry, Incidents)
     * `FULL_PLATFORM` (All modules except root Super Admin elevation)
   - **Access Expiry Window:** Select `30 Days`, `60 Days`, `90 Days`, or `180 Days`.
3. Click **`Grant Delegated Access`**.

### Procedure to Revoke Access Immediately:

- Locate the collaborator in the active list.
- Click the red **`Revoke Access`** button.
- Their active session token is immediately invalidated in memory and database; they will be kicked to the login screen on their next request.

---

## 4.4 Dual-Control (4-Eyes Principle) Approval Queue

**Navigation:** `Admin Governance & Controls` ➔ `Dual-Control 4-Eyes Queue`

### Purpose:

Protects critical infrastructure and high-liability actions against single-person error, rogue actors, or account compromise.

### Actions Requiring Dual Control:

- **`TENANT_SUSPENSION`:** Freezing a hospital or pharmacy chain's operational access.
- **`GLOBAL_PRICE_OVERRIDE`:** Changing platform-wide drug markups or tax rates.
- **`DISPENSING_QUOTA_OVERRIDE`:** Raising or bypassing daily opiate dispense limits.
- **`COLLABORATOR_ELEVATION`:** Promoting a user to Super Admin status.
- **`DATA_PURGE_REQUEST`:** Deleting historical audit or transaction records.

### Approval / Rejection Workflow:

1. Navigate to the **Dual-Control 4-Eyes Queue**.
2. Examine pending requests displaying the amber `PENDING_APPROVAL` status badge.
3. Review the request details:
   - **Target Tenant:** The pharmacy affected.
   - **Initiator:** The collaborator who requested the change.
   - **Risk Level:** `HIGH` (Orange) or `CRITICAL` (Red).
   - **Detailed Reason:** Explanation provided by initiator.
4. **To Approve:**
   - Click the green **`Approve Action (Sign-off)`** button.
   - The action is immediately executed by the system and stamped with your Super Admin signature.
5. **To Reject:**
   - Click the red **`Reject Request`** button.
   - Enter a mandatory rejection explanation in the prompt.
   - The status transitions to `REJECTED` and the initiator is notified.

---

## 4.5 Security Incident Management & Threat Mitigation

**Navigation:** `Admin Governance & Controls` ➔ `Security Incidents`

### Purpose:

Tracks real-time platform threats, brute-force login attempts, unauthorized API access tokens, and suspicious data exfiltration attempts across all branches.

### Incident Severity Tiers:

- `CRITICAL` (P0): System compromise attempt, API credential leak, bulk unmasked patient data access.
- `HIGH` (P1): Multiple failed admin logins, unauthorized prescription status tampering.
- `MEDIUM` (P2): POS cash drawer variance above tolerance, unexpected IP geolocation switch.
- `LOW` (P3): Expired token usage, minor rate limit violation.

### Incident Remediation SOP:

1. Locate the incident in the incident registry.
2. Click on the incident card to expand the **Summary** and **Automated Mitigation Steps**.
3. Follow the guided mitigation playbook:
   - If IP brute-force: Verify Cloudflare WAF block rule is active.
   - If compromised user account: Navigate to **Branch Staff Accounts** and toggle status to `Suspended`.
   - If suspicious export: Check the **Audit Log Viewer** to identify exact records touched.
4. Update the incident status from `OPEN` ➔ `INVESTIGATING` ➔ `RESOLVED`.

---

## 4.6 Tenant Feature Matrix & Entitlement Management

**Navigation:** `Admin Governance & Controls` ➔ `Tenant Feature Matrix`

### Purpose:

Allows administrators to toggle modular features on or off for individual client branches depending on their contract SLA, pilot agreements, or payment status.

### Available Feature Gates:

| Feature Key         | Module Functionality                                      |
| :------------------ | :-------------------------------------------------------- |
| `basicInventory`  | Core catalog, stock quantities, and shelf locations       |
| `batchTracking`   | FEFO batch tracking, lot numbers, and expiry management   |
| `autoReordering`  | Automated stockout calculations & supplier PO generation  |
| `expiryAlerts`    | 30/60/90-day expiry triage dashboard                      |
| `posBilling`      | Fast counter checkout, barcode scanning, thermal printing |
| `salesAnalytics`  | Revenue reports, profit margins, and sales trends         |
| `insuranceClaims` | Third-party insurance co-pay splitter & reconciliation    |
| `aiCounseling`    | Gemini AI prescription digitizer & clinical counselor     |
| `multiLocation`   | Inter-branch inventory transfers & central stock lookup   |
| `apiAccess`       | External REST API integration endpoints for EHR systems   |

### How to Toggle Features for a Tenant:

1. Select the target pharmacy from the **Active Pharmacy Client** dropdown.
2. Toggle the switch for the specific feature (`Enabled` = Green, `Disabled` = Slate).
3. Click the **`Save Feature Matrix Changes`** button.
4. The client's frontend session dynamically adapts; disabled tabs are hidden from their navigation sidebar immediately.

---

## 4.7 Branch Staff & User Account Provisioning

**Navigation:** `Admin Governance & Controls` ➔ `Branch Staff Accounts`

### Purpose:

Oversee all staff accounts registered under each pharmacy branch, monitor user seat caps according to subscription tiers, and configure granular role rights.

### Staff Roles & Typical Permission Profiles:

1. **Supervising Pharmacist:** Full clinical authority, prescription dispensing, narcotics unlock, reorder approval, AI counseling.
2. **Assistant Pharmacist:** Clinical dispensing, patient chronic profile management, inventory adjustments.
3. **Pharmacy Technician:** Stock receiving, shelf barcode tagging, prescription preparation.
4. **POS Cashier / Dispenser:** Counter retail billing, cash/mobile money collection, thermal receipt printing.
5. **Store & Inventory Manager:** Supplier purchase orders, batch arrivals, expiry quarantine.
6. **Finance & Claims Officer:** Insurance reconciliation, daily sales reports, expense ledgers.
7. **Intern Pharmacist:** Supervised dispensing queue access, educational AI queries.

### Step-by-Step: Adding New Staff Account to a Branch:

1. Select the client pharmacy.
2. Verify available seat capacity (e.g., `3 of 5 seats used`).
3. Click **`+ Add Staff User`**.
4. Enter:
   - **Full Name** (e.g., `Grace Atuhaire`)
   - **Email Address** (login username)
   - **Phone Number**
   - **PSU Registration / Staff Number** (mandatory for supervising pharmacists)
   - **Role Rank** (select from the 7 standard ranks)
5. Fine-tune access checkboxes:
   - `[x] Can Access POS Terminal`
   - `[x] Can Manage Inventory & Batches`
   - `[x] Can Process Prescriptions`
   - `[x] Can Approve Purchase Orders`
   - `[x] Can View Financial Reports`
   - `[x] Can Submit Insurance Claims`
   - `[x] Can Use AI Clinical Assistant`
   - `[x] Can Manage Branch Staff Accounts`
6. Click **`Create User Account`**.

### Suspending or Resetting a User:

- Click the **Status Badge** (`Active` / `Suspended`) to toggle user access immediately.
- Click the **`Edit (Pencil)`** icon to modify phone, email, or individual permission flags.
- Click the **`Delete (Trash)`** icon to permanently delete user credentials (requires confirmation).

---

## 4.8 Package Tiers, Billing & Promo Governance

**Navigation:** `Admin Governance & Controls` ➔ `Package & Billing Control`

### Purpose:

Configure commercial SaaS subscription plans, monthly/annual UGX price points, max user allocations, and seasonal discount promo codes.

### Standard Commercial Tiers:

| Tier Name                 | Base Monthly Rate (UGX) | User Seat Cap   | Key Feature Bundle                                    |
| :------------------------ | :---------------------- | :-------------- | :---------------------------------------------------- |
| **Starter**         | UGX 150,000 / mo        | Up to 2 Users   | Core POS, Basic Inventory, Expiry Warnings            |
| **Professional**    | UGX 350,000 / mo        | Up to 5 Users   | Full FEFO, Automated POs, WhatsApp Refills, Analytics |
| **Enterprise**      | UGX 750,000 / mo        | Up to 15 Users  | Full Insurance Engine, Gemini AI Suite, Multi-Branch  |
| **Custom Tailored** | Negotiated SLA          | Unlimited Users | Dedicated Cloud Run instance, Custom ERP integrations |

### Applying Promotional Discount Coupons:

1. In the **Promotions & Billing Settings** panel, enter a discount code into the promo code field (e.g., `ZENITH2026` or `KAMPALA-HEALTH`).
2. Click **`Apply Coupon`**.
3. Verify that the discounted rates in UGX update automatically across all tier cards.
4. Click **`Save Package Configurations`** to commit changes to the billing ledger.

---

## 4.9 Pharmacy Tenant Onboarding & NDA License Verification

**Navigation:** `Admin Governance & Controls` ➔ `Register Pharmacy Tenant`

### Purpose:

The primary onboarding gateway for new pharmacy clients. It guarantees that every pharmacy operating on ZenithRx is vetted against official regulatory records from the **Uganda National Drug Authority (NDA)**.

```
                   NDA ONBOARDING VERIFICATION FLOW
                 
┌───────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 1. Search NDA Database│ ───► │ 2. Select Licensed Unit │ ───► │ 3. Auto-populate Form   │
│ By Name or License No │      │ Check PSU Reg & Status  │      │ Premise, District, Sup. │
└───────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                             │
                                                                             ▼
┌───────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 6. Tenant Live!       │ ◄─── │ 5. Create Initial Admin │ ◄─── │ 4. Select Package Tier  │
│ Ready for Dispensing  │      │ Set Supervising Login   │      │ Starter, Pro, Enterprise│
└───────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### Step-by-Step Onboarding Procedure:

#### Mode A: Automated NDA Registry Sync (Recommended)

1. In the registration view, select the **`Link with Uganda NDA Registry`** radio button.
2. In the search box, type the pharmacy trade name or license number (e.g., `First Pharmacy`, `Vine Pharmaceuticals`, `NDA/PRE/2026/0891`).
3. Click on the matched pharmacy result. The system will automatically populate:
   - Official Pharmacy Name & Branch Name
   - NDA License Number
   - District & Region (e.g., `Kampala`, `Central Region`)
   - Licensed Premises Category (`Retail`, `Wholesale`, `Hospital Pharmacy`)
   - Registered Supervising Pharmacist Name
   - PSU Registration Number
4. Enter the direct **Contact Phone Number** and **Contact Email Address**.
5. Select the **Initial Subscription Package Tier** (`Starter`, `Professional`, `Enterprise`).
6. Set the **Billing Cycle** (`Monthly` or `Annual - 10% Discount`).
7. Click the green **`Register & Verify Pharmacy Client`** button.
8. The tenant is provisioned with immediate database isolation, sample formulary records, and an initial Supervising Pharmacist administrator account.

#### Mode B: Manual Entry (Private Hospital / Clinic Dispensaries)

1. Select **`Manual Entry (Unlisted Facility)`**.
2. Manually complete all mandatory facility, location, and licensing fields.
3. Attach internal compliance notes in the designated field.
4. Click **`Register & Verify Pharmacy Client`**.

---

## 4.10 Multi-Tenant SaaS Operations & Multi-Branch Chains

**Navigation:** `Admin Governance & Controls` ➔ `Multi-Tenant SaaS Operations`

### Purpose:

Allows tech company operations staff to monitor multi-location pharmacy networks (e.g., a chain with branches in Kampala Central, Nakawa, Entebbe, and Jinja) from a single unified cockpit.

### Administrative Capabilities:

- **Tenant Health Snapshots:** View real-time transaction throughput, active sessions, and database query response times for each branch.
- **SLA & Subscription Status Tracking:** Instant visibility into client renewal dates, pending invoices, and grace period countdowns.
- **Cross-Branch Inventory Visibility:** Assist client head offices in performing stock rebalances across low-stock and high-surplus branches.

---

## 4.11 Pharmacy Feedback & Support Ticket Desk

**Navigation:** `Admin Governance & Controls` ➔ `Pharmacy Feedback Inbox`

### Purpose:

A centralized communication gateway where client pharmacies submit bug reports, feature requests, NDA compliance inquiries, or billing questions directly from their interface.

### Support Ticket Workflow:

1. Open the **Pharmacy Feedback Inbox**.
2. Filter tickets by status: `Pending Admin Review`, `In Progress`, or `Resolved`.
3. Click **`Review & Reply`** on any incoming ticket.
4. Review ticket details:
   - Submitting Client & User
   - Category (`Bug Report`, `Feature Request`, `Billing Inquiry`, `NDA Compliance`, `Performance`)
   - Urgency Level (`Normal`, `High Priority`, `Critical`)
   - Message body
5. Type your official response in the **Admin Reply Field**.
6. Select the new status (`In Progress` or `Resolved`).
7. Click **`Dispatch Response`**. The client pharmacy will receive an instant notification badge in their system header.

---

# 5. System Reliability, Disaster Recovery & Performance Tuning

Tech company employees managing the production environment have direct access to deep operational diagnostics via the **System Health & Telemetry** suite (`SystemHealthDashboard.tsx`).

---

## 5.1 Real-Time Infrastructure Telemetry

**Access:** Click the **`System Health`** heartbeat badge in the top navigation header.

### Monitored Subsystems:

1. **PostgreSQL Database Engine (Supabase):** Connection pool saturation, active read/write queries, transaction latency (target: `< 25ms`).
2. **Cloud Run Frontend / Backend Containers:** Memory utilization, CPU throttle percentage, instance autoscaling count.
3. **Redis / BullMQ Queue Workers:** Job throughput, delayed jobs, failed job retry queues.
4. **Google Gemini AI Gateway (`@google/genai`):** API token consumption, quota availability, inference roundtrip latency (target: `< 1200ms`).
5. **Cloudflare R2 Object Storage:** Storage bucket availability, signed URL generation latency for prescriptions and PDF receipts.

---

## 5.2 Automated & Manual Cloud Backups (PITR)

**Access:** `System Health Dashboard` ➔ `Cloud Backups & PITR`

### Backup Architecture:

- **Continuous WAL Archiving (Point-In-Time Recovery):** Changes are streamed to immutable Cloudflare R2 storage every 60 seconds, enabling recovery to any exact second within the last 30 days.
- **Daily Automated Full Snapshots:** Executed automatically every morning at `02:00 UTC`. Encrypted with AES-256-GCM.

### How to Trigger an On-Demand Backup:

1. Navigate to the **Backups** tab.
2. Click the blue **`Trigger On-Demand Full Backup`** button.
3. System will initiate snapshot creation, verify hash checksum, and register the new backup record in the table.

### How to Perform a Non-Destructive Restore Dry-Run:

1. Locate any historical snapshot in the backup ledger.
2. Click **`Test Restore Dry-Run`**.
3. The platform will provision a temporary isolated staging database, restore the snapshot, run 50+ integrity test assertions (patient count, prescription balance, ledger sum), output the pass/fail score, and automatically tear down the test environment.

---

## 5.3 Emergency Incident Runbooks

**Access:** `System Health Dashboard` ➔ `Incident Runbooks`

When an alert triggers, administrators should execute predefined automated runbooks rather than executing manual ad-hoc database queries:

| Runbook ID                           | Trigger Scenario                                    | Automated Action Executed                                                 |
| :----------------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------ |
| **`RB-01: DB_FAILOVER`**     | Primary PostgreSQL node unresponsive for > 45s      | Promotes hot-standby replica to primary, reroutes DNS connection pooler   |
| **`RB-02: REDIS_FLUSH`**     | Redis memory > 95% or stuck worker queue lock       | Safely flushes non-critical cache keys while preserving active POS queues |
| **`RB-03: RATE_LIMIT_LOCK`** | DDoS or brute-force API flood detected              | Engages strict Cloudflare WAF Challenge mode for all non-whitelisted IPs  |
| **`RB-04: AI_FAILOVER`**     | Gemini API latency > 5000ms or 429 quota exhaustion | Gracefully switches to local regex parser for prescription digitization   |

### Executing a Runbook:

1. Click the **Runbooks** tab.
2. Locate the corresponding runbook.
3. Click the green **`Execute Automated Runbook`** button.
4. Confirm the execution prompt. Monitor real-time terminal stdout in the modal.

---

## 5.4 POS Graceful Degradation (Offline Mode)

**Access:** `System Health Dashboard` ➔ `POS Offline Mode`

If upstream internet connectivity in Uganda fails or the central API experiences high latency, the System Admin can verify or manually toggle **POS Graceful Degradation Mode**.

### How Offline Mode Works:

- Frontend switches to **IndexedDB local caching** for the drug catalog and patient directory.
- Retail transactions are assigned a local cryptographically unique receipt ID (`OFF-XXXXX`) and stored in a persistent offline browser queue.
- As soon as connectivity is restored, the background sync worker flushes pending sales, decrements server inventory batches using FEFO priority, and posts financial ledger entries automatically.

---

## 5.5 Redis Queue & Cache Control Panel

**Access:** `System Health Dashboard` ➔ `Queue & Cache Management`

### Core Worker Queues:

1. `rx-digitizer-queue`: Background processing of scanned doctor prescriptions via Gemini AI.
2. `whatsapp-refill-queue`: Scheduled automated reminder messages for chronic care patients.
3. `daily-sales-aggregator`: End-of-day financial reconciliation and inventory valuation cron jobs.

### Actions:

- **Pause Queue:** Halts job consumption during emergency database maintenance.
- **Resume Queue:** Restarts worker processing.
- **Retry Failed Jobs:** Re-submits all jobs in the dead-letter queue (DLQ) after an outage has been resolved.
- **Clear Application Cache:** Invalidates cached drug lookup tables across all connected browsers.

---

# 6. Audit Logging, Compliance & Data Portability

ZenithRx is engineered to comply with strict medical confidentiality and financial auditing standards.

---

## 6.1 Immutable Audit Trail Explorer

**Navigation:** Sidebar ➔ `Audit Trail & Security Logs` (`AuditLogViewer.tsx`)

Every significant mutation in the system is logged automatically.

### Search & Filter Parameters:

- **Tenant Filter:** View all logs globally or isolate to a single pharmacy branch.
- **Severity Filter:** `INFO`, `WARNING`, `CRITICAL`.
- **Entity Type:** `PRESCRIPTION`, `INVENTORY`, `USER_AUTH`, `TENANT_POLICY`, `POS_SALE`, `DUAL_CONTROL`.
- **Free-Text Search:** Search by staff name, drug name, receipt number, or IP address.

### Exporting Audit Logs for Regulatory Inspection:

1. Filter the audit table to the required date range or tenant.
2. Click the **`Export Audit Log (CSV)`** button at the top right.
3. The system generates a cryptographically signed CSV file suitable for presentation to NDA or URA tax auditors.

---

## 6.2 Policy-Compliant Data Exports & PII Masking

**Access:** `ExportArchiveModal.tsx` & `csvExportPolicyService.ts`

When exporting operational or financial data:

- **Staff Records:** Passwords and session secrets are completely excluded.
- **Patient Records:** In non-clinical exports, Patient Health Information (PHI) and phone numbers are automatically redacted according to the active Global System Policy.
- **Financial Ledgers:** Formatted cleanly with exact UGX totals, payment channels (Mobile Money vs Cash vs Insurance), and tax breakdowns.

---

# 7. Daily, Weekly & Monthly Admin Checklists

To maintain 99.99% system availability, all tech company support and operations engineers must adhere to the following routines:

### ☀️ Daily Morning Health Check (07:30 - 08:00 Local Time)

- [ ] Open **Executive Overview & Health** (`adminExecutive`).
- [ ] Verify all microservice health check badges show **`Healthy (Green)`**.
- [ ] Check **Dual-Control 4-Eyes Queue** for pending escalation requests.
- [ ] Review **Security Incidents** (`adminIncidents`) for new overnight alerts.
- [ ] Open **Pharmacy Feedback Inbox** (`adminFeedback`) and triage high-priority client tickets.
- [ ] Verify that the daily **02:00 UTC Database Backup Snapshot** completed successfully.

### 📅 Weekly Operational Review (Every Monday)

- [ ] Review **Delegated Collaborators** (`adminDelegated`) and revoke any accounts whose project tenure has expired.
- [ ] Inspect **Redis Worker Dead-Letter Queues** to confirm zero unhandled prescription or notification jobs.
- [ ] Review client subscription status in **Multi-Tenant Operations**; follow up with branches entering grace periods.
- [ ] Execute a **Non-Destructive Restore Dry-Run** on the latest full database backup.

### 🗓️ Monthly Governance & Compliance Audit

- [ ] Perform a full cross-reference of active pharmacy tenants against the updated Uganda NDA quarterly gazette.
- [ ] Audit global tax rates and price markup parameters in the **Global Policy Engine**.
- [ ] Rotate administrative API keys and Cloudflare WAF token credentials.
- [ ] Archive audit logs older than 90 days to encrypted cold cloud storage (Cloudflare R2 Archive).

---

# 8. Troubleshooting & Emergency Escalation Matrix

### 8.1 Common Troubleshooting Scenarios

#### Scenario 1: A Pharmacy Reports "Cannot Dispense Controlled Narcotic"

- **Root Cause:** The drug is flagged as an NDA Schedule 1 substance, and `ndaControlledDrugsSchedule1Lock` is enabled in Global Policies, or the staff member logged in lacks the `Supervising Pharmacist` rank.
- **Solution:**
  1. Have the user verify that a valid prescription number is attached.
  2. If an emergency override is legally authorized by the Chief Pharmacist, navigate to `Global Policy Engine` and verify `emergencyDispensingOverrideEnabled` status.
  3. Verify the user's role in `Branch Staff Accounts`.

#### Scenario 2: Prescription AI Digitizer Fails with "Quota Exceeded" or High Latency

- **Root Cause:** Google Gemini API rate limits reached during peak morning clinic hours.
- **Solution:**
  1. Open `System Health Dashboard` ➔ `Incident Runbooks`.
  2. Execute **`RB-04: AI_FAILOVER`** to route traffic to backup model endpoints or fallback digitizers.
  3. Verify that the Gemini API billing quota has been adjusted in Google Cloud Console.

#### Scenario 3: Cashier Cannot Complete Checkout Due to "Variance Lock"

- **Root Cause:** `enforceCashDrawerVarianceLock` is active, and the physical drawer cash does not tally with system total.
- **Solution:**
  1. Have the Branch Supervising Pharmacist perform a cash drawer recount in the POS Cash Up screen.
  2. If an authorized administrative override is required, the Supervising Pharmacist can sign off with their credentials.

---

### 8.2 Severity Levels & Escalation Contacts

```
┌──────────────┬────────────────────────────────────────────┬──────────────┬────────────────────────────┐
│ Severity     │ Impact Description                         │ Response SLA │ Escalation Contacts        │
├──────────────┼────────────────────────────────────────────┼──────────────┼────────────────────────────┤
│ **P0 - Blocker** │ Entire platform down, database unreachable, │ < 15 Minutes │ • Lead DevOps Engineer     │
│              │ widespread POS checkout failure.           │              │ • Solutions Architect      │
│              │                                            │              │ • Chief Technology Officer │
├──────────────┼────────────────────────────────────────────┼──────────────┼────────────────────────────┤
│ **P1 - Critical**│ Single high-volume branch offline,         │ < 30 Minutes │ • Senior Backend Engineer  │
│              │ Gemini AI service completely degraded.     │              │ • Support Lead             │
├──────────────┼────────────────────────────────────────────┼──────────────┼────────────────────────────┤
│ **P2 - Major**   │ Specific module broken (e.g., Insurance    │ < 2 Hours    │ • Domain Backend Engineer  │
│              │ Claims export or WhatsApp notifications).  │              │ • QA Engineer              │
├──────────────┼────────────────────────────────────────────┼──────────────┼────────────────────────────┤
│ **P3 - Minor**   │ UI visual glitch, non-blocking report      │ < 24 Hours   │ • Frontend Developer       │
│              │ formatting issue, general client feedback. │              │ • Product Owner            │
└──────────────┴────────────────────────────────────────────┴──────────────┴────────────────────────────┘
```

---

> **ZenithRx Operations Guarantee:**
> *By following the protocols outlined in this manual, the engineering and administration team ensures that ZenithRx remains secure, compliant, blazing fast, and trusted by healthcare professionals across Uganda and East Africa.*
