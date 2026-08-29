'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import {
  Compass,
  Zap,
  Flame,
  Ghost,
  Smile,
  AlertTriangle,
  Plus,
  Film,
  Tv2,
  Sparkles,
  Calendar,
  Check,
  Star,
} from 'lucide-react';
import type { SearchResult, MediaType } from '@/lib/types';
import type { MoodKey } from '@/app/api/discover/route';
import AddToLibrarySheet from '@/components/AddToLibrarySheet';

export const dynamic = 'force-dynamic';

const MOODS: {
  key: MoodKey;
  label: string;
  sublabel: string;
  icon: typeof Zap;
  color: string;
}[] = [
  {
    key: 'mind_bending',
    label: 'فصلان مخ',
    sublabel: 'أفلام خيال وتشويق تغير تفكيرك',
    icon: Zap,
    color: '#818cf8',
  },
  {
    key: 'emotional',
    label: 'نكد عاطفي',
    sublabel: 'دراما مؤثرة ورومانسية عميقة',
    icon: Flame,
    color: '#f472b6',
  },
  {
    key: 'dark_scary',
    label: 'رعب وإثارة',
    sublabel: 'أجواء مظلمة وحبس أنفاس',
    icon: Ghost,
    color: '#38bdf8',
  },
  {
    key: 'chill_fun',
    label: 'كوميديا وروقان',
    sublabel: 'ضحك وسهرات خفيفة ممتعة',
    icon: Smile,
    color: '#34d399',
  },
  {
    key: 'wtf_shock',
    label: 'صدمة سينمائية',
    sublabel: 'حبكات غير متوقعة ونهايات صادمة',
    icon: AlertTriangle,
    color: '#fbbf24',
  },
];

const TYPE_META: Record<
  MediaType,
  { label: string; Icon: typeof Film; color: string }
> = {
  movie: { label: 'فيلم', Icon: Film, color: '#60a5fa' },
  series: { label: 'مسلسل', Icon: Tv2, color: '#c084fc' },
  anime: { label: 'أنمي', Icon: Sparkles, color: '#f472b6' },
};

export default function DiscoverPage() {
  const [selectedMood, setSelectedMood] = useState<MoodKey>('mind_bending');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/discover?mood=${selectedMood}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setError('تعذّر تحميل اقتراحات المود. يرجى المحاولة لاحقاً.');
        setResults([]);
      }
    });
  }, [selectedMood]);

  const activeMoodConfig = MOODS.find((m) => m.key === selectedMood)!;
  const ActiveIcon = activeMoodConfig.icon;

  return (
    <>
      <div className="flex flex-col min-h-dvh px-5 pt-12 pb-24 space-y-6">
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
              استكشاف حسب المود
            </h1>
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center glow-amber"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              <Compass size={20} color="#090d16" strokeWidth={2.6} />
            </div>
          </div>
          <p className="text-xs text-slate-400 font-semibold">
            اقتراحات سينمائية ذكية مصممة حسب حالتك المزاجية الحالية
          </p>
        </header>

        {/* ── Mood Picker Tabs ────────────────── */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {MOODS.map(({ key, label, icon: MoodIcon, color }) => {
            const active = selectedMood === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMood(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                  active
                    ? 'shadow-xl scale-102 backdrop-blur-xl'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                style={{
                  background: active ? `${color}25` : undefined,
                  borderColor: active ? color : undefined,
                  borderWidth: '1.5px',
                  color: active ? color : undefined,
                }}
              >
                <MoodIcon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Active Mood Banner ──────────────── */}
        <div
          className="p-4 rounded-3xl border border-slate-800 flex items-center justify-between shadow-xl backdrop-blur-xl"
          style={{ background: 'rgba(17, 24, 39, 0.75)' }}
        >
          <span
            className="text-[11px] font-extrabold px-3 py-1 rounded-full border backdrop-blur-md"
            style={{
              background: `${activeMoodConfig.color}15`,
              borderColor: `${activeMoodConfig.color}40`,
              color: activeMoodConfig.color,
            }}
          >
            {results.length} عمل مقترح
          </span>

          <div className="flex items-center gap-3 text-right">
            <div>
              <h2 className="text-sm font-black text-slate-100">
                مود: {activeMoodConfig.label}
              </h2>
              <p className="text-xs text-slate-400">
                {activeMoodConfig.sublabel}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{
                background: `${activeMoodConfig.color}20`,
                color: activeMoodConfig.color,
                border: `1px solid ${activeMoodConfig.color}40`,
              }}
            >
              <ActiveIcon size={19} />
            </div>
          </div>
        </div>

        {/* ── Results Grid ────────────────────── */}
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-2xl text-center">
              {error}
            </p>
          )}

          {isPending && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl p-2.5 bg-slate-900/60 border border-slate-800 space-y-2.5"
                >
                  <div className="h-48 rounded-2xl shimmer w-full" />
                  <div className="h-3.5 rounded-md shimmer w-3/4" />
                  <div className="h-3 rounded-md shimmer w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isPending && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {results.map((item) => {
                const typeInfo = TYPE_META[item.media_type] || TYPE_META.movie;
                const isAdded = addedIds.has(item.tmdb_id);
                const year = item.release_date
                  ? new Date(item.release_date).getFullYear()
                  : null;

                return (
                  <div
                    key={item.tmdb_id}
                    className="group relative rounded-3xl overflow-hidden p-2.5 border border-slate-800/80 bg-slate-900/75 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-xl"
                  >
                    {/* Poster container */}
                    <div
                      className="relative w-full h-48 rounded-2xl overflow-hidden mb-2"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      {item.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                          <Film size={32} />
                        </div>
                      )}

                      <div className="poster-overlay absolute inset-0" />

                      {/* Type Badge */}
                      <span
                        className="absolute top-2 start-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md backdrop-blur-md"
                        style={{
                          background: 'rgba(9, 13, 22, 0.85)',
                          color: typeInfo.color,
                          border: `1px solid ${typeInfo.color}40`,
                        }}
                      >
                        {typeInfo.label}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 text-right flex-1 px-0.5">
                      <h3 className="text-xs font-bold line-clamp-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 justify-end text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                        {item.vote_average > 0 && (
                          <span
                            className="flex items-center gap-0.5 font-black"
                            style={{
                              color: item.vote_average >= 8 ? '#34d399' : item.vote_average >= 6.5 ? '#f5a623' : '#f87171',
                            }}
                          >
                            <Star size={10} fill="currentColor" />
                            {item.vote_average.toFixed(1)}
                          </span>
                        )}
                        {year && (
                          <span className="flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                            <Calendar size={10} />
                            {year}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Add Button */}
                    <button
                      type="button"
                      onClick={() => !isAdded && setSelectedItem(item)}
                      disabled={isAdded}
                      className={`w-full mt-2.5 py-2 px-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isAdded
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 active:scale-98'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={14} />
                          <span>في المكتبة</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>إضافة للمكتبة</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add to Library Bottom Sheet ────── */}
      <AddToLibrarySheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={() => {
          if (selectedItem) {
            setAddedIds(
              (prev) => new Set(Array.from(prev).concat(selectedItem.tmdb_id))
            );
          }
        }}
      />
    </>
  );
}
