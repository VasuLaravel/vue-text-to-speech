import { ref, shallowRef, readonly, onUnmounted } from 'vue'
import { WebSpeechSTTProvider } from '../providers/WebSpeechSTTProvider.js'
import type { WebSpeechSTTOptions } from '../providers/WebSpeechSTTProvider.js'
import type { SpeechError } from '../providers/types.js'

// ─── Options & Return type ────────────────────────────────────────────────────

export interface UseSpeechRecognitionOptions extends WebSpeechSTTOptions {}

export interface UseSpeechRecognitionReturn {
  /** Whether SpeechRecognition is available in this environment */
  readonly isSupported: ReturnType<typeof readonly<ReturnType<typeof shallowRef<boolean>>>>
  /** Whether recognition is currently active */
  readonly isListening: ReturnType<typeof readonly<ReturnType<typeof shallowRef<boolean>>>>
  /** Live interim transcript (updates continuously while listening) */
  readonly transcript: ReturnType<typeof readonly<ReturnType<typeof ref<string>>>>
  /** Most recent committed final transcript */
  readonly finalTranscript: ReturnType<typeof readonly<ReturnType<typeof ref<string>>>>
  /** Confidence score of the last final result (0–1) */
  readonly confidence: ReturnType<typeof readonly<ReturnType<typeof shallowRef<number>>>>
  /** Active language code (BCP-47) */
  readonly lang: string
  /** Whether continuous recognition is enabled */
  readonly continuous: boolean
  /** Most recent error */
  readonly error: ReturnType<typeof readonly<ReturnType<typeof shallowRef<SpeechError | null>>>>
  /** Start listening */
  start(): void
  /** Stop listening */
  stop(): void
  /** Clear the transcript state */
  resetTranscript(): void
}

// ─── Composable ───────────────────────────────────────────────────────────────

/**
 * Wraps the Web Speech Recognition API.
 *
 * I-4.3: This composable always creates its own `WebSpeechSTTProvider`.
 * It intentionally does NOT use the injected TTS provider from SPEECH_PROVIDER_KEY.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  // Always create a fresh STT provider — never reuses the TTS injection (I-4.3)
  const provider = new WebSpeechSTTProvider(options)

  // ── Reactive state ──────────────────────────────────────────────────────────
  const isSupported = shallowRef(provider.isSupported)
  const isListening = shallowRef(false)
  const transcript = ref('')
  const finalTranscript = ref('')
  const confidence = shallowRef(0)
  const error = shallowRef<SpeechError | null>(null)

  // ── Wire provider callbacks ──────────────────────────────────────────────────
  provider.onTranscript((t, c) => {
    transcript.value = t
    confidence.value = c
  })

  provider.onFinalTranscript((t, c) => {
    finalTranscript.value = t
    transcript.value = ''   // clear interim — prevents duplicate display
    confidence.value = c
  })

  provider.onError((err) => {
    error.value = err
    isListening.value = false
  })

  // When recognition ends unexpectedly (not via stop()), auto-restart if the
  // user is still supposed to be listening. This prevents silent gaps caused
  // by browser-side timeouts or network hiccups during a continuous session.
  provider.onEnd(() => {
    if (isListening.value) {
      provider.start()
    }
  })

  // ── Public API ───────────────────────────────────────────────────────────────
  function start(): void {
    error.value = null
    transcript.value = ''
    isListening.value = true
    provider.start()
  }

  function stop(): void {
    isListening.value = false  // set before provider.stop() so onEnd guard sees false
    provider.stop()
  }

  function resetTranscript(): void {
    transcript.value = ''
    finalTranscript.value = ''
    confidence.value = 0
  }

  // ── Cleanup on component unmount (4.5) ──────────────────────────────────────
  onUnmounted(() => {
    isListening.value = false  // prevent auto-restart before provider.stop()
    provider.stop()
  })

  return {
    isSupported: readonly(isSupported),
    isListening: readonly(isListening),
    transcript: readonly(transcript),
    finalTranscript: readonly(finalTranscript),
    confidence: readonly(confidence),
    lang: options.lang ?? '',
    continuous: options.continuous ?? false,
    error: readonly(error),
    start,
    stop,
    resetTranscript,
  }
}
