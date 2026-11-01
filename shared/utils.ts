import equal from 'fast-deep-equal'
import { DEFAULT_COLUMN_VISIBILITY } from './constants'
import type {
  Column,
  ColumnScope,
  Context,
  Filter,
  FilterScope,
  FilterState,
  FilterValues,
  InitialState,
  PaginationItemScope,
  PaginationScope,
  PerPageOption,
  RowId,
  RowScope,
  SelectionState,
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

export const computeHasMore = (page: number, perPage: number, totalRows: number): boolean => {
  return page * perPage < totalRows
}

/*
 * Adds a 1-based `_index` that keeps counting across pages.
 * Example: page 2 with perPage 10 numbers its rows 11 to 20.
 */
export const withRowIndex = <T>(rows: T[], page: number, perPage: number): T[] => {
  return rows.map((row, index) => {
    return { ...row, _index: (page - 1) * perPage + index + 1 }
  })
}

/** Whether `stateManager.get` returned any value to restore. */
export const hasSavedState = (saved: Partial<InitialState>): boolean => {
  return Object.values(saved).some((value) => {
    return value != null
  })
}

/*
 * Rows after a response: load-more appends pages after the first, so page 2 adds to page 1's
 * rows; page mode replaces them.
 */
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

/*
 * A column given without `visibility` is visible.
 * Example: { name: 'id' } -> { name: 'id', visibility: true }
 */
export const createColumns = (columns: Column[]): Column[] => {
  return columns.map((column) => {
    return { ...column, visibility: column.visibility ?? DEFAULT_COLUMN_VISIBILITY }
  })
}

/* An unknown `column` name changes nothing. */
export const computeColumns = (
  columns: Column[],
  column: string,
  key: string,
  value: unknown,
): Column[] => {
  return createColumns(
    columns.map((item) => {
      if (item.name === column) {
        return { ...item, [key]: value }
      }

      return item
    }),
  )
}

export const getPagesCount = (totalRows: number, perPage: number): number => {
  return Math.ceil(totalRows / perPage)
}

export const getPagination = (
  page: number,
  perPage: number,
  totalRows: number,
  pageLinks: number,
) => {
  const pagesCount = getPagesCount(totalRows, perPage)
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

export const getSummaryRange = (page: number, perPage: number, totalRows: number) => {
  return {
    from: page * perPage - perPage + 1,
    to: Math.min(page * perPage, totalRows),
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

export const getRowId = (row: unknown, idKey: string): RowId => {
  return (row as Record<string, RowId>)[idKey]
}

/*
 * Example: toggleId([1, 2], 2) -> [1]; toggleId([1], 2) -> [1, 2]
 */
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

export const getRowIds = (rows: unknown[], idKey: string): RowId[] => {
  return rows.map((row) => {
    return getRowId(row, idKey)
  })
}

/**
 * Selection state across the loaded rows: `none` with no rows or an empty selection, `all` when
 * every loaded row is selected, `partial` otherwise.
 */
export const computeSelectionState = (
  rows: unknown[],
  selection: RowId[],
  idKey: string,
): SelectionState => {
  if (rows.length === 0 || selection.length === 0) {
    return 'none'
  }

  const selected = new Set(selection)
  const allSelected = rows.every((row) => {
    return selected.has(getRowId(row, idKey))
  })

  return allSelected ? 'all' : 'partial'
}

/**
 * The selection after a "select all" toggle: clears it when every loaded row is already selected,
 * otherwise selects every loaded row.
 */
export const toggleAllIds = (rows: unknown[], selection: RowId[], idKey: string): RowId[] => {
  if (computeSelectionState(rows, selection, idKey) === 'all') {
    return []
  }

  return getRowIds(rows, idKey)
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

export function getPaginationItemScope(scope: PaginationScope, item: number): PaginationItemScope {
  return {
    ...scope,
    page: item,
    isActive: item === scope.context.page,
  }
}

/**
 * `initial` with the saved values on top: page (a load-more list always keeps its own page),
 * perPage, sortBy, sortOrder, search, and the complete `filters` and `columns` lists.
 */
export const applySavedState = (
  initial: InitialState,
  saved: Partial<InitialState>,
  isLoadMore: boolean,
): InitialState => {
  return {
    ...initial,
    page: isLoadMore ? initial.page : (saved.page ?? initial.page),
    perPage: saved.perPage ?? initial.perPage,
    sortBy: saved.sortBy ?? initial.sortBy,
    sortOrder: saved.sortOrder ?? initial.sortOrder,
    search: saved.search ?? initial.search,
    filters: saved.filters ?? initial.filters,
    columns: saved.columns ?? initial.columns,
  }
}
