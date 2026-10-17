// ─────────────────────────────────────────────────────────────
//  REVIA V2 — Premium Shimmering Skeleton Loaders
//  Matches exact dimensions of MediaCard, Grid cards, and SearchResultCard.
// ─────────────────────────────────────────────────────────────

/**
 * Exact dimensions matching `MediaCard`:
 * - Width: w-36 (144px)
 * - Poster: w-36 h-52 rounded-3xl
 * - Title & Year metadata below poster
 */
export function MediaCardSkeleton() {
  return (
    <div className="w-36 flex-shrink-0 text-right select-none animate-pulse">
      {/* Poster box with exact MediaCard dimensions */}
      <div
        className="relative w-36 h-52 rounded-3xl overflow-hidden border shadow-lg"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="w-full h-full shimmer" />
        {/* Floating pill placeholders inside poster */}
        <div className="absolute top-2 start-2 w-9 h-4 rounded-md shimmer-subtle opacity-70" />
        <div className="absolute top-2 end-2 w-7 h-4 rounded-md shimmer-subtle opacity-70" />
      </div>

      {/* Title & Year Metadata */}
      <div className="mt-2.5 px-1 space-y-1.5 text-right">
        <div className="h-3.5 w-4/5 rounded-md shimmer ms-auto" />
        <div className="h-2.5 w-1/2 rounded-md shimmer-subtle ms-auto opacity-70" />
      </div>
    </div>
  );
}

/**
 * Grid layout card skeleton matching Discover & Browse grids:
 * - Rounded 3xl glass card
 * - Aspect 2/3 or h-48 poster
 * - Title, rating/year pills, and action button
 */
export function MediaGridSkeleton() {
  return (
    <div
      className="group relative rounded-3xl overflow-hidden p-2.5 border shadow-xl flex flex-col justify-between select-none"
      style={{
        background: 'rgba(18, 18, 21, 0.6)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Poster placeholder */}
      <div
        className="relative w-full h-48 rounded-2xl overflow-hidden mb-2.5"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div className="w-full h-full shimmer" />
        <div className="absolute top-2 start-2 w-10 h-4 rounded-md shimmer-subtle opacity-75" />
      </div>

      {/* Meta info placeholders */}
      <div className="space-y-1.5 text-right flex-1 px-0.5">
        <div className="h-3.5 w-3/4 rounded-md shimmer ms-auto" />
        <div className="h-2.5 w-1/2 rounded-md shimmer-subtle ms-auto opacity-75" />
      </div>

      {/* Action button placeholder */}
      <div className="mt-3">
        <div className="h-8 rounded-xl shimmer-subtle w-full opacity-60" />
      </div>
    </div>
  );
}

/**
 * Search list card skeleton matching `SearchResultCard`:
 * - Glass panel with poster, title/metadata, and quick-add icon
 */
export function SearchResultSkeleton() {
  return (
    <div
      className="glass-panel flex items-center gap-3.5 p-3.5 rounded-3xl select-none"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Poster */}
      <div
        className="relative w-14 h-20 rounded-2xl overflow-hidden flex-shrink-0 border"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="w-full h-full shimmer" />
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 text-right space-y-2">
        <div className="h-4 w-3/5 rounded-md shimmer ms-auto" />
        <div className="flex items-center gap-2 justify-end">
          <div className="h-3 w-12 rounded-md shimmer-subtle opacity-75" />
          <div className="h-3 w-16 rounded-md shimmer-subtle opacity-75" />
        </div>
      </div>

      {/* Action button */}
      <div className="w-9 h-9 rounded-2xl shimmer-subtle flex-shrink-0 opacity-50" />
    </div>
  );
}

export default MediaCardSkeleton;
