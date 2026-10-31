/**
 * Format month and year as a full title (e.g. "October 2026").
 */
export function formatMonthTitle(year: number, month: number, locale: string): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/**
 * Format month and year as a short tab label (e.g. "Sep26").
 */
export function formatTabLabel(year: number, month: number, locale: string): string {
  const date = new Date(year, month - 1, 1);
  const monthStr = date.toLocaleDateString(locale, { month: 'short' });
  const yearStr = String(year).slice(-2);
  return `${monthStr}${yearStr}`;
}
