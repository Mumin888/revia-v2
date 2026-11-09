// ─────────────────────────────────────────────
//  REVIA — Auth guard for Route Handlers
//
//  The middleware skips /api/*, so every data route checks the session
//  itself. getUser() verifies the token with Supabase rather than trusting
//  whatever the cookie claims.
// ─────────────────────────────────────────────
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function getApiUser(): Promise<User | null> {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
