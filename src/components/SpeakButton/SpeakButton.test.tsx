/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SpeakButton } from './SpeakButton'

const LABEL = 'Hear pronunciation'

describe('SpeakButton', () => {
  it('names itself for screen readers, having only an icon to show', () => {
    render(<SpeakButton label={LABEL} speaking={false} onClick={vi.fn()} />)

    expect(screen.getByRole('button', { name: LABEL })).toBeDefined()
  })

  it('calls back when pressed', () => {
    const onClick = vi.fn()
    render(<SpeakButton label={LABEL} speaking={false} onClick={onClick} />)

    screen.getByRole('button', { name: LABEL }).click()

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('marks itself only while speaking, which is what animates the waves', () => {
    const { rerender } = render(
      <SpeakButton label={LABEL} speaking={false} onClick={vi.fn()} />,
    )
    expect(screen.getByRole('button').dataset.speaking).toBeUndefined()

    rerender(<SpeakButton label={LABEL} speaking onClick={vi.fn()} />)
    expect(screen.getByRole('button').dataset.speaking).toBe('true')
  })
})
