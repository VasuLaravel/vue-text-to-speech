# VueSpeechVoiceSelect

A `<select>` component that lists available TTS voices grouped by language. Works as a standard `v-model` binding. Only populated when using the Web Speech provider (AI providers return an empty voice list).

## Import

```ts
import { VueSpeechVoiceSelect } from 'vue-text-to-speech'
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueSpeechVoiceSelect, useSpeechSynthesis } from 'vue-text-to-speech'

const { speak, selectedVoice } = useSpeechSynthesis()
// Pass selectedVoice directly as v-model
</script>

<template>
  <VueSpeechVoiceSelect v-model="selectedVoice" />
  <button @click="speak('Testing voice!')">Test</button>
</template>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `VoiceInfo \| null` | `null` | The currently selected voice |

## Emits

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `VoiceInfo \| null` | Standard `v-model` update event |

## Voice Grouping

Voices are grouped by language in `<optgroup>` elements:

```html
<select>
  <optgroup label="English (United States)">
    <option>Google US English</option>
    <option>Microsoft David - English (United States)</option>
  </optgroup>
  <optgroup label="English (United Kingdom)">
    <option>Google UK English Female</option>
  </optgroup>
  <!-- ... -->
</select>
```

## Standalone Usage (without v-model on `selectedVoice`)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueSpeechVoiceSelect, useSpeechSynthesis } from 'vue-text-to-speech'

const { speak, voices } = useSpeechSynthesis()
const selected = ref(null)

function onSelect(voice) {
  selected.value = voice
  speak(`Now using ${voice?.name ?? 'default voice'}`)
}
</script>

<template>
  <VueSpeechVoiceSelect :model-value="selected" @update:model-value="onSelect" />
</template>
```

## VoiceInfo Type

```ts
interface VoiceInfo {
  name: string
  lang: string
  voiceURI: string
  default: boolean
  localService: boolean
}
```

## Notes

- When `voices` is empty (AI provider or voices not yet loaded), the select renders with a placeholder option
- The component does **not** automatically change the active voice in `useSpeechSynthesis` — you must bind it to `selectedVoice` from the composable for it to take effect
