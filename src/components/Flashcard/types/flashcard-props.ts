import type { Card, FlashcardText } from '@/types'

export interface FlashcardProps {
  card: Card
  text: FlashcardText
  /** When false only the prompt side is shown. */
  revealed: boolean
}
