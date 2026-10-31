import type {
  Meta,
  PaginationMode,
  RequestHandler,
  RequestHandlerResponse,
  SortOrder,
  StateManager,
} from './common'
import type { Column } from './columns'
import type { Filter } from './filters'

/**
 * Props both packages accept. The callbacks are framework specific: React takes them as props
 * (`EventProps`) and Vue emits them (`Events`).
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
  columns: Column[]
  /** Initial filters, one per column. Read once at setup; change them later with `setFilter`, `setFilters` or `clearFilters`. */
  filters?: Filter[]
  version?: number | string
  paginationMode?: PaginationMode
  /** Passed through to `requestHandler` and `stateManager`; the list never reads it. */
  meta?: Meta
  /** Fetches list data. Define once and reuse across lists. */
  requestHandler: RequestHandler<T>
  /**
   * A response fetched earlier (for example on the server with Nuxt or Next). The list starts with
   * it and skips the first request, unless `stateManager.get` restores saved values: those may ask
   * for a different query, so the list fetches again.
   */
  initialResponse?: RequestHandlerResponse<T>
  /** Optional persistence layer for list UI state. */
  stateManager?: StateManager
}
