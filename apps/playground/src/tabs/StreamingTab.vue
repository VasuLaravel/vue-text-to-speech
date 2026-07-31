<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useStreamingTTS } from 'vue-text-to-speech'
import WaveformCanvas from '../components/WaveformCanvas.vue'
import { useFakeWaveform } from '../composables/useFakeWaveform'
import { useTabEntrance } from '../composables/useTabEntrance'

// ── State ──────────────────────────────────────────────────────────────────────
const tokenSpeed = ref(30)  // tokens per second
const feedText = ref(
`Once upon a time, there was a developer who wanted to add voice to their app.
They discovered a streaming TTS library and decided to give it a try.
The library supported sentence boundary detection, so speech started immediately.
Each sentence was queued and played in order, creating a natural listening experience.
The developer was impressed and shipped voice features to their users.`
)

const tokenDisplay = ref<{ text: string; state: 'pending' | 'buffered' | 'speaking' | 'spoken' | 'boundary' }[]>([])
const isRunning = ref(false)
let abortController: AbortController | null = null

// ── Streaming TTS ──────────────────────────────────────────────────────────────
const { pipeStream, queue, currentItem, isStreaming, stop: stopTTS } = useStreamingTTS()
const isSpeakingStream = computed(() => isStreaming.value ?? false)
const { waveformData } = useFakeWaveform(isSpeakingStream)
useTabEntrance()

const currentSentence = computed(() => currentItem.value ?? '')
const queueWarning = computed(() => (queue.value?.length ?? 0) > 10)

// ── Token generator ────────────────────────────────────────────────────────────
async function* tokenize(text: string, signal: AbortSignal): AsyncGenerator<string> {
  // Split into ~4-8 char chunks simulating LLM token output
  const CHUNK = 5
  let i = 0
  while (i < text.length) {
    if (signal.aborted) return
    const end = Math.min(i + CHUNK, text.length)
    yield text.slice(i, end)
    i = end
    await new Promise<void>(resolve => setTimeout(resolve, Math.round(1000 / tokenSpeed.value)))
  }
}

// Build display token list
function pushTokenDisplay(chunk: string) {
  // Check if it's a sentence boundary character
  const isBoundary = /[.!?]/.test(chunk)
  tokenDisplay.value.push({ text: chunk, state: isBoundary ? 'boundary' : 'buffered' })
  // Keep reasonable length
  if (tokenDisplay.value.length > 200) tokenDisplay.value.splice(0, 50)
}

// Update token state based on current sentence being spoken
function updateTokenStates() {
  if (!currentSentence.value) return
  let acc = ''
  for (const tok of tokenDisplay.value) {
    acc += tok.text
    if (currentSentence.value && acc.includes(currentSentence.value.slice(0, 10))) {
      tok.state = 'speaking'
    }
  }
}

// ── Start / Stop ───────────────────────────────────────────────────────────────
async function start() {
  if (isRunning.value) return
  isRunning.value = true
  tokenDisplay.value = []
  abortController = new AbortController()
  const signal = abortController.signal

  async function* wrappedStream(): AsyncGenerator<string> {
    for await (const chunk of tokenize(feedText.value, signal)) {
      if (signal.aborted) return
      pushTokenDisplay(chunk)
      updateTokenStates()
      yield chunk
    }
    // Mark remaining as spoken after done
    for (const tok of tokenDisplay.value) {
      if (tok.state === 'buffered') tok.state = 'spoken'
    }
  }

  try {
    await pipeStream(wrappedStream())
  } finally {
    isRunning.value = false
    abortController = null
    // Mark all as spoken
    for (const tok of tokenDisplay.value) {
      if (tok.state === 'buffered' || tok.state === 'speaking') tok.state = 'spoken'
    }
  }
}

function stop() {
  abortController?.abort()
  stopTTS()
  isRunning.value = false
}

function restart() { stop(); setTimeout(start, 150) }

// ── Flush unpunctuated buffer (E-T5.4) — not in current API, no-op ─────────────
function flushBuffer() { /* flush not in current API */ }

