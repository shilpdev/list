import type { Filters, ListOptions, ListResponse } from '../../../shared'

/** Props for the ShilpList root component. */
export type ShilpListProps<T = unknown> = ListOptions<T>

/** Emits for the ShilpList root component. */
export interface ShilpListEmits<T = unknown> {
  response: [response: ListResponse<T>]
  afterPageChange: [response: ListResponse<T>]
  afterLoadMore: [response: ListResponse<T>]
  rowSelect: [selection: T[], previous: T[]]
  filtersChange: [filters: Filters]
}
