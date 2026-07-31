import { ref, onMounted, onActivated } from 'vue';
/**
 * GSAP entrance animation for tab cards.
 *
 * Animates `.pg-card` and `.pg-section` elements from y=24,opacity=0 to their
 * natural position when the tab mounts.  `keep-alive` re-activates the tab
 * without re-mounting, so `onActivated` is also handled — but the `animated`
 * guard (E-P4.1) prevents the animation from re-firing on every re-activation.
 *
 * GSAP is loaded lazily inside the callback to satisfy E-P1.1 (no window
 * access at module scope).
 */
export function useTabEntrance(selector = '.pg-card, .pg-section') {
    const animated = ref(false);
    async function runEntrance() {
        if (animated.value)
            return;
        animated.value = true;
        // Lazy import — safe in CSR, avoids SSR window access
        const gsap = (await import('gsap')).default;
        gsap.from(selector, {
            opacity: 0,
            y: 24,
            duration: 0.45,
            ease: 'power2.out',
            stagger: 0.06,
            clearProps: 'transform,opacity',
        });
    }
    onMounted(runEntrance);
    onActivated(runEntrance);
    return { animated };
}
