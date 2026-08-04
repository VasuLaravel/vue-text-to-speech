# VueSpeechVoiceSelect

A `<select>` component that lists available TTS voices grouped by language. Works as a standard `v-model` binding. Only populated when using the Web Speech provider (AI providers return an empty voice list).

## Import

```ts
import { VueSpeechVoiceSelect } from 'vue-text-to-speech'
```

## Usage

```vue
<script setup lang="ts">
import { VueSpeechVoiceSelect, useSpeechSynthesis } from 'vue-text-to-speech'

const { speak, voices, selectedVoice, isLoadingVoices } = useSpeechSynthesis()
</script>

<template>
  <VueSpeechVoiceSelect
    v-model="selectedVoice"
    :voices="voices"
    :loading="isLoadingVoices"
  />
  <button @click="speak('Testing voice!')">Test</button>
</template>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `voices` | `readonly VoiceInfo[]` | — | **Required.** Voice list from `useSpeechSynthesis().voices` |
| `modelValue` | `VoiceInfo \| undefined` | `undefined` | The currently selected voice (`v-model`) |
| `disabled` | `boolean` | `false` | Disable the select element |
| `loading` | `boolean` | `false` | Show a "Loading voices…" placeholder while voices are being fetched |

## Emits

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `VoiceInfo \| undefined` | Standard `v-model` update event |

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
const selected = ref<VoiceInfo | undefined>(undefined)

function onSelect(voice: VoiceInfo | undefined) {
  selected.value = voice
  speak(`Now using ${voice?.name ?? 'default voice'}`)
}
</script>

<template>
  <VueSpeechVoiceSelect
    :voices="voices"
    :model-value="selected"
    @update:model-value="onSelect"
  />
</template>
```

## VoiceInfo Type

```ts
interface VoiceInfo {
  /** Unique identifier used as the option value */
  id: string
  name: string
  lang: string
  /** Locale-aware display label, e.g. "Google US English" */
  label: string
  /** True when this is the browser/service default voice */
  default: boolean
}
```

## Notes

- When `voices` is empty (AI provider or voices not yet loaded), the select renders with a placeholder option
- The component does **not** automatically change the active voice in `useSpeechSynthesis` — you must bind it to `selectedVoice` from the composable for it to take effect
