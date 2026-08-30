import type { Sm2State } from '@/lib/sm2'
import type { GradeKey, GradesText } from '@/types'

export interface GradeButtonsProps {
  text: GradesText
  /** Current card's scheduling state, used to preview each grade's interval. */
  state: Sm2State
  onGrade: (grade: GradeKey) => void
}
