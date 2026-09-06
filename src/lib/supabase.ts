/**
 * supabase.ts — ZenithRx Supabase Browser Client
 * Single instance — import this wherever you need database access in the frontend.
 * Clean Architecture: Infrastructure Layer
 *
 * IMPORTANT: This client uses the ANON key and relies on Row-Level Security (RLS)
 * policies to enforce tenant isolation. Never put the SERVICE_ROLE_KEY here.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Whether Supabase is configured in the environment */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon);

let _client: SupabaseClient<Database> | null = null;

/**
 * Returns the singleton Supabase client.
 * Throws if VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!_client) {
    if (!supabaseUrl || !supabaseAnon) {
      throw new Error(
        '[ZenithRx] Supabase is not configured. ' +
        'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
      );
    }
    _client = createClient<Database>(supabaseUrl, supabaseAnon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'zenithrx-auth-token',
      },
    });
  }
  return _client;
}

/** Convenience export — call getSupabaseClient() if you need error handling */
export const supabase = isSupabaseConfigured ? getSupabaseClient() : null;
