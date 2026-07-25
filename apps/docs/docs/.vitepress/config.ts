import { defineConfig } from 'vitepress'

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
})
