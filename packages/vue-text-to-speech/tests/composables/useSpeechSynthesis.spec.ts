import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, provide, nextTick } from 'vue'
import { useSpeechSynthesis } from '../../src/composables/useSpeechSynthesis.js'
import { SPEECH_PROVIDER_KEY } from '../../src/injectionKeys.js'
import type { TTSProvider, VoiceInfo, SpeechError } from '../../src/providers/types.js'

// ─── Mock TTSProvider factory ─────────────────────────────────────────────────

function makeMockProvider(
  overrides: Partial<TTSProvider> & { voices?: VoiceInfo[] } = {},
): TTSProvider & { _startCb?: () => void; _endCb?: () => void; _errorCb?: (e: SpeechError) => void } {
  const voices: VoiceInfo[] = overrides.voices ?? [
    { id: 'v1', name: 'Voice 1', lang: 'en-US', label: 'Voice 1', default: true },
    { id: 'v2', name: 'Voice 2', lang: 'en-GB', label: 'Voice 2', default: false },
  ]

  const mock: ReturnType<typeof makeMockProvider> = {
    isSupported: true,
    speak: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockResolvedValue(voices),
    onStart(cb) { mock._startCb = cb },
    onEnd(cb)   { mock._endCb = cb },
    onError(cb) { mock._errorCb = cb },
    ...overrides,
  }
  return mock
}

// ─── Test wrapper helpers ─────────────────────────────────────────────────────

function mountWithProvider(provider: TTSProvider) {
  let composable: ReturnType<typeof useSpeechSynthesis> | undefined

  const Wrapper = defineComponent({
    setup() {
      provide(SPEECH_PROVIDER_KEY, provider)
    },
    template: '<slot />',
  })

  const Child = defineComponent({
    setup() {
      composable = useSpeechSynthesis()
      return {}
    },
    template: '<div />',
  })

  mount(Wrapper, {
    slots: { default: Child },
    global: { components: { Child } },
  })

  return composable!
}

