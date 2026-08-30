/**
 * Shared types for Engclair.
 *
 * The only file you normally edit is `content.ts`. These types describe the
 * shape it must follow so the compiler catches mistakes before they ship.
 */

export type CardCategory = 'vocabulary' | 'phrasal-verb'

export interface Card {
  /**
   * Stable identifier. Used as the localStorage progress key, so never change
   * or reuse an id once cards are in the wild.
   */
  id: string
  category: CardCategory
  /** The word or phrase shown on the front of the card. English only. */
  term: string
  /** Optional IPA pronunciation shown under the term, e.g. "/prəˈfaʊnd/". */
  phonetic?: string
  /** Grammatical label, e.g. "adjective", "noun", "phrasal verb". */
  partOfSpeech: string
  /** English-only explanation shown on the back of the card. */
  definition: string
  /** One natural example sentence that uses the term. */
  example: string
}

export interface GradeText {
  label: string
  /** Short helper line under the grade button. */
  hint: string
}

export interface UiText {
  appTitle: string
  tagline: string
  stats: {
    reviewed: string
    remaining: string
  }
  card: {
    /** Hint shown on the front, before the answer is revealed. */
    frontHint: string
    showAnswer: string
    definitionLabel: string
    exampleLabel: string
    categoryLabels: Record<CardCategory, string>
  }
  grades: {
    again: GradeText
    hard: GradeText
    good: GradeText
    easy: GradeText
  }
  /** Shown when nothing is due and no cards were reviewed this session. */
  empty: {
    title: string
    body: string
  }
  /** Shown after the last due card of a session is graded. */
  done: {
    title: string
    body: string
  }
  reset: {
    button: string
    confirm: string
  }
  footer: string
}

export interface Content {
  ui: UiText
  cards: Card[]
}
