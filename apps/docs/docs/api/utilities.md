# Utility Functions

Low-level sentence-boundary utilities exported from `vue-text-to-speech`. Useful when building custom streaming pipelines on top of `useVoiceQueue`.

## Import

```ts
import { extractCompleteSentences, splitSentences } from 'vue-text-to-speech'
```

Both functions use a shared `Intl.Segmenter` instance (`{ granularity: 'sentence' }`) and add zero runtime dependencies.

---

## extractCompleteSentences

Used internally by `useStreamingTTS` on every incoming token. Given a growing buffer of accumulated tokens, returns all sentences that are safe to enqueue, plus the remaining partial sentence.

```ts
function extractCompleteSentences(buffer: string): {
  sentences: string[]   // complete sentences ready to speak
  remaining: string     // partial sentence still forming
}
```

### How it works

The last segment produced by `Intl.Segmenter` is always treated as incomplete, because more tokens may arrive and extend it. All earlier segments are considered complete.

```ts
// Token arrives: "Hello world. How are"
extractCompleteSentences('Hello world. How are')
// → { sentences: ['Hello world.'], remaining: 'How are' }

// Next token arrives: " you?"
extractCompleteSentences('How are you?')
// → { sentences: ['How are you?'], remaining: '' }
```

### Streaming example

```ts
import { extractCompleteSentences } from 'vue-text-to-speech'
import { useVoiceQueue } from 'vue-text-to-speech'

const { enqueue } = useVoiceQueue()

let buffer = ''

for await (const token of myLLMStream()) {
  buffer += token
  const { sentences, remaining } = extractCompleteSentences(buffer)
  sentences.forEach(enqueue)
  buffer = remaining
}

// Flush any trailing partial sentence when stream ends
if (buffer.trim()) enqueue(buffer)
```

::: tip
Use `useStreamingTTS` if you want this pattern handled automatically, including `AbortController`-based cancellation.
:::

---

## splitSentences

Splits a **complete** text string into all its sentences. Intended for pre-existing content, not streaming buffers.

```ts
function splitSentences(text: string): string[]
```

### Example

```ts
import { splitSentences } from 'vue-text-to-speech'

splitSentences('Hello world. How are you? Fine, thanks!')
// → ['Hello world.', 'How are you?', 'Fine, thanks!']

splitSentences('')
// → []
```

### Enqueuing a paragraph

```ts
import { splitSentences } from 'vue-text-to-speech'
import { useVoiceQueue } from 'vue-text-to-speech'

const { enqueue } = useVoiceQueue()

const paragraph = 'The quick brown fox jumped. It landed gracefully.'
splitSentences(paragraph).forEach(enqueue)
```

## Browser / Node Support

`Intl.Segmenter` is available in:

| Environment | Support |
|---|---|
| Chrome 87+ | ✅ |
| Edge 87+ | ✅ |
| Firefox 78+ | ✅ |
| Safari 14.1+ | ✅ |
| Node.js 16+ | ✅ |
