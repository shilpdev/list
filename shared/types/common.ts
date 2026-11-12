import type { Column } from './columns'
import type { FilterState, FilterValues } from './filters'

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

export type PaginationMode = 'pagination' | 'loadMore'

/** Free-form JSON object passed through list configuration and API responses. */
export type Meta = Record<string, unknown>

/** Standard shape returned by `requestHandler`. */
export interface RequestHandlerResponse<T = unknown> {
  rows: T[]
  totalRows: number
  meta?: Meta
}

/**
 * Fetches list data. Receives a snapshot of the list state for the request being made
 * (for example `page` is the page being requested). The list passes a full `State`, but the
 * parameter is `InitialState` so you can also call the handler yourself before a list exists,
 * for example on the server to build `initialResponse`.
 */
export type RequestHandler<T = unknown> = (state: InitialState) => Promise<RequestHandlerResponse<T>>

/**
 * What a list knows before `stateManager.get` runs: the props and their defaults. Nothing is
 * loaded yet, so there are no rows, flags or response.
 */
export type InitialState = Pick<
  State,
  | 'endpoint'
  | 'version'
  | 'meta'
  | 'idKey'
  | 'page'
  | 'perPage'
  | 'sortBy'
  | 'sortOrder'
  | 'search'
  | 'filters'
  | 'columns'
>

/** Optional persistence layer for list UI state. Each method receives a snapshot of the list state. */
export interface StateManager {
  init?: (state: State) => void
  /*
   * Return the saved values to restore (`page`, `perPage`, `sortBy`, `sortOrder`, `search`,
   * `filters`, `columns`); other fields are ignored. `columns` is used as returned, so it must be
   * a complete `Column[]`. Runs once at setup, before any request. An error it throws is not
   * caught, so the list does not render.
   */
  get?: (state: InitialState) => Partial<InitialState> | null
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
  totalRows: number
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
