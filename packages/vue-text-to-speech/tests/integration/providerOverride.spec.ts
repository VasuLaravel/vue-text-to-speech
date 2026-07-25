import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, inject, provide, h } from 'vue'
import { VueSpeech } from '../../src/plugin.js'
import { SPEECH_PROVIDER_KEY } from '../../src/injectionKeys.js'
import type { TTSProvider } from '../../src/providers/types.js'

function stubSpeechSynthesis() {
  vi.stubGlobal('speechSynthesis', {
    getVoices: vi.fn().mockReturnValue([]),
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speaking: false,
    paused: false,
    pending: false,
  })
  vi.stubGlobal('SpeechSynthesisUtterance', vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
}

beforeEach(stubSpeechSynthesis)
afterEach(() => vi.unstubAllGlobals())

/**
 * Sprint 7 — task 7.6: verify that a component-level provide() call overrides
 * the globally injected SPEECH_PROVIDER_KEY, following Vue's standard
 * injection precedence rules (nearest ancestor wins).
 */
describe('VueSpeech provider override — task 7.6', () => {
  it('child component provide() shadows the app-level provider', () => {
    let outerCapture: TTSProvider | undefined
    let innerCapture: TTSProvider | undefined

    const mockOverrideProvider = {
      isSupported: true,
      speak: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockResolvedValue([]),
      onStart: vi.fn(),
      onEnd: vi.fn(),
      onError: vi.fn(),
      onBoundary: vi.fn(),
    } as unknown as TTSProvider

    // Grandchild reads the injection
    const Grandchild = defineComponent({
      setup() {
        innerCapture = inject(SPEECH_PROVIDER_KEY)
        return () => h('div')
      },
    })

    // Middle component overrides the provider for its subtree
    const Middle = defineComponent({
      setup() {
        provide(SPEECH_PROVIDER_KEY, mockOverrideProvider)
        return () => h(Grandchild)
      },
    })

    // Root reads before the override — gets the app-level provider
    const Root = defineComponent({
      setup() {
        outerCapture = inject(SPEECH_PROVIDER_KEY)
        return () => h(Middle)
      },
    })

    const div = document.createElement('div')
    const app = createApp(Root)
    app.use(VueSpeech, { provider: 'web' })
    app.mount(div)

    // Root gets the global WebSpeechTTSProvider from app.use()
    expect(outerCapture).toBeDefined()
    // Grandchild gets the override
    expect(innerCapture).toBe(mockOverrideProvider)
    // They should be different objects
    expect(outerCapture).not.toBe(innerCapture)

    app.unmount()
  })

  it('sibling components with different providers are isolated', () => {
    let siblingACapture: TTSProvider | undefined
    let siblingBCapture: TTSProvider | undefined

    const mockProviderA = { isSupported: true, speak: vi.fn() } as unknown as TTSProvider
    const mockProviderB = { isSupported: true, speak: vi.fn() } as unknown as TTSProvider

    const ConsumerA = defineComponent({
      setup() {
        siblingACapture = inject(SPEECH_PROVIDER_KEY)
        return () => h('div')
      },
    })

    const ConsumerB = defineComponent({
      setup() {
        siblingBCapture = inject(SPEECH_PROVIDER_KEY)
        return () => h('div')
      },
    })

    const BranchA = defineComponent({
      setup() {
        provide(SPEECH_PROVIDER_KEY, mockProviderA)
        return () => h(ConsumerA)
      },
    })

    const BranchB = defineComponent({
      setup() {
        provide(SPEECH_PROVIDER_KEY, mockProviderB)
        return () => h(ConsumerB)
      },
    })

    const Root = defineComponent({
      render: () => h('div', [h(BranchA), h(BranchB)]),
    })

    const div = document.createElement('div')
    const app = createApp(Root)
    app.use(VueSpeech, { provider: 'web' })
    app.mount(div)

    expect(siblingACapture).toBe(mockProviderA)
    expect(siblingBCapture).toBe(mockProviderB)
    expect(siblingACapture).not.toBe(siblingBCapture)

    app.unmount()
  })

  it('component without override receives the app-level provider', () => {
    let captured: TTSProvider | undefined

    // No intermediate provide() — should get the app-level WebSpeechTTSProvider
    const Consumer = defineComponent({
      setup() {
        captured = inject(SPEECH_PROVIDER_KEY)
        return () => h('div')
      },
    })

    const div = document.createElement('div')
    const app = createApp(Consumer)
    app.use(VueSpeech, { provider: 'web' })
    app.mount(div)

    expect(captured).toBeDefined()
    // It should be a real WebSpeechTTSProvider (has getVoices, speak, etc.)
    expect(typeof (captured as TTSProvider).getVoices).toBe('function')
    expect(typeof (captured as TTSProvider).speak).toBe('function')

    app.unmount()
  })
})
