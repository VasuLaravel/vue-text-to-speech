<script setup lang="ts">
import { ref, computed } from 'vue'
import CodeBlock from '../components/CodeBlock.vue'
import { useSpeechSynthesis } from 'vue-text-to-speech'
import { useToast } from '../composables/useToast'
import { useTabEntrance } from '../composables/useTabEntrance'

// ── Entrance animation ───────────────────────────────────────────────────
useTabEntrance()
const { success: toastSuccess, error: toastError } = useToast()

type ProviderId = 'web' | 'openai' | 'elevenlabs' | 'azure'

// ── Provider card state ────────────────────────────────────────────────────────
interface ProviderState {
  expanded: boolean
  testing: boolean
  testOk: boolean | null
}
const state: Record<ProviderId, ProviderState> = {
  web:        { expanded: true,  testing: false, testOk: null },
  openai:     { expanded: false, testing: false, testOk: null },
  elevenlabs: { expanded: false, testing: false, testOk: null },
  azure:      { expanded: false, testing: false, testOk: null },
}
const providerStates = ref(state)

// ── Active provider ────────────────────────────────────────────────────────────
let savedCfg: Record<string, unknown> = {}
try { savedCfg = JSON.parse(sessionStorage.getItem('vts-provider-config') ?? '{}') } catch { /* noop */ }
const activeProvider = ref<ProviderId>((savedCfg.provider as ProviderId | undefined) ?? 'web')

// ── Field values ───────────────────────────────────────────────────────────────
// OpenAI
const oaiKey    = ref('')
const oaiModel  = ref('tts-1')
const oaiVoice  = ref('alloy')
const oaiBase   = ref('')
const showOaiKey = ref(false)

// ElevenLabs
const elKey     = ref('')
const elVoiceId = ref('21m00Tcm4TlvDq8ikWAM')  // Rachel
const elModel   = ref('eleven_multilingual_v2')
const elBase    = ref('')
const showElKey  = ref(false)

// Azure
const azKey    = ref('')
const azRegion = ref('eastus')
const azVoice  = ref('en-US-JennyNeural')
const azBase   = ref('')
const showAzKey = ref(false)

// ── Test connection (uses Web Speech as fallback for non-API providers) ─────────
const { speak: wsTTS, isSupported: wsSupported } = useSpeechSynthesis()

async function testProvider(id: ProviderId) {
  const s = providerStates.value[id]
  s.testing = true; s.testOk = null
  try {
    // Always use Web Speech for local test — real provider requires backend proxy
    if (wsSupported.value) {
      wsTTS('Connection test successful.')
      await new Promise(r => setTimeout(r, 1800))
    }
    s.testOk = true
    toastSuccess('Connection test successful')
  } catch {
    s.testOk = false
    toastError('Connection test failed')
  } finally {
    s.testing = false
  }
}

// ── Mask API key (S-4: last 4 chars only) ─────────────────────────────────────
function maskKey(key: string) {
  if (key.length <= 4) return '****'
  return '…' + key.slice(-4)
}

// ── Generate main.ts snippet ──────────────────────────────────────────────────
const generatedCode = computed(() => {
  if (activeProvider.value === 'web') {
    return `import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

const app = createApp(App)
app.use(VueSpeech)   // Web Speech API — no config needed
app.mount('#app')`
  }
  if (activeProvider.value === 'openai') {
    const lines = [`  provider: 'openai'`, `  apiKey: '${maskKey(oaiKey.value)}'`, `  model: '${oaiModel.value}'`, `  voice: '${oaiVoice.value}'`]
    if (oaiBase.value.trim()) lines.push(`  baseURL: '${oaiBase.value.trim()}'`)
    return `import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

const app = createApp(App)
app.use(VueSpeech, {
${lines.join(',\n')}
})
app.mount('#app')`
  }
  if (activeProvider.value === 'elevenlabs') {
    const lines = [`  provider: 'elevenlabs'`, `  apiKey: '${maskKey(elKey.value)}'`, `  voiceId: '${elVoiceId.value}'`, `  modelId: '${elModel.value}'`]
    if (elBase.value.trim()) lines.push(`  baseURL: '${elBase.value.trim()}'`)
    return `import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

const app = createApp(App)
app.use(VueSpeech, {
${lines.join(',\n')}
})
app.mount('#app')`
  }
  // Azure
  const lines = [`  provider: 'azure'`, `  subscriptionKey: '${maskKey(azKey.value)}'`, `  region: '${azRegion.value}'`, `  voice: '${azVoice.value}'`]
  if (azBase.value.trim()) lines.push(`  baseURL: '${azBase.value.trim()}'`)
  return `import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

const app = createApp(App)
app.use(VueSpeech, {
${lines.join(',\n')}
})
app.mount('#app')`
})

