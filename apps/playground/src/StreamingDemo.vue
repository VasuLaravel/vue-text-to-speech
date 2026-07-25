<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStreamingTTS } from 'vue-text-to-speech'

const { pipeStream, stop, queue, currentItem, currentChunk, isStreaming } = useStreamingTTS()
const safeQueue = computed<readonly string[]>(() => queue.value ?? [])

const LLM_RESPONSE = `Hello there! This is a simulated language model response.
It has multiple sentences that will be detected automatically.
The text-to-speech engine queues each sentence as it forms.
Streaming makes the response feel much more natural and immediate.
This is the final sentence of the demo.`

async function* simulatedLLMStream(text: string, chunkSize = 6): AsyncIterable<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    await new Promise((r) => setTimeout(r, 50))   // ~20 tokens/s
    yield text.slice(i, i + chunkSize)
  }
}

const customText = ref(LLM_RESPONSE)

async function startStreaming() {
  await pipeStream(simulatedLLMStream(customText.value))
}
</script>

<template>
  <!-- Designed to live inside a <q-card> in App.vue â€” uses q-card-section directly -->
  <q-card-section class="q-pb-sm">
    <div class="text-h6 text-dark">Streaming TTS - LLM Simulation</div>
    <div class="text-caption text-grey-6 q-mt-xs">
      Tokens arrive every ~50 ms. Complete sentences are spoken as they form.
    </div>
  </q-card-section>

  <q-separator />

  <q-card-section>
    <!-- Controls -->
    <div class="row items-center q-gutter-sm q-mb-lg">
      <q-btn
        color="primary"
        no-caps
        rounded
        icon="play_arrow"
        :label="isStreaming ? 'Streaming' : 'Start Stream'"
        :loading="isStreaming"
        :disable="isStreaming"
        unelevated
        @click="startStreaming"
      />
      <q-btn
        no-caps
        rounded
        color="negative"
        icon="stop"
        label="Stop"
        :disable="!isStreaming"
        flat
        @click="stop"
      />
      <q-chip
        :color="isStreaming ? 'positive' : 'grey-4'"
        :text-color="isStreaming ? 'white' : 'grey-7'"
        :icon="isStreaming ? 'graphic_eq' : 'radio_button_unchecked'"
        size="md"
      >
        {{ isStreaming ? 'Streaming' : 'Idle' }}
      </q-chip>
    </div>

    <!-- State grid â€” 2-up on sm+ -->
    <div class="row q-col-gutter-sm q-mb-md">

      <!-- Speaking now -->
      <div class="col-12 col-sm-6">
        <q-card flat bordered class="bg-grey-1 full-height">
          <q-card-section class="q-py-sm">
            <div
              class="text-caption text-grey-5 text-uppercase q-mb-xs"
              style="letter-spacing: .04em"
            >Speaking now</div>
            <div class="text-body2 text-dark">{{ currentItem ?? '' }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Buffer -->
      <div class="col-12 col-sm-6">
        <q-card flat bordered class="bg-grey-1 full-height">
          <q-card-section class="q-py-sm">
            <div
              class="text-caption text-grey-5 text-uppercase q-mb-xs"
              style="letter-spacing: .04em"
            >Buffer (partial sentence)</div>
            <div class="text-body2 text-purple-7" style="font-style: italic">
              {{ currentChunk || '' }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Queue â€” full width -->
      <div class="col-12">
        <q-card flat bordered class="bg-grey-1">
          <q-card-section class="q-py-sm">
            <div
              class="row items-center q-mb-xs"
              style="gap: 0.5rem"
            >
              <span
                class="text-caption text-grey-5 text-uppercase"
                style="letter-spacing: .04em"
              >Queue</span>
              <q-badge
                v-if="safeQueue.length"
                color="primary"
                :label="safeQueue.length"
              />
            </div>

            <div v-if="!safeQueue.length" class="text-body2 text-grey-5">—</div>
            <q-list v-else dense>
              <q-item
                v-for="(item, i) in safeQueue"
                :key="i"
                dense
                class="q-px-none"
              >
                <q-item-section side class="q-pr-sm" style="min-width: 28px">
                  <q-badge color="grey-4" text-color="dark" :label="i + 1" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2 text-grey-7">{{ item }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Custom text editor -->
     <div class="label text-caption text-grey-6">Custom text (simulated LLM output)</div>
    <q-input
      v-model="customText"
      type="textarea"
      :disable="isStreaming"
      outlined
      autogrow
      :rows="5"
    />
  </q-card-section>
</template>
