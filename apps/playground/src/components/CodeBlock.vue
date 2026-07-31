<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '../composables/useToast'

// ── Props ──────────────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  /** The source code string to display. */
  code: string
  /** Language label shown in the badge (display only — no runtime highlighting engine). */
  language?: string
}>(), {
  language: 'typescript',
})

// ── Copy state ────────────────────────────────────────────────────────────────

const { success: toastSuccess, error: toastError } = useToast()
const copied = ref(false)
let copyResetTimer: ReturnType<typeof setTimeout> | null = null

async function copyCode(): Promise<void> {
  // Primary path: Clipboard API (E-P2.4a)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(props.code)
      showCopied()
      toastSuccess('Copied to clipboard')
      return
    } catch {
      // Fall through to legacy path
    }
  }

  // Legacy fallback: document.execCommand (deprecated but still works in many browsers)
  try {
    const textarea = document.createElement('textarea')
    textarea.value = props.code
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (success) {
      showCopied()
      toastSuccess('Copied to clipboard')
    } else {
      showFailed()
    }
  } catch {
    showFailed()
  }
}

function showCopied(): void {
  copied.value = true
  if (copyResetTimer) clearTimeout(copyResetTimer)
  copyResetTimer = setTimeout(() => {
    copied.value = false
    copyResetTimer = null
  }, 2000)
}

function showFailed(): void {
  toastError('Copy failed — please copy manually')
  if (copyResetTimer) clearTimeout(copyResetTimer)
  copyResetTimer = setTimeout(() => {
    copied.value = false
    copyResetTimer = null
  }, 1500)
}

// ── Syntax tokenizer ───────────────────────────────────────────────────────────
// No innerHTML — all tokens rendered as Vue-bound <span> elements (S-6).

type TokenType =
  | 'comment'
  | 'string'
  | 'keyword'
  | 'type-name'
  | 'number'
  | 'function-call'
  | 'plain'

interface Token {
  type: TokenType
  text: string
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
])

const TS_TYPES = new Set([
  'string', 'number', 'boolean', 'object', 'symbol', 'bigint',
  'any', 'unknown', 'never', 'void', 'Promise', 'Array', 'Record',
  'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude',
  'Extract', 'NonNullable', 'ReturnType', 'InstanceType',
  'Ref', 'ComputedRef', 'AsyncGenerator',
])

// Master regex — order matters (first match wins per token)
// Groups: comment | template-string | double-string | single-string | word | number | non-word
const TOKEN_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b[A-Za-z_$][A-Za-z0-9_$]*\b|\d+(?:\.\d+)?|[^A-Za-z0-9_$\s]|\s+)/g

function classifyWord(word: string): TokenType {
  if (TS_KEYWORDS.has(word)) return 'keyword'
  if (TS_TYPES.has(word)) return 'type-name'
  // Heuristic: CapitalCase words → type names
  if (/^[A-Z][a-zA-Z0-9]*$/.test(word)) return 'type-name'
  return 'plain'
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = []
  let match: RegExpExecArray | null

  TOKEN_RE.lastIndex = 0

  while ((match = TOKEN_RE.exec(code)) !== null) {
    const text = match[0]
    if (!text) continue

    let type: TokenType

    if (text.startsWith('//') || text.startsWith('/*')) {
      type = 'comment'
    } else if (text[0] === '"' || text[0] === "'" || text[0] === '`') {
      type = 'string'
    } else if (/^\d/.test(text)) {
      type = 'number'
    } else if (/^[A-Za-z_$]/.test(text)) {
      type = classifyWord(text)
    } else {
      type = 'plain'
    }

    // Detect function calls: word immediately followed by '('
    // We do a lookahead in the raw string using index
    if (type === 'plain' && /^[A-Za-z_$]/.test(text)) {
      const after = code[match.index + text.length]
      if (after === '(') type = 'function-call'
    }
    if (type === 'keyword') {
      // Keywords before '(' are still keywords, not function calls
    } else if (type !== 'comment' && type !== 'string' && type !== 'number' && /^[A-Za-z_$]/.test(text)) {
      const after = code[match.index + text.length]
      if (after === '(') type = 'function-call'
    }

    tokens.push({ type, text })
  }

  return tokens
}

const tokens = computed<Token[]>(() => tokenize(props.code))
</script>

<template>
  <div class="pg-codeblock">
    <!-- Header row: language badge + copy button -->
    <div class="pg-codeblock__header">
      <span class="pg-codeblock__lang">{{ language }}</span>
      <button
        class="pg-codeblock__copy"
        :aria-label="copied ? 'Code copied!' : 'Copy code to clipboard'"
        :title="copied ? 'Copied!' : 'Copy'"
        @click="copyCode"
      >
        <!-- Checkmark when copied, otherwise clipboard icon -->
        <span v-if="copied" aria-hidden="true">✓</span>
        <svg v-else aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>

    <!-- Code body: tokens rendered as spans — no innerHTML (S-6) -->
    <pre class="pg-codeblock__pre" tabindex="0"><code class="pg-codeblock__code"><span
        v-for="(token, i) in tokens"
        :key="i"
        :class="`pg-token pg-token--${token.type}`"
      >{{ token.text }}</span></code></pre>
  </div>
</template>

<style scoped>
/* ── Outer shell ──────────────────────────────────────────────────────────── */
.pg-codeblock {
  border-radius: var(--pg-radius-sm);
  border: 1px solid var(--pg-border);
  overflow: hidden;
  background: var(--pg-surface-2);
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.pg-codeblock__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--pg-surface);
  border-bottom: 1px solid var(--pg-border);
}

.pg-codeblock__lang {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pg-text-muted);
}

.pg-codeblock__copy {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid var(--pg-border);
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--pg-text-muted);
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.pg-codeblock__copy:hover {
  color: var(--pg-text);
  border-color: var(--pg-primary);
  background: var(--pg-primary-dim);
}

.pg-codeblock__copy:focus-visible {
  outline: 2px solid var(--pg-primary);
  outline-offset: 2px;
}

/* ── Code block — E-P2.4b: overflow-x: auto for long lines ───────────────── */
.pg-codeblock__pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;        /* E-P2.4b */
  white-space: pre;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.82rem;
  line-height: 1.6;
  background: var(--pg-surface-2);
  color: var(--pg-text);
}

.pg-codeblock__code {
  display: block;
}

/* ── Token colors ─────────────────────────────────────────────────────────── */
.pg-token--keyword      { color: #818cf8; font-weight: 600; } /* indigo-400 */
.pg-token--string       { color: #86efac; }                    /* green-300 */
.pg-token--comment      { color: var(--pg-text-muted); font-style: italic; }
.pg-token--type-name    { color: #67e8f9; }                    /* cyan-300 */
.pg-token--number       { color: #fca5a5; }                    /* red-300 */
.pg-token--function-call{ color: #fde68a; }                    /* amber-200 */
.pg-token--plain        { color: var(--pg-text); }
</style>
