// ─────────────────────────────────────────────
//  REVIA V2 — Profile & Statistics Page
//  Server Component: displays account overview,
//  user profile, admin badge, and statistics.
// ─────────────────────────────────────────────
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  LogOut,
  Film,
  Sparkles,
  Star,
  Bookmark,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Tag,
  Clock,
  Users,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { MediaWithReview, CustomTag, UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface UserStats {
  watched: number;
  toWatch: number;
  recommended: number;
  totalReviews: number;
  avgRating: string | null;
  topTags: { tag: CustomTag; count: number }[];
  moviesCount: number;
  seriesCount: number;
  animeCount: number;
}

function calculateUserStats(
  userName: string,
  allMedia: MediaWithReview[]
): UserStats {
  let watched = 0;
  let toWatch = 0;
  let recommended = 0;
  let totalReviews = 0;
  const ratings: number[] = [];
  const tagCounts: Record<string, number> = {};
  let moviesCount = 0;
  let seriesCount = 0;
  let animeCount = 0;

  for (const media of allMedia) {
    const review = media.reviews?.find(
      (r) =>
        r.user_name.toLowerCase() === userName.toLowerCase() ||
        r.user_id === userName
    );
    if (!review) continue;

    if (review.status === 'watched') watched++;
    if (review.status === 'to_watch') toWatch++;
    if (review.status === 'recommended') recommended++;

    if (review.rating !== null) {
      ratings.push(review.rating);
    }

    if (review.review || review.rating !== null || (review.custom_tags && review.custom_tags.length > 0)) {
      totalReviews++;
    }

    if (review.custom_tags) {
      for (const t of review.custom_tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }

    if (review.status === 'watched') {
      if (media.media_type === 'movie') moviesCount++;
      if (media.media_type === 'series') seriesCount++;
      if (media.media_type === 'anime') animeCount++;
    }
  }

  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ tag: tag as CustomTag, count }));

  return {
    watched,
    toWatch,
    recommended,
    totalReviews,
    avgRating,
    topTags,
    moviesCount,
    seriesCount,
    animeCount,
  };
}

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch current user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const profile: UserProfile = profileData ?? {
    id: user.id,
    email: user.email ?? '',
    username: (user.user_metadata?.username as string) || (user.email ? user.email.split('@')[0] : 'User'),
    role: user.email?.includes('admin') ? 'admin' : 'user',
    avatar_url: null,
  };

  const isAdmin = profile.role === 'admin';

  // Fetch all media items and reviews for stats
  const { data: mediaData } = await supabase
    .from('media_items')
    .select(`
      *,
      reviews:media_reviews(*)
    `);

  const allMedia = (mediaData ?? []) as MediaWithReview[];

  const myStats = calculateUserStats(profile.username, allMedia);

  // Fetch other distinct members / profiles in the circle
  const { data: otherProfilesData } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id);

  const otherProfiles = (otherProfilesData ?? []) as UserProfile[];

  // Also collect reviewers from media_reviews who might not have a profile row
  const otherReviewerNames = Array.from(
    new Set(
      allMedia.flatMap((m) =>
        m.reviews
          ?.filter(
            (r) =>
              r.user_name.toLowerCase() !== profile.username.toLowerCase() &&
              r.user_id !== user.id
          )
          .map((r) => r.user_name) ?? []
      )
    )
  );

  const partnerList = otherProfiles.length > 0
    ? otherProfiles.map((p) => ({
        name: p.username,
        title: p.username,
        stats: calculateUserStats(p.username, allMedia),
        color: '#38bdf8',
      }))
    : otherReviewerNames.map((name) => ({
        name,
        title: name,
        stats: calculateUserStats(name, allMedia),
        color: '#38bdf8',
      }));

  const totalLibraryCount = allMedia.length;
  const totalWatched = allMedia.filter((m) =>
    m.reviews?.some((r) => r.status === 'watched')
  ).length;

  return (
    <div className="flex flex-col min-h-dvh px-5 pt-12 pb-8 space-y-7">
      {/* ── Header ──────────────────────────── */}
      <header className="text-right space-y-1">
        <h1
          className="text-2xl font-black tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          حسابي والإحصائيات
        </h1>
        <p className="text-xs text-slate-400">
          الملف الشخصي وإحصائيات المشاهدات والتفاعل
        </p>
      </header>

      {/* ── User Account Card ───────────────── */}
      <div
        className="rounded-3xl p-5 space-y-4 border border-slate-700/60 shadow-lg"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base glow-amber"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#0f172a',
              }}
            >
              <User size={24} strokeWidth={2.5} />
            </div>
            <div className="text-right">
              <h2 className="font-bold text-base text-slate-100">
                {profile.username}
              </h2>
              <p className="text-xs text-slate-400" dir="ltr">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck size={13} />
              {isAdmin ? 'مسؤول النظام' : 'عضو نشط'}
            </span>
          </div>
        </div>

        {/* Taste Compatibility Banner */}
        <Link
          href="/compatibility"
          className="flex items-center justify-between p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition-all duration-150"
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-sm">✦</span>
            <span>مقياس توافق الذوق السينمائي (Taste Compatibility)</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-200">
            فحص التوافق
          </span>
        </Link>

        {/* Admin Dashboard CTA if admin */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all duration-150"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldAlert size={16} className="text-amber-400" />
              <span>لوحة التحكم الإدارية (Admin Dashboard)</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-200">
              دخول
            </span>
          </Link>
        )}

        {/* Global Mini Stats */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-xl font-black text-amber-400">{totalLibraryCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">إجمالي المكتبة</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-xl font-black text-emerald-400">{totalWatched}</p>
            <p className="text-xs text-slate-400 mt-0.5">تمت مشاهدتها</p>
          </div>
        </div>
      </div>

      {/* ── My Personal Stats ───────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--accent)' }}
            >
              <BarChart3 size={16} strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-black text-slate-100">
              إحصائيات حسابي ({profile.username})
            </h2>
          </div>
        </div>

        <div
          className="rounded-3xl p-5 space-y-4 border border-slate-700/60 shadow-lg"
          style={{ background: 'var(--bg-surface)' }}
        >
          {/* Status Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <p className="text-base font-extrabold text-emerald-400">{myStats.watched}</p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 size={11} />
                شاهدت
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <p className="text-base font-extrabold text-indigo-400">{myStats.toWatch}</p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                <Bookmark size={11} />
                قائمة
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <p className="text-base font-extrabold text-pink-400">{myStats.recommended}</p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                <Sparkles size={11} />
                توصيات
              </p>
            </div>
          </div>

          {/* Average rating and format breakdown */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span>{myStats.moviesCount} فيلم</span> ·{' '}
              <span>{myStats.seriesCount} مسلسل</span> ·{' '}
              <span>{myStats.animeCount} أنمي</span>
            </div>

            {myStats.avgRating && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-amber-500/30">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="text-amber-300 font-extrabold text-xs">
                  {myStats.avgRating}
                </span>
                <span className="text-slate-500 text-xs">متوسط</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Duo / Circle Overview ────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}
            >
              <Film size={16} strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-black text-slate-100">
              دائرة المشاهدة المشتركة (Shared Cinema)
            </h2>
          </div>
        </div>

        {partnerList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partnerList.map(({ name, title, stats, color }) => (
              <div
                key={title}
                className="rounded-3xl p-5 space-y-4 border border-slate-700/60 shadow-lg"
                style={{ background: 'var(--bg-surface)' }}
              >
                {/* User Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                      style={{
                        background: `${color}20`,
                        color: color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      <User size={15} />
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-sm text-slate-100">{title}</h3>
                      <p className="text-xs text-slate-400">عضو في الدائرة</p>
                    </div>
                  </div>

                  {stats.avgRating && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-amber-500/30">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="text-amber-300 font-extrabold text-xs">
                        {stats.avgRating}
                      </span>
                      <span className="text-slate-500 text-xs">متوسط</span>
                    </div>
                  )}
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <p className="text-base font-extrabold text-emerald-400">{stats.watched}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                      <CheckCircle2 size={11} />
                      شاهد
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <p className="text-base font-extrabold text-indigo-400">{stats.toWatch}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                      <Bookmark size={11} />
                      قائمة
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <p className="text-base font-extrabold text-pink-400">{stats.recommended}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                      <Sparkles size={11} />
                      توصية
                    </p>
                  </div>
                </div>

                {/* Top Tags */}
                {stats.topTags.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-bold text-slate-400 text-right">
                      أكثر الوسوم استخداماً
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {stats.topTags.map(({ tag, count }) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300"
                        >
                          <Tag size={10} />
                          {tag} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* View full partner profile button */}
                <Link
                  href={`/user/${encodeURIComponent(title)}`}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-amber-500/40 transition-colors"
                >
                  <span>استعراض قائمة وتقييمات {name}</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
            <Users size={28} className="mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-semibold">
              لا يوجد أعضاء إضافيون مسجلون في الدائرة حتى الآن.
            </p>
            <p className="text-[11px] text-slate-500">
              يمكن لشريكك إنشاء حساب من صفحة التسجيل لمشاركة تقييماته ومشاهداته معك.
            </p>
          </div>
        )}
      </section>

      {/* ── App Info & Sign out Section ──────── */}
      <div className="space-y-4 pt-2">
        <div
          className="rounded-3xl p-4 flex items-center justify-between border border-slate-800 bg-slate-900/60"
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Clock size={14} className="text-slate-500" />
            <span>الإصدار 2.0 · REVIA Social Platform</span>
          </div>
          <span className="text-xs text-amber-400 font-bold">V2 Core</span>
        </div>

        {/* Sign Out Action */}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-150 text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-98"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </form>
      </div>
    </div>
  );
}
