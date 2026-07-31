# Playground Redesign — "Voice Agent Studio"

**Branch:** `playground`  
**Date:** July 2026  
**Scope:** Full rewrite of `apps/playground/` — new visual identity, new tab-based layout, new interactions. Zero changes to `packages/vue-text-to-speech/`.

---

## Design Goals

1. **Agent / chatbot framing** — every demo is presented as a real-world AI voice agent use case, not a dry API reference
2. **Premium developer experience** — feels like Vercel, Linear, or ElevenLabs' own playground
3. **Both dark and light modes** — prominent toggle, persisted to `localStorage`
4. **Interactive over explanatory** — show, don't tell; code snippets follow the demo, not the other way around
5. **Complete API coverage** — expose every composable and component, including `useVoiceQueue` and `VueSpeechVoiceSelect` which are currently invisible in the playground

---

## Visual Identity

### Dark Mode
| Token | Value | Role |
|---|---|---|
| `--pg-bg` | `#0a0a0f` | Page background |
| `--pg-surface` | `#12121a` | Card / panel background |
| `--pg-surface-2` | `#1a1a26` | Nested surface (code blocks, input fields) |
| `--pg-border` | `rgba(255,255,255,0.08)` | Subtle borders |
| `--pg-primary` | `#6366f1` | Indigo — primary actions, TTS accent |
| `--pg-cyan` | `#06b6d4` | Waveform, streaming, queue |
| `--pg-rose` | `#f43f5e` | Mic / STT, recording state |
| `--pg-text` | `#e2e8f0` | Body text |
| `--pg-text-muted` | `#64748b` | Captions, labels |
| `--pg-radius` | `12px` | Card corner radius |

### Light Mode
| Token | Value | Role |
|---|---|---|
| `--pg-bg` | `#f8fafc` | Page background |
| `--pg-surface` | `#ffffff` | Card / panel background |
| `--pg-surface-2` | `#f1f5f9` | Nested surface |
| `--pg-border` | `#e2e8f0` | Borders |
| `--pg-text` | `#0f172a` | Body text |
| `--pg-text-muted` | `#64748b` | Captions |
*(Accent colors identical to dark mode — same indigo / cyan / rose)*

Applied at `:root[data-theme="dark"]` and `:root[data-theme="light"]` on the `<html>` element.

---

## Tab Structure

```
[ Overview ] [ AI Chat Agent ] [ Synthesis ] [ Recognition ] [ Streaming ] [ Queue ] [ Components ] [ Setup ]
```

8 tabs. Tab bar is sticky at the top below the app header. Each tab is a full-viewport lazy-mounted panel. Active tab is persisted to `sessionStorage`.

---

## Phase 1 — Foundation

> Everything else depends on this. Complete before starting any tab work.

| # | Task | Output |
|---|---|---|
| P1.1 | Add `gsap` and `@vueuse/core` to `apps/playground/package.json` | Dependencies available |
| P1.2 | Create `apps/playground/src/styles/theme.css` — full CSS custom property token set for both modes | Theme file |
| P1.3 | Create `apps/playground/src/composables/useTheme.ts` — `isDark` ref, `toggle()`, `localStorage` persistence, writes `data-theme` to `<html>` | Theme composable |
| P1.4 | Create `apps/playground/src/components/AppHeader.vue` — logo, 8-tab bar, dark/light toggle, GitHub link, version chip, active tab highlight | Header component |
| P1.5 | Rewrite `apps/playground/src/App.vue` as minimal tab shell — imports `AppHeader`, mounts `<q-tab-panels>` with lazy `keep-alive` per tab | Functional shell |

---

## Phase 2 — Shared Infrastructure

> Build once, used by all 8 tabs.

| # | Task | Output |
|---|---|---|
| P2.1 | Create `apps/playground/src/composables/useAudioVisualizer.ts` — wraps Web Audio API `AnalyserNode`, accepts `MediaStream` or `HTMLAudioElement`, returns reactive `Uint8Array` frequency data | Audio visualizer composable |
| P2.2 | Create `apps/playground/src/components/WaveformCanvas.vue` — `<canvas>` that animates waveform bars from `analyzerData` prop; props: `data: Uint8Array`, `color: string`, `height: number`, `barCount: number` | Reusable waveform |
| P2.3 | Create `apps/playground/src/composables/useSimulatedLLM.ts` — `AsyncGenerator<string>` that yields tokens from scripted personas at configurable speed (ms/token); 3 built-in personas: *Helpful Assistant*, *Code Tutor*, *Story Narrator* | Simulated LLM |
| P2.4 | Create `apps/playground/src/components/CodeBlock.vue` — dark code block with syntax-highlighted content (Quasar `q-badge` styling), one-click copy button via Clipboard API, `language` prop | Code snippet component |

