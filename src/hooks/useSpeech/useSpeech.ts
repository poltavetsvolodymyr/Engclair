import { useCallback, useEffect, useMemo, useState } from 'react'

import { playClip, stopClip } from '@/lib/audio'
import { isSpeechSupported, speak as speakText, stopSpeaking } from '@/lib/speech'
import type { SpokenPart } from '@/types'

import type { SpeechControl } from './types/speech-control'

/**
 * Pronunciation for the card being reviewed — the term, or its definition.
 *
 * A recorded clip wins when the card has one — every card in the deck does —
 * and the synthesiser catches whatever the clip cannot do, so a button always
 * makes a sound.
 */
export function useSpeech(): SpeechControl {
  const [speaking, setSpeaking] = useState<SpokenPart | null>(null)

  // A property of the device, not of this render.
  const supported = useMemo(isSpeechSupported, [])

  // Closing the app mid-word should not leave the phone talking to itself.
  useEffect(
    () => () => {
      stopSpeaking()
      stopClip()
    },
    [],
  )

  // Only what is playing now may report itself finished. Pressing the other
  // button stops this one, and a late `onEnd` from it would otherwise put out
  // a button that has just been lit.
  const started = useCallback((part: SpokenPart) => () => setSpeaking(part), [])
  const stopped = useCallback(
    (part: SpokenPart) => () =>
      setSpeaking((current) => (current === part ? null : current)),
    [],
  )

  const speak = useCallback(
    (part: SpokenPart, text: string, audio?: string) => {
      const synthesise = () => {
        speakText(text, { onStart: started(part), onEnd: stopped(part) })
      }

      if (!audio) {
        synthesise()
        return
      }

      playClip(audio, {
        onStart: started(part),
        onEnd: stopped(part),
        // A missing or unplayable recording is not a dead end: say it instead.
        onError: synthesise,
      })
    },
    [started, stopped],
  )

  return { supported, speaking, speak }
}
