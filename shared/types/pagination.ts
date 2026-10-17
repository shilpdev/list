import type { ListScope } from './common'

/** Props for the pagination component. */
export interface PaginationProps {
  pageLinks?: number
}

/** Scope for pagination slot. */
export interface PaginationScope extends ListScope {
  pagesCount: number
  halfWay: number
  hasNext: boolean
  hasPrev: boolean
  pagesToDisplay: number[]
  prev: () => void
  next: () => void
  first: () => void
  last: () => void
}

/** Arguments passed to a custom page button renderer. */
export interface PaginationItemScope extends PaginationScope {
  page: number
  isActive: boolean
}
