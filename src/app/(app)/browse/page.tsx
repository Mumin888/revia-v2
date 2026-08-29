'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Image from 'next/image';
import {
  Film, Tv2, Sparkles, Star, Plus, Check,
  Crown, Zap, Flame, Ghost, Smile, AlertTriangle,
  Loader2, RefreshCw, ChevronDown,
} from 'lucide-react';
import type { SearchResult, MediaType } from '@/lib/types';
import type { BrowseTab } from '@/app/api/browse/route';
import type { MoodKey } from '@/app/api/discover/route';
import AddToLibrarySheet from '@/components/AddToLibrarySheet';

export const dynamic = 'force-dynamic';

// ─── Tab definitions ──────────────────────────────────────────
type ActiveTab = BrowseTab | 'mood';

const TABS: { key: ActiveTab; label: string; icon: typeof Film; color: string }[] = [
  { key: 'movies',    label: 'أفلام',           icon: Film,     color: '#60a5fa' },
  { key: 'tv',        label: 'مسلسلات',         icon: Tv2,      color: '#c084fc' },
  { key: 'anime',     label: 'أنمي',            icon: Sparkles, color: '#e879f9' },
  { key: 'top_rated', label: 'الأفضل تقييماً',  icon: Crown,    color: '#f5a623' },
  { key: 'mood',      label: 'استكشاف المود',   icon: Zap,      color: '#34d399' },
];

// ─── Mood definitions ─────────────────────────────────────────
const MOODS: { key: MoodKey; label: string; sublabel: string; icon: typeof Zap; color: string }[] = [
  { key: 'mind_bending', label: 'فصلان مخ',      sublabel: 'خيال وتشويق يغير تفكيرك',      icon: Zap,           color: '#818cf8' },
  { key: 'emotional',    label: 'نكد عاطفي',     sublabel: 'دراما مؤثرة ورومانسية عميقة',  icon: Flame,         color: '#f472b6' },
  { key: 'dark_scary',   label: 'رعب وإثارة',    sublabel: 'أجواء مظلمة وحبس أنفاس',       icon: Ghost,         color: '#38bdf8' },
  { key: 'chill_fun',    label: 'كوميديا وروقان', sublabel: 'ضحك وسهرات خفيفة ممتعة',       icon: Smile,         color: '#34d399' },
  { key: 'wtf_shock',    label: 'صدمة سينمائية', sublabel: 'حبكات غير متوقعة وصادمة',      icon: AlertTriangle, color: '#fbbf24' },
];

// ─── Type meta ────────────────────────────────────────────────
const TYPE_META: Record<MediaType, { label: string; Icon: typeof Film; color: string }> = {
  movie:  { label: 'فيلم',   Icon: Film,     color: '#60a5fa' },
  series: { label: 'مسلسل',  Icon: Tv2,      color: '#c084fc' },
  anime:  { label: 'أنمي',   Icon: Sparkles, color: '#e879f9' },
};

// ─── Rating Pill ──────────────────────────────────────────────
function RatingPill({ score }: { score: number }) {
  if (!score || score === 0) return null;
  const color = score >= 8 ? '#34d399' : score >= 6.5 ? '#f5a623' : '#f87171';
  return (
    <div
      className="absolute top-2 end-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg backdrop-blur-xl border text-[10px] font-black"
      style={{ background: 'rgba(5,5,5,0.85)', borderColor: `${color}60`, color, boxShadow: `0 0 10px ${color}30` }}
    >
      <Star size={8} fill={color} style={{ color }} />
      <span>{score.toFixed(1)}</span>
    </div>
  );
}

// ─── Shimmer skeleton ─────────────────────────────────────────
function ShimmerCard() {
  return (
    <div className="rounded-3xl overflow-hidden border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
      <div className="aspect-[2/3] shimmer w-full" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 rounded shimmer w-3/4" />
        <div className="h-2.5 rounded shimmer w-1/2" />
        <div className="h-7 rounded-xl shimmer w-full" />
      </div>
    </div>
  );
}

import { showToast } from '@/components/Toaster';
import { useRef } from 'react';

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

