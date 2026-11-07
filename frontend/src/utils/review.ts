/**
 * Optional headline only. Customer reviews use body alone — hide empty/duplicate titles.
 */
export function getDisplayReviewTitle(
  title?: string | null,
  body?: string | null,
): string | null {
  const t = (title || '').trim();
  const b = (body || '').trim();
  if (!t) return null;
  if (t.toLowerCase() === b.toLowerCase()) return null;
  if (/^\d-star review$/i.test(t)) return null;
  if (t.endsWith('...') && b.toLowerCase().startsWith(t.slice(0, -3).toLowerCase())) {
    return null;
  }
  return t;
}
