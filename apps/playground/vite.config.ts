import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({
      sassVariables: 'src/quasar-variables.sass',
    }),
  ],
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
