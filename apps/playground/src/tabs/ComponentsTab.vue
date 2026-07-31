<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueSpeechPlayer, VueSpeechRecorder, VueSpeechVoiceSelect } from 'vue-text-to-speech'
import type { VoiceInfo } from 'vue-text-to-speech'
import { useBestWebVoice } from '../composables/useBestWebVoice'
import CodeBlock from '../components/CodeBlock.vue'

// ── Player CSS var editor ──────────────────────────────────────────────────────
interface CSSVarDef { key: string; label: string; type: 'color' | 'text'; default: string }

const PLAYER_VARS: CSSVarDef[] = [
  { key: '--vts-primary',  label: 'Primary',  type: 'color', default: '#6366f1' },
  { key: '--vts-bg',       label: 'BG',       type: 'color', default: '#1a1a26' },
  { key: '--vts-border',   label: 'Border',   type: 'color', default: 'rgba(255,255,255,0.08)' },
  { key: '--vts-text',     label: 'Text',     type: 'color', default: '#e2e8f0' },
  { key: '--vts-radius',   label: 'Radius',   type: 'text',  default: '12px' },
  { key: '--vts-font',     label: 'Font',     type: 'text',  default: 'inherit' },
]

const playerCSSVars = ref<Record<string, string>>(
  Object.fromEntries(PLAYER_VARS.map(v => [v.key, v.default]))
)

function resetPlayerVars() {
  PLAYER_VARS.forEach(v => { playerCSSVars.value[v.key] = v.default })
}

const playerStyle = computed(() =>
  Object.entries(playerCSSVars.value).map(([k, v]) => `${k}: ${v}`).join('; ')
)

const playerCode = computed(() =>
`<VueSpeechPlayer
  text="Hello from vue-text-to-speech!"
  :style="{
${Object.entries(playerCSSVars.value).map(([k, v]) => `    '${k}': '${v}'`).join(',\n')}
  }"
/>`
)

// ── Recorder CSS var editor ────────────────────────────────────────────────────
const recorderRecordingColor = ref('#f43f5e')

function resetRecorderVars() { recorderRecordingColor.value = '#f43f5e' }

const recorderCode = computed(() =>
`<VueSpeechRecorder
  :style="{ '--vts-recording-color': '${recorderRecordingColor.value}' }"
/>`
)

// ── VoiceSelect v-model demo ───────────────────────────────────────────────────
const { voices, isLoadingVoices, selectedVoice } = useBestWebVoice()


const voiceSelectCode = `<script setup>
import { ref } from 'vue'
import { VueSpeechVoiceSelect } from 'vue-text-to-speech'

const selectedVoice = ref(null)
<\/script>

<template>
  <VueSpeechVoiceSelect v-model="selectedVoice" />
  <p>Selected: {{ selectedVoice?.label ?? 'Default' }}</p>
</template>`
</script>

