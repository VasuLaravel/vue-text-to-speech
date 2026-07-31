import { ref, watch } from 'vue';
const STORAGE_KEY = 'pg-theme';
const DEFAULT_THEME = 'dark';
// ── Module-level singleton so all consumers share one reactive ref ─────────────
const isDark = ref(true);
// ── Helpers ───────────────────────────────────────────────────────────────────
function applyTheme(value) {
    // SSR guard — document is not available server-side
    if (typeof document === 'undefined')
        return;
    document.documentElement.dataset.theme = value;
}
function readStoredTheme() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light')
            return stored;
    }
    catch {
        // localStorage unavailable (private mode, security policy)
    }
    return null;
}
function persistTheme(value) {
    try {
        localStorage.setItem(STORAGE_KEY, value);
    }
    catch {
        // Ignore — non-critical
    }
}
function getInitialTheme() {
    const stored = readStoredTheme();
    if (stored !== null)
        return stored;
    // First load — respect OS preference
    if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }
    return DEFAULT_THEME;
}
// ── Keep the DOM in sync whenever isDark changes ──────────────────────────────
watch(isDark, (dark) => {
    const value = dark ? 'dark' : 'light';
    applyTheme(value);
    persistTheme(value);
});
// ── Composable ────────────────────────────────────────────────────────────────
export function useTheme() {
    /**
     * Call init() once in the root App component's onMounted.
     * Safe to call multiple times — subsequent calls are no-ops.
     */
    function init() {
        const theme = getInitialTheme();
        isDark.value = theme === 'dark';
        applyTheme(theme);
    }
    function toggle() {
        isDark.value = !isDark.value;
    }
    function setTheme(value) {
        isDark.value = value === 'dark';
    }
    return {
        /** Reactive dark-mode flag. `true` = dark, `false` = light. */
        isDark,
        init,
        toggle,
        setTheme,
    };
}
