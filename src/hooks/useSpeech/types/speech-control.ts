export interface SpeechControl {
  /** False on a device with no speech synthesis; the button is then not shown. */
  supported: boolean
  /** True between the start and end of an utterance, for button feedback. */
  speaking: boolean
  speak: (text: string) => void
}
