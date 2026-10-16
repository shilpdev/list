import type { ColumnSettings, Columns, UpdateColumnFn } from './columns'

/** Types shared across the list root and its components that do not belong to a single component. */

/** Sort direction used by list queries. */
export type SortOrder = 'asc' | 'desc' | ''

/** How the list loads additional pages. */
export type PaginationMode = 'pagination' | 'loadMore'

/** Dynamic filter values applied to a list query. */
export type Filters = Record<string, unknown>

/** Free-form JSON object passed through list configuration and API responses. */
export type Meta = Record<string, unknown>

/**
 * Single context object passed to `requestHandler` and every `stateManager` method.
 * `isRefresh` is only set by refresh requests.
 */
export interface ListContext {
  endpoint: string
  version?: number | string
  meta?: Meta
  page: number
  perPage: number
  search: string
  sortBy: string
  sortOrder: SortOrder
  filters: Filters
  columnSettings?: ColumnSettings
  isRefresh?: boolean
}

/** Partial state restored by `stateManager.get()`. */
export interface SavedListState {
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: SortOrder
  search?: string
  filters?: Filters
  columnSettings?: ColumnSettings
}

/** Standard shape returned by `requestHandler`. */
export interface ListResponse<T = unknown> {
  rows: T[]
  count: number
  meta?: Meta
}

/** Async function responsible for fetching list data. */
export type RequestHandler<T = unknown> = (context: ListContext) => Promise<ListResponse<T>>

/** Optional persistence layer for list UI state. */
export interface StateManager {
  init?: (context: ListContext) => void
  get?: (context: ListContext) => SavedListState | null
  set?: (context: ListContext) => void
}

/** Actions exposed on list state for pagination, search, filters, and selection. */
export interface ListHandlers<T = unknown> {
  setPage: (page: number | string, context?: Partial<ListContext>) => void
  setPerPage: (perPage: number) => void
  setSearch: (search: string) => void
  setSort: (sort: { by: string; order: 'asc' | 'desc' }) => void
  setFilters: (filters: Filters) => void
  clearFilters: () => void
  loadMore: () => void
  refresh: (context?: Partial<ListContext>) => void
  setSelection: (selection: T[]) => void
  updateRowById: (row: Partial<T>, id: string | number) => void
  updateColumn?: UpdateColumnFn
}

/** Full reactive list state exposed to UI components and composables. */
export interface ListState<T = unknown> extends ListHandlers<T> {
  rows: T[]
  response: ListResponse<T> | null
  error: Error | null
  count: number
  selection: T[]
  pagination: {
    page: number
    perPage: number
    hasMore: boolean
  }
  loader: {
    isLoading: boolean
    initialLoading: boolean
  }
  sortBy: string | null
  sortOrder: SortOrder
  search: string
  filters: Filters
  columns: Columns
  columnSettings?: ColumnSettings
  isEmpty: boolean
  hasActiveFilters: boolean
  isInitializing?: boolean
  idKey?: string
}

/** Context value provided by a list instance to its child components. */
export interface ListInstanceContext<T = unknown> {
  listState: ListState<T>
}
