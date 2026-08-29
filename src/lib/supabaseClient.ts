// ─────────────────────────────────────────────
//  REVIA — Supabase Browser Client (lazy singleton)
//
//  We intentionally defer createBrowserClient() to the first call of
//  getSupabaseClient() so that module-level imports never throw during
//  Next.js static prerendering (when env vars aren't available).
// ─────────────────────────────────────────────
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        '[REVIA] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
          'Make sure your .env.local file exists and the dev server was restarted.'
      );
    }

    _supabase = createBrowserClient(url, key);
  }
  return _supabase;
}

// Convenience proxy — property access is lazy so the getter fires at
// call-site, not at import time.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
