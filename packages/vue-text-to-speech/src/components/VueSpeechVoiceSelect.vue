<script setup lang="ts">
import { computed } from 'vue'
import type { VoiceInfo } from '../providers/types.js'

// ─── Props / Emits ────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    /** Voice list from useSpeechSynthesis().voices */
    voices: readonly VoiceInfo[]
    modelValue?: VoiceInfo
    disabled?: boolean
    /** Show loading spinner text while voices are being fetched */
    loading?: boolean
  }>(),
  { disabled: false, loading: false },
)

const emit = defineEmits<{
  'update:modelValue': [voice: VoiceInfo | undefined]
}>()

// ─── Group voices by primary language using Intl.DisplayNames ─────────────────
// Spec I-6.4: ISO language code labels — no emoji flags (inconsistent on Windows)
function getLangLabel(lang: string): string {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' })
    return dn.of(lang) ?? lang
  } catch {
    return lang
  }
}

interface VoiceGroup {
  key: string
  label: string
  voices: VoiceInfo[]
}

const voiceGroups = computed<VoiceGroup[]>(() => {
  const groups = new Map<string, VoiceGroup>()
  for (const voice of props.voices) {
    const key = voice.lang || 'other'
    if (!groups.has(key)) {
      groups.set(key, { key, label: getLangLabel(key), voices: [] })
    }
    groups.get(key)!.voices.push(voice)
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label))
})

function handleChange(event: Event) {
  const voiceId = (event.target as HTMLSelectElement).value
  const voice = props.voices.find((v) => v.id === voiceId)
  emit('update:modelValue', voice)
}
</script>

<template>
  <select
    class="vts-voice-select"
    :value="modelValue?.id ?? ''"
    :disabled="disabled || loading"
    aria-label="Select voice"
    @change="handleChange"
  >
    <option v-if="loading" value="" disabled>Loading voices…</option>
    <option v-else-if="voices.length === 0" value="" disabled>No voices available</option>
    <template v-else>
      <option v-if="!modelValue" value="" disabled>Select a voice</option>
      <optgroup v-for="group in voiceGroups" :key="group.key" :label="group.label">
        <option v-for="voice in group.voices" :key="voice.id" :value="voice.id">
          {{ voice.label }}{{ voice.default ? ' ✓' : '' }}
        </option>
      </optgroup>
    </template>
  </select>
</template>

<style scoped>
/*
  CSS custom properties (Sprint 6 token set — I-6.1):
    --vts-primary        #6366f1
    --vts-primary-hover  #4f46e5
    --vts-bg             #ffffff
    --vts-border         #e5e7eb
    --vts-text           #111827
    --vts-text-muted     #6b7280
    --vts-radius         8px
    --vts-font           inherit
    --vts-recording-color #ef4444
*/

.vts-voice-select {
  font-family: var(--vts-font, inherit);
  font-size: 0.875rem;
  color: var(--vts-text, #111827);
  background: var(--vts-bg, #ffffff);
  border: 1px solid var(--vts-border, #e5e7eb);
  border-radius: var(--vts-radius, 8px);
  padding: 0.375rem 0.625rem;
  width: 100%;
  cursor: pointer;
  appearance: auto;
}

.vts-voice-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vts-voice-select:focus-visible {
  outline: 2px solid var(--vts-primary, #6366f1);
  outline-offset: 2px;
}
</style>
