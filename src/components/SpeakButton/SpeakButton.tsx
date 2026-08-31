import styles from './SpeakButton.module.css'
import type { SpeakButtonProps } from './types/speak-button-props'

/**
 * Speaks the term aloud. Icon-only: the word beside it is the subject, and a
 * text label here would compete with it.
 */
export function SpeakButton({ label, speaking, onClick }: SpeakButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-speaking={speaking || undefined}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor" />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path className={styles.waveNear} d="M14.6 8.9a4.3 4.3 0 0 1 0 6.2" />
          <path className={styles.waveFar} d="M17.4 6.3a8 8 0 0 1 0 11.4" />
        </g>
      </svg>
    </button>
  )
}
