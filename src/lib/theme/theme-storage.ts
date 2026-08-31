import type { ThemeId } from '@/types'

/**
 * The accent theme the user picked, remembered per device.
 *
 * Kept separate from the review progress key so that resetting progress does
 * not throw away the look, and so a corrupt value in one cannot affect the
 * other.
 */
const STORAGE_KEY = 'engclair:theme:v1'

/** Display order in the picker: warm to cool, independent of the default. */
export const THEME_IDS: ThemeId[] = [
  'amber',
  'terracotta',
  'crimson',
  'forest',
  'indigo',
]

/** Must match whichever accent `:root` paints in styles/themes.css. */
export const DEFAULT_THEME: ThemeId = 'forest'

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as string[]).includes(value)
}

export function loadTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isThemeId(raw) ? raw : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore: private mode, quota exceeded, etc.
  }
}
