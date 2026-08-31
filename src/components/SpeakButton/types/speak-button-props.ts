export interface SpeakButtonProps {
  /** Accessible name — the button itself shows only an icon. */
  label: string
  /** Marks the button while the device is talking. */
  speaking: boolean
  onClick: () => void
}
