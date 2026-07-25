/**
 * SSR safety tests for composables — run in pure Node environment.
 * Composables must not crash when window / navigator are undefined.
 *
 * `@vue/test-utils` mount() requires `document`, so we use
 * `app.runWithContext()` (Vue 3.3+) which runs setup logic without a DOM.
 * Lifecycle hooks like onUnmounted just warn silently when called outside a
 * component instance — they do not throw.
 */
import { describe, it, expect, vi } from 'vitest'
import { createApp } from 'vue'
import { useSpeechSynthesis } from '../../src/composables/useSpeechSynthesis.js'
import { useSpeechRecognition } from '../../src/composables/useSpeechRecognition.js'

/** Run a composable inside a Vue app context (no DOM required) */
function withAppContext<T>(fn: () => T): T {
  const app = createApp({})
  // Suppress Vue's "onUnmounted called outside setup" warning
  app.config.warnHandler = () => undefined
  return app.runWithContext(fn)
}

describe('SSR safety — useSpeechSynthesis', () => {
  it('constructs without throwing in a node environment', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect(() => withAppContext(() => useSpeechSynthesis())).not.toThrow()
  })

  it('reports isSupported: false in node environment', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const c = withAppContext(() => useSpeechSynthesis())
    expect(c.isSupported.value).toBe(false)
  })

  it('speak() rejects gracefully in node environment', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const c = withAppContext(() => useSpeechSynthesis())
    await expect(c.speak('hi')).rejects.toMatchObject({ code: 'NOT_SUPPORTED' })
  })

  it('stop() does not throw in node environment', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const c = withAppContext(() => useSpeechSynthesis())
    expect(() => c.stop()).not.toThrow()
  })
})

describe('SSR safety — useSpeechRecognition', () => {
  it('constructs without throwing in a node environment', () => {
    expect(() => withAppContext(() => useSpeechRecognition())).not.toThrow()
  })

  it('reports isSupported: false in node environment', () => {
    const c = withAppContext(() => useSpeechRecognition())
    expect(c.isSupported.value).toBe(false)
  })

  it('start() emits NOT_SUPPORTED error and does not throw', () => {
    const c = withAppContext(() => useSpeechRecognition())
    expect(() => c.start()).not.toThrow()
    expect(c.error.value?.code).toBe('NOT_SUPPORTED')
  })

  it('stop() does not throw in node environment', () => {
    const c = withAppContext(() => useSpeechRecognition())
    expect(() => c.stop()).not.toThrow()
  })
})
