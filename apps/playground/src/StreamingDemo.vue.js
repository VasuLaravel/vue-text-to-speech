/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { useStreamingTTS } from 'vue-text-to-speech';
const { pipeStream, stop, queue, currentItem, currentChunk, isStreaming } = useStreamingTTS();
const safeQueue = computed(() => queue.value ?? []);
const LLM_RESPONSE = `Hello there! This is a simulated language model response.
It has multiple sentences that will be detected automatically.
The text-to-speech engine queues each sentence as it forms.
Streaming makes the response feel much more natural and immediate.
This is the final sentence of the demo.`;
async function* simulatedLLMStream(text, chunkSize = 6) {
    for (let i = 0; i < text.length; i += chunkSize) {
        await new Promise((r) => setTimeout(r, 50)); // ~20 tokens/s
        yield text.slice(i, i + chunkSize);
    }
}
const customText = ref(LLM_RESPONSE);
async function startStreaming() {
    await pipeStream(simulatedLLMStream(customText.value));
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.QCardSection;
/** @type {[typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "q-pb-sm" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "q-pb-sm" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-h6 text-dark" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-caption text-grey-6 q-mt-xs" },
});
var __VLS_3;
const __VLS_4 = {}.QSeparator;
/** @type {[typeof __VLS_components.QSeparator, typeof __VLS_components.qSeparator, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
const __VLS_8 = {}.QCardSection;
/** @type {[typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row items-center q-gutter-sm q-mb-lg" },
});
const __VLS_12 = {}.QBtn;
/** @type {[typeof __VLS_components.QBtn, typeof __VLS_components.qBtn, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    color: "primary",
    noCaps: true,
    rounded: true,
    icon: "play_arrow",
    label: (__VLS_ctx.isStreaming ? 'Streaming' : 'Start Stream'),
    loading: (__VLS_ctx.isStreaming),
    disable: (__VLS_ctx.isStreaming),
    unelevated: true,
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    color: "primary",
    noCaps: true,
    rounded: true,
    icon: "play_arrow",
    label: (__VLS_ctx.isStreaming ? 'Streaming' : 'Start Stream'),
    loading: (__VLS_ctx.isStreaming),
    disable: (__VLS_ctx.isStreaming),
    unelevated: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.startStreaming)
};
var __VLS_15;
const __VLS_20 = {}.QBtn;
/** @type {[typeof __VLS_components.QBtn, typeof __VLS_components.qBtn, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onClick': {} },
    noCaps: true,
    rounded: true,
    color: "negative",
    icon: "stop",
    label: "Stop",
    disable: (!__VLS_ctx.isStreaming),
    flat: true,
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClick': {} },
    noCaps: true,
    rounded: true,
    color: "negative",
    icon: "stop",
    label: "Stop",
    disable: (!__VLS_ctx.isStreaming),
    flat: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onClick: (__VLS_ctx.stop)
};
var __VLS_23;
const __VLS_28 = {}.QChip;
/** @type {[typeof __VLS_components.QChip, typeof __VLS_components.qChip, typeof __VLS_components.QChip, typeof __VLS_components.qChip, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    color: (__VLS_ctx.isStreaming ? 'positive' : 'grey-4'),
    textColor: (__VLS_ctx.isStreaming ? 'white' : 'grey-7'),
    icon: (__VLS_ctx.isStreaming ? 'graphic_eq' : 'radio_button_unchecked'),
    size: "md",
}));
const __VLS_30 = __VLS_29({
    color: (__VLS_ctx.isStreaming ? 'positive' : 'grey-4'),
    textColor: (__VLS_ctx.isStreaming ? 'white' : 'grey-7'),
    icon: (__VLS_ctx.isStreaming ? 'graphic_eq' : 'radio_button_unchecked'),
    size: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
(__VLS_ctx.isStreaming ? 'Streaming' : 'Idle');
var __VLS_31;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row q-col-gutter-sm q-mb-md" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-12 col-sm-6" },
});
const __VLS_32 = {}.QCard;
/** @type {[typeof __VLS_components.QCard, typeof __VLS_components.qCard, typeof __VLS_components.QCard, typeof __VLS_components.qCard, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    flat: true,
    bordered: true,
    ...{ class: "bg-grey-1 full-height" },
}));
const __VLS_34 = __VLS_33({
    flat: true,
    bordered: true,
    ...{ class: "bg-grey-1 full-height" },
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.QCardSection;
/** @type {[typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ class: "q-py-sm" },
}));
const __VLS_38 = __VLS_37({
    ...{ class: "q-py-sm" },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-caption text-grey-5 text-uppercase q-mb-xs" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-body2 text-dark" },
});
(__VLS_ctx.currentItem ?? '');
var __VLS_39;
var __VLS_35;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-12 col-sm-6" },
});
const __VLS_40 = {}.QCard;
/** @type {[typeof __VLS_components.QCard, typeof __VLS_components.qCard, typeof __VLS_components.QCard, typeof __VLS_components.qCard, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    flat: true,
    bordered: true,
    ...{ class: "bg-grey-1 full-height" },
}));
const __VLS_42 = __VLS_41({
    flat: true,
    bordered: true,
    ...{ class: "bg-grey-1 full-height" },
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.QCardSection;
/** @type {[typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    ...{ class: "q-py-sm" },
}));
const __VLS_46 = __VLS_45({
    ...{ class: "q-py-sm" },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-caption text-grey-5 text-uppercase q-mb-xs" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-body2 text-purple-7" },
    ...{ style: {} },
});
(__VLS_ctx.currentChunk || '');
var __VLS_47;
var __VLS_43;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-12" },
});
const __VLS_48 = {}.QCard;
/** @type {[typeof __VLS_components.QCard, typeof __VLS_components.qCard, typeof __VLS_components.QCard, typeof __VLS_components.qCard, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    flat: true,
    bordered: true,
    ...{ class: "bg-grey-1" },
}));
const __VLS_50 = __VLS_49({
    flat: true,
    bordered: true,
    ...{ class: "bg-grey-1" },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.QCardSection;
/** @type {[typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, typeof __VLS_components.QCardSection, typeof __VLS_components.qCardSection, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ class: "q-py-sm" },
}));
const __VLS_54 = __VLS_53({
    ...{ class: "q-py-sm" },
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row items-center q-mb-xs" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-caption text-grey-5 text-uppercase" },
    ...{ style: {} },
});
if (__VLS_ctx.safeQueue.length) {
    const __VLS_56 = {}.QBadge;
    /** @type {[typeof __VLS_components.QBadge, typeof __VLS_components.qBadge, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        color: "primary",
        label: (__VLS_ctx.safeQueue.length),
    }));
    const __VLS_58 = __VLS_57({
        color: "primary",
        label: (__VLS_ctx.safeQueue.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
}
if (!__VLS_ctx.safeQueue.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-body2 text-grey-5" },
    });
}
else {
    const __VLS_60 = {}.QList;
    /** @type {[typeof __VLS_components.QList, typeof __VLS_components.qList, typeof __VLS_components.QList, typeof __VLS_components.qList, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        dense: true,
    }));
    const __VLS_62 = __VLS_61({
        dense: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_63.slots.default;
    for (const [item, i] of __VLS_getVForSourceType((__VLS_ctx.safeQueue))) {
        const __VLS_64 = {}.QItem;
        /** @type {[typeof __VLS_components.QItem, typeof __VLS_components.qItem, typeof __VLS_components.QItem, typeof __VLS_components.qItem, ]} */ ;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
            key: (i),
            dense: true,
            ...{ class: "q-px-none" },
        }));
        const __VLS_66 = __VLS_65({
            key: (i),
            dense: true,
            ...{ class: "q-px-none" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        __VLS_67.slots.default;
        const __VLS_68 = {}.QItemSection;
        /** @type {[typeof __VLS_components.QItemSection, typeof __VLS_components.qItemSection, typeof __VLS_components.QItemSection, typeof __VLS_components.qItemSection, ]} */ ;
        // @ts-ignore
        const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
            side: true,
            ...{ class: "q-pr-sm" },
            ...{ style: {} },
        }));
        const __VLS_70 = __VLS_69({
            side: true,
            ...{ class: "q-pr-sm" },
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_69));
        __VLS_71.slots.default;
        const __VLS_72 = {}.QBadge;
        /** @type {[typeof __VLS_components.QBadge, typeof __VLS_components.qBadge, ]} */ ;
        // @ts-ignore
        const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
            color: "grey-4",
            textColor: "dark",
            label: (i + 1),
        }));
        const __VLS_74 = __VLS_73({
            color: "grey-4",
            textColor: "dark",
            label: (i + 1),
        }, ...__VLS_functionalComponentArgsRest(__VLS_73));
        var __VLS_71;
        const __VLS_76 = {}.QItemSection;
        /** @type {[typeof __VLS_components.QItemSection, typeof __VLS_components.qItemSection, typeof __VLS_components.QItemSection, typeof __VLS_components.qItemSection, ]} */ ;
        // @ts-ignore
        const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({}));
        const __VLS_78 = __VLS_77({}, ...__VLS_functionalComponentArgsRest(__VLS_77));
        __VLS_79.slots.default;
        const __VLS_80 = {}.QItemLabel;
        /** @type {[typeof __VLS_components.QItemLabel, typeof __VLS_components.qItemLabel, typeof __VLS_components.QItemLabel, typeof __VLS_components.qItemLabel, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            ...{ class: "text-body2 text-grey-7" },
        }));
        const __VLS_82 = __VLS_81({
            ...{ class: "text-body2 text-grey-7" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        __VLS_83.slots.default;
        (item);
        var __VLS_83;
        var __VLS_79;
        var __VLS_67;
    }
    var __VLS_63;
}
var __VLS_55;
var __VLS_51;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "label text-caption text-grey-6" },
});
const __VLS_84 = {}.QInput;
/** @type {[typeof __VLS_components.QInput, typeof __VLS_components.qInput, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    modelValue: (__VLS_ctx.customText),
    type: "textarea",
    disable: (__VLS_ctx.isStreaming),
    outlined: true,
    autogrow: true,
    rows: (5),
}));
const __VLS_86 = __VLS_85({
    modelValue: (__VLS_ctx.customText),
    type: "textarea",
    disable: (__VLS_ctx.isStreaming),
    outlined: true,
    autogrow: true,
    rows: (5),
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
var __VLS_11;
/** @type {__VLS_StyleScopedClasses['q-pb-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-dark']} */ ;
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
/** @type {__VLS_StyleScopedClasses['full-height']} */ ;
/** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-dark']} */ ;
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
/** @type {__VLS_StyleScopedClasses['full-height']} */ ;
/** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-7']} */ ;
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-px-none']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pr-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            stop: stop,
            currentItem: currentItem,
            currentChunk: currentChunk,
            isStreaming: isStreaming,
            safeQueue: safeQueue,
            customText: customText,
            startStreaming: startStreaming,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
