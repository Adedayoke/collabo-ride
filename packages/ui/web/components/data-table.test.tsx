// @vitest-environment happy-dom
// covers: AC-4 (the console DataTable sorts, pages, and shows loading and empty states)

import { createI18n, I18nextProvider } from '@collabo/i18n'
import { cleanup, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { createDataTableColumns } from './data-table-features.ts'
import { DataTable, type DataTableProps } from './data-table.tsx'

type Trip = { readonly rider: string; readonly fare: number }

const tripColumns = createDataTableColumns<Trip>()
const columns = tripColumns.columns([
  tripColumns.accessor('rider', { header: 'Rider', sortFn: 'text' }),
  tripColumns.accessor('fare', { header: 'Fare', sortFn: 'basic' }),
])

// 25 trips, Rider 01 to Rider 25, so a page size of 10 gives three pages.
const trips: readonly Trip[] = Array.from({ length: 25 }, (_, index) => ({
  rider: `Rider ${String(index + 1).padStart(2, '0')}`,
  fare: (index + 1) * 100,
}))

const i18n = createI18n({ surface: 'console', locale: 'en', pseudo: false })
const withI18n = (ui: ReactNode) => <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>

const renderTable = (props: Partial<DataTableProps<Trip>> = {}) => {
  const tableProps: DataTableProps<Trip> = { caption: 'Trips', columns, data: trips, pageSize: 10, ...props }
  const view = render(withI18n(<DataTable {...tableProps} />))
  return {
    ...view,
    rerenderTable: (next: Partial<DataTableProps<Trip>>) =>
      view.rerender(withI18n(<DataTable {...tableProps} {...next} />)),
  }
}

/** The rider names in the body rows, in the order shown. */
const visibleRiders = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent)

const pageStatus = () => within(screen.getByRole('navigation', { name: 'Pages' })).getByText(/^Page \d+ of \d+$/)

afterEach(cleanup)

describe('DataTable paging', () => {
  it('shows the first page and the page count', () => {
    renderTable()

    expect(visibleRiders()).toHaveLength(10)
    expect(visibleRiders()[0]).toBe('Rider 01')
    expect(pageStatus().textContent).toBe('Page 1 of 3')
  })

  it('moves to the next page and stays there', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    // The page change renders the table again with the same rows; it must not bounce back to page 1.
    expect(await screen.findByText('Page 2 of 3')).toBeTruthy()
    expect(visibleRiders()[0]).toBe('Rider 11')
  })

  it('keeps the page when the parent renders again with the same rows', async () => {
    const user = userEvent.setup()
    const { rerenderTable } = renderTable()
    await user.click(screen.getByRole('button', { name: 'Next page' }))

    rerenderTable({ caption: 'Trips today' })

    expect(await screen.findByText('Page 2 of 3')).toBeTruthy()
    expect(visibleRiders()[0]).toBe('Rider 11')
  })

  it('returns to the first page when it receives new rows', async () => {
    const user = userEvent.setup()
    const { rerenderTable } = renderTable()
    await user.click(screen.getByRole('button', { name: 'Next page' }))

    rerenderTable({ data: trips.slice(5) })

    expect(await screen.findByText('Page 1 of 2')).toBeTruthy()
    expect(visibleRiders()[0]).toBe('Rider 06')
  })

  it('pages back with Previous', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: 'Next page' }))

    await user.click(screen.getByRole('button', { name: 'Previous page' }))

    expect(await screen.findByText('Page 1 of 3')).toBeTruthy()
    expect(visibleRiders()[0]).toBe('Rider 01')
  })

  it('disables Previous on the first page and Next on the last page', async () => {
    const user = userEvent.setup()
    renderTable()
    const previous = screen.getByRole('button', { name: 'Previous page' })
    const next = screen.getByRole('button', { name: 'Next page' })
    expect(previous.hasAttribute('disabled')).toBe(true)

    await user.click(next)
    await user.click(next)

    expect(await screen.findByText('Page 3 of 3')).toBeTruthy()
    expect(next.hasAttribute('disabled')).toBe(true)
    expect(visibleRiders()).toEqual(['Rider 21', 'Rider 22', 'Rider 23', 'Rider 24', 'Rider 25'])
  })

  it('hides the page controls when everything fits on one page', () => {
    renderTable({ data: trips.slice(0, 10) })

    expect(screen.queryByRole('navigation', { name: 'Pages' })).toBeNull()
    expect(visibleRiders()).toHaveLength(10)
  })
})

describe('DataTable sorting', () => {
  it('sorts by a column and announces the order on the header', async () => {
    const user = userEvent.setup()
    renderTable()
    const riderHeader = screen.getByRole('columnheader', { name: 'Rider' })
    expect(riderHeader.getAttribute('aria-sort')).toBeNull()

    await user.click(within(riderHeader).getByRole('button'))
    expect(riderHeader.getAttribute('aria-sort')).toBe('ascending')
    expect(visibleRiders()[0]).toBe('Rider 01')

    await user.click(within(riderHeader).getByRole('button'))
    expect(riderHeader.getAttribute('aria-sort')).toBe('descending')
    expect(visibleRiders()[0]).toBe('Rider 25')
  })

  it('goes back to the first page when the sort changes', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(await screen.findByText('Page 2 of 3')).toBeTruthy()

    await user.click(within(screen.getByRole('columnheader', { name: 'Rider' })).getByRole('button'))

    expect(await screen.findByText('Page 1 of 3')).toBeTruthy()
  })
})

describe('DataTable states', () => {
  it('names the table with its caption', () => {
    renderTable()

    expect(screen.getByRole('table', { name: 'Trips' })).toBeTruthy()
  })

  it('shows skeleton rows, marks the table busy, and announces loading', () => {
    renderTable({ data: [], loading: true })

    expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('true')
    expect(screen.getByRole('status').textContent).toBe('Loading')
    expect(screen.queryByRole('navigation', { name: 'Pages' })).toBeNull()
    expect(screen.queryByText('Nothing here yet')).toBeNull()
  })

  it('shows the default empty state when there are no rows', () => {
    renderTable({ data: [] })

    expect(screen.getByText('Nothing here yet')).toBeTruthy()
    expect(screen.getByText('Rows will show up here as soon as there are any.')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Pages' })).toBeNull()
  })

  it('uses the empty title and body it is given', () => {
    renderTable({ data: [], emptyTitle: 'No trips today', emptyBody: 'Trips appear as riders book them.' })

    expect(screen.getByText('No trips today')).toBeTruthy()
    expect(screen.getByText('Trips appear as riders book them.')).toBeTruthy()
  })
})