<template>
  <div class="comp">
    <!-- Section A: VueSpeechPlayer -->
    <section class="comp__section pg-card" aria-labelledby="player-heading">
      <h2 id="player-heading" class="comp__heading">VueSpeechPlayer</h2>
      <p class="comp__desc pg-text-muted">Drag the sliders and color pickers to customize the player's CSS variables live.</p>

      <div class="comp__row">
        <!-- Preview with injected CSS vars -->
        <div class="comp__preview" :style="playerStyle">
          <VueSpeechPlayer text="Hello from vue-text-to-speech! This is a customizable speech player component." />
        </div>

        <!-- CSS var editor -->
        <div class="comp__editor">
          <div v-for="varDef in PLAYER_VARS" :key="varDef.key" class="comp__var-row">
            <label :for="'player-' + varDef.key" class="comp__var-label">{{ varDef.label }}</label>
            <input
              v-if="varDef.type === 'color'"
              :id="'player-' + varDef.key"
              v-model="playerCSSVars[varDef.key]"
              type="color"
              class="comp__color-input"
              :aria-label="`${varDef.label} color`"
            />
            <input
              v-else
              :id="'player-' + varDef.key"
              v-model="playerCSSVars[varDef.key]"
              type="text"
              class="comp__text-input"
              :aria-label="`${varDef.label} value`"
            />
          </div>
          <button class="comp__reset-btn" @click="resetPlayerVars">↺ Reset</button>
        </div>
      </div>

      <!-- Generated code -->
      <details class="comp__details">
        <summary class="comp__summary">Generated code</summary>
        <CodeBlock :code="playerCode" language="html" />
      </details>
    </section>

    <!-- Section B: VueSpeechRecorder -->
    <section class="comp__section pg-card" aria-labelledby="recorder-heading">
      <h2 id="recorder-heading" class="comp__heading">VueSpeechRecorder</h2>
      <p class="comp__desc pg-text-muted">Customize the recording indicator color.</p>

      <div class="comp__row">
        <!-- Light preview -->
        <div class="comp__preview comp__preview--light" :style="`--vts-recording-color: ${recorderRecordingColor}`">
          <span class="comp__preview-label">Light</span>
          <VueSpeechRecorder />
        </div>
        <!-- Dark preview -->
        <div class="comp__preview comp__preview--dark" :style="`--vts-recording-color: ${recorderRecordingColor}`">
          <span class="comp__preview-label">Dark</span>
          <VueSpeechRecorder />
        </div>

        <!-- Editor -->
        <div class="comp__editor">
          <div class="comp__var-row">
            <label for="rec-color" class="comp__var-label">Recording color</label>
            <input id="rec-color" v-model="recorderRecordingColor" type="color" class="comp__color-input" aria-label="Recording color" />
          </div>
          <button class="comp__reset-btn" @click="resetRecorderVars">↺ Reset</button>
        </div>
      </div>

      <details class="comp__details">
        <summary class="comp__summary">Generated code</summary>
        <CodeBlock :code="recorderCode" language="html" />
      </details>
    </section>

    <!-- Section C: VueSpeechVoiceSelect -->
    <section class="comp__section pg-card" aria-labelledby="voiceselect-heading">
      <h2 id="voiceselect-heading" class="comp__heading">VueSpeechVoiceSelect</h2>
      <p class="comp__desc pg-text-muted">Standalone voice selector component with <code>v-model</code> binding.</p>

      <div class="comp__voice-demo">
        <VueSpeechVoiceSelect v-model="selectedVoice" :voices="voices" :loading="isLoadingVoices" />
        <p class="comp__voice-val pg-text-muted">
          Selected: <strong style="color:var(--pg-primary)">{{ selectedVoice?.label ?? 'Default' }}</strong>
        </p>
      </div>

      <details class="comp__details">
        <summary class="comp__summary">Usage example</summary>
        <CodeBlock :code="voiceSelectCode" language="html" />
      </details>
    </section>
  </div>
</template>

<style scoped>
.comp { display: flex; flex-direction: column; gap: 16px; }
.comp__section { padding: 24px; }
.comp__heading { font-size: 1.1rem; font-weight: 700; color: var(--pg-text); margin: 0 0 6px; }
.comp__desc { margin: 0 0 18px; font-size: .85rem; }
.comp__row { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; margin-bottom: 16px; }
.comp__preview {
  flex: 1 1 240px; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); padding: 20px; position: relative;
}
.comp__preview--light { background: #ffffff; color: #0f172a; }
.comp__preview--dark  { background: #12121a; color: #e2e8f0; }
.comp__preview-label {
  position: absolute; top: 8px; right: 10px; font-size: .7rem; color: var(--pg-text-muted);
  background: var(--pg-surface-2); padding: 2px 6px; border-radius: 4px;
}
.comp__editor { flex: 0 0 220px; display: flex; flex-direction: column; gap: 10px; }
.comp__var-row { display: flex; align-items: center; gap: 10px; }
.comp__var-label { flex: 1; font-size: .8rem; color: var(--pg-text-muted); }
.comp__color-input { width: 36px; height: 26px; border: 1px solid var(--pg-border); border-radius: 4px; cursor: pointer; padding: 0; }
.comp__text-input {
  width: 100px; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 5px 8px; font-size: .8rem; outline: none;
}
.comp__text-input:focus { border-color: var(--pg-primary); }
.comp__reset-btn {
  align-self: flex-start; padding: 6px 14px; background: none; border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text-muted); cursor: pointer; font-size: .8rem;
}
.comp__reset-btn:hover { color: var(--pg-primary); border-color: var(--pg-primary); }
.comp__details { margin-top: 4px; }
.comp__summary {
  cursor: pointer; padding: 8px 14px; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); font-size: .8rem; color: var(--pg-text-muted); list-style: none;
}
.comp__summary:hover { color: var(--pg-text); }
.comp__voice-demo { display: flex; flex-direction: column; gap: 10px; max-width: 400px; margin-bottom: 16px; }
.comp__voice-val { margin: 0; font-size: .85rem; }
</style>

