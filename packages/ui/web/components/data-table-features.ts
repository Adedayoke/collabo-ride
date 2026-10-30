// The features every console table has, declared once outside components (TanStack Table v9
// stitches them in statically), and a column helper typed against them.

import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
})

export type DataTableColumn<TData extends RowData> = ColumnDef<typeof dataTableFeatures, TData>

/** A column helper bound to the table's features: `createDataTableColumns<Trip>().accessor(…)`. */
export const createDataTableColumns = <TData extends RowData>() => createColumnHelper<typeof dataTableFeatures, TData>()
