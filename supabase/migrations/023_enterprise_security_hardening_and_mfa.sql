-- ============================================================================
-- Migration: 023_enterprise_security_hardening_and_mfa.sql
-- Description: Enterprise Multi-Factor Authentication (MFA), Password Policies,
--              Session Security, Rate Limiting, Threat Detection & SIEM Engine.
-- ============================================================================

-- Enum Types for MFA & Security
DO $$ BEGIN
    CREATE TYPE mfa_method_enum AS ENUM (
        'totp_authenticator',
        'webauthn_fido2',
        'sms_otp',
        'email_otp',
        'emergency_recovery_code'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE threat_severity_enum AS ENUM (
        'CRITICAL',
        'HIGH',
        'MEDIUM',
        'LOW'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE threat_event_enum AS ENUM (
        'brute_force_attack',
        'excessive_failed_logins',
        'impossible_travel',
        'session_hijack_attempt',
        'unauthorized_admin_access',
        'rate_limit_violation',
        'credential_stuffing',
        'controlled_drug_after_hours'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. User MFA Configuration & Credentials Table
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_mfa_enforced BOOLEAN NOT NULL DEFAULT false, -- Mandatory for Admins, Owners, Pharmacists
    is_mfa_active BOOLEAN NOT NULL DEFAULT false,
    primary_method mfa_method_enum NOT NULL DEFAULT 'totp_authenticator',
    totp_secret_encrypted TEXT, -- AES-256 encrypted TOTP secret
    backup_codes_hashes TEXT[] DEFAULT '{}', -- Array of SHA-256 hashed recovery codes
    backup_codes_remaining INTEGER NOT NULL DEFAULT 8,
    failed_mfa_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_mfa_verified_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_mfa_user_id UNIQUE (user_id)
);

-- 2. Enterprise Password Policy Configuration
CREATE TABLE IF NOT EXISTS public.password_security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(100) NOT NULL DEFAULT 'ZenithRx Healthcare Grade Password Policy',
    min_length INTEGER NOT NULL DEFAULT 12,
    require_uppercase BOOLEAN NOT NULL DEFAULT true,
    require_lowercase BOOLEAN NOT NULL DEFAULT true,
    require_number BOOLEAN NOT NULL DEFAULT true,
    require_special_char BOOLEAN NOT NULL DEFAULT true,
    prevent_password_reuse_count INTEGER NOT NULL DEFAULT 5, -- Cannot reuse last 5 passwords
    max_consecutive_failed_attempts INTEGER NOT NULL DEFAULT 5, -- Account lockout trigger
    lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
    password_expiry_days_admin INTEGER NOT NULL DEFAULT 90, -- 90 Days for Pharmacists / Admins
    password_expiry_days_staff INTEGER NOT NULL DEFAULT 180,
    session_idle_timeout_minutes INTEGER NOT NULL DEFAULT 15, -- Auto session lock after 15m idle
    enforce_mfa_for_privileged_roles BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Password History Table (Prevents Password Reuse)
CREATE TABLE IF NOT EXISTS public.user_password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Active Device Sessions & Refresh Token Tracker
CREATE TABLE IF NOT EXISTS public.user_active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'Desktop',
    operating_system VARCHAR(50) NOT NULL DEFAULT 'Windows',
    browser_name VARCHAR(50) NOT NULL DEFAULT 'Chrome',
    country VARCHAR(100) DEFAULT 'Uganda',
    city VARCHAR(100) DEFAULT 'Kampala',
    is_current_session BOOLEAN NOT NULL DEFAULT false,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_reason TEXT,
    refresh_token_family_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 hours')
);

-- 5. Suspicious Threat Events & SIEM Incident Logs
CREATE TABLE IF NOT EXISTS public.security_threat_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code VARCHAR(50) NOT NULL UNIQUE,
    event_type threat_event_enum NOT NULL,
    severity threat_severity_enum NOT NULL DEFAULT 'HIGH',
    ip_address VARCHAR(45) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_auto_mitigated BOOLEAN NOT NULL DEFAULT true,
    mitigation_action VARCHAR(100) NOT NULL, -- 'ip_quarantined_1hr', 'session_terminated', 'account_temporarily_locked'
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. IP Rate Limiting, Quarantine & Whitelist Registry
CREATE TABLE IF NOT EXISTS public.ip_security_quarantine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    failed_attempts_window INTEGER NOT NULL DEFAULT 1,
    total_violations_count INTEGER NOT NULL DEFAULT 1,
    is_quarantined BOOLEAN NOT NULL DEFAULT false,
    quarantine_reason VARCHAR(255),
    quarantined_at TIMESTAMPTZ,
    quarantine_expires_at TIMESTAMPTZ,
    is_whitelisted BOOLEAN NOT NULL DEFAULT false,
    whitelist_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Speed & Fast Lookups
CREATE INDEX IF NOT EXISTS idx_user_active_sessions_user ON public.user_active_sessions(user_id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_security_threat_events_severity ON public.security_threat_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_quarantine_ip ON public.ip_security_quarantine(ip_address, is_quarantined);

-- 7. Seed Password Policy
INSERT INTO public.password_security_policies (
    policy_name,
    min_length,
    require_uppercase,
    require_lowercase,
    require_number,
    require_special_char,
    prevent_password_reuse_count,
    max_consecutive_failed_attempts,
    lockout_duration_minutes,
    password_expiry_days_admin,
    session_idle_timeout_minutes,
    enforce_mfa_for_privileged_roles
) VALUES (
    'ZenithRx Healthcare Grade Password & Access Policy',
    12,
    true,
    true,
    true,
    true,
    5,
    5,
    30,
    90,
    15,
    true
) ON CONFLICT DO NOTHING;

-- Seed Sample Threat Events (e.g., 30 Failed Logins Trigger)
INSERT INTO public.security_threat_events (
    event_code,
    event_type,
    severity,
    ip_address,
    user_email,
    description,
    is_auto_mitigated,
    mitigation_action,
    is_resolved,
    created_at
) VALUES 
(
    'SEC-THR-2026-001',
    'excessive_failed_logins',
    'CRITICAL',
    '197.239.4.12',
    'admin@zenithrx.com',
    '30 consecutive failed login attempts detected within 60 seconds from IP 197.239.4.12 targeting administrator accounts. Automated rate limit triggered.',
    true,
    'ip_quarantined_24hr',
    false,
    NOW() - INTERVAL '2 hours'
),
(
    'SEC-THR-2026-002',
    'impossible_travel',
    'HIGH',
    '102.134.88.9',
    'pharmacist.elvis@zenithrx.com',
    'Geographically impossible login velocity detected: Session initiated in Kampala, Uganda followed by login in Frankfurt, Germany 4 minutes later.',
    true,
    'session_terminated_and_mfa_forced',
    true,
    NOW() - INTERVAL '1 day'
),
(
    'SEC-THR-2026-003',
    'rate_limit_violation',
    'MEDIUM',
    '41.210.144.55',
    'unknown',
    'API request flood (450 requests/sec) against /api/prescriptions/search exceeding token bucket limit (100 req/min).',
    true,
    'http_429_throttled_with_retry_after',
    true,
    NOW() - INTERVAL '3 hours'
)
ON CONFLICT DO NOTHING;

-- Seed Sample Quarantined IP
INSERT INTO public.ip_security_quarantine (
    ip_address,
    failed_attempts_window,
    total_violations_count,
    is_quarantined,
    quarantine_reason,
    quarantined_at,
    quarantine_expires_at
) VALUES (
    '197.239.4.12',
    30,
    3,
    true,
    'Automated Quarantine: >30 Failed authentication requests in 60 seconds (Brute-Force Pattern)',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '22 hours'
) ON CONFLICT DO NOTHING;

-- 8. Stored Procedure: Record Failed Login & Automated Brute Force Triage
CREATE OR REPLACE FUNCTION record_and_evaluate_failed_login(
    p_ip VARCHAR(45),
    p_email VARCHAR(255)
)
RETURNS JSONB AS $$
DECLARE
    v_attempts INTEGER;
    v_is_quarantined BOOLEAN := false;
    v_threat_code VARCHAR(50);
BEGIN
    -- Upsert IP Quarantine record
    INSERT INTO public.ip_security_quarantine (ip_address, failed_attempts_window, total_violations_count)
    VALUES (p_ip, 1, 1)
    ON CONFLICT (ip_address) DO UPDATE
    SET failed_attempts_window = public.ip_security_quarantine.failed_attempts_window + 1,
        total_violations_count = public.ip_security_quarantine.total_violations_count + 1,
        updated_at = NOW()
    RETURNING failed_attempts_window INTO v_attempts;

    -- If >= 30 failed attempts, immediately quarantine IP and log CRITICAL SIEM threat
    IF v_attempts >= 30 THEN
        UPDATE public.ip_security_quarantine
        SET is_quarantined = true,
            quarantine_reason = 'Automated Quarantine: Exceeded 30 failed login attempts (Brute Force Protection)',
            quarantined_at = NOW(),
            quarantine_expires_at = NOW() + INTERVAL '24 hours'
        WHERE ip_address = p_ip;

        v_is_quarantined := true;
        v_threat_code := 'SEC-THR-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');

        INSERT INTO public.security_threat_events (
            event_code,
            event_type,
            severity,
            ip_address,
            user_email,
            description,
            is_auto_mitigated,
            mitigation_action
        ) VALUES (
            v_threat_code,
            'excessive_failed_logins',
            'CRITICAL',
            p_ip,
            p_email,
            '30 failed logins from single IP detected (' || p_ip || '). Automated IP quarantine applied for 24 hours.',
            true,
            'ip_quarantined_24hr'
        );
    END IF;

    RETURN jsonb_build_object(
        'ip_address', p_ip,
        'current_failed_attempts', v_attempts,
        'is_quarantined', v_is_quarantined,
        'lockout_threshold', 30
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Stored Procedure: Revoke All Active Sessions for a User
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'User initiated emergency session revocation'
)
RETURNS INTEGER AS $$
DECLARE
    v_revoked_count INTEGER;
BEGIN
    UPDATE public.user_active_sessions
    SET is_revoked = true,
        revoked_reason = p_reason,
        expires_at = NOW()
    WHERE user_id = p_user_id AND is_revoked = false;

    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
    RETURN v_revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
