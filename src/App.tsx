import { useMemo, useState } from 'react'
import './App.css'
import { content } from './content'
import type { Card } from './types'
import { INITIAL_SM2, isDue, previewInterval, schedule } from './sm2'
import {
  clearProgress,
  loadProgress,
  saveProgress,
  type ProgressMap,
} from './storage'

const { ui, cards } = content

type GradeKey = 'again' | 'hard' | 'good' | 'easy'

/** Grade button -> SM-2 recall quality (0–5). */
const GRADE_QUALITY: Record<GradeKey, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
}

const GRADE_ORDER: GradeKey[] = ['again', 'hard', 'good', 'easy']

/** Card ids that are due right now, oldest due time first, new cards last. */
function buildQueue(progress: ProgressMap, now: number): string[] {
  return cards
    .filter((card) => isDue(progress[card.id], now))
    .sort((a, b) => {
      const dueA = progress[a.id]?.due ?? 0
      const dueB = progress[b.id]?.due ?? 0
      return dueA - dueB
    })
    .map((card) => card.id)
}

function formatInterval(days: number): string {
  if (days <= 1) return '1d'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

export function App() {
  const cardsById = useMemo(() => {
    const map = new Map<string, Card>()
    for (const card of cards) map.set(card.id, card)
    return map
  }, [])

  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress())
  const [queue, setQueue] = useState<string[]>(() =>
    buildQueue(loadProgress(), Date.now()),
  )
  const [revealed, setRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const currentCard = queue.length > 0 ? cardsById.get(queue[0]) : undefined

  function handleGrade(grade: GradeKey) {
    if (!currentCard) return
    const now = Date.now()
    const quality = GRADE_QUALITY[grade]
    const previous = progress[currentCard.id] ?? INITIAL_SM2
    const next = schedule(previous, quality, now)

    const updated: ProgressMap = { ...progress, [currentCard.id]: next }
    setProgress(updated)
    saveProgress(updated)
    setReviewedCount((count) => count + 1)
    setRevealed(false)

    setQueue((current) => {
      const [head, ...rest] = current
      // A failed card comes back at the end of this session too.
      return quality < 3 ? [...rest, head] : rest
    })
  }

  function handleReset() {
    if (!window.confirm(ui.reset.confirm)) return
    clearProgress()
    const fresh: ProgressMap = {}
    setProgress(fresh)
    setQueue(buildQueue(fresh, Date.now()))
    setReviewedCount(0)
    setRevealed(false)
  }

  const previousState = currentCard
    ? progress[currentCard.id] ?? INITIAL_SM2
    : INITIAL_SM2

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">{ui.appTitle}</h1>
        <p className="app__tagline">{ui.tagline}</p>
      </header>

      <div className="stats" role="status">
        <span>
          {ui.stats.reviewed}: <strong>{reviewedCount}</strong>
        </span>
        <span>
          {ui.stats.remaining}: <strong>{queue.length}</strong>
        </span>
      </div>

      <main className="app__main">
        {currentCard ? (
          <section className="card" aria-live="polite">
            <span className="card__category">
              {ui.card.categoryLabels[currentCard.category]}
            </span>

            <div className="card__term-block">
              <h2 className="card__term">{currentCard.term}</h2>
              {currentCard.phonetic ? (
                <span className="card__phonetic">{currentCard.phonetic}</span>
              ) : null}
              <span className="card__pos">{currentCard.partOfSpeech}</span>
            </div>

            {revealed ? (
              <div className="card__answer">
                <p className="card__section-label">{ui.card.definitionLabel}</p>
                <p className="card__definition">{currentCard.definition}</p>
                <p className="card__section-label">{ui.card.exampleLabel}</p>
                <p className="card__example">{currentCard.example}</p>
              </div>
            ) : (
              <p className="card__hint">{ui.card.frontHint}</p>
            )}
          </section>
        ) : (
          <section className="message">
            <h2 className="message__title">
              {reviewedCount > 0 ? ui.done.title : ui.empty.title}
            </h2>
            <p className="message__body">
              {reviewedCount > 0 ? ui.done.body : ui.empty.body}
            </p>
          </section>
        )}
      </main>

      {currentCard ? (
        <div className="actions">
          {revealed ? (
            <div className="grades">
              {GRADE_ORDER.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={`grade grade--${grade}`}
                  onClick={() => handleGrade(grade)}
                >
                  <span className="grade__label">{ui.grades[grade].label}</span>
                  <span className="grade__interval">
                    {formatInterval(
                      previewInterval(previousState, GRADE_QUALITY[grade]),
                    )}
                  </span>
                  <span className="grade__hint">{ui.grades[grade].hint}</span>
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              className="reveal"
              onClick={() => setRevealed(true)}
            >
              {ui.card.showAnswer}
            </button>
          )}
        </div>
      ) : null}

      <footer className="app__footer">
        <button type="button" className="reset" onClick={handleReset}>
          {ui.reset.button}
        </button>
        <p className="app__footer-note">{ui.footer}</p>
      </footer>
    </div>
  )
}
