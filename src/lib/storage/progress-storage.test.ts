/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { INITIAL_SM2 } from '@/lib/sm2'

import { clearProgress, loadProgress, saveProgress } from './progress-storage'
import type { ProgressMap } from './types/progress-map'

const STORAGE_KEY = 'engclair:progress:v1'

const SAMPLE: ProgressMap = {
  'vocab-candid': { ...INITIAL_SM2, repetitions: 2, interval: 6, due: 1_000 },
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadProgress', () => {
  it('returns an empty map when nothing has been saved', () => {
    expect(loadProgress()).toEqual({})
  })

  it('reads back what saveProgress wrote', () => {
    saveProgress(SAMPLE)

    expect(loadProgress()).toEqual(SAMPLE)
  })

  it('falls back to an empty map when the stored value is not JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not json {{{')

    expect(loadProgress()).toEqual({})
  })

  it('falls back to an empty map when the stored value is not an object', () => {
    localStorage.setItem(STORAGE_KEY, 'null')

    expect(loadProgress()).toEqual({})
  })

  it('survives storage being unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(loadProgress()).toEqual({})
  })
})

describe('saveProgress', () => {
  it('overwrites the previous save rather than merging', () => {
    saveProgress(SAMPLE)
    saveProgress({})

    expect(loadProgress()).toEqual({})
  })

  it('swallows quota errors instead of crashing the app', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => saveProgress(SAMPLE)).not.toThrow()
  })
})

describe('clearProgress', () => {
  it('removes saved progress', () => {
    saveProgress(SAMPLE)
    clearProgress()

    expect(loadProgress()).toEqual({})
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('leaves unrelated keys alone', () => {
    localStorage.setItem('someone-elses-key', 'keep me')
    saveProgress(SAMPLE)

    clearProgress()

    expect(localStorage.getItem('someone-elses-key')).toBe('keep me')
  })

  it('swallows storage errors', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => clearProgress()).not.toThrow()
  })
})
