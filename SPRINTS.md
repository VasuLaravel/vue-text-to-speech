# vue-text-to-speech v2.0.0 — Sprint Execution Plan

8 sprints · 2 weeks each · ~16 weeks total  
Branch: `new` → merge to `main` on Sprint 8 completion → NPM publish

---

## Pre-Sprint Decisions Required

These must be locked **before Sprint 1 starts** to prevent mid-sprint rework:

| # | Decision | Chosen |
|---|---|---|
| D-1 | Node.js LTS version | **20.x** — add `.nvmrc` + `"engines"` field to root `package.json` |
| D-2 | Vite version | **6.x** (current stable 2026) |
| D-3 | Audio playback for AI providers | **Blob URL for v2** (`fetch` → buffer → `createObjectURL` → `<audio>`) — PCM streaming deferred to v3 |
| D-4 | Sentence boundary detection | **`Intl.Segmenter`** with `{ granularity: 'sentence' }` — no regex |
| D-5 | Docs deployment target | **Vercel** (`base: '/'`) — enables custom domain |
| D-6 | NPM publish auth | **OIDC** (`npm publish --provenance`) — `NPM_TOKEN` approach deprecated Aug 2026 |
| D-7 | `TTSProvider` lifecycle hooks | Add `onEnd`, `onStart`, `onError` callbacks to interface in Sprint 2 — required by Sprint 5 queue |
| D-8 | `STTProvider` interface | Define separately alongside `TTSProvider` in Sprint 2 task 2.1 |

---

## Sprint 1 — Monorepo Foundation
**Goal:** Replace the Vue 2 project scaffolding with a production-grade pnpm monorepo. Nothing is publishable yet, but all tooling is locked in.

### Tasks

| # | Task | Output |
|---|---|---|
| 1.1 | Install pnpm globally, initialize `pnpm-workspace.yaml` | `pnpm-workspace.yaml` |
| 1.2 | Create root `package.json` (workspace root, not publishable) | `package.json` |
| 1.3 | Create root `tsconfig.base.json` with strict TypeScript settings | `tsconfig.base.json` |
| 1.4 | Create `turbo.json` with `build`, `test`, `lint`, `docs:build` pipelines | `turbo.json` |
| 1.5 | Scaffold `packages/vue-text-to-speech/` with its own `package.json`, `tsconfig.json`, `vite.config.ts` (library mode, dual ESM+CJS, vite-plugin-dts) | `packages/vue-text-to-speech/` |
| 1.6 | Scaffold `apps/playground/` — fresh Vue 3 + Vite + TypeScript app | `apps/playground/` |
| 1.7 | Scaffold `apps/docs/` — bare VitePress install | `apps/docs/` |
| 1.8 | Move `src/App.vue` → `apps/playground/src/App.vue`, `src/main.js` → `apps/playground/src/main.ts` | Playground has old demo running |
| 1.9 | Add root `eslint.config.js` (ESLint v9 flat config) with `vue-eslint-parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-vue`; add `.prettierrc`, `.gitignore`, `.npmrc` | Lint + format tooling |
| 1.10 | Verify `pnpm --filter vue-text-to-speech build` runs (empty `src/index.ts` → empty `dist/`) | `dist/` emits |
| 1.11 | Add `.nvmrc` (`20.x`), set `"engines": { "node": ">=20", "pnpm": ">=9" }` + `"private": true` in root `package.json`, add `@changesets/cli` devDependency to monorepo root, add `apps/playground/.env.example` with placeholder key names | Node version pinned, accidental publish blocked, CHANGELOG tooling ready |

### Definition of Done
- `pnpm install` from root installs all workspaces
- `pnpm build` via Turborepo completes without error
- Old Vue 2 files (`babel.config.js`, root-level `src/`) are removed
- `.nvmrc` (`20.x`) committed and `engines` field set in root `package.json`
- Multi-entry `vite.config.ts` lib entries defined for all provider subpaths
- Playground runs at `localhost:5173` as a minimal Vue 3 placeholder (not the old Vue 2 demo)
- `eslint.config.js` flat config working with zero lint errors

### Impediments & Solutions

