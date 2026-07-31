<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useStreamingTTS } from 'vue-text-to-speech'
import WaveformCanvas from '../components/WaveformCanvas.vue'
import CodeBlock from '../components/CodeBlock.vue'
import { useSimulatedLLM } from '../composables/useSimulatedLLM'
import { useFakeWaveform } from '../composables/useFakeWaveform'
import { useTabEntrance } from '../composables/useTabEntrance'
import type { Persona } from '../composables/useSimulatedLLM'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'ai'; text: string; error?: boolean; id: number }

// ── State ──────────────────────────────────────────────────────────────────────
const messages = ref<Message[]>([])
const inputText = ref('')
const threadEl = ref<HTMLElement | null>(null)
let msgId = 0

// ── Persona ────────────────────────────────────────────────────────────────────
const PERSONAS: { value: Persona; label: string; avatar: string }[] = [
  { value: 'helpful-assistant', label: 'Helpful Assistant', avatar: '🤖' },
  { value: 'code-tutor',        label: 'Code Tutor',        avatar: '👨‍💻' },
  { value: 'story-narrator',    label: 'Story Narrator',    avatar: '📖' },
]
const personaIdx = ref(0)
const currentPersona = computed(() => PERSONAS[personaIdx.value])

// ── Streaming TTS ──────────────────────────────────────────────────────────────
const { pipeStream, currentItem, isStreaming, stop: stopTTS } = useStreamingTTS()
const isSpeaking = computed(() => isStreaming.value ?? false)
const { waveformData } = useFakeWaveform(isSpeaking)
useTabEntrance()

// ── Simulated LLM ──────────────────────────────────────────────────────────────
const llm = computed(() => useSimulatedLLM(currentPersona.value.value, 28))

// ── Real AI toggle ─────────────────────────────────────────────────────────────
const useRealAI = ref(false)
const openaiKey = ref('')  // in-memory only — never localStorage (S-1)
const showKey = ref(false)

// ── Accumulated current AI message ────────────────────────────────────────────
const streamingMsgId = ref<number | null>(null)

function getStreamingMsg(): Message | undefined {
  return messages.value.find(m => m.id === streamingMsgId.value)
}

// Highlight sentence currently being spoken inside the latest AI bubble
const highlightSplit = computed(() => {
  const item = currentItem.value
  if (!item) return null
  const msg = getStreamingMsg()
  if (!msg) return null
  const text = msg.text
  // Normalize compare (E-T2.5)
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
  const nItem = normalize(item)
  const nText = normalize(text)
  const idx = nText.indexOf(nItem)
  if (idx === -1) return null
  return { msgId: msg.id, before: text.slice(0, idx), hl: item, after: text.slice(idx + item.length) }
})

// ── Send ───────────────────────────────────────────────────────────────────────
const isBusy = computed(() => isStreaming.value)

async function send() {
  const text = inputText.value.trim()
  if (!text) return
  if (useRealAI.value && !openaiKey.value.trim()) return  // E-T2.2

  // Stop any current TTS and replace immediately (E-T2.1 default: stop+replace)
  if (isStreaming.value) stopTTS()

  messages.value.push({ role: 'user', text, id: ++msgId })
  inputText.value = ''
  await nextTick()
  scrollToBottom()

  // Create AI placeholder bubble
  const aiId = ++msgId
  messages.value.push({ role: 'ai', text: '', id: aiId })
  streamingMsgId.value = aiId

  try {
    const stream = useRealAI.value && openaiKey.value.trim()
      ? openaiStream(openaiKey.value, buildMessages(text))
      : llm.value.start()

    // Accumulate text into the AI bubble as tokens arrive
    const wrapped = accumulateInBubble(stream, aiId)
    await pipeStream(wrapped)
  } catch (err) {
    const msg = messages.value.find(m => m.id === aiId)
    if (msg) { msg.text = `Error: ${(err as Error).message}`; msg.error = true }
  } finally {
    streamingMsgId.value = null
    await nextTick()
    scrollToBottom()
  }
}

async function* accumulateInBubble(source: AsyncIterable<string>, id: number): AsyncGenerator<string> {
  for await (const chunk of source) {
    const msg = messages.value.find(m => m.id === id)
    if (msg) msg.text += chunk
    yield chunk
    await nextTick()
    scrollToBottom()
  }
}

