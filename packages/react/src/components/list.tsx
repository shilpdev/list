import type {
  ColumnSettings,
  Context,
  EventProps,
  Filters,
  ListProps,
  RequestHandlerResponse,
  SortOrder,
  State,
} from '@shared'
import {
  DEFAULT_FILTERS,
  DEFAULT_ID_KEY,
  DEFAULT_META,
  DEFAULT_PAGE,
  DEFAULT_PAGINATION_MODE,
  DEFAULT_PER_PAGE,
  DEFAULT_SEARCH,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  DEFAULT_VERSION,
} from '@shared/constants'
import {
  computeHasMore,
  getColumns,
  getRestoredState,
  hasActiveFilters,
  hasSelectionChanged,
  mergeRows,
  patchRowById,
  rowNotFoundMessage,
  setColumnSetting,
  toError,
} from '@shared/utils'
import equal from 'fast-deep-equal'
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { ListContextProvider } from '../context/list-context'

export interface ListPropsReact<T = unknown> extends ListProps<T>, EventProps<T> {
  filters?: Filters
  children?: ReactNode | ((context: Context<T>) => ReactNode)
  /** React 19 ref-as-prop; exposes the list context as an imperative API. */
  ref?: Ref<Context<T>>
}

function List<T = unknown>({
  ref,
  children,
  endpoint,
  idKey = DEFAULT_ID_KEY,
  page = DEFAULT_PAGE,
  perPage = DEFAULT_PER_PAGE,
  sortBy = DEFAULT_SORT_BY,
  sortOrder = DEFAULT_SORT_ORDER,
  search = DEFAULT_SEARCH,
  filters = DEFAULT_FILTERS,
  columns,
  version = DEFAULT_VERSION,
  paginationMode = DEFAULT_PAGINATION_MODE,
  meta = DEFAULT_META,
  requestHandler,
  stateManager,
  beforePageChange,
  afterPageChange,
  beforeLoadMore,
  afterLoadMore,
  onResponse,
  onError,
  onRowSelect,
  onFiltersChange,
}: ListPropsReact<T>) {
  const isLoadMore = paginationMode === 'loadMore'

  const [defaultFilters] = useState<Filters>(() => ({ ...filters }))
  const [localPage, setLocalPage] = useState<number>(page)
  const [localPerPage, setLocalPerPage] = useState<number>(perPage)
  const [localSortBy, setLocalSortBy] = useState<string>(sortBy)
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>(sortOrder)
  const [localSearch, setLocalSearch] = useState<string>(search)
  const [localFilters, setFiltersState] = useState<Filters>(() => ({ ...filters }))
  const [columnSettings, setColumnSettings] = useState<ColumnSettings>({})
  const [rows, setRowsState] = useState<T[]>([])
  const [selection, setSelectionState] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<RequestHandlerResponse<T> | null>(null)
  const [count, setCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [isRefresh, setIsRefresh] = useState<boolean>(false)
  const [isReady, setIsReady] = useState<boolean>(false)
  // Bumped by refresh, so the query effect refetches even when no query value changed.
  const [refreshKey, setRefreshKey] = useState<number>(0)
  // Bumped per response, so the response effect runs once the new rows are committed.
  const [responseKey, setResponseKey] = useState<number>(0)

  const requestIdRef = useRef(0)
  const initializedRef = useRef(false)
  const previousSelectionRef = useRef(selection)
  const eventsRef = useRef<EventProps<T>>({})
  // Read through a ref: an inline `stateManager` object is new on every parent render and would
  // otherwise rebuild `actions` and `context` with nothing changed.
  const stateManagerRef = useRef(stateManager)
  stateManagerRef.current = stateManager

  eventsRef.current = {
    beforePageChange,
    afterPageChange,
    beforeLoadMore,
    afterLoadMore,
    onResponse,
    onError,
    onRowSelect,
    onFiltersChange,
  }

  // A new `state` object only when one of its fields changes, so `context` and every consumer of it
  // update only on a real change.
  const state = useMemo((): State<T> => {
    return {
      endpoint,
      version,
      meta,
      idKey,
      page: localPage,
      perPage: localPerPage,
      sortBy: localSortBy,
      sortOrder: localSortOrder,
      search: localSearch,
      filters: localFilters,
      rows,
      response,
      error,
      count,
      selection,
      hasMore: computeHasMore(localPage, localPerPage, count),
      isLoading,
      isInitialLoading,
      isRefresh,
      columns: getColumns(columns, rows),
      columnSettings,
      isEmpty: rows.length === 0,
      hasActiveFilters: hasActiveFilters(localFilters, defaultFilters),
    }
  }, [
    endpoint,
    version,
    meta,
    idKey,
    localPage,
    localPerPage,
    localSortBy,
    localSortOrder,
    localSearch,
    localFilters,
    rows,
    response,
    error,
    count,
    selection,
    isLoading,
    isInitialLoading,
    isRefresh,
    columns,
    columnSettings,
    defaultFilters,
  ])

  // Lifecycle 3 to 5, one request. Only the query effect below calls this, so `state` is the
  // committed state of the render that changed the query.
  // 3. Request: `beforePageChange` / `beforeLoadMore` get the State being requested, then
  //    `requestHandler` runs.
  // 4. Response: rows are replaced (page mode) or appended (load-more) with their `_index` and
  //    selection resets. The response effect then runs `stateManager.set`, `onResponse` and
  //    `afterPageChange` / `afterLoadMore`.
  // 5. Error: error is set, rows and count are cleared and `onError` fires.
  function getData() {
    setError(null)
    setIsLoading(true)

    const currentRequestId = ++requestIdRef.current
    const requestState: State<T> = {
      ...state,
      error: null,
      isLoading: true,
    }

    if (isLoadMore) {
      eventsRef.current.beforeLoadMore?.(requestState)
    } else {
      eventsRef.current.beforePageChange?.(requestState)
    }

    requestHandler(requestState)
      .then((nextResponse) => {
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        setResponse(nextResponse)
        // Merge into the rows as they are now, so an `updateRowById` during the request is kept.
        setRowsState((previousRows) => {
          return mergeRows(previousRows, nextResponse.rows, {
            page: requestState.page,
            perPage: requestState.perPage,
            isLoadMore,
          })
        })
        setCount(nextResponse.count)
        // Keep the same array when nothing was selected, so the reset does not re-render.
        setSelectionState((previousSelection) => {
          if (previousSelection.length === 0) {
            return previousSelection
          }

          return []
        })
        setIsInitialLoading(false)
        setIsLoading(false)
        setIsRefresh(false)
        setResponseKey((key) => {
          return key + 1
        })
      })
      .catch((requestError: unknown) => {
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        const nextError = toError(requestError)

        setError(nextError)
        setRowsState([])
        setCount(0)
        setIsInitialLoading(false)
        setIsLoading(false)
        setIsRefresh(false)
        eventsRef.current.onError?.(nextError)
      })
  }

  // Lifecycle 6, actions. Query-changing actions only update local state; the query effect below
  // performs one request after React commits the combined changes. Rebuilt only when `state`
  // changes, so their identity is stable between renders that change nothing.
  const actions = useMemo(() => {
    function setPage(value: number) {
      if (!Number.isInteger(value) || value < 1 || value === state.page) {
        return
      }

      setLocalPage(value)
    }

    function setPerPage(value: number) {
      if (!Number.isInteger(value) || value < 1 || value === state.perPage) {
        return
      }

      setLocalPerPage(value)
      setLocalPage(1)
    }

    function setSearch(value: string) {
      if (value === state.search) {
        return
      }

      setLocalSearch(value)
      setLocalPage(1)
    }

    function setSortBy(value: string) {
      if (value === state.sortBy) {
        return
      }

      setLocalSortBy(value)
      setLocalPage(1)
    }

    function setSortOrder(value: SortOrder) {
      if (value === state.sortOrder) {
        return
      }

      setLocalSortOrder(value)
      setLocalPage(1)
    }

    function setFilters(nextFilters: Filters) {
      if (equal(state.filters, nextFilters)) {
        return
      }

      setFiltersState(nextFilters)
      setLocalPage(1)
      eventsRef.current.onFiltersChange?.(nextFilters)
    }

    function clearFilters() {
      setFilters({ ...defaultFilters })
    }

    function setSelection(value: T[]) {
      setSelectionState(value)
    }

    // Refetches the current page; load-more starts again from page 1. `refreshKey` makes the
    // query effect run even when no query value changes.
    function refresh() {
      setIsRefresh(true)

      if (isLoadMore) {
        setRowsState([])
        setLocalPage(1)
      }

      setRefreshKey((key) => {
        return key + 1
      })
    }

    function loadMore() {
      if (!state.hasMore || state.isLoading) {
        return
      }

      setLocalPage((currentPage) => {
        return currentPage + 1
      })
    }

    function updateRowById(row: Partial<T>, id: string | number) {
      const nextRows = patchRowById(state.rows, row, id, state.idKey)

      if (!nextRows) {
        console.warn(rowNotFoundMessage(state.idKey, id))
        return
      }

      setRowsState(nextRows)
    }

    // No derived field depends on columnSettings, so the saved State is complete without a render.
    function updateColumn(columnName: string, settingKey: string, value: unknown) {
      const nextColumnSettings = setColumnSetting(
        state.columnSettings,
        columnName,
        settingKey,
        value,
      )

      setColumnSettings(nextColumnSettings)
      stateManagerRef.current?.set?.({ ...state, columnSettings: nextColumnSettings })
    }

    return {
      setPage,
      setPerPage,
      setSearch,
      setSortBy,
      setSortOrder,
      setFilters,
      clearFilters,
      loadMore,
      refresh,
      setSelection,
      updateRowById,
      updateColumn,
    }
  }, [state, isLoadMore, defaultFilters])

  const context = useMemo((): Context<T> => {
    return { ...state, ...actions }
  }, [state, actions])

  useImperativeHandle(ref, () => context, [context])

  // Lifecycle 1 and 2: restore persisted state, initialize the state manager, then enable fetching.
  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    initializedRef.current = true
    let savedState: Partial<State> = {}

    try {
      savedState = stateManager?.get?.(state) ?? {}
    } catch (restoreError) {
      console.error(restoreError)
    }

    const restoredState = getRestoredState(savedState, isLoadMore)

    const initialState: State = {
      ...state,
      page: restoredState.page ?? (isLoadMore ? 1 : state.page),
      perPage: restoredState.perPage ?? state.perPage,
      sortBy: restoredState.sortBy ?? state.sortBy,
      sortOrder: restoredState.sortOrder ?? state.sortOrder,
      search: restoredState.search ?? state.search,
      filters: restoredState.filters ?? state.filters,
      columnSettings: restoredState.columnSettings ?? state.columnSettings,
    }

    if (restoredState.page != null) setLocalPage(restoredState.page)
    else if (isLoadMore) setLocalPage(1)
    if (restoredState.perPage != null) setLocalPerPage(restoredState.perPage)
    if (restoredState.sortBy != null) setLocalSortBy(restoredState.sortBy)
    if (restoredState.sortOrder != null) setLocalSortOrder(restoredState.sortOrder)
    if (restoredState.search != null) setLocalSearch(restoredState.search)
    if (restoredState.columnSettings != null) setColumnSettings(restoredState.columnSettings)
    if (restoredState.filters != null) setFiltersState(restoredState.filters)

    stateManager?.init?.(initialState)

    if (restoredState.filters != null && !equal(restoredState.filters, defaultFilters)) {
      eventsRef.current.onFiltersChange?.(restoredState.filters)
    }

    setIsReady(true)
  }, [])

  // The query effect: related state updates are batched into one request.
  useEffect(() => {
    if (!isReady || !localPage) {
      return
    }

    getData()

    // Invalidate a pending request when its query changes or this list unmounts.
    return () => {
      requestIdRef.current += 1
    }
  }, [
    isReady,
    refreshKey,
    localPage,
    localPerPage,
    localSearch,
    localSortBy,
    localSortOrder,
    localFilters,
  ])

  // Lifecycle 4, after the response has rendered: `stateManager.set` gets the committed State with
  // the new rows, then `onResponse` and `afterPageChange` / `afterLoadMore` fire.
  useEffect(() => {
    if (responseKey === 0 || !state.response) {
      return
    }

    stateManagerRef.current?.set?.(state)
    eventsRef.current.onResponse?.(state.response)

    if (isLoadMore) {
      eventsRef.current.afterLoadMore?.(state.response)
    } else {
      eventsRef.current.afterPageChange?.(state.response)
    }
  }, [responseKey])

  // Keep externally supplied filters in sync. The query effect above performs the request.
  useEffect(() => {
    if (!isReady || equal(filters, localFilters)) {
      return
    }

    setFiltersState({ ...filters })
    setLocalPage(1)
  }, [isReady, filters])

  // onRowSelect fires only when selection actually changes, including response resets.
  useEffect(() => {
    const previousSelection = previousSelectionRef.current
    previousSelectionRef.current = selection

    if (hasSelectionChanged(selection, previousSelection)) {
      eventsRef.current.onRowSelect?.(selection, previousSelection)
    }
  }, [selection])

  let content: ReactNode

  if (typeof children === 'function') {
    content = children(context)
  } else {
    content = children
  }

  return (
    <ListContextProvider value={context}>
      <div className="shilp-list">{content}</div>
    </ListContextProvider>
  )
}

export default List
