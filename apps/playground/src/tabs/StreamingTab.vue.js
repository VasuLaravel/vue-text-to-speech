/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onUnmounted } from 'vue';
import { useStreamingTTS } from 'vue-text-to-speech';
import WaveformCanvas from '../components/WaveformCanvas.vue';
import { useFakeWaveform } from '../composables/useFakeWaveform';
import { useTabEntrance } from '../composables/useTabEntrance';
// ── State ──────────────────────────────────────────────────────────────────────
const tokenSpeed = ref(30); // tokens per second
const feedText = ref(`Once upon a time, there was a developer who wanted to add voice to their app.
They discovered a streaming TTS library and decided to give it a try.
The library supported sentence boundary detection, so speech started immediately.
Each sentence was queued and played in order, creating a natural listening experience.
The developer was impressed and shipped voice features to their users.`);
const tokenDisplay = ref([]);
const isRunning = ref(false);
let abortController = null;
// ── Streaming TTS ──────────────────────────────────────────────────────────────
const { pipeStream, queue, currentItem, isStreaming, stop: stopTTS } = useStreamingTTS();
const isSpeakingStream = computed(() => isStreaming.value ?? false);
const { waveformData } = useFakeWaveform(isSpeakingStream);
useTabEntrance();
const currentSentence = computed(() => currentItem.value ?? '');
const queueWarning = computed(() => (queue.value?.length ?? 0) > 10);
// ── Token generator ────────────────────────────────────────────────────────────
async function* tokenize(text, signal) {
    // Split into ~4-8 char chunks simulating LLM token output
    const CHUNK = 5;
    let i = 0;
    while (i < text.length) {
        if (signal.aborted)
            return;
        const end = Math.min(i + CHUNK, text.length);
        yield text.slice(i, end);
        i = end;
        await new Promise(resolve => setTimeout(resolve, Math.round(1000 / tokenSpeed.value)));
    }
}
// Build display token list
function pushTokenDisplay(chunk) {
    // Check if it's a sentence boundary character
    const isBoundary = /[.!?]/.test(chunk);
    tokenDisplay.value.push({ text: chunk, state: isBoundary ? 'boundary' : 'buffered' });
    // Keep reasonable length
    if (tokenDisplay.value.length > 200)
        tokenDisplay.value.splice(0, 50);
}
// Update token state based on current sentence being spoken
function updateTokenStates() {
    if (!currentSentence.value)
        return;
    let acc = '';
    for (const tok of tokenDisplay.value) {
        acc += tok.text;
        if (currentSentence.value && acc.includes(currentSentence.value.slice(0, 10))) {
            tok.state = 'speaking';
        }
    }
}
// ── Start / Stop ───────────────────────────────────────────────────────────────
async function start() {
    if (isRunning.value)
        return;
    isRunning.value = true;
    tokenDisplay.value = [];
    abortController = new AbortController();
    const signal = abortController.signal;
    async function* wrappedStream() {
        for await (const chunk of tokenize(feedText.value, signal)) {
            if (signal.aborted)
                return;
            pushTokenDisplay(chunk);
            updateTokenStates();
            yield chunk;
        }
        // Mark remaining as spoken after done
        for (const tok of tokenDisplay.value) {
            if (tok.state === 'buffered')
                tok.state = 'spoken';
        }
    }
    try {
        await pipeStream(wrappedStream());
    }
    finally {
        isRunning.value = false;
        abortController = null;
        // Mark all as spoken
        for (const tok of tokenDisplay.value) {
            if (tok.state === 'buffered' || tok.state === 'speaking')
                tok.state = 'spoken';
        }
    }
}
function stop() {
    abortController?.abort();
    stopTTS();
    isRunning.value = false;
}
function restart() { stop(); setTimeout(start, 150); }
// ── Flush unpunctuated buffer (E-T5.4) — not in current API, no-op ─────────────
function flushBuffer() { }
// ── Cleanup ────────────────────────────────────────────────────────────────────
onUnmounted(() => stop());
// ── Token color map ────────────────────────────────────────────────────────────
const stateColor = {
    pending: 'var(--pg-text-muted)',
    buffered: 'var(--pg-primary)',
    speaking: 'var(--pg-cyan)',
    spoken: 'var(--pg-text-muted)',
    boundary: 'var(--pg-cyan)',
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stream__layout']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__flush-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream__layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream__panel pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-label" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream__controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.start) },
    ...{ class: "stream__btn stream__btn--primary" },
    disabled: (__VLS_ctx.isRunning),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.stop) },
    ...{ class: "stream__btn stream__btn--danger" },
    disabled: (!__VLS_ctx.isRunning),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.restart) },
    ...{ class: "stream__btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "stream__speed-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "pg-text-muted" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "range",
    min: "10",
    max: "100",
    step: "5",
    ...{ class: "stream__range" },
    'aria-label': (`Token speed: ${__VLS_ctx.tokenSpeed} t/s`),
});
(__VLS_ctx.tokenSpeed);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: {} },
});
(__VLS_ctx.tokenSpeed);
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.feedText),
    ...{ class: "stream__textarea" },
    rows: "6",
    disabled: (__VLS_ctx.isRunning),
    placeholder: "Enter multi-sentence text to stream…",
    'aria-label': "Text to stream",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream__tokens" },
    'aria-label': "Token stream display",
    'aria-live': "polite",
});
for (const [tok, i] of __VLS_getVForSourceType((__VLS_ctx.tokenDisplay))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        key: (i),
        ...{ class: "stream__token" },
        ...{ style: ({ color: __VLS_ctx.stateColor[tok.state], fontWeight: tok.state === 'speaking' ? '700' : '400' }) },
    });
    (tok.text);
}
if (__VLS_ctx.tokenDisplay.length === 0 && !__VLS_ctx.isRunning) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pg-text-muted" },
        ...{ style: {} },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream__panel pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream__queue-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "pg-label" },
});
if (__VLS_ctx.queueWarning) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stream__queue-warn" },
        role: "alert",
    });
    (__VLS_ctx.queue?.length ?? 0);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.flushBuffer) },
    ...{ class: "stream__flush-btn" },
    disabled: (!__VLS_ctx.isRunning),
    title: "Flush unpunctuated buffer",
});
if (__VLS_ctx.currentSentence) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stream__current" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pg-badge-speaking" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "stream__current-text" },
    });
    (__VLS_ctx.currentSentence);
    /** @type {[typeof WaveformCanvas, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(WaveformCanvas, new WaveformCanvas({
        data: (__VLS_ctx.waveformData),
        color: "#06b6d4",
        height: (32),
        barCount: (30),
    }));
    const __VLS_1 = __VLS_0({
        data: (__VLS_ctx.waveformData),
        color: "#06b6d4",
        height: (32),
        barCount: (30),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stream__current stream__current--idle" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream__queue-list" },
    role: "list",
    'aria-label': "Queued sentences",
});
if ((__VLS_ctx.queue?.length ?? 0) === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stream__queue-empty pg-text-muted" },
    });
}
for (const [item, i] of __VLS_getVForSourceType(((__VLS_ctx.queue ?? [])))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (i),
        ...{ class: "stream__queue-item" },
        ...{ class: ({ 'stream__queue-item--current': item === __VLS_ctx.currentSentence }) },
        role: "listitem",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stream__queue-pos" },
    });
    (i + 1);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stream__queue-text" },
    });
    (String(item).slice(0, 60));
    (String(item).length > 60 ? '…' : '');
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stream__legend" },
});
for (const [[label, color]] of __VLS_getVForSourceType(([
    ['Speaking', 'var(--pg-cyan)'],
    ['Buffered', 'var(--pg-primary)'],
    ['Boundary', 'var(--pg-cyan)'],
    ['Spoken', 'var(--pg-text-muted)'],
]))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        key: (label),
        ...{ class: "stream__legend-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
        ...{ class: "stream__legend-dot" },
        ...{ style: ({ background: color }) },
        'aria-hidden': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pg-text-muted" },
        ...{ style: {} },
    });
    (label);
}
/** @type {__VLS_StyleScopedClasses['stream']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__layout']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__controls']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__speed-label']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__range']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__tokens']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__token']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__queue-header']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__queue-warn']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__flush-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__current']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-badge-speaking']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__current-text']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__current']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__current--idle']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__queue-list']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__queue-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__queue-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__queue-pos']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__queue-text']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__legend']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stream__legend-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            WaveformCanvas: WaveformCanvas,
            tokenSpeed: tokenSpeed,
            feedText: feedText,
            tokenDisplay: tokenDisplay,
            isRunning: isRunning,
            queue: queue,
            waveformData: waveformData,
            currentSentence: currentSentence,
            queueWarning: queueWarning,
            start: start,
            stop: stop,
            restart: restart,
            flushBuffer: flushBuffer,
            stateColor: stateColor,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
