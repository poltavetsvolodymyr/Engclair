import type { Sm2State } from '@/lib/sm2'
import type { Card, GradeKey } from '@/types'

/** Everything the UI needs to run a review session. Returned by useReviewSession. */
export interface ReviewSession {
  /** The card being reviewed, or undefined when the queue is empty. */
  currentCard: Card | undefined
  /** Scheduling state of `currentCard` before this review; used for previews. */
  currentState: Sm2State
  /** Whether the answer side is visible. */
  revealed: boolean
  /** Cards graded during this session. */
  reviewedCount: number
  /** Cards still queued, including the current one. */
  remaining: number
  reveal: () => void
  grade: (grade: GradeKey) => void
  /** Wipes saved progress and restarts. Confirmation is the caller's job. */
  reset: () => void
}
