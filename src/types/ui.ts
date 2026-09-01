import type { CardCategory } from './card'
import type { GradeKey } from './grade'
import type { ThemeId } from './theme'

/**
 * Text slices of the interface. One type per screen region, so each component
 * receives exactly the strings it renders and nothing more.
 *
 * These live in shared `types/` rather than inside a component folder because
 * `src/content.ts` also depends on them — a component owns its *props*, but the
 * shape of the authored content is shared ground between content and UI.
 */

export interface HeaderText {
  appTitle: string
  tagline: string
}

export interface StatsText {
  reviewed: string
  remaining: string
}

export interface FlashcardText {
  /** Hint shown on the front, before the answer is revealed. */
  frontHint: string
  showAnswer: string
  definitionLabel: string
  exampleLabel: string
  /** Accessible name of the button beside the term; it shows only an icon. */
  speakTerm: string
  /** Accessible name of the button beside the definition, likewise icon-only. */
  speakDefinition: string
  categoryLabels: Record<CardCategory, string>
}

export interface GradeText {
  label: string
  /** Short helper line under the grade button. */
  hint: string
}

export type GradesText = Record<GradeKey, GradeText>

/** Used for both the "nothing due" and "session finished" states. */
export interface SessionMessageText {
  title: string
  body: string
}

export interface ResetText {
  button: string
  confirm: string
}

/** Temporary, while an accent is being chosen. Delete with the picker. */
export interface ThemePickerText {
  label: string
  names: Record<ThemeId, string>
}

export interface UiText {
  header: HeaderText
  stats: StatsText
  card: FlashcardText
  grades: GradesText
  /** Shown when nothing is due and no cards were reviewed this session. */
  empty: SessionMessageText
  /** Shown after the last due card of a session is graded. */
  done: SessionMessageText
  reset: ResetText
  /** Temporary, while an accent is being chosen. Delete with the picker. */
  themes: ThemePickerText
  footer: string
}
