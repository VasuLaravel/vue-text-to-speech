<script setup lang="ts">
import { watch } from 'vue'
import { useSpeechRecognition } from '../composables/useSpeechRecognition.js'
import type { SpeechError } from '../providers/types.js'

// ─── Props / Emits ────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    /** BCP-47 language code (e.g. 'en-US'). Defaults to browser UI language */
    lang?: string
    /** Keep recognizing after the first final result */
    continuous?: boolean
  }>(),
  { continuous: false },
)

const emit = defineEmits<{
  /** Fired on each interim (non-final) transcript update */
  transcript: [text: string, confidence: number]
  /** Fired when a final transcript result is received */
  'final-transcript': [text: string, confidence: number]
  /** Fired on recognition error */
  error: [error: SpeechError]
}>()

// ─── Composable ───────────────────────────────────────────────────────────────
const {
  isSupported,
  isListening,
  transcript,
  finalTranscript,
  confidence,
  error,
  start,
  stop,
  resetTranscript,
} = useSpeechRecognition({
  lang: props.lang,
  continuous: props.continuous,
  interimResults: true,
})

// ─── Relay composable state → component emits ─────────────────────────────────
watch(transcript, (val) => {
  if (val) emit('transcript', val, 0)
})
watch(finalTranscript, (val) => {
  if (val) emit('final-transcript', val, confidence.value ?? 0)
})
watch(error, (val) => {
  if (val) emit('error', val)
})

// ─── Handlers ─────────────────────────────────────────────────────────────────
function toggleListening() {
  if (isListening.value) {
    stop()
  } else {
    resetTranscript()
    start()
  }
}

/** Escape stops recognition from anywhere within the recorder */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isListening.value) {
    stop()
    event.preventDefault()
  }
}
</script>

<template>
  <div class="vts-recorder" @keydown="handleKeydown">
    <!-- Not supported banner -->
    <p v-if="!isSupported" class="vts-recorder__unsupported" role="alert">
      Speech recognition is not supported in this browser.
    </p>

    <template v-else>
      <!-- Mic button — aria-pressed reflects toggle state (I-6.3) -->
      <div class="vts-recorder__controls">
        <button
          class="vts-recorder__mic-btn"
          :class="{ 'vts-recorder__mic-btn--active': isListening }"
          :aria-pressed="isListening"
          :aria-label="isListening ? 'Stop recording' : 'Start recording'"
          @click="toggleListening"
        >
          <slot name="mic-icon">
            <span class="vts-recorder__mic-icon" aria-hidden="true">🎤</span>
          </slot>
          <!-- Pulse ring — hidden from AT (cosmetic only) -->
          <span v-if="isListening" class="vts-recorder__pulse" aria-hidden="true" />
        </button>

        <span class="vts-recorder__status">
          {{ isListening ? 'Listening…' : 'Press to speak' }}
        </span>
      </div>

      <!-- Transcript region — aria-live="polite" so screen readers announce updates (I-6.5) -->
      <div
        class="vts-recorder__transcript"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Transcript"
        role="status"
      >
        <slot name="transcript">
          <span v-if="!finalTranscript && !transcript" class="vts-recorder__placeholder">
            Transcript will appear here…
          </span>
          <template v-else>
            <span class="vts-recorder__final">{{ finalTranscript }}</span>
            <span
              v-if="transcript"
              class="vts-recorder__interim"
              aria-label="Interim result"
            >{{ transcript }}</span>
          </template>
        </slot>
      </div>

      <p v-if="error" class="vts-recorder__error" role="alert">{{ error.message }}</p>
    </template>
  </div>
</template>

<style scoped>
.vts-recorder {
  font-family: var(--vts-font, inherit);
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  max-width: 480px;
}

.vts-recorder__unsupported {
  color: var(--vts-text-muted, #6b7280);
  font-size: 0.875rem;
  margin: 0;
}

/* Controls row */
.vts-recorder__controls {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

/* Mic button */
.vts-recorder__mic-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid var(--vts-border, #e5e7eb);
  background: var(--vts-bg, #ffffff);
  cursor: pointer;
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: border-color 0.2s, background 0.2s;
}

.vts-recorder__mic-btn:hover:not(:disabled) {
  border-color: var(--vts-primary, #6366f1);
}

.vts-recorder__mic-btn--active {
  background: var(--vts-recording-color, #ef4444);
  border-color: var(--vts-recording-color, #ef4444);
  color: #fff;
}

.vts-recorder__mic-btn:focus-visible {
  outline: 2px solid var(--vts-primary, #6366f1);
  outline-offset: 3px;
}

/* Pulse ring animation (active state) */
.vts-recorder__pulse {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid var(--vts-recording-color, #ef4444);
  animation: vts-pulse 1.4s ease-out infinite;
  pointer-events: none;
}

@keyframes vts-pulse {
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.5); }
}

/* Status text */
.vts-recorder__status {
  font-size: 0.875rem;
  color: var(--vts-text-muted, #6b7280);
}

/* Transcript box */
.vts-recorder__transcript {
  background: var(--vts-bg, #ffffff);
  border: 1px solid var(--vts-border, #e5e7eb);
  border-radius: var(--vts-radius, 8px);
  padding: 0.75rem 1rem;
  min-height: 5rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vts-text, #111827);
  word-break: break-word;
}

.vts-recorder__placeholder {
  color: var(--vts-text-muted, #6b7280);
  font-style: italic;
}

.vts-recorder__final {
  color: var(--vts-text, #111827);
}

.vts-recorder__interim {
  color: var(--vts-text-muted, #6b7280);
  font-style: italic;
}

/* Error */
.vts-recorder__error {
  font-size: 0.8125rem;
  color: var(--vts-recording-color, #ef4444);
  margin: 0;
}
</style>
