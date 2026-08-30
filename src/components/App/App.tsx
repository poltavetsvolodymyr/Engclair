import { Flashcard } from '@/components/Flashcard'
import { Footer } from '@/components/Footer'
import { GradeButtons } from '@/components/GradeButtons'
import { Header } from '@/components/Header'
import { RevealButton } from '@/components/RevealButton'
import { SessionMessage } from '@/components/SessionMessage'
import { StatsBar } from '@/components/StatsBar'
import { content } from '@/content'
import { useReviewSession } from '@/hooks/useReviewSession'

import styles from './App.module.css'

const { ui, cards } = content

/** Composition root: wires the review session to the presentational components. */
export function App() {
  const session = useReviewSession(cards)

  return (
    <div className={styles.app}>
      <Header text={ui.header} />

      <StatsBar
        text={ui.stats}
        reviewed={session.reviewedCount}
        remaining={session.remaining}
      />

      <main className={styles.main}>
        {session.currentCard ? (
          <Flashcard
            card={session.currentCard}
            text={ui.card}
            revealed={session.revealed}
          />
        ) : (
          <SessionMessage text={session.reviewedCount > 0 ? ui.done : ui.empty} />
        )}
      </main>

      {session.currentCard ? (
        <div className={styles.actions}>
          {session.revealed ? (
            <GradeButtons
              text={ui.grades}
              state={session.currentState}
              onGrade={session.grade}
            />
          ) : (
            <RevealButton label={ui.card.showAnswer} onClick={session.reveal} />
          )}
        </div>
      ) : null}

      <Footer text={ui.reset} note={ui.footer} onReset={session.reset} />
    </div>
  )
}
