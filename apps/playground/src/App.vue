<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useSpeechSynthesis,
  useSpeechRecognition,
  VueSpeechPlayer,
  VueSpeechRecorder,
} from 'vue-text-to-speech'
import StreamingDemo from './StreamingDemo.vue'

// ── Provider Configuration ────────────────────────────────────────────────────
const providerTab = ref('web')
const openaiKey = ref('')
const openaiModel = ref<'tts-1' | 'tts-1-hd'>('tts-1')
const openaiVoice = ref('alloy')
const elevenKey = ref('')
const elevenVoiceId = ref('21m00Tcm4TlvDq8ikWAM')
const elevenModelId = ref('eleven_monolingual_v1')
const azureKey = ref('')
const azureRegion = ref('eastus')
const azureVoice = ref('en-US-JennyNeural')

// Restore saved config from localStorage
try {
  const saved = localStorage.getItem('vts-provider-config')
  if (saved) {
    const p = JSON.parse(saved) as Record<string, string>
    providerTab.value = p.provider ?? 'web'
    if (p.provider === 'openai') {
      openaiKey.value = p.apiKey ?? ''
      openaiModel.value = (p.model as 'tts-1' | 'tts-1-hd') ?? 'tts-1'
      openaiVoice.value = p.voice ?? 'alloy'
    } else if (p.provider === 'elevenlabs') {
      elevenKey.value = p.apiKey ?? ''
      elevenVoiceId.value = p.voiceId ?? '21m00Tcm4TlvDq8ikWAM'
      elevenModelId.value = p.modelId ?? 'eleven_monolingual_v1'
    } else if (p.provider === 'azure') {
      azureKey.value = p.subscriptionKey ?? ''
      azureRegion.value = p.region ?? 'eastus'
      azureVoice.value = p.voice ?? 'en-US-JennyNeural'
    }
  }
} catch { /* ignore */ }

const activeProviderLabel = computed(() => ({
  web: 'Web Speech API',
  openai: 'OpenAI TTS',
  elevenlabs: 'ElevenLabs',
  azure: 'Azure Cognitive',
} as Record<string, string>)[providerTab.value] ?? 'Web Speech API')

function buildProviderConfig() {
  if (providerTab.value === 'openai')
    return { provider: 'openai', apiKey: openaiKey.value, model: openaiModel.value, voice: openaiVoice.value }
  if (providerTab.value === 'elevenlabs')
    return { provider: 'elevenlabs', apiKey: elevenKey.value, voiceId: elevenVoiceId.value, modelId: elevenModelId.value }
  if (providerTab.value === 'azure')
    return { provider: 'azure', subscriptionKey: azureKey.value, region: azureRegion.value, voice: azureVoice.value }
  return { provider: 'web' }
}

const codeSnippet = computed(() => {
  const cfg = buildProviderConfig()
  const inner = JSON.stringify(cfg, null, 2).replace(/"([a-zA-Z_]+)":/g, '$1:')
  return `createApp(App)\n  .use(VueSpeech, ${inner})\n  .mount('#app')`
})

function applyProvider() {
  try { localStorage.setItem('vts-provider-config', JSON.stringify(buildProviderConfig())) } catch { /* ignore */ }
  window.location.reload()
}

function resetProvider() {
  try { localStorage.removeItem('vts-provider-config') } catch { /* ignore */ }
  providerTab.value = 'web'
  window.location.reload()
}

// ── useSpeechSynthesis ────────────────────────────────────────────────────────
const {
  isSpeaking, isPaused, voices, isLoadingVoices,
  selectedVoice, rate, pitch, volume, error: ttsError,
  speak, stop, pause, resume,
} = useSpeechSynthesis()

const sampleText = `Hello! This is a sample text for the VueSpeechPlayer component.`
const ttsText = ref(sampleText);

// Flat option list with language shown as caption (Quasar QSelect)
const voiceOptions = computed(() =>
  voices.value.map(v => ({
    label: v.label + (v.default ? ' âœ“' : ''),
    value: v,
    caption: v.lang,
  }))
)

// useSpeechRecognition 
const {
  isSupported: sttSupported,
  isListening,
  transcript,
  finalTranscript,
  confidence,
  error: sttError,
  start: startListening,
  stop: stopListening,
  resetTranscript,
} = useSpeechRecognition({ interimResults: true })
</script>

