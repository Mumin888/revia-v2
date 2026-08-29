// ─────────────────────────────────────────────
//  REVIA V2 — Shared TypeScript Interfaces
//  Global Movie & TV Social Platform
// ─────────────────────────────────────────────

export type MediaType = 'movie' | 'series' | 'anime';
export type WatchStatus = 'to_watch' | 'watched' | 'recommended';
export type UserRole = 'user' | 'admin';
export type UserName = string;

export const CUSTOM_TAGS = [
  'مخي عمل Restart',
  'ما كان لازم أشوفو بالليل',
  'عوارة محترمة',
  'دمرني عاطفيًا',
  'ندمت على الساعتين',
  'فيلم ما عندي تعليق عليه',
] as const;

export type CustomTag = (typeof CUSTOM_TAGS)[number];

// ─── User Profile ───────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatar_url: string | null;
  created_at?: string;
}

// ─── Circles (Social Groups) ────────────────

export interface Circle {
  id: string;
  name: string;
  owner_id: string;
  description?: string | null;
  created_at?: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'owner' | 'member';
  profile?: UserProfile;
}

// ─── Supabase DB rows ───────────────────────

export interface MediaItem {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  genres: string[] | null;
  overview: string | null;
  created_at?: string;
}

export interface MediaReview {
  id: string;
  media_id: string;
  user_name: string;
  user_id?: string | null;
  status: WatchStatus;
  rating: number | null; // 1–10
  review: string | null;
  custom_tags: CustomTag[] | null;
  created_at?: string;
  profile?: UserProfile | null;
}

// ─── Combined view (join) ───────────────────

export interface MediaWithReview extends MediaItem {
  reviews: MediaReview[];
}

// ─── TMDB API shapes ────────────────────────

export interface TmdbSearchResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;        // movies
  name?: string;         // tv / person
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  origin_country?: string[];
  overview: string;
}

export interface TmdbSearchResponse {
  results: TmdbSearchResult[];
  total_pages: number;
  total_results: number;
}

// ─── Normalised result returned by /api/search ──

export interface SearchResult {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  genre_ids: number[];
  overview: string;
}
