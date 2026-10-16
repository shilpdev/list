/** Scope for go-to-page slot. */
export interface GoToScope {
  setPage: (page: number) => void
  page: number
  pages: number[]
  pagesCount: number
}
