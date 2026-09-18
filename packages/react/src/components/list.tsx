import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  AttrSettings,
  Filters,
  InternalListState,
  ListAttribute,
  ListOptions,
  ListProviderConfig,
  ListRenderScope,
  ListState,
  RequestContextPatch,
  SavedListState,
  StateManagerContext,
} from '../../../../shared'
import { ListContextProvider } from '../context/list-context'
import { hasActiveFilters } from './utils'
import { isEqual } from '../utils'

type LocalInternalListState<T> = Omit<InternalListState<T>, 'page'> & {
  page: number | string
}

export type ReactListProps<T = unknown> = ListOptions<T> &
  ListProviderConfig<T> & {
    children?: ReactNode | ((state: ListRenderScope<T>) => ReactNode)
    onFiltersChange?: (filters: Filters) => void
  }

const toError = (err: unknown): Error => (err instanceof Error ? err : new Error(String(err)))

function buildDefaultAttrSettings(
  attrSource: ListAttribute[] | string[] | undefined,
  firstItem?: unknown,
): AttrSettings {
  const names = attrSource?.length
    ? attrSource.map((attr) => (typeof attr === 'string' ? attr : attr.name))
    : firstItem
      ? Object.keys(firstItem as Record<string, unknown>)
      : []

  return names.reduce<AttrSettings>((settings, name) => {
    settings[name] = { visible: true }
    return settings
  }, {})
}

/**
 * ReactList root component for data fetching, pagination, and state management.
 * Provides list context to child components (`ListSearch`, `ListPagination`, etc.).
 */
