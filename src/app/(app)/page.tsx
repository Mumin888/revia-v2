// ─────────────────────────────────────────────
//  REVIA V2 — Home Dashboard
//  Strict alignment with globals.css & tailwind.config.ts
//  .animate-fade-in-up / .stagger-1…5 / .glass-panel / CSS vars
// ─────────────────────────────────────────────
import {
  Eye, BookmarkCheck, Star,
  Clapperboard, Sparkles, HeartHandshake, Compass,
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { MediaWithReview } from '@/lib/types';
import SectionRow from '@/components/SectionRow';
import MediaCard from '@/components/MediaCard';

export const dynamic = 'force-dynamic';

async function fetchAllMedia(): Promise<MediaWithReview[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('media_items')
    .select('*, reviews:media_reviews(*)')
    .order('id', { ascending: false });
  if (error) { console.error('[REVIA] fetchAllMedia error:', error.message); return []; }
  return (data ?? []) as MediaWithReview[];
}

function hasStatus(item: MediaWithReview, status: string, userName?: string, userId?: string) {
  if (userName || userId) {
    return item.reviews?.some(
      (r) =>
        ((userName && r.user_name.toLowerCase() === userName.toLowerCase()) ||
          (userId && r.user_id === userId)) &&
        r.status === status
    );
  }
  return item.reviews?.some((r) => r.status === status);
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
    : { data: null };

  const currentUsername =
    profile?.username ||
    (user?.user_metadata?.username as string) ||
    (user?.email ? user.email.split('@')[0] : 'عضو');

  const all = await fetchAllMedia();

  const watched     = all.filter((i) => hasStatus(i, 'watched'));
  const toWatch     = all.filter((i) => hasStatus(i, 'to_watch'));
  const recommended = all.filter((i) => hasStatus(i, 'recommended'));

  const myHighRatedItems = all.filter((item) =>
    item.reviews?.some(
      (r) =>
        (r.user_name.toLowerCase() === currentUsername.toLowerCase() ||
          (user && r.user_id === user.id)) &&
        ((r.rating ?? 0) >= 7 || r.status === 'recommended')
    )
  );
  const favoriteGenres = new Set(myHighRatedItems.flatMap((i) => i.genres ?? []));

  const tasteRecommendations = all.filter((item) => {
    if (hasStatus(item, 'watched', currentUsername, user?.id)) return false;
    return item.genres?.some((g) => favoriteGenres.has(g)) || hasStatus(item, 'recommended');
  });

  const partnerRecommendations = all.filter((item) => {
    if (hasStatus(item, 'watched', currentUsername, user?.id)) return false;
    return item.reviews?.some(
      (r) =>
        r.user_name.toLowerCase() !== currentUsername.toLowerCase() &&
        (!user || r.user_id !== user.id) &&
        ((r.rating ?? 0) >= 8 || r.status === 'recommended')
    );
  });

  return (
    <div className="flex flex-col min-h-dvh pb-28">

      {/* ── Hero Section ── .animate-fade-in-up .stagger-1 ── */}
      <header className="relative overflow-hidden px-5 pt-14 pb-8">
        {/* Ambient spot */}
        <div
          className="absolute -top-12 inset-x-0 h-80 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 320px at 50% 0%, rgba(245,166,35,0.18) 0%, rgba(232,121,249,0.06) 45%, transparent 75%)',
          }}
        />

        {/* ── Row 1: App Title — .animate-fade-in-up .stagger-1 ── */}
        <div className="relative z-10 text-right space-y-1.5 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 justify-end">
            {/* .text-gradient-amber-rose for main app title */}
            <h1 className="text-gradient-amber-rose text-3xl sm:text-4xl font-black tracking-widest">
              REVIA
            </h1>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center border"
              style={{
                background: 'linear-gradient(135deg, #fef08a 0%, #f5a623 50%, #e879f9 100%)',
                borderColor: 'rgba(245,166,35,0.4)',
                boxShadow: '0 0 25px rgba(245,166,35,0.4)',
              }}
            >
              <Clapperboard size={22} color="#050505" strokeWidth={2.8} />
            </div>
          </div>
          <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            مرحباً{' '}
            <span className="font-black" style={{ color: 'var(--text-primary)' }}>{currentUsername}</span>
            {' '}· سينمانا المشتركة
          </p>
        </div>

        {/* ── Row 2: Quick Actions — .animate-fade-in-up .stagger-2 ── */}
        <div className="relative z-10 flex items-center gap-3 mt-6 overflow-x-auto pb-1 scrollbar-none justify-end animate-fade-in-up stagger-2">
          <Link
            href="/compatibility"
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black whitespace-nowrap backdrop-blur-xl border transition-all duration-300 active:scale-97"
            style={{
              background: 'rgba(56,189,248,0.1)',
              borderColor: 'rgba(56,189,248,0.3)',
              color: '#38bdf8',
              boxShadow: '0 0 18px rgba(56,189,248,0.12)',
            }}
          >
            <HeartHandshake size={16} />
            <span>مقياس التوافق</span>
          </Link>
          <Link
            href="/discover"
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black whitespace-nowrap backdrop-blur-xl border transition-all duration-300 active:scale-97"
            style={{
              background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(232,121,249,0.1) 100%)',
              borderColor: 'rgba(245,166,35,0.4)',
              color: '#fef08a',
              boxShadow: '0 0 18px rgba(245,166,35,0.18)',
            }}
          >
            <Compass size={16} />
            <span>استكشاف المود</span>
          </Link>
        </div>

        {/* ── Row 3: Stats Grid — .glass-panel cards, .animate-fade-in-up .stagger-3 ── */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5 animate-fade-in-up stagger-3">
          {[
            { label: 'تمت المشاهدة',  value: watched.length,     color: '#34d399', glow: 'rgba(52,211,153,0.2)' },
            { label: 'قائمة المشاهدة', value: toWatch.length,     color: '#a5b4fc', glow: 'rgba(129,140,248,0.2)' },
            { label: 'توصيات مميزة',   value: recommended.length, color: '#e879f9', glow: 'rgba(232,121,249,0.2)' },
          ].map(({ label, value, color, glow }) => (
            <div
              key={label}
              /* .glass-panel + explicit overrides for colored glow border */
              className="glass-panel rounded-3xl py-4 px-2 text-center transition-all duration-300 hover:scale-103"
              style={{
                borderColor: `${color}40`,
                boxShadow: `0 8px 28px -6px ${glow}`,
              }}
            >
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-[11px] font-extrabold mt-1" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* ── Scroll Sections: each block is .animate-fade-in-up .stagger-N ── */}
      <div className="flex flex-col gap-10">

        {/* Partner Recommendations — stagger-4 */}
        {partnerRecommendations.length > 0 && (
          <div className="animate-fade-in-up stagger-4">
            <SectionRow
              title="شاهده شريكك ونرشحه لك"
              icon={Sparkles}
              iconColor="var(--accent-amber)"
              count={partnerRecommendations.length}
            >
              {partnerRecommendations.map((item, i) => (
                <MediaCard key={item.id} item={item} index={i} />
              ))}
            </SectionRow>
          </div>
        )}

        {/* Taste Recommendations — stagger-5 */}
        {tasteRecommendations.length > 0 && (
          <div className="animate-fade-in-up stagger-5">
            <SectionRow
              title="اقتراحات تناسب ذوقك السينمائي"
              icon={Compass}
              iconColor="#38bdf8"
              count={tasteRecommendations.length}
            >
              {tasteRecommendations.map((item, i) => (
                <MediaCard key={item.id} item={item} index={i} />
              ))}
            </SectionRow>
          </div>
        )}

        {/* Recently Watched — stagger-1 (next cycle) */}
        <div className="animate-fade-in-up stagger-1">
          <SectionRow
            title="أحدث المشاهدات"
            icon={Eye}
            iconColor="#34d399"
            count={watched.length}
            empty={
              <div
                className="glass-panel flex flex-col items-center gap-2.5 py-10 rounded-3xl text-center border-dashed"
                style={{ borderStyle: 'dashed', borderColor: 'var(--border-subtle)' }}
              >
                <Eye size={30} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  لم تتم مشاهدة أي أعمال بعد
                </p>
              </div>
            }
          >
            {watched.map((item, i) => <MediaCard key={item.id} item={item} index={i} />)}
          </SectionRow>
        </div>

        {/* Watchlist — stagger-2 */}
        <div className="animate-fade-in-up stagger-2">
          <SectionRow
            title="قائمة المشاهدة"
            icon={BookmarkCheck}
            iconColor="#818cf8"
            count={toWatch.length}
            empty={
              <div
                className="glass-panel flex flex-col items-center gap-2.5 py-10 rounded-3xl text-center"
                style={{ borderStyle: 'dashed', borderColor: 'var(--border-subtle)' }}
              >
                <BookmarkCheck size={30} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  قائمة المشاهدة فارغة — أضيفوا عناوين جديدة من البحث
                </p>
              </div>
            }
          >
            {toWatch.map((item, i) => <MediaCard key={item.id} item={item} index={i} />)}
          </SectionRow>
        </div>

        {/* Recommendations — stagger-3 */}
        <div className="animate-fade-in-up stagger-3">
          <SectionRow
            title="توصيات خاصة"
            icon={Star}
            iconColor="var(--accent-rose)"
            count={recommended.length}
            empty={
              <div
                className="glass-panel flex flex-col items-center gap-2.5 py-10 rounded-3xl text-center"
                style={{ borderStyle: 'dashed', borderColor: 'var(--border-subtle)' }}
              >
                <Star size={30} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  لا توجد توصيات حتى الآن
                </p>
              </div>
            }
          >
            {recommended.map((item, i) => <MediaCard key={item.id} item={item} index={i} />)}
          </SectionRow>
        </div>

      </div>
    </div>
  );
}
