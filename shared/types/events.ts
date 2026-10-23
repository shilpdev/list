import type { RequestHandlerResponse, RowId, State } from './common'
import type { FilterState } from './filters'

/**
 * Every event the list fires, under the same name in both packages: React takes them as props
 * (`EventProps`), Vue emits them.
 *
 * One successful request fires before* -> onResponse -> after*. A failed request fires before* ->
 * onError. `onRowSelect` fires only when the selection changes. See LIFECYCLE.md.
 */
export interface Events<T = unknown> {
  beforePageChange: [state: State]
  afterPageChange: [response: RequestHandlerResponse<T>]
  beforeLoadMore: [state: State]
  afterLoadMore: [response: RequestHandlerResponse<T>]
  onResponse: [response: RequestHandlerResponse<T>]
  onError: [error: Error]
  onRowSelect: [selection: RowId[], previous: RowId[]]
  onFiltersChange: [filters: FilterState[]]
}

export type EventProps<T = unknown> = {
  [K in keyof Events<T>]?: (...args: Events<T>[K]) => void
}
