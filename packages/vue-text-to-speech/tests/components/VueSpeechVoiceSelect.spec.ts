import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VueSpeechVoiceSelect from '../../src/components/VueSpeechVoiceSelect.vue'
import type { VoiceInfo } from '../../src/providers/types.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VOICES: VoiceInfo[] = [
  { id: 'en-US-1', name: 'Samantha', lang: 'en-US', label: 'Samantha (en-US)', default: true },
  { id: 'en-GB-1', name: 'Daniel', lang: 'en-GB', label: 'Daniel (en-GB)', default: false },
  { id: 'fr-FR-1', name: 'Thomas', lang: 'fr-FR', label: 'Thomas (fr-FR)', default: false },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VueSpeechVoiceSelect', () => {
  it('renders a <select> element', () => {
    const wrapper = mount(VueSpeechVoiceSelect, { props: { voices: VOICES } })
    expect(wrapper.find('select').exists()).toBe(true)
  })

  it('has aria-label on the select', () => {
    const wrapper = mount(VueSpeechVoiceSelect, { props: { voices: VOICES } })
    expect(wrapper.find('select').attributes('aria-label')).toBeTruthy()
  })

  it('renders an <optgroup> for each language', () => {
    const wrapper = mount(VueSpeechVoiceSelect, { props: { voices: VOICES } })
    const groups = wrapper.findAll('optgroup')
    // 3 voices, 3 different lang codes → 3 groups
    expect(groups.length).toBe(3)
  })

  it('renders an <option> for each voice', () => {
    const wrapper = mount(VueSpeechVoiceSelect, { props: { voices: VOICES } })
    // One extra placeholder option since modelValue is undefined
    const options = wrapper.findAll('option')
    expect(options.length).toBe(VOICES.length + 1) // +1 placeholder
  })

  it('marks the default voice with ✓', () => {
    const wrapper = mount(VueSpeechVoiceSelect, {
      props: { voices: VOICES, modelValue: VOICES[0] },
    })
    const options = wrapper.findAll('option')
    const defaultOpt = options.find((o) => o.text().includes('✓'))
    expect(defaultOpt).toBeTruthy()
    expect(defaultOpt!.text()).toContain('Samantha')
  })

  it('shows "Loading voices…" when loading=true', () => {
    const wrapper = mount(VueSpeechVoiceSelect, { props: { voices: [], loading: true } })
    expect(wrapper.text()).toContain('Loading')
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('shows "No voices available" when voices is empty and not loading', () => {
    const wrapper = mount(VueSpeechVoiceSelect, { props: { voices: [], loading: false } })
    expect(wrapper.text()).toContain('No voices available')
  })

  it('select is disabled when disabled=true', () => {
    const wrapper = mount(VueSpeechVoiceSelect, {
      props: { voices: VOICES, disabled: true },
    })
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('emits update:modelValue with the matching voice on change', async () => {
    const wrapper = mount(VueSpeechVoiceSelect, {
      props: { voices: VOICES, modelValue: VOICES[0] },
    })

    const select = wrapper.find('select')
    await select.setValue('fr-FR-1')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(VOICES[2])
  })

  it('emits undefined when the selected voice id is not in the list', async () => {
    const wrapper = mount(VueSpeechVoiceSelect, {
      props: { voices: VOICES, modelValue: VOICES[0] },
    })

    // Simulate selecting a value that doesn't exist (edge case)
    const select = wrapper.find('select')
    // Manually dispatch with a non-existent id
    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: { value: 'non-existent' } })
    select.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBeUndefined()
  })
})
