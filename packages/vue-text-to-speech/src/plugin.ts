import type { App, Plugin } from 'vue'
import { WebSpeechTTSProvider } from './providers/WebSpeechTTSProvider.js'
import { createVueSpeech } from './factory.js'
import { SPEECH_PROVIDER_KEY } from './injectionKeys.js'
import type { ProviderConfig } from './providers/types.js'
import VueSpeechPlayer from './components/VueSpeechPlayer.vue'
import VueSpeechRecorder from './components/VueSpeechRecorder.vue'
import VueSpeechVoiceSelect from './components/VueSpeechVoiceSelect.vue'

export type VueSpeechOptions = ProviderConfig & {
  /**
   * When `true`, registers `VueSpeechPlayer`, `VueSpeechRecorder`, and
   * `VueSpeechVoiceSelect` as global components.
   *
   * Default: `false` — import components individually for tree-shaking (I-7.3).
   */
  components?: boolean
}

/**
 * Vue 3 plugin. Provides a `TTSProvider` to all descendant components via
 * `SPEECH_PROVIDER_KEY`, allowing `useSpeechSynthesis()` to receive the
 * configured provider through Vue's injection system.
 *
 * @example
 * ```ts
 * // main.ts
 * import { createApp } from 'vue'
 * import { VueSpeech } from 'vue-text-to-speech'
 *
 * createApp(App)
 *   .use(VueSpeech, { provider: 'web' })
 *   .mount('#app')
 * ```
 */
export const VueSpeech: Plugin<VueSpeechOptions> = {
  install(app: App, options: VueSpeechOptions = { provider: 'web' }) {
    if (options.provider === 'web') {
      // Synchronous path — WebSpeechTTSProvider is ready before first render
      app.provide(SPEECH_PROVIDER_KEY, new WebSpeechTTSProvider())
    } else {
      // Async path — AI providers require dynamic imports
      // The provider is available before any component renders in practice because
      // app.mount() is called after app.use() in userland (separate microtask)
      createVueSpeech(options as ProviderConfig)
        .then((provider) => {
          app.provide(SPEECH_PROVIDER_KEY, provider)
        })
        .catch((err: unknown) => {
          console.error('[vue-text-to-speech] Failed to initialize provider:', err)
        })
    }

    // Optionally register UI components globally (opt-in for rapid prototyping; I-7.3)
    if (options.components === true) {
      app.component('VueSpeechPlayer', VueSpeechPlayer)
      app.component('VueSpeechRecorder', VueSpeechRecorder)
      app.component('VueSpeechVoiceSelect', VueSpeechVoiceSelect)
    }
  },
}
