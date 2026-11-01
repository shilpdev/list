import type { ListScope } from './common'

export interface PaginationProps {
  pageLinks?: number
}

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
