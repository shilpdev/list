import type { ListScope } from './common'

export interface SearchProps {
  debounceTime?: number
}

export interface SearchScope extends ListScope {
  search: string
  setSearch: (value: string) => void
}
