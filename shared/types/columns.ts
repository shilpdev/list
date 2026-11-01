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

export interface ColumnsScope extends ListScope {
  setColumn: (column: string, key: string, value: unknown) => void
}

export interface ColumnScope extends ListScope, Column {
  setValue: (key: string, value: unknown) => void
}
