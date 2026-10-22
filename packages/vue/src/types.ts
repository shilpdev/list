import type { Filter, ListProps } from '@shared'

// The callbacks are emits (`Events`), so Vue only adds `filters`.
export interface ListPropsVue<T = unknown> extends ListProps<T> {
  /** Initial filters, one per column. Read once at setup; change them later with `ListFilters`. */
  filters?: Filter[]
}
