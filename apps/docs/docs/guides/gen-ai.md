# Gen AI Integration Guide

`useStreamingTTS` is designed to work directly with LLM streaming APIs. Tokens flow from the model, through sentence boundary detection, to your speakers — with minimal latency.

## How It Works

```
LLM stream  ──► pipeStream()  ──► Intl.Segmenter  ──► useVoiceQueue  ──► TTS provider
  tokens         (async iter)     (sentence split)     (FIFO playback)
```

Each token is appended to a buffer. When the `Intl.Segmenter` detects a sentence boundary, the complete sentence is enqueued for immediate playback. The next sentence queues while the first is still being spoken.

## OpenAI Chat Completions

### Install the SDK

```sh
pnpm add openai
```

### Full Working Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import OpenAI from 'openai'
import { useStreamingTTS } from 'vue-text-to-speech'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,   // move to server in production
})

const { pipeStream, isStreaming, stop } = useStreamingTTS()
const prompt = ref('')
const status = ref('')

async function ask() {
  if (!prompt.value.trim()) return
  status.value = 'Generating...'

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [{ role: 'user', content: prompt.value }],
    })

    status.value = 'Speaking...'
    await pipeStream(extractTokens(completion))
    status.value = 'Done'
  } catch (e) {
    status.value = `Error: ${e}`
    console.error(e)
  }
}

async function* extractTokens(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content ?? ''
  }
}
</script>

<template>
  <textarea v-model="prompt" placeholder="Ask anything..." />
  <button :disabled="isStreaming" @click="ask()">Ask & Speak</button>
  <button :disabled="!isStreaming" @click="stop()">Stop</button>
  <p>{{ status }}</p>
</template>
```

::: warning API Key Security
The `dangerouslyAllowBrowser: true` flag is for development only. See [Security Guide](/guides/security) for the proxy pattern that should be used in production.
:::

## Server-Side Approach (Recommended for Production)

Proxy both the LLM and TTS calls through your server so no keys reach the browser:

### Express Server

```ts
// server.ts
import express from 'express'
import OpenAI from 'openai'

const app = express()
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY })

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? ''
    if (token) res.write(`data: ${JSON.stringify(token)}\n\n`)
  }
  res.write('data: [DONE]\n\n')
  res.end()
})
```

### Vue Client (EventSource)

```ts
import { useStreamingTTS } from 'vue-text-to-speech'

const { pipeStream } = useStreamingTTS()

async function ask(prompt: string) {
  await pipeStream(sseStream(`/api/chat`, prompt))
}

async function* sseStream(url: string, prompt: string): AsyncIterable<string> {
  const es = new EventSource(`${url}?prompt=${encodeURIComponent(prompt)}`)
  try {
    yield* new ReadableStream<string>({
      start(controller) {
        es.onmessage = (e) => {
          if (e.data === '[DONE]') { controller.close() } else {
            controller.enqueue(JSON.parse(e.data))
          }
        }
        es.onerror = () => controller.error(new Error('SSE error'))
      },
    })
  } finally {
    es.close()
  }
}
```

## Combining with OpenAI TTS Provider

For the best AI voice quality, use the OpenAI TTS provider together with streaming chat:

```ts
// main.ts — use OpenAI for both LLM and TTS
createApp(App)
  .use(VueSpeech, {
    provider: 'openai',
    apiKey: '',           // proxied — see Security Guide
    baseURL: '/api/tts',
    voice: 'nova',
    model: 'tts-1',
  })
  .mount('#app')
```

Now `pipeStream()` will route each sentence through `nova` neural voice instead of the browser's built-in voices.

## Latency Tips

- Use `tts-1` (vs `tts-1-hd`) for faster first-word audio
- Keep sentences short — 10–20 words queue and play faster than long paragraphs
- Use `ElevenLabs eleven_turbo_v2` for the lowest overall latency
- For Web Speech, shorter sentences reduce per-utterance startup cost
