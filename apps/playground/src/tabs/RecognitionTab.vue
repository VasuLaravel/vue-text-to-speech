<script setup lang="ts">
import { ref, shallowRef, watch, onUnmounted } from 'vue'
import { useSpeechRecognition } from 'vue-text-to-speech'
import WaveformCanvas from '../components/WaveformCanvas.vue'
import { useAudioVisualizer } from '../composables/useAudioVisualizer'

const LANGUAGES = [
  { label: 'English (US)',    value: 'en-US' },
  { label: 'English (GB)',    value: 'en-GB' },
  { label: 'Spanish (ES)',    value: 'es-ES' },
  { label: 'French (FR)',     value: 'fr-FR' },
  { label: 'German (DE)',     value: 'de-DE' },
  { label: 'Portuguese (BR)', value: 'pt-BR' },
  { label: 'Japanese (JP)',   value: 'ja-JP' },
  { label: 'Chinese (ZH)',    value: 'zh-CN' },
]

const selectedLang = ref('en-US')
const continuous = ref(false)
const permissionDenied = ref(false)
const micBtnShaking = ref(false)
const micBtnDebounce = ref(false)

// ── Web Audio visualizer on MediaStream ──────────────────────────────────────
const { analyzerData, isActive: vizActive, start: startViz, stop: stopViz } = useAudioVisualizer()

// ── Speech recognition ────────────────────────────────────────────────────────
// shallowRef so reassignment (on lang/continuous change) is tracked reactively;
// watches that access recRef.value.X.value re-evaluate against the NEW instance.
const recRef = shallowRef(useSpeechRecognition({ lang: selectedLang.value, continuous: continuous.value }))

const isListening = ref(recRef.value.isListening.value)
const isSupported = ref(recRef.value.isSupported.value)
const transcriptDisplay = ref('')
const interimDisplay = ref('')
const lastConfidence = ref<number | null>(null)

// Chrome always returns confidence=0 for isFinal=true results; the real score
// only appears on interim events. We hold it here and use it on the final.
let _lastInterimConf = 0

// Track interim confidence as it arrives (non-zero, comes before the final event)
watch(() => recRef.value.confidence.value, (val) => {
  const n = val ?? 0
  if (n > 0) _lastInterimConf = n
})

// When a final transcript arrives, append it and resolve the confidence
watch(() => recRef.value.finalTranscript.value, (val) => {
  if (val) {
    transcriptDisplay.value += (transcriptDisplay.value ? ' ' : '') + val
    // Prefer final confidence; fall back to last interim value (Chrome workaround)
    const finalConf = recRef.value.confidence.value ?? 0
    const conf = finalConf > 0 ? finalConf : _lastInterimConf
    lastConfidence.value = conf > 0 ? conf : null
    _lastInterimConf = 0  // reset for next utterance
  }
})

watch(() => recRef.value.transcript.value, (val) => {
  interimDisplay.value = val ?? ''
})

watch(() => recRef.value.isListening.value, (val) => {
  isListening.value = val
})

// ── Re-create composable when lang/continuous changes ─────────────────────────
// Assigning to recRef.value (shallowRef) makes all watches above re-evaluate
// against the new instance automatically — no manual dep tracking needed.
watch([selectedLang, continuous], () => {
  if (isListening.value) recRef.value.stop()
  stopViz()
  isListening.value = false
  _lastInterimConf = 0
  recRef.value = useSpeechRecognition({ lang: selectedLang.value, continuous: continuous.value })
  isSupported.value = recRef.value.isSupported.value
})

// ── Mic button ───────────────────────────────────────────────────────────────
async function toggleMic() {
  if (micBtnDebounce.value) return
  micBtnDebounce.value = true
  setTimeout(() => { micBtnDebounce.value = false }, 300)

  if (isListening.value) {
    recRef.value.stop()
    stopViz()
    return
  }

  permissionDenied.value = false
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    startViz(stream)
    recRef.value.start()
    isListening.value = true
  } catch (err: unknown) {
    const e = err as Error
    if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
      permissionDenied.value = true
    } else {
      shakeMicBtn()
    }
  }
}

