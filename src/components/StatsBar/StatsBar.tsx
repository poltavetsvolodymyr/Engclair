import styles from './StatsBar.module.css'
import type { StatsBarProps } from './types/stats-bar-props'

export function StatsBar({ text, reviewed, remaining }: StatsBarProps) {
  return (
    <div className={styles.stats} role="status">
      <span>
        {text.reviewed}: <strong className={styles.value}>{reviewed}</strong>
      </span>
      <span>
        {text.remaining}: <strong className={styles.value}>{remaining}</strong>
      </span>
    </div>
  )
}
