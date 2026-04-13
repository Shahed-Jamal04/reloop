/**
 * Bootstrap Icons class for a category row from the API.
 * The DB stores the glyph name without the `bi-` prefix (e.g. "tree", "box-seam", "egg-fried").
 * You may also pass a full class token starting with "bi-" — it will be prefixed with "bi ".
 */
export function categoryIconClass(icon) {
  if (icon == null || typeof icon !== 'string') return 'bi bi-grid-3x3-gap';
  const s = icon.trim();
  if (!s) return 'bi bi-grid-3x3-gap';
  if (s.startsWith('bi ')) return s;
  return s.startsWith('bi-') ? `bi ${s}` : `bi bi-${s}`;
}
