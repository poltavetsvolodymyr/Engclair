import { useCallback, useMemo, useState } from 'react'

import { GRADE_QUALITY, isFailedGrade } from '@/lib/review'
import { INITIAL_SM2, schedule } from '@/lib/sm2'
import {
  clearProgress,
  loadProgress,
  saveProgress,
  type ProgressMap,
} from '@/lib/storage'
import type { Card, GradeKey } from '@/types'

import { buildQueue } from './build-queue'
import type { ReviewSession } from './types/review-session'

/**
 * Owns the whole review loop: the due queue, reveal state, grading and
 * persistence. Components stay presentational and just render what this returns.
 */
export function useReviewSession(cards: Card[]): ReviewSession {
  const cardsById = useMemo(() => {
    const map = new Map<string, Card>()
    for (const card of cards) map.set(card.id, card)
    return map
  }, [cards])

  const [progress, setProgress] = useState<ProgressMap>(loadProgress)
  const [queue, setQueue] = useState<string[]>(() =>
    buildQueue(cards, progress, Date.now()),
  )
  const [revealed, setRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const currentCard = queue.length > 0 ? cardsById.get(queue[0]) : undefined
  const currentState = currentCard
    ? progress[currentCard.id] ?? INITIAL_SM2
    : INITIAL_SM2

  const reveal = useCallback(() => setRevealed(true), [])

  const grade = useCallback(
    (grade: GradeKey) => {
      const cardId = queue[0]
      if (cardId === undefined) return

      const now = Date.now()
      const previous = progress[cardId] ?? INITIAL_SM2
      const next = schedule(previous, GRADE_QUALITY[grade], now)

      const updated: ProgressMap = { ...progress, [cardId]: next }
      setProgress(updated)
      saveProgress(updated)

      setReviewedCount((count) => count + 1)
      setRevealed(false)
      // A failed card comes back at the end of this session as well.
      setQueue(([head, ...rest]) =>
        isFailedGrade(grade) ? [...rest, head] : rest,
      )
    },
    [progress, queue],
  )

  const reset = useCallback(() => {
    clearProgress()
    const fresh: ProgressMap = {}
    setProgress(fresh)
    setQueue(buildQueue(cards, fresh, Date.now()))
    setReviewedCount(0)
    setRevealed(false)
  }, [cards])

  return {
    currentCard,
    currentState,
    revealed,
    reviewedCount,
    remaining: queue.length,
    reveal,
    grade,
    reset,
  }
}
