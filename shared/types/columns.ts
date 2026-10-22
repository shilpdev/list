import type { ListScope } from './common'

/**
 * A column of the list. `visibility` is managed by the list and defaults to `true` when you leave it
 * out (it is always set in `State`); add any other keys you need.
 */
export interface Column {
  name: string
  label?: string
  visibility?: boolean
  [key: string]: unknown
}

/** Column definitions for a list. */
export type Columns = Column[]

/** Scope for the `columns` slot. */
export interface ColumnsScope extends ListScope {
  setColumn: (column: string, key: string, value: unknown) => void
}

/** Scope for a column slot, which is named after its column. */
export interface ColumnScope extends ListScope, Column {
  setValue: (key: string, value: unknown) => void
}
