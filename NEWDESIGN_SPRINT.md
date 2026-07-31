# Playground Redesign — "Voice Agent Studio" Sprint Plan

**Branch:** `playground`  
**Date:** July 2026  
**Source:** `REDESIGN.md`  
**Scope:** Full rewrite of `apps/playground/` only. Zero changes to `packages/vue-text-to-speech/`.

---

## Pre-Sprint Decisions

| # | Decision | Resolution |
|---|---|---|
| D-1 | CSS architecture | Native CSS custom properties (`--pg-*`) on `:root[data-theme]` — no CSS-in-JS, no Tailwind |
| D-2 | Animation library | `gsap@3` for entrance/transition animations; CSS keyframes for micro-animations (pulse rings, mic shake) |
| D-3 | Utility library | `@vueuse/core` for `useLocalStorage`, `useMediaQuery`, `useEventListener` — do not re-implement |
| D-4 | Tab persistence | `sessionStorage` key `pg-active-tab`; active tab is the name string, not an index |
| D-5 | Theme persistence | `localStorage` key `pg-theme`; value `"dark"` or `"light"`; SSR-safe (read in `onMounted`) |
| D-6 | Simulated LLM | `AsyncGenerator<string>` with configurable `ms/token`; no real HTTP calls unless API key supplied |
| D-7 | Real OpenAI mode | `fetch()` to `https://api.openai.com/v1/chat/completions` with `stream: true`; SSE line parsing; never log keys |
| D-8 | Code highlighting | Quasar `q-badge` + `pre`/`code` with manual token coloring — no Prism/Shiki bundle bloat |
| D-9 | Component isolation | All tab SFCs are self-contained; shared composables only via `src/composables/`; no prop-drilling between tabs |
| D-10 | Quasar coexistence | Existing Quasar `q-*` components are allowed inside tab panels; `AppHeader` uses native HTML + CSS for full design control |

---

## Dependency Map

```
Phase 1 (Foundation)
  └─► Phase 2 (Shared Infrastructure)
        └─► Phase 3 (All 8 Tabs — parallelizable after P2 complete)
              └─► Phase 4 (Polish — applied last)
```

Tab-level dependency notes:
- **ChatAgentTab** depends on `useSimulatedLLM` (P2.3) and `WaveformCanvas` (P2.2)
- **SynthesisTab** depends on `useAudioVisualizer` (P2.1) and `WaveformCanvas` (P2.2)
- **RecognitionTab** depends on `useAudioVisualizer` (P2.1)
- **StreamingTab** depends on `useSimulatedLLM` (P2.3) and `WaveformCanvas` (P2.2)
- **VoiceQueueTab** depends on `WaveformCanvas` (P2.2)
- **OverviewTab**, **ComponentsTab**, **SetupTab** — no P2 dependencies except `CodeBlock` (P2.4)

---

## Phase 1 — Foundation

> **Gate:** All Phase 2 and Phase 3 work is blocked until this phase is complete and verified.

### Tasks

| # | Task | Output | Acceptance Criteria |
|---|---|---|---|
| P1.1 | Add `gsap` and `@vueuse/core` to `apps/playground/package.json` | Updated `package.json` | `pnpm install` completes; `import gsap from 'gsap'` and `import { useLocalStorage } from '@vueuse/core'` resolve without TS errors |
| P1.2 | Create `apps/playground/src/styles/theme.css` — full dark + light CSS custom property token set | `theme.css` | All 10 dark tokens and 8 light tokens defined; applied at `:root[data-theme="dark"]` and `:root[data-theme="light"]`; imported in `main.ts` before Quasar styles |
| P1.3 | Create `apps/playground/src/composables/useTheme.ts` | `useTheme.ts` | `isDark` is a `Ref<boolean>`; `toggle()` flips theme; persists to `localStorage` key `pg-theme`; `init()` reads storage and sets `document.documentElement.dataset.theme` on mount; SSR-safe (no `document` access at module scope) |
| P1.4 | Create `apps/playground/src/components/AppHeader.vue` | `AppHeader.vue` | Renders logo text, 8-tab buttons, dark/light toggle icon button, GitHub link (`target="_blank" rel="noopener noreferrer"`), version chip; active tab highlighted with `--pg-primary` underline; sticky (`position: sticky; top: 0; z-index: 100`); emits `tab-change` event with tab name |
| P1.5 | Rewrite `apps/playground/src/App.vue` as minimal tab shell | `App.vue` | Imports `AppHeader`; renders `<q-tab-panels>` with `keep-alive` per panel; 8 panels correspond to 8 tabs; active tab synced with `sessionStorage`; on tab change, `sessionStorage.setItem('pg-active-tab', name)` is called |

### Edge Cases — Phase 1

