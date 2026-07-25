/**
 * SSR safety tests — run in Vitest `node` environment (no browser globals).
 * Providers must never crash when window / navigator are undefined.
 */
import { describe, it, expect } from 'vitest'
import { WebSpeechTTSProvider } from '../../src/providers/WebSpeechTTSProvider.js'
import { WebSpeechSTTProvider } from '../../src/providers/WebSpeechSTTProvider.js'

describe('SSR safety — WebSpeechTTSProvider', () => {
  it('constructs without throwing', () => {
    expect(() => new WebSpeechTTSProvider()).not.toThrow()
  })

  it('reports isSupported: false', () => {
    const provider = new WebSpeechTTSProvider()
    expect(provider.isSupported).toBe(false)
  })

  it('speak() rejects with NOT_SUPPORTED (no throw)', async () => {
    const provider = new WebSpeechTTSProvider()
    await expect(provider.speak({ text: 'hi' })).rejects.toMatchObject({
      code: 'NOT_SUPPORTED',
    })
  })

  it('stop() does not throw', () => {
    const provider = new WebSpeechTTSProvider()
    expect(() => provider.stop()).not.toThrow()
  })

  it('pause() does not throw', () => {
    const provider = new WebSpeechTTSProvider()
    expect(() => provider.pause()).not.toThrow()
  })

  it('resume() does not throw', () => {
    const provider = new WebSpeechTTSProvider()
    expect(() => provider.resume()).not.toThrow()
  })

  it('getVoices() resolves to empty array', async () => {
    const provider = new WebSpeechTTSProvider()
    await expect(provider.getVoices()).resolves.toEqual([])
  })
})

describe('SSR safety — WebSpeechSTTProvider', () => {
  it('constructs without throwing', () => {
    expect(() => new WebSpeechSTTProvider()).not.toThrow()
  })

  it('reports isSupported: false', () => {
    const provider = new WebSpeechSTTProvider()
    expect(provider.isSupported).toBe(false)
  })

  it('start() emits NOT_SUPPORTED error (no throw)', () => {
    const provider = new WebSpeechSTTProvider()
    const errors: unknown[] = []
    provider.onError((e) => errors.push(e))
    expect(() => provider.start()).not.toThrow()
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({ code: 'NOT_SUPPORTED' })
  })

  it('stop() does not throw', () => {
    const provider = new WebSpeechSTTProvider()
    expect(() => provider.stop()).not.toThrow()
  })
})
