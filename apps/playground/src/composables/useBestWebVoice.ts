import { inject, watch } from 'vue'
import { useSpeechSynthesis, SPEECH_PROVIDER_KEY } from 'vue-text-to-speech'
import type { VoiceInfo, TTSProvider, SpeakOptions } from 'vue-text-to-speech'

/**
 * Wraps useSpeechSynthesis and auto-selects the most natural-sounding voice
 * available in the current browser, preferring online/neural voices over
 * local SAPI voices (which sound robotic, especially on Windows).
 *
 * Priority order:
 *  1. Known online neural voices by name (Google US English, Microsoft Aria Online…)
 *  2. Any online (localService=false) en-US voice
 *  3. Any online English voice
 *  4. Any en-US voice (offline fallback)
 *  5. Any English voice
 *  6. First available voice
 *
 * NOTE: VoiceInfo strips localService, so we cross-reference
 * window.speechSynthesis.getVoices() directly using id === voiceURI.
 */
export function useBestWebVoice() {
  const synthesis = useSpeechSynthesis()

  watch(
    synthesis.voices,
    (voices) => {
      if (!voices.length) return
      const best = pickBestVoice(voices)
      if (best) synthesis.selectedVoice.value = best
    },
    { immediate: true },
  )

  return synthesis
}

// ── Well-known online neural voice names (Chrome/Edge on Windows & macOS) ──────
const PREFERRED_NAMES = [
  'Google US English',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Google UK English Female',
  'Samantha',  // macOS/Safari built-in neural voice
]

function pickBestVoice(voices: readonly VoiceInfo[]): VoiceInfo | undefined {
  // Build a voiceURI → localService map from the raw browser API
  const nativeMap = new Map<string, boolean>()
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    for (const v of window.speechSynthesis.getVoices()) {
      nativeMap.set(v.voiceURI, v.localService)
    }
  }

  const isOnline = (v: VoiceInfo): boolean => {
    if (!nativeMap.has(v.id)) return false
    return !nativeMap.get(v.id)
  }

  // 1. Exact match on preferred neural voice names
  for (const name of PREFERRED_NAMES) {
    const found = voices.find(v => v.name === name && isOnline(v))
    if (found) return found
  }

  // 2. Any online en-US voice
  const onlineEnUS = voices.find(v => isOnline(v) && v.lang.startsWith('en-US'))
  if (onlineEnUS) return onlineEnUS

  // 3. Any online English voice
  const onlineEn = voices.find(v => isOnline(v) && v.lang.startsWith('en'))
  if (onlineEn) return onlineEn

  // 4. Any en-US voice (offline fallback, still better than a random foreign voice)
  const enUS = voices.find(v => v.lang.startsWith('en-US'))
  if (enUS) return enUS

  // 5. Any English voice
  const en = voices.find(v => v.lang.startsWith('en'))
  if (en) return en

  // 6. First available
  return voices[0]
}

/**
 * Returns a proxy around the injected TTSProvider that automatically injects
 * the best Web Speech voice into every speak() call that doesn't already
 * specify one.
 *
 * Pass the result to useVoiceQueue({ provider }) or useStreamingTTS({ provider })
 * so those composables (which never set a voice themselves) also benefit from
 * the best-voice selection without any changes to the library package.
 *
 * Returns undefined if no provider is injected (rare), letting the composables
 * fall back to their own default behaviour.
 */
export function useVoiceInjectedProvider(): TTSProvider | undefined {
  const raw = inject<TTSProvider | null>(SPEECH_PROVIDER_KEY, null)
  if (!raw) return undefined

  const { selectedVoice } = useBestWebVoice()

  return new Proxy(raw, {
    get(target, prop: string | symbol, receiver) {
      if (prop === 'speak') {
        return (options: SpeakOptions) =>
          target.speak({ ...options, voice: options.voice ?? selectedVoice.value })
      }
      const val = Reflect.get(target, prop, receiver)
      return typeof val === 'function' ? (val as Function).bind(target) : val
    },
  })
}
