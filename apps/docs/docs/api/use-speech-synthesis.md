# useSpeechSynthesis

The primary composable for text-to-speech. Must be used inside a component mounted under a Vue app that called `app.use(VueSpeech, config)`. Falls back to Web Speech with a console warning if used outside a plugin install.

## Import

```ts
import { useSpeechSynthesis } from 'vue-text-to-speech'
```

## Usage

```vue
<script setup lang="ts">
import { useSpeechSynthesis } from 'vue-text-to-speech'

const {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  isPaused,
  voices,
  isLoadingVoices,
  selectedVoice,
  rate,
  pitch,
  volume,
  error,
  isSupported,
} = useSpeechSynthesis()
</script>

<template>
  <select v-model="selectedVoice">
    <option v-for="v in voices" :key="v.id" :value="v">{{ v.label }}</option>
  </select>
  <input v-model.number="rate" type="range" min="0.1" max="10" step="0.1" />
  <button @click="speak('Hello world')">Speak</button>
  <button @click="pause()">Pause</button>
  <button @click="resume()">Resume</button>
  <button @click="stop()">Stop</button>
</template>
```

## Parameters

```ts
interface UseSpeechSynthesisOptions {
  /** Override the injected provider for this composable instance only */
  provider?: TTSProvider
  /** Initial speech rate (0.1–10, default 1) */
  rate?: number
  /** Initial pitch (0–2, default 1) */
  pitch?: number
  /** Initial volume (0–1, default 1) */
  volume?: number
}

function useSpeechSynthesis(
  options?: UseSpeechSynthesisOptions
): UseSpeechSynthesisReturn
```

All options are optional. Provider configuration is normally provided globally via `app.use(VueSpeech, config)`; use `provider` only when you need to override it for a specific component instance.

## Return Value

```ts
interface UseSpeechSynthesisReturn {
  /** Whether the provider is available in this environment */
  isSupported: Readonly<Ref<boolean>>
  /** Whether speech is currently playing */
  isSpeaking: Readonly<Ref<boolean>>
  /** Whether speech is currently paused */
  isPaused: Readonly<Ref<boolean>>
  /** Available voices from the active provider */
  voices: Readonly<Ref<readonly VoiceInfo[]>>
  /** True while voices are being fetched */
  isLoadingVoices: Readonly<Ref<boolean>>
  /** Currently selected voice */
  selectedVoice: Ref<VoiceInfo | undefined>
  /** Speech rate — changes apply to the next speak() call */
  rate: Ref<number>
  /** Pitch — changes apply to the next speak() call */
  pitch: Ref<number>
  /** Volume 0–1 — changes apply to the next speak() call */
  volume: Ref<number>
  /** Most recent error, cleared on next speak() */
  error: Readonly<Ref<SpeechError | null>>
  /** Speak text using current selectedVoice, rate, pitch, volume */
  speak(text: string, overrides?: Partial<SpeakOptions>): Promise<void>
  /** Stop the current utterance immediately */
  stop(): void
  /** Pause playback (Web Speech only; no-op for AI providers) */
  pause(): void
  /** Resume playback (Web Speech only; no-op for AI providers) */
  resume(): void
  /** Reload the voice list */
  loadVoices(): Promise<void>
}
```

## Behavior Notes

| Detail | Notes |
|---|---|
| `rate` / `pitch` | Reactive refs that take effect on the **next** `speak()` call, not immediately |
| `voices` | Only populated for Web Speech — AI providers expose an empty array |
| `pause()` / `resume()` | No-ops for AI providers (OpenAI, ElevenLabs, Azure) |
| `error` | Set on any `speak()` failure; cleared automatically on the next `speak()` call |
| Fallback | If used outside `app.use()`, logs a warning and falls back to Web Speech |

## Types

```ts
interface VoiceInfo {
  /** Unique identifier (used as the option value) */
  id: string
  name: string
  lang: string
  /** Locale-aware display label, e.g. "Google US English" */
  label: string
  /** True when this is the browser/service default voice */
  default: boolean
}

interface SpeakOptions {
  text: string
  voice?: VoiceInfo
  /** Speech rate 0.1–10 (1 = normal) */
  rate?: number
  /** Pitch 0–2 (1 = normal). Ignored by AI providers */
  pitch?: number
  /** Volume 0–1 (1 = full) */
  volume?: number
}

type SpeechErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'NETWORK'
  | 'API_ERROR'
  | 'RATE_LIMIT'
  | 'AUDIO_PLAYBACK'
  | 'CANCELLED'
  | 'UNKNOWN'

interface SpeechError {
  code: SpeechErrorCode
  message: string
  cause?: unknown
}
```
