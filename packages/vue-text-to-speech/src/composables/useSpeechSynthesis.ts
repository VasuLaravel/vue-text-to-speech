import {
  ref,
  shallowRef,
  readonly,
  inject,
  onUnmounted,
  type Ref,
  type ShallowRef,
} from 'vue'
import { SPEECH_PROVIDER_KEY } from '../injectionKeys.js'
import { createWebSpeechProvider } from '../factory.js'
import type { TTSProvider, SpeakOptions, VoiceInfo, SpeechError } from '../providers/types.js'

// ─── Options & Return type ────────────────────────────────────────────────────

export interface UseSpeechSynthesisOptions {
  /** Override the injected provider for this composable instance only */
  provider?: TTSProvider
  /** Initial speech rate (0.1–10, default 1) */
  rate?: number
  /** Initial pitch (0–2, default 1) */
  pitch?: number
  /** Initial volume (0–1, default 1) */
  volume?: number
}

export interface UseSpeechSynthesisReturn {
  /** Whether the provider is available in this environment */
  readonly isSupported: Readonly<ShallowRef<boolean>>
  /** Whether speech is currently playing */
  readonly isSpeaking: Readonly<ShallowRef<boolean>>
  /** Whether speech is paused */
  readonly isPaused: Readonly<ShallowRef<boolean>>
  /** Voices available from the provider (loads async for AI providers) */
  readonly voices: Readonly<Ref<readonly VoiceInfo[]>>
  /** True while voices are being fetched */
  readonly isLoadingVoices: Readonly<ShallowRef<boolean>>
  /** Currently selected voice */
  readonly selectedVoice: Ref<VoiceInfo | undefined>
  /**
   * Speech rate — changes apply to the **next** `speak()` call.
   * (I-4.4: rate/pitch changes do NOT affect the current utterance)
   */
  readonly rate: Ref<number>
  /** Pitch — changes apply to the **next** `speak()` call (I-4.4) */
  readonly pitch: Ref<number>
  /** Volume — changes apply to the **next** `speak()` call */
  readonly volume: Ref<number>
  /** Most recent error, cleared on next `speak()` */
  readonly error: Readonly<ShallowRef<SpeechError | null>>
  /** Speak text. Uses current `selectedVoice`, `rate`, `pitch`, `volume` */
  speak(text: string, overrides?: Partial<SpeakOptions>): Promise<void>
  /** Stop the current utterance immediately */
  stop(): void
  /** Pause (Web Speech only; no-op for AI providers) */
  pause(): void
  /** Resume (Web Speech only; no-op for AI providers) */
  resume(): void
  /** Reload the voice list */
  loadVoices(): Promise<void>
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {},
): UseSpeechSynthesisReturn {
  // I-4.1: fall back to web provider when used outside app.use()
  let provider = options.provider ?? inject(SPEECH_PROVIDER_KEY, null)
  if (!provider) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[vue-text-to-speech] useSpeechSynthesis() was called without a provider. ' +
          'Use app.use(VueSpeech, config) to configure a provider, or pass one via options.provider. ' +
          'Falling back to WebSpeechTTSProvider.',
      )
    }
    provider = createWebSpeechProvider()
  }

  const _provider: TTSProvider = provider

  // ── Reactive state ──────────────────────────────────────────────────────────
  const isSupported = shallowRef(_provider.isSupported)
  const isSpeaking = shallowRef(false)
  const isPaused = shallowRef(false)
  const voices = shallowRef<VoiceInfo[]>([])
  const isLoadingVoices = shallowRef(false)
  const selectedVoice = ref<VoiceInfo | undefined>(undefined)
  const rate = ref(options.rate ?? 1)
  const pitch = ref(options.pitch ?? 1)
  const volume = ref(options.volume ?? 1)
  const error = shallowRef<SpeechError | null>(null)

  // ── Wire provider lifecycle hooks ────────────────────────────────────────────
  _provider.onStart(() => {
    isSpeaking.value = true
    isPaused.value = false
  })

  _provider.onEnd(() => {
    isSpeaking.value = false
    isPaused.value = false
  })

  _provider.onError((err) => {
    error.value = err
    isSpeaking.value = false
    isPaused.value = false
  })

  // ── Load voices eagerly ──────────────────────────────────────────────────────
  async function loadVoices(): Promise<void> {
    isLoadingVoices.value = true
    try {
      voices.value = await _provider.getVoices()
      if (voices.value.length > 0 && !selectedVoice.value) {
        selectedVoice.value = voices.value.find((v) => v.default) ?? voices.value[0]
      }
    } catch (e) {
      error.value = {
        code: 'UNKNOWN',
        message: 'Failed to load voices',
        cause: e,
      }
    } finally {
      isLoadingVoices.value = false
    }
  }

  loadVoices()

  // ── Public API ───────────────────────────────────────────────────────────────
  async function speak(text: string, overrides: Partial<SpeakOptions> = {}): Promise<void> {
    error.value = null
    await _provider.speak({
      text,
      voice: overrides.voice ?? selectedVoice.value,
      // I-4.4: rate/pitch/volume from Refs apply at the point speak() is called
      rate: overrides.rate ?? rate.value,
      pitch: overrides.pitch ?? pitch.value,
      volume: overrides.volume ?? volume.value,
    })
  }

  function stop(): void {
    _provider.stop()
    isSpeaking.value = false
    isPaused.value = false
  }

  function pause(): void {
    _provider.pause()
    isPaused.value = true
  }

  function resume(): void {
    _provider.resume()
    isPaused.value = false
  }

  // ── Cleanup on component unmount (4.3) ──────────────────────────────────────
  onUnmounted(() => {
    _provider.stop()
  })

  return {
    isSupported: readonly(isSupported),
    isSpeaking: readonly(isSpeaking),
    isPaused: readonly(isPaused),
    voices: readonly(voices),
    isLoadingVoices: readonly(isLoadingVoices),
    selectedVoice,
    rate,
    pitch,
    volume,
    error: readonly(error),
    speak,
    stop,
    pause,
    resume,
    loadVoices,
  }
}
