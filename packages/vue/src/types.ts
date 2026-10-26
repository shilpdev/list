import type { Filter, ListPropsBase } from '@shared'

// The callbacks are emits (`Events`), so Vue only adds `filters`.
export interface ListProps<T = unknown> extends ListPropsBase<T> {
  /** Initial filters, one per column. Read once at setup; change them later with `ListFilters`. */
  filters?: Filter[]
}
