# VueSpeechRecorder

A speech-to-text recorder component that renders a microphone button and live transcript display. Uses the browser's Web Speech API regardless of the TTS provider configured in `app.use()`.

## Import

```ts
import { VueSpeechRecorder } from 'vue-text-to-speech'
```

## Usage

```vue
<script setup lang="ts">
import { VueSpeechRecorder } from 'vue-text-to-speech'

function onFinal(text: string, confidence: number) {
  console.log(`"${text}" — ${(confidence * 100).toFixed(0)}% confident`)
}
</script>

<template>
  <VueSpeechRecorder
    lang="en-US"
    :continuous="false"
    @transcript="(t, c) => console.log('interim', t)"
    @final-transcript="onFinal"
    @error="(e) => console.error(e)"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `lang` | `string` | Browser UI language | BCP-47 language tag, e.g. `'en-US'`, `'es-MX'` |
| `continuous` | `boolean` | `false` | Keep recording after each phrase is recognized |

## Emits

| Event | Payload | Description |
|---|---|---|
| `transcript` | `[text: string, confidence: number]` | Fired for each **interim** result while the user is still speaking |
| `final-transcript` | `[text: string, confidence: number]` | Fired when the engine finalizes a recognized phrase |
| `error` | `SpeechError` | Fired on any recognition error |

## Slots

| Slot | Scope | Description |
|---|---|---|
| `#mic-icon` | `{ isListening: boolean }` | Replace the default microphone icon. Receives current state. |
| `#transcript` | `{ transcript: string, finalTranscript: string }` | Replace the transcript display area |

```vue
<!-- Custom mic icon that changes with state -->
<VueSpeechRecorder>
  <template #mic-icon="{ isListening }">
    {{ isListening ? '🔴' : '🎙️' }}
  </template>
</VueSpeechRecorder>
```

## Continuous Mode

In `continuous` mode the component keeps listening and fires `final-transcript` for each recognized phrase. The microphone stays active until the user clicks the button to stop, or until `stop()` is called programmatically.

```vue
<VueSpeechRecorder
  :continuous="true"
  @final-transcript="(t) => messages.push(t)"
/>
```

## Theming

Uses the same CSS custom properties as `VueSpeechPlayer`:

```css
--vts-primary: #6366f1;      /* button background */
--vts-recording-color: #ef4444; /* pulse animation when active */
--vts-bg: #ffffff;
--vts-border: #e5e7eb;
--vts-radius: 8px;
```

## Browser Support

| Browser | Support |
|---|---|
| Chrome | ✅ |
| Edge | ✅ |
| Safari | ✅ (requires user gesture) |
| Firefox | ❌ `SpeechRecognition` not supported |

The component automatically hides itself (renders nothing) when `isSupported` is `false`.