function shakeMicBtn() {
  micBtnShaking.value = true
  setTimeout(() => { micBtnShaking.value = false }, 600)
}

// ── Confidence badge color ────────────────────────────────────────────────────
function confidenceColor(c: number) {
  if (c >= 0.8)  return 'var(--pg-emerald, #10b981)'
  if (c >= 0.5) return 'var(--pg-amber,  #f59e0b)'
  return 'var(--pg-rose)'
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
onUnmounted(() => { if (isListening.value) recRef.value.stop(); stopViz() })

function clearTranscript() {
  transcriptDisplay.value = ''
  interimDisplay.value = ''
  lastConfidence.value = null
  _lastInterimConf = 0
  recRef.value.resetTranscript()
}
</script>

<template>
  <div class="rec">
    <!-- Not supported banner (E-T4.6) -->
    <div v-if="!isSupported" class="rec__banner rec__banner--warn" role="alert">
      ⚠ Web Speech Recognition is not supported in this browser. Try Chrome or Edge.
    </div>

    <!-- Permission denied banner (E-T4.7) -->
    <div v-if="permissionDenied" class="rec__banner rec__banner--error" role="alert">
      🎤 Microphone permission denied. Please allow microphone access and try again.
    </div>

    <!-- Controls row -->
    <div class="rec__settings pg-card">
      <div class="rec__setting">
        <label for="rec-lang" class="pg-label">Language</label>
        <select id="rec-lang" v-model="selectedLang" class="rec__select" :disabled="isListening" aria-label="Recognition language">
          <option v-for="l in LANGUAGES" :key="l.value" :value="l.value">{{ l.label }}</option>
        </select>
      </div>
      <label class="rec__toggle">
        <input v-model="continuous" type="checkbox" role="switch" :disabled="isListening" aria-label="Continuous mode" />
        <span>Continuous mode
          <span class="rec__toggle-hint">{{ continuous ? 'stays open — speak freely' : 'one phrase at a time' }}</span>
        </span>
      </label>
      <button class="rec__clear-btn" :disabled="!transcriptDisplay && !interimDisplay" @click="clearTranscript">Clear transcript</button>
    </div>

    <!-- Center-stage mic -->
    <div class="rec__stage pg-card">
      <!-- Audio level ring via conic-gradient (T4.3) -->
      <div
        class="rec__ring-wrap"
        :style="vizActive && isListening ? {
          '--ring-pct': `${Math.round(((analyzerData as Uint8Array)[0] ?? 0) / 255 * 100)}%`
        } : {}"
      >
        <div class="rec__ring" :class="{ 'rec__ring--active': isListening }" aria-hidden="true" />
        <button
          class="rec__mic-btn"
          :class="{ 'rec__mic-btn--recording': isListening, 'rec__mic-btn--shake': micBtnShaking }"
          :disabled="!isSupported"
          :aria-label="isListening ? 'Stop recording' : 'Start recording'"
          :aria-pressed="isListening"
          @click="toggleMic"
        >
          <span class="rec__mic-icon" aria-hidden="true">{{ isListening ? '⏹' : '🎤' }}</span>
        </button>
      </div>

      <!-- Waveform (real Web Audio from mic stream) -->
      <WaveformCanvas
        :data="vizActive ? analyzerData : undefined"
        :color="isListening ? '#06b6d4' : '#6366f1'"
        :height="48"
        :bar-count="40"
        style="margin-top: 16px; max-width: 400px; width: 100%;"
      />

      <!-- Status label -->
      <p class="rec__status" role="status" aria-live="polite">
        <span v-if="isListening" class="pg-badge-speaking">● Recording</span>
        <span v-else style="color:var(--pg-text-muted)">Idle — click mic to begin</span>
      </p>
    </div>

    <!-- Transcript area (T4.4 + T4.5) -->
    <div class="rec__transcript pg-card" role="region" aria-label="Transcript">
      <div class="rec__transcript-header">
        <span class="pg-label">Transcript</span>
        <span v-if="lastConfidence !== null" class="rec__confidence-badge" :style="{ background: confidenceColor(lastConfidence) +'22', border: '1px solid '+confidenceColor(lastConfidence), color: confidenceColor(lastConfidence) }">
          {{ Math.round(lastConfidence * 100) }}% confidence
        </span>
      </div>
      <div class="rec__transcript-body" aria-live="polite">
        <span v-if="transcriptDisplay">{{ transcriptDisplay }}</span>
        <span v-if="interimDisplay" class="rec__interim" aria-label="Interim transcript"> {{ interimDisplay }}</span>
        <span v-if="!transcriptDisplay && !interimDisplay" class="pg-text-muted">Transcript will appear here…</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rec { display: flex; flex-direction: column; gap: 16px; }
