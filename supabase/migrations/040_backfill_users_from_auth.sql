-- ====================================================================================================
-- MIGRATION 040: Backfill public.users from auth.users
-- Why: accounts created before trigger 038 existed (or while it was failing) never got a row in
--      public.users, so the Users table looked empty. This is idempotent and safe to re-run.
-- ====================================================================================================

-- Backfill every auth user that has no profile row yet.
INSERT INTO public.users (id, tenant_id, email, full_name, phone, rank_role, is_owner, is_super_admin,
                          access_rights, subscription_status, billing_cycle, selected_tier)
SELECT
    au.id,
    COALESCE(
        CASE WHEN au.raw_user_meta_data->>'tenant_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             THEN (au.raw_user_meta_data->>'tenant_id')::uuid END,
        '00000000-0000-0000-0000-000000000001'::uuid),
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    COALESCE(au.raw_user_meta_data->>'role', 'Pharmacy Owner'),
    COALESCE(au.raw_user_meta_data->>'role', 'Pharmacy Owner') = 'Pharmacy Owner',
    COALESCE((au.raw_app_meta_data->>'is_super_admin')::boolean, FALSE),
    '{"can_access_pos": true, "can_manage_inventory": true, "can_process_prescriptions": true,
      "can_approve_reorders": true, "can_view_reports": true, "can_submit_insurance": true,
      "can_use_ai_assistant": true, "can_manage_staff_accounts": true}'::jsonb,
    'active', 'monthly', 'Professional'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ON CONFLICT (id) DO NOTHING;
