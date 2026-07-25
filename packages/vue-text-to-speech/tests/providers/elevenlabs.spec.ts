import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ElevenLabsProvider } from '../../src/providers/ElevenLabsProvider.js'

function mockFetchOk() {
  const blob = new Blob(['audio'], { type: 'audio/mpeg' })
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
    blob: () => Promise.resolve(blob),
    text: () => Promise.resolve(''),
  } as unknown as Response)
}

function mockFetchError(status: number, body = 'error') {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    headers: new Headers(),
    blob: () => Promise.resolve(new Blob([body])),
    text: () => Promise.resolve(body),
  } as unknown as Response)
}

function stubAudio() {
  const originalAudio = globalThis.Audio
  ;(globalThis as unknown as Record<string, unknown>).Audio = class {
    onended: ((e: Event) => void) | null = null
    onerror: ((e: Event) => void) | null = null
    play = vi.fn().mockImplementation(() => {
      setTimeout(() => this.onended?.(new Event('ended')), 0)
      return Promise.resolve()
    })
    pause = vi.fn()
  }
  return () => {
    ;(globalThis as unknown as Record<string, unknown>).Audio = originalAudio
  }
}

describe('ElevenLabsProvider', () => {
  let restoreAudio: () => void

  beforeEach(() => {
    restoreAudio = stubAudio()
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), configurable: true, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true, writable: true })
  })

  afterEach(() => {
    restoreAudio()
    vi.restoreAllMocks()
  })

  it('POSTs to /v1/text-to-speech/:voiceId/stream', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new ElevenLabsProvider({ provider: 'elevenlabs', apiKey: 'el-key', voiceId: 'abc123' })
    await p.speak({ text: 'Hello' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/v1/text-to-speech/abc123/stream')
    expect((init.headers as Record<string, string>)['xi-api-key']).toBe('el-key')
  })

  it('uses voiceId from SpeakOptions.voice.id over config default', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new ElevenLabsProvider({ provider: 'elevenlabs', apiKey: 'key', voiceId: 'default-id' })
    await p.speak({ text: 'hi', voice: { id: 'override-id', name: 'Voice', lang: 'en', label: 'Voice', default: false } })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('override-id')
  })

  it('sends stability and similarityBoost in body', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new ElevenLabsProvider({
      provider: 'elevenlabs', apiKey: 'key',
      stability: 0.8, similarityBoost: 0.9,
    })
    await p.speak({ text: 'hi' })

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.voice_settings.stability).toBe(0.8)
    expect(body.voice_settings.similarity_boost).toBe(0.9)
  })

  it('respects baseURL override', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new ElevenLabsProvider({ provider: 'elevenlabs', apiKey: 'key', baseURL: 'https://proxy.local' })
    await p.speak({ text: 'hi' })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toMatch(/^https:\/\/proxy\.local/)
  })

  it('throws RATE_LIMIT on 429', async () => {
    vi.stubGlobal('fetch', mockFetchError(429))
    const p = new ElevenLabsProvider({ provider: 'elevenlabs', apiKey: 'key' })
    await expect(p.speak({ text: 'hi' })).rejects.toMatchObject({ code: 'RATE_LIMIT' })
  })

  it('throws API_ERROR on 401', async () => {
    vi.stubGlobal('fetch', mockFetchError(401))
    const p = new ElevenLabsProvider({ provider: 'elevenlabs', apiKey: 'key' })
    await expect(p.speak({ text: 'hi' })).rejects.toMatchObject({ code: 'API_ERROR' })
  })

  it('fires onStart and onEnd on success', async () => {
    vi.stubGlobal('fetch', mockFetchOk())
    const p = new ElevenLabsProvider({ provider: 'elevenlabs', apiKey: 'key' })
    const start = vi.fn(); const end = vi.fn()
    p.onStart(start); p.onEnd(end)
    await p.speak({ text: 'hi' })
    expect(start).toHaveBeenCalledOnce()
    expect(end).toHaveBeenCalledOnce()
  })

  it('getVoices() calls GET /v1/voices and maps response', async () => {
    const voices = [{ voice_id: 'v1', name: 'Alice' }, { voice_id: 'v2', name: 'Bob' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ voices }), { status: 200 }),
    ))

    const p = new ElevenLabsProvider({ provider: 'elevenlabs', apiKey: 'key' })
    const result = await p.getVoices()
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('v1')
    expect(result[0].name).toBe('Alice')
    expect(result[1].default).toBe(false)
    expect(result[0].default).toBe(true)
  })
})
