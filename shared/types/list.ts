import type { Meta, PaginationMode, RequestHandler, SortOrder, StateManager } from './common'
import type { Columns } from './columns'

/**
 * Props both packages accept. `filters` and the callbacks are framework specific, so they live in
 * `ListProps` and `ListProps` (Vue takes `filters` as initial values and uses emits).
 */
export interface ListPropsBase<T = unknown> {
  /** Unique identifier for the data source (API route or key). */
  endpoint: string
  idKey?: string
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: SortOrder
  search?: string
  columns: Columns
  version?: number | string
  paginationMode?: PaginationMode
  /** Passed through to `requestHandler` and `stateManager`; the list never reads it. */
  meta?: Meta
  /** Fetches list data. Define once and reuse across lists. */
  requestHandler: RequestHandler<T>
  /** Optional persistence layer for list UI state. */
  stateManager?: StateManager
}
