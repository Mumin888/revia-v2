// ─────────────────────────────────────────────
//  REVIA V2 — /api/discover
//  TMDB Mood & Genre Discovery Route Handler
// ─────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import type { SearchResult, TmdbSearchResult, MediaType } from '@/lib/types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const ANIME_GENRE_ID = 16;
const ANIME_ORIGIN = 'JP';

export type MoodKey =
  | 'mind_bending'
  | 'emotional'
  | 'dark_scary'
  | 'chill_fun'
  | 'wtf_shock';

const MOOD_CONFIG: Record<
  MoodKey,
  {
    genres: string;
    sortBy: string;
    voteCountGte: number;
  }
> = {
  mind_bending: {
    genres: '878,9648,53', // Sci-Fi, Mystery, Thriller
    sortBy: 'vote_average.desc',
    voteCountGte: 350,
  },
  emotional: {
    genres: '18,10749', // Drama, Romance
    sortBy: 'vote_average.desc',
    voteCountGte: 300,
  },
  dark_scary: {
    genres: '27,53,9648', // Horror, Thriller, Mystery
    sortBy: 'popularity.desc',
    voteCountGte: 200,
  },
  chill_fun: {
    genres: '35,16,10751', // Comedy, Animation, Family
    sortBy: 'popularity.desc',
    voteCountGte: 250,
  },
  wtf_shock: {
    genres: '80,9648,53', // Crime, Mystery, Thriller
    sortBy: 'vote_average.desc',
    voteCountGte: 300,
  },
};

function classifyMedia(item: TmdbSearchResult): MediaType {
  if (item.media_type === 'movie' || (!item.media_type && item.title)) {
    return 'movie';
  }

  const isAnime =
    item.genre_ids.includes(ANIME_GENRE_ID) &&
    (item.origin_country ?? []).includes(ANIME_ORIGIN);

  return isAnime ? 'anime' : 'series';
}

function normalise(item: TmdbSearchResult, defaultType: 'movie' | 'tv'): SearchResult {
  const mediaType: 'movie' | 'tv' = item.media_type === 'tv' || defaultType === 'tv' ? 'tv' : 'movie';
  const fullItem: TmdbSearchResult = { ...item, media_type: mediaType };

  return {
    tmdb_id: item.id,
    media_type: classifyMedia(fullItem),
    title: item.title ?? item.name ?? 'Unknown',
    poster_path: item.poster_path,
    release_date: item.release_date ?? item.first_air_date ?? null,
    genre_ids: item.genre_ids ?? [],
    overview: item.overview ?? '',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mood = (searchParams.get('mood') as MoodKey) || 'mind_bending';
  const page = searchParams.get('page') || '1';

  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.mind_bending;
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'TMDB_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  const movieUrl =
    `${TMDB_BASE}/discover/movie` +
    `?api_key=${apiKey}` +
    `&with_genres=${config.genres}` +
    `&sort_by=${config.sortBy}` +
    `&vote_count.gte=${config.voteCountGte}` +
    `&language=ar-SA` +
    `&include_adult=false` +
    `&page=${page}`;

  try {
    const res = await fetch(movieUrl, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `TMDB error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const results: SearchResult[] = (data.results as TmdbSearchResult[])
      .filter((item) => Boolean(item.poster_path))
      .map((item) => normalise(item, 'movie'));

    return NextResponse.json({ results, mood, page: data.page }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch discovery titles.' },
      { status: 502 }
    );
  }
}
