// ─────────────────────────────────────────────
//  REVIA — Input-safety helpers shared by pages,
//  route handlers and client components.
// ─────────────────────────────────────────────
import type { MediaReview } from '@/lib/types';

/**
 * Post-login destination. Only paths on this site are accepted, so a crafted
 * `?redirect=` link cannot send a freshly signed-in user to another origin.
 */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/')) return '/';
  try {
    const base = 'http://revia.invalid';
    const url = new URL(raw, base);
    // `//host`, `/\host` and paths with embedded control characters all
    // resolve to a different origin here and are rejected.
    if (url.origin !== base) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

/**
 * Turns a value into an `ilike` pattern that matches it literally
 * (case-insensitive equality). PostgREST also treats `*` as a wildcard and
 * offers no way to escape it, so such values cannot be matched: returns null.
 */
export function ilikeLiteral(value: string): string | null {
  if (!value || value.includes('*')) return null;
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 30;

/** Sign-up rules for usernames. Returns an Arabic error message, or null when valid. */
export function validateUsername(username: string): string | null {
  if (!username) return 'يرجى كتابة اسم المستخدم.';
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return `اسم المستخدم يجب أن يكون بين ${USERNAME_MIN_LENGTH} و ${USERNAME_MAX_LENGTH} حرفاً.`;
  }
  // `@` would make the name look like an e-mail at login; the rest are
  // wildcard / filter / path characters that have no place in a name.
  if (/[@%*,()\\/]/.test(username)) {
    return 'اسم المستخدم لا يمكن أن يحتوي على الرموز @ % * , ( ) / \\';
  }
  return null;
}

/**
 * Whether a review belongs to the given user. The user id decides; matching
 * by name is only a fallback for old rows that were saved without an id, so
 * two accounts with the same display name can never touch each other's rows.
 */
export function isOwnReview(
  review: Pick<MediaReview, 'user_id' | 'user_name'>,
  userId: string | null | undefined,
  userName: string | null | undefined
): boolean {
  if (review.user_id) return Boolean(userId) && review.user_id === userId;
  return Boolean(userName) && review.user_name.toLowerCase() === userName!.toLowerCase();
}
