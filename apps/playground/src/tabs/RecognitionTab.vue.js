/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, watch, onUnmounted } from 'vue';
import { useSpeechRecognition } from 'vue-text-to-speech';
import WaveformCanvas from '../components/WaveformCanvas.vue';
import { useAudioVisualizer } from '../composables/useAudioVisualizer';
const LANGUAGES = [
    { label: 'English (US)', value: 'en-US' },
    { label: 'English (GB)', value: 'en-GB' },
    { label: 'Spanish (ES)', value: 'es-ES' },
    { label: 'French (FR)', value: 'fr-FR' },
    { label: 'German (DE)', value: 'de-DE' },
    { label: 'Portuguese (BR)', value: 'pt-BR' },
    { label: 'Japanese (JP)', value: 'ja-JP' },
    { label: 'Chinese (ZH)', value: 'zh-CN' },
];
const selectedLang = ref('en-US');
const continuous = ref(false);
const permissionDenied = ref(false);
const micBtnShaking = ref(false);
const micBtnDebounce = ref(false);
// ── Web Audio visualizer on MediaStream ──────────────────────────────────────
const { analyzerData, isActive: vizActive, start: startViz, stop: stopViz } = useAudioVisualizer();
// ── Speech recognition (actual API: isListening, transcript, finalTranscript, confidence) ────
// We create one instance per lang/continuous combo; re-create on change via watch
let recInstance = useSpeechRecognition({ lang: selectedLang.value, continuous: continuous.value });
const isListening = ref(recInstance.isListening.value);
const isSupported = ref(recInstance.isSupported.value);
const transcriptDisplay = ref('');
const interimDisplay = ref('');
const lastConfidence = ref(null);
// Sync reactive refs from the underlying composable
function syncFromInstance() {
    isListening.value = recInstance.isListening.value;
    isSupported.value = recInstance.isSupported.value;
}
// Watch the composable's transcript for final results
watch(() => recInstance.finalTranscript.value, (val) => {
    if (val) {
        transcriptDisplay.value += (transcriptDisplay.value ? ' ' : '') + val;
        lastConfidence.value = recInstance.confidence.value ?? null;
    }
});
watch(() => recInstance.transcript.value, (val) => {
    interimDisplay.value = val ?? '';
});
watch(() => recInstance.isListening.value, (val) => {
    isListening.value = val;
});
// ── Re-create composable when lang/continuous changes ─────────────────────────
// (useSpeechRecognition takes static options; we swap out the instance)
watch([selectedLang, continuous], () => {
    if (isListening.value)
        recInstance.stop();
    recInstance = useSpeechRecognition({ lang: selectedLang.value, continuous: continuous.value });
    syncFromInstance();
});
// ── Mic button ───────────────────────────────────────────────────────────────
async function toggleMic() {
    if (micBtnDebounce.value)
        return;
    micBtnDebounce.value = true;
    setTimeout(() => { micBtnDebounce.value = false; }, 300);
    if (isListening.value) {
        recInstance.stop();
        stopViz();
        return;
    }
    permissionDenied.value = false;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        startViz(stream);
        recInstance.start();
        isListening.value = true;
    }
    catch (err) {
        const e = err;
        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
            permissionDenied.value = true;
        }
        else {
            shakeMicBtn();
        }
    }
}
function shakeMicBtn() {
    micBtnShaking.value = true;
    setTimeout(() => { micBtnShaking.value = false; }, 600);
}
// ── Confidence badge color ────────────────────────────────────────────────────
function confidenceColor(c) {
    if (c >= 0.8)
        return 'var(--pg-emerald, #10b981)';
    if (c >= 0.5)
        return 'var(--pg-amber,  #f59e0b)';
    return 'var(--pg-rose)';
}
// ── Cleanup ───────────────────────────────────────────────────────────────────
onUnmounted(() => { if (isListening.value)
    recInstance.stop(); stopViz(); });
