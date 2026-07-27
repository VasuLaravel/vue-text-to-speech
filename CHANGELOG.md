# Changelog

All notable changes to `vue-text-to-speech` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.3] — 2026-07-27

### Fixed
- **`useSpeechRecognition` stops on short pauses** — `continuous` now defaults to `true` in `WebSpeechSTTProvider` (was `false`), preventing the browser from terminating the session after every sentence-length silence
- **`isListening` desync after natural end** — `WebSpeechSTTProvider` now wires `rec.onend` and exposes an `onEnd` callback on the `STTProvider` interface; `useSpeechRecognition` uses this to keep `isListening` accurate when the browser ends recognition on its own
- **Auto-restart on unexpected browser stop** — `useSpeechRecognition` now transparently restarts the provider when the session ends unexpectedly (network hiccup, tab backgrounding, etc.) while `isListening` is still `true`; calling `stop()` still terminates cleanly with no restart
- **`stop()` / `onUnmounted` ordering** — `isListening` is now set to `false` before `provider.stop()` is called, ensuring the auto-restart guard never triggers during intentional teardown

### Changed
- `WebSpeechSTTOptions.continuous` default changed from `false` → `true`
- `STTProvider` interface gains `onEnd(cb: () => void): void`

### Added
- 6 new tests covering `onEnd` callback, natural-end detection, auto-restart behaviour, and the manual-stop guard (195 total, up from 189)



## [2.0.2] — 2026-07-25

### Fixed
- Bug Fixes


## [2.0.1] — 2026-07-25

### Fixed
- Provider test mocks updated to avoid jsdom `Blob.stream()` incompatibility with Node.js 22
- Added missing `README.md` to published package
- Fixed GitHub Actions pnpm version conflict and Node.js version requirement


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
