/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { THEME_IDS } from '@/lib/theme'
import type { ThemePickerText } from '@/types'

import { ThemePicker } from './ThemePicker'

const TEXT: ThemePickerText = {
  label: 'Accent colour',
  names: {
    amber: 'Amber',
    terracotta: 'Terracotta',
    crimson: 'Crimson',
    forest: 'Forest',
    indigo: 'Indigo',
  },
}

describe('ThemePicker', () => {
  it('renders one swatch per theme', () => {
    render(<ThemePicker text={TEXT} selected="amber" onSelect={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(THEME_IDS.length)
  })

  it('tags each swatch so the stylesheet can colour it', () => {
    const { container } = render(
      <ThemePicker text={TEXT} selected="amber" onSelect={vi.fn()} />,
    )

    for (const theme of THEME_IDS) {
      expect(container.querySelector(`[data-swatch="${theme}"]`)).not.toBeNull()
    }
  })

  it('marks exactly the selected swatch as checked', () => {
    render(<ThemePicker text={TEXT} selected="forest" onSelect={vi.fn()} />)

    const checked = screen
      .getAllByRole('radio')
      .filter((el) => el.getAttribute('aria-checked') === 'true')

    expect(checked).toHaveLength(1)
    expect(checked[0].getAttribute('aria-label')).toBe('Forest')
  })

  it('names the current theme in the caption', () => {
    render(<ThemePicker text={TEXT} selected="indigo" onSelect={vi.fn()} />)

    expect(screen.getByText('Indigo')).toBeDefined()
  })

  it('reports the chosen theme', async () => {
    const onSelect = vi.fn()
    render(<ThemePicker text={TEXT} selected="amber" onSelect={onSelect} />)

    screen.getByRole('radio', { name: 'Crimson' }).click()

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('crimson')
  })
})
