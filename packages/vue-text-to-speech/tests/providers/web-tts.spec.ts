import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebSpeechTTSProvider } from '../../src/providers/WebSpeechTTSProvider.js'

// ─── Mock SpeechSynthesis ─────────────────────────────────────────────────────

function makeMockSpeechSynthesis() {
  let voices: SpeechSynthesisVoice[] = []
  const listeners: Record<string, EventListener[]> = {}

  const mock = {
    speaking: false,
    paused: false,
    pending: false,
    speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
      mock.speaking = true
      // Simulate async utterance completion
      setTimeout(() => {
        mock.speaking = false
        utterance.dispatchEvent(new Event('start'))
        utterance.dispatchEvent(new Event('end'))
      }, 0)
    }),
    cancel: vi.fn(() => {
      mock.speaking = false
    }),
    pause: vi.fn(() => {
      mock.paused = true
    }),
    resume: vi.fn(() => {
      mock.paused = false
    }),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn((type: string, cb: EventListener) => {
      listeners[type] ??= []
      listeners[type].push(cb)
    }),
    removeEventListener: vi.fn((type: string, cb: EventListener) => {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== cb)
    }),
    dispatchEvent: vi.fn(),
    // Test helper: set available voices and fire voiceschanged
    _setVoices(v: SpeechSynthesisVoice[]) {
      voices = v
      ;(listeners['voiceschanged'] ?? []).forEach((cb) => cb(new Event('voiceschanged')))
    },
  }

  return mock
}

function makeMockVoice(overrides: Partial<SpeechSynthesisVoice> = {}): SpeechSynthesisVoice {
  return {
    voiceURI: 'Google US English',
    name: 'Google US English',
    lang: 'en-US',
    default: true,
    localService: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    ...overrides,
  } as unknown as SpeechSynthesisVoice
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WebSpeechTTSProvider', () => {
  let mockSynth: ReturnType<typeof makeMockSpeechSynthesis>

  beforeEach(() => {
    mockSynth = makeMockSpeechSynthesis()
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSynth,
      writable: true,
      configurable: true,
    })

    // Ensure SpeechSynthesisUtterance exists in jsdom
    if (!('SpeechSynthesisUtterance' in window)) {
      ;(window as unknown as Record<string, unknown>)['SpeechSynthesisUtterance'] =
        class SpeechSynthesisUtterance extends EventTarget {
          text = ''
          rate = 1
          pitch = 1
          volume = 1
          voice: SpeechSynthesisVoice | null = null
          onstart: ((e: Event) => void) | null = null
          onend: ((e: Event) => void) | null = null
          onerror: ((e: SpeechSynthesisErrorEvent) => void) | null = null
          constructor(text?: string) {
            super()
            if (text) this.text = text
          }
          override dispatchEvent(event: Event): boolean {
            super.dispatchEvent(event)
            if (event.type === 'start' && this.onstart) this.onstart(event)
            if (event.type === 'end' && this.onend) this.onend(event)
            return true
          }
        }
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports isSupported: true when speechSynthesis is present', () => {
    const provider = new WebSpeechTTSProvider()
    expect(provider.isSupported).toBe(true)
  })

  it('calls window.speechSynthesis.speak()', async () => {
    const provider = new WebSpeechTTSProvider()
    await provider.speak({ text: 'Hello' })
    expect(mockSynth.speak).toHaveBeenCalledOnce()
  })

  it('calls window.speechSynthesis.cancel() on stop()', () => {
    const provider = new WebSpeechTTSProvider()
    provider.stop()
    expect(mockSynth.cancel).toHaveBeenCalledOnce()
  })

  it('calls window.speechSynthesis.pause() / resume()', () => {
    const provider = new WebSpeechTTSProvider()
    provider.pause()
    expect(mockSynth.pause).toHaveBeenCalledOnce()
    provider.resume()
    expect(mockSynth.resume).toHaveBeenCalledOnce()
  })

  it('fires onStart and onEnd callbacks', async () => {
    const provider = new WebSpeechTTSProvider()
    const startSpy = vi.fn()
    const endSpy = vi.fn()
    provider.onStart(startSpy)
    provider.onEnd(endSpy)
    await provider.speak({ text: 'Test' })
    expect(startSpy).toHaveBeenCalledOnce()
    expect(endSpy).toHaveBeenCalledOnce()
  })

  it('applies rate, pitch, volume options to the utterance', async () => {
    let capturedUtterance: SpeechSynthesisUtterance | null = null
    mockSynth.speak.mockImplementation((u: SpeechSynthesisUtterance) => {
      capturedUtterance = u
      setTimeout(() => {
        u.dispatchEvent(new Event('start'))
        u.dispatchEvent(new Event('end'))
      }, 0)
    })

    const provider = new WebSpeechTTSProvider()
    await provider.speak({ text: 'Test', rate: 1.5, pitch: 0.8, volume: 0.5 })

    expect(capturedUtterance?.rate).toBe(1.5)
    expect(capturedUtterance?.pitch).toBe(0.8)
    expect(capturedUtterance?.volume).toBe(0.5)
  })

  describe('getVoices()', () => {
    it('resolves immediately when voices are already loaded', async () => {
      const voice = makeMockVoice()
      mockSynth.getVoices.mockReturnValue([voice])

      const provider = new WebSpeechTTSProvider()
      const voices = await provider.getVoices()

      expect(voices).toHaveLength(1)
      expect(voices[0].id).toBe('Google US English')
      expect(voices[0].lang).toBe('en-US')
      expect(voices[0].default).toBe(true)
    })

    it('waits for voiceschanged event when voices are not immediately available', async () => {
      mockSynth.getVoices.mockReturnValue([])

      const provider = new WebSpeechTTSProvider()
      const voicesPromise = provider.getVoices()

      // Simulate Chrome async voice loading
      const voice = makeMockVoice()
      mockSynth.getVoices.mockReturnValue([voice])
      mockSynth._setVoices([voice])

      const voices = await voicesPromise
      expect(voices).toHaveLength(1)
    })

    it('returns the same Promise on repeated calls (cached)', async () => {
      const voice = makeMockVoice()
      mockSynth.getVoices.mockReturnValue([voice])

      const provider = new WebSpeechTTSProvider()
      const p1 = provider.getVoices()
      const p2 = provider.getVoices()
      expect(p1).toBe(p2)
    })

    it('resolves with empty array after 3s timeout when voiceschanged never fires', async () => {
      vi.useFakeTimers()
      mockSynth.getVoices.mockReturnValue([])

      const provider = new WebSpeechTTSProvider()
      const voicesPromise = provider.getVoices()

      vi.advanceTimersByTime(3001)
      const voices = await voicesPromise
      expect(voices).toHaveLength(0)

      vi.useRealTimers()
    })
  })
})
