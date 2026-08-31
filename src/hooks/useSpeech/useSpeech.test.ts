/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSpeech } from './useSpeech'

class FakeUtterance {
  text: string
  lang = ''
  voice: SpeechSynthesisVoice | null = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

function installSpeech() {
  const spoken: FakeUtterance[] = []
  const synth = {
    speaking: false,
    pending: false,
    getVoices: () => [],
    speak: vi.fn((utterance: FakeUtterance) => {
      spoken.push(utterance)
      synth.speaking = true
    }),
    cancel: vi.fn(() => {
      synth.speaking = false
    }),
  }

  Object.defineProperty(window, 'speechSynthesis', {
    value: synth,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    value: FakeUtterance,
    configurable: true,
  })

  return { synth, spoken }
}

afterEach(() => {
  Reflect.deleteProperty(window, 'speechSynthesis')
  Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance')
  vi.restoreAllMocks()
})

describe('useSpeech', () => {
  it('reports no support on a device without the API', () => {
    const { result } = renderHook(() => useSpeech())

    expect(result.current.supported).toBe(false)
  })

  it('reports support once the API is present', () => {
    installSpeech()

    const { result } = renderHook(() => useSpeech())

    expect(result.current.supported).toBe(true)
  })

  it('starts silent', () => {
    installSpeech()

    const { result } = renderHook(() => useSpeech())

    expect(result.current.speaking).toBe(false)
  })

  it('follows the utterance from start to end', () => {
    const { spoken } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('ubiquitous'))
    act(() => spoken[0].onstart?.())
    expect(result.current.speaking).toBe(true)

    act(() => spoken[0].onend?.())
    expect(result.current.speaking).toBe(false)
  })

  it('stops talking when the hook goes away', () => {
    const { synth } = installSpeech()
    const { result, unmount } = renderHook(() => useSpeech())

    act(() => result.current.speak('ubiquitous'))
    unmount()

    expect(synth.cancel).toHaveBeenCalledTimes(1)
  })
})