function buildMessages(userText: string) {
  const sys = {
    'helpful-assistant': 'You are a helpful voice assistant. Keep responses concise (2-3 sentences).',
    'code-tutor': 'You are a patient coding instructor. Explain concepts clearly in 2-3 sentences.',
    'story-narrator': 'You are a dramatic story narrator. Respond with vivid, evocative prose in 2-3 sentences.',
  }[currentPersona.value.value]
  return [{ role: 'system', content: sys }, { role: 'user', content: userText }]
}

// ── Real OpenAI SSE stream (D-7, S-2, S-8) ────────────────────────────────────
async function* openaiStream(
  key: string,
  msgs: { role: string; content: string }[],
): AsyncGenerator<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key.trim()}`,  // S-2: trim whitespace
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'gpt-4o', messages: msgs, stream: true }),
  })

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${res.statusText}`)

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue  // S-8: validate prefix
      const d = t.slice(5).trim()
      if (d === '[DONE]') return
      try {
        const content = (JSON.parse(d) as { choices: { delta: { content?: string } }[] })
          .choices?.[0]?.delta?.content
        if (content) yield content
      } catch { /* malformed — skip (S-8) */ }
    }
  }
}

// ── Scroll ─────────────────────────────────────────────────────────────────────
function scrollToBottom() {
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight
}

// ── Input key handler (Enter to send, Shift+Enter for newline) ─────────────────
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

// ── Persona switch (E-T2.7: stop TTS, clear chat) ─────────────────────────────
function switchPersona(i: number) {
  if (i === personaIdx.value) return
  stopTTS()
  messages.value = []
  personaIdx.value = i
}

// ── Cleanup ────────────────────────────────────────────────────────────────────
onUnmounted(() => stopTTS())

// ── Code snippet ───────────────────────────────────────────────────────────────
const CODE = `const { pipeStream } = useStreamingTTS()

// Simulated LLM
const llm = useSimulatedLLM('helpful-assistant', 30)

async function onSend(userText: string) {
  const stream = llm.start()
  await pipeStream(stream)
}

// Real LLM (OpenAI SSE)
async function* openaiStream(key, messages) {
  const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) })
  for await (const chunk of parseSSE(res.body)) yield chunk
}`
</script>

