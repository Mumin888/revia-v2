// ─────────────────────────────────────────────
//  REVIA V2 — Taste Compatibility Engine
//  Server Component: analyzes dual ratings,
//  shared favorites, and opinion disagreements.
// ─────────────────────────────────────────────
import Link from 'next/link';
import Image from 'next/image';
import {
  HeartHandshake,
  Film,
  Sparkles,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { MediaWithReview, MediaReview } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface MutualComparisonItem {
  media: MediaWithReview;
  reviewA: MediaReview;
  reviewB: MediaReview;
  diff: number;
}

function calculateCompatibility(
  userA: string,
  userB: string,
  allMedia: MediaWithReview[]
) {
  const mutualItems: MutualComparisonItem[] = [];
  const ratingsA: number[] = [];
  const ratingsB: number[] = [];

  for (const item of allMedia) {
    const revA = item.reviews?.find(
      (r) => r.user_name.toLowerCase() === userA.toLowerCase()
    );
    const revB = item.reviews?.find(
      (r) => r.user_name.toLowerCase() === userB.toLowerCase()
    );

    if (revA?.rating !== null && revA?.rating !== undefined) {
      ratingsA.push(revA.rating);
    }
    if (revB?.rating !== null && revB?.rating !== undefined) {
      ratingsB.push(revB.rating);
    }

    if (
      revA?.rating !== null &&
      revA?.rating !== undefined &&
      revB?.rating !== null &&
      revB?.rating !== undefined
    ) {
      mutualItems.push({
        media: item,
        reviewA: revA,
        reviewB: revB,
        diff: Math.abs(revA.rating - revB.rating),
      });
    }
  }

  // 1. Compatibility Score
  let score = 85;
  if (mutualItems.length > 0) {
    const totalDiff = mutualItems.reduce((acc, curr) => acc + curr.diff, 0);
    const avgDiff = totalDiff / mutualItems.length;
    score = Math.max(10, Math.min(100, Math.round((1 - avgDiff / 10) * 100)));
  }

  // 2. Shared Favorites: both rated >= 8
  const sharedFavorites = mutualItems.filter(
    (item) => (item.reviewA.rating ?? 0) >= 8 && (item.reviewB.rating ?? 0) >= 8
  );

  // 3. Biggest Disagreements: sorted by diff descending
  const disagreements = [...mutualItems]
    .filter((item) => item.diff >= 2)
    .sort((a, b) => b.diff - a.diff);

  // 4. Averages
  const avgA =
    ratingsA.length > 0
      ? (ratingsA.reduce((a, b) => a + b, 0) / ratingsA.length).toFixed(1)
      : null;
  const avgB =
    ratingsB.length > 0
      ? (ratingsB.reduce((a, b) => a + b, 0) / ratingsB.length).toFixed(1)
      : null;

  return {
    score,
    mutualCount: mutualItems.length,
    sharedFavorites,
    disagreements,
    avgA,
    avgB,
  };
}

export default async function CompatibilityPage({
  searchParams,
}: {
  searchParams: { userA?: string; userB?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all media items & reviews
  const { data: mediaData } = await supabase
    .from('media_items')
    .select(`
      *,
      reviews:media_reviews(*)
    `);

  const allMedia = (mediaData ?? []) as MediaWithReview[];

  // Get current user profile username
  const { data: profile } = user
    ? await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
    : { data: null };

  const currentUsername =
    profile?.username ||
    (user?.user_metadata?.username as string) ||
    (user?.email ? user.email.split('@')[0] : 'أنا');

  // Discover all reviewers present in reviews
  const allReviewers = Array.from(
    new Set(allMedia.flatMap((m) => m.reviews?.map((r) => r.user_name) ?? []))
  );

  const otherReviewer = allReviewers.find(
    (u) => u.toLowerCase() !== currentUsername.toLowerCase()
  ) || 'الشريك';

  const userA = searchParams.userA || currentUsername;
  const userB = searchParams.userB || otherReviewer;

  const { score, mutualCount, sharedFavorites, disagreements, avgA, avgB } =
    calculateCompatibility(userA, userB, allMedia);

  const getScoreVerdict = (s: number) => {
    if (s >= 90) return 'تطابق سينمائي خارق وانسجام استثنائي';
    if (s >= 80) return 'ذوق متقارب جداً وسهرات متفق عليها';
    if (s >= 70) return 'توافق جيد مع نقاشات ممتعة';
    return 'اختلافات سينمائية حادة ونقاشات مشتعلة';
  };

  return (
    <div className="flex flex-col min-h-dvh px-5 pt-12 pb-10 space-y-8">
      {/* ── Header ──────────────────────────── */}
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 hover:text-white"
        >
          <ArrowRight size={14} />
          الرئيسية
        </Link>

        <div className="text-right space-y-0.5">
          <div className="flex items-center gap-2 justify-end">
            <h1
              className="text-2xl font-black tracking-wide"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              مقياس توافق الذوق
            </h1>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center glow-amber"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              <HeartHandshake size={18} color="#0f172a" strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            مقارنة الذوق السينمائي بين {userA} و {userB}
          </p>
        </div>
      </header>

      {/* ── Main Compatibility Score Card ──── */}
      <div
        className="rounded-3xl p-6 border border-slate-700/60 shadow-2xl relative overflow-hidden text-center space-y-5"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Circular Gauge */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center rounded-full border-4 border-amber-500/20 glow-amber-lg bg-slate-900/80">
          <div className="text-center">
            <p className="text-4xl font-black text-amber-400 leading-none">
              {score}%
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-1">نسبة التوافق</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-100">
            {getScoreVerdict(score)}
          </h2>
          <p className="text-xs text-slate-400">
            {mutualCount > 0
              ? `بناءً على ${mutualCount} عمل تمت مشاهدته وتقييمه معاً`
              : 'قيّموا مزيداً من الأعمال المشتركة لزيادة دقة المقياس'}
          </p>
        </div>

        {/* User Comparison Pill */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-xs font-bold text-slate-400 mb-1">{userA}</p>
            <p className="text-lg font-black text-amber-300">
              {avgA ? `${avgA} / 10` : '—'}
            </p>
            <p className="text-[10px] text-slate-500">متوسط التقييم</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-xs font-bold text-slate-400 mb-1">{userB}</p>
            <p className="text-lg font-black text-sky-300">
              {avgB ? `${avgB} / 10` : '—'}
            </p>
            <p className="text-[10px] text-slate-500">متوسط التقييم</p>
          </div>
        </div>
      </div>

      {/* ── Shared Favorites Section ────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {sharedFavorites.length} عمل مشترك
          </span>

          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">
              الأعمال المفضلة المشتركة (8+ / 10)
            </h2>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
              <Sparkles size={15} />
            </div>
          </div>
        </div>

        {sharedFavorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sharedFavorites.map(({ media, reviewA, reviewB }) => (
              <Link
                key={media.id}
                href={`/media/${media.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/40 transition-all duration-150"
              >
                <div
                  className="relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  {media.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${media.poster_path}`}
                      alt={media.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                      <Film size={20} />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-right space-y-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-100 line-clamp-1">
                    {media.title}
                  </h3>
                  <div className="flex items-center gap-2 justify-end text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-bold border border-amber-500/20">
                      {userA}: {reviewA.rating}/10
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 font-bold border border-sky-500/20">
                      {userB}: {reviewB.rating}/10
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            لم تسجلوا حتى الآن أعمالاً قيّمها كلاكما بدرجة 8 أو أعلى.
          </div>
        )}
      </section>

      {/* ── Biggest Disagreements Section ───── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            {disagreements.length} نقطة خلاف
          </span>

          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">
              أكبر صراعات ونقاط الاختلاف
            </h2>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-400">
              <Flame size={15} />
            </div>
          </div>
        </div>

        {disagreements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {disagreements.map(({ media, reviewA, reviewB, diff }) => (
              <Link
                key={media.id}
                href={`/media/${media.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-rose-500/40 transition-all duration-150"
              >
                <div
                  className="relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  {media.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${media.poster_path}`}
                      alt={media.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                      <Film size={20} />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-right space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      فرق {diff} درجات
                    </span>
                    <h3 className="text-xs font-bold text-slate-100 line-clamp-1">
                      {media.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 justify-end text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-bold">
                      {userA}: {reviewA.rating}/10
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 font-bold">
                      {userB}: {reviewB.rating}/10
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            لا توجد خلافات حادة في التقييم بينكما حتى الآن.
          </div>
        )}
      </section>
    </div>
  );
}
