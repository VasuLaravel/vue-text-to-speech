import { createApp } from 'vue'
import { Quasar } from 'quasar'
import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'
import { VueSpeech } from 'vue-text-to-speech'
import type { ProviderConfig } from 'vue-text-to-speech'
import App from './App.vue'

function getProviderConfig(): ProviderConfig {
  try {
    const stored = localStorage.getItem('vts-provider-config')
    if (stored) return JSON.parse(stored) as ProviderConfig
  } catch { /* ignore */ }
  return { provider: 'web' }
}

createApp(App)
  .use(Quasar, { plugins: {} })
  .use(VueSpeech, getProviderConfig())
  .mount('#app')
