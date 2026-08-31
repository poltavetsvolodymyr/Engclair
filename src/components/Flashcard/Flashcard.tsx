import { SpeakButton } from '@/components/SpeakButton'

import styles from './Flashcard.module.css'
import type { FlashcardProps } from './types/flashcard-props'

export function Flashcard({
  card,
  text,
  revealed,
  onSpeak,
  speaking = false,
}: FlashcardProps) {
  return (
    <section className={styles.card} aria-live="polite">
      <span className={styles.category}>{text.categoryLabels[card.category]}</span>

      <div className={styles.termBlock}>
        <div className={styles.termRow}>
          <h2 className={styles.term}>{card.term}</h2>
          {onSpeak ? (
            <SpeakButton label={text.speak} speaking={speaking} onClick={onSpeak} />
          ) : null}
        </div>
        {card.phonetic ? (
          <span className={styles.phonetic}>{card.phonetic}</span>
        ) : null}
        <span className={styles.partOfSpeech}>{card.partOfSpeech}</span>
      </div>

      {revealed ? (
        <div className={styles.answer}>
          <p className={styles.sectionLabel}>{text.definitionLabel}</p>
          <p className={styles.definition}>{card.definition}</p>
          <p className={styles.sectionLabel}>{text.exampleLabel}</p>
          <p className={styles.example}>{card.example}</p>
        </div>
      ) : (
        <p className={styles.hint}>{text.frontHint}</p>
      )}
    </section>
  )
}
