import { SpeakButton } from '@/components/SpeakButton'

import styles from './Flashcard.module.css'
import type { FlashcardProps } from './types/flashcard-props'

export function Flashcard({
  card,
  text,
  revealed,
  onSpeak,
  speaking = null,
}: FlashcardProps) {
  return (
    <section className={styles.card} aria-live="polite">
      {/* The word stays put; only the answer below it scrolls. */}
      <div className={styles.head}>
        <span className={styles.category}>{text.categoryLabels[card.category]}</span>

        <div className={styles.termBlock}>
          <div className={styles.termRow}>
            <h2 className={styles.term}>{card.term}</h2>
            {onSpeak ? (
              <SpeakButton
                label={text.speakTerm}
                speaking={speaking === 'term'}
                onClick={() => onSpeak('term')}
              />
            ) : null}
          </div>
          {card.phonetic ? (
            <span className={styles.phonetic}>{card.phonetic}</span>
          ) : null}
          <span className={styles.partOfSpeech}>{card.partOfSpeech}</span>
        </div>
      </div>

      <div className={styles.body}>
        {revealed ? (
          <div className={styles.answer}>
            {/* The answer gets its own button: hearing what a word means said
                aloud is a different exercise from hearing the word. It reads
                the definition and then the example, so it sits at the top of
                the answer rather than against either one. */}
            <div className={styles.answerRow}>
              <p className={styles.sectionLabel}>{text.definitionLabel}</p>
              {onSpeak ? (
                <SpeakButton
                  label={text.speakAnswer}
                  speaking={speaking === 'answer'}
                  onClick={() => onSpeak('answer')}
                />
              ) : null}
            </div>
            <p className={styles.definition}>{card.definition}</p>
            <p className={styles.sectionLabel}>{text.exampleLabel}</p>
            <p className={styles.example}>{card.example}</p>
          </div>
        ) : (
          <p className={styles.hint}>{text.frontHint}</p>
        )}
      </div>
    </section>
  )
}
