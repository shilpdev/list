import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  ColumnSettings,
  Filters,
  InternalListState,
  ListOptions,
  ListProviderConfig,
  ListRenderScope,
  ListState,
  RequestContextPatch,
  SavedListState,
} from '../../../../shared'
import { ListContextProvider } from '../context/list-context'
import { deepEqual, DEFAULT_ID_KEY, getRowId } from '../utils'
import { hasActiveFilters } from './utils'

type LocalInternalListState = Omit<InternalListState, 'page'> & {
  page: number | string
}

export type ReactListProps = ListOptions &
  ListProviderConfig & {
    children?: ReactNode | ((state: ListRenderScope) => ReactNode)
    onFiltersChange?: (filters: Filters) => void
  }

const toError = (err: unknown): Error => (err instanceof Error ? err : new Error(String(err)))

/**
 * ReactList root component for data fetching, pagination, and state management.
 * Provides list context to child components (`ListSearch`, `ListPagination`, etc.).
 */
function ReactList({
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
}: ReactListProps) {
  if (!requestHandler) {
    throw new Error('ReactList: requestHandler is required.')
  }

  const initRef = useRef(false)
  const defaultFiltersRef = useRef<Filters>({ ...filters })
  const prevFiltersPropRef = useRef<Filters>(filters)
  const requestIdRef = useRef(0)

  const isLoadMore = paginationMode === 'loadMore'

  const getContext = useCallback(
    (currentState?: LocalInternalListState) => {
      return {
        endpoint,
        version,
        meta,
        search: currentState?.search ?? search,
        page: (currentState?.page ?? page) as number,
        perPage: currentState?.perPage ?? perPage,
        sortBy: currentState?.sortBy ?? sortBy,
        sortOrder: currentState?.sortOrder ?? sortOrder,
        filters: currentState?.filters ?? filters,
        columnSettings: currentState?.columnSettings ?? {},
      }
    },
    [endpoint, version, meta, search, page, perPage, sortBy, sortOrder, filters],
  )

  const getSavedState = (): SavedListState => {
    try {
      const oldState = stateManager?.get?.(getContext())

      return {
        page: oldState?.page,
        perPage: oldState?.perPage,
        sortBy: oldState?.sortBy,
        sortOrder: oldState?.sortOrder,
        search: oldState?.search,
        columnSettings: oldState?.columnSettings,
        filters: oldState?.filters,
      }
    } catch (err) {
      console.error(err)
      return {}
    }
  }

  const initializeState = (): LocalInternalListState => {
    const savedState = getSavedState()

    let initialPage: number | string = page
    if (isLoadMore) {
      initialPage = 1
    } else if (savedState.page != null) {
      initialPage = savedState.page
    }

    return {
      page: initialPage,
      perPage: savedState.perPage != null ? savedState.perPage : perPage,
      sortBy: savedState.sortBy != null ? savedState.sortBy : sortBy,
      sortOrder: savedState.sortOrder != null ? savedState.sortOrder : sortOrder,
      search: savedState.search != null ? savedState.search : search,
      filters: savedState.filters != null ? savedState.filters : filters,
      columnSettings: (savedState.columnSettings ?? {}) as ColumnSettings,
      rows: [],
      selection: [],
      error: null,
      response: null,
      count: initialCount,
      isLoading: true,
      initializingState: true,
      confirmedPage: null,
    }
  }

  const [state, setState] = useState(initializeState)

  const stateRef = useRef(state)
  stateRef.current = state

  const updateStateManager = useCallback(
    (stateToSave: LocalInternalListState) => {
      stateManager?.set?.(getContext(stateToSave))
    },
    [stateManager, getContext],
  )

  // Memoised because it is a dependency of `applyState` and `handlers`.
  const fetchData = useCallback(
    async (
      addContext: RequestContextPatch = {},
      newState: LocalInternalListState | null = null,
    ) => {
      const currentRequestId = ++requestIdRef.current
      setState((prev) => ({ ...prev, error: null, isLoading: true }))

      try {
        const currentState = newState ?? stateRef.current
        const previousRows = currentState.rows
        const res = await requestHandler({
          endpoint,
          version,
          meta,
          page: currentState.page as number,
          perPage: currentState.perPage,
          search: currentState.search,
          sortBy: currentState.sortBy,
          sortOrder: currentState.sortOrder,
          filters: currentState.filters,
          isRefresh: false,
          ...addContext,
        })

        if (currentRequestId !== requestIdRef.current) return

        const newRows =
          isLoadMore && (currentState.page as number) > 1
            ? [...previousRows, ...res.rows]
            : res.rows

        setState((prev) => ({
          ...prev,
          response: res,
          selection: [],
          rows: newRows,
          count: res.count,
          error: null,
          initializingState: false,
          isLoading: false,
        }))

        updateStateManager(currentState)

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
          initializingState: false,
          isLoading: false,
        }))
        // The list UI already surfaces the error via `state.error`.
        // Re-throwing here creates unhandled promise rejections.
      }
    },
    [
      endpoint,
      version,
      isLoadMore,
      meta,
      requestHandler,
      onResponse,
      afterLoadMore,
      afterPageChange,
      updateStateManager,
    ],
  )

  const applyState = useCallback(
    (patch: Partial<LocalInternalListState>, addContext: RequestContextPatch = {}) => {
      const nextState = { ...stateRef.current, ...patch }
      setState(nextState)
      fetchData(addContext, nextState)
    },
    [fetchData],
  )

  const handlers = useMemo(
    () => ({
      setPage: (value: number | string, addContext?: RequestContextPatch) => {
        const coerced = value === 0 ? '' : value
        if (coerced === '' || coerced === null || coerced === undefined) {
          return
        }
        const newPage = Number(coerced)
        if (!newPage) return

        applyState({ page: newPage }, addContext)
      },

      setPerPage: (value: number) => applyState({ perPage: value, page: 1 }),

      setSearch: (value: string) => {
        if (value === stateRef.current.search) return
        applyState({ search: value, page: 1 })
      },

      setSort: ({ by, order }: { by: string; order: 'asc' | 'desc' }) =>
        applyState({ sortBy: by, sortOrder: order, page: 1 }),

      loadMore: () => {
        const { page } = stateRef.current
        const hasMore = (page as number) * stateRef.current.perPage < stateRef.current.count
        if (hasMore && !stateRef.current.isLoading) {
          applyState({ page: (page as number) + 1 })
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

      refresh: (addContext: RequestContextPatch = { isRefresh: true }) => {
        if (isLoadMore) {
          applyState({ page: 1, rows: [] }, addContext)
        } else {
          fetchData(addContext)
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
            `ReactList: updateRowById did not find a row where ${idKey} === ${JSON.stringify(id)}. ` +
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
            [columnName]: { ...current.columnSettings?.[columnName], [settingKey]: value },
          },
        }

        setState(newState)
        updateStateManager(newState)
      },

      setSelection: (selection: unknown[]) => setState((prev) => ({ ...prev, selection })),
    }),
    [applyState, fetchData, isLoadMore, onFiltersChange, updateStateManager, idKey],
  )

  const memoizedState = useMemo(
    (): ListState => ({
      rows: state.rows,
      response: state.response,
      error: state.error,
      count: state.count,
      selection: state.selection,
      pagination: {
        page: state.page as number,
        perPage: state.perPage,
        hasMore: state.rows.length < state.count,
      },
      loader: {
        isLoading: state.isLoading,
        initialLoading: state.initializingState,
      },
      sort: { sortBy: state.sortBy, sortOrder: state.sortOrder },
      hasActiveFilters: hasActiveFilters(state.filters, defaultFiltersRef.current),
      search: state.search,
      filters: state.filters,
      columns:
        columns ??
        Object.keys((state.rows[0] as Record<string, unknown>) || {}).map((name) => ({ name })),
      columnSettings: state.columnSettings,
      isEmpty: state.rows.length === 0,
      isInitializing: state.initializingState,
      idKey,
      ...handlers,
    }),
    [
      state.rows,
      state.response,
      state.error,
      state.count,
      state.selection,
      state.page,
      state.perPage,
      state.isLoading,
      state.initializingState,
      state.sortBy,
      state.sortOrder,
      state.search,
      state.filters,
      state.columnSettings,
      handlers,
      columns,
      idKey,
    ],
  )

  const contextValue = useMemo(() => ({ listState: memoizedState }), [memoizedState])

  useEffect(() => {
    if (!state.initializingState || initRef.current) return

    initRef.current = true
    stateManager?.init?.(getContext(state))
    if (state.filters && !deepEqual(state.filters, filters)) {
      onFiltersChange?.(state.filters)
    }
    handlers.setPage(state.page as number)
  }, [])

  useEffect(() => {
    if (!initRef.current) return
    if (deepEqual(filters, prevFiltersPropRef.current)) return

    prevFiltersPropRef.current = filters
    applyState({ filters, page: 1 })
  }, [filters])

  return (
    <ListContextProvider value={contextValue}>
      <div className="react-list">
        {typeof children === 'function' ? children(memoizedState) : children}
      </div>
    </ListContextProvider>
  )
}

export default ReactList as (props: ReactListProps) => ReactNode
