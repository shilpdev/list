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
  getQueryChange,
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
  children?: ReactNode | ((context: Context) => ReactNode)
  /** React 19 ref-as-prop; use with useImperativeHandle for the imperative API. */
  ref?: Ref<Context>
}

function List({
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
}: ListPropsReact) {
  const isLoadMore = paginationMode === 'loadMore'
  const [defaultFilters] = useState<Filters>(() => {
    return { ...filtersProp }
  })

  const [page, _setPage] = useState<number>(pageProp)
  const [perPage, _setPerPage] = useState<number>(perPageProp)
  const [sortBy, _setSortBy] = useState<string>(sortByProp)
  const [sortOrder, _setSortOrder] = useState<SortOrder>(sortOrderProp)
  const [search, _setSearch] = useState<string>(searchProp)
  const [filters, _setFilters] = useState<Filters>(filtersProp)
  const [columnSettings, _setColumnSettings] = useState<ColumnSettings>({})
  const [rows, _setRows] = useState<unknown[]>([])
  const [selection, _setSelection] = useState<unknown[]>([])
  const [error, _setError] = useState<Error | null>(null)
  const [response, _setResponse] = useState<RequestHandlerResponse | null>(null)
  const [count, _setCount] = useState<number>(0)
  const [isLoading, _setIsLoading] = useState<boolean>(true)
  const [isInitialLoading, _setIsInitialLoading] = useState<boolean>(true)
  const [isRefresh, _setIsRefresh] = useState<boolean>(false)
  // Each bump runs the request effect once. It starts at 1 so the first request runs on mount.
  const [requestKey, _setRequestKey] = useState<number>(1)
  // Each bump runs the response effect once, after the response has rendered.
  const [responseKey, _setResponseKey] = useState<number>(0)

  const state = useMemo((): State => {
    return {
      endpoint,
      version,
      meta,
      rows,
      response,
      error,
      count,
      selection,
      page,
      perPage,
      hasMore: computeHasMore(page, perPage, count),
      isLoading,
      isInitialLoading,
      isRefresh,
      sortBy,
      sortOrder,
      search,
      filters,
      columns: getColumns(columns, rows),
      columnSettings,
      isEmpty: rows.length === 0,
      hasActiveFilters: hasActiveFilters(filters, defaultFilters),
      idKey,
    }
  }, [
    endpoint,
    version,
    meta,
    rows,
    response,
    error,
    count,
    selection,
    page,
    perPage,
    isLoading,
    isInitialLoading,
    isRefresh,
    sortBy,
    sortOrder,
    search,
    filters,
    columns,
    columnSettings,
    defaultFilters,
    idKey,
  ])

  // Lifecycle 1, setup (first render): state starts from the props and defaults. `stateManager.get`
  // runs once and may restore page, perPage, sort, search, filters and columnSettings. A load-more
  // list always starts on page 1. Nothing is fetched yet. The restore is applied while rendering, so
  // React renders again at once and the values before it are never committed.
  const [isRestored, _setIsRestored] = useState<boolean>(false)
  const [restoredFilters, _setRestoredFilters] = useState<Filters | undefined>(undefined)

  if (!isRestored) {
    _setIsRestored(true)

    let saved: Partial<State> = {}

    try {
      saved = stateManager?.get?.(state) ?? {}
    } catch (err) {
      console.error(err)
    }

    const restored = getRestoredState(saved, isLoadMore)

    if (restored.page != null) {
      _setPage(restored.page)
    }

    if (restored.perPage != null) {
      _setPerPage(restored.perPage)
    }

    if (restored.sortBy != null) {
      _setSortBy(restored.sortBy)
    }

    if (restored.sortOrder != null) {
      _setSortOrder(restored.sortOrder)
    }

    if (restored.search != null) {
      _setSearch(restored.search)
    }

    if (restored.columnSettings != null) {
      _setColumnSettings(restored.columnSettings)
    }

    if (restored.filters != null) {
      _setFilters(restored.filters)
      _setRestoredFilters(restored.filters)
    }
  }

  // Hooks read the latest callbacks without making the effects below depend on them.
  const eventsRef = useRef<EventProps>({})
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

  // Marks the next render as loading and runs the request effect after it. Called together with the
  // setters of the fields being changed, so React renders once with all of them.
  const startRequest = (refreshing = false) => {
    _setError(null)
    _setIsLoading(true)
    _setIsRefresh(refreshing)
    _setRequestKey((key) => {
      return key + 1
    })
  }

  // Lifecycle 7, props changing after mount: `filters` and the query props (page, perPage, search,
  // sortBy, sortOrder, endpoint) refetch, except before the first response has arrived. Applied while
  // rendering, so React renders again at once instead of committing the old values first.
  const [prevFiltersProp, _setPrevFiltersProp] = useState<Filters>(filtersProp)

  if (!equal(filtersProp, prevFiltersProp)) {
    _setPrevFiltersProp(filtersProp)

    // Skip a parent echoing filters already applied (setFilters, clearFilters, or a restore).
    if (!isInitialLoading && !equal(filtersProp, filters)) {
      _setFilters(filtersProp)
      _setPage(1)
      startRequest()
    }
  }

  const query = {
    page: pageProp,
    perPage: perPageProp,
    search: searchProp,
    sortBy: sortByProp,
    sortOrder: sortOrderProp,
    endpoint,
  }
  const [prevQuery, _setPrevQuery] = useState(query)
  const queryChange = getQueryChange(prevQuery, query)

  if (queryChange) {
    _setPrevQuery(query)

    if (!isInitialLoading) {
      if (queryChange.perPage != null) {
        _setPerPage(queryChange.perPage)
      }

      if (queryChange.search != null) {
        _setSearch(queryChange.search)
      }

      if (queryChange.sortBy != null) {
        _setSortBy(queryChange.sortBy)
      }

      if (queryChange.sortOrder != null) {
        _setSortOrder(queryChange.sortOrder)
      }

      _setPage(queryChange.page ?? 1)
      startRequest()
    }
  }

  // Lifecycle 6, actions called by the consumer. Each one sets the fields it changes and, when it
  // fetches, calls `startRequest`; the request runs after the render with the new values.
  // setPerPage, setSearch, setSortBy, setSortOrder, setFilters and clearFilters go back to page 1 and
  // refetch. refresh refetches the current page (load-more: from page 1). loadMore fetches the next
  // page. updateRowById, updateColumn and setSelection change state without a request.
  const actions = useMemo(() => {
    const setPage = (value: number) => {
      if (!value) {
        return
      }

      _setPage(value)
      startRequest()
    }

    // While the first response is pending the filters are stored without refetching.
    const setFilters = (nextFilters: Filters) => {
      if (equal(state.filters, nextFilters)) {
        return
      }

      _setFilters(nextFilters)

      if (!state.isInitialLoading) {
        setPage(1)
      }

      eventsRef.current.onFiltersChange?.(nextFilters)
    }

    return {
      setPage,

      setPerPage: (value: number) => {
        _setPerPage(value)
        setPage(1)
      },

      setSearch: (value: string) => {
        if (value === state.search) {
          return
        }

        _setSearch(value)
        setPage(1)
      },

      setSortBy: (value: string) => {
        if (value === state.sortBy) {
          return
        }

        _setSortBy(value)
        setPage(1)
      },

      setSortOrder: (value: SortOrder) => {
        if (value === state.sortOrder) {
          return
        }

        _setSortOrder(value)
        setPage(1)
      },

      // Two calls before the next render set the same page and one request runs.
      loadMore: () => {
        if (state.hasMore && !state.isLoading) {
          setPage(state.page + 1)
        }
      },

      clearFilters: () => {
        setFilters({ ...defaultFilters })
      },

      setFilters,

      refresh: () => {
        if (isLoadMore) {
          _setRows([])
          _setPage(1)
        }

        startRequest(true)
      },

      updateRowById: (row: Record<string, unknown>, id: string | number) => {
        const next = patchRowById(state.rows, row, id, state.idKey)

        if (!next) {
          console.warn(rowNotFoundMessage(state.idKey, id))
          return
        }

        _setRows(next)
      },

      // No derived field depends on columnSettings, so the saved State is complete without a render.
      updateColumn: (columnName: string, settingKey: string, value: unknown) => {
        const next = setColumnSetting(state.columnSettings, columnName, settingKey, value)

        _setColumnSettings(next)
        stateManager?.set?.({ ...state, columnSettings: next })
      },

      setSelection: (value: unknown[]) => {
        _setSelection(value)
      },
    }
  }, [state, stateManager, defaultFilters, isLoadMore])

  const context = useMemo((): Context => {
    return { ...state, ...actions }
  }, [state, actions])

  useImperativeHandle(ref, () => {
    return context
  }, [context])

  // Lifecycle 2, mount: `stateManager.init`, then `onFiltersChange` if the restored filters differ from
  // the prop. The first request follows in the request effect below. `initRef` keeps React
  // StrictMode's second mount from running this twice.
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) {
      return
    }

    initRef.current = true
    stateManager?.init?.(state)

    if (restoredFilters != null && !equal(restoredFilters, filtersProp)) {
      eventsRef.current.onFiltersChange?.(restoredFilters)
    }
  }, [])

  // Lifecycle 3 to 5, one request per `requestKey`. It reads the state of the render that started it,
  // so `requestHandler` gets the values the action set. The cleanup drops the response of a request
  // that a newer one replaced, or that is still pending when the list unmounts.
  // 3. Request: `beforePageChange` / `beforeLoadMore` get the State being requested, then
  //    `requestHandler` runs.
  // 4. Response: rows are replaced (page mode) or appended (load-more) with their `_index` and
  //    selection resets. The response effect below then runs `stateManager.set`, `onResponse` and
  //    `afterPageChange` / `afterLoadMore`.
  // 5. Error: error is set, rows and count are cleared and `onError` fires. `stateManager.set` and the
  //    after hooks do not run.
  useEffect(() => {
    if (!state.page) {
      return
    }

    let isCurrent = true
    const requestState = state

    if (isLoadMore) {
      eventsRef.current.beforeLoadMore?.(requestState)
    } else {
      eventsRef.current.beforePageChange?.(requestState)
    }

    requestHandler(requestState)
      .then((res) => {
        if (!isCurrent) {
          return
        }

        _setResponse(res)
        _setCount(res.count)
        _setRows(
          mergeRows(requestState.rows, res.rows, {
            page: requestState.page,
            perPage: requestState.perPage,
            isLoadMore,
          }),
        )
        // Keep the same array when nothing was selected, so the reset does not re-render.
        _setSelection((previous) => {
          if (previous.length === 0) {
            return previous
          }

          return []
        })
        _setIsInitialLoading(false)
        _setIsLoading(false)
        _setIsRefresh(false)
        _setResponseKey((key) => {
          return key + 1
        })
      })
      .catch((err: unknown) => {
        if (!isCurrent) {
          return
        }

        const nextError = toError(err)

        _setError(nextError)
        _setRows([])
        _setCount(0)
        _setIsInitialLoading(false)
        _setIsLoading(false)
        _setIsRefresh(false)

        eventsRef.current.onError?.(nextError)
        // The list UI already surfaces the error via `state.error`.
        // Re-throwing here creates unhandled promise rejections.
      })

    return () => {
      isCurrent = false
    }
  }, [requestKey])

  // Lifecycle 4, after the response has rendered: `stateManager.set` gets the committed State with
  // the new rows, then `onResponse` and `afterPageChange` / `afterLoadMore` fire.
  useEffect(() => {
    if (responseKey === 0 || !state.response) {
      return
    }

    stateManager?.set?.(state)
    eventsRef.current.onResponse?.(state.response)

    if (isLoadMore) {
      eventsRef.current.afterLoadMore?.(state.response)
    } else {
      eventsRef.current.afterPageChange?.(state.response)
    }
  }, [responseKey])

  // `onRowSelect` fires when the selection really changes, including the reset after a response.
  const prevSelectionRef = useRef(selection)

  useEffect(() => {
    const previous = prevSelectionRef.current
    prevSelectionRef.current = selection

    if (hasSelectionChanged(selection, previous)) {
      eventsRef.current.onRowSelect?.(selection, previous)
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
