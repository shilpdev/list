import type { ListScope } from './common'

export interface SummaryScope extends ListScope {
  from: number
  to: number
  visibleCount: number
}
