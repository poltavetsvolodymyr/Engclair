/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

    expect(result.current.speaking).toBeNull()
  })

  it('follows the utterance from start to end', () => {
    const { spoken } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('term', 'ubiquitous'))
    act(() => spoken[0].onstart?.())
    expect(result.current.speaking).toBe('term')

    act(() => spoken[0].onend?.())
    expect(result.current.speaking).toBeNull()
  })

  it('stops talking when the hook goes away', () => {
    const { synth } = installSpeech()
    const { result, unmount } = renderHook(() => useSpeech())

    act(() => result.current.speak('term', 'ubiquitous'))
    unmount()

    expect(synth.cancel).toHaveBeenCalledTimes(1)
  })
})

describe('useSpeech with a recorded clip', () => {
  it('synthesises when the card has no recording', () => {
    const { synth } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('term', 'ubiquitous'))

    expect(synth.speak).toHaveBeenCalledTimes(1)
    expect(FakeAudio.instances).toHaveLength(0)
  })

  it('prefers the recording, and does not also speak', () => {
    const { synth } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('term', 'ubiquitous', 'ubiquitous.m4a'))

    expect(latestClip().src).toContain('audio/ubiquitous.m4a')
    expect(synth.speak).not.toHaveBeenCalled()
  })

  it('follows the clip from start to end', () => {
    installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('term', 'ubiquitous', 'ubiquitous.m4a'))
    act(() => latestClip().onplaying?.())
    expect(result.current.speaking).toBe('term')

    act(() => latestClip().onended?.())
    expect(result.current.speaking).toBeNull()
  })

  it('speaks the word when its recording will not play', () => {
    const { synth } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('term', 'ubiquitous', 'missing.m4a'))
    act(() => latestClip().onerror?.())

    expect(synth.speak).toHaveBeenCalledTimes(1)
  })

  it('stops the clip when the hook goes away', () => {
    installSpeech()
    const { result, unmount } = renderHook(() => useSpeech())

    act(() => result.current.speak('term', 'ubiquitous', 'ubiquitous.m4a'))
    const clip = latestClip()
    unmount()

    expect(clip.pause).toHaveBeenCalledTimes(1)
  })
})

describe('useSpeech across the two parts of a card', () => {
  it('names the part it is reading, so only that button lights', () => {
    const { spoken } = installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('answer', 'Present everywhere.'))
    act(() => spoken[0].onstart?.())

    expect(result.current.speaking).toBe('answer')
  })

  it('plays the answer its own recording', () => {
    installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() =>
      result.current.speak('answer', 'Present everywhere.', 'card-answer.mp3'),
    )

    expect(latestClip().src).toContain('audio/card-answer.mp3')
  })

  it('a part that has been replaced cannot put out the new one', () => {
    // Starting the definition stops the term's clip, and the stopped clip may
    // still report an end. Answering it would darken a button that is playing.
    installSpeech()
    const { result } = renderHook(() => useSpeech())

    act(() => result.current.speak('term', 'ubiquitous', 'term.mp3'))
    const term = latestClip()
    act(() => term.onplaying?.())

    act(() => result.current.speak('answer', 'Present everywhere.', 'def.mp3'))
    act(() => latestClip().onplaying?.())
    act(() => term.onended?.())

    expect(result.current.speaking).toBe('answer')
  })
})
