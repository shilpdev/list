import equal from 'fast-deep-equal'
import { DEFAULT_ID_KEY } from './constants'
import type {
  ColumnSettings,
  Columns,
  Filters,
  PerPageOption,
  SortOrder,
  State,
  SummaryScope,
} from './types'

export const toError = (err: unknown): Error => {
  if (err instanceof Error) {
    return err
  }

  return new Error(String(err))
}

export const hasActiveFilters = (current: Filters = {}, initial: Filters = {}): boolean => {
  if (Object.keys(initial).length === 0) {
    return Object.keys(current).length > 0
  }

  if (Object.keys(current).length === 0) {
    return false
  }

  return !equal(current, initial)
}

export const getRowId = (
  row: unknown,
  idKey: string = DEFAULT_ID_KEY,
): string | number | undefined => {
  if (row == null || typeof row !== 'object') {
    return undefined
  }

  const value = (row as Record<string, unknown>)[idKey]

  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  return undefined
}

export const computeHasMore = (page: number, perPage: number, count: number): boolean => {
  return page * perPage < count
}

/** Adds the 1-based `_index` (across pages) to each row. */
export const withRowIndex = <T>(rows: T[], page: number, perPage: number): T[] => {
  return rows.map((row, index) => {
    return { ...row, _index: (page - 1) * perPage + index + 1 }
  })
}

/** Rows after a response: appended in load-more mode (after page 1), replaced otherwise. */
export const mergeRows = <T>(
  previous: T[],
  incoming: T[],
  { page, perPage, isLoadMore }: { page: number; perPage: number; isLoadMore: boolean },
): T[] => {
  const indexed = withRowIndex(incoming, page, perPage)

  if (isLoadMore && page > 1) {
    return [...previous, ...indexed]
  }

  return indexed
}

/** Returns the rows with the matching row patched, or `null` when no row has that id. */
export const patchRowById = <T>(
  rows: T[],
  patch: Partial<T>,
  id: string | number,
  idKey: string,
): T[] | null => {
  let matched = false

  const next = rows.map((row) => {
    if (getRowId(row, idKey) !== id) {
      return row
    }

    matched = true
    return { ...row, ...patch }
  })

  if (!matched) {
    return null
  }

  return next
}

export const rowNotFoundMessage = (idKey: string, id: string | number): string => {
  return (
    `List: updateRowById did not find a row where ${idKey} === ${JSON.stringify(id)}. ` +
    `Verify your rows expose "${idKey}" and that the id type matches exactly.`
  )
}

/** The given columns, or one column per key of the first row. */
export const getColumns = (columns: Columns | undefined, rows: unknown[]): Columns => {
  if (columns) {
    return columns
  }

  const firstRow = (rows[0] as Record<string, unknown>) || {}

  return Object.keys(firstRow).map((name) => {
    return { name }
  })
}

export const setColumnSetting = (
  settings: ColumnSettings,
  columnName: string,
  settingKey: string,
  value: unknown,
): ColumnSettings => {
  return {
    ...settings,
    [columnName]: { ...settings[columnName], [settingKey]: value },
  }
}

/** Values to restore from `stateManager.get()`; a load-more list always starts on page 1. */
export const getRestoredState = (saved: Partial<State> | null | undefined, isLoadMore: boolean) => {
  let page = saved?.page

  if (isLoadMore) {
    page = 1
  }

  return {
    page,
    perPage: saved?.perPage,
    sortBy: saved?.sortBy,
    sortOrder: saved?.sortOrder,
    search: saved?.search,
    filters: saved?.filters,
    columnSettings: saved?.columnSettings,
  }
}

interface Query {
  page: number
  perPage: number
  search: string
  sortBy: string
  sortOrder: SortOrder
  endpoint: string
}

/**
 * What to apply when the query props change after mount, or `null` when nothing changed.
 * Any change other than `page` goes back to page 1.
 */
export const getQueryChange = (
  prev: Query,
  next: Query,
): Partial<Omit<Query, 'endpoint'>> | null => {
  const patch: Partial<Omit<Query, 'endpoint'>> = {}
  let isQueryChanged = next.endpoint !== prev.endpoint

  if (next.perPage !== prev.perPage) {
    patch.perPage = next.perPage
    isQueryChanged = true
  }

  if (next.search !== prev.search) {
    patch.search = next.search
    isQueryChanged = true
  }

  if (next.sortBy !== prev.sortBy) {
    patch.sortBy = next.sortBy
    isQueryChanged = true
  }

  if (next.sortOrder !== prev.sortOrder) {
    patch.sortOrder = next.sortOrder
    isQueryChanged = true
  }

  const isPageChanged = next.page !== prev.page

  if (isPageChanged) {
    patch.page = next.page
  } else if (isQueryChanged) {
    patch.page = 1
  }

  if (isPageChanged || isQueryChanged) {
    return patch
  }

  return null
}

export const getPagesCount = (count: number, perPage: number): number => {
  return Math.ceil(count / perPage)
}

export const getPagination = (page: number, perPage: number, count: number, pageLinks: number) => {
  const pagesCount = getPagesCount(count, perPage)
  const halfWay = Math.floor(pageLinks / 2)
  const pages = Array.from({ length: Math.min(pageLinks, pagesCount) })

  let pagesToDisplay: number[]

  if (page <= halfWay) {
    pagesToDisplay = pages.map((_, index) => {
      return index + 1
    })
  } else if (pagesCount - page < halfWay) {
    pagesToDisplay = pages
      .map((_, index) => {
        return pagesCount - index
      })
      .reverse()
  } else {
    pagesToDisplay = pages.map((_, index) => {
      return page - halfWay + index
    })
  }

  return { pagesCount, halfWay, hasPrev: page !== 1, pagesToDisplay }
}

export const getSummaryRange = (page: number, perPage: number, count: number) => {
  return {
    from: page * perPage - perPage + 1,
    to: Math.min(page * perPage, count),
  }
}

export const getSummaryMessage = ({ context, from, to, visibleCount }: SummaryScope): string => {
  return `Showing ${visibleCount} rows (${from} - ${to}) out of ${context.count}`
}

export const getPerPageMessage = (option: PerPageOption): string => {
  return `${option.label} rows per page`
}

export const normalizePerPageOptions = (
  options: Array<number | PerPageOption>,
): PerPageOption[] => {
  return options.map((option) => {
    if (typeof option === 'object') {
      return option
    }

    return { value: option, label: option }
  })
}

export const hasSelectionChanged = (selection: unknown[], previous: unknown[]): boolean => {
  return !equal(selection, previous)
}
