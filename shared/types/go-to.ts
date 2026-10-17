import type { ListScope } from './common'

/** Scope for go-to-page slot. */
export interface GoToScope extends ListScope {
  pages: number[]
  pagesCount: number
}
