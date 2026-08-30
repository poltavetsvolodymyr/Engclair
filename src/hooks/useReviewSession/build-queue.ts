import { isDue } from '@/lib/sm2'
import type { ProgressMap } from '@/lib/storage'
import type { Card } from '@/types'

/**
 * Card ids that are due right now, most overdue first. Cards that have never
 * been reviewed count as due and sort to the front (their stored due time is 0).
 */
export function buildQueue(
  cards: Card[],
  progress: ProgressMap,
  now: number,
): string[] {
  return cards
    .filter((card) => isDue(progress[card.id], now))
    .sort((a, b) => (progress[a.id]?.due ?? 0) - (progress[b.id]?.due ?? 0))
    .map((card) => card.id)
}
