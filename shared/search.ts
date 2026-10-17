import type { ListScope } from './common'

/** Options for the search input component. */
export interface SearchComponentOptions {
  debounceTime?: number
}

/** Scope for search slot. */
export interface SearchScope extends ListScope {
  search: string
  setSearch: (value: string) => void
}
