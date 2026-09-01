import type { Card, FlashcardText, SpokenPart } from '@/types'

export interface FlashcardProps {
  card: Card
  text: FlashcardText
  /** When false only the prompt side is shown. */
  revealed: boolean
  /**
   * Reads one part of the card aloud. Omitted on a device without speech
   * synthesis, which is how the buttons know not to appear at all.
   */
  onSpeak?: (part: SpokenPart) => void
  /** Which part is being read, so only that button shows it. */
  speaking?: SpokenPart | null
}
