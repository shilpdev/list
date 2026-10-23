import type {
  Columns,
  Context,
  EventProps,
  FilterState,
  FilterValues,
  RequestHandlerResponse,
  RequestTrigger,
  RowId,
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
  rowNotFoundMessage,
} from '@shared/constants'
import {
  computeColumns,
  computeFilters,
  computeHasMore,
  createColumns,
  hasSelectionChanged,
  mergeRows,
  patchRowById,
  toError,
  toggleId,
} from '@shared/utils'
import equal from 'fast-deep-equal'
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { ListContextProvider } from '../context/list-context'
import type { ListPropsReact } from '../types'

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
  filters = [...DEFAULT_FILTERS],
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

  // The initial filters, read once at setup. `isDirty` is false until a value differs from these.
  const [defaultFilters] = useState<FilterState[]>(() => {
    return filters.map(({ column, value }): FilterState => {
      return { column, value, isDirty: false }
    })
  })
  const [localPage, setLocalPage] = useState<number>(page)
  const [localPerPage, setLocalPerPage] = useState<number>(perPage)
  const [localSortBy, setLocalSortBy] = useState<string>(sortBy)
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>(sortOrder)
  const [localSearch, setLocalSearch] = useState<string>(search)
  const [localFilters, setLocalFilters] = useState<FilterState[]>(() => {
    return [...defaultFilters]
  })
  const [localColumns, setLocalColumns] = useState<Columns>(() => {
    return createColumns(columns)
  })
  const [rows, setRows] = useState<T[]>([])
  const [selection, _setSelection] = useState<RowId[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<RequestHandlerResponse<T> | null>(null)
  const [count, setCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [requestTrigger, setRequestTrigger] = useState<RequestTrigger>('mount')
  const [isReady, setIsReady] = useState<boolean>(false)
  // Bumped by refresh, so the query effect refetches even when no query value changed.
  const [refreshKey, setRefreshKey] = useState<number>(0)
  // Bumped per response, so the response effect runs once the new rows are committed.
  const [responseKey, setResponseKey] = useState<number>(0)

  const requestIdRef = useRef(0)
  const initializedRef = useRef(false)
  // The values restored from `stateManager.get` at setup, reused by `init` (mount and clearState).
  const savedRef = useRef<Partial<State>>({})
  const initRef = useRef<(snapshot?: State) => void>(() => {})
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
      requestTrigger,
      columns: localColumns,
      isEmpty: rows.length === 0,
    }
  }, [
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
    requestTrigger,
    localColumns,
  ])

  // Lifecycle 3 to 5, one request. Only the query effect below calls this, so `state` is the
  // committed state of the render that changed the query.
  // 3. Request: state shows isLoading (`requestTrigger` says what started it), `beforePageChange` /
  //    `beforeLoadMore` get the State being requested, then `requestHandler` runs.
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
      .then((res) => {
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        setResponse(res)
        // Merge into the rows as they are now, so an `updateRowById` during the request is kept.
        setRows((previousRows) => {
          return mergeRows(previousRows, res.rows, {
            page: requestState.page,
            perPage: requestState.perPage,
            isLoadMore,
          })
        })
        setCount(res.count)
        // Keep the same array when nothing was selected, so the reset does not re-render.
        _setSelection((previousSelection) => {
          if (previousSelection.length === 0) {
            return previousSelection
          }

          return []
        })
        setIsInitialLoading(false)
        setIsLoading(false)
        setResponseKey((key) => {
          return key + 1
        })
      })
      .catch((err: unknown) => {
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        const nextError = toError(err)

        setError(nextError)
        setRows([])
        setCount(0)
        setIsInitialLoading(false)
        setIsLoading(false)
        eventsRef.current.onError?.(nextError)
      })
  }

  // Lifecycle 6, actions. Query-changing actions only update local state; the query effect below
  // performs one request after React commits the combined changes. `requestTrigger` is set by the
  // caller so `requestHandler` and the `before*` events read it. They close over the current
  // `state`; `context` below is rebuilt only when `state` changes, so their identity is stable
  // between renders that change nothing.
  function setPage(value: number) {
    if (!value) {
      return
    }

    setRequestTrigger('page')
    setLocalPage(value)
  }

  function setPerPage(value: number) {
    if (value === state.perPage) {
      return
    }

    setRequestTrigger('perPage')
    setLocalPerPage(value)
    setLocalPage(1)
  }

  function setSearch(value: string) {
    if (value === state.search) {
      return
    }

    setRequestTrigger('search')
    setLocalSearch(value)
    setLocalPage(1)
  }

  function setSortBy(value: string) {
    if (value === state.sortBy) {
      return
    }

    setRequestTrigger('sortBy')
    setLocalSortBy(value)
    setLocalPage(1)
  }

  function setSortOrder(value: SortOrder) {
    if (value === state.sortOrder) {
      return
    }

    setRequestTrigger('sortOrder')
    setLocalSortOrder(value)
    setLocalPage(1)
  }

  function changeFilters(next: FilterState[]) {
    if (equal(state.filters, next)) {
      return
    }

    setRequestTrigger('filters')
    setLocalFilters(next)
    setLocalPage(1)
    eventsRef.current.onFiltersChange?.(next)
  }

  // Merges `values` into the current filters, adding a column that is new.
  function setFilters(values: FilterValues) {
    changeFilters(computeFilters(state.filters, defaultFilters, values))
  }

  function setFilter(column: string, value: unknown) {
    setFilters({ [column]: value })
  }

  // Restores the initial filters.
  function clearFilters() {
    changeFilters([...defaultFilters])
  }

  function toggleRowSelection(id: RowId) {
    _setSelection((previousSelection) => {
      return toggleId(previousSelection, id)
    })
  }

  // Refetches the current page; load-more starts again from page 1. `refreshKey` makes the
  // query effect run even when no query value changes.
  function refresh() {
    setRequestTrigger('refresh')

    if (isLoadMore) {
      setRows([])
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

    setRequestTrigger('loadMore')
    setLocalPage((currentPage) => {
      return currentPage + 1
    })
  }

  // Calls `stateManager.clear`, then re-runs `init` (stateManager.init, onFiltersChange if the
  // restored filters differ, and a refetch of the current state). The list itself is not reset.
  function clearState() {
    stateManagerRef.current?.clear?.(state)
    initRef.current()
  }

  function updateRowById(row: Partial<T>, id: RowId) {
    const next = patchRowById(state.rows, row, id, state.idKey)

    if (!next) {
      console.warn(rowNotFoundMessage(state.idKey, id))
      return
    }

    setRows(next)
  }

  // Sets one key of one column; an unknown column is ignored. Refetches and goes back to page 1
  // through the query effect, except before the first response. `stateManager.set` runs with the
  // new columns right away.
  function setColumn(column: string, key: string, value: unknown) {
    const next = computeColumns(state.columns, column, key, value)

    if (equal(state.columns, next)) {
      return
    }

    setRequestTrigger('columns')
    setLocalColumns(next)
    stateManagerRef.current?.set?.({ ...state, columns: next })
  }

  // The actions close over `state`, so keying on it keeps `context` (and every consumer) stable
  // between renders that change nothing, while always exposing the current render's functions.
  const context = useMemo((): Context<T> => {
    return {
      ...state,
      setPage,
      setPerPage,
      setSearch,
      setSortBy,
      setSortOrder,
      setFilter,
      setFilters,
      clearFilters,
      loadMore,
      refresh,
      clearState,
      toggleRowSelection,
      updateRowById,
      setColumn,
    }
  }, [state, isLoadMore, defaultFilters])

  useImperativeHandle(ref, () => context, [context])

  // Lifecycle 2, mount and clearState: `stateManager.init`, then `onFiltersChange` if the restored
  // filters differ from the initial ones, then a request. Mirrors Vue's `init()`. `snapshot` is the
  // State to report to `stateManager.init` (the restored one on mount, the current one otherwise).
  initRef.current = (snapshot: State = state) => {
    const saved = savedRef.current
    const restoredFilters = saved.filters as FilterState[] | undefined

    stateManagerRef.current?.init?.(snapshot)

    if (restoredFilters != null && !equal(restoredFilters, defaultFilters)) {
      eventsRef.current.onFiltersChange?.(restoredFilters)
    }

    if (isReady) {
      // Already mounted (clearState): force a refetch. On mount the query effect does the first fetch.
      setRefreshKey((key) => {
        return key + 1
      })
    } else {
      setIsReady(true)
    }
  }

  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    initializedRef.current = true

    // Lifecycle 1, setup: state starts from the props and defaults. `stateManager.get` runs before
    // anything is fetched and may restore page, perPage, sort, search, filters and columns. A
    // load-more list always starts on page 1.
    let saved: Partial<State> = {}

    try {
      saved = stateManager?.get?.(state) ?? {}
    } catch (err) {
      console.error(err)
    }

    savedRef.current = saved

    if (saved.page != null && !isLoadMore) setLocalPage(saved.page)
    else if (isLoadMore) setLocalPage(1)
    if (saved.perPage != null) setLocalPerPage(saved.perPage)
    if (saved.sortBy != null) setLocalSortBy(saved.sortBy)
    if (saved.sortOrder != null) setLocalSortOrder(saved.sortOrder)
    if (saved.search != null) setLocalSearch(saved.search)
    // Saved columns and filters replace the ones from the props as they are, with `isDirty`
    // already worked out.
    if (saved.columns != null) setLocalColumns(saved.columns)
    if (saved.filters != null) setLocalFilters(saved.filters as FilterState[])

    // The State after the restore, so `stateManager.init` sees the restored values like Vue.
    const restoredState: State = {
      ...state,
      page: saved.page != null && !isLoadMore ? saved.page : isLoadMore ? 1 : state.page,
      perPage: saved.perPage ?? state.perPage,
      sortBy: saved.sortBy ?? state.sortBy,
      sortOrder: saved.sortOrder ?? state.sortOrder,
      search: saved.search ?? state.search,
      filters: (saved.filters as FilterState[]) ?? state.filters,
      columns: saved.columns ?? state.columns,
    }

    initRef.current(restoredState)
  }, [])

  // The query effect: related state updates are batched into one request. `localColumns` is here so
  // `setColumn` refetches, matching Vue's column watcher.
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
    localColumns,
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