// ─── Media Card with 3D Flip ──────────────────────────────────
function MediaCardItem({
  item, isAdded, onSelect,
}: { item: SearchResult; isAdded: boolean; onSelect: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [directorsNote, setDirectorsNote] = useState('');
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const typeInfo = TYPE_META[item.media_type] || TYPE_META.movie;
  const year = item.release_date?.slice(0, 4);

  const triggerFlip = () => {
    setDirectorsNote(DIRECTORS_NOTES[Math.floor(Math.random() * DIRECTORS_NOTES.length)]);
    setIsFlipped((prev) => !prev);
    showToast('Director’s Cut Unlocked! 🎥 3D Flip');
  };

  const handleTouchStart = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      triggerFlip();
    }, 550);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerFlip();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={handleContextMenu}
      className="relative rounded-3xl overflow-hidden flex flex-col border"
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-subtle)',
        perspective: '1000px',
      }}
    >
      <div
        className="relative w-full aspect-[2/3] transition-transform duration-700 select-none"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {item.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <typeInfo.Icon size={36} style={{ color: typeInfo.color }} />
            </div>
          )}
          <div className="poster-overlay absolute inset-0 pointer-events-none" />
          <span
            className="absolute top-2 start-2 text-[9px] font-black px-1.5 py-0.5 rounded-lg backdrop-blur-xl border"
            style={{ background: 'rgba(5,5,5,0.8)', color: typeInfo.color, borderColor: `${typeInfo.color}40` }}
          >
            {typeInfo.label}
          </span>
          <RatingPill score={item.vote_average} />
        </div>

        {/* BACK: Director's Note */}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFlipped(false);
          }}
          className="absolute inset-0 rounded-3xl p-3 flex flex-col justify-between text-right border backdrop-blur-2xl cursor-pointer"
          style={{
            background: 'linear-gradient(145deg, rgba(245, 166, 35, 0.15) 0%, rgba(18, 18, 21, 0.95) 100%)',
            borderColor: 'rgba(245, 166, 35, 0.5)',
            boxShadow: '0 0 25px rgba(245, 166, 35, 0.25)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex items-center justify-between border-b pb-1.5 border-white/10">
            <span className="text-[9px] font-black text-amber-300">DIRECTOR’S CUT 🎥</span>
          </div>
          <p className="text-[10px] font-bold leading-relaxed text-slate-200 my-auto">
            {directorsNote}
          </p>
          <span className="text-[9px] font-extrabold text-amber-400/70 text-center">
            انقر للقلب مجدداً ↻
          </span>
        </div>
      </div>

      <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="text-right space-y-0.5">
          <h3 className="text-xs font-black line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </h3>
          {year && <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{year}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            if (isLongPress.current || isFlipped) return;
            onSelect();
          }}
          disabled={isAdded}
          className="w-full py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all active:scale-95 border"
          style={
            isAdded
              ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', borderColor: 'rgba(52,211,153,0.35)' }
              : { background: 'rgba(245,166,35,0.1)', color: '#fef08a', borderColor: 'rgba(245,166,35,0.35)' }
          }
        >
          {isAdded ? <><Check size={12} strokeWidth={3} /> في المكتبة</> : <><Plus size={12} strokeWidth={3} /> إضافة</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function BrowsePage() {
  const [activeTab, setActiveTab]       = useState<ActiveTab>('movies');
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(true);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [addedIds, setAddedIds]         = useState<Set<number>>(new Set());
  const [error, setError]               = useState<string | null>(null);

  // Mood tab state
  const [selectedMood, setSelectedMood] = useState<MoodKey>('mind_bending');
  const [moodKey, setMoodKey]           = useState(0); // increment to trigger re-fetch

  const [isPending, startTransition]   = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── Fetch for regular tabs ──
  const loadBrowse = useCallback((tab: BrowseTab, pg: number, append: boolean) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/browse?tab=${tab}&page=${pg}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResults((prev) => append ? [...prev, ...(data.results ?? [])] : (data.results ?? []));
        setHasMore(data.hasMore ?? false);
        setError(null);
      } catch {
        setError('تعذّر تحميل النتائج. يرجى المحاولة لاحقاً.');
      }
    });
  }, []);

  // ── Fetch for mood tab ──
  const loadMood = useCallback((mood: MoodKey) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/discover?mood=${mood}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setHasMore(false); // mood uses randomPage, no pagination
        setError(null);
      } catch {
        setError('تعذّر تحميل اقتراحات المود.');
      }
    });
  }, []);

  // ── When tab changes ──
  useEffect(() => {
    setPage(1);
    setResults([]);
    setError(null);
    setHasMore(true);
    if (activeTab === 'mood') {
      loadMood(selectedMood);
    } else {
      loadBrowse(activeTab as BrowseTab, 1, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── When mood changes (within mood tab) ──
  useEffect(() => {
    if (activeTab !== 'mood') return;
    setResults([]);
    setError(null);
    loadMood(selectedMood);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood, moodKey]);

  // ── Load More handler ──
  async function handleLoadMore() {
    if (activeTab === 'mood' || isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/browse?tab=${activeTab}&page=${nextPage}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults((prev) => [...prev, ...(data.results ?? [])]);
      setHasMore(data.hasMore ?? false);
      setPage(nextPage);
    } catch {
      setError('تعذّر تحميل المزيد.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;
  const ActiveIcon = activeTabConfig.icon;
  const activeMoodConfig = MOODS.find((m) => m.key === selectedMood)!;

  return (
    <>
      <div className="flex flex-col min-h-dvh pb-28">

        {/* ── Sticky Header ── */}
        <header
          className="sticky top-0 z-30 px-5 pt-12 pb-4 space-y-4"
          style={{ background: 'linear-gradient(180deg, rgba(5,5,5,0.98) 80%, transparent 100%)', backdropFilter: 'blur(24px)' }}
        >
          <div className="flex items-center gap-2.5 justify-end">
            <h1 className="text-gradient-amber-rose text-2xl font-black tracking-wide">
              استعراض العناوين
            </h1>
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center border transition-all duration-300"
              style={{ background: `${activeTabConfig.color}18`, borderColor: `${activeTabConfig.color}40`, boxShadow: `0 0 16px ${activeTabConfig.color}25` }}
            >
              <ActiveIcon size={18} style={{ color: activeTabConfig.color }} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map(({ key, label, icon: TabIcon, color }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-300 border active:scale-95 flex-shrink-0"
                  style={{
                    background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
                    borderColor: active ? color : 'var(--border-subtle)',
                    color: active ? color : 'var(--text-muted)',
                    boxShadow: active ? `0 0 18px ${color}30` : 'none',
                    transform: active ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <TabIcon size={14} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ── Mood Picker (only shown in mood tab) ── */}
        {activeTab === 'mood' && (
          <div className="px-4 pt-2 pb-4 space-y-3">
            {/* Mood buttons */}
            <div className="flex flex-wrap gap-2 justify-end">
              {MOODS.map(({ key, label, icon: MoodIcon, color }) => {
                const active = selectedMood === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedMood(key)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 border active:scale-95"
                    style={{
                      background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
                      borderColor: active ? color : 'var(--border-subtle)',
                      color: active ? color : 'var(--text-secondary)',
                      boxShadow: active ? `0 0 14px ${color}30` : 'none',
                    }}
                  >
                    <MoodIcon size={14} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mood banner + refresh */}
            <div
              className="glass-panel flex items-center justify-between p-3.5 rounded-2xl"
              style={{ borderColor: `${activeMoodConfig.color}30` }}
            >
              <button
                type="button"
                onClick={() => setMoodKey((k) => k + 1)}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95 disabled:opacity-50"
                style={{ background: `${activeMoodConfig.color}15`, borderColor: `${activeMoodConfig.color}40`, color: activeMoodConfig.color }}
              >
                <RefreshCw size={13} className={isPending ? 'animate-spin' : ''} />
                <span>نتائج جديدة</span>
              </button>
              <div className="text-right">
                <p className="text-xs font-black" style={{ color: activeMoodConfig.color }}>{activeMoodConfig.label}</p>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{activeMoodConfig.sublabel}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <main className="flex-1 px-4 space-y-4">
          {/* Count */}
          {!isPending && results.length > 0 && (
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs font-black" style={{ color: activeTabConfig.color }}>
                {results.length} عنوان
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {activeTabConfig.label}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs py-3 px-4 rounded-2xl text-center font-bold border"
              style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              {error}
            </p>
          )}

          {/* Loading skeletons */}
          {isPending && results.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <ShimmerCard key={i} />)}
            </div>
          )}

          {/* Grid */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.map((item) => (
                <MediaCardItem
                  key={`${item.tmdb_id}-${item.media_type}`}
                  item={item}
                  isAdded={addedIds.has(item.tmdb_id)}
                  onSelect={() => !addedIds.has(item.tmdb_id) && setSelectedItem(item)}
                />
              ))}

              {/* Skeleton placeholders while loading more */}
              {isLoadingMore && Array.from({ length: 6 }).map((_, i) => <ShimmerCard key={`more-${i}`} />)}
            </div>
          )}

          {/* ── Load More button (hidden for mood tab) ── */}
          {!isPending && results.length > 0 && hasMore && activeTab !== 'mood' && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black border transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: 'rgba(245,166,35,0.1)',
                  borderColor: 'rgba(245,166,35,0.4)',
                  color: '#fef08a',
                  boxShadow: '0 0 20px rgba(245,166,35,0.15)',
                }}
              >
                {isLoadingMore
                  ? <><Loader2 size={16} className="animate-spin" /> جاري التحميل…</>
                  : <><ChevronDown size={16} /> تحميل المزيد ({page * 20}+ عنوان)</>
                }
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isPending && results.length === 0 && !error && (
            <div className="glass-panel py-16 rounded-3xl text-center space-y-3" style={{ borderStyle: 'dashed' }}>
              <ActiveIcon size={36} strokeWidth={1.4} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
              <p className="text-sm font-black" style={{ color: 'var(--text-secondary)' }}>لا توجد نتائج</p>
            </div>
          )}
        </main>
      </div>

      <AddToLibrarySheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={() => {
          if (selectedItem) setAddedIds((prev) => new Set(Array.from(prev).concat(selectedItem.tmdb_id)));
        }}
      />
    </>
  );
}
