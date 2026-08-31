/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { VoiceOption } from '@/lib/speech'

import { VoicePicker } from './VoicePicker'

const TEXT = { label: 'Voice' }

const VOICES: VoiceOption[] = [
  { uri: 'uri:Samantha', name: 'Samantha', lang: 'en-US', local: true },
  { uri: 'uri:Daniel', name: 'Daniel', lang: 'en-GB', local: false },
]

describe('VoicePicker', () => {
  it('is labelled, so the control has an accessible name', () => {
    render(
      <VoicePicker
        text={TEXT}
        voices={VOICES}
        selected="uri:Samantha"
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('combobox', { name: TEXT.label })).toBeDefined()
  })

  it('offers every voice, named and tagged with its language', () => {
    render(
      <VoicePicker
        text={TEXT}
        voices={VOICES}
        selected="uri:Samantha"
        onSelect={vi.fn()}
      />,
    )

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0].textContent).toContain('Samantha')
    expect(options[0].textContent).toContain('en-US')
  })

  it('shows which voice is in use', () => {
    render(
      <VoicePicker text={TEXT} voices={VOICES} selected="uri:Daniel" onSelect={vi.fn()} />,
    )

    expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe('uri:Daniel')
  })

  it('reports the voice that was picked', () => {
    const onSelect = vi.fn()
    render(
      <VoicePicker
        text={TEXT}
        voices={VOICES}
        selected="uri:Samantha"
        onSelect={onSelect}
      />,
    )

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'uri:Daniel' },
    })

    expect(onSelect).toHaveBeenCalledWith('uri:Daniel')
  })
})
