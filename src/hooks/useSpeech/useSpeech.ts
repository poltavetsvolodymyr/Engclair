import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  isSpeechSupported,
  listEnglishVoices,
  loadVoiceId,
  onVoicesChanged,
  resolveVoiceId,
  saveVoiceId,
  speak as speakText,
  stopSpeaking,
} from '@/lib/speech'

import type { SpeechControl } from './types/speech-control'

/**
 * Pronunciation for the card being reviewed, and which voice says it.
 *
 * Keeps everything stateful out of the components: whether the device is
 * talking, what voices it has, and which one the user settled on.
 */
export function useSpeech(): SpeechControl {
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState(listEnglishVoices)
  const [chosen, setChosen] = useState(loadVoiceId)

  // A property of the device, not of this render.
  const supported = useMemo(isSpeechSupported, [])

  // The voice list is populated asynchronously, so the first render above
  // usually sees nothing. This fills it in when the browser is ready.
  useEffect(() => onVoicesChanged(() => setVoices(listEnglishVoices())), [])

  // Closing the app mid-word should not leave the phone talking to itself.
  useEffect(() => stopSpeaking, [])

  // What will really be heard: the chosen voice may have been deleted from the
  // device since it was picked, in which case this is the fallback.
  // `voices` is a dependency because the list arriving changes the answer.
  const voiceId = useMemo(() => resolveVoiceId(chosen), [chosen, voices])

  const speak = useCallback(
    (text: string) => {
      speakText(text, {
        voiceId: chosen,
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      })
    },
    [chosen],
  )

  const setVoice = useCallback((id: string) => {
    setChosen(id)
    saveVoiceId(id)
  }, [])

  return { supported, speaking, speak, voices, voiceId, setVoice }
}