---

## Phase 3 — Tabs

> All 8 tabs can be built in parallel once Phase 2 is complete.

---

### Tab 1 — Overview (`apps/playground/src/tabs/OverviewTab.vue`)

**Concept:** First impression. Instantly communicates what the library does.

- **Animated hero** — `WaveformCanvas` bars pulse in idle; animate reactively when a sample sentence is spoken
- **One-line inline demo** — type any text → hit Play → library speaks it via `useSpeechSynthesis`; no config required (uses Web Speech)
- **Feature grid** — 4 cards: *4 Composables*, *3 Components*, *4+ Providers*, *LLM Streaming*; each card is a link to its tab
- **"Used in" banner** — the AI Chat Agent tab is the hero CTA: "See it power a full AI voice agent →"
- **Status chips** — "192 tests passing · SSR-safe · TypeScript · MIT"

---

### Tab 2 — AI Chat Agent (`apps/playground/src/tabs/ChatAgentTab.vue`)

**Concept:** The showstopper. A complete AI voice assistant chat interface powered entirely by the library.

**Layout** — two columns:
- **Left (30%):** Persona selector + provider badge + "Connect Real AI" toggle
- **Right (70%):** Chat thread (user messages right, AI left) + input bar

**Behavior:**
1. User types a message and sends (Enter or Send button)
2. AI response tokens stream in via `useSimulatedLLM` at ~25 tokens/sec
3. As tokens arrive, complete sentences auto-pipe into `useStreamingTTS → pipeStream()`
4. `WaveformCanvas` pulses inside the AI bubble while it is speaking
5. Sentence being spoken is underlined / highlighted in the bubble in real-time
6. A "speaking" badge animates on the AI avatar

**Personas:**
| Persona | Voice mapping (Web Speech) | Scripted domain |
|---|---|---|
| Helpful Assistant | First available female voice | General Q&A |
| Code Tutor | First available male voice | Programming explanations |
| Story Narrator | Slower rate, higher pitch | Short story excerpts |

**"Connect Real AI" toggle:**
- Reveals an OpenAI API key input (password field, never logged)
- Switches `useSimulatedLLM` → real `fetch()` to OpenAI Chat Completions SSE stream
- AI response is the actual GPT-4o reply, streamed and spoken live
- Security warning banner: "For production, proxy through your server"

**Code snippet** (below the chat, collapsible):
```ts
// ~10 lines showing the full integration pattern
const { pipeStream } = useStreamingTTS()
for await (const chunk of llmStream) { await pipeStream(chunk) }
```

---

### Tab 3 — Synthesis (`apps/playground/src/tabs/SynthesisTab.vue`)

**Concept:** A "recording studio" — rich, tactile controls for `useSpeechSynthesis`.

**Layout:**
- Top: `WaveformCanvas` full-width (animates via `useAudioVisualizer` hooked to audio output)
- Middle row: Voice selector (grouped by language with flag emoji) | Rate · Pitch · Volume sliders
- Bottom: Large textarea + transport buttons (Play / Pause / Resume / Stop)
- Error banner below if `ttsError` is set

**Design details:**
- Sliders styled as dark-panel DAW controls, not Quasar defaults
- Voice selector shows language name via `Intl.DisplayNames`, default voice marked with ✓
- Character count on textarea
- Keyboard shortcut hints: `Space` to play/pause, `Esc` to stop

---

### Tab 4 — Recognition (`apps/playground/src/tabs/RecognitionTab.vue`)

**Concept:** Voice-to-text input — makes the mic feel powerful and precise.

