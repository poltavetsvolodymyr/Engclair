/** Lifecycle hooks for one spoken utterance. Both are optional. */
export interface SpeechCallbacks {
  onStart?: () => void
  /** Also called when speech fails, so a caller can always clear its state. */
  onEnd?: () => void
}
