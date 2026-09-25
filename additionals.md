SYSTEM REQUIREMENTS — VERSION 2
1. User Roles and Access Levels

The system shall support four primary user roles:

System Administrator
Pharmacy Owner
Pharmacist / Pharmacy Staff
Patient

The System Administrator shall have system-wide administrative privileges and shall control the configuration, users, pharmacies, medicines, security, transactions, content, reports, and overall operation of the platform.

The other users shall only access functions permitted by their assigned roles.

2. SYSTEM ADMINISTRATOR REQUIREMENTS
2.1 Administrator Account and Authentication

The system administrator shall be able to:

Securely log into the administration portal.
Change their password.
Manage administrator account details.
Use strong authentication mechanisms.
Manage administrator sessions.
Log out active sessions.
View administrator login history.
Monitor failed login attempts.
Receive security alerts for suspicious administrator activity.

The administrator account shall have higher privileges than ordinary system users.

3. User Account Management

The System Administrator shall have complete control over user accounts.

The administrator shall be able to:

Create user accounts.
View user accounts.
Search users.
Filter users by role.
Edit user information.
Activate user accounts.
Suspend user accounts.
Deactivate user accounts.
Reactivate accounts where appropriate.
Reset user passwords.
Assign roles.
Change user roles.
Verify user identities where required.
View account creation dates.
View last-login information.
View account status.
Delete accounts where permitted by the data-retention policy.
Prevent unauthorized users from accessing the platform.

The administrator shall be able to manage:

Patient accounts.
Pharmacist accounts.
Pharmacy staff accounts.
Pharmacy owner accounts.
Other authorized administrative accounts.
4. Role and Permission Management

The administrator shall control Role-Based Access Control (RBAC).

The administrator shall be able to:

Create roles where required.
Define permissions.
Assign permissions to roles.
Assign users to roles.
Modify permissions.
Remove permissions.
Review which users have access to specific functions.
Prevent users from accessing unauthorized modules.
Control access to sensitive patient and health information.

The system shall enforce permissions at the application and backend levels.

5. Pharmacy Management

The System Administrator shall have complete control over pharmacies registered on the platform.

The administrator shall be able to:

Register pharmacies.
Review pharmacy registration requests.
Approve pharmacies.
Reject pharmacy registration requests.
Suspend pharmacies.
Reactivate pharmacies.
Deactivate pharmacies.
Edit pharmacy information.
Verify pharmacy information.
Associate pharmacy owners with pharmacies.
Associate pharmacists and staff with pharmacies.
Manage pharmacy branches.
Add branches.
Edit branches.
Suspend branches.
View pharmacy operating status.
Monitor pharmacy activity.
View pharmacy transaction history.

The system shall support multiple licensed pharmacies and multiple branches. The original proposal requires cross-pharmacy stock visibility and multi-branch management.

6. Pharmacist Verification and Professional Management

The administrator shall manage pharmacists operating on the platform.

The administrator shall be able to:

Register pharmacists.
Verify pharmacist accounts.
Associate pharmacists with approved pharmacies.
Remove pharmacists from pharmacies.
Suspend pharmacist accounts.
Reactivate pharmacist accounts.
View pharmacist activity.
View pharmacist verification records.
Monitor pharmacist dispensing activity.
Monitor prescription verification activity.
Review pharmacist audit records.

The administrator shall not replace the pharmacist's clinical decision.

The pharmacist remains the final decision-maker for clinical matters, while the administrator controls the system through which those decisions are recorded and monitored.

7. Medicine Catalogue Administration

The administrator shall have complete control over the central medicine catalogue.

The administrator shall be able to:

Add medicines.
Edit medicines.
Deactivate medicines.
Reactivate medicines.
Remove medicines where permitted.
Add International Nonproprietary Names (INNs).
Add brand names.
Add generic names.
Add spelling aliases.
Manage medicine categories.
Manage medicine descriptions.
Manage medicine information.
Manage medicine status.
Identify prescription-only medicines.
Identify classified medicines.
Maintain medicine reference information.

The catalogue shall support medicine searching using INN names, brand names, and common spelling variations.

8. Medicine Safety Database Administration

The administrator shall manage the reference information used by the safety modules.

