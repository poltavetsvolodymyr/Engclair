import type { ProgressMap } from './types/progress-map'

/**
 * Persistence for review progress: one localStorage key holding a
 * `card id -> Sm2State` map.
 *
 * Every access is wrapped, so a disabled or full storage (private mode, quota)
 * degrades to "fresh start" instead of crashing the app.
 *
 * Bump the key suffix if the persisted shape ever changes.
 */
const STORAGE_KEY = 'engclair:progress:v1'

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
