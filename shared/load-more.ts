/** Scope for load-more slot. */
export interface LoadMoreScope {
  isLoading: boolean
  loadMore: () => void
  hasMoreRows: boolean
}
