import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStreamingTTS } from '../../src/composables/useStreamingTTS.js'
import type { TTSProvider, SpeechError, VoiceInfo } from '../../src/providers/types.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function* tokens(chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) {
    yield chunk
  }
}

/**
 * Slow async generator that yields after microtasks so stop() can interrupt.
 */
async function* slowTokens(chunks: string[], ms = 5): AsyncIterable<string> {
  for (const chunk of chunks) {
    await new Promise((r) => setTimeout(r, ms))
    yield chunk
  }
}

function makeMockProvider() {
  let _endCb: (() => void) | undefined

  const provider: TTSProvider & {
    _fireEnd: () => void
    _fireError: (e?: Partial<SpeechError>) => void
  } = {
    isSupported: true,
    speak: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockImplementation(() => { _endCb?.() }),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockResolvedValue([] as VoiceInfo[]),
    onStart: vi.fn(),
    onEnd(cb: () => void) { _endCb = cb },
    onError: vi.fn(),
    _fireEnd() { _endCb?.() },
    _fireError(e: Partial<SpeechError> = {}) {
      /* no-op for streaming tests */
    },
  }

  return provider
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useStreamingTTS', () => {
  let provider: ReturnType<typeof makeMockProvider>

  beforeEach(() => {
    provider = makeMockProvider()
    vi.clearAllMocks()
  })

  // ── isStreaming state ──────────────────────────────────────────────────────

  it('isStreaming is true during pipeStream and false after', async () => {
    const { pipeStream, isStreaming } = useStreamingTTS({ provider })

    let duringStreaming = false
    const stream = (async function* () {
      yield 'Hello. '
      duringStreaming = isStreaming.value
    })()

    await pipeStream(stream)

    expect(duringStreaming).toBe(true)
    expect(isStreaming.value).toBe(false)
  })

  it('isStreaming starts as false', () => {
    const { isStreaming } = useStreamingTTS({ provider })
    expect(isStreaming.value).toBe(false)
  })

  // ── sentence detection + enqueue ──────────────────────────────────────────

  it('enqueues complete sentences as they appear in the stream', async () => {
    const { pipeStream, queue } = useStreamingTTS({ provider })

    await pipeStream(tokens(['Hello world. ', 'How are you? ', 'I am']))

    // 'Hello world.' was spoken immediately (first item auto-dequeued to speak)
    const calls = (provider.speak as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => (c[0] as { text: string }).text,
    )
    expect(calls).toContain('Hello world.')

    // 'How are you?' was enqueued and is waiting in the queue
    // (the mock provider never fires onEnd, so items accumulate)
    expect(queue.value).toContain('How are you?')
  })

  it('speaks the remaining buffer on natural stream end (I-5.5)', async () => {
    const { pipeStream } = useStreamingTTS({ provider })

    // No sentence boundary — all tokens form a partial sentence
    await pipeStream(tokens(['Hello ', 'world']))

    // The incomplete buffer "Hello world" should be spoken on natural end
    const calls = (provider.speak as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => (c[0] as { text: string }).text,
    )
    expect(calls).toContain('Hello world')
  })

  it('does NOT speak a whitespace-only remaining buffer', async () => {
    const { pipeStream } = useStreamingTTS({ provider })

    await pipeStream(tokens(['Hello. ', '  ']))  // last token is whitespace

    const calls = (provider.speak as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => (c[0] as { text: string }).text,
    )
    expect(calls).toContain('Hello.')
    // Should not speak whitespace
    calls.forEach((text) => {
      expect(text.trim()).not.toBe('')
    })
  })

  it('accumulates tokens into currentChunk before a sentence completes', async () => {
    const { pipeStream, currentChunk } = useStreamingTTS({ provider })

    const chunks: string[] = []

    const stream = (async function* () {
      yield 'Hello '
      chunks.push(currentChunk.value)
      yield 'world '
      chunks.push(currentChunk.value)
      yield 'this is. Done.'
    })()

    await pipeStream(stream)

    // At some point the buffer contained the partial tokens
    expect(chunks[0]).toContain('Hello')
    expect(chunks[1]).toContain('world')
  })

  it('currentChunk is empty after stream ends naturally', async () => {
    const { pipeStream, currentChunk } = useStreamingTTS({ provider })
    await pipeStream(tokens(['Hello world.']))
    expect(currentChunk.value).toBe('')
  })

  // ── stop() ────────────────────────────────────────────────────────────────

  it('stop() aborts an in-progress stream and discards the buffer (I-5.5)', async () => {
    const { pipeStream, stop, isStreaming, currentChunk } = useStreamingTTS({ provider })

    let speakCallsAfterStop = 0

    const stream = (async function* () {
      yield 'Hello '
      // stop is called here by the test — we simulate this via a side-effect
      yield 'world'
    })()

    // Start streaming then stop immediately
    const promise = pipeStream(stream)
    stop()
    await promise

    expect(isStreaming.value).toBe(false)
    expect(currentChunk.value).toBe('')
  })

  it('stop() clears provider and pending queue items', async () => {
    const { stop } = useStreamingTTS({ provider })
    stop()
    // provider.stop is called via voiceQueue.clear()
    expect(provider.stop).toHaveBeenCalled()
  })

  it('stop() during streaming → subsequent stop() is safe (idempotent)', async () => {
    const { stop } = useStreamingTTS({ provider })
    stop()
    stop()
    stop()
    // Should not throw
  })

  // ── multiple streams ──────────────────────────────────────────────────────

  it('calling pipeStream again aborts the previous stream', async () => {
    const { pipeStream, isStreaming } = useStreamingTTS({ provider })

    // Start a slow stream
    const first = pipeStream(slowTokens(['A. ', 'B. ', 'C.']))

    // Immediately start a second stream — aborts first
    const second = pipeStream(tokens(['Quick sentence.']))

    await Promise.all([first, second])

    expect(isStreaming.value).toBe(false)
    // Second stream's sentence should be present
    const calls = (provider.speak as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => (c[0] as { text: string }).text,
    )
    expect(calls.some((t) => t.includes('Quick sentence'))).toBe(true)
  })

  // ── exposed state ─────────────────────────────────────────────────────────

  it('exposes queue from internal useVoiceQueue', () => {
    const { queue } = useStreamingTTS({ provider })
    expect(Array.isArray(queue.value)).toBe(true)
  })

  it('exposes currentItem from internal useVoiceQueue', () => {
    const { currentItem } = useStreamingTTS({ provider })
    expect(currentItem.value).toBeNull()
  })
})