<template>
  <div class="chat">
    <div class="chat__layout">
      <!-- ── Left sidebar ────────────────────────────────────────────────────── -->
      <aside class="chat__sidebar pg-card">
        <div class="pg-label" style="margin-bottom:10px">Persona</div>
        <div class="chat__personas">
          <button
            v-for="(p, i) in PERSONAS"
            :key="p.value"
            class="chat__persona-btn"
            :class="{ 'chat__persona-btn--active': personaIdx === i }"
            :aria-pressed="personaIdx === i"
            @click="switchPersona(i)"
          >
            <span aria-hidden="true">{{ p.avatar }}</span>
            <span>{{ p.label }}</span>
          </button>
        </div>

        <div class="chat__divider" />

        <!-- Connect Real AI toggle -->
        <label class="chat__toggle">
          <input v-model="useRealAI" type="checkbox" role="switch" :aria-label="`Use real OpenAI API: ${useRealAI ? 'on' : 'off'}`" />
          <span class="chat__toggle-label">Connect Real AI</span>
        </label>

        <template v-if="useRealAI">
          <!-- Security warning (S-3) -->
          <div class="chat__security-warn" role="alert">
            ⚠ For production, proxy requests through your server. Never expose API keys in the browser.
          </div>
          <div class="chat__key-row">
            <input
              :type="showKey ? 'text' : 'password'"
              v-model="openaiKey"
              class="chat__key-input"
              placeholder="sk-…"
              autocomplete="off"
              aria-label="OpenAI API key"
            />
            <button
              class="chat__key-toggle"
              :aria-label="showKey ? 'Hide API key' : 'Show API key'"
              @click="showKey = !showKey"
            >{{ showKey ? '🙈' : '👁' }}</button>
          </div>
          <p v-if="useRealAI && !openaiKey.trim()" class="chat__key-hint">Enter your OpenAI API key above</p>
        </template>
      </aside>

      <!-- ── Chat area ─────────────────────────────────────────────────────── -->
      <div class="chat__main">
        <!-- Thread -->
        <div
          ref="threadEl"
          class="chat__thread"
          role="log"
          aria-live="polite"
          aria-label="Chat conversation"
        >
          <!-- Empty state -->
          <div v-if="messages.length === 0" class="chat__empty">
            <span aria-hidden="true" style="font-size:2.5rem">{{ currentPersona.avatar }}</span>
            <p>Send a message to start the conversation.</p>
          </div>

          <!-- Messages (E-T2.6: max last 50 shown) -->
          <template v-for="msg in messages.slice(-50)" :key="msg.id">
            <!-- User bubble -->
            <div v-if="msg.role === 'user'" class="chat__bubble chat__bubble--user">
              <div class="chat__bubble-text">{{ msg.text }}</div>
            </div>

            <!-- AI bubble -->
            <div v-else class="chat__bubble chat__bubble--ai">
              <div class="chat__avatar" :class="{ 'chat__avatar--speaking': isSpeaking && streamingMsgId === msg.id }">
                <span aria-hidden="true">{{ currentPersona.avatar }}</span>
                <!-- Speaking badge (T2.7) -->
                <span v-if="isSpeaking && streamingMsgId === msg.id" class="pg-speaking-dot chat__speaking-badge" aria-hidden="true" />
              </div>
              <div class="chat__bubble-inner">
                <!-- Sentence highlight (T2.5) -->
                <template v-if="highlightSplit && highlightSplit.msgId === msg.id">
                  <span class="chat__bubble-text">{{ highlightSplit.before }}</span>
                  <span class="chat__bubble-text chat__bubble-text--hl">{{ highlightSplit.hl }}</span>
                  <span class="chat__bubble-text">{{ highlightSplit.after }}</span>
                </template>
                <span v-else class="chat__bubble-text" :class="{ 'chat__bubble-text--error': msg.error }">
                  {{ msg.text }}<span v-if="!msg.text && streamingMsgId === msg.id" class="chat__cursor" aria-hidden="true">|</span>
                </span>
                <!-- Mini waveform while speaking (T2.6) -->
                <WaveformCanvas
                  v-if="isSpeaking && streamingMsgId === msg.id"
                  :data="waveformData"
                  color="#06b6d4"
                  :height="24"
                  :bar-count="20"
                  style="margin-top:8px"
                />
              </div>
            </div>
          </template>
        </div>

        <!-- Input bar -->
        <div class="chat__input-bar">
          <textarea
            v-model="inputText"
            class="chat__input"
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows="1"
            :disabled="isBusy"
            aria-label="Chat message input"
            @keydown="onKeydown"
          />
          <button
            class="chat__send-btn"
            :disabled="isBusy || !inputText.trim() || (useRealAI && !openaiKey.trim())"
            :aria-disabled="isBusy || !inputText.trim()"
            aria-label="Send message"
            @click="send"
          >
            <span aria-hidden="true">▶</span> Send
          </button>
        </div>
      </div>
    </div>

    <!-- Code snippet (T2.11) -->
    <details class="chat__code-details">
      <summary class="chat__code-summary">Integration pattern</summary>
      <CodeBlock :code="CODE" language="typescript" />
    </details>
  </div>
</template>

<style scoped>
.chat { display: flex; flex-direction: column; gap: 16px; }
.chat__layout { display: grid; grid-template-columns: 240px 1fr; gap: 16px; min-height: 520px; }
@media (max-width: 768px) { .chat__layout { grid-template-columns: 1fr; } }

