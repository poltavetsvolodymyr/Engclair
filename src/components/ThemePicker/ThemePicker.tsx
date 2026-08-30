import { THEME_IDS } from '@/lib/theme'

import styles from './ThemePicker.module.css'
import type { ThemePickerProps } from './types/theme-picker-props'

/**
 * Temporary: a row of accent swatches for choosing the app's colour.
 *
 * Each swatch carries `data-swatch`, which styles/themes.css matches to give
 * the button its own accent — the colours are never repeated in JavaScript.
 */
export function ThemePicker({ text, selected, onSelect }: ThemePickerProps) {
  return (
    <section className={styles.picker} aria-label={text.label}>
      <p className={styles.label}>{text.label}</p>
      <div className={styles.swatches} role="radiogroup" aria-label={text.label}>
        {THEME_IDS.map((theme) => (
          <button
            key={theme}
            type="button"
            role="radio"
            aria-checked={theme === selected}
            aria-label={text.names[theme]}
            title={text.names[theme]}
            data-swatch={theme}
            className={styles.swatch}
            onClick={() => onSelect(theme)}
          />
        ))}
      </div>
      <p className={styles.selectedName}>{text.names[selected]}</p>
    </section>
  )
}
