import type { ClipCallbacks } from './types/clip-callbacks'

/**
 * Recorded pronunciation clips bundled with the deck.
 *
 * A clip beats speech synthesis whenever one exists: the system voices an
 * iPhone gives the web are the compact ones, and no amount of coaxing makes
 * them sound like a person. Clips live in `public/audio/` and are precached
 * with the rest of the shell, so they work offline like everything else.
 */

/** Where clips live, under the app's base path. */
const CLIP_DIR = 'audio/'

/** Only one thing is ever heard at a time. */
let current: HTMLAudioElement | null = null

export function clipUrl(file: string): string {
  return `${import.meta.env.BASE_URL}${CLIP_DIR}${file}`
}

/** Stop whatever clip is playing. Safe when nothing is. */
export function stopClip(): void {
  if (!current) return

  current.pause()
  // Detach the handlers first: pausing fires nothing, but resetting a source
  // can, and a stopped clip must not report an error the caller would answer
  // by speaking.
  current.onplaying = null
  current.onended = null
  current.onerror = null
  current = null
}

/**
 * Play the clip for `file`, replacing anything already playing.
 *
 * Failure is expected rather than exceptional — a card may simply have no
 * recording yet — so it is reported through `onError` instead of thrown.
 */
export function playClip(file: string, callbacks: ClipCallbacks = {}): void {
  if (typeof Audio === 'undefined') {
    callbacks.onError?.()
    return
  }

  stopClip()

  const audio = new Audio(clipUrl(file))
  current = audio

  /**
   * Ends this clip exactly once.
   *
   * A failure reaches us twice over — the element's `error` event and the
   * rejected `play()` promise both fire — and a second call would speak the
   * word a second time. `current` also guards clips that have been stopped or
   * replaced: pausing rejects the play promise, and that must not be mistaken
   * for a clip worth falling back from.
   */
  const settle = (callback?: () => void) => () => {
    if (current !== audio) return
    current = null
    callback?.()
  }

  audio.onplaying = () => {
    if (current === audio) callbacks.onStart?.()
  }
  audio.onended = settle(callbacks.onEnd)
  audio.onerror = settle(callbacks.onError)

  // Playback can also be refused outright — an autoplay policy, a decode
  // failure — and that arrives as a rejected promise rather than an event.
  void Promise.resolve(audio.play()).catch(settle(callbacks.onError))
}
