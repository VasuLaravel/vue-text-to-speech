import { shallowRef, readonly, watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'

/**
 * Generates synthetic frequency-domain data to drive WaveformCanvas
 * when real audio from Web Speech API cannot be captured (E-T3.1).
 *
 * While `isSpeaking` is true, a RAF loop fills a Uint8Array with a
 * realistic-looking TTS waveform (stronger low-frequency bands + noise).
 * When idle, returns an empty Uint8Array so WaveformCanvas shows its
 * built-in breathing animation.
 */
export function useFakeWaveform(isSpeaking: Readonly<Ref<boolean>>) {
  const waveformData = shallowRef(new Uint8Array(0))
  let rafId: number | null = null

  function stopLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    waveformData.value = new Uint8Array(0)
  }

  function startLoop(): void {
    const data = new Uint8Array(128)

    function loop(): void {
      const t = performance.now() / 1000
      for (let i = 0; i < 128; i++) {
        // Realistic TTS frequency profile: more energy in 0–30% of bins
        const freq = i / 128
        const base = Math.max(0, (1 - freq * 1.8) * 0.9)
        const noise = Math.random() * 0.25
        const wave1 = (Math.sin(t * 9 + i * 0.5) + 1) * 0.15
        const wave2 = (Math.sin(t * 3.7 + i * 0.2) + 1) * 0.08
        data[i] = Math.min(255, Math.floor((base + noise + wave1 + wave2) * 230))
      }
      waveformData.value = data.slice()  // slice for shallowRef reactivity
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
  }

  watch(isSpeaking, (speaking) => {
    stopLoop()
    if (speaking) startLoop()
  }, { immediate: true })

  onUnmounted(stopLoop)

  return { waveformData: readonly(waveformData) }
}
