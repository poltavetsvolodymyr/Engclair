/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isSpeechSupported,
  listEnglishVoices,
  onVoicesChanged,
  resolveVoiceUri,
  speak,
  stopSpeaking,
} from './speech'

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

function voice(
  lang: string,
  localService: boolean,
  name = `${lang}${localService ? ' (local)' : ' (remote)'}`,
): SpeechSynthesisVoice {
  return { lang, localService, name, voiceURI: `uri:${name}`, default: false }
}

/** Installs a stand-in for the speech API and hands back what it recorded. */
function installSpeech(voices: SpeechSynthesisVoice[] = []) {
  const spoken: FakeUtterance[] = []
  const target = new EventTarget()
  const synth = {
    speaking: false,
    pending: false,
    getVoices: () => voices,
    speak: vi.fn((utterance: FakeUtterance) => {
      spoken.push(utterance)
      synth.speaking = true
    }),
    cancel: vi.fn(() => {
      synth.speaking = false
      synth.pending = false
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

  return { synth, spoken, target }
}

afterEach(() => {
  Reflect.deleteProperty(window, 'speechSynthesis')
  Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance')
  vi.restoreAllMocks()
})

describe('isSpeechSupported', () => {
  it('is false on a device without the API', () => {
    expect(isSpeechSupported()).toBe(false)
  })

  it('is true once the API is present', () => {
    installSpeech()

    expect(isSpeechSupported()).toBe(true)
  })
})

describe('speak', () => {
  it('does nothing rather than throwing when unsupported', () => {
    expect(() => speak('ubiquitous')).not.toThrow()
  })

  it('speaks the text it is given', () => {
    const { spoken } = installSpeech()

    speak('ubiquitous')

    expect(spoken).toHaveLength(1)
    expect(spoken[0].text).toBe('ubiquitous')
  })

  it('prefers a voice installed on the device, so it works offline', () => {
    const local = voice('en-US', true)
    const { spoken } = installSpeech([voice('en-GB', false), local])

    speak('ubiquitous')

    expect(spoken[0].voice).toBe(local)
  })

  it('takes the language from the chosen voice rather than assuming en-US', () => {
    const { spoken } = installSpeech([voice('en-GB', true)])

    speak('ubiquitous')

    expect(spoken[0].lang).toBe('en-GB')
  })

  it('never picks a voice in another language', () => {
    const { spoken } = installSpeech([voice('uk-UA', true), voice('de-DE', true)])

    speak('ubiquitous')

    expect(spoken[0].voice).toBeNull()
    expect(spoken[0].lang).toBe('en-US')
  })

  it('leaves an idle queue alone — cancelling one wedges iOS', () => {
    const { synth } = installSpeech()

    speak('ubiquitous')

    expect(synth.cancel).not.toHaveBeenCalled()
  })

  it('cancels what is already being said', () => {
    const { synth } = installSpeech()
    synth.speaking = true

    speak('meticulous')

    expect(synth.cancel).toHaveBeenCalledTimes(1)
    expect(synth.speak).toHaveBeenCalledTimes(1)
  })

  it('reports the start and the end of an utterance', () => {
    const { spoken } = installSpeech()
    const onStart = vi.fn()
    const onEnd = vi.fn()

    speak('ubiquitous', { onStart, onEnd })
    spoken[0].onstart?.()
    spoken[0].onend?.()

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('reports the end on failure too, so no caller is left waiting', () => {
    const { spoken } = installSpeech()
    const onEnd = vi.fn()

    speak('ubiquitous', { onEnd })
    spoken[0].onerror?.()

    expect(onEnd).toHaveBeenCalledTimes(1)
  })
})

describe('stopSpeaking', () => {
  it('cancels while speaking', () => {
    const { synth } = installSpeech()
    synth.speaking = true

    stopSpeaking()

    expect(synth.cancel).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when nothing is being said', () => {
    const { synth } = installSpeech()

    stopSpeaking()

    expect(synth.cancel).not.toHaveBeenCalled()
  })

  it('survives a device without the API', () => {
    expect(() => stopSpeaking()).not.toThrow()
  })
})

describe('listEnglishVoices', () => {
  it('is empty on a device without the API', () => {
    expect(listEnglishVoices()).toEqual([])
  })

  it('leaves out every voice that is not English', () => {
    installSpeech([voice('uk-UA', true), voice('en-US', true), voice('de-DE', true)])

    expect(listEnglishVoices().map((v) => v.lang)).toEqual(['en-US'])
  })

  it('puts installed voices before ones that need the network', () => {
    installSpeech([
      voice('en-GB', false, 'Daniel'),
      voice('en-US', true, 'Samantha'),
      voice('en-AU', true, 'Karen'),
    ])

    // Within a group the device's own order is kept, so Samantha stays ahead
    // of Karen rather than being reordered by name.
    expect(listEnglishVoices().map((v) => v.name)).toEqual([
      'Samantha',
      'Karen',
      'Daniel',
    ])
  })

  it('leads with the voice that speaks when nothing has been chosen', () => {
    installSpeech([
      voice('en-GB', false, 'Daniel'),
      voice('en-US', true, 'Samantha'),
      voice('en-AU', true, 'Karen'),
    ])

    expect(listEnglishVoices()[0].uri).toBe(resolveVoiceUri(null))
  })

  it('lists a voice once even when the device repeats it', () => {
    const duplicate = voice('en-US', true, 'Samantha')
    installSpeech([duplicate, duplicate])

    expect(listEnglishVoices()).toHaveLength(1)
  })
})

describe('resolveVoiceUri', () => {
  it('is null on a device without the API', () => {
    expect(resolveVoiceUri('uri:Samantha')).toBeNull()
  })

  it('keeps the chosen voice when it is still installed', () => {
    installSpeech([voice('en-US', true, 'Samantha'), voice('en-GB', false, 'Daniel')])

    expect(resolveVoiceUri('uri:Daniel')).toBe('uri:Daniel')
  })

  it('falls back to the best voice when the chosen one is gone', () => {
    installSpeech([voice('en-US', true, 'Samantha')])

    expect(resolveVoiceUri('uri:Deleted')).toBe('uri:Samantha')
  })
})

describe('speak with a chosen voice', () => {
  it('uses the voice it is asked for, local or not', () => {
    const { spoken } = installSpeech([
      voice('en-US', true, 'Samantha'),
      voice('en-GB', false, 'Daniel'),
    ])

    speak('ubiquitous', { voiceURI: 'uri:Daniel' })

    expect(spoken[0].voice?.name).toBe('Daniel')
    expect(spoken[0].lang).toBe('en-GB')
  })

  it('ignores a chosen voice that is no longer installed', () => {
    const { spoken } = installSpeech([voice('en-US', true, 'Samantha')])

    speak('ubiquitous', { voiceURI: 'uri:Deleted' })

    expect(spoken[0].voice?.name).toBe('Samantha')
  })
})

describe('onVoicesChanged', () => {
  it('calls back when the browser fills the list in', () => {
    const { target } = installSpeech()
    const listener = vi.fn()

    onVoicesChanged(listener)
    target.dispatchEvent(new Event('voiceschanged'))

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('stops calling back once unsubscribed', () => {
    const { target } = installSpeech()
    const listener = vi.fn()

    onVoicesChanged(listener)()
    target.dispatchEvent(new Event('voiceschanged'))

    expect(listener).not.toHaveBeenCalled()
  })

  it('hands back a no-op unsubscribe when unsupported', () => {
    expect(() => onVoicesChanged(vi.fn())()).not.toThrow()
  })
})
