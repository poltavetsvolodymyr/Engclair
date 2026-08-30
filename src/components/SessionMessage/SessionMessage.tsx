import styles from './SessionMessage.module.css'
import type { SessionMessageProps } from './types/session-message-props'

/** Shown instead of a card when the queue is empty. */
export function SessionMessage({ text }: SessionMessageProps) {
  return (
    <section className={styles.message}>
      <h2 className={styles.title}>{text.title}</h2>
      <p className={styles.body}>{text.body}</p>
    </section>
  )
}
