/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { useVoiceQueue } from 'vue-text-to-speech';
import WaveformCanvas from '../components/WaveformCanvas.vue';
import { useFakeWaveform } from '../composables/useFakeWaveform';
import { useToast } from '../composables/useToast';
import { useTabEntrance } from '../composables/useTabEntrance';
const { queue, currentItem, isPlaying, enqueue, clear, skip, } = useVoiceQueue();
const inputText = ref('');
const errorMsg = ref('');
// ── Fake waveform (isPlaying = something is being spoken) ─────────────────
const isSpeakingQueue = computed(() => isPlaying.value ?? false);
const { waveformData } = useFakeWaveform(isSpeakingQueue);
const { success: toastSuccess } = useToast();
useTabEntrance();
// ── Chips ──────────────────────────────────────────────────────────────────────
const CHIPS = [
    'Hello, how are you?',
    'How can I help you today?',
    'Processing your request…',
    'Your order has been confirmed.',
    'Thank you and have a great day!',
];
function fillChip(text) { inputText.value = text; }
// ── Enqueue ────────────────────────────────────────────────────────────────────
function addToQueue() {
    const text = inputText.value.trim();
    if (!text) {
        errorMsg.value = 'Please enter some text first.';
        return;
    }
    errorMsg.value = '';
    enqueue(text);
    inputText.value = '';
    toastSuccess('Added to queue');
}
function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addToQueue();
    }
}
// ── Play All ───────────────────────────────────────────────────────────────────
// The queue auto-plays — just enqueue; if already playing, enqueue adds to end
function playAll() {
    // If queue is empty nothing to do; items auto-advance via useVoiceQueue
    // Calling enqueue with the first item starts playback if idle
    // Since queue auto-starts, we just need to ensure it's not paused/stopped
    // Re-enqueue all items in order by rebuilding (dequeue all + re-enqueue)
    if (!isPlaying.value && (queue.value?.length ?? 0) > 0) {
        // Snapshot current queue
        const items = [...(queue.value ?? [])];
        clear();
        items.forEach(item => enqueue(String(item)));
    }
}
// ── Remove item by index ───────────────────────────────────────────────────────
function removeItem(index) {
    const arr = [...(queue.value ?? [])];
    arr.splice(index, 1);
    const wasCurrent = currentItem.value;
    clear();
    arr.forEach(t => enqueue(String(t)));
    // If something was being spoken before the rebuild, skip to advance to new first item
    if (wasCurrent && arr.length > 0 && !isPlaying.value) {
        // queue auto-starts on first enqueue; no extra action needed
    }
}
const queueItems = computed(() => queue.value ?? []);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['vq__chip']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__enqueue-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__remove']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "vq" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "vq__add pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-label" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "vq__chips" },
    'aria-label': "Quick fill options",
});
for (const [chip] of __VLS_getVForSourceType((__VLS_ctx.CHIPS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.fillChip(chip);
            } },
        key: (chip),
        ...{ class: "vq__chip" },
        'aria-label': (`Fill: ${chip}`),
    });
    (chip.slice(0, 32));
    (chip.length > 32 ? '…' : '');
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "vq__input-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    ...{ onKeydown: (__VLS_ctx.onKeydown) },
    value: (__VLS_ctx.inputText),
    ...{ class: "vq__textarea" },
    rows: "2",
    placeholder: "Type text to enqueue…",
    'aria-label': "Text to enqueue",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.addToQueue) },
    ...{ class: "vq__enqueue-btn" },
    disabled: (!__VLS_ctx.inputText.trim()),
    'aria-disabled': (!__VLS_ctx.inputText.trim()),
    'aria-label': "Enqueue text",
});
if (__VLS_ctx.errorMsg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "vq__error" },
        role: "alert",
    });
    (__VLS_ctx.errorMsg);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "vq__transport" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.playAll();
        } },
    ...{ class: "vq__btn vq__btn--primary" },
    disabled: (__VLS_ctx.queueItems.length === 0),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.skip();
        } },
    ...{ class: "vq__btn" },
    disabled: (!__VLS_ctx.isPlaying),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.clear();
        } },
    ...{ class: "vq__btn vq__btn--danger" },
    disabled: (__VLS_ctx.queueItems.length === 0 && !__VLS_ctx.isPlaying),
});
if (__VLS_ctx.isPlaying) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pg-badge-speaking" },
        role: "status",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "vq__queue pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-label" },
    ...{ style: {} },
});
if (__VLS_ctx.queueItems.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "vq__count" },
    });
    (__VLS_ctx.queueItems.length);
}
if (__VLS_ctx.currentItem && __VLS_ctx.isPlaying) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "vq__current" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pg-badge-speaking" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "vq__current-text" },
        title: (String(__VLS_ctx.currentItem)),
    });
    (String(__VLS_ctx.currentItem).slice(0, 60));
    (String(__VLS_ctx.currentItem).length > 60 ? '…' : '');
    /** @type {[typeof WaveformCanvas, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(WaveformCanvas, new WaveformCanvas({
        data: (__VLS_ctx.waveformData),
        color: "#06b6d4",
        height: (20),
        barCount: (16),
        ...{ style: {} },
    }));
    const __VLS_1 = __VLS_0({
        data: (__VLS_ctx.waveformData),
        color: "#06b6d4",
        height: (20),
        barCount: (16),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
if (__VLS_ctx.queueItems.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "vq__empty pg-text-muted" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "vq__list" },
    role: "list",
    'aria-live': "polite",
    'aria-label': "Voice queue",
});
for (const [item, i] of __VLS_getVForSourceType((__VLS_ctx.queueItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (i),
        ...{ class: "vq__item" },
        role: "listitem",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "vq__pos" },
        'aria-label': "Position",
    });
    (i + 1);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "vq__text" },
        title: (String(item)),
        'aria-label': (String(item)),
    });
    (String(item).slice(0, 60));
    (String(item).length > 60 ? '…' : '');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "vq__status-badge pg-badge-queued" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeItem(i);
            } },
        ...{ class: "vq__remove" },
        'aria-label': (`Remove item ${i + 1}: ${String(item).slice(0, 30)}`),
    });
}
/** @type {__VLS_StyleScopedClasses['vq']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__add']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__chips']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__chip']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__input-row']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__enqueue-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__error']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__transport']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-badge-speaking']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__queue']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__count']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__current']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-badge-speaking']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__current-text']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__empty']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__list']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__item']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__pos']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__text']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-badge-queued']} */ ;
/** @type {__VLS_StyleScopedClasses['vq__remove']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            WaveformCanvas: WaveformCanvas,
            currentItem: currentItem,
            isPlaying: isPlaying,
            clear: clear,
            skip: skip,
            inputText: inputText,
            errorMsg: errorMsg,
            waveformData: waveformData,
            CHIPS: CHIPS,
            fillChip: fillChip,
            addToQueue: addToQueue,
            onKeydown: onKeydown,
            playAll: playAll,
            removeItem: removeItem,
            queueItems: queueItems,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
