/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { useToast } from '../composables/useToast';
const props = withDefaults(defineProps(), {
    language: 'typescript',
});
// ── Copy state ────────────────────────────────────────────────────────────────
const { success: toastSuccess, error: toastError } = useToast();
const copied = ref(false);
let copyResetTimer = null;
async function copyCode() {
    // Primary path: Clipboard API (E-P2.4a)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(props.code);
            showCopied();
            toastSuccess('Copied to clipboard');
            return;
        }
        catch {
            // Fall through to legacy path
        }
    }
    // Legacy fallback: document.execCommand (deprecated but still works in many browsers)
    try {
        const textarea = document.createElement('textarea');
        textarea.value = props.code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
            showCopied();
            toastSuccess('Copied to clipboard');
        }
        else {
            showFailed();
        }
    }
    catch {
        showFailed();
    }
}
function showCopied() {
    copied.value = true;
    if (copyResetTimer)
        clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
        copied.value = false;
        copyResetTimer = null;
    }, 2000);
}
function showFailed() {
    toastError('Copy failed — please copy manually');
    if (copyResetTimer)
        clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
        copied.value = false;
        copyResetTimer = null;
    }, 1500);
}
const TS_KEYWORDS = new Set([
    'import', 'export', 'from', 'as', 'default',
    'const', 'let', 'var',
    'function', 'async', 'await', 'return', 'yield',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'class', 'extends', 'implements', 'interface', 'type', 'enum', 'namespace',
    'declare', 'abstract', 'static', 'readonly', 'override',
    'new', 'this', 'super', 'null', 'undefined', 'true', 'false',
    'typeof', 'instanceof', 'keyof', 'in', 'of', 'void', 'never',
    'try', 'catch', 'finally', 'throw',
]);
const TS_TYPES = new Set([
    'string', 'number', 'boolean', 'object', 'symbol', 'bigint',
    'any', 'unknown', 'never', 'void', 'Promise', 'Array', 'Record',
    'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude',
    'Extract', 'NonNullable', 'ReturnType', 'InstanceType',
    'Ref', 'ComputedRef', 'AsyncGenerator',
]);
// Master regex — order matters (first match wins per token)
// Groups: comment | template-string | double-string | single-string | word | number | non-word
const TOKEN_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b[A-Za-z_$][A-Za-z0-9_$]*\b|\d+(?:\.\d+)?|[^A-Za-z0-9_$\s]|\s+)/g;
function classifyWord(word) {
    if (TS_KEYWORDS.has(word))
        return 'keyword';
    if (TS_TYPES.has(word))
        return 'type-name';
    // Heuristic: CapitalCase words → type names
    if (/^[A-Z][a-zA-Z0-9]*$/.test(word))
        return 'type-name';
    return 'plain';
}
function tokenize(code) {
    const tokens = [];
    let match;
    TOKEN_RE.lastIndex = 0;
    while ((match = TOKEN_RE.exec(code)) !== null) {
        const text = match[0];
        if (!text)
            continue;
        let type;
        if (text.startsWith('//') || text.startsWith('/*')) {
            type = 'comment';
        }
        else if (text[0] === '"' || text[0] === "'" || text[0] === '`') {
            type = 'string';
        }
        else if (/^\d/.test(text)) {
            type = 'number';
        }
        else if (/^[A-Za-z_$]/.test(text)) {
            type = classifyWord(text);
        }
        else {
            type = 'plain';
        }
        // Detect function calls: word immediately followed by '('
        // We do a lookahead in the raw string using index
        if (type === 'plain' && /^[A-Za-z_$]/.test(text)) {
            const after = code[match.index + text.length];
            if (after === '(')
                type = 'function-call';
        }
        if (type === 'keyword') {
            // Keywords before '(' are still keywords, not function calls
        }
        else if (type !== 'comment' && type !== 'string' && type !== 'number' && /^[A-Za-z_$]/.test(text)) {
            const after = code[match.index + text.length];
            if (after === '(')
                type = 'function-call';
        }
        tokens.push({ type, text });
    }
    return tokens;
}
const tokens = computed(() => tokenize(props.code));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    language: 'typescript',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['pg-codeblock__copy']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-codeblock__copy']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-codeblock" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-codeblock__header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "pg-codeblock__lang" },
});
(__VLS_ctx.language);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.copyCode) },
    ...{ class: "pg-codeblock__copy" },
    'aria-label': (__VLS_ctx.copied ? 'Code copied!' : 'Copy code to clipboard'),
    title: (__VLS_ctx.copied ? 'Copied!' : 'Copy'),
});
if (__VLS_ctx.copied) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        'aria-hidden': "true",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        'aria-hidden': "true",
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.rect, __VLS_intrinsicElements.rect)({
        x: "9",
        y: "9",
        width: "13",
        height: "13",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
        d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    });
}
(__VLS_ctx.copied ? 'Copied!' : 'Copy');
__VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
    ...{ class: "pg-codeblock__pre" },
    tabindex: "0",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({
    ...{ class: "pg-codeblock__code" },
});
for (const [token, i] of __VLS_getVForSourceType((__VLS_ctx.tokens))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        key: (i),
        ...{ class: (`pg-token pg-token--${token.type}`) },
    });
    (token.text);
}
/** @type {__VLS_StyleScopedClasses['pg-codeblock']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-codeblock__header']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-codeblock__lang']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-codeblock__copy']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-codeblock__pre']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-codeblock__code']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            copied: copied,
            copyCode: copyCode,
            tokens: tokens,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
