// ─────────────────────────────────────────────
//  REVIA V2 — Home Dashboard
//  Activity feed distinguishes current user from others.
// ─────────────────────────────────────────────
import {
  Eye, BookmarkCheck, Star,
  Sparkles, HeartHandshake, Compass, Users,
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { MediaWithReview } from '@/lib/types';
import SectionRow from '@/components/SectionRow';
import MediaCard from '@/components/MediaCard';
import LogoTap from '@/components/LogoTap';
import MidnightBanner from '@/components/MidnightBanner';

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

function filterByStatus(
  items: MediaWithReview[],
  status: string,
  userName?: string,
  userId?: string
): MediaWithReview[] {
  return items.filter((item) =>
    item.reviews?.some((r) => {
      const matchUser = userName
        ? r.user_name.toLowerCase() === userName.toLowerCase()
        : true;
      const matchId = userId ? r.user_id === userId : true;
      const eitherMatch = userName || userId ? (matchUser || matchId) : true;
      return eitherMatch && r.status === status;
    })
  );
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

  // ── My activity ────────────────────────────────────────────
  const myWatched     = filterByStatus(all, 'watched',     currentUsername, user?.id);
  const myToWatch     = filterByStatus(all, 'to_watch',    currentUsername, user?.id);
  const myRecommended = filterByStatus(all, 'recommended', currentUsername, user?.id);

  // ── Partners' recent activity (excludes current user) ──────
  const partnerActivity = all.filter((item) =>
    item.reviews?.some(
      (r) =>
        r.user_name.toLowerCase() !== currentUsername.toLowerCase() &&
        (!user || r.user_id !== user.id)
    )
  );

  // Group partner activity by user for the feed label
  const partnerWatched = partnerActivity.filter((item) =>
    item.reviews?.some(
      (r) =>
        r.user_name.toLowerCase() !== currentUsername.toLowerCase() &&
        (!user || r.user_id !== user.id) &&
        r.status === 'watched'
    )
  );

  // ── Smart recommendations ──────────────────────────────────
  const myHighRated = all.filter((item) =>
    item.reviews?.some(
      (r) =>
        (r.user_name.toLowerCase() === currentUsername.toLowerCase() ||
          (user && r.user_id === user.id)) &&
        ((r.rating ?? 0) >= 7 || r.status === 'recommended')
    )
  );
  const favoriteGenres = new Set(myHighRated.flatMap((i) => i.genres ?? []));

  const tasteRecommendations = all.filter((item) => {
    const iWatched = filterByStatus([item], 'watched', currentUsername, user?.id).length > 0;
    if (iWatched) return false;
    return item.genres?.some((g) => favoriteGenres.has(g)) ||
      item.reviews?.some(
        (r) =>
          r.user_name.toLowerCase() !== currentUsername.toLowerCase() &&
          r.status === 'recommended'
      );
  });

  const partnerRecommendations = all.filter((item) => {
    const iWatched = filterByStatus([item], 'watched', currentUsername, user?.id).length > 0;
    if (iWatched) return false;
    return item.reviews?.some(
      (r) =>
        r.user_name.toLowerCase() !== currentUsername.toLowerCase() &&
        (!user || r.user_id !== user.id) &&
        ((r.rating ?? 0) >= 8 || r.status === 'recommended')
    );
  });

  // Names of other active users for the "others watched" label
  const partnerNames = Array.from(
    new Set(
      partnerWatched.flatMap(
        (item) =>
          item.reviews
            ?.filter(
              (r) =>
                r.user_name.toLowerCase() !== currentUsername.toLowerCase() &&
                (!user || r.user_id !== user.id) &&
                r.status === 'watched'
            )
            .map((r) => r.user_name) ?? []
      )
    )
  );
  const partnerWatchedLabel =
    partnerNames.length === 1
      ? `شاهد ${partnerNames[0]}`
      : partnerNames.length > 1
      ? `شاهده أعضاء الدائرة`
      : 'شاهده شريكك';

  return (
    <div className="flex flex-col min-h-dvh pb-28">

      {/* ── Hero Section ── */}
      <header className="relative overflow-hidden px-5 pt-14 pb-8">
        <div
          className="absolute -top-12 inset-x-0 h-80 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 320px at 50% 0%, rgba(245,166,35,0.18) 0%, rgba(232,121,249,0.06) 45%, transparent 75%)',
          }}
        />

        {/* Title row */}
        <div className="relative z-10 text-right space-y-1.5 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 justify-end">
            <LogoTap />
          </div>
          <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            مرحباً{' '}
            <span className="font-black" style={{ color: 'var(--text-primary)' }}>{currentUsername}</span>
            {' '}· سينمانا المشتركة
          </p>

          {/* Midnight Marathon Easter Egg */}
          <MidnightBanner />
        </div>

        {/* Quick Action Buttons */}
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

        {/* Stats Grid — My personal stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5 animate-fade-in-up stagger-3">
          {[
            { label: 'شاهدت',       value: myWatched.length,     color: '#34d399', glow: 'rgba(52,211,153,0.2)' },
            { label: 'قائمتي',      value: myToWatch.length,     color: '#a5b4fc', glow: 'rgba(129,140,248,0.2)' },
            { label: 'توصياتي',     value: myRecommended.length, color: '#e879f9', glow: 'rgba(232,121,249,0.2)' },
          ].map(({ label, value, color, glow }) => (
            <div
              key={label}
              className="glass-panel rounded-3xl py-4 px-2 text-center transition-all duration-300"
              style={{ borderColor: `${color}40`, boxShadow: `0 8px 28px -6px ${glow}` }}
            >
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-[11px] font-extrabold mt-1" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* ── Feed Sections ── */}
      <div className="flex flex-col gap-10">

        {/* Partner Recommendations */}
        {partnerRecommendations.length > 0 && (
          <div className="animate-fade-in-up stagger-4">
            <SectionRow
              title={`${partnerWatchedLabel} ويرشحه لك`}
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

        {/* Taste Recommendations */}
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

        {/* My Watched — "شاهدت" only for current user */}
        <div className="animate-fade-in-up stagger-1">
          <SectionRow
            title="شاهدت"
            icon={Eye}
            iconColor="#34d399"
            count={myWatched.length}
            empty={
              <div
                className="glass-panel flex flex-col items-center gap-2.5 py-10 rounded-3xl text-center"
                style={{ borderStyle: 'dashed', borderColor: 'var(--border-subtle)' }}
              >
                <Eye size={30} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  لم تشاهد أي أعمال بعد — ابدأ من البحث
                </p>
              </div>
            }
          >
            {myWatched.map((item, i) => <MediaCard key={item.id} item={item} index={i} />)}
          </SectionRow>
        </div>

        {/* Partners Watched — "شاهده [Name]" with partner attribution */}
        {partnerWatched.length > 0 && (
          <div className="animate-fade-in-up stagger-2">
            <SectionRow
              title={partnerWatchedLabel}
              icon={Users}
              iconColor="#38bdf8"
              count={partnerWatched.length}
            >
              {partnerWatched.map((item, i) => <MediaCard key={item.id} item={item} index={i} />)}
            </SectionRow>
          </div>
        )}

        {/* My Watchlist */}
        <div className="animate-fade-in-up stagger-3">
          <SectionRow
            title="قائمة مشاهدتي"
            icon={BookmarkCheck}
            iconColor="#818cf8"
            count={myToWatch.length}
            empty={
              <div
                className="glass-panel flex flex-col items-center gap-2.5 py-10 rounded-3xl text-center"
                style={{ borderStyle: 'dashed', borderColor: 'var(--border-subtle)' }}
              >
                <BookmarkCheck size={30} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  قائمة المشاهدة فارغة — أضف عناوين من البحث
                </p>
              </div>
            }
          >
            {myToWatch.map((item, i) => <MediaCard key={item.id} item={item} index={i} />)}
          </SectionRow>
        </div>

        {/* My Recommendations */}
        <div className="animate-fade-in-up stagger-4">
          <SectionRow
            title="أوصي بها"
            icon={Star}
            iconColor="var(--accent-rose)"
            count={myRecommended.length}
            empty={
              <div
                className="glass-panel flex flex-col items-center gap-2.5 py-10 rounded-3xl text-center"
                style={{ borderStyle: 'dashed', borderColor: 'var(--border-subtle)' }}
              >
                <Star size={30} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  لا توجد توصيات بعد
                </p>
              </div>
            }
          >
            {myRecommended.map((item, i) => <MediaCard key={item.id} item={item} index={i} />)}
          </SectionRow>
        </div>

      </div>
    </div>
  );
}
