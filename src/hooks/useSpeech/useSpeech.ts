import { useCallback, useEffect, useMemo, useState } from 'react'

import { playClip, stopClip } from '@/lib/audio'
import { isSpeechSupported, speak as speakText, stopSpeaking } from '@/lib/speech'

import type { SpeechControl } from './types/speech-control'

/**
 * Pronunciation for the card being reviewed.
 *
 * A recorded clip wins when the card has one — every card in the deck does —
 * and the synthesiser catches whatever the clip cannot do, so the button
 * always makes a sound.
 */
export function useSpeech(): SpeechControl {
  const [speaking, setSpeaking] = useState(false)

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

  const speak = useCallback((text: string, audio?: string) => {
    const synthesise = () => {
      speakText(text, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      })
    }

    if (!audio) {
      synthesise()
      return
    }

    playClip(audio, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      // A missing or unplayable recording is not a dead end: say it instead.
      onError: synthesise,
    })
  }, [])

  return { supported, speaking, speak }
}