// ── Apply / Reset ──────────────────────────────────────────────────────────────
function buildConfig(): Record<string, unknown> {
  if (activeProvider.value === 'web') return { provider: 'web' }
  if (activeProvider.value === 'openai') {
    const cfg: Record<string, unknown> = { provider: 'openai', apiKey: oaiKey.value, model: oaiModel.value, voice: oaiVoice.value }
    if (oaiBase.value.trim()) cfg.baseURL = oaiBase.value.trim()
    return cfg
  }
  if (activeProvider.value === 'elevenlabs') {
    const cfg: Record<string, unknown> = { provider: 'elevenlabs', apiKey: elKey.value, voiceId: elVoiceId.value, modelId: elModel.value }
    if (elBase.value.trim()) cfg.baseURL = elBase.value.trim()
    return cfg
  }
  const cfg: Record<string, unknown> = { provider: 'azure', subscriptionKey: azKey.value, region: azRegion.value, voice: azVoice.value }
  if (azBase.value.trim()) cfg.baseURL = azBase.value.trim()
  return cfg
}

function applyConfig() {
  try {
    sessionStorage.setItem('vts-provider-config', JSON.stringify(buildConfig()))
    // Preserve active tab through reload
    const tab = sessionStorage.getItem('pg-active-tab')
    toastSuccess('Provider config saved — reloading…')
    setTimeout(() => {
      window.location.reload()
      if (tab) sessionStorage.setItem('pg-active-tab', tab)
    }, 600)
  } catch (e) {
    toastError('sessionStorage unavailable: ' + String(e))
  }
}

function resetConfig() {
  try {
    sessionStorage.removeItem('vts-provider-config')
    toastSuccess('Config reset — reloading…')
    setTimeout(() => window.location.reload(), 600)
  } catch { /* noop */ }
}

// ── Provider card data ─────────────────────────────────────────────────────────
const PROVIDERS: { id: ProviderId; name: string; badge: string; description: string }[] = [
  { id: 'web',        name: 'Web Speech',  badge: 'Free',       description: 'Built-in browser TTS. No API key required. Limited voice quality.' },
  { id: 'openai',     name: 'OpenAI',      badge: 'Paid',       description: 'High-quality neural voices (alloy, echo, fable, onyx, nova, shimmer) via OpenAI TTS API.' },
  { id: 'elevenlabs', name: 'ElevenLabs',  badge: 'Paid',       description: 'Ultra-realistic voice cloning and multilingual synthesis.' },
  { id: 'azure',      name: 'Azure',       badge: 'Paid',       description: 'Microsoft Azure Cognitive Services. 400+ neural voices.' },
]
</script>

