# Growth & Distribution Plan — vue-text-to-speech

A prioritized, actionable plan to maximise reach across the Vue and JavaScript developer communities.

---

## Phase 1 — Discoverability (Do This Week)

List on every platform developers search when looking for Vue packages.

### Submit to Directories

| Platform | Action | Link |
|---|---|---|
| **Awesome Vue** | Open a PR adding the package to the Speech/Audio section | [github.com/vuejs/awesome-vue](https://github.com/vuejs/awesome-vue) |
| **Made with Vue.js** | Submit the playground URL | [madewithvuejs.com/submit](https://madewithvuejs.com/submit) |
| **VueTelescope** | Register the playground as a Vue app | [vuetelescope.com](https://vuetelescope.com) |
| **VueUse ecosystem** | Open a GitHub Discussion proposing inclusion or a "related packages" mention | [github.com/vueuse/vueuse/discussions](https://github.com/vueuse/vueuse/discussions) |
| **npmtrends.com** | Compare with similar packages — surfaces in Google results for competitors | [npmtrends.com](https://npmtrends.com) |

### Polish the NPM Page

- [ ] Update `homepage` in `packages/vue-text-to-speech/package.json` with the real Vercel docs URL
- [ ] Add a banner image / GIF to `README.md` — a recording of the streaming TTS demo speaks louder than any description
- [ ] Ensure keywords are set: `vue`, `tts`, `openai`, `elevenlabs`, `azure`, `speech`, `voice`, `streaming`

---

## Phase 2 — Community Posts (This Week)

### Where to Post

**DEV.to**
Write: *"I built a Vue 3 plugin that pipes OpenAI streaming to speech in 5 lines"*
Show the exact 5 lines. Curiosity-driven headline → high click-through.

**Reddit**
- [r/vuejs](https://reddit.com/r/vuejs)
- [r/javascript](https://reddit.com/r/javascript)

Share the **playground link**, not the npm link. Let developers play first — converts better than documentation.

**Hacker News — Show HN**
Title: *`Show HN: Vue 3 plugin that speaks LLM token streams as they generate`*
HN rewards technical depth + working demos. Include the sigstore provenance link as a trust signal.

**Twitter / X + LinkedIn**
Post a 30-second screen recording of the streaming TTS demo — no voiceover needed. Watching tokens appear and hearing them spoken simultaneously is the demo. Attach to every post.

**Discord Communities**
- Vue Land Discord → `#packages` or `#show-and-tell`
- Nuxt Discord → `#modules`
- OpenAI Developers Discord → `#projects`

### Post Template (adapt per platform)

```
🎙️ vue-text-to-speech v2 — pipe LLM streams to speech in Vue 3

✅ Web Speech (zero config)
✅ OpenAI / ElevenLabs / Azure
✅ useStreamingTTS() — speaks sentences as they generate
✅ Drop-in components
✅ 189 tests, full TypeScript, SSR-safe

📖 Docs: https://vue-text-to-speech-docs.vercel.app
🛝 Playground: https://vue-text-to-speech-playground.vercel.app
📦 npm install vue-text-to-speech
```

---

## Phase 3 — Content That Compounds (Ongoing)

Write tutorials that rank for specific Google searches. Publish on DEV.to, Medium, and cross-post to your own site for backlinks.

| Article Title | Target Search Intent |
|---|---|
| "How to add text-to-speech to a Vue 3 app" | High volume, low competition |
| "Streaming OpenAI responses to audio in Vue" | Emerging — almost no results yet |
| "Vue speech recognition with Web Speech API" | Evergreen, high intent |
| "Accessible Vue audio player component" | Accessibility angle drives shares |
| "Replace browser TTS with ElevenLabs in Vue" | High commercial intent |
| "Real-time LLM voice assistant with Vue and OpenAI" | Trending topic |

### Article Structure That Works

1. **One-paragraph problem** — "Browser TTS sounds robotic. Here's how to use neural voices in Vue in under 10 minutes."
2. **Working code** — paste the exact composable usage
3. **Live demo link** — send them to the playground
4. **NPM install command** — one line, copy-pasteable
5. **Link to docs** for the rest

---

## Phase 4 — GitHub Growth

| Action | Why It Matters |
|---|---|
| Add `CONTRIBUTING.md` with clear setup steps | Attracts contributors → more stars |
| Add `good first issue` labels to small tasks | Lowers barrier for first-time contributors |
| Reply to every GitHub issue within 24 hours | Trust signal — shows active maintenance |
| Enable GitHub Discussions for Q&A | Keeps questions visible and searchable |
| Create a "Showcase" discussion thread | Ask users to share what they built — social proof |
| Write detailed release notes for each version | Watchers get notified → re-engagement loop |
| Add a `SPONSORS.md` or GitHub Sponsors | Long-term sustainability signal |

### Star Growth Tactics

- Mention the repo in your DEV.to / Medium bio
- Add a "Star on GitHub" badge to the README and docs site
- Cross-link from the playground footer
- Ask early users directly: *"If this saved you time, a GitHub star helps others find it"*

---

## Phase 5 — Integration Plays (High Leverage)

Each integration ships your package to an existing, active audience.

### Nuxt Module — `nuxt-text-to-speech`

Wrap the plugin as a Nuxt module. The Nuxt community actively discovers and installs modules.

```ts
// nuxt.config.ts — target developer experience
export default defineNuxtConfig({
  modules: ['nuxt-text-to-speech'],
  textToSpeech: { provider: 'openai', apiKey: process.env.OPENAI_KEY }
})
```

Submit to [nuxt.com/modules](https://nuxt.com/modules) after publishing.

### VitePress Plugin

A plugin that adds a "Read Aloud" button to any VitePress docs site. Meta-viral: documentation tool authors talk to other documentation tool authors.

### Quasar App Extension

You are already using Quasar in the playground. Package it as an official Quasar App Extension and submit to the [Quasar Extensions directory](https://quasar.dev/app-extensions/discover).

### shadcn-vue Component

A `SpeechPlayer` component styled to match shadcn-vue is instantly shareable in the shadcn community, which is one of the fastest-growing component ecosystems right now.

---

## The Single Most Important Thing

The moment that generates shares for developer tools is **seeing the "wow" in 10 seconds or less**.

For this plugin that moment is:

> *"I typed a question, the LLM answered, and it spoke the answer out loud — all in ~15 lines of Vue."*

**Action:** Record a 30-second screen capture of exactly that — no editing, no voiceover. Just the playground in action. Attach this clip to every post, tweet, and Reddit comment. That video is the distribution engine.

---

## Tracking Progress

| Metric | Where to Check |
|---|---|
| Weekly npm downloads | [npmjs.com/package/vue-text-to-speech](https://www.npmjs.com/package/vue-text-to-speech) |
| GitHub stars | [github.com/VasuLaravel/vue-text-to-speech](https://github.com/VasuLaravel/vue-text-to-speech) |
| Docs traffic | Vercel Analytics on the docs project |
| Playground usage | Vercel Analytics on the playground project |
| Backlinks / mentions | [Google Alerts](https://alerts.google.com) for `"vue-text-to-speech"` |
