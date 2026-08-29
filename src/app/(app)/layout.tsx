// ─────────────────────────────────────────────
//  REVIA — Authenticated App Shell Layout
//  Server Component: verifies session, then
//  renders the page + bottom navigation bar.
// ─────────────────────────────────────────────
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import BottomNav from '@/components/BottomNav';
import HiddenScrollQuote from '@/components/HiddenScrollQuote';
import ShakeToShuffle from '@/components/ShakeToShuffle';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Page content — padded at bottom so bottom nav doesn't overlap */}
      <main className="flex-1 safe-pb overflow-x-hidden">
        {children}
        <HiddenScrollQuote />
      </main>

      <ShakeToShuffle />
      <BottomNav />
    </div>
  );
}
