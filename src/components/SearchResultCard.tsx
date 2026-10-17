'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Film, Tv2, Sparkles, Check, Calendar, Star, Clapperboard } from 'lucide-react';
import type { SearchResult } from '@/lib/types';
import { showToast } from '@/components/Toaster';

const TYPE_META = {
  movie:  { label: 'فيلم',   Icon: Film,     color: '#60a5fa' },
  series: { label: 'مسلسل',  Icon: Tv2,      color: '#c084fc' },
  anime:  { label: 'أنمي',   Icon: Sparkles, color: '#e879f9' },
} as const;

const DIRECTORS_NOTES = [
  'Ozz says: The UI took 3 cups of coffee and zero sleep to build! ☕',
  'Fun Fact: Every glassmorphic card in REVIA was tested on 4K OLED screens! 🎬',
  'Director’s Cut: Secretly watching movies during development was 100% part of the job! 🍿',
  'Dev Note: The blur radius was calibrated using actual IMAX cinema optical lenses! ✨',
  'Behind The Scenes: This card was written at 3:42 AM while binge-watching Oppenheimer. ⏳',
  'Easter Egg Lore: 9 out of 10 developers recommend pairing this movie with extra butter popcorn. 🧈',
  'Critic Consensus: 10/10 masterclass in frontend glassmorphism and pure cinema love! 🏆',
];

interface SearchResultCardProps {
  result: SearchResult;
  inLibrary?: boolean;
  onAdd: (result: SearchResult) => void;
}

export default function SearchResultCard({ result, inLibrary = false, onAdd }: SearchResultCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [directorsNote, setDirectorsNote] = useState('');
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const meta = TYPE_META[result.media_type] || TYPE_META.movie;
  const Icon = meta.Icon;
  const year = result.release_date?.slice(0, 4);

  const triggerFlip = useCallback(() => {
    setDirectorsNote(DIRECTORS_NOTES[Math.floor(Math.random() * DIRECTORS_NOTES.length)]);
    setIsFlipped((prev) => !prev);
    showToast('Director’s Cut Unlocked! 🎥 3D Flip');
  }, []);

  const handleTouchStart = useCallback(() => {
    isLongPress.current = false;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      triggerFlip();
    }, 500);
  }, [triggerFlip]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (isLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        isLongPress.current = false;
      }, 400);
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLongPress.current) return;
    triggerFlip();
  }, [triggerFlip]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isFlipped) {
      e.preventDefault();
      e.stopPropagation();
      setIsFlipped(false);
      return;
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
      className="glass-panel flex items-center gap-3.5 p-3.5 rounded-3xl transition-all duration-200 active:scale-[0.98] [perspective:1000px]"
      style={{
        borderColor: 'var(--border-subtle)',
        perspective: '1000px',
        WebkitPerspective: '1000px',
      }}
    >
      {/* ── Poster with 3D Flip ── */}
      <div
        className="relative w-14 h-20 rounded-2xl flex-shrink-0 select-none [perspective:1000px]"
        style={{ perspective: '1000px', WebkitPerspective: '1000px' }}
      >
        <div
          className="relative w-full h-full rounded-2xl transition-transform duration-700 [transform-style:preserve-3d]"
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border [backface-visibility:hidden]"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {result.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${result.poster_path}`}
                alt={result.title}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-30">
                <Icon size={22} color={meta.color} />
              </div>
            )}
          </div>

          {/* Back Face (Director's Note) */}
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFlipped(false);
            }}
            className="absolute inset-0 rounded-2xl p-1.5 flex flex-col items-center justify-center text-center border backdrop-blur-2xl cursor-pointer [backface-visibility:hidden]"
            style={{
              background: 'linear-gradient(145deg, rgba(245, 166, 35, 0.25) 0%, rgba(18, 18, 21, 0.95) 100%)',
              borderColor: 'rgba(245, 166, 35, 0.5)',
              boxShadow: '0 0 15px rgba(245, 166, 35, 0.3)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              WebkitTransform: 'rotateY(180deg)',
            }}
          >
            <Clapperboard size={14} className="text-amber-400 mb-1" />
            <span className="text-[7px] font-black text-amber-300 leading-tight">
              CUT 🎥
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-right space-y-1">
        <p className="font-black text-sm leading-snug line-clamp-1" style={{ color: 'var(--text-primary)' }}>
          {result.title}
        </p>
        <div className="flex items-center gap-2 justify-end text-xs">
          {typeof result.vote_average === 'number' && result.vote_average > 0 && (
            <span
              className="flex items-center gap-0.5 text-[11px] font-black"
              style={{
                color: result.vote_average >= 8 ? '#34d399' : result.vote_average >= 6.5 ? '#f5a623' : '#f87171',
              }}
            >
              <Star size={10} fill="currentColor" />
              {result.vote_average.toFixed(1)}
            </span>
          )}
          {year && (
            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
              <Calendar size={11} />
              {year}
            </span>
          )}
          <span
            className="font-black px-2 py-0.5 rounded-lg text-[10px] border"
            style={{
              background: `${meta.color}15`,
              color: meta.color,
              borderColor: `${meta.color}35`,
            }}
          >
            {meta.label}
          </span>
        </div>
        {isFlipped ? (
          <p className="text-xs line-clamp-2 leading-relaxed text-amber-300 font-bold animate-fade-in-up">
            🎬 {directorsNote}
          </p>
        ) : (
          result.overview && (
            <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {result.overview}
            </p>
          )
        )}
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!inLibrary) onAdd(result);
        }}
        disabled={inLibrary}
        aria-label={inLibrary ? 'موجود في المكتبة' : `إضافة ${result.title}`}
        className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border active:scale-90"
        style={
          inLibrary
            ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', borderColor: 'rgba(52,211,153,0.35)' }
            : { background: 'rgba(245,166,35,0.12)', color: '#fef08a', borderColor: 'rgba(245,166,35,0.4)', boxShadow: '0 0 12px rgba(245,166,35,0.15)' }
        }
      >
        {inLibrary ? <Check size={19} strokeWidth={2.8} /> : <Plus size={19} strokeWidth={2.8} />}
      </button>
    </div>
  );
}
