import type { ColumnSettings, Columns, UpdateColumn } from './columns'

/** Types shared across the list root and its components that do not belong to a single component. */

/** Sort direction used by list queries. */
export type SortOrder = 'asc' | 'desc' | ''

/** How the list loads additional pages. */
export type PaginationMode = 'pagination' | 'loadMore'

/** Dynamic filter values applied to a list query. */
export type Filters = Record<string, unknown>

/** Free-form JSON object passed through list configuration and API responses. */
export type Meta = Record<string, unknown>

/** Standard shape returned by `requestHandler`. */
export interface RequestHandlerResponse<T = unknown> {
  rows: T[]
  count: number
  meta?: Meta
}

/**
 * Fetches list data. Receives a snapshot of the list state for the request being made
 * (for example `page` is the page being requested and `isRefresh` marks a refresh).
 */
export type RequestHandler<T = unknown> = (state: State) => Promise<RequestHandlerResponse<T>>

/** Optional persistence layer for list UI state. Each method receives a snapshot of the list state. */
export interface StateManager {
  init?: (state: State) => void
  /** Return the saved values to restore (`page`, `perPage`, `sortBy`, `sortOrder`, `search`, `filters`, `columnSettings`); other fields are ignored. */
  get?: (state: State) => Partial<State> | null
  set?: (state: State) => void
}

/** Actions exposed on the list context for pagination, search, filters, and selection. */
export interface Actions<T = unknown> {
  setPage: (page: number) => void
  setPerPage: (perPage: number) => void
  setSearch: (search: string) => void
  setSortBy: (sortBy: string) => void
  setSortOrder: (sortOrder: SortOrder) => void
  setFilters: (filters: Filters) => void
  clearFilters: () => void
  loadMore: () => void
  refresh: () => void
  setSelection: (selection: T[]) => void
  updateRowById: (row: Partial<T>, id: string | number) => void
  updateColumn: UpdateColumn
}

/** Reactive list data without any methods. This is what `requestHandler` and `stateManager` receive. */
export interface State<T = unknown> {
  endpoint: string
  version: number | string
  meta: Meta
  /** Each row also carries a 1-based `_index` across pages. */
  rows: T[]
  response: RequestHandlerResponse<T> | null
  error: Error | null
  count: number
  selection: T[]
  page: number
  perPage: number
  hasMore: boolean
  isLoading: boolean
  isInitialLoading: boolean
  /** `true` while the request in progress is a refresh. */
  isRefresh: boolean
  sortBy: string
  sortOrder: SortOrder
  search: string
  filters: Filters
  columns: Columns
  columnSettings: ColumnSettings
  isEmpty: boolean
  hasActiveFilters: boolean
  idKey: string
}

/** The state plus every action. Provided to child components and passed to slots and render functions. */
export interface Context<T = unknown> extends State<T>, Actions<T> {}

/** Slot scope for components that only use the list context. Computed scopes extend it. */
export interface ListScope<T = unknown> {
  context: Context<T>
}
