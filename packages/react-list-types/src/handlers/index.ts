import type { Filters } from '../core';
import type { RequestContextPatch } from '../context';

/** Actions exposed on list state for pagination, search, filters, and selection. */
export interface ListHandlers<T = unknown> {
  setPage: (page: number | string, context?: RequestContextPatch) => void;
  setPerPage: (perPage: number) => void;
  setSearch: (search: string) => void;
  setSort: (sort: { by: string; order: 'asc' | 'desc' }) => void;
  setFilters: (filters: Filters) => void;
  clearFilters: () => void;
  loadMore: () => void;
  refresh: (context?: RequestContextPatch) => void;
  setSelection: (selection: T[]) => void;
  updateItemById: (item: Partial<T>, id: string | number) => void;
  updateAttr?: (
    attrName: string,
    settingKey: string,
    value: boolean | unknown
  ) => void;
}
