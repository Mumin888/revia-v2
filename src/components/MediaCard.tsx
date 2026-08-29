'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Film, Tv2, Sparkles, Star, ChevronLeft, Clapperboard, Coffee } from 'lucide-react';
import type { MediaWithReview } from '@/lib/types';
import { showToast } from '@/components/Toaster';

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

const DIRECTORS_NOTES = [
  'Ozz says: The UI took 3 cups of coffee and zero sleep to build! ☕',
  'Fun Fact: Every glassmorphic card in REVIA was tested on 4K OLED screens! 🎬',
  'Director’s Cut: Secretly watching movies during development was 100% part of the job! 🍿',
  'Dev Note: The blur radius was calibrated using actual IMAX cinema optical lenses! ✨',
  'Behind The Scenes: This card was written at 3:42 AM while binge-watching Oppenheimer. ⏳',
  'Easter Egg Lore: 9 out of 10 developers recommend pairing this movie with extra butter popcorn. 🧈',
  'Audio Check: No actual actors were harmed during the deployment of this database query. 🎧',
  'Director’s Advice: Never pause a Christopher Nolan movie to explain the plot. Just ride the wave! 🌊',
  'Studio Secret: The soundtrack for building REVIA was Hans Zimmer on loop for 72 hours. 🎻',
  'Cinematographer Note: That 1px border glow is rendered with 100% organic starlight. 🌟',
  'Critic Consensus: 10/10 masterclass in frontend glassmorphism and pure cinema love! 🏆',
  'Production Trivia: Over 500 lines of Tailwind CSS were written before the opening credits rolled! 🎞️',
];

interface MediaCardProps {
  item: MediaWithReview;
  index?: number;
  onClick?: () => void;
}

export default function MediaCard({ item, index = 0, onClick }: MediaCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [directorsNote, setDirectorsNote] = useState('');
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

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

  const stagger = `stagger-${(index % 5) + 1}`;

  const triggerFlip = useCallback(() => {
    setDirectorsNote(DIRECTORS_NOTES[Math.floor(Math.random() * DIRECTORS_NOTES.length)]);
    setIsFlipped((prev) => !prev);
    showToast('Director’s Cut Unlocked! 🎥 3D Flip');
  }, []);

  // Long press handlers
  const handleTouchStart = useCallback(() => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      triggerFlip();
    }, 550);
  }, [triggerFlip]);

  const handleTouchEnd = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerFlip();
  }, [triggerFlip]);

  const cardInner = (
    <div
      className={`group relative w-36 flex-shrink-0 text-right focus:outline-none block animate-fade-in-up ${stagger}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      {/* ── 3D Flip Container ── */}
      <div
        className="relative w-36 h-52 select-none"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full rounded-3xl transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ── FRONT FACE ── */}
          <div
            className="card-hover absolute inset-0 rounded-3xl overflow-hidden border"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
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

            <div className="poster-overlay absolute inset-0 pointer-events-none" />

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

          {/* ── BACK FACE: Director's Cut Note ── */}
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFlipped(false);
            }}
            className="absolute inset-0 rounded-3xl p-3.5 flex flex-col justify-between text-right border backdrop-blur-2xl cursor-pointer"
            style={{
              background: 'linear-gradient(145deg, rgba(245, 166, 35, 0.15) 0%, rgba(18, 18, 21, 0.95) 100%)',
              borderColor: 'rgba(245, 166, 35, 0.5)',
              boxShadow: '0 0 25px rgba(245, 166, 35, 0.25)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-2 border-white/10">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Clapperboard size={14} />
              </div>
              <span className="text-[10px] font-black text-amber-300 tracking-wider">
                DIRECTOR’S CUT 🎥
              </span>
            </div>

            <div className="space-y-1.5 my-auto">
              <div className="flex items-center gap-1 text-amber-400/90 text-[10px] font-bold">
                <Coffee size={12} />
                <span>ملاحظة المطورين:</span>
              </div>
              <p className="text-[10px] font-bold leading-relaxed text-slate-200">
                {directorsNote}
              </p>
            </div>

            <div className="text-center pt-1 border-t border-white/10">
              <span className="text-[9px] font-extrabold text-amber-400/70">
                انقر للقلب مجدداً ↻
              </span>
            </div>
          </div>
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
        onClick={(e) => {
          if (isLongPress.current || isFlipped) {
            e.preventDefault();
            return;
          }
          onClick();
        }}
        onContextMenu={handleContextMenu}
        className="text-right focus:outline-none block"
        aria-label={`عرض تفاصيل ${item.title}`}
      >
        {cardInner}
      </button>
    );
  }

  return (
    <Link
      href={`/media/${item.id}`}
      onClick={(e) => {
        if (isLongPress.current || isFlipped) {
          e.preventDefault();
        }
      }}
      onContextMenu={handleContextMenu}
      className="text-right focus:outline-none block"
      aria-label={`عرض تفاصيل ${item.title}`}
    >
      {cardInner}
    </Link>
  );
}
