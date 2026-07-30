import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<() => void>()

  const mediaQueryList = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      listeners.add(listener)
    }),
    removeEventListener: vi.fn((_event: string, listener: () => void) => {
      listeners.delete(listener)
    }),
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQueryList),
  )

  return {
    dispatchChange(next: boolean) {
      matches = next
      act(() => {
        listeners.forEach((listener) => listener())
      })
    },
    mediaQueryList,
  }
}

function isDarkApplied() {
  return document.documentElement.classList.contains('dark')
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ThemeProvider', () => {
  it('defaults to system theme and follows the OS preference', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('system')
    expect(isDarkApplied()).toBe(true)
  })

  it('does not apply dark when system prefers light', () => {
    mockMatchMedia(false)

    renderHook(() => useTheme(), { wrapper: ThemeProvider })

    expect(isDarkApplied()).toBe(false)
  })

  it('initializes from a persisted theme instead of system', () => {
    localStorage.setItem('theme', 'dark')
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('dark')
    expect(isDarkApplied()).toBe(true)
  })

  it('never applies dark for an explicit light theme, even if the OS prefers dark', () => {
    localStorage.setItem('theme', 'light')
    mockMatchMedia(true)

    renderHook(() => useTheme(), { wrapper: ThemeProvider })

    expect(isDarkApplied()).toBe(false)
  })

  it('setTheme persists the choice and updates the applied class', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(isDarkApplied()).toBe(true)
  })

  it('reacts to OS preference changes while in system mode', () => {
    const { dispatchChange } = mockMatchMedia(false)

    renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(isDarkApplied()).toBe(false)

    dispatchChange(true)

    expect(isDarkApplied()).toBe(true)
  })

  it('stops reacting to OS preference changes after switching away from system', () => {
    const { dispatchChange, mediaQueryList } = mockMatchMedia(false)

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    act(() => {
      result.current.setTheme('light')
    })

    expect(mediaQueryList.removeEventListener).toHaveBeenCalled()

    dispatchChange(true)

    expect(isDarkApplied()).toBe(false)
  })
})
