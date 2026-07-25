import type { TTSProvider, SpeakOptions, VoiceInfo, SpeechError } from './types.js'

// ─── WebSpeechTTSProvider ─────────────────────────────────────────────────────

export class WebSpeechTTSProvider implements TTSProvider {
  readonly isSupported: boolean

  private _startCbs: Array<() => void> = []
  private _endCbs: Array<() => void> = []
  private _errorCbs: Array<(err: SpeechError) => void> = []

  /** Resolves with the array of available voices. Safe to call multiple times */
  private _voicesPromise: Promise<VoiceInfo[]> | null = null

  constructor() {
    this.isSupported =
      typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  // ── Lifecycle hook registration ─────────────────────────────────────────────

  onStart(cb: () => void): void {
    this._startCbs.push(cb)
  }

  onEnd(cb: () => void): void {
    this._endCbs.push(cb)
  }

  onError(cb: (err: SpeechError) => void): void {
    this._errorCbs.push(cb)
  }

  private _emitStart(): void {
    this._startCbs.forEach((cb) => cb())
  }

  private _emitEnd(): void {
    this._endCbs.forEach((cb) => cb())
  }

  private _emitError(err: SpeechError): void {
    this._errorCbs.forEach((cb) => cb(err))
  }

  // ── Core API ────────────────────────────────────────────────────────────────

  speak(options: SpeakOptions): Promise<void> {
    if (!this.isSupported) {
      const err: SpeechError = {
        code: 'NOT_SUPPORTED',
        message: 'SpeechSynthesis is not available in this environment',
      }
      this._emitError(err)
      return Promise.reject(err)
    }

    return new Promise<void>((resolve, reject) => {
      // Cancel any in-progress utterance first
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(options.text)

      if (options.rate !== undefined) utterance.rate = options.rate
      if (options.pitch !== undefined) utterance.pitch = options.pitch
      if (options.volume !== undefined) utterance.volume = options.volume

      if (options.voice) {
        const nativeVoices = window.speechSynthesis.getVoices()
        const match = nativeVoices.find((v) => v.voiceURI === options.voice!.id)
        if (match) utterance.voice = match
      }

      utterance.onstart = () => {
        this._emitStart()
      }

      utterance.onend = () => {
        this._emitEnd()
        resolve()
      }

      utterance.onerror = (event) => {
        // 'interrupted' and 'canceled' are not real errors — they happen when
        // stop() or cancel() is called intentionally
        if (event.error === 'interrupted' || event.error === 'canceled') {
          this._emitEnd()
          resolve()
          return
        }

        const err: SpeechError = {
          code: 'UNKNOWN',
          message: `SpeechSynthesisUtterance error: ${event.error}`,
          cause: event,
        }
        this._emitError(err)
        // Always emit onEnd after onError for consistency with AI providers
        // (which emit onEnd in their finally block). This lets useVoiceQueue
        // rely on a single onEnd hook for queue advancement across all providers.
        this._emitEnd()
        reject(err)
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  stop(): void {
    if (this.isSupported) {
      window.speechSynthesis.cancel()
    }
  }

  pause(): void {
    if (this.isSupported) {
      window.speechSynthesis.pause()
    }
  }

  resume(): void {
    if (this.isSupported) {
      window.speechSynthesis.resume()
    }
  }

  // ── Voice loading (I-2.4: voiceschanged + 3s timeout fallback) ──────────────

  getVoices(): Promise<VoiceInfo[]> {
    if (!this.isSupported) return Promise.resolve([])

    if (this._voicesPromise) return this._voicesPromise

    this._voicesPromise = this._loadVoices()
    return this._voicesPromise
  }

  private _loadVoices(): Promise<VoiceInfo[]> {
    return new Promise<VoiceInfo[]>((resolve) => {
      // Fast path: Chrome sometimes has voices already available
      const immediate = window.speechSynthesis.getVoices()
      if (immediate.length > 0) {
        resolve(immediate.map(toVoiceInfo))
        return
      }

      // Slow path: wait for voiceschanged (Chrome async load)
      let resolved = false

      const onVoicesChanged = () => {
        if (resolved) return
        resolved = true
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve(window.speechSynthesis.getVoices().map(toVoiceInfo))
      }

      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)

      // 3-second timeout fallback (Safari, Firefox where event may not fire)
      setTimeout(() => {
        if (resolved) return
        resolved = true
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve(window.speechSynthesis.getVoices().map(toVoiceInfo))
      }, 3000)
    })
  }
}

// ─── Normalise SpeechSynthesisVoice → VoiceInfo ───────────────────────────────

function toVoiceInfo(v: SpeechSynthesisVoice): VoiceInfo {
  return {
    id: v.voiceURI,
    name: v.name,
    lang: v.lang,
    label: v.name,
    default: v.default,
  }
}
