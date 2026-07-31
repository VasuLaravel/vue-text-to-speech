/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import AppHeader from './components/AppHeader.vue';
import { useTheme } from './composables/useTheme';
// ── Theme ─────────────────────────────────────────────────────────────────────
const { init: initTheme } = useTheme();
// ── Active tab — persisted to sessionStorage ──────────────────────────────────
const TAB_KEY = 'pg-active-tab';
const VALID_TABS = ['overview', 'chat', 'synthesis', 'recognition', 'streaming', 'queue', 'components', 'setup'];
function readActiveTab() {
    try {
        const stored = sessionStorage.getItem(TAB_KEY);
        if (stored && VALID_TABS.includes(stored)) {
            return stored;
        }
    }
    catch { /* sessionStorage unavailable */ }
    return 'overview';
}
const activeTab = ref(readActiveTab());
function setTab(name) {
    if (!VALID_TABS.includes(name))
        return;
    activeTab.value = name;
    try {
        sessionStorage.setItem(TAB_KEY, name);
    }
    catch { /* ignore */ }
}
// ── Lazy-loaded tab components ─────────────────────────────────────────────────
const OverviewTab = defineAsyncComponent(() => import('./tabs/OverviewTab.vue'));
const ChatAgentTab = defineAsyncComponent(() => import('./tabs/ChatAgentTab.vue'));
const SynthesisTab = defineAsyncComponent(() => import('./tabs/SynthesisTab.vue'));
const RecognitionTab = defineAsyncComponent(() => import('./tabs/RecognitionTab.vue'));
const StreamingTab = defineAsyncComponent(() => import('./tabs/StreamingTab.vue'));
const VoiceQueueTab = defineAsyncComponent(() => import('./tabs/VoiceQueueTab.vue'));
const ComponentsTab = defineAsyncComponent(() => import('./tabs/ComponentsTab.vue'));
const SetupTab = defineAsyncComponent(() => import('./tabs/SetupTab.vue'));
// ── Keyboard shortcut overlay (P4.4) ─────────────────────────────────────────
const dialogEl = ref(null);
const shortcutsOpen = ref(false);
function openShortcuts() {
    shortcutsOpen.value = true;
    dialogEl.value?.showModal?.();
}
function closeShortcuts() {
    shortcutsOpen.value = false;
    dialogEl.value?.close?.();
}
function onDocKeydown(e) {
    const target = e.target;
    const inInput = target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
    if (e.key === '?' && !inInput) {
        e.preventDefault();
        shortcutsOpen.value ? closeShortcuts() : openShortcuts();
    }
    if (e.key === 'Escape' && shortcutsOpen.value) {
        closeShortcuts();
    }
}
// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
    initTheme();
    document.addEventListener('keydown', onDocKeydown);
});
onUnmounted(() => {
    document.removeEventListener('keydown', onDocKeydown);
});
// ── Shortcut list ─────────────────────────────────────────────────────────────
const SHORTCUTS = [
    { key: '1–8', desc: 'Switch to tab 1–8' },
    { key: 'Space', desc: 'Play / Pause (Synthesis tab)' },
    { key: 'Esc', desc: 'Stop speech / Close overlay' },
    { key: '?', desc: 'Toggle this keyboard shortcut help' },
    { key: 'Enter', desc: 'Send message (Chat tab input)' },
    { key: 'Shift+Enter', desc: 'New line in Chat input' },
];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-close']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-app" },
});
/** @type {[typeof AppHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppHeader, new AppHeader({
    ...{ 'onTabChange': {} },
    ...{ 'onOpenShortcuts': {} },
    activeTab: (__VLS_ctx.activeTab),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onTabChange': {} },
    ...{ 'onOpenShortcuts': {} },
    activeTab: (__VLS_ctx.activeTab),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onTabChange: (__VLS_ctx.setTab)
};
const __VLS_7 = {
    onOpenShortcuts: (__VLS_ctx.openShortcuts)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "pg-main" },
});
const __VLS_8 = {}.QTabPanels;
/** @type {[typeof __VLS_components.QTabPanels, typeof __VLS_components.qTabPanels, typeof __VLS_components.QTabPanels, typeof __VLS_components.qTabPanels, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    modelValue: (__VLS_ctx.activeTab),
    animated: true,
    transitionPrev: "pg-tab-leave",
    transitionNext: "pg-tab-enter",
    ...{ class: "pg-panels" },
}));
const __VLS_10 = __VLS_9({
    modelValue: (__VLS_ctx.activeTab),
    animated: true,
    transitionPrev: "pg-tab-leave",
    transitionNext: "pg-tab-enter",
    ...{ class: "pg-panels" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.QTabPanel;
/** @type {[typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    name: "overview",
    ...{ class: "pg-panel" },
}));
const __VLS_14 = __VLS_13({
    name: "overview",
    ...{ class: "pg-panel" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({}));
const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
if (__VLS_ctx.activeTab === 'overview') {
    const __VLS_20 = {}.OverviewTab;
    /** @type {[typeof __VLS_components.OverviewTab, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onNavigateToTab': {} },
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onNavigateToTab': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onNavigateToTab: (__VLS_ctx.setTab)
    };
    var __VLS_23;
}
var __VLS_19;
var __VLS_15;
const __VLS_28 = {}.QTabPanel;
/** @type {[typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    name: "chat",
    ...{ class: "pg-panel" },
}));
const __VLS_30 = __VLS_29({
    name: "chat",
    ...{ class: "pg-panel" },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({}));
const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
if (__VLS_ctx.activeTab === 'chat') {
    const __VLS_36 = {}.ChatAgentTab;
    /** @type {[typeof __VLS_components.ChatAgentTab, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
    const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
}
var __VLS_35;
var __VLS_31;
const __VLS_40 = {}.QTabPanel;
/** @type {[typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    name: "synthesis",
    ...{ class: "pg-panel" },
}));
const __VLS_42 = __VLS_41({
    name: "synthesis",
    ...{ class: "pg-panel" },
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({}));
const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
if (__VLS_ctx.activeTab === 'synthesis') {
    const __VLS_48 = {}.SynthesisTab;
    /** @type {[typeof __VLS_components.SynthesisTab, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({}));
    const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
}
var __VLS_47;
var __VLS_43;
const __VLS_52 = {}.QTabPanel;
/** @type {[typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    name: "recognition",
    ...{ class: "pg-panel" },
}));
const __VLS_54 = __VLS_53({
    name: "recognition",
    ...{ class: "pg-panel" },
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({}));
const __VLS_58 = __VLS_57({}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
if (__VLS_ctx.activeTab === 'recognition') {
    const __VLS_60 = {}.RecognitionTab;
    /** @type {[typeof __VLS_components.RecognitionTab, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({}));
    const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
}
var __VLS_59;
var __VLS_55;
const __VLS_64 = {}.QTabPanel;
/** @type {[typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    name: "streaming",
    ...{ class: "pg-panel" },
}));
const __VLS_66 = __VLS_65({
    name: "streaming",
    ...{ class: "pg-panel" },
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({}));
const __VLS_70 = __VLS_69({}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
if (__VLS_ctx.activeTab === 'streaming') {
    const __VLS_72 = {}.StreamingTab;
    /** @type {[typeof __VLS_components.StreamingTab, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({}));
    const __VLS_74 = __VLS_73({}, ...__VLS_functionalComponentArgsRest(__VLS_73));
}
var __VLS_71;
var __VLS_67;
const __VLS_76 = {}.QTabPanel;
/** @type {[typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    name: "queue",
    ...{ class: "pg-panel" },
}));
const __VLS_78 = __VLS_77({
    name: "queue",
    ...{ class: "pg-panel" },
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({}));
const __VLS_82 = __VLS_81({}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
if (__VLS_ctx.activeTab === 'queue') {
    const __VLS_84 = {}.VoiceQueueTab;
    /** @type {[typeof __VLS_components.VoiceQueueTab, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({}));
    const __VLS_86 = __VLS_85({}, ...__VLS_functionalComponentArgsRest(__VLS_85));
}
var __VLS_83;
var __VLS_79;
const __VLS_88 = {}.QTabPanel;
/** @type {[typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    name: "components",
    ...{ class: "pg-panel" },
}));
const __VLS_90 = __VLS_89({
    name: "components",
    ...{ class: "pg-panel" },
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
__VLS_91.slots.default;
const __VLS_92 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({}));
const __VLS_94 = __VLS_93({}, ...__VLS_functionalComponentArgsRest(__VLS_93));
__VLS_95.slots.default;
if (__VLS_ctx.activeTab === 'components') {
    const __VLS_96 = {}.ComponentsTab;
    /** @type {[typeof __VLS_components.ComponentsTab, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({}));
    const __VLS_98 = __VLS_97({}, ...__VLS_functionalComponentArgsRest(__VLS_97));
}
var __VLS_95;
var __VLS_91;
const __VLS_100 = {}.QTabPanel;
/** @type {[typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, typeof __VLS_components.QTabPanel, typeof __VLS_components.qTabPanel, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    name: "setup",
    ...{ class: "pg-panel" },
}));
const __VLS_102 = __VLS_101({
    name: "setup",
    ...{ class: "pg-panel" },
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
const __VLS_104 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({}));
const __VLS_106 = __VLS_105({}, ...__VLS_functionalComponentArgsRest(__VLS_105));
__VLS_107.slots.default;
if (__VLS_ctx.activeTab === 'setup') {
    const __VLS_108 = {}.SetupTab;
    /** @type {[typeof __VLS_components.SetupTab, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({}));
    const __VLS_110 = __VLS_109({}, ...__VLS_functionalComponentArgsRest(__VLS_109));
}
var __VLS_107;
var __VLS_103;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.dialog, __VLS_intrinsicElements.dialog)({
    ...{ onClick: (__VLS_ctx.closeShortcuts) },
    ref: "dialogEl",
    ...{ class: "pg-shortcuts-dialog" },
    'aria-label': "Keyboard shortcuts",
    'aria-modal': "true",
});
/** @type {typeof __VLS_ctx.dialogEl} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-shortcuts-panel" },
    role: "document",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pg-shortcuts-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "pg-shortcuts-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.closeShortcuts) },
    ...{ class: "pg-shortcuts-close" },
    'aria-label': "Close shortcuts overlay",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.dl, __VLS_intrinsicElements.dl)({
    ...{ class: "pg-shortcuts-list" },
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.SHORTCUTS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (s.key),
        ...{ class: "pg-shortcut-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({
        ...{ class: "pg-shortcut-key" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    (s.key);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
        ...{ class: "pg-shortcut-desc" },
    });
    (s.desc);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "pg-shortcuts-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
/** @type {__VLS_StyleScopedClasses['pg-app']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-main']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panels']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-header']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-title']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-close']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-list']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcut-row']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcut-key']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcut-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-shortcuts-hint']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppHeader: AppHeader,
            activeTab: activeTab,
            setTab: setTab,
            OverviewTab: OverviewTab,
            ChatAgentTab: ChatAgentTab,
            SynthesisTab: SynthesisTab,
            RecognitionTab: RecognitionTab,
            StreamingTab: StreamingTab,
            VoiceQueueTab: VoiceQueueTab,
            ComponentsTab: ComponentsTab,
            SetupTab: SetupTab,
            dialogEl: dialogEl,
            openShortcuts: openShortcuts,
            closeShortcuts: closeShortcuts,
            SHORTCUTS: SHORTCUTS,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
