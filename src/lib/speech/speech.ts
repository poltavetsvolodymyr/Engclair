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
 * Every English voice on this device, best first.
 *
 * Locally installed voices lead: a remote voice needs the network, which is
 * exactly what this app promises not to require. Duplicate URIs are dropped —
 * some platforms list the same voice more than once.
 */
export function listEnglishVoices(): VoiceOption[] {
  if (!isSpeechSupported()) return []

  const seen = new Set<string>()

  return window.speechSynthesis
    .getVoices()
    .filter(isEnglish)
    .filter((voice) => {
      if (seen.has(voice.voiceURI)) return false
      seen.add(voice.voiceURI)
      return true
    })
    .map((voice) => ({
      uri: voice.voiceURI,
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
function resolveVoice(voiceURI?: string | null): SpeechSynthesisVoice | undefined {
  const english = window.speechSynthesis.getVoices().filter(isEnglish)

  return (
    (voiceURI ? english.find((voice) => voice.voiceURI === voiceURI) : undefined) ??
    english.find((voice) => voice.localService) ??
    english[0]
  )
}

/** URI of the voice that would speak right now, or null on a mute device. */
export function resolveVoiceUri(voiceURI?: string | null): string | null {
  if (!isSpeechSupported()) return null
  return resolveVoice(voiceURI)?.voiceURI ?? null
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
  const voice = resolveVoice(options.voiceURI)
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