| ID | Impediment | Risk | Solution |
|---|---|---|---|
| I-1.1 | No Node.js version pinned anywhere — different devs and CI get different behaviour | High | Add `.nvmrc` (`20.x`) and `"engines": { "node": ">=20", "pnpm": ">=9" }` — added as task 1.11 |
| I-1.2 | Task 1.8 — old `src/` is Vue 2 (`new Vue()`) and cannot run inside a Vue 3 app | High | Rewrite as a minimal Vue 3 `createApp` placeholder. Full playground rebuilt progressively in Sprints 2–6 |
| I-1.3 | `.eslintrc` is a legacy format — ESLint v9+ uses `eslint.config.js` (flat config) | Medium | Task 1.9 updated: use `eslint.config.js` with `vue-eslint-parser`, `@typescript-eslint`, `eslint-plugin-vue` |
| I-1.4 | Multi-entry Vite config for subpath exports deferred to Sprint 7 forces a rework of Sprint 1's `vite.config.ts` | High | Define multi-entry lib config in task 1.5 now: `lib.entry = { index: 'src/index.ts', 'providers/openai': '...', 'providers/elevenlabs': '...', 'providers/azure': '...' }` |
| I-1.5 | `"private": true` not explicitly stated on root `package.json` — root could be accidentally published | Medium | Add `"private": true` as a required field — included in task 1.11 |

---

## Sprint 2 — Provider Types + WebSpeechProvider
**Goal:** Define the provider contract and implement the first (and most important) provider — the browser's native Web Speech API.

### Tasks

| # | Task | Output |
|---|---|---|
| 2.1 | Write `src/providers/types.ts` — `TTSProvider` interface, `SpeakOptions`, `VoiceInfo`, `SpeechError`, `ProviderConfig` union type | `types.ts` |
| 2.2 | Write `WebSpeechProvider` TTS — wraps `SpeechSynthesis`, SSR-safe, normalizes `SpeechSynthesisVoice[]` → `VoiceInfo[]`, handles Chrome's async `voiceschanged` quirk | `WebSpeechProvider.ts` |
| 2.3 | Write `WebSpeechProvider` STT — wraps `SpeechRecognition` / `webkitSpeechRecognition`, exposes `start`, `stop`, interim + final transcript events | (same file, separate class or method group) |
| 2.4 | Write `createVueSpeech(config)` factory — returns typed provider based on `config.provider` | `src/factory.ts` |
| 2.5 | Write Vitest unit tests for `WebSpeechProvider` TTS (mock `window.speechSynthesis`) | `tests/providers/web.spec.ts` |
| 2.6 | Write Vitest unit tests for `WebSpeechProvider` STT (mock `SpeechRecognition`) | `tests/providers/web-stt.spec.ts` |
| 2.7 | Write SSR safety test — run provider in Vitest `node` environment, assert no crash | `tests/ssr/web.spec.ts` |

### Definition of Done
- `WebSpeechProvider.speak()` plays audio in the playground browser
- `WebSpeechProvider` STT transcribes microphone input in the playground
- `TTSProvider` interface includes `onEnd`, `onStart`, `onError` lifecycle hooks
- `STTProvider` interface defined in `types.ts` alongside `TTSProvider`
- `WebSpeechTTSProvider` and `WebSpeechSTTProvider` are separate exported classes
- Chrome `voiceschanged` async quirk handled with Promise + 3-second timeout fallback
- All unit + SSR tests pass (`pnpm test`)

### Impediments & Solutions

| ID | Impediment | Risk | Solution |
|---|---|---|---|
| I-2.1 | `TTSProvider` interface has no lifecycle hooks (`onEnd`, `onStart`, `onError`) — Sprint 5's `useVoiceQueue` cannot auto-advance without them | High | Add `onEnd(cb: () => void)`, `onStart(cb: () => void)`, `onError(cb: (e: SpeechError) => void)` to `TTSProvider` interface in task 2.1 |
| I-2.2 | No `STTProvider` interface defined — `useSpeechRecognition` (Sprint 4) has a completely different API surface from `TTSProvider` | High | Define `STTProvider` in `types.ts`: `start()`, `stop()`, `onTranscript(cb)`, `onFinalTranscript(cb)`, `onError(cb)`, `readonly continuous: boolean` |
| I-2.3 | Task 2.3 — one class implementing both TTS and STT violates SRP and hurts tree-shaking | Medium | Split into `WebSpeechTTSProvider` and `WebSpeechSTTProvider` — two classes in the same file, exported separately |
| I-2.4 | Chrome `voiceschanged` race condition — `getVoices()` returns `[]` on first call. Safari and Firefox behave differently | High | Implement `loadVoices()` as a Promise: if `getVoices()` returns non-empty array, resolve immediately; else wait for `voiceschanged` event with a 3-second timeout fallback |
| I-2.5 | `isSupported` is a plain `boolean` on the provider but Vue needs `Ref<boolean>` for SSR hydration | Medium | Keep `isSupported` as plain `boolean` on the provider class. The composable (Sprint 4) wraps it in `shallowRef` |

---

## Sprint 3 — AI Providers (OpenAI · ElevenLabs · Azure)
**Goal:** Implement the three AI-powered TTS providers using pure `fetch()`. No external SDKs.

