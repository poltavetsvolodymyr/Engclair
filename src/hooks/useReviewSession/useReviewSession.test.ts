/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { DAY_MS, INITIAL_SM2 } from '@/lib/sm2'
import { loadProgress, saveProgress, type ProgressMap } from '@/lib/storage'
import type { Card } from '@/types'

import { useReviewSession } from './useReviewSession'

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

/** Stable reference: the hook memoises its lookup map on this array. */
const DECK: Card[] = [card('a'), card('b'), card('c')]

beforeEach(() => {
  localStorage.clear()
})

describe('useReviewSession', () => {
  describe('on mount', () => {
    it('queues the whole deck when there is no saved progress', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      expect(result.current.currentCard?.id).toBe('a')
      expect(result.current.remaining).toBe(3)
      expect(result.current.reviewedCount).toBe(0)
      expect(result.current.revealed).toBe(false)
    })

    it('skips cards that are not due yet', () => {
      saveProgress({
        a: {
          ...INITIAL_SM2,
          repetitions: 1,
          interval: 1,
          lastReviewed: Date.now(),
          due: Date.now() + DAY_MS,
        },
      })

      const { result } = renderHook(() => useReviewSession(DECK))

      expect(result.current.remaining).toBe(2)
      expect(result.current.currentCard?.id).toBe('b')
    })

    it('reports no current card when the deck is empty', () => {
      const { result } = renderHook(() => useReviewSession([]))

      expect(result.current.currentCard).toBeUndefined()
      expect(result.current.remaining).toBe(0)
    })
  })

  describe('reveal', () => {
    it('shows the answer side', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      act(() => result.current.reveal())

      expect(result.current.revealed).toBe(true)
    })
  })

  describe('grade', () => {
    it('moves to the next card and counts the review', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      act(() => result.current.grade('good'))

      expect(result.current.currentCard?.id).toBe('b')
      expect(result.current.reviewedCount).toBe(1)
      expect(result.current.remaining).toBe(2)
    })

    it('hides the answer again for the next card', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      act(() => result.current.reveal())
      act(() => result.current.grade('good'))

      expect(result.current.revealed).toBe(false)
    })

    it('sends a failed card to the back of the queue instead of dropping it', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      act(() => result.current.grade('again'))

      expect(result.current.currentCard?.id).toBe('b')
      // Still three cards queued: 'a' was re-queued, not removed.
      expect(result.current.remaining).toBe(3)

      act(() => result.current.grade('good'))
      act(() => result.current.grade('good'))

      expect(result.current.currentCard?.id).toBe('a')
    })

    it('empties the queue once every card has been passed', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      act(() => result.current.grade('good'))
      act(() => result.current.grade('good'))
      act(() => result.current.grade('good'))

      expect(result.current.currentCard).toBeUndefined()
      expect(result.current.remaining).toBe(0)
      expect(result.current.reviewedCount).toBe(3)
    })

    it('is a no-op once the queue is empty', () => {
      const { result } = renderHook(() => useReviewSession([]))

      act(() => result.current.grade('good'))

      expect(result.current.reviewedCount).toBe(0)
      expect(loadProgress()).toEqual({})
    })

    it('persists the new schedule immediately', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      act(() => result.current.grade('good'))

      const saved: ProgressMap = loadProgress()
      expect(Object.keys(saved)).toEqual(['a'])
      expect(saved.a.repetitions).toBe(1)
      expect(saved.a.interval).toBe(1)
      expect(saved.a.lastReviewed).not.toBeNull()
    })

    it('accumulates progress across several cards', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      act(() => result.current.grade('good'))
      act(() => result.current.grade('easy'))

      expect(Object.keys(loadProgress()).sort()).toEqual(['a', 'b'])
    })
  })

  describe('reset', () => {
    it('wipes saved progress and re-queues the whole deck', () => {
      const { result } = renderHook(() => useReviewSession(DECK))

      act(() => result.current.grade('good'))
      act(() => result.current.reveal())
      act(() => result.current.reset())

      expect(loadProgress()).toEqual({})
      expect(result.current.remaining).toBe(3)
      expect(result.current.currentCard?.id).toBe('a')
      expect(result.current.reviewedCount).toBe(0)
      expect(result.current.revealed).toBe(false)
    })
  })
})
