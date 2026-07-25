import type { STTProvider, SpeechError } from './types.js'

// ─── Local Web Speech API type declarations ───────────────────────────────────
// TypeScript's DOM lib types for the Web Speech API are inconsistent across
// compiler versions (SpeechRecognition / SpeechRecognitionEvent were removed or
// renamed in TS 5.9). We define the minimum surface we need locally so the
// provider compiles cleanly regardless of which lib version is installed.

interface _SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface _SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: _SpeechRecognitionAlternative
}

interface _SpeechRecognitionResultList {
  readonly length: number
  [index: number]: _SpeechRecognitionResult
}

interface _SpeechRecognitionResultEvent {
  readonly resultIndex: number
  readonly results: _SpeechRecognitionResultList
}

interface _SpeechRecognitionErrorEvent {
  readonly error: string
  readonly message?: string
}

interface _SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((_: _SpeechRecognitionResultEvent) => void) | null
  onerror: ((_: _SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface _SpeechRecognitionConstructor {
  new(): _SpeechRecognitionInstance
}

// Extend Window with both standard and webkit-prefixed constructors
declare global {
  interface Window {
    SpeechRecognition?: _SpeechRecognitionConstructor
    webkitSpeechRecognition?: _SpeechRecognitionConstructor
  }
}

// ─── WebSpeechSTTProvider ─────────────────────────────────────────────────────

export interface WebSpeechSTTOptions {
  /** BCP-47 language code, e.g. 'en-US'. Defaults to browser UI lang */
  lang?: string
  /** Whether to return interim (non-final) results. Default: true */
  interimResults?: boolean
  /** Whether recognition continues after the first final result. Default: false */
  continuous?: boolean
  /** Maximum number of alternative transcripts per result. Default: 1 */
  maxAlternatives?: number
}

export class WebSpeechSTTProvider implements STTProvider {
  readonly isSupported: boolean
  readonly continuous: boolean

  private _recognition: _SpeechRecognitionInstance | null = null
  private _options: Required<WebSpeechSTTOptions>

  private _transcriptCbs: Array<(transcript: string, confidence: number) => void> = []
  private _finalCbs: Array<(transcript: string, confidence: number) => void> = []
  private _errorCbs: Array<(err: SpeechError) => void> = []

  constructor(options: WebSpeechSTTOptions = {}) {
    this._options = {
      lang: options.lang ?? '',
      interimResults: options.interimResults ?? true,
      continuous: options.continuous ?? false,
      maxAlternatives: options.maxAlternatives ?? 1,
    }
    this.continuous = this._options.continuous
    this.isSupported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  // ── Lifecycle hook registration ─────────────────────────────────────────────

  onTranscript(cb: (transcript: string, confidence: number) => void): void {
    this._transcriptCbs.push(cb)
  }

  onFinalTranscript(cb: (transcript: string, confidence: number) => void): void {
    this._finalCbs.push(cb)
  }

  onError(cb: (err: SpeechError) => void): void {
    this._errorCbs.push(cb)
  }

  // ── Core API ────────────────────────────────────────────────────────────────

  start(): void {
    if (!this.isSupported) {
      this._emitError({
        code: 'NOT_SUPPORTED',
        message: 'SpeechRecognition is not available in this environment',
      })
      return
    }

    // Tear down any existing instance before creating a new one
    this._teardown()

    const SpeechRecognitionImpl =
      window.SpeechRecognition ?? window.webkitSpeechRecognition!

    const rec = new SpeechRecognitionImpl()
    rec.lang = this._options.lang || navigator.language || 'en-US'
    rec.interimResults = this._options.interimResults
    rec.continuous = this._options.continuous
    rec.maxAlternatives = this._options.maxAlternatives

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence

        if (result.isFinal) {
          this._finalCbs.forEach((cb) => cb(transcript, confidence))
        } else {
          this._transcriptCbs.forEach((cb) => cb(transcript, confidence))
        }
      }
    }

    rec.onerror = (event) => {
      const code = mapSpeechRecognitionError(event.error)
      this._emitError({
        code,
        message: `SpeechRecognition error: ${event.error}`,
        cause: event,
      })
    }

    this._recognition = rec
    rec.start()
  }

  stop(): void {
    if (this._recognition) {
      this._recognition.stop()
      this._teardown()
    }
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private _teardown(): void {
    if (this._recognition) {
      this._recognition.onresult = null
      this._recognition.onerror = null
      this._recognition = null
    }
  }

  private _emitError(err: SpeechError): void {
    this._errorCbs.forEach((cb) => cb(err))
  }
}

// ─── Map SpeechRecognitionError.error → SpeechErrorCode ──────────────────────

function mapSpeechRecognitionError(
  error: string,
): import('./types.js').SpeechErrorCode {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'PERMISSION_DENIED'
    case 'network':
      return 'NETWORK'
    case 'no-speech':
    case 'audio-capture':
    case 'aborted':
      return 'CANCELLED'
    default:
      return 'UNKNOWN'
  }
}