### Tasks

| # | Task | Output |
|---|---|---|
| 3.1 | Write `OpenAIProvider` — `POST /v1/audio/speech`, buffer full response then play via `URL.createObjectURL(blob)` + `<audio>` element (**PCM streaming deferred to v3** — `decodeAudioData()` cannot handle compressed chunk streams), support `baseURL` override, config: `apiKey`, `model` (tts-1/tts-1-hd), `voice`, `speed` | `OpenAIProvider.ts` |
| 3.2 | Write `ElevenLabsProvider` — `/v1/text-to-speech/:voiceId/stream`, buffer full response then play via blob URL (**`MediaSource` streaming deferred to v3**), support `baseURL` override, config: `apiKey`, `voiceId`, `modelId`, `stability`, `similarity_boost` | `ElevenLabsProvider.ts` |
| 3.3 | Write `AzureProvider` — `POST https://{region}.tts.speech.microsoft.com/cognitiveservices/v1`, SSML body, `fetch()` returns audio blob → play via `AudioContext`, support `baseURL` override, config: `subscriptionKey`, `region`, `voice` | `AzureProvider.ts` |
| 3.4 | Update `createVueSpeech()` factory to wire up all three new providers | `factory.ts` |
| 3.5 | Write Vitest unit tests for `OpenAIProvider` (mock `fetch`, assert SSML body + headers, assert audio pipeline called) | `tests/providers/openai.spec.ts` |
| 3.6 | Write Vitest unit tests for `ElevenLabsProvider` | `tests/providers/elevenlabs.spec.ts` |
| 3.7 | Write Vitest unit tests for `AzureProvider` (assert SSML generation, correct endpoint URL built from region) | `tests/providers/azure.spec.ts` |
| 3.8 | Manual playground test — add `.env.local` to playground, test each provider with a real API key | Playground demo updated |

### Definition of Done
- All three providers speak in the playground with real API keys
- `baseURL` override routes requests to a mock server in tests
- `getVoices()` implemented for all three providers (OpenAI: 6 hardcoded voices; ElevenLabs: `GET /v1/voices`; Azure: `GET /cognitiveservices/voices/list`)
- Non-2xx API responses throw typed `SpeechError` with correct `code` field
- `apps/playground/.env.example` committed with placeholder key names
- All unit tests pass, no API keys hardcoded anywhere

### Impediments & Solutions

| ID | Impediment | Risk | Solution |
|---|---|---|---|
| **I-3.1** | **`ReadableStream → AudioContext` does NOT work for MP3/Opus — `decodeAudioData()` requires a complete file, not chunks** | **Critical** | **v2 uses blob URL playback: `fetch()` → buffer full response → `URL.createObjectURL(blob)` → `<audio>.play()`. Tasks 3.1 and 3.2 updated accordingly. True PCM streaming deferred to v3** |
| I-3.2 | ElevenLabs `MediaSource + SourceBuffer` has same chunk-decoding problem and `MediaSource` API is being deprecated | High | Same fix as I-3.1: blob URL playback for v2. `MediaSource` streaming deferred to v3 |
| I-3.3 | Azure SSML template undefined — `X-Microsoft-OutputFormat` header unspecified | Medium | SSML template: `<speak version='1.0'><voice name='{voice}'>{text}</voice></speak>`. Output format header: `audio-16khz-128kbitrate-mono-mp3` |
| I-3.4 | `getVoices()` not implemented for any AI provider — `VueSpeechVoiceSelect` (Sprint 6) will show an empty list | Medium | OpenAI: return hardcoded array of 6 `VoiceInfo` objects. ElevenLabs: `GET /v1/voices`. Azure: `GET /cognitiveservices/voices/list` |
| I-3.5 | No error handling strategy for 401, 429 (rate limit), 5xx responses across all providers | Medium | All providers catch non-2xx responses and throw `SpeechError`. `429` sets `code: 'RATE_LIMIT'`. Others set `code: 'API_ERROR'` with HTTP status in message |
| I-3.6 | `.env.local` with real API keys could be accidentally committed | Low | Ensure `.env.local` is in `.gitignore` (task 1.9). Add `.env.example` to playground — included in task 1.11 |

---

## Sprint 4 — Core Composables (`useSpeechSynthesis` · `useSpeechRecognition`)
**Goal:** Wrap the providers in Vue 3 Composition API. This is the primary public API developers will use.

### Tasks

