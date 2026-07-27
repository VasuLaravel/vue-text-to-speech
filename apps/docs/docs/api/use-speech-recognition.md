# useSpeechRecognition

Composable for speech-to-text using the browser's `SpeechRecognition` API. Always uses the Web Speech engine regardless of the provider configured in `app.use()`.

## Import

```ts
import { useSpeechRecognition } from 'vue-text-to-speech'
```

## Usage

```vue
<script setup lang="ts">
import { useSpeechRecognition } from 'vue-text-to-speech'

const {
  isListening,
  transcript,
  finalTranscript,
  error,
  isSupported,
  start,
  stop,
} = useSpeechRecognition({ lang: 'en-US', continuous: true })

function onFinal(text: string, confidence: number) {
  console.log(`Recognized: ${text} (${(confidence * 100).toFixed(0)}%)`)
}
</script>

<template>
  <button @click="start()">Start</button>
  <button @click="stop()">Stop</button>
  <p>Live: {{ transcript }}</p>
  <p>Final: {{ finalTranscript }}</p>
</template>
```

## Parameters

```ts
interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag, e.g. 'en-US'. Defaults to browser language. */
  lang?: string
  /** Keep recording after each final result. Default: true */
  continuous?: boolean
}

function useSpeechRecognition(
  options?: UseSpeechRecognitionOptions
): UseSpeechRecognitionReturn
```

## Return Value

```ts
interface UseSpeechRecognitionReturn {
  /** Whether the microphone is actively listening */
  isListening: Readonly<Ref<boolean>>
  /** Live interim transcript (resets on each final result) */
  transcript: Readonly<Ref<string>>
  /** Accumulated final transcript */
  finalTranscript: Readonly<Ref<string>>
  /** Last error, or null */
  error: Readonly<Ref<SpeechError | null>>
  /** Whether SpeechRecognition is supported in this browser */
  isSupported: Readonly<Ref<boolean>>
  /** Start listening */
  start(): void
  /** Stop listening */
  stop(): void
  /** Reset finalTranscript to empty string */
  reset(): void
}
```

## Events via Callbacks

Instead of watching refs you can pass callbacks via composable options:

```ts
useSpeechRecognition({
  lang: 'en-US',
  onTranscript(text: string, confidence: number) {
    // fired for every interim result
  },
  onFinalTranscript(text: string, confidence: number) {
    // fired once the engine finalizes a phrase
  },
  onError(err: SpeechError) { /* ... */ },
})
```

## Smooth / Continuous Recording

`continuous` defaults to `true`, so recognition keeps running across natural speech pauses without stopping. If the browser unexpectedly ends the session (network hiccup, tab backgrounding), the composable automatically restarts it as long as `isListening` is `true`.

To stop recording, always call `stop()` — this sets `isListening` to `false` before tearing down the session, which prevents the auto-restart guard from triggering.

## Live Word-by-Word Display

Use `transcript` (interim) for real-time feedback and `finalTranscript` for committed text:

```vue
<template>
  <!-- finalTranscript holds committed phrases; transcript shows live in-progress words -->
  <p>{{ finalTranscript }}<em class="live">{{ transcript }}</em></p>
</template>
```

`transcript` resets to `''` each time a final result is committed, so concatenating both gives a seamless stream.

## Transcript Lifecycle

```
Microphone ─► [interim results] ─► transcript ref (live)
                                └─► onTranscript callback
             [final result]     ─► finalTranscript ref (accumulated)
                                └─► onFinalTranscript callback
                                └─► transcript ref reset to ''
```

## Browser Support

| Browser | Support |
|---|---|
| Chrome | ✅ Full |
| Edge | ✅ Full |
| Safari | ✅ (requires user gesture) |
| Firefox | ❌ Not supported |

Check `isSupported.value` before calling `start()`.
