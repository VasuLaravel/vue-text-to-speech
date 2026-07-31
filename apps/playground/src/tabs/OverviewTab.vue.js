/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onUnmounted } from 'vue';
import { useSpeechSynthesis } from 'vue-text-to-speech';
import WaveformCanvas from '../components/WaveformCanvas.vue';
import { useFakeWaveform } from '../composables/useFakeWaveform';
import { useTabEntrance } from '../composables/useTabEntrance';
const emit = defineEmits();
// ── TTS ───────────────────────────────────────────────────────────────────────
const { isSpeaking, speak, stop, isSupported } = useSpeechSynthesis();
const ttsText = ref('Welcome to Vue Text to Speech! Click play to hear me speak.');
const { waveformData } = useFakeWaveform(isSpeaking);
useTabEntrance();
function onPlayStop() {
    if (isSpeaking.value) {
        stop();
        return;
    }
    if (!ttsText.value.trim())
        return; // E-T1.2
    speak(ttsText.value);
}
onUnmounted(() => { if (isSpeaking.value)
    stop(); });
// ── Feature grid ──────────────────────────────────────────────────────────────
const features = [
    { icon: '⚡', title: '4 Composables', desc: 'useSpeechSynthesis · useSpeechRecognition · useStreamingTTS · useVoiceQueue', tab: 'synthesis' },
    { icon: '🧩', title: '3 Components', desc: 'VueSpeechPlayer · VueSpeechRecorder · VueSpeechVoiceSelect', tab: 'components' },
    { icon: '☁', title: '4+ Providers', desc: 'Web Speech · OpenAI · ElevenLabs · Azure Cognitive', tab: 'setup' },
    { icon: '🌊', title: 'LLM Streaming', desc: 'Token-by-token TTS with sentence detection and voice queue', tab: 'streaming' },
];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['overview__textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__play-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__feature-card']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__cta']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__cta-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "overview" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "overview__hero pg-card" },
});
/** @type {[typeof WaveformCanvas, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(WaveformCanvas, new WaveformCanvas({
    data: (__VLS_ctx.waveformData),
    color: "#6366f1",
    height: (80),
    barCount: (60),
}));
const __VLS_1 = __VLS_0({
    data: (__VLS_ctx.waveformData),
    color: "#6366f1",
    height: (80),
    barCount: (60),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "overview__hero-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "overview__title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "overview__subtitle" },
});
if (!__VLS_ctx.isSupported) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overview__warn-banner" },
        role: "alert",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.isSupported))
                    return;
                __VLS_ctx.emit('navigate-to-tab', 'setup');
            } },
        ...{ class: "overview__link-btn" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "overview__demo pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-label" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "overview__demo-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.ttsText),
    ...{ class: "overview__textarea" },
    rows: "2",
    placeholder: "Type something to speak…",
    disabled: (__VLS_ctx.isSpeaking),
    'aria-label': "Text to speak",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.onPlayStop) },
    ...{ class: "overview__play-btn" },
    ...{ class: ({ 'overview__play-btn--stop': __VLS_ctx.isSpeaking }) },
    disabled: (!__VLS_ctx.isSpeaking && !__VLS_ctx.ttsText.trim()),
    'aria-disabled': (!__VLS_ctx.isSpeaking && !__VLS_ctx.ttsText.trim()),
    'aria-label': (__VLS_ctx.isSpeaking ? 'Stop speaking' : 'Play text'),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    'aria-hidden': "true",
});
(__VLS_ctx.isSpeaking ? '⏹' : '▶');
(__VLS_ctx.isSpeaking ? 'Stop' : 'Play');
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "overview__grid" },
});
for (const [f] of __VLS_getVForSourceType((__VLS_ctx.features))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('navigate-to-tab', f.tab);
            } },
        key: (f.tab),
        ...{ class: "overview__feature-card pg-card" },
        'aria-label': (`Go to ${f.title}`),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "overview__feature-icon" },
        'aria-hidden': "true",
    });
    (f.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
        ...{ class: "overview__feature-title" },
    });
    (f.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "overview__feature-desc" },
    });
    (f.desc);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "overview__cta pg-card" },
    role: "complementary",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "overview__cta-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "overview__cta-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('navigate-to-tab', 'chat');
        } },
    ...{ class: "overview__cta-btn" },
    'aria-label': "Open AI Chat Agent tab",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "overview__chips" },
    role: "list",
    'aria-label': "Library status",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "overview__chip" },
    role: "listitem",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "overview__chip" },
    role: "listitem",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "overview__chip" },
    role: "listitem",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "overview__chip" },
    role: "listitem",
});
/** @type {__VLS_StyleScopedClasses['overview']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__hero']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__hero-text']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__title']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__warn-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__link-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__demo']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__demo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__play-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__grid']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__feature-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__feature-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__feature-title']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__feature-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__cta']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__cta-content']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__cta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__cta-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__chips']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__chip']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__chip']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__chip']} */ ;
/** @type {__VLS_StyleScopedClasses['overview__chip']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            WaveformCanvas: WaveformCanvas,
            emit: emit,
            isSpeaking: isSpeaking,
            isSupported: isSupported,
            ttsText: ttsText,
            waveformData: waveformData,
            onPlayStop: onPlayStop,
            features: features,
        };
    },
    __typeEmits: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
});
; /* PartiallyEnd: #4569/main.vue */
