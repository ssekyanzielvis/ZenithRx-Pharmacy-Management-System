# ZenithRx Enterprise Backup & Disaster Recovery (DR) Plan

**Document Version:** 2.4.0  
**Classification:** Tier-1 Critical Infrastructure / Healthcare Compliance  
**Last Review:** September 2026  
**Audience:** System Administrators, Principal SREs, Lead DBAs, Chief Technology Officer, Regulatory Auditors

---

## 1. Executive Summary & Core Objectives

ZenithRx Pharmacy Management System handles clinical prescriptions, drug dispensing, controlled substances register, inventory batches, financial ledgers, and National Drug Authority (NDA) audit trails. Business continuity is paramount.

This document establishes the official **Backup, Replication, Failover, and Disaster Recovery Architecture**, mandating strict adherence to **Recovery Point Objective (RPO)** and **Recovery Time Objective (RTO)** Service Level Agreements (SLAs).

| Metric | Target SLA | Production Architecture Implementation |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **≤ 15 Minutes** *(Default)*<br>*(≤ 24h absolute disaster boundary)* | Continuous PostgreSQL Write-Ahead Log (WAL) streaming + 5-minute archive intervals + Daily Differential Snapshots |
| **Recovery Time Objective (RTO)** | **≤ 60 Minutes** *(Hot Standby: ≤ 5 mins)*<br>*(≤ 4h cold rebuild boundary)* | Automated Multi-AZ synchronous hot standby with instant failover switchboard + automated sandbox restore drills |
| **Data Immutability (WORM)** | **100% Enforced** | S3/GCS Object Lock in Compliance Mode (Write Once, Read Many) preventing deletion even with root credentials |
| **Backup Retention** | **7 Years** | 30-day daily hot tier → 2-year weekly/monthly nearline tier → 7-year regulatory cold vault (Glacier Deep Archive) |
| **Restore Verification Rate** | **Weekly Automated** | Ephemeral container test restore with checksum verification and synthetic clinical transaction validation |

---

## 2. The 3-2-1-1-0 Enterprise Backup Strategy

ZenithRx enforces an enhanced **3-2-1-1-0** data resiliency framework:

```
[ Primary Production DB (af-south-1 AZ-1) ]
       │
       ├─► (Synchronous Streaming) ──► [ Hot Standby Replica (af-south-1 AZ-2) ]
       │
       ├─► (Continuous WAL Shipping) ─► [ S3 Primary Bucket (AES-256-GCM Encrypted) ]
       │                                       │
       │                                       ▼ Cross-Region Replication (CRR)
       │                                [ EU Central / Frankfurt Secondary Vault ]
       │                                       │
       └─► (Weekly Cold Vault Snapshot) ───────┴─► [ Immutable WORM Cloud Storage (7-Year Lock) ]
                                                       │
                                                       ▼ (Weekly Automated Drill)
                                                [ Ephemeral Sandbox Restore & Checksum Validation ]
                                                (0 Errors Verified)
```

1. **3 Copies of Data:** Primary live database, synchronous hot replica, and encrypted backup archives.
2. **2 Different Storage Media:** High-speed NVMe block storage (live nodes) + Object Storage with distinct hardware layer.
3. **1 Off-Site Location:** Asynchronous cross-region replication to a secondary cloud region (Frankfurt / EU-Central).
4. **1 Immutable (Air-gapped) Copy:** Object Lock enabled in Compliance Mode with zero-deletion policies.
5. **0 Restore Errors:** Weekly automated sandbox restores that continuously verify SHA-256 checksums and table row parity.

---

## 3. Cryptographic Security & Envelope Encryption

All backup artifacts are secured using **AES-256-GCM** with hardware-backed Key Management Service (AWS KMS / GCP Cloud KMS / HashiCorp Vault):

* **Envelope Encryption:** Each snapshot archive is encrypted using a unique 256-bit Data Encryption Key (DEK). The DEK is encrypted under a KMS Customer Master Key (CMK) with automated 90-day key rotation.
* **Integrity Hash:** Every snapshot generation computes an immutable **SHA-256 Checksum** recorded in the primary catalog before upload.
* **In-Transit Protection:** TLS 1.3 with PFS (Perfect Forward Secrecy) enforced across all replication channels and database interconnects.

---

## 4. Multi-Tier Retention Policy (Grandfather-Father-Son)

| Tier | Backup Frequency | Target Storage Tier | Retention Period | Immutability |
| :--- | :--- | :--- | :--- | :--- |
| **WAL Continuous** | Every 5 minutes (Continuous) | S3 Standard / Multi-AZ | 30 Days | Enabled |
| **Daily Differential** | Daily at 02:00 UTC | S3 Standard-IA | 90 Days | Enabled |
| **Weekly Full** | Every Sunday at 01:00 UTC | S3 Standard-IA / Nearline | 1 Year | Object Lock (1 Yr) |
| **Monthly Snapshot** | 1st of each month | Cold Glacier Archive | 2 Years | Object Lock (2 Yrs) |
| **Annual Audit Vault** | Dec 31st Annual Archive | Glacier Deep Archive WORM | **7 Years** *(NDA Req)* | Compliance Lock (7 Yrs) |

---

## 5. Step-by-Step Disaster Recovery Runbooks

### Runbook 1: Primary Node Failure (RTO ≤ 15 Minutes)
1. **Detection:** Heartbeat loss detected across 3 independent health monitors for > 45 seconds.
2. **Pre-flight:** Verify standby node replication lag is `< 1000ms`.
3. **Promotion:** Issue `pg_ctl promote` or orchestrator failover command to promote Hot Standby to Primary Read-Write.
4. **DNS Switch:** Update internal database DNS CNAME (`db.zenithrx.internal`) pointing to promoted node.
5. **PgBouncer Reconnect:** Execute connection pool flush to redirect all web/API backend instances.
6. **Health Verification:** Query `SELECT COUNT(*) FROM prescriptions WHERE created_at > NOW() - INTERVAL '1 hour'` to confirm integrity.

### Runbook 2: Point-In-Time Recovery (PITR) for Data Corruption (RTO ≤ 45 Minutes)
1. **Incident Triage:** Identify the exact timestamp `$CORRUPTION_TIME` prior to corrupted transaction or accidental deletion.
2. **Ingress Lock:** Place ZenithRx API in maintenance read-only mode to prevent new writes.
3. **Base Restore:** Deploy a new database instance and stream the nearest base snapshot prior to `$CORRUPTION_TIME`.
4. **WAL Replay:** Configure `recovery_target_time = '$CORRUPTION_TIME'` and replay WAL segments up to the exact transaction boundary.
5. **Validation:** Execute automated integrity checks across prescriptions, inventory batches, and financial ledger tables.
6. **Production Cutover:** Switch connection string or routing layer to restored instance and lift maintenance lock.

---

## 6. Restore Verification Drills (SLA Assurance)

Restores are not theoretical; they are continuously tested:

* **Frequency:** Every Sunday at 04:00 UTC (automated) + Quarterly Manual Simulation.
* **Sandbox Environment:** Automated ephemeral container deployed with isolated network boundaries.
* **Verification Checks:**
  1. Full table schema & constraint verification (100% table match).
  2. Row count and SHA-256 hash match against source metadata.
  3. Execution of 50 synthetic read queries simulating POS dispensing, batch lookup, and customer accounts.
  4. Automatic generation of a signed **Drill Certificate & Audit Log** for regulatory review.
