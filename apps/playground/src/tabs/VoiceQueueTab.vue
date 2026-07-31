<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVoiceQueue } from 'vue-text-to-speech'
import { useVoiceInjectedProvider } from '../composables/useBestWebVoice'
import WaveformCanvas from '../components/WaveformCanvas.vue'
import { useFakeWaveform } from '../composables/useFakeWaveform'
import { useToast } from '../composables/useToast'
import { useTabEntrance } from '../composables/useTabEntrance'

const provider = useVoiceInjectedProvider()
const {
  queue, currentItem, isPlaying,
  enqueue, clear, skip,
} = useVoiceQueue({ provider })

const inputText = ref('')
const errorMsg = ref('')

// ── Fake waveform (isPlaying = something is being spoken) ─────────────────
const isSpeakingQueue = computed(() => isPlaying.value ?? false)
const { waveformData } = useFakeWaveform(isSpeakingQueue)
const { success: toastSuccess } = useToast()
useTabEntrance()

// ── Chips ──────────────────────────────────────────────────────────────────────
const CHIPS = [
  'Hello, how are you?',
  'How can I help you today?',
  'Processing your request…',
  'Your order has been confirmed.',
  'Thank you and have a great day!',
]

function fillChip(text: string) { inputText.value = text }

// ── Enqueue ────────────────────────────────────────────────────────────────────
function addToQueue() {
  const text = inputText.value.trim()
  if (!text) { errorMsg.value = 'Please enter some text first.'; return }
  errorMsg.value = ''
  enqueue(text)
  inputText.value = ''
  toastSuccess('Added to queue')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addToQueue() }
}

// ── Play All ───────────────────────────────────────────────────────────────────
// The queue auto-plays — just enqueue; if already playing, enqueue adds to end
function playAll() {
  // If queue is empty nothing to do; items auto-advance via useVoiceQueue
  // Calling enqueue with the first item starts playback if idle
  // Since queue auto-starts, we just need to ensure it's not paused/stopped
  // Re-enqueue all items in order by rebuilding (dequeue all + re-enqueue)
  if (!isPlaying.value && (queue.value?.length ?? 0) > 0) {
    // Snapshot current queue
    const items: string[] = [...(queue.value ?? [])]
    clear()
    items.forEach(item => enqueue(String(item)))
  }
}

// ── Remove item by index ───────────────────────────────────────────────────────
function removeItem(index: number) {
  const arr = [...(queue.value ?? [])]
  arr.splice(index, 1)
  const wasCurrent = currentItem.value
  clear()
  arr.forEach(t => enqueue(String(t)))
  // If something was being spoken before the rebuild, skip to advance to new first item
  if (wasCurrent && arr.length > 0 && !isPlaying.value) {
    // queue auto-starts on first enqueue; no extra action needed
  }
}

const queueItems = computed(() => queue.value ?? [])
</script>

<template>
  <div class="vq">
    <!-- Add to queue -->
    <div class="vq__add pg-card">
      <div class="pg-label" style="margin-bottom: 10px">Add to Queue</div>

      <!-- Quick-fill chips (T6.7) -->
      <div class="vq__chips" aria-label="Quick fill options">
        <button
          v-for="chip in CHIPS"
          :key="chip"
          class="vq__chip"
          :aria-label="`Fill: ${chip}`"
          @click="fillChip(chip)"
        >{{ chip.slice(0, 32) }}{{ chip.length > 32 ? '…' : '' }}</button>
      </div>

      <!-- Input -->
      <div class="vq__input-row">
        <textarea
          v-model="inputText"
          class="vq__textarea"
          rows="2"
          placeholder="Type text to enqueue…"
          aria-label="Text to enqueue"
          @keydown="onKeydown"
        />
        <button
          class="vq__enqueue-btn"
          :disabled="!inputText.trim()"
          :aria-disabled="!inputText.trim()"
          aria-label="Enqueue text"
          @click="addToQueue"
        >+ Enqueue</button>
      </div>
      <p v-if="errorMsg" class="vq__error" role="alert">{{ errorMsg }}</p>
    </div>

    <!-- Transport controls -->
    <div class="vq__transport">
      <button class="vq__btn vq__btn--primary" :disabled="queueItems.length === 0" @click="playAll()">▶ Play All</button>
      <button class="vq__btn" :disabled="!isPlaying" @click="skip()">⏭ Skip</button>
      <button class="vq__btn vq__btn--danger" :disabled="queueItems.length === 0 && !isPlaying" @click="clear()">✕ Clear Queue</button>
      <span v-if="isPlaying" class="pg-badge-speaking" role="status">● Speaking</span>
    </div>

    <!-- Queue list (T6.2–T6.6) -->
    <div class="vq__queue pg-card">
      <div class="pg-label" style="margin-bottom: 12px">
        Queue
        <span v-if="queueItems.length" class="vq__count">{{ queueItems.length }}</span>
      </div>

      <!-- Currently speaking row (above queued items) -->
      <div v-if="currentItem && isPlaying" class="vq__current">
        <span class="pg-badge-speaking">● Speaking</span>
        <span class="vq__current-text" :title="String(currentItem)">
          {{ String(currentItem).slice(0, 60) }}{{ String(currentItem).length > 60 ? '…' : '' }}
        </span>
        <WaveformCanvas :data="waveformData" color="#06b6d4" :height="20" :bar-count="16" style="flex-shrink:0;width:60px" />
      </div>

      <div v-if="queueItems.length === 0" class="vq__empty pg-text-muted">
        No items in queue. Add some text above to get started.
      </div>

      <ul class="vq__list" role="list" aria-live="polite" aria-label="Voice queue">
        <li
          v-for="(item, i) in queueItems"
          :key="i"
          class="vq__item"
          role="listitem"
        >
          <!-- Position badge (T6.3) -->
          <span class="vq__pos" aria-label="Position">{{ i + 1 }}</span>

          <!-- Text (60-char truncation T6.4) -->
          <span
            class="vq__text"
            :title="String(item)"
            :aria-label="String(item)"
          >{{ String(item).slice(0, 60) }}{{ String(item).length > 60 ? '…' : '' }}</span>

          <!-- Status badge (T6.5) -->
          <span class="vq__status-badge pg-badge-queued">queued</span>

          <!-- Remove button (T6.5) -->
          <button
            class="vq__remove"
            :aria-label="`Remove item ${i + 1}: ${String(item).slice(0, 30)}`"
            @click="removeItem(i)"
          >✕</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.vq { display: flex; flex-direction: column; gap: 14px; }
