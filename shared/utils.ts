import equal from 'fast-deep-equal'
import { DEFAULT_COLUMN_VISIBILITY } from './constants'
import type {
  Columns,
  FilterState,
  FilterValues,
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

/**
 * Returns `filters` with `values` applied; a column that is not in `filters` is added. `isDirty`
 * compares each new value with the one in `defaults`.
 */
export const computeFilters = (
  filters: FilterState[],
  defaults: FilterState[],
  values: FilterValues,
): FilterState[] => {
  const next = [...filters]

  Object.entries(values).forEach(([column, value]) => {
    const index = next.findIndex((filter) => {
      return filter.column === column
    })
    const initial = defaults.find((filter) => {
      return filter.column === column
    })
    const filter = { column, value, isDirty: !equal(value, initial?.value) }

    if (index === -1) {
      next.push(filter)
    } else {
      next[index] = filter
    }
  })

  return next
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
    const rowId = (row as Record<string, unknown> | null)?.[idKey]

    if (rowId !== id) {
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

/** Columns with `visibility` filled in where it is missing. */
export const createColumns = (columns: Columns): Columns => {
  return columns.map((column) => {
    return { ...column, visibility: column.visibility ?? DEFAULT_COLUMN_VISIBILITY }
  })
}

/** Returns `columns` with `key` of the column named `column` set to `value`; an unknown name changes nothing. */
export const computeColumns = (
  columns: Columns,
  column: string,
  key: string,
  value: unknown,
): Columns => {
  return createColumns(
    columns.map((item) => {
      if (item.name === column) {
        return { ...item, [key]: value }
      }

      return item
    }),
  )
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
