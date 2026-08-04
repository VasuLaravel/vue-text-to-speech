# Getting Started

## Installation

::: code-group

```sh [npm]
npm install vue-text-to-speech
```

```sh [pnpm]
pnpm add vue-text-to-speech
```

```sh [yarn]
yarn add vue-text-to-speech
```

:::

## Quick Start — Web Speech (zero config)

The native browser Web Speech API works with no API key and no network requests.

```ts
// main.ts
import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'
import App from './App.vue'

createApp(App)
  .use(VueSpeech, { provider: 'web' })
  .mount('#app')
```

```vue
<!-- MyComponent.vue -->
<script setup lang="ts">
import { useSpeechSynthesis } from 'vue-text-to-speech'

const { speak, stop, isSpeaking, voices, selectedVoice } = useSpeechSynthesis()
</script>

<template>
  <button :disabled="isSpeaking" @click="speak('Hello, world!')">Speak</button>
  <button :disabled="!isSpeaking" @click="stop()">Stop</button>
</template>
```

## Drop-in Components

If you'd rather use pre-built UI, import the components directly:

```vue
<script setup lang="ts">
import { VueSpeechPlayer, VueSpeechRecorder } from 'vue-text-to-speech'
</script>

<template>
  <!-- Renders a full player: voice select + sliders + play/pause/stop -->
  <VueSpeechPlayer text="Hello from vue-text-to-speech!" />

  <!-- Renders a mic button with live transcript -->
  <VueSpeechRecorder @final-transcript="onTranscript" />
</template>
```

For rapid prototyping you can register all three components globally via the plugin option:

```ts
createApp(App)
  .use(VueSpeech, { provider: 'web', components: true })
  .mount('#app')
```

This registers `VueSpeechPlayer`, `VueSpeechRecorder`, and `VueSpeechVoiceSelect` globally so you don’t need per-file imports. For production builds prefer individual imports — they are tree-shakeable.

Components use CSS custom properties for theming — no UI framework required. See [Component Reference](/components/vue-speech-player).

## AI Providers

To switch to an AI provider, change the config passed to `app.use()`:

```ts
// OpenAI
createApp(App)
  .use(VueSpeech, {
    provider: 'openai',
    apiKey: import.meta.env.VITE_OPENAI_KEY,
    model: 'tts-1-hd',
    voice: 'nova',
  })
  .mount('#app')
```

::: warning API Keys in the Browser
Never ship real API keys in front-end code. Use the `baseURL` option to route requests through a server-side proxy. See the [Security Guide](/guides/security).
:::

Full configuration options for each provider:

- [Web Speech (Native)](/providers/web)
- [OpenAI](/providers/openai)
- [ElevenLabs](/providers/elevenlabs)
- [Azure Cognitive Services](/providers/azure)

## LLM Streaming

Pipe `AsyncIterable<string>` token streams directly to speech — sentences are detected with `Intl.Segmenter` and spoken as they form:

```ts
import { useStreamingTTS } from 'vue-text-to-speech'

const { pipeStream, isStreaming, stop } = useStreamingTTS()

async function* myLLMStream() {
  // yield tokens from your LLM SDK, EventSource, etc.
}

await pipeStream(myLLMStream())
```

See the [Gen AI Integration Guide](/guides/gen-ai) for a complete OpenAI SDK example.

## TypeScript

The package ships full TypeScript declarations. No `@types/*` package needed.

```ts
import type {
  UseSpeechSynthesisReturn,
  UseSpeechRecognitionReturn,
  VoiceInfo,
  SpeakOptions,
  SpeechError,
  SpeechErrorCode,
  ProviderConfig,
  TTSProvider,
} from 'vue-text-to-speech'
```

## Advanced Usage

### Factory Functions

For cases where you cannot use `app.use()` (e.g. Nuxt plugins, custom Vue apps), you can create a provider manually:

```ts
import { createVueSpeech, createWebSpeechProvider } from 'vue-text-to-speech'

// Async — supports all four providers (tree-shakes AI providers when unused)
const provider = await createVueSpeech({ provider: 'openai', apiKey: '...' })

// Sync — Web Speech only, zero overhead
const webProvider = createWebSpeechProvider()
```

### Providing a Provider Manually

Use `SPEECH_PROVIDER_KEY` to inject a provider into a component subtree without the full plugin:

```ts
import { provide } from 'vue'
import { SPEECH_PROVIDER_KEY, createWebSpeechProvider } from 'vue-text-to-speech'

// In a parent component or app setup
provide(SPEECH_PROVIDER_KEY, createWebSpeechProvider())
```

All composables (`useSpeechSynthesis`, `useVoiceQueue`, `useStreamingTTS`) will automatically pick up the provided instance.

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| Web Speech TTS | ✅ | ✅ | ✅ | ✅ |
| Web Speech STT | ✅ | ❌ | ✅ | ✅ |
| AI Providers (fetch) | ✅ | ✅ | ✅ | ✅ |
| Streaming TTS | ✅ | ✅ | ✅ | ✅ |

> SSR-safe: all browser-specific code is guarded by `typeof window !== 'undefined'` checks.


<template>
  <button @click="speak('Hello world!')" :disabled="isSpeaking">
    {{ isSpeaking ? 'Speaking...' : 'Speak' }}
  </button>
</template>
```