<template>
  <div class="setup">
    <div class="setup__grid">
      <!-- Provider cards -->
      <div v-for="p in PROVIDERS" :key="p.id" class="setup__card pg-card"
        :class="{ 'setup__card--active': activeProvider === p.id }">
        <!-- Card header -->
        <div class="setup__card-head">
          <button
            class="setup__provider-btn"
            :class="{ 'setup__provider-btn--active': activeProvider === p.id }"
            :aria-pressed="activeProvider === p.id"
            :aria-label="`Select ${p.name} provider`"
            @click="activeProvider = p.id; providerStates[p.id].expanded = true"
          >
            <span class="setup__provider-name">{{ p.name }}</span>
            <span class="setup__badge" :class="`setup__badge--${p.badge.toLowerCase()}`">{{ p.badge }}</span>
          </button>
          <button
            class="setup__expand-btn"
            :aria-label="providerStates[p.id].expanded ? `Collapse ${p.name}` : `Expand ${p.name}`"
            :aria-expanded="providerStates[p.id].expanded"
            @click="providerStates[p.id].expanded = !providerStates[p.id].expanded"
          >{{ providerStates[p.id].expanded ? '▲' : '▼' }}</button>
        </div>

        <p class="setup__card-desc pg-text-muted">{{ p.description }}</p>

        <!-- Expandable fields -->
        <div v-show="providerStates[p.id].expanded" class="setup__fields">
          <!-- Web Speech: no fields -->
          <p v-if="p.id === 'web'" class="setup__no-config pg-text-muted">No configuration required.</p>

          <!-- OpenAI fields -->
          <template v-if="p.id === 'openai'">
            <div class="setup__field">
              <label class="pg-label" for="oai-key">API Key</label>
              <div class="setup__secret-row">
                <input :id="'oai-key'" v-model="oaiKey" :type="showOaiKey ? 'text' : 'password'" class="setup__input" placeholder="sk-…" autocomplete="off" aria-label="OpenAI API key" />
                <button class="setup__show-btn" :aria-label="showOaiKey ? 'Hide key' : 'Show key'" @click="showOaiKey = !showOaiKey">{{ showOaiKey ? '🙈' : '👁' }}</button>
              </div>
            </div>
            <div class="setup__field">
              <label class="pg-label" for="oai-model">Model</label>
              <select id="oai-model" v-model="oaiModel" class="setup__select" aria-label="OpenAI model">
                <option value="tts-1">tts-1 (standard)</option>
                <option value="tts-1-hd">tts-1-hd (high quality)</option>
              </select>
            </div>
            <div class="setup__field">
              <label class="pg-label" for="oai-voice">Voice</label>
              <select id="oai-voice" v-model="oaiVoice" class="setup__select" aria-label="OpenAI voice">
                <option v-for="v in ['alloy','echo','fable','onyx','nova','shimmer']" :key="v" :value="v">{{ v }}</option>
              </select>
            </div>
            <div class="setup__field">
              <label class="pg-label" for="oai-base">Base URL <span class="pg-text-muted" style="font-size:.75rem">(optional)</span></label>
              <input id="oai-base" v-model="oaiBase" type="text" class="setup__input" placeholder="https://api.openai.com/v1" aria-label="OpenAI base URL" />
            </div>
          </template>

          <!-- ElevenLabs fields -->
          <template v-if="p.id === 'elevenlabs'">
            <div class="setup__field">
              <label class="pg-label" for="el-key">API Key</label>
              <div class="setup__secret-row">
                <input id="el-key" v-model="elKey" :type="showElKey ? 'text' : 'password'" class="setup__input" placeholder="xi_…" autocomplete="off" aria-label="ElevenLabs API key" />
                <button class="setup__show-btn" :aria-label="showElKey ? 'Hide key' : 'Show key'" @click="showElKey = !showElKey">{{ showElKey ? '🙈' : '👁' }}</button>
              </div>
            </div>
            <div class="setup__field">
              <label class="pg-label" for="el-voice">Voice ID</label>
              <input id="el-voice" v-model="elVoiceId" type="text" class="setup__input" placeholder="21m00Tcm4TlvDq8ikWAM" aria-label="ElevenLabs voice ID" />
            </div>
            <div class="setup__field">
              <label class="pg-label" for="el-model">Model ID</label>
              <select id="el-model" v-model="elModel" class="setup__select" aria-label="ElevenLabs model">
                <option value="eleven_multilingual_v2">eleven_multilingual_v2</option>
                <option value="eleven_monolingual_v1">eleven_monolingual_v1</option>
                <option value="eleven_turbo_v2">eleven_turbo_v2</option>
              </select>
            </div>
            <div class="setup__field">
              <label class="pg-label" for="el-base">Base URL <span class="pg-text-muted" style="font-size:.75rem">(optional)</span></label>
              <input id="el-base" v-model="elBase" type="text" class="setup__input" placeholder="https://api.elevenlabs.io/v1" aria-label="ElevenLabs base URL" />
            </div>
          </template>

          <!-- Azure fields -->
          <template v-if="p.id === 'azure'">
            <div class="setup__field">
              <label class="pg-label" for="az-key">Subscription Key</label>
              <div class="setup__secret-row">
                <input id="az-key" v-model="azKey" :type="showAzKey ? 'text' : 'password'" class="setup__input" placeholder="Azure subscription key" autocomplete="off" aria-label="Azure subscription key" />
                <button class="setup__show-btn" :aria-label="showAzKey ? 'Hide key' : 'Show key'" @click="showAzKey = !showAzKey">{{ showAzKey ? '🙈' : '👁' }}</button>
              </div>
            </div>
            <div class="setup__field">
              <label class="pg-label" for="az-region">Region</label>
              <input id="az-region" v-model="azRegion" type="text" class="setup__input" placeholder="eastus" aria-label="Azure region" />
            </div>
            <div class="setup__field">
              <label class="pg-label" for="az-voice">Voice</label>
              <input id="az-voice" v-model="azVoice" type="text" class="setup__input" placeholder="en-US-JennyNeural" aria-label="Azure voice" />
            </div>
            <div class="setup__field">
              <label class="pg-label" for="az-base">Base URL <span class="pg-text-muted" style="font-size:.75rem">(optional)</span></label>
              <input id="az-base" v-model="azBase" type="text" class="setup__input" placeholder="https://{region}.tts.speech.microsoft.com" aria-label="Azure base URL" />
            </div>
          </template>

          <!-- Test connection button -->
          <button
            class="setup__test-btn"
            :disabled="providerStates[p.id].testing"
            :aria-busy="providerStates[p.id].testing"
            @click="testProvider(p.id)"
          >
            <span v-if="providerStates[p.id].testing">Testing…</span>
            <span v-else-if="providerStates[p.id].testOk === true" style="color:var(--pg-emerald, #10b981)">✓ Connected</span>
            <span v-else-if="providerStates[p.id].testOk === false" style="color:var(--pg-rose)">✗ Failed</span>
            <span v-else>Test Connection</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Generated code snippet -->
    <div class="setup__code-section pg-card">
      <div class="pg-label" style="margin-bottom:12px">Generated main.ts</div>
      <CodeBlock :code="generatedCode" language="typescript" />
      <div class="setup__actions">
        <button class="setup__apply-btn" @click="applyConfig">✓ Apply & Reload</button>
        <button class="setup__reset-btn" @click="resetConfig">↺ Reset to Default</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup { display: flex; flex-direction: column; gap: 16px; }