| ID | Scenario | Handling |
|---|---|---|
| E-P1.1 | `gsap` SSR import — GSAP accesses `window` at module scope | Use `import gsap from 'gsap'` inside `onMounted` or guard with `if (typeof window !== 'undefined')` — even though playground is CSR-only, guard future-proofs it |
| E-P1.2 | `theme.css` imported after Quasar — Quasar's `q-*` classes override `--pg-*` vars on some elements | Import `theme.css` before Quasar plugin in `main.ts`; all `--pg-*` vars are scoped to `[data-theme]` so specificity is not an issue |
| E-P1.3 | First load with no `localStorage` entry — `useTheme` must default to dark | Default: `'dark'`; if `localStorage.getItem('pg-theme')` is `null`, treat as `'dark'` |
| E-P1.3b | User's OS prefers light (`prefers-color-scheme: light`) but no localStorage entry exists | On first load only (no stored pref), respect OS preference via `window.matchMedia('(prefers-color-scheme: dark)').matches`; subsequent loads use stored pref |
| E-P1.4 | Tab bar overflows at < 768px | Tab buttons overflow horizontally with `overflow-x: auto; scroll-snap-type: x mandatory`; no wrapping; hide scrollbar with `::-webkit-scrollbar { display: none }` |
| E-P1.4b | GitHub link opens in same tab accidentally | Always `target="_blank"` with `rel="noopener noreferrer"` to prevent opener access |
| E-P1.5 | `sessionStorage` not available (private mode iOS Safari) | Wrap all `sessionStorage` calls in try/catch; fall back to in-memory `ref` |
| E-P1.5b | User navigates directly to a tab via hash (future feature) | Reserve hash-based routing support: `AppHeader` reads `location.hash` on mount and maps to tab name if valid |

---

## Phase 2 — Shared Infrastructure

> Build once, used by all 8 tabs. Must complete before any tab SFC is scaffolded.

### Tasks

| # | Task | Output | Acceptance Criteria |
|---|---|---|---|
| P2.1 | Create `apps/playground/src/composables/useAudioVisualizer.ts` | `useAudioVisualizer.ts` | Accepts `Ref<MediaStream \| HTMLAudioElement \| null>`; returns `{ analyzerData: Readonly<Ref<Uint8Array>>, isActive: Readonly<Ref<boolean>>, start(), stop() }`; uses `AudioContext` → `AnalyserNode` → `requestAnimationFrame` loop; `stop()` cancels RAF and disconnects nodes; no memory leak on unmount (`onUnmounted` calls `stop()`) |
| P2.2 | Create `apps/playground/src/components/WaveformCanvas.vue` | `WaveformCanvas.vue` | Props: `data: Uint8Array`, `color: string` (default `'#6366f1'`), `height: number` (default `64`), `barCount: number` (default `40`); renders animated bars via `requestAnimationFrame` + `canvas 2D`; idle state (empty `Uint8Array`) shows gentle pulse animation; `canvas` sized via `ResizeObserver` for responsiveness |
| P2.3 | Create `apps/playground/src/composables/useSimulatedLLM.ts` | `useSimulatedLLM.ts` | Exports `useSimulatedLLM(persona, msPerToken?)`; returns `{ stream: AsyncGenerator<string>, start(), stop(), isStreaming: Ref<boolean> }`; 3 personas: `helpful-assistant`, `code-tutor`, `story-narrator`; each persona has ≥ 3 scripted multi-sentence responses; `stop()` calls `controller.abort()` on the internal `AbortController`; generator yields individual characters or small chunks (4–8 chars) to simulate realistic tokenization |
| P2.4 | Create `apps/playground/src/components/CodeBlock.vue` | `CodeBlock.vue` | Props: `code: string`, `language: string` (default `'typescript'`); renders in a `pre` with `--pg-surface-2` background; one-click copy via `navigator.clipboard.writeText()`; copy button shows checkmark for 2s after copy then resets; `language` shown as badge top-right; no external syntax highlighting lib required — static string coloring with CSS classes is acceptable |

### Edge Cases — Phase 2

| ID | Scenario | Handling |
|---|---|---|
| E-P2.1a | Browser blocks `AudioContext` before user gesture | `AudioContext` must be created inside a user-initiated event handler (not on mount); `useAudioVisualizer` defers `new AudioContext()` to first call of `start()` |
| E-P2.1b | `MediaStream` source disconnected mid-visualization | `AnalyserNode` continues reading zeros; waveform shows flat line — acceptable; `isActive` remains `true` until `stop()` is called |
| E-P2.1c | Multiple `useAudioVisualizer` instances created simultaneously | Each instance creates its own `AudioContext`; no shared state — safe but potentially wasteful; document in composable JSDoc |
| E-P2.1d | `HTMLAudioElement` cross-origin source (e.g., Azure/ElevenLabs audio) | `createMediaElementSource` will throw `SecurityError` if the audio element plays a cross-origin URL without CORS headers; catch the error, set `isActive` to `false`, log a warning |
| E-P2.2a | `canvas` element not yet mounted when `data` prop first arrives | Use `onMounted` + `watch(data, draw)`; guard `draw()` with `if (!canvas.value) return` |
| E-P2.2b | `barCount` changed at runtime | `watch(barCount, () => redraw())` — recomputes bar width on the fly |
| E-P2.2c | Zero-length `Uint8Array` (before any audio) | Show idle state: bars at 20% height with a slow breathing animation (CSS `@keyframes`) |
| E-P2.3a | Persona script text contains sentence fragments that confuse `pipeStream` | Ensure all scripted responses end with `.`, `?`, or `!`; no trailing whitespace |
| E-P2.3b | `stop()` called before generator starts | `AbortController` signal is already aborted; the generator checks `signal.aborted` at first iteration and exits immediately |
| E-P2.4a | `navigator.clipboard` unavailable (HTTP, Firefox without user gesture) | Catch `DOMException`; fall back to `document.execCommand('copy')` deprecated path; if that also fails, show "Copy failed" toast |
| E-P2.4b | Very long code strings overflow the `pre` block | Set `overflow-x: auto` on `pre`; `white-space: pre` preserves formatting |

