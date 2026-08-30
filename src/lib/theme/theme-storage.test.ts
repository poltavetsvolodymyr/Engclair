/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_THEME, THEME_IDS, loadTheme, saveTheme } from './theme-storage'

const STORAGE_KEY = 'engclair:theme:v1'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('THEME_IDS', () => {
  it('lists every theme exactly once', () => {
    expect(new Set(THEME_IDS).size).toBe(THEME_IDS.length)
  })

  it('starts with the default', () => {
    expect(THEME_IDS[0]).toBe(DEFAULT_THEME)
  })
})

describe('loadTheme', () => {
  it('falls back to the default when nothing is saved', () => {
    expect(loadTheme()).toBe(DEFAULT_THEME)
  })

  it('reads back what saveTheme wrote', () => {
    saveTheme('forest')

    expect(loadTheme()).toBe('forest')
  })

  it('rejects a value that is not a known theme', () => {
    localStorage.setItem(STORAGE_KEY, 'chartreuse')

    expect(loadTheme()).toBe(DEFAULT_THEME)
  })

  it('survives storage being unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(loadTheme()).toBe(DEFAULT_THEME)
  })
})

describe('saveTheme', () => {
  it('does not touch the review progress key', () => {
    localStorage.setItem('engclair:progress:v1', '{"a":1}')

    saveTheme('indigo')

    expect(localStorage.getItem('engclair:progress:v1')).toBe('{"a":1}')
  })

  it('swallows quota errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => saveTheme('crimson')).not.toThrow()
  })
})
