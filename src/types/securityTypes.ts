export type MFAMethod =
  | 'totp_authenticator'
  | 'webauthn_fido2'
  | 'sms_otp'
  | 'email_otp'
  | 'emergency_recovery_code';

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ThreatEventType =
  | 'brute_force_attack'
  | 'excessive_failed_logins'
  | 'impossible_travel'
  | 'session_hijack_attempt'
  | 'unauthorized_admin_access'
  | 'rate_limit_violation'
  | 'credential_stuffing'
  | 'controlled_drug_after_hours';

export interface UserMFASettings {
  id: string;
  user_id: string;
  is_mfa_enforced: boolean;
  is_mfa_active: boolean;
  primary_method: MFAMethod;
  backup_codes_remaining: number;
  failed_mfa_attempts: number;
  locked_until?: string;
  last_mfa_verified_at?: string;
  enrolled_at: string;
}

export interface PasswordSecurityPolicy {
  id: string;
  policy_name: string;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_number: boolean;
  require_special_char: boolean;
  prevent_password_reuse_count: number;
  max_consecutive_failed_attempts: number;
  lockout_duration_minutes: number;
  password_expiry_days_admin: number;
  password_expiry_days_staff: number;
  session_idle_timeout_minutes: number;
  enforce_mfa_for_privileged_roles: boolean;
  is_active: boolean;
  updated_at: string;
}

export interface UserActiveSession {
  id: string;
  session_token_hash: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  operating_system: string;
  browser_name: string;
  country: string;
  city: string;
  is_current_session: boolean;
  is_revoked: boolean;
  revoked_reason?: string;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
}

export interface SecurityThreatEvent {
  id: string;
  event_code: string;
  event_type: ThreatEventType;
  severity: ThreatSeverity;
  ip_address: string;
  user_email?: string;
  description: string;
  is_auto_mitigated: boolean;
  mitigation_action: string;
  is_resolved: boolean;
  resolved_notes?: string;
  created_at: string;
}

export interface IPQuarantineRecord {
  id: string;
  ip_address: string;
  failed_attempts_window: number;
  total_violations_count: number;
  is_quarantined: boolean;
  quarantine_reason?: string;
  quarantined_at?: string;
  quarantine_expires_at?: string;
  is_whitelisted: boolean;
  whitelist_notes?: string;
}
