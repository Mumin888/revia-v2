// REVIA V2 — /api/browse
// Supports: movies | tv | anime | top_rated
// Accepts &page=N to support Load More (fetches that specific page)
import { NextRequest, NextResponse } from 'next/server';
import type { SearchResult } from '@/lib/types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const ANIME_GENRE_ID = 16;
const ANIME_ORIGIN = 'JP';

export type BrowseTab = 'movies' | 'tv' | 'anime' | 'top_rated';

interface TmdbItem {
  id: number;
  media_type?: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  origin_country?: string[];
  overview?: string;
  vote_average?: number;
}

type DefaultType = 'movie' | 'tv';

function classifyType(item: TmdbItem, defaultType: DefaultType): import('@/lib/types').MediaType {
  const type = item.media_type ?? defaultType;
  if (type === 'movie') return 'movie';
  const isAnime =
    (item.genre_ids ?? []).includes(ANIME_GENRE_ID) &&
    (item.origin_country ?? []).includes(ANIME_ORIGIN);
  return isAnime ? 'anime' : 'series';
}

function normalise(item: TmdbItem, defaultType: DefaultType): SearchResult {
  return {
    tmdb_id: item.id,
    media_type: classifyType(item, defaultType),
    title: item.title ?? item.name ?? 'Unknown',
    poster_path: item.poster_path,
    release_date: item.release_date ?? item.first_air_date ?? null,
    genre_ids: item.genre_ids ?? [],
    overview: item.overview ?? '',
    vote_average: item.vote_average ?? 0,
  };
}

async function fetchPage(url: string, defaultType: DefaultType): Promise<SearchResult[]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const data = await res.json();
  return (data.results as TmdbItem[])
    .filter((i) => Boolean(i.poster_path))
    .map((i) => normalise(i, defaultType));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab  = (searchParams.get('tab') as BrowseTab) || 'movies';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB_API_KEY not configured.' }, { status: 500 });
  }

  const qs = (p: number) =>
    `?api_key=${apiKey}&language=en-US&include_adult=false&page=${p}`;

  try {
    if (tab === 'top_rated') {
      // Top-rated: merge movie + tv, sorted by rating
      const [movRes, tvRes] = await Promise.all([
        fetch(`${TMDB_BASE}/movie/top_rated${qs(page)}`, { cache: 'no-store' }),
        fetch(`${TMDB_BASE}/tv/top_rated${qs(page)}`, { cache: 'no-store' }),
      ]);
      const [movData, tvData] = await Promise.all([movRes.json(), tvRes.json()]);
      const combined: SearchResult[] = [
        ...(movData.results as TmdbItem[]).filter((i) => Boolean(i.poster_path)).map((i) => normalise(i, 'movie')),
        ...(tvData.results as TmdbItem[]).filter((i) => Boolean(i.poster_path)).map((i) => normalise(i, 'tv')),
      ].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
      return NextResponse.json({ results: combined, hasMore: page < 10 }, { status: 200 });
    }

    let url: string;
    let defaultType: DefaultType = 'movie';

    if (tab === 'movies') {
      url = `${TMDB_BASE}/movie/popular${qs(page)}`;
      defaultType = 'movie';
    } else if (tab === 'tv') {
      url = `${TMDB_BASE}/tv/popular${qs(page)}`;
      defaultType = 'tv';
    } else if (tab === 'anime') {
      url = `${TMDB_BASE}/discover/tv${qs(page)}&with_genres=${ANIME_GENRE_ID}&with_origin_country=${ANIME_ORIGIN}&sort_by=popularity.desc`;
      defaultType = 'tv';
    } else {
      url = `${TMDB_BASE}/movie/popular${qs(page)}`;
      defaultType = 'movie';
    }

    const results = await fetchPage(url, defaultType);
    return NextResponse.json({ results, hasMore: page < 10 }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Failed to fetch browse results.' }, { status: 502 });
  }
}
