'use client';

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Telescope, Film, Loader2 } from 'lucide-react';
import type { SearchResult } from '@/lib/types';
import SearchResultCard from '@/components/SearchResultCard';
import AddToLibrarySheet from '@/components/AddToLibrarySheet';
import { SearchResultSkeleton } from '@/components/MediaCardSkeleton';

export const dynamic = 'force-dynamic';

import { showToast } from '@/components/Toaster';

const MASTERMINDS_CARD: SearchResult = {
  tmdb_id: 8880001,
  media_type: 'movie',
  title: 'The Masterminds',
  poster_path: null,
  release_date: '2026-08-29',
  genre_ids: [18, 878, 35],
  overview: 'The Masterminds — قصة المطورين العباقرة الذين سهروا الليالي في كتابة الأكواد وتصميم واجهات زجاجية سينمائية ساحرة لابتكار منصة REVIA: الوجهة الأولى للمشاهدة المشتركة وتوثيق الذوق السينمائي!',
  vote_average: 10.0,
};

// ─── Debounce hook ───────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Page ─────────────────────────────────────
export default function SearchPage() {
  const router                          = useRouter();
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [addedIds, setAddedIds]         = useState<Set<number>>(new Set());
  const [error, setError]               = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const [isUpsideDown, setIsUpsideDown] = useState(false);
  const inputRef                        = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query.trim(), 380);

  // ── Stranger Things Easter Egg ─────────────────
  useEffect(() => {
    const clean = query.trim().toLowerCase();
    if (clean === 'stranger things') {
      setIsUpsideDown(true);
      showToast('Upside Down Mode Activated! 🌲🩸');
      const timer = setTimeout(() => {
        setIsUpsideDown(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [query]);

  // ── Fetch on debounced query change ─────────
  const fetchResults = useCallback(async (q: string) => {
    if (!q) { setResults([]); return; }
    setError(null);

    // ── Secret Search Card & Page Easter Egg ──────────
    const cleanLower = q.toLowerCase();
    if (cleanLower === 'revia' || cleanLower === 'ozz') {
      setResults([MASTERMINDS_CARD]);
      showToast('Entering Secret Vault: The Masterminds 🚀');
      const timer = setTimeout(() => {
        router.push('/the-masterminds');
      }, 600);
      return () => clearTimeout(timer);
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setResults(json.results ?? []);
      } catch {
        setError('تعذّر جلب النتائج. تحقق من اتصالك وحاول مجدداً.');
        setResults([]);
      }
    });
  }, [router]);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  function clearSearch() {
    setQuery('');
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  }

  function handleAdd(item: SearchResult) {
    if (item.tmdb_id === MASTERMINDS_CARD.tmdb_id) {
      router.push('/the-masterminds');
      return;
    }
    setSelectedItem(item);
  }

  return (
    <>
      {/* ── Stranger Things Scary Overlay ── */}
      {isUpsideDown && (
        <div
          className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden select-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(180, 0, 0, 0.45) 0%, rgba(70, 0, 0, 0.85) 70%, rgba(10, 0, 0, 0.95) 100%)',
            animation: 'bloodFlicker 0.28s infinite alternate',
          }}
        >
          {/* Creepy Shadow Vines framing the entire screen */}
          <svg className="absolute inset-0 w-full h-full opacity-95" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,0 Q20,25 35,5 T70,22 T100,0 L100,8 Q80,28 65,12 T25,26 T0,8 Z" fill="#080002" stroke="#ff1a1a" strokeWidth="0.4" />
            <path d="M0,100 Q25,75 40,95 T75,78 T100,100 L100,92 Q75,72 60,88 T20,74 T0,92 Z" fill="#080002" stroke="#ff1a1a" strokeWidth="0.4" />
            <path d="M0,0 Q18,25 6,50 T22,75 T0,100 L6,100 Q24,75 12,50 T26,25 T6,0 Z" fill="#080002" stroke="#ff1a1a" strokeWidth="0.4" />
            <path d="M100,0 Q82,25 94,50 T78,75 T100,100 L94,100 Q76,75 88,50 T74,25 T94,0 Z" fill="#080002" stroke="#ff1a1a" strokeWidth="0.4" />
          </svg>

          {/* Demogorgon Silhouette emerging */}
          <div className="absolute bottom-6 inset-x-0 flex flex-col items-center justify-center animate-pulse">
            <svg className="w-44 h-44 drop-shadow-[0_0_30px_rgba(255,0,0,0.9)]" viewBox="0 0 100 100" fill="#060002">
              <polygon points="50,8 59,34 41,34" stroke="#ff1a1a" strokeWidth="1.2" />
              <polygon points="92,44 68,48 74,33" stroke="#ff1a1a" strokeWidth="1.2" />
              <polygon points="8,44 32,48 26,33" stroke="#ff1a1a" strokeWidth="1.2" />
              <polygon points="76,86 58,62 68,53" stroke="#ff1a1a" strokeWidth="1.2" />
              <polygon points="24,86 42,62 32,53" stroke="#ff1a1a" strokeWidth="1.2" />
              <circle cx="50" cy="50" r="14" fill="#250003" stroke="#ff0000" strokeWidth="1.8" />
              <circle cx="50" cy="50" r="5" fill="#ff0000" className="animate-ping" />
            </svg>
            <span
              className="font-mono text-xs font-black tracking-[0.35em] text-red-500 uppercase mt-2"
              style={{ textShadow: '0 0 12px rgba(255,0,0,1), 0 0 24px rgba(255,0,0,0.8)' }}
            >
              WELCOME TO THE UPSIDE DOWN
            </span>
          </div>

          {/* Red spores and ash particles */}
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${3 + (i % 5)}px`,
                height: `${3 + (i % 5)}px`,
                top: `${(i * 17) % 100}%`,
                left: `${(i * 31) % 100}%`,
                background: i % 2 === 0 ? '#ff1a1a' : '#ff6666',
                boxShadow: '0 0 8px #ff0000',
                animation: `sporesDrift ${1.4 + (i % 3)}s ${(i * 0.15)}s infinite ease-in`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className={`flex flex-col min-h-dvh pb-24 transition-all duration-700 ease-in-out ${
          isUpsideDown ? 'upside-down-scary' : ''
        }`}
      >
        {/* ── Sticky Search Header ─────────── */}
        <header className="sticky top-0 z-30 px-5 pt-12 pb-4 space-y-4"
          style={{
            background: 'linear-gradient(180deg, rgba(5,5,5,0.98) 60%, transparent 100%)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Title row */}
          <div className="flex items-center gap-2.5 justify-end">
            <h1 className="text-gradient-amber-rose text-2xl font-black tracking-wide">
              البحث السينمائي
            </h1>
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center border"
              style={{
                background: 'rgba(245,166,35,0.12)',
                borderColor: 'rgba(245,166,35,0.35)',
                boxShadow: '0 0 14px rgba(245,166,35,0.18)',
              }}
            >
              <Search size={17} strokeWidth={2.5} style={{ color: 'var(--accent-amber)' }} />
            </div>
          </div>

          {/* ── Search Input ── */}
          <div className="relative group">
            {/* Icon */}
            <Search
              size={18}
              className="absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
              style={{ color: 'var(--text-muted)' }}
            />

            <input
              ref={inputRef}
              id="search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن فيلم، مسلسل، أو أنمي…"
              autoComplete="off"
              dir="rtl"
              className="w-full rounded-2xl text-sm font-semibold text-right transition-all duration-300 outline-none"
              style={{
                background: 'rgba(18, 18, 21, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                paddingTop: '0.9rem',
                paddingBottom: '0.9rem',
                paddingRight: '3rem',
                paddingLeft: query ? '3rem' : '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-amber)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15), 0 4px 24px rgba(0,0,0,0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
              }}
            />

            {/* Clear / Loading */}
            {isPending ? (
              <div className="absolute start-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--accent-amber)' }}>
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : query ? (
              <button
                onClick={clearSearch}
                aria-label="مسح البحث"
                className="absolute start-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </header>

        {/* ── Content ──────────────────────── */}
        <main className="flex-1 px-5 pt-5 space-y-4">
          {/* Error */}
          {error && (
            <p
              className="text-xs py-3 px-4 rounded-2xl text-center font-bold border"
              style={{
                color: '#f87171',
                background: 'rgba(239,68,68,0.1)',
                borderColor: 'rgba(239,68,68,0.3)',
              }}
            >
              {error}
            </p>
          )}

          {/* Results count */}
          {!isPending && results.length > 0 && (
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-black" style={{ color: 'var(--accent-amber)' }}>
                {results.length} نتيجة
              </span>
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                «{query}»
              </span>
            </div>
          )}

          {/* Results / Skeletons */}
          {isPending ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SearchResultSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-3">
              {results.map((result) => (
                <SearchResultCard
                  key={`${result.media_type}-${result.tmdb_id}`}
                  result={result}
                  inLibrary={addedIds.has(result.tmdb_id)}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          ) : !query ? (
            /* Idle state */
            <div className="py-20 text-center space-y-4 animate-fade-in-up">
              <div
                className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border"
                style={{
                  background: 'rgba(245,166,35,0.07)',
                  borderColor: 'rgba(245,166,35,0.25)',
                }}
              >
                <Telescope size={36} strokeWidth={1.4} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                  ابحث واستكشف آلاف العناوين
                </h3>
                <p
                  className="text-xs max-w-xs mx-auto leading-relaxed font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  اكتب اسم أي فيلم أو مسلسل أو أنمي لإضافته لمكتبتك
                </p>
              </div>
            </div>
          ) : !isPending ? (
            /* No results */
            <div className="py-20 text-center space-y-4 animate-fade-in-up">
              <div
                className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border"
                style={{
                  background: 'rgba(232,121,249,0.07)',
                  borderColor: 'rgba(232,121,249,0.25)',
                }}
              >
                <Film size={36} strokeWidth={1.4} style={{ color: 'var(--accent-rose)' }} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                  لم نعثر على نتائج مطابقة
                </h3>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  تأكد من صحة الكلمات أو جرب البحث بالإنجليزية
                </p>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* ── Add to Library Sheet ── */}
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
