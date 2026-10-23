import type { ListScope } from './common'

/** Scope for a row slot. */
export interface RowScope<T = any> extends ListScope {
  row: T
  index: number
  /** `true` when this row's id is in `context.selection`. */
  isSelected: boolean
  /** Adds this row to the selection, or removes it when it is already there. */
  toggleSelection: () => void
}
