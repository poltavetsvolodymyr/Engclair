import type { ResetText } from '@/types'

export interface FooterProps {
  text: ResetText
  note: string
  /** Called only after the user confirms; confirmation happens here. */
  onReset: () => void
}