**Layout — centered single column:**
- Large circular mic button, center-stage; 3-ring pulse animation (CSS keyframes) when active
- Circular audio level meter ring (CSS `conic-gradient`, driven by `useAudioVisualizer` on `MediaStream`)
- Language selector (BCP-47 dropdown) + continuous mode toggle
- Transcript area: interim words appear in muted italic, snap to bold on final commit; typewriter cursor blinks
- "Copy transcript" + "Clear" buttons

**States:**
| State | Mic button | Ring | Transcript |
|---|---|---|---|
| Idle | Indigo fill | None | Placeholder |
| Listening | Rose fill | Animated pulse | Interim (grey italic) |
| Got result | Returns to Indigo | Fades out | Final (bold, confidence badge) |
| Error | Shake animation | — | Error banner |

---

### Tab 5 — Streaming TTS (`apps/playground/src/tabs/StreamingTab.vue`)

**Concept:** Visualize the sentence detection + speech queue pipeline in real time.

**Layout — two panels side by side:**

| Left panel: Token Feed | Right panel: Speech Queue |
|---|---|
| Text area for simulated LLM output | Currently speaking item + waveform |
| Tokens appear character-by-character at configurable speed | Queued sentences as ordered rows |
| Sentence completions flash cyan when detected | Partial buffer shown in purple italic |
| Start / Stop / Restart controls | Skip / Clear controls |
| Token speed slider (10 – 100 tokens/sec) | Status badges: speaking · queued · done |

**Color coding:**
- **Cyan highlight** — sentence boundary just detected
- **Indigo** — sentence currently being spoken
- **Purple italic** — partial buffer (incomplete sentence)
- **Muted** — sentences already spoken (done)

*(Refactored from `StreamingDemo.vue`; old file is gutted to a thin redirect or removed)*

---

### Tab 6 — Voice Queue (`apps/playground/src/tabs/VoiceQueueTab.vue`)

**Concept:** Manual queue management — expose `useVoiceQueue` which is completely absent from the current playground.

**Layout:**
- **Top:** "Add to queue" form — textarea + Enqueue button
- **Middle:** Queue list — each row shows: position badge, text excerpt (truncated at 60 chars), status badge (Queued / Speaking / Done), Remove button
- **Bottom:** Transport row — Play All / Skip / Clear Queue buttons

**Behavior:**
- Enqueue button adds the typed phrase to `useVoiceQueue().queue`
- List auto-updates as items move through speaking → done states
- Speaking row is highlighted with a cyan left border + `WaveformCanvas` mini inline
- Skip jumps to next item; Clear stops and empties queue
- "Add preset phrases" quick-fill chips: "Hello!", "How can I help you?", "Processing your request…", "Done!"

---

### Tab 7 — Components (`apps/playground/src/tabs/ComponentsTab.vue`)

**Concept:** Showcase the three drop-in components with a live theme editor — proves the CSS custom property system.

**Layout — three stacked sections:**

**Section A — `VueSpeechPlayer`:**
- Component preview on the left
- Live CSS var editor on the right: color pickers for `--vts-primary`, `--vts-bg`, `--vts-border`, `--vts-text`; text inputs for `--vts-radius`, `--vts-font`
- Changes applied via inline `style` injection in real time
- "Reset to defaults" button
- Generated CSS snippet auto-updates

**Section B — `VueSpeechRecorder`:**
- Same live editor pattern; `--vts-recording-color` color picker
- Light and dark preview side by side (iframe or scoped div with forced theme)

**Section C — `VueSpeechVoiceSelect`:**
- Standalone dropdown demo wired to `useSpeechSynthesis().voices`
- Shows grouping by language, default voice ✓, loading skeleton
- Code snippet showing the `v-model` pattern

---

### Tab 8 — Setup (`apps/playground/src/tabs/SetupTab.vue`)

**Concept:** Provider configuration as a first-class UX — replaces the current flat tab panel inside a card.

**Layout — 4 provider cards (horizontal grid on desktop, stack on mobile):**

Each card:
- Provider logo / icon top-left
- Name, tagline, "Offline / API Key Required" badge
- Expand/collapse click to reveal config fields
- API key field (password type, show/hide toggle)
- Provider-specific fields (model, voice, region, etc.)
- "Test Connection" button — speaks a test phrase through that provider; shows success (waveform) or error (banner)
- Active indicator (glowing border) when that provider is selected

