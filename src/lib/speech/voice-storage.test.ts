/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadVoiceUri, saveVoiceUri } from './voice-storage'

const STORAGE_KEY = 'engclair:voice:v1'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadVoiceUri', () => {
  it('is null when nothing has been chosen', () => {
    expect(loadVoiceUri()).toBeNull()
  })

  it('reads back what saveVoiceUri wrote', () => {
    saveVoiceUri('uri:Samantha')

    expect(loadVoiceUri()).toBe('uri:Samantha')
  })

  it('treats an empty string as no choice', () => {
    localStorage.setItem(STORAGE_KEY, '')

    expect(loadVoiceUri()).toBeNull()
  })

  it('survives storage being unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(loadVoiceUri()).toBeNull()
  })
})

describe('saveVoiceUri', () => {
  it('keeps its own key, so resetting progress does not change the voice', () => {
    saveVoiceUri('uri:Samantha')

    expect(localStorage.getItem(STORAGE_KEY)).toBe('uri:Samantha')
    expect(localStorage.getItem('engclair:progress:v1')).toBeNull()
  })

  it('survives a full or blocked quota', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => saveVoiceUri('uri:Samantha')).not.toThrow()
  })
})
