// The console's table: TanStack Table with sorting and pagination, plus the loading and empty
// states every data view shows. Build columns with `createDataTableColumns<Row>()`.

import { useTranslation } from '@collabo/i18n'
import { useTable, type RowData, type TableOptions } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react'

import { size } from '../../tokens/index.ts'
import { dataTableFeatures } from './data-table-features.ts'
import styles from './data-table.module.css'
import { EmptyState } from './empty-state.tsx'
import focus from './focus.module.css'
import { Pagination } from './pagination.tsx'
import { Skeleton } from './skeleton.tsx'

export type DataTableProps<TData extends RowData> = {
  /** Translated; names the table for screen readers. */
  readonly caption: string
  /** Build with `createDataTableColumns<Row>().columns([...])`, which keeps each column's value type. */
  readonly columns: TableOptions<typeof dataTableFeatures, TData>['columns']
  readonly data: readonly TData[]
  readonly loading?: boolean
  readonly pageSize?: number
  /** Translated; defaults to "Nothing here yet". */
  readonly emptyTitle?: string
  readonly emptyBody?: string
}

const loadingRows = 5

export function DataTable<TData extends RowData>({
  caption,
  columns,
  data,
  loading = false,
  pageSize = 20,
  emptyTitle,
  emptyBody,
}: DataTableProps<TData>) {
  const { t } = useTranslation()
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: [...data],
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })
  const headerGroups = table.getHeaderGroups()
  const rows = table.getRowModel().rows
  const columnCount = Math.max(table.getAllLeafColumns().length, 1)
  const pageIndex = table.state.pagination.pageIndex

  return (
    <div className={styles.wrapper}>
      <div className={styles.scroller}>
        <table className={styles.table} aria-busy={loading || undefined}>
          <caption className={styles.caption}>{caption}</caption>
          <thead>
            {headerGroups.map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  const SortIcon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={styles.th}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className={`${styles.sort} ${focus.ring}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          <SortIcon
                            size={size.icon.sm}
                            strokeWidth={size.iconStroke}
                            aria-hidden="true"
                            className={sorted ? undefined : styles.sortIdle}
                          />
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: loadingRows }, (_, row) => (
                  <tr key={`loading-${row}`} aria-hidden="true">
                    {Array.from({ length: columnCount }, (__, cell) => (
                      <td key={cell} className={styles.td}>
                        <Skeleton />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={row.id} className={styles.row}>
                    {row.getAllCells().map((cell) => (
                      // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the column's renderer supplies the cell text
                      <td key={cell.id} className={styles.td}>
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {loading ? <output className={styles.srOnly}>{t('state.loading')}</output> : null}
      </div>
      {!loading && data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={emptyTitle ?? t('table.empty.title')}
          body={emptyBody ?? t('table.empty.body')}
        />
      ) : null}
      {!loading && table.getPageCount() > 1 ? (
        <Pagination pageIndex={pageIndex} pageCount={table.getPageCount()} onPageChange={table.setPageIndex} />
      ) : null}
    </div>
  )
}
