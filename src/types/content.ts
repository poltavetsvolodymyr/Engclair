import type { Card } from './card'
import type { UiText } from './ui'

/** The complete shape of `src/content.ts`. */
export interface Content {
  ui: UiText
  cards: Card[]
}
