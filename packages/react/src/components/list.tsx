import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import equal from 'fast-deep-equal'
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
  computeHasMore,
  hasSelectionChanged,
  getColumns,
  getQueryChange,
  getRestoredState,
  hasActiveFilters,
  mergeRows,
  patchRowById,
  rowNotFoundMessage,
  setColumnSetting,
  toError,
} from '@shared/utils'
import {
  DEFAULT_COUNT,
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
import { ListContextProvider } from '../context/list-context'

type LocalInternalListState = {
  page: number
  perPage: number
  sortBy: string
  sortOrder: SortOrder
  search: string
  filters: Filters
  columnSettings: ColumnSettings
  rows: unknown[]
  selection: unknown[]
  error: Error | null
  response: RequestHandlerResponse | null
  count: number
  isLoading: boolean
  isInitialLoading: boolean
  isRefresh: boolean
}

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
  count: initialCount = DEFAULT_COUNT,
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
  const initRef = useRef(false)
  const defaultFiltersRef = useRef<Filters>({ ...filters })
  const prevFiltersPropRef = useRef<Filters>(filters)
  const prevQueryRef = useRef({ page, perPage, search, sortBy, sortOrder, endpoint })
  const requestIdRef = useRef(0)

  const isLoadMore = paginationMode === 'loadMore'

  const buildState = useCallback(
    (s: LocalInternalListState): State => {
      return {
        endpoint,
        version,
        meta,
        rows: s.rows,
        response: s.response,
        error: s.error,
        count: s.count,
        selection: s.selection,
        page: s.page,
        perPage: s.perPage,
        hasMore: computeHasMore(s.page, s.perPage, s.count),
        isLoading: s.isLoading,
        isInitialLoading: s.isInitialLoading,
        isRefresh: s.isRefresh,
        sortBy: s.sortBy,
        sortOrder: s.sortOrder,
        search: s.search,
        filters: s.filters,
        columns: getColumns(columns, s.rows),
        columnSettings: s.columnSettings,
        isEmpty: s.rows.length === 0,
        hasActiveFilters: hasActiveFilters(s.filters, defaultFiltersRef.current),
        idKey,
      }
    },
    [endpoint, version, meta, columns, idKey],
  )

  // Lifecycle 1, setup (first render): state starts from the props and defaults. `stateManager.get`
  // runs before any state exists and may restore page, perPage, sort, search, filters and
  // columnSettings. A load-more list always starts on page 1. Nothing is fetched yet.
  const initializeState = (): LocalInternalListState => {
    const base: LocalInternalListState = {
      page,
      perPage,
      sortBy,
      sortOrder,
      search,
      filters,
      columnSettings: {},
      rows: [],
      selection: [],
      error: null,
      response: null,
      count: initialCount,
      isLoading: true,
      isInitialLoading: true,
      isRefresh: false,
    }

    let saved: Partial<State> = {}

    try {
      saved = stateManager?.get?.(buildState(base)) ?? {}
    } catch (err) {
      console.error(err)
    }

    const restored = getRestoredState(saved, isLoadMore)

    return {
      ...base,
      page: restored.page ?? base.page,
      perPage: restored.perPage ?? base.perPage,
      sortBy: restored.sortBy ?? base.sortBy,
      sortOrder: restored.sortOrder ?? base.sortOrder,
      search: restored.search ?? base.search,
      filters: restored.filters ?? base.filters,
      columnSettings: restored.columnSettings ?? base.columnSettings,
    }
  }

  const [state, setState] = useState(initializeState)

  const stateRef = useRef(state)
  stateRef.current = state

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

  const updateStateManager = useCallback(
    (stateToSave: LocalInternalListState) => {
      stateManager?.set?.(buildState(stateToSave))
    },
    [stateManager, buildState],
  )

  // Lifecycle 3 to 5, one request. Only the latest request counts (`requestIdRef`).
  // 3. Request: state shows isLoading (and isRefresh), `beforePageChange` / `beforeLoadMore` get the
  //    State being requested, then `requestHandler` runs.
  // 4. Response: rows are replaced (page mode) or appended (load-more) with their `_index`, selection
  //    resets, `stateManager.set` runs, then `onResponse` and `afterPageChange` / `afterLoadMore` fire.
  // 5. Error: error is set, rows and count are cleared and `onError` fires. `stateManager.set` and the
  //    after hooks do not run.
  const fetchData = useCallback(
    async (isRefresh = false, newState: LocalInternalListState | null = null) => {
      const currentRequestId = ++requestIdRef.current

      setState((prev) => {
        return { ...prev, error: null, isLoading: true, isRefresh }
      })

      try {
        const currentState = newState ?? stateRef.current
        const previousRows = currentState.rows
        const requestState = buildState({
          ...currentState,
          error: null,
          isLoading: true,
          isRefresh,
        })

        if (isLoadMore) {
          eventsRef.current.beforeLoadMore?.(requestState)
        } else {
          eventsRef.current.beforePageChange?.(requestState)
        }

        const res = await requestHandler(requestState)

        if (currentRequestId !== requestIdRef.current) {
          return
        }

        const newRows = mergeRows(previousRows, res.rows, {
          page: currentState.page,
          perPage: currentState.perPage,
          isLoadMore,
        })

        const loaded = {
          response: res,
          selection: [],
          rows: newRows,
          count: res.count,
          error: null,
          isInitialLoading: false,
          isLoading: false,
          isRefresh: false,
        }

        setState((prev) => {
          return { ...prev, ...loaded }
        })

        updateStateManager({ ...stateRef.current, ...loaded })

        eventsRef.current.onResponse?.(res)

        if (isLoadMore) {
          eventsRef.current.afterLoadMore?.(res)
        } else {
          eventsRef.current.afterPageChange?.(res)
        }
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        const error = toError(err)

        setState((prev) => {
          return {
            ...prev,
            error,
            rows: [],
            count: 0,
            isInitialLoading: false,
            isLoading: false,
            isRefresh: false,
          }
        })

        eventsRef.current.onError?.(error)
        // The list UI already surfaces the error via `state.error`.
        // Re-throwing here creates unhandled promise rejections.
      }
    },
    [buildState, isLoadMore, requestHandler, updateStateManager],
  )

  const applyState = useCallback(
    (patch: Partial<LocalInternalListState>, isRefresh = false) => {
      const nextState = { ...stateRef.current, ...patch }
      stateRef.current = nextState
      setState(nextState)
      fetchData(isRefresh, nextState)
    },
    [fetchData],
  )

  const hasMore = computeHasMore(state.page, state.perPage, state.count)

  // While the first response is pending the filters are stored without refetching.
  const changeFilters = useCallback(
    (nextFilters: Filters) => {
      if (equal(stateRef.current.filters, nextFilters)) {
        return
      }

      if (stateRef.current.isInitialLoading) {
        const next = { ...stateRef.current, filters: nextFilters }
        stateRef.current = next
        setState(next)
      } else {
        applyState({ filters: nextFilters, page: 1 })
      }

      eventsRef.current.onFiltersChange?.(nextFilters)
    },
    [applyState],
  )

  // Lifecycle 6, actions called by the consumer. setPerPage, setSearch, setSortBy, setSortOrder,
  // setFilters and clearFilters go back to page 1 and refetch. refresh refetches the current page
  // (load-more: from page 1). loadMore fetches the next page. updateRowById, updateColumn and
  // setSelection change state without a request.
  const handlers = useMemo(() => {
    return {
      setPage: (value: number) => {
        if (!value) {
          return
        }

        applyState({ page: value })
      },

      setPerPage: (value: number) => {
        applyState({ perPage: value, page: 1 })
      },

      setSearch: (value: string) => {
        if (value === stateRef.current.search) {
          return
        }

        applyState({ search: value, page: 1 })
      },

      setSortBy: (value: string) => {
        if (value === stateRef.current.sortBy) {
          return
        }

        applyState({ sortBy: value, page: 1 })
      },

      setSortOrder: (value: SortOrder) => {
        if (value === stateRef.current.sortOrder) {
          return
        }

        applyState({ sortOrder: value, page: 1 })
      },

      loadMore: () => {
        if (hasMore && !stateRef.current.isLoading) {
          applyState({ page: stateRef.current.page + 1 })
        }
      },

      clearFilters: () => {
        changeFilters({ ...defaultFiltersRef.current })
      },

      setFilters: changeFilters,

      refresh: () => {
        if (isLoadMore) {
          applyState({ page: 1, rows: [] }, true)
        } else {
          fetchData(true)
        }
      },

      updateRowById: (row: Record<string, unknown>, id: string | number) => {
        const newRows = patchRowById(stateRef.current.rows, row, id, idKey)

        if (!newRows) {
          console.warn(rowNotFoundMessage(idKey, id))
          return
        }

        setState((prev) => {
          return { ...prev, rows: newRows }
        })
      },

      updateColumn: (columnName: string, settingKey: string, value: unknown) => {
        const current = stateRef.current
        const newState = {
          ...current,
          columnSettings: setColumnSetting(current.columnSettings, columnName, settingKey, value),
        }

        stateRef.current = newState
        setState(newState)
        updateStateManager(newState)
      },

      setSelection: (selection: unknown[]) => {
        setState((prev) => {
          return { ...prev, selection }
        })
      },
    }
  }, [applyState, changeFilters, fetchData, hasMore, isLoadMore, updateStateManager, idKey])

  const context = useMemo((): Context => {
    return { ...buildState(state), ...handlers }
  }, [buildState, state, handlers])

  useImperativeHandle(ref, () => {
    return context
  }, [context])

  // Lifecycle 2, mount: `stateManager.init`, then `onFiltersChange` if the restored filters differ from
  // the prop, then the first request.
  useEffect(() => {
    if (!state.isInitialLoading || initRef.current) {
      return
    }

    initRef.current = true
    stateManager?.init?.(buildState(state))

    if (state.filters && !equal(state.filters, filters)) {
      eventsRef.current.onFiltersChange?.(state.filters)
    }

    handlers.setPage(state.page)
  }, [])

  // Lifecycle 7, props changing after mount: `filters` and the query props (page, perPage, search,
  // sortBy, sortOrder, endpoint) refetch, except before the first response has arrived.
  useEffect(() => {
    if (!initRef.current) {
      return
    }

    if (equal(filters, prevFiltersPropRef.current)) {
      return
    }

    prevFiltersPropRef.current = filters

    // Ignored until the first response, like Vue.
    if (stateRef.current.isInitialLoading) {
      return
    }

    // Parent echoed filters already applied (setFilters, clearFilters, or stateManager restore).
    if (equal(filters, stateRef.current.filters)) {
      return
    }

    applyState({ filters, page: 1 })
  }, [filters, applyState])

  useEffect(() => {
    if (!initRef.current) {
      return
    }

    const next = { page, perPage, search, sortBy, sortOrder, endpoint }
    const patch = getQueryChange(prevQueryRef.current, next)

    if (!patch) {
      return
    }

    prevQueryRef.current = next

    // Ignored until the first response, like Vue.
    if (stateRef.current.isInitialLoading) {
      return
    }

    applyState(patch)
  }, [page, perPage, search, sortBy, sortOrder, endpoint, applyState])

  // `onRowSelect` fires when the selection really changes, including the reset after a response.
  const prevSelectionRef = useRef(state.selection)
  const selectionEffectReadyRef = useRef(false)

  useEffect(() => {
    if (!selectionEffectReadyRef.current) {
      selectionEffectReadyRef.current = true
      prevSelectionRef.current = state.selection
      return
    }

    const previous = prevSelectionRef.current
    prevSelectionRef.current = state.selection

    if (hasSelectionChanged(state.selection, previous)) {
      eventsRef.current.onRowSelect?.(state.selection, previous)
    }
  }, [state.selection])

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
