import type { VoiceOption } from '@/lib/speech'

export interface SpeechControl {
  /** False on a device with no speech synthesis; the button is then not shown. */
  supported: boolean
  /** True between the start and end of an utterance, for button feedback. */
  speaking: boolean
  /** Plays `audio` from `public/audio/` when given, else speaks `text`. */
  speak: (text: string, audio?: string) => void
  /** Every English voice installed, best first. Empty until the list arrives. */
  voices: VoiceOption[]
  /** Id of the voice that will actually speak, chosen or fallen back to. */
  voiceId: string | null
  setVoice: (id: string) => void
}
