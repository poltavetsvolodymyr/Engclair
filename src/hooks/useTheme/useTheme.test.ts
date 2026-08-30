/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_THEME, loadTheme } from '@/lib/theme'

import { useTheme } from './useTheme'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('useTheme', () => {
  it('starts on the default theme', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe(DEFAULT_THEME)
  })

  it('mirrors the theme onto <html data-theme> for the CSS to match', () => {
    renderHook(() => useTheme())

    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME)
  })

  it('updates the attribute when the theme changes', () => {
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setTheme('crimson'))

    expect(result.current.theme).toBe('crimson')
    expect(document.documentElement.dataset.theme).toBe('crimson')
  })

  it('persists the choice', () => {
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setTheme('forest'))

    expect(loadTheme()).toBe('forest')
  })

  it('restores the saved choice on the next mount', () => {
    const first = renderHook(() => useTheme())
    act(() => first.result.current.setTheme('indigo'))
    first.unmount()

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('indigo')
  })
})
