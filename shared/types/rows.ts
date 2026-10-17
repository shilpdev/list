/** Arguments passed to a custom row renderer. */
export interface RowScope<T = any> {
  row: T
  index: number
}
