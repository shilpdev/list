import type { Filter, Meta, PaginationMode, SortOrder } from './types'

export const DEFAULT_ID_KEY = 'id'
export const DEFAULT_PAGE = 1
export const DEFAULT_PER_PAGE = 25
export const DEFAULT_SORT_BY = ''
export const DEFAULT_SORT_ORDER: SortOrder = 'desc'
export const DEFAULT_SEARCH = ''
export const DEFAULT_VERSION = 1
export const DEFAULT_PAGINATION_MODE: PaginationMode = 'pagination'

/** Frozen so a handler that mutates the object it receives cannot change the default for other lists. */
export const DEFAULT_FILTERS: readonly Filter[] = Object.freeze([])
export const DEFAULT_COLUMN_VISIBILITY = true
export const DEFAULT_META: Readonly<Meta> = Object.freeze({})

export const DEFAULT_PAGE_LINKS = 5
export const DEFAULT_DEBOUNCE_TIME = 500
export const DEFAULT_PER_PAGE_OPTIONS = [10, 25, 50, 100]
