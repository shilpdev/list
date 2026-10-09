export interface ListColumn {
  name: string;
  label?: string;
  columns?: ListColumn[];
  [key: string]: unknown;
}

/** Per-column settings keyed by column name. */
export interface ColumnSetting {
  visible?: boolean;
  [key: string]: unknown;
}

export type ColumnSettings = Record<string, ColumnSetting>;

/** Updates a single column setting value. */
export type UpdateColumnFn = (
  columnName: string,
  settingKey: string,
  value: boolean | unknown
) => void;

/** Arguments passed to a custom column renderer. */
export interface RenderColumnArgs {
  key: string;
  column: ListColumn;
  updateColumn: UpdateColumnFn;
  columnSettings: ColumnSettings;
}
