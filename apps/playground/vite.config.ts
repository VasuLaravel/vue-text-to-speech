import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { fileURLToPath, URL } from 'node:url'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import pkg from '../../packages/vue-text-to-speech/package.json'

function countTests(dir: string): number {
  let n = 0
  function walk(d: string): void {
    for (const name of readdirSync(d)) {
      const full = join(d, name)
      if (statSync(full).isDirectory()) { walk(full); continue }
      if (!/\.spec\.ts$/.test(name)) continue
      const src = readFileSync(full, 'utf-8')
      n += (src.match(/^\s*(?:it|test)\s*[.(]/gm) ?? []).length
    }
  }
  walk(dir)
  return n
}

const TEST_COUNT = countTests(
  fileURLToPath(new URL('../../packages/vue-text-to-speech/tests', import.meta.url))
)
import * as https from 'node:https'
import type { Plugin } from 'vite'

/**
 * Proxy /elevenlabs-proxy/* → https://api.elevenlabs.io/* using Node.js's
 * native https module. The browser sends a same-origin request (no CORS
 * preflight); Vite's dev server forwards it server-side where CORS does not
 * apply. Avoids the SSL-handshake failures that Vite's built-in http-proxy
 * can encounter on some systems.
 */
// Dedicated HTTPS agent that skips certificate chain verification.
// Needed when a corporate firewall/proxy intercepts TLS and re-signs with an
// internal CA that Node.js doesn't trust. Scoped to just this proxy — the
// browser's connection to localhost is unaffected.
const elevenLabsAgent = new https.Agent({ rejectUnauthorized: false })

function elevenLabsProxyPlugin(): Plugin {
  return {
    name: 'vite-plugin-elevenlabs-proxy',
    configureServer(server) {
      server.middlewares.use('/elevenlabs-proxy', (req, res) => {
        // connect.use() strips the mount prefix: req.url is already /v1/…
        const targetPath = req.url || '/'

        // Forward all headers except hop-by-hop; replace Host.
        const fwdHeaders: Record<string, string | string[]> = {}
        for (const [k, v] of Object.entries(req.headers)) {
          if (!['host', 'connection', 'keep-alive'].includes(k) && v !== undefined) {
            fwdHeaders[k] = v as string | string[]
          }
        }
        fwdHeaders.host = 'api.elevenlabs.io'

        const proxyReq = https.request(
          {
            hostname: 'api.elevenlabs.io',
            path: targetPath,
            method: req.method,
            headers: fwdHeaders,
            agent: elevenLabsAgent,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
            proxyRes.pipe(res)
          },
        )

        proxyReq.on('error', (err) => {
          console.error('[elevenlabs-proxy]', err.message)
          if (!res.headersSent) { res.statusCode = 502; res.end() }
        })

        req.pipe(proxyReq)
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ sassVariables: 'src/quasar-variables.sass' }),
    elevenLabsProxyPlugin(),
  ],
  define: {
    __VTS_VERSION__: JSON.stringify(pkg.version),
    __VTS_TEST_COUNT__: TEST_COUNT,
  },
  resolve: {
    alias: {
      // Always resolve the library from source so playground picks up
      // changes immediately without needing a library rebuild.
      'vue-text-to-speech': fileURLToPath(
        new URL('../../packages/vue-text-to-speech/src/index.ts', import.meta.url)
      ),
    },
  },
})
