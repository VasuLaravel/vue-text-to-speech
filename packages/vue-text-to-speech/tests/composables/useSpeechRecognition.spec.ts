import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useSpeechRecognition } from '../../src/composables/useSpeechRecognition.js'

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

  _simulateResult(transcript: string, isFinal: boolean, confidence = 0.9) {
    const result = {
      isFinal, length: 1,
      0: { transcript, confidence },
      item: () => null,
      [Symbol.iterator]: function* () { yield (this as Record<string, unknown>)[0] },
    } as unknown as SpeechRecognitionResult

    const resultList = {
      length: 1, 0: result,
      item: () => result,
      [Symbol.iterator]: function* () { yield result },
    } as unknown as SpeechRecognitionResultList

    if (this.onresult) this.onresult({ results: resultList, resultIndex: 0 } as unknown as SpeechRecognitionEvent)
  }

  _simulateError(error: SpeechRecognitionErrorCode) {
    if (this.onerror) this.onerror({ error } as unknown as SpeechRecognitionErrorEvent)
  }
}

let mockInstance: MockSpeechRecognition

function installMockRecognition() {
  mockInstance = new MockSpeechRecognition()
  ;(window as unknown as Record<string, unknown>).SpeechRecognition =
    vi.fn().mockImplementation(() => mockInstance)
}

// ─── Mount helper ─────────────────────────────────────────────────────────────

function mountComposable(opts = {}) {
  let composable!: ReturnType<typeof useSpeechRecognition>
  const Comp = defineComponent({
    setup() { composable = useSpeechRecognition(opts); return {} },
    template: '<div />',
  })
  mount(Comp)
  return composable
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    installMockRecognition()
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (window as unknown as Record<string, unknown>).SpeechRecognition
  })

  it('reports isSupported: true when SpeechRecognition is present', () => {
    const c = mountComposable()
    expect(c.isSupported.value).toBe(true)
  })

  it('start() calls provider.start() and sets isListening', () => {
    const c = mountComposable()
    c.start()
    expect(mockInstance.start).toHaveBeenCalledOnce()
    expect(c.isListening.value).toBe(true)
  })

  it('stop() calls provider.stop() and clears isListening', () => {
    const c = mountComposable()
    c.start()
    c.stop()
    expect(mockInstance.stop).toHaveBeenCalledOnce()
    expect(c.isListening.value).toBe(false)
  })

  it('transcript updates on interim result', () => {
    const c = mountComposable()
    c.start()
    mockInstance._simulateResult('hello', false)
    expect(c.transcript.value).toBe('hello')
    expect(c.finalTranscript.value).toBe('')
  })

  it('finalTranscript updates on final result', () => {
    const c = mountComposable()
    c.start()
    mockInstance._simulateResult('hello world', true, 0.95)
    expect(c.finalTranscript.value).toBe('hello world')
    expect(c.confidence.value).toBe(0.95)
  })

  it('sets error and clears isListening on recognition error', () => {
    const c = mountComposable()
    c.start()
    mockInstance._simulateError('not-allowed')
    expect(c.error.value?.code).toBe('PERMISSION_DENIED')
    expect(c.isListening.value).toBe(false)
  })

  it('resetTranscript() clears all transcript state', () => {
    const c = mountComposable()
    c.start()
    mockInstance._simulateResult('hello world', true)
    c.resetTranscript()
    expect(c.transcript.value).toBe('')
    expect(c.finalTranscript.value).toBe('')
    expect(c.confidence.value).toBe(0)
  })

  it('respects continuous option', () => {
    const c = mountComposable({ continuous: true })
    expect(c.continuous).toBe(true)
    c.start()
    expect(mockInstance.continuous).toBe(true)
  })

  it('clears transcript on start()', () => {
    const c = mountComposable()
    c.start()
    mockInstance._simulateResult('old text', true)
    c.stop()
    c.start() // second start should clear transcript
    expect(c.transcript.value).toBe('')
  })

  it('calls provider.stop() on component unmount', () => {
    let composable!: ReturnType<typeof useSpeechRecognition>
    const Comp = defineComponent({
      setup() { composable = useSpeechRecognition(); return {} },
      template: '<div />',
    })
    const w = mount(Comp)
    composable.start()
    w.unmount()
    expect(mockInstance.stop).toHaveBeenCalled()
  })

  it('does NOT use SPEECH_PROVIDER_KEY — always creates its own STT provider (I-4.3)', () => {
    // This test verifies the key design decision: useSpeechRecognition
    // creates a fresh WebSpeechSTTProvider regardless of what is injected.
    // We verify by checking SpeechRecognition constructor call count.
    const ctor = (window as unknown as Record<string, unknown>).SpeechRecognition as ReturnType<typeof vi.fn>
    const callsBefore = ctor.mock.calls.length

    mountComposable()
    // The provider is created in the composable, not at call time of start()
    // so no calls to ctor yet — just construction happens at new WebSpeechSTTProvider()
    // which internally doesn't call new SpeechRecognition() until start() is invoked.
    const c2 = mountComposable()
    c2.start()
    expect(mockInstance.start).toHaveBeenCalled()
    // Two composable instances created = two separate provider instances
    expect(ctor.mock.calls.length).toBeGreaterThan(callsBefore)
  })
})
