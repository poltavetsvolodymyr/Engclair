export {
  isSpeechSupported,
  listEnglishVoices,
  onVoicesChanged,
  resolveVoiceId,
  speak,
  stopSpeaking,
} from './speech'
export { loadVoiceId, saveVoiceId } from './voice-storage'
export type { SpeakOptions, VoiceOption } from './types/speak-options'
