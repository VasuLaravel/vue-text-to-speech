import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, inject, h } from 'vue'
import { VueSpeech } from '../../src/plugin.js'
import { SPEECH_PROVIDER_KEY } from '../../src/injectionKeys.js'
import type { TTSProvider } from '../../src/providers/types.js'

// jsdom does not implement speechSynthesis — stub the minimum required surface
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

describe('VueSpeech plugin — task 7.5', () => {
  it('provides SPEECH_PROVIDER_KEY to all descendants', () => {
    let captured: TTSProvider | undefined

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
    app.unmount()
  })

  it('provided value implements the TTSProvider interface', () => {
    let provider: TTSProvider | undefined

    const Consumer = defineComponent({
      setup() {
        provider = inject(SPEECH_PROVIDER_KEY)
        return () => h('div')
      },
    })

    const div = document.createElement('div')
    const app = createApp(Consumer)
    app.use(VueSpeech, { provider: 'web' })
    app.mount(div)

    expect(provider).toHaveProperty('speak')
    expect(provider).toHaveProperty('stop')
    expect(provider).toHaveProperty('pause')
    expect(provider).toHaveProperty('resume')
    expect(provider).toHaveProperty('getVoices')
    expect(provider).toHaveProperty('isSupported')
    app.unmount()
  })

  it('each app.use() call creates an independent provider instance', () => {
    let providerA: TTSProvider | undefined
    let providerB: TTSProvider | undefined

    const Consumer = defineComponent({
      setup() {
        const p = inject(SPEECH_PROVIDER_KEY)
        return { p }
      },
      render() { return h('div') },
    })

    const divA = document.createElement('div')
    const appA = createApp(Consumer)
    appA.use(VueSpeech, { provider: 'web' })
    appA.mount(divA)
    providerA = (appA as any)._context.provides[SPEECH_PROVIDER_KEY as symbol]

    const divB = document.createElement('div')
    const appB = createApp(Consumer)
    appB.use(VueSpeech, { provider: 'web' })
    appB.mount(divB)
    providerB = (appB as any)._context.provides[SPEECH_PROVIDER_KEY as symbol]

    expect(providerA).toBeDefined()
    expect(providerB).toBeDefined()
    expect(providerA).not.toBe(providerB)

    appA.unmount()
    appB.unmount()
  })

  it('components: false (default) — UI components are NOT globally registered', () => {
    const app = createApp({ render: () => h('div') })
    app.use(VueSpeech, { provider: 'web' })

    expect(app.component('VueSpeechPlayer')).toBeUndefined()
    expect(app.component('VueSpeechRecorder')).toBeUndefined()
    expect(app.component('VueSpeechVoiceSelect')).toBeUndefined()
  })

  it('components: true globally registers all three UI components', () => {
    const app = createApp({ render: () => h('div') })
    app.use(VueSpeech, { provider: 'web', components: true })

    expect(app.component('VueSpeechPlayer')).toBeDefined()
    expect(app.component('VueSpeechRecorder')).toBeDefined()
    expect(app.component('VueSpeechVoiceSelect')).toBeDefined()
  })

  it('using VueSpeech without options still installs the web provider', () => {
    let captured: TTSProvider | undefined

    const Consumer = defineComponent({
      setup() {
        captured = inject(SPEECH_PROVIDER_KEY)
        return () => h('div')
      },
    })

    const div = document.createElement('div')
    const app = createApp(Consumer)
    // Call with no options — should default to { provider: 'web' }
    ;(app as any).use(VueSpeech)
    app.mount(div)

    expect(captured).toBeDefined()
    app.unmount()
  })
})
