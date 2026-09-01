import type { SpokenPart } from '@/types'

export interface SpeechControl {
  /** False on a device with no speech synthesis; the buttons are then hidden. */
  supported: boolean
  /**
   * Which part is being read right now, or null in silence. One value rather
   * than a flag per button, because only one thing is ever heard at a time —
   * starting the definition silences the term, and the state follows.
   */
  speaking: SpokenPart | null
  /** Plays `audio` from `public/audio/` when given, else speaks `text`. */
  speak: (part: SpokenPart, text: string, audio?: string) => void
}
