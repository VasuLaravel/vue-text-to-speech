/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, nextTick, onUnmounted } from 'vue';
import { useStreamingTTS } from 'vue-text-to-speech';
import WaveformCanvas from '../components/WaveformCanvas.vue';
import CodeBlock from '../components/CodeBlock.vue';
import { useSimulatedLLM } from '../composables/useSimulatedLLM';
import { useFakeWaveform } from '../composables/useFakeWaveform';
import { useTabEntrance } from '../composables/useTabEntrance';
// ── State ──────────────────────────────────────────────────────────────────────
const messages = ref([]);
const inputText = ref('');
const threadEl = ref(null);
let msgId = 0;
// ── Persona ────────────────────────────────────────────────────────────────────
const PERSONAS = [
    { value: 'helpful-assistant', label: 'Helpful Assistant', avatar: '🤖' },
    { value: 'code-tutor', label: 'Code Tutor', avatar: '👨‍💻' },
    { value: 'story-narrator', label: 'Story Narrator', avatar: '📖' },
];
const personaIdx = ref(0);
const currentPersona = computed(() => PERSONAS[personaIdx.value]);
// ── Streaming TTS ──────────────────────────────────────────────────────────────
const { pipeStream, currentItem, isStreaming, stop: stopTTS } = useStreamingTTS();
const isSpeaking = computed(() => isStreaming.value ?? false);
const { waveformData } = useFakeWaveform(isSpeaking);
useTabEntrance();
// ── Simulated LLM ──────────────────────────────────────────────────────────────
const llm = computed(() => useSimulatedLLM(currentPersona.value.value, 28));
// ── Real AI toggle ─────────────────────────────────────────────────────────────
const useRealAI = ref(false);
const openaiKey = ref(''); // in-memory only — never localStorage (S-1)
const showKey = ref(false);
// ── Accumulated current AI message ────────────────────────────────────────────
const streamingMsgId = ref(null);
function getStreamingMsg() {
    return messages.value.find(m => m.id === streamingMsgId.value);
}
// Highlight sentence currently being spoken inside the latest AI bubble
const highlightSplit = computed(() => {
    const item = currentItem.value;
    if (!item)
        return null;
    const msg = getStreamingMsg();
    if (!msg)
        return null;
    const text = msg.text;
    // Normalize compare (E-T2.5)
    const normalize = (s) => s.replace(/\s+/g, ' ').trim();
    const nItem = normalize(item);
    const nText = normalize(text);
    const idx = nText.indexOf(nItem);
    if (idx === -1)
        return null;
    return { msgId: msg.id, before: text.slice(0, idx), hl: item, after: text.slice(idx + item.length) };
});
// ── Send ───────────────────────────────────────────────────────────────────────
const isBusy = computed(() => isStreaming.value);
async function send() {
    const text = inputText.value.trim();
    if (!text)
        return;
    if (useRealAI.value && !openaiKey.value.trim())
        return; // E-T2.2
    // Stop any current TTS and replace immediately (E-T2.1 default: stop+replace)
    if (isStreaming.value)
        stopTTS();
    messages.value.push({ role: 'user', text, id: ++msgId });
    inputText.value = '';
    await nextTick();
    scrollToBottom();
    // Create AI placeholder bubble
    const aiId = ++msgId;
    messages.value.push({ role: 'ai', text: '', id: aiId });
    streamingMsgId.value = aiId;
    try {
        const stream = useRealAI.value && openaiKey.value.trim()
            ? openaiStream(openaiKey.value, buildMessages(text))
            : llm.value.start();
        // Accumulate text into the AI bubble as tokens arrive
        const wrapped = accumulateInBubble(stream, aiId);
        await pipeStream(wrapped);
    }
    catch (err) {
        const msg = messages.value.find(m => m.id === aiId);
        if (msg) {
            msg.text = `Error: ${err.message}`;
            msg.error = true;
        }
    }
    finally {
        streamingMsgId.value = null;
        await nextTick();
        scrollToBottom();
    }
}
async function* accumulateInBubble(source, id) {
    for await (const chunk of source) {
        const msg = messages.value.find(m => m.id === id);
        if (msg)
            msg.text += chunk;
        yield chunk;
        await nextTick();
        scrollToBottom();
    }
}
function buildMessages(userText) {
    const sys = {
        'helpful-assistant': 'You are a helpful voice assistant. Keep responses concise (2-3 sentences).',
        'code-tutor': 'You are a patient coding instructor. Explain concepts clearly in 2-3 sentences.',
        'story-narrator': 'You are a dramatic story narrator. Respond with vivid, evocative prose in 2-3 sentences.',
    }[currentPersona.value.value];
    return [{ role: 'system', content: sys }, { role: 'user', content: userText }];
}
// ── Real OpenAI SSE stream (D-7, S-2, S-8) ────────────────────────────────────
async function* openaiStream(key, msgs) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key.trim()}`, // S-2: trim whitespace
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4o', messages: msgs, stream: true }),
    });
    if (!res.ok)
        throw new Error(`OpenAI ${res.status}: ${res.statusText}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:'))
                continue; // S-8: validate prefix
            const d = t.slice(5).trim();
            if (d === '[DONE]')
                return;
            try {
                const content = JSON.parse(d)
                    .choices?.[0]?.delta?.content;
                if (content)
                    yield content;
            }
            catch { /* malformed — skip (S-8) */ }
        }
    }
}
// ── Scroll ─────────────────────────────────────────────────────────────────────
function scrollToBottom() {
    if (threadEl.value)
        threadEl.value.scrollTop = threadEl.value.scrollHeight;
}
// ── Input key handler (Enter to send, Shift+Enter for newline) ─────────────────
function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
    }
}
// ── Persona switch (E-T2.7: stop TTS, clear chat) ─────────────────────────────
function switchPersona(i) {
    if (i === personaIdx.value)
        return;
    stopTTS();
    messages.value = [];
    personaIdx.value = i;
}
// ── Cleanup ────────────────────────────────────────────────────────────────────
onUnmounted(() => stopTTS());
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
}`;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['chat__layout']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__persona-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__key-input']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble--user']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__input']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__send-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__code-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__code-details']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__code-summary']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat__layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "chat__sidebar pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-label" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat__personas" },
});
for (const [p, i] of __VLS_getVForSourceType((__VLS_ctx.PERSONAS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchPersona(i);
            } },
        key: (p.value),
        ...{ class: "chat__persona-btn" },
        ...{ class: ({ 'chat__persona-btn--active': __VLS_ctx.personaIdx === i }) },
        'aria-pressed': (__VLS_ctx.personaIdx === i),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        'aria-hidden': "true",
    });
    (p.avatar);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (p.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "chat__divider" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "chat__toggle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "checkbox",
    role: "switch",
    'aria-label': (`Use real OpenAI API: ${__VLS_ctx.useRealAI ? 'on' : 'off'}`),
});
(__VLS_ctx.useRealAI);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "chat__toggle-label" },
});
if (__VLS_ctx.useRealAI) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chat__security-warn" },
        role: "alert",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chat__key-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: (__VLS_ctx.showKey ? 'text' : 'password'),
        ...{ class: "chat__key-input" },
        placeholder: "sk-…",
        autocomplete: "off",
        'aria-label': "OpenAI API key",
    });
    (__VLS_ctx.openaiKey);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.useRealAI))
                    return;
                __VLS_ctx.showKey = !__VLS_ctx.showKey;
            } },
        ...{ class: "chat__key-toggle" },
        'aria-label': (__VLS_ctx.showKey ? 'Hide API key' : 'Show API key'),
    });
    (__VLS_ctx.showKey ? '🙈' : '👁');
    if (__VLS_ctx.useRealAI && !__VLS_ctx.openaiKey.trim()) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "chat__key-hint" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat__main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "threadEl",
    ...{ class: "chat__thread" },
    role: "log",
    'aria-live': "polite",
    'aria-label': "Chat conversation",
});
/** @type {typeof __VLS_ctx.threadEl} */ ;
if (__VLS_ctx.messages.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chat__empty" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        'aria-hidden': "true",
        ...{ style: {} },
    });
    (__VLS_ctx.currentPersona.avatar);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
}
for (const [msg] of __VLS_getVForSourceType((__VLS_ctx.messages.slice(-50)))) {
    (msg.id);
    if (msg.role === 'user') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "chat__bubble chat__bubble--user" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "chat__bubble-text" },
        });
        (msg.text);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "chat__bubble chat__bubble--ai" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "chat__avatar" },
            ...{ class: ({ 'chat__avatar--speaking': __VLS_ctx.isSpeaking && __VLS_ctx.streamingMsgId === msg.id }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            'aria-hidden': "true",
        });
        (__VLS_ctx.currentPersona.avatar);
        if (__VLS_ctx.isSpeaking && __VLS_ctx.streamingMsgId === msg.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                ...{ class: "pg-speaking-dot chat__speaking-badge" },
                'aria-hidden': "true",
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "chat__bubble-inner" },
        });
        if (__VLS_ctx.highlightSplit && __VLS_ctx.highlightSplit.msgId === msg.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "chat__bubble-text" },
            });
            (__VLS_ctx.highlightSplit.before);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "chat__bubble-text chat__bubble-text--hl" },
            });
            (__VLS_ctx.highlightSplit.hl);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "chat__bubble-text" },
            });
            (__VLS_ctx.highlightSplit.after);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "chat__bubble-text" },
                ...{ class: ({ 'chat__bubble-text--error': msg.error }) },
            });
            (msg.text);
            if (!msg.text && __VLS_ctx.streamingMsgId === msg.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "chat__cursor" },
                    'aria-hidden': "true",
                });
            }
        }
        if (__VLS_ctx.isSpeaking && __VLS_ctx.streamingMsgId === msg.id) {
            /** @type {[typeof WaveformCanvas, ]} */ ;
            // @ts-ignore
            const __VLS_0 = __VLS_asFunctionalComponent(WaveformCanvas, new WaveformCanvas({
                data: (__VLS_ctx.waveformData),
                color: "#06b6d4",
                height: (24),
                barCount: (20),
                ...{ style: {} },
            }));
            const __VLS_1 = __VLS_0({
                data: (__VLS_ctx.waveformData),
                color: "#06b6d4",
                height: (24),
                barCount: (20),
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_0));
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat__input-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    ...{ onKeydown: (__VLS_ctx.onKeydown) },
    value: (__VLS_ctx.inputText),
    ...{ class: "chat__input" },
    placeholder: "Type a message… (Enter to send, Shift+Enter for newline)",
    rows: "1",
    disabled: (__VLS_ctx.isBusy),
    'aria-label': "Chat message input",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.send) },
    ...{ class: "chat__send-btn" },
    disabled: (__VLS_ctx.isBusy || !__VLS_ctx.inputText.trim() || (__VLS_ctx.useRealAI && !__VLS_ctx.openaiKey.trim())),
    'aria-disabled': (__VLS_ctx.isBusy || !__VLS_ctx.inputText.trim()),
    'aria-label': "Send message",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.details, __VLS_intrinsicElements.details)({
    ...{ class: "chat__code-details" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.summary, __VLS_intrinsicElements.summary)({
    ...{ class: "chat__code-summary" },
});
/** @type {[typeof CodeBlock, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(CodeBlock, new CodeBlock({
    code: (__VLS_ctx.CODE),
    language: "typescript",
}));
const __VLS_4 = __VLS_3({
    code: (__VLS_ctx.CODE),
    language: "typescript",
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
/** @type {__VLS_StyleScopedClasses['chat']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__layout']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__personas']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__persona-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__divider']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__toggle-label']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__security-warn']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__key-row']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__key-input']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__key-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__key-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__main']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__thread']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__empty']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble--user']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble--ai']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-speaking-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__speaking-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble-text--hl']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__bubble-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__cursor']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__input-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__input']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__send-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__code-details']} */ ;
/** @type {__VLS_StyleScopedClasses['chat__code-summary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            WaveformCanvas: WaveformCanvas,
            CodeBlock: CodeBlock,
            messages: messages,
            inputText: inputText,
            threadEl: threadEl,
            PERSONAS: PERSONAS,
            personaIdx: personaIdx,
            currentPersona: currentPersona,
            isSpeaking: isSpeaking,
            waveformData: waveformData,
            useRealAI: useRealAI,
            openaiKey: openaiKey,
            showKey: showKey,
            streamingMsgId: streamingMsgId,
            highlightSplit: highlightSplit,
            isBusy: isBusy,
            send: send,
            onKeydown: onKeydown,
            switchPersona: switchPersona,
            CODE: CODE,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
