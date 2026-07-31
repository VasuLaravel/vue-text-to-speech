/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { VueSpeechPlayer, VueSpeechRecorder, VueSpeechVoiceSelect, useSpeechSynthesis } from 'vue-text-to-speech';
import CodeBlock from '../components/CodeBlock.vue';
const PLAYER_VARS = [
    { key: '--vts-primary', label: 'Primary', type: 'color', default: '#6366f1' },
    { key: '--vts-bg', label: 'BG', type: 'color', default: '#1a1a26' },
    { key: '--vts-border', label: 'Border', type: 'color', default: 'rgba(255,255,255,0.08)' },
    { key: '--vts-text', label: 'Text', type: 'color', default: '#e2e8f0' },
    { key: '--vts-radius', label: 'Radius', type: 'text', default: '12px' },
    { key: '--vts-font', label: 'Font', type: 'text', default: 'inherit' },
];
const playerCSSVars = ref(Object.fromEntries(PLAYER_VARS.map(v => [v.key, v.default])));
function resetPlayerVars() {
    PLAYER_VARS.forEach(v => { playerCSSVars.value[v.key] = v.default; });
}
const playerStyle = computed(() => Object.entries(playerCSSVars.value).map(([k, v]) => `${k}: ${v}`).join('; '));
const playerCode = computed(() => `<VueSpeechPlayer
  text="Hello from vue-text-to-speech!"
  :style="{
${Object.entries(playerCSSVars.value).map(([k, v]) => `    '${k}': '${v}'`).join(',\n')}
  }"
/>`);
// ── Recorder CSS var editor ────────────────────────────────────────────────────
const recorderRecordingColor = ref('#f43f5e');
function resetRecorderVars() { recorderRecordingColor.value = '#f43f5e'; }
const recorderCode = computed(() => `<VueSpeechRecorder
  :style="{ '--vts-recording-color': '${recorderRecordingColor.value}' }"
/>`);
// ── VoiceSelect v-model demo ───────────────────────────────────────────────────
const { voices, isLoadingVoices } = useSpeechSynthesis();
const selectedVoice = ref(undefined);
const voiceSelectCode = `<script setup>
import { ref } from 'vue'
import { VueSpeechVoiceSelect } from 'vue-text-to-speech'

const selectedVoice = ref(null)
<\/script>

<template>
  <VueSpeechVoiceSelect v-model="selectedVoice" />
  <p>Selected: {{ selectedVoice?.label ?? 'Default' }}</p>
</template>`;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['comp__text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__reset-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__summary']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "comp__section pg-card" },
    'aria-labelledby': "player-heading",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    id: "player-heading",
    ...{ class: "comp__heading" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "comp__desc pg-text-muted" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__preview" },
    ...{ style: (__VLS_ctx.playerStyle) },
});
const __VLS_0 = {}.VueSpeechPlayer;
/** @type {[typeof __VLS_components.VueSpeechPlayer, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    text: "Hello from vue-text-to-speech! This is a customizable speech player component.",
}));
const __VLS_2 = __VLS_1({
    text: "Hello from vue-text-to-speech! This is a customizable speech player component.",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__editor" },
});
for (const [varDef] of __VLS_getVForSourceType((__VLS_ctx.PLAYER_VARS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (varDef.key),
        ...{ class: "comp__var-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: ('player-' + varDef.key),
        ...{ class: "comp__var-label" },
    });
    (varDef.label);
    if (varDef.type === 'color') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: ('player-' + varDef.key),
            type: "color",
            ...{ class: "comp__color-input" },
            'aria-label': (`${varDef.label} color`),
        });
        (__VLS_ctx.playerCSSVars[varDef.key]);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: ('player-' + varDef.key),
            value: (__VLS_ctx.playerCSSVars[varDef.key]),
            type: "text",
            ...{ class: "comp__text-input" },
            'aria-label': (`${varDef.label} value`),
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetPlayerVars) },
    ...{ class: "comp__reset-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.details, __VLS_intrinsicElements.details)({
    ...{ class: "comp__details" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.summary, __VLS_intrinsicElements.summary)({
    ...{ class: "comp__summary" },
});
/** @type {[typeof CodeBlock, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(CodeBlock, new CodeBlock({
    code: (__VLS_ctx.playerCode),
    language: "html",
}));
const __VLS_5 = __VLS_4({
    code: (__VLS_ctx.playerCode),
    language: "html",
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "comp__section pg-card" },
    'aria-labelledby': "recorder-heading",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    id: "recorder-heading",
    ...{ class: "comp__heading" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "comp__desc pg-text-muted" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__preview comp__preview--light" },
    ...{ style: (`--vts-recording-color: ${__VLS_ctx.recorderRecordingColor}`) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "comp__preview-label" },
});
const __VLS_7 = {}.VueSpeechRecorder;
/** @type {[typeof __VLS_components.VueSpeechRecorder, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__preview comp__preview--dark" },
    ...{ style: (`--vts-recording-color: ${__VLS_ctx.recorderRecordingColor}`) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "comp__preview-label" },
});
const __VLS_11 = {}.VueSpeechRecorder;
/** @type {[typeof __VLS_components.VueSpeechRecorder, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({}));
const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__editor" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__var-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "rec-color",
    ...{ class: "comp__var-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "rec-color",
    type: "color",
    ...{ class: "comp__color-input" },
    'aria-label': "Recording color",
});
(__VLS_ctx.recorderRecordingColor);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetRecorderVars) },
    ...{ class: "comp__reset-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.details, __VLS_intrinsicElements.details)({
    ...{ class: "comp__details" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.summary, __VLS_intrinsicElements.summary)({
    ...{ class: "comp__summary" },
});
/** @type {[typeof CodeBlock, ]} */ ;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(CodeBlock, new CodeBlock({
    code: (__VLS_ctx.recorderCode),
    language: "html",
}));
const __VLS_16 = __VLS_15({
    code: (__VLS_ctx.recorderCode),
    language: "html",
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "comp__section pg-card" },
    'aria-labelledby': "voiceselect-heading",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    id: "voiceselect-heading",
    ...{ class: "comp__heading" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "comp__desc pg-text-muted" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "comp__voice-demo" },
});
const __VLS_18 = {}.VueSpeechVoiceSelect;
/** @type {[typeof __VLS_components.VueSpeechVoiceSelect, ]} */ ;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
    modelValue: (__VLS_ctx.selectedVoice),
    voices: (__VLS_ctx.voices),
    loading: (__VLS_ctx.isLoadingVoices),
}));
const __VLS_20 = __VLS_19({
    modelValue: (__VLS_ctx.selectedVoice),
    voices: (__VLS_ctx.voices),
    loading: (__VLS_ctx.isLoadingVoices),
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "comp__voice-val pg-text-muted" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
    ...{ style: {} },
});
(__VLS_ctx.selectedVoice?.label ?? 'Default');
__VLS_asFunctionalElement(__VLS_intrinsicElements.details, __VLS_intrinsicElements.details)({
    ...{ class: "comp__details" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.summary, __VLS_intrinsicElements.summary)({
    ...{ class: "comp__summary" },
});
/** @type {[typeof CodeBlock, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(CodeBlock, new CodeBlock({
    code: (__VLS_ctx.voiceSelectCode),
    language: "html",
}));
const __VLS_23 = __VLS_22({
    code: (__VLS_ctx.voiceSelectCode),
    language: "html",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
/** @type {__VLS_StyleScopedClasses['comp']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__section']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__heading']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__row']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__preview']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__editor']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__var-row']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__var-label']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__color-input']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__reset-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__details']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__summary']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__section']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__heading']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__row']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__preview']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__preview--light']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__preview-label']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__preview']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__preview--dark']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__preview-label']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__editor']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__var-row']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__var-label']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__color-input']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__reset-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__details']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__summary']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__section']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__heading']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__voice-demo']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__voice-val']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__details']} */ ;
/** @type {__VLS_StyleScopedClasses['comp__summary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VueSpeechPlayer: VueSpeechPlayer,
            VueSpeechRecorder: VueSpeechRecorder,
            VueSpeechVoiceSelect: VueSpeechVoiceSelect,
            CodeBlock: CodeBlock,
            PLAYER_VARS: PLAYER_VARS,
            playerCSSVars: playerCSSVars,
            resetPlayerVars: resetPlayerVars,
            playerStyle: playerStyle,
            playerCode: playerCode,
            recorderRecordingColor: recorderRecordingColor,
            resetRecorderVars: resetRecorderVars,
            recorderCode: recorderCode,
            voices: voices,
            isLoadingVoices: isLoadingVoices,
            selectedVoice: selectedVoice,
            voiceSelectCode: voiceSelectCode,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