| # | Task | Output |
|---|---|---|
| 4.1 | Define `SPEECH_PROVIDER_KEY` injection symbol | `src/injectionKeys.ts` |
| 4.2 | Write `useSpeechSynthesis(options?)` — injects provider (falls back to `WebSpeechTTSProvider` with `console.warn` if used without `app.use()`), exposes reactive `isSpeaking`, `isPaused`, `voices`, `isLoadingVoices`, `selectedVoice`, `rate`, `pitch`, `volume`, `error`, `isSupported`, all wrapped in `readonly` | `composables/useSpeechSynthesis.ts` |
| 4.3 | Implement `onUnmounted` cleanup in `useSpeechSynthesis` (stop speaking, clear listeners) | (same file) |
| 4.4 | Write `useSpeechRecognition(options?)` — always creates its own `WebSpeechSTTProvider` instance internally (does **not** use the injected TTS provider), exposes `isListening`, `transcript`, `finalTranscript`, `confidence`, `lang`, `continuous`, `isSupported`, `error` | `composables/useSpeechRecognition.ts` |
| 4.5 | Implement `onUnmounted` cleanup in `useSpeechRecognition` (stop recognition) | (same file) |
| 4.6 | Write Vitest + `@vue/test-utils` unit tests for `useSpeechSynthesis` | `tests/composables/useSpeechSynthesis.spec.ts` |
| 4.7 | Write unit tests for `useSpeechRecognition` | `tests/composables/useSpeechRecognition.spec.ts` |
| 4.8 | Write SSR tests for both composables in Vitest `node` env | `tests/ssr/composables.spec.ts` |
| 4.9 | Update playground to use `useSpeechSynthesis` and `useSpeechRecognition` instead of direct component logic | `apps/playground/src/App.vue` |

### Definition of Done
- Playground uses composables exclusively (no direct provider calls in components)
- `useSpeechSynthesis` works with all 4 providers
- `useSpeechSynthesis` exposes `isLoadingVoices` and falls back gracefully when used without `app.use()`
- `useSpeechRecognition` always uses its own `WebSpeechSTTProvider` (not the injected TTS provider)
- `rate`/`pitch` change-mid-utterance behaviour is tested and documented
- Task 4.9 runs only after 4.2–4.8 are complete
- All tests pass

### Impediments & Solutions

| ID | Impediment | Risk | Solution |
|---|---|---|---|
| I-4.1 | `useSpeechSynthesis` crashes when used without `app.use()` — `inject()` returns `undefined` with no helpful error | High | Add fallback: `inject(SPEECH_PROVIDER_KEY, null) ?? createVueSpeech({ provider: 'web' })`. Log `console.warn` if fallback is triggered — task 4.2 updated |
| I-4.2 | `voices` loading is async for AI providers (ElevenLabs/Azure make API calls). No `isLoadingVoices` state in the defined interface | Medium | Add `isLoadingVoices: Readonly<Ref<boolean>>` to `useSpeechSynthesis` return interface — task 4.2 updated |
| I-4.3 | Task 4.4 said "injects or creates WebSpeechProvider" — injecting a TTS provider into an STT composable is a design error | High | `useSpeechRecognition` always creates its own `WebSpeechSTTProvider`. Never touches the injected TTS provider — task 4.4 updated |
| I-4.4 | Undefined behaviour: do `rate`/`pitch` `Ref` changes affect the current utterance or only the next `speak()` call? | Medium | Specify: changes take effect on the **next** `speak()` call. For mid-utterance changes on `WebSpeechProvider`, stop and restart. Document and test this behaviour |
| I-4.5 | Task 4.9 has an intra-sprint dependency on 4.2–4.8 completing first — not marked | Low | Task 4.9 explicitly depends on 4.2–4.8 |

---

## Sprint 5 — Streaming Composables (`useStreamingTTS` · `useVoiceQueue`)
**Goal:** Build the Gen AI flagship feature — real-time LLM-to-speech streaming.

### Tasks

