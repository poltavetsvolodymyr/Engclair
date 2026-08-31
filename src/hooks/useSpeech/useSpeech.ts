import { useCallback, useEffect, useMemo, useState } from 'react'

import { isSpeechSupported, speak as speakText, stopSpeaking } from '@/lib/speech'

import type { SpeechControl } from './types/speech-control'

/**
 * Pronunciation for the card being reviewed.
 *
 * Keeps the one piece of state a component would otherwise need — whether the
 * device is currently talking — out of the components themselves.
 */
export function useSpeech(): SpeechControl {
  const [speaking, setSpeaking] = useState(false)

  // A property of the device, not of this render.
  const supported = useMemo(isSpeechSupported, [])

  // Closing the app mid-word should not leave the phone talking to itself.
  useEffect(() => stopSpeaking, [])

  const speak = useCallback((text: string) => {
    speakText(text, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    })
  }, [])

  return { supported, speaking, speak }
}