**Providers:**
| Card | Config fields |
|---|---|
| Web Speech | None — just a "works offline" banner |
| OpenAI | `apiKey`, `model` (tts-1 / tts-1-hd), `voice`, `baseURL` (optional) |
| ElevenLabs | `apiKey`, `voiceId`, `modelId`, `baseURL` (optional) |
| Azure | `subscriptionKey`, `region`, `voice`, `baseURL` (optional) |

**Live code snippet** (below cards) — auto-generates the correct `main.ts` plugin setup as the user fills in fields. Syntax-highlighted via `CodeBlock.vue`.

**Apply / Reset** — persists to `sessionStorage`, reloads page (same as current behavior but with improved UX).

---

## Phase 4 — Polish

| # | Task |
|---|---|
| P4.1 | GSAP entrance animations — staggered fade-up of cards on each tab's first render (`gsap.from`, `stagger: 0.06`) |
| P4.2 | Tab transition — GSAP crossfade (`opacity` + `y: 8px`) between tab panels |
| P4.3 | Responsive layout — single column at `< 768px`; tab bar scrolls horizontally on mobile |
| P4.4 | Keyboard shortcut overlay — `?` key opens a modal listing all shortcuts (`Space`, `Esc`, `1-8` for tabs) |
| P4.5 | Toast notifications — Quasar `useQuasar().notify` for copy actions, test connection results |
| P4.6 | Accessibility pass — `aria-label` on all icon buttons, `aria-live` on transcript and queue, focus management when tabs change |
| P4.7 | Mobile tab bar — horizontal scroll with active indicator, no wrapping |

---

## File Manifest

### Modified
| File | Change |
|---|---|
| `apps/playground/src/App.vue` | Full rewrite — minimal tab shell |
| `apps/playground/src/StreamingDemo.vue` | Gutted — content migrated to `StreamingTab.vue` |
| `apps/playground/package.json` | Add `gsap`, `@vueuse/core` |

### Created
| File | Purpose |
|---|---|
| `apps/playground/src/styles/theme.css` | CSS custom property token set (dark + light) |
| `apps/playground/src/composables/useTheme.ts` | Dark/light toggle with `localStorage` |
| `apps/playground/src/composables/useAudioVisualizer.ts` | Web Audio API waveform data |
| `apps/playground/src/composables/useSimulatedLLM.ts` | Scripted async token generator |
| `apps/playground/src/components/AppHeader.vue` | Logo + tab bar + theme toggle |
| `apps/playground/src/components/WaveformCanvas.vue` | Canvas waveform renderer |
| `apps/playground/src/components/CodeBlock.vue` | Syntax-highlighted code + copy button |
| `apps/playground/src/tabs/OverviewTab.vue` | Hero + inline demo + feature grid |
| `apps/playground/src/tabs/ChatAgentTab.vue` | Full AI chat interface |
| `apps/playground/src/tabs/SynthesisTab.vue` | useSpeechSynthesis studio |
| `apps/playground/src/tabs/RecognitionTab.vue` | useSpeechRecognition mic UI |
| `apps/playground/src/tabs/StreamingTab.vue` | useStreamingTTS pipeline viz |
| `apps/playground/src/tabs/VoiceQueueTab.vue` | useVoiceQueue playlist UI |
| `apps/playground/src/tabs/ComponentsTab.vue` | Component gallery + live theme editor |
| `apps/playground/src/tabs/SetupTab.vue` | Provider configuration cards |

---

## Definition of Done

- [ ] `pnpm --filter playground dev` — all 8 tabs render without console errors
- [ ] Dark/light toggle persists correctly on page refresh
- [ ] AI Chat tab: simulated mode works fully offline (no API key)
- [ ] AI Chat tab: "Connect Real AI" mode streams and speaks actual GPT responses
- [ ] Voice Queue tab: enqueue → speaking → skip → next item → clear all work correctly
- [ ] Components tab: live CSS var changes reflect immediately in component previews
- [ ] Responsive: all tabs usable on 375px wide viewport
- [ ] Keyboard: `?` overlay lists shortcuts; `1`–`8` switches tabs; `Esc` stops speech
- [ ] All existing package tests still pass: `pnpm test` from repo root
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] Lighthouse accessibility score ≥ 90 on Overview and Chat tabs