import { createApp } from 'vue'
import { Quasar, Notify } from 'quasar'
// theme.css must be imported before Quasar so --pg-* vars take precedence
import './styles/theme.css'
import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'
import { inject as injectAnalytics } from '@vercel/analytics'
import { VueSpeech } from 'vue-text-to-speech'
import type { ProviderConfig } from 'vue-text-to-speech'
import App from './App.vue'

injectAnalytics()

function getProviderConfig(): ProviderConfig {
  try {
    const stored = sessionStorage.getItem('vts-provider-config')
    if (stored) return JSON.parse(stored) as ProviderConfig
  } catch { /* ignore */ }
  return { provider: 'web' }
}

createApp(App)
  .use(Quasar, { plugins: { Notify } })
  .use(VueSpeech, getProviderConfig())
  .mount('#app')