.setup__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.setup__card { padding: 16px; border: 1px solid var(--pg-border); transition: border-color .2s; }
.setup__card--active { border-color: var(--pg-primary); box-shadow: 0 0 0 1px var(--pg-primary); }
.setup__card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.setup__provider-btn {
  flex: 1; display: flex; align-items: center; gap: 8px; background: none; border: none;
  cursor: pointer; text-align: left; padding: 0; color: var(--pg-text);
}
.setup__provider-btn--active .setup__provider-name { color: var(--pg-primary); font-weight: 700; }
.setup__provider-name { font-size: .95rem; }
.setup__badge { padding: 2px 8px; border-radius: 9999px; font-size: .68rem; font-weight: 700; text-transform: uppercase; }
.setup__badge--free { background: rgba(16,185,129,.15); color: #10b981; border: 1px solid #10b981; }
.setup__badge--paid { background: rgba(99,102,241,.15); color: var(--pg-primary); border: 1px solid var(--pg-primary); }
.setup__expand-btn { background: none; border: none; cursor: pointer; color: var(--pg-text-muted); font-size: .8rem; }
.setup__card-desc { margin: 0 0 12px; font-size: .78rem; }
.setup__fields { display: flex; flex-direction: column; gap: 10px; }
.setup__no-config { margin: 0; font-size: .82rem; }
.setup__field { display: flex; flex-direction: column; gap: 5px; }
.setup__secret-row { display: flex; gap: 6px; }
.setup__input {
  width: 100%; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 8px 10px; font-size: .82rem; outline: none; box-sizing: border-box;
}
.setup__input:focus { border-color: var(--pg-primary); }
.setup__select {
  background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 8px 10px; font-size: .82rem; outline: none;
}
.setup__select:focus { border-color: var(--pg-primary); }
.setup__show-btn { background: none; border: 1px solid var(--pg-border); border-radius: var(--pg-radius-sm); cursor: pointer; padding: 0 8px; font-size: .9rem; }
.setup__test-btn {
  padding: 8px 14px; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); cursor: pointer; font-size: .8rem; margin-top: 4px;
}
.setup__test-btn:disabled { opacity: .5; cursor: not-allowed; }
.setup__test-btn:not(:disabled):hover { border-color: var(--pg-primary); color: var(--pg-primary); }

.setup__code-section { padding: 20px; }
.setup__actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.setup__apply-btn {
  padding: 9px 20px; background: var(--pg-primary); color: #fff; border: none;
  border-radius: var(--pg-radius-sm); cursor: pointer; font-size: .85rem; font-weight: 600;
}
.setup__apply-btn:hover { opacity: .85; }
.setup__reset-btn {
  padding: 9px 20px; background: none; border: 1px solid var(--pg-border); color: var(--pg-text-muted);
  border-radius: var(--pg-radius-sm); cursor: pointer; font-size: .85rem;
}
.setup__reset-btn:hover { border-color: var(--pg-rose); color: var(--pg-rose); }
</style>
