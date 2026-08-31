/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clipUrl, playClip, stopClip } from './audio-clip'

class FakeAudio {
  static instances: FakeAudio[] = []
  /** What the next play() call resolves or rejects with. */
  static playResult: Promise<void> = Promise.resolve()

  src: string
  onplaying: (() => void) | null = null
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  pause = vi.fn()
  play = vi.fn(() => FakeAudio.playResult)

  constructor(src: string) {
    this.src = src
    FakeAudio.instances.push(this)
  }
}

function installAudio() {
  FakeAudio.instances = []
  FakeAudio.playResult = Promise.resolve()
  Object.defineProperty(globalThis, 'Audio', { value: FakeAudio, configurable: true })
  return FakeAudio
}

/** The last element `playClip` created. */
function latest(): FakeAudio {
  return FakeAudio.instances[FakeAudio.instances.length - 1]
}

beforeEach(() => {
  installAudio()
})

afterEach(() => {
  stopClip()
  Reflect.deleteProperty(globalThis, 'Audio')
  vi.restoreAllMocks()
})

describe('clipUrl', () => {
  it('points inside the audio folder under the app base path', () => {
    expect(clipUrl('ubiquitous.m4a')).toBe(
      `${import.meta.env.BASE_URL}audio/ubiquitous.m4a`,
    )
  })
})

describe('playClip', () => {
  it('plays the file it is given', () => {
    playClip('ubiquitous.m4a')

    expect(latest().src).toContain('audio/ubiquitous.m4a')
    expect(latest().play).toHaveBeenCalledTimes(1)
  })

  it('reports the start and the end', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()

    playClip('ubiquitous.m4a', { onStart, onEnd })
    latest().onplaying?.()
    latest().onended?.()

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('reports a clip that will not load, rather than throwing', () => {
    const onError = vi.fn()

    playClip('missing.m4a', { onError })
    latest().onerror?.()

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('reports playback the browser refuses outright', async () => {
    FakeAudio.playResult = Promise.reject(new Error('NotAllowedError'))
    const onError = vi.fn()

    playClip('ubiquitous.m4a', { onError })
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
  })

  it('falls back once when the failure arrives by both routes', async () => {
    // The element errors and the play() promise rejects for the same clip.
    // Counting that twice made the app speak the word twice.
    FakeAudio.playResult = Promise.reject(new Error('NotSupportedError'))
    const onError = vi.fn()

    playClip('missing.m4a', { onError })
    latest().onerror?.()
    await vi.waitFor(() => expect(onError).toHaveBeenCalled())

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('a clip replaced mid-flight cannot report anything', () => {
    const onEnd = vi.fn()
    playClip('first.m4a', { onEnd })
    const first = latest()

    playClip('second.m4a')
    first.onended?.()

    expect(onEnd).not.toHaveBeenCalled()
  })

  it('stops the previous clip before starting another', () => {
    playClip('first.m4a')
    const first = latest()

    playClip('second.m4a')

    expect(first.pause).toHaveBeenCalledTimes(1)
    expect(latest().src).toContain('second.m4a')
  })

  it('falls back when the environment has no audio at all', () => {
    Object.defineProperty(globalThis, 'Audio', { value: undefined, configurable: true })
    const onError = vi.fn()

    playClip('ubiquitous.m4a', { onError })

    expect(onError).toHaveBeenCalledTimes(1)
  })
})

describe('stopClip', () => {
  it('pauses what is playing', () => {
    playClip('ubiquitous.m4a')
    const clip = latest()

    stopClip()

    expect(clip.pause).toHaveBeenCalledTimes(1)
  })

  it('a stopped clip cannot go on to report an error', () => {
    const onError = vi.fn()
    playClip('ubiquitous.m4a', { onError })
    const clip = latest()

    stopClip()
    clip.onerror?.()

    expect(onError).not.toHaveBeenCalled()
  })

  it('is a no-op when nothing is playing', () => {
    expect(() => stopClip()).not.toThrow()
  })
})