---

## Phase 3 — Tabs

> All 8 tab SFCs can be developed in parallel once Phase 2 is complete.  
> Each tab SFC lives in `apps/playground/src/tabs/`.

---

### Tab 1 — Overview (`OverviewTab.vue`)

**Purpose:** First impression + one-line live demo.

#### Tasks

| # | Task | Acceptance Criteria |
|---|---|---|
| T1.1 | Animated hero with `WaveformCanvas` | `WaveformCanvas` renders at full width; bars animate when `useSpeechSynthesis().isSpeaking` is `true`; idle state shows breathing animation |
| T1.2 | Inline live demo — textarea + Play button | `useSpeechSynthesis` wired to Web Speech (no provider config needed); Play button calls `speak()`; button becomes Stop while speaking; waveform reacts |
| T1.3 | Feature grid — 4 cards | Cards: *4 Composables*, *3 Components*, *4+ Providers*, *LLM Streaming*; each card is a `<button>` that emits `navigate-to-tab` with the target tab name; cards use `--pg-surface` background |
| T1.4 | "Used in" CTA banner | Banner linking to Chat Agent tab; styled with `--pg-primary` accent border |
| T1.5 | Status chips row | "192 tests passing · SSR-safe · TypeScript · MIT" — static text in chip components |

#### Edge Cases — Tab 1

| ID | Scenario | Handling |
|---|---|---|
| E-T1.1 | Web Speech not supported in browser (Chrome for Android, Firefox without flag) | Show `q-banner` with `bg-warning`: "Web Speech API not supported. Switch to an AI provider in the Setup tab." |
| E-T1.2 | User hits Play on empty textarea | Disable Play button when `ttsText.value.trim() === ''`; add `aria-disabled` attribute |
| E-T1.3 | Navigation card click — `App.vue` must respond | Emit `navigate-to-tab` event from `OverviewTab`; `App.vue` listens and sets active tab |
| E-T1.4 | Multiple rapid Play button clicks | Guard with `if (isSpeaking.value) return` — or debounce; do not enqueue duplicates |

---

### Tab 2 — AI Chat Agent (`ChatAgentTab.vue`)

**Purpose:** Showstopper demo — streaming LLM response → TTS pipeline.

#### Tasks

| # | Task | Acceptance Criteria |
|---|---|---|
| T2.1 | Two-column layout | Left 30%: persona selector + provider badge + "Connect Real AI" toggle; Right 70%: chat thread + input bar; collapses to single column at < 768px |
| T2.2 | Chat thread component | User messages aligned right (indigo bubble); AI messages aligned left (surface-2 bubble); auto-scroll to latest message; `aria-live="polite"` on thread container |
| T2.3 | Input bar | Textarea (single line, enter-to-send); Send button; disabled while AI is speaking; Shift+Enter adds newline |
| T2.4 | Simulated AI response pipeline | On send: call `useSimulatedLLM(persona).start()`; pipe tokens to `useStreamingTTS().pipeStream()`; AI bubble text updates word-by-word as tokens arrive |
| T2.5 | Sentence highlight while speaking | Currently-speaking sentence is underlined + `--pg-primary` color in the AI bubble; uses `useStreamingTTS().currentItem` to find and highlight matching text |
| T2.6 | Waveform in AI bubble | `WaveformCanvas` (mini, height 32px) renders inside AI bubble while that message is being spoken; hides when done |
| T2.7 | Speaking badge on AI avatar | Animated "speaking" badge (pulsing dot) appears on AI avatar circle while TTS is active |
| T2.8 | Persona selector | 3 options: Helpful Assistant, Code Tutor, Story Narrator; switching persona clears chat and resets TTS |
| T2.9 | "Connect Real AI" toggle + API key field | Toggle reveals `<input type="password">` for OpenAI API key; security warning banner always visible when field is shown; key stored in `ref` — never logged, never stored to `localStorage` |
| T2.10 | Real OpenAI streaming mode | When API key present and toggle on: `fetch` to `https://api.openai.com/v1/chat/completions` with `stream: true`; parse SSE lines with `data: ` prefix; extract `choices[0].delta.content`; pipe to `pipeStream()`; handle `[DONE]` sentinel |
| T2.11 | Code snippet (collapsible) | `<details>` element below chat; `CodeBlock.vue` showing ~10-line integration pattern; collapsed by default |

#### Edge Cases — Tab 2

| ID | Scenario | Handling |
|---|---|---|
| E-T2.1 | User sends message while AI is still speaking | Queue user message; after current TTS finishes, process next user message — OR: stop current TTS and immediately process new message (configurable via UX decision; default: stop and process immediately) |
| E-T2.2 | API key field is empty when "Connect Real AI" is on | Disable Send button; show inline validation message "Enter your OpenAI API key above" |
| E-T2.3 | OpenAI API returns non-200 (401 unauthorized, 429 rate limit, 500) | Catch fetch error; display error message in AI bubble with `--pg-rose` color; re-enable Send button |
| E-T2.4 | OpenAI SSE stream stops mid-sentence (network drop) | `pipeStream` catches iterator errors; remaining buffer is flushed to TTS; show "Connection lost" badge on AI bubble |
| E-T2.5 | Sentence highlight — `currentItem` text not found in bubble (due to punctuation normalization) | Normalize both sides before comparison: trim, collapse whitespace, strip leading/trailing punctuation |
| E-T2.6 | Chat thread grows very long (100+ messages) | Implement virtual scrolling OR limit to last 50 messages with "Load earlier messages" button |
| E-T2.7 | Persona changed while TTS is mid-sentence | Call `stop()` on `useStreamingTTS`; clear current bubble; switch persona |
| E-T2.8 | API key contains leading/trailing whitespace | `trim()` before use in Authorization header |
| E-T2.9 | `[DONE]` sentinel arrives before all speech finishes | `pipeStream` resolves when stream is exhausted, not when speech ends — this is correct behavior per library contract |
| E-T2.10 | Browser blocks microphone (not needed here but audio playback autoplay) | Speech synthesis (not mic) — autoplay policies apply to `<audio>` elements, not Web Speech API; OpenAI/Azure providers use `<audio>` elements; must call `audio.play()` inside a click handler or after user gesture |

