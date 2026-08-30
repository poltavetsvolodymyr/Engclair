import styles from './Footer.module.css'
import type { FooterProps } from './types/footer-props'

export function Footer({ text, note, onReset }: FooterProps) {
  function handleReset() {
    if (window.confirm(text.confirm)) onReset()
  }

  return (
    <footer className={styles.footer}>
      <button type="button" className={styles.reset} onClick={handleReset}>
        {text.button}
      </button>
      <p className={styles.note}>{note}</p>
    </footer>
  )
}
