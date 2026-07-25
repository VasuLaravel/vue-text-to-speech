import type { TTSProvider, ProviderConfig } from './providers/types.js'
import { WebSpeechTTSProvider } from './providers/WebSpeechTTSProvider.js'

/**
 * Factory — returns the correct `TTSProvider` for the given config.
 *
 * AI providers (openai, elevenlabs, azure) are loaded via dynamic import so
 * they are excluded from the bundle when not used (tree-shaking).
 */
export async function createVueSpeech(config: ProviderConfig): Promise<TTSProvider> {
  switch (config.provider) {
    case 'web':
      return new WebSpeechTTSProvider()

    case 'openai': {
      const { OpenAIProvider } = await import('./providers/OpenAIProvider.js')
      return new OpenAIProvider(config)
    }

    case 'elevenlabs': {
      const { ElevenLabsProvider } = await import('./providers/ElevenLabsProvider.js')
      return new ElevenLabsProvider(config)
    }

    case 'azure': {
      const { AzureProvider } = await import('./providers/AzureProvider.js')
      return new AzureProvider(config)
    }

    default: {
      const _exhaustive: never = config
      throw new Error(`Unknown provider: ${(_exhaustive as ProviderConfig).provider}`)
    }
  }
}

/**
 * Synchronous factory for the web provider only.
 * Used internally by composables as the no-config fallback (I-4.1).
 */
export function createWebSpeechProvider(): TTSProvider {
  return new WebSpeechTTSProvider()
}
