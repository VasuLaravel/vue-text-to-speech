import { ref, readonly, inject, onUnmounted } from 'vue'
import { SPEECH_PROVIDER_KEY } from '../injectionKeys.js'
import { createWebSpeechProvider } from '../factory.js'
import type { TTSProvider } from '../providers/types.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseVoiceQueueOptions {
  /** Override the injected provider for this queue instance */
  provider?: TTSProvider
}

export interface UseVoiceQueueReturn {
  /** Items waiting to be spoken (does not include the currently-speaking item) */
  readonly queue: ReturnType<typeof readonly<ReturnType<typeof ref<string[]>>>>
  /** The text currently being spoken, or null if idle */
  readonly currentItem: ReturnType<typeof readonly<ReturnType<typeof ref<string | null>>>>
  /** Whether the queue is currently speaking something */
  readonly isPlaying: ReturnType<typeof readonly<ReturnType<typeof ref<boolean>>>>
  /** Add a text item to the end of the queue. Starts speaking immediately if idle */
  enqueue(text: string): void
  /**
   * Manually pop the next item from the queue without speaking it.
   * Useful for manual queue management; does NOT affect auto-advance behaviour.
   */
  dequeue(): string | undefined
  /** Stop the current utterance and discard all pending items */
  clear(): void
  /**
   * Stop the current utterance immediately.
   * Auto-advance fires the next item via `onEnd`.
   */
  skip(): void
}

// ─── Composable ───────────────────────────────────────────────────────────────

/**
 * Reactive voice queue — auto-advances to the next item when each utterance ends.
 *
 * The queue relies on the provider's `onEnd` hook (added in Sprint 2, I-2.1)
 * to advance automatically. The `isPlaying` flag guards against double-advance
 * when multiple composables share the same provider instance.
 *
 * All providers (WebSpeech + AI) consistently emit `onEnd` after every speak()
 * call, whether it ended normally or via an error.
 */
export function useVoiceQueue(options: UseVoiceQueueOptions = {}): UseVoiceQueueReturn {
  // I-5.3 / I-4.1 pattern: explicit > injected > fallback
  let provider = options.provider ?? inject(SPEECH_PROVIDER_KEY, null)
  if (!provider) {
    provider = createWebSpeechProvider()
  }
  const _provider: TTSProvider = provider

  // ── Reactive state ──────────────────────────────────────────────────────────
  // Use ref (not shallowRef) so array mutations (push/splice) are tracked
  const queue = ref<string[]>([])
  const currentItem = ref<string | null>(null)
  const isPlaying = ref(false)

  // ── Internal advance function ────────────────────────────────────────────────
  function advance(): void {
    if (queue.value.length === 0) {
      currentItem.value = null
      isPlaying.value = false
      return
    }

    const text = queue.value[0]
    // Splice is reactive
    queue.value.splice(0, 1)
    currentItem.value = text
    isPlaying.value = true

    // Errors are swallowed here — all providers emit onEnd after errors,
    // so the onEnd handler below will call advance() to keep the queue moving.
    _provider.speak({ text }).catch(() => { /* onEnd handles advancement */ })
  }

  // ── Auto-advance via provider onEnd hook (D-7 / I-2.1) ──────────────────────
  _provider.onEnd(() => {
    if (!isPlaying.value) return  // not our speak — another composable spoke
    advance()
  })

  // ── Public API ───────────────────────────────────────────────────────────────
  function enqueue(text: string): void {
    const trimmed = text.trim()
    if (!trimmed) return
    queue.value.push(trimmed)
    if (!isPlaying.value) {
      advance()
    }
  }

  function dequeue(): string | undefined {
    if (queue.value.length === 0) return undefined
    const item = queue.value[0]
    queue.value.splice(0, 1)
    return item
  }

  function clear(): void {
    queue.value.splice(0, queue.value.length)
    currentItem.value = null
    isPlaying.value = false
    _provider.stop()
  }

  function skip(): void {
    // stop() triggers onEnd (via interrupted/canceled) → advance() → next item
    _provider.stop()
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  onUnmounted(() => {
    clear()
  })

  return {
    queue: readonly(queue),
    currentItem: readonly(currentItem),
    isPlaying: readonly(isPlaying),
    enqueue,
    dequeue,
    clear,
    skip,
  }
}
