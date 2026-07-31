<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import WaveformCanvas from '../components/WaveformCanvas.vue'
import { useFakeWaveform } from '../composables/useFakeWaveform'
import { useTabEntrance } from '../composables/useTabEntrance'
import { useBestWebVoice } from '../composables/useBestWebVoice'

const emit = defineEmits<{ (e: 'navigate-to-tab', tab: string): void }>()

// ── TTS ───────────────────────────────────────────────────────────────────────
const { isSpeaking, speak, stop, isSupported } = useBestWebVoice()
const ttsText = ref('Welcome to Vue Text to Speech! Click play to hear me speak.')
const { waveformData } = useFakeWaveform(isSpeaking)
useTabEntrance()

function onPlayStop() {
  if (isSpeaking.value) { stop(); return }
  if (!ttsText.value.trim()) return  // E-T1.2
  speak(ttsText.value)
}

onUnmounted(() => { if (isSpeaking.value) stop() })

// ── Feature grid ──────────────────────────────────────────────────────────────
const features = [
  { icon: '⚡', title: '4 Composables', desc: 'useSpeechSynthesis · useSpeechRecognition · useStreamingTTS · useVoiceQueue', tab: 'synthesis' },
  { icon: '🧩', title: '3 Components', desc: 'VueSpeechPlayer · VueSpeechRecorder · VueSpeechVoiceSelect', tab: 'components' },
  { icon: '☁', title: '4+ Providers', desc: 'Web Speech · OpenAI · ElevenLabs · Azure Cognitive', tab: 'setup' },
  { icon: '🌊', title: 'LLM Streaming', desc: 'Token-by-token TTS with sentence detection and voice queue', tab: 'streaming' },
]
</script>

<template>
  <div class="overview">
    <!-- Hero waveform -->
    <section class="overview__hero pg-card">
      <WaveformCanvas :data="waveformData" color="#6366f1" :height="80" :bar-count="60" />
      <div class="overview__hero-text">
        <h1 class="overview__title">Vue Text to Speech</h1>
        <p class="overview__subtitle">Production-ready voice composables for Vue 3 · TypeScript · SSR-safe</p>
      </div>
    </section>

    <!-- Web Speech not supported banner (E-T1.1) -->
    <div v-if="!isSupported" class="overview__warn-banner" role="alert">
      ⚠ Web Speech API not supported in this browser. Switch to an AI provider in the
      <button class="overview__link-btn" @click="emit('navigate-to-tab', 'setup')">Setup tab</button>.
    </div>

    <!-- Inline live demo -->
    <section class="overview__demo pg-card">
      <div class="pg-label" style="margin-bottom:12px">Live Demo — try it now</div>
      <div class="overview__demo-row">
        <textarea
          v-model="ttsText"
          class="overview__textarea"
          rows="2"
          placeholder="Type something to speak…"
          :disabled="isSpeaking"
          aria-label="Text to speak"
        />
        <button
          class="overview__play-btn"
          :class="{ 'overview__play-btn--stop': isSpeaking }"
          :disabled="!isSpeaking && !ttsText.trim()"
          :aria-disabled="!isSpeaking && !ttsText.trim()"
          :aria-label="isSpeaking ? 'Stop speaking' : 'Play text'"
          @click="onPlayStop"
        >
          <span aria-hidden="true">{{ isSpeaking ? '⏹' : '▶' }}</span>
          {{ isSpeaking ? 'Stop' : 'Play' }}
        </button>
      </div>
    </section>

    <!-- Feature grid (E-T1.3: each card emits navigate-to-tab) -->
    <section class="overview__grid">
      <button
        v-for="f in features"
        :key="f.tab"
        class="overview__feature-card pg-card"
        :aria-label="`Go to ${f.title}`"
        @click="emit('navigate-to-tab', f.tab)"
      >
        <span class="overview__feature-icon" aria-hidden="true">{{ f.icon }}</span>
        <strong class="overview__feature-title">{{ f.title }}</strong>
        <p class="overview__feature-desc">{{ f.desc }}</p>
      </button>
    </section>

    <!-- CTA banner (T1.4) -->
    <section class="overview__cta pg-card" role="complementary">
      <div class="overview__cta-content">
        <span class="overview__cta-label">✨ Showstopper demo</span>
        <p>See it all come together in a full AI voice agent chat interface.</p>
      </div>
      <button
        class="overview__cta-btn"
        aria-label="Open AI Chat Agent tab"
        @click="emit('navigate-to-tab', 'chat')"
      >
        Open AI Chat Agent →
      </button>
    </section>

    <!-- Status chips (T1.5) -->
    <div class="overview__chips" role="list" aria-label="Library status">
      <span class="overview__chip" role="listitem">✓ 192 tests passing</span>
      <span class="overview__chip" role="listitem">✓ SSR-safe</span>
      <span class="overview__chip" role="listitem">✓ TypeScript</span>
      <span class="overview__chip" role="listitem">✓ MIT license</span>
    </div>
  </div>
