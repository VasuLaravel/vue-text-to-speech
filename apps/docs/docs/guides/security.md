# Security Guide

## API Key Exposure

When you pass `apiKey` to `app.use(VueSpeech, { provider: 'openai', apiKey: '...' })` in a browser app, the key is embedded in your JavaScript bundle. Anyone can extract it from the browser DevTools.

**Every AI provider** (OpenAI, ElevenLabs, Azure) supports a `baseURL` option specifically to avoid this. Route all AI requests through your own server.

## The Proxy Pattern

```
Browser ──► your server (holds secrets) ──► AI provider API
```

The browser never receives API keys. Your server adds the credential header before forwarding.

## Express Proxy Examples

### OpenAI

```ts
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()

// Forward POST /api/tts → https://api.openai.com/v1/audio/speech
app.use('/api/tts', createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: { '^/api/tts': '/v1/audio/speech' },
  on: {
    proxyReq(proxyReq) {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.OPENAI_KEY}`)
    },
  },
}))
```

```ts
// Vue app — main.ts
createApp(App)
  .use(VueSpeech, { provider: 'openai', apiKey: '', baseURL: '/api/tts' })
  .mount('#app')
```

### ElevenLabs

```ts
app.use('/api/tts/elevenlabs', createProxyMiddleware({
  target: 'https://api.elevenlabs.io',
  changeOrigin: true,
  pathRewrite: { '^/api/tts/elevenlabs': '/v1/text-to-speech' },
  on: {
    proxyReq(proxyReq) {
      proxyReq.setHeader('xi-api-key', process.env.ELEVENLABS_KEY!)
    },
  },
}))
```

### Azure

```ts
app.use('/api/tts/azure', createProxyMiddleware({
  target: `https://${process.env.AZURE_REGION}.tts.speech.microsoft.com`,
  changeOrigin: true,
  pathRewrite: { '^/api/tts/azure': '/cognitiveservices/v1' },
  on: {
    proxyReq(proxyReq) {
      proxyReq.setHeader('Ocp-Apim-Subscription-Key', process.env.AZURE_KEY!)
    },
  },
}))
```

## Vite Dev Server Proxy

For local development you can use Vite's built-in proxy without running a separate server:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/tts': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/tts/, '/v1/audio/speech'),
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${process.env.OPENAI_KEY}`)
          })
        },
      },
    },
  },
})
```

## Environment Variables

Never commit API keys to version control. Use `.env.local` (git-ignored by default in Vite projects):

```sh
# .env.local — never commit this file
OPENAI_KEY=sk-...
ELEVENLABS_KEY=...
AZURE_KEY=...
AZURE_REGION=eastus
```

In CI/CD, inject them as repository secrets (see [GitHub Actions workflow](/guides/migration#github-actions)).

## Input Validation

If your proxy server accepts a `text` body from the browser, always validate length and content before forwarding to the AI provider:

```ts
app.post('/api/tts', express.json(), (req, res, next) => {
  const { text } = req.body
  if (typeof text !== 'string' || text.length > 4096) {
    return res.status(400).json({ error: 'Invalid text' })
  }
  next()
})
```

## Rate Limiting

Protect your proxy endpoints from abuse with a rate limiter:

```sh
npm install express-rate-limit
```

```ts
import rateLimit from 'express-rate-limit'

const ttsLimiter = rateLimit({
  windowMs: 60_000,   // 1 minute
  max: 30,            // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/tts', ttsLimiter, proxyHandler)
```

## CORS

Restrict your proxy endpoints to requests from your own origin:

```ts
import cors from 'cors'

app.use('/api/tts', cors({
  origin: process.env.ALLOWED_ORIGIN ?? 'https://yourdomain.com',
}))
```

## Summary

| Risk | Mitigation |
|---|---|
| API key in bundle | Use `baseURL` proxy on all AI providers |
| Unlimited API usage | Rate limit proxy endpoints |
| Cross-origin abuse | Restrict CORS to your domain |
| Oversized input | Validate `text.length` before forwarding |
| Key leak in source control | Use `.env.local` + git-ignore; secrets in CI |
