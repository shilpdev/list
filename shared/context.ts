import type { Filters, MetaRecord, SortOrder } from './core';

/** Base fields shared by request and state-manager contexts. */
export interface BaseListContext {
  endpoint: string;
  version?: number | string;
  meta?: MetaRecord;
  page: number;
  perPage: number;
  search: string;
  sortBy: string;
  sortOrder: SortOrder;
  filters: Filters;
}

/** Context passed to `requestHandler`. */
export interface RequestContext extends BaseListContext {
  isRefresh?: boolean;
}

/** Context passed to `stateManager` methods. */
export interface StateManagerContext extends BaseListContext {
  columnSettings?: ColumnSettingsContext;
}

/** Column visibility settings persisted by the state manager. */
export type ColumnSettingsContext = Record<
  string,
  {
    visible?: boolean;
    [key: string]: unknown;
  }
>;

/** Partial state restored by `stateManager.get()`. */
export interface SavedListState {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  filters?: Filters;
  columnSettings?: ColumnSettingsContext;
}

/** Additional context that can be passed when changing page or refreshing. */
export type RequestContextPatch = Partial<RequestContext>;
