import type { InjectionKey } from 'vue'
import type { TTSProvider } from './providers/types.js'

/**
 * Vue injection key used by `app.provide()` (via the VueSpeech plugin)
 * and `inject()` (inside composables) to pass the active TTSProvider
 * down the component tree without prop-drilling.
 */
export const SPEECH_PROVIDER_KEY: InjectionKey<TTSProvider> = Symbol('VueSpeechProvider')
