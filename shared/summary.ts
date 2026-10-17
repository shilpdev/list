import type { ListScope } from './common'

/** Scope for summary slot. */
export interface SummaryScope extends ListScope {
  from: number
  to: number
  visibleCount: number
}
