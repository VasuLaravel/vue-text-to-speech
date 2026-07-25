---
layout: home

hero:
  name: vue-text-to-speech
  text: Voice in every Vue app
  tagline: Composables, drop-in components and multi-provider TTS/STT for Vue 3 — Web Speech, OpenAI, ElevenLabs & Azure.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api/use-speech-synthesis
    - theme: alt
      text: View on GitHub
      link: https://github.com/VasuLaravel/vue-text-to-speech

features:
  - icon: 🎙️
    title: Four Providers
    details: Native browser Web Speech API (zero config), OpenAI TTS, ElevenLabs, and Azure Cognitive Services — all behind one unified interface.
  - icon: ⚡
    title: Composable-first
    details: useSpeechSynthesis, useSpeechRecognition, useStreamingTTS and useVoiceQueue. Tree-shakeable — import only what you use.
  - icon: 🤖
    title: LLM Streaming
    details: Pipe AsyncIterable<string> token streams directly to speech. Sentences are detected with Intl.Segmenter and spoken as they form.
  - icon: 🧩
    title: Drop-in Components
    details: VueSpeechPlayer, VueSpeechRecorder and VueSpeechVoiceSelect — fully accessible, keyboard-navigable, themed via CSS custom properties.
  - icon: 🔒
    title: Security-first
    details: baseURL override on every AI provider lets you proxy requests through your server so API keys never reach the browser.
  - icon: 🧪
    title: 189 Tests
    details: Unit, component and integration tests with Vitest and @vue/test-utils. SSR-safe — no crashes on server render.
---
