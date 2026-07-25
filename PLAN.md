# vue-text-to-speech v2.0.0 — Finalized Plan

## Overview

A complete Vue 3 rewrite of the existing `vue-text-to-speech` NPM package (currently at v1.0.6).
Published as a breaking `2.0.0` major version under the same package name.

**Design goals:**
- Vue 3 + TypeScript first
- Provider-agnostic architecture (Native, OpenAI, ElevenLabs, Azure)
- Composables + UI components + global plugin install
- First-class streaming TTS for LLM output (Gen AI era)
- Zero-friction DX: install → plug → done

---

## Package Identity

| Property | Value |
|---|---|
| NPM name | `vue-text-to-speech` |
| New version | `2.0.0` (breaking major) |
| License | MIT |
| Peer dependency | `vue ^3.0.0` |
| NPM owner | `kunchamvasu` |

---

## Repository Structure (Monorepo)

```
vue-text-to-speech/
├── packages/
│   └── vue-text-to-speech/          # Published NPM package
│       ├── src/
│       │   ├── providers/
│       │   │   ├── types.ts          # TTSProvider interface + shared types
│       │   │   ├── WebSpeechProvider.ts
│       │   │   ├── OpenAIProvider.ts
│       │   │   ├── ElevenLabsProvider.ts
│       │   │   └── AzureProvider.ts
│       │   ├── composables/
│       │   │   ├── useSpeechSynthesis.ts
│       │   │   ├── useSpeechRecognition.ts
│       │   │   ├── useStreamingTTS.ts
│       │   │   └── useVoiceQueue.ts
│       │   ├── components/
│       │   │   ├── VueSpeechPlayer.vue
│       │   │   ├── VueSpeechRecorder.vue
│       │   │   └── VueSpeechVoiceSelect.vue
│       │   ├── plugin.ts             # app.use(VueSpeech, config)
│       │   └── index.ts              # Tree-shakeable named exports
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── apps/
│   ├── playground/                   # Vue 3 + Vite dev sandbox
│   └── docs/                         # VitePress documentation site
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── package.json                      # Monorepo root
```

---

## Phase 1 — Monorepo Scaffold

1. Convert current project root to a **pnpm monorepo** (`pnpm-workspace.yaml`)
2. Add `turbo.json` at root with `build`, `test`, `lint`, `docs:build` pipelines
3. Root `tsconfig.base.json` extended by each package's own `tsconfig.json`
4. Configure `packages/vue-text-to-speech/vite.config.ts` in **library mode**:
   - Dual ESM + CJS output (`dist/index.mjs` + `dist/index.cjs`)
   - `vite-plugin-dts` for `.d.ts` generation
   - `vue` externalized as peer dep
   - Minify with esbuild
5. `packages/vue-text-to-speech/package.json`:
   - `"name": "vue-text-to-speech"`, `"version": "2.0.0"`
   - `"sideEffects": false`
   - `"peerDependencies": { "vue": "^3.0.0" }`
   - Proper `exports` map (see Phase 5)

---

## Phase 2 — Provider Architecture

### `TTSProvider` Interface (`providers/types.ts`)

```ts
interface TTSProvider {
  speak(text: string, options?: SpeakOptions): Promise<void>
  stop(): void
  pause(): void
  resume(): void
  getVoices(): Promise<VoiceInfo[]>
  readonly isSupported: boolean
  readonly supportsStreaming: boolean
}

interface SpeakOptions {
  voice?: VoiceInfo
  rate?: number       // 0.5 – 2.0
  pitch?: number      // 0.0 – 2.0
  volume?: number     // 0.0 – 1.0
}

interface VoiceInfo {
  id: string
  name: string
  lang: string
  provider: 'web' | 'openai' | 'elevenlabs' | 'azure'
}

type SpeechError = { code: string; message: string }
```

### Providers

| Provider | Implementation | SDK/Dependency | Azure SDK? |
|---|---|---|---|
| `WebSpeechProvider` | Wraps browser `SpeechSynthesis` API | None — browser built-in | No |
| `OpenAIProvider` | `POST /v1/audio/speech`, streams via `ReadableStream` → `AudioContext` | None — pure `fetch()` | No |
| `ElevenLabsProvider` | `/v1/text-to-speech/:voiceId/stream`, streams via `MediaSource` | None — pure `fetch()` | No |
| `AzureProvider` | Azure TTS REST endpoint, pure `fetch()`, returns audio blob | None — REST only | No (v3) |

**Azure SDK decision:** v2 uses the Azure Cognitive Services TTS REST API directly (pure `fetch()`, 0KB overhead). The `microsoft-cognitiveservices-speech-sdk` (~2MB) is deferred to v3 alongside word boundary highlighting.

### `createVueSpeech(config)` Factory

Returns a typed provider instance based on `config.provider`:
```ts
createVueSpeech({ provider: 'openai', apiKey: '...', baseURL: '...' })
createVueSpeech({ provider: 'elevenlabs', apiKey: '...', voiceId: '...' })
createVueSpeech({ provider: 'azure', subscriptionKey: '...', region: '...' })
createVueSpeech({ provider: 'web' })  // no keys needed
```

---

## Phase 3 — Composables

All composables are:
- SSR-safe (`typeof window !== 'undefined'` guards on all Web API access)
- Built with `shallowRef`, `readonly`, `onUnmounted` cleanup
- Accept an optional `provider` option to override the globally injected provider

### `useSpeechSynthesis(options?)`

```ts
const {
  speak,          // (text: string) => void
  stop,
  pause,
  resume,
  isSpeaking,     // Readonly<Ref<boolean>>
  isPaused,       // Readonly<Ref<boolean>>
  voices,         // Readonly<Ref<VoiceInfo[]>>
  selectedVoice,  // Ref<VoiceInfo | null>
  rate,           // Ref<number>
  pitch,          // Ref<number>
  volume,         // Ref<number>
  error,          // Readonly<Ref<SpeechError | null>>
  isSupported,    // Readonly<Ref<boolean>>
} = useSpeechSynthesis()
```

### `useSpeechRecognition(options?)`

```ts
const {
  start,
  stop,
  toggle,
  isListening,       // Readonly<Ref<boolean>>
  transcript,        // Readonly<Ref<string>>  (interim + final)
  finalTranscript,   // Readonly<Ref<string>>
  confidence,        // Readonly<Ref<number>>
  lang,              // Ref<string>
  continuous,        // Ref<boolean>
  isSupported,       // Readonly<Ref<boolean>>
  error,             // Readonly<Ref<SpeechError | null>>
} = useSpeechRecognition()
```

Note: STT uses WebSpeech API only in v2. AI-powered STT (Whisper) deferred to v3.

### `useStreamingTTS()` — Gen AI Flagship Feature

Accepts an `AsyncIterable<string>` (LLM token stream) and intelligently chunks it into sentences before feeding to the provider queue. Compatible with Vercel AI SDK `streamText`, OpenAI SDK streaming, and any `AsyncIterable<string>`.

```ts
const {
  pipeStream,      // (stream: AsyncIterable<string>) => Promise<void>
  queue,           // Readonly<Ref<string[]>>
  currentChunk,    // Readonly<Ref<string>>
  isStreaming,     // Readonly<Ref<boolean>>
  stop,
} = useStreamingTTS()

// Usage with Vercel AI SDK:
const { textStream } = streamText({ model: openai('gpt-4o'), prompt })
await pipeStream(textStream)
```

Internally uses a **sentence boundary detector** (`.`, `?`, `!`, `\n\n`) to avoid choppy audio and a priority queue so new chunks pre-empt stale ones on user interrupt.

### `useVoiceQueue()`

Sequential utterance queue for long-form AI content.

```ts
const { enqueue, dequeue, clear, skip, queue } = useVoiceQueue()
```

---

## Phase 4 — UI Components

All components are:
- Built on the composables above (no duplicated logic)
- **Headless-first**: styled via CSS custom properties (`--vts-*` tokens), no hard-coded colors/fonts
- Accessible: `aria-label`, keyboard navigable, `role="status"` for live transcript

### `<VueSpeechPlayer />`

Drop-in TTS player widget.

| Prop | Type | Description |
|---|---|---|
| `text` | `string` | Text to speak |
| `providerOptions` | `object` | Provider override config |
| `rate` | `number` | Speech rate (0.5–2.0) |
| `pitch` | `number` | Speech pitch (0.0–2.0) |
| `volume` | `number` | Volume (0.0–1.0) |
| `autoplay` | `boolean` | Speak on mount |

Emits: `start`, `end`, `pause`, `resume`, `error`

### `<VueSpeechRecorder />`

Drop-in STT recorder widget.

| Prop | Type | Description |
|---|---|---|
| `lang` | `string` | Recognition language (default: `en-US`) |
| `continuous` | `boolean` | Keep listening after first result |

Emits: `transcript`, `final-transcript`, `error`

### `<VueSpeechVoiceSelect />`

Voice picker dropdown, normalizes voices from any provider into a grouped list.

| Prop | Type | Description |
|---|---|---|
| `modelValue` | `VoiceInfo \| null` | v-model binding |
| `providerOptions` | `object` | Provider to load voices from |

Emits: `update:modelValue`

---

## Phase 5 — Plugin Install & Package Exports

### Global Plugin

```ts
import { VueSpeech } from 'vue-text-to-speech'

app.use(VueSpeech, {
  provider: 'openai',
  apiKey: import.meta.env.VITE_OPENAI_KEY,  // or baseURL for server proxy
  // baseURL: 'https://your-api.com/tts-proxy'  ← recommended for production
})
```

Registers provider globally via `provide(SPEECH_PROVIDER_KEY, ...)`. Optionally registers components globally via `components: true`.

### API Key Handling

The plugin **accepts** keys as config parameters only. It never reads `.env` directly, never logs keys, never persists them.

| Environment | Pattern | Security |
|---|---|---|
| Local dev | `.env.local` → `import.meta.env.VITE_*` | Dev only |
| Internal tools | CI injects env vars at build time | Acceptable |
| **Production (recommended)** | Backend proxy — pass `baseURL`, keep key server-side | Keys never reach browser |

### `package.json` Exports Map

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./providers/openai": {
      "import": "./dist/providers/openai.mjs",
      "types": "./dist/providers/openai.d.ts"
    },
    "./providers/elevenlabs": {
      "import": "./dist/providers/elevenlabs.mjs",
      "types": "./dist/providers/elevenlabs.d.ts"
    },
    "./providers/azure": {
      "import": "./dist/providers/azure.mjs",
      "types": "./dist/providers/azure.d.ts"
    }
  },
  "sideEffects": false
}
```

---

## Phase 6 — Testing

| Test type | Tool | Covers |
|---|---|---|
| Unit tests | Vitest + `@vue/test-utils` | Each composable, each provider (mocked `fetch` + `SpeechSynthesis`) |
| SSR safety | Vitest `node` environment | All composables — assert no `window is not defined` crash |
| Integration | Vitest + `@vue/test-utils` | `app.use()` → composable injection → correct provider used |
| Streaming | Vitest | Mock `AsyncIterable<string>` → assert sentence chunking + queue ordering |

---

## Phase 7 — Documentation & Publishing

### VitePress Docs (`apps/docs`)

- Getting Started (< 5 minute setup)
- Provider guides: Web / OpenAI / ElevenLabs / Azure
- Composable API reference (auto-generated from TSDoc via `typedoc-plugin-markdown`)
- Component API reference
- **Gen AI Integration Guide** — pipe Vercel AI SDK / OpenAI SDK stream into `useStreamingTTS` (flagship use case)
- Security guide — server-side proxy pattern
- Migration guide — v1 → v2

### GitHub Actions

```
.github/workflows/
├── ci.yml       # lint → test → build on every PR
└── publish.yml  # triggered on v2.x.x tag → npm publish with provenance
```

### Pre-publish Checklist

- [ ] `pnpm --filter vue-text-to-speech build` — `dist/` emits cleanly
- [ ] `pnpm --filter vue-text-to-speech test` — all tests pass, SSR safety passes
- [ ] `npx publint packages/vue-text-to-speech` — exports map validates
- [ ] Install `npm pack` output into a clean Vue 3 Vite app — verify `app.use()`, composables, components all work
- [ ] Bundle size check on bundlephobia — tree-shaken `useSpeechSynthesis` (web provider) target: < 3kB

---

## What's In Scope for v2.0.0

| Feature | In v2 | Deferred |
|---|---|---|
| Vue 3 + TypeScript | ✅ | |
| WebSpeechProvider (TTS + STT) | ✅ | |
| OpenAIProvider (TTS) | ✅ | |
| ElevenLabsProvider (TTS) | ✅ | |
| AzureProvider via REST (TTS) | ✅ | |
| `useSpeechSynthesis` composable | ✅ | |
| `useSpeechRecognition` composable | ✅ | |
| `useStreamingTTS` composable | ✅ | |
| `useVoiceQueue` composable | ✅ | |
| UI components (Player, Recorder, VoiceSelect) | ✅ | |
| Global plugin install | ✅ | |
| `baseURL` proxy support for all AI providers | ✅ | |
| VitePress docs site | ✅ | |
| GitHub Actions CI/CD | ✅ | |
| Word boundary highlighting | | v3 |
| Azure SDK (microsoft-cognitiveservices-speech-sdk) | | v3 |
| AI-powered STT (Whisper) | | v3 |
| React / Svelte adapters | | Future |
| Voice cloning UI | | Future |

---

## Files to Migrate / Remove

| Current file | Action |
|---|---|
| `src/components/textToSpeatch.vue` | Logic → `WebSpeechProvider` + `useSpeechSynthesis` |
| `src/components/speechToText.vue` | Logic → `WebSpeechProvider` + `useSpeechRecognition` |
| `src/App.vue` | Becomes `apps/playground/src/App.vue` |
| `src/main.js` | Becomes `apps/playground/src/main.ts` |
| `package.json` | Replaced by monorepo root + package-level `package.json` |
| `babel.config.js` | Removed — Vite + esbuild replaces Babel |
