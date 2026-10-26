import equal from 'fast-deep-equal'
import { DEFAULT_COLUMN_VISIBILITY } from './constants'
import type {
  Column,
  Columns,
  ColumnScope,
  Context,
  Filter,
  FilterScope,
  FilterState,
  FilterValues,
  PerPageOption,
  RowId,
  RowScope,
  SortOrder,
  State,
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

/** Whether `stateManager.get` returned any value to restore. */
export const hasSavedState = (saved: Partial<State>): boolean => {
  return Object.values(saved).some((value) => {
    return value != null
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
  id: RowId,
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

/** The value of the row's `idKey` field. */
export const getRowId = (row: unknown, idKey: string): RowId => {
  return (row as Record<string, RowId>)[idKey]
}

/** Returns `ids` with `id` removed when it is there, or added at the end when it is not. */
export const toggleId = (ids: RowId[], id: RowId): RowId[] => {
  if (ids.includes(id)) {
    return ids.filter((item) => {
      return item !== id
    })
  }

  return [...ids, id]
}

export const hasSelectionChanged = (selection: RowId[], previous: RowId[]): boolean => {
  return !equal(selection, previous)
}

export const computeDefaultFilters = (filters: Filter[]): FilterState[] => {
  return filters.map(({ column, value }): FilterState => {
    return { column, value, isDirty: false }
  })
}

export function getColumnScope(column: Column, context: Context): ColumnScope {
  return {
    context,
    ...column,
    setValue: (key: string, value: unknown) => {
      context.setColumn(column.name, key, value)
    },
  }
}

export function getFilterScope(filter: FilterState, context: Context): FilterScope {
  return {
    context,
    ...filter,
    setValue: (value: unknown) => {
      context.setFilter(filter.column, value)
    },
  }
}

export function getRowScope(row: unknown, index: number, context: Context): RowScope {
  const id = getRowId(row, context.idKey)

  return {
    context,
    row,
    index,
    isSelected: context.selection.includes(id),
    toggleSelection: () => {
      context.toggleRowSelection(id)
    },
  }
}

export function getKey(row: unknown): number {
  return (row as { _index: number })._index
}
