import type { SpeechCallbacks } from './types/speech-callbacks'

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

/**
 * The best English voice on this device, or undefined if it has none.
 *
 * Locally installed voices are preferred: a remote voice needs the network,
 * which is exactly what this app promises not to require.
 */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const english = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.replace('_', '-').toLowerCase().startsWith('en'))

  return english.find((voice) => voice.localService) ?? english[0]
}

/**
 * Speak `text` in English, replacing anything already being said.
 *
 * The language is pinned deliberately: left alone, a device set to another
 * language reads English words with that language's phonetics, which is worse
 * than useless for learning pronunciation.
 */
export function speak(text: string, callbacks: SpeechCallbacks = {}): void {
  if (!isSpeechSupported()) return

  const synth = window.speechSynthesis
  // Only cancel when there is something to cancel. Calling cancel() on an idle
  // queue is what leaves iOS silent for every later utterance.
  if (synth.speaking || synth.pending) synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const voice = pickVoice()
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang ?? FALLBACK_LANG

  utterance.onstart = () => callbacks.onStart?.()
  utterance.onend = () => callbacks.onEnd?.()
  utterance.onerror = () => callbacks.onEnd?.()

  synth.speak(utterance)
}

/** Stop immediately. Safe to call when nothing is being spoken. */
export function stopSpeaking(): void {
  if (!isSpeechSupported()) return

  const synth = window.speechSynthesis
  if (synth.speaking || synth.pending) synth.cancel()
}