// ── Cleanup ────────────────────────────────────────────────────────────────────
onUnmounted(() => stop())

// ── Token color map ────────────────────────────────────────────────────────────
const stateColor: Record<string, string> = {
  pending:  'var(--pg-text-muted)',
  buffered: 'var(--pg-primary)',
  speaking: 'var(--pg-cyan)',
  spoken:   'var(--pg-text-muted)',
  boundary: 'var(--pg-cyan)',
}
</script>

<template>
  <div class="stream">
    <div class="stream__layout">
      <!-- ── Token Feed (left) ──────────────────────────────────────────────── -->
      <div class="stream__panel pg-card">
        <div class="pg-label" style="margin-bottom: 12px">Token Feed</div>

        <!-- Controls -->
        <div class="stream__controls">
          <button class="stream__btn stream__btn--primary" :disabled="isRunning" @click="start">
            ▶ Start
          </button>
          <button class="stream__btn stream__btn--danger" :disabled="!isRunning" @click="stop">
            ⏹ Stop
          </button>
          <button class="stream__btn" @click="restart">↺ Restart</button>
          <label class="stream__speed-label">
            <span class="pg-text-muted" style="font-size:.8rem">Speed</span>
            <input v-model.number="tokenSpeed" type="range" min="10" max="100" step="5" class="stream__range" :aria-label="`Token speed: ${tokenSpeed} t/s`" />
            <span style="color:var(--pg-primary); font-size:.8rem; min-width:44px">{{ tokenSpeed }} t/s</span>
          </label>
        </div>

        <!-- Feed textarea -->
        <textarea
          v-model="feedText"
          class="stream__textarea"
          rows="6"
          :disabled="isRunning"
          placeholder="Enter multi-sentence text to stream…"
          aria-label="Text to stream"
        />

        <!-- Token display -->
        <div class="stream__tokens" aria-label="Token stream display" aria-live="polite">
          <span
            v-for="(tok, i) in tokenDisplay"
            :key="i"
            class="stream__token"
            :style="{ color: stateColor[tok.state], fontWeight: tok.state === 'speaking' ? '700' : '400' }"
          >{{ tok.text }}</span>
          <span v-if="tokenDisplay.length === 0 && !isRunning" class="pg-text-muted" style="font-size:.8rem">Tokens appear here when running…</span>
        </div>
      </div>

      <!-- ── Speech Queue (right) ──────────────────────────────────────────── -->
      <div class="stream__panel pg-card">
        <div class="stream__queue-header">
          <span class="pg-label">Speech Queue</span>
          <!-- Queue length warning (E-T5.3) -->
          <span v-if="queueWarning" class="stream__queue-warn" role="alert">
            ⚠ {{ queue?.length ?? 0 }} items queued
          </span>
          <button class="stream__flush-btn" :disabled="!isRunning" title="Flush unpunctuated buffer" @click="flushBuffer">Flush</button>
        </div>

        <!-- Currently speaking (T5.5) -->
        <div v-if="currentSentence" class="stream__current">
          <span class="pg-badge-speaking">Speaking</span>
          <p class="stream__current-text">{{ currentSentence }}</p>
          <WaveformCanvas :data="waveformData" color="#06b6d4" :height="32" :bar-count="30" />
        </div>
        <div v-else class="stream__current stream__current--idle">
          <span style="color:var(--pg-text-muted); font-size:.85rem">No sentence playing</span>
        </div>

        <!-- Queue list -->
        <div class="stream__queue-list" role="list" aria-label="Queued sentences">
          <div v-if="(queue?.length ?? 0) === 0" class="stream__queue-empty pg-text-muted">Queue is empty</div>
          <div
            v-for="(item, i) in (queue ?? [])"
            :key="i"
            class="stream__queue-item"
            :class="{ 'stream__queue-item--current': item === currentSentence }"
            role="listitem"
          >
            <span class="stream__queue-pos">{{ i + 1 }}</span>
            <span class="stream__queue-text">{{ String(item).slice(0, 60) }}{{ String(item).length > 60 ? '…' : '' }}</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="stream__legend">
          <span v-for="([label, color]) in [
            ['Speaking', 'var(--pg-cyan)'],
            ['Buffered', 'var(--pg-primary)'],
            ['Boundary', 'var(--pg-cyan)'],
            ['Spoken', 'var(--pg-text-muted)'],
          ]" :key="label" class="stream__legend-item">
            <span class="stream__legend-dot" :style="{ background: color }" aria-hidden="true" />
            <span class="pg-text-muted" style="font-size:.75rem">{{ label }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stream { display: flex; flex-direction: column; gap: 16px; }
.stream__layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 768px) { .stream__layout { grid-template-columns: 1fr; } }
.stream__panel { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.stream__controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.stream__btn {
  padding: 7px 14px; border-radius: var(--pg-radius-sm); border: 1px solid var(--pg-border);
  background: var(--pg-surface-2); color: var(--pg-text); cursor: pointer; font-size: .82rem;
  transition: all .15s;
}
.stream__btn:disabled { opacity: .4; cursor: not-allowed; }
.stream__btn:not(:disabled):hover { border-color: var(--pg-primary); color: var(--pg-primary); }
.stream__btn--primary { background: var(--pg-primary); color: #fff; border-color: var(--pg-primary); }
.stream__btn--primary:not(:disabled):hover { opacity: .85; color: #fff; }
.stream__btn--danger { color: var(--pg-rose); border-color: var(--pg-rose); }
.stream__btn--danger:not(:disabled):hover { background: var(--pg-rose-dim); }
.stream__speed-label { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.stream__range { accent-color: var(--pg-primary); }
.stream__textarea {
  background: var(--pg-surface-2); border: 1px solid var(--pg-border); border-radius: var(--pg-radius-sm);
  color: var(--pg-text); padding: 10px; font-size: .85rem; font-family: inherit; resize: vertical; outline: none;
}
.stream__textarea:focus { border-color: var(--pg-primary); }
.stream__tokens {
  background: var(--pg-surface-2); border: 1px solid var(--pg-border); border-radius: var(--pg-radius-sm);
  padding: 12px; min-height: 60px; font-family: monospace; font-size: .82rem; line-height: 1.8; word-break: break-all;
}
.stream__token { transition: color .1s; }

/* Queue panel */
.stream__queue-header { display: flex; align-items: center; gap: 10px; }
.stream__queue-warn { background: rgba(245,158,11,.12); border: 1px solid #f59e0b; color: #f59e0b; border-radius: 9999px; padding: 2px 10px; font-size: .75rem; font-weight: 600; }
.stream__flush-btn {
  margin-left: auto; padding: 5px 12px; background: none; border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text-muted); cursor: pointer; font-size: .75rem;
}
.stream__flush-btn:disabled { opacity: .4; cursor: not-allowed; }
.stream__current {
  background: var(--pg-surface-2); border: 1px solid var(--pg-cyan); border-radius: var(--pg-radius-sm);
  padding: 12px; display: flex; flex-direction: column; gap: 6px; min-height: 60px;
}
.stream__current--idle { border-color: var(--pg-border); display: flex; align-items: center; }
.stream__current-text { margin: 0; font-size: .88rem; color: var(--pg-text); line-height: 1.5; }
.stream__queue-list { display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow-y: auto; }
.stream__queue-empty { font-size: .82rem; text-align: center; padding: 16px; }
.stream__queue-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  background: var(--pg-surface-2); border-radius: var(--pg-radius-sm); font-size: .82rem;
  border-left: 3px solid transparent;
}
.stream__queue-item--current { border-color: var(--pg-cyan); }
.stream__queue-pos { color: var(--pg-text-muted); min-width: 18px; text-align: right; font-size: .75rem; }
.stream__queue-text { flex: 1; color: var(--pg-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stream__legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 4px; }
.stream__legend-item { display: flex; align-items: center; gap: 5px; }
.stream__legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
</style>

