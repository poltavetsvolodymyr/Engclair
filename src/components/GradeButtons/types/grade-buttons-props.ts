import type { GradeKey, GradesText } from '@/types'

export interface GradeButtonsProps {
  text: GradesText
  onGrade: (grade: GradeKey) => void
}
