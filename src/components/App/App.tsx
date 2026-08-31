import { Flashcard } from '@/components/Flashcard'
import { Footer } from '@/components/Footer'
import { GradeButtons } from '@/components/GradeButtons'
import { Header } from '@/components/Header'
import { RevealButton } from '@/components/RevealButton'
import { SessionMessage } from '@/components/SessionMessage'
import { StatsBar } from '@/components/StatsBar'
import { ThemePicker } from '@/components/ThemePicker'
import { content } from '@/content'
import { useReviewSession } from '@/hooks/useReviewSession'
import { useTheme } from '@/hooks/useTheme'

import styles from './App.module.css'

const { ui, cards } = content

/** Composition root: wires the review session to the presentational components. */
export function App() {
  const session = useReviewSession(cards)
  const { theme, setTheme } = useTheme()

  return (
    <div className={styles.app}>
      {/* Pinned chrome: identity and progress stay put while cards scroll. */}
      <div className={styles.top}>
        <Header text={ui.header} />

        <StatsBar
          text={ui.stats}
          reviewed={session.reviewedCount}
          remaining={session.remaining}
        />
      </div>

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

      {/* Pinned chrome: the controls sit under the thumb, not below the page. */}
      <div className={styles.bottom}>
        {session.currentCard ? (
          <div className={styles.actions}>
            {session.revealed ? (
              <GradeButtons text={ui.grades} onGrade={session.grade} />
            ) : (
              <RevealButton label={ui.card.showAnswer} onClick={session.reveal} />
            )}
          </div>
        ) : null}

        {/* Temporary, while an accent is being chosen. */}
        <ThemePicker text={ui.themes} selected={theme} onSelect={setTheme} />

        <Footer text={ui.reset} note={ui.footer} onReset={session.reset} />
      </div>
    </div>
  )
}
