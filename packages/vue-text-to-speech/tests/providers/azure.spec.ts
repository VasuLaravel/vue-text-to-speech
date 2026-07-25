import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AzureProvider } from '../../src/providers/AzureProvider.js'

function mockFetchOk(body: BodyInit = new Blob(['audio'], { type: 'audio/mpeg' })) {
  return vi.fn().mockResolvedValue(
    new Response(body, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } }),
  )
}

function mockFetchError(status: number, body = 'error') {
  return vi.fn().mockResolvedValue(new Response(body, { status }))
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

describe('AzureProvider', () => {
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

  it('builds the correct endpoint URL from region', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'az-key', region: 'westus' })
    await p.speak({ text: 'Hello' })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe('https://westus.tts.speech.microsoft.com/cognitiveservices/v1')
  })

  it('sends correct headers', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'az-key', region: 'eastus' })
    await p.speak({ text: 'Hello' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/ssml+xml')
    expect(headers['X-Microsoft-OutputFormat']).toBe('audio-16khz-128kbitrate-mono-mp3')
    expect(headers['Ocp-Apim-Subscription-Key']).toBe('az-key')
  })

  it('sends well-formed SSML body with default voice', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus' })
    await p.speak({ text: 'Hello world' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const ssml = init.body as string
    expect(ssml).toContain('<speak')
    expect(ssml).toContain('<voice name=\'en-US-JennyNeural\'>')
    expect(ssml).toContain('Hello world')
    expect(ssml).toContain('</speak>')
  })

  it('escapes XML special characters in text', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus' })
    await p.speak({ text: 'AT&T <rocks> "quote" \'apostrophe\'' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const ssml = init.body as string
    expect(ssml).toContain('AT&amp;T')
    expect(ssml).toContain('&lt;rocks&gt;')
    expect(ssml).toContain('&quot;quote&quot;')
    expect(ssml).toContain('&apos;apostrophe&apos;')
  })

  it('uses voice from SpeakOptions.voice.id over config default', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus', voice: 'en-US-GuyNeural' })
    await p.speak({ text: 'hi', voice: { id: 'fr-FR-DeniseNeural', name: 'Denise', lang: 'fr-FR', label: 'Denise', default: false } })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body as string).toContain('fr-FR-DeniseNeural')
  })

  it('respects baseURL override', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus', baseURL: 'https://proxy.local' })
    await p.speak({ text: 'hi' })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toMatch(/^https:\/\/proxy\.local/)
  })

  it('throws RATE_LIMIT on 429', async () => {
    vi.stubGlobal('fetch', mockFetchError(429))
    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus' })
    await expect(p.speak({ text: 'hi' })).rejects.toMatchObject({ code: 'RATE_LIMIT' })
  })

  it('throws API_ERROR on 403', async () => {
    vi.stubGlobal('fetch', mockFetchError(403))
    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus' })
    await expect(p.speak({ text: 'hi' })).rejects.toMatchObject({ code: 'API_ERROR' })
  })

  it('fires onStart and onEnd on success', async () => {
    vi.stubGlobal('fetch', mockFetchOk())
    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus' })
    const start = vi.fn(); const end = vi.fn()
    p.onStart(start); p.onEnd(end)
    await p.speak({ text: 'hi' })
    expect(start).toHaveBeenCalledOnce()
    expect(end).toHaveBeenCalledOnce()
  })

  it('getVoices() calls voices/list endpoint and maps response', async () => {
    const azureVoices = [
      { ShortName: 'en-US-JennyNeural', DisplayName: 'Jenny', Locale: 'en-US', Gender: 'Female' },
      { ShortName: 'fr-FR-DeniseNeural', DisplayName: 'Denise', Locale: 'fr-FR', Gender: 'Female' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(azureVoices), { status: 200 }),
    ))

    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus' })
    const result = await p.getVoices()

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('en-US-JennyNeural')
    expect(result[0].lang).toBe('en-US')
    expect(result[1].label).toContain('fr-FR')
  })

  it('getVoices() respects baseURL override', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const p = new AzureProvider({ provider: 'azure', subscriptionKey: 'key', region: 'eastus', baseURL: 'https://proxy.local' })
    await p.getVoices()

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toMatch(/^https:\/\/proxy\.local/)
  })
})
