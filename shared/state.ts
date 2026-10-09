import type { Filters, MetaRecord, SortOrder } from './core';
import type { ListHandlers } from './handlers';
import type { ListColumn, ColumnSettings } from './columns';
import type { ListResponse } from './response';

/** Pagination slice exposed on list state. */
export interface ListPagination {
  page: number;
  perPage: number;
  hasMore: boolean;
}

/** Loading flags exposed on list state. */
export interface ListLoader {
  isLoading: boolean;
  initialLoading: boolean;
}

/** Sorting slice exposed on list state. */
export interface ListSort {
  sortBy: string | null;
  sortOrder: SortOrder;
}

/** Full reactive list state exposed to UI components and composables. */
export interface ListState<T = unknown> extends ListHandlers<T> {
  rows: T[];
  response: ListResponse<T> | null;
  error: Error | null;
  count: number;
  selection: T[];
  pagination: ListPagination;
  loader: ListLoader;
  sort: ListSort;
  search: string;
  filters: Filters;
  columns: ListColumn[];
  columnSettings?: ColumnSettings;
  isEmpty: boolean;
  hasActiveFilters: boolean;
  isInitializing?: boolean;
  idKey?: string;
}

/** Row enriched with a display index (used by the rows scope). */
export type SerializedListRow<T> = T & {
  _index: number;
};

/** Internal shape used while bootstrapping list state inside the root list. */
export interface InternalListState<T = unknown> {
  page: number;
  perPage: number;
  sortBy: string;
  sortOrder: SortOrder;
  search: string;
  filters: Filters;
  columnSettings: ColumnSettings;
  rows: T[];
  selection: T[];
  error: Error | null;
  response: ListResponse<T> | null;
  count: number;
  isLoading: boolean;
  initializingState: boolean;
  confirmedPage: number | null;
}

/** Arguments used to build request/state-manager context from internal state. */
export interface ListContextBuildOptions {
  endpoint: string;
  version?: number | string;
  meta?: MetaRecord;
  defaultSearch?: string;
  defaultPage?: number;
  defaultPerPage?: number;
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
  defaultFilters?: Filters;
}