---

### Tab 3 — Synthesis (`SynthesisTab.vue`)

**Purpose:** Rich interactive demo of `useSpeechSynthesis`.

#### Tasks

| # | Task | Acceptance Criteria |
|---|---|---|
| T3.1 | Full-width `WaveformCanvas` at top | Wired to `useAudioVisualizer` on the Web Speech audio output (where supported); falls back to reactive waveform from `isSpeaking` state |
| T3.2 | Voice selector with language grouping | `VueSpeechVoiceSelect` OR custom `q-select` with `optgroup` by language; flag emoji via `Intl.DisplayNames`; default voice shows ✓; loading skeleton while `isLoadingVoices` |
| T3.3 | Rate, Pitch, Volume sliders | Styled as dark DAW controls; range: rate 0.1–2.0, pitch 0–2.0, volume 0–1.0; labels show current value; reset-to-default button per slider |
| T3.4 | Textarea + transport | Large textarea with character count (bottom-right); Play / Pause / Resume / Stop buttons; keyboard: `Space` play/pause, `Esc` stop |
| T3.5 | Error banner | Visible only when `ttsError` is non-null; `--pg-rose` background; dismissible |

#### Edge Cases — Tab 3

| ID | Scenario | Handling |
|---|---|---|
| E-T3.1 | Web Audio API cannot capture Web Speech output directly | `window.speechSynthesis.speak()` does not produce a `MediaStream`; `WaveformCanvas` must animate reactively from `isSpeaking` state (fake waveform) or be omitted for Web Speech; note this limitation in a tooltip |
| E-T3.2 | `voices` array is empty (Chrome initial load race) | Show skeleton loader for voice selector; re-check after `voiceschanged` event; show "Loading voices…" text |
| E-T3.3 | Pause not supported (some mobile browsers ignore it) | Detect: if `isPaused` remains `false` after `pause()` call within 100ms, show "Pause not supported in this browser" toast |
| E-T3.4 | Textarea empty on Play | Disable Play button; `aria-disabled`; tooltip "Enter text to speak" |
| E-T3.5 | Rate/Pitch/Volume slider changed mid-speech | Changes take effect on next `speak()` call — not retroactively; show tooltip "Takes effect on next play" |
| E-T3.6 | `Space` key fires while textarea is focused | Only intercept keyboard shortcuts when textarea is NOT focused; use `@keydown.space.prevent` only on `document` when `document.activeElement !== textareaEl` |

---

### Tab 4 — Recognition (`RecognitionTab.vue`)

**Purpose:** Voice-to-text with visual mic feedback.

#### Tasks

| # | Task | Acceptance Criteria |
|---|---|---|
| T4.1 | Large circular mic button | Center-stage; 3-ring CSS `@keyframes` pulse when active; `--pg-rose` fill while listening, `--pg-primary` fill when idle |
| T4.2 | Audio level meter ring | `conic-gradient` driven by `useAudioVisualizer` on `MediaStream`; updates in RAF loop; 0–100% level maps to 0–360° sweep |
| T4.3 | Language selector | BCP-47 dropdown; common presets: en-US, en-GB, es-ES, fr-FR, de-DE, ja-JP, zh-CN; full free-text entry also allowed |
| T4.4 | Continuous mode toggle | Toggle calls `useSpeechRecognition({ continuous })` with reactive option; must restart session when toggled during active recognition |
| T4.5 | Transcript display | Interim text: muted grey italic; final committed text: bold black/white; blink cursor at end; `aria-live="polite"` |
| T4.6 | Confidence badge | Shows `(confidence * 100).toFixed(0)%` on each final result; color-coded: ≥ 80% green, 50–79% yellow, < 50% red |
| T4.7 | Copy + Clear buttons | Copy uses `navigator.clipboard.writeText(finalTranscript.value)`; Clear calls `resetTranscript()` |
| T4.8 | State machine rendering | 4 states: Idle, Listening, Got Result, Error — see REDESIGN.md state table |

#### Edge Cases — Tab 4

