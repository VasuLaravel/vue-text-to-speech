<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme } from '../composables/useTheme'

// ── Props & emits ─────────────────────────────────────────────────────────────
const props = defineProps<{ activeTab: string }>()

const emit = defineEmits<{
  (e: 'tab-change', tab: string): void
  (e: 'open-shortcuts'): void
}>()

// ── Theme ─────────────────────────────────────────────────────────────────────
const { isDark, toggle } = useTheme()

// ── Tab definitions ───────────────────────────────────────────────────────────
const tabs = [
  { name: 'overview',    label: 'Overview'      },
  { name: 'chat',        label: 'AI Chat Agent' },
  { name: 'synthesis',   label: 'Synthesis'     },
  { name: 'recognition', label: 'Recognition'   },
  { name: 'streaming',   label: 'Streaming'     },
  { name: 'queue',       label: 'Queue'         },
  { name: 'components',  label: 'Components'    },
  { name: 'setup',       label: 'Setup'         },
] as const

// ── Tab button refs for mobile scroll-into-view (P4.7) ───────────────────────
const tabbarEl = ref<HTMLElement | null>(null)
const tabBtnRefs: Record<string, HTMLButtonElement | null> = {}

function setTabRef(name: string, el: HTMLButtonElement | null) {
  tabBtnRefs[name] = el
}

watch(() => props.activeTab, (name) => {
  // Scroll the active tab button into view on mobile (P4.7)
  const btn = tabBtnRefs[name]
  if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
})

// ── Keyboard shortcut: 1–8 for tabs (P4.4 — owned here, doc-level) ───────────
function onKeydown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) return

  const idx = parseInt(e.key, 10)
  if (idx >= 1 && idx <= 8) {
    e.preventDefault()
    emit('tab-change', tabs[idx - 1].name)
  }
  // '?' is handled in App.vue to also open the dialog
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', onKeydown)
}
</script>

<template>
  <!-- ── Sticky header shell ──────────────────────────────────────────────── -->
  <header class="pg-header">
    <div class="pg-header__inner">

      <!-- Logo -->
      <div class="pg-header__logo" aria-label="Vue Text to Speech Playground">
        <span class="pg-header__logo-icon" aria-hidden="true">◈</span>
        <span class="pg-header__logo-text">vue-text-to-speech</span>
        <span class="pg-header__version-chip">v2.0.3</span>
      </div>

      <!-- Tab bar (scrollable on mobile) -->
      <nav
        ref="tabbarEl"
        class="pg-tabbar pg-scroll-x"
        role="tablist"
        aria-label="Playground sections"
      >
        <button
          v-for="(tab, i) in tabs"
          :key="tab.name"
          :ref="(el) => setTabRef(tab.name, el as HTMLButtonElement | null)"
          role="tab"
          :aria-selected="activeTab === tab.name"
          :aria-label="`${tab.label} (press ${i + 1})`"
          class="pg-tab"
          :class="{ 'pg-tab--active': activeTab === tab.name }"
          @click="emit('tab-change', tab.name)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Right-side controls -->
      <div class="pg-header__controls">
        <!-- Keyboard shortcuts hint (P4.4) -->
        <button
          class="pg-icon-btn pg-icon-btn--hint"
          aria-label="Open keyboard shortcuts (press ?)"
          title="Keyboard shortcuts (?)"
          @click="emit('open-shortcuts')"
        >
          <span aria-hidden="true" class="pg-icon-btn__kbd">?</span>
        </button>

        <!-- Dark / Light toggle -->
        <button
          class="pg-icon-btn"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          :title="isDark ? 'Light mode' : 'Dark mode'"
          @click="toggle"
        >
          <span aria-hidden="true">{{ isDark ? '☀' : '🌙' }}</span>
        </button>

        <!-- NPM link -->
        <a
          href="https://www.npmjs.com/package/vue-text-to-speech?activeTab=readme"
          target="_blank"
          rel="noopener noreferrer"
          class="pg-link-btn"
          aria-label="View on NPM (opens in new tab)"
          title="NPM"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 18 7" fill="currentColor">
            <path d="M0 0h18v6H9V1H7v5H0zm1 5h4V1H1zm6-4v4h2V2h2v3h1V1z"/>
          </svg>
          <span>NPM</span>
        </a>

        <!-- Docs link -->
        <a
          href="https://vue-text-to-speech-docs.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          class="pg-link-btn"
          aria-label="View documentation (opens in new tab)"
          title="Docs"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>Docs</span>
        </a>

        <!-- GitHub link -->
        <a
          href="https://github.com/VasuLaravel/vue-text-to-speech"
          target="_blank"
          rel="noopener noreferrer"
          class="pg-icon-btn"
          aria-label="View source on GitHub (opens in new tab)"
          title="GitHub"
        >
          <svg
            aria-hidden="true"
            width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
      </div>

    </div>
  </header>
</template>

<style scoped>
/* ── Header shell ──────────────────────────────────────────────────────────── */
.pg-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--pg-surface);
  border-bottom: 1px solid var(--pg-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.pg-header__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  height: 56px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Logo ─────────────────────────────────────────────────────────────────── */
.pg-header__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pg-header__logo-icon {
  font-size: 1.25rem;
  color: var(--pg-primary);
  line-height: 1;
}

.pg-header__logo-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--pg-text);
  white-space: nowrap;
}

.pg-header__version-chip {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 99px;
  background: var(--pg-primary-dim);
  color: var(--pg-primary);
  letter-spacing: 0.02em;
}

@media (max-width: 600px) {
  .pg-header__logo-text,
  .pg-header__version-chip { display: none; }
  .pg-header__inner { padding: 0 12px; gap: 8px; }
}

/* ── Tab bar ──────────────────────────────────────────────────────────────── */
.pg-tabbar {
  display: flex;
  align-items: stretch;
  gap: 0;
  flex: 1;
  min-width: 0;
  scroll-snap-type: x mandatory;
  height: 56px;
}

.pg-tab {
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 14px;
  height: 100%;
  white-space: nowrap;
  scroll-snap-align: start;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--pg-text-muted);
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.pg-tab:hover { color: var(--pg-text); }

.pg-tab--active {
  color: var(--pg-primary);
  border-bottom-color: var(--pg-primary);
  font-weight: 600;
}

/* ── Right-side controls ──────────────────────────────────────────────────── */
.pg-header__controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.pg-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--pg-radius-sm);
  color: var(--pg-text-muted);
  font-size: 1.1rem;
  transition: background 0.15s ease, color 0.15s ease;
}

.pg-icon-btn:hover {
  background: var(--pg-surface-2);
  color: var(--pg-text);
}

.pg-icon-btn--hint { font-size: 0.9rem; }
.pg-icon-btn__kbd {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-weight: 700;
  font-size: 0.85rem;
}

/* ── Text link buttons (NPM, Docs) ───────────────────────────────────── */
.pg-link-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  height: 30px;
  border-radius: var(--pg-radius-sm);
  border: 1px solid var(--pg-border);
  background: none;
  color: var(--pg-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  letter-spacing: 0.02em;
}
.pg-link-btn:hover {
  background: var(--pg-surface-2);
  color: var(--pg-text);
  border-color: var(--pg-primary);
}

@media (max-width: 600px) {
  .pg-link-btn span { display: none; }
  .pg-link-btn { width: 30px; padding: 0; justify-content: center; }
}
</style>
