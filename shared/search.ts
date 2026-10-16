/** Options for the search input component. */
export interface SearchComponentOptions {
  debounceTime?: number
}

/** Scope for search slot. */
export interface SearchScope {
  search: string
  setSearch: (value: string) => void
}
