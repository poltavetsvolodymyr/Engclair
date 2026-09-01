/** A flashcard in the deck. Consumed by content, the review session and the UI. */

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
  /**
   * Optional recorded pronunciation: a file name inside `public/audio/`.
   * Preferred over speech synthesis when present, and fallen back from when
   * it cannot be played, so a card without one still speaks.
   */
  audio?: string
  /**
   * Optional recorded reading of the answer — the definition, a beat, then the
   * example — in the same folder. Same bargain as `audio`: preferred when
   * present, fallen back from when it will not play.
   */
  answerAudio?: string
  /** Grammatical label, e.g. "adjective", "noun", "phrasal verb". */
  partOfSpeech: string
  /** English-only explanation shown on the back of the card. */
  definition: string
  /** One natural example sentence that uses the term. */
  example: string
}
