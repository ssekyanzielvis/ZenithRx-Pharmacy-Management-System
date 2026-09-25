export type BackupType =
  | 'full_snapshot'
  | 'differential'
  | 'wal_archive_stream'
  | 'cold_vault_archive'
  | 'table_level_export';

export type BackupStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'verified_valid'
  | 'checksum_mismatch'
  | 'failed'
  | 'purged';

export type StorageTier =
  | 'hot_storage_fast_restore'
  | 'nearline_secondary_region'
  | 'cold_vault_worm_immutable'
  | 'air_gapped_offline';

export type DrillType =
  | 'automated_sandbox_test'
  | 'pitr_point_in_time_drill'
  | 'multi_region_failover_drill'
  | 'cold_storage_rehydration_drill'
  | 'table_integrity_checksum_drill';

export type DrillVerdict =
  | 'passed_rto_compliant'
  | 'passed_with_warnings'
  | 'failed_checksum_error'
  | 'failed_rto_exceeded'
  | 'failed_missing_wal_segments';

export interface BackupDRPolicy {
  id: string;
  policy_name: string;
  target_rpo_minutes: number;
  target_rto_minutes: number;
  full_backup_cron: string;
  differential_backup_cron: string;
  wal_archiving_interval_seconds: number;
  retention_daily_days: number;
  retention_weekly_weeks: number;
  retention_monthly_months: number;
  retention_annual_years: number;
  encryption_algorithm: string;
  kms_key_provider: string;
  immutability_worm_enabled: boolean;
  multi_region_replication_enabled: boolean;
  primary_region: string;
  secondary_dr_region: string;
  automated_drill_frequency_days: number;
  is_active: boolean;
  updated_at: string;
}

export interface BackupSnapshot {
  id: string;
  snapshot_tag: string;
  backup_type: BackupType;
  status: BackupStatus;
  storage_tier: StorageTier;
  source_database: string;
  source_version: string;
  backup_size_bytes: number;
  compressed_size_bytes: number;
  encryption_algorithm: string;
  kms_key_arn: string;
  checksum_sha256: string;
  storage_bucket_url: string;
  offsite_replica_url?: string;
  wal_start_lsn?: string;
  wal_end_lsn?: string;
  rpo_lag_at_capture_seconds: number;
  started_at: string;
  completed_at?: string;
  retention_expires_at: string;
  is_immutable_locked: boolean;
  verification_count: number;
  last_verified_at?: string;
  created_by_user_id?: string;
}

export interface DRRestoreDrill {
  id: string;
  drill_code: string;
  snapshot_id: string;
  drill_type: DrillType;
  target_sandbox_environment: string;
  verdict: DrillVerdict;
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
  target_rto_seconds: number;
  rto_achieved_seconds: number;
  tables_restored_count: number;
  rows_verified_count: number;
  checksum_verified: boolean;
  sample_queries_passed: boolean;
  discrepancies_found?: string;
  signed_off_by?: string;
  notes?: string;
}

export interface DRReplicationNode {
  id: string;
  node_name: string;
  role: 'primary_rw' | 'hot_standby_sync' | 'warm_standby_async' | 'cold_vault';
  region: string;
  endpoint_host: string;
  replication_mode: string;
  replication_lag_bytes: number;
  replication_lag_seconds: number;
  health_status: 'healthy_online' | 'degraded_lag' | 'offline_failed';
  uptime_percentage: number;
  last_heartbeat_at: string;
  is_failover_ready: boolean;
}

export interface DRIncidentRunbook {
  id: string;
  runbook_code: string;
  title: string;
  severity: 'P1_CRITICAL' | 'P2_MAJOR' | 'P3_MODERATE';
  scenario_description: string;
  estimated_rto_minutes: number;
  trigger_criteria: string;
  pre_flight_checks: string[];
  action_steps: Array<{ step: number; action: string }>;
  rollback_procedure: string;
  communication_protocols: Array<{ role: string; channel: string }>;
  last_tested_date?: string;
}
