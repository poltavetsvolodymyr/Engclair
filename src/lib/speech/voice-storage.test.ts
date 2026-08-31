/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadVoiceId, saveVoiceId } from './voice-storage'

const STORAGE_KEY = 'engclair:voice:v1'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadVoiceId', () => {
  it('is null when nothing has been chosen', () => {
    expect(loadVoiceId()).toBeNull()
  })

  it('reads back what saveVoiceId wrote', () => {
    saveVoiceId('uri:Samantha')

    expect(loadVoiceId()).toBe('uri:Samantha')
  })

  it('treats an empty string as no choice', () => {
    localStorage.setItem(STORAGE_KEY, '')

    expect(loadVoiceId()).toBeNull()
  })

  it('survives storage being unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(loadVoiceId()).toBeNull()
  })
})

describe('saveVoiceId', () => {
  it('keeps its own key, so resetting progress does not change the voice', () => {
    saveVoiceId('uri:Samantha')

    expect(localStorage.getItem(STORAGE_KEY)).toBe('uri:Samantha')
    expect(localStorage.getItem('engclair:progress:v1')).toBeNull()
  })

  it('survives a full or blocked quota', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => saveVoiceId('uri:Samantha')).not.toThrow()
  })
})