| # | Task | Output |
|---|---|---|
| 5.1 | Write `useVoiceQueue()` — reactive queue of utterance strings, `enqueue`, `dequeue`, `clear`, `skip`, auto-advances when current utterance ends via provider `onend` event | `composables/useVoiceQueue.ts` |
| 5.2 | Write sentence boundary detector utility using `Intl.Segmenter` with `{ granularity: 'sentence' }` — browser-native, Node 16+, zero bundle size, handles decimals (`$3.50`), URLs, abbreviations (`Mr.`, `Dr.`), markdown, and all languages without regex | `src/utils/sentenceBoundary.ts` |
| 5.3 | Write `useStreamingTTS()` — accepts `AsyncIterable<string>`, buffers tokens through sentence boundary detector, enqueues complete sentences into `useVoiceQueue`, exposes `pipeStream`, `queue`, `currentChunk`, `isStreaming`, `stop` | `composables/useStreamingTTS.ts` |
| 5.4 | Handle interruption in `useStreamingTTS` — calling `stop()` mid-stream cancels the iterator and clears the queue | (same file) |
| 5.5 | Write Vitest tests for `useVoiceQueue` — ordering, skip, clear, auto-advance | `tests/composables/useVoiceQueue.spec.ts` |
| 5.6 | Write Vitest tests for `sentenceBoundary` utility — edge cases: ellipsis, abbreviations (Mr., Dr.), empty stream, single long sentence | `tests/utils/sentenceBoundary.spec.ts` |
| 5.7 | Write Vitest tests for `useStreamingTTS` — mock `AsyncIterable<string>`, assert chunks are enqueued in correct order, assert `stop()` cancels | `tests/composables/useStreamingTTS.spec.ts` |
| 5.8 | Add streaming demo to playground — connect a mock LLM stream (simulated with `setInterval`) to `useStreamingTTS` | `apps/playground/src/StreamingDemo.vue` |

### Definition of Done
- Streaming demo in playground speaks a simulated LLM response sentence by sentence
- `Intl.Segmenter` used for sentence boundary detection (no regex)
- `stop()` via `AbortController` immediately cancels the stream iterator and clears queue
- Partial sentence buffer is discarded on `stop()`
- `useStreamingTTS` injects TTS provider from `SPEECH_PROVIDER_KEY` with fallback
- All tests pass including sentence boundary edge cases

### Impediments & Solutions

| ID | Impediment | Risk | Solution |
|---|---|---|---|
| **I-5.1** | **Simple regex sentence boundary fails on real AI output: decimals, URLs, abbreviations (`Mr.`, `Dr.`), markdown, code blocks** | **High** | **Use `Intl.Segmenter` with `{ granularity: 'sentence' }` — browser-native, Node 16+, zero bundle size — task 5.2 updated** |
| I-5.2 | `useVoiceQueue` auto-advances "via provider `onend` event" but `TTSProvider` has no `onEnd` callback | High | Resolved by I-2.1: `onEnd` lifecycle hook added to `TTSProvider` interface in Sprint 2 |
| I-5.3 | `useStreamingTTS` never specifies how it gets the TTS provider — inject from symbol or parameter? | High | `useStreamingTTS` injects from `SPEECH_PROVIDER_KEY`. Falls back to `WebSpeechTTSProvider` if not provided (same pattern as `useSpeechSynthesis`) |
| I-5.4 | `iterator.return()` for cancellation only works if the iterable supports it — not all iterables do | High | Use `AbortController`: create a per-stream instance, call `controller.abort()` on `stop()`. Document that consumer iterables should respect `AbortSignal` for full cancellation |
| I-5.5 | Undefined: what happens to the partial sentence buffer when `stop()` is called? | Medium | Specify and test: partial buffer is **discarded** on `stop()`. If stream ends naturally without a final sentence boundary, buffer content is spoken as-is |

---

## Sprint 6 — UI Components
**Goal:** Build the three drop-in UI components on top of the composables.

### Tasks

| # | Task | Output |
|---|---|---|
| 6.1 | Write `<VueSpeechPlayer />` — uses `useSpeechSynthesis`, renders play/pause/stop controls + voice select + rate/pitch/volume sliders, emits `start`, `end`, `pause`, `resume`, `error` | `components/VueSpeechPlayer.vue` |
| 6.2 | Write `<VueSpeechRecorder />` — uses `useSpeechRecognition`, renders mic button with pulse animation while `isListening`, displays live `transcript`, emits `transcript`, `final-transcript`, `error` | `components/VueSpeechRecorder.vue` |
| 6.3 | Write `<VueSpeechVoiceSelect />` — uses `useSpeechSynthesis().voices`, groups voices by language with language labels, supports `v-model` binding, emits `update:modelValue` | `components/VueSpeechVoiceSelect.vue` |
| 6.4 | Style all components using CSS custom properties (`--vts-primary`, `--vts-bg`, `--vts-radius`, etc.) with sensible defaults — zero hard-coded colors | (each `.vue` file `<style>` block) |
| 6.5 | Ensure all components are fully keyboard-navigable and have correct ARIA attributes (`aria-label`, `role="status"` on live transcript, `aria-pressed` on mic button) | (each component) |
| 6.6 | Write `@vue/test-utils` tests for `<VueSpeechPlayer />` — assert controls render, assert emits fire | `tests/components/VueSpeechPlayer.spec.ts` |
| 6.7 | Write tests for `<VueSpeechRecorder />` | `tests/components/VueSpeechRecorder.spec.ts` |
| 6.8 | Write tests for `<VueSpeechVoiceSelect />` | `tests/components/VueSpeechVoiceSelect.spec.ts` |
| 6.9 | Add all three components to playground with live demos | `apps/playground/src/App.vue` |

### Definition of Done
- All three components render in playground and are fully functional
- Full 9-token CSS custom property set (`--vts-*`) defined and applied consistently across all components
- Named slots implemented: `VueSpeechPlayer` (`#play-icon`, `#pause-icon`, `#stop-icon`, `#controls`); `VueSpeechRecorder` (`#mic-icon`, `#transcript`)
- Keyboard navigation: Tab to focus, Space/Enter to activate, Escape to stop
- ARIA: `aria-live="polite"` on transcript, `aria-pressed` on mic button, `aria-label` on all icon buttons
- ISO language code labels used in `VueSpeechVoiceSelect` (not emoji flags)
- CSS custom properties allow consumer to theme components without overriding internals
- All component tests pass

### Impediments & Solutions

| ID | Impediment | Risk | Solution |
|---|---|---|---|
| I-6.1 | CSS token set incomplete — only 3 tokens named. Building 3 components without a full spec produces inconsistency | Medium | Full token set defined before Sprint starts: `--vts-primary` `#6366f1`, `--vts-primary-hover` `#4f46e5`, `--vts-bg` `#ffffff`, `--vts-border` `#e5e7eb`, `--vts-text` `#111827`, `--vts-text-muted` `#6b7280`, `--vts-radius` `8px`, `--vts-font` `inherit`, `--vts-recording-color` `#ef4444` |
| I-6.2 | No slot API defined — consumers cannot customise button icons or layout without rebuilding entire components | Medium | Add named slots: `VueSpeechPlayer` → `#play-icon`, `#pause-icon`, `#stop-icon`, `#controls`; `VueSpeechRecorder` → `#mic-icon`, `#transcript` |
| I-6.3 | "Fully keyboard-navigable" is too vague for a DoD | Low | Specify: Tab to focus, Space/Enter to activate, Escape to stop; `aria-live="polite"` on transcript, `aria-pressed` on mic button |
| I-6.4 | Language emoji flags (🇺🇸) render inconsistently on Windows, Android, Linux | Low | Use ISO language code text labels (`EN-US`, `EN-GB`) in `VueSpeechVoiceSelect`. Emoji flags deferred to v3 |

---

## Sprint 7 — Plugin Install · Exports · Integration Testing
**Goal:** Wire everything together as a proper Vue plugin, validate the package exports, and run end-to-end integration tests.

### Tasks

| # | Task | Output |
|---|---|---|
| 7.1 | Write `src/plugin.ts` — `VueSpeech` plugin object with `install(app, config)`, calls `createVueSpeech(config)`, calls `app.provide(SPEECH_PROVIDER_KEY, provider)`, optionally registers components globally when `config.components === true` (**default: `false`** — tree-shaken per-component imports are the recommended path; global registration is for rapid prototyping only) | `src/plugin.ts` |
| 7.2 | Write `src/index.ts` — single tree-shakeable barrel export: all composables, all components, all provider classes, `VueSpeech` plugin, all types | `src/index.ts` |
| 7.3 | Finalize `package.json` exports map — `.`, `./providers/openai`, `./providers/elevenlabs`, `./providers/azure` subpath exports | `packages/vue-text-to-speech/package.json` |
| 7.4 | Run `npx publint packages/vue-text-to-speech` — fix any exports map issues | Publint output clean |
| 7.5 | Write integration test — `createApp` + `app.use(VueSpeech, { provider: 'web' })` → mount component that calls `useSpeechSynthesis()` → assert provider is injected correctly | `tests/integration/plugin.spec.ts` |
| 7.6 | Write integration test — provider override at composable level overrides the globally injected provider | `tests/integration/providerOverride.spec.ts` |
| 7.7 | Run `npm pack` on the built package, install the `.tgz` into a separate clean Vue 3 Vite app (outside the monorepo), verify all imports work | Manual verification |
| 7.8 | Add `CHANGELOG.md` entry for v2.0.0 with migration guide from v1 | `CHANGELOG.md` |
| 7.9 | Bundle size audit — run `npx bundlephobia-cli` or check bundlephobia.com, confirm tree-shaken `useSpeechSynthesis` (web provider) is < 3kB | Size report |
| 7.10 | Add `"files": ["dist", "README.md", "CHANGELOG.md"]` to `packages/vue-text-to-speech/package.json` — prevents `src/`, `tests/`, and config files from being published | `package.json` updated |
| 7.11 | Add `"prepublishOnly": "pnpm build && pnpm test"` script to `packages/vue-text-to-speech/package.json` — prevents publishing a broken build if `npm publish` is run manually | `package.json` updated |
| 7.12 | Run `pnpm changeset` (installed in task 1.11) to auto-generate `CHANGELOG.md` v2.0.0 entry from PR changeset files — replaces manual task 7.8 | `CHANGELOG.md` auto-generated |

### Definition of Done
- `app.use(VueSpeech, config)` works correctly for all 4 providers
- `components` defaults to `false` in plugin config
- `"files"` whitelist set — `npm pack` output contains only `dist/`, `README.md`, `CHANGELOG.md`
- `prepublishOnly` script prevents broken publish
- `CHANGELOG.md` auto-generated via `@changesets/cli`
- `npx publint` reports no errors
- All integration tests pass
- Bundle size target met

### Impediments & Solutions

| ID | Impediment | Risk | Solution |
|---|---|---|---|
| I-7.1 | `"files"` whitelist missing — `npm publish` sends entire repo including `src/`, `tests/`, configs | High | Add `"files": ["dist", "README.md", "CHANGELOG.md"]` to `packages/vue-text-to-speech/package.json` — task 7.10 |
| I-7.2 | No `prepublishOnly` script — a broken build can be published if `npm publish` is run manually | Medium | Add `"prepublishOnly": "pnpm build && pnpm test"` — task 7.11 |
| I-7.3 | `config.components: true` as the default would register all components globally and defeat tree-shaking | Medium | Default to `false`. Global registration is opt-in for rapid prototyping only — task 7.1 updated |
| I-7.4 | Manual CHANGELOG writing (task 7.8) is error-prone and often skipped | Low | `@changesets/cli` (installed in task 1.11) auto-generates CHANGELOG from per-PR changeset files — task 7.12 |
| **I-7.5** | **NPM bypass-2FA token deprecation: account changes Aug 2026, direct publishing Jan 2027 — classic `NPM_TOKEN` may stop working before v2 ships** | **Critical** | **Switch to OIDC: `npm publish --provenance` with `permissions: id-token: write` in GitHub Actions. No `NPM_TOKEN` secret needed** |

---

## Sprint 8 — Docs · CI/CD · NPM Publish
**Goal:** Ship. Publish `2.0.0` to NPM, launch VitePress docs, and set up the ongoing CI/CD pipeline.

### Tasks

| # | Task | Output |
|---|---|---|
| 8.1 | Write VitePress Getting Started page — install, `app.use()` for each provider, first `useSpeechSynthesis()` call | `apps/docs/docs/getting-started.md` |
| 8.2 | Write provider guides — one page each: Web, OpenAI, ElevenLabs, Azure (config options, voices available, limitations) | `apps/docs/docs/providers/` |
| 8.3 | Write composable API reference — `useSpeechSynthesis`, `useSpeechRecognition`, `useStreamingTTS`, `useVoiceQueue` with all params, return values, and TypeScript types | `apps/docs/docs/api/` |
| 8.4 | Write component API reference — props, emits, slots, CSS custom properties for all 3 components | `apps/docs/docs/components/` |
| 8.5 | Write **Gen AI Integration Guide** — end-to-end example: OpenAI SDK stream → `useStreamingTTS().pipeStream()` → audio plays sentence by sentence. This is the flagship doc page. | `apps/docs/docs/guides/gen-ai.md` |
| 8.6 | Write Security Guide — API key tiers (dev `.env.local` → CI env vars → server proxy), `baseURL` proxy pattern with example Express middleware | `apps/docs/docs/guides/security.md` |
| 8.7 | Write Migration Guide — v1 → v2 breaking changes table, before/after code snippets | `apps/docs/docs/guides/migration.md` |
| 8.8 | Set up GitHub Actions `ci.yml` — triggers on PR: lint → test → build | `.github/workflows/ci.yml` |
| 8.9 | Set up GitHub Actions `publish.yml` — triggers on `v2.*.*` tag push: build → `npm publish --access public --provenance` | `.github/workflows/publish.yml` |
| 8.10 | ~~Add NPM token as GitHub Actions secret~~ — **replaced by OIDC**: add `permissions: { id-token: write, contents: read }` to `publish.yml`, add `--provenance` flag to `npm publish`, register GitHub OIDC trust on NPM via `npm access grant`. No secret stored | GitHub OIDC config |
| 8.11 | Run full pre-publish checklist (from PLAN.md), bump version to `2.0.0`, tag `v2.0.0`, push tag | NPM publish triggered |
| 8.12 | Verify published package on npmjs.com — install into a real app, smoke test | Live verification |

