import Image from 'next/image';
import { Plus, Film, Tv2, Sparkles, Check, Calendar } from 'lucide-react';
import type { SearchResult } from '@/lib/types';

const TYPE_META = {
  movie:  { label: 'فيلم',   Icon: Film,     color: '#60a5fa' },
  series: { label: 'مسلسل',  Icon: Tv2,      color: '#c084fc' },
  anime:  { label: 'أنمي',   Icon: Sparkles, color: '#e879f9' },
} as const;

interface SearchResultCardProps {
  result: SearchResult;
  inLibrary?: boolean;
  onAdd: (result: SearchResult) => void;
}

export default function SearchResultCard({ result, inLibrary = false, onAdd }: SearchResultCardProps) {
  const meta = TYPE_META[result.media_type] || TYPE_META.movie;
  const Icon = meta.Icon;
  const year = result.release_date?.slice(0, 4);

  return (
    <div
      className="glass-panel flex items-center gap-3.5 p-3.5 rounded-3xl transition-all duration-200 active:scale-[0.98]"
      style={{
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Poster */}
      <div
        className="relative w-14 h-20 rounded-2xl overflow-hidden flex-shrink-0 border"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
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

      {/* Info */}
      <div className="flex-1 min-w-0 text-right space-y-1">
        <p className="font-black text-sm leading-snug line-clamp-1" style={{ color: 'var(--text-primary)' }}>
          {result.title}
        </p>
        <div className="flex items-center gap-2 justify-end text-xs">
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
        {result.overview && (
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {result.overview}
          </p>
        )}
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={() => !inLibrary && onAdd(result)}
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
