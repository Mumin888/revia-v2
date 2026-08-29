// ─────────────────────────────────────────────
//  REVIA — /api/search
//  TMDB multi-search with anime classification.
//
//  Anime = media_type 'tv'
//          AND genre_ids includes 16 (Animation)
//          AND origin_country includes 'JP'
// ─────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import type { MediaType, SearchResult, TmdbSearchResult } from '@/lib/types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const ANIME_GENRE_ID = 16; // Animation genre on TMDB
const ANIME_ORIGIN = 'JP';

function classifyMedia(item: TmdbSearchResult): MediaType {
  if (item.media_type === 'movie') return 'movie';

  const isAnime =
    item.genre_ids.includes(ANIME_GENRE_ID) &&
    (item.origin_country ?? []).includes(ANIME_ORIGIN);

  return isAnime ? 'anime' : 'series';
}

function normalise(item: TmdbSearchResult): SearchResult {
  return {
    tmdb_id: item.id,
    media_type: classifyMedia(item),
    title: item.title ?? item.name ?? 'Unknown',
    poster_path: item.poster_path,
    release_date: item.release_date ?? item.first_air_date ?? null,
    genre_ids: item.genre_ids,
    overview: item.overview,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter ?q=' },
      { status: 400 }
    );
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'TMDB_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  const tmdbUrl =
    `${TMDB_BASE}/search/multi` +
    `?api_key=${apiKey}` +
    `&query=${encodeURIComponent(query)}` +
    `&language=ar-SA` +           // prefer Arabic metadata where available
    `&include_adult=false` +
    `&page=1`;

  let tmdbRes: Response;
  try {
    tmdbRes = await fetch(tmdbUrl, {
      // Cache each unique query for 60 s on the edge
      next: { revalidate: 60 },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach TMDB.' },
      { status: 502 }
    );
  }

  if (!tmdbRes.ok) {
    return NextResponse.json(
      { error: `TMDB error: ${tmdbRes.status}` },
      { status: tmdbRes.status }
    );
  }

  const body = await tmdbRes.json();

  // Filter out persons & unknown types, then normalise
  const results: SearchResult[] = (body.results as TmdbSearchResult[])
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .map(normalise);

  return NextResponse.json({ results }, { status: 200 });
}
