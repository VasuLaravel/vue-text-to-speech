import { shallowRef, readonly, inject, onUnmounted } from 'vue'
import { SPEECH_PROVIDER_KEY } from '../injectionKeys.js'
import { createWebSpeechProvider } from '../factory.js'
import { useVoiceQueue } from './useVoiceQueue.js'
import { extractCompleteSentences } from '../utils/sentenceBoundary.js'
import type { TTSProvider } from '../providers/types.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseStreamingTTSOptions {
  /** Override the injected provider */
  provider?: TTSProvider
}

export interface UseStreamingTTSReturn {
  /**
   * Pipe an `AsyncIterable<string>` (e.g. an LLM token stream) through the
   * sentence detector and into the voice queue.
   *
   * - Complete sentences are enqueued as they form.
   * - If the stream ends without a final sentence boundary, the remaining
   *   buffer is spoken as-is (I-5.5).
   * - Returns a Promise that resolves when the stream is exhausted.
   *   (It does NOT wait for all speech to finish.)
   */
  pipeStream(stream: AsyncIterable<string>): Promise<void>
  /** Sentences waiting to be spoken */
  readonly queue: ReturnType<typeof useVoiceQueue>['queue']
  /** The sentence currently being spoken */
  readonly currentItem: ReturnType<typeof useVoiceQueue>['currentItem']
  /** Partial token buffer being accumulated (incomplete sentence) */
  readonly currentChunk: ReturnType<typeof readonly<ReturnType<typeof shallowRef<string>>>>
  /** Whether a stream is currently being piped */
  readonly isStreaming: ReturnType<typeof readonly<ReturnType<typeof shallowRef<boolean>>>>
  /**
   * Stop the stream immediately and clear all pending speech.
   *
   * I-5.4: Uses `AbortController` — the async iterator exits on the next
   * `signal.aborted` check. Consumer iterables should also accept an
   * `AbortSignal` for full cancellation.
   * I-5.5: Partial buffer is **discarded** on stop().
   */
  stop(): void
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useStreamingTTS(options: UseStreamingTTSOptions = {}): UseStreamingTTSReturn {
  // I-5.3: inject > fallback
  let provider = options.provider ?? inject(SPEECH_PROVIDER_KEY, null)
  if (!provider) {
    provider = createWebSpeechProvider()
  }

  // Internal voice queue — shares the same provider
  const voiceQueue = useVoiceQueue({ provider })

  // ── Streaming state ──────────────────────────────────────────────────────────
  const isStreaming = shallowRef(false)
  const currentChunk = shallowRef('')
  let _controller: AbortController | null = null

  // ── pipeStream ───────────────────────────────────────────────────────────────
  async function pipeStream(stream: AsyncIterable<string>): Promise<void> {
    // Abort any previous stream still in flight
    _controller?.abort()
    const controller = new AbortController()
    _controller = controller

    isStreaming.value = true
    let buffer = ''
    currentChunk.value = ''

    try {
      for await (const chunk of stream) {
        // I-5.4: check abort on every token
        if (controller.signal.aborted) break

        buffer += chunk
        currentChunk.value = buffer

        // Extract complete sentences from the accumulated buffer
        const { sentences, remaining } = extractCompleteSentences(buffer)
        if (sentences.length > 0) {
          buffer = remaining
          currentChunk.value = remaining

          for (const sentence of sentences) {
            if (controller.signal.aborted) break
            voiceQueue.enqueue(sentence)
          }
        }
      }

      // I-5.5: stream ended naturally — speak whatever remains in the buffer
      if (!controller.signal.aborted && buffer.trim()) {
        voiceQueue.enqueue(buffer.trim())
        buffer = ''
        currentChunk.value = ''
      }
    } finally {
      if (controller === _controller) {
        _controller = null
      }
      isStreaming.value = false
      // I-5.5: on abort, discard partial buffer
      if (controller.signal.aborted) {
        currentChunk.value = ''
      }
    }
  }

  // ── stop ─────────────────────────────────────────────────────────────────────
  function stop(): void {
    _controller?.abort()
    _controller = null
    voiceQueue.clear()     // stops provider + empties pending queue
    currentChunk.value = ''
    isStreaming.value = false
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  onUnmounted(() => {
    stop()
  })

  return {
    pipeStream,
    queue: voiceQueue.queue,
    currentItem: voiceQueue.currentItem,
    currentChunk: readonly(currentChunk),
    isStreaming: readonly(isStreaming),
    stop,
  }
}
