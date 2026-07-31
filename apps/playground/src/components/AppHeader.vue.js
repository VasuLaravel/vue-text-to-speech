/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, watch } from 'vue';
import { useTheme } from '../composables/useTheme';
const props = defineProps();
const emit = defineEmits();
// ── Theme ─────────────────────────────────────────────────────────────────────
const { isDark, toggle } = useTheme();
// ── Tab definitions ───────────────────────────────────────────────────────────
const tabs = [
    { name: 'overview', label: 'Overview' },
    { name: 'chat', label: 'AI Chat Agent' },
    { name: 'synthesis', label: 'Synthesis' },
    { name: 'recognition', label: 'Recognition' },
    { name: 'streaming', label: 'Streaming' },
    { name: 'queue', label: 'Queue' },
    { name: 'components', label: 'Components' },
    { name: 'setup', label: 'Setup' },
];
// ── Tab button refs for mobile scroll-into-view (P4.7) ───────────────────────
const tabbarEl = ref(null);
const tabBtnRefs = {};
function setTabRef(name, el) {
    tabBtnRefs[name] = el;
}
watch(() => props.activeTab, (name) => {
    // Scroll the active tab button into view on mobile (P4.7)
    const btn = tabBtnRefs[name];
    if (btn)
        btn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
});
// ── Keyboard shortcut: 1–8 for tabs (P4.4 — owned here, doc-level) ───────────
function onKeydown(e) {
    const target = e.target;
    if (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement)
        return;
    const idx = parseInt(e.key, 10);
    if (idx >= 1 && idx <= 8) {
        e.preventDefault();
        emit('tab-change', tabs[idx - 1].name);
    }
    // '?' is handled in App.vue to also open the dialog
}
if (typeof document !== 'undefined') {
    document.addEventListener('keydown', onKeydown);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['pg-header__logo-text']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-header__version-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-header__inner']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-icon-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "pg-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-header__inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-header__logo" },
    'aria-label': "Vue Text to Speech Playground",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "pg-header__logo-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "pg-header__logo-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "pg-header__version-chip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ref: "tabbarEl",
    ...{ class: "pg-tabbar pg-scroll-x" },
    role: "tablist",
    'aria-label': "Playground sections",
});
/** @type {typeof __VLS_ctx.tabbarEl} */ ;
for (const [tab, i] of __VLS_getVForSourceType((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('tab-change', tab.name);
            } },
        key: (tab.name),
        ref: ((el) => __VLS_ctx.setTabRef(tab.name, el)),
        role: "tab",
        'aria-selected': (__VLS_ctx.activeTab === tab.name),
        'aria-label': (`${tab.label} (press ${i + 1})`),
        ...{ class: "pg-tab" },
        ...{ class: ({ 'pg-tab--active': __VLS_ctx.activeTab === tab.name }) },
    });
    (tab.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-header__controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('open-shortcuts');
        } },
    ...{ class: "pg-icon-btn pg-icon-btn--hint" },
    'aria-label': "Open keyboard shortcuts (press ?)",
    title: "Keyboard shortcuts (?)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    'aria-hidden': "true",
    ...{ class: "pg-icon-btn__kbd" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggle) },
    ...{ class: "pg-icon-btn" },
    'aria-label': (__VLS_ctx.isDark ? 'Switch to light mode' : 'Switch to dark mode'),
    title: (__VLS_ctx.isDark ? 'Light mode' : 'Dark mode'),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    'aria-hidden': "true",
});
(__VLS_ctx.isDark ? '☀' : '🌙');
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    href: "https://github.com/VasuLaravel/vue-text-to-speech",
    target: "_blank",
    rel: "noopener noreferrer",
    ...{ class: "pg-icon-btn" },
    'aria-label': "View source on GitHub (opens in new tab)",
    title: "GitHub",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    'aria-hidden': "true",
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "currentColor",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z",
});
/** @type {__VLS_StyleScopedClasses['pg-header']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-header__inner']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-header__logo']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-header__logo-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-header__logo-text']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-header__version-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-tabbar']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-scroll-x']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-header__controls']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-icon-btn--hint']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-icon-btn__kbd']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-icon-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            isDark: isDark,
            toggle: toggle,
            tabs: tabs,
            tabbarEl: tabbarEl,
            setTabRef: setTabRef,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
