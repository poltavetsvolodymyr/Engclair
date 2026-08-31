import type { Card, FlashcardText } from '@/types'

export interface FlashcardProps {
  card: Card
  text: FlashcardText
  /** When false only the prompt side is shown. */
  revealed: boolean
  /**
   * Speaks the term. Omitted on a device without speech synthesis, which is
   * how the button knows not to appear at all.
   */
  onSpeak?: () => void
  /** True while the term is being spoken. */
  speaking?: boolean
}
