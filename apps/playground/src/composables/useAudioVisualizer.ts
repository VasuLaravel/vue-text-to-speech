import { shallowRef, readonly, onUnmounted } from 'vue'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAudioVisualizerReturn {
  /**
   * Reactive Uint8Array of frequency-domain amplitude data from the AnalyserNode.
   * Length equals analyser.frequencyBinCount (fftSize / 2 = 128 by default).
   * All zeros when idle or stopped.
   *
   * NOTE (E-P2.1c): Each composable instance creates its own AudioContext.
   * Avoid creating more instances than necessary.
   */
  readonly analyzerData: ReturnType<typeof readonly<ReturnType<typeof shallowRef<Uint8Array>>>>
  /** True while the RAF loop is running and the analyser is connected. */
  readonly isActive: ReturnType<typeof readonly<ReturnType<typeof shallowRef<boolean>>>>
  /**
   * Begin visualization from a MediaStream or HTMLAudioElement.
   *
   * MUST be called inside a user-gesture event handler (click, keydown, etc.)
   * to satisfy browser AudioContext autoplay policies (E-P2.1a).
   *
   * For HTMLAudioElement sources: catches SecurityError if the element plays
   * a cross-origin URL without CORS headers (E-P2.1d).
   */
  start(source: MediaStream | HTMLAudioElement): void
  /** Stop the RAF loop, disconnect all nodes, and reset analyzerData to zeros. */
  stop(): void
}

// ── Composable ────────────────────────────────────────────────────────────────

/**
 * Wraps the Web Audio API AnalyserNode to produce a reactive Uint8Array of
 * frequency-domain data, suitable for driving a waveform canvas.
 *
 * Lifecycle: start() → RAF loop → stop() (also called on onUnmounted)
 */
export function useAudioVisualizer(): UseAudioVisualizerReturn {
  // ── Reactive state ──────────────────────────────────────────────────────────
  const analyzerData = shallowRef<Uint8Array>(new Uint8Array(0))
  const isActive = shallowRef(false)

  // ── Internal Web Audio nodes (non-reactive) ─────────────────────────────────
  let audioContext: AudioContext | null = null
  let analyserNode: AnalyserNode | null = null
  let connectedSource: AudioNode | null = null
  let rafId: number | null = null

  // ── stop ────────────────────────────────────────────────────────────────────

  function stop(): void {
    // 1. Cancel animation frame
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    // 2. Disconnect source node
    if (connectedSource) {
      try { connectedSource.disconnect() } catch { /* node already disconnected */ }
      connectedSource = null
    }

    // 3. Disconnect analyser
    if (analyserNode) {
      try { analyserNode.disconnect() } catch { /* already disconnected */ }
      analyserNode = null
    }

    // 4. Reset reactive state
    analyzerData.value = new Uint8Array(0)
    isActive.value = false
  }

  // ── start ───────────────────────────────────────────────────────────────────

  function start(source: MediaStream | HTMLAudioElement): void {
    // Stop any previous session first
    stop()

    // ── Create AudioContext lazily (must be inside a user gesture — E-P2.1a) ──
    if (!audioContext || audioContext.state === 'closed') {
      try {
        audioContext = new AudioContext()
      } catch (err) {
        console.warn('[useAudioVisualizer] Could not create AudioContext:', err)
        return
      }
    }

    // Resume if the context was suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => { /* best-effort */ })
    }

    // ── Create source node ────────────────────────────────────────────────────
    let sourceNode: AudioNode

    try {
      if (source instanceof MediaStream) {
        // MediaStream (microphone) — E-P2.1b: if stream disconnects mid-vis,
        // AnalyserNode reads zeros; waveform shows flat line — acceptable
        sourceNode = audioContext.createMediaStreamSource(source)
      } else {
        // HTMLAudioElement — E-P2.1d: cross-origin audio throws SecurityError
        sourceNode = audioContext.createMediaElementSource(source)
        // Route back to speakers so the audio element still plays audibly
        sourceNode.connect(audioContext.destination)
      }
    } catch (err) {
      console.warn('[useAudioVisualizer] Could not connect to audio source:', err)
      isActive.value = false
      return
    }

    connectedSource = sourceNode

    // ── Wire analyser ─────────────────────────────────────────────────────────
    analyserNode = audioContext.createAnalyser()
    analyserNode.fftSize = 256          // → frequencyBinCount = 128
    analyserNode.smoothingTimeConstant = 0.8
    sourceNode.connect(analyserNode)

    const bufferLength = analyserNode.frequencyBinCount
    // Reuse a single buffer — slice() in the loop creates a new Uint8Array
    // to trigger Vue's shallowRef update
    const dataArray = new Uint8Array(bufferLength)

    isActive.value = true

    // ── RAF loop ──────────────────────────────────────────────────────────────
    function loop(): void {
      if (!analyserNode || !isActive.value) return
      rafId = requestAnimationFrame(loop)
      analyserNode.getByteFrequencyData(dataArray)
      // slice() creates a new reference — required for shallowRef to trigger
      analyzerData.value = dataArray.slice()
    }

    rafId = requestAnimationFrame(loop)
  }

  // ── Cleanup on component unmount ────────────────────────────────────────────
  onUnmounted(() => stop())

  return {
    analyzerData: readonly(analyzerData),
    isActive: readonly(isActive),
    start,
    stop,
  }
}