| ID | Scenario | Handling |
|---|---|---|
| E-T4.1 | Microphone permission denied by user | Catch `NotAllowedError` from `getUserMedia`; show error banner with link to browser settings; mic button disabled |
| E-T4.2 | `SpeechRecognition` not supported (Firefox without flag, most mobile browsers) | Show `q-banner` with `bg-warning`; disable mic button; suggest Chrome |
| E-T4.3 | `continuous: false` and user clicks mic repeatedly | Each click starts a new session; `resetTranscript()` is NOT called automatically — preserve transcript across sessions |
| E-T4.4 | `useAudioVisualizer` on `MediaStream` before mic permission granted | `start()` is deferred until `startListening()` resolves; `MediaStream` passed to visualizer only after permission granted |
| E-T4.5 | Mic button clicked during final result animation | Debounce mic button by 300ms to prevent rapid start/stop cycling |
| E-T4.6 | Shake animation on error — must not re-trigger on every render | Use CSS `animation: shake 0.5s` triggered by adding/removing a class, not a permanent style; remove class after `animationend` event |
| E-T4.7 | Interim transcript is very long (> 200 chars) | Truncate display to last 200 chars with `…` prefix; full text preserved in `transcript.value` |

---

### Tab 5 — Streaming TTS (`StreamingTab.vue`)

**Purpose:** Visualize the sentence detection + speech pipeline.

#### Tasks

| # | Task | Acceptance Criteria |
|---|---|---|
| T5.1 | Two-panel layout | Left: Token Feed; Right: Speech Queue; stacks vertically at < 768px |
| T5.2 | Token Feed panel | Textarea for custom LLM text; Start / Stop / Restart controls; token speed slider (10–100 tokens/sec, default 30); tokens appear character-by-character |
| T5.3 | Sentence boundary flash | When `extractCompleteSentences` detects a boundary, flash the completed sentence cyan for 300ms |
| T5.4 | Color coding in Token Feed | Indigo = currently speaking; cyan = just-detected boundary; purple italic = partial buffer; muted = already spoken |
| T5.5 | Speech Queue panel | `useStreamingTTS().queue` rendered as ordered rows; each row: position badge, text (truncated 60 chars), status badge (Queued/Speaking/Done) |
| T5.6 | Currently speaking item | Top of queue panel; `WaveformCanvas` mini inline; `--pg-primary` background highlight |
| T5.7 | Skip + Clear controls | Skip calls `useStreamingTTS` internal skip (via `useVoiceQueue().skip()`); Clear calls `stop()` |

#### Edge Cases — Tab 5

| ID | Scenario | Handling |
|---|---|---|
| E-T5.1 | Restart while streaming is active | `stop()` first, await 50ms debounce, then `startStreaming()` — prevents double-pipe |
| E-T5.2 | Token speed slider at 100 tokens/sec overwhelms sentence detector | `extractCompleteSentences` is synchronous and fast; no throttling needed; if queue grows > 10 items, show warning badge "Queue building up" |
| E-T5.3 | Custom text has no sentence-ending punctuation | After stream ends, `pipeStream` flushes the remaining buffer as-is (library behavior per I-5.5); highlight the flushed text in amber to indicate "flushed buffer" |
| E-T5.4 | Very short custom text (< 10 chars) | Single token → single flush → single speech item; still works; queue panel shows one row |
| E-T5.5 | Token Feed text is empty on Start | Disable Start button; `aria-disabled`; tooltip "Enter text above" |
| E-T5.6 | Queue panel empty while streaming (all items spoken) | Show "All spoken" empty state with checkmark icon; queue rows fade out with CSS transition when done |
| E-T5.7 | `StreamingDemo.vue` (original file) | Gut to thin redirect: replace body with `<script>` that imports and re-exports from `StreamingTab.vue`, or simply delete and remove the import from the old `App.vue` (which is being replaced anyway) |

---

### Tab 6 — Voice Queue (`VoiceQueueTab.vue`)

**Purpose:** Manual queue management — expose `useVoiceQueue` fully.

#### Tasks

