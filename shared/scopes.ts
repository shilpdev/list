import type { ListColumn, ColumnSettings, UpdateColumnFn } from './columns';
import type { ListState, ListSort, SerializedListRow } from './state';

/** Scope for the rows slot. */
export interface RowsScope<T = unknown> {
  rows: SerializedListRow<T>[];
  isLoading: boolean;
  setSort: (sort: { by: string; order: 'asc' | 'desc' }) => void;
  sort: ListSort;
}

/** Scope for summary slot. */
export interface SummaryScope {
  from: number;
  to: number;
  visibleCount: number;
  count: number;
}

/** Scope for search slot. */
export interface SearchScope {
  search: string;
  setSearch: (value: string) => void;
}

/** Scope for pagination slot. */
export interface PaginationScope {
  page: number;
  perPage: number;
  count: number;
  pagesCount: number;
  halfWay: number;
  hasNext: boolean;
  hasPrev: boolean;
  pagesToDisplay: number[];
  prev: () => void;
  next: () => void;
  first: () => void;
  last: () => void;
  setPage: (page: number) => void;
}

/** Scope for load-more slot. */
export interface LoadMoreScope {
  isLoading: boolean;
  loadMore: () => void;
  hasMoreRows: boolean;
}

/** Scope for go-to-page slot. */
export interface GoToScope {
  setPage: (page: number) => void;
  page: number;
  pages: number[];
  pagesCount: number;
}

/** Scope for per-page slot. */
export interface PerPageScope {
  perPage: number;
  setPerPage: (perPage: number) => void;
  options: Array<{ value: number; label: string | number }>;
}

/** Scope for refresh slot. */
export interface RefreshScope {
  isLoading: boolean;
  refresh: () => void;
}

/** Scope for loader slot. */
export interface LoaderScope {
  isLoading: boolean;
}

/** Scope for initial-loader slot. */
export interface InitialLoaderScope {
  loading: boolean;
}

/** Scope for error slot. */
export interface ErrorScope {
  error: Error;
}

/** Scope for the columns slot. */
export interface ColumnsScope {
  columns: ListColumn[];
  columnSettings: ColumnSettings;
  updateColumn: UpdateColumnFn;
}

/** Scope for root list render function / default slot. */
export type ListRenderScope<T = unknown> = ListState<T>;