/* Sidebar */
.chat__sidebar { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.chat__personas { display: flex; flex-direction: column; gap: 6px; }
.chat__persona-btn {
  display: flex; align-items: center; gap: 8px; background: none;
  border: 1px solid var(--pg-border); border-radius: var(--pg-radius-sm);
  color: var(--pg-text); padding: 8px 12px; cursor: pointer; font-size: 0.85rem; text-align: left;
  transition: all .15s;
}
.chat__persona-btn:hover { border-color: var(--pg-primary); background: var(--pg-primary-dim); }
.chat__persona-btn--active { border-color: var(--pg-primary); background: var(--pg-primary-dim); color: var(--pg-primary); font-weight: 600; }
.chat__divider { height: 1px; background: var(--pg-border); margin: 4px 0; }
.chat__toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--pg-text); }
.chat__toggle input { accent-color: var(--pg-primary); width: 16px; height: 16px; }
.chat__toggle-label { flex: 1; }
.chat__security-warn {
  background: rgba(244,63,94,.1); border: 1px solid var(--pg-rose); border-radius: var(--pg-radius-sm);
  color: var(--pg-rose); padding: 8px 10px; font-size: 0.75rem; line-height: 1.4;
}
.chat__key-row { display: flex; gap: 6px; }
.chat__key-input {
  flex: 1; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 7px 10px; font-size: 0.82rem; outline: none;
}
.chat__key-input:focus { border-color: var(--pg-primary); }
.chat__key-toggle {
  background: none; border: 1px solid var(--pg-border); border-radius: var(--pg-radius-sm);
  cursor: pointer; padding: 0 8px; font-size: 0.9rem;
}
.chat__key-hint { color: var(--pg-rose); font-size: 0.75rem; margin: 0; }

/* Main */
.chat__main { display: flex; flex-direction: column; gap: 0; }
.chat__thread {
  flex: 1; overflow-y: auto; background: var(--pg-surface); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius) var(--pg-radius) 0 0; padding: 16px; display: flex;
  flex-direction: column; gap: 12px; min-height: 400px; max-height: 460px;
}
.chat__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; color: var(--pg-text-muted); font-size: 0.9rem; }

/* Bubbles */
.chat__bubble { display: flex; gap: 10px; max-width: 85%; }
.chat__bubble--user { align-self: flex-end; flex-direction: row-reverse; }
.chat__bubble--ai { align-self: flex-start; }
.chat__bubble-text { font-size: 0.88rem; line-height: 1.6; color: var(--pg-text); white-space: pre-wrap; }
.chat__bubble-text--hl { text-decoration: underline; color: var(--pg-primary); font-weight: 500; }
.chat__bubble-text--error { color: var(--pg-rose); }
.chat__bubble--user .chat__bubble-text { background: var(--pg-primary-dim); border: 1px solid var(--pg-primary); border-radius: var(--pg-radius-sm); padding: 8px 12px; }
.chat__bubble-inner { background: var(--pg-surface-2); border: 1px solid var(--pg-border); border-radius: 0 var(--pg-radius-sm) var(--pg-radius-sm) var(--pg-radius-sm); padding: 10px 14px; }
.chat__avatar {
  width: 32px; height: 32px; border-radius: 50%; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; position: relative;
}
.chat__avatar--speaking { border-color: var(--pg-cyan); box-shadow: var(--pg-glow-cyan); }
.chat__speaking-badge { position: absolute; bottom: -2px; right: -2px; }
.chat__cursor { animation: blink 1s step-end infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

/* Input bar */
.chat__input-bar {
  display: flex; gap: 8px; background: var(--pg-surface); border: 1px solid var(--pg-border);
  border-top: none; border-radius: 0 0 var(--pg-radius) var(--pg-radius); padding: 10px;
}
.chat__input {
  flex: 1; background: var(--pg-surface-2); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); color: var(--pg-text); padding: 9px 12px;
  font-size: 0.88rem; resize: none; outline: none; font-family: inherit;
}
.chat__input:focus { border-color: var(--pg-primary); }
.chat__send-btn {
  display: flex; align-items: center; gap: 6px; background: var(--pg-primary); color: #fff;
  border: none; border-radius: var(--pg-radius-sm); padding: 9px 18px;
  cursor: pointer; font-size: 0.85rem; font-weight: 600; white-space: nowrap; transition: opacity .15s;
}
.chat__send-btn:disabled { opacity: .4; cursor: not-allowed; }

/* Code details */
.chat__code-details { border-radius: var(--pg-radius-sm); overflow: hidden; }
.chat__code-summary {
  cursor: pointer; padding: 10px 16px; background: var(--pg-surface); border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius-sm); font-size: 0.82rem; color: var(--pg-text-muted); list-style: none;
}
.chat__code-summary:hover { color: var(--pg-text); }
.chat__code-details[open] .chat__code-summary { border-radius: var(--pg-radius-sm) var(--pg-radius-sm) 0 0; }
</style>


