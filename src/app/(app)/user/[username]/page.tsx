// ─────────────────────────────────────────────
//  REVIA V2 — User / Partner Profile View
//  Server Component: displays all watched,
//  watchlist, and recommendations for any user.
// ─────────────────────────────────────────────
import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  Star,
  Film,
  Tv2,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { MediaWithReview, UserProfile, MediaType } from '@/lib/types';
import BackButton from '@/components/BackButton';
import SectionRow from '@/components/SectionRow';
import MediaCard from '@/components/MediaCard';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    username: string;
  };
}

const TYPE_META: Record<
  MediaType,
  { label: string; Icon: typeof Film; color: string }
> = {
  movie: { label: 'فيلم', Icon: Film, color: '#60a5fa' },
  series: { label: 'مسلسل', Icon: Tv2, color: '#c084fc' },
  anime: { label: 'أنمي', Icon: Sparkles, color: '#f472b6' },
};

export default async function UserProfilePage({ params }: PageProps) {
  const supabase = createSupabaseServerClient();
  const rawUsername = decodeURIComponent(params.username);

  // 1. Fetch user profile if exists in 'profiles' table
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', rawUsername)
    .maybeSingle();

  const profile: UserProfile = profileData ?? {
    id: rawUsername,
    email: '',
    username: rawUsername,
    role: 'user',
    avatar_url: null,
  };

  // 2. Fetch all media items & reviews
  const { data: mediaData } = await supabase
    .from('media_items')
    .select(`
      *,
      reviews:media_reviews(*)
    `)
    .order('id', { ascending: false });

  const allMedia = (mediaData ?? []) as MediaWithReview[];

  // Filter media for this specific user
  const userMedia = allMedia.filter((m) =>
    m.reviews?.some(
      (r) =>
        r.user_name.toLowerCase() === rawUsername.toLowerCase() ||
        r.user_id === profile.id
    )
  );

  const watched = userMedia.filter((m) =>
    m.reviews?.some(
      (r) =>
        (r.user_name.toLowerCase() === rawUsername.toLowerCase() ||
          r.user_id === profile.id) &&
        r.status === 'watched'
    )
  );

  const toWatch = userMedia.filter((m) =>
    m.reviews?.some(
      (r) =>
        (r.user_name.toLowerCase() === rawUsername.toLowerCase() ||
          r.user_id === profile.id) &&
        r.status === 'to_watch'
    )
  );

  const recommended = userMedia.filter((m) =>
    m.reviews?.some(
      (r) =>
        (r.user_name.toLowerCase() === rawUsername.toLowerCase() ||
          r.user_id === profile.id) &&
        r.status === 'recommended'
    )
  );

  // Ratings calculation
  const allUserReviews = userMedia.flatMap(
    (m) =>
      m.reviews?.filter(
        (r) =>
          r.user_name.toLowerCase() === rawUsername.toLowerCase() ||
          r.user_id === profile.id
      ) ?? []
  );

  const ratings = allUserReviews
    .map((r) => r.rating)
    .filter((r): r is number => r !== null && r !== undefined);

  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

  return (
    <div className="flex flex-col min-h-dvh px-5 pt-12 pb-10 space-y-7">
      {/* ── Top Header ──────────────────────── */}
      <header className="flex items-center justify-between">
        <BackButton fallbackUrl="/profile" />

        <div className="text-right space-y-0.5">
          <h1
            className="text-2xl font-black tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ملف {profile.username}
          </h1>
          <p className="text-xs text-slate-400">
            استعراض مكتبة وتقييمات الشريك في السينما المشتركة
          </p>
        </div>
      </header>

      {/* ── User Overview Hero Card ─────────── */}
      <div
        className="rounded-3xl p-6 border border-slate-700/60 shadow-xl space-y-5"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg glow-amber"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#0f172a',
              }}
            >
              <User size={28} strokeWidth={2.5} />
            </div>
            <div className="text-right">
              <h2 className="font-extrabold text-lg text-slate-100">
                {profile.username}
              </h2>
              <p className="text-xs text-slate-400">عضو في دائرة المشاهدة</p>
            </div>
          </div>

          {avgRating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-amber-500/30">
              <Star size={15} className="text-amber-400 fill-amber-400" />
              <span className="text-amber-300 font-extrabold text-sm">
                {avgRating}
              </span>
              <span className="text-slate-500 text-xs">/ 10</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <p className="text-lg font-black text-emerald-400">{watched.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">تمت مشاهدتها</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <p className="text-lg font-black text-indigo-400">{toWatch.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">في قائمة المشاهدة</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <p className="text-lg font-black text-pink-400">{recommended.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">توصيات خاصة</p>
          </div>
        </div>
      </div>

      {/* ── Watched with Reviews List ───────── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {watched.length}
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">
              أحدث ما شاهده {profile.username} وتقييماته
            </h2>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
        </div>

        {watched.length > 0 ? (
          <div className="space-y-3">
            {watched.map((item) => {
              const review = item.reviews?.find(
                (r) =>
                  r.user_name.toLowerCase() === rawUsername.toLowerCase() ||
                  r.user_id === profile.id
              );
              const typeMeta = TYPE_META[item.media_type] || TYPE_META.movie;

              return (
                <Link
                  key={item.id}
                  href={`/media/${item.id}`}
                  className="flex flex-col gap-2.5 p-4 rounded-3xl bg-slate-800/70 border border-slate-700/60 hover:border-amber-500/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      {item.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                          <Film size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-right min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        {review?.rating !== null && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 font-extrabold text-xs border border-amber-500/25">
                            <Star size={11} className="fill-amber-400" />
                            <span>{review?.rating}/10</span>
                          </div>
                        )}
                        <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 justify-end text-[11px] text-slate-400">
                        <span style={{ color: typeMeta.color }}>
                          {typeMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Quote if present */}
                  {review?.review && (
                    <div className="p-3 rounded-2xl bg-slate-900/50 border-r-2 border-amber-500 text-right text-xs text-slate-300 leading-relaxed">
                      <p className="line-clamp-3">{review.review}</p>
                    </div>
                  )}

                  {/* Custom Tags */}
                  {review?.custom_tags && review.custom_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {review.custom_tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300"
                        >
                          <Tag size={9} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-6 text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            لم يسجل {profile.username} أي مشاهدات حتى الآن.
          </p>
        )}
      </section>

      {/* ── Watchlist Row ───────────────────── */}
      <SectionRow
        title={`قائمة مشاهدة ${profile.username}`}
        icon={Bookmark}
        iconColor="#818cf8"
        count={toWatch.length}
        empty={
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            قائمة المشاهدة فارغة حالياً.
          </div>
        }
      >
        {toWatch.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </SectionRow>

      {/* ── Recommendations Row ─────────────── */}
      <SectionRow
        title={`توصيات ${profile.username}`}
        icon={Sparkles}
        iconColor="#f472b6"
        count={recommended.length}
        empty={
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            لا توجد توصيات مسجلة حالياً.
          </div>
        }
      >
        {recommended.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </SectionRow>
    </div>
  );
}