.vq__add { padding: 20px; }
.vq__chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.vq__chip {
  padding: 5px 12px; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: 9999px; color: var(--pg-text-muted); cursor: pointer; font-size: .78rem; transition: all .15s;
}
.vq__chip:hover { border-color: var(--pg-primary); color: var(--pg-primary); background: var(--pg-primary-dim); }
.vq__input-row { display: flex; gap: 8px; align-items: flex-end; }
.vq__textarea {
  flex: 1; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 10px; font-size: .85rem;
  font-family: inherit; resize: none; outline: none;
}
.vq__textarea:focus { border-color: var(--pg-primary); }
.vq__enqueue-btn {
  padding: 10px 18px; background: var(--pg-primary); color: #fff; border: none;
  border-radius: var(--pg-radius-sm); cursor: pointer; font-size: .85rem; font-weight: 600; white-space: nowrap;
  transition: opacity .15s;
}
.vq__enqueue-btn:disabled { opacity: .4; cursor: not-allowed; }
.vq__error { color: var(--pg-rose); font-size: .8rem; margin: 6px 0 0; }

.vq__transport { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.vq__btn {
  padding: 8px 16px; border-radius: var(--pg-radius-sm); border: 1px solid var(--pg-border);
  background: var(--pg-surface-2); color: var(--pg-text); cursor: pointer; font-size: .82rem; transition: all .15s;
}
.vq__btn:disabled { opacity: .4; cursor: not-allowed; }
.vq__btn:not(:disabled):hover { border-color: var(--pg-primary); color: var(--pg-primary); }
.vq__btn--primary { background: var(--pg-primary); color: #fff; border-color: var(--pg-primary); }
.vq__btn--primary:not(:disabled):hover { opacity: .85; color: #fff; }
.vq__btn--danger { color: var(--pg-rose); border-color: var(--pg-rose); }
.vq__btn--danger:not(:disabled):hover { background: var(--pg-rose-dim); }

.vq__queue { padding: 20px; }
.vq__count {
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--pg-primary-dim); color: var(--pg-primary); border-radius: 9999px;
  padding: 0 8px; font-size: .72rem; font-weight: 700; margin-left: 8px; min-width: 22px;
}
.vq__current {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px; margin-bottom: 8px;
  background: var(--pg-surface-2); border-radius: var(--pg-radius-sm); border-left: 3px solid var(--pg-cyan);
}
.vq__current-text { flex: 1; font-size: .85rem; color: var(--pg-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vq__empty { text-align: center; padding: 24px; font-size: .88rem; }
.vq__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.vq__item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: var(--pg-surface-2); border-radius: var(--pg-radius-sm);
  border-left: 3px solid transparent;
}
.vq__pos { color: var(--pg-text-muted); font-size: .75rem; min-width: 20px; text-align: right; flex-shrink: 0; }
.vq__text { flex: 1; font-size: .85rem; color: var(--pg-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vq__status-badge { font-size: .7rem; text-transform: uppercase; letter-spacing: .04em; flex-shrink: 0; }
.vq__remove {
  background: none; border: none; cursor: pointer; color: var(--pg-text-muted); font-size: .85rem;
  padding: 2px 6px; border-radius: var(--pg-radius-sm); transition: color .15s;
}
.vq__remove:hover { color: var(--pg-rose); }
</style>
