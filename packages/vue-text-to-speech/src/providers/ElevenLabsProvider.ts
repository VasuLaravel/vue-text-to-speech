import type { TTSProvider, SpeakOptions, VoiceInfo, SpeechError, ElevenLabsConfig } from './types.js'
import { playBlobAudio, throwIfNotOk } from './audioUtils.js'

export class ElevenLabsProvider implements TTSProvider {
  readonly isSupported: boolean = typeof window !== 'undefined'

  private _config: ElevenLabsConfig
  private _abortController: AbortController | null = null

  private _startCbs: Array<() => void> = []
  private _endCbs: Array<() => void> = []
  private _errorCbs: Array<(err: SpeechError) => void> = []

  constructor(config: ElevenLabsConfig) {
    this._config = config
  }

  onStart(cb: () => void): void { this._startCbs.push(cb) }
  onEnd(cb: () => void): void   { this._endCbs.push(cb) }
  onError(cb: (err: SpeechError) => void): void { this._errorCbs.push(cb) }

  async speak(options: SpeakOptions): Promise<void> {
    this.stop()

    const controller = new AbortController()
    this._abortController = controller

    const voiceId = options.voice?.id ?? this._config.voiceId ?? 'EXAVITQu4vr4xnSDxMaL'
    const baseURL = this._config.baseURL?.replace(/\/$/, '') ?? 'https://api.elevenlabs.io'

    let response: Response
    try {
      response = await fetch(
        `${baseURL}/v1/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this._config.apiKey,
          },
          body: JSON.stringify({
            text: options.text,
            model_id: this._config.modelId ?? 'eleven_multilingual_v2',
            voice_settings: {
              stability: this._config.stability ?? 0.5,
              similarity_boost: this._config.similarityBoost ?? 0.75,
            },
          }),
        },
      )
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      const err: SpeechError = { code: 'NETWORK', message: 'ElevenLabs TTS fetch failed', cause: e }
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
    const baseURL = this._config.baseURL?.replace(/\/$/, '') ?? 'https://api.elevenlabs.io'
    const response = await fetch(`${baseURL}/v1/voices`, {
      headers: { 'xi-api-key': this._config.apiKey },
    })
    await throwIfNotOk(response)

    const data = (await response.json()) as { voices: Array<{ voice_id: string; name: string }> }
    return data.voices.map((v, i) => ({
      id: v.voice_id,
      name: v.name,
      lang: 'en',        // ElevenLabs voices are multilingual — lang unknown from list API
      label: v.name,
      default: i === 0,
    }))
  }
}
