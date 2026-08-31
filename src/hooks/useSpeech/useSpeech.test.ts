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

/** How lib/speech identifies the voice `voice()` above would build. */
function idOf(name: string, lang: string): string {
  return `uri:${name}|${name}|${lang}`
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

class FakeAudio {
  static instances: FakeAudio[] = []

  src: string
  onplaying: (() => void) | null = null
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  pause = vi.fn()
  play = vi.fn(() => Promise.resolve())

  constructor(src: string) {
    this.src = src
    FakeAudio.instances.push(this)
  }
}

/** The last element the clip player created. */
function latestClip(): FakeAudio {
  return FakeAudio.instances[FakeAudio.instances.length - 1]
}

beforeEach(() => {
  localStorage.clear()
  FakeAudio.instances = []
  Object.defineProperty(globalThis, 'Audio', { value: FakeAudio, configurable: true })
})

afterEach(() => {
  Reflect.deleteProperty(window, 'speechSynthesis')
  Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance')
  Reflect.deleteProperty(globalThis, 'Audio')
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

    expect(result.current.voiceId).toBe(idOf('Samantha', 'en-US'))
  })

  it('remembers a chosen voice across mounts', () => {
    installSpeech([voice('Daniel', 'en-GB', false), voice('Samantha', 'en-US', true)])

    const first = renderHook(() => useSpeech())
    act(() => first.result.current.setVoice(idOf('Daniel', 'en-GB')))
    expect(first.result.current.voiceId).toBe(idOf('Daniel', 'en-GB'))
    first.unmount()

    expect(localStorage.getItem(VOICE_KEY)).toBe(idOf('Daniel', 'en-GB'))
    const second = renderHook(() => useSpeech())
    expect(second.result.current.voiceId).toBe(idOf('Daniel', 'en-GB'))
  })

  it('speaks with the chosen voice', () => {
    const { spoken } = installSpeech([
      voice('Daniel', 'en-GB', false),
      voice('Samantha', 'en-US', true),
    ])
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.setVoice(idOf('Daniel', 'en-GB')))
    act(() => result.current.speak('ubiquitous'))

    expect(spoken[0].voice?.name).toBe('Daniel')
    expect(spoken[0].lang).toBe('en-GB')
  })

  it('falls back when the chosen voice has since been deleted', () => {
    localStorage.setItem(VOICE_KEY, 'uri:Gone')
    installSpeech([voice('Samantha', 'en-US', true)])

    const { result } = renderHook(() => useSpeech())

    expect(result.current.voiceId).toBe(idOf('Samantha', 'en-US'))
  })
})

describe('useSpeech with a recorded clip', () => {
  it('synthesises when the card has no recording', () => {
    const { synth } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('ubiquitous'))

    expect(synth.speak).toHaveBeenCalledTimes(1)
    expect(FakeAudio.instances).toHaveLength(0)
  })

  it('prefers the recording, and does not also speak', () => {
    const { synth } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('ubiquitous', 'ubiquitous.m4a'))

    expect(latestClip().src).toContain('audio/ubiquitous.m4a')
    expect(synth.speak).not.toHaveBeenCalled()
  })

  it('follows the clip from start to end', () => {
    installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('ubiquitous', 'ubiquitous.m4a'))
    act(() => latestClip().onplaying?.())
    expect(result.current.speaking).toBe(true)

    act(() => latestClip().onended?.())
    expect(result.current.speaking).toBe(false)
  })

  it('speaks the word when its recording will not play', () => {
    const { synth } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('ubiquitous', 'missing.m4a'))
    act(() => latestClip().onerror?.())

    expect(synth.speak).toHaveBeenCalledTimes(1)
  })

  it('stops the clip when the hook goes away', () => {
    installSpeech()
    const { result, unmount } = renderHook(() => useSpeech())

    act(() => result.current.speak('ubiquitous', 'ubiquitous.m4a'))
    const clip = latestClip()
    unmount()

    expect(clip.pause).toHaveBeenCalledTimes(1)
  })
})
