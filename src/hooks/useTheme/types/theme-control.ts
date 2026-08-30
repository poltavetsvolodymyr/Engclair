import type { ThemeId } from '@/types'

export interface ThemeControl {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}
