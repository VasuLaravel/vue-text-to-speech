import type { SpeechError } from './types.js'

/**
 * Plays an audio blob using an HTMLAudioElement (Decision D-3 — blob URL approach).
 * `fetch()` → buffer full response → `URL.createObjectURL(blob)` → `<audio>.play()`
 *
 * @param blob    Audio data (MP3, Opus, AAC, etc.)
 * @param signal  Optional AbortSignal — resolves immediately on abort
 * @returns Promise that resolves when playback ends or rejects on error/abort
 */
export function playBlobAudio(blob: Blob, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    const cleanup = () => {
      URL.revokeObjectURL(url)
      audio.onended = null
      audio.onerror = null
    }

    if (signal?.aborted) {
      cleanup()
      resolve()
      return
    }

    const onAbort = () => {
      audio.pause()
      cleanup()
      resolve()
    }

    audio.onended = () => {
      signal?.removeEventListener('abort', onAbort)
      cleanup()
      resolve()
    }

    audio.onerror = () => {
      signal?.removeEventListener('abort', onAbort)
      cleanup()
      const err: SpeechError = {
        code: 'AUDIO_PLAYBACK',
        message: `Audio playback failed (MediaError code ${audio.error?.code ?? 'unknown'})`,
      }
      reject(err)
    }

    signal?.addEventListener('abort', onAbort, { once: true })

    audio.play().catch((e: unknown) => {
      signal?.removeEventListener('abort', onAbort)
      cleanup()
      const err: SpeechError = {
        code: 'AUDIO_PLAYBACK',
        message: 'audio.play() rejected — browser may require a user gesture first',
        cause: e,
      }
      reject(err)
    })
  })
}

/**
 * Converts a non-2xx fetch Response into a typed SpeechError and throws it.
 */
export async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) return

  const body = await response.text().catch(() => '')
  const code = response.status === 429 ? 'RATE_LIMIT' : 'API_ERROR'

  const err: SpeechError = {
    code,
    message: `HTTP ${response.status} ${response.statusText}`,
    cause: body || undefined,
  }
  throw err
}
