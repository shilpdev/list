import type { ListScope } from './common'

/** What you pass in for a filter: its column and value. */
export interface Filter {
  column: string
  value: unknown
}

/** New values for some filters, keyed by column. */
export type FilterValues = Record<string, unknown>

/** A filter tied to one column. */
export interface FilterState extends Filter {
  /** `true` when the value differs from the one the list started with. */
  isDirty: boolean
}

/** Scope for the `filters` slot. */
export interface FiltersScope extends ListScope {
  setFilter: (column: string, value: unknown) => void
  setFilters: (values: FilterValues) => void
}

/** Scope for a filter slot, which is named after its column. */
export interface FilterScope extends ListScope, FilterState {
  setValue: (value: unknown) => void
}
