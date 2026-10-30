import type { Column } from './columns'
import type { FilterState, FilterValues } from './filters'

/** Types shared across the list root and its components that do not belong to a single component. */

/** Sort direction used by list queries. */
export type SortOrder = 'asc' | 'desc' | ''

/** What started the request: a list action, or `mount` for the first one. */
export type RequestTrigger =
  | 'mount'
  | 'page'
  | 'perPage'
  | 'search'
  | 'sortBy'
  | 'sortOrder'
  | 'filters'
  | 'columns'
  | 'loadMore'
  | 'refresh'

/** The value of a row's `idKey` field. */
export type RowId = string | number

/**
 * Selection state across the loaded rows: `none` when nothing is selected,
 * `all` when every loaded row is selected, `partial` otherwise.
 */
export type SelectionState = 'none' | 'partial' | 'all'

/** How the list loads additional pages. */
export type PaginationMode = 'pagination' | 'loadMore'

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
 * (for example `page` is the page being requested and `requestTrigger` says what started it).
 */
export type RequestHandler<T = unknown> = (state: State) => Promise<RequestHandlerResponse<T>>

/** Optional persistence layer for list UI state. Each method receives a snapshot of the list state. */
export interface StateManager {
  init?: (state: State) => void
  /** Return the saved values to restore (`page`, `perPage`, `sortBy`, `sortOrder`, `search`, `filters`, `columns`); other fields are ignored. */
  get?: (state: State) => Partial<State> | null
  set?: (state: State) => void
  /** Remove what `set` saved. Runs when the list's `clearState` action is called. */
  clear?: (state: State) => void
}

/** Actions exposed on the list context for pagination, search, filters, and selection. */
export interface Actions<T = unknown> {
  setPage: (page: number) => void
  setPerPage: (perPage: number) => void
  setSearch: (search: string) => void
  setSortBy: (sortBy: string) => void
  setSortOrder: (sortOrder: SortOrder) => void
  /** Sets the value of one filter, adding it when the column is new. */
  setFilter: (column: string, value: unknown) => void
  /** Sets several filters at once; the others keep their value. */
  setFilters: (values: FilterValues) => void
  clearFilters: () => void
  loadMore: () => void
  refresh: () => void
  /** Calls `stateManager.clear`. The list itself is not reset. */
  clearState: () => void
  /** Adds the row with this id (its `idKey` field) to the selection, or removes it when it is already there. */
  toggleRowSelection: (id: RowId) => void
  /** Selects every loaded row, or clears the selection when all loaded rows are already selected. */
  toggleAllRowsSelection: () => void
  updateRowById: (row: Partial<T>, id: RowId) => void
  /** Sets one key of one column, such as `visibility` or a key of your own. Unknown columns are ignored. */
  setColumn: (column: string, key: string, value: unknown) => void
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
  /** Ids of the selected rows. */
  selection: RowId[]
  /** Whether `none`, `partial`, or `all` of the loaded rows are selected. */
  selectionState: SelectionState
  page: number
  perPage: number
  hasMore: boolean
  isLoading: boolean
  isInitialLoading: boolean
  /** What started the last request, including the one in progress. */
  requestTrigger: RequestTrigger
  sortBy: string
  sortOrder: SortOrder
  search: string
  filters: FilterState[]
  columns: Column[]
  isEmpty: boolean
  idKey: string
}

/** The state plus every action. Provided to child components and passed to slots and render functions. */
export interface Context<T = unknown> extends State<T>, Actions<T> {}

/** Slot scope for components that only use the list context. Computed scopes extend it. */
export interface ListScope<T = unknown> {
  context: Context<T>
}
