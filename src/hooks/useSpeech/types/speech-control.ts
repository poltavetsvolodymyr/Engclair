export interface SpeechControl {
  /** False on a device with no speech synthesis; the button is then not shown. */
  supported: boolean
  /** True while a recording or an utterance is playing, for button feedback. */
  speaking: boolean
  /** Plays `audio` from `public/audio/` when given, else speaks `text`. */
  speak: (text: string, audio?: string) => void
}
