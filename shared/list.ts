import type {
  Filters,
  ListResponse,
  Meta,
  PaginationMode,
  RequestHandler,
  SortOrder,
  StateManager,
} from './common'
import type { Columns } from './columns'

/**
 * Root list configuration shared by React and Vue implementations.
 */
export interface ListOptions<T = unknown> {
  /** Unique identifier for the data source (API route or key). */
  endpoint: string
  idKey?: string
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: SortOrder
  count?: number
  search?: string
  filters?: Filters
  columns?: Columns
  version?: number | string
  paginationMode?: PaginationMode
  /** Passed through to `requestHandler` and `stateManager`; the list never reads it. */
  meta?: Meta
  /** Fetches list data. Define once and reuse across lists. */
  requestHandler: RequestHandler<T>
  /** Optional persistence layer for list UI state. */
  stateManager?: StateManager
  onResponse?: (response: ListResponse<T>) => void
  afterPageChange?: (response: ListResponse<T>) => void
  afterLoadMore?: (response: ListResponse<T>) => void
  onRowSelect?: (selection: T[], previous: T[]) => void
  onFiltersChange?: (filters: Filters) => void
}
