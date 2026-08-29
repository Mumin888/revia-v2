'use client';

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useTransition,
} from 'react';
import { Search, X, Telescope, Film, Loader2 } from 'lucide-react';
import type { SearchResult } from '@/lib/types';
import SearchResultCard from '@/components/SearchResultCard';
import AddToLibrarySheet from '@/components/AddToLibrarySheet';

export const dynamic = 'force-dynamic';

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
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [addedIds, setAddedIds]         = useState<Set<number>>(new Set());
  const [error, setError]               = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const inputRef                        = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query.trim(), 380);

  // ── Fetch on debounced query change ─────────
  const fetchResults = useCallback(async (q: string) => {
    if (!q) { setResults([]); return; }
    setError(null);

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
  }, []);

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
    setSelectedItem(item);
  }

  return (
    <>
      <div className="flex flex-col min-h-dvh pb-24">
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
          {results.length > 0 && (
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-black" style={{ color: 'var(--accent-amber)' }}>
                {results.length} نتيجة
              </span>
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                «{query}»
              </span>
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
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
