import type { ThemeId, ThemePickerText } from '@/types'

export interface ThemePickerProps {
  text: ThemePickerText
  selected: ThemeId
  onSelect: (theme: ThemeId) => void
}
