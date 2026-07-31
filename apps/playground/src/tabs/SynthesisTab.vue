<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import WaveformCanvas from '../components/WaveformCanvas.vue'
import { useFakeWaveform } from '../composables/useFakeWaveform'
import { useTabEntrance } from '../composables/useTabEntrance'
import { useBestWebVoice } from '../composables/useBestWebVoice'

const {
  isSpeaking, isPaused, voices, isLoadingVoices,
  selectedVoice, rate, pitch, volume, error: ttsError,
  speak, stop, pause, resume, isSupported,
} = useBestWebVoice()

const ttsText = ref('The quick brown fox jumps over the lazy dog. Text-to-speech synthesis converts written text into spoken words using configurable voice, rate, pitch, and volume settings.')
const errorDismissed = ref(false)
const textareaEl = ref<HTMLTextAreaElement | null>(null)

// ── Fake waveform (Web Speech cannot be captured — E-T3.1) ────────────────────
const { waveformData } = useFakeWaveform(isSpeaking)
useTabEntrance()

// ── Voice options grouped by language ─────────────────────────────────────────
const voiceGroups = computed(() => {
  const groups: Record<string, { label: string; lang: string; default?: boolean }[]> = {}
  for (const v of voices.value) {
    const lang = v.lang.split('-')[0].toUpperCase()
    if (!groups[lang]) groups[lang] = []
    groups[lang].push(v as { label: string; lang: string; default?: boolean })
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})

// ── Character count ────────────────────────────────────────────────────────────
const charCount = computed(() => ttsText.value.length)

// ── Keyboard shortcuts ─────────────────────────────────────────────────────────
function handleKey(e: KeyboardEvent) {
  // Only when textarea NOT focused (E-T3.6)
  if (document.activeElement === textareaEl.value) return
  if (e.key === ' ') {
    e.preventDefault()
    if (!ttsText.value.trim()) return
    if (isSpeaking.value && !isPaused.value) { pause(); return }
    if (isPaused.value) { resume(); return }
    speak(ttsText.value)
  }
  if (e.key === 'Escape') { e.preventDefault(); stop() }
}

onMounted(() => document.addEventListener('keydown', handleKey))
onUnmounted(() => { document.removeEventListener('keydown', handleKey); if (isSpeaking.value) stop() })

// ── Slider defaults ────────────────────────────────────────────────────────────
const DEFAULT = { rate: 1, pitch: 1, volume: 1 }
</script>

<template>
  <div class="synth">
    <!-- Waveform (T3.1) -->
    <div class="synth__waveform pg-card">
      <WaveformCanvas :data="waveformData" color="#6366f1" :height="72" :bar-count="50" />
      <div v-if="!isSupported" class="synth__no-support" role="alert">
        Web Speech API not supported. <span class="pg-text-muted" style="font-size:.8rem">(Web Audio capture unavailable for synthesized speech — E-T3.1)</span>
      </div>
      <div class="synth__waveform-note pg-text-muted">
        ℹ Web Speech API output cannot be captured directly; waveform is simulated.
        AI providers (OpenAI/Azure/ElevenLabs) support real visualization via the Setup tab.
      </div>
    </div>

    <div class="synth__controls pg-card">
      <!-- Voice selector (T3.2) -->
      <div class="synth__section">
        <div class="pg-label" style="margin-bottom:8px">Voice</div>
        <div class="synth__voice-row" :aria-busy="isLoadingVoices">
          <template v-if="isLoadingVoices">
            <div class="synth__skeleton" aria-label="Loading voices…" />
          </template>
          <select
            v-else
            v-model="selectedVoice"
            class="synth__select"
            aria-label="Select voice"
          >
            <option :value="null">— Default —</option>
            <optgroup v-for="[lang, group] in voiceGroups" :key="lang" :label="lang">
              <option v-for="v in group" :key="v.label" :value="v">
                {{ v.label }}{{ v.default ? ' ✓' : '' }} ({{ v.lang }})
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <!-- Sliders (T3.3) -->
      <div class="synth__sliders">
        <div v-for="({ key, label, min, max, step, def }) in [
          { key: 'rate',   label: 'Rate',   min: 0.1, max: 2.0, step: 0.1, def: DEFAULT.rate   },
          { key: 'pitch',  label: 'Pitch',  min: 0,   max: 2.0, step: 0.1, def: DEFAULT.pitch  },
          { key: 'volume', label: 'Volume', min: 0,   max: 1.0, step: 0.05, def: DEFAULT.volume },
        ]" :key="key" class="synth__slider-row">
          <div class="synth__slider-label">
            <span>{{ label }}</span>
            <span class="synth__slider-val">
              {{ key === 'rate' ? rate.toFixed(1) : key === 'pitch' ? pitch.toFixed(1) : volume.toFixed(2) }}
            </span>
            <button
              class="synth__reset-btn"
              :aria-label="`Reset ${label} to default`"
              :title="`Reset to ${def}`"
              @click="key === 'rate' ? (rate = def) : key === 'pitch' ? (pitch = def) : (volume = def)"
            >↺</button>
          </div>
          <input
            v-if="key === 'rate'"   v-model.number="rate"   type="range" :min="min" :max="max" :step="step" class="synth__range" :aria-label="`${label}: ${rate.toFixed(1)}`" :title="`Takes effect on next play`" />
          <input
            v-else-if="key === 'pitch'" v-model.number="pitch" type="range" :min="min" :max="max" :step="step" class="synth__range" :aria-label="`${label}: ${pitch.toFixed(1)}`" :title="`Takes effect on next play`" />
          <input
            v-else v-model.number="volume" type="range" :min="min" :max="max" :step="step" class="synth__range" :aria-label="`${label}: ${volume.toFixed(2)}`" />
        </div>
      </div>
    </div>

    <!-- Textarea + transport (T3.4) -->
    <div class="synth__compose pg-card">
      <div class="synth__textarea-wrap">
        <textarea
          ref="textareaEl"
          v-model="ttsText"
          class="synth__textarea"
          rows="5"
          placeholder="Enter text to speak…"
          :disabled="isSpeaking && !isPaused"
          aria-label="Text to speak"
        />
        <span class="synth__charcount pg-text-muted">{{ charCount }} chars</span>
      </div>

      <div class="synth__transport">
        <button class="synth__btn synth__btn--primary"
          :disabled="isSpeaking && !isPaused || !ttsText.trim()"
          :aria-disabled="!ttsText.trim()"
          aria-label="Play (Space)"
          @click="speak(ttsText)">▶ Play</button>
        <button class="synth__btn"
          :disabled="!isSpeaking || isPaused"
          aria-label="Pause (Space)"
          @click="pause()">⏸ Pause</button>
        <button class="synth__btn"
          :disabled="!isPaused"
          aria-label="Resume (Space)"
          @click="resume()">▶ Resume</button>
        <button class="synth__btn synth__btn--danger"
          :disabled="!isSpeaking"
          aria-label="Stop (Escape)"
          @click="stop()">⏹ Stop</button>
        <span class="synth__hint pg-text-muted">Space · Esc</span>
      </div>

      <!-- Error banner (T3.5) -->
      <div v-if="ttsError && !errorDismissed" class="synth__error" role="alert">
        <span>⚠ {{ ttsError.message }}</span>
        <button class="synth__error-close" aria-label="Dismiss error" @click="errorDismissed = true">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.synth { display: flex; flex-direction: column; gap: 16px; }
