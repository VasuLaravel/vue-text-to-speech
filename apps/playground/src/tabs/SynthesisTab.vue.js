/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSpeechSynthesis } from 'vue-text-to-speech';
import WaveformCanvas from '../components/WaveformCanvas.vue';
import { useFakeWaveform } from '../composables/useFakeWaveform';
import { useTabEntrance } from '../composables/useTabEntrance';
const { isSpeaking, isPaused, voices, isLoadingVoices, selectedVoice, rate, pitch, volume, error: ttsError, speak, stop, pause, resume, isSupported, } = useSpeechSynthesis();
const ttsText = ref('The quick brown fox jumps over the lazy dog. Text-to-speech synthesis converts written text into spoken words using configurable voice, rate, pitch, and volume settings.');
const errorDismissed = ref(false);
const textareaEl = ref(null);
// ── Fake waveform (Web Speech cannot be captured — E-T3.1) ────────────────────
const { waveformData } = useFakeWaveform(isSpeaking);
useTabEntrance();
// ── Voice options grouped by language ─────────────────────────────────────────
const voiceGroups = computed(() => {
    const groups = {};
    for (const v of voices.value) {
        const lang = v.lang.split('-')[0].toUpperCase();
        if (!groups[lang])
            groups[lang] = [];
        groups[lang].push(v);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
});
// ── Character count ────────────────────────────────────────────────────────────
const charCount = computed(() => ttsText.value.length);
// ── Keyboard shortcuts ─────────────────────────────────────────────────────────
function handleKey(e) {
    // Only when textarea NOT focused (E-T3.6)
    if (document.activeElement === textareaEl.value)
        return;
    if (e.key === ' ') {
        e.preventDefault();
        if (!ttsText.value.trim())
            return;
        if (isSpeaking.value && !isPaused.value) {
            pause();
            return;
        }
        if (isPaused.value) {
            resume();
            return;
        }
        speak(ttsText.value);
    }
    if (e.key === 'Escape') {
        e.preventDefault();
        stop();
    }
}
onMounted(() => document.addEventListener('keydown', handleKey));
onUnmounted(() => { document.removeEventListener('keydown', handleKey); if (isSpeaking.value)
    stop(); });
// ── Slider defaults ────────────────────────────────────────────────────────────
const DEFAULT = { rate: 1, pitch: 1, volume: 1 };
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['synth__controls']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__select']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__slider-label']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__reset-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn--danger']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__waveform pg-card" },
});
/** @type {[typeof WaveformCanvas, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(WaveformCanvas, new WaveformCanvas({
    data: (__VLS_ctx.waveformData),
    color: "#6366f1",
    height: (72),
    barCount: (50),
}));
const __VLS_1 = __VLS_0({
    data: (__VLS_ctx.waveformData),
    color: "#6366f1",
    height: (72),
    barCount: (50),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
if (!__VLS_ctx.isSupported) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "synth__no-support" },
        role: "alert",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pg-text-muted" },
        ...{ style: {} },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__waveform-note pg-text-muted" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__controls pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-label" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__voice-row" },
    'aria-busy': (__VLS_ctx.isLoadingVoices),
});
if (__VLS_ctx.isLoadingVoices) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "synth__skeleton" },
        'aria-label': "Loading voices…",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.selectedVoice),
        ...{ class: "synth__select" },
        'aria-label': "Select voice",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (null),
    });
    for (const [[lang, group]] of __VLS_getVForSourceType((__VLS_ctx.voiceGroups))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.optgroup, __VLS_intrinsicElements.optgroup)({
            key: (lang),
            label: (lang),
        });
        for (const [v] of __VLS_getVForSourceType((group))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (v.label),
                value: (v),
            });
            (v.label);
            (v.default ? ' ✓' : '');
            (v.lang);
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__sliders" },
});
for (const [{ key, label, min, max, step, def }] of __VLS_getVForSourceType(([
    { key: 'rate', label: 'Rate', min: 0.1, max: 2.0, step: 0.1, def: __VLS_ctx.DEFAULT.rate },
    { key: 'pitch', label: 'Pitch', min: 0, max: 2.0, step: 0.1, def: __VLS_ctx.DEFAULT.pitch },
    { key: 'volume', label: 'Volume', min: 0, max: 1.0, step: 0.05, def: __VLS_ctx.DEFAULT.volume },
]))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (key),
        ...{ class: "synth__slider-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "synth__slider-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "synth__slider-val" },
    });
    (key === 'rate' ? __VLS_ctx.rate.toFixed(1) : key === 'pitch' ? __VLS_ctx.pitch.toFixed(1) : __VLS_ctx.volume.toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                key === 'rate' ? (__VLS_ctx.rate = def) : key === 'pitch' ? (__VLS_ctx.pitch = def) : (__VLS_ctx.volume = def);
            } },
        ...{ class: "synth__reset-btn" },
        'aria-label': (`Reset ${label} to default`),
        title: (`Reset to ${def}`),
    });
    if (key === 'rate') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "range",
            min: (min),
            max: (max),
            step: (step),
            ...{ class: "synth__range" },
            'aria-label': (`${label}: ${__VLS_ctx.rate.toFixed(1)}`),
            title: (`Takes effect on next play`),
        });
        (__VLS_ctx.rate);
    }
    else if (key === 'pitch') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "range",
            min: (min),
            max: (max),
            step: (step),
            ...{ class: "synth__range" },
            'aria-label': (`${label}: ${__VLS_ctx.pitch.toFixed(1)}`),
            title: (`Takes effect on next play`),
        });
        (__VLS_ctx.pitch);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "range",
            min: (min),
            max: (max),
            step: (step),
            ...{ class: "synth__range" },
            'aria-label': (`${label}: ${__VLS_ctx.volume.toFixed(2)}`),
        });
        (__VLS_ctx.volume);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__compose pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__textarea-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    ref: "textareaEl",
    value: (__VLS_ctx.ttsText),
    ...{ class: "synth__textarea" },
    rows: "5",
    placeholder: "Enter text to speak…",
    disabled: (__VLS_ctx.isSpeaking && !__VLS_ctx.isPaused),
    'aria-label': "Text to speak",
});
/** @type {typeof __VLS_ctx.textareaEl} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "synth__charcount pg-text-muted" },
});
(__VLS_ctx.charCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "synth__transport" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.speak(__VLS_ctx.ttsText);
        } },
    ...{ class: "synth__btn synth__btn--primary" },
    disabled: (__VLS_ctx.isSpeaking && !__VLS_ctx.isPaused || !__VLS_ctx.ttsText.trim()),
    'aria-disabled': (!__VLS_ctx.ttsText.trim()),
    'aria-label': "Play (Space)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.pause();
        } },
    ...{ class: "synth__btn" },
    disabled: (!__VLS_ctx.isSpeaking || __VLS_ctx.isPaused),
    'aria-label': "Pause (Space)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.resume();
        } },
    ...{ class: "synth__btn" },
    disabled: (!__VLS_ctx.isPaused),
    'aria-label': "Resume (Space)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.stop();
        } },
    ...{ class: "synth__btn synth__btn--danger" },
    disabled: (!__VLS_ctx.isSpeaking),
    'aria-label': "Stop (Escape)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "synth__hint pg-text-muted" },
});
if (__VLS_ctx.ttsError && !__VLS_ctx.errorDismissed) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "synth__error" },
        role: "alert",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.ttsError.message);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.ttsError && !__VLS_ctx.errorDismissed))
                    return;
                __VLS_ctx.errorDismissed = true;
            } },
        ...{ class: "synth__error-close" },
        'aria-label': "Dismiss error",
    });
}
/** @type {__VLS_StyleScopedClasses['synth']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__waveform']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__no-support']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__waveform-note']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__controls']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__section']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__voice-row']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__skeleton']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__select']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__sliders']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__slider-row']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__slider-label']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__slider-val']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__reset-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__range']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__range']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__range']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__compose']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__textarea-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__charcount']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__transport']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__error']} */ ;
/** @type {__VLS_StyleScopedClasses['synth__error-close']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            WaveformCanvas: WaveformCanvas,
            isSpeaking: isSpeaking,
            isPaused: isPaused,
            isLoadingVoices: isLoadingVoices,
            selectedVoice: selectedVoice,
            rate: rate,
            pitch: pitch,
            volume: volume,
            ttsError: ttsError,
            speak: speak,
            stop: stop,
            pause: pause,
            resume: resume,
            isSupported: isSupported,
            ttsText: ttsText,
            errorDismissed: errorDismissed,
            textareaEl: textareaEl,
            waveformData: waveformData,
            voiceGroups: voiceGroups,
            charCount: charCount,
            DEFAULT: DEFAULT,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
