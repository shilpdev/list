import type { ListScope } from './common'

/** Props for the search input component. */
export interface SearchProps {
  debounceTime?: number
}

/** Scope for search slot. */
export interface SearchScope extends ListScope {
  search: string
  setSearch: (value: string) => void
}
