import styles from './Header.module.css'
import type { HeaderProps } from './types/header-props'

export function Header({ text }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{text.appTitle}</h1>
      <p className={styles.tagline}>{text.tagline}</p>
    </header>
  )
}
