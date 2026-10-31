import type { PerPageOption, RowId, SummaryScope } from './types'

/**
 * Every message the packages show or throw, so @shilp.dev/react-list and @shilp.dev/vue-list say
 * the same thing. Static text is a `*_MESSAGE` constant; text built from values is a `get*Message`
 * function. Override the UI copy by passing your own slot / render function.
 */
export const LOADING_MESSAGE = 'Loading...'
export const INITIAL_LOADING_MESSAGE = 'Initial Loading...'
export const REFRESH_MESSAGE = 'Refresh'
export const EMPTY_MESSAGE = 'No data found!'
export const LOAD_MORE_MESSAGE = 'Load More'
export const LOAD_MORE_END_MESSAGE = "— That's all —"
export const ERROR_MESSAGE = 'Error occurred'
export const SEARCH_PLACEHOLDER_MESSAGE = 'Search...'
export const FIRST_MESSAGE = 'First'
export const PREV_MESSAGE = 'Prev'
export const NEXT_MESSAGE = 'Next'
export const LAST_MESSAGE = 'Last'
/** Thrown by `useListContext` when no `List` is above it. */
export const CONTEXT_OUTSIDE_LIST_MESSAGE = 'useListContext must be used within a List'

export const getErrorMessage = (error: Error): string => {
  return `${error.name}: ${error.message}`
}

/** One option of the default `ListGoTo` select, e.g. `Page 1`. */
export const getGoToMessage = (page: number): string => {
  return `Page ${page}`
}

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
