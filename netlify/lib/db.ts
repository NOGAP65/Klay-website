// ---------------------------------------------------------------------------
// Supabase client for the functions.
//
// This uses the SERVICE ROLE key, which bypasses row level security entirely.
// It must never be constructed anywhere the browser can reach — that is why it
// lives under netlify/ and reads a non-VITE_ env var. The tables it writes to
// have RLS on with no public policies, so this is the only way in.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

let cached: SupabaseClient | null = null

export function db(): SupabaseClient {
  if (cached) return cached
  const e = env()
  cached = createClient(e.supabaseUrl, e.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-klay-source': 'netlify-function' } },
  })
  return cached
}
