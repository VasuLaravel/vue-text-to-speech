import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      // Multi-entry: main index + isolated provider subpath exports (I-1.4)
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'providers/openai': resolve(__dirname, 'src/providers/OpenAIProvider.ts'),
        'providers/elevenlabs': resolve(__dirname, 'src/providers/ElevenLabsProvider.ts'),
        'providers/azure': resolve(__dirname, 'src/providers/AzureProvider.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Exclude Vue from the bundle — it's a peer dependency
      external: ['vue'],
      output: {
        // Preserve module structure so tree-shaking works in consumers
        preserveModules: false,
        globals: {
          vue: 'Vue',
        },
      },
    },
    // Keep source maps for debugging
    sourcemap: true,
    // Do not minify — consumers' bundlers will do that
    minify: false,
  },
})
