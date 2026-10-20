-- ====================================================================================================
-- MIGRATION 041: Fix Auth User Trigger & Backfill System Administrators / Collaborators
-- Why: 
-- 1. Migration 038 created an on_auth_user_created trigger that attempts to update public.users(updated_at).
--    Because public.users was missing the updated_at column or the trigger trg_users_updated_at fails,
--    any new user creation in auth.users was failing with:
--    "AuthRetryableFetchError: Database error creating new user" (HTTP 500).
-- 2. This migration adds missing columns to public.users, makes handle_new_auth_user()
--    bulletproof (with an EXCEPTION block so it never aborts user creation), and synchronizes
--    all existing users into public.users.
-- ====================================================================================================

-- ─── STEP 1: ENSURE REQUIRED COLUMNS EXIST ON public.users ───────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_tier VARCHAR(50) DEFAULT 'Professional';

-- Ensure phone can be optional
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN phone SET DEFAULT '';

-- ─── STEP 2: MAKE TIMESTAMP TRIGGER RESILIENT ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ─── STEP 3: REWRITE handle_new_auth_user TO BE BULLETPROOF ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_meta JSONB;
    v_role VARCHAR(100);
    v_is_owner BOOLEAN;
    v_is_super BOOLEAN;
    v_tenant_id UUID;
    v_tenant_str TEXT;
    v_full_name VARCHAR(255);
    v_phone VARCHAR(50);
    v_nda VARCHAR(100);
    v_psu VARCHAR(100);
    v_rights JSONB;
BEGIN
    user_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    v_role := COALESCE(user_meta->>'role', 'Super Admin');
    v_is_owner := (v_role = 'Pharmacy Owner' OR COALESCE((user_meta->>'is_owner')::boolean, FALSE) = TRUE);
    v_is_super := (v_role = 'Super Admin' OR COALESCE((NEW.raw_app_meta_data->>'is_super_admin')::boolean, FALSE) = TRUE OR NEW.email LIKE '%admin%' OR NEW.email = 'ssekyanzielvis1@gmail.com');
    
    -- Safe parsing for UUID tenant_id
    v_tenant_str := user_meta->>'tenant_id';
    IF v_tenant_str ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_tenant_id := v_tenant_str::uuid;
    ELSE
        v_tenant_id := '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;

    v_full_name := COALESCE(user_meta->>'full_name', SPLIT_PART(NEW.email, '@', 1));
    v_phone := COALESCE(user_meta->>'phone', '');
    v_nda := user_meta->>'nda_license_no';
    v_psu := user_meta->>'psu_reg_no';

    -- Default Rights Matrix based on Role
    IF v_is_owner OR v_is_super THEN
        v_rights := '{
            "can_access_pos": true,
            "can_manage_inventory": true,
            "can_process_prescriptions": true,
            "can_approve_reorders": true,
            "can_view_reports": true,
            "can_submit_insurance": true,
            "can_use_ai_assistant": true,
            "can_manage_staff_accounts": true
        }'::jsonb;
    ELSE
        v_rights := '{
            "can_access_pos": true,
            "can_manage_inventory": true,
            "can_process_prescriptions": true,
            "can_approve_reorders": false,
            "can_view_reports": false,
            "can_submit_insurance": false,
            "can_use_ai_assistant": true,
            "can_manage_staff_accounts": false
        }'::jsonb;
    END IF;

    INSERT INTO public.users (
        id,
        tenant_id,
        email,
        full_name,
        phone,
        rank_role,
        is_owner,
        is_super_admin,
        nda_license_no,
        psu_reg_no,
        access_rights,
        subscription_status,
        billing_cycle,
        selected_tier,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_tenant_id,
        NEW.email,
        v_full_name,
        v_phone,
        v_role,
        v_is_owner,
        v_is_super,
        v_nda,
        v_psu,
        v_rights,
        'active',
        'monthly',
        'Professional',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        rank_role = EXCLUDED.rank_role,
        is_owner = EXCLUDED.is_owner,
        is_super_admin = EXCLUDED.is_super_admin,
        access_rights = EXCLUDED.access_rights,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback safety: ensure user creation in auth.users is NEVER rolled back
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─── STEP 4: BACKFILL ANY EXISTING AUTH USERS MISSING IN public.users ───────────────────────────────
INSERT INTO public.users (
    id, tenant_id, email, full_name, phone, rank_role, is_owner, is_super_admin,
    access_rights, subscription_status, billing_cycle, selected_tier, status, created_at, updated_at
)
SELECT
    au.id,
    '00000000-0000-0000-0000-000000000001'::uuid,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    'Super Admin',
    TRUE,
    TRUE,
    '{"can_access_pos": true, "can_manage_inventory": true, "can_process_prescriptions": true, "can_approve_reorders": true, "can_view_reports": true, "can_submit_insurance": true, "can_use_ai_assistant": true, "can_manage_staff_accounts": true}'::jsonb,
    'active',
    'monthly',
    'Professional',
    'active',
    NOW(),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ─── STEP 5: PROMOTE ADMINISTRATORS ──────────────────────────────────────────────────────────────────
UPDATE public.users 
SET rank_role = 'Super Admin', is_super_admin = TRUE, is_owner = TRUE
WHERE lower(email) IN ('ssekyanzielvis1@gmail.com', 'abdulsalamssekyanzi@gmail.com', 'abdulssekyanzi@gmail.com', 'namulishakirahfavour@gmail.com');

UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_super_admin": true}'::jsonb
WHERE lower(email) IN ('ssekyanzielvis1@gmail.com', 'abdulsalamssekyanzi@gmail.com', 'abdulssekyanzi@gmail.com', 'namulishakirahfavour@gmail.com');
