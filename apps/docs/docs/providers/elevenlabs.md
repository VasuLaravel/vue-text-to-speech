# ElevenLabs TTS

Uses the [ElevenLabs Text-to-Speech API](https://elevenlabs.io/docs/api-reference/text-to-speech). Produces highly realistic voices with fine-grained stability and similarity controls.

## Setup

```ts
import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

createApp(App)
  .use(VueSpeech, {
    provider: 'elevenlabs',
    apiKey: import.meta.env.VITE_ELEVEN_KEY,
    voiceId: '21m00Tcm4TlvDq8ikWAM',   // Rachel (default)
    modelId: 'eleven_multilingual_v2',
  })
  .mount('#app')
```

::: warning Never expose API keys
Use `baseURL` to proxy requests through your server. See the [Security Guide](/guides/security).
:::

## Configuration

```ts
interface ElevenLabsConfig {
  provider: 'elevenlabs'
  apiKey: string
  baseURL?: string         // proxy URL for production
  voiceId?: string
  modelId?: string
  stability?: number       // 0–1, default 0.5
  similarityBoost?: number // 0–1, default 0.75
}
```

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | — | ElevenLabs API key |
| `baseURL` | `string` | `https://api.elevenlabs.io` | Override for proxy |
| `voiceId` | `string` | `'21m00Tcm4TlvDq8ikWAM'` | Voice ID (Rachel) |
| `modelId` | `string` | `'eleven_monolingual_v1'` | Model to use |
| `stability` | `number` | `0.5` | Voice consistency, 0–1 |
| `similarityBoost` | `number` | `0.75` | Voice clarity, 0–1 |

## Available Models

| Model ID | Notes |
|---|---|
| `eleven_monolingual_v1` | English only, fast |
| `eleven_multilingual_v2` | 29 languages, highest quality |
| `eleven_turbo_v2` | Low latency, English |

## Finding Voice IDs

Voice IDs can be found in the [ElevenLabs Voice Library](https://elevenlabs.io/voice-library) or via the API:

```ts
// GET https://api.elevenlabs.io/v1/voices
const res = await fetch('https://api.elevenlabs.io/v1/voices', {
  headers: { 'xi-api-key': apiKey },
})
const { voices } = await res.json()
```

## Server Proxy

```ts
// Express middleware
app.post('/tts/elevenlabs/:voiceId', (req, res) => {
  const upstream = `https://api.elevenlabs.io/v1/text-to-speech/${req.params.voiceId}`
  proxy.web(req, res, {
    target: upstream,
    headers: { 'xi-api-key': process.env.ELEVEN_KEY },
  })
})

// App
createApp(App)
  .use(VueSpeech, {
    provider: 'elevenlabs',
    apiKey: '',
    baseURL: '/tts/elevenlabs',
  })
  .mount('#app')
```

## Limitations

- No `pause()` / `resume()` support
- Voice ID must match the `baseURL` route or be passed in config