function mountWithoutProvider() {
  let composable: ReturnType<typeof useSpeechSynthesis> | undefined

  const Comp = defineComponent({
    setup() {
      composable = useSpeechSynthesis()
      return {}
    },
    template: '<div />',
  })

  mount(Comp)
  return composable!
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSpeechSynthesis', () => {
  let provider: ReturnType<typeof makeMockProvider>

  beforeEach(() => {
    provider = makeMockProvider()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Provider injection ──────────────────────────────────────────────────────

  it('uses the injected provider', () => {
    const c = mountWithProvider(provider)
    expect(c.isSupported.value).toBe(true)
  })

  it('falls back to WebSpeechTTSProvider with console.warn when no provider is injected', async () => {
    // stub window.speechSynthesis so WebSpeechTTSProvider can initialise
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: vi.fn(), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
      },
      configurable: true, writable: true,
    })
    if (!('SpeechSynthesisUtterance' in window)) {
      ;(window as unknown as Record<string, unknown>)['SpeechSynthesisUtterance'] =
        class extends EventTarget { text = ''; rate = 1; pitch = 1; volume = 1; voice = null
          onstart: null = null; onend: null = null; onerror: null = null
          constructor(t?: string) { super(); if (t) this.text = t } }
    }

    mountWithoutProvider()
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('useSpeechSynthesis()'))
  })

  // ── Voice loading ────────────────────────────────────────────────────────────

  it('loads voices eagerly on mount and sets default selectedVoice', async () => {
    const c = mountWithProvider(provider)
    await nextTick()
    await nextTick() // wait for async getVoices
    expect(c.voices.value).toHaveLength(2)
    expect(c.selectedVoice.value?.id).toBe('v1') // first voice is default
    expect(c.isLoadingVoices.value).toBe(false)
  })

  it('sets isLoadingVoices to true while voices are loading', async () => {
    let resolve!: (v: VoiceInfo[]) => void
    provider.getVoices = vi.fn().mockReturnValue(new Promise<VoiceInfo[]>((r) => { resolve = r }))

    const c = mountWithProvider(provider)
    // After mount, loading should have started
    await nextTick()
    expect(c.isLoadingVoices.value).toBe(true)

    resolve([{ id: 'v1', name: 'V1', lang: 'en', label: 'V1', default: true }])
    await nextTick()
    await nextTick()
    expect(c.isLoadingVoices.value).toBe(false)
  })

  // ── speak() ──────────────────────────────────────────────────────────────────

  it('calls provider.speak() with the resolved options', async () => {
    const c = mountWithProvider(provider)
    await nextTick(); await nextTick()

    await c.speak('Hello world')

    expect(provider.speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hello world' }))
  })

  it('passes rate/pitch/volume from reactive Refs to speak() (I-4.4)', async () => {
    const c = mountWithProvider(provider)
    c.rate.value = 1.5
    c.pitch.value = 0.8
    c.volume.value = 0.5

    await c.speak('Test')

    expect(provider.speak).toHaveBeenCalledWith(
      expect.objectContaining({ rate: 1.5, pitch: 0.8, volume: 0.5 }),
    )
  })

  it('overrides from speak() take precedence over Ref values (I-4.4)', async () => {
    const c = mountWithProvider(provider)
    c.rate.value = 1.5

    await c.speak('Test', { rate: 2.0 })

    expect(provider.speak).toHaveBeenCalledWith(
      expect.objectContaining({ rate: 2.0 }),
    )
  })

  // ── Lifecycle callbacks ──────────────────────────────────────────────────────

  it('sets isSpeaking to true when provider fires onStart', async () => {
    const c = mountWithProvider(provider)
    expect(c.isSpeaking.value).toBe(false)
    provider._startCb?.()
    expect(c.isSpeaking.value).toBe(true)
  })

  it('sets isSpeaking to false when provider fires onEnd', async () => {
    const c = mountWithProvider(provider)
    provider._startCb?.()
    provider._endCb?.()
    expect(c.isSpeaking.value).toBe(false)
  })

  it('sets error when provider fires onError', async () => {
    const c = mountWithProvider(provider)
    const err: SpeechError = { code: 'NETWORK', message: 'fail' }
    provider._errorCb?.(err)
    expect(c.error.value).toEqual(err)
    expect(c.isSpeaking.value).toBe(false)
  })

  it('clears error on next speak()', async () => {
    const c = mountWithProvider(provider)
    provider._errorCb?.({ code: 'UNKNOWN', message: 'x' })
    await c.speak('hello')
    expect(c.error.value).toBeNull()
  })

  // ── stop / pause / resume ────────────────────────────────────────────────────

  it('stop() calls provider.stop()', () => {
    const c = mountWithProvider(provider)
    c.stop()
    expect(provider.stop).toHaveBeenCalledOnce()
  })

  it('pause() calls provider.pause() and sets isPaused', () => {
    const c = mountWithProvider(provider)
    c.pause()
    expect(provider.pause).toHaveBeenCalledOnce()
    expect(c.isPaused.value).toBe(true)
  })

  it('resume() calls provider.resume() and clears isPaused', () => {
    const c = mountWithProvider(provider)
    c.pause()
    c.resume()
    expect(provider.resume).toHaveBeenCalledOnce()
    expect(c.isPaused.value).toBe(false)
  })

  // ── Cleanup on unmount ───────────────────────────────────────────────────────

  it('calls provider.stop() on component unmount', () => {
    // provide must be in parent; inject is in child (same-component provide/inject does not work)
    const Child = defineComponent({
      setup() { useSpeechSynthesis(); return {} },
      template: '<div />',
    })
    const Parent = defineComponent({
      components: { Child },
      setup() { provide(SPEECH_PROVIDER_KEY, provider) },
      template: '<Child />',
    })
    const w = mount(Parent)
    w.unmount()
    expect(provider.stop).toHaveBeenCalled()
  })
})
