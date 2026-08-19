import type { Filters, MetaRecord, PaginationMode, SortOrder } from '../core';
import type { ListResponse } from '../response';
import type { ListAttribute } from '../attributes';
import type { PaginationScope } from '../scopes';

/** Lifecycle hooks shared by React props and Vue emits. */
export interface ListLifecycleCallbacks<T = unknown> {
  onResponse?: (response: ListResponse<T>) => void;
  afterPageChange?: (response: ListResponse<T>) => void;
  afterLoadMore?: (response: ListResponse<T>) => void;
}

/** Root list configuration shared by React and Vue implementations. */
export interface ListOptions<T = unknown> extends ListLifecycleCallbacks<T> {
  /** Unique identifier for the data source (API route or key). */
  endpoint: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  count?: number;
  search?: string;
  filters?: Filters;
  attrs?: ListAttribute[] | string[];
  version?: number | string;
  paginationMode?: PaginationMode;
  meta?: MetaRecord;
}

/** Options for the search input component. */
export interface SearchComponentOptions {
  debounceTime?: number;
}

/** Options for the pagination component. */
export interface PaginationComponentOptions {
  pageLinks?: number;
}

/** Single option in the per-page selector. */
export interface PerPageOption {
  value: number;
  label: string | number;
}

/** Options for the per-page selector component. */
export interface PerPageComponentOptions {
  options?: Array<number | PerPageOption>;
}

/** Loader overlay positioning. */
export type LoaderPosition = 'overlay' | 'inline';

/** Options for the loading indicator component. */
export interface LoaderComponentOptions {
  position?: LoaderPosition;
}

/** Arguments passed to a custom item renderer. */
export interface RenderItemArgs<T = unknown> {
  item: T;
  index: number;
}

/** Arguments passed to a custom page button renderer. */
export interface RenderPageArgs extends PaginationScope {
  page: number;
  isActive: boolean;
}
