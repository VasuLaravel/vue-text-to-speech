import { shallowRef, readonly } from 'vue';
// ── Scripted response library ─────────────────────────────────────────────────
// All responses end with `.`, `?`, or `!`. No trailing whitespace. (E-P2.3a)
const SCRIPTS = {
    'helpful-assistant': [
        `Hello! I'm your AI voice assistant, powered by vue-text-to-speech. I can answer questions, help with tasks, and have natural conversations. What would you like to know today?`,
        `Great question! The vue-text-to-speech library provides four composables for audio interaction. You have useSpeechSynthesis for text-to-speech, useSpeechRecognition for voice input, useStreamingTTS for LLM streaming, and useVoiceQueue for playlist management. Each one integrates seamlessly with Vue's reactivity system.`,
        `I'm glad you asked about streaming! When language models generate text, they produce tokens one by one. Our streaming composable picks up each token, detects sentence boundaries, and speaks each complete sentence immediately. This creates a much more natural, responsive experience than waiting for the full response.`,
        `Of course! Setting up the library takes just two steps. First, install it with pnpm add vue-text-to-speech. Then call app.use(VueSpeech) in your main.ts file. After that, any composable you import will automatically use the provider you configured. It really is that straightforward.`,
    ],
    'code-tutor': [
        `Let's talk about TypeScript generics! A generic is like a placeholder for a type. When you write function identity with a type parameter T, that T can be any type, determined when the function is called. This makes your code both flexible and type-safe at the same time.`,
        `Composables in Vue 3 are functions that encapsulate reactive state and logic. They always start with the word "use" by convention. For example, useVoiceQueue sets up a reactive queue and returns enqueue, skip, and clear methods. You simply call it inside your component's setup function.`,
        `Async and await are syntactic sugar over Promises. When you write await somePromise, you're telling JavaScript to pause execution until that Promise resolves. For token streaming, we use async generators, which let you yield values one at a time while pausing between each one. This is how the LLM streaming pipeline works under the hood.`,
        `The key difference between ref and shallowRef in Vue is how deep the reactivity goes. A regular ref tracks changes deeply inside objects and arrays. A shallowRef only tracks when you replace the top-level value itself. For performance-sensitive data like Uint8Array waveform buffers, shallowRef is the right choice.`,
    ],
    'story-narrator': [
        `In the heart of a digital realm, where data flowed like rivers of light, there lived a voice. Not just any voice, but one woven from millions of human conversations. It whispered to those who listened, painting worlds with words alone.`,
        `The detective stepped into the rain-soaked alley, her coat pulled tight against the November chill. A single flickering streetlamp cast long shadows across the cobblestones. Something was wrong here. She could feel it in her bones before she even saw the first clue.`,
        `The old lighthouse keeper had one rule above all others. Never let the light go out, no matter what storms may come. For seventy years he kept that promise faithfully. But on the night of the great storm, the world would test his resolve one final time.`,
        `She opened the letter slowly, her fingers trembling just slightly at the edges. The handwriting was unmistakable — she had seen it a thousand times before, in birthday cards and grocery lists and late-night notes left on the kitchen table. But this time, the message it carried changed everything.`,
    ],
};
// ── Composable ────────────────────────────────────────────────────────────────
/**
 * Generates a scripted async token stream that simulates LLM output.
 *
 * @param persona - Which scripted persona to use
 * @param msPerToken - Milliseconds between each chunk yield (default: 30)
 *
 * Usage:
 * ```ts
 * const { start, stop, isStreaming } = useSimulatedLLM('helpful-assistant', 30)
 * const { pipeStream } = useStreamingTTS()
 *
 * async function onSend() {
 *   await pipeStream(start())
 * }
 * ```
 */
export function useSimulatedLLM(persona, msPerToken = 30) {
    const isStreaming = shallowRef(false);
    let controller = new AbortController();
    // ── Chunk size: 4–8 chars to simulate realistic tokenization ─────────────────
    function nextChunkSize() {
        return Math.floor(Math.random() * 5) + 4; // 4–8
    }
    // ── Pick a random scripted response for this persona ─────────────────────────
    function pickResponse() {
        const pool = SCRIPTS[persona];
        return pool[Math.floor(Math.random() * pool.length)];
    }
    // ── Async generator ──────────────────────────────────────────────────────────
    async function* makeStream(text, signal) {
        // E-P2.3b: if stop() was called before start() resolved, abort immediately
        if (signal.aborted)
            return;
        let i = 0;
        while (i < text.length) {
            if (signal.aborted)
                return;
            // Wait msPerToken ms between chunks (simulates network latency per token)
            await new Promise((resolve) => {
                const timeout = setTimeout(resolve, msPerToken);
                // If aborted while waiting, resolve immediately
                signal.addEventListener('abort', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            });
            if (signal.aborted)
                return;
            const size = nextChunkSize();
            yield text.slice(i, i + size);
            i += size;
        }
        isStreaming.value = false;
    }
    // ── start ────────────────────────────────────────────────────────────────────
    function start() {
        // Abort any previous stream still running
        controller.abort();
        controller = new AbortController();
        isStreaming.value = true;
        const text = pickResponse();
        return makeStream(text, controller.signal);
    }
    // ── stop ─────────────────────────────────────────────────────────────────────
    function stop() {
        controller.abort();
        isStreaming.value = false;
    }
    return {
        isStreaming: readonly(isStreaming),
        start,
        stop,
    };
}
