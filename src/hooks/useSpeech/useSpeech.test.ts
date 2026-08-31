/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSpeech } from './useSpeech'

const VOICE_KEY = 'engclair:voice:v1'

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

function voice(name: string, lang: string, localService: boolean): SpeechSynthesisVoice {
  return { name, lang, localService, voiceURI: `uri:${name}`, default: false }
}

/** A stand-in for the speech API, including the EventTarget half of it. */
function installSpeech(voices: SpeechSynthesisVoice[] = []) {
  const spoken: FakeUtterance[] = []
  const target = new EventTarget()
  let current = voices

  const synth = {
    speaking: false,
    pending: false,
    getVoices: () => current,
    speak: vi.fn((utterance: FakeUtterance) => {
      spoken.push(utterance)
      synth.speaking = true
    }),
    cancel: vi.fn(() => {
      synth.speaking = false
    }),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  }

  Object.defineProperty(window, 'speechSynthesis', {
    value: synth,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    value: FakeUtterance,
    configurable: true,
  })

  /** Mimics the browser filling the list in after first render. */
  const arrive = (later: SpeechSynthesisVoice[]) => {
    current = later
    target.dispatchEvent(new Event('voiceschanged'))
  }

  return { synth, spoken, arrive }
}

beforeEach(() => {
  localStorage.clear()
})

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

describe('useSpeech voices', () => {
  it('picks the list up when the browser fills it in late', () => {
    const { arrive } = installSpeech([])
    const { result } = renderHook(() => useSpeech())
    expect(result.current.voices).toHaveLength(0)

    act(() => arrive([voice('Samantha', 'en-US', true)]))

    expect(result.current.voices).toHaveLength(1)
  })

  it('falls back to the best voice when none was ever chosen', () => {
    installSpeech([voice('Daniel', 'en-GB', false), voice('Samantha', 'en-US', true)])

    const { result } = renderHook(() => useSpeech())

    expect(result.current.voiceURI).toBe('uri:Samantha')
  })

  it('remembers a chosen voice across mounts', () => {
    installSpeech([voice('Daniel', 'en-GB', false), voice('Samantha', 'en-US', true)])

    const first = renderHook(() => useSpeech())
    act(() => first.result.current.setVoice('uri:Daniel'))
    expect(first.result.current.voiceURI).toBe('uri:Daniel')
    first.unmount()

    expect(localStorage.getItem(VOICE_KEY)).toBe('uri:Daniel')
    const second = renderHook(() => useSpeech())
    expect(second.result.current.voiceURI).toBe('uri:Daniel')
  })

  it('speaks with the chosen voice', () => {
    const { spoken } = installSpeech([
      voice('Daniel', 'en-GB', false),
      voice('Samantha', 'en-US', true),
    ])
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.setVoice('uri:Daniel'))
    act(() => result.current.speak('ubiquitous'))

    expect(spoken[0].voice?.name).toBe('Daniel')
    expect(spoken[0].lang).toBe('en-GB')
  })

  it('falls back when the chosen voice has since been deleted', () => {
    localStorage.setItem(VOICE_KEY, 'uri:Gone')
    installSpeech([voice('Samantha', 'en-US', true)])

    const { result } = renderHook(() => useSpeech())

    expect(result.current.voiceURI).toBe('uri:Samantha')
  })
})
