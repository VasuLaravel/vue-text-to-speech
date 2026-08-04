# useStreamingTTS

Composable that pipes an `AsyncIterable<string>` token stream to speech. Text is buffered, split into sentences using `Intl.Segmenter`, and each sentence is enqueued for playback as it forms — enabling near-real-time streaming speech from LLM responses.

## Import

```ts
import { useStreamingTTS } from 'vue-text-to-speech'
```

## Usage

```vue
<script setup lang="ts">
import { useStreamingTTS } from 'vue-text-to-speech'

const { pipeStream, isStreaming, stop, queue, currentItem } = useStreamingTTS()

async function speak() {
  await pipeStream(myLLMStream())
}
</script>

<template>
  <button :disabled="isStreaming" @click="speak()">Start</button>
  <button :disabled="!isStreaming" @click="stop()">Stop</button>
  <p>Now speaking: {{ currentItem }}</p>
  <p>Queue: {{ queue }}</p>
</template>
```

## Parameters

```ts
interface UseStreamingTTSOptions {
  /** Override the injected provider for this composable instance */
  provider?: TTSProvider
}

function useStreamingTTS(options?: UseStreamingTTSOptions): UseStreamingTTSReturn
```

All options are optional. Provider configuration is normally provided globally via `app.use(VueSpeech, config)`.

## Return Value

```ts
interface UseStreamingTTSReturn {
  /** Pipe an AsyncIterable<string> to speech */
  pipeStream(stream: AsyncIterable<string>): Promise<void>
  /** Sentences queued for playback */
  queue: Readonly<Ref<readonly string[]>>
  /** The sentence currently being spoken */
  currentItem: Readonly<Ref<string | null>>
  /** The raw token being accumulated into the buffer */
  currentChunk: Readonly<Ref<string>>
  /** True while a stream is being processed */
  isStreaming: Readonly<Ref<boolean>>
  /** Cancel the active stream and clear the queue */
  stop(): void
}
```

## Sentence Detection

The library uses `Intl.Segmenter` with `{ granularity: 'sentence' }` to detect sentence boundaries. The final partial sentence (if any) is flushed when the source stream closes.

```ts
// Under the hood
const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' })
```

## Stream Cancellation

Calling `stop()` uses an `AbortController` to cancel the active stream. Any tokens in the accumulation buffer are discarded — only fully-formed sentences that were already enqueued will finish playing.

```ts
const { pipeStream, stop } = useStreamingTTS()

const streamPromise = pipeStream(myStream())

// Cancel mid-stream
stop()
await streamPromise // resolves after cleanup
```

## OpenAI Example

```ts
import OpenAI from 'openai'
import { useStreamingTTS } from 'vue-text-to-speech'

const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_KEY, dangerouslyAllowBrowser: true })
const { pipeStream } = useStreamingTTS()

async function ask(prompt: string) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  await pipeStream(
    (async function* () {
      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content ?? ''
      }
    })()
  )
}
```

See the [Gen AI Integration Guide](/guides/gen-ai) for a full working example with error handling and a stop button.

## Browser Support

Requires `Intl.Segmenter` — available in all modern browsers (Chrome 87+, Firefox 78+, Safari 14.1+, Edge 87+).
