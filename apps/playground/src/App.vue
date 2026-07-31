<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import AppHeader from './components/AppHeader.vue'
import { useTheme } from './composables/useTheme'

// ── Theme ─────────────────────────────────────────────────────────────────────
const { init: initTheme } = useTheme()

// ── Active tab — persisted to sessionStorage ──────────────────────────────────
const TAB_KEY = 'pg-active-tab'
const VALID_TABS = ['overview', 'chat', 'synthesis', 'recognition', 'streaming', 'queue', 'components', 'setup'] as const
type TabName = typeof VALID_TABS[number]

function readActiveTab(): TabName {
  try {
    const stored = sessionStorage.getItem(TAB_KEY)
    if (stored && (VALID_TABS as readonly string[]).includes(stored)) {
      return stored as TabName
    }
  } catch { /* sessionStorage unavailable */ }
  return 'overview'
}

const activeTab = ref<TabName>(readActiveTab())

function setTab(name: string): void {
  if (!(VALID_TABS as readonly string[]).includes(name)) return
  activeTab.value = name as TabName
  try {
    sessionStorage.setItem(TAB_KEY, name)
  } catch { /* ignore */ }
}

// ── Lazy-loaded tab components ─────────────────────────────────────────────────
const OverviewTab    = defineAsyncComponent(() => import('./tabs/OverviewTab.vue'))
const ChatAgentTab   = defineAsyncComponent(() => import('./tabs/ChatAgentTab.vue'))
const SynthesisTab   = defineAsyncComponent(() => import('./tabs/SynthesisTab.vue'))
const RecognitionTab = defineAsyncComponent(() => import('./tabs/RecognitionTab.vue'))
const StreamingTab   = defineAsyncComponent(() => import('./tabs/StreamingTab.vue'))
const VoiceQueueTab  = defineAsyncComponent(() => import('./tabs/VoiceQueueTab.vue'))
const ComponentsTab  = defineAsyncComponent(() => import('./tabs/ComponentsTab.vue'))
const SetupTab       = defineAsyncComponent(() => import('./tabs/SetupTab.vue'))

// ── Keyboard shortcut overlay (P4.4) ─────────────────────────────────────────
const dialogEl = ref<HTMLDialogElement | null>(null)
const shortcutsOpen = ref(false)

function openShortcuts() {
  shortcutsOpen.value = true
  dialogEl.value?.showModal?.()
}

function closeShortcuts() {
  shortcutsOpen.value = false
  dialogEl.value?.close?.()
}

/** Close when the user clicks the ::backdrop (outside the panel box). */
function onDialogBackdropClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLDialogElement).getBoundingClientRect()
  if (
    e.clientX < rect.left || e.clientX > rect.right ||
    e.clientY < rect.top  || e.clientY > rect.bottom
  ) {
    closeShortcuts()
  }
}

function onDocKeydown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement
  const inInput =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement

  if (e.key === '?' && !inInput) {
    e.preventDefault()
    shortcutsOpen.value ? closeShortcuts() : openShortcuts()
  }
  if (e.key === 'Escape') {
    if (shortcutsOpen.value) closeShortcuts()
    // Stop all speech globally — Web Speech + any HTMLAudioElement providers
    window.speechSynthesis?.cancel()
    document.querySelectorAll<HTMLAudioElement>('audio').forEach(a => { a.pause(); a.currentTime = 0 })
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  initTheme()
  document.addEventListener('keydown', onDocKeydown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onDocKeydown)
})

// ── Shortcut list ─────────────────────────────────────────────────────────────
const SHORTCUTS = [
  { key: '1–8',       desc: 'Switch to tab 1–8'                },
  { key: 'Space',     desc: 'Play / Pause (Synthesis tab)'      },
  { key: 'Esc',       desc: 'Stop speech / Close overlay'       },
  { key: '?',         desc: 'Toggle this keyboard shortcut help' },
  { key: 'Enter',     desc: 'Send message (Chat tab input)'     },
  { key: 'Shift+Enter', desc: 'New line in Chat input'          },
]
</script>

