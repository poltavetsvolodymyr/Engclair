import { describe, expect, it } from 'vitest'

import { DAY_MS, INITIAL_SM2, isDue, schedule } from './sm2'
import type { Sm2State } from './types/sm2-state'

/** Fixed clock so every assertion about `due` is exact. */
const NOW = Date.UTC(2026, 0, 1)

/** Recall qualities, named for readability. */
const AGAIN = 2
const HARD = 3
const GOOD = 4
const EASY = 5

describe('INITIAL_SM2', () => {
  it('describes a card that has never been reviewed', () => {
    expect(INITIAL_SM2).toEqual({
      repetitions: 0,
      easeFactor: 2.5,
      interval: 0,
      due: 0,
      lastReviewed: null,
    })
  })
})

describe('schedule', () => {
  it('does not mutate the state it is given', () => {
    const before: Sm2State = { ...INITIAL_SM2 }
    schedule(before, GOOD, NOW)
    expect(before).toEqual(INITIAL_SM2)
  })

  it('stamps the review time and derives due from the new interval', () => {
    const next = schedule(INITIAL_SM2, GOOD, NOW)

    expect(next.lastReviewed).toBe(NOW)
    expect(next.due).toBe(NOW + next.interval * DAY_MS)
  })

  describe('successful recall', () => {
    it('schedules the first success one day out', () => {
      const next = schedule(INITIAL_SM2, GOOD, NOW)

      expect(next.repetitions).toBe(1)
      expect(next.interval).toBe(1)
      expect(next.due).toBe(NOW + DAY_MS)
    })

    it('schedules the second success six days out', () => {
      const first = schedule(INITIAL_SM2, GOOD, NOW)
      const second = schedule(first, GOOD, NOW)

      expect(second.repetitions).toBe(2)
      expect(second.interval).toBe(6)
    })

    it('multiplies by the ease factor from the third success on', () => {
      const first = schedule(INITIAL_SM2, GOOD, NOW)
      const second = schedule(first, GOOD, NOW)
      const third = schedule(second, GOOD, NOW)

      // Quality 4 leaves the ease factor at 2.5, so 6 * 2.5 = 15.
      expect(second.easeFactor).toBeCloseTo(2.5, 10)
      expect(third.interval).toBe(15)
      expect(third.repetitions).toBe(3)
    })
  })

  describe('failed recall', () => {
    it('resets the repetition count and returns the card tomorrow', () => {
      const learned = schedule(schedule(INITIAL_SM2, GOOD, NOW), GOOD, NOW)
      expect(learned.repetitions).toBe(2)

      const lapsed = schedule(learned, AGAIN, NOW)

      expect(lapsed.repetitions).toBe(0)
      expect(lapsed.interval).toBe(1)
    })

    it('still lowers the ease factor', () => {
      const lapsed = schedule(INITIAL_SM2, AGAIN, NOW)

      // 2.5 + (0.1 - 3 * (0.08 + 3 * 0.02)) = 2.5 - 0.32
      expect(lapsed.easeFactor).toBeCloseTo(2.18, 10)
    })
  })

  describe('ease factor', () => {
    it('rises on a perfect recall', () => {
      expect(schedule(INITIAL_SM2, EASY, NOW).easeFactor).toBeCloseTo(2.6, 10)
    })

    it('is unchanged on a comfortable recall', () => {
      expect(schedule(INITIAL_SM2, GOOD, NOW).easeFactor).toBeCloseTo(2.5, 10)
    })

    it('falls on a difficult recall', () => {
      expect(schedule(INITIAL_SM2, HARD, NOW).easeFactor).toBeCloseTo(2.36, 10)
    })

    it('never drops below 1.3, however often the card is failed', () => {
      let state = INITIAL_SM2
      for (let i = 0; i < 20; i += 1) {
        state = schedule(state, 0, NOW)
      }

      expect(state.easeFactor).toBe(1.3)
    })
  })

  describe('quality clamping', () => {
    it('treats values above 5 as 5', () => {
      expect(schedule(INITIAL_SM2, 99, NOW)).toEqual(
        schedule(INITIAL_SM2, EASY, NOW),
      )
    })

    it('treats values below 0 as 0', () => {
      expect(schedule(INITIAL_SM2, -10, NOW)).toEqual(
        schedule(INITIAL_SM2, 0, NOW),
      )
    })

    it('rounds fractional grades', () => {
      expect(schedule(INITIAL_SM2, 3.8, NOW)).toEqual(
        schedule(INITIAL_SM2, GOOD, NOW),
      )
    })
  })
})

describe('isDue', () => {
  it('treats a card with no saved state as due', () => {
    expect(isDue(undefined, NOW)).toBe(true)
  })

  it('treats a card that was never reviewed as due', () => {
    expect(isDue(INITIAL_SM2, NOW)).toBe(true)
  })

  it('is false while the interval is still running', () => {
    const reviewed = schedule(INITIAL_SM2, GOOD, NOW)

    expect(isDue(reviewed, NOW)).toBe(false)
    expect(isDue(reviewed, NOW + DAY_MS - 1)).toBe(false)
  })

  it('is true once the due moment arrives', () => {
    const reviewed = schedule(INITIAL_SM2, GOOD, NOW)

    expect(isDue(reviewed, reviewed.due)).toBe(true)
    expect(isDue(reviewed, reviewed.due + 1)).toBe(true)
  })
})
