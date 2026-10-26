import type { Filter, Meta, PaginationMode, SortOrder, SummaryScope, PerPageOption, RowId } from './types'

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

/**
 * Default UI copy for the components, shared by @shilp.dev/react-list and @shilp.dev/vue-list so the
 * two render the same text. Override any of them by passing your own slot / render function.
 */
export const MESSAGES = {
  loading: 'Loading...',
  initialLoading: 'Initial Loading...',
  refresh: 'Refresh',
  empty: 'No data found!',
  loadMore: 'Load More',
  loadMoreEnd: "— That's all —",
  error: 'Error occurred',
  /** Prefix for each option in the default `ListGoTo` select, e.g. `Page 1`. */
  pageOptionPrefix: 'Page',
} as const

export const getSummaryMessage = ({ context, from, to, visibleCount }: SummaryScope): string => {
  return `Showing ${visibleCount} rows (${from} - ${to}) out of ${context.count}`
}

export const getPerPageMessage = (option: PerPageOption): string => {
  return `${option.label} rows per page`
}

export const rowNotFoundMessage = (idKey: string, id: RowId): string => {
  return (
    `List: updateRowById did not find a row where ${idKey} === ${JSON.stringify(id)}. ` +
    `Verify your rows expose "${idKey}" and that the id type matches exactly.`
  )
}
