# useVoiceQueue

Low-level composable that manages a first-in-first-out queue of text utterances. `useStreamingTTS` builds on top of this composable.

## Import

```ts
import { useVoiceQueue } from 'vue-text-to-speech'
```

## Usage

```vue
<script setup lang="ts">
import { useVoiceQueue } from 'vue-text-to-speech'

const { enqueue, clear, queue, currentItem, isPlaying } = useVoiceQueue()

function addItems() {
  enqueue('First sentence.')
  enqueue('Second sentence.')
  enqueue('Third sentence.')
}
</script>

<template>
  <button @click="addItems()">Queue sentences</button>
  <button @click="clear()">Clear</button>
  <p>Playing: {{ currentItem }}</p>
  <ul>
    <li v-for="item in queue" :key="item">{{ item }}</li>
  </ul>
</template>
```

## Return Value

```ts
interface UseVoiceQueueReturn {
  /** Add a text item to the end of the queue */
  enqueue(text: string): void
  /** Clear queue and stop current playback */
  clear(): void
  /** All pending items (not yet started) */
  queue: Readonly<Ref<readonly string[]>>
  /** The item currently being spoken */
  currentItem: Readonly<Ref<string | null>>
  /** True while any item is playing */
  isPlaying: Readonly<Ref<boolean>>
}
```

## Queue Lifecycle

```
enqueue('A') ─► queue: ['A']           currentItem: null
enqueue('B') ─► queue: ['A', 'B']      currentItem: null
[A starts]   ─► queue: ['B']           currentItem: 'A'
[A finishes] ─► queue: []              currentItem: 'B'
[B starts]   ─► queue: []              currentItem: 'B'
[B finishes] ─► queue: []              currentItem: null
```

## Concurrency

`useVoiceQueue` plays exactly one item at a time. Playback of the next item starts automatically after the previous one finishes. Calling `enqueue()` while an item is playing appends to the queue without interrupting playback.

## Clearing the Queue

`clear()` stops the currently playing item and removes all pending items:

```ts
const { enqueue, clear } = useVoiceQueue()

enqueue('Long sentence one...')
enqueue('Long sentence two...')

// Immediately stops 'one' and removes 'two'
clear()
```

## Relation to useStreamingTTS

`useStreamingTTS` wraps `useVoiceQueue` and adds:
1. An `AsyncIterable<string>` input pipe
2. Sentence boundary detection via `Intl.Segmenter`
3. `AbortController`-based stream cancellation

Use `useVoiceQueue` directly when you have discrete pre-segmented sentences or paragraphs to play.
