import type { ListScope } from './common'

/** A single column definition. */
export interface Column {
  name: string
  label?: string
  [key: string]: unknown
}

/** Column definitions for a list. */
export type Columns = Column[]

/** Per-column settings keyed by column name. */
export type ColumnSettings = Record<
  string,
  {
    visible?: boolean
    [key: string]: unknown
  }
>

/** Updates a single column setting value. */
export type UpdateColumnFn = (
  columnName: string,
  settingKey: string,
  value: boolean | unknown
) => void

/** Arguments passed to a custom column renderer. */
export interface RenderColumnArgs extends ListScope {
  column: Column
}