</template>

<style scoped>
.overview { display: flex; flex-direction: column; gap: 20px; }

/* Hero */
.overview__hero { padding: 24px; overflow: hidden; position: relative; }
.overview__hero-text { margin-top: 16px; }
.overview__title { font-size: 2rem; font-weight: 700; margin: 0 0 6px; color: var(--pg-text); }
.overview__subtitle { color: var(--pg-text-muted); margin: 0; font-size: 0.95rem; }

/* Warning banner */
.overview__warn-banner {
  background: rgba(244,63,94,0.12); border: 1px solid var(--pg-rose);
  color: var(--pg-rose); border-radius: var(--pg-radius-sm); padding: 12px 16px; font-size: 0.88rem;
}
.overview__link-btn {
  background: none; border: none; color: var(--pg-rose); text-decoration: underline;
  cursor: pointer; padding: 0; font-size: inherit;
}

/* Demo */
.overview__demo { padding: 20px; }
.overview__demo-row { display: flex; gap: 12px; align-items: flex-start; }
.overview__textarea {
  flex: 1; background: var(--pg-surface-2); border: 1px solid var(--pg-border); border-radius: var(--pg-radius-sm);
  color: var(--pg-text); padding: 10px 12px; font-size: 0.9rem; resize: vertical;
  font-family: inherit; outline: none;
}
.overview__textarea:focus { border-color: var(--pg-primary); }
.overview__play-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  background: var(--pg-primary); color: #fff; border: none; border-radius: var(--pg-radius-sm);
  cursor: pointer; font-size: 0.88rem; font-weight: 600; white-space: nowrap; transition: opacity .15s;
}
.overview__play-btn:disabled { opacity: .4; cursor: not-allowed; }
.overview__play-btn--stop { background: var(--pg-rose); }

/* Feature grid */
.overview__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.overview__feature-card {
  padding: 20px; text-align: left; cursor: pointer; border: none;
  transition: box-shadow .2s, transform .15s; color: inherit;
}
.overview__feature-card:hover { box-shadow: var(--pg-glow-primary), var(--pg-shadow-sm); transform: translateY(-2px); }
.overview__feature-icon { font-size: 1.6rem; display: block; margin-bottom: 10px; }
.overview__feature-title { display: block; font-size: 1rem; margin-bottom: 6px; color: var(--pg-text); }
.overview__feature-desc { color: var(--pg-text-muted); font-size: 0.78rem; margin: 0; line-height: 1.5; }

/* CTA */
.overview__cta {
  padding: 20px 24px; border-left: 3px solid var(--pg-primary);
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.overview__cta-label { display: block; font-size: 0.75rem; color: var(--pg-primary); font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em; }
.overview__cta p { margin: 0; color: var(--pg-text); font-size: 0.9rem; }
.overview__cta-btn {
  background: var(--pg-primary); color: #fff; border: none; border-radius: var(--pg-radius-sm);
  padding: 10px 20px; cursor: pointer; font-size: 0.88rem; font-weight: 600; white-space: nowrap;
  transition: opacity .15s;
}
.overview__cta-btn:hover { opacity: .85; }

/* Chips */
.overview__chips { display: flex; flex-wrap: wrap; gap: 10px; }
.overview__chip {
  padding: 5px 12px; border-radius: 99px; background: var(--pg-primary-dim);
  color: var(--pg-primary); font-size: 0.78rem; font-weight: 600;
}
</style>

