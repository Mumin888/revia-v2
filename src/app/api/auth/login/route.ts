// ─────────────────────────────────────────────
//  REVIA — /api/auth/login
//
//  Signs a member in by username (or e-mail) on the server.
//  The username → e-mail lookup happens here so the address is never sent
//  to the browser, and the profiles table does not have to be readable by
//  signed-out visitors.
// ─────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { ilikeLiteral } from '@/lib/security';

const MAX_IDENTIFIER_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;

// One answer for "no such user" and "wrong password", so the endpoint
// cannot be used to find out which usernames exist.
function invalidCredentials() {
  return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
}

async function resolveEmail(username: string): Promise<string | null> {
  const pattern = ilikeLiteral(username);
  if (!pattern) return null;

  // Preferred: the service-role client, which works even when signed-out
  // visitors cannot read the profiles table.
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data } = await admin
      .from('profiles')
      .select('email')
      .ilike('username', pattern)
      .limit(2);
    return data?.length === 1 ? (data[0].email as string | null) : null;
  }

  // Fallback until SUPABASE_SERVICE_ROLE_KEY is configured: only succeeds
  // while the table's policies still allow this read.
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .ilike('username', pattern)
    .limit(2);
  return data?.length === 1 ? (data[0].email as string | null) : null;
}

export async function POST(request: NextRequest) {
  // Credentials are only accepted from this site's own pages.
  const origin = request.headers.get('origin');
  if (origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === request.headers.get('host');
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const fields = (body ?? {}) as Record<string, unknown>;
  const identifier = typeof fields.identifier === 'string' ? fields.identifier.trim() : '';
  const password = typeof fields.password === 'string' ? fields.password : '';

  if (
    !identifier ||
    !password ||
    identifier.length > MAX_IDENTIFIER_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const email = identifier.includes('@') ? identifier : await resolveEmail(identifier);
  if (!email) return invalidCredentials();

  // Signing in through the cookie-bound server client stores the session
  // cookies on this response.
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return invalidCredentials();

  return NextResponse.json({ ok: true }, { status: 200 });
}
