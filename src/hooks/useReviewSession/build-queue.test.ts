import { describe, expect, it } from 'vitest'

import { DAY_MS, INITIAL_SM2 } from '@/lib/sm2'
import type { ProgressMap } from '@/lib/storage'
import type { Card } from '@/types'

import { buildQueue } from './build-queue'

const NOW = Date.UTC(2026, 0, 1)

function card(id: string): Card {
  return {
    id,
    category: 'vocabulary',
    term: id,
    partOfSpeech: 'noun',
    definition: `definition of ${id}`,
    example: `An example using ${id}.`,
  }
}

/** A card reviewed in the past, next due `dueInDays` from NOW. */
function reviewed(dueInDays: number): ProgressMap[string] {
  return {
    ...INITIAL_SM2,
    repetitions: 1,
    interval: 1,
    lastReviewed: NOW - DAY_MS,
    due: NOW + dueInDays * DAY_MS,
  }
}

describe('buildQueue', () => {
  it('returns an empty queue for an empty deck', () => {
    expect(buildQueue([], {}, NOW)).toEqual([])
  })

  it('queues every card when nothing has been reviewed', () => {
    const deck = [card('a'), card('b'), card('c')]

    expect(buildQueue(deck, {}, NOW)).toEqual(['a', 'b', 'c'])
  })

  it('leaves out cards whose interval has not elapsed', () => {
    const deck = [card('a'), card('b')]
    const progress: ProgressMap = { a: reviewed(3) }

    expect(buildQueue(deck, progress, NOW)).toEqual(['b'])
  })

  it('includes a card at the exact moment it falls due', () => {
    const deck = [card('a')]
    const progress: ProgressMap = { a: reviewed(0) }

    expect(buildQueue(deck, progress, NOW)).toEqual(['a'])
  })

  it('puts the most overdue card first', () => {
    const deck = [card('fresh'), card('veryLate'), card('late')]
    const progress: ProgressMap = {
      fresh: reviewed(0),
      veryLate: reviewed(-10),
      late: reviewed(-2),
    }

    expect(buildQueue(deck, progress, NOW)).toEqual([
      'veryLate',
      'late',
      'fresh',
    ])
  })

  it('sorts never-reviewed cards ahead of reviewed ones', () => {
    const deck = [card('seen'), card('new')]
    const progress: ProgressMap = { seen: reviewed(-1) }

    // An unseen card has no stored due time, which sorts as 0 — ahead of any
    // real timestamp.
    expect(buildQueue(deck, progress, NOW)).toEqual(['new', 'seen'])
  })

  it('ignores progress entries for cards no longer in the deck', () => {
    const deck = [card('a')]
    const progress: ProgressMap = { a: reviewed(-1), removed: reviewed(-5) }

    expect(buildQueue(deck, progress, NOW)).toEqual(['a'])
  })

  it('does not mutate the deck it is given', () => {
    const deck = [card('b'), card('a')]
    const progress: ProgressMap = { b: reviewed(-1), a: reviewed(-9) }

    buildQueue(deck, progress, NOW)

    expect(deck.map((c) => c.id)).toEqual(['b', 'a'])
  })
})