The administrator shall be able to:

Manage medicine interaction information.
Manage documented allergy classes.
Manage clinical flag reference information.
Update reference information.
Activate/deactivate outdated reference entries.
Maintain the curated safety reference dataset.

The system shall use this information to generate clinically significant interaction and allergy flags for pharmacist review.

9. Medicine Information and Health Education

The administrator shall manage the information presented to patients.

The administrator shall be able to:

Create medicine information.
Edit medicine information.
Publish medicine information.
Unpublish medicine information.
Create health education content.
Edit health education content.
Publish pharmacist-reviewed content.
Remove outdated content.
Manage educational categories.

Only approved/pharmacist-reviewed information shall be presented as health education content.

10. Prescription and OCR Administration

The administrator shall control the configuration and monitoring of the prescription-processing system.

The administrator shall be able to:

Monitor prescription uploads.
View prescription processing status.
Monitor OCR processing.
Manage OCR configuration.
Manage medicine-matching configuration.
Review OCR errors.
Review OCR performance.
Monitor OCR confidence levels.
Maintain the medicine-matching reference data.
View prescription processing logs.

However, the administrator shall not be able to bypass the mandatory pharmacist verification requirement.

OCR shall remain assistive and shall never automatically approve a prescription.

11. Prescription Verification Control

The administrator shall be able to monitor the pharmacist verification workflow.

The administrator shall:

Monitor pending prescriptions.
Monitor verified prescriptions.
Monitor rejected prescriptions.
Monitor amended prescription lines.
Monitor verification timestamps.
Identify the pharmacist who performed verification.
Review verification audit records.
Investigate abnormal verification activity.
Generate prescription verification reports.

The administrator shall not automatically approve prescription-only medicines simply because they have administrative privileges.

12. Inventory Administration

The administrator shall have system-wide visibility of pharmacy inventory.

The administrator shall be able to:

View stock across pharmacies.
View stock across branches.
Monitor batch-level stock.
Monitor expiry dates.
Monitor stock movement.
Monitor overstock.
Monitor fast-moving medicines.
Monitor low-stock medicines.
Monitor expired medicines.
Monitor near-expiry medicines.
Review stock adjustments.
Monitor FEFO compliance.
Generate inventory reports.

Pharmacy staff remain responsible for operational stock handling, including batch management and FEFO issuing.

13. Expiry and Stock Alert Administration

The administrator shall be able to configure:

Expiry-warning periods.
Low-stock thresholds.
Overstock thresholds.
Stock-related notifications.
Expiry alerts.

The system shall automatically identify medicines approaching expiry according to the configured thresholds.

14. Supplier and Procurement Administration

The administrator shall control the platform's supplier and procurement records.

The administrator shall be able to:

Add suppliers.
Edit supplier information.
Deactivate suppliers.
View supplier records.
View purchase orders.
Monitor goods received.
View batch information associated with received goods.
View invoices.
Monitor invoice reconciliation.
Generate procurement reports.
Monitor supplier performance.

The proposal requires supplier records, purchase orders, goods received against batches, and invoice reconciliation.

15. Orders and Delivery Administration

The administrator shall have system-wide visibility and control over orders.

The administrator shall be able to:

View all orders.
Search orders.
Filter orders.
View order details.
Monitor order status.
Monitor payment status.
Monitor fulfilment status.
Monitor delivery status.
Monitor collection status.
Investigate failed orders.
Investigate cancelled orders.
View order history.
Generate order reports.

The administrator shall be able to intervene in operational problems without bypassing the clinical verification requirements.

16. Payment Administration

The administrator shall manage the payment configuration and monitor payment activity.

The administrator shall be able to:

Configure the mobile-money payment gateway.
Monitor payment transactions.
View successful payments.
View failed payments.
View pending payments.
Reconcile payment records.
Monitor payment-related errors.
Generate payment reports.
Monitor refunds where supported.

Actual payment authorization shall remain subject to the configured payment provider.

17. Delivery and Logistics Administration

The administrator shall be able to:

Configure delivery settings.
Monitor deliveries.
View delivery status.
View delayed deliveries.
View completed deliveries.
Monitor collection orders.
Review delivery records.
Generate delivery reports.
18. Adherence and Refill Management