| # | Task | Acceptance Criteria |
|---|---|---|
| T6.1 | Add-to-queue form | Textarea + Enqueue button; `useVoiceQueue().enqueue(text)` called on submit; textarea cleared after enqueue |
| T6.2 | Queue list | Renders `useVoiceQueue().queue` as rows; each row: position badge (1-indexed), text excerpt (60-char truncation + tooltip with full text), status badge, Remove button |
| T6.3 | Currently speaking row | `useVoiceQueue().currentItem` shown at top of list with cyan left border + mini `WaveformCanvas` (height 24px); not in the queue array (it's separate) |
| T6.4 | Transport row | Play All (starts queue if idle), Skip (`useVoiceQueue().skip()`), Clear Queue (`useVoiceQueue().clear()`); buttons disabled appropriately |
| T6.5 | Quick-fill chips | "Hello!", "How can I help you?", "Processing your request…", "Done!" — each chip click enqueues the phrase |
| T6.6 | Status badge colors | Queued: indigo outline; Speaking: cyan solid; Done: green solid (shown briefly before row removes itself) |

#### Edge Cases — Tab 6

| ID | Scenario | Handling |
|---|---|---|
| E-T6.1 | Enqueue while queue is playing | `useVoiceQueue().enqueue()` appends to end — queue auto-advances; no extra logic needed |
| E-T6.2 | Enqueue empty string | Disable Enqueue button when `textarea.trim() === ''`; `aria-disabled` |
| E-T6.3 | Remove button on currently-speaking item | Currently-speaking item is `currentItem`, not in `queue`; Remove button on that row calls `skip()` which stops current and advances |
| E-T6.4 | Clear Queue while speaking | `clear()` stops current utterance immediately; queue empties; `currentItem` becomes `null` |
| E-T6.5 | Play All clicked when queue is already playing | Button is disabled when `isPlaying.value === true` |
| E-T6.6 | Very long enqueued text (> 500 chars) | Enqueue as-is; `useVoiceQueue` passes full text to provider; TTS provider handles length; row truncated at 60 chars with `title` attribute for full text |
| E-T6.7 | `queue` reactive update lag — row doesn't disappear after item is spoken | `useVoiceQueue` uses `ref` (not `shallowRef`) for array, so `splice` mutations are tracked; verify with `v-for :key="index + item"` |

---

### Tab 7 — Components (`ComponentsTab.vue`)

**Purpose:** Live CSS theme editor for the 3 drop-in components.

#### Tasks

| # | Task | Acceptance Criteria |
|---|---|---|
| T7.1 | Section A — `VueSpeechPlayer` preview + editor | Component preview on left; CSS var editor on right with color pickers for `--vts-primary`, `--vts-bg`, `--vts-border`, `--vts-text` and text inputs for `--vts-radius`, `--vts-font`; changes applied via `style` attribute on a wrapper `div` |
| T7.2 | Generated CSS snippet | `CodeBlock.vue` below Section A; auto-updates with the current CSS var values; copy button |
| T7.3 | Reset to defaults button | Clears the inline style object; component reverts to its built-in defaults |
| T7.4 | Section B — `VueSpeechRecorder` preview + editor | Same live editor pattern; `--vts-recording-color` color picker added; light + dark preview side-by-side using `data-theme` on two wrapper divs |
| T7.5 | Section C — `VueSpeechVoiceSelect` demo | Standalone dropdown wired to `useSpeechSynthesis().voices`; shows language grouping, default ✓, loading skeleton; `CodeBlock.vue` with `v-model` pattern |

#### Edge Cases — Tab 7

| ID | Scenario | Handling |
|---|---|---|
| E-T7.1 | Color picker not supported (Safari < 15.4) | `<input type="color">` fallback; wrap in `<label>` for accessibility; no polyfill needed |
| E-T7.2 | CSS var names typed incorrectly in text inputs | No live validation needed; invalid values simply have no effect on the component |
| E-T7.3 | `VueSpeechVoiceSelect` rendered before voices load | Component shows its built-in loading skeleton (it handles this internally); no extra guard needed in the tab |
| E-T7.4 | Generated CSS snippet contains empty values | Filter out CSS vars where the value is empty string before generating the snippet |
| E-T7.5 | Side-by-side light/dark preview (Section B) overrides global theme | Scope the forced-theme wrappers with `data-theme="light"` / `data-theme="dark"` on inner divs; only `--pg-*` vars are affected by global theme; component `--vts-*` vars are scoped to the preview wrapper |

---

### Tab 8 — Setup (`SetupTab.vue`)

**Purpose:** Provider configuration with first-class UX.

#### Tasks

| # | Task | Acceptance Criteria |
|---|---|---|
| T8.1 | 4 provider cards in horizontal grid | Cards for Web Speech, OpenAI, ElevenLabs, Azure; desktop: 4-column grid; mobile: single column |
| T8.2 | Card structure | Provider icon/logo, name, tagline, "Offline" or "API Key Required" badge; expand/collapse on click; active indicator (glowing border when selected) |
| T8.3 | Web Speech card | Expand reveals "works offline" banner only; no config fields |
| T8.4 | OpenAI card | `apiKey` (password + show/hide toggle), `model` (select: tts-1 / tts-1-hd), `voice` (select: alloy/echo/fable/onyx/nova/shimmer), `baseURL` (optional text) |
| T8.5 | ElevenLabs card | `apiKey`, `voiceId`, `modelId`, `baseURL` (optional) |
| T8.6 | Azure card | `subscriptionKey`, `region`, `voice`, `baseURL` (optional) |
| T8.7 | "Test Connection" button per card | Speaks "Connection successful" via that provider; shows `WaveformCanvas` on success; shows error banner on failure; button shows loading spinner during test |
| T8.8 | Live `main.ts` code snippet | `CodeBlock.vue` below all cards; auto-generates correct plugin setup as user fills fields; updates on every keystroke |
| T8.9 | Apply / Reset | Apply: `sessionStorage.setItem('vts-provider-config', ...)` + `window.location.reload()`; Reset: `sessionStorage.removeItem(...)` + reload; confirmation dialog before apply if provider changed |

#### Edge Cases — Tab 8

| ID | Scenario | Handling |
|---|---|---|
| E-T8.1 | API key visible after show/hide toggle — secure input | Toggle only affects `input[type]` attribute (`password` ↔ `text`); key is never written to `localStorage` or `console.log` |
| E-T8.2 | "Test Connection" for OpenAI with empty `apiKey` | Button disabled when `apiKey.trim() === ''`; tooltip "Enter API key first" |
| E-T8.3 | "Test Connection" makes a real HTTP request to OpenAI/ElevenLabs/Azure | Show security notice: "Test uses your browser's connection directly — for production, use a server-side proxy" |
| E-T8.4 | Azure test fails with 403 (wrong region/key combo) | Parse error response body; display Azure error message verbatim in error banner |
| E-T8.5 | Apply clicked — page reloads but sessionStorage was not written (private mode) | Catch `sessionStorage.setItem` exception; show "Could not save config — sessionStorage unavailable in private mode" |
| E-T8.6 | `baseURL` field left empty | Omit from config object (do not send `baseURL: undefined` to plugin — some providers reject unexpected keys) |
| E-T8.7 | Multiple cards expanded simultaneously | Allow — no accordion enforcement; user may want to compare config fields |
| E-T8.8 | Live code snippet with API key visible in plaintext | Mask API key in snippet: replace all but last 4 chars with `*`; note "Your real key is used at runtime" |
| E-T8.9 | Reload after Apply loses active tab | `sessionStorage` key `pg-active-tab` preserved across reload; `App.vue` reads it and restores the Setup tab |

---

## Phase 4 — Polish

> Applied after all 8 tabs are functional. These are non-blocking improvements.

| # | Task | Acceptance Criteria |
|---|---|---|
| P4.1 | GSAP entrance animations | Each tab's cards/sections animate with `gsap.from('.pg-card', { opacity: 0, y: 24, stagger: 0.06, duration: 0.4, ease: 'power2.out' })` on first mount (tracked with `ref` flag to prevent re-animation on re-mount from `keep-alive`) |
| P4.2 | Tab transition crossfade | `<Transition name="pg-fade">` wrapper around `<q-tab-panels>`; CSS: `opacity` + `transform: translateY(8px)` with 250ms ease |
| P4.3 | Responsive layout audit | All tabs usable at 375px viewport width; tab bar scrolls horizontally; two-column layouts collapse to single column |
| P4.4 | Keyboard shortcut overlay | `?` key (when no input is focused) opens a `<dialog>` or Quasar modal listing all shortcuts; close on `Esc` or click-outside |
| P4.5 | Toast notifications | Quasar `useQuasar().notify` used for: copy-to-clipboard success, test connection result, enqueue confirmation, Apply/Reset confirmation |
| P4.6 | Accessibility pass | `aria-label` on all icon-only buttons; `aria-live="polite"` on transcript and queue list; `aria-busy` on loading states; focus managed when tabs change (first focusable element in new tab receives focus) |
| P4.7 | Mobile tab bar | Active tab scrolled into view on mobile (`element.scrollIntoView({ inline: 'nearest' })`) on tab change |

### Edge Cases — Phase 4

| ID | Scenario | Handling |
|---|---|---|
| E-P4.1 | GSAP animation re-fires when `keep-alive` re-activates the tab | Guard with `const animated = ref(false)`; only run `gsap.from(...)` if `!animated.value`; set `animated.value = true` after first run |
| E-P4.2 | Tab transition during rapid tab switching (< 100ms) | GSAP `killTweensOf` / `gsap.context.revert()` on `onDeactivated` to prevent stale animations |
| E-P4.3 | `?` key fires inside input fields | `if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return` before opening overlay |
| E-P4.4 | `1`–`8` keyboard shortcuts for tabs | Map `event.key` `'1'`–`'8'` to tab names in `AppHeader.vue`; guard: only when no input focused; `event.preventDefault()` to prevent browser tab switching |
| E-P4.5 | `useQuasar()` called outside component setup | Extract `$q = useQuasar()` at component setup top-level; pass notify function down or use a shared composable wrapper |
| E-P4.6 | `<dialog>` keyboard shortcut overlay — browser support | `<dialog>` is supported in all modern browsers; `showModal()` traps focus automatically; no polyfill needed |
| E-P4.7 | `aria-live` on queue causes excessive screen reader announcements | Set `aria-live="polite"` (not `assertive`); only announce status changes (Queued → Speaking → Done), not text content of each item |

---

## File Manifest

### Modified Files

| File | Change |
|---|---|
| `apps/playground/src/App.vue` | Full rewrite — minimal tab shell with `<q-tab-panels>` |
| `apps/playground/src/StreamingDemo.vue` | Gutted — replace with thin redirect or delete entirely |
| `apps/playground/package.json` | Add `gsap`, `@vueuse/core` to `dependencies` |

### Created Files

| File | Purpose |
|---|---|
| `apps/playground/src/styles/theme.css` | CSS custom property token set (dark + light modes) |
| `apps/playground/src/composables/useTheme.ts` | Dark/light toggle, `localStorage` persistence |
| `apps/playground/src/composables/useAudioVisualizer.ts` | Web Audio API waveform data composable |
| `apps/playground/src/composables/useSimulatedLLM.ts` | Scripted async token generator with 3 personas |
| `apps/playground/src/components/AppHeader.vue` | Logo + 8-tab bar + theme toggle + GitHub link |
| `apps/playground/src/components/WaveformCanvas.vue` | Canvas waveform renderer — reusable across all tabs |
| `apps/playground/src/components/CodeBlock.vue` | Syntax-highlighted code block + copy button |
| `apps/playground/src/tabs/OverviewTab.vue` | Hero + inline live demo + feature grid |
| `apps/playground/src/tabs/ChatAgentTab.vue` | Full AI voice chat interface |
| `apps/playground/src/tabs/SynthesisTab.vue` | `useSpeechSynthesis` recording studio |
| `apps/playground/src/tabs/RecognitionTab.vue` | `useSpeechRecognition` mic UI |
| `apps/playground/src/tabs/StreamingTab.vue` | `useStreamingTTS` pipeline visualizer |
| `apps/playground/src/tabs/VoiceQueueTab.vue` | `useVoiceQueue` playlist manager |
| `apps/playground/src/tabs/ComponentsTab.vue` | Component gallery + live CSS var editor |
| `apps/playground/src/tabs/SetupTab.vue` | Provider configuration cards |

---

## CSS Token Reference

### Dark Mode (`:root[data-theme="dark"]`)

| Token | Value | Role |
|---|---|---|
| `--pg-bg` | `#0a0a0f` | Page background |
| `--pg-surface` | `#12121a` | Card / panel background |
| `--pg-surface-2` | `#1a1a26` | Nested surfaces, code blocks, inputs |
| `--pg-border` | `rgba(255,255,255,0.08)` | Subtle borders |
| `--pg-primary` | `#6366f1` | Indigo — primary actions, TTS accent |
| `--pg-cyan` | `#06b6d4` | Waveform, streaming, queue |
| `--pg-rose` | `#f43f5e` | Mic / STT, recording state |
| `--pg-text` | `#e2e8f0` | Body text |
| `--pg-text-muted` | `#64748b` | Captions, labels |
| `--pg-radius` | `12px` | Card corner radius |

### Light Mode (`:root[data-theme="light"]`)

| Token | Value | Role |
|---|---|---|
| `--pg-bg` | `#f8fafc` | Page background |
| `--pg-surface` | `#ffffff` | Card / panel background |
| `--pg-surface-2` | `#f1f5f9` | Nested surfaces |
| `--pg-border` | `#e2e8f0` | Borders |
| `--pg-text` | `#0f172a` | Body text |
| `--pg-text-muted` | `#64748b` | Captions |

> Accent colors (`--pg-primary`, `--pg-cyan`, `--pg-rose`) are identical in both modes.

---

## Security Checklist

| # | Item | Tab(s) |
|---|---|---|
| S-1 | API keys stored only in memory (`ref`) — never `localStorage`, never `console.log` | Chat Agent, Setup |
| S-2 | `fetch` to OpenAI uses `Authorization: Bearer ${apiKey.trim()}` — trim before use | Chat Agent, Setup |
| S-3 | Security warning banner always visible when API key input is shown | Chat Agent, Setup |
| S-4 | GitHub link uses `rel="noopener noreferrer"` | AppHeader |
| S-5 | API key masked in generated code snippets (show only last 4 chars) | Setup |
| S-6 | `innerHTML` never used for dynamic content — all text via Vue template bindings | All tabs |
| S-7 | `navigator.clipboard` errors caught and handled gracefully — no silent failures | CodeBlock, Recognition |
| S-8 | SSE stream parsing validates `data:` prefix before `JSON.parse` — rejects malformed lines | Chat Agent |
| S-9 | Real OpenAI mode: note in UI that requests go through the user's browser directly — proxy warning | Chat Agent |

---

## Accessibility Checklist

| # | Requirement | Applies To |
|---|---|---|
| A-1 | All icon-only buttons have `aria-label` | AppHeader, all tabs |
| A-2 | `aria-live="polite"` on transcript area | Recognition |
| A-3 | `aria-live="polite"` on queue list | Voice Queue |
| A-4 | `aria-busy="true"` on loading states | Synthesis (voice loading), Setup (test connection) |
| A-5 | Focus moves to first focusable element on tab change | AppHeader + App.vue |
| A-6 | Keyboard shortcut overlay (`?`) traps focus inside modal | Phase 4 |
| A-7 | `<input type="color">` wrapped in `<label>` | Components |
| A-8 | Disabled buttons use `aria-disabled` not just `disabled` | All forms |
| A-9 | Chat thread has `role="log"` and `aria-live="polite"` | Chat Agent |
| A-10 | Canvas elements have `aria-hidden="true"` (decorative waveforms) | WaveformCanvas |
| A-11 | `<details>` + `<summary>` for collapsible code snippets | Chat Agent, Setup |
| A-12 | Color is never the only differentiator for status — always paired with text/icon | All status badges |

---

## Definition of Done

- [ ] `pnpm --filter playground dev` — all 8 tabs render without console errors or TypeScript errors
- [ ] `pnpm typecheck` passes with zero errors across the monorepo
- [ ] `pnpm test` from repo root — all existing package tests still pass (no regressions)
- [ ] Dark/light toggle persists correctly across page refresh
- [ ] Default theme on first load respects `prefers-color-scheme`
- [ ] AI Chat tab: simulated mode works fully offline (no API key required)
- [ ] AI Chat tab: "Connect Real AI" mode streams actual GPT responses and speaks them
- [ ] Voice Queue tab: enqueue → auto-advance → skip → next item → clear all work correctly
- [ ] Streaming tab: token feed visually updates; sentence boundaries flash cyan; queue updates live
- [ ] Components tab: live CSS var changes reflect immediately in all 3 component previews
- [ ] Setup tab: "Test Connection" works for each provider (errors shown, not thrown)
- [ ] Setup tab: Apply saves to `sessionStorage`; page reloads with new provider active
- [ ] Responsive: all 8 tabs are usable at 375px viewport width
- [ ] Keyboard: `?` opens shortcut overlay; `1`–`8` switches tabs; `Esc` stops all speech
- [ ] `Space` play/pause and `Esc` stop work in Synthesis tab (with input-focus guard)
- [ ] `WaveformCanvas` shows idle breathing animation when no audio data is present
- [ ] No API keys appear in `console.log`, `localStorage`, or the generated code snippet (unmasked)
- [ ] All icon-only buttons have `aria-label`; transcript + queue use `aria-live`
- [ ] Lighthouse accessibility score ≥ 90 on Overview and Chat Agent tabs
- [ ] GitHub link opens in a new tab with `rel="noopener noreferrer"`
