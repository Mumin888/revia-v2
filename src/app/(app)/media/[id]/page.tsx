// ─────────────────────────────────────────────
//  REVIA V2 — Media Detail & Review Page
//  Cinematic visual overhaul with progressive fade
// ─────────────────────────────────────────────
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Film,
  Tv2,
  Sparkles,
  Star,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { MediaWithReview, MediaType } from '@/lib/types';
import BackButton from '@/components/BackButton';
import ReviewSection from '@/components/ReviewSection';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

const TYPE_META: Record<
  MediaType,
  { label: string; Icon: typeof Film; color: string }
> = {
  movie:  { label: 'فيلم سينمائي', Icon: Film,     color: '#60a5fa' },
  series: { label: 'مسلسل تلفزيوني', Icon: Tv2,      color: '#c084fc' },
  anime:  { label: 'أنمي ياباني',    Icon: Sparkles, color: '#f472b6' },
};

const GENRE_MAP: Record<string, string> = {
  '28': 'أكشن',
  '12': 'مغامرة',
  '16': 'رسوم متحركة',
  '35': 'كوميديا',
  '80': 'جريمة',
  '99': 'وثائقي',
  '18': 'دراما',
  '10751': 'عائلي',
  '14': 'فانتازيا',
  '36': 'تاريخي',
  '27': 'رعب',
  '10402': 'موسيقى',
  '9648': 'غموض',
  '10749': 'رومانسية',
  '878': 'خيال علمي',
  '10770': 'فيلم تلفزيوني',
  '53': 'إثارة وتشويق',
  '10752': 'حرب',
  '37': 'غرب أمريكي',
  '10759': 'أكشن ومغامرة',
  '10762': 'أطفال',
  '10763': 'أخبار',
  '10764': 'واقعي',
  '10765': 'خيال علمي وفانتازيا',
  '10766': 'مسلسلات درامية',
  '10767': 'حوارات',
  '10768': 'حرب وسياسة',
};

async function fetchMediaItem(id: string): Promise<MediaWithReview | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('media_items')
    .select(`
      *,
      reviews:media_reviews(*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as MediaWithReview;
}

export default async function MediaDetailPage({ params }: PageProps) {
  const media = await fetchMediaItem(params.id);

  if (!media) {
    notFound();
  }

  const meta = TYPE_META[media.media_type] ?? TYPE_META.movie;
  const TypeIcon = meta.Icon;
  const year = media.release_date ? new Date(media.release_date).getFullYear() : null;

  // Average Rating
  const validRatings = (media.reviews ?? [])
    .map((r) => r.rating)
    .filter((r): r is number => r !== null);
  const avgRating =
    validRatings.length > 0
      ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1)
      : null;

  // Resolve genre names
  const genreNames = (media.genres ?? [])
    .map((g) => GENRE_MAP[g] || (isNaN(Number(g)) ? g : null))
    .filter(Boolean);

  return (
    <div className="flex flex-col min-h-dvh pb-24">
      {/* ── Top Backdrop / Poster Header ─────── */}
      <div className="relative w-full h-[46vh] min-h-[320px] overflow-hidden bg-slate-950">
        {media.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w1280${media.poster_path}`}
            alt={media.title}
            fill
            priority
            className="object-cover object-top opacity-40 blur-xs scale-105"
          />
        ) : (
          <div className="w-full h-full bg-slate-950" />
        )}

        {/* Cinematic Backdrop Overlay */}
        <div className="backdrop-overlay absolute inset-0" />

        {/* Top bar back button */}
        <div className="absolute top-12 start-4 z-20">
          <BackButton />
        </div>

        {/* Floating poster and main title in header */}
        <div className="absolute bottom-4 inset-x-0 px-5 flex items-end gap-4 z-10">
          {/* Main Poster */}
          <div
            className="relative w-28 h-40 rounded-3xl overflow-hidden flex-shrink-0 shadow-2xl border border-white/10 glow-amber"
            style={{ background: 'var(--bg-surface)' }}
          >
            {media.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                alt={media.title}
                fill
                priority
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-40">
                <TypeIcon size={40} color={meta.color} />
              </div>
            )}
          </div>

          {/* Title & Fast Info */}
          <div className="flex-1 text-right space-y-2 pb-1">
            <div className="flex items-center gap-1.5 justify-end">
              <span
                className="text-[11px] font-extrabold px-3 py-1 rounded-full border backdrop-blur-md"
                style={{
                  background: `${meta.color}20`,
                  color: meta.color,
                  borderColor: `${meta.color}40`,
                }}
              >
                {meta.label}
              </span>
            </div>

            <h1 className="text-xl font-black text-white leading-tight line-clamp-2">
              {media.title}
            </h1>

            {/* Sub-strip with rating and year */}
            <div className="flex items-center gap-3 justify-end text-xs text-slate-300">
              {avgRating && (
                <div className="flex items-center gap-1 font-black text-amber-400">
                  <Star size={13} className="fill-amber-400" />
                  <span>{avgRating} / 10</span>
                </div>
              )}
              {year && (
                <div className="flex items-center gap-1 text-slate-400 font-bold">
                  <Calendar size={13} />
                  <span>{year}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Detail Content ─────────────── */}
      <div className="px-5 pt-4 space-y-7">
        {/* ── Genres Pills ──────────────────── */}
        {genreNames.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-slate-400">
              <span>التصنيفات السينمائية</span>
              <Layers size={14} className="text-amber-400" />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {genreNames.map((genre) => (
                <span
                  key={genre}
                  className="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-800/80 border border-slate-700/60 text-slate-300 shadow-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Overview / Synopsis ───────────── */}
        {media.overview && (
          <div
            className="rounded-3xl p-5 space-y-2.5 border border-slate-800 shadow-xl"
            style={{ background: 'rgba(17, 24, 39, 0.65)' }}
          >
            <div className="flex items-center gap-2 justify-end">
              <h2 className="text-sm font-black text-slate-200">
                القصة والنبذة
              </h2>
              <FileText size={16} className="text-amber-400" />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed text-right font-normal">
              {media.overview}
            </p>
          </div>
        )}

        {/* ── Reviews & Ratings Section ─────── */}
        <ReviewSection
          mediaId={media.id}
          initialReviews={media.reviews ?? []}
        />
      </div>
    </div>
  );
}
