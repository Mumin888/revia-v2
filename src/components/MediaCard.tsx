import Image from 'next/image';
import Link from 'next/link';
import { Film, Tv2, Sparkles, Star, ChevronLeft } from 'lucide-react';
import type { MediaWithReview } from '@/lib/types';

// ─── Type config ─────────────────────────────
const TYPE_META = {
  movie:  { label: 'فيلم',   Icon: Film,     color: '#60a5fa' },
  series: { label: 'مسلسل',  Icon: Tv2,      color: '#c084fc' },
  anime:  { label: 'أنمي',   Icon: Sparkles, color: '#e879f9' },
} as const;

const STATUS_META = {
  watched:     { label: 'شاهدت',  bg: 'rgba(16,185,129,0.25)', text: '#34d399', border: 'rgba(16,185,129,0.5)' },
  to_watch:    { label: 'لاحقاً', bg: 'rgba(129,140,248,0.25)', text: '#a5b4fc', border: 'rgba(129,140,248,0.5)' },
  recommended: { label: 'موصى',   bg: 'rgba(232,121,249,0.25)', text: '#e879f9', border: 'rgba(232,121,249,0.5)' },
} as const;

// ─── Props ────────────────────────────────────
interface MediaCardProps {
  item: MediaWithReview;
  index?: number;
  onClick?: () => void;
}

export default function MediaCard({ item, index = 0, onClick }: MediaCardProps) {
  const meta  = TYPE_META[item.media_type] || TYPE_META.movie;
  const Icon  = meta.Icon;
  const year  = item.release_date?.slice(0, 4);

  const ratings = item.reviews?.map((r) => r.rating).filter(Boolean) as number[];
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

  const dominantReview =
    item.reviews?.find((r) => r.status === 'watched') ??
    item.reviews?.find((r) => r.status === 'recommended') ??
    item.reviews?.[0];
  const statusMeta = dominantReview ? STATUS_META[dominantReview.status] : null;

  // Stagger class cycling through stagger-1 … stagger-5 (as defined in globals.css)
  const stagger = `stagger-${(index % 5) + 1}`;

  const content = (
    <div className={`group relative w-36 flex-shrink-0 text-right focus:outline-none block animate-fade-in-up ${stagger}`}>

      {/* ── Poster: uses .card-hover (transition + hover lift) ── */}
      <div
        className="card-hover relative w-36 h-52 rounded-3xl overflow-hidden border"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {item.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
            alt={item.title}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <Icon size={40} color={meta.color} />
          </div>
        )}

        {/* ── .poster-overlay gradient (exact class from globals.css) ── */}
        <div className="poster-overlay absolute inset-0 pointer-events-none" />

        {/* Rating pill — exact CSS vars */}
        {avgRating && (
          <div
            className="absolute top-2.5 start-2.5 flex items-center gap-1 px-2 py-0.5 rounded-xl backdrop-blur-xl border"
            style={{
              background: 'rgba(5, 5, 5, 0.85)',
              borderColor: 'rgba(245, 166, 35, 0.55)',
              boxShadow: '0 0 12px rgba(245, 166, 35, 0.25)',
            }}
          >
            <Star size={10} style={{ color: 'var(--accent-amber)', fill: 'var(--accent-amber)' }} />
            <span className="text-[11px] font-black" style={{ color: '#fef08a' }}>{avgRating}</span>
          </div>
        )}

        {/* Type Badge */}
        <span
          className="absolute top-2.5 end-2.5 text-[9px] font-black px-2 py-0.5 rounded-lg backdrop-blur-xl border"
          style={{
            background: 'rgba(5, 5, 5, 0.8)',
            color: meta.color,
            borderColor: `${meta.color}40`,
          }}
        >
          {meta.label}
        </span>

        {/* Status / Quick View Overlay */}
        <div className="absolute bottom-2.5 inset-x-2.5 transition-all duration-300">
          {statusMeta ? (
            <div
              className="text-center text-[10px] font-black py-1 rounded-xl backdrop-blur-xl border"
              style={{
                background: statusMeta.bg,
                color: statusMeta.text,
                borderColor: statusMeta.border,
              }}
            >
              {statusMeta.label}
            </div>
          ) : (
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1 text-[10px] font-bold py-1 rounded-xl backdrop-blur-md border"
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'var(--border-luminous)',
                color: 'var(--text-primary)',
              }}
            >
              <span>عرض التفاصيل</span>
              <ChevronLeft size={12} />
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-2.5 px-1 space-y-0.5 text-right">
        <p
          className="text-xs font-bold leading-tight line-clamp-1 transition-colors group-hover:text-[#fef08a]"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.title}
        </p>
        {year && (
          <p className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {year}
          </p>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-right focus:outline-none"
        aria-label={`عرض تفاصيل ${item.title}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={`/media/${item.id}`}
      className="text-right focus:outline-none"
      aria-label={`عرض تفاصيل ${item.title}`}
    >
      {content}
    </Link>
  );
}
