import { Flashcard } from '@/components/Flashcard'
import { Footer } from '@/components/Footer'
import { GradeButtons } from '@/components/GradeButtons'
import { Header } from '@/components/Header'
import { RevealButton } from '@/components/RevealButton'
import { SessionMessage } from '@/components/SessionMessage'
import { StatsBar } from '@/components/StatsBar'
import { ThemePicker } from '@/components/ThemePicker'
import { VoicePicker } from '@/components/VoicePicker'
import { content } from '@/content'
import { useReviewSession } from '@/hooks/useReviewSession'
import { useSpeech } from '@/hooks/useSpeech'
import { useTheme } from '@/hooks/useTheme'

import styles from './App.module.css'

const { ui, cards } = content

/** Composition root: wires the review session to the presentational components. */
export function App() {
  const session = useReviewSession(cards)
  const speech = useSpeech()
  const { theme, setTheme } = useTheme()

  // Bound to a local, so the callback below keeps the card TypeScript narrowed
  // here rather than the mutable property it came from.
  const card = session.currentCard

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
        {card ? (
          <Flashcard
            card={card}
            text={ui.card}
            revealed={session.revealed}
            speaking={speech.speaking}
            onSpeak={speech.supported ? () => speech.speak(card.term) : undefined}
          />
        ) : (
          <SessionMessage text={session.reviewedCount > 0 ? ui.done : ui.empty} />
        )}
      </main>

      {/* Pinned chrome: the controls sit under the thumb, not below the page. */}
      <div className={styles.bottom}>
        {card ? (
          <div className={styles.actions}>
            {session.revealed ? (
              <GradeButtons text={ui.grades} onGrade={session.grade} />
            ) : (
              <RevealButton label={ui.card.showAnswer} onClick={session.reveal} />
            )}
          </div>
        ) : null}

        {/* One voice is not a choice, and no voice is not a picker. */}
        {speech.voices.length > 1 ? (
          <VoicePicker
            text={ui.voice}
            voices={speech.voices}
            selected={speech.voiceURI}
            onSelect={speech.setVoice}
          />
        ) : null}

        {/* Temporary, while an accent is being chosen. */}
        <ThemePicker text={ui.themes} selected={theme} onSelect={setTheme} />

        <Footer text={ui.reset} note={ui.footer} onReset={session.reset} />
      </div>
    </div>
  )
}
