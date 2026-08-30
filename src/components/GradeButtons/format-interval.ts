/**
 * Render a scheduling interval compactly enough to fit on a phone-sized button
 * ("1d", "12d", "3mo", "1.4y"). Display-only, so it stays with the component.
 */
export function formatInterval(days: number): string {
  if (days <= 1) return '1d'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}
