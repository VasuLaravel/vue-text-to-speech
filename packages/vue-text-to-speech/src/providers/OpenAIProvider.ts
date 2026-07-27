import type { TTSProvider, SpeakOptions, VoiceInfo, SpeechError, OpenAIConfig } from './types.js'
import { playBlobAudio, throwIfNotOk } from './audioUtils.js'

const OPENAI_VOICES: VoiceInfo[] = [
  { id: 'alloy',   name: 'Alloy',   lang: 'en', label: 'Alloy',   default: true  },
  { id: 'echo',    name: 'Echo',    lang: 'en', label: 'Echo',    default: false },
  { id: 'fable',   name: 'Fable',   lang: 'en', label: 'Fable',   default: false },
  { id: 'onyx',    name: 'Onyx',    lang: 'en', label: 'Onyx',    default: false },
  { id: 'nova',    name: 'Nova',    lang: 'en', label: 'Nova',    default: false },
  { id: 'shimmer', name: 'Shimmer', lang: 'en', label: 'Shimmer', default: false },
]

export class OpenAIProvider implements TTSProvider {
  readonly isSupported: boolean = typeof window !== 'undefined'

  private _config: OpenAIConfig
  private _abortController: AbortController | null = null

  private _startCbs: Array<() => void> = []
  private _endCbs: Array<() => void> = []
  private _errorCbs: Array<(err: SpeechError) => void> = []

  constructor(config: OpenAIConfig) {
    if (config.baseURL && !/^https:\/\//i.test(config.baseURL)) {
      throw new Error('[vue-text-to-speech] OpenAI baseURL must use HTTPS')
    }
    this._config = config
  }

  onStart(cb: () => void): void { this._startCbs.push(cb) }
  onEnd(cb: () => void): void   { this._endCbs.push(cb) }
  onError(cb: (err: SpeechError) => void): void { this._errorCbs.push(cb) }

  async speak(options: SpeakOptions): Promise<void> {
    if (!options.text) {
      const err: SpeechError = { code: 'API_ERROR', message: 'Text must not be empty' }
      this._errorCbs.forEach((cb) => cb(err))
      throw err
    }
    if (options.text.length > 10_000) {
      const err: SpeechError = { code: 'API_ERROR', message: 'Text exceeds maximum length of 10,000 characters' }
      this._errorCbs.forEach((cb) => cb(err))
      throw err
    }

    this.stop()

    const controller = new AbortController()
    this._abortController = controller

    const baseURL = this._config.baseURL?.replace(/\/$/, '') ?? 'https://api.openai.com'

    let response: Response
    try {
      response = await fetch(`${baseURL}/v1/audio/speech`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this._config.apiKey}`,
        },
        body: JSON.stringify({
          model: this._config.model ?? 'tts-1',
          input: options.text,
          voice: options.voice?.id ?? this._config.voice ?? 'alloy',
          speed: options.rate ?? this._config.speed ?? 1,
        }),
      })
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      const err: SpeechError = { code: 'NETWORK', message: 'OpenAI TTS fetch failed', cause: e }
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

  pause(): void { /* no-op — no pause API for remote audio */ }
  resume(): void { /* no-op */ }

  getVoices(): Promise<VoiceInfo[]> {
    return Promise.resolve(OPENAI_VOICES)
  }
}
