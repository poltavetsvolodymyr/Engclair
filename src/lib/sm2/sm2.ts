import type { Sm2State } from './types/sm2-state'

/**
 * SuperMemo SM-2 spaced-repetition algorithm.
 *
 * Reference: https://super-memory.com/english/ol/sm2.htm
 *
 * Pure and side-effect free: a grade of 0-5 ("quality of recall") goes in, the
 * updated scheduling state comes out. Nothing here knows about React or storage.
 */

export const DAY_MS = 24 * 60 * 60 * 1000

/** Scheduling state for a card that has never been reviewed. */
export const INITIAL_SM2: Sm2State = {
  repetitions: 0,
  easeFactor: 2.5,
  interval: 0,
  due: 0,
  lastReviewed: null,
}

const MIN_EASE_FACTOR = 1.3

function clampQuality(quality: number): number {
  if (quality < 0) return 0
  if (quality > 5) return 5
  return Math.round(quality)
}

/**
 * Apply one review to a card's SM-2 state.
 *
 * @param state    Previous scheduling state (use INITIAL_SM2 for new cards).
 * @param quality  Recall grade, 0 (blackout) to 5 (perfect).
 * @param now      Current time in epoch ms; injectable for tests.
 */
export function schedule(
  state: Sm2State,
  quality: number,
  now: number = Date.now(),
): Sm2State {
  const q = clampQuality(quality)

  let repetitions: number
  let interval: number

  if (q < 3) {
    // Failed recall: restart the repetition count, review again tomorrow.
    repetitions = 0
    interval = 1
  } else {
    repetitions = state.repetitions + 1
    if (repetitions === 1) {
      interval = 1
    } else if (repetitions === 2) {
      interval = 6
    } else {
      interval = Math.round(state.interval * state.easeFactor)
    }
  }

  // Ease factor is always updated, then clamped.
  const nextEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  )

  return {
    repetitions,
    easeFactor: nextEaseFactor,
    interval,
    due: now + interval * DAY_MS,
    lastReviewed: now,
  }
}

/** True if the card should be shown now (never reviewed, or past its due time). */
export function isDue(state: Sm2State | undefined, now: number = Date.now()): boolean {
  if (!state || state.lastReviewed === null) return true
  return state.due <= now
}
