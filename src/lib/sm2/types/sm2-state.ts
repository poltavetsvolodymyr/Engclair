/** Scheduling state SM-2 keeps for a single card. */
export interface Sm2State {
  /** Number of consecutive successful recalls (quality >= 3). */
  repetitions: number
  /** Ease factor, clamped to a minimum of 1.3. Starts at 2.5. */
  easeFactor: number
  /** Current inter-repetition interval, in whole days. */
  interval: number
  /** Epoch milliseconds when the card is next due. */
  due: number
  /** Epoch milliseconds of the last review, or null if never reviewed. */
  lastReviewed: number | null
}