The administrator shall control the configuration of adherence functionality.

The administrator shall be able to:

Monitor adherence functionality.
Configure reminder rules where applicable.
Monitor refill alerts.
View aggregate adherence statistics.
Monitor refill activity.
Generate adherence reports.

Patient-specific health information shall only be accessible to authorized users.

19. Consultation Administration

The administrator shall control the consultation service operationally.

The administrator shall be able to:

Manage pharmacist availability settings.
Monitor consultation service availability.
Manage scheduled-call configurations.
Monitor consultation status.
Investigate technical problems with consultations.
Audit access to consultation records.

Access to actual consultation health information shall remain restricted according to user permissions because consultation notes constitute health data.

20. Adverse Drug Reaction Administration

The administrator shall be able to:

Monitor submitted ADR reports.
View ADR report status.
Track ADR reporting workflow.
Monitor reports by medicine.
Monitor reports by batch.
Monitor reported reactions.
Monitor reported outcomes.
Generate ADR reports.
Manage onward-submission workflow where supported.

The underlying ADR form shall capture medicine, batch, reaction and outcome.

21. Dispensing Register Administration

The administrator shall have system-wide oversight of the dispensing register.

The administrator shall be able to:

Search dispensing records.
Filter dispensing records.
View classified-medicine dispensing activity.
Generate dispensing reports.
Identify the dispensing pharmacist.
View timestamps.
View batch numbers.
View prescription references.
Monitor unusual dispensing activity.
Export authorized dispensing reports.

However, the administrator shall not silently edit or overwrite historical dispensing records.

The register shall remain append-only and auditable.

22. Reporting and Analytics Administration

The administrator shall have access to system-wide analytics.

The administrator shall be able to generate:

User reports.
Pharmacy reports.
Branch reports.
Medicine reports.
Stock reports.
Expiry reports.
Sales reports.
Prescription reports.
Dispensing reports.
Payment reports.
Delivery reports.
Procurement reports.
Supplier reports.
ADR reports.
Adherence reports.
Consultation activity reports.
Security reports.
Audit reports.
Financial reports.
Multi-pharmacy reports.
Multi-branch reports.

The administrator shall be able to:

Filter reports by date.
Filter by pharmacy.
Filter by branch.
Filter by medicine.
Filter by user.
Export reports to spreadsheets.
Produce print-ready reports.

The proposal already requires sales, stock, prescription, financial, period-based and multi-branch reports with spreadsheet export and print-ready output.

23. Notification Administration

The administrator shall control system notification settings.

The administrator shall be able to:

Configure push notifications.
Configure SMS notifications.
Configure order notifications.
Configure refill notifications.
Configure adherence reminders.
Configure system announcements.
Monitor notification delivery.
Monitor failed notifications.
Manage notification templates.

The platform shall support push notifications and SMS.

24. System Configuration

The administrator shall control global system settings, including:

System name and configuration.
Pharmacy settings.
User-role settings.
Notification settings.
Medicine catalogue settings.
Stock thresholds.
Expiry-alert thresholds.
OCR configuration.
Payment configuration.
Delivery configuration.
Report configuration.
Data-retention settings.
Security settings.
Audit settings.
25. Audit Log and System Monitoring

The administrator shall have access to the system audit log.

The audit system shall record important activities such as:

Login attempts.
Account creation.
Account modification.
Role changes.
Permission changes.
Prescription verification.
Prescription rejection.
Dispensing.
Inventory changes.
Medicine catalogue changes.
Payment events.
Order status changes.
Configuration changes.
Administrative actions.

The administrator shall be able to:

Search audit logs.
Filter audit logs.
View who performed an action.
View what action was performed.
View when it occurred.
Investigate suspicious activities.
Export authorized audit reports.

An audit log is explicitly required by the proposal.

26. Security Administration

The administrator shall be responsible for operational security management.

The administrator shall be able to:

Manage user access.
Suspend compromised accounts.
Revoke access.
Reset credentials.
Monitor failed authentication attempts.
Monitor suspicious activity.
Review security logs.
Manage session policies.
Manage access permissions.
Monitor security events.
Configure security policies.

The system shall provide:

Authentication.
RBAC.
Encryption in transit.
Encryption at rest.
Audit logging.
Defined data retention.
In-country hosting.
27. Data Management

The administrator shall oversee system data management.

The administrator shall be able to:

Monitor stored data.
Manage data-retention policies.
Manage data-access permissions.
Manage archival policies.
Monitor database health.
Manage authorized data exports.
Monitor data synchronization.
Support backup and recovery procedures.
Investigate data inconsistencies.

Sensitive health information shall only be accessible to authorized users.

28. Offline Synchronization Administration

The administrator shall monitor the synchronization of supported offline patient functionality.

The patient application shall continue to support:

Cached medicine history.
Cached prescriptions.
Locally scheduled reminders.

Ordering, payment and dispensing actions shall require an active connection.

The administrator shall be able to monitor synchronization errors and related system logs.

29. System-Wide Dashboard

The System Administrator shall have a centralized dashboard showing the operational state of the platform.

The dashboard should provide visibility into:

Total registered users.
Active patients.
Active pharmacists.
Active pharmacy owners.
Registered pharmacies.
Registered branches.
Pending pharmacy approvals.
Pending pharmacist verification.
Pending prescriptions.
Orders.
Payments.
Deliveries.
Current stock.
Expiring stock.
ADR reports.
System alerts.
Security events.
Recent administrative activity.
30. System Administrator's Overall Responsibility

The System Administrator shall be responsible for the proper running and governance of the entire platform.

This includes:

User management → Pharmacy management → Role management → Medicine catalogue → Safety reference data → Prescription workflow → OCR monitoring → Inventory oversight → Procurement oversight → Orders → Payments → Delivery → Adherence → Consultations → ADR reporting → Dispensing-register oversight → Analytics → Notifications → Security → Audit → Data management → System configuration → System monitoring.

The administrator therefore acts as the central operational controller, while clinical decisions remain with registered pharmacists and patients retain control over their own patient-facing activities.

31. Patient Requirements

The Patient shall be able to:

Create and access an account.
Search medicines across participating pharmacies.
Search by generic/INN name, brand name and spelling variation.
View medicine availability.
View pharmacy availability and distance.
Upload prescriptions.
View prescription history.
Place orders after verification.
Pay through mobile money.
Track delivery/collection.
Receive adherence reminders.
Receive refill reminders.
Record self-reported doses.
View refill history.
Communicate with pharmacists.
Schedule pharmacist calls.
Access pharmacist-reviewed medicine information.
Access health education.
Report suspected ADRs.
Use cached medicine history offline.
Use cached prescriptions offline.
Receive locally scheduled reminders offline.
32. Pharmacist / Pharmacy Staff Requirements

The Pharmacist/Staff shall be able to:

Access the verification console.
Review prescription images.
Review OCR suggestions.
Confirm OCR suggestions.
Amend OCR suggestions.
Reject OCR suggestions.
Review interaction flags.
Review allergy flags.
Record decisions against flags.
View dosing references.
Make the final dosing decision.
Verify prescription validity.
Approve/reject prescription-only supply.
Review substitutions.
Review suspicious controlled-medicine requests.
Manage inventory.
Manage batches.
Manage expiry.
Apply FEFO.
Record classified-medicine dispensing.
Generate reports.
Submit ADR reports.
33. Pharmacy Owner Requirements

The Pharmacy Owner shall be able to:

View pharmacy information.
Monitor sales.
Monitor stock.
Monitor stock movement.
Monitor refill behaviour.
Monitor supplier performance.
Monitor expiry exposure.
View reports.
View multi-branch information.
Export accounting and inspection reports.
34. Critical System Rules

These rules shall apply regardless of administrator privileges:

Rule 1 — Pharmacist verification

A prescription-only medicine cannot proceed to ordering without pharmacist confirmation.

Rule 2 — OCR

OCR suggestions cannot automatically become approved prescriptions.

Rule 3 — Clinical flags

Every clinical flag must receive a recorded pharmacist decision.

Rule 4 — Classified medicines

Every classified-medicine dispensing event must create a dispensing-register entry.

Rule 5 — Auditability

Historical dispensing-register records cannot be silently overwritten.

Rule 6 — Clinical authority

The pharmacist remains the final decision-maker for clinical matters.

