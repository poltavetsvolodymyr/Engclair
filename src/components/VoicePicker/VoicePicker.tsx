import styles from './VoicePicker.module.css'
import type { VoicePickerProps } from './types/voice-picker-props'

/**
 * Picks which installed voice reads the terms.
 *
 * A native <select> on purpose: it costs no custom listbox to build or make
 * accessible, and on a phone it opens the platform's own wheel — the most
 * app-like control available for a one-of-many choice.
 */
export function VoicePicker({ text, voices, selected, onSelect }: VoicePickerProps) {
  return (
    <label className={styles.picker}>
      <span className={styles.label}>{text.label}</span>
      <select
        className={styles.select}
        value={selected ?? ''}
        onChange={(event) => onSelect(event.target.value)}
      >
        {voices.map((voice) => (
          <option key={voice.uri} value={voice.uri}>
            {voice.name} · {voice.lang}
          </option>
        ))}
      </select>
    </label>
  )
}
