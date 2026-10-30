import type {
  Column,
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
  computeHasMore,
  computeSelectionState,
  createColumns,
  hasSelectionChanged,
  mergeRows,
  patchRowById,
  toError,
  toggleAllIds,
  toggleId,
  computeFilters,
  computeDefaultFilters,
  hasSavedState,
} from '@shared/utils'
import equal from 'fast-deep-equal'
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { ListContextProvider } from '../context/list-context'
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

  const defaultFilters = computeDefaultFilters(filters)
  const [localPage, setLocalPage] = useState<number>(page)
  const [localPerPage, setLocalPerPage] = useState<number>(perPage)
  const [localSortBy, setLocalSortBy] = useState<string>(sortBy)
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>(sortOrder)
  const [localSearch, setLocalSearch] = useState<string>(search)
  const [localFilters, setLocalFilters] = useState<FilterState[]>(() => {
    return [...defaultFilters]
  })
  const [localColumns, setLocalColumns] = useState<Column[]>(() => {
    return createColumns(columns)
  })

  const [rows, setRows] = useState<T[]>(() => {
    if (initialResponse == null) {
      return []
    }
    return mergeRows<T>([], initialResponse.rows, { page, perPage, isLoadMore })
  })
  const [selection, setSelection] = useState<RowId[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<RequestHandlerResponse<T> | null>(
    initialResponse ?? null,
  )
  const [count, setCount] = useState<number>(initialResponse?.count ?? 0)
  const [isLoading, setIsLoading] = useState<boolean>(initialResponse == null)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(initialResponse == null)
  const [requestTrigger, setRequestTrigger] = useState<RequestTrigger>('mount')
  const [isReady, setIsReady] = useState(false)
  const requestIdRef = useRef(0)
  // Query effects wait for the first request, or for the decision to skip it (`initialResponse`).
  const isStartedRef = useRef(false)
  const isSeededRef = useRef(initialResponse != null)

  const previousSelectionRef = useRef(selection)
  const previousFiltersRef = useRef(localFilters)
  const previousColumnsRef = useRef(localColumns)

  const hasMore = computeHasMore(localPage, localPerPage, count)
  const isEmpty = rows.length === 0
  const selectionState = computeSelectionState(rows, selection, idKey)

  // Read through a ref: an inline `stateManager` object is new on every parent render and would
  // otherwise rebuild `actions` and `context` with nothing changed.
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
        setCount(res.count)
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
        setCount(0)
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
    if (hasMore || !isLoading) {
      setRequestTrigger('loadMore')
      setLocalPage((currentPage) => {
        return currentPage + 1
      })
    }
  }

  function updateRowById(row: Partial<T>, id: RowId) {
    const next = patchRowById(rows, row, id, idKey)

    if (!next) {
      console.warn(rowNotFoundMessage(idKey, id))
      return
    }

    setRows(next)
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
    endpoint,
    version,
    meta,
    idKey,
    page: localPage,
    perPage: localPerPage,
    sortBy: localSortBy,
    sortOrder: localSortOrder,
    search: localSearch,
    columns: localColumns,
    filters: localFilters,
    rows,
    response,
    error,
    count,
    selection,
    selectionState,
    hasMore,
    isLoading,
    isInitialLoading,
    requestTrigger,
    isEmpty,
  }

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
      toggleAllRowsSelection,
      updateRowById,
      setColumn,
    }
  }, [state, isLoadMore, defaultFilters])

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

  // Lifecycle 2, mount: `stateManager.init`, then `onFiltersChange` if the saved filters differ from
  // the prop, then the first request (skipped for a seeded list).
  useEffect(() => {
    if (isReady) return

    const saved = stateManagerRef.current?.get?.(snapshot()) ?? {}

    // A seeded list keeps its response only when nothing was restored (see `initialResponse`).
    if (isSeededRef.current && hasSavedState(saved)) {
      isSeededRef.current = false
    }

    if (saved.page != null && !isLoadMore) {
      setLocalPage(saved.page)
    }

    if (saved.perPage != null) {
      setLocalPerPage(saved.perPage)
    }

    if (saved.sortBy != null) {
      setLocalSortBy(saved.sortBy)
    }

    if (saved.sortOrder != null) {
      setLocalSortOrder(saved.sortOrder)
    }

    if (saved.search != null) {
      setLocalSearch(saved.search)
    }

    // Saved columns and filters replace the ones from the props as they are, so `get` returns the
    // complete lists, with `isDirty` already worked out.
    if (saved.columns != null) {
      setLocalColumns(saved.columns)
    }

    if (saved.filters != null) {
      setLocalFilters(saved.filters)
    }

    if (saved.filters != null && !equal(localFilters, defaultFilters)) {
      eventsRef.current?.onFiltersChange?.(localFilters)
    }

    stateManagerRef.current?.init?.(state)

    if (isSeededRef.current) {
      isStartedRef.current = true
    }

    setIsReady(true)

    // Lifecycle 8, unmount: invalidate the request in flight so its late response or error does not
    // update state, call `stateManager.set` or emit events on a list that no longer exists.
    return () => {
      requestIdRef.current += 1
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
