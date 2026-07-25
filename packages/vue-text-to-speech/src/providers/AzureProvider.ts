import type { TTSProvider, SpeakOptions, VoiceInfo, SpeechError, AzureConfig } from './types.js'
import { playBlobAudio, throwIfNotOk } from './audioUtils.js'

// I-3.3: SSML template + output format header
const OUTPUT_FORMAT = 'audio-16khz-128kbitrate-mono-mp3'

function buildSSML(voice: string, text: string): string {
  // Escape XML special characters to prevent injection
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
  return `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'>${escaped}</voice></speak>`
}

export class AzureProvider implements TTSProvider {
  readonly isSupported: boolean = typeof window !== 'undefined'

  private _config: AzureConfig
  private _abortController: AbortController | null = null

  private _startCbs: Array<() => void> = []
  private _endCbs: Array<() => void> = []
  private _errorCbs: Array<(err: SpeechError) => void> = []

  constructor(config: AzureConfig) {
    this._config = config
  }

  onStart(cb: () => void): void { this._startCbs.push(cb) }
  onEnd(cb: () => void): void   { this._endCbs.push(cb) }
  onError(cb: (err: SpeechError) => void): void { this._errorCbs.push(cb) }

  async speak(options: SpeakOptions): Promise<void> {
    this.stop()

    const controller = new AbortController()
    this._abortController = controller

    const voice = options.voice?.id ?? this._config.voice ?? 'en-US-JennyNeural'
    const endpoint = this._config.baseURL
      ? `${this._config.baseURL.replace(/\/$/, '')}/cognitiveservices/v1`
      : `https://${this._config.region}.tts.speech.microsoft.com/cognitiveservices/v1`

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
          'Ocp-Apim-Subscription-Key': this._config.subscriptionKey,
        },
        body: buildSSML(voice, options.text),
      })
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      const err: SpeechError = { code: 'NETWORK', message: 'Azure TTS fetch failed', cause: e }
      this._errorCbs.forEach((cb) => cb(err))
      throw err
    }

    await throwIfNotOk(response)

    const blob = await response.blob()

    this._startCbs.forEach((cb) => cb())
    try {
      await playBlobAudio(blob, controller.signal)
    } catch (e: unknown) {
      const err = e as SpeechError
      this._errorCbs.forEach((cb) => cb(err))
      throw err
    } finally {
      this._abortController = null
      this._endCbs.forEach((cb) => cb())
    }
  }

  stop(): void {
    this._abortController?.abort()
    this._abortController = null
  }

  pause(): void  { /* no-op */ }
  resume(): void { /* no-op */ }

  async getVoices(): Promise<VoiceInfo[]> {
    const endpoint = this._config.baseURL
      ? `${this._config.baseURL.replace(/\/$/, '')}/cognitiveservices/voices/list`
      : `https://${this._config.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`

    const response = await fetch(endpoint, {
      headers: { 'Ocp-Apim-Subscription-Key': this._config.subscriptionKey },
    })
    await throwIfNotOk(response)

    const data = (await response.json()) as Array<{
      ShortName: string
      DisplayName: string
      Locale: string
      Gender: string
    }>

    return data.map((v, i) => ({
      id: v.ShortName,
      name: v.DisplayName,
      lang: v.Locale,
      label: `${v.DisplayName} (${v.Locale})`,
      default: i === 0,
    }))
  }
}
