import type { ListScope } from './common'

/** Row enriched with a display index (used by the rows scope). */
export type SerializedListRow<T> = T & {
  _index: number
}

/** Scope for the rows slot. */
export interface RowsScope<T = unknown> extends ListScope<T> {
  rows: SerializedListRow<T>[]
}

/** Arguments passed to a custom row renderer. */
export interface RenderRowArgs<T = unknown> {
  row: any
  index: number
}
