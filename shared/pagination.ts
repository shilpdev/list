/** Options for the pagination component. */
export interface PaginationComponentOptions {
  pageLinks?: number
}

/** Scope for pagination slot. */
export interface PaginationScope {
  page: number
  perPage: number
  count: number
  pagesCount: number
  halfWay: number
  hasNext: boolean
  hasPrev: boolean
  pagesToDisplay: number[]
  prev: () => void
  next: () => void
  first: () => void
  last: () => void
  setPage: (page: number) => void
}

/** Arguments passed to a custom page button renderer. */
export interface RenderPageArgs extends PaginationScope {
  page: number
  isActive: boolean
}
