/** One spoken utterance: which voice, and how to follow its progress. */
export interface SpeakOptions {
  /** Voice to use. Falls back to the best available English one when absent. */
  voiceURI?: string | null
  onStart?: () => void
  /** Also called when speech fails, so a caller can always clear its state. */
  onEnd?: () => void
}

/**
 * A voice, flattened for the UI.
 *
 * Components never see `SpeechSynthesisVoice` itself: they render a list and
 * report a choice, and the platform type stays behind this module.
 */
export interface VoiceOption {
  uri: string
  /** As the operating system names it, e.g. "Samantha". */
  name: string
  /** BCP-47 tag, e.g. "en-GB" — what separates two voices of the same name. */
  lang: string
  /** Installed on the device, so it works with no network. */
  local: boolean
}
