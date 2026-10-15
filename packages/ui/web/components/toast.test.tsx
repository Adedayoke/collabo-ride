// @vitest-environment happy-dom
// covers: AC-4 (the console toast is announced politely, like the native one)

import { createI18n, I18nextProvider } from '@collabo/i18n'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ToastHost } from './toast.tsx'
import { Toast } from './toast-store.ts'

const i18n = createI18n({ surface: 'console', locale: 'en', pseudo: false })

afterEach(() => {
  act(() => Toast.hide())
  cleanup()
})

describe('ToastHost', () => {
  it.each([
    ['a plain toast', {}],
    ['a toast with an action', { tone: 'caution', action: { label: 'Try again', onSelect: () => undefined } }],
  ] as const)('announces %s through a polite status region', async (_, options) => {
    render(
      <I18nextProvider i18n={i18n}>
        <ToastHost />
      </I18nextProvider>,
    )

    act(() => Toast.show('Trip saved', options))

    // Radix fills its announcer a frame after the toast mounts.
    const announcement = await waitFor(() => {
      const region = screen.getAllByRole('status').find((element) => element.textContent?.includes('Trip saved'))
      if (!region) throw new Error('toast not announced yet')
      return region
    })
    expect(announcement.getAttribute('aria-live')).toBe('polite')
  })
})
