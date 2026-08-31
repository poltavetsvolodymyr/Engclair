import type { VoiceOption } from '@/lib/speech'

export interface SpeechControl {
  /** False on a device with no speech synthesis; the button is then not shown. */
  supported: boolean
  /** True between the start and end of an utterance, for button feedback. */
  speaking: boolean
  speak: (text: string) => void
  /** Every English voice installed, best first. Empty until the list arrives. */
  voices: VoiceOption[]
  /** URI of the voice that will actually speak, chosen or fallen back to. */
  voiceURI: string | null
  setVoice: (uri: string) => void
}
