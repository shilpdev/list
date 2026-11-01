import type {
  Column,
  Context,
  EventProps,
  FilterState,
  FilterValues,
  InitialState,
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
} from '@shared/constants'
import {
  computeColumns,
  computeHasMore,
  computeSelectionState,
  hasSelectionChanged,
  mergeRows,
  toError,
  toggleAllIds,
  toggleId,
  computeFilters,
  computeDefaultFilters,
  createColumns,
  hasSavedState,
  applySavedState,
} from '@shared/utils'
import equal from 'fast-deep-equal'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ListContextProvider } from '../context/list-context'
import { Slot } from './slot'
import type { ListProps } from '../types'

function List<T = unknown>(props: ListProps<T>) {
  const {
    endpoint,
    idKey = DEFAULT_ID_KEY,
    page = DEFAULT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    sortBy = DEFAULT_SORT_BY,
    sortOrder = DEFAULT_SORT_ORDER,
    search = DEFAULT_SEARCH,
    version = DEFAULT_VERSION,
    paginationMode = DEFAULT_PAGINATION_MODE,
    meta = DEFAULT_META,
    filters = [...DEFAULT_FILTERS],
    columns,
    requestHandler,
    initialResponse,
    stateManager,
    beforePageChange,
    afterPageChange,
    beforeLoadMore,
    afterLoadMore,
    onResponse,
    onError,
    onRowSelect,
    onFiltersChange,
    ref,
    children,
  } = props
  const isLoadMore = paginationMode === 'loadMore'

  // Read once at setup, like Vue: `isDirty` and `clearFilters` compare with the initial filters.
  const [defaultFilters] = useState<FilterState[]>(() => {
    return computeDefaultFilters(filters)
  })

  /*
   * Lifecycle 1, setup. `stateManager.get` runs here, in the first render, so the list never
   * commits the values from before the restore. A load-more list ignores a saved page because it
   * always starts on page 1.
   */
  const [{ saved, start }] = useState(() => {
    const initial: InitialState = {
      endpoint,
      version,
      meta,
      idKey,
      page,
      perPage,
      sortBy,
      sortOrder,
      search,
      filters: defaultFilters,
      columns: createColumns(columns),
    }
    const saved = stateManager?.get?.(initial) ?? {}

    return { saved, start: applySavedState(initial, saved, isLoadMore) }
  })

  const [localPage, setLocalPage] = useState<number>(start.page)
  const [localPerPage, setLocalPerPage] = useState<number>(start.perPage)
  const [localSortBy, setLocalSortBy] = useState<string>(start.sortBy)
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>(start.sortOrder)
  const [localSearch, setLocalSearch] = useState<string>(start.search)
  const [localFilters, setLocalFilters] = useState<FilterState[]>(start.filters)
  const [localColumns, setLocalColumns] = useState<Column[]>(start.columns)

  const [rows, setRows] = useState<T[]>(() => {
    if (initialResponse == null) {
      return []
    }
    return mergeRows<T>([], initialResponse.rows, {
      page: start.page,
      perPage: start.perPage,
      isLoadMore,
    })
  })
  const [selection, setSelection] = useState<RowId[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<RequestHandlerResponse<T> | null>(
    initialResponse ?? null,
  )
  const [totalRows, setTotalRows] = useState<number>(initialResponse?.totalRows ?? 0)
  const [isLoading, setIsLoading] = useState<boolean>(initialResponse == null)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(initialResponse == null)
  const [requestTrigger, setRequestTrigger] = useState<RequestTrigger>('mount')
  const [isReady, setIsReady] = useState(false)
  const requestIdRef = useRef(0)
  // Query effects wait for the first request, or for the decision to skip it (`initialResponse`).
  const isStartedRef = useRef(false)
  // A seeded list keeps its response only when nothing was restored (see `initialResponse`).
  const isSeededRef = useRef(initialResponse != null && !hasSavedState(saved))

  const previousSelectionRef = useRef(selection)
  const previousFiltersRef = useRef(localFilters)
  const previousColumnsRef = useRef(localColumns)

  const hasMore = computeHasMore(localPage, localPerPage, totalRows)
  const isEmpty = rows.length === 0
  const selectionState = computeSelectionState(rows, selection, idKey)

  /*
   * Read through a ref: an inline `stateManager` object is new on every parent render, and a late
   * response must call the latest one, not the one from the render that started the request.
   */
  const stateManagerRef = useRef(stateManager)
  stateManagerRef.current = stateManager

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

  function clearState() {
    stateManagerRef.current?.clear?.(snapshot())
    getData()
  }

  /*
   * Lifecycle 3 to 5, one request. Only the query effect calls this, so `state` is what React
   * committed for the query that just changed.
   * 3. Request: the `before*` hook gets the State being requested, then `requestHandler` runs.
   * 4. Response: rows are replaced (page mode) or appended (load-more), selection resets, then
   *    `stateManager.set`, `onResponse` and the `after*` hook run.
   * 5. Error: `error` is set, rows and totalRows are cleared and `onError` fires.
   */
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
      eventsRef.current?.beforeLoadMore?.(requestState)
    } else {
      eventsRef.current?.beforePageChange?.(requestState)
    }

    requestHandler(requestState)
      .then((res) => {
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        setResponse(res)
        // Keep the same array when nothing was selected, so the reset does not re-render.
        setSelection((previousSelection) => {
          if (previousSelection.length === 0) {
            return previousSelection
          }
          return []
        })
        setRows((previousRows) => {
          return mergeRows(previousRows, res.rows, {
            page: requestState.page,
            perPage: requestState.perPage,
            isLoadMore,
          })
        })
        setTotalRows(res.totalRows)
        stateManagerRef.current?.set?.(state)
        eventsRef.current?.onResponse?.(res)

        if (isLoadMore) {
          eventsRef.current?.afterLoadMore?.(res)
        } else {
          eventsRef.current?.afterPageChange?.(res)
        }
      })
      .catch((err: unknown) => {
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        const nextError = toError(err)
        setError(nextError)
        setRows([])
        setTotalRows(0)
        eventsRef.current?.onError?.(nextError)
      })
      .finally(() => {
        if (currentRequestId !== requestIdRef.current) {
          return
        }
        isStartedRef.current = true
        setIsLoading(false)
        setIsInitialLoading(false)
      })
  }

  /*
   * Lifecycle 6, actions. A query-changing action only sets state; the query effect sends one
   * request after React commits all of it, so two calls in the same event (for example two
   * `loadMore()`) cost one request. The action sets `requestTrigger` so `requestHandler` and the
   * `before*` hook can read what started the request.
   */

  function setPage(value: number) {
    if (!value) {
      return
    }
    setRequestTrigger('page')
    setLocalPage(value)
  }

  function setPerPage(value: number) {
    if (value === localPerPage) {
      return
    }
    setLocalPerPage(value)
    setRequestTrigger('perPage')
    setLocalPage(1)
  }

  function setSearch(value: string) {
    if (value === localSearch) {
      return
    }
    setLocalSearch(value)
    setRequestTrigger('search')
    setLocalPage(1)
  }

  function setSortBy(value: string) {
    if (value === localSortBy) {
      return
    }
    setLocalSortBy(value)
    setRequestTrigger('sortBy')
    setLocalPage(1)
  }

  function setSortOrder(value: SortOrder) {
    if (value === localSortOrder) {
      return
    }
    setLocalSortOrder(value)
    setRequestTrigger('sortOrder')
    setLocalPage(1)
  }

  function changeFilters(next: FilterState[]) {
    if (equal(localFilters, next)) {
      return
    }
    setLocalFilters(next)
    setRequestTrigger('filters')
    eventsRef.current?.onFiltersChange?.(next)
  }

  function setFilters(values: FilterValues) {
    const next = computeFilters(localFilters, defaultFilters, values)
    changeFilters(next)
  }

  function setFilter(column: string, value: unknown) {
    setFilters({ [column]: value })
  }

  function clearFilters() {
    changeFilters([...defaultFilters])
  }

  function toggleRowSelection(id: RowId) {
    setSelection((prev) => {
      return toggleId(prev, id)
    })
  }

  function toggleAllRowsSelection() {
    setSelection((prev) => {
      return toggleAllIds(rows, prev, idKey)
    })
  }

  function refresh() {
    setRequestTrigger('refresh')

    if (isLoadMore) {
      setRows([])
      setLocalPage(1)
    } else {
      getData()
    }
  }

  function loadMore() {
    if (hasMore && !isLoading) {
      setRequestTrigger('loadMore')
      setLocalPage((currentPage) => {
        return currentPage + 1
      })
    }
  }

  function setColumn(column: string, key: string, value: unknown) {
    const next = computeColumns(localColumns, column, key, value)

    if (equal(localColumns, next)) {
      return
    }

    setLocalColumns(next)
    setRequestTrigger('columns')
    stateManagerRef.current?.set?.({ ...state, columns: next })
  }

  const state = {
    // props
    endpoint,
    version,
    meta,
    idKey,
    // local copies
    page: localPage,
    perPage: localPerPage,
    sortBy: localSortBy,
    sortOrder: localSortOrder,
    search: localSearch,
    columns: localColumns,
    filters: localFilters,
    // local items
    rows,
    response,
    error,
    totalRows,
    selection,
    selectionState,
    hasMore,
    isLoading,
    isInitialLoading,
    requestTrigger,
    isEmpty,
  }

  const context: Context<T> = {
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
    toggleAllRowsSelection,
    setColumn,
  }

  useImperativeHandle(ref, () => context, [context])

  const snapshot = (): State => {
    return { ...state }
  }

  useEffect(() => {
    if (!isStartedRef.current) {
      return
    }
    getData()

    // Invalidate a pending request when its query changes or this list unmounts.
    return () => {
      requestIdRef.current += 1
    }
  }, [localPage, localPerPage, localSearch, localSortBy, localSortOrder, localFilters])

  useEffect(() => {
    const previousFilters = previousFiltersRef.current
    previousFiltersRef.current = localFilters

    if (!isStartedRef.current) {
      return
    }

    if (equal(localFilters, previousFilters)) {
      return
    }

    setLocalPage(1)
  }, [localFilters])

  useEffect(() => {
    const previousColumns = previousColumnsRef.current
    previousColumnsRef.current = localColumns

    if (!isStartedRef.current) {
      return
    }

    if (equal(localColumns, previousColumns)) {
      return
    }

    getData()
  }, [localColumns])

  useEffect(() => {
    const previousSelection = previousSelectionRef.current
    previousSelectionRef.current = selection

    if (hasSelectionChanged(selection, previousSelection)) {
      eventsRef.current?.onRowSelect?.(selection, previousSelection)
    }
  }, [selection])

  /*
   * Lifecycle 2, mount: `stateManager.init`, then `onFiltersChange` if a restore changed the
   * filters, then the first request (skipped for a seeded list).
   */
  useEffect(() => {
    if (isReady) return

    stateManagerRef.current?.init?.(state)

    if (saved.filters != null && !equal(localFilters, defaultFilters)) {
      eventsRef.current?.onFiltersChange?.(localFilters)
    }

    if (isSeededRef.current) {
      isStartedRef.current = true
    }

    setIsReady(true)

    /*
     * Lifecycle 8, unmount: drop the request in flight so a late response does not update state or
     * call hooks on a list that no longer exists. `isStartedRef` is cleared too: StrictMode replays
     * a mount's effects, and with the flag still set the query effect would refetch a seeded list.
     */
    return () => {
      requestIdRef.current += 1
      isStartedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isReady) return

    if (isSeededRef.current) {
      isSeededRef.current = false
      return
    }

    getData()
  }, [isReady])

  return (
    <ListContextProvider value={context}>
      <Slot className="shilp-list" scope={context} children={children} fallback={() => null} />
    </ListContextProvider>
  )
}

export default List