These are explicit safety properties of the proposed system.

35. Performance and Quality Requirements

The system shall target:

Requirement	Target
Catalogue search response	< 1 second
Verification console loading	< 2 seconds
Error rate under representative load	< 1%
Offline reminder reliability	≥ 99%
Task completion rate	≥ 90%
Mean heuristic severity	≤ 2
SUS usability score	≥ 68
OCR matcher F1-score	≥ 0.85

These targets are carried over directly from the proposal's quality and evaluation requirements.

36. Technical Architecture

The Version 2 system shall retain the proposed architecture:

Component	Technology
Patient mobile application	Flutter / Dart
Pharmacist console	React
Pharmacy Owner dashboard	React
System Administrator portal	React
Backend	FastAPI / Python
Main database	PostgreSQL
Mobile local storage	SQLite
Cache/background processing	Redis
Prescription OCR	Open-source OCR + medicine matcher
Notifications	Push messaging + SMS gateway
Payments	Mobile-money gateway
Deployment	Docker
Hosting	In-country hosting
Version control	Git
CI/CD	CI pipeline
Backend testing	pytest
Mobile testing	Flutter Test

The administrator portal is therefore added as a full administrative interface, rather than simply giving the administrator access to the pharmacy-owner dashboard. The underlying technology stack comes from the original proposal.

37. Overall System Structure

The complete Version 2 system can therefore be represented as:

SYSTEM ADMINISTRATOR
↓
Controls and monitors the entire platform
↓
Pharmacy Owners → Pharmacies → Pharmacists/Staff
↓
Patients ↔ Pharmacy Services
↓
Medicine Catalogue → Prescription/OCR → Pharmacist Verification → Order → Payment → Dispensing → Delivery
↓
Inventory → Procurement → Suppliers → Batch/Expiry → Reports
↓
Adherence → Refills → Consultation → ADR
↓
Security → RBAC → Audit Logs → Analytics → System Monitoring

The important distinction in Version 2 is that the System Administrator does not merely have "admin login." The administrator becomes responsible for the configuration, authorization, supervision, monitoring, security, data governance, user management, pharmacy onboarding, system content, operational oversight, reporting and proper functioning of every module, while the pharmacist's clinical authority remains protected. This preserves the proposal's central safety principle that software assists the pharmacist rather than replacing the pharmacist.


Patients ↔ Pharmacy Services into its own independently deployed microservice/application rather than making it another module inside the administrator/pharmacy system.

The key is to separate deployment and responsibilities, while still allowing the services to communicate through well-defined APIs/events.

                         INTERNET
                            |
                     API GATEWAY / BFF
                            |
             +--------------+--------------+
             |                             |
             v                             v
   PATIENT & PHARMACY                 CORE PHARMACY
       SERVICES                         MANAGEMENT
   Separate Deployment              Separate Deployment
             |                             |
       +-----+------+             +--------+---------+
       |            |             |        |          |
   Patient App   Pharmacy      Admin   Pharmacist  Owner
                 Services      Portal    Console    Portal
       |                            |
       +------------+---------------+
                    |
              SECURE SERVICE
              COMMUNICATION
                    |
          +---------+---------+
          |                   |
       PostgreSQL          Redis

The two major systems

You can think of the project as having two major independently deployed systems.

System A — Core Pharmacy Management System

This is the internal/business/administrative side.

It contains:

System Administrator
Pharmacy Owner
Pharmacist
Pharmacy Staff
Pharmacy management
Medicine catalogue administration
Inventory
Procurement
Suppliers
Dispensing
Pharmacy reporting
Pharmacy configuration
Security
Audit
Administration
System B — Patient & Pharmacy Services Platform

This is the patient-facing ecosystem.

It contains:

Patient registration/login
Medicine search
Cross-pharmacy availability
Prescription upload
Prescription status
Orders
Payments
Delivery/collection
Adherence
Refills
Patient-pharmacist consultation
Patient notifications
Patient medicine history
Patient-side ADR reporting

This corresponds closely to the proposal's patient-facing functionality, including medicine search, prescription upload, ordering, payment, reminders, consultation and ADR reporting.

Give them separate deployments

The architecture I would recommend for your project

I'd ultimately structure it as:
