# Migration Guide: v1 → v2

v2 is a full rewrite with multi-provider support, streaming TTS, and a composable-first API. This guide covers every breaking change.

## Installation

```sh
# Before (v1)
npm install vue-text-to-speech@^1

# After (v2)
npm install vue-text-to-speech@^2
```

## Plugin Registration

::: code-group

```ts [v1]
import VueSpeech from 'vue-text-to-speech'
createApp(App).use(VueSpeech).mount('#app')
```

```ts [v2]
import { VueSpeech } from 'vue-text-to-speech'  // named export
createApp(App)
  .use(VueSpeech, { provider: 'web' })           // config required
  .mount('#app')
```

:::

**Changes:**
- `VueSpeech` is now a **named export** (not default)
- `ProviderConfig` argument is required

## Composable API

::: code-group

```ts [v1]
import { useTTS } from 'vue-text-to-speech'

const { speak, isSpeaking, voices, selectedVoice } = useTTS()
speak('Hello world')
```

```ts [v2]
import { useSpeechSynthesis } from 'vue-text-to-speech'

const { speak, isSpeaking, voices, selectedVoice } = useSpeechSynthesis()
speak('Hello world')
```

:::

**Changes:**
- `useTTS()` → `useSpeechSynthesis()`
- All returned refs are the same shape

## Component Names

| v1 | v2 |
|---|---|
| `<SpeechPlayer>` | `<VueSpeechPlayer>` |
| `<SpeechRecorder>` | `<VueSpeechRecorder>` |
| `<VoiceSelect>` | `<VueSpeechVoiceSelect>` |

## Component Props

### SpeechPlayer → VueSpeechPlayer

| v1 prop | v2 prop | Notes |
|---|---|---|
| `content` | `text` | Renamed |
| `auto` | `autoSpeak` | Renamed |

### SpeechRecorder → VueSpeechRecorder

| v1 prop | v2 prop | Notes |
|---|---|---|
| `language` | `lang` | Renamed, same BCP-47 value |
| `loop` | `continuous` | Renamed |

## Component Events

### VueSpeechPlayer

| v1 event | v2 event | Notes |
|---|---|---|
| `@playing` | `@start` | Renamed |
| `@stopped` | `@end` | Renamed |
| `@failed` | `@error` | Payload changed (see below) |

### VueSpeechRecorder

| v1 event | v2 event | Notes |
|---|---|---|
| `@result` | `@transcript` | Interim results |
| `@done` | `@final-transcript` | Final result |

## Error Object

::: code-group

```ts [v1]
// string error message
@failed="(msg: string) => console.error(msg)"
```

```ts [v2]
// structured SpeechError object
@error="(err: SpeechError) => console.error(err.code, err.message)"

interface SpeechError {
  code: 'NOT_SUPPORTED' | 'SYNTHESIS_FAILED' | 'API_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'ABORTED'
  message: string
  cause?: unknown
}
```

:::

## Removed APIs

| v1 | Replacement |
|---|---|
| `useSTT()` | `useSpeechRecognition()` |
| `SpeechPlugin.setVoice(v)` | `selectedVoice.value = v` |
| `SpeechPlugin.stop()` | `stop()` from `useSpeechSynthesis()` |
| Global `$speech` instance | No global — use composables |

## New in v2

These features did not exist in v1:

- **AI providers**: OpenAI, ElevenLabs, Azure — pass config to `app.use()`
- **`useStreamingTTS()`**: Pipe LLM token streams to speech
- **`useVoiceQueue()`**: Manage a FIFO queue of utterances
- **TypeScript**: Full declarations, no `@types/*` needed
- **SSR-safe**: No crashes in Node.js / Nuxt environments

## CSS Custom Properties

v1 used Sass variables and scoped BEM classes. v2 uses CSS custom properties that can be overridden globally or per-instance:

```css
/* v1 — override internal Sass vars (no longer works) */
$vts-color-primary: blue;

/* v2 — override CSS custom properties */
:root {
  --vts-primary: blue;
}
```

## Node.js Requirement

v2 requires **Node.js 18+**. v1 supported Node 14+.
