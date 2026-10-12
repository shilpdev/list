import type { Filters, ListOptions, ListProviderConfig, ListResponse } from '../../../shared'

/** Props for the VueList root component. */
export interface VueListProps<T = unknown> extends ListOptions<T>, ListProviderConfig<T> {}

/** Emits for the VueList root component. */
export interface VueListEmits<T = unknown> {
  response: [response: ListResponse<T>]
  afterPageChange: [response: ListResponse<T>]
  afterLoadMore: [response: ListResponse<T>]
  rowSelect: [selection: T[], previous: T[]]
  filtersChange: [filters: Filters]
}
