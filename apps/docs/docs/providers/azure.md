# Azure Cognitive Services TTS

Uses [Azure Cognitive Services Speech Service](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech) via the REST API. Supports hundreds of Neural TTS voices across 140+ locales.

## Setup

```ts
import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

createApp(App)
  .use(VueSpeech, {
    provider: 'azure',
    subscriptionKey: import.meta.env.VITE_AZURE_KEY,
    region: 'eastus',
    voice: 'en-US-JennyNeural',
  })
  .mount('#app')
```

::: warning Never expose subscription keys
Use `baseURL` to proxy requests through your server. See the [Security Guide](/guides/security).
:::

## Configuration

```ts
interface AzureConfig {
  provider: 'azure'
  subscriptionKey: string
  region: string
  baseURL?: string   // proxy URL for production
  voice?: string     // Neural TTS voice name
}
```

| Option | Type | Default | Description |
|---|---|---|---|
| `subscriptionKey` | `string` | — | Azure Speech subscription key |
| `region` | `string` | — | Azure region, e.g. `'eastus'` |
| `baseURL` | `string` | Auto-built from `region` | Override full endpoint URL |
| `voice` | `string` | `'en-US-JennyNeural'` | Neural TTS voice name |

## Default Endpoint

```
https://{region}.tts.speech.microsoft.com/cognitiveservices/v1
```

When `baseURL` is provided it replaces this URL entirely.

## Output Format

The library requests `audio-16khz-128kbitrate-mono-mp3` and plays it via an `<audio>` element blob URL.

## Popular Neural Voices

| Locale | Voice | Character |
|---|---|---|
| `en-US` | `en-US-JennyNeural` | Friendly, conversational |
| `en-US` | `en-US-GuyNeural` | Male, professional |
| `en-GB` | `en-GB-SoniaNeural` | British female |
| `es-MX` | `es-MX-DaliaNeural` | Spanish (Mexico) |
| `fr-FR` | `fr-FR-DeniseNeural` | French female |
| `de-DE` | `de-DE-KatjaNeural` | German female |
| `ja-JP` | `ja-JP-NanamiNeural` | Japanese female |

Browse all voices at the [Azure Neural Voice Gallery](https://speech.microsoft.com/portal/voicegallery).

## Server Proxy

```ts
// Express — strips subscription key from browser
app.post('/tts/azure', async (req, res) => {
  const upstream = `https://eastus.tts.speech.microsoft.com/cognitiveservices/v1`
  const azure = await fetch(upstream, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_KEY!,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    },
    body: req.body,
  })
  res.set('Content-Type', 'audio/mpeg')
  azure.body!.pipeTo(Writable.toWeb(res))
})

// App
createApp(App)
  .use(VueSpeech, {
    provider: 'azure',
    subscriptionKey: '',
    region: 'eastus',
    baseURL: '/tts/azure',
  })
  .mount('#app')
```

## Limitations

- No `pause()` / `resume()` support (blob playback)
- SSML input is not yet directly exposed — use the `speak()` composable for plain text
