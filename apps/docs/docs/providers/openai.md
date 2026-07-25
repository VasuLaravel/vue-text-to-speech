# OpenAI TTS

Uses the [OpenAI Text-to-Speech API](https://platform.openai.com/docs/guides/text-to-speech) (`POST /v1/audio/speech`). Audio is fetched as a complete MP3 blob and played via an `<audio>` element.

## Setup

```ts
import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

createApp(App)
  .use(VueSpeech, {
    provider: 'openai',
    apiKey: import.meta.env.VITE_OPENAI_KEY,
    model: 'tts-1-hd',
    voice: 'nova',
  })
  .mount('#app')
```

::: warning Never expose API keys
Use `baseURL` to proxy requests through your server. See the [Security Guide](/guides/security).
:::

## Configuration

```ts
interface OpenAIConfig {
  provider: 'openai'
  apiKey: string
  baseURL?: string       // proxy URL for production
  model?: 'tts-1' | 'tts-1-hd'
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  speed?: number         // 0.25–4.0, default 1.0
}
```

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | — | OpenAI secret key |
| `baseURL` | `string` | `https://api.openai.com` | Override for proxy |
| `model` | `'tts-1' \| 'tts-1-hd'` | `'tts-1'` | `tts-1-hd` = higher quality, slower |
| `voice` | `string` | `'alloy'` | One of 6 available voices |
| `speed` | `number` | `1.0` | Speech speed, 0.25–4.0 |

## Available Voices

| Voice | Character |
|---|---|
| `alloy` | Neutral, balanced |
| `echo` | Male, measured |
| `fable` | British, expressive |
| `onyx` | Deep, authoritative |
| `nova` | Female, warm |
| `shimmer` | Female, clear |

## Server Proxy Example

```ts
// Vite dev — vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/openai': {
        target: 'https://api.openai.com',
        rewrite: (p) => p.replace(/^\/openai/, ''),
        headers: { Authorization: `Bearer ${process.env.OPENAI_KEY}` },
      },
    },
  },
})

// App — main.ts
createApp(App)
  .use(VueSpeech, { provider: 'openai', apiKey: '', baseURL: '/openai' })
  .mount('#app')
```

## Error Codes

| HTTP | `SpeechError.code` |
|---|---|
| 401 | `'API_ERROR'` — invalid key |
| 429 | `'RATE_LIMIT'` — quota exceeded |
| 5xx | `'API_ERROR'` |

## Limitations

- No `pause()` / `resume()` support (blob playback only)
- `rate` and `pitch` options from `useSpeechSynthesis` are not forwarded; use `speed` in config
