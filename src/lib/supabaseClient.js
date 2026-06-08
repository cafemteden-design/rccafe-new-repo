import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Whether the Supabase frontend client is configured via environment variables.
 * Used so the existing site keeps working even before Supabase is wired up.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Supabase features are disabled until .env.local is configured.'
  )
}

/**
 * Reusable Supabase client for the frontend.
 *
 * Only the ANON (public) key is used here. The service role key must never be
 * referenced in frontend code. Row Level Security (RLS) protects all data.
 *
 * Will be `null` until the environment variables are provided, so importing
 * this module never crashes the existing booking/reward demo pages.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null

export default supabase