.rec__banner {
  padding: 12px 16px; border-radius: var(--pg-radius-sm); font-size: .85rem;
}
.rec__banner--warn  { background: rgba(245,158,11,.1);  border: 1px solid #f59e0b; color: #f59e0b; }
.rec__banner--error { background: var(--pg-rose-dim);    border: 1px solid var(--pg-rose); color: var(--pg-rose); }
.rec__settings { padding: 16px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
.rec__setting { display: flex; flex-direction: column; gap: 6px; }
.rec__select {
  background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 8px 12px; font-size: .85rem; outline: none;
}
.rec__select:focus { border-color: var(--pg-primary); }
.rec__toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: .85rem; color: var(--pg-text); }
.rec__toggle input { accent-color: var(--pg-primary); }
.rec__toggle-hint { display: block; font-size: .72rem; color: var(--pg-text-muted); margin-top: 1px; }
.rec__clear-btn {
  padding: 8px 14px; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); cursor: pointer; font-size: .82rem;
}
.rec__clear-btn:disabled { opacity: .4; cursor: not-allowed; }

/* Stage */
.rec__stage { padding: 32px 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; }

/* 3-ring CSS pulse */
.rec__ring-wrap { position: relative; display: flex; align-items: center; justify-content: center; width: 120px; height: 120px; }
.rec__ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(var(--pg-primary) var(--ring-pct, 0%), transparent var(--ring-pct, 0%));
  opacity: 0; transition: opacity .2s;
}
.rec__ring--active {
  opacity: 1;
  animation: ring-pulse 1.8s ease-in-out infinite;
}
.rec__ring::before,.rec__ring::after {
  content: ''; position: absolute; inset: -14px; border-radius: 50%;
  border: 2px solid var(--pg-primary); opacity: 0; animation: ring-expand 1.8s ease-out infinite;
}
.rec__ring::after { animation-delay: .6s; }
@keyframes ring-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
@keyframes ring-expand { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.5);opacity:0} }

.rec__mic-btn {
  position: relative; z-index: 1; width: 80px; height: 80px; border-radius: 50%;
  background: var(--pg-surface-2); border: 2px solid var(--pg-border);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .2s; font-size: 1.5rem;
}
.rec__mic-btn:hover:not(:disabled) { border-color: var(--pg-primary); background: var(--pg-primary-dim); }
.rec__mic-btn--recording { border-color: var(--pg-cyan); background: rgba(6,182,212,.12); box-shadow: var(--pg-glow-cyan); }
.rec__mic-btn--shake { animation: pg-shake .5s ease-in-out; }
.rec__mic-icon { font-size: 1.8rem; }
.rec__status { margin: 0; font-size: .85rem; }

/* Transcript */
.rec__transcript { padding: 20px; }
.rec__transcript-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.rec__confidence-badge { padding: 2px 10px; border-radius: 9999px; font-size: .75rem; font-weight: 600; }
.rec__transcript-body {
  background: var(--pg-surface-2); border: 1px solid var(--pg-border); border-radius: var(--pg-radius-sm);
  padding: 14px; min-height: 80px; font-size: .88rem; line-height: 1.7; color: var(--pg-text);
}
.rec__interim { color: var(--pg-text-muted); font-style: italic; }
</style>


