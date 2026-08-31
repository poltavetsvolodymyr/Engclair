/**
 * The voice the user picked, remembered per device.
 *
 * Its own key, like the theme: resetting review progress must not silently
 * change how the app sounds.
 */
const STORAGE_KEY = 'engclair:voice:v1'

export function loadVoiceId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return typeof raw === 'string' && raw.length > 0 ? raw : null
  } catch {
    return null
  }
}

export function saveVoiceId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Ignore: private mode, quota exceeded, etc.
  }
}
