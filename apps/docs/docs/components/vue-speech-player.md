# VueSpeechPlayer

A full-featured text-to-speech player component. Renders a voice selector, rate/pitch/volume sliders, and play/pause/stop controls. Fully accessible via keyboard and ARIA attributes.

## Import

```ts
import { VueSpeechPlayer } from 'vue-text-to-speech'
```

## Usage

```vue
<script setup lang="ts">
import { VueSpeechPlayer } from 'vue-text-to-speech'
</script>

<template>
  <VueSpeechPlayer
    text="Hello, this is vue-text-to-speech!"
    :auto-speak="false"
    @start="onStart"
    @end="onEnd"
    @error="onError"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | — | **Required.** The text to speak |
| `autoSpeak` | `boolean` | `false` | Start speaking automatically when the component mounts |
| `showVoiceSelect` | `boolean` | `true` | Show the voice selector row |
| `showRate` | `boolean` | `true` | Show the Rate slider |
| `showPitch` | `boolean` | `true` | Show the Pitch slider |
| `showVolume` | `boolean` | `true` | Show the Volume slider |

## Emits

| Event | Payload | Description |
|---|---|---|
| `start` | — | Fired when speech begins |
| `end` | — | Fired when speech completes |
| `pause` | — | Fired when speech is paused |
| `resume` | — | Fired when speech is resumed |
| `error` | `SpeechError` | Fired on any synthesis error |

## Slots

| Slot | Description |
|---|---|
| `#play-icon` | Replace the default play icon (SVG or component) |
| `#pause-icon` | Replace the default pause icon |
| `#stop-icon` | Replace the default stop icon |
| `#controls` | Replace the entire controls area (advanced) |

```vue
<!-- Custom icons example -->
<VueSpeechPlayer text="Hello world">
  <template #play-icon>▶</template>
  <template #pause-icon>⏸</template>
  <template #stop-icon>⏹</template>
</VueSpeechPlayer>
```

## Theming

Override CSS custom properties on the component or any ancestor:

```css
:root {
  --vts-primary: #6366f1;
  --vts-primary-hover: #4f46e5;
  --vts-bg: #ffffff;
  --vts-border: #e5e7eb;
  --vts-text: #111827;
  --vts-text-muted: #6b7280;
  --vts-radius: 8px;
  --vts-font: inherit;
}
```

```vue
<!-- Scoped override on a single instance -->
<VueSpeechPlayer
  text="Hello"
  style="--vts-primary: #10b981; --vts-radius: 4px"
/>
```

## Auto-Speak

When `autoSpeak` is `true` the component calls `speak()` inside `onMounted`. This fires immediately after the component enters the DOM — ensure the page has received a user interaction first, or browsers may block audio playback.

## Accessibility

- All buttons have `aria-label` attributes
- Range sliders have accessible labels
- Focus management follows WCAG 2.1 SC 2.1.1
