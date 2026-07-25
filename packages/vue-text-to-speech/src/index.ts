// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  TTSProvider,
  STTProvider,
  SpeakOptions,
  VoiceInfo,
  SpeechError,
  SpeechErrorCode,
  ProviderConfig,
  WebSpeechConfig,
  OpenAIConfig,
  ElevenLabsConfig,
  AzureConfig,
} from './providers/types.js'

// ─── Providers ────────────────────────────────────────────────────────────────
export { WebSpeechTTSProvider } from './providers/WebSpeechTTSProvider.js'
export { WebSpeechSTTProvider } from './providers/WebSpeechSTTProvider.js'
export type { WebSpeechSTTOptions } from './providers/WebSpeechSTTProvider.js'
export { OpenAIProvider } from './providers/OpenAIProvider.js'
export { ElevenLabsProvider } from './providers/ElevenLabsProvider.js'
export { AzureProvider } from './providers/AzureProvider.js'

// ─── Factory ──────────────────────────────────────────────────────────────────
export { createVueSpeech, createWebSpeechProvider } from './factory.js'

// ─── Injection key ────────────────────────────────────────────────────────────
export { SPEECH_PROVIDER_KEY } from './injectionKeys.js'

// ─── Composables ─────────────────────────────────────────────────────────────
export { useSpeechSynthesis } from './composables/useSpeechSynthesis.js'
export type { UseSpeechSynthesisOptions, UseSpeechSynthesisReturn } from './composables/useSpeechSynthesis.js'
export { useSpeechRecognition } from './composables/useSpeechRecognition.js'
export type { UseSpeechRecognitionOptions, UseSpeechRecognitionReturn } from './composables/useSpeechRecognition.js'

// ─── Sprint 5: Streaming composables + utilities ──────────────────────────────
export { useVoiceQueue } from './composables/useVoiceQueue.js'
export type { UseVoiceQueueOptions, UseVoiceQueueReturn } from './composables/useVoiceQueue.js'
export { useStreamingTTS } from './composables/useStreamingTTS.js'
export type { UseStreamingTTSOptions, UseStreamingTTSReturn } from './composables/useStreamingTTS.js'
export { extractCompleteSentences, splitSentences } from './utils/sentenceBoundary.js'

// ─── Sprint 6: UI Components ──────────────────────────────────────────────────
export { default as VueSpeechVoiceSelect } from './components/VueSpeechVoiceSelect.vue'
export { default as VueSpeechPlayer } from './components/VueSpeechPlayer.vue'
export { default as VueSpeechRecorder } from './components/VueSpeechRecorder.vue'

// ─── Sprint 7: Plugin ────────────────────────────────────────────────────────
export { VueSpeech } from './plugin.js'
export type { VueSpeechOptions } from './plugin.js'
