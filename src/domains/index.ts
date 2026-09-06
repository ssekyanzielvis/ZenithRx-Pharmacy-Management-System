/**
 * ZenithRx Domain Boundaries Registry
 * Complies with technical.md §11.6 (API, Integration & Domain Boundaries)
 *
 * 10 Core Bounded Contexts:
 * 1. Identity & Access Management (IAM)
 * 2. Tenant & Branch Administration
 * 3. Inventory & Batch Control
 * 4. Prescription & Clinical Safety
 * 5. Point of Sale & Billing
 * 6. Insurance & Claims
 * 7. Procurement & Supplier Management
 * 8. Notifications & Communications
 * 9. Reporting & Audit
 * 10. AI Services & Document Processing
 */

export * as IamDomain from './iam';
export * as TenantBranchDomain from './tenant-branch';
export * as InventoryDomain from './inventory';
export * as ClinicalDomain from './clinical';
export * as PosBillingDomain from './pos-billing';
export * as InsuranceDomain from './insurance';
export * as ProcurementDomain from './procurement';
export * as CommunicationsDomain from './communications';
export * as ReportingAuditDomain from './reporting-audit';
export * as AiClinicalDomain from './ai-clinical';
