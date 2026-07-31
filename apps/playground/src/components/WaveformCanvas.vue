<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

// ── Props ──────────────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  /** Frequency-domain amplitude data from useAudioVisualizer (0–255 per bin). */
  data?: Uint8Array
  /** Bar fill color. Accepts any CSS color string. */
  color?: string
  /** Canvas height in CSS pixels. */
  height?: number
  /** Number of bars to render. */
  barCount?: number
}>(), {
  data: () => new Uint8Array(0),
  color: '#6366f1',
  height: 64,
  barCount: 40,
})

// ── Canvas ref ─────────────────────────────────────────────────────────────────

const canvas = ref<HTMLCanvasElement | null>(null)
let animFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null

// ── Idle breathing phase (shared across frames, updated by RAF) ───────────────

// ── Draw function ──────────────────────────────────────────────────────────────

function draw(): void {
  const el = canvas.value
  if (!el) return

  const ctx = el.getContext('2d')
  if (!ctx) return

  const w = el.width
  const h = el.height
  const bars = props.barCount
  // Gap between bars = 20% of slot width; bar width = 80%
  const slotWidth = w / bars
  const barW = Math.max(1, slotWidth * 0.7)
  const gap = slotWidth * 0.3

  ctx.clearRect(0, 0, w, h)

  // Determine if idle: empty array OR all zeros (E-P2.2c)
  const isEmpty = props.data.length === 0
  const allZero = !isEmpty && props.data.every(v => v === 0)
  const isIdle = isEmpty || allZero

  ctx.fillStyle = props.color

  for (let i = 0; i < bars; i++) {
    let barH: number

    if (isIdle) {
      // Breathing animation — staggered sine wave (E-P2.2c)
      // Phase varies per bar and over time
      const t = performance.now() / 1000
      const phaseOffset = (i / bars) * Math.PI * 2
      const sine = Math.sin(t * 1.2 + phaseOffset) * 0.5 + 0.5  // 0–1
      barH = h * 0.12 + h * 0.22 * sine
    } else {
      // Map bar index to data index
      const dataIdx = Math.floor((i / bars) * props.data.length)
      const amplitude = props.data[dataIdx] / 255   // 0–1
      barH = Math.max(2, amplitude * h)
    }

    const x = i * slotWidth + gap / 2
    const y = (h - barH) / 2   // vertically centered

    // Rounded-rectangle bars (4px radius, capped at half bar height)
    const radius = Math.min(barW / 2, 3)
    ctx.beginPath()
    ctx.roundRect(x, y, barW, barH, radius)
    ctx.fill()
  }
}

// ── Continuous RAF loop for smooth idle animation ──────────────────────────────

function startLoop(): void {
  if (animFrameId !== null) return  // already running

  function loop(): void {
    draw()
    animFrameId = requestAnimationFrame(loop)
  }
  animFrameId = requestAnimationFrame(loop)
}

function stopLoop(): void {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
}

// ── ResizeObserver — keep canvas pixel dimensions in sync with layout ──────────

function syncCanvasSize(): void {
  const el = canvas.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  // Only update when dimensions actually changed to avoid thrashing
  if (el.width !== Math.round(rect.width) || el.height !== Math.round(rect.height)) {
    el.width = Math.round(rect.width || el.clientWidth || 300)
    el.height = props.height
  }
}

// ── Watch barCount changes and immediately re-draw (E-P2.2b) ──────────────────

watch(() => props.barCount, () => {
  // Next RAF will pick up new barCount — no extra action needed
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  const el = canvas.value
  if (!el) return

  // Set initial pixel dimensions
  el.height = props.height
  el.width = el.clientWidth || 300

  // Watch for layout changes (E-P2.2a: canvas sized via ResizeObserver)
  resizeObserver = new ResizeObserver(() => {
    syncCanvasSize()
  })
  resizeObserver.observe(el)

  // Start the continuous animation loop
  startLoop()
})

onUnmounted(() => {
  stopLoop()
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <!--
    aria-hidden="true" — this is a decorative waveform, not meaningful content (A-10).
    The parent component should provide a textual status description separately.
  -->
  <canvas
    ref="canvas"
    aria-hidden="true"
    :style="{ display: 'block', width: '100%', height: `${height}px` }"
  />
</template>
