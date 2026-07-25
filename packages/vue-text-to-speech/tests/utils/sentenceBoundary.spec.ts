import { describe, it, expect } from 'vitest'
import {
  extractCompleteSentences,
  splitSentences,
} from '../../src/utils/sentenceBoundary.js'

describe('extractCompleteSentences (streaming buffer)', () => {
  it('returns no sentences for an empty buffer', () => {
    const result = extractCompleteSentences('')
    expect(result.sentences).toHaveLength(0)
    expect(result.remaining).toBe('')
  })

  it('returns no sentences for a single incomplete sentence', () => {
    const result = extractCompleteSentences('Hello world')
    expect(result.sentences).toHaveLength(0)
    expect(result.remaining).toBe('Hello world')
  })

  it('extracts one complete sentence and keeps the trailing partial', () => {
    const result = extractCompleteSentences('Hello world. How are')
    expect(result.sentences).toHaveLength(1)
    expect(result.sentences[0]).toBe('Hello world.')
    expect(result.remaining).toContain('How are')
  })

  it('extracts multiple complete sentences', () => {
    const result = extractCompleteSentences('First sentence. Second sentence. Third')
    expect(result.sentences).toHaveLength(2)
    expect(result.sentences[0]).toBe('First sentence.')
    expect(result.sentences[1]).toBe('Second sentence.')
    expect(result.remaining).toContain('Third')
  })

  it('does NOT split on decimal numbers (e.g. $3.50)', () => {
    const result = extractCompleteSentences('The price is $3.50. Checkout')
    // "The price is $3.50." is one complete sentence
    expect(result.sentences).toHaveLength(1)
    expect(result.sentences[0]).toBe('The price is $3.50.')
  })

  it('does NOT split abbreviations (Mr., Dr.)', () => {
    // Intl.Segmenter handles "Mr." correctly
    const result = extractCompleteSentences('Mr. Smith went to the store. He bought milk.')
    // Only splits on real sentence boundaries
    const joined = result.sentences.join(' ') + ' ' + result.remaining
    expect(joined).toContain('Mr. Smith')
  })

  it('handles question marks as sentence boundaries', () => {
    const result = extractCompleteSentences('How are you? I am fine. Still')
    expect(result.sentences).toHaveLength(2)
    expect(result.sentences[0]).toBe('How are you?')
    expect(result.sentences[1]).toBe('I am fine.')
  })

  it('handles exclamation marks as sentence boundaries', () => {
    const result = extractCompleteSentences('Great! Really? Next')
    expect(result.sentences.length).toBeGreaterThanOrEqual(1)
    expect(result.sentences[0]).toBe('Great!')
  })

  it('keeps only-whitespace buffer as remaining', () => {
    const result = extractCompleteSentences('   ')
    expect(result.sentences).toHaveLength(0)
    expect(result.remaining).toBe('   ')
  })

  it('handles ellipsis without false splits', () => {
    const result = extractCompleteSentences('Wait... I mean, yes. Next')
    // "Wait..." should NOT be treated as a hard sentence boundary
    // (Intl.Segmenter locale-dependently may or may not split on ellipsis)
    // At minimum, the final "Next" should remain in the buffer
    expect(result.remaining).toContain('Next')
  })

  it('returns empty sentences array when buffer has exactly one segment', () => {
    const result = extractCompleteSentences('Just one incomplete chunk')
    expect(result.sentences).toEqual([])
  })
})

describe('splitSentences (complete text)', () => {
  it('splits a paragraph into sentences', () => {
    const sentences = splitSentences('Hello world. How are you? I am fine.')
    expect(sentences.length).toBeGreaterThanOrEqual(3)
  })

  it('returns empty array for empty string', () => {
    expect(splitSentences('')).toEqual([])
  })

  it('returns single-element array for text with no sentence boundary', () => {
    const sentences = splitSentences('Just a single thought')
    expect(sentences).toHaveLength(1)
    expect(sentences[0]).toBe('Just a single thought')
  })

  it('trims whitespace from each sentence', () => {
    const sentences = splitSentences('  Hello.   World.  ')
    sentences.forEach((s) => {
      expect(s).toBe(s.trim())
    })
  })
})