<template>
  <div class="pg-app">
    <!-- Sticky header + tab bar -->
    <AppHeader
      :active-tab="activeTab"
      @tab-change="setTab"
      @open-shortcuts="openShortcuts"
    />

    <!-- Tab panels — each is lazily mounted and kept alive once activated -->
    <main class="pg-main">
      <q-tab-panels
        v-model="activeTab"
        animated
        transition-prev="pg-tab-leave"
        transition-next="pg-tab-enter"
        class="pg-panels"
      >
        <q-tab-panel name="overview" class="pg-panel">
          <keep-alive>
            <OverviewTab v-if="activeTab === 'overview'" @navigate-to-tab="setTab" />
          </keep-alive>
        </q-tab-panel>

        <q-tab-panel name="chat" class="pg-panel">
          <keep-alive>
            <ChatAgentTab v-if="activeTab === 'chat'" />
          </keep-alive>
        </q-tab-panel>

        <q-tab-panel name="synthesis" class="pg-panel">
          <keep-alive>
            <SynthesisTab v-if="activeTab === 'synthesis'" />
          </keep-alive>
        </q-tab-panel>

        <q-tab-panel name="recognition" class="pg-panel">
          <keep-alive>
            <RecognitionTab v-if="activeTab === 'recognition'" />
          </keep-alive>
        </q-tab-panel>

        <q-tab-panel name="streaming" class="pg-panel">
          <keep-alive>
            <StreamingTab v-if="activeTab === 'streaming'" />
          </keep-alive>
        </q-tab-panel>

        <q-tab-panel name="queue" class="pg-panel">
          <keep-alive>
            <VoiceQueueTab v-if="activeTab === 'queue'" />
          </keep-alive>
        </q-tab-panel>

        <q-tab-panel name="components" class="pg-panel">
          <keep-alive>
            <ComponentsTab v-if="activeTab === 'components'" />
          </keep-alive>
        </q-tab-panel>

        <q-tab-panel name="setup" class="pg-panel">
          <keep-alive>
            <SetupTab v-if="activeTab === 'setup'" />
          </keep-alive>
        </q-tab-panel>
      </q-tab-panels>
    </main>

    <!-- ── Keyboard shortcut overlay (P4.4) ──────────────────────────────── -->
    <dialog
      ref="dialogEl"
      class="pg-shortcuts-dialog"
      aria-label="Keyboard shortcuts"
      aria-modal="true"
      @click="onDialogBackdropClick"
    >
      <div class="pg-shortcuts-panel" role="document">
        <div class="pg-shortcuts-header">
          <h2 class="pg-shortcuts-title">Keyboard Shortcuts</h2>
          <button
            class="pg-shortcuts-close"
            aria-label="Close shortcuts overlay"
            @click="closeShortcuts"
          >✕</button>
        </div>
        <dl class="pg-shortcuts-list">
          <div v-for="s in SHORTCUTS" :key="s.key" class="pg-shortcut-row">
            <dt class="pg-shortcut-key"><kbd>{{ s.key }}</kbd></dt>
            <dd class="pg-shortcut-desc">{{ s.desc }}</dd>
          </div>
        </dl>
        <p class="pg-shortcuts-hint">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</p>
      </div>
    </dialog>
  </div>
</template>

<style>
/* Global resets that need no scoping */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body, #app {
  margin: 0;
  padding: 0;
  min-height: 100dvh;
}

/* Tab panel crossfade (Quasar custom transition names, P4.2) */
.pg-tab-enter-enter-active,
.pg-tab-leave-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.pg-tab-enter-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.pg-tab-leave-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<style scoped>
.pg-app {
  min-height: 100dvh;
  background: var(--pg-bg);
  color: var(--pg-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
}

.pg-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
}

.pg-panels {
  background: transparent !important;
}

.pg-panel {
  /* Remove Quasar default padding so each tab controls its own layout */
  padding: 0 !important;
  background: transparent !important;
}

/* ── Shortcut dialog ─────────────────────────────────────────────────────── */
.pg-shortcuts-dialog {
  /* Reset native dialog chrome — do NOT set display here; native <dialog>
     uses display:none when closed and showModal() restores it correctly. */
  border: none;
  background: transparent;
  padding: 0;
  max-width: min(480px, 95vw);
  max-height: 90vh;
  /* margin:auto centers it in the viewport when opened with showModal() */
  margin: auto;
}

.pg-shortcuts-dialog::backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.pg-shortcuts-panel {
  background: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius);
  box-shadow: var(--pg-shadow);
  padding: 28px 32px;
  min-width: 340px;
  max-width: 480px;
  width: 100%;
  animation: shortcuts-in 0.18s ease;
}

@keyframes shortcuts-in {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    }
}

.pg-shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.pg-shortcuts-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--pg-text);
  margin: 0;
}

.pg-shortcuts-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--pg-text-muted);
  font-size: 1rem;
  width: 28px;
  height: 28px;
  border-radius: var(--pg-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.pg-shortcuts-close:hover { background: var(--pg-surface-2); color: var(--pg-text); }

.pg-shortcuts-list {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pg-shortcut-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pg-shortcut-key {
  flex-shrink: 0;
  min-width: 90px;
}

kbd {
  display: inline-block;
  padding: 3px 8px;
  font-family: ui-monospace, 'SF Mono', 'Consolas', monospace;
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--pg-surface-2);
  border: 1px solid var(--pg-border);
  border-radius: 5px;
  color: var(--pg-primary);
  white-space: nowrap;
}

.pg-shortcut-desc {
  font-size: 0.85rem;
  color: var(--pg-text-muted);
  margin: 0;
}

.pg-shortcuts-hint {
  margin: 18px 0 0;
  font-size: 0.75rem;
  color: var(--pg-text-muted);
  text-align: center;
  border-top: 1px solid var(--pg-border);
  padding-top: 14px;
}
</style>
