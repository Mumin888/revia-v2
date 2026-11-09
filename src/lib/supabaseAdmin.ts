// ─────────────────────────────────────────────
//  REVIA — Supabase service-role client (server only)
//
//  Bypasses row level security, so it must never be imported by a client
//  component. It exists for the two lookups that need data ordinary members
//  should not be able to read: resolving a username to its e-mail at login,
//  and listing e-mails on the admin dashboard.
//
//  Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured; callers
//  then fall back to the signed-in user's own (restricted) client.
// ─────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
