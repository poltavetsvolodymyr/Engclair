import type { Sm2State } from './sm2'

/**
 * Persistence for review progress. One localStorage key holds a map of
 * card id -> SM-2 state. All access is wrapped so a disabled or full
 * storage never crashes the app (it just behaves as a fresh start).
 */

const STORAGE_KEY = 'engclair:progress:v1'

export type ProgressMap = Record<string, Sm2State>

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as ProgressMap
    }
    return {}
  } catch {
    return {}
  }
}

export function saveProgress(progress: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Ignore: private mode, quota exceeded, etc.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}
