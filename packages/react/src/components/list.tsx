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
import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react'
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
  page: pageProp = DEFAULT_PAGE,
  perPage: perPageProp = DEFAULT_PER_PAGE,
  sortBy: sortByProp = DEFAULT_SORT_BY,
  sortOrder: sortOrderProp = DEFAULT_SORT_ORDER,
  search: searchProp = DEFAULT_SEARCH,
  filters: filtersProp = DEFAULT_FILTERS,
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

  const [defaultFilters] = useState<Filters>(() => ({ ...filtersProp }))
  const [localPage, setLocalPage] = useState<number>(pageProp)
  const [localPerPage, setLocalPerPage] = useState<number>(perPageProp)
  const [localSortBy, setLocalSortBy] = useState<string>(sortByProp)
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>(sortOrderProp)
  const [localSearch, setLocalSearch] = useState<string>(searchProp)
  const [filters, setFiltersState] = useState<Filters>(() => ({ ...filtersProp }))
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

  const requestIdRef = useRef(0)
  const initializedRef = useRef(false)
  const previousSelectionRef = useRef(selection)
  const eventsRef = useRef<EventProps<T>>({})

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

  const state: State<T> = {
    endpoint,
    version,
    meta,
    idKey,
    page: localPage,
    perPage: localPerPage,
    sortBy: localSortBy,
    sortOrder: localSortOrder,
    search: localSearch,
    filters,
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
    hasActiveFilters: hasActiveFilters(filters, defaultFilters),
  }

  function snapshot(): State<T> {
    return state
  }

  function updateStateManager(nextState: State<T> = snapshot()) {
    stateManager?.set?.(nextState)
  }

  // Lifecycle 3 to 5, one request. The query effect below decides when this method runs;
  // refresh calls it directly only when the watched query values do not change.
  function getData(refreshing = false) {
    setError(null)
    setIsLoading(true)

    if (refreshing) {
      setIsRefresh(true)
    }

    const currentRequestId = ++requestIdRef.current
    const requestState: State<T> = {
      ...snapshot(),
      isLoading: true,
      isRefresh: refreshing || isRefresh,
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

        const currentRows = refreshing && isLoadMore ? [] : rows
        const nextRows = mergeRows(currentRows, nextResponse.rows, {
          page: requestState.page,
          perPage: requestState.perPage,
          isLoadMore,
        })
        const nextState: State<T> = {
          ...requestState,
          response: nextResponse,
          rows: nextRows,
          count: nextResponse.count,
          selection: [],
          error: null,
        }

        setResponse(nextResponse)
        setRowsState(nextRows)
        setCount(nextResponse.count)
        setSelectionState([])
        setIsInitialLoading(false)
        setIsLoading(false)
        setIsRefresh(false)

        // React state setters are asynchronous, so pass the completed snapshot directly.
        // This mirrors Vue's getData(), where reactive values are updated before callbacks run.
        updateStateManager(nextState)
        eventsRef.current.onResponse?.(nextResponse)

        if (isLoadMore) {
          eventsRef.current.afterLoadMore?.(nextResponse)
        } else {
          eventsRef.current.afterPageChange?.(nextResponse)
        }
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

  // Lifecycle 6, actions. Query-changing actions update local state; the watcher effect below
  // performs one request after React commits the combined changes.
  function setPage(value: number) {
    if (!Number.isInteger(value) || value < 1 || value === localPage) {
      return
    }

    setLocalPage(value)
  }

  function setPerPage(value: number) {
    if (!Number.isInteger(value) || value < 1 || value === localPerPage) {
      return
    }

    setLocalPerPage(value)
    setLocalPage(1)
  }

  function setSearch(value: string) {
    if (value === localSearch) {
      return
    }

    setLocalSearch(value)
    setLocalPage(1)
  }

  function setSortBy(value: string) {
    if (value === localSortBy) {
      return
    }

    setLocalSortBy(value)
    setLocalPage(1)
  }

  function setSortOrder(value: SortOrder) {
    if (value === localSortOrder) {
      return
    }

    setLocalSortOrder(value)
    setLocalPage(1)
  }

  function setFilters(nextFilters: Filters) {
    if (equal(filters, nextFilters)) {
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

  function refresh() {
    setError(null)
    setIsRefresh(true)

    if (isLoadMore) {
      setRowsState([])
    }

    if (localPage === 1) {
      // The page/query values have not changed, so the watcher cannot trigger this request.
      getData(true)
    } else {
      // Changing the page triggers the watcher once, with isRefresh already set.
      setLocalPage(1)
    }
  }

  function loadMore() {
    if (!state.hasMore || isLoading) {
      return
    }

    setLocalPage((currentPage) => currentPage + 1)
  }

  function updateRowById(row: Partial<T>, id: string | number) {
    const nextRows = patchRowById(rows, row, id, idKey)

    if (!nextRows) {
      console.warn(rowNotFoundMessage(idKey, id))
      return
    }

    setRowsState(nextRows)
  }

  function updateColumn(columnName: string, settingKey: string, value: unknown) {
    const nextColumnSettings = setColumnSetting(columnSettings, columnName, settingKey, value)

    setColumnSettings(nextColumnSettings)
    updateStateManager({ ...state, columnSettings: nextColumnSettings })
  }

  const actions = {
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

  const context: Context<T> = { ...state, ...actions }

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
    // Initialization intentionally runs once, like Vue setup + onMounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Vue's query watcher equivalent: related state updates are batched into one request.
  useEffect(() => {
    if (!isReady || !localPage) {
      return
    }

    getData()

    // Invalidate a pending request when its query changes or this list unmounts.
    return () => {
      requestIdRef.current += 1
    }
    // getData is intentionally a plain function, mirroring the Vue implementation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, localPage, localPerPage, localSearch, localSortBy, localSortOrder, filters])

  // Keep externally supplied filters in sync. The query effect above performs the request.
  useEffect(() => {
    if (!isReady || equal(filtersProp, filters)) {
      return
    }

    setFiltersState({ ...filtersProp })
    setLocalPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, filtersProp])

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
