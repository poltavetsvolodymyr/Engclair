import type { GradeKey } from '@/types'

/**
 * Bridge between the four UI grade buttons and SM-2's 0-5 recall quality.
 *
 * Shared, not component-local: the grade buttons use it to preview the next
 * interval, and the review session uses it to actually schedule the card.
 */
export const GRADE_QUALITY: Record<GradeKey, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
}

/** SM-2 treats anything below 3 as a failed recall. */
export function isFailedGrade(grade: GradeKey): boolean {
  return GRADE_QUALITY[grade] < 3
}
