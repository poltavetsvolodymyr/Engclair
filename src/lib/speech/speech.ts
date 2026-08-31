import type { SpeakOptions } from './types/speak-options'

/**
 * Pronunciation through the browser's own speech synthesis.
 *
 * The fallback, not the main event: a card with a recording plays that
 * instead. This is what speaks a card that has none, and it costs nothing —
 * no audio ships for it and nothing is fetched, so it works offline too.
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
 * nineteen of them against six real ones. None pronounces English in a way
 * worth learning from, so none may be picked. The prefix is Apple's own, so
 * this matches nothing on other platforms — which is correct: they have no
 * equivalent.
 */
function isNovelty(voice: SpeechSynthesisVoice): boolean {
  return voice.voiceURI.startsWith('com.apple.speech.synthesis.voice.')
}

/**
 * The best English voice on this device, or undefined if it has none.
 *
 * Locally installed voices win: a remote voice needs the network, which is
 * exactly what this app promises not to require.
 */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const english = window.speechSynthesis.getVoices().filter(isEnglish)
  // Never trade a working voice for silence: a device with nothing but
  // novelty voices still gets to speak.
  const real = english.filter((voice) => !isNovelty(voice))
  const usable = real.length > 0 ? real : english

  return usable.find((voice) => voice.localService) ?? usable[0]
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
  const voice = pickVoice()
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
