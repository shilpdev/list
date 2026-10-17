import type { ListScope } from './common'

/** Single option in the per-page selector. */
export interface PerPageOption {
  value: number
  label: string | number
}

/** Props for the per-page selector component. */
export interface PerPageProps {
  options?: Array<number | PerPageOption>
}

/** Scope for per-page slot. */
export interface PerPageScope extends ListScope {
  options: PerPageOption[]
}
