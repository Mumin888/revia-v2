'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Disc3,
  Shuffle,
  Film,
  Tv2,
  Sparkles,
  ArrowLeft,
  Bookmark,
  Calendar,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { MediaWithReview, MediaType } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TYPE_META = {
  movie:  { label: 'فيلم',   Icon: Film,     color: '#60a5fa' },
  series: { label: 'مسلسل',  Icon: Tv2,      color: '#c084fc' },
  anime:  { label: 'أنمي',   Icon: Sparkles, color: '#f472b6' },
} as const;

export default function WheelPage() {
  const [items, setItems] = useState<MediaWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [onlyMutual, setOnlyMutual] = useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<MediaWithReview | null>(null);

  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch to_watch items
  useEffect(() => {
    async function loadToWatchItems() {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_items')
        .select(`
          *,
          reviews:media_reviews(*)
        `)
        .order('id', { ascending: false });

      if (!error && data) {
        // Filter items that have at least one 'to_watch' review
        const toWatchList = (data as MediaWithReview[]).filter((item) =>
          item.reviews?.some((r) => r.status === 'to_watch')
        );
        setItems(toWatchList);

        const users = Array.from(
          new Set(
            toWatchList.flatMap((item) =>
              item.reviews
                ?.filter((r) => r.status === 'to_watch')
                .map((r) => r.user_name) ?? []
            )
          )
        );
        setAvailableUsers(users);
      }
      setLoading(false);
    }

    loadToWatchItems();
  }, []);

  // Filter candidate pool
  const filteredCandidates = items.filter((item) => {
    if (typeFilter !== 'all' && item.media_type !== typeFilter) {
      return false;
    }

    if (onlyMutual) {
      // Must be present on both/multiple users' watchlists
      const toWatchReviews =
        item.reviews?.filter((r) => r.status === 'to_watch') ?? [];
      const distinctUsers = new Set(
        toWatchReviews.map((r) => r.user_name.toLowerCase())
      );
      if (distinctUsers.size < 2) {
        return false;
      }
    } else if (userFilter !== 'all') {
      const userReview = item.reviews?.find(
        (r) => r.user_name.toLowerCase() === userFilter.toLowerCase()
      );
      if (!userReview || userReview.status !== 'to_watch') {
        return false;
      }
    }

    return true;
  });

  function fireConfetti() {
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#f59e0b', '#fbbf24', '#10b981', '#6366f1', '#ec4899', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  function handleSpin() {
    if (filteredCandidates.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    // Pick target winner randomly
    const targetWinnerIndex = Math.floor(Math.random() * filteredCandidates.length);
    const targetWinner = filteredCandidates[targetWinnerIndex];

    const totalSteps = 28 + Math.floor(Math.random() * 8);
    let step = 0;
    let delay = 50;

    function tick() {
      step++;
      setCurrentIndex((prev) => (prev + 1) % filteredCandidates.length);

      if (step >= totalSteps) {
        // Stopped on winner
        setCurrentIndex(targetWinnerIndex);
        setWinner(targetWinner);
        setIsSpinning(false);
        fireConfetti();
      } else {
        // Decelerate smoothly
        if (step > totalSteps * 0.6) {
          delay += 18;
        } else if (step > totalSteps * 0.4) {
          delay += 8;
        }
        spinTimeoutRef.current = setTimeout(tick, delay);
      }
    }

    tick();
  }

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const displayedItem =
    winner ??
    (filteredCandidates.length > 0
      ? filteredCandidates[currentIndex % filteredCandidates.length]
      : null);

  const meta = displayedItem ? TYPE_META[displayedItem.media_type] : null;
  const TypeIcon = meta?.Icon ?? Film;
  const year = displayedItem?.release_date ? new Date(displayedItem.release_date).getFullYear() : null;

  return (
    <div className="flex flex-col min-h-dvh px-5 pt-12 pb-6 space-y-6">
      {/* ── Header ──────────────────────────── */}
      <header className="text-right space-y-1">
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
            عجلة الاختيار العشوائي
          </h1>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center glow-amber"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            <Disc3 size={20} color="#0f172a" className={isSpinning ? 'animate-spin' : ''} />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          دع الحظ يختار فيلم أو مسلسل سهرتكم القادمة من قائمة المشاهدة
        </p>
      </header>

      {/* ── Smart Filters Strip ─────────────── */}
      <div className="space-y-2.5">
        {/* Mutual Watchlist Smart Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <button
            type="button"
            disabled={isSpinning}
            onClick={() => {
              setOnlyMutual((prev) => !prev);
              setWinner(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              onlyMutual
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-amber'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                onlyMutual ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-700 text-slate-400'
              }`}
            >
              ✓
            </span>

            <div className="flex items-center gap-2">
              <span>أعمال متفق عليها فقط (Mutual Watchlist)</span>
              <Users size={15} className={onlyMutual ? 'text-amber-400' : 'text-slate-400'} />
            </div>
          </button>
        </div>

        {/* Media type filter */}
        <div className="flex items-center gap-1.5 justify-end overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'movie', label: 'أفلام' },
            { key: 'series', label: 'مسلسلات' },
            { key: 'anime', label: 'أنمي' },
          ].map(({ key, label }) => {
            const active = typeFilter === key;
            return (
              <button
                key={key}
                type="button"
                disabled={isSpinning}
                onClick={() => {
                  setTypeFilter(key as MediaType | 'all');
                  setWinner(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* User filter (dynamic from available users) */}
        {!onlyMutual && availableUsers.length > 1 && (
          <div className="flex items-center gap-1.5 justify-end animate-fade-in flex-wrap">
            {[{ key: 'all', label: 'الجميع' }, ...availableUsers.map((u) => ({ key: u, label: `قائمة ${u}` }))].map(
              ({ key, label }) => {
                const active = userFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => {
                      setUserFilter(key);
                      setWinner(null);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-slate-700 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-900/60 text-slate-500 hover:text-slate-300 border border-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* ── Main Wheel / Roller Box ─────────── */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[360px]">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Disc3 size={36} className="animate-spin text-amber-500" />
            <p className="text-xs">جاري تحميل قائمة المشاهدة…</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          /* Empty State */
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center space-y-4 border border-dashed border-slate-700/60"
            style={{ background: 'var(--bg-surface)' }}
          >
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-slate-800/80 text-slate-500">
              <Bookmark size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-200">
                {onlyMutual
                  ? 'لا توجد أعمال متفق عليها في القوائم معاً'
                  : 'لا توجد أعمال في قائمة المشاهدة'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {onlyMutual
                  ? 'تأكدوا من إضافة نفس العمل في قائمة مشاهدة أكثر من عضو في الدائرة'
                  : 'أضيفوا عناوين جديدة إلى «قائمة المشاهدة» من صفحة البحث أو الاستكشاف'}
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
            >
              <Sparkles size={14} />
              استكشاف اقتراحات المود
            </Link>
          </div>
        ) : (
          /* Roulette Card Display */
          <div className="w-full max-w-sm flex flex-col items-center space-y-6">
            {/* Pointer / Arrow Indicator */}
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs animate-bounce">
              <span>
                {winner
                  ? 'تم الاختيار!'
                  : isSpinning
                  ? 'جاري السحب العشوائي…'
                  : onlyMutual
                  ? 'سحب من الأعمال المتفق عليها'
                  : 'جاهز للتدوير'}
              </span>
            </div>

            {/* Poster Card with glowing frame */}
            <div
              className={`relative w-64 h-96 rounded-3xl overflow-hidden shadow-2xl border transition-all duration-300 ${
                winner
                  ? 'border-amber-400 glow-amber-lg scale-105'
                  : isSpinning
                  ? 'border-amber-500/80 scale-98 shadow-amber-500/20'
                  : 'border-slate-700/60'
              }`}
              style={{ background: 'var(--bg-surface)' }}
            >
              {displayedItem?.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${displayedItem.poster_path}`}
                  alt={displayedItem.title}
                  fill
                  priority
                  sizes="256px"
                  className={`object-cover transition-opacity duration-150 ${
                    isSpinning ? 'opacity-85' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-30">
                  <TypeIcon size={56} color={meta?.color} />
                </div>
              )}

              {/* Overlay */}
              <div className="poster-overlay absolute inset-0" />

              {/* Top badges */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                {meta && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md"
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: meta.color,
                      border: `1px solid ${meta.color}40`,
                    }}
                  >
                    <TypeIcon size={12} />
                    {meta.label}
                  </span>
                )}

                {year && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold backdrop-blur-md bg-slate-900/70 text-slate-300">
                    <Calendar size={11} />
                    {year}
                  </span>
                )}
              </div>

              {/* Bottom Title Info */}
              <div className="absolute bottom-4 inset-x-4 text-right space-y-1">
                <h3 className="text-lg font-black text-white leading-tight line-clamp-2">
                  {displayedItem?.title}
                </h3>
                {displayedItem?.overview && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {displayedItem.overview}
                  </p>
                )}
              </div>
            </div>

            {/* Winner CTA or Total Pool count */}
            {winner ? (
              <div className="w-full space-y-2 animate-fade-in">
                <Link
                  href={`/media/${winner.id}`}
                  className="w-full btn-amber flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft size={16} />
                  عرض تفاصيل العمل ومراجعته
                </Link>
                <button
                  type="button"
                  onClick={handleSpin}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-400 bg-slate-800/60 border border-slate-700 hover:text-white transition-colors"
                >
                  تدوير مرة أخرى
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                من بين {filteredCandidates.length} عمل في القائمة المفلترة
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Spin Button ─────────────────────── */}
      {!winner && filteredCandidates.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning || filteredCandidates.length === 0}
            className="btn-amber text-base flex items-center justify-center gap-2.5 h-14 glow-amber"
          >
            <Shuffle size={20} className={isSpinning ? 'animate-spin' : ''} />
            <span>{isSpinning ? 'جاري الاختيار…' : 'تدوير العجلة'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