<template>
  <q-layout view="hHh lpR fFf">

    <!-- Header -->
    <q-header class="bg-primary text-white">
      <q-toolbar style="min-height: 56px;">
        <q-icon name="record_voice_over" size="28px" class="q-mr-sm" />
        <q-toolbar-title>
          <div>vue-text-to-speech</div>
          <div class="text-caption">v2.0.0 · Playground · Sprint 7 — Plugin + Integration</div>
        </q-toolbar-title>
        <q-chip
          outline
          color="white"
          text-color="white"
          icon="check_circle"
          size="sm"
          class="gt-xs"
        >
          189 tests passing
        </q-chip>
      </q-toolbar>
    </q-header>

    <!-- Page -->
    <q-page-container>
      <q-page class="bg-grey-1" padding>
        <div style="max-width: 780px; margin: 0 auto;" class="q-gutter-y-md">

          <!-- ── Provider Configuration ─────────────────────────────────────────── -->
          <q-card flat bordered>
            <q-card-section class="q-pb-sm">
              <div class="row items-center q-gutter-x-sm">
                <div class="text-h6 text-dark">Provider Configuration</div>
                <q-chip color="primary" text-color="white" size="sm" icon="settings">
                  {{ activeProviderLabel }}
                </q-chip>
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Select a TTS provider and apply it. The TTS demos below will use the active provider.
                Changes take effect on page reload.
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pb-none">
              <q-tabs v-model="providerTab" dense align="left" narrow-indicator active-color="primary">
                <q-tab name="web" label="Web Speech" icon="record_voice_over" no-caps />
                <q-tab name="openai" label="OpenAI" no-caps />
                <q-tab name="elevenlabs" label="ElevenLabs" no-caps />
                <q-tab name="azure" label="Azure" no-caps />
              </q-tabs>
            </q-card-section>
            <q-separator />

            <q-tab-panels v-model="providerTab" animated keep-alive>
              <!-- Web Speech -->
              <q-tab-panel name="web" class="q-pa-md">
                <q-banner class="bg-green-1 text-positive" rounded dense>
                  <template #avatar><q-icon name="check_circle" color="positive" /></template>
                  No configuration needed. Uses the browser's built-in Web Speech API — works offline,
                  no API key required.
                </q-banner>
              </q-tab-panel>

              <!-- OpenAI -->
              <q-tab-panel name="openai" class="q-pa-md q-gutter-y-sm">
                <q-banner class="bg-amber-1 text-orange-9 q-mb-sm" rounded dense>
                  <template #avatar><q-icon name="lock" color="orange-9" /></template>
                  For production, proxy requests through your server — never expose API keys in the browser.
                </q-banner>
                <q-input v-model="openaiKey" type="password" outlined dense label="API Key" hint="sk-…" />
                <div class="row q-gutter-sm">
                  <q-select v-model="openaiModel" :options="['tts-1', 'tts-1-hd']"
                    outlined dense label="Model" class="col" />
                  <q-select v-model="openaiVoice"
                    :options="['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']"
                    outlined dense label="Voice" class="col" />
                </div>
              </q-tab-panel>

              <!-- ElevenLabs -->
              <q-tab-panel name="elevenlabs" class="q-pa-md q-gutter-y-sm">
                <q-banner class="bg-amber-1 text-orange-9 q-mb-sm" rounded dense>
                  <template #avatar><q-icon name="lock" color="orange-9" /></template>
                  For production, proxy requests through your server — never expose API keys in the browser.
                </q-banner>
                <q-input v-model="elevenKey" type="password" outlined dense label="API Key" />
                <div class="row q-gutter-sm">
                  <q-input v-model="elevenVoiceId" outlined dense label="Voice ID"
                    hint="e.g. 21m00Tcm4TlvDq8ikWAM (Rachel)" class="col" />
                  <q-select v-model="elevenModelId"
                    :options="['eleven_monolingual_v1', 'eleven_multilingual_v2', 'eleven_turbo_v2']"
                    outlined dense label="Model" class="col" />
                </div>
              </q-tab-panel>

              <!-- Azure -->
              <q-tab-panel name="azure" class="q-pa-md q-gutter-y-sm">
                <q-banner class="bg-amber-1 text-orange-9 q-mb-sm" rounded dense>
                  <template #avatar><q-icon name="lock" color="orange-9" /></template>
                  For production, proxy requests through your server — never expose API keys in the browser.
                </q-banner>
                <q-input v-model="azureKey" type="password" outlined dense label="Subscription Key" />
                <div class="row q-gutter-sm">
                  <q-input v-model="azureRegion" outlined dense label="Region"
                    hint="e.g. eastus" class="col" />
                  <q-input v-model="azureVoice" outlined dense label="Voice"
                    hint="e.g. en-US-JennyNeural" class="col" />
                </div>
              </q-tab-panel>
            </q-tab-panels>

            <!-- Code snippet preview -->
            <q-card-section class="q-pt-none">
              <div class="text-caption text-grey-6 q-mb-xs">Your main.ts configuration:</div>
              <div class="bg-grey-9 text-green-4 q-pa-sm rounded-borders"
                style="font-family: monospace; font-size: 0.78rem; white-space: pre; overflow-x: auto;">{{ codeSnippet }}</div>
            </q-card-section>

            <q-card-actions class="q-px-md q-pb-md q-pt-none">
              <q-btn color="primary" no-caps rounded icon="refresh" label="Apply & Reload"
                @click="applyProvider" />
              <q-btn flat color="grey-7" no-caps rounded icon="restart_alt" label="Reset to Web Speech"
                :disable="providerTab === 'web'"
                @click="resetProvider" />
            </q-card-actions>
          </q-card>

          <!-- ── useSpeechSynthesis ──────────────────────────────────────────────── -->
          <q-card flat bordered>
            <q-card-section class="q-pb-sm">
              <div class="text-h6 text-dark">useSpeechSynthesis</div>
              <div class="text-caption text-grey-6">
                Direct composable API - voice, rate, pitch, volume
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-gutter-y-sm">
              <!-- Voice selector -->
               <div class="label text-caption text-grey-6">Select Voice</div>
              <q-select
                v-model="selectedVoice"
                :options="voiceOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                :loading="isLoadingVoices"
                :disable="isSpeaking && !isPaused"
                outlined
                dense
                clearable
                class="q-mt-none"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>


              <div class="row q-gutter-md q-mt-md">
                <div class="col">
                    <div class="label text-caption text-grey-6">Custom text (simulated LLM output)</div>
                    <q-input
                        v-model="ttsText"
                        type="textarea"
                        :disable="isSpeaking && !isPaused"
                        outlined
                        :rows="5"
                    />
                </div>
                <div class="col">
                    <div class="label text-caption text-grey-6">Controls</div>
                    <!-- Rate -->
                    <div class="row items-center no-wrap q-gutter-x-md">
                        <div class="text-body2 text-grey-7" style="min-width: 88px">
                        Rate
                        <span class="text-weight-medium text-dark">{{ rate.toFixed(1) }}</span>
                        </div>
                        <q-slider
                        v-model="rate"
                        :min="0.1" :max="4" :step="0.1"
                        color="primary"
                        class="col"
                        :label-value="`${rate.toFixed(1)}Ã—`"
                        />
                    </div>

                    <!-- Pitch -->
                    <div class="row items-center no-wrap q-gutter-x-md q-mt-sm">
                        <div class="text-body2 text-grey-7" style="min-width: 88px">
                        Pitch
                        <span class="text-weight-medium text-dark">{{ pitch.toFixed(1) }}</span>
                        </div>
                        <q-slider
                        v-model="pitch"
                        :min="0" :max="2" :step="0.1"
                        color="primary"
                        class="col"
                        :label-value="pitch.toFixed(1)"
                        />
                    </div>

                    <!-- Volume -->
                    <div class="row items-center no-wrap q-gutter-x-md q-mt-sm">
                        <div class="text-body2 text-grey-7" style="min-width: 88px">
                        Volume
                        <span class="text-weight-medium text-dark">{{ volume.toFixed(2) }}</span>
                        </div>
                        <q-slider
                        v-model="volume"
                        :min="0" :max="1" :step="0.05"
                        color="primary"
                        class="col"
                        :label-value="`${Math.round(volume * 100)}%`"
                        />
                    </div>
                </div>
              </div>
            </q-card-section>

            <q-card-actions class="q-px-md q-pb-md q-pt-md">
              <q-btn
                color="primary"
                :label="isSpeaking && !isPaused ? 'Speakingâ€¦' : 'Speak'"
                icon="play_arrow"
                rounded
                no-caps
                :loading="isSpeaking && !isPaused"
                :disable="isSpeaking && !isPaused"
                @click="speak(ttsText)"
              />
              <q-btn
                flat no-caps color="primary"
                label="Pause"
                icon="pause"
                rounded
                :disable="!isSpeaking || isPaused"
                @click="pause()"
              />
              <q-btn
                flat no-caps color="primary"
                label="Resume"
                rounded
                icon="play_circle"
                :disable="!isPaused"
                @click="resume()"
              />
              <q-btn
                flat no-caps color="negative"
                label="Stop"
                icon="stop"
                rounded
                :disable="!isSpeaking"
                @click="stop()"
              />
            </q-card-actions>

            <q-banner
              v-if="ttsError"
              dense
              rounded
              class="q-mx-md q-mb-md bg-red-1 text-negative"
            >
              <template #avatar><q-icon name="error" color="negative" /></template>
              {{ ttsError.message }}
            </q-banner>
          </q-card>

          <!-- useSpeechRecognition -->
          <q-card flat bordered>
            <q-card-section class="q-pb-sm">
              <div class="text-h6 text-dark">useSpeechRecognition</div>
              <div class="text-caption text-grey-6">
                Microphone input with interim and final transcript
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <q-banner
                v-if="!sttSupported"
                class="bg-warning text-dark"
                rounded dense
              >
                <template #avatar><q-icon name="warning" /></template>
                SpeechRecognition is not supported in this browser.
              </q-banner>

              <template v-else>
                <!-- Controls -->
                <div class="row items-center q-gutter-sm q-mb-md">
                  <q-btn
                    rounded
                    no-caps
                    :color="isListening ? 'negative' : 'primary'"
                    :icon="isListening ? 'stop' : 'mic'"
                    :label="isListening ? 'Stop' : 'Start'"
                    :aria-pressed="String(isListening)"
                    @click="isListening ? stopListening() : startListening()"
                  />
                  <q-btn
                    rounded
                    no-caps
                    flat color="grey-7"
                    label="Reset"
                    icon="restart_alt"
                    :disable="isListening"
                    @click="resetTranscript()"
                  />
                  <q-chip
                    v-if="isListening"
                    color="teal"
                    text-color="white"
                    icon="fiber_manual_record"
                    size="md"
                  >
                    Listening
                  </q-chip>
                </div>

                <!-- Transcript area -->
                <q-card
                  flat bordered
                  class="bg-grey-1"
                  style="min-height: 80px;"
                >
                  <q-card-section class="q-py-sm">
                    <span
                      v-if="finalTranscript"
                      class="text-dark text-weight-medium"
                    >{{ finalTranscript }} </span>
                    <span
                      v-if="transcript"
                      class="text-grey-6 text-italic"
                    >{{ transcript }}</span>
                    <q-badge
                      v-if="confidence && finalTranscript"
                      color="positive"
                      class="q-ml-xs"
                      :label="`${(confidence * 100).toFixed(0)}%`"
                    />
                    <span
                      v-if="!transcript && !finalTranscript"
                      class="text-grey-5 text-italic"
                    >
                      {{ isListening ? 'Listening' : 'Press Start to begin recording.' }}
                    </span>
                  </q-card-section>
                </q-card>

                <q-banner
                  v-if="sttError"
                  dense rounded
                  class="q-mt-sm bg-red-1 text-negative"
                >
                  <template #avatar><q-icon name="error" color="negative" /></template>
                  {{ sttError.message }}
                </q-banner>
              </template>
            </q-card-section>
          </q-card>

          <!-- Streaming -->
          <q-card flat bordered>
            <StreamingDemo />
          </q-card>

          <!-- VueSpeechPlayer component -->
          <q-card flat bordered>
            <q-card-section class="q-pb-sm">
              <div class="text-h6 text-dark">VueSpeechPlayer</div>
              <div class="text-caption text-grey-6">
                Self-contained player — voice select, rate/pitch/volume sliders, play/pause/stop. Themed via CSS custom properties (--vts-primary etc.) — no framework dependency. The q-card wrapper is playground scaffolding only.
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <VueSpeechPlayer
                text="Hello! This is the VueSpeechPlayer component â€” batteries included."
              />
            </q-card-section>
          </q-card>

          <!-- â”€â”€ VueSpeechRecorder component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
          <q-card flat bordered>
            <q-card-section class="q-pb-sm">
              <div class="text-h6 text-dark">VueSpeechRecorder</div>
              <div class="text-caption text-grey-6">
                Self-contained recorder — mic button with pulse animation, live transcript display, ARIA aria-live region. Keyboard: Space/Enter to toggle, Escape to stop. Themed via CSS custom properties — no framework required.
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <VueSpeechRecorder />
            </q-card-section>
          </q-card>

        </div>
      </q-page>
    </q-page-container>

  </q-layout>
</template>
