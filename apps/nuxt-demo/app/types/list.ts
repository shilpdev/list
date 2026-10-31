import type { Column } from '@shilp.dev/vue-list'

/** A row from any dummyjson resource. Only `id` is read by the playground itself. */
export type Row = Record<string, unknown>

/** A list column plus whether its header sorts. The list keeps the extra key on its own columns. */
export interface ColumnConfig extends Column {
  label: string
  isSortable?: boolean
}

export interface FilterOption {
  value: string
  label: string
}

/** A select filter shown in the table header. */
export interface FilterConfig {
  column: string
  label: string
  options: FilterOption[]
}
