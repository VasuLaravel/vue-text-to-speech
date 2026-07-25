/**
 * Sentence boundary detection — Decision D-4, I-5.1.
 *
 * Uses `Intl.Segmenter` with `{ granularity: 'sentence' }`:
 *   - Browser-native & Node 16+ — zero bundle size
 *   - Handles abbreviations (Mr., Dr.), decimals ($3.50), URLs, markdown
 *   - Language-aware (detects locale automatically)
 *   - No regex required
 */

let _segmenter: Intl.Segmenter | null = null

function getSegmenter(): Intl.Segmenter {
  if (!_segmenter) {
    _segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' })
  }
  return _segmenter
}

/**
 * Given a streaming text buffer, extract all **complete** sentences and
 * return the remaining partial sentence that has not ended yet.
 *
 * The last segment from `Intl.Segmenter` is treated as incomplete because
 * more tokens may still arrive. All earlier segments are complete.
 *
 * I-5.5: This function is called on each new token during streaming.
 * On natural stream end, the remaining buffer is spoken as-is.
 *
 * @param buffer  Accumulated token buffer
 * @returns       `{ sentences, remaining }` — sentences ready to speak, leftover
 */
export function extractCompleteSentences(buffer: string): {
  sentences: string[]
  remaining: string
} {
  if (!buffer.trim()) return { sentences: [], remaining: buffer }

  const segments = [...getSegmenter().segment(buffer)]

  if (segments.length <= 1) {
    // Only one segment = incomplete sentence still forming
    return { sentences: [], remaining: buffer }
  }

  // All segments except the last are safe to speak
  const sentences = segments
    .slice(0, -1)
    .map((s) => s.segment.trim())
    .filter((s) => s.length > 0)

  const remaining = segments[segments.length - 1].segment

  return { sentences, remaining }
}

/**
 * Split a **complete** text into all its sentences.
 * Use for pre-existing text — not for streaming buffers.
 */
export function splitSentences(text: string): string[] {
  if (!text.trim()) return []
  return [...getSegmenter().segment(text)]
    .map((s) => s.segment.trim())
    .filter((s) => s.length > 0)
}
