<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useSpeechSynthesis } from '../composables/useSpeechSynthesis.js'
import VueSpeechVoiceSelect from './VueSpeechVoiceSelect.vue'
import type { SpeechError } from '../providers/types.js'

// ─── Props / Emits ────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    /** The text to speak */
    text: string
    /** Start speaking automatically when the component mounts */
    autoSpeak?: boolean
  }>(),
  { autoSpeak: false },
)

const emit = defineEmits<{
  /** Fired when the utterance starts */
  start: []
  /** Fired when the utterance ends (naturally or after stop) */
  end: []
  /** Fired when the utterance is paused */
  pause: []
  /** Fired when the utterance is resumed after a pause */
  resume: []
  /** Fired when the provider encounters an error */
  error: [error: SpeechError]
}>()

// ─── Composable ───────────────────────────────────────────────────────────────
const {
  isSupported,
  isSpeaking,
  isPaused,
  voices,
  isLoadingVoices,
  selectedVoice,
  rate,
  pitch,
  volume,
  error,
  speak,
  stop,
  pause,
  resume,
} = useSpeechSynthesis()

// ─── Relay composable state → component emits ─────────────────────────────────
watch(isSpeaking, (val, prev) => {
  if (val && !prev) emit('start')
  if (!val && prev) emit('end')
})
watch(isPaused, (val, prev) => {
  if (val && !prev) emit('pause')
  if (!val && prev) emit('resume')
})
watch(error, (val) => {
  if (val) emit('error', val)
})

// ─── Handlers ─────────────────────────────────────────────────────────────────
function handlePlay() {
  if (isPaused.value) {
    resume()
  } else {
    speak(props.text)
  }
}

/** Escape key stops playback from anywhere within the player */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isSpeaking.value) {
    stop()
    event.preventDefault()
  }
}

onMounted(() => {
  if (props.autoSpeak) speak(props.text)
})
</script>

<template>
  <div
    class="vts-player"
    :class="{
      'vts-player--speaking': isSpeaking,
      'vts-player--paused': isPaused,
    }"
    @keydown="handleKeydown"
  >
    <!-- Not supported banner -->
    <p v-if="!isSupported" class="vts-player__unsupported" role="alert">
      Text-to-speech is not supported in this browser.
    </p>

    <template v-else>
      <!-- Voice selector -->
      <div class="vts-player__voice-row">
        <label class="vts-player__field-label" for="vts-voice-select">Voice</label>
        <VueSpeechVoiceSelect
          id="vts-voice-select"
          v-model="selectedVoice"
          :voices="voices"
          :loading="isLoadingVoices"
          :disabled="isSpeaking && !isPaused"
        />
      </div>

      <!-- Rate / Pitch / Volume sliders -->
      <div class="vts-player__sliders">
        <label class="vts-player__slider-label">
          <span>Rate <span class="vts-player__slider-val">{{ rate.toFixed(1) }}</span></span>
          <input
            type="range"
            v-model.number="rate"
            min="0.1"
            max="4"
            step="0.1"
            aria-label="Speech rate"
          />
        </label>
        <label class="vts-player__slider-label">
          <span>Pitch <span class="vts-player__slider-val">{{ pitch.toFixed(1) }}</span></span>
          <input
            type="range"
            v-model.number="pitch"
            min="0"
            max="2"
            step="0.1"
            aria-label="Speech pitch"
          />
        </label>
        <label class="vts-player__slider-label">
          <span>Volume <span class="vts-player__slider-val">{{ volume.toFixed(2) }}</span></span>
          <input
            type="range"
            v-model.number="volume"
            min="0"
            max="1"
            step="0.05"
            aria-label="Speech volume"
          />
        </label>
      </div>

      <!-- Playback controls — full replacement via #controls, icon replacement via #*-icon -->
      <div class="vts-player__controls" role="group" aria-label="Playback controls">
        <slot name="controls">
          <button
            class="vts-btn vts-btn--primary"
            :disabled="isSpeaking && !isPaused"
            :aria-label="isPaused ? 'Resume' : 'Play'"
            @click="handlePlay"
          >
            <slot name="play-icon">{{ isPaused ? '▶ Resume' : '▶ Play' }}</slot>
          </button>

          <button
            class="vts-btn"
            :disabled="!isSpeaking || isPaused"
            aria-label="Pause"
            @click="pause()"
          >
            <slot name="pause-icon">⏸ Pause</slot>
          </button>

          <button
            class="vts-btn vts-btn--danger"
            :disabled="!isSpeaking"
            aria-label="Stop"
            @click="stop()"
          >
            <slot name="stop-icon">⏹ Stop</slot>
          </button>
        </slot>
      </div>

      <!-- Error display -->
      <p v-if="error" class="vts-player__error" role="alert">{{ error.message }}</p>
    </template>
  </div>
</template>

<style scoped>
.vts-player {
  font-family: var(--vts-font, inherit);
  background: var(--vts-bg, #ffffff);
  border: 1px solid var(--vts-border, #e5e7eb);
  border-radius: var(--vts-radius, 8px);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  max-width: 480px;
}

.vts-player__unsupported {
  color: var(--vts-text-muted, #6b7280);
  font-size: 0.875rem;
  margin: 0;
}

/* Voice row */
.vts-player__voice-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.vts-player__field-label {
  font-size: 0.75rem;
  color: var(--vts-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Sliders */
.vts-player__sliders {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vts-player__slider-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: var(--vts-text, #111827);
}

.vts-player__slider-label > span {
  min-width: 6rem;
  display: flex;
  justify-content: space-between;
}

.vts-player__slider-val {
  color: var(--vts-text-muted, #6b7280);
  font-variant-numeric: tabular-nums;
  min-width: 2.5rem;
  text-align: right;
}

.vts-player__slider-label input[type='range'] {
  flex: 1;
  accent-color: var(--vts-primary, #6366f1);
}

/* Controls */
.vts-player__controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Shared button base */
.vts-btn {
  font-family: var(--vts-font, inherit);
  font-size: 0.875rem;
  padding: 0.4rem 0.875rem;
  border: 1px solid var(--vts-border, #e5e7eb);
  border-radius: var(--vts-radius, 8px);
  background: var(--vts-bg, #ffffff);
  color: var(--vts-text, #111827);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.vts-btn:hover:not(:disabled) {
  border-color: var(--vts-primary, #6366f1);
  color: var(--vts-primary, #6366f1);
}

.vts-btn--primary {
  background: var(--vts-primary, #6366f1);
  border-color: var(--vts-primary, #6366f1);
  color: #fff;
}

.vts-btn--primary:hover:not(:disabled) {
  background: var(--vts-primary-hover, #4f46e5);
  border-color: var(--vts-primary-hover, #4f46e5);
  color: #fff;
}

.vts-btn--danger:hover:not(:disabled) {
  border-color: var(--vts-recording-color, #ef4444);
  color: var(--vts-recording-color, #ef4444);
}

.vts-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.vts-btn:focus-visible {
  outline: 2px solid var(--vts-primary, #6366f1);
  outline-offset: 2px;
}

/* Error */
.vts-player__error {
  font-size: 0.8125rem;
  color: var(--vts-recording-color, #ef4444);
  margin: 0;
}
</style>
