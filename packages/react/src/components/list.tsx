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
import type {
  ColumnSettings,
  Context,
  Filters,
  ListHandlers,
  ListOptions,
  ListResponse,
  SortOrder,
  State,
} from '../../../../shared'
import { ListContextProvider } from '../context/list-context'
import { deepEqual, DEFAULT_ID_KEY, getRowId } from '../utils'
import { hasActiveFilters } from './utils'

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
  response: ListResponse | null
  count: number
  isLoading: boolean
  isInitialLoading: boolean
  isRefresh: boolean
}

const computeHasMore = (s: Pick<LocalInternalListState, 'page' | 'perPage' | 'count'>) =>
  s.page * s.perPage < s.count

/** Imperative API exposed via ref (mirrors ShilpList defineExpose). */
export type ShilpListHandle = {
  rows: unknown[]
  response: ListResponse | null
  isLoading: boolean
  error: Error | null
  count: number
  selection: unknown[]
} & Pick<
  ListHandlers,
  | 'setPage'
  | 'setPerPage'
  | 'setSortBy'
  | 'setSortOrder'
  | 'setSearch'
  | 'setSelection'
  | 'refresh'
  | 'loadMore'
  | 'setFilters'
  | 'clearFilters'
  | 'updateRowById'
  | 'updateColumn'
>

export type ShilpListProps = ListOptions & {
  children?: ReactNode | ((context: Context) => ReactNode)
  /** React 19 ref-as-prop; use with useImperativeHandle for the imperative API. */
  ref?: Ref<ShilpListHandle>
}

const toError = (err: unknown): Error => (err instanceof Error ? err : new Error(String(err)))

/**
 * ShilpList root component for data fetching, pagination, and state management.
 * Provides list context to child components (`ListSearch`, `ListPagination`, etc.).
 */
