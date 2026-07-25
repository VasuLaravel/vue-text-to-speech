import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebSpeechSTTProvider } from '../../src/providers/WebSpeechSTTProvider.js'

// ─── Mock SpeechRecognition ───────────────────────────────────────────────────

class MockSpeechRecognition extends EventTarget {
  lang = ''
  interimResults = false
  continuous = false
  maxAlternatives = 1

  start = vi.fn()
  stop = vi.fn()

  onresult: ((e: SpeechRecognitionEvent) => void) | null = null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null = null

  /** Test helper — simulate a recognition result */
  _simulateResult(transcript: string, isFinal: boolean, confidence = 0.9) {
    const result = {
      isFinal,
      length: 1,
      0: { transcript, confidence },
      [Symbol.iterator]: function* () {
        yield this[0]
      },
      item: (i: number) => (i === 0 ? { transcript, confidence } : null),
    } as unknown as SpeechRecognitionResult

    const resultList = {
      length: 1,
      0: result,
      item: (i: number) => (i === 0 ? result : null),
      [Symbol.iterator]: function* () {
        yield result
      },
    } as unknown as SpeechRecognitionResultList

    const event = {
      results: resultList,
      resultIndex: 0,
    } as unknown as SpeechRecognitionEvent

    if (this.onresult) this.onresult(event)
  }

  /** Test helper — simulate a recognition error */
  _simulateError(error: SpeechRecognitionErrorCode) {
    const event = { error } as unknown as SpeechRecognitionErrorEvent
    if (this.onerror) this.onerror(event)
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WebSpeechSTTProvider', () => {
  let mockRecognitionInstance: MockSpeechRecognition

  beforeEach(() => {
    mockRecognitionInstance = new MockSpeechRecognition()

    const MockCtor = vi.fn().mockImplementation(() => mockRecognitionInstance)
    ;(window as unknown as Record<string, unknown>)['SpeechRecognition'] = MockCtor
    delete (window as unknown as Record<string, unknown>)['webkitSpeechRecognition']
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (window as unknown as Record<string, unknown>)['SpeechRecognition']
  })

  it('reports isSupported: true when SpeechRecognition is present', () => {
    const provider = new WebSpeechSTTProvider()
    expect(provider.isSupported).toBe(true)
  })

  it('reports isSupported: false when SpeechRecognition is absent', () => {
    delete (window as unknown as Record<string, unknown>)['SpeechRecognition']
    const provider = new WebSpeechSTTProvider()
    expect(provider.isSupported).toBe(false)
  })

  it('falls back to webkitSpeechRecognition', () => {
    delete (window as unknown as Record<string, unknown>)['SpeechRecognition']
    ;(window as unknown as Record<string, unknown>)['webkitSpeechRecognition'] =
      vi.fn().mockImplementation(() => mockRecognitionInstance)
    const provider = new WebSpeechSTTProvider()
    expect(provider.isSupported).toBe(true)
  })

  it('calls start() on the underlying recognition instance', () => {
    const provider = new WebSpeechSTTProvider()
    provider.start()
    expect(mockRecognitionInstance.start).toHaveBeenCalledOnce()
  })

  it('calls stop() on the underlying recognition instance', () => {
    const provider = new WebSpeechSTTProvider()
    provider.start()
    provider.stop()
    expect(mockRecognitionInstance.stop).toHaveBeenCalledOnce()
  })

  it('fires onTranscript for interim results', () => {
    const provider = new WebSpeechSTTProvider()
    const cb = vi.fn()
    provider.onTranscript(cb)
    provider.start()
    mockRecognitionInstance._simulateResult('hello', false, 0.7)
    expect(cb).toHaveBeenCalledWith('hello', 0.7)
  })

  it('fires onFinalTranscript for final results', () => {
    const provider = new WebSpeechSTTProvider()
    const cb = vi.fn()
    provider.onFinalTranscript(cb)
    provider.start()
    mockRecognitionInstance._simulateResult('hello world', true, 0.95)
    expect(cb).toHaveBeenCalledWith('hello world', 0.95)
  })

  it('does NOT fire onFinalTranscript for interim results', () => {
    const provider = new WebSpeechSTTProvider()
    const finalCb = vi.fn()
    provider.onFinalTranscript(finalCb)
    provider.start()
    mockRecognitionInstance._simulateResult('partial', false)
    expect(finalCb).not.toHaveBeenCalled()
  })

  it('maps not-allowed error to PERMISSION_DENIED', () => {
    const provider = new WebSpeechSTTProvider()
    const errorCb = vi.fn()
    provider.onError(errorCb)
    provider.start()
    mockRecognitionInstance._simulateError('not-allowed')
    expect(errorCb).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PERMISSION_DENIED' }),
    )
  })

  it('maps network error to NETWORK', () => {
    const provider = new WebSpeechSTTProvider()
    const errorCb = vi.fn()
    provider.onError(errorCb)
    provider.start()
    mockRecognitionInstance._simulateError('network')
    expect(errorCb).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'NETWORK' }),
    )
  })

  it('forwards continuous option to the recognition instance', () => {
    const provider = new WebSpeechSTTProvider({ continuous: true })
    expect(provider.continuous).toBe(true)
    provider.start()
    expect(mockRecognitionInstance.continuous).toBe(true)
  })

  it('emits PERMISSION_DENIED error (no crash) when unsupported and start() called', () => {
    delete (window as unknown as Record<string, unknown>)['SpeechRecognition']
    delete (window as unknown as Record<string, unknown>)['webkitSpeechRecognition']
    const provider = new WebSpeechSTTProvider()
    const errorCb = vi.fn()
    provider.onError(errorCb)
    expect(() => provider.start()).not.toThrow()
    expect(errorCb).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'NOT_SUPPORTED' }),
    )
  })
})
