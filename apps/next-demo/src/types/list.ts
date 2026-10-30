import type { Column, RowId } from '@shilp.dev/react-list'

/** A row from any dummyjson resource. Only `id` is read by the playground itself. */
export type Row = { id: RowId; [key: string]: unknown }

/** How a table cell shows its value. */
export type CellFormat = 'text' | 'image' | 'badge' | 'currency'

/**
 * A list column plus how the table renders it. Pages pass these as plain data (a server page cannot
 * pass functions to a client component), and the list keeps the extra keys on its own columns.
 */
export interface ColumnConfig extends Column {
  label: string
  isSortable?: boolean
  format?: CellFormat
}

export interface FilterOption {
  value: string
  label: string
}

/** A select filter shown in the toolbar. */
export interface FilterConfig {
  column: string
  label: string
  options: FilterOption[]
}
