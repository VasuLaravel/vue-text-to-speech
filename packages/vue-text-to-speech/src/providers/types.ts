// ─── Shared value objects ────────────────────────────────────────────────────

export interface VoiceInfo {
  id: string
  name: string
  lang: string
  /** Locale-aware display label, e.g. "Google US English" */
  label: string
  /** True when this is the browser/service default voice */
  default: boolean
}

export interface SpeakOptions {
  /** Text to synthesise */
  text: string
  /** Override the provider-level default voice */
  voice?: VoiceInfo
  /** Speech rate 0.1–10 (1 = normal) */
  rate?: number
  /** Pitch 0–2 (1 = normal). Not supported by AI providers — ignored silently */
  pitch?: number
  /** Volume 0–1 (1 = full) */
  volume?: number
}

export type SpeechErrorCode =
  | 'NOT_SUPPORTED'   // API unavailable in this environment
  | 'PERMISSION_DENIED' // Microphone permission denied
  | 'NETWORK'         // Network failure
  | 'API_ERROR'       // Non-2xx response from a remote TTS API
  | 'RATE_LIMIT'      // HTTP 429 from a remote TTS API
  | 'AUDIO_PLAYBACK'  // HTMLAudioElement or AudioContext error
  | 'CANCELLED'       // Deliberately stopped before completion
  | 'UNKNOWN'

export interface SpeechError {
  code: SpeechErrorCode
  message: string
  /** Original error for debugging */
  cause?: unknown
}

// ─── TTSProvider ─────────────────────────────────────────────────────────────

export interface TTSProvider {
  /** Whether the TTS API is available in the current environment */
  readonly isSupported: boolean

  /** Speak the given text. Resolves when the utterance ends naturally */
  speak(options: SpeakOptions): Promise<void>

  /** Stop any in-progress utterance immediately */
  stop(): void

  /** Pause the current utterance (Web Speech only; no-op for AI providers) */
  pause(): void

  /** Resume a paused utterance (Web Speech only; no-op for AI providers) */
  resume(): void

  /** Return all available voices. May trigger an async fetch for AI providers */
  getVoices(): Promise<VoiceInfo[]>

  // ── Lifecycle hooks ────────────────────────────────────────────────────────
  /** Called when an utterance starts playing */
  onStart(cb: () => void): void
  /** Called when an utterance ends (either naturally or via stop()) */
  onEnd(cb: () => void): void
  /** Called when an error occurs */
  onError(cb: (err: SpeechError) => void): void
}

// ─── STTProvider ─────────────────────────────────────────────────────────────

export interface STTProvider {
  /** Whether the STT API is available in the current environment */
  readonly isSupported: boolean

  /** Whether recognition is configured as continuous */
  readonly continuous: boolean

  /** Start listening */
  start(): void

  /** Stop listening */
  stop(): void

  /** Called on every interim transcript update */
  onTranscript(cb: (transcript: string, confidence: number) => void): void

  /** Called when the recogniser commits a final result */
  onFinalTranscript(cb: (transcript: string, confidence: number) => void): void

  /** Called when a recognition error occurs */
  onError(cb: (err: SpeechError) => void): void
}

// ─── Plugin config types ──────────────────────────────────────────────────────

export interface WebSpeechConfig {
  provider: 'web'
  /** BCP-47 lang code used as default for STT, e.g. 'en-US' */
  lang?: string
}

export interface OpenAIConfig {
  provider: 'openai'
  apiKey: string
  /** Override the API base URL — useful for proxying keys in production */
  baseURL?: string
  model?: 'tts-1' | 'tts-1-hd'
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  speed?: number
}

export interface ElevenLabsConfig {
  provider: 'elevenlabs'
  apiKey: string
  /** Override the API base URL — useful for proxying keys in production */
  baseURL?: string
  voiceId?: string
  modelId?: string
  stability?: number
  similarityBoost?: number
}

export interface AzureConfig {
  provider: 'azure'
  subscriptionKey: string
  region: string
  /** Override the API base URL — useful for proxying keys in production */
  baseURL?: string
  voice?: string
}

export type ProviderConfig = WebSpeechConfig | OpenAIConfig | ElevenLabsConfig | AzureConfig
