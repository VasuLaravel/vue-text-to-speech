import { ref, watch } from 'vue'

// ── Types ─────────────────────────────────────────────────────────────────────

type ThemeValue = 'dark' | 'light'

const STORAGE_KEY = 'pg-theme'
const DEFAULT_THEME: ThemeValue = 'dark'

// ── Module-level singleton so all consumers share one reactive ref ─────────────

const isDark = ref(true)

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyTheme(value: ThemeValue): void {
  // SSR guard — document is not available server-side
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = value
}

function readStoredTheme(): ThemeValue | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // localStorage unavailable (private mode, security policy)
  }
  return null
}

function persistTheme(value: ThemeValue): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Ignore — non-critical
  }
}

function getInitialTheme(): ThemeValue {
  const stored = readStoredTheme()
  if (stored !== null) return stored

  // First load — respect OS preference
  if (typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }

  return DEFAULT_THEME
}

// ── Keep the DOM in sync whenever isDark changes ──────────────────────────────

watch(isDark, (dark) => {
  const value: ThemeValue = dark ? 'dark' : 'light'
  applyTheme(value)
  persistTheme(value)
})

// ── Composable ────────────────────────────────────────────────────────────────

export function useTheme() {
  /**
   * Call init() once in the root App component's onMounted.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  function init(): void {
    const theme = getInitialTheme()
    isDark.value = theme === 'dark'
    applyTheme(theme)
  }

  function toggle(): void {
    isDark.value = !isDark.value
  }

  function setTheme(value: ThemeValue): void {
    isDark.value = value === 'dark'
  }

  return {
    /** Reactive dark-mode flag. `true` = dark, `false` = light. */
    isDark,
    init,
    toggle,
    setTheme,
  }
}
