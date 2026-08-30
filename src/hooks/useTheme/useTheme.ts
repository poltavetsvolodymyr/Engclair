import { useCallback, useLayoutEffect, useState } from 'react'

import { loadTheme, saveTheme } from '@/lib/theme'
import type { ThemeId } from '@/types'

import type { ThemeControl } from './types/theme-control'

/**
 * Reads the saved accent theme, mirrors it onto <html data-theme> for the CSS
 * in styles/themes.css to pick up, and persists any change.
 */
export function useTheme(): ThemeControl {
  const [theme, setThemeState] = useState<ThemeId>(loadTheme)

  // Layout effect, not a plain effect: this runs before the browser paints, so
  // a saved non-default theme never flashes the default first.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next)
    saveTheme(next)
  }, [])

  return { theme, setTheme }
}
