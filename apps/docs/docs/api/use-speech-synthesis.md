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
    <option v-for="v in voices" :key="v.voiceURI" :value="v">{{ v.name }}</option>
  </select>
  <input v-model.number="rate" type="range" min="0.1" max="10" step="0.1" />
  <button @click="speak('Hello world')">Speak</button>
  <button @click="pause()">Pause</button>
  <button @click="resume()">Resume</button>
  <button @click="stop()">Stop</button>
</template>
```

## Return Value

```ts
interface UseSpeechSynthesisReturn {
  /** Whether speech is currently playing */
  isSpeaking: Readonly<Ref<boolean>>
  /** Whether speech is currently paused */
  isPaused: Readonly<Ref<boolean>>
  /** Available voices from the active provider */
  voices: Readonly<Ref<VoiceInfo[]>>
  /** True while voices are being loaded (Web Speech only) */
  isLoadingVoices: Readonly<Ref<boolean>>
  /** Currently selected voice */
  selectedVoice: Ref<VoiceInfo | null>
  /** Speech rate (Web Speech only). Applied on next speak() call. */
  rate: Ref<number>
  /** Speech pitch (Web Speech only). Applied on next speak() call. */
  pitch: Ref<number>
  /** Volume 0–1 */
  volume: Ref<number>
  /** Last error, or null */
  error: Readonly<Ref<SpeechError | null>>
  /** Whether TTS is supported in this browser/environment */
  isSupported: Readonly<Ref<boolean>>
  /** Speak the given text */
  speak(text: string): Promise<void>
  /** Stop playback */
  stop(): void
  /** Pause playback (Web Speech only) */
  pause(): void
  /** Resume playback (Web Speech only) */
  resume(): void
  /** Manually reload available voices */
  loadVoices(): void
}
```

## Parameters

`useSpeechSynthesis()` takes no parameters. Configuration is provided globally via `app.use(VueSpeech, config)`.

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
  name: string
  lang: string
  voiceURI: string
  default: boolean
  localService: boolean
}

interface SpeechError {
  code: 'NOT_SUPPORTED' | 'SYNTHESIS_FAILED' | 'API_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'ABORTED'
  message: string
  cause?: unknown
}
```