### Definition of Done
- `vue-text-to-speech@2.0.0` is live on NPM
- VitePress docs site deployed on **Vercel** with `base: '/'`
- CI pipeline is green on the `main` branch
- OIDC publish workflow verified — no `NPM_TOKEN` stored as secret
- Smoke test of the published package passes

### Impediments & Solutions

| ID | Impediment | Risk | Solution |
|---|---|---|---|
| I-8.1 | Docs deployment target undefined — VitePress `base` config differs between GitHub Pages and Vercel | Medium | **Decision: Vercel.** Set `base: '/'` in VitePress config, add `vercel.json` to `apps/docs/`. Supports custom domain in the future |
| I-8.2 | Task 8.10 NPM token approach is obsoleted by bypass-2FA deprecation (Jan 2027) | Critical | Task 8.10 updated: OIDC with `permissions: id-token: write`. No `NPM_TOKEN` secret stored |
| I-8.3 | Version bump and tagging steps are underspecified — manual error possible on a dirty working tree | Medium | Exact commands: `pnpm changeset version` → `git commit -am "chore: release v2.0.0"` → `git tag v2.0.0` → `git push --follow-tags` |
| I-8.4 | Live demos in VitePress docs require real API keys — impossible in a static site without exposing them | Medium | Static code examples for AI providers. Web Speech API demo embedded live via `<script setup>` in `.md`. AI provider demos link to playground deployed separately |

---

## Sprint Summary

| Sprint | Focus | Key Deliverable |
|---|---|---|
| 1 | Monorepo scaffold | Turborepo + pnpm workspace; `.nvmrc`; multi-entry Vite config; `@changesets/cli` |
| 2 | WebSpeechProvider | Native TTS + STT; `TTSProvider` + `STTProvider` interfaces finalised |
| 3 | AI Providers | OpenAI, ElevenLabs, Azure TTS via blob URL; `getVoices()` on all providers |
| 4 | Core composables | `useSpeechSynthesis` (+ `isLoadingVoices`, fallback) + `useSpeechRecognition` |
| 5 | Streaming composables | `useStreamingTTS` + `useVoiceQueue` with `Intl.Segmenter` + `AbortController` |
| 6 | UI components | `VueSpeechPlayer`, `VueSpeechRecorder`, `VueSpeechVoiceSelect` with slots + ARIA |
| 7 | Plugin + exports | `app.use()`, exports map, `"files"` whitelist, `prepublishOnly`, integration tests |
| 8 | Docs + publish | VitePress on Vercel + OIDC NPM `2.0.0` publish |

---

## Cross-Sprint Issues

Issues that span multiple sprints and must be resolved before their earliest affected sprint begins:

| ID | Issue | Affects | Resolution |
|---|---|---|---|
| X-1 | `STTProvider` interface missing from Sprint 2 — `useSpeechRecognition` (Sprint 4) cannot be designed without it | S2 → S4 | Add `STTProvider` to Sprint 2 task 2.1 (resolved by I-2.2) |
| X-2 | `TTSProvider` lifecycle hooks (`onEnd`, `onError`) missing — `useVoiceQueue` (Sprint 5) cannot auto-advance | S2 → S5 | Add to `TTSProvider` in Sprint 2 task 2.1 (resolved by I-2.1) |
| X-3 | Multi-entry Vite config for subpath exports was deferred to Sprint 7 — forces Sprint 1 `vite.config.ts` rework | S1 → S7 | Set up multi-entry config in Sprint 1 task 1.5 (resolved by I-1.4) |
| X-4 | Audio playback strategy undecided — affects all 3 AI providers (Sprint 3) and streaming design (Sprint 5) | S3 → S5 | **Decision D-3: blob URL for v2** locked in Pre-Sprint Decisions (resolved by I-3.1) |
| X-5 | NPM bypass-2FA token deprecation (Aug 2026) — publish pipeline at risk before v2 ships | S7, S8 | Switch to OIDC publishing (resolved by I-7.5 and I-8.2) |

---

## Dependencies Between Sprints

```
Sprint 1 (Monorepo)
  └── Sprint 2 (WebSpeechProvider + TTSProvider/STTProvider interfaces ← X-1, X-2)
        └── Sprint 3 (AI Providers)  ← can start in parallel with Sprint 4
        └── Sprint 4 (Core Composables)
              └── Sprint 5 (Streaming) ← can start in parallel with Sprint 6
              └── Sprint 6 (UI Components)
                    └── Sprint 7 (Plugin + Exports)
                          └── Sprint 8 (Docs + Publish)
```

Sprints 3 and 4 can be worked in parallel (different files, no dependency).
Sprints 5 and 6 can be worked in parallel (composables vs components).
**Critical path**: Pre-Sprint Decisions (D-1 to D-8) must be locked before Sprint 1 begins.
