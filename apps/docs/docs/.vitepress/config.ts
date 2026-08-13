import { defineConfig } from 'vitepress'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  fileURLToPath(new URL('../../../../packages/vue-text-to-speech/tests', import.meta.url))
)

export default defineConfig({
  title: 'vue-text-to-speech',
  description: 'Vue 3 text-to-speech plugin â€” composables, UI components, multi-provider support',
  base: '/',
  themeConfig: {
    logo: 'ðŸŽ™ï¸',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/getting-started' },
      { text: 'API', link: '/api/use-speech-synthesis' },
      { text: 'Components', link: '/components/vue-speech-player' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Migration from v1', link: '/guides/migration' },
        ],
      },
      {
        text: 'Providers',
        items: [
          { text: 'Web Speech (Native)', link: '/providers/web' },
          { text: 'OpenAI', link: '/providers/openai' },
          { text: 'ElevenLabs', link: '/providers/elevenlabs' },
          { text: 'Azure', link: '/providers/azure' },
        ],
      },
      {
        text: 'Composables',
        items: [
          { text: 'useSpeechSynthesis', link: '/api/use-speech-synthesis' },
          { text: 'useSpeechRecognition', link: '/api/use-speech-recognition' },
          { text: 'useStreamingTTS', link: '/api/use-streaming-tts' },
          { text: 'useVoiceQueue', link: '/api/use-voice-queue' },
          { text: 'Utilities', link: '/api/utilities' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'VueSpeechPlayer', link: '/components/vue-speech-player' },
          { text: 'VueSpeechRecorder', link: '/components/vue-speech-recorder' },
          { text: 'VueSpeechVoiceSelect', link: '/components/vue-speech-voice-select' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Gen AI Integration', link: '/guides/gen-ai' },
          { text: 'Security & API Keys', link: '/guides/security' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/VasuLaravel/vue-text-to-speech' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/vue-text-to-speech' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 - present | Kuncham Vasu',
    },
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/VasuLaravel/vue-text-to-speech/edit/main/apps/docs/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },

  transformPageData(pageData) {
    if (pageData.relativePath !== 'index.md') return
    const features = pageData.frontmatter.features as Array<{ icon?: string; title: string; details: string }> | undefined
    if (!features) return
    const i = features.findIndex(f => /\d+\s*[Tt]ests?/.test(f.title))
    if (i !== -1) features[i] = { ...features[i], title: `${TEST_COUNT} Tests` }
  },
})
