import { useCallback, useEffect, useMemo, useState } from 'react'

import { playClip, stopClip } from '@/lib/audio'
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
 * A recorded clip wins when the card has one — a real voice beats the compact
 * system ones an iPhone offers the web — and the synthesiser catches whatever
 * the clip cannot do, so the button always makes a sound.
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
  useEffect(
    () => () => {
      stopSpeaking()
      stopClip()
    },
    [],
  )

  // What will really be heard: the chosen voice may have been deleted from the
  // device since it was picked, in which case this is the fallback.
  // `voices` is a dependency because the list arriving changes the answer.
  const voiceId = useMemo(() => resolveVoiceId(chosen), [chosen, voices])

  const speak = useCallback(
    (text: string, audio?: string) => {
      const synthesise = () => {
        speakText(text, {
          voiceId: chosen,
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
    },
    [chosen],
  )

  const setVoice = useCallback((id: string) => {
    setChosen(id)
    saveVoiceId(id)
  }, [])

  return { supported, speaking, speak, voices, voiceId, setVoice }
}