function ReactList<T = unknown>({
  children,
  endpoint,
  page = 1,
  perPage = 25,
  sortBy = '',
  sortOrder = 'desc',
  search = '',
  filters = {},
  attrs,
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
}: ReactListProps<T>) {
  if (!requestHandler) {
    throw new Error('ReactList: requestHandler is required.')
  }

  const initRef = useRef(false)
  const defaultFiltersRef = useRef<Filters>({ ...filters })
  const prevFiltersPropRef = useRef<Filters>(filters)

  const isLoadMore = paginationMode === 'loadMore'

  const getContext = useCallback(
    (currentState?: LocalInternalListState<T>): StateManagerContext => {
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
        attrSettings: currentState?.attrSettings ?? {},
      }
    },
    [endpoint, version, meta, search, page, perPage, sortBy, sortOrder, filters],
  )

  const getSavedState = useCallback((): SavedListState => {
    try {
      const context = getContext()
      const oldState = stateManager?.get?.(context)

      return {
        page: oldState?.page,
        perPage: oldState?.perPage,
        sortBy: oldState?.sortBy,
        sortOrder: oldState?.sortOrder,
        search: oldState?.search,
        attrSettings: oldState?.attrSettings,
        filters: oldState?.filters,
      }
    } catch (err) {
      console.error(err)
      return {}
    }
  }, [getContext, stateManager])

  const initializeState = useCallback((): LocalInternalListState<T> => {
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
      attrSettings: (savedState.attrSettings ?? {}) as AttrSettings,
      items: [],
      selection: [],
      error: null,
      response: null,
      count: initialCount,
      isLoading: true,
      initializingState: true,
      confirmedPage: null,
    }
  }, [getSavedState, search, page, perPage, sortBy, sortOrder, filters, isLoadMore, initialCount])

  const [state, setState] = useState(initializeState)

  const stateRef = useRef(state)
  stateRef.current = state

  const requestIdRef = useRef(0)

  const updateStateManager = useCallback(
    (stateToSave: LocalInternalListState<T>) => {
      if (stateManager) {
        const context = getContext(stateToSave)
        stateManager?.set?.(context)
      }
    },
    [stateManager, getContext],
  )

  const fetchData = useCallback(
    async (
      addContext: RequestContextPatch = {},
      newState: LocalInternalListState<T> | null = null,
    ) => {
      const currentRequestId = ++requestIdRef.current
      setState((prev) => ({ ...prev, error: null, isLoading: true }))

      try {
        const currentState = newState ?? stateRef.current
        const previousItems = newState?.items ?? stateRef.current.items
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
          ...addContext,
        })

        if (currentRequestId !== requestIdRef.current) return

        if (onResponse) onResponse(res)

        if (isLoadMore) {
          if (afterLoadMore) afterLoadMore(res)
        } else {
          if (afterPageChange) afterPageChange(res)
        }

        const updatedState: LocalInternalListState<T> = {
          ...currentState,
          response: res,
          selection: [],
          items:
            isLoadMore && (currentState.page as number) > 1
              ? [...previousItems, ...res.items]
              : res.items,
          count: res.count,
          initializingState: false,
          isLoading: false,
        }

        updateStateManager(updatedState)

        setState(updatedState)
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return
        setState((prev) => ({
          ...prev,
          error: toError(err),
          items: [],
          count: 0,
          initializingState: false,
          isLoading: false,
        }))
        // The list UI already surfaces the error via `state.error`.
        // Re-throwing here creates unhandled promise rejections that break
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

  const handlers = useMemo(
    () => ({
      setPage: (value: number | string, addContext?: RequestContextPatch) => {
        let newPage: number | string = value
        if (value === 0) {
          newPage = ''
        }
        const newState = { ...stateRef.current, page: newPage }
        setState(newState)
        if (newPage) fetchData(addContext, newState)
      },

      setPerPage: (value: number) => {
        const newState = { ...stateRef.current, perPage: value, page: 1 }
        setState(newState)
        fetchData({}, newState)
      },

      setSearch: (value: string) => {
        if (value !== stateRef.current.search) {
          const newState = { ...stateRef.current, search: value, page: 1 }
          setState(newState)
          fetchData({}, newState)
        }
      },

      setSort: ({ by, order }: { by: string; order: 'asc' | 'desc' }) => {
        const newState = { ...stateRef.current, sortBy: by, sortOrder: order, page: 1 }
        setState(newState)
        fetchData({}, newState)
      },

      loadMore: () => {
        const newState = { ...stateRef.current, page: (stateRef.current.page as number) + 1 }
        setState(newState)
        fetchData({}, newState)
      },

      clearFilters: () => {
        const nextFilters = { ...defaultFiltersRef.current }
        const newState = { ...stateRef.current, filters: nextFilters, page: 1 }
        setState(newState)
        fetchData({}, newState)
        onFiltersChange?.(nextFilters)
      },

      refresh: (addContext: RequestContextPatch = { isRefresh: true }) => {
        if (isLoadMore) {
          const newState = { ...stateRef.current, page: 1, items: [] }
          setState(newState)
          fetchData(addContext, newState)
        } else {
          fetchData(addContext)
        }
      },

      setFilters: (nextFilters: typeof filters) => {
        const newState = { ...stateRef.current, filters: nextFilters, page: 1 }
        setState(newState)
        fetchData({}, newState)
        onFiltersChange?.(nextFilters)
      },

      updateItemById: (item: Partial<T>, id: string | number) => {
        const newItems = stateRef.current.items.map((i) => {
          const record = i as T & { id?: string | number }
          if (record.id === id) {
            return { ...i, ...item }
          }
          return i
        })
        setState((prev) => ({ ...prev, items: newItems }))
      },

      updateAttr: (attrName: string, settingKey: string, value: boolean | unknown) => {
        const nextAttrSettings = { ...(stateRef.current.attrSettings ?? {}) }
        if (!nextAttrSettings[attrName]) {
          nextAttrSettings[attrName] = {}
        }
        nextAttrSettings[attrName] = {
          ...nextAttrSettings[attrName],
          [settingKey]: value,
        }
        const newState = { ...stateRef.current, attrSettings: nextAttrSettings }
        setState(newState)
        updateStateManager(newState)
      },

      setSelection: (selection: T[]) => setState((prev) => ({ ...prev, selection })),
    }),
    [fetchData, isLoadMore, onFiltersChange, updateStateManager],
  )

  const memoizedState = useMemo(
    (): ListState<T> => ({
      data: state.items,
      response: state.response,
      error: state.error,
      count: state.count,
      selection: state.selection,
      pagination: {
        page: state.page as number,
        perPage: state.perPage,
        hasMore: state.items.length < state.count,
      },
      loader: {
        isLoading: state.isLoading,
        initialLoading: state.initializingState,
      },
      sort: { sortBy: state.sortBy, sortOrder: state.sortOrder },
      hasActiveFilters: hasActiveFilters(state.filters, defaultFiltersRef.current),
      search: state.search,
      filters: state.filters,
      attrs: attrs || Object.keys((state.items[0] as Record<string, unknown>) || {}),
      attrSettings: state.attrSettings,
      isEmpty: state.items.length === 0,
      isInitializing: state.initializingState,
      ...handlers,
    }),
    [
      state.items,
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
      state.attrSettings,
      handlers,
      attrs,
    ],
  )

  const contextValue = useMemo(() => ({ listState: memoizedState }), [memoizedState])

  useEffect(() => {
    if (Object.keys(state.attrSettings).length > 0) {
      return
    }

    const settings = buildDefaultAttrSettings(attrs, state.items[0])
    if (Object.keys(settings).length === 0) {
      return
    }

    setState((prev) => ({ ...prev, attrSettings: settings }))
  }, [attrs, state.items, state.attrSettings])

  useEffect(() => {
    if (!state.initializingState) {
      return
    }
    if (!initRef.current) {
      initRef.current = true

      if (stateManager?.init) {
        const context = getContext(state)
        stateManager.init(context)
      }

      handlers.setPage(state.page as number)
    }
  }, [])

  useEffect(() => {
    if (!initRef.current) return

    if (!isEqual(filters, prevFiltersPropRef.current)) {
      prevFiltersPropRef.current = filters
      const newState = { ...stateRef.current, filters, page: 1 }
      setState(newState)
      fetchData({}, newState)
    }
  }, [filters])

  return (
    <ListContextProvider value={contextValue}>
      {typeof children === 'function' ? children(memoizedState) : children}
    </ListContextProvider>
  )
}

export default ReactList as <T = unknown>(props: ReactListProps<T>) => ReactNode
