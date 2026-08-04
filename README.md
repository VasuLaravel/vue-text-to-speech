# vue-text-to-speech

[![npm version](https://img.shields.io/npm/v/vue-text-to-speech?color=6366f1)](https://www.npmjs.com/package/vue-text-to-speech)
[![npm downloads](https://img.shields.io/npm/dm/vue-text-to-speech)](https://www.npmjs.com/package/vue-text-to-speech)
[![CI](https://github.com/VasuLaravel/vue-text-to-speech/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/VasuLaravel/vue-text-to-speech/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/vue-text-to-speech)](https://github.com/VasuLaravel/vue-text-to-speech/blob/master/LICENSE)

Vue 3 text-to-speech plugin with composables, drop-in components and multi-provider support — **Web Speech API, OpenAI, ElevenLabs and Azure Cognitive Services**, all behind one unified interface.

**[📖 Documentation](https://vue-text-to-speech-docs.vercel.app)** · **[🛝 Live Playground](https://vue-text-to-speech-playground.vercel.app)** · **[📦 NPM](https://www.npmjs.com/package/vue-text-to-speech)**

---

## Features

- 🎙️ **Four providers** — Web Speech (zero config), OpenAI, ElevenLabs, Azure
- ⚡ **Composable-first** — `useSpeechSynthesis`, `useSpeechRecognition`, `useStreamingTTS`, `useVoiceQueue`
- 🤖 **LLM streaming** — pipe `AsyncIterable<string>` token streams directly to speech
- 🧩 **Drop-in components** — `VueSpeechPlayer`, `VueSpeechRecorder`, `VueSpeechVoiceSelect`
- 🔒 **Security-first** — `baseURL` override on all AI providers for server-side proxying
- 📘 **TypeScript** — full declarations shipped, no `@types/*` needed
- 🧪 **207 tests** — Vitest + @vue/test-utils, SSR-safe

## Installation

```sh
npm install vue-text-to-speech
# pnpm add vue-text-to-speech
# yarn add vue-text-to-speech
```

## Quick Start

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
<script setup lang="ts">
import { useSpeechSynthesis } from 'vue-text-to-speech'

const { speak, stop, isSpeaking } = useSpeechSynthesis()
</script>

<template>
  <button @click="speak('Hello, world!')">Speak</button>
  <button @click="stop()">Stop</button>
</template>
```

## AI Providers

```ts
// OpenAI
createApp(App).use(VueSpeech, {
  provider: 'openai',
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  voice: 'nova',
  model: 'tts-1-hd',
}).mount('#app')

// ElevenLabs
createApp(App).use(VueSpeech, {
  provider: 'elevenlabs',
  apiKey: import.meta.env.VITE_ELEVEN_KEY,
  voiceId: 'EXAVITQu4vr4xnSDxMaL',   // default voice; find IDs at elevenlabs.io/voice-library
}).mount('#app')

// Azure Cognitive Services
createApp(App).use(VueSpeech, {
  provider: 'azure',
  subscriptionKey: import.meta.env.VITE_AZURE_KEY,
  region: 'eastus',
  voice: 'en-US-JennyNeural',
}).mount('#app')
```

> ⚠️ Never expose API keys in the browser. Use the `baseURL` option to proxy requests through your server. See the [Security Guide](https://vue-text-to-speech-docs.vercel.app/guides/security).

## LLM Streaming

```ts
import { useStreamingTTS } from 'vue-text-to-speech'

const { pipeStream, isStreaming, stop } = useStreamingTTS()

// Pipe any AsyncIterable<string> — tokens are split into sentences
// and spoken as they form using Intl.Segmenter
await pipeStream(myOpenAIStream())
```

## Speech Recognition (STT)

```ts
import { useSpeechRecognition } from 'vue-text-to-speech'

const { start, stop, isListening, transcript, finalTranscript } =
  useSpeechRecognition({ lang: 'en-US', continuous: true })
```

Always uses the browser's `SpeechRecognition` API regardless of the TTS provider configured.

## Drop-in Components

```vue
<!-- Full player: voice select + sliders + controls -->
<VueSpeechPlayer text="Hello from vue-text-to-speech!" />

<!-- Mic button with live transcript -->
<VueSpeechRecorder @final-transcript="onTranscript" />

<!-- Standalone voice selector (pair with useSpeechSynthesis) -->
<VueSpeechVoiceSelect v-model="selectedVoice" :voices="voices" :loading="isLoadingVoices" />
```

Register all three components globally in one go:

```ts
createApp(App)
  .use(VueSpeech, { provider: 'web', components: true })
  .mount('#app')
```

## Documentation

Full API reference, provider guides and integration examples:  
👉 **[vue-text-to-speech-docs.vercel.app](https://vue-text-to-speech-docs.vercel.app)**

## Live Playground

Try all providers and components in the browser:  
👉 **[vue-text-to-speech-playground.vercel.app](https://vue-text-to-speech-playground.vercel.app)**

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history and migration notes from v1.

## License

MIT © [kunchamvasu](https://github.com/VasuLaravel)
