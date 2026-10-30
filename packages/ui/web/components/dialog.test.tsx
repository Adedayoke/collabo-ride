// @vitest-environment happy-dom
// covers: AC-4 (the console Dialog returns focus to the control that opened it)

import { createI18n, I18nextProvider } from '@collabo/i18n'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { Dialog } from './dialog.tsx'

const i18n = createI18n({ surface: 'console', locale: 'en', pseudo: false })

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <I18nextProvider i18n={i18n}>
      <button type="button" onClick={() => setOpen(true)}>
        Cancel trip
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Cancel this trip?"
        message="The rider is told right away."
        confirmLabel="Yes, cancel"
        onConfirm={() => setOpen(false)}
      />
    </I18nextProvider>
  )
}

afterEach(cleanup)

describe('Dialog', () => {
  it.each([
    ['Escape', async (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
    [
      'the cancel button',
      async (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Cancel' })),
    ],
    [
      'confirm',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Yes, cancel' })),
    ],
  ])('returns focus to the opener when closed with %s', async (_, close) => {
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Cancel trip' })
    await user.click(opener)
    expect(await screen.findByRole('dialog')).toBeTruthy()

    await close(user)

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(opener)
  })
})
