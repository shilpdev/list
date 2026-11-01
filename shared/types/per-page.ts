import type { ListScope } from './common'

export interface PerPageOption {
  value: number
  label: string | number
}

export interface PerPageProps {
  options?: Array<number | PerPageOption>
}

export interface PerPageScope extends ListScope {
  options: PerPageOption[]
}