.synth__waveform { padding: 16px; }
.synth__waveform-note { font-size: .72rem; margin-top: 8px; }
.synth__no-support { color: var(--pg-rose); font-size: .82rem; margin-top: 6px; }
.synth__controls { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 600px) { .synth__controls { grid-template-columns: 1fr; } }
.synth__section { display: flex; flex-direction: column; }
.synth__voice-row {}
.synth__skeleton { height: 38px; background: var(--pg-surface-2); border-radius: var(--pg-radius-sm); animation: shimmer 1.2s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
.synth__select {
  width: 100%; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 9px 12px; font-size: .85rem; outline: none;
}
.synth__select:focus { border-color: var(--pg-primary); }
.synth__sliders { display: flex; flex-direction: column; gap: 14px; }
.synth__slider-row {}
.synth__slider-label { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: .82rem; }
.synth__slider-label > span:first-child { flex: 1; color: var(--pg-text-muted); }
.synth__slider-val { color: var(--pg-primary); font-weight: 600; font-size: .82rem; min-width: 32px; text-align: right; }
.synth__reset-btn { background: none; border: none; cursor: pointer; color: var(--pg-text-muted); padding: 0 2px; font-size: .9rem; }
.synth__reset-btn:hover { color: var(--pg-primary); }
.synth__range { width: 100%; accent-color: var(--pg-primary); }
.synth__compose { padding: 20px; }
.synth__textarea-wrap { position: relative; margin-bottom: 12px; }
.synth__textarea {
  width: 100%; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 12px; font-size: .88rem;
  font-family: inherit; resize: vertical; outline: none; box-sizing: border-box;
}
.synth__textarea:focus { border-color: var(--pg-primary); }
.synth__charcount { position: absolute; bottom: 8px; right: 10px; font-size: .72rem; pointer-events: none; }
.synth__transport { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.synth__btn {
  padding: 8px 16px; border-radius: var(--pg-radius-sm); border: 1px solid var(--pg-border);
  cursor: pointer; font-size: .82rem; background: var(--pg-surface-2); color: var(--pg-text); transition: all .15s;
}
.synth__btn:disabled { opacity: .4; cursor: not-allowed; }
.synth__btn:not(:disabled):hover { border-color: var(--pg-primary); background: var(--pg-primary-dim); color: var(--pg-primary); }
.synth__btn--primary { background: var(--pg-primary); color: #fff; border-color: var(--pg-primary); }
.synth__btn--primary:not(:disabled):hover { opacity: .85; background: var(--pg-primary); color: #fff; }
.synth__btn--danger:not(:disabled) { color: var(--pg-rose); border-color: var(--pg-rose); }
.synth__btn--danger:not(:disabled):hover { background: var(--pg-rose-dim); }
.synth__hint { font-size: .72rem; color: var(--pg-text-muted); margin-left: 8px; }
.synth__error {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding: 10px 14px; background: var(--pg-rose-dim);
  border: 1px solid var(--pg-rose); border-radius: var(--pg-radius-sm); color: var(--pg-rose); font-size: .85rem;
}
.synth__error-close { background: none; border: none; cursor: pointer; color: var(--pg-rose); font-size: 1rem; }
</style>

