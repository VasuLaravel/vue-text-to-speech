import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVoiceQueue } from '../../src/composables/useVoiceQueue.js'
import type { TTSProvider, SpeechError, VoiceInfo, SpeakOptions } from '../../src/providers/types.js'

// ─── Mock Provider factory ─────────────────────────────────────────────────────

function makeMockProvider() {
  let _startCb: (() => void) | undefined
  let _endCb: (() => void) | undefined
  let _errorCb: ((e: SpeechError) => void) | undefined

  const provider: TTSProvider & {
    _fireEnd: () => void
    _fireError: (e?: Partial<SpeechError>) => void
  } = {
    isSupported: true,
    speak: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockResolvedValue([] as VoiceInfo[]),
    onStart(cb: () => void) { _startCb = cb },
    onEnd(cb: () => void) { _endCb = cb },
    onError(cb: (e: SpeechError) => void) { _errorCb = cb },
    _fireEnd() { _endCb?.() },
    _fireError(e: Partial<SpeechError> = {}) {
      _errorCb?.({
        code: e.code ?? 'UNKNOWN',
        message: e.message ?? 'mock error',
      })
    },
  }

  return provider
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useVoiceQueue', () => {
  let provider: ReturnType<typeof makeMockProvider>

  beforeEach(() => {
    provider = makeMockProvider()
    vi.clearAllMocks()
  })

  // ── enqueue ────────────────────────────────────────────────────────────────

  it('starts speaking immediately when idle', () => {
    const { enqueue, isPlaying, currentItem, queue } = useVoiceQueue({ provider })

    enqueue('Hello world.')

    expect(provider.speak).toHaveBeenCalledOnce()
    expect(provider.speak).toHaveBeenCalledWith({ text: 'Hello world.' })
    expect(isPlaying.value).toBe(true)
    expect(currentItem.value).toBe('Hello world.')
    // item was dequeued immediately to be spoken
    expect(queue.value).toHaveLength(0)
  })

  it('subsequent enqueues are queued while speaking', () => {
    const { enqueue, queue, isPlaying } = useVoiceQueue({ provider })

    enqueue('First.')
    enqueue('Second.')
    enqueue('Third.')

    // Only first one spoken immediately
    expect(provider.speak).toHaveBeenCalledOnce()
    expect(provider.speak).toHaveBeenCalledWith({ text: 'First.' })
    // Remaining two are in the queue
    expect(queue.value).toHaveLength(2)
    expect(queue.value[0]).toBe('Second.')
    expect(queue.value[1]).toBe('Third.')
    expect(isPlaying.value).toBe(true)
  })

  it('auto-advances to next item on onEnd', () => {
    const { enqueue, queue, currentItem, isPlaying } = useVoiceQueue({ provider })

    enqueue('First.')
    enqueue('Second.')

    expect(provider.speak).toHaveBeenCalledTimes(1)
    expect(currentItem.value).toBe('First.')

    // Simulate first utterance end
    provider._fireEnd()

    expect(provider.speak).toHaveBeenCalledTimes(2)
    expect(provider.speak).toHaveBeenLastCalledWith({ text: 'Second.' })
    expect(currentItem.value).toBe('Second.')
    expect(queue.value).toHaveLength(0)
    expect(isPlaying.value).toBe(true)
  })

  it('sets isPlaying=false when queue is exhausted after onEnd', () => {
    const { enqueue, isPlaying, currentItem } = useVoiceQueue({ provider })

    enqueue('Only item.')

    provider._fireEnd()

    expect(isPlaying.value).toBe(false)
    expect(currentItem.value).toBeNull()
  })

  it('speaks items in FIFO order', () => {
    const { enqueue } = useVoiceQueue({ provider })

    enqueue('A.')
    enqueue('B.')
    enqueue('C.')

    provider._fireEnd()
    provider._fireEnd()
    provider._fireEnd()

    const calls = (provider.speak as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => (c[0] as SpeakOptions).text,
    )
    expect(calls).toEqual(['A.', 'B.', 'C.'])
  })

  it('ignores onEnd when isPlaying is false (guard against double-advance)', () => {
    const { isPlaying } = useVoiceQueue({ provider })

    // Fire onEnd without ever enqueuing — queue was never the one speaking
    expect(isPlaying.value).toBe(false)
    provider._fireEnd()

    expect(provider.speak).not.toHaveBeenCalled()
    expect(isPlaying.value).toBe(false)
  })

  // ── clear ──────────────────────────────────────────────────────────────────

  it('clear() stops provider and empties queue', () => {
    const { enqueue, clear, queue, isPlaying, currentItem } = useVoiceQueue({ provider })

    enqueue('Item 1.')
    enqueue('Item 2.')
    enqueue('Item 3.')

    clear()

    expect(provider.stop).toHaveBeenCalledOnce()
    expect(queue.value).toHaveLength(0)
    expect(isPlaying.value).toBe(false)
    expect(currentItem.value).toBeNull()
  })

  it('clear() stops even when idle', () => {
    const { clear } = useVoiceQueue({ provider })
    clear()
    expect(provider.stop).toHaveBeenCalledOnce()
  })

  // ── skip ───────────────────────────────────────────────────────────────────

  it('skip() calls provider.stop() to skip current utterance', () => {
    const { enqueue, skip } = useVoiceQueue({ provider })

    enqueue('Current.')
    enqueue('Next.')
    skip()

    expect(provider.stop).toHaveBeenCalledOnce()
  })

  it('skip() → onEnd fires → next item starts', () => {
    const { enqueue, skip, currentItem } = useVoiceQueue({ provider })

    enqueue('Current.')
    enqueue('Next.')
    skip()

    // Simulate the interrupted/canceled onEnd that stop() triggers
    provider._fireEnd()

    expect(provider.speak).toHaveBeenCalledTimes(2)
    expect(currentItem.value).toBe('Next.')
  })

  // ── dequeue ────────────────────────────────────────────────────────────────

  it('dequeue() pops the first pending item without speaking', () => {
    const { enqueue, dequeue, queue } = useVoiceQueue({ provider })

    enqueue('Speaking...')  // auto-starts
    enqueue('Pending 1.')
    enqueue('Pending 2.')

    const removed = dequeue()

    expect(removed).toBe('Pending 1.')
    expect(queue.value).toHaveLength(1)
    expect(queue.value[0]).toBe('Pending 2.')
  })

  it('dequeue() returns undefined on empty queue', () => {
    const { dequeue } = useVoiceQueue({ provider })
    expect(dequeue()).toBeUndefined()
  })

  // ── edge cases ─────────────────────────────────────────────────────────────

  it('enqueue ignores empty strings', () => {
    const { enqueue, queue, isPlaying } = useVoiceQueue({ provider })
    enqueue('')
    enqueue('   ')
    expect(queue.value).toHaveLength(0)
    expect(isPlaying.value).toBe(false)
    expect(provider.speak).not.toHaveBeenCalled()
  })

  it('enqueue re-starts after queue was exhausted', () => {
    const { enqueue, isPlaying } = useVoiceQueue({ provider })

    enqueue('First batch.')
    provider._fireEnd()  // queue exhausted
    expect(isPlaying.value).toBe(false)

    enqueue('Second batch.')
    expect(isPlaying.value).toBe(true)
    expect(provider.speak).toHaveBeenCalledTimes(2)
  })
})
