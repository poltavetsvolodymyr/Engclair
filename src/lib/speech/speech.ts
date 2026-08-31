import type { SpeakOptions, VoiceOption } from './types/speak-options'

/**
 * Pronunciation through the browser's own speech synthesis.
 *
 * No audio ships with the deck and nothing is fetched: the device speaks with
 * the voices it already has, which keeps the app the same size and keeps it
 * working offline.
 */

/** Fallback tag when the device exposes no English voice we can name. */
const FALLBACK_LANG = 'en-US'

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  )
}

function isEnglish(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.replace('_', '-').toLowerCase().startsWith('en')
}

/**
 * Apple's novelty and legacy synthesiser voices — Bells, Boing, Zarvox,
 * Trinoids, Albert and friends.
 *
 * The API presents them as ordinary voices, and on an iPhone there are
 * nineteen of them against six real ones, so unfiltered they bury the list.
 * None pronounces English in a way worth learning from. The prefix is Apple's
 * own, so this matches nothing on other platforms — which is correct: they
 * have no equivalent.
 */
function isNovelty(voice: SpeechSynthesisVoice): boolean {
  return voice.voiceURI.startsWith('com.apple.speech.synthesis.voice.')
}

/**
 * The English voices worth offering, from the same source for both the list
 * and the fallback — the two must never disagree about what exists.
 */
function usableEnglishVoices(): SpeechSynthesisVoice[] {
  const english = window.speechSynthesis.getVoices().filter(isEnglish)
  const real = english.filter((voice) => !isNovelty(voice))

  // Never trade a working voice for silence: a device with nothing but
  // novelty voices still gets to speak.
  return real.length > 0 ? real : english
}

/**
 * A stable identity for a voice.
 *
 * `voiceURI` alone is not enough: nothing in the spec makes it unique, and a
 * device may well hand two entries the same one. Keying on it alone would drop
 * a real voice from the list, and — worse — would make picking one of them
 * play the other.
 */
function voiceId(voice: SpeechSynthesisVoice): string {
  return `${voice.voiceURI}|${voice.name}|${voice.lang}`
}

/**
 * Every English voice on this device, best first.
 *
 * Locally installed voices lead: a remote voice needs the network, which is
 * exactly what this app promises not to require.
 */
export function listEnglishVoices(): VoiceOption[] {
  if (!isSpeechSupported()) return []

  const seen = new Set<string>()

  return usableEnglishVoices()
    .filter((voice) => {
      const id = voiceId(voice)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((voice) => ({
      id: voiceId(voice),
      name: voice.name,
      lang: voice.lang,
      local: voice.localService,
    }))
    // Sorted on one key, and stably: within each group the device's own order
    // survives, so the first entry is exactly the voice the fallback below
    // would reach for. The list and the default can never disagree.
    .sort((a, b) => Number(b.local) - Number(a.local))
}

/**
 * The voice an utterance would use: the chosen one when it is still installed,
 * otherwise the best English voice available.
 */
function resolveVoice(id?: string | null): SpeechSynthesisVoice | undefined {
  const english = usableEnglishVoices()

  return (
    (id ? english.find((voice) => voiceId(voice) === id) : undefined) ??
    english.find((voice) => voice.localService) ??
    english[0]
  )
}

/** Id of the voice that would speak right now, or null on a mute device. */
export function resolveVoiceId(id?: string | null): string | null {
  if (!isSpeechSupported()) return null

  const voice = resolveVoice(id)
  return voice ? voiceId(voice) : null
}

/**
 * Speak `text` in English, replacing anything already being said.
 *
 * The language is pinned deliberately: left alone, a device set to another
 * language reads English words with that language's phonetics, which is worse
 * than useless for learning pronunciation.
 */
export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSupported()) return

  const synth = window.speechSynthesis
  // Only cancel when there is something to cancel. Calling cancel() on an idle
  // queue is what leaves iOS silent for every later utterance.
  if (synth.speaking || synth.pending) synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const voice = resolveVoice(options.voiceId)
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang ?? FALLBACK_LANG

  utterance.onstart = () => options.onStart?.()
  utterance.onend = () => options.onEnd?.()
  utterance.onerror = () => options.onEnd?.()

  synth.speak(utterance)
}

/** Stop immediately. Safe to call when nothing is being spoken. */
export function stopSpeaking(): void {
  if (!isSpeechSupported()) return

  const synth = window.speechSynthesis
  if (synth.speaking || synth.pending) synth.cancel()
}

/**
 * Run `listener` whenever the voice list changes, and return an unsubscribe.
 *
 * The list is populated asynchronously: ask for it too early — which a first
 * render always does — and it comes back empty.
 */
export function onVoicesChanged(listener: () => void): () => void {
  if (!isSpeechSupported()) return () => {}

  const synth = window.speechSynthesis
  synth.addEventListener('voiceschanged', listener)
  return () => synth.removeEventListener('voiceschanged', listener)
}