function clearTranscript() {
    transcriptDisplay.value = '';
    interimDisplay.value = '';
    lastConfidence.value = null;
    recInstance.resetTranscript();
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['rec__select']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__ring']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__ring']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__ring']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__mic-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rec" },
});
if (!__VLS_ctx.isSupported) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rec__banner rec__banner--warn" },
        role: "alert",
    });
}
if (__VLS_ctx.permissionDenied) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rec__banner rec__banner--error" },
        role: "alert",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rec__settings pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rec__setting" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "rec-lang",
    ...{ class: "pg-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "rec-lang",
    value: (__VLS_ctx.selectedLang),
    ...{ class: "rec__select" },
    disabled: (__VLS_ctx.isListening),
    'aria-label': "Recognition language",
});
for (const [l] of __VLS_getVForSourceType((__VLS_ctx.LANGUAGES))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (l.value),
        value: (l.value),
    });
    (l.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "rec__toggle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "checkbox",
    role: "switch",
    disabled: (__VLS_ctx.isListening),
    'aria-label': "Continuous mode",
});
(__VLS_ctx.continuous);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.clearTranscript) },
    ...{ class: "rec__clear-btn" },
    disabled: (!__VLS_ctx.transcriptDisplay && !__VLS_ctx.interimDisplay),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rec__stage pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rec__ring-wrap" },
    ...{ style: (__VLS_ctx.vizActive && __VLS_ctx.isListening ? {
            '--ring-pct': `${Math.round((__VLS_ctx.analyzerData[0] ?? 0) / 255 * 100)}%`
        } : {}) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "rec__ring" },
    ...{ class: ({ 'rec__ring--active': __VLS_ctx.isListening }) },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleMic) },
    ...{ class: "rec__mic-btn" },
    ...{ class: ({ 'rec__mic-btn--recording': __VLS_ctx.isListening, 'rec__mic-btn--shake': __VLS_ctx.micBtnShaking }) },
    disabled: (!__VLS_ctx.isSupported),
    'aria-label': (__VLS_ctx.isListening ? 'Stop recording' : 'Start recording'),
    'aria-pressed': (__VLS_ctx.isListening),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "rec__mic-icon" },
    'aria-hidden': "true",
});
(__VLS_ctx.isListening ? '⏹' : '🎤');
/** @type {[typeof WaveformCanvas, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(WaveformCanvas, new WaveformCanvas({
    data: (__VLS_ctx.vizActive ? __VLS_ctx.analyzerData : undefined),
    color: (__VLS_ctx.isListening ? '#06b6d4' : '#6366f1'),
    height: (48),
    barCount: (40),
    ...{ style: {} },
}));
const __VLS_1 = __VLS_0({
    data: (__VLS_ctx.vizActive ? __VLS_ctx.analyzerData : undefined),
    color: (__VLS_ctx.isListening ? '#06b6d4' : '#6366f1'),
    height: (48),
    barCount: (40),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "rec__status" },
    role: "status",
    'aria-live': "polite",
});
if (__VLS_ctx.isListening) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pg-badge-speaking" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rec__transcript pg-card" },
    role: "region",
    'aria-label': "Transcript",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rec__transcript-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "pg-label" },
});
if (__VLS_ctx.lastConfidence !== null) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rec__confidence-badge" },
        ...{ style: ({ background: __VLS_ctx.confidenceColor(__VLS_ctx.lastConfidence) + '22', border: '1px solid ' + __VLS_ctx.confidenceColor(__VLS_ctx.lastConfidence), color: __VLS_ctx.confidenceColor(__VLS_ctx.lastConfidence) }) },
    });
    (Math.round(__VLS_ctx.lastConfidence * 100));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rec__transcript-body" },
    'aria-live': "polite",
});
if (__VLS_ctx.transcriptDisplay) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.transcriptDisplay);
}
if (__VLS_ctx.interimDisplay) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rec__interim" },
        'aria-label': "Interim transcript",
    });
    (__VLS_ctx.interimDisplay);
}
if (!__VLS_ctx.transcriptDisplay && !__VLS_ctx.interimDisplay) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pg-text-muted" },
    });
}
/** @type {__VLS_StyleScopedClasses['rec']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__banner']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__banner--warn']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__banner']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__banner--error']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__settings']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__setting']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__select']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__stage']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__ring-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__ring']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__mic-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__mic-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__status']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-badge-speaking']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__transcript']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__transcript-header']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__confidence-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__transcript-body']} */ ;
/** @type {__VLS_StyleScopedClasses['rec__interim']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            WaveformCanvas: WaveformCanvas,
            LANGUAGES: LANGUAGES,
            selectedLang: selectedLang,
            continuous: continuous,
            permissionDenied: permissionDenied,
            micBtnShaking: micBtnShaking,
            analyzerData: analyzerData,
            vizActive: vizActive,
            isListening: isListening,
            isSupported: isSupported,
            transcriptDisplay: transcriptDisplay,
            interimDisplay: interimDisplay,
            lastConfidence: lastConfidence,
            toggleMic: toggleMic,
            confidenceColor: confidenceColor,
            clearTranscript: clearTranscript,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
