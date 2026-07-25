# Web Speech API (Native)

The built-in browser provider wraps the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API). No API key, no network requests, works offline.

## Setup

```ts
import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

createApp(App)
  .use(VueSpeech, { provider: 'web' })
  .mount('#app')
```

## Configuration

```ts
interface WebSpeechConfig {
  provider: 'web'
  /** Default BCP-47 language for STT, e.g. 'en-US' */
  lang?: string
}
```

| Option | Type | Default | Description |
|---|---|---|---|
| `provider` | `'web'` | — | Required discriminant |
| `lang` | `string` | Browser UI lang | Default BCP-47 language for `useSpeechRecognition` |

## Voices

Voices are loaded from the browser's `speechSynthesis.getVoices()`. Chrome has a known race condition — the library handles this by listening for the `voiceschanged` event with a 3-second timeout fallback.

```ts
const { voices, isLoadingVoices } = useSpeechSynthesis()
// voices.value is populated after the voiceschanged event fires
```

## Limitations

| Limitation | Notes |
|---|---|
| Voice quality | OS-bundled voices vary significantly across platforms |
| STT support | Firefox does not support `SpeechRecognition` |
| Concurrent utterances | Only one utterance at a time across the entire page |
| `pause()` / `resume()` | Supported; AI providers are no-ops |

## SSR

The provider is fully SSR-safe — all browser API access is guarded by `typeof window !== 'undefined'`.
