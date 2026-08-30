import styles from './RevealButton.module.css'
import type { RevealButtonProps } from './types/reveal-button-props'

export function RevealButton({ label, onClick }: RevealButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {label}
    </button>
  )
}