function ShilpList({
  ref,
  children,
  endpoint,
  idKey = DEFAULT_ID_KEY,
  page = 1,
  perPage = 25,
  sortBy = '',
  sortOrder = 'desc',
  search = '',
  filters = {},
  columns,
  version = 1,
  paginationMode = 'pagination',
  meta = {},
  count: initialCount = 0,
  requestHandler,
  stateManager = {},
  onResponse,
  afterPageChange,
  afterLoadMore,
  onFiltersChange,
  onRowSelect,
}: ShilpListProps) {
  if (!requestHandler) {
    throw new Error('ShilpList: requestHandler is required.')
  }

  const initRef = useRef(false)
  const defaultFiltersRef = useRef<Filters>({ ...filters })
  const prevFiltersPropRef = useRef<Filters>(filters)
  const prevQueryRef = useRef({ page, perPage, search, sortBy, sortOrder, endpoint })
  const requestIdRef = useRef(0)

  const isLoadMore = paginationMode === 'loadMore'

  const buildState = useCallback(
    (s: LocalInternalListState): State => ({
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
      hasMore: computeHasMore(s),
      isLoading: s.isLoading,
      isInitialLoading: s.isInitialLoading,
      isRefresh: s.isRefresh,
      sortBy: s.sortBy,
      sortOrder: s.sortOrder,
      search: s.search,
      filters: s.filters,
      columns:
        columns ??
        Object.keys((s.rows[0] as Record<string, unknown>) || {}).map((name) => ({ name })),
      columnSettings: s.columnSettings,
      isEmpty: s.rows.length === 0,
      hasActiveFilters: hasActiveFilters(s.filters, defaultFiltersRef.current),
      idKey,
    }),
    [endpoint, version, meta, columns, idKey],
  )

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

    return {
      ...base,
      page: isLoadMore ? 1 : (saved.page ?? base.page),
      perPage: saved.perPage ?? base.perPage,
      sortBy: saved.sortBy ?? base.sortBy,
      sortOrder: saved.sortOrder ?? base.sortOrder,
      search: saved.search ?? base.search,
      filters: saved.filters ?? base.filters,
      columnSettings: saved.columnSettings ?? base.columnSettings,
    }
  }

  const [state, setState] = useState(initializeState)

  const stateRef = useRef(state)
  stateRef.current = state

  const updateStateManager = useCallback(
    (stateToSave: LocalInternalListState) => {
      stateManager?.set?.(buildState(stateToSave))
    },
    [stateManager, buildState],
  )

  // Memoised because it is a dependency of `applyState` and `handlers`.
  const fetchData = useCallback(
    async (isRefresh = false, newState: LocalInternalListState | null = null) => {
      const currentRequestId = ++requestIdRef.current
      setState((prev) => ({ ...prev, error: null, isLoading: true, isRefresh }))

      try {
        const currentState = newState ?? stateRef.current
        const previousRows = currentState.rows
        const res = await requestHandler(
          buildState({ ...currentState, error: null, isLoading: true, isRefresh }),
        )

        if (currentRequestId !== requestIdRef.current) return

        const newRows =
          isLoadMore && currentState.page > 1 ? [...previousRows, ...res.rows] : res.rows

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

        setState((prev) => ({ ...prev, ...loaded }))

        updateStateManager({ ...stateRef.current, ...loaded })

        onResponse?.(res)
        if (isLoadMore) {
          afterLoadMore?.(res)
        } else {
          afterPageChange?.(res)
        }
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return
        setState((prev) => ({
          ...prev,
          error: toError(err),
          rows: [],
          count: 0,
          isInitialLoading: false,
          isLoading: false,
          isRefresh: false,
        }))
        // The list UI already surfaces the error via `state.error`.
        // Re-throwing here creates unhandled promise rejections.
      }
    },
    [
      buildState,
      isLoadMore,
      requestHandler,
      onResponse,
      afterLoadMore,
      afterPageChange,
      updateStateManager,
    ],
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

  const hasMore = computeHasMore(state)

  const handlers = useMemo(
    () => ({
      setPage: (value: number) => {
        if (!value) return
        applyState({ page: value })
      },

      setPerPage: (value: number) => applyState({ perPage: value, page: 1 }),

      setSearch: (value: string) => {
        if (value === stateRef.current.search) return
        applyState({ search: value, page: 1 })
      },

      setSortBy: (value: string) => {
        if (value === stateRef.current.sortBy) return
        applyState({ sortBy: value, page: 1 })
      },

      setSortOrder: (value: SortOrder) => {
        if (value === stateRef.current.sortOrder) return
        applyState({ sortOrder: value, page: 1 })
      },

      loadMore: () => {
        if (hasMore && !stateRef.current.isLoading) {
          applyState({ page: stateRef.current.page + 1 })
        }
      },

      clearFilters: () => {
        const nextFilters = { ...defaultFiltersRef.current }
        if (deepEqual(stateRef.current.filters, nextFilters)) return
        applyState({ filters: nextFilters, page: 1 })
        onFiltersChange?.(nextFilters)
      },

      setFilters: (nextFilters: Filters) => {
        if (deepEqual(stateRef.current.filters, nextFilters)) return
        applyState({ filters: nextFilters, page: 1 })
        onFiltersChange?.(nextFilters)
      },

      refresh: () => {
        if (isLoadMore) {
          applyState({ page: 1, rows: [] }, true)
        } else {
          fetchData(true)
        }
      },

      updateRowById: (row: Record<string, unknown>, id: string | number) => {
        let matched = false

        const newRows = stateRef.current.rows.map((entry) => {
          if (getRowId(entry, idKey) !== id) return entry
          matched = true
          return { ...(entry as Record<string, unknown>), ...row }
        })

        if (!matched) {
          console.warn(
            `ShilpList: updateRowById did not find a row where ${idKey} === ${JSON.stringify(id)}. ` +
              `Verify your rows expose "${idKey}" and that the id type matches exactly.`,
          )
          return
        }

        setState((prev) => ({ ...prev, rows: newRows }))
      },

      updateColumn: (columnName: string, settingKey: string, value: unknown) => {
        const current = stateRef.current
        const newState = {
          ...current,
          columnSettings: {
            ...current.columnSettings,
            [columnName]: { ...current.columnSettings[columnName], [settingKey]: value },
          },
        }

        stateRef.current = newState
        setState(newState)
        updateStateManager(newState)
      },

      setSelection: (selection: unknown[]) => setState((prev) => ({ ...prev, selection })),
    }),
    [applyState, fetchData, hasMore, isLoadMore, onFiltersChange, updateStateManager, idKey],
  )

  const context = useMemo(
    (): Context => ({ ...buildState(state), ...handlers }),
    [buildState, state, handlers],
  )

  useImperativeHandle(
    ref,
    () => ({
      get rows() {
        return stateRef.current.rows
      },
      get response() {
        return stateRef.current.response
      },
      get isLoading() {
        return stateRef.current.isLoading
      },
      get error() {
        return stateRef.current.error
      },
      get count() {
        return stateRef.current.count
      },
      get selection() {
        return stateRef.current.selection
      },
      setPage: handlers.setPage,
      setPerPage: handlers.setPerPage,
      setSortBy: handlers.setSortBy,
      setSortOrder: handlers.setSortOrder,
      setSearch: handlers.setSearch,
      setSelection: handlers.setSelection,
      refresh: handlers.refresh,
      loadMore: handlers.loadMore,
      setFilters: handlers.setFilters,
      clearFilters: handlers.clearFilters,
      updateRowById: handlers.updateRowById,
      updateColumn: handlers.updateColumn,
    }),
    [handlers],
  )

  useEffect(() => {
    if (!state.isInitialLoading || initRef.current) return

    initRef.current = true
    stateManager?.init?.(buildState(state))
    if (state.filters && !deepEqual(state.filters, filters)) {
      onFiltersChange?.(state.filters)
    }
    handlers.setPage(state.page)
  }, [])

  useEffect(() => {
    if (!initRef.current) return
    if (deepEqual(filters, prevFiltersPropRef.current)) return

    prevFiltersPropRef.current = filters
    // Parent echoed filters already applied (setFilters, clearFilters, or stateManager restore).
    if (deepEqual(filters, stateRef.current.filters)) return

    applyState({ filters, page: 1 })
  }, [filters, applyState])

  useEffect(() => {
    if (!initRef.current) return

    const prev = prevQueryRef.current
    const pageChanged = page !== prev.page
    const perPageChanged = perPage !== prev.perPage
    const searchChanged = search !== prev.search
    const sortByChanged = sortBy !== prev.sortBy
    const sortOrderChanged = sortOrder !== prev.sortOrder
    const endpointChanged = endpoint !== prev.endpoint

    if (
      !pageChanged &&
      !perPageChanged &&
      !searchChanged &&
      !sortByChanged &&
      !sortOrderChanged &&
      !endpointChanged
    ) {
      return
    }

    prevQueryRef.current = { page, perPage, search, sortBy, sortOrder, endpoint }

    const queryChanged =
      perPageChanged || searchChanged || sortByChanged || sortOrderChanged || endpointChanged
    const patch: Partial<LocalInternalListState> = {}
    if (perPageChanged) patch.perPage = perPage
    if (searchChanged) patch.search = search
    if (sortByChanged) patch.sortBy = sortBy
    if (sortOrderChanged) patch.sortOrder = sortOrder
    if (pageChanged) patch.page = page
    else if (queryChanged) patch.page = 1

    applyState(patch)
  }, [page, perPage, search, sortBy, sortOrder, endpoint, applyState])

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
    onRowSelect?.(state.selection, previous)
  }, [state.selection, onRowSelect])

  return (
    <ListContextProvider value={context}>
      <div className="react-list">
        {typeof children === 'function' ? children(context) : children}
      </div>
    </ListContextProvider>
  )
}

export default ShilpList
