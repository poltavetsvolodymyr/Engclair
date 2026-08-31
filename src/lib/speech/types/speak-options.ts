/** Lifecycle of one spoken utterance. */
export interface SpeakOptions {
  onStart?: () => void
  /** Also called when speech fails, so a caller can always clear its state. */
  onEnd?: () => void
}
