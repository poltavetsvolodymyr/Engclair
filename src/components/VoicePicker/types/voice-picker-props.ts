import type { VoiceOption } from '@/lib/speech'
import type { VoicePickerText } from '@/types'

export interface VoicePickerProps {
  text: VoicePickerText
  /** English voices installed on the device, best first. */
  voices: VoiceOption[]
  /** Id of the voice currently in use. */
  selected: string | null
  onSelect: (id: string) => void
}
