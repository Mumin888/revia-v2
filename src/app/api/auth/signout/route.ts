import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();

  const url = new URL('/login', request.url);
  return NextResponse.redirect(url, { status: 302 });
}
