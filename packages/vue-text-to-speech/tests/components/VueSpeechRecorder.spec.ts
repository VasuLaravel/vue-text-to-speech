import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VueSpeechRecorder from '../../src/components/VueSpeechRecorder.vue'

// ─── Mock SpeechRecognition (same pattern as useSpeechRecognition.spec.ts) ────

class MockRecognition {
  lang = ''
  interimResults = false
  continuous = false
  maxAlternatives = 1
  start = vi.fn()
  stop = vi.fn()
  onresult: ((_: unknown) => void) | null = null
  onerror: ((_: unknown) => void) | null = null
  onend: (() => void) | null = null
}

let mockInstance: MockRecognition

function installMock() {
  mockInstance = new MockRecognition()
  ;(window as unknown as Record<string, unknown>).SpeechRecognition = vi
    .fn()
    .mockImplementation(() => mockInstance)
}

function uninstallMock() {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VueSpeechRecorder', () => {
  // ── Without SpeechRecognition (unsupported env) ────────────────────────────

  describe('when SpeechRecognition is unavailable', () => {
    it('shows "not supported" message', () => {
      uninstallMock()
      const wrapper = mount(VueSpeechRecorder)
      expect(wrapper.text()).toContain('not supported')
    })

    it('does NOT render the mic button', () => {
      uninstallMock()
      const wrapper = mount(VueSpeechRecorder)
      expect(wrapper.find('.vts-recorder__mic-btn').exists()).toBe(false)
    })
  })

  // ── With SpeechRecognition (supported env) ─────────────────────────────────

  describe('when SpeechRecognition is available', () => {
    beforeEach(() => {
      installMock()
      vi.clearAllMocks()
    })

    afterEach(() => {
      uninstallMock()
    })

    it('renders the mic button', () => {
      const wrapper = mount(VueSpeechRecorder)
      expect(wrapper.find('.vts-recorder__mic-btn').exists()).toBe(true)
    })

    it('mic button has aria-pressed="false" initially', () => {
      const wrapper = mount(VueSpeechRecorder)
      const btn = wrapper.find('.vts-recorder__mic-btn')
      expect(btn.attributes('aria-pressed')).toBe('false')
    })

    it('mic button has descriptive aria-label', () => {
      const wrapper = mount(VueSpeechRecorder)
      const btn = wrapper.find('.vts-recorder__mic-btn')
      expect(btn.attributes('aria-label')).toContain('Start')
    })

    it('transcript region has aria-live="polite"', () => {
      const wrapper = mount(VueSpeechRecorder)
      const region = wrapper.find('.vts-recorder__transcript')
      expect(region.attributes('aria-live')).toBe('polite')
    })

    it('transcript region has role="status"', () => {
      const wrapper = mount(VueSpeechRecorder)
      const region = wrapper.find('.vts-recorder__transcript')
      expect(region.attributes('role')).toBe('status')
    })

    it('clicking the mic button starts recognition', async () => {
      const wrapper = mount(VueSpeechRecorder)
      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      expect(mockInstance.start).toHaveBeenCalledOnce()
    })

    it('aria-pressed becomes "true" after clicking to start', async () => {
      const wrapper = mount(VueSpeechRecorder)
      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      await wrapper.vm.$nextTick()

      const btn = wrapper.find('.vts-recorder__mic-btn')
      expect(btn.attributes('aria-pressed')).toBe('true')
    })

    it('aria-label changes to "Stop recording" when listening', async () => {
      const wrapper = mount(VueSpeechRecorder)
      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      await wrapper.vm.$nextTick()

      const btn = wrapper.find('.vts-recorder__mic-btn')
      expect(btn.attributes('aria-label')).toContain('Stop')
    })

    it('clicking mic again while listening stops recognition', async () => {
      const wrapper = mount(VueSpeechRecorder)
      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockInstance.stop).toHaveBeenCalled()
    })

    it('Escape key stops recognition when listening', async () => {
      const wrapper = mount(VueSpeechRecorder)
      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('.vts-recorder').trigger('keydown', { key: 'Escape' })
      expect(mockInstance.stop).toHaveBeenCalled()
    })

    it('renders pulse animation span when listening', async () => {
      const wrapper = mount(VueSpeechRecorder)
      expect(wrapper.find('.vts-recorder__pulse').exists()).toBe(false)

      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.vts-recorder__pulse').exists()).toBe(true)
    })

    it('renders custom mic-icon slot content', () => {
      const wrapper = mount(VueSpeechRecorder, {
        slots: { 'mic-icon': '<span class="custom-icon">MIC</span>' },
      })
      expect(wrapper.find('.custom-icon').exists()).toBe(true)
    })

    it('renders custom transcript slot content', () => {
      const wrapper = mount(VueSpeechRecorder, {
        slots: { transcript: '<p class="custom-transcript">Custom transcript area</p>' },
      })
      expect(wrapper.find('.custom-transcript').exists()).toBe(true)
    })

    it('emits "transcript" on interim result', async () => {
      const wrapper = mount(VueSpeechRecorder)
      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // Simulate interim result from the recognition engine
      mockInstance.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { isFinal: false, length: 1, 0: { transcript: 'hello', confidence: 0 } },
        },
      })
      await wrapper.vm.$nextTick()

      const emitted = wrapper.emitted('transcript')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe('hello')
    })

    it('emits "final-transcript" on final result', async () => {
      const wrapper = mount(VueSpeechRecorder)
      await wrapper.find('.vts-recorder__mic-btn').trigger('click')
      await wrapper.vm.$nextTick()

      mockInstance.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { isFinal: true, length: 1, 0: { transcript: 'hello world', confidence: 0.9 } },
        },
      })
      await wrapper.vm.$nextTick()

      const emitted = wrapper.emitted('final-transcript')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe('hello world')
    })
  })
})
