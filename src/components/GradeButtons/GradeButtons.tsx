import { GRADE_QUALITY } from '@/lib/review'
import { previewInterval } from '@/lib/sm2'
import type { GradeKey } from '@/types'

import { formatInterval } from './format-interval'
import styles from './GradeButtons.module.css'
import type { GradeButtonsProps } from './types/grade-buttons-props'

/** Left-to-right display order, hardest recall first. */
const GRADE_ORDER: GradeKey[] = ['again', 'hard', 'good', 'easy']

export function GradeButtons({ text, state, onGrade }: GradeButtonsProps) {
  return (
    <div className={styles.grades}>
      {GRADE_ORDER.map((grade) => (
        <button
          key={grade}
          type="button"
          className={`${styles.button} ${styles[grade]}`}
          onClick={() => onGrade(grade)}
        >
          <span className={styles.label}>{text[grade].label}</span>
          <span className={styles.interval}>
            {formatInterval(previewInterval(state, GRADE_QUALITY[grade]))}
          </span>
          <span className={styles.hint}>{text[grade].hint}</span>
        </button>
      ))}
    </div>
  )
}
