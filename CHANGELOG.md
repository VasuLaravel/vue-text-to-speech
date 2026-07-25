# Changelog

All notable changes to `vue-text-to-speech` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-07-25

### Breaking Changes

- **Named export** — `VueSpeech` is now a named export, not the default export
- **`ProviderConfig` required** — `app.use(VueSpeech, { provider: 'web' })` config is now required
- **`useTTS()` removed** — replaced by `useSpeechSynthesis()`
- **`useSTT()` removed** — replaced by `useSpeechRecognition()`
- **Component renames** — `<SpeechPlayer>` → `<VueSpeechPlayer>`, `<SpeechRecorder>` → `<VueSpeechRecorder>`, `<VoiceSelect>` → `<VueSpeechVoiceSelect>`
- **Event renames** — `@playing` → `@start`, `@stopped` → `@end`, `@failed` → `@error` (with structured `SpeechError` payload), `@result` → `@transcript`, `@done` → `@final-transcript`
- **Prop renames** — `content` → `text`, `auto` → `autoSpeak`, `language` → `lang`, `loop` → `continuous`
- **Error payload** — errors are now `SpeechError` objects (`{ code, message, cause? }`) instead of strings
- **CSS** — replaced Sass variables with CSS custom properties (`--vts-primary`, `--vts-bg`, etc.)
- **Node.js** — minimum version raised from 14 to **18**

### Added

- **Multi-provider TTS** — OpenAI, ElevenLabs, and Azure Cognitive Services providers alongside native Web Speech
- **`useStreamingTTS()`** — pipe `AsyncIterable<string>` LLM token streams to speech with sentence-boundary buffering
- **`useVoiceQueue()`** — FIFO queue composable for sequential utterance playback
- **TypeScript** — full declarations shipped in the package; no `@types/*` needed
- **SSR-safe** — all browser API access guarded by `typeof window !== 'undefined'`
- **`baseURL` option** — all AI providers accept a `baseURL` to route through a server-side proxy
- **189 tests** — unit, component and integration tests via Vitest + `@vue/test-utils`
- **Provenance publishing** — NPM publish includes SLSA provenance via GitHub Actions OIDC
- **VitePress docs** — full documentation site at `apps/docs/`

### Changed

- Rewritten in TypeScript with Vite 6 library mode (dual ESM + CJS output)
- Package sub-path exports: `vue-text-to-speech/providers/openai`, `.../elevenlabs`, `.../azure`
- Components use CSS custom properties for theming (no UI framework dependency)

---

## [1.x] — Legacy

See [GitHub releases](https://github.com/VasuLaravel/vue-text-to-speech/releases) for v1 history.
