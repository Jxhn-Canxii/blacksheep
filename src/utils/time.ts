/**
 * Pure time-formatting utility — no React or Supabase imports.
 */

export function formatTimeAgo(date: string | Date): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(parsed.getTime())) return '';

  const elapsed = Math.floor((Date.now() - parsed.getTime()) / 1000);

  if (elapsed < 60) return `${elapsed}s ago`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;

  return new Date(date).toLocaleDateString([], { dateStyle: 'short' });
}
