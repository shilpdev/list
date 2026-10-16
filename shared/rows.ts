import type { SortOrder } from './common'

/** Row enriched with a display index (used by the rows scope). */
export type SerializedListRow<T> = T & {
  _index: number
}

/** Scope for the rows slot. */
export interface RowsScope<T = unknown> {
  rows: SerializedListRow<T>[]
  isLoading: boolean
  setSort: (sort: { by: string; order: 'asc' | 'desc' }) => void
  sortBy: string | null
  sortOrder: SortOrder
}

/** Arguments passed to a custom row renderer. */
export interface RenderRowArgs<T = unknown> {
  row: any
  index: number
}
