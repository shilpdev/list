import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ListProviderConfig,
  ListProviderContextValue,
  ListState,
} from "@7span/list-types";

const ListContext = createContext<ListProviderContextValue<unknown> | null>(
  null
);

type ReactListProviderProps<T = unknown> = {
  children?: ReactNode;
  config: ListProviderConfig<T>;
};

export function ReactListProvider<T = unknown>({
  children,
  config,
}: ReactListProviderProps<T>) {
  const { requestHandler, stateManager = {} } = config;
  const [listState, setListState] = useState<ListState<T>>({
    data: [],
    response: null,
    error: null,
    count: 0,
    selection: [],
    pagination: {
      page: 1,
      perPage: 25,
      hasMore: false,
    },
    loader: {
      isLoading: false,
      initialLoading: true,
    },
    sort: {
      sortBy: null,
      sortOrder: "desc",
    },
    search: "",
    filters: {},
    attrs: [],
    isEmpty: true,
    hasActiveFilters: false,
    isInitializing: true,
    setPage: () => {},
    setPerPage: () => {},
    setSearch: () => {},
    setSort: () => {},
    setFilters: () => {},
    clearFilters: () => {},
    loadMore: () => {},
    refresh: () => {},
    setSelection: () => {},
    updateItemById: () => {},
  });

  if (!requestHandler) {
    throw new Error("ListProvider: requestHandler is required.");
  }

  const value = useMemo(
    (): ListProviderContextValue<T> => ({
      requestHandler,
      stateManager,
      listState,
      setListState,
    }),
    [requestHandler, stateManager, listState]
  );

  return (
    <ListContext.Provider
      value={value as ListProviderContextValue<unknown>}
    >
      {children}
    </ListContext.Provider>
  );
}

export function useListContext<T = unknown>(): ListProviderContextValue<T> {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error("useListContext must be used within a ListProvider");
  }
  return context as ListProviderContextValue<T>;
}
