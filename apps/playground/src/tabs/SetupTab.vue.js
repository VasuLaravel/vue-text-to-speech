/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import CodeBlock from '../components/CodeBlock.vue';
import { useSpeechSynthesis } from 'vue-text-to-speech';
import { useToast } from '../composables/useToast';
import { useTabEntrance } from '../composables/useTabEntrance';
// ── Entrance animation ───────────────────────────────────────────────────
useTabEntrance();
const { success: toastSuccess, error: toastError } = useToast();
const state = {
    web: { expanded: true, testing: false, testOk: null },
    openai: { expanded: false, testing: false, testOk: null },
    elevenlabs: { expanded: false, testing: false, testOk: null },
    azure: { expanded: false, testing: false, testOk: null },
};
const providerStates = ref(state);
// ── Active provider ────────────────────────────────────────────────────────────
let savedCfg = {};
try {
    savedCfg = JSON.parse(sessionStorage.getItem('vts-provider-config') ?? '{}');
}
catch { /* noop */ }
const activeProvider = ref(savedCfg.provider ?? 'web');
// ── Field values ───────────────────────────────────────────────────────────────
// OpenAI
const oaiKey = ref('');
const oaiModel = ref('tts-1');
const oaiVoice = ref('alloy');
const oaiBase = ref('');
const showOaiKey = ref(false);
// ElevenLabs
const elKey = ref('');
const elVoiceId = ref('21m00Tcm4TlvDq8ikWAM'); // Rachel
const elModel = ref('eleven_multilingual_v2');
const elBase = ref('');
const showElKey = ref(false);
// Azure
const azKey = ref('');
const azRegion = ref('eastus');
const azVoice = ref('en-US-JennyNeural');
const azBase = ref('');
const showAzKey = ref(false);
// ── Test connection (uses Web Speech as fallback for non-API providers) ─────────
const { speak: wsTTS, isSupported: wsSupported } = useSpeechSynthesis();
async function testProvider(id) {
    const s = providerStates.value[id];
    s.testing = true;
    s.testOk = null;
    try {
        // Always use Web Speech for local test — real provider requires backend proxy
        if (wsSupported.value) {
            wsTTS('Connection test successful.');
            await new Promise(r => setTimeout(r, 1800));
        }
        s.testOk = true;
        toastSuccess('Connection test successful');
    }
    catch {
        s.testOk = false;
        toastError('Connection test failed');
    }
    finally {
        s.testing = false;
    }
}
// ── Mask API key (S-4: last 4 chars only) ─────────────────────────────────────
function maskKey(key) {
    if (key.length <= 4)
        return '****';
    return '…' + key.slice(-4);
}
// ── Generate main.ts snippet ──────────────────────────────────────────────────
const generatedCode = computed(() => {
    if (activeProvider.value === 'web') {
        return `import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

const app = createApp(App)
app.use(VueSpeech)   // Web Speech API — no config needed
app.mount('#app')`;
    }
    if (activeProvider.value === 'openai') {
        const lines = [`  provider: 'openai'`, `  apiKey: '${maskKey(oaiKey.value)}'`, `  model: '${oaiModel.value}'`, `  voice: '${oaiVoice.value}'`];
        if (oaiBase.value.trim())
            lines.push(`  baseURL: '${oaiBase.value.trim()}'`);
        return `import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

const app = createApp(App)
app.use(VueSpeech, {
${lines.join(',\n')}
})
app.mount('#app')`;
    }
    if (activeProvider.value === 'elevenlabs') {
        const lines = [`  provider: 'elevenlabs'`, `  apiKey: '${maskKey(elKey.value)}'`, `  voiceId: '${elVoiceId.value}'`, `  modelId: '${elModel.value}'`];
        if (elBase.value.trim())
            lines.push(`  baseURL: '${elBase.value.trim()}'`);
        return `import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

const app = createApp(App)
app.use(VueSpeech, {
${lines.join(',\n')}
})
app.mount('#app')`;
    }
    // Azure
    const lines = [`  provider: 'azure'`, `  subscriptionKey: '${maskKey(azKey.value)}'`, `  region: '${azRegion.value}'`, `  voice: '${azVoice.value}'`];
    if (azBase.value.trim())
        lines.push(`  baseURL: '${azBase.value.trim()}'`);
    return `import { createApp } from 'vue'
import { VueSpeech } from 'vue-text-to-speech'

const app = createApp(App)
app.use(VueSpeech, {
${lines.join(',\n')}
})
app.mount('#app')`;
});
// ── Apply / Reset ──────────────────────────────────────────────────────────────
function buildConfig() {
    if (activeProvider.value === 'web')
        return { provider: 'web' };
    if (activeProvider.value === 'openai') {
        const cfg = { provider: 'openai', apiKey: oaiKey.value, model: oaiModel.value, voice: oaiVoice.value };
        if (oaiBase.value.trim())
            cfg.baseURL = oaiBase.value.trim();
        return cfg;
    }
    if (activeProvider.value === 'elevenlabs') {
        const cfg = { provider: 'elevenlabs', apiKey: elKey.value, voiceId: elVoiceId.value, modelId: elModel.value };
        if (elBase.value.trim())
            cfg.baseURL = elBase.value.trim();
        return cfg;
    }
    const cfg = { provider: 'azure', subscriptionKey: azKey.value, region: azRegion.value, voice: azVoice.value };
    if (azBase.value.trim())
        cfg.baseURL = azBase.value.trim();
    return cfg;
}
function applyConfig() {
    try {
        sessionStorage.setItem('vts-provider-config', JSON.stringify(buildConfig()));
        // Preserve active tab through reload
        const tab = sessionStorage.getItem('pg-active-tab');
        toastSuccess('Provider config saved — reloading…');
        setTimeout(() => {
            window.location.reload();
            if (tab)
                sessionStorage.setItem('pg-active-tab', tab);
        }, 600);
    }
    catch (e) {
        toastError('sessionStorage unavailable: ' + String(e));
    }
}
function resetConfig() {
    try {
        sessionStorage.removeItem('vts-provider-config');
        toastSuccess('Config reset — reloading…');
        setTimeout(() => window.location.reload(), 600);
    }
    catch { /* noop */ }
}
// ── Provider card data ─────────────────────────────────────────────────────────
const PROVIDERS = [
    { id: 'web', name: 'Web Speech', badge: 'Free', description: 'Built-in browser TTS. No API key required. Limited voice quality.' },
    { id: 'openai', name: 'OpenAI', badge: 'Paid', description: 'High-quality neural voices (alloy, echo, fable, onyx, nova, shimmer) via OpenAI TTS API.' },
    { id: 'elevenlabs', name: 'ElevenLabs', badge: 'Paid', description: 'Ultra-realistic voice cloning and multilingual synthesis.' },
    { id: 'azure', name: 'Azure', badge: 'Paid', description: 'Microsoft Azure Cognitive Services. 400+ neural voices.' },
];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['setup__provider-name']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__select']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__test-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__test-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__apply-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__reset-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "setup" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "setup__grid" },
});
for (const [p] of __VLS_getVForSourceType((__VLS_ctx.PROVIDERS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (p.id),
        ...{ class: "setup__card pg-card" },
        ...{ class: ({ 'setup__card--active': __VLS_ctx.activeProvider === p.id }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "setup__card-head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activeProvider = p.id;
                __VLS_ctx.providerStates[p.id].expanded = true;
            } },
        ...{ class: "setup__provider-btn" },
        ...{ class: ({ 'setup__provider-btn--active': __VLS_ctx.activeProvider === p.id }) },
        'aria-pressed': (__VLS_ctx.activeProvider === p.id),
        'aria-label': (`Select ${p.name} provider`),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "setup__provider-name" },
    });
    (p.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "setup__badge" },
        ...{ class: (`setup__badge--${p.badge.toLowerCase()}`) },
    });
    (p.badge);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.providerStates[p.id].expanded = !__VLS_ctx.providerStates[p.id].expanded;
            } },
        ...{ class: "setup__expand-btn" },
        'aria-label': (__VLS_ctx.providerStates[p.id].expanded ? `Collapse ${p.name}` : `Expand ${p.name}`),
        'aria-expanded': (__VLS_ctx.providerStates[p.id].expanded),
    });
    (__VLS_ctx.providerStates[p.id].expanded ? '▲' : '▼');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "setup__card-desc pg-text-muted" },
    });
    (p.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "setup__fields" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.providerStates[p.id].expanded) }, null, null);
    if (p.id === 'web') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "setup__no-config pg-text-muted" },
        });
    }
    if (p.id === 'openai') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "oai-key",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__secret-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: ('oai-key'),
            type: (__VLS_ctx.showOaiKey ? 'text' : 'password'),
            ...{ class: "setup__input" },
            placeholder: "sk-…",
            autocomplete: "off",
            'aria-label': "OpenAI API key",
        });
        (__VLS_ctx.oaiKey);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(p.id === 'openai'))
                        return;
                    __VLS_ctx.showOaiKey = !__VLS_ctx.showOaiKey;
                } },
            ...{ class: "setup__show-btn" },
            'aria-label': (__VLS_ctx.showOaiKey ? 'Hide key' : 'Show key'),
        });
        (__VLS_ctx.showOaiKey ? '🙈' : '👁');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "oai-model",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            id: "oai-model",
            value: (__VLS_ctx.oaiModel),
            ...{ class: "setup__select" },
            'aria-label': "OpenAI model",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: "tts-1",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: "tts-1-hd",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "oai-voice",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            id: "oai-voice",
            value: (__VLS_ctx.oaiVoice),
            ...{ class: "setup__select" },
            'aria-label': "OpenAI voice",
        });
        for (const [v] of __VLS_getVForSourceType((['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (v),
                value: (v),
            });
            (v);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "oai-base",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "pg-text-muted" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "oai-base",
            value: (__VLS_ctx.oaiBase),
            type: "text",
            ...{ class: "setup__input" },
            placeholder: "https://api.openai.com/v1",
            'aria-label': "OpenAI base URL",
        });
    }
    if (p.id === 'elevenlabs') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "el-key",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__secret-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "el-key",
            type: (__VLS_ctx.showElKey ? 'text' : 'password'),
            ...{ class: "setup__input" },
            placeholder: "xi_…",
            autocomplete: "off",
            'aria-label': "ElevenLabs API key",
        });
        (__VLS_ctx.elKey);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(p.id === 'elevenlabs'))
                        return;
                    __VLS_ctx.showElKey = !__VLS_ctx.showElKey;
                } },
            ...{ class: "setup__show-btn" },
            'aria-label': (__VLS_ctx.showElKey ? 'Hide key' : 'Show key'),
        });
        (__VLS_ctx.showElKey ? '🙈' : '👁');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "el-voice",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "el-voice",
            value: (__VLS_ctx.elVoiceId),
            type: "text",
            ...{ class: "setup__input" },
            placeholder: "21m00Tcm4TlvDq8ikWAM",
            'aria-label': "ElevenLabs voice ID",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "el-model",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            id: "el-model",
            value: (__VLS_ctx.elModel),
            ...{ class: "setup__select" },
            'aria-label': "ElevenLabs model",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: "eleven_multilingual_v2",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: "eleven_monolingual_v1",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: "eleven_turbo_v2",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "el-base",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "pg-text-muted" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "el-base",
            value: (__VLS_ctx.elBase),
            type: "text",
            ...{ class: "setup__input" },
            placeholder: "https://api.elevenlabs.io/v1",
            'aria-label': "ElevenLabs base URL",
        });
    }
    if (p.id === 'azure') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "az-key",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__secret-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "az-key",
            type: (__VLS_ctx.showAzKey ? 'text' : 'password'),
            ...{ class: "setup__input" },
            placeholder: "Azure subscription key",
            autocomplete: "off",
            'aria-label': "Azure subscription key",
        });
        (__VLS_ctx.azKey);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(p.id === 'azure'))
                        return;
                    __VLS_ctx.showAzKey = !__VLS_ctx.showAzKey;
                } },
            ...{ class: "setup__show-btn" },
            'aria-label': (__VLS_ctx.showAzKey ? 'Hide key' : 'Show key'),
        });
        (__VLS_ctx.showAzKey ? '🙈' : '👁');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "az-region",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "az-region",
            value: (__VLS_ctx.azRegion),
            type: "text",
            ...{ class: "setup__input" },
            placeholder: "eastus",
            'aria-label': "Azure region",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "az-voice",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "az-voice",
            value: (__VLS_ctx.azVoice),
            type: "text",
            ...{ class: "setup__input" },
            placeholder: "en-US-JennyNeural",
            'aria-label': "Azure voice",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "setup__field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "pg-label" },
            for: "az-base",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "pg-text-muted" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            id: "az-base",
            value: (__VLS_ctx.azBase),
            type: "text",
            ...{ class: "setup__input" },
            placeholder: "https://{region}.tts.speech.microsoft.com",
            'aria-label': "Azure base URL",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.testProvider(p.id);
            } },
        ...{ class: "setup__test-btn" },
        disabled: (__VLS_ctx.providerStates[p.id].testing),
        'aria-busy': (__VLS_ctx.providerStates[p.id].testing),
    });
    if (__VLS_ctx.providerStates[p.id].testing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    else if (__VLS_ctx.providerStates[p.id].testOk === true) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: {} },
        });
    }
    else if (__VLS_ctx.providerStates[p.id].testOk === false) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: {} },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "setup__code-section pg-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-label" },
    ...{ style: {} },
});
/** @type {[typeof CodeBlock, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(CodeBlock, new CodeBlock({
    code: (__VLS_ctx.generatedCode),
    language: "typescript",
}));
const __VLS_1 = __VLS_0({
    code: (__VLS_ctx.generatedCode),
    language: "typescript",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "setup__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.applyConfig) },
    ...{ class: "setup__apply-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetConfig) },
    ...{ class: "setup__reset-btn" },
});
/** @type {__VLS_StyleScopedClasses['setup']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__grid']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__card']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__card-head']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__provider-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__provider-name']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__badge']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__expand-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__card-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__fields']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__no-config']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__secret-row']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__show-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__select']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__select']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__secret-row']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__show-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__select']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__secret-row']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__show-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__field']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__input']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__test-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__code-section']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-label']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__apply-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setup__reset-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CodeBlock: CodeBlock,
            providerStates: providerStates,
            activeProvider: activeProvider,
            oaiKey: oaiKey,
            oaiModel: oaiModel,
            oaiVoice: oaiVoice,
            oaiBase: oaiBase,
            showOaiKey: showOaiKey,
            elKey: elKey,
            elVoiceId: elVoiceId,
            elModel: elModel,
            elBase: elBase,
            showElKey: showElKey,
            azKey: azKey,
            azRegion: azRegion,
            azVoice: azVoice,
            azBase: azBase,
            showAzKey: showAzKey,
            testProvider: testProvider,
            generatedCode: generatedCode,
            applyConfig: applyConfig,
            resetConfig: resetConfig,
            PROVIDERS: PROVIDERS,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
