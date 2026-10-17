// ─────────────────────────────────────────────
//  REVIA V2 — /library route redirect
//  Redirects to /profile where user library
//  items, lists, and statistics are managed.
// ─────────────────────────────────────────────
import { redirect } from 'next/navigation';

export default function LibraryPage() {
  redirect('/profile');
}
